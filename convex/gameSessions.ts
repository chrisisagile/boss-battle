import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import {
  isValidJoinCode,
  joinCodeValidator,
  normalizeJoinCode,
} from "./lib/joinValidation";

function createJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

async function findSessionByJoinCode(
  ctx: QueryCtx | MutationCtx,
  joinCode: string,
) {
  const normalizedJoinCode = normalizeJoinCode(joinCode);
  return await ctx.db
    .query("gameSessions")
    .withIndex("by_join_code", (q) => q.eq("joinCode", normalizedJoinCode))
    .unique();
}

async function resolveAvailableJoinCode(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = createJoinCode();
    const existing = await ctx.db
      .query("gameSessions")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .unique();

    if (!existing) {
      return joinCode;
    }
  }

  createJoinError(
    JOIN_ERROR_CODES.activeSessionExists,
    "Unable to create a unique join code for a new session.",
  );
}

export const getCurrentActive = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("gameSessions").collect();
    const activeSessions = sessions
      .filter((session) => session.status !== "completed")
      .sort((left, right) => right.createdAt - left.createdAt);

    const activeSession = activeSessions[0];
    if (!activeSession) {
      return null;
    }

    return {
      sessionId: activeSession._id,
      joinCode: activeSession.joinCode,
      status: activeSession.status,
      joinStatus: activeSession.joinStatus,
      currentRoundNumber: activeSession.currentRoundNumber,
    };
  },
});

export const getHostOverview = query({
  args: {
    joinCode: joinCodeValidator,
  },
  handler: async (ctx, args) => {
    if (!isValidJoinCode(args.joinCode)) {
      return null;
    }

    const session = await findSessionByJoinCode(ctx, args.joinCode);
    if (!session || session.status === "completed") {
      return null;
    }

    const roster = (
      await ctx.db
        .query("playerEntries")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect()
    )
      .filter((entry) => entry.joinStatus === "joined")
      .sort((left, right) => left.joinedAt - right.joinedAt);

    return {
      session,
      joinCredential: {
        joinCode: session.joinCode,
        joinUrl: `/join/${session.joinCode}`,
        qrValue: `/join/${session.joinCode}`,
        isJoinable: session.joinStatus === "open",
      },
      joinedPlayerCount: roster.length,
      lateJoinerCount: roster.filter(
        (entry) => entry.eligibleFromRoundNumber > session.currentRoundNumber,
      ).length,
      roster,
    };
  },
});

export const resolveJoinableSession = query({
  args: {
    joinCode: joinCodeValidator,
  },
  handler: async (ctx, args) => {
    if (!isValidJoinCode(args.joinCode)) {
      return { available: false, reason: "not_found" as const };
    }

    const session = await findSessionByJoinCode(ctx, args.joinCode);
    if (!session) {
      return { available: false, reason: "not_found" as const };
    }

    if (session.status === "completed") {
      return { available: false, reason: "completed" as const };
    }

    if (session.joinStatus === "closed") {
      return { available: false, reason: "closed" as const };
    }

    return {
      available: true as const,
      sessionId: session._id,
      joinCode: session.joinCode,
      status: session.status,
      joinStatus: session.joinStatus,
      currentRoundNumber: session.currentRoundNumber,
      participationWindowStatus: session.participationWindowStatus,
    };
  },
});

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const joinCode = await resolveAvailableJoinCode(ctx);
    const sessionId = await ctx.db.insert("gameSessions", {
      joinCode,
      status: "lobby",
      joinStatus: "open",
      currentRoundNumber: 0,
      participationWindowStatus: "idle",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      completedAt: null,
    });

    return {
      sessionId,
      joinCode,
      hostPath: `/host/${joinCode}`,
      joinPath: `/join/${joinCode}`,
    };
  },
});

export const setJoinStatus = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    joinStatus: v.union(v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "The requested session could not be found.",
      );
    }

    if (session.status === "completed") {
      createJoinError(
        JOIN_ERROR_CODES.sessionCompleted,
        "Completed sessions cannot change join status.",
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      joinStatus: args.joinStatus,
      closedAt: args.joinStatus === "closed" ? now : null,
      updatedAt: now,
    });

    return {
      sessionId: args.sessionId,
      joinStatus: args.joinStatus,
      closedAt: args.joinStatus === "closed" ? now : null,
    };
  },
});

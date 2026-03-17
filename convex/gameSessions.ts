import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { buildBattleActivityFeed } from "./lib/battleFeed";
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

function getBattleJoinStatus(session: Doc<"gameSessions">) {
  return session.battleJoinStatus ?? "pre_battle";
}

function getGamePhase(session: Doc<"gameSessions">) {
  return session.gamePhase ?? "lobby";
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
      activeRoundId: activeSession.activeRoundId,
      activeEncounterId: activeSession.activeEncounterId ?? null,
      battleJoinStatus: getBattleJoinStatus(activeSession),
      gamePhase: getGamePhase(activeSession),
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

    const activeRound = session.activeRoundId
      ? await ctx.db.get(session.activeRoundId)
      : null;
    const roundParticipants = activeRound
      ? await ctx.db
          .query("roundParticipants")
          .withIndex("by_round", (q) => q.eq("roundId", activeRound._id))
          .collect()
      : [];
    const activeEncounter = session.activeEncounterId
      ? await ctx.db.get(session.activeEncounterId)
      : null;
    const combatants = activeEncounter
      ? await ctx.db
          .query("combatantStates")
          .withIndex("by_encounter", (q) =>
            q.eq("encounterId", activeEncounter._id),
          )
          .collect()
      : [];
    const rounds = await ctx.db
      .query("gameRounds")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    const battleExchanges = activeRound
      ? await ctx.db
          .query("battleExchanges")
          .withIndex("by_round", (q) => q.eq("roundId", activeRound._id))
          .collect()
      : [];
    const latestExchange =
      battleExchanges.sort(
        (left, right) => right.exchangeNumber - left.exchangeNumber,
      )[0] ?? null;
    const latestCompletedRound =
      rounds
        .filter((round) => round.status === "completed")
        .sort((left, right) => right.roundNumber - left.roundNumber)[0] ?? null;
    const leaderboardAnswers = latestCompletedRound
      ? await ctx.db
          .query("quizAnswers")
          .withIndex("by_round", (q) =>
            q.eq("roundId", latestCompletedRound._id),
          )
          .collect()
      : [];
    const leaderboardByPlayer = new Map();
    for (const answer of leaderboardAnswers) {
      leaderboardByPlayer.set(
        answer.playerEntryId,
        (leaderboardByPlayer.get(answer.playerEntryId) ?? 0) +
          answer.awardedTokens,
      );
    }

    const participationByPlayer = new Map(
      roundParticipants.map((participant) => [
        participant.playerEntryId,
        participant,
      ]),
    );
    const playerCombatants = combatants
      .filter((combatant) => combatant.combatantType === "player")
      .sort((left, right) => left.lineupSlot - right.lineupSlot);
    const selectedBossDefinitions = session.selectedBossDefinitionIds?.length
      ? (
          await Promise.all(
            session.selectedBossDefinitionIds.map((bossId) =>
              ctx.db.get(bossId),
            ),
          )
        ).filter(Boolean)
      : [];

    return {
      session,
      joinCredential: {
        joinCode: session.joinCode,
        joinUrl: `/join/${session.joinCode}`,
        qrValue: `/join/${session.joinCode}`,
        isJoinable: session.joinStatus === "open",
      },
      lobbyConfig: {
        selectedBossDefinitionIds: session.selectedBossDefinitionIds ?? [],
        selectedBossNames: selectedBossDefinitions.map((boss) => boss?.name),
        questionTarget:
          session.questionTargetPerRound ?? activeRound?.questionTarget ?? null,
        allowedCategories:
          session.allowedCategories ?? activeRound?.allowedCategories ?? [],
        allowedComplexities:
          session.allowedComplexities ?? activeRound?.allowedComplexities ?? [],
        configLockedAt: session.configLockedAt ?? null,
      },
      joinedPlayerCount: roster.length,
      lateJoinerCount: roster.filter(
        (entry) => entry.eligibleFromRoundNumber > session.currentRoundNumber,
      ).length,
      activeRound: activeRound
        ? {
            id: activeRound._id,
            roundNumber: activeRound.roundNumber,
            status: activeRound.status,
            questionTarget: activeRound.questionTarget,
            questionsCompleted: activeRound.questionsCompleted,
            remainingQuestions:
              activeRound.questionTarget - activeRound.questionsCompleted,
            allowedCategories: activeRound.allowedCategories,
            allowedComplexities: activeRound.allowedComplexities,
            exchangeLimit: activeRound.exchangeLimit ?? null,
            exchangesResolved: activeRound.exchangesResolved ?? 0,
            phase: activeRound.phase ?? "quiz",
          }
        : null,
      leaderboard: latestCompletedRound
        ? roster.map((entry) => ({
            id: entry._id,
            name: entry.displayName,
            score: leaderboardByPlayer.get(entry._id) ?? 0,
          }))
        : [],
      roster: roster.map((entry) => ({
        ...entry,
        tokenBalance: entry.tokenBalance,
        earnedPoints: leaderboardByPlayer.get(entry._id) ?? 0,
        roundStatus:
          participationByPlayer.get(entry._id)?.status ??
          (entry.eligibleFromRoundNumber > session.currentRoundNumber
            ? "waiting_next_round"
            : "idle"),
      })),
      encounter: activeEncounter
        ? {
            id: activeEncounter._id,
            battleRoundNumber: activeEncounter.battleRoundNumber,
            encounterNumber: activeEncounter.encounterNumber,
            partyCurrentHealth: activeEncounter.partyCurrentHealth,
            partyMaxHealth: activeEncounter.partyMaxHealth,
            status: activeEncounter.status,
            activeBossCount: activeEncounter.activeBossCount,
          }
        : null,
      partySummary: activeEncounter
        ? {
            activePlayers: combatants.filter(
              (combatant) =>
                combatant.combatantType === "player" &&
                combatant.state === "active",
            ).length,
            currentHealth: activeEncounter.partyCurrentHealth,
            knockedOutPlayers: combatants.filter(
              (combatant) =>
                combatant.combatantType === "player" &&
                combatant.state === "knocked_out",
            ).length,
            maxHealth: activeEncounter.partyMaxHealth,
          }
        : null,
      bossLineup: combatants
        .filter((combatant) => combatant.combatantType === "boss")
        .sort((left, right) => left.lineupSlot - right.lineupSlot)
        .map((combatant) => ({
          currentActionPoints: combatant.currentActionPoints,
          currentHealth: combatant.currentHealth,
          displayName: combatant.displayName,
          fallbackSpriteKey: combatant.fallbackSpriteKey,
          id: combatant._id,
          maxHealth: combatant.maxHealth,
          spriteRef: combatant.spriteRef,
          state: combatant.state,
        })),
      partyCombatants: playerCombatants.map((combatant) => ({
        currentActionPoints: combatant.currentActionPoints,
        currentHealth: combatant.currentHealth,
        displayName: combatant.displayName,
        fallbackSpriteKey: combatant.fallbackSpriteKey,
        id: combatant._id,
        maxActionPoints: combatant.actionPointsPerRound,
        maxHealth: combatant.maxHealth,
        roundStatus: combatant.playerEntryId
          ? (participationByPlayer.get(combatant.playerEntryId)?.status ??
            combatant.state)
          : combatant.state,
        state: combatant.state,
      })),
      battleActivity: buildBattleActivityFeed(latestExchange),
      battleJoinStatus: getBattleJoinStatus(session),
      gamePhase: getGamePhase(session),
      results: session.completedAt
        ? {
            completionReason: session.completionReason ?? "host_ended",
            completedAt: session.completedAt,
            remainingBosses: combatants.filter(
              (combatant) =>
                combatant.combatantType === "boss" &&
                combatant.state !== "defeated",
            ).length,
            remainingPlayers: combatants.filter(
              (combatant) =>
                combatant.combatantType === "player" &&
                combatant.state === "active",
            ).length,
            roundsCompleted:
              latestCompletedRound?.roundNumber ?? session.currentRoundNumber,
          }
        : null,
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

    return {
      available: true as const,
      sessionId: session._id,
      joinCode: session.joinCode,
      status: session.status,
      joinStatus: session.joinStatus,
      currentRoundNumber: session.currentRoundNumber,
      participationWindowStatus: session.participationWindowStatus,
      activeRoundId: session.activeRoundId,
      activeEncounterId: session.activeEncounterId ?? null,
      battleJoinStatus: getBattleJoinStatus(session),
      gamePhase: getGamePhase(session),
      joinBlockedReason: session.joinStatus === "closed" ? "closed" : null,
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
      activeRoundId: null,
      activeEncounterId: null,
      battleJoinStatus: "pre_battle",
      gamePhase: "lobby",
      selectedBossDefinitionIds: [],
      questionTargetPerRound: undefined,
      allowedCategories: [],
      allowedComplexities: [],
      configLockedAt: null,
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

    if (session.status !== "lobby" || getGamePhase(session) !== "lobby") {
      createJoinError(
        JOIN_ERROR_CODES.sessionClosed,
        "Join status can only change while the room is still in the lobby.",
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

export const endGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "The requested session could not be found.",
      );
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      status: "completed",
      joinStatus: "closed",
      battleJoinStatus: "post_battle",
      gamePhase: "results",
      completionReason: "host_ended",
      completedAt: now,
      closedAt: now,
      updatedAt: now,
    });

    if (session.activeEncounterId) {
      await ctx.db.patch(session.activeEncounterId, {
        status: "completed",
        endedAt: now,
        lastResolvedAt: now,
      });
    }

    return {
      sessionId: session._id,
      completionReason: "host_ended" as const,
      completedAt: now,
    };
  },
});

import { mutation } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import {
  deviceIdValidator,
  displayNameValidator,
  isValidDeviceId,
  isValidDisplayName,
  isValidJoinCode,
  joinCodeValidator,
  normalizeDisplayName,
  normalizeDisplayNameKey,
  normalizeJoinCode,
} from "./lib/joinValidation";

export const join = mutation({
  args: {
    joinCode: joinCodeValidator,
    displayName: displayNameValidator,
    deviceId: deviceIdValidator,
  },
  handler: async (ctx, args) => {
    const joinCode = normalizeJoinCode(args.joinCode);
    const displayName = normalizeDisplayName(args.displayName);
    const normalizedDisplayName = normalizeDisplayNameKey(displayName);
    const deviceId = args.deviceId.trim();

    if (!isValidJoinCode(joinCode)) {
      createJoinError(
        JOIN_ERROR_CODES.invalidJoinCode,
        "Enter a valid six-character join code.",
      );
    }

    if (!isValidDisplayName(displayName)) {
      createJoinError(
        JOIN_ERROR_CODES.invalidDisplayName,
        "Enter a display name between 2 and 24 characters.",
      );
    }

    if (!isValidDeviceId(deviceId)) {
      createJoinError(
        JOIN_ERROR_CODES.invalidDeviceId,
        "This device could not be identified for the join request.",
      );
    }

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .unique();

    if (!session) {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "That join code does not match an active session.",
      );
    }

    if (session.status === "completed") {
      createJoinError(
        JOIN_ERROR_CODES.sessionCompleted,
        "That session has already ended.",
      );
    }

    if (session.joinStatus === "closed") {
      createJoinError(
        JOIN_ERROR_CODES.sessionClosed,
        "That session is no longer accepting new players.",
      );
    }

    const duplicateName = await ctx.db
      .query("playerEntries")
      .withIndex("by_session_and_display_name", (q) =>
        q
          .eq("sessionId", session._id)
          .eq("normalizedDisplayName", normalizedDisplayName),
      )
      .unique();

    if (duplicateName && duplicateName.joinStatus === "joined") {
      createJoinError(
        JOIN_ERROR_CODES.duplicateDisplayName,
        "That display name is already taken in this session.",
      );
    }

    const existingDeviceEntry = await ctx.db
      .query("playerEntries")
      .withIndex("by_session_and_device", (q) =>
        q.eq("sessionId", session._id).eq("deviceId", deviceId),
      )
      .unique();

    if (existingDeviceEntry && existingDeviceEntry.joinStatus === "joined") {
      return {
        playerEntryId: existingDeviceEntry._id,
        sessionId: session._id,
        joinCode: session.joinCode,
        displayName: existingDeviceEntry.displayName,
        eligibleFromRoundNumber: existingDeviceEntry.eligibleFromRoundNumber,
        currentRoundNumber: session.currentRoundNumber,
        alreadyJoined: true,
      };
    }

    const now = Date.now();
    const eligibleFromRoundNumber =
      session.participationWindowStatus === "open"
        ? session.currentRoundNumber + 1
        : session.currentRoundNumber;

    const playerEntryId = await ctx.db.insert("playerEntries", {
      sessionId: session._id,
      deviceId,
      displayName,
      normalizedDisplayName,
      joinStatus: "joined",
      eligibleFromRoundNumber,
      joinedAt: now,
      lastSeenAt: null,
    });

    return {
      playerEntryId,
      sessionId: session._id,
      joinCode: session.joinCode,
      displayName,
      eligibleFromRoundNumber,
      currentRoundNumber: session.currentRoundNumber,
      alreadyJoined: false,
    };
  },
});

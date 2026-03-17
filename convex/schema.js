import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  gameSessions: defineTable({
    joinCode: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
    joinStatus: v.union(v.literal("open"), v.literal("closed")),
    currentRoundNumber: v.number(),
    participationWindowStatus: v.union(
      v.literal("idle"),
      v.literal("open"),
      v.literal("locked"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.union(v.number(), v.null()),
    completedAt: v.union(v.number(), v.null()),
  })
    .index("by_join_code", ["joinCode"])
    .index("by_status", ["status"]),
  playerEntries: defineTable({
    sessionId: v.id("gameSessions"),
    deviceId: v.string(),
    displayName: v.string(),
    normalizedDisplayName: v.string(),
    joinStatus: v.union(v.literal("joined"), v.literal("removed")),
    eligibleFromRoundNumber: v.number(),
    joinedAt: v.number(),
    lastSeenAt: v.union(v.number(), v.null()),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_display_name", [
      "sessionId",
      "normalizedDisplayName",
    ])
    .index("by_session_and_device", ["sessionId", "deviceId"]),
});

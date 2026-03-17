import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// biome-ignore lint/style/noDefaultExport: Convex schema entrypoints must default-export defineSchema(...)
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
    activeRoundId: v.union(v.id("gameRounds"), v.null()),
    activeEncounterId: v.optional(v.union(v.id("battleEncounters"), v.null())),
    battleJoinStatus: v.optional(
      v.union(
        v.literal("pre_battle"),
        v.literal("active_battle"),
        v.literal("post_battle"),
      ),
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
    tokenBalance: v.number(),
    nextQuizAdvantage: v.optional(
      v.union(v.literal("none"), v.literal("easier_question")),
    ),
    joinedAt: v.number(),
    lastSeenAt: v.union(v.number(), v.null()),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_display_name", [
      "sessionId",
      "normalizedDisplayName",
    ])
    .index("by_session_and_device", ["sessionId", "deviceId"]),
  quizQuestions: defineTable({
    sourceKey: v.string(),
    prompt: v.string(),
    choices: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      }),
    ),
    correctChoiceId: v.string(),
    category: v.string(),
    complexity: v.string(),
    tokenReward: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("ready"),
      v.literal("retired"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source_key", ["sourceKey"])
    .index("by_status", ["status"]),
  gameRounds: defineTable({
    sessionId: v.id("gameSessions"),
    roundNumber: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
    ),
    questionTarget: v.number(),
    questionsCompleted: v.number(),
    allowedCategories: v.array(v.string()),
    allowedComplexities: v.array(v.string()),
    createdByHostAt: v.number(),
    startedAt: v.union(v.number(), v.null()),
    completedAt: v.union(v.number(), v.null()),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_round_number", ["sessionId", "roundNumber"]),
  quizAssignments: defineTable({
    sessionId: v.id("gameSessions"),
    roundId: v.id("gameRounds"),
    playerEntryId: v.id("playerEntries"),
    quizQuestionId: v.id("quizQuestions"),
    batchNumber: v.number(),
    status: v.union(
      v.literal("presented"),
      v.literal("answered"),
      v.literal("expired"),
      v.literal("scored"),
    ),
    assignedAt: v.number(),
    expiresAt: v.number(),
    scoredAt: v.union(v.number(), v.null()),
    awardedTokens: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_batch", ["roundId", "batchNumber"])
    .index("by_player", ["playerEntryId"])
    .index("by_session_player_question", [
      "sessionId",
      "playerEntryId",
      "quizQuestionId",
    ]),
  quizAnswers: defineTable({
    assignmentId: v.id("quizAssignments"),
    sessionId: v.id("gameSessions"),
    roundId: v.id("gameRounds"),
    playerEntryId: v.id("playerEntries"),
    submittedChoiceId: v.string(),
    submittedAt: v.number(),
    evaluationResult: v.union(
      v.literal("correct"),
      v.literal("incorrect"),
      v.literal("expired"),
      v.literal("invalid"),
    ),
    awardedTokens: v.number(),
    evaluatedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_round", ["roundId"])
    .index("by_player", ["playerEntryId"]),
  skillDefinitions: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("attack"),
      v.literal("heal"),
      v.literal("defend"),
      v.literal("study"),
    ),
    description: v.string(),
    actionPointCost: v.number(),
    targetScope: v.string(),
    effectRule: v.string(),
    carryForwardRule: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("draft"),
      v.literal("ready"),
      v.literal("retired"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),
  bossDefinitions: defineTable({
    name: v.string(),
    description: v.string(),
    baseHealth: v.number(),
    baseActionPointsPerRound: v.number(),
    scalingProfile: v.object({
      healthPerPlayer: v.number(),
      actionPointsPerPlayerThreshold: v.number(),
      bonusActionPoints: v.number(),
    }),
    skillIds: v.array(v.id("skillDefinitions")),
    defaultSpriteRef: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("draft"),
      v.literal("ready"),
      v.literal("retired"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_name", ["name"]),
  battleEncounters: defineTable({
    sessionId: v.id("gameSessions"),
    status: v.union(
      v.literal("setup"),
      v.literal("active"),
      v.literal("victory"),
      v.literal("defeat"),
      v.literal("completed"),
    ),
    encounterNumber: v.number(),
    battleRoundNumber: v.number(),
    partyMaxHealth: v.number(),
    partyCurrentHealth: v.number(),
    activeBossCount: v.number(),
    startedAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
    lastResolvedAt: v.number(),
  }).index("by_session", ["sessionId"]),
  combatantStates: defineTable({
    sessionId: v.id("gameSessions"),
    encounterId: v.id("battleEncounters"),
    combatantType: v.union(v.literal("player"), v.literal("boss")),
    playerEntryId: v.union(v.id("playerEntries"), v.null()),
    bossDefinitionId: v.union(v.id("bossDefinitions"), v.null()),
    displayName: v.string(),
    lineupSlot: v.number(),
    currentHealth: v.number(),
    maxHealth: v.number(),
    currentActionPoints: v.number(),
    actionPointsPerRound: v.number(),
    state: v.union(
      v.literal("active"),
      v.literal("knocked_out"),
      v.literal("defeated"),
    ),
    availableSkillIds: v.array(v.id("skillDefinitions")),
    pendingEffectIds: v.array(v.string()),
    spriteSource: v.union(v.literal("custom"), v.literal("fallback")),
    spriteRef: v.union(v.string(), v.null()),
    fallbackSpriteKey: v.union(v.string(), v.null()),
    nextQuizAdvantage: v.union(v.literal("none"), v.literal("easier_question")),
    lastUpdatedAt: v.number(),
  })
    .index("by_encounter", ["encounterId"])
    .index("by_player_entry", ["playerEntryId"])
    .index("by_boss_definition", ["bossDefinitionId"]),
});

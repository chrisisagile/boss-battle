import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { BattleActivityFeedItem } from "./lib/battleFeed";
import {
  applyStudyAdvantage,
  buildDefaultBossCatalog,
  chooseFallbackSpriteKey,
  STANDARD_ATTACK_DAMAGE,
  STANDARD_BOSS_DAMAGE_MULTIPLIER,
  STANDARD_GUARD_RECOVERY,
  STANDARD_HEAL_AMOUNT,
  STANDARD_PLAYER_MAX_HEALTH,
  scaleBossCombatValues,
} from "./lib/battleState";
import type { BattleSkillCategory } from "./lib/battleValidation";
import {
  normalizeSpriteRef,
  validateBossScalingProfile,
  validateEncounterBossSelection,
} from "./lib/battleValidation";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import { startRoundForSession } from "./quizRounds";

async function getEncounterCombatants(
  ctx: QueryCtx | MutationCtx,
  encounterId: Id<"battleEncounters">,
) {
  return await ctx.db
    .query("combatantStates")
    .withIndex("by_encounter", (q) => q.eq("encounterId", encounterId))
    .collect();
}

async function ensureDefaultSkillDefinitions(ctx: MutationCtx) {
  const existing = await ctx.db.query("skillDefinitions").collect();
  if (existing.length > 0) {
    return existing;
  }

  const now = Date.now();
  const skillSeeds: Array<{
    actionPointCost: number;
    category: BattleSkillCategory;
    carryForwardRule: string | null;
    description: string;
    effectRule: string;
    name: string;
    targetScope: string;
  }> = [
    {
      actionPointCost: 1,
      category: "attack",
      carryForwardRule: null,
      description: "Deal direct damage to one boss.",
      effectRule: "boss_damage:4",
      name: "Slash",
      targetScope: "enemy",
    },
    {
      actionPointCost: 1,
      category: "heal",
      carryForwardRule: null,
      description: "Restore party health before the next defeat check.",
      effectRule: "party_heal:3",
      name: "Rally Heal",
      targetScope: "party",
    },
    {
      actionPointCost: 1,
      category: "defend",
      carryForwardRule: null,
      description: "Reduce incoming party damage this round.",
      effectRule: "party_guard:2",
      name: "Shield Wall",
      targetScope: "party",
    },
    {
      actionPointCost: 2,
      category: "study",
      carryForwardRule: "easier_question",
      description: "Make the next quiz question easier for this player.",
      effectRule: "study:easier_question",
      name: "Study Weakness",
      targetScope: "self",
    },
  ];

  const insertedIds: Id<"skillDefinitions">[] = [];
  for (const skill of skillSeeds) {
    insertedIds.push(
      await ctx.db.insert("skillDefinitions", {
        ...skill,
        createdAt: now,
        status: "ready",
        updatedAt: now,
      }),
    );
  }

  return await Promise.all(insertedIds.map((id) => ctx.db.get(id)));
}

async function ensureDefaultBossDefinitions(
  ctx: MutationCtx,
  skillIds: Id<"skillDefinitions">[],
) {
  const existing = await ctx.db.query("bossDefinitions").collect();
  if (existing.length > 0) {
    return existing;
  }

  const now = Date.now();
  const bossSeeds = buildDefaultBossCatalog(skillIds);
  const insertedIds: Id<"bossDefinitions">[] = [];

  for (const boss of bossSeeds) {
    insertedIds.push(
      await ctx.db.insert("bossDefinitions", {
        ...boss,
        skillIds,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  return await Promise.all(insertedIds.map((id) => ctx.db.get(id)));
}

export const listBossCatalog = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bossDefinitions")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .collect();
  },
});

export const upsertBossDefinition = mutation({
  args: {
    baseActionPointsPerRound: v.number(),
    baseHealth: v.number(),
    defaultSpriteRef: v.union(v.string(), v.null()),
    description: v.string(),
    name: v.string(),
    scalingProfile: v.object({
      actionPointsPerPlayerThreshold: v.number(),
      bonusActionPoints: v.number(),
      healthPerPlayer: v.number(),
    }),
    skillIds: v.array(v.id("skillDefinitions")),
    status: v.union(
      v.literal("draft"),
      v.literal("ready"),
      v.literal("retired"),
    ),
  },
  handler: async (ctx, args) => {
    const scalingError = validateBossScalingProfile(args.scalingProfile);
    if (scalingError) {
      createJoinError(JOIN_ERROR_CODES.invalidBattleConfig, scalingError);
    }

    const spriteRef = normalizeSpriteRef(args.defaultSpriteRef);
    const now = Date.now();

    const existing = await ctx.db
      .query("bossDefinitions")
      .withIndex("by_name", (q) => q.eq("name", args.name.trim()))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        defaultSpriteRef: spriteRef,
        name: args.name.trim(),
        updatedAt: now,
      });

      return existing._id;
    }

    return await ctx.db.insert("bossDefinitions", {
      ...args,
      defaultSpriteRef: spriteRef,
      name: args.name.trim(),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const syncDefaultBossCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const skillDefinitions = (await ensureDefaultSkillDefinitions(ctx)).filter(
      Boolean,
    ) as Doc<"skillDefinitions">[];
    const skillIds = skillDefinitions.map((skill) => skill._id);
    const bossDefinitions = (
      await ensureDefaultBossDefinitions(ctx, skillIds)
    ).filter(Boolean) as Doc<"bossDefinitions">[];

    return {
      bossCount: bossDefinitions.length,
      bossNames: bossDefinitions.map((boss) => boss.name).sort(),
    };
  },
});

function isPlayerCombatant(combatant: Doc<"combatantStates">) {
  return combatant.combatantType === "player";
}

function isBossCombatant(combatant: Doc<"combatantStates">) {
  return combatant.combatantType === "boss";
}

function isActiveCombatant(combatant: Doc<"combatantStates">) {
  return combatant.state === "active";
}

async function getRoundParticipants(
  ctx: MutationCtx,
  roundId: Id<"gameRounds">,
) {
  return await ctx.db
    .query("roundParticipants")
    .withIndex("by_round", (q) => q.eq("roundId", roundId))
    .collect();
}

async function getOrCreateExchange(
  ctx: MutationCtx,
  roundId: Id<"gameRounds">,
  encounterId: Id<"battleEncounters">,
  exchangeNumber: number,
) {
  const existing = await ctx.db
    .query("battleExchanges")
    .withIndex("by_round_and_exchange", (q) =>
      q.eq("roundId", roundId).eq("exchangeNumber", exchangeNumber),
    )
    .unique();

  if (existing) {
    return existing;
  }

  const exchangeId = await ctx.db.insert("battleExchanges", {
    roundId,
    encounterId,
    exchangeNumber,
    status: "pending",
    bossActionSummary: [],
    playerTurnOrder: [],
    playerActions: [],
    activityEvents: [],
    resolvedAt: null,
  });

  const created = await ctx.db.get(exchangeId);
  if (!created) {
    createJoinError(
      JOIN_ERROR_CODES.invalidBattleConfig,
      "The battle exchange could not be created.",
    );
  }

  return created;
}

function pickBossTarget(playerCombatants: Doc<"combatantStates">[]) {
  return (
    [...playerCombatants].filter(isActiveCombatant).sort((left, right) => {
      if (right.currentHealth !== left.currentHealth) {
        return right.currentHealth - left.currentHealth;
      }

      return left.lineupSlot - right.lineupSlot;
    })[0] ?? null
  );
}

function sortPlayerTurnOrder(
  playerActions: Array<{
    playerEntryId: Id<"playerEntries">;
    skillId: Id<"skillDefinitions">;
    targetId: Id<"combatantStates"> | null;
    submittedAt: number;
  }>,
  combatantsByPlayerEntry: Map<Id<"playerEntries">, Doc<"combatantStates">>,
) {
  return [...playerActions].sort((left, right) => {
    const leftCombatant = combatantsByPlayerEntry.get(left.playerEntryId);
    const rightCombatant = combatantsByPlayerEntry.get(right.playerEntryId);
    const leftPoints = leftCombatant?.currentActionPoints ?? 0;
    const rightPoints = rightCombatant?.currentActionPoints ?? 0;

    if (rightPoints !== leftPoints) {
      return rightPoints - leftPoints;
    }

    return Math.random() >= 0.5 ? 1 : -1;
  });
}

async function completeEncounter(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  encounter: Doc<"battleEncounters">,
  reason: "players_won" | "bosses_won" | "host_ended" | "no_actions_left",
  now: number,
) {
  await ctx.db.patch(session._id, {
    activeEncounterId: null,
    activeRoundId: null,
    battleJoinStatus: "post_battle",
    closedAt: now,
    completedAt: now,
    completionReason: reason,
    gamePhase: "results",
    joinStatus: "closed",
    status: "completed",
    updatedAt: now,
  });

  await ctx.db.patch(encounter._id, {
    endedAt: now,
    lastResolvedAt: now,
    status:
      reason === "players_won"
        ? "victory"
        : reason === "host_ended"
          ? "completed"
          : "defeat",
  });

  if (session.activeRoundId) {
    await ctx.db.patch(session.activeRoundId, {
      completedAt: now,
      phase: "completed",
      status: "completed",
    });
  }
}

async function advanceFromResolvedExchange(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  encounter: Doc<"battleEncounters">,
  round: Doc<"gameRounds">,
  combatants: Doc<"combatantStates">[],
  now: number,
) {
  const activePlayers = combatants.filter(
    (combatant) => isPlayerCombatant(combatant) && isActiveCombatant(combatant),
  );
  const activeBosses = combatants.filter(
    (combatant) => isBossCombatant(combatant) && isActiveCombatant(combatant),
  );

  if (activeBosses.length === 0) {
    await completeEncounter(ctx, session, encounter, "players_won", now);
    return {
      completionReason: "players_won" as const,
      phase: "results" as const,
    };
  }

  if (activePlayers.length === 0) {
    await completeEncounter(ctx, session, encounter, "bosses_won", now);
    return {
      completionReason: "bosses_won" as const,
      phase: "results" as const,
    };
  }

  const exhaustedPlayers = activePlayers.every(
    (combatant) => combatant.currentActionPoints <= 0,
  );
  const exchangesResolved = (round.exchangesResolved ?? 0) + 1;
  const hitExchangeLimit = exchangesResolved >= (round.exchangeLimit ?? 1);

  if (hitExchangeLimit || exhaustedPlayers) {
    await ctx.db.patch(round._id, {
      completedAt: now,
      exchangesResolved,
      phase: "completed",
      status: "completed",
    });

    const sessionForNextRound = {
      ...session,
      activeRoundId: null,
      updatedAt: now,
    };
    await ctx.db.patch(session._id, {
      activeRoundId: null,
      gamePhase: "quiz",
      updatedAt: now,
    });

    const nextConfig = {
      allowedCategories: session.allowedCategories ?? round.allowedCategories,
      allowedComplexities:
        session.allowedComplexities ?? round.allowedComplexities,
      questionTarget: session.questionTargetPerRound ?? round.questionTarget,
    };

    try {
      await startRoundForSession(ctx, sessionForNextRound, nextConfig);
      return { completionReason: null, phase: "quiz" as const };
    } catch (error) {
      if (
        error instanceof ConvexError &&
        error.data &&
        typeof error.data === "object" &&
        "code" in error.data &&
        error.data.code === JOIN_ERROR_CODES.insufficientQuestions
      ) {
        await completeEncounter(
          ctx,
          session,
          encounter,
          "no_actions_left",
          now,
        );
        return {
          completionReason: "no_actions_left" as const,
          phase: "results" as const,
        };
      }

      throw error;
    }
  }

  const participants = await getRoundParticipants(ctx, round._id);
  for (const participant of participants) {
    const combatant = participant.playerEntryId
      ? combatants.find(
          (currentCombatant) =>
            currentCombatant.playerEntryId === participant.playerEntryId,
        )
      : null;

    await ctx.db.patch(participant._id, {
      status:
        participant.status === "removed_disconnected"
          ? participant.status
          : combatant?.state === "knocked_out"
            ? "knocked_out"
            : (combatant?.currentActionPoints ?? 0) > 0
              ? "quiz_complete"
              : "action_ready",
    });
  }

  await ctx.db.patch(round._id, {
    exchangesResolved,
    phase: "action_selection",
  });
  await ctx.db.patch(session._id, {
    gamePhase: "action_selection",
    updatedAt: now,
  });

  return { completionReason: null, phase: "action_selection" as const };
}

export const startEncounter = mutation({
  args: {
    bossDefinitionIds: v.array(v.id("bossDefinitions")),
    questionTarget: v.number(),
    allowedCategories: v.array(v.string()),
    allowedComplexities: v.array(v.string()),
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const selectionError = validateEncounterBossSelection(
      args.bossDefinitionIds.map((id) => id.toString()),
    );
    if (selectionError) {
      createJoinError(JOIN_ERROR_CODES.invalidBattleConfig, selectionError);
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "The requested session could not be found.",
      );
    }

    if (session.activeEncounterId || session.status === "completed") {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleConfig,
        "A battle is already active for this session.",
      );
    }

    const players = (
      await ctx.db
        .query("playerEntries")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect()
    ).filter((player) => player.joinStatus === "joined");

    if (players.length === 0) {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleConfig,
        "At least one joined player is required before starting a battle.",
      );
    }

    const now = Date.now();
    const encounterNumber =
      (
        await ctx.db
          .query("battleEncounters")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()
      ).length + 1;
    const partyMaxHealth = players.length * STANDARD_PLAYER_MAX_HEALTH;
    const encounterId = await ctx.db.insert("battleEncounters", {
      sessionId: session._id,
      status: "active",
      encounterNumber,
      battleRoundNumber: 1,
      partyMaxHealth,
      partyCurrentHealth: partyMaxHealth,
      activeBossCount: args.bossDefinitionIds.length,
      startedAt: now,
      endedAt: null,
      lastResolvedAt: now,
    });

    const skillDefinitions = (await ensureDefaultSkillDefinitions(ctx)).filter(
      Boolean,
    ) as Doc<"skillDefinitions">[];
    const playerSkillIds = skillDefinitions.map((skill) => skill._id);

    for (const [index, player] of players.entries()) {
      await ctx.db.insert("combatantStates", {
        sessionId: session._id,
        encounterId,
        combatantType: "player",
        playerEntryId: player._id,
        bossDefinitionId: null,
        displayName: player.displayName,
        lineupSlot: index + 1,
        currentHealth: STANDARD_PLAYER_MAX_HEALTH,
        maxHealth: STANDARD_PLAYER_MAX_HEALTH,
        currentActionPoints: 0,
        actionPointsPerRound: 0,
        state: "active",
        availableSkillIds: playerSkillIds,
        pendingEffectIds: [],
        spriteSource: "fallback",
        spriteRef: null,
        fallbackSpriteKey: chooseFallbackSpriteKey(
          player.displayName,
          index + 1,
        ),
        nextQuizAdvantage: "none",
        lastUpdatedAt: now,
      });
    }

    const bossDefinitions = await Promise.all(
      args.bossDefinitionIds.map((id) => ctx.db.get(id)),
    );

    for (const [index, unresolvedBoss] of bossDefinitions.entries()) {
      if (!unresolvedBoss) {
        createJoinError(
          JOIN_ERROR_CODES.invalidBattleConfig,
          "Each selected boss must exist before the encounter can start.",
        );
      }

      const boss = unresolvedBoss;
      const scaledValues = scaleBossCombatValues({
        activePlayerCount: players.length,
        baseActionPointsPerRound: boss.baseActionPointsPerRound,
        baseHealth: boss.baseHealth,
        scalingProfile: boss.scalingProfile,
      });
      await ctx.db.insert("combatantStates", {
        sessionId: session._id,
        encounterId,
        combatantType: "boss",
        playerEntryId: null,
        bossDefinitionId: boss._id,
        displayName: boss.name,
        lineupSlot: index + 1,
        currentHealth: scaledValues.maxHealth,
        maxHealth: scaledValues.maxHealth,
        currentActionPoints: scaledValues.actionPointsPerRound,
        actionPointsPerRound: scaledValues.actionPointsPerRound,
        state: "active",
        availableSkillIds: boss.skillIds,
        pendingEffectIds: [],
        spriteSource: boss.defaultSpriteRef ? "custom" : "fallback",
        spriteRef: boss.defaultSpriteRef,
        fallbackSpriteKey: boss.defaultSpriteRef
          ? null
          : chooseFallbackSpriteKey(boss.name, index + 1),
        nextQuizAdvantage: "none",
        lastUpdatedAt: now,
      });
    }

    await ctx.db.patch(session._id, {
      activeEncounterId: encounterId,
      joinStatus: "closed",
      battleJoinStatus: "active_battle",
      gamePhase: "quiz",
      selectedBossDefinitionIds: args.bossDefinitionIds,
      questionTargetPerRound: args.questionTarget,
      allowedCategories: args.allowedCategories,
      allowedComplexities: args.allowedComplexities,
      configLockedAt: now,
      closedAt: now,
      updatedAt: now,
    });

    await startRoundForSession(
      ctx,
      {
        ...session,
        activeEncounterId: encounterId,
        joinStatus: "closed",
        battleJoinStatus: "active_battle",
        gamePhase: "quiz",
        selectedBossDefinitionIds: args.bossDefinitionIds,
        questionTargetPerRound: args.questionTarget,
        allowedCategories: args.allowedCategories,
        allowedComplexities: args.allowedComplexities,
        configLockedAt: now,
        closedAt: now,
        updatedAt: now,
      },
      {
        questionTarget: args.questionTarget,
        allowedCategories: args.allowedCategories,
        allowedComplexities: args.allowedComplexities,
      },
    );

    return {
      encounterId,
      encounterNumber,
    };
  },
});

export const submitPlayerAction = mutation({
  args: {
    roundId: v.id("gameRounds"),
    encounterId: v.id("battleEncounters"),
    playerEntryId: v.id("playerEntries"),
    skillId: v.id("skillDefinitions"),
    targetId: v.optional(v.union(v.id("combatantStates"), v.null())),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "active") {
      createJoinError(
        JOIN_ERROR_CODES.noActiveRound,
        "There is no active round ready to collect battle actions.",
      );
    }

    if ((round.phase ?? "quiz") !== "action_selection") {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleAction,
        "Players can only pick actions during the action selection step.",
      );
    }

    const encounter = await ctx.db.get(args.encounterId);
    if (!encounter || encounter.status !== "active") {
      createJoinError(
        JOIN_ERROR_CODES.noActiveEncounter,
        "There is no active battle state for this player.",
      );
    }

    const combatant = await ctx.db
      .query("combatantStates")
      .withIndex("by_player_entry", (q) =>
        q.eq("playerEntryId", args.playerEntryId),
      )
      .unique();

    if (!combatant || combatant.encounterId !== args.encounterId) {
      createJoinError(
        JOIN_ERROR_CODES.noActiveEncounter,
        "There is no active battle state for this player.",
      );
    }

    if (combatant.state !== "active") {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleAction,
        "Knocked-out players cannot perform battle actions.",
      );
    }

    const participant = await ctx.db
      .query("roundParticipants")
      .withIndex("by_round_and_player", (q) =>
        q.eq("roundId", round._id).eq("playerEntryId", args.playerEntryId),
      )
      .unique();

    if (!participant || participant.status === "removed_disconnected") {
      createJoinError(
        JOIN_ERROR_CODES.battleJoinBlocked,
        "This player is no longer active in the current round.",
      );
    }

    const skill = await ctx.db.get(args.skillId);
    if (!skill || !combatant.availableSkillIds.includes(args.skillId)) {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleAction,
        "That battle action is not available for this player.",
      );
    }

    if (combatant.currentActionPoints < skill.actionPointCost) {
      createJoinError(
        JOIN_ERROR_CODES.insufficientActionPoints,
        "This player does not have enough action points for that action.",
      );
    }

    const encounterCombatants = await getEncounterCombatants(
      ctx,
      encounter._id,
    );
    const target =
      args.targetId === undefined
        ? null
        : (encounterCombatants.find(
            (currentCombatant) => currentCombatant._id === args.targetId,
          ) ?? null);

    if (
      skill.targetScope === "enemy" &&
      (!target || !isBossCombatant(target))
    ) {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleAction,
        "An active boss target is required for that action.",
      );
    }

    if (
      skill.targetScope === "self" &&
      target &&
      target._id !== combatant._id
    ) {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleAction,
        "This action can only target the current player.",
      );
    }

    const exchange = await getOrCreateExchange(
      ctx,
      round._id,
      encounter._id,
      (round.exchangesResolved ?? 0) + 1,
    );
    const duplicateAction = exchange.playerActions.some(
      (action) => action.playerEntryId === args.playerEntryId,
    );
    if (duplicateAction) {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleAction,
        "This player has already chosen an action for the current exchange.",
      );
    }

    const submittedAt = Date.now();
    await ctx.db.patch(exchange._id, {
      playerActions: [
        ...exchange.playerActions,
        {
          playerEntryId: args.playerEntryId,
          skillId: args.skillId,
          submittedAt,
          targetId:
            skill.targetScope === "self"
              ? combatant._id
              : (args.targetId ?? null),
        },
      ],
    });
    await ctx.db.patch(participant._id, {
      status: "action_ready",
    });
    const updatedExchange = await ctx.db.get(exchange._id);
    if (!updatedExchange) {
      createJoinError(
        JOIN_ERROR_CODES.invalidBattleConfig,
        "The exchange state disappeared before it could resolve.",
      );
    }

    const requiredActors = encounterCombatants.filter(
      (currentCombatant) =>
        isPlayerCombatant(currentCombatant) &&
        isActiveCombatant(currentCombatant) &&
        currentCombatant.currentActionPoints > 0,
    );
    const readyPlayerIds = new Set(
      updatedExchange.playerActions.map((action) => action.playerEntryId),
    );
    const readyToResolve = requiredActors.every((currentCombatant) =>
      currentCombatant.playerEntryId
        ? readyPlayerIds.has(currentCombatant.playerEntryId)
        : true,
    );

    return readyToResolve
      ? await resolveBattleExchangeInternal(ctx, {
          encounter,
          round,
          sessionId: encounter.sessionId,
        })
      : {
          exchangeId: exchange._id,
          phase: "action_selection" as const,
          readyToResolve: false,
        };
  },
});

async function resolveBattleExchangeInternal(
  ctx: MutationCtx,
  args: {
    encounter: Doc<"battleEncounters">;
    round: Doc<"gameRounds">;
    sessionId: Id<"gameSessions">;
  },
) {
  const session = await ctx.db.get(args.sessionId);
  if (!session) {
    createJoinError(
      JOIN_ERROR_CODES.sessionNotFound,
      "The session for this battle exchange is missing.",
    );
  }

  const exchange = await getOrCreateExchange(
    ctx,
    args.round._id,
    args.encounter._id,
    (args.round.exchangesResolved ?? 0) + 1,
  );
  const combatants = await getEncounterCombatants(ctx, args.encounter._id);
  const combatantsById = new Map(
    combatants.map((combatant) => [combatant._id, combatant]),
  );
  const combatantsByPlayerEntry = new Map(
    combatants
      .filter(
        (combatant) => isPlayerCombatant(combatant) && combatant.playerEntryId,
      )
      .map((combatant) => [
        combatant.playerEntryId as Id<"playerEntries">,
        combatant,
      ]),
  );
  const activePlayers = combatants.filter(
    (combatant) => isPlayerCombatant(combatant) && isActiveCombatant(combatant),
  );
  const activeBosses = combatants.filter(
    (combatant) => isBossCombatant(combatant) && isActiveCombatant(combatant),
  );
  const playerActions = sortPlayerTurnOrder(
    exchange.playerActions,
    combatantsByPlayerEntry,
  );
  const now = Date.now();
  const activityEvents: BattleActivityFeedItem[] = [];
  let nextEventNumber = 1;

  function recordActivityEvent(input: {
    actionLabel: string;
    actorCombatantId: Id<"combatantStates">;
    actorName: string;
    actorType: "boss" | "player";
    magnitude?: number;
    outcomeType: BattleActivityFeedItem["outcomeType"];
    resultingTargetHealth?: number | null;
    resultingTargetState?: string | null;
    summaryText: string;
    targetCombatantId?: Id<"combatantStates"> | null;
    targetName?: string | null;
  }) {
    activityEvents.push({
      actionLabel: input.actionLabel,
      actorCombatantId: input.actorCombatantId,
      actorName: input.actorName,
      actorType: input.actorType,
      eventNumber: nextEventNumber,
      magnitude: input.magnitude ?? 0,
      outcomeType: input.outcomeType,
      resultingTargetHealth: input.resultingTargetHealth ?? null,
      resultingTargetState: input.resultingTargetState ?? null,
      summaryText: input.summaryText,
      targetCombatantId: input.targetCombatantId ?? null,
      targetName: input.targetName ?? null,
    });
    nextEventNumber += 1;
  }

  await ctx.db.patch(args.round._id, {
    phase: "battle_resolution",
  });
  await ctx.db.patch(session._id, {
    gamePhase: "battle_resolution",
    updatedAt: now,
  });
  await ctx.db.patch(exchange._id, {
    playerTurnOrder: playerActions
      .map((action) => combatantsByPlayerEntry.get(action.playerEntryId)?._id)
      .filter(Boolean) as Id<"combatantStates">[],
    status: "resolving",
  });

  let partyHealth = args.encounter.partyCurrentHealth;
  const playerHealth = new Map(
    activePlayers.map((combatant) => [combatant._id, combatant.currentHealth]),
  );
  const bossHealth = new Map(
    activeBosses.map((combatant) => [combatant._id, combatant.currentHealth]),
  );
  const bossActionSummary: Array<{
    actorId: Id<"combatantStates">;
    damage: number;
    skillName: string;
    targetId: Id<"combatantStates"> | null;
  }> = [];

  for (const boss of activeBosses) {
    const target = pickBossTarget(
      activePlayers.map((currentCombatant) => ({
        ...currentCombatant,
        currentHealth:
          playerHealth.get(currentCombatant._id) ??
          currentCombatant.currentHealth,
      })),
    );

    if (!target) {
      recordActivityEvent({
        actionLabel: "Boss Strike",
        actorCombatantId: boss._id,
        actorName: boss.displayName,
        actorType: "boss",
        outcomeType: "skipped",
        summaryText: `${boss.displayName} has no active target and cannot act.`,
      });
      continue;
    }

    const damage = Math.max(
      1,
      boss.actionPointsPerRound * STANDARD_BOSS_DAMAGE_MULTIPLIER,
    );
    const previousHealth = playerHealth.get(target._id) ?? target.currentHealth;
    const nextHealth = Math.max(0, previousHealth - damage);
    playerHealth.set(target._id, nextHealth);
    partyHealth = Math.max(0, partyHealth - (previousHealth - nextHealth));
    bossActionSummary.push({
      actorId: boss._id,
      damage,
      skillName: "Boss Strike",
      targetId: target._id,
    });
    recordActivityEvent({
      actionLabel: "Boss Strike",
      actorCombatantId: boss._id,
      actorName: boss.displayName,
      actorType: "boss",
      magnitude: damage,
      outcomeType: nextHealth === 0 ? "knockout" : "damage",
      resultingTargetHealth: nextHealth,
      resultingTargetState: nextHealth === 0 ? "knocked_out" : target.state,
      summaryText:
        nextHealth === 0
          ? `${boss.displayName} knocks out ${target.displayName} with Boss Strike for ${damage}.`
          : `${boss.displayName} uses Boss Strike on ${target.displayName} for ${damage} damage.`,
      targetCombatantId: target._id,
      targetName: target.displayName,
    });
  }

  for (const action of playerActions) {
    const actor = combatantsByPlayerEntry.get(action.playerEntryId);
    if (!actor || (playerHealth.get(actor._id) ?? actor.currentHealth) <= 0) {
      if (actor) {
        const currentActorHealth =
          playerHealth.get(actor._id) ?? actor.currentHealth;
        recordActivityEvent({
          actionLabel: "Queued Action",
          actorCombatantId: actor._id,
          actorName: actor.displayName,
          actorType: "player",
          outcomeType: "skipped",
          resultingTargetHealth: currentActorHealth,
          resultingTargetState:
            currentActorHealth <= 0 ? "knocked_out" : actor.state,
          summaryText: `${actor.displayName}'s action is skipped because they can no longer act.`,
          targetCombatantId: action.targetId ?? null,
          targetName: action.targetId
            ? (combatantsById.get(action.targetId)?.displayName ?? null)
            : null,
        });
      }
      continue;
    }

    const skill = await ctx.db.get(action.skillId);
    if (!skill) {
      continue;
    }

    const remainingActionPoints = Math.max(
      0,
      actor.currentActionPoints - skill.actionPointCost,
    );

    if (skill.category === "attack") {
      const targetId =
        action.targetId ??
        activeBosses.find(
          (boss) => (bossHealth.get(boss._id) ?? boss.currentHealth) > 0,
        )?._id ??
        null;
      if (targetId) {
        const target = combatantsById.get(targetId);
        if (
          target &&
          isBossCombatant(target) &&
          (bossHealth.get(targetId) ?? target.currentHealth) > 0
        ) {
          const nextHealth = Math.max(
            0,
            (bossHealth.get(targetId) ?? target.currentHealth) -
              STANDARD_ATTACK_DAMAGE,
          );
          bossHealth.set(targetId, nextHealth);
          recordActivityEvent({
            actionLabel: skill.name,
            actorCombatantId: actor._id,
            actorName: actor.displayName,
            actorType: "player",
            magnitude: STANDARD_ATTACK_DAMAGE,
            outcomeType: nextHealth === 0 ? "knockout" : "damage",
            resultingTargetHealth: nextHealth,
            resultingTargetState: nextHealth === 0 ? "defeated" : target.state,
            summaryText:
              nextHealth === 0
                ? `${actor.displayName} knocks out ${target.displayName} with ${skill.name}.`
                : `${actor.displayName} uses ${skill.name} on ${target.displayName} for ${STANDARD_ATTACK_DAMAGE} damage.`,
            targetCombatantId: target._id,
            targetName: target.displayName,
          });
        } else {
          const currentTargetHealth = target
            ? (bossHealth.get(targetId) ?? target.currentHealth)
            : null;
          recordActivityEvent({
            actionLabel: skill.name,
            actorCombatantId: actor._id,
            actorName: actor.displayName,
            actorType: "player",
            outcomeType: "miss",
            resultingTargetHealth: currentTargetHealth,
            resultingTargetState:
              currentTargetHealth === 0 ? "defeated" : (target?.state ?? null),
            summaryText: `${actor.displayName}'s ${skill.name} misses because the target is no longer active.`,
            targetCombatantId: targetId,
            targetName: target?.displayName ?? null,
          });
        }
      } else {
        recordActivityEvent({
          actionLabel: skill.name,
          actorCombatantId: actor._id,
          actorName: actor.displayName,
          actorType: "player",
          outcomeType: "skipped",
          summaryText: `${actor.displayName} cannot use ${skill.name} because no valid target remains.`,
        });
      }
    }

    if (skill.category === "heal") {
      const targetId = action.targetId ?? actor._id;
      const target = combatantsById.get(targetId);
      if (target && isPlayerCombatant(target)) {
        const previousHealth =
          playerHealth.get(targetId) ?? target.currentHealth;
        const nextHealth = Math.min(
          target.maxHealth,
          previousHealth + STANDARD_HEAL_AMOUNT,
        );
        playerHealth.set(targetId, nextHealth);
        partyHealth = Math.min(
          args.encounter.partyMaxHealth,
          partyHealth + (nextHealth - previousHealth),
        );
        recordActivityEvent({
          actionLabel: skill.name,
          actorCombatantId: actor._id,
          actorName: actor.displayName,
          actorType: "player",
          magnitude: nextHealth - previousHealth,
          outcomeType: "heal",
          resultingTargetHealth: nextHealth,
          resultingTargetState: target.state,
          summaryText:
            nextHealth > previousHealth
              ? `${actor.displayName} uses ${skill.name} on ${target.displayName} for ${nextHealth - previousHealth} health.`
              : `${actor.displayName} uses ${skill.name}, but ${target.displayName} is already at full health.`,
          targetCombatantId: target._id,
          targetName: target.displayName,
        });
      }
    }

    if (skill.category === "defend") {
      const previousHealth = playerHealth.get(actor._id) ?? actor.currentHealth;
      const nextHealth = Math.min(
        actor.maxHealth,
        previousHealth + STANDARD_GUARD_RECOVERY,
      );
      playerHealth.set(actor._id, nextHealth);
      partyHealth = Math.min(
        args.encounter.partyMaxHealth,
        partyHealth + (nextHealth - previousHealth),
      );
      recordActivityEvent({
        actionLabel: skill.name,
        actorCombatantId: actor._id,
        actorName: actor.displayName,
        actorType: "player",
        magnitude: nextHealth - previousHealth,
        outcomeType: "guard",
        resultingTargetHealth: nextHealth,
        resultingTargetState: actor.state,
        summaryText:
          nextHealth > previousHealth
            ? `${actor.displayName} uses ${skill.name} and steadies for ${nextHealth - previousHealth} health.`
            : `${actor.displayName} uses ${skill.name} and braces for the next exchange.`,
        targetCombatantId: actor._id,
        targetName: actor.displayName,
      });
    }

    if (skill.category === "study") {
      const nextQuizAdvantage = applyStudyAdvantage(skill.category);
      await ctx.db.patch(actor._id, {
        nextQuizAdvantage: nextQuizAdvantage ?? actor.nextQuizAdvantage,
      });

      if (actor.playerEntryId) {
        await ctx.db.patch(actor.playerEntryId, {
          nextQuizAdvantage: nextQuizAdvantage ?? "none",
        });
      }
      recordActivityEvent({
        actionLabel: skill.name,
        actorCombatantId: actor._id,
        actorName: actor.displayName,
        actorType: "player",
        outcomeType: "status",
        resultingTargetHealth:
          playerHealth.get(actor._id) ?? actor.currentHealth,
        resultingTargetState: actor.state,
        summaryText: `${actor.displayName} uses ${skill.name} and gains an easier question next round.`,
        targetCombatantId: actor._id,
        targetName: actor.displayName,
      });
    }

    await ctx.db.patch(actor._id, {
      currentActionPoints: remainingActionPoints,
      lastUpdatedAt: now,
    });
  }

  const resolvedCombatants = await getEncounterCombatants(
    ctx,
    args.encounter._id,
  );
  for (const combatant of resolvedCombatants) {
    if (isPlayerCombatant(combatant)) {
      const nextHealth =
        playerHealth.get(combatant._id) ?? combatant.currentHealth;
      await ctx.db.patch(combatant._id, {
        currentHealth: nextHealth,
        lastUpdatedAt: now,
        state: nextHealth === 0 ? "knocked_out" : combatant.state,
      });
    }

    if (isBossCombatant(combatant)) {
      const nextHealth =
        bossHealth.get(combatant._id) ?? combatant.currentHealth;
      await ctx.db.patch(combatant._id, {
        currentHealth: nextHealth,
        lastUpdatedAt: now,
        state: nextHealth === 0 ? "defeated" : combatant.state,
      });
    }
  }

  const refreshedCombatants = await getEncounterCombatants(
    ctx,
    args.encounter._id,
  );
  const activeBossCount = refreshedCombatants.filter(
    (combatant) => isBossCombatant(combatant) && isActiveCombatant(combatant),
  ).length;
  await ctx.db.patch(args.encounter._id, {
    activeBossCount,
    battleRoundNumber: args.encounter.battleRoundNumber + 1,
    lastResolvedAt: now,
    partyCurrentHealth: Math.max(0, partyHealth),
  });
  await ctx.db.patch(exchange._id, {
    activityEvents,
    bossActionSummary,
    resolvedAt: now,
    status: "resolved",
  });

  const refreshedEncounter = await ctx.db.get(args.encounter._id);
  const refreshedRound = await ctx.db.get(args.round._id);
  if (!refreshedEncounter || !refreshedRound) {
    createJoinError(
      JOIN_ERROR_CODES.invalidBattleConfig,
      "The battle state could not be refreshed after resolution.",
    );
  }

  const advancement = await advanceFromResolvedExchange(
    ctx,
    session,
    refreshedEncounter,
    refreshedRound,
    refreshedCombatants,
    now,
  );

  return {
    completionReason: advancement.completionReason,
    exchangeId: exchange._id,
    phase: advancement.phase,
    readyToResolve: true,
  };
}

export const resolveBattleExchange = mutation({
  args: {
    roundId: v.id("gameRounds"),
    encounterId: v.id("battleEncounters"),
  },
  handler: async (ctx, args) => {
    const encounter = await ctx.db.get(args.encounterId);
    if (!encounter || encounter.status !== "active") {
      createJoinError(
        JOIN_ERROR_CODES.noActiveEncounter,
        "There is no active battle to resolve.",
      );
    }

    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "active") {
      createJoinError(
        JOIN_ERROR_CODES.noActiveRound,
        "There is no active round to resolve.",
      );
    }

    return await resolveBattleExchangeInternal(ctx, {
      encounter,
      round,
      sessionId: encounter.sessionId,
    });
  },
});

export const resolveEncounterRound = resolveBattleExchange;

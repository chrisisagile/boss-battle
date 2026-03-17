import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  applyStudyAdvantage,
  buildDefaultBossCatalog,
  chooseFallbackSpriteKey,
  resolveRoundState,
  scaleBossCombatValues,
} from "./lib/battleState";
import type { BattleSkillCategory } from "./lib/battleValidation";
import {
  normalizeSpriteRef,
  validateBossScalingProfile,
  validateEncounterBossSelection,
} from "./lib/battleValidation";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";

function getDefaultPlayerActionPoints(tokenBalance: number) {
  return Math.max(2, Math.min(5, tokenBalance + 2));
}

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

export const startEncounter = mutation({
  args: {
    bossDefinitionIds: v.array(v.id("bossDefinitions")),
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

    if (session.activeEncounterId) {
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
    const partyMaxHealth = players.length * 10;
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
        currentHealth: 10,
        maxHealth: 10,
        currentActionPoints: getDefaultPlayerActionPoints(player.tokenBalance),
        actionPointsPerRound: getDefaultPlayerActionPoints(player.tokenBalance),
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
      battleJoinStatus: "active_battle",
      updatedAt: now,
    });

    return {
      encounterId,
      encounterNumber,
    };
  },
});

export const submitPlayerAction = mutation({
  args: {
    encounterId: v.id("battleEncounters"),
    playerEntryId: v.id("playerEntries"),
    skillId: v.id("skillDefinitions"),
  },
  handler: async (ctx, args) => {
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

    const nextQuizAdvantage = applyStudyAdvantage(skill.category);
    await ctx.db.patch(combatant._id, {
      currentActionPoints:
        combatant.currentActionPoints - skill.actionPointCost,
      nextQuizAdvantage: nextQuizAdvantage ?? combatant.nextQuizAdvantage,
      pendingEffectIds: [...combatant.pendingEffectIds, skill.effectRule],
      lastUpdatedAt: Date.now(),
    });

    return {
      combatantStateId: combatant._id,
      nextQuizAdvantage: nextQuizAdvantage ?? combatant.nextQuizAdvantage,
      remainingActionPoints:
        combatant.currentActionPoints - skill.actionPointCost,
    };
  },
});

export const resolveEncounterRound = mutation({
  args: {
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

    const combatants = await getEncounterCombatants(ctx, encounter._id);

    const bossStates = combatants
      .filter((combatant) => combatant.combatantType === "boss")
      .map((combatant) => {
        const pendingDamage = combatant.pendingEffectIds
          .filter((effect: string) => effect.startsWith("boss_damage:"))
          .reduce(
            (sum: number, effect: string) =>
              sum + Number(effect.split(":")[1] ?? 0),
            0,
          );

        return {
          currentHealth: combatant.currentHealth,
          id: combatant._id,
          pendingHealthDelta: -pendingDamage,
          state: combatant.state,
        } as const;
      });

    const partyHeal = combatants
      .filter((combatant) => combatant.combatantType === "player")
      .flatMap((combatant) => combatant.pendingEffectIds)
      .filter((effect) => effect.startsWith("party_heal:"))
      .reduce(
        (sum: number, effect: string) =>
          sum + Number(effect.split(":")[1] ?? 0),
        0,
      );
    const partyGuard = combatants
      .filter((combatant) => combatant.combatantType === "player")
      .flatMap((combatant) => combatant.pendingEffectIds)
      .filter((effect) => effect.startsWith("party_guard:"))
      .reduce(
        (sum: number, effect: string) =>
          sum + Number(effect.split(":")[1] ?? 0),
        0,
      );
    const bossDamage = combatants
      .filter((combatant) => combatant.combatantType === "boss")
      .reduce((sum, combatant) => sum + combatant.currentActionPoints, 0);

    const resolution = resolveRoundState({
      bossStates,
      partyCurrentHealth: encounter.partyCurrentHealth,
      partyPendingHealthDelta: partyHeal - Math.max(0, bossDamage - partyGuard),
    });

    const now = Date.now();
    for (const bossState of resolution.resolvedBosses) {
      await ctx.db.patch(bossState.id as Id<"combatantStates">, {
        currentHealth: bossState.currentHealth,
        pendingEffectIds: [],
        state: bossState.state,
        currentActionPoints: 0,
        lastUpdatedAt: now,
      });
    }

    const playerCombatants = combatants.filter(
      (combatant) => combatant.combatantType === "player",
    );
    for (const player of playerCombatants) {
      const nextHealth = Math.max(
        0,
        Math.min(player.maxHealth, player.currentHealth + partyHeal),
      );
      await ctx.db.patch(player._id, {
        currentHealth: nextHealth,
        state: nextHealth === 0 ? "knocked_out" : "active",
        pendingEffectIds: [],
        currentActionPoints: player.actionPointsPerRound,
        lastUpdatedAt: now,
      });
    }

    const session = await ctx.db.get(encounter.sessionId);
    await ctx.db.patch(encounter._id, {
      battleRoundNumber: encounter.battleRoundNumber + 1,
      lastResolvedAt: now,
      partyCurrentHealth: resolution.partyHealth,
      status: resolution.encounterEnded
        ? "victory"
        : resolution.partyDefeated
          ? "defeat"
          : "active",
    });

    if (session && (resolution.encounterEnded || resolution.partyDefeated)) {
      await ctx.db.patch(session._id, {
        activeEncounterId: null,
        battleJoinStatus: "post_battle",
        updatedAt: now,
      });
    }

    return resolution;
  },
});

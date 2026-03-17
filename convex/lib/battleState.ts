import type {
  BattleSkillCategory,
  BossScalingProfile,
} from "./battleValidation";

export interface BossScalingInput {
  activePlayerCount: number;
  baseActionPointsPerRound: number;
  baseHealth: number;
  scalingProfile: BossScalingProfile;
}

export interface ResolvedCombatantState {
  currentHealth: number;
  id: string;
  pendingHealthDelta: number;
  state: "active" | "defeated" | "knocked_out";
}

export interface RoundResolutionInput {
  bossStates: ResolvedCombatantState[];
  partyCurrentHealth: number;
  partyPendingHealthDelta: number;
}

export interface DefaultBossCatalogEntry {
  baseActionPointsPerRound: number;
  baseHealth: number;
  defaultSpriteRef: string | null;
  description: string;
  name: string;
  scalingProfile: BossScalingProfile;
  skillIds: string[];
  status: "ready";
}

export function scaleBossCombatValues(input: BossScalingInput) {
  const activePlayerCount = Math.max(1, input.activePlayerCount);
  const scaledHealth =
    input.baseHealth + input.scalingProfile.healthPerPlayer * activePlayerCount;
  const bonusActionPoints =
    Math.floor(
      activePlayerCount / input.scalingProfile.actionPointsPerPlayerThreshold,
    ) * input.scalingProfile.bonusActionPoints;

  return {
    actionPointsPerRound: input.baseActionPointsPerRound + bonusActionPoints,
    maxHealth: scaledHealth,
  };
}

export function chooseFallbackSpriteKey(
  combatantName: string,
  lineupSlot: number,
) {
  const slug = combatantName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "combatant"}-${lineupSlot}`;
}

export function applyStudyAdvantage(category: BattleSkillCategory) {
  if (category !== "study") {
    return null;
  }

  return "easier_question";
}

export function resolveRoundState(input: RoundResolutionInput) {
  const resolvedBosses = input.bossStates.map((boss) => {
    const nextHealth = Math.max(
      0,
      boss.currentHealth + boss.pendingHealthDelta,
    );
    return {
      ...boss,
      currentHealth: nextHealth,
      state: nextHealth === 0 ? "defeated" : boss.state,
    };
  });

  const nextPartyHealth = Math.max(
    0,
    input.partyCurrentHealth + input.partyPendingHealthDelta,
  );

  return {
    encounterEnded: resolvedBosses.every((boss) => boss.state === "defeated"),
    partyDefeated: nextPartyHealth === 0,
    partyHealth: nextPartyHealth,
    resolvedBosses,
  };
}

export function buildDefaultBossCatalog(
  skillIds: string[],
): DefaultBossCatalogEntry[] {
  return [
    {
      name: "Chromeblood Warlord",
      description:
        "An arena tyrant in shattered power armor who scales harder as the party grows.",
      baseHealth: 28,
      baseActionPointsPerRound: 2,
      defaultSpriteRef: null,
      scalingProfile: {
        healthPerPlayer: 3,
        actionPointsPerPlayerThreshold: 4,
        bonusActionPoints: 1,
      },
      skillIds,
      status: "ready",
    },
    {
      name: "Neon Lich Overclock",
      description:
        "A cursed arcade sorcerer that bursts into extra turns once the room gets crowded.",
      baseHealth: 24,
      baseActionPointsPerRound: 3,
      defaultSpriteRef: null,
      scalingProfile: {
        healthPerPlayer: 2,
        actionPointsPerPlayerThreshold: 3,
        bonusActionPoints: 1,
      },
      skillIds,
      status: "ready",
    },
    {
      name: "Dread Cartridge Colossus",
      description:
        "A giant war machine built from haunted game carts and impossible boss-phase tricks.",
      baseHealth: 34,
      baseActionPointsPerRound: 2,
      defaultSpriteRef: null,
      scalingProfile: {
        healthPerPlayer: 4,
        actionPointsPerPlayerThreshold: 5,
        bonusActionPoints: 1,
      },
      skillIds,
      status: "ready",
    },
    {
      name: "Glitchfang Tyrant",
      description:
        "A corrupted beast king that punishes weak parties with rapid, jagged attack cycles.",
      baseHealth: 22,
      baseActionPointsPerRound: 3,
      defaultSpriteRef: null,
      scalingProfile: {
        healthPerPlayer: 2,
        actionPointsPerPlayerThreshold: 2,
        bonusActionPoints: 1,
      },
      skillIds,
      status: "ready",
    },
    {
      name: "Iron Cathedral Revenant",
      description:
        "A resurrected final boss wrapped in steel choirs, heavy defense, and slow crushing hits.",
      baseHealth: 30,
      baseActionPointsPerRound: 2,
      defaultSpriteRef: null,
      scalingProfile: {
        healthPerPlayer: 3,
        actionPointsPerPlayerThreshold: 6,
        bonusActionPoints: 2,
      },
      skillIds,
      status: "ready",
    },
  ];
}

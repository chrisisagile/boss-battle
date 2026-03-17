export const battleSkillCategories = [
  "attack",
  "heal",
  "defend",
  "study",
] as const;

export type BattleSkillCategory = (typeof battleSkillCategories)[number];

export interface BossScalingProfile {
  healthPerPlayer: number;
  actionPointsPerPlayerThreshold: number;
  bonusActionPoints: number;
}

export function isBattleSkillCategory(
  value: string,
): value is BattleSkillCategory {
  return battleSkillCategories.includes(value as BattleSkillCategory);
}

export function normalizeSpriteRef(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateBossScalingProfile(profile: BossScalingProfile) {
  if (
    !Number.isInteger(profile.healthPerPlayer) ||
    profile.healthPerPlayer < 0
  ) {
    return "Boss scaling health bonus must be a whole number greater than or equal to 0.";
  }

  if (
    !Number.isInteger(profile.actionPointsPerPlayerThreshold) ||
    profile.actionPointsPerPlayerThreshold < 1
  ) {
    return "Boss action-point scaling threshold must be at least 1 player.";
  }

  if (
    !Number.isInteger(profile.bonusActionPoints) ||
    profile.bonusActionPoints < 0
  ) {
    return "Boss bonus action points must be a whole number greater than or equal to 0.";
  }

  return null;
}

export function validateEncounterBossSelection(bossDefinitionIds: string[]) {
  if (bossDefinitionIds.length === 0) {
    return "Choose at least one eligible boss before starting a battle.";
  }

  const uniqueIds = new Set(bossDefinitionIds);
  if (uniqueIds.size !== bossDefinitionIds.length) {
    return "Each boss can only appear once in the encounter lineup.";
  }

  return null;
}

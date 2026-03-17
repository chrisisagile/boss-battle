import { describe, expect, it } from "vitest";
import {
  applyStudyAdvantage,
  buildDefaultBossCatalog,
  chooseFallbackSpriteKey,
  resolveRoundState,
  scaleBossCombatValues,
} from "./lib/battleState";
import {
  isBattleSkillCategory,
  validateBossScalingProfile,
  validateEncounterBossSelection,
} from "./lib/battleValidation";

describe("battleValidation", () => {
  it("accepts supported battle skill categories", () => {
    expect(isBattleSkillCategory("attack")).toBe(true);
    expect(isBattleSkillCategory("study")).toBe(true);
  });

  it("rejects invalid boss scaling profiles", () => {
    expect(
      validateBossScalingProfile({
        actionPointsPerPlayerThreshold: 0,
        bonusActionPoints: 1,
        healthPerPlayer: 2,
      }),
    ).toContain("threshold");
  });

  it("rejects empty encounter boss selection", () => {
    expect(validateEncounterBossSelection([])).toContain(
      "at least one eligible boss",
    );
  });
});

describe("battleState helpers", () => {
  it("scales boss health and action points by active player count", () => {
    expect(
      scaleBossCombatValues({
        activePlayerCount: 5,
        baseActionPointsPerRound: 2,
        baseHealth: 24,
        scalingProfile: {
          actionPointsPerPlayerThreshold: 4,
          bonusActionPoints: 1,
          healthPerPlayer: 3,
        },
      }),
    ).toEqual({
      actionPointsPerRound: 3,
      maxHealth: 39,
    });
  });

  it("creates deterministic fallback sprite keys", () => {
    expect(chooseFallbackSpriteKey("Obsidian Hydra", 2)).toBe(
      "obsidian-hydra-2",
    );
  });

  it("marks study skills with a next-round advantage", () => {
    expect(applyStudyAdvantage("study")).toBe("easier_question");
    expect(applyStudyAdvantage("attack")).toBeNull();
  });

  it("builds a starter boss catalog with five retro boss definitions", () => {
    const bosses = buildDefaultBossCatalog(["skill_attack", "skill_heal"]);

    expect(bosses).toHaveLength(5);
    expect(bosses.map((boss) => boss.name)).toEqual([
      "Chromeblood Warlord",
      "Neon Lich Overclock",
      "Dread Cartridge Colossus",
      "Glitchfang Tyrant",
      "Iron Cathedral Revenant",
    ]);
    expect(bosses.every((boss) => boss.skillIds.length === 2)).toBe(true);
    expect(bosses.every((boss) => boss.status === "ready")).toBe(true);
  });

  it("ends the encounter immediately when all bosses are defeated", () => {
    expect(
      resolveRoundState({
        bossStates: [
          {
            currentHealth: 4,
            id: "boss_1",
            pendingHealthDelta: -4,
            state: "active",
          },
        ],
        partyCurrentHealth: 10,
        partyPendingHealthDelta: 0,
      }),
    ).toMatchObject({
      encounterEnded: true,
      partyDefeated: false,
      partyHealth: 10,
    });
  });

  it("applies same-round healing or defense before declaring party defeat", () => {
    expect(
      resolveRoundState({
        bossStates: [
          {
            currentHealth: 6,
            id: "boss_1",
            pendingHealthDelta: 0,
            state: "active",
          },
        ],
        partyCurrentHealth: 2,
        partyPendingHealthDelta: 1,
      }),
    ).toMatchObject({
      encounterEnded: false,
      partyDefeated: false,
      partyHealth: 3,
    });
  });
});

import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import { buildBattleActivityFeed } from "./battleFeed";
import {
  STANDARD_BOSS_DAMAGE_MULTIPLIER,
  STANDARD_PLAYER_MAX_HEALTH,
} from "./battleState";

function asId<
  TableName extends
    | "battleExchanges"
    | "combatantStates"
    | "battleEncounters"
    | "gameRounds",
>(value: string) {
  return value as Id<TableName>;
}

describe("battleFeed helpers", () => {
  it("returns null when a legacy exchange does not have activity events", () => {
    const feed = buildBattleActivityFeed({
      _creationTime: 0,
      _id: asId<"battleExchanges">("exchange_legacy"),
      bossActionSummary: [],
      encounterId: asId<"battleEncounters">("encounter_1"),
      exchangeNumber: 1,
      playerActions: [],
      playerTurnOrder: [],
      resolvedAt: 1,
      roundId: asId<"gameRounds">("round_1"),
      status: "resolved",
    });

    expect(feed).toBeNull();
  });

  it("returns the current event plus recent history for one exchange", () => {
    const feed = buildBattleActivityFeed({
      _creationTime: 0,
      _id: asId<"battleExchanges">("exchange_1"),
      activityEvents: [
        {
          actionLabel: "Boss Strike",
          actorCombatantId: asId<"combatantStates">("boss_1"),
          actorName: "Hydra",
          actorType: "boss",
          eventNumber: 1,
          magnitude: 2,
          outcomeType: "damage",
          resultingTargetHealth: 14,
          resultingTargetState: "active",
          summaryText: "Hydra hits Ari for 2 damage.",
          targetCombatantId: asId<"combatantStates">("player_1"),
          targetName: "Ari",
        },
        {
          actionLabel: "Rally Heal",
          actorCombatantId: asId<"combatantStates">("player_2"),
          actorName: "Mina",
          actorType: "player",
          eventNumber: 2,
          magnitude: 3,
          outcomeType: "heal",
          resultingTargetHealth: 17,
          resultingTargetState: "active",
          summaryText: "Mina heals Ari for 3 health.",
          targetCombatantId: asId<"combatantStates">("player_1"),
          targetName: "Ari",
        },
      ],
      bossActionSummary: [],
      encounterId: asId<"battleEncounters">("encounter_1"),
      exchangeNumber: 1,
      playerActions: [],
      playerTurnOrder: [],
      resolvedAt: 1,
      roundId: asId<"gameRounds">("round_1"),
      status: "resolved",
    });

    expect(feed?.currentEvent?.summaryText).toContain("heals Ari");
    expect(feed?.recentEvents).toHaveLength(1);
    expect(feed?.recentEvents[0]?.summaryText).toContain("hits Ari");
  });
});

describe("battle constants", () => {
  it("keeps the rebalanced default player durability and boss pressure", () => {
    expect(STANDARD_PLAYER_MAX_HEALTH).toBe(16);
    expect(STANDARD_BOSS_DAMAGE_MULTIPLIER).toBe(1);
  });
});

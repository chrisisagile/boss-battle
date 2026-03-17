import type { Doc, Id } from "../_generated/dataModel";

export type BattleActivityOutcomeType =
  | "damage"
  | "heal"
  | "guard"
  | "miss"
  | "skipped"
  | "knockout"
  | "status";

export interface BattleActivityFeedItem {
  actionLabel: string;
  actorCombatantId: Id<"combatantStates">;
  actorName: string;
  actorType: "boss" | "player";
  eventNumber: number;
  magnitude: number;
  outcomeType: BattleActivityOutcomeType;
  resultingTargetHealth: number | null;
  resultingTargetState: string | null;
  summaryText: string;
  targetCombatantId: Id<"combatantStates"> | null;
  targetName: string | null;
}

export function buildBattleActivityFeed(
  exchange: Doc<"battleExchanges"> | null | undefined,
  recentHistoryLimit = 3,
) {
  const activityEvents = exchange?.activityEvents ?? [];

  if (!exchange || activityEvents.length === 0) {
    return null;
  }

  const orderedEvents = [...activityEvents].sort(
    (left, right) => left.eventNumber - right.eventNumber,
  );
  const currentEvent = orderedEvents.at(-1) ?? null;
  const recentEvents = orderedEvents.slice(
    Math.max(0, orderedEvents.length - (recentHistoryLimit + 1)),
    -1,
  );

  return {
    currentEvent,
    exchangeId: exchange._id,
    exchangeNumber: exchange.exchangeNumber,
    recentEvents,
    status: exchange.status,
  };
}

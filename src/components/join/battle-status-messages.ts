import type { JoinErrorCode } from "@/integrations/convex/join";
import { JOIN_ERROR_CODES } from "@/integrations/convex/join";

export function getBattleErrorMessage(
  code: JoinErrorCode | null,
  fallback: string,
) {
  switch (code) {
    case JOIN_ERROR_CODES.invalidBattleConfig:
      return "Choose at least one valid boss and a playable lineup before starting the battle.";
    case JOIN_ERROR_CODES.noActiveEncounter:
      return "There is no active battle state to update right now.";
    case JOIN_ERROR_CODES.invalidBattleAction:
      return "That battle action is not available for this combatant.";
    case JOIN_ERROR_CODES.insufficientActionPoints:
      return "This combatant does not have enough action points for that skill.";
    case JOIN_ERROR_CODES.battleJoinBlocked:
      return "The current battle must finish before a new player can enter.";
    default:
      return fallback;
  }
}

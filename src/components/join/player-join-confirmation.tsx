import { PlayerProfileCard } from "@/components/ui/8bit/player-profile-card";

interface PlayerJoinConfirmationProps {
  currentRoundNumber: number;
  displayName: string;
  eligibleFromRoundNumber: number;
}

export function PlayerJoinConfirmation({
  currentRoundNumber,
  displayName,
  eligibleFromRoundNumber,
}: PlayerJoinConfirmationProps) {
  const waitingForNextRound = eligibleFromRoundNumber > currentRoundNumber;

  return (
    <PlayerProfileCard
      status={waitingForNextRound ? "Queued" : "Joined"}
      heading={
        waitingForNextRound ? "You are in the party." : "You are battle-ready."
      }
      name={displayName}
      detail={
        waitingForNextRound
          ? `You joined during an active turn. Your actions unlock in round ${eligibleFromRoundNumber}.`
          : "Stay on this screen and watch the projector for the next prompt."
      }
    />
  );
}

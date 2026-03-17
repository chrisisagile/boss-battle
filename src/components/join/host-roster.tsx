import { FriendList } from "@/components/ui/8bit/friend-list";

interface HostRosterPlayer {
  _id: string;
  displayName: string;
  eligibleFromRoundNumber: number;
}

interface HostRosterProps {
  currentRoundNumber: number;
  players: HostRosterPlayer[];
}

export function HostRoster({ currentRoundNumber, players }: HostRosterProps) {
  return (
    <FriendList
      title={`Joined Players (${players.length})`}
      emptyLabel="No one has joined yet. Keep the lobby on screen and let the room scan in."
      items={players.map((player) => ({
        id: player._id,
        label: player.displayName,
        detail:
          player.eligibleFromRoundNumber > currentRoundNumber
            ? `Round ${player.eligibleFromRoundNumber}`
            : "Ready now",
      }))}
    />
  );
}

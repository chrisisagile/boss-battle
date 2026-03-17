import type { LeaderboardPlayer } from "@/components/ui/8bit/blocks/leaderboard";
import { Leaderboard } from "@/components/ui/8bit/blocks/leaderboard";

interface QuizPointsLeaderboardProps {
  players: LeaderboardPlayer[];
}

export function QuizPointsLeaderboard({ players }: QuizPointsLeaderboardProps) {
  return (
    <Leaderboard
      players={players}
      showAvatar={false}
      title="QUIZ POINTS EARNED"
    />
  );
}

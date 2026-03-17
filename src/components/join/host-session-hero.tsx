import { ChapterIntro } from "@/components/ui/8bit/chapter-intro";
import { JoinQrCard } from "./join-qr-card";

interface HostSessionHeroProps {
  activeRound: {
    questionsCompleted: number;
    questionTarget: number;
    roundNumber: number;
  } | null;
  joinCode: string;
  joinUrl: string;
  joinedPlayerCount: number;
  joinStatus: "open" | "closed";
  lateJoinerCount: number;
}

export function HostSessionHero({
  activeRound,
  joinCode,
  joinStatus,
  joinUrl,
  joinedPlayerCount,
  lateJoinerCount,
}: HostSessionHeroProps) {
  return (
    <ChapterIntro
      kicker="Live Lobby"
      title={
        activeRound
          ? `Round ${activeRound.roundNumber} is underway.`
          : joinStatus === "open"
            ? "Adventurers may still enter."
            : "Joining is closed for this battle."
      }
      description={
        activeRound
          ? `Question ${activeRound.questionsCompleted + 1} is now live on the shared projector. ${activeRound.questionTarget - activeRound.questionsCompleted} question${activeRound.questionTarget - activeRound.questionsCompleted === 1 ? "" : "s"} remain in this round.`
          : `Project the code, keep the room moving, and watch the roster grow in real time. ${joinedPlayerCount} players are in the party${lateJoinerCount > 0 ? ` and ${lateJoinerCount} will activate next round.` : "."}`
      }
    >
      <JoinQrCard joinCode={joinCode} joinUrl={joinUrl} />
    </ChapterIntro>
  );
}

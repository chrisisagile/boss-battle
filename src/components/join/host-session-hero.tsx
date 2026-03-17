import { ChapterIntro } from "@/components/ui/8bit/chapter-intro";
import { JoinQrCard } from "./join-qr-card";

interface HostSessionHeroProps {
  joinCode: string;
  joinUrl: string;
  joinedPlayerCount: number;
  joinStatus: "open" | "closed";
  lateJoinerCount: number;
}

export function HostSessionHero({
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
        joinStatus === "open"
          ? "Adventurers may still enter."
          : "Joining is closed for this battle."
      }
      description={`Project the code, keep the room moving, and watch the roster grow in real time. ${joinedPlayerCount} players are in the party${lateJoinerCount > 0 ? ` and ${lateJoinerCount} will activate next round.` : "."}`}
    >
      <JoinQrCard joinCode={joinCode} joinUrl={joinUrl} />
    </ChapterIntro>
  );
}

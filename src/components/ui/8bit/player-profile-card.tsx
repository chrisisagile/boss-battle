import { PlayerProfileCardBlock } from "@/components/ui/8bit/blocks/player-profile-card";
import { cn } from "@/lib/utils";

interface PlayerProfileCardProps {
  className?: string;
  detail: string;
  heading: string;
  name: string;
  status: string;
}

export function PlayerProfileCard({
  className,
  detail,
  heading,
  name,
  status,
}: PlayerProfileCardProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
        {status}
      </p>
      <PlayerProfileCardBlock
        className="max-w-none"
        playerClass={heading}
        playerName={name}
        showExperience={false}
        showHealth={false}
        showLevel={false}
        showMana={false}
      />
      <p className="text-muted-foreground text-sm leading-6">{detail}</p>
    </section>
  );
}

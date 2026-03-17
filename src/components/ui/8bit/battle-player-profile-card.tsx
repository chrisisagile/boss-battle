import { PlayerProfileCardBlock } from "@/components/ui/8bit/blocks/player-profile-card";
import { BattleActionPointBar, BattleHealthBar } from "./battle-health-bar";

interface BattlePlayerProfileCardProps {
  currentActionPoints: number;
  currentHealth: number;
  detail: string;
  heading: string;
  maxActionPoints: number;
  maxHealth: number;
  name: string;
  status: string;
}

export function BattlePlayerProfileCard({
  currentActionPoints,
  currentHealth,
  detail,
  heading,
  maxActionPoints,
  maxHealth,
  name,
  status,
}: BattlePlayerProfileCardProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
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
      </div>
      <BattlePlayerMeters
        currentActionPoints={currentActionPoints}
        currentHealth={currentHealth}
        maxActionPoints={maxActionPoints}
        maxHealth={maxHealth}
      />
    </section>
  );
}

interface BattlePlayerMetersProps {
  currentActionPoints: number;
  currentHealth: number;
  maxActionPoints: number;
  maxHealth: number;
}

export function BattlePlayerMeters({
  currentActionPoints,
  currentHealth,
  maxActionPoints,
  maxHealth,
}: BattlePlayerMetersProps) {
  return (
    <div className="space-y-3">
      <BattleHealthBar current={currentHealth} label="Health" max={maxHealth} />
      <BattleActionPointBar
        current={currentActionPoints}
        max={maxActionPoints}
      />
    </div>
  );
}

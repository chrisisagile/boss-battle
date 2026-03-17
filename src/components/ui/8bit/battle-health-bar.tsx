import { HealthBar } from "@/components/ui/8bit/health-bar";
import { ManaBar } from "@/components/ui/8bit/mana-bar";
import { cn } from "@/lib/utils";

interface BattleHealthBarProps {
  className?: string;
  current: number;
  label: string;
  max: number;
}

export function BattleHealthBar({
  className,
  current,
  label,
  max,
}: BattleHealthBarProps) {
  const percentage = getMeterPercentage(current, max);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="retro text-[10px] text-muted-foreground">
          {current}/{max}
        </span>
      </div>
      <HealthBar className="h-4" value={percentage} variant="retro" />
    </div>
  );
}

interface BattleActionPointBarProps {
  className?: string;
  current: number;
  max: number;
}

export function BattleActionPointBar({
  className,
  current,
  max,
}: BattleActionPointBarProps) {
  const percentage = getMeterPercentage(current, max);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span>Action Points</span>
        <span className="retro text-[10px] text-muted-foreground">
          {current}/{max}
        </span>
      </div>
      <ManaBar className="h-4" value={percentage} variant="retro" />
    </div>
  );
}

function getMeterPercentage(current: number, max: number) {
  const safeMax = Math.max(1, max);
  return Math.max(0, Math.min(100, Math.round((current / safeMax) * 100)));
}

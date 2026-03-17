import { BattlePlayerProfileCard } from "@/components/ui/8bit/battle-player-profile-card";
import { Button } from "@/components/ui/8bit/button";

interface AvailableSkill {
  actionPointCost: number;
  available: boolean;
  category: string;
  id: string;
  name: string;
}

interface PlayerBattleProfileProps {
  availableSkills: AvailableSkill[];
  currentActionPoints: number;
  currentHealth: number;
  errorMessage?: string | null;
  maxActionPoints: number;
  maxHealth: number;
  name: string;
  nextQuizAdvantage?: string | null;
  onUseSkill: (skillId: string) => void;
  state: "active" | "knocked_out" | "defeated";
}

export function PlayerBattleProfile({
  availableSkills,
  currentActionPoints,
  currentHealth,
  errorMessage = null,
  maxActionPoints,
  maxHealth,
  name,
  nextQuizAdvantage,
  onUseSkill,
  state,
}: PlayerBattleProfileProps) {
  const knockedOut = state === "knocked_out";
  const detail = knockedOut
    ? "You are knocked out. Wait for a heal or revive before choosing another action."
    : nextQuizAdvantage === "easier_question"
      ? "Your next quiz question will be easier."
      : "Choose a battle skill between quiz prompts.";

  return (
    <section className="space-y-5">
      <BattlePlayerProfileCard
        currentActionPoints={currentActionPoints}
        currentHealth={currentHealth}
        detail={detail}
        heading={knockedOut ? "Waiting for revival" : "Battle-ready"}
        maxActionPoints={maxActionPoints}
        maxHealth={maxHealth}
        name={name}
        status={knockedOut ? "Knocked Out" : "Active"}
      />

      <div className="border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-5 text-stone-50 shadow-[8px_8px_0_0_rgba(18,12,8,0.45)]">
        <h3 className="font-black text-xl">Available Skills</h3>
        <div className="mt-4 grid gap-3">
          {availableSkills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between gap-3 border-4 border-black/70 bg-black/20 px-4 py-3"
            >
              <div>
                <p className="font-bold text-base">{skill.name}</p>
                <p className="text-amber-200 text-xs uppercase tracking-[0.2em]">
                  {skill.category} • {skill.actionPointCost} AP
                </p>
              </div>
              <Button
                disabled={!skill.available || knockedOut}
                font="retro"
                type="button"
                onClick={() => onUseSkill(skill.id)}
              >
                Use
              </Button>
            </div>
          ))}
        </div>
        {errorMessage ? (
          <p className="mt-4 text-rose-300 text-sm">{errorMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

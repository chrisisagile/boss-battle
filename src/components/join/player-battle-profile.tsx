import { useState } from "react";
import { BattlePlayerProfileCard } from "@/components/ui/8bit/battle-player-profile-card";
import { Button } from "@/components/ui/8bit/button";

interface AvailableSkill {
  actionPointCost: number;
  available: boolean;
  category: string;
  id: string;
  name: string;
  targetScope?: string;
}

interface AvailableTarget {
  combatantType: "boss" | "player";
  displayName: string;
  id: string;
}

interface PlayerBattleProfileProps {
  availableSkills: AvailableSkill[];
  availableTargets?: AvailableTarget[];
  currentActionPoints: number;
  currentHealth: number;
  errorMessage?: string | null;
  maxActionPoints: number;
  maxHealth: number;
  name: string;
  nextQuizAdvantage?: string | null;
  onUseSkill: (skillId: string, targetId?: string | null) => void;
  state: "active" | "knocked_out" | "defeated";
}

export function PlayerBattleProfile({
  availableSkills,
  availableTargets = [],
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
  const [selectedTargets, setSelectedTargets] = useState<
    Record<string, string>
  >({});
  const knockedOut = state === "knocked_out";
  const detail = knockedOut
    ? "You are knocked out. Wait for a heal or revive before choosing another action."
    : nextQuizAdvantage === "easier_question"
      ? "Your next quiz question will be easier."
      : "Choose a battle skill between quiz prompts.";

  function getTargetsForSkill(skill: AvailableSkill) {
    switch (skill.targetScope) {
      case "enemy":
        return availableTargets.filter(
          (target) => target.combatantType === "boss",
        );
      case "party":
        return availableTargets.filter(
          (target) => target.combatantType === "player",
        );
      case "self":
        return [];
      default:
        return [];
    }
  }

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
          {availableSkills.map((skill) => {
            const matchingTargets = getTargetsForSkill(skill);
            const selectedTargetId =
              selectedTargets[skill.id] ?? matchingTargets[0]?.id ?? "";
            const requiresTarget =
              skill.targetScope === "enemy" || skill.targetScope === "party";

            return (
              <div
                key={skill.id}
                className="flex flex-col gap-3 border-4 border-black/70 bg-black/20 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-bold text-base">{skill.name}</p>
                  <p className="text-amber-200 text-xs uppercase tracking-[0.2em]">
                    {skill.category} • {skill.actionPointCost} AP
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  {requiresTarget ? (
                    <label className="flex flex-col gap-1 text-stone-200 text-xs uppercase tracking-[0.18em]">
                      Target
                      <select
                        className="border-2 border-black/70 bg-stone-950 px-2 py-2 text-sm text-stone-50"
                        disabled={!skill.available || knockedOut}
                        value={selectedTargetId}
                        onChange={(event) => {
                          setSelectedTargets((current) => ({
                            ...current,
                            [skill.id]: event.target.value,
                          }));
                        }}
                      >
                        {matchingTargets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <Button
                    disabled={
                      !skill.available ||
                      knockedOut ||
                      (requiresTarget && matchingTargets.length === 0)
                    }
                    font="retro"
                    type="button"
                    onClick={() =>
                      onUseSkill(
                        skill.id,
                        skill.targetScope === "self"
                          ? null
                          : selectedTargetId || null,
                      )
                    }
                  >
                    Use
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {errorMessage ? (
          <p className="mt-4 text-rose-300 text-sm">{errorMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

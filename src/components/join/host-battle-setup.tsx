import { useMemo, useState } from "react";
import { Button } from "@/components/ui/8bit/button";

interface BossCatalogEntry {
  _id: string;
  baseActionPointsPerRound: number;
  baseHealth: number;
  description: string;
  name: string;
}

interface HostBattleSetupProps {
  bossCatalog: BossCatalogEntry[];
  busy?: boolean;
  errorMessage?: string | null;
  onStartEncounter: (bossDefinitionIds: string[]) => void;
}

export function HostBattleSetup({
  bossCatalog,
  busy = false,
  errorMessage = null,
  onStartEncounter,
}: HostBattleSetupProps) {
  const [selectedBossIds, setSelectedBossIds] = useState<string[]>(() =>
    bossCatalog.length > 0 ? [bossCatalog[0]._id] : [],
  );

  const selectedCountLabel = useMemo(
    () =>
      `${selectedBossIds.length} boss${selectedBossIds.length === 1 ? "" : "es"} selected`,
    [selectedBossIds.length],
  );

  return (
    <section className="border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-6 text-stone-50 shadow-[10px_10px_0_0_rgba(18,12,8,0.55)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
            Encounter Setup
          </p>
          <h2 className="mt-2 font-black text-3xl">Choose the boss lineup</h2>
          <p className="mt-3 text-sm text-stone-300">{selectedCountLabel}</p>
        </div>
        <Button
          disabled={busy || selectedBossIds.length === 0}
          font="retro"
          type="button"
          onClick={() => onStartEncounter(selectedBossIds)}
        >
          {busy ? "Starting..." : "Start Battle"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bossCatalog.map((boss) => {
          const selected = selectedBossIds.includes(boss._id);
          return (
            <label
              key={boss._id}
              className={`flex cursor-pointer flex-col gap-3 border-4 px-4 py-4 transition-colors ${
                selected
                  ? "border-amber-300 bg-amber-500/15"
                  : "border-black/70 bg-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-xl">{boss.name}</h3>
                  <p className="mt-2 text-sm text-stone-300 leading-6">
                    {boss.description}
                  </p>
                </div>
                <input
                  aria-label={`Select ${boss.name}`}
                  checked={selected}
                  type="checkbox"
                  onChange={() => {
                    setSelectedBossIds((current) =>
                      selected
                        ? current.filter((id) => id !== boss._id)
                        : [...current, boss._id],
                    );
                  }}
                />
              </div>
              <p className="text-amber-200 text-xs uppercase tracking-[0.2em]">
                HP {boss.baseHealth} • AP {boss.baseActionPointsPerRound}
              </p>
            </label>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="mt-4 text-rose-300 text-sm">{errorMessage}</p>
      ) : null}
    </section>
  );
}

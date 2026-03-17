import {
  BattleCharacterSheet,
  BattleEnemyHealthDisplay,
} from "@/components/ui/8bit/battle-character-sheet";
import { BattleHealthBar } from "@/components/ui/8bit/battle-health-bar";
import type { BattleDialogueFeedData } from "./battle-dialogue-feed";
import { BattleDialogueFeed } from "./battle-dialogue-feed";

interface PartySummary {
  activePlayers: number;
  currentHealth: number;
  knockedOutPlayers: number;
  maxHealth: number;
}

interface BossCombatant {
  currentActionPoints: number;
  currentHealth: number;
  displayName: string;
  fallbackSpriteKey?: string | null;
  id: string;
  maxHealth: number;
  spriteRef?: string | null;
  state: string;
}

interface PartyCombatant {
  currentActionPoints: number;
  currentHealth: number;
  displayName: string;
  fallbackSpriteKey?: string | null;
  id: string;
  maxActionPoints: number;
  maxHealth: number;
  state: string;
}

interface HostBattleArenaProps {
  battleRoundNumber: number;
  battleActivity?: BattleDialogueFeedData | null;
  bossLineup: BossCombatant[];
  partyCombatants?: PartyCombatant[];
  partySummary: PartySummary;
}

export function HostBattleArena({
  battleActivity = null,
  battleRoundNumber,
  bossLineup,
  partyCombatants = [],
  partySummary,
}: HostBattleArenaProps) {
  return (
    <section className="boss-grid border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-6 text-stone-50 shadow-[10px_10px_0_0_rgba(18,12,8,0.55)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
            Battle Arena
          </p>
          <h2 className="mt-2 font-black text-3xl">
            Round {battleRoundNumber}
          </h2>
        </div>
        <div className="text-right text-sm text-stone-300">
          <p>{partySummary.activePlayers} active heroes</p>
          <p>{partySummary.knockedOutPlayers} knocked out</p>
        </div>
      </div>

      <div className="mt-6">
        <BattleHealthBar
          current={partySummary.currentHealth}
          label="Party Health"
          max={partySummary.maxHealth}
        />
      </div>

      {partyCombatants.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partyCombatants.map((combatant) => (
            <BattleCharacterSheet
              key={combatant.id}
              currentActionPoints={combatant.currentActionPoints}
              currentHealth={combatant.currentHealth}
              detail="Party combatant"
              fallbackSpriteKey={combatant.fallbackSpriteKey}
              maxActionPoints={combatant.maxActionPoints}
              maxHealth={combatant.maxHealth}
              name={combatant.displayName}
              status={combatant.state}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bossLineup.map((boss) => (
          <BattleEnemyHealthDisplay
            key={boss.id}
            currentActionPoints={boss.currentActionPoints}
            currentHealth={boss.currentHealth}
            fallbackSpriteKey={boss.fallbackSpriteKey}
            maxActionPoints={boss.currentActionPoints}
            maxHealth={boss.maxHealth}
            name={boss.displayName}
            spriteRef={boss.spriteRef}
            status={boss.state}
          />
        ))}
      </div>

      <BattleDialogueFeed
        className="mt-8"
        currentEvent={battleActivity?.currentEvent ?? null}
        recentEvents={battleActivity?.recentEvents ?? []}
      />
    </section>
  );
}

import { CharacterSheet } from "@/components/ui/8bit/blocks/character-sheet";
import { BattleActionPointBar, BattleHealthBar } from "./battle-health-bar";

interface BattleCharacterSheetProps {
  currentActionPoints: number;
  currentHealth: number;
  detail?: string;
  fallbackSpriteKey?: string | null;
  maxActionPoints: number;
  maxHealth: number;
  name: string;
  spriteRef?: string | null;
  status: string;
}

export function BattleCharacterSheet({
  currentActionPoints,
  currentHealth,
  detail,
  fallbackSpriteKey,
  maxActionPoints,
  maxHealth,
  name,
  spriteRef,
  status,
}: BattleCharacterSheetProps) {
  return (
    <CharacterSheet
      avatarFallback={getAvatarFallback(name, fallbackSpriteKey)}
      avatarSrc={spriteRef ?? undefined}
      characterClass={status}
      characterName={name}
      characterTitle={detail}
      className="w-full"
      customSections={[
        {
          content: (
            <div className="space-y-3">
              <BattleHealthBar
                current={currentHealth}
                label="Health"
                max={maxHealth}
              />
              <BattleActionPointBar
                current={currentActionPoints}
                max={maxActionPoints}
              />
            </div>
          ),
          title: "Battle Meters",
        },
      ]}
      font="retro"
      showAttributes={false}
      showEquipment={false}
      showExperience={false}
      showHealth={false}
      showMana={false}
      showSecondaryStats={false}
    />
  );
}

interface BattleEnemyHealthDisplayProps {
  currentActionPoints: number;
  currentHealth: number;
  fallbackSpriteKey?: string | null;
  maxActionPoints: number;
  maxHealth: number;
  name: string;
  spriteRef?: string | null;
  status: string;
}

export function BattleEnemyHealthDisplay(props: BattleEnemyHealthDisplayProps) {
  return <BattleCharacterSheet {...props} detail="Enemy combatant" />;
}

function getAvatarFallback(name: string, fallbackSpriteKey?: string | null) {
  if (fallbackSpriteKey && fallbackSpriteKey.trim().length > 0) {
    return fallbackSpriteKey.trim().slice(0, 2).toUpperCase();
  }

  return name.trim().slice(0, 2).toUpperCase();
}

import { describe, expect, it } from "vitest";
import { ActiveThemeProvider } from "@/components/ui/8bit/active-theme";
import { renderApp, screen } from "@/test/render";
import {
  battlePartySummaryFixture,
  bossCombatantFixture,
  playerCombatantFixture,
} from "@/test/session-fixtures";
import { HostBattleArena } from "./host-battle-arena";

describe("HostBattleArena", () => {
  it("renders party health and boss lineup details", () => {
    renderApp(
      <ActiveThemeProvider>
        <HostBattleArena
          battleRoundNumber={2}
          bossLineup={[bossCombatantFixture]}
          partyCombatants={[
            {
              currentActionPoints: playerCombatantFixture.currentActionPoints,
              currentHealth: playerCombatantFixture.currentHealth,
              displayName: playerCombatantFixture.displayName,
              fallbackSpriteKey: playerCombatantFixture.fallbackSpriteKey,
              id: playerCombatantFixture.id,
              maxActionPoints: 3,
              maxHealth: playerCombatantFixture.maxHealth,
              state: playerCombatantFixture.state,
            },
          ]}
          partySummary={battlePartySummaryFixture}
        />
      </ActiveThemeProvider>,
    );

    expect(screen.getByText("Battle Arena")).toBeInTheDocument();
    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getByText("Party Health")).toBeInTheDocument();
    expect(screen.getByText("Obsidian Hydra")).toBeInTheDocument();
    expect(screen.getByText("Ari")).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import { ActiveThemeProvider } from "@/components/ui/8bit/active-theme";
import { renderApp, screen } from "@/test/render";
import {
  battlePartySummaryFixture,
  bossCombatantFixture,
  hostOverviewFixture,
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

  it("renders the current action and recent battle history", () => {
    renderApp(
      <ActiveThemeProvider>
        <HostBattleArena
          battleActivity={hostOverviewFixture.battleActivity}
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

    expect(
      screen.getByRole("heading", { name: "Battle Dialogue" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mina uses Rally Heal on Ari/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Obsidian Hydra uses Boss Strike on Ari/i),
    ).toBeInTheDocument();
  });

  it("shows active and knocked-out hero counts for the host projector", () => {
    renderApp(
      <ActiveThemeProvider>
        <HostBattleArena
          battleRoundNumber={3}
          bossLineup={[bossCombatantFixture]}
          partyCombatants={[
            {
              currentActionPoints: 0,
              currentHealth: 0,
              displayName: "Jules",
              fallbackSpriteKey: "player-jules",
              id: "combatant_player_2",
              maxActionPoints: 3,
              maxHealth: 10,
              state: "knocked_out",
            },
          ]}
          partySummary={{
            ...battlePartySummaryFixture,
            activePlayers: 1,
            knockedOutPlayers: 1,
          }}
        />
      </ActiveThemeProvider>,
    );

    expect(screen.getByText("1 active heroes")).toBeInTheDocument();
    expect(screen.getByText("1 knocked out")).toBeInTheDocument();
    expect(screen.getByText("Jules")).toBeInTheDocument();
  });
});

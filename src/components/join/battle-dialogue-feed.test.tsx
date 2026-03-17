import { describe, expect, it } from "vitest";
import { ActiveThemeProvider } from "@/components/ui/8bit/active-theme";
import { renderApp, screen } from "@/test/render";
import { hostOverviewFixture } from "@/test/session-fixtures";
import { BattleDialogueFeed } from "./battle-dialogue-feed";

describe("BattleDialogueFeed", () => {
  it("renders the current action and recent history entries", () => {
    renderApp(
      <ActiveThemeProvider>
        <BattleDialogueFeed
          currentEvent={hostOverviewFixture.battleActivity.currentEvent}
          recentEvents={hostOverviewFixture.battleActivity.recentEvents}
        />
      </ActiveThemeProvider>,
    );

    expect(screen.getByText("Current action")).toBeInTheDocument();
    expect(
      screen.getByText(/Mina uses Rally Heal on Ari/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Recent history")).toBeInTheDocument();
    expect(
      screen.getByText(/Obsidian Hydra uses Boss Strike on Ari/i),
    ).toBeInTheDocument();
  });

  it("shows an empty-state message when no battle activity exists", () => {
    renderApp(
      <ActiveThemeProvider>
        <BattleDialogueFeed currentEvent={null} recentEvents={[]} />
      </ActiveThemeProvider>,
    );

    expect(
      screen.getByText("Waiting for battle activity."),
    ).toBeInTheDocument();
  });
});

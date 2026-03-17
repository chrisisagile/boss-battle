import { describe, expect, it, vi } from "vitest";
import { ActiveThemeProvider } from "@/components/ui/8bit/active-theme";
import { renderApp, screen } from "@/test/render";
import { playerCombatantFixture } from "@/test/session-fixtures";
import { PlayerBattleProfile } from "./player-battle-profile";

describe("PlayerBattleProfile", () => {
  it("shows available skills for an active player", () => {
    const onUseSkill = vi.fn();

    renderApp(
      <ActiveThemeProvider>
        <PlayerBattleProfile
          availableSkills={[...playerCombatantFixture.availableSkills]}
          currentActionPoints={playerCombatantFixture.currentActionPoints}
          currentHealth={playerCombatantFixture.currentHealth}
          maxActionPoints={3}
          maxHealth={playerCombatantFixture.maxHealth}
          name={playerCombatantFixture.displayName}
          onUseSkill={onUseSkill}
          state="active"
        />
      </ActiveThemeProvider>,
    );

    expect(screen.getByText("Battle-ready")).toBeInTheDocument();
    expect(screen.getByText("Slash")).toBeInTheDocument();
    expect(screen.getByText("Study Weakness")).toBeInTheDocument();
  });

  it("shows knockout messaging when the player cannot act", () => {
    renderApp(
      <ActiveThemeProvider>
        <PlayerBattleProfile
          availableSkills={[...playerCombatantFixture.availableSkills]}
          currentActionPoints={0}
          currentHealth={0}
          maxActionPoints={3}
          maxHealth={playerCombatantFixture.maxHealth}
          name={playerCombatantFixture.displayName}
          onUseSkill={() => {}}
          state="knocked_out"
        />
      </ActiveThemeProvider>,
    );

    expect(screen.getByText("Waiting for revival")).toBeInTheDocument();
    expect(screen.getByText(/wait for a heal or revive/i)).toBeInTheDocument();
  });

  it("submits the selected target for targetable skills", async () => {
    const onUseSkill = vi.fn();

    const { user } = renderApp(
      <ActiveThemeProvider>
        <PlayerBattleProfile
          availableSkills={[...playerCombatantFixture.availableSkills]}
          availableTargets={[
            {
              combatantType: "boss",
              displayName: "Obsidian Hydra",
              id: "boss_1",
            },
            {
              combatantType: "boss",
              displayName: "Neon Lich Overclock",
              id: "boss_2",
            },
          ]}
          currentActionPoints={playerCombatantFixture.currentActionPoints}
          currentHealth={playerCombatantFixture.currentHealth}
          maxActionPoints={3}
          maxHealth={playerCombatantFixture.maxHealth}
          name={playerCombatantFixture.displayName}
          onUseSkill={onUseSkill}
          state="active"
        />
      </ActiveThemeProvider>,
    );

    await user.selectOptions(screen.getByRole("combobox"), "boss_2");
    const useButtons = screen.getAllByRole("button", { name: "Use" });
    await user.click(useButtons[0]);

    expect(onUseSkill).toHaveBeenCalledWith("skill_attack", "boss_2");
  });

  it("disables targetable skills when no valid targets are available", () => {
    renderApp(
      <ActiveThemeProvider>
        <PlayerBattleProfile
          availableSkills={[...playerCombatantFixture.availableSkills]}
          availableTargets={[]}
          currentActionPoints={playerCombatantFixture.currentActionPoints}
          currentHealth={playerCombatantFixture.currentHealth}
          maxActionPoints={3}
          maxHealth={playerCombatantFixture.maxHealth}
          name={playerCombatantFixture.displayName}
          onUseSkill={() => {}}
          state="active"
        />
      </ActiveThemeProvider>,
    );

    expect(screen.getAllByRole("button", { name: "Use" })[0]).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: "Use" })[1],
    ).not.toBeDisabled();
  });
});

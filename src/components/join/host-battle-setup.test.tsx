import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import { HostBattleSetup } from "./host-battle-setup";

const bossCatalog = [
  {
    _id: "boss_1",
    baseActionPointsPerRound: 2,
    baseHealth: 24,
    description: "A many-headed boss that punishes weak positioning.",
    name: "Obsidian Hydra",
  },
  {
    _id: "boss_2",
    baseActionPointsPerRound: 1,
    baseHealth: 18,
    description: "A support caster that extends the encounter.",
    name: "Ashen Oracle",
  },
];

describe("HostBattleSetup", () => {
  it("starts with the first boss selected and can add another boss", async () => {
    const user = userEvent.setup();
    const onStartEncounter = vi.fn();

    renderApp(
      <HostBattleSetup
        bossCatalog={bossCatalog}
        onStartEncounter={onStartEncounter}
      />,
    );

    expect(screen.getByText("1 boss selected")).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: "Select Ashen Oracle" }),
    );
    await user.click(screen.getByRole("button", { name: "Start Battle" }));

    expect(screen.getByText("2 bosses selected")).toBeInTheDocument();
    expect(onStartEncounter).toHaveBeenCalledWith(["boss_1", "boss_2"]);
  });

  it("shows the invalid lineup state when no boss is selected", async () => {
    const user = userEvent.setup();

    renderApp(
      <HostBattleSetup
        bossCatalog={bossCatalog}
        errorMessage="Choose at least one eligible boss before starting a battle."
        onStartEncounter={() => {}}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Select Obsidian Hydra" }),
    );

    expect(screen.getByText("0 bosses selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Battle" })).toBeDisabled();
    expect(
      screen.getByText(
        "Choose at least one eligible boss before starting a battle.",
      ),
    ).toBeInTheDocument();
  });
});

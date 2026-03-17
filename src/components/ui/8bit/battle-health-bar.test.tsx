import { describe, expect, it } from "vitest";
import { renderApp, screen } from "@/test/render";
import { BattleActionPointBar, BattleHealthBar } from "./battle-health-bar";

describe("BattleHealthBar", () => {
  it("shows the current and max values with the requested label", () => {
    renderApp(<BattleHealthBar current={45} label="Party Health" max={60} />);

    expect(screen.getByText("Party Health")).toBeInTheDocument();
    expect(screen.getByText("45/60")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("BattleActionPointBar", () => {
  it("renders action points through the 8bit mana bar wrapper", () => {
    renderApp(<BattleActionPointBar current={2} max={4} />);

    expect(screen.getByText("Action Points")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

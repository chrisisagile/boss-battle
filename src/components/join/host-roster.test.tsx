import { describe, expect, it } from "vitest";
import { renderApp, screen } from "@/test/render";
import { HostRoster } from "./host-roster";
import { QuizPointsLeaderboard } from "./quiz-points-leaderboard";

describe("HostRoster", () => {
  it("shows token and earned-point detail for active players", () => {
    renderApp(
      <HostRoster
        currentRoundNumber={3}
        players={[
          {
            _id: "player_1",
            displayName: "Ari",
            eligibleFromRoundNumber: 1,
            tokenBalance: 5,
            earnedPoints: 2,
          },
        ]}
      />,
    );

    expect(screen.getByText("Ari")).toBeInTheDocument();
    expect(screen.getByText("5 tokens • 2 quiz pts")).toBeInTheDocument();
  });

  it("marks players as ready when their round status is complete", () => {
    renderApp(
      <HostRoster
        currentRoundNumber={2}
        players={[
          {
            _id: "player_1",
            displayName: "Ari",
            eligibleFromRoundNumber: 1,
            roundStatus: "quiz_complete",
            tokenBalance: 2,
          },
        ]}
      />,
    );

    expect(screen.getByText("Ready ✓")).toBeInTheDocument();
  });
});

describe("QuizPointsLeaderboard", () => {
  it("renders ranked earned points", () => {
    renderApp(
      <QuizPointsLeaderboard
        players={[
          { id: "a", name: "Ari", score: 6 },
          { id: "b", name: "Jules", score: 3 },
        ]}
      />,
    );

    expect(screen.getByText("QUIZ POINTS EARNED")).toBeInTheDocument();
    expect(screen.getByText("Ari")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});

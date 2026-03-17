import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import {
  hostOverviewFixture,
  inProgressSessionFixture,
} from "@/test/session-fixtures";
import { HostSessionPage } from "./$joinCode";

const { hostOverviewMock, setJoinStatusMock } = vi.hoisted(() => ({
  hostOverviewMock: vi.fn(),
  setJoinStatusMock: vi.fn(),
}));

vi.mock("@/integrations/convex/join", () => ({
  getJoinErrorDetails: () => ({
    code: null,
    message: "failed",
  }),
  logHostSessionLoadIssue: vi.fn(),
  logJoinStatusFailure: vi.fn(),
  useHostOverview: () => hostOverviewMock(),
  useSetJoinStatusMutation: () => setJoinStatusMock,
}));

describe("HostSessionPage", () => {
  beforeEach(() => {
    hostOverviewMock.mockReset();
    setJoinStatusMock.mockReset();
    hostOverviewMock.mockReturnValue(hostOverviewFixture);
  });

  it("renders the join code and roster", () => {
    renderApp(<HostSessionPage joinCode="BATTLE" />);

    expect(screen.getByText("BATTLE")).toBeInTheDocument();
    expect(screen.getByText("Ari")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Joining" }),
    ).toBeInTheDocument();
  });

  it("renders the unavailable state when the session is missing", () => {
    hostOverviewMock.mockReturnValue(null);

    renderApp(<HostSessionPage joinCode="MISSING" />);

    expect(screen.getByText("Session unavailable")).toBeInTheDocument();
  });

  it("shows late joiner messaging for in-progress sessions", () => {
    hostOverviewMock.mockReturnValue({
      ...hostOverviewFixture,
      session: {
        ...hostOverviewFixture.session,
        currentRoundNumber: inProgressSessionFixture.currentRoundNumber,
        status: inProgressSessionFixture.status,
      },
      lateJoinerCount: 1,
      roster: [
        {
          _id: "player_3",
          displayName: "Nova",
          eligibleFromRoundNumber: 4,
          joinStatus: "joined",
        },
      ],
    });

    renderApp(<HostSessionPage joinCode="LATE99" />);

    expect(screen.getByText(/will activate next round/i)).toBeInTheDocument();
    expect(screen.getByText("Round 4")).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import {
  hostOverviewFixture,
  inProgressSessionFixture,
} from "@/test/session-fixtures";
import { HostSessionPage } from "./$joinCode";

const {
  hostOverviewMock,
  questionBankSummaryMock,
  setJoinStatusMock,
  startRoundMock,
} = vi.hoisted(() => ({
  hostOverviewMock: vi.fn(),
  questionBankSummaryMock: vi.fn(),
  setJoinStatusMock: vi.fn(),
  startRoundMock: vi.fn(),
}));

vi.mock("@/integrations/convex/join", () => ({
  getJoinErrorDetails: () => ({
    code: null,
    message: "failed",
  }),
  logHostSessionLoadIssue: vi.fn(),
  logJoinStatusFailure: vi.fn(),
  logStartRoundFailure: vi.fn(),
  useHostOverview: () => hostOverviewMock(),
  useQuestionBankSummary: () => questionBankSummaryMock(),
  useSetJoinStatusMutation: () => setJoinStatusMock,
  useStartRoundMutation: () => startRoundMock,
}));

describe("HostSessionPage", () => {
  beforeEach(() => {
    hostOverviewMock.mockReset();
    questionBankSummaryMock.mockReset();
    setJoinStatusMock.mockReset();
    startRoundMock.mockReset();
    hostOverviewMock.mockReturnValue(hostOverviewFixture);
    questionBankSummaryMock.mockReturnValue({
      availableCategories: ["history", "science"],
      availableComplexities: ["easy", "medium"],
      readyQuestionCount: 12,
    });
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
          tokenBalance: 0,
          earnedPoints: 0,
        },
      ],
    });

    renderApp(<HostSessionPage joinCode="LATE99" />);

    expect(screen.getByText(/will activate next round/i)).toBeInTheDocument();
    expect(screen.getByText("Round 4")).toBeInTheDocument();
  });

  it("renders round controls when no round is active", () => {
    renderApp(<HostSessionPage joinCode="BATTLE" />);

    expect(screen.getByText("Quiz Round Controls")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Quiz Round" }),
    ).toBeInTheDocument();
  });
});

import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import {
  hostOverviewFixture,
  inProgressSessionFixture,
} from "@/test/session-fixtures";
import { HostSessionPage } from "./$joinCode";

const bossCatalogFixture = [
  {
    _id: "boss_1",
    baseActionPointsPerRound: 2,
    baseHealth: 18,
    description: "Retro boss",
    name: "Static Warden",
  },
];

const {
  bossCatalogMock,
  hostOverviewMock,
  syncDefaultBossCatalogMock,
  questionBankSummaryMock,
  resolveBattleExchangeMock,
  setJoinStatusMock,
  startEncounterMock,
} = vi.hoisted(() => ({
  bossCatalogMock: vi.fn(),
  hostOverviewMock: vi.fn(),
  syncDefaultBossCatalogMock: vi.fn(),
  questionBankSummaryMock: vi.fn(),
  resolveBattleExchangeMock: vi.fn(),
  setJoinStatusMock: vi.fn(),
  startEncounterMock: vi.fn(),
}));

vi.mock("@/integrations/convex/join", () => ({
  getJoinErrorDetails: () => ({
    code: null,
    message: "failed",
  }),
  logBossCatalogSyncFailure: vi.fn(),
  logEncounterTransition: vi.fn(),
  logHostSessionLoadIssue: vi.fn(),
  logJoinStatusFailure: vi.fn(),
  logStartEncounterFailure: vi.fn(),
  useBossCatalog: () => bossCatalogMock(),
  useHostOverview: () => hostOverviewMock(),
  useQuestionBankSummary: () => questionBankSummaryMock(),
  useResolveBattleExchangeMutation: () => resolveBattleExchangeMock,
  useSetJoinStatusMutation: () => setJoinStatusMock,
  useSyncDefaultBossCatalogMutation: () => syncDefaultBossCatalogMock,
  useStartEncounterMutation: () => startEncounterMock,
}));

describe("HostSessionPage", () => {
  beforeEach(() => {
    bossCatalogMock.mockReset();
    hostOverviewMock.mockReset();
    syncDefaultBossCatalogMock.mockReset();
    questionBankSummaryMock.mockReset();
    resolveBattleExchangeMock.mockReset();
    setJoinStatusMock.mockReset();
    startEncounterMock.mockReset();
    hostOverviewMock.mockReturnValue(hostOverviewFixture);
    bossCatalogMock.mockReturnValue(bossCatalogFixture);
    resolveBattleExchangeMock.mockResolvedValue({
      exchangeId: "exchange_1",
      phase: "action_selection",
      readyToResolve: true,
    });
    setJoinStatusMock.mockResolvedValue(undefined);
    syncDefaultBossCatalogMock.mockResolvedValue({
      bossCount: 5,
      bossNames: ["Cinder", "Gloom", "Rook", "Static", "Titan"],
    });
    startEncounterMock.mockResolvedValue({
      encounterId: "encounter_1",
      encounterNumber: 1,
    });
    questionBankSummaryMock.mockReturnValue({
      availableCategories: ["history", "science", "star-trek"],
      availableComplexities: ["easy", "medium"],
      readyQuestionCount: 12,
    });
  });

  it("renders the join code and roster", () => {
    renderApp(<HostSessionPage joinCode="BATTLE" />);

    expect(screen.getByText("BATTLE")).toBeInTheDocument();
    expect(screen.getAllByText("Ari").length).toBeGreaterThan(0);
    expect(screen.getByText("Round Status")).toBeInTheDocument();
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
    hostOverviewMock.mockReturnValue({
      ...hostOverviewFixture,
      gamePhase: "lobby",
      session: {
        ...hostOverviewFixture.session,
        gamePhase: "lobby",
        activeEncounterId: null,
        battleJoinStatus: "pre_battle",
      },
      encounter: null,
      partySummary: null,
      partyCombatants: [],
      bossLineup: [],
    });

    renderApp(<HostSessionPage joinCode="BATTLE" />);

    expect(screen.getByText("Quiz Round Controls")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Game" }),
    ).toBeInTheDocument();
  });

  it("syncs the default boss catalog and renders a usable start button", async () => {
    hostOverviewMock.mockReturnValue({
      ...hostOverviewFixture,
      gamePhase: "lobby",
      session: {
        ...hostOverviewFixture.session,
        gamePhase: "lobby",
        activeEncounterId: null,
        battleJoinStatus: "pre_battle",
      },
      encounter: null,
      partySummary: null,
      partyCombatants: [],
      bossLineup: [],
    });
    bossCatalogMock.mockReturnValueOnce([]).mockReturnValue(bossCatalogFixture);

    renderApp(<HostSessionPage joinCode="BATTLE" />);

    await waitFor(() => {
      expect(syncDefaultBossCatalogMock).toHaveBeenCalledTimes(1);
    });
    expect(syncDefaultBossCatalogMock).toHaveBeenCalledWith({});
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeEnabled();
    });
  });

  it("lets the host continue a boss-only exchange from the arena", async () => {
    hostOverviewMock.mockReturnValue({
      ...hostOverviewFixture,
      gamePhase: "action_selection",
      activeRound: {
        id: "round_3",
        roundNumber: 3,
        status: "active",
        questionTarget: 2,
        questionsCompleted: 2,
        remainingQuestions: 0,
        allowedCategories: ["history"],
        allowedComplexities: ["easy"],
        phase: "action_selection",
      },
      partyCombatants: [
        {
          ...hostOverviewFixture.partyCombatants[0],
          currentActionPoints: 0,
        },
      ],
    });

    const { user } = renderApp(<HostSessionPage joinCode="BATTLE" />);
    await user.click(screen.getByRole("button", { name: "Continue Battle" }));

    expect(resolveBattleExchangeMock).toHaveBeenCalledWith({
      encounterId: "encounter_1",
      roundId: "round_3",
    });
  });

  it("renders final results on the host projector", () => {
    hostOverviewMock.mockReturnValue({
      ...hostOverviewFixture,
      session: {
        ...hostOverviewFixture.session,
        completedAt: 123,
        completionReason: "bosses_won",
        status: "completed",
        gamePhase: "results",
      },
      results: {
        completionReason: "bosses_won",
        roundsCompleted: 3,
      },
    });

    renderApp(<HostSessionPage joinCode="BATTLE" />);

    expect(screen.getByText("Game Over")).toBeInTheDocument();
    expect(screen.getByText(/bosses_won/i)).toBeInTheDocument();
    expect(screen.getByText(/3 rounds completed/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue Battle" }),
    ).not.toBeInTheDocument();
  });
});

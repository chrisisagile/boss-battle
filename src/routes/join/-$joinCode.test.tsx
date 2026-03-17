import { beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestionSeeds } from "@/data/quiz-questions";
import { renderApp, screen } from "@/test/render";
import {
  activeSessionFixture,
  inProgressSessionFixture,
} from "@/test/session-fixtures";
import { JoinByCodePage } from "./$joinCode";

const {
  submitBattleActionMock,
  joinSessionMock,
  joinableSessionMock,
  playerQuizStateMock,
  submitQuizAnswerMock,
} = vi.hoisted(() => ({
  submitBattleActionMock: vi.fn(),
  joinSessionMock: vi.fn(),
  joinableSessionMock: vi.fn(),
  playerQuizStateMock: vi.fn(),
  submitQuizAnswerMock: vi.fn(),
}));

vi.mock("@/integrations/convex/join", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/integrations/convex/join")>();

  return {
    ...actual,
    getJoinErrorDetails: () => ({
      code: actual.JOIN_ERROR_CODES.duplicateDisplayName,
      message: "duplicate",
    }),
    logBattleActionFailure: vi.fn(),
    logEncounterTransition: vi.fn(),
    logJoinSubmissionFailure: vi.fn(),
    logQuizAnswerFailure: vi.fn(),
    usePlayerQuizState: () => playerQuizStateMock(),
    useJoinSessionMutation: () => joinSessionMock,
    useJoinableSession: () => joinableSessionMock(),
    useSubmitBattleActionMutation: () => submitBattleActionMock,
    useSubmitQuizAnswerMutation: () => submitQuizAnswerMock,
  };
});

describe("JoinByCodePage", () => {
  beforeEach(() => {
    submitBattleActionMock.mockReset();
    joinSessionMock.mockReset();
    joinableSessionMock.mockReset();
    playerQuizStateMock.mockReset();
    submitQuizAnswerMock.mockReset();
    joinableSessionMock.mockReturnValue({
      available: true,
      ...activeSessionFixture,
    });
    playerQuizStateMock.mockReturnValue({
      session: activeSessionFixture,
      player: null,
      playerEntryId: null,
      activeRound: null,
      assignment: null,
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      battleStatus: "pre_battle",
      joinBlockReason: null,
    });
  });

  it("renders the player join form for active sessions", () => {
    renderApp(<JoinByCodePage joinCode="BATTLE" />);

    expect(screen.getByText("Round Start")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Join Battle" }),
    ).toBeInTheDocument();
  });

  it("renders an unavailable message when the session is closed", () => {
    joinableSessionMock.mockReturnValue({
      available: false,
      reason: "closed",
    });

    renderApp(<JoinByCodePage joinCode="BATTLE" />);

    expect(
      screen.getByText("That session is unavailable."),
    ).toBeInTheDocument();
  });

  it("shows next-round copy for in-progress join confirmations", async () => {
    joinableSessionMock.mockReturnValue({
      available: true,
      ...inProgressSessionFixture,
    });
    playerQuizStateMock.mockReturnValue({
      session: inProgressSessionFixture,
      player: null,
      playerEntryId: null,
      activeRound: null,
      assignment: null,
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      battleStatus: "pre_battle",
      joinBlockReason: null,
    });
    joinSessionMock.mockResolvedValue({
      currentRoundNumber: 3,
      displayName: "Nova",
      eligibleFromRoundNumber: 4,
      tokenBalance: 0,
    });

    const { user } = renderApp(<JoinByCodePage joinCode="LATE99" />);
    await user.type(screen.getByRole("textbox"), "Nova");
    await user.click(screen.getByRole("button", { name: "Join Battle" }));

    expect(
      await screen.findByText("You are in the party."),
    ).toBeInTheDocument();
    expect(screen.getByText(/round 4/i)).toBeInTheDocument();
  });

  it("renders a multiple-choice question when a live assignment exists", async () => {
    playerQuizStateMock.mockReturnValue({
      session: inProgressSessionFixture,
      player: {
        displayName: "Ari",
        eligibleFromRoundNumber: 1,
        nextQuizAdvantage: "none",
        tokenBalance: 3,
      },
      playerEntryId: "player_1",
      activeRound: {
        roundNumber: 3,
        status: "active",
        questionTarget: 3,
        questionsCompleted: 1,
        remainingQuestions: 2,
        allowedCategories: ["history"],
        allowedComplexities: ["easy"],
      },
      assignment: {
        assignmentId: "assignment_1",
        prompt: quizQuestionSeeds[0]?.prompt,
        choices: quizQuestionSeeds[0]?.choices,
        roundNumber: 3,
        questionNumber: 2,
      },
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      battleStatus: "active_quiz",
      joinBlockReason: null,
    });

    const { user } = renderApp(<JoinByCodePage joinCode="BATTLE" />);
    await user.click(screen.getByRole("button", { name: "Enter Quiz" }));

    expect(
      await screen.findByText(quizQuestionSeeds[0]?.prompt),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Lock Answer" }),
    ).toBeInTheDocument();
  });
});

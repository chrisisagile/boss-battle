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
  submitQuizAnswerBatchMock,
} = vi.hoisted(() => ({
  submitBattleActionMock: vi.fn(),
  joinSessionMock: vi.fn(),
  joinableSessionMock: vi.fn(),
  playerQuizStateMock: vi.fn(),
  submitQuizAnswerBatchMock: vi.fn(),
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
    useSubmitQuizAnswerBatchMutation: () => submitQuizAnswerBatchMock,
  };
});

describe("JoinByCodePage", () => {
  beforeEach(() => {
    submitBattleActionMock.mockReset();
    joinSessionMock.mockReset();
    joinableSessionMock.mockReset();
    playerQuizStateMock.mockReset();
    submitQuizAnswerBatchMock.mockReset();
    submitQuizAnswerBatchMock.mockResolvedValue({
      results: [],
      tokenBalance: 0,
    });
    submitBattleActionMock.mockResolvedValue({
      exchangeId: "exchange_1",
      phase: "action_selection",
      readyToResolve: false,
    });
    joinableSessionMock.mockReturnValue({
      available: true,
      ...activeSessionFixture,
    });
    playerQuizStateMock.mockReturnValue({
      session: activeSessionFixture,
      player: null,
      playerEntryId: null,
      activeRound: null,
      assignments: [],
      assignment: null,
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      availableTargets: [],
      battleStatus: "pre_battle",
      joinBlockReason: null,
      results: null,
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
      assignments: [],
      assignment: null,
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      availableTargets: [],
      battleStatus: "pre_battle",
      joinBlockReason: null,
      results: null,
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

  it("renders a full quiz sheet when live assignments exist", async () => {
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
        id: "round_3",
        roundNumber: 3,
        status: "active",
        questionTarget: 3,
        questionsCompleted: 1,
        remainingQuestions: 2,
        allowedCategories: ["history"],
        allowedComplexities: ["easy"],
      },
      assignments: [
        {
          assignmentId: "assignment_1",
          prompt: quizQuestionSeeds[0]?.prompt,
          choices: quizQuestionSeeds[0]?.choices,
          roundNumber: 3,
          questionNumber: 1,
        },
        {
          assignmentId: "assignment_2",
          prompt: quizQuestionSeeds[1]?.prompt,
          choices: quizQuestionSeeds[1]?.choices,
          roundNumber: 3,
          questionNumber: 2,
        },
      ],
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
      availableTargets: [],
      battleStatus: "active_quiz",
      joinBlockReason: null,
      results: null,
    });

    const { user } = renderApp(<JoinByCodePage joinCode="BATTLE" />);
    await user.click(screen.getByRole("button", { name: "Enter Quiz" }));

    expect(
      await screen.findByText(quizQuestionSeeds[0]?.prompt),
    ).toBeInTheDocument();
    expect(
      screen.getByText(quizQuestionSeeds[1]?.prompt ?? ""),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Lock Answers" }),
    ).toBeInTheDocument();
  });

  it("submits the whole quiz sheet in one batch", async () => {
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
        id: "round_3",
        roundNumber: 3,
        status: "active",
        questionTarget: 2,
        questionsCompleted: 0,
        remainingQuestions: 2,
        allowedCategories: ["history"],
        allowedComplexities: ["easy"],
      },
      assignments: [
        {
          assignmentId: "assignment_1",
          prompt: quizQuestionSeeds[0]?.prompt,
          choices: quizQuestionSeeds[0]?.choices,
          roundNumber: 3,
          questionNumber: 1,
        },
        {
          assignmentId: "assignment_2",
          prompt: quizQuestionSeeds[1]?.prompt,
          choices: quizQuestionSeeds[1]?.choices,
          roundNumber: 3,
          questionNumber: 2,
        },
      ],
      assignment: null,
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      availableTargets: [],
      battleStatus: "active_quiz",
      joinBlockReason: null,
      results: null,
    });

    const { user } = renderApp(<JoinByCodePage joinCode="BATTLE" />);
    await user.click(screen.getByRole("button", { name: "Enter Quiz" }));

    const radios = screen.getAllByRole("radio");
    await user.click(radios[0] as HTMLElement);
    await user.click(radios[4] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Lock Answers" }));

    expect(submitQuizAnswerBatchMock).toHaveBeenCalledWith({
      answers: [
        {
          assignmentId: "assignment_1",
          submittedChoiceId: quizQuestionSeeds[0]?.choices[0]?.id,
        },
        {
          assignmentId: "assignment_2",
          submittedChoiceId: quizQuestionSeeds[1]?.choices[0]?.id,
        },
      ],
    });
  });

  it("submits a battle action with the selected target during action selection", async () => {
    playerQuizStateMock.mockReturnValue({
      session: inProgressSessionFixture,
      player: {
        displayName: "Ari",
        eligibleFromRoundNumber: 1,
        nextQuizAdvantage: "none",
        tokenBalance: 4,
      },
      playerEntryId: "player_1",
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
      assignments: [],
      assignment: null,
      latestResult: null,
      combatant: {
        encounterId: "encounter_1",
        currentActionPoints: 2,
        currentHealth: 7,
        displayName: "Ari",
        fallbackSpriteKey: "player-ari",
        id: "combatant_player_1",
        maxHealth: 10,
        nextQuizAdvantage: null,
        spriteRef: null,
        state: "active",
      },
      partySummary: null,
      availableSkills: [
        {
          actionPointCost: 1,
          available: true,
          category: "attack",
          id: "skill_attack",
          name: "Slash",
          targetScope: "enemy",
        },
      ],
      availableTargets: [
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
      ],
      battleStatus: "action_selection",
      joinBlockReason: null,
      results: null,
    });

    const { user } = renderApp(<JoinByCodePage joinCode="BATTLE" />);
    await user.selectOptions(screen.getByRole("combobox"), "boss_2");
    await user.click(screen.getByRole("button", { name: "Use" }));

    expect(submitBattleActionMock).toHaveBeenCalledWith({
      encounterId: "encounter_1",
      playerEntryId: "player_1",
      roundId: "round_3",
      skillId: "skill_attack",
      targetId: "boss_2",
    });
  });

  it("shows removed-from-round messaging and promises next-round return", () => {
    playerQuizStateMock.mockReturnValue({
      session: inProgressSessionFixture,
      player: {
        displayName: "Ari",
        eligibleFromRoundNumber: 4,
        nextQuizAdvantage: "none",
        tokenBalance: 1,
      },
      playerEntryId: "player_1",
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
      assignments: [],
      assignment: null,
      latestResult: null,
      combatant: {
        encounterId: "encounter_1",
        currentActionPoints: 0,
        currentHealth: 7,
        displayName: "Ari",
        fallbackSpriteKey: "player-ari",
        id: "combatant_player_1",
        maxHealth: 10,
        nextQuizAdvantage: null,
        spriteRef: null,
        state: "active",
      },
      partySummary: null,
      availableSkills: [],
      availableTargets: [],
      battleStatus: "removed_from_round",
      joinBlockReason: "battle_join_blocked",
      results: null,
    });

    renderApp(<JoinByCodePage joinCode="BATTLE" />);

    expect(screen.getByText("Round complete for now")).toBeInTheDocument();
    expect(
      screen.getByText(/you were removed from the active round/i),
    ).toBeInTheDocument();
  });

  it("renders the final results state when the game ends", () => {
    playerQuizStateMock.mockReturnValue({
      session: {
        ...inProgressSessionFixture,
        status: "completed",
        gamePhase: "results",
      },
      player: {
        displayName: "Ari",
        eligibleFromRoundNumber: 1,
        nextQuizAdvantage: "none",
        tokenBalance: 4,
      },
      playerEntryId: "player_1",
      activeRound: null,
      assignments: [],
      assignment: null,
      latestResult: null,
      combatant: null,
      partySummary: null,
      availableSkills: [],
      availableTargets: [],
      battleStatus: "results",
      joinBlockReason: null,
      results: {
        completedAt: 123,
        completionReason: "players_won",
      },
    });

    renderApp(<JoinByCodePage joinCode="BATTLE" />);

    expect(screen.getByText("Game Over")).toBeInTheDocument();
    expect(screen.getByText(/players_won/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Lock Answers" }),
    ).not.toBeInTheDocument();
  });
});

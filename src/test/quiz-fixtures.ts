import type { QuizQuestionSeed } from "@/data/quiz-questions";
import { quizQuestionSeeds } from "@/data/quiz-questions";

function getQuestionFixture(index: number): QuizQuestionSeed {
  const question = quizQuestionSeeds[index];
  if (!question) {
    throw new Error(`Missing quiz question seed at index ${index}.`);
  }
  return question;
}

export const quizQuestionFixture = getQuestionFixture(0);

export const quizQuestionMediumFixture = getQuestionFixture(5);

export const playerQuizStateFixture = {
  session: {
    joinCode: "BATTLE",
    currentRoundNumber: 1,
    participationWindowStatus: "open",
    status: "in_progress",
  },
  player: {
    displayName: "Ari",
    eligibleFromRoundNumber: 1,
    tokenBalance: 4,
  },
  activeRound: {
    id: "round_1",
    roundNumber: 1,
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
      prompt: quizQuestionFixture.prompt,
      choices: quizQuestionFixture.choices,
      roundNumber: 1,
      questionNumber: 1,
    },
    {
      assignmentId: "assignment_2",
      prompt: quizQuestionMediumFixture.prompt,
      choices: quizQuestionMediumFixture.choices,
      roundNumber: 1,
      questionNumber: 2,
    },
  ],
  assignment: {
    assignmentId: "assignment_1",
    prompt: quizQuestionFixture.prompt,
    choices: quizQuestionFixture.choices,
    roundNumber: 1,
    questionNumber: 2,
  },
  latestResult: null,
} as const;

export const projectorLeaderboardFixture = [
  { id: "player_1", name: "Ari", score: 6, rank: 1 },
  { id: "player_2", name: "Jules", score: 4, rank: 2 },
  { id: "player_3", name: "Nova", score: 2, rank: 3 },
] as const;

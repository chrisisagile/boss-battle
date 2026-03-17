export interface SelectableQuizQuestion<QuestionId = string> {
  _id: QuestionId;
  sourceKey: string;
  category: string;
  complexity: string;
  correctChoiceId: string;
  choices: Array<{ id: string; text: string }>;
  status: string;
  tokenReward: number;
}

export interface PriorQuizAssignment<
  PlayerEntryId = string,
  QuestionId = string,
> {
  playerEntryId: PlayerEntryId;
  quizQuestionId: QuestionId;
}

export interface SelectablePlayerEntry<PlayerEntryId = string> {
  _id: PlayerEntryId;
}

export function expandComplexitiesForEasierQuestion(
  allowedComplexities: readonly string[],
) {
  if (allowedComplexities.includes("easy")) {
    return [...allowedComplexities];
  }

  return [...allowedComplexities, "easy"];
}

export function filterQuestionsForRound<QuestionId>(
  questions: readonly SelectableQuizQuestion<QuestionId>[],
  allowedCategories: readonly string[],
  allowedComplexities: readonly string[],
) {
  return questions.filter(
    (question) =>
      question.status === "ready" &&
      allowedCategories.includes(question.category) &&
      allowedComplexities.includes(question.complexity),
  );
}

export function selectQuestionForPlayer<PlayerEntryId, QuestionId>(
  playerEntryId: PlayerEntryId,
  questions: readonly SelectableQuizQuestion<QuestionId>[],
  priorAssignments: readonly PriorQuizAssignment<PlayerEntryId, QuestionId>[],
) {
  const seen = new Set(
    priorAssignments
      .filter((assignment) => assignment.playerEntryId === playerEntryId)
      .map((assignment) => assignment.quizQuestionId),
  );

  return questions.find((question) => !seen.has(question._id)) ?? null;
}

export function canSatisfyRoundForPlayers<PlayerEntryId, QuestionId>(
  players: readonly SelectablePlayerEntry<PlayerEntryId>[],
  questions: readonly SelectableQuizQuestion<QuestionId>[],
  priorAssignments: readonly PriorQuizAssignment<PlayerEntryId, QuestionId>[],
  questionTarget: number,
) {
  return players.every((player) => {
    const seen = new Set(
      priorAssignments
        .filter((assignment) => assignment.playerEntryId === player._id)
        .map((assignment) => assignment.quizQuestionId),
    );

    return (
      questions.filter((question) => !seen.has(question._id)).length >=
      questionTarget
    );
  });
}

export function buildAssignmentsForBatch<PlayerEntryId, QuestionId>(
  players: readonly SelectablePlayerEntry<PlayerEntryId>[],
  questions: readonly SelectableQuizQuestion<QuestionId>[],
  priorAssignments: readonly PriorQuizAssignment<PlayerEntryId, QuestionId>[],
) {
  const assignments: Array<{
    playerEntryId: PlayerEntryId;
    quizQuestionId: QuestionId;
  }> = [];
  const exhaustedPlayerIds: PlayerEntryId[] = [];
  const reservedQuestionIds = new Set<QuestionId>();

  for (const player of players) {
    const availableQuestions = questions.filter(
      (question) => !reservedQuestionIds.has(question._id),
    );
    const question = selectQuestionForPlayer(
      player._id,
      availableQuestions,
      priorAssignments,
    );

    if (!question) {
      exhaustedPlayerIds.push(player._id);
      continue;
    }

    reservedQuestionIds.add(question._id);
    assignments.push({
      playerEntryId: player._id,
      quizQuestionId: question._id,
    });
  }

  return {
    assignments,
    exhaustedPlayerIds,
  };
}

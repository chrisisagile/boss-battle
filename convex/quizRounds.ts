import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import type { PriorQuizAssignment } from "./lib/quizRoundSelection";
import {
  buildAssignmentsForBatch,
  canSatisfyRoundForPlayers,
} from "./lib/quizRoundSelection";
import {
  QUIZ_ANSWER_WINDOW_MS,
  validateRoundConfig,
} from "./lib/quizValidation";
import { ensureQuestionBankLoaded } from "./quizQuestionLoader";
import { getReadyQuestionsForRules } from "./quizQuestions";

type QuizAccessCtx = MutationCtx | QueryCtx;
type PlayerEntryId = Id<"playerEntries">;
type QuizQuestionId = Id<"quizQuestions">;

async function getJoinedPlayers(
  ctx: QuizAccessCtx,
  sessionId: Id<"gameSessions">,
  roundNumber: number,
): Promise<Doc<"playerEntries">[]> {
  const players = await ctx.db
    .query("playerEntries")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  return players.filter(
    (player) =>
      player.joinStatus === "joined" &&
      player.eligibleFromRoundNumber <= roundNumber,
  );
}

async function getPriorAssignments(
  ctx: QuizAccessCtx,
  sessionId: Id<"gameSessions">,
): Promise<PriorQuizAssignment<PlayerEntryId, QuizQuestionId>[]> {
  const rounds = await ctx.db
    .query("gameRounds")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  const roundIds = new Set(rounds.map((round) => round._id));
  const assignments = await ctx.db.query("quizAssignments").collect();

  return assignments
    .filter((assignment) => roundIds.has(assignment.roundId))
    .map((assignment) => ({
      playerEntryId: assignment.playerEntryId,
      quizQuestionId: assignment.quizQuestionId,
    }));
}

async function createBatchAssignments(
  ctx: MutationCtx,
  sessionId: Id<"gameSessions">,
  round: Doc<"gameRounds">,
  batchNumber: number,
) {
  const players = await getJoinedPlayers(ctx, sessionId, round.roundNumber);
  if (players.length === 0) {
    return [];
  }

  const questions = await getReadyQuestionsForRules(
    ctx,
    round.allowedCategories,
    round.allowedComplexities,
  );
  const priorAssignments = await getPriorAssignments(ctx, sessionId);
  const result = buildAssignmentsForBatch<PlayerEntryId, QuizQuestionId>(
    players,
    questions,
    priorAssignments,
  );

  if (result.exhaustedPlayerIds.length > 0) {
    createJoinError(
      JOIN_ERROR_CODES.insufficientQuestions,
      "The selected category and complexity rules do not have enough unique questions for this round.",
    );
  }

  const now = Date.now();
  const assignmentIds = [];
  for (const assignment of result.assignments) {
    assignmentIds.push(
      await ctx.db.insert("quizAssignments", {
        sessionId,
        roundId: round._id,
        playerEntryId: assignment.playerEntryId,
        quizQuestionId: assignment.quizQuestionId,
        batchNumber,
        status: "presented",
        assignedAt: now,
        expiresAt: now + QUIZ_ANSWER_WINDOW_MS,
        scoredAt: null,
        awardedTokens: 0,
      }),
    );
  }

  return assignmentIds;
}

export async function advanceRoundIfNeeded(
  ctx: MutationCtx,
  roundId: Id<"gameRounds">,
) {
  const round = await ctx.db.get(roundId);
  if (!round || round.status !== "active") {
    return;
  }

  const currentBatchNumber = round.questionsCompleted + 1;
  const batchAssignments = (
    await ctx.db
      .query("quizAssignments")
      .withIndex("by_round_and_batch", (q) =>
        q.eq("roundId", roundId).eq("batchNumber", currentBatchNumber),
      )
      .collect()
  ).filter((assignment) => assignment.status === "presented");

  if (batchAssignments.length > 0) {
    return;
  }

  const now = Date.now();
  const nextCompleted = round.questionsCompleted + 1;
  const session = await ctx.db.get(round.sessionId);
  if (!session) {
    return;
  }

  if (nextCompleted >= round.questionTarget) {
    await ctx.db.patch(round._id, {
      status: "completed",
      questionsCompleted: nextCompleted,
      completedAt: now,
    });
    await ctx.db.patch(session._id, {
      activeRoundId: null,
      participationWindowStatus: "idle",
      updatedAt: now,
      status: "in_progress",
    });
    return;
  }

  await ctx.db.patch(round._id, {
    questionsCompleted: nextCompleted,
  });

  await createBatchAssignments(
    ctx,
    session._id,
    {
      ...round,
      questionsCompleted: nextCompleted,
    },
    nextCompleted + 1,
  );
}

export const startRound = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    questionTarget: v.number(),
    allowedCategories: v.array(v.string()),
    allowedComplexities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const validationError = validateRoundConfig(
      args.questionTarget,
      args.allowedCategories,
      args.allowedComplexities,
    );
    if (validationError) {
      createJoinError(JOIN_ERROR_CODES.invalidRoundConfig, validationError);
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status === "completed") {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "The requested session could not be found.",
      );
    }

    if (session.activeRoundId) {
      createJoinError(
        JOIN_ERROR_CODES.invalidRoundConfig,
        "A round is already active for this session.",
      );
    }

    await ensureQuestionBankLoaded(ctx);

    const roundNumber = session.currentRoundNumber + 1;
    const eligiblePlayers = await getJoinedPlayers(
      ctx,
      session._id,
      roundNumber,
    );
    const questions = await getReadyQuestionsForRules(
      ctx,
      args.allowedCategories,
      args.allowedComplexities,
    );
    const priorAssignments = await getPriorAssignments(ctx, session._id);

    if (
      !canSatisfyRoundForPlayers(
        eligiblePlayers,
        questions,
        priorAssignments,
        args.questionTarget,
      )
    ) {
      createJoinError(
        JOIN_ERROR_CODES.insufficientQuestions,
        "Not enough unique questions are available for every eligible player in this round.",
      );
    }

    const now = Date.now();
    const roundId = await ctx.db.insert("gameRounds", {
      sessionId: session._id,
      roundNumber,
      status: "active",
      questionTarget: args.questionTarget,
      questionsCompleted: 0,
      allowedCategories: args.allowedCategories,
      allowedComplexities: args.allowedComplexities,
      createdByHostAt: now,
      startedAt: now,
      completedAt: null,
    });

    await ctx.db.patch(session._id, {
      status: "in_progress",
      currentRoundNumber: roundNumber,
      activeRoundId: roundId,
      participationWindowStatus: "open",
      updatedAt: now,
    });

    const round = await ctx.db.get(roundId);
    if (!round) {
      createJoinError(
        JOIN_ERROR_CODES.noActiveRound,
        "The quiz round could not be loaded after it started.",
      );
    }

    await createBatchAssignments(ctx, session._id, round, 1);

    return {
      roundId,
      roundNumber,
    };
  },
});

export const getPlayerQuizState = query({
  args: {
    joinCode: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_join_code", (q) =>
        q.eq("joinCode", args.joinCode.trim().toUpperCase()),
      )
      .unique();

    if (!session || session.status === "completed") {
      return null;
    }

    const player = await ctx.db
      .query("playerEntries")
      .withIndex("by_session_and_device", (q) =>
        q.eq("sessionId", session._id).eq("deviceId", args.deviceId.trim()),
      )
      .unique();

    if (!player || player.joinStatus !== "joined") {
      return {
        session: {
          joinCode: session.joinCode,
          currentRoundNumber: session.currentRoundNumber,
          participationWindowStatus: session.participationWindowStatus,
          status: session.status,
        },
        player: null,
        activeRound: null,
        assignment: null,
        latestResult: null,
      };
    }

    const activeRound = session.activeRoundId
      ? await ctx.db.get(session.activeRoundId)
      : null;

    const playerAssignments = (
      await ctx.db
        .query("quizAssignments")
        .withIndex("by_player", (q) => q.eq("playerEntryId", player._id))
        .collect()
    ).sort((left, right) => right.assignedAt - left.assignedAt);

    const activeAssignment = playerAssignments.find(
      (assignment) =>
        assignment.status === "presented" &&
        (!activeRound || assignment.roundId === activeRound._id),
    );

    const latestAssignment = playerAssignments.find(
      (assignment) => assignment.status === "scored",
    );

    const assignmentQuestion = activeAssignment
      ? await ctx.db.get(activeAssignment.quizQuestionId)
      : null;

    const latestAnswer = latestAssignment
      ? await ctx.db
          .query("quizAnswers")
          .withIndex("by_assignment", (q) =>
            q.eq("assignmentId", latestAssignment._id),
          )
          .unique()
      : null;

    return {
      session: {
        joinCode: session.joinCode,
        currentRoundNumber: session.currentRoundNumber,
        participationWindowStatus: session.participationWindowStatus,
        status: session.status,
      },
      player: {
        displayName: player.displayName,
        eligibleFromRoundNumber: player.eligibleFromRoundNumber,
        tokenBalance: player.tokenBalance,
      },
      activeRound: activeRound
        ? {
            roundNumber: activeRound.roundNumber,
            status: activeRound.status,
            questionTarget: activeRound.questionTarget,
            questionsCompleted: activeRound.questionsCompleted,
            remainingQuestions:
              activeRound.questionTarget - activeRound.questionsCompleted,
            allowedCategories: activeRound.allowedCategories,
            allowedComplexities: activeRound.allowedComplexities,
          }
        : null,
      assignment:
        activeAssignment && assignmentQuestion
          ? {
              assignmentId: activeAssignment._id,
              prompt: assignmentQuestion.prompt,
              choices: assignmentQuestion.choices,
              roundNumber:
                activeRound?.roundNumber ?? session.currentRoundNumber,
              questionNumber: activeAssignment.batchNumber,
            }
          : null,
      latestResult:
        latestAssignment && latestAnswer
          ? {
              assignmentId: latestAssignment._id,
              awardedTokens: latestAssignment.awardedTokens,
              evaluationResult: latestAnswer.evaluationResult,
              submittedChoiceId: latestAnswer.submittedChoiceId,
            }
          : null,
    };
  },
});

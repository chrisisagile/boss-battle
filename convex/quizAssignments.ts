import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import { normalizeChoiceId } from "./lib/quizValidation";
import { advanceRoundIfNeeded } from "./quizRounds";

async function scoreAssignment(
  ctx: MutationCtx,
  input: {
    assignment: Doc<"quizAssignments">;
    player: Doc<"playerEntries">;
    question: Doc<"quizQuestions">;
    submittedChoiceId: string;
  },
) {
  const normalizedChoiceId = normalizeChoiceId(input.submittedChoiceId);
  const validChoice = input.question.choices.some(
    (choice: { id: string }) =>
      normalizeChoiceId(choice.id) === normalizedChoiceId,
  );

  if (!validChoice) {
    createJoinError(
      JOIN_ERROR_CODES.invalidAnswerChoice,
      "Choose one of the available answers before submitting.",
    );
  }

  const now = Date.now();
  const isCorrect =
    normalizeChoiceId(input.question.correctChoiceId) === normalizedChoiceId;
  const awardedTokens = isCorrect ? input.question.tokenReward : 0;

  await ctx.db.insert("quizAnswers", {
    assignmentId: input.assignment._id,
    sessionId: input.assignment.sessionId,
    roundId: input.assignment.roundId,
    playerEntryId: input.assignment.playerEntryId,
    submittedChoiceId: normalizedChoiceId,
    submittedAt: now,
    evaluationResult: isCorrect ? "correct" : "incorrect",
    awardedTokens,
    evaluatedAt: now,
  });

  await ctx.db.patch(input.assignment._id, {
    status: "scored",
    scoredAt: now,
    awardedTokens,
  });

  if (awardedTokens > 0) {
    await ctx.db.patch(input.player._id, {
      tokenBalance: input.player.tokenBalance + awardedTokens,
    });
  }

  return {
    awardedTokens,
    evaluationResult: isCorrect ? "correct" : "incorrect",
    normalizedChoiceId,
    now,
    tokenBalance: input.player.tokenBalance + awardedTokens,
  };
}

export const submitAnswer = mutation({
  args: {
    assignmentId: v.id("quizAssignments"),
    submittedChoiceId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "That quiz question is no longer available.",
      );
    }

    if (assignment.status !== "presented") {
      createJoinError(
        JOIN_ERROR_CODES.duplicateAnswerSubmission,
        "That quiz question has already been resolved.",
      );
    }

    const question = await ctx.db.get(assignment.quizQuestionId);
    const player = await ctx.db.get(assignment.playerEntryId);
    const round = await ctx.db.get(assignment.roundId);
    if (!question || !player) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "That quiz question is no longer available.",
      );
    }

    const result = await scoreAssignment(ctx, {
      assignment,
      player,
      question,
      submittedChoiceId: args.submittedChoiceId,
    });

    const roundParticipant = await ctx.db
      .query("roundParticipants")
      .withIndex("by_round_and_player", (q) =>
        q
          .eq("roundId", assignment.roundId)
          .eq("playerEntryId", assignment.playerEntryId),
      )
      .unique();

    if (roundParticipant) {
      await ctx.db.patch(roundParticipant._id, {
        status:
          round && assignment.batchNumber >= round.questionTarget
            ? "quiz_complete"
            : "active",
        completedQuizAt:
          round && assignment.batchNumber >= round.questionTarget
            ? result.now
            : null,
      });
    }

    await advanceRoundIfNeeded(ctx, assignment.roundId);

    return {
      awardedTokens: result.awardedTokens,
      correctChoiceId: question.correctChoiceId,
      evaluationResult: result.evaluationResult,
      tokenBalance: result.tokenBalance,
    };
  },
});

export const submitAnswerBatch = mutation({
  args: {
    answers: v.array(
      v.object({
        assignmentId: v.id("quizAssignments"),
        submittedChoiceId: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (args.answers.length === 0) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "There are no quiz answers to submit.",
      );
    }

    const assignments = await Promise.all(
      args.answers.map((answer) => ctx.db.get(answer.assignmentId)),
    );
    if (assignments.some((assignment) => !assignment)) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "One or more quiz questions are no longer available.",
      );
    }

    const resolvedAssignments = assignments as Doc<"quizAssignments">[];
    const firstAssignment = resolvedAssignments[0];
    if (!firstAssignment) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "There are no quiz answers to submit.",
      );
    }

    const assignmentIds = new Set(
      resolvedAssignments.map((assignment) => assignment._id),
    );
    if (assignmentIds.size !== resolvedAssignments.length) {
      createJoinError(
        JOIN_ERROR_CODES.duplicateAnswerSubmission,
        "Each quiz question can only be submitted once per batch.",
      );
    }

    const sameRound = resolvedAssignments.every(
      (assignment) =>
        assignment.roundId === firstAssignment.roundId &&
        assignment.playerEntryId === firstAssignment.playerEntryId &&
        assignment.status === "presented",
    );
    if (!sameRound) {
      createJoinError(
        JOIN_ERROR_CODES.invalidAnswerChoice,
        "All submitted answers must belong to the same active player round.",
      );
    }

    const player = await ctx.db.get(firstAssignment.playerEntryId);
    const round = await ctx.db.get(firstAssignment.roundId);
    if (!player || !round) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "The quiz round could not be loaded for submission.",
      );
    }

    const results = [];
    let latestTokenBalance = player.tokenBalance;
    for (const answer of args.answers) {
      const assignment = resolvedAssignments.find(
        (currentAssignment) => currentAssignment._id === answer.assignmentId,
      );
      if (!assignment) {
        createJoinError(
          JOIN_ERROR_CODES.noAssignment,
          "The quiz question batch became inconsistent during submission.",
        );
      }

      const question = await ctx.db.get(assignment.quizQuestionId);
      if (!question) {
        createJoinError(
          JOIN_ERROR_CODES.noAssignment,
          "The quiz question could not be loaded.",
        );
      }

      const mutablePlayer = {
        ...player,
        tokenBalance: latestTokenBalance,
      };
      const result = await scoreAssignment(ctx, {
        assignment,
        player: mutablePlayer,
        question,
        submittedChoiceId: answer.submittedChoiceId,
      });
      latestTokenBalance = result.tokenBalance;
      results.push({
        assignmentId: assignment._id as Id<"quizAssignments">,
        awardedTokens: result.awardedTokens,
        evaluationResult: result.evaluationResult,
        questionNumber: assignment.batchNumber,
      });
    }

    const roundParticipant = await ctx.db
      .query("roundParticipants")
      .withIndex("by_round_and_player", (q) =>
        q.eq("roundId", round._id).eq("playerEntryId", player._id),
      )
      .unique();

    if (roundParticipant) {
      await ctx.db.patch(roundParticipant._id, {
        completedQuizAt: Date.now(),
        status: "quiz_complete",
      });
    }

    await advanceRoundIfNeeded(ctx, round._id);

    return {
      results,
      tokenBalance: latestTokenBalance,
    };
  },
});

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import { normalizeChoiceId } from "./lib/quizValidation";
import { advanceRoundIfNeeded } from "./quizRounds";

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
    if (!question || !player) {
      createJoinError(
        JOIN_ERROR_CODES.noAssignment,
        "That quiz question is no longer available.",
      );
    }

    const normalizedChoiceId = normalizeChoiceId(args.submittedChoiceId);
    const validChoice = question.choices.some(
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
    if (now > assignment.expiresAt) {
      await ctx.db.patch(assignment._id, {
        status: "expired",
        scoredAt: now,
        awardedTokens: 0,
      });
      await ctx.db.insert("quizAnswers", {
        assignmentId: assignment._id,
        sessionId: assignment.sessionId,
        roundId: assignment.roundId,
        playerEntryId: assignment.playerEntryId,
        submittedChoiceId: normalizedChoiceId,
        submittedAt: now,
        evaluationResult: "expired",
        awardedTokens: 0,
        evaluatedAt: now,
      });
      await advanceRoundIfNeeded(ctx, assignment.roundId);
      createJoinError(
        JOIN_ERROR_CODES.assignmentExpired,
        "Time ran out before that answer was scored.",
      );
    }

    const isCorrect =
      normalizeChoiceId(question.correctChoiceId) === normalizedChoiceId;
    const awardedTokens = isCorrect ? question.tokenReward : 0;

    await ctx.db.insert("quizAnswers", {
      assignmentId: assignment._id,
      sessionId: assignment.sessionId,
      roundId: assignment.roundId,
      playerEntryId: assignment.playerEntryId,
      submittedChoiceId: normalizedChoiceId,
      submittedAt: now,
      evaluationResult: isCorrect ? "correct" : "incorrect",
      awardedTokens,
      evaluatedAt: now,
    });

    await ctx.db.patch(assignment._id, {
      status: "scored",
      scoredAt: now,
      awardedTokens,
    });

    if (awardedTokens > 0) {
      await ctx.db.patch(player._id, {
        tokenBalance: player.tokenBalance + awardedTokens,
      });
    }

    await advanceRoundIfNeeded(ctx, assignment.roundId);

    return {
      awardedTokens,
      correctChoiceId: question.correctChoiceId,
      evaluationResult: isCorrect ? "correct" : "incorrect",
      tokenBalance: player.tokenBalance + awardedTokens,
    };
  },
});

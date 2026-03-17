import {
  quizCategories,
  quizComplexities,
  quizQuestionSeeds,
} from "../src/data/quiz-questions";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import { hasValidChoices } from "./lib/quizValidation";

export async function ensureQuestionBankLoaded(ctx: MutationCtx) {
  const now = Date.now();

  for (const seed of quizQuestionSeeds) {
    if (!hasValidChoices(seed.choices, seed.correctChoiceId)) {
      createJoinError(
        JOIN_ERROR_CODES.insufficientQuestions,
        `Question ${seed.sourceKey} is missing valid multiple-choice data.`,
      );
    }

    const existing = await ctx.db
      .query("quizQuestions")
      .withIndex("by_source_key", (q) => q.eq("sourceKey", seed.sourceKey))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...seed,
        updatedAt: now,
      });
      continue;
    }

    await ctx.db.insert("quizQuestions", {
      ...seed,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function getReadyQuestionsForRules(
  ctx: QueryCtx | MutationCtx,
  allowedCategories: string[],
  allowedComplexities: string[],
) {
  const readyQuestions = await ctx.db
    .query("quizQuestions")
    .withIndex("by_status", (q) => q.eq("status", "ready"))
    .collect();

  return readyQuestions.filter(
    (question) =>
      allowedCategories.includes(question.category) &&
      allowedComplexities.includes(question.complexity),
  );
}

export const getQuestionBankSummary = query({
  args: {},
  handler: async (ctx) => {
    const readyQuestions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .collect();

    return {
      availableCategories: [...quizCategories],
      availableComplexities: [...quizComplexities],
      readyQuestionCount:
        readyQuestions.length > 0
          ? readyQuestions.length
          : quizQuestionSeeds.length,
    };
  },
});

export const syncQuestionBank = mutation({
  args: {},
  handler: async (ctx) => {
    await ensureQuestionBankLoaded(ctx);

    return {
      readyQuestionCount: (
        await ctx.db
          .query("quizQuestions")
          .withIndex("by_status", (q) => q.eq("status", "ready"))
          .collect()
      ).length,
    };
  },
});

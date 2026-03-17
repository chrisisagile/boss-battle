import { quizCategories, quizComplexities } from "../src/data/quiz-questions";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";

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
      readyQuestionCount: readyQuestions.length,
    };
  },
});

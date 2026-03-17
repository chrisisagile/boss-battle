import { quizQuestionSeeds } from "../src/data/quiz-questions";
import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import { upsertQuestionBankEntries } from "./lib/quizQuestionBankStore";

export async function ensureQuestionBankLoaded(ctx: MutationCtx) {
  await upsertQuestionBankEntries(ctx, quizQuestionSeeds);
}

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

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  quizQuestionWriteValidator,
  upsertQuestionBankEntries,
} from "./lib/quizQuestionBankStore";

export const upsertQuestionBank = mutation({
  args: {
    questions: v.array(quizQuestionWriteValidator),
  },
  handler: async (ctx, args) => {
    return await upsertQuestionBankEntries(ctx, args.questions);
  },
});

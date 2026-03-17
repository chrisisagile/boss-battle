import { v } from "convex/values";
import {
  quizCategories,
  quizComplexities,
} from "../../src/data/quiz-questions";
import type { MutationCtx } from "../_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./joinErrors";
import {
  hasValidChoices,
  isQuizCategory,
  isQuizComplexity,
} from "./quizValidation";

export const quizQuestionStatuses = ["draft", "ready", "retired"] as const;

export type QuizQuestionStatus = (typeof quizQuestionStatuses)[number];

export interface QuizQuestionWrite {
  sourceKey: string;
  prompt: string;
  choices: {
    id: string;
    text: string;
  }[];
  correctChoiceId: string;
  category: string;
  complexity: string;
  tokenReward: number;
  status: QuizQuestionStatus;
}

export const quizQuestionWriteValidator = v.object({
  sourceKey: v.string(),
  prompt: v.string(),
  choices: v.array(
    v.object({
      id: v.string(),
      text: v.string(),
    }),
  ),
  correctChoiceId: v.string(),
  category: v.string(),
  complexity: v.string(),
  tokenReward: v.number(),
  status: v.union(v.literal("draft"), v.literal("ready"), v.literal("retired")),
});

export function validateQuizQuestionWrite(question: QuizQuestionWrite) {
  if (question.sourceKey.trim().length === 0) {
    return "Question source keys must not be blank.";
  }

  if (question.prompt.trim().length === 0) {
    return `Question ${question.sourceKey} must include a prompt.`;
  }

  if (!isQuizCategory(question.category)) {
    return `Question ${question.sourceKey} must use one of the supported categories: ${quizCategories.join(", ")}.`;
  }

  if (!isQuizComplexity(question.complexity)) {
    return `Question ${question.sourceKey} must use one of the supported complexities: ${quizComplexities.join(", ")}.`;
  }

  if (!hasValidChoices(question.choices, question.correctChoiceId)) {
    return `Question ${question.sourceKey} must include unique non-empty choices and a matching correctChoiceId.`;
  }

  if (!Number.isInteger(question.tokenReward) || question.tokenReward < 1) {
    return `Question ${question.sourceKey} must use an integer tokenReward of at least 1.`;
  }

  return null;
}

async function upsertQuestion(
  ctx: MutationCtx,
  question: QuizQuestionWrite,
  now: number,
) {
  const existing = await ctx.db
    .query("quizQuestions")
    .withIndex("by_source_key", (q) => q.eq("sourceKey", question.sourceKey))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      ...question,
      updatedAt: now,
    });

    return "updated" as const;
  }

  await ctx.db.insert("quizQuestions", {
    ...question,
    createdAt: now,
    updatedAt: now,
  });

  return "inserted" as const;
}

export async function upsertQuestionBankEntries(
  ctx: MutationCtx,
  questions: readonly QuizQuestionWrite[],
) {
  const now = Date.now();
  let insertedCount = 0;
  let updatedCount = 0;

  for (const question of questions) {
    const validationError = validateQuizQuestionWrite(question);
    if (validationError) {
      createJoinError(
        JOIN_ERROR_CODES.invalidQuestionBankEntry,
        validationError,
      );
    }

    const result = await upsertQuestion(ctx, question, now);
    if (result === "inserted") {
      insertedCount += 1;
      continue;
    }

    updatedCount += 1;
  }

  return {
    insertedCount,
    updatedCount,
    totalCount: questions.length,
  };
}

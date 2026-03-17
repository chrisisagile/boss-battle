import type {
  QuizCategory,
  QuizChoiceSeed,
  QuizComplexity,
} from "../../src/data/quiz-questions";
import {
  quizCategories,
  quizComplexities,
} from "../../src/data/quiz-questions";

export const QUIZ_ANSWER_WINDOW_MS = 30_000;

export function isQuizCategory(value: string): value is QuizCategory {
  return quizCategories.includes(value as QuizCategory);
}

export function isQuizComplexity(value: string): value is QuizComplexity {
  return quizComplexities.includes(value as QuizComplexity);
}

export function normalizeChoiceId(value: string) {
  return value.trim().toLowerCase();
}

export function hasValidChoices(
  choices: readonly QuizChoiceSeed[],
  correctChoiceId: string,
) {
  if (choices.length < 2) {
    return false;
  }

  const normalizedIds = choices.map((choice) => normalizeChoiceId(choice.id));
  const uniqueIds = new Set(normalizedIds);

  return (
    uniqueIds.size === choices.length &&
    uniqueIds.has(normalizeChoiceId(correctChoiceId)) &&
    choices.every(
      (choice) => choice.id.trim().length > 0 && choice.text.trim().length > 0,
    )
  );
}

export function validateRoundConfig(
  questionTarget: number,
  categories: readonly string[],
  complexities: readonly string[],
) {
  if (!Number.isInteger(questionTarget) || questionTarget < 1) {
    return "Round question count must be at least 1.";
  }

  if (categories.length === 0 || !categories.every(isQuizCategory)) {
    return "Choose at least one valid category.";
  }

  if (complexities.length === 0 || !complexities.every(isQuizComplexity)) {
    return "Choose at least one valid complexity.";
  }

  return null;
}

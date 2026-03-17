import { describe, expect, it } from "vitest";
import { quizQuestionSeeds } from "../../src/data/quiz-questions";
import { hasValidChoices, validateRoundConfig } from "./quizValidation";

function getSeedQuestion() {
  const question = quizQuestionSeeds[0];
  if (!question) {
    throw new Error("Expected at least one quiz question seed.");
  }
  return question;
}

describe("quizValidation", () => {
  it("accepts well-formed multiple-choice questions", () => {
    const question = getSeedQuestion();

    expect(hasValidChoices(question.choices, question.correctChoiceId)).toBe(
      true,
    );
  });

  it("rejects questions without a valid correct choice", () => {
    const question = getSeedQuestion();

    expect(hasValidChoices(question.choices, "missing")).toBe(false);
  });

  it("rejects questions with blank choice identifiers", () => {
    const question = getSeedQuestion();

    expect(
      hasValidChoices(
        question.choices.map((choice, index) =>
          index === 0 ? { ...choice, id: " " } : choice,
        ),
        question.correctChoiceId,
      ),
    ).toBe(false);
  });

  it("validates round configuration inputs", () => {
    expect(validateRoundConfig(3, ["history"], ["easy"])).toBeNull();
    expect(validateRoundConfig(0, ["history"], ["easy"])).toBeTruthy();
    expect(validateRoundConfig(3, [], ["easy"])).toBeTruthy();
  });
});

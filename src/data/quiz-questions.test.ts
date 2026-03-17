import { describe, expect, it } from "vitest";
import { quizQuestionSeeds } from "./quiz-questions";

describe("quizQuestionSeeds", () => {
  it("provides multiple-choice data for every ready question", () => {
    for (const question of quizQuestionSeeds) {
      expect(question.choices.length).toBeGreaterThanOrEqual(2);
      expect(
        question.choices.some(
          (choice) => choice.id === question.correctChoiceId,
        ),
      ).toBe(true);
    }
  });
});

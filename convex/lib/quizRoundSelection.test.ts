import { describe, expect, it } from "vitest";
import { quizQuestionSeeds } from "../../src/data/quiz-questions";
import {
  buildAssignmentsForBatch,
  canSatisfyRoundForPlayers,
  filterQuestionsForRound,
  selectQuestionForPlayer,
} from "./quizRoundSelection";

const questions = quizQuestionSeeds.map((question, index) => ({
  ...question,
  _id: `question_${index + 1}`,
}));

describe("quizRoundSelection", () => {
  it("filters questions by category and complexity", () => {
    const filtered = filterQuestionsForRound(questions, ["history"], ["easy"]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.category).toBe("history");
    expect(filtered[0]?.complexity).toBe("easy");
  });

  it("selects an unseen question for a player", () => {
    const filtered = filterQuestionsForRound(
      questions,
      ["history"],
      ["easy", "medium"],
    );
    const selected = selectQuestionForPlayer("player_1", filtered, [
      { playerEntryId: "player_1", quizQuestionId: filtered[0]?._id },
    ]);

    expect(selected?._id).toBe(filtered[1]?._id);
  });

  it("detects when a round cannot be satisfied without repeats", () => {
    const filtered = filterQuestionsForRound(questions, ["history"], ["easy"]);

    expect(
      canSatisfyRoundForPlayers([{ _id: "player_1" }], filtered, [], 2),
    ).toBe(false);
  });

  it("builds one assignment per player when enough questions exist", () => {
    const filtered = filterQuestionsForRound(
      questions,
      ["history", "science"],
      ["easy", "medium"],
    );

    const result = buildAssignmentsForBatch(
      [{ _id: "player_1" }, { _id: "player_2" }],
      filtered,
      [],
    );

    expect(result.exhaustedPlayerIds).toHaveLength(0);
    expect(result.assignments).toHaveLength(2);
    expect(
      new Set(result.assignments.map((item) => item.quizQuestionId)).size,
    ).toBe(2);
  });
});

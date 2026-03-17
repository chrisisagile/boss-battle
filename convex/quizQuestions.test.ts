import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";
import {
  upsertQuestionBankEntries,
  validateQuizQuestionWrite,
} from "./lib/quizQuestionBankStore";

function createQuestion(overrides = {}) {
  return {
    sourceKey: "science-medium-space-001",
    prompt: "Which planet in our solar system has the most moons confirmed?",
    choices: [
      { id: "a", text: "Earth" },
      { id: "b", text: "Mars" },
      { id: "c", text: "Saturn" },
      { id: "d", text: "Venus" },
    ],
    correctChoiceId: "c",
    category: "science",
    complexity: "medium",
    tokenReward: 3,
    status: "ready" as const,
    ...overrides,
  };
}

function createUniqueQueryResult(uniqueResult: unknown) {
  return {
    withIndex: vi.fn().mockReturnThis(),
    unique: vi.fn().mockResolvedValue(uniqueResult),
  };
}

describe("quizQuestions", () => {
  it("accepts a well-formed question write", () => {
    expect(validateQuizQuestionWrite(createQuestion())).toBeNull();
  });

  it("accepts supported custom categories", () => {
    expect(
      validateQuizQuestionWrite(
        createQuestion({
          sourceKey: "planetary-science-medium-atmospheres-001",
          category: "planetary-science",
        }),
      ),
    ).toBeNull();
  });

  it("rejects unsupported categories", () => {
    expect(
      validateQuizQuestionWrite(
        createQuestion({
          category: "sports",
        }),
      ),
    ).toContain("supported categories");
  });

  it("inserts new question bank entries", async () => {
    const insert = vi.fn().mockResolvedValue("question_1");
    const patch = vi.fn().mockResolvedValue(undefined);

    const ctx = {
      db: {
        insert,
        patch,
        query: vi.fn().mockReturnValue(createUniqueQueryResult(null)),
      },
    };

    const result = await upsertQuestionBankEntries(ctx as never, [
      createQuestion(),
    ]);

    expect(result).toEqual({
      insertedCount: 1,
      updatedCount: 0,
      totalCount: 1,
    });
    expect(insert).toHaveBeenCalledWith(
      "quizQuestions",
      expect.objectContaining({
        sourceKey: "science-medium-space-001",
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }),
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it("updates existing entries with the same source key", async () => {
    const insert = vi.fn().mockResolvedValue("question_1");
    const patch = vi.fn().mockResolvedValue(undefined);

    const ctx = {
      db: {
        insert,
        patch,
        query: vi.fn().mockReturnValue(
          createUniqueQueryResult({
            _id: "question_1",
            sourceKey: "science-medium-space-001",
          }),
        ),
      },
    };

    const result = await upsertQuestionBankEntries(ctx as never, [
      createQuestion({
        prompt: "Which planet is currently confirmed to have the most moons?",
      }),
    ]);

    expect(result).toEqual({
      insertedCount: 0,
      updatedCount: 1,
      totalCount: 1,
    });
    expect(patch).toHaveBeenCalledWith(
      "question_1",
      expect.objectContaining({
        prompt: "Which planet is currently confirmed to have the most moons?",
        updatedAt: expect.any(Number),
      }),
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("fails fast on invalid question payloads", async () => {
    const ctx = {
      db: {
        insert: vi.fn(),
        patch: vi.fn(),
        query: vi.fn().mockReturnValue(createUniqueQueryResult(null)),
      },
    };

    await expect(
      upsertQuestionBankEntries(ctx as never, [
        createQuestion({
          choices: [{ id: "a", text: "Only one choice" }],
        }),
      ]),
    ).rejects.toBeInstanceOf(ConvexError);
  });
});

import { describe, expect, it, vi } from "vitest";
import { advanceRoundIfNeeded } from "./quizRounds";

function createQueryResult<T>(result: T) {
  return {
    withIndex: vi.fn().mockReturnThis(),
    collect: vi.fn().mockResolvedValue(result),
  };
}

describe("advanceRoundIfNeeded", () => {
  it("completes the round and clears the active session when the target is met", async () => {
    const patch = vi.fn().mockResolvedValue(undefined);
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        _id: "round_1",
        sessionId: "session_1",
        status: "active",
        roundNumber: 2,
        questionTarget: 2,
        questionsCompleted: 1,
      })
      .mockResolvedValueOnce({
        _id: "session_1",
        activeRoundId: "round_1",
      });

    const ctx = {
      db: {
        get,
        patch,
        query: vi.fn().mockReturnValue(
          createQueryResult([
            {
              _id: "assignment_1",
              roundId: "round_1",
              batchNumber: 2,
              status: "scored",
            },
          ]),
        ),
      },
    };

    await advanceRoundIfNeeded(ctx as never, "round_1" as never);

    expect(patch).toHaveBeenCalledTimes(2);
    expect(patch).toHaveBeenNthCalledWith(
      1,
      "round_1",
      expect.objectContaining({
        status: "completed",
        questionsCompleted: 2,
      }),
    );
    expect(patch).toHaveBeenNthCalledWith(
      2,
      "session_1",
      expect.objectContaining({
        activeRoundId: null,
        participationWindowStatus: "idle",
      }),
    );
  });

  it("starts the next assignment batch when the round still has questions left", async () => {
    const patch = vi.fn().mockResolvedValue(undefined);
    const insert = vi
      .fn()
      .mockResolvedValueOnce("assignment_1")
      .mockResolvedValueOnce("assignment_2");
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        _id: "round_1",
        sessionId: "session_1",
        status: "active",
        roundNumber: 2,
        questionTarget: 3,
        questionsCompleted: 1,
        allowedCategories: ["history", "science"],
        allowedComplexities: ["easy", "medium"],
      })
      .mockResolvedValueOnce({
        _id: "session_1",
        activeRoundId: "round_1",
        currentRoundNumber: 2,
        joinStatus: "open",
        participationWindowStatus: "open",
        status: "in_progress",
      });

    const query = vi.fn((table: string) => {
      switch (table) {
        case "quizAssignments":
          return createQueryResult([]);
        case "playerEntries":
          return createQueryResult([
            {
              _id: "player_1",
              joinStatus: "joined",
              eligibleFromRoundNumber: 1,
            },
            {
              _id: "player_2",
              joinStatus: "joined",
              eligibleFromRoundNumber: 1,
            },
          ]);
        case "gameRounds":
          return createQueryResult([{ _id: "round_1" }]);
        case "quizQuestions":
          return createQueryResult([
            {
              _id: "question_1",
              status: "ready",
              category: "history",
              complexity: "easy",
            },
            {
              _id: "question_2",
              status: "ready",
              category: "science",
              complexity: "medium",
            },
          ]);
        default:
          throw new Error(`Unexpected query table: ${table}`);
      }
    });

    const ctx = {
      db: {
        get,
        insert,
        patch,
        query,
      },
    };

    await advanceRoundIfNeeded(ctx as never, "round_1" as never);

    expect(patch).toHaveBeenCalledWith("round_1", { questionsCompleted: 2 });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenNthCalledWith(
      1,
      "quizAssignments",
      expect.objectContaining({
        batchNumber: 3,
        playerEntryId: "player_1",
        quizQuestionId: "question_1",
      }),
    );
    expect(insert).toHaveBeenNthCalledWith(
      2,
      "quizAssignments",
      expect.objectContaining({
        batchNumber: 3,
        playerEntryId: "player_2",
        quizQuestionId: "question_2",
      }),
    );
  });
});

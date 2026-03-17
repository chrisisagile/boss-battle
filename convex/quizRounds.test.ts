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
        phase: "quiz",
      })
      .mockResolvedValueOnce({
        _id: "session_1",
        activeRoundId: "round_1",
        activeEncounterId: null,
        status: "in_progress",
      });

    const ctx = {
      db: {
        get,
        patch,
        query: vi.fn((table: string) => {
          switch (table) {
            case "quizAssignments":
              return createQueryResult([
                {
                  _id: "assignment_1",
                  roundId: "round_1",
                  batchNumber: 2,
                  status: "scored",
                },
              ]);
            case "quizAnswers":
              return createQueryResult([]);
            case "roundParticipants":
              return createQueryResult([]);
            default:
              return createQueryResult([]);
          }
        }),
      },
    };

    await advanceRoundIfNeeded(ctx as never, "round_1" as never);

    expect(patch).toHaveBeenCalledTimes(2);
    expect(patch).toHaveBeenNthCalledWith(
      1,
      "round_1",
      expect.objectContaining({
        questionsCompleted: 2,
        phase: "action_selection",
      }),
    );
    expect(patch).toHaveBeenNthCalledWith(2, "session_1", {
      gamePhase: "action_selection",
      participationWindowStatus: "locked",
      status: "in_progress",
      updatedAt: expect.any(Number),
    });
  });

  it("waits for remaining quiz answers when the full round sheet is not finished", async () => {
    const patch = vi.fn().mockResolvedValue(undefined);
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
        phase: "quiz",
      })
      .mockResolvedValueOnce({
        _id: "session_1",
        activeRoundId: "round_1",
        currentRoundNumber: 2,
        joinStatus: "open",
        participationWindowStatus: "open",
        gamePhase: "quiz",
        status: "in_progress",
      });

    const query = vi.fn((table: string) => {
      switch (table) {
        case "quizAssignments":
          return createQueryResult([
            {
              _id: "assignment_1",
              roundId: "round_1",
              batchNumber: 1,
              status: "scored",
            },
            {
              _id: "assignment_2",
              roundId: "round_1",
              batchNumber: 2,
              status: "presented",
            },
          ]);
        case "roundParticipants":
          return createQueryResult([]);
        case "quizAnswers":
          return createQueryResult([]);
        default:
          throw new Error(`Unexpected query table: ${table}`);
      }
    });

    const ctx = {
      db: {
        get,
        patch,
        query,
      },
    };

    await advanceRoundIfNeeded(ctx as never, "round_1" as never);

    expect(patch).toHaveBeenNthCalledWith(1, "round_1", {
      phase: "waiting_for_players",
    });
    expect(patch).toHaveBeenNthCalledWith(2, "session_1", {
      gamePhase: "waiting_for_players",
      updatedAt: expect.any(Number),
    });
  });
});

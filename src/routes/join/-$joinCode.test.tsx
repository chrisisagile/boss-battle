import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import {
  activeSessionFixture,
  inProgressSessionFixture,
} from "@/test/session-fixtures";
import { JoinByCodePage } from "./$joinCode";

const { joinSessionMock, joinableSessionMock } = vi.hoisted(() => ({
  joinSessionMock: vi.fn(),
  joinableSessionMock: vi.fn(),
}));

vi.mock("@/integrations/convex/join", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/integrations/convex/join")>();

  return {
    ...actual,
    getJoinErrorDetails: () => ({
      code: actual.JOIN_ERROR_CODES.duplicateDisplayName,
      message: "duplicate",
    }),
    logJoinSubmissionFailure: vi.fn(),
    useJoinSessionMutation: () => joinSessionMock,
    useJoinableSession: () => joinableSessionMock(),
  };
});

describe("JoinByCodePage", () => {
  beforeEach(() => {
    joinSessionMock.mockReset();
    joinableSessionMock.mockReset();
    joinableSessionMock.mockReturnValue({
      available: true,
      ...activeSessionFixture,
    });
  });

  it("renders the player join form for active sessions", () => {
    renderApp(<JoinByCodePage joinCode="BATTLE" />);

    expect(screen.getByText("Mobile Join")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Join Battle" }),
    ).toBeInTheDocument();
  });

  it("renders an unavailable message when the session is closed", () => {
    joinableSessionMock.mockReturnValue({
      available: false,
      reason: "closed",
    });

    renderApp(<JoinByCodePage joinCode="BATTLE" />);

    expect(
      screen.getByText("That session is unavailable."),
    ).toBeInTheDocument();
  });

  it("shows next-round copy for in-progress join confirmations", async () => {
    joinableSessionMock.mockReturnValue({
      available: true,
      ...inProgressSessionFixture,
    });
    joinSessionMock.mockResolvedValue({
      currentRoundNumber: 3,
      displayName: "Nova",
      eligibleFromRoundNumber: 4,
    });

    const { user } = renderApp(<JoinByCodePage joinCode="LATE99" />);
    await user.type(screen.getByRole("textbox"), "Nova");
    await user.click(screen.getByRole("button", { name: "Join Battle" }));

    expect(
      await screen.findByText("You are in the party."),
    ).toBeInTheDocument();
    expect(screen.getByText(/round 4/i)).toBeInTheDocument();
  });
});

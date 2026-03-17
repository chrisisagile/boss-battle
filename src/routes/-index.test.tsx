import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import { activeSessionFixture } from "@/test/session-fixtures";
import { HomePage } from "./index";

const { createSessionMock, currentActiveSessionMock, navigateMock } =
  vi.hoisted(() => ({
    createSessionMock: vi.fn(),
    currentActiveSessionMock: vi.fn(),
    navigateMock: vi.fn(),
  }));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/integrations/convex/join", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/integrations/convex/join")>();
  return {
    ...actual,
    getJoinErrorDetails: () => ({
      code: null,
      message: "failed",
    }),
    useCreateSessionMutation: () => createSessionMock,
    useCurrentActiveSession: () => currentActiveSessionMock(),
  };
});

describe("HomePage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    createSessionMock.mockReset();
    currentActiveSessionMock.mockReset();
    currentActiveSessionMock.mockReturnValue(null);
  });

  it("renders the host launch screen", () => {
    renderApp(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Start a Boss Battle session.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Create Session",
      }),
    ).toBeInTheDocument();
  });

  it("keeps create as the primary action when an active session exists", () => {
    currentActiveSessionMock.mockReturnValue(activeSessionFixture);

    renderApp(<HomePage />);

    expect(
      screen.getByRole("button", {
        name: "Create Session",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Resume Session",
      }),
    ).toBeInTheDocument();
  });

  it("creates a session and navigates to the host lobby", async () => {
    createSessionMock.mockResolvedValue({
      joinCode: "ABC123",
    });
    const { user } = renderApp(<HomePage />);

    await user.click(
      screen.getByRole("button", {
        name: "Create Session",
      }),
    );

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith({
      params: { joinCode: "ABC123" },
      to: "/host/$joinCode",
    });
  });

  it("shows an error when session creation fails", async () => {
    createSessionMock.mockRejectedValue(new Error("failed"));
    const { user } = renderApp(<HomePage />);

    await user.click(
      screen.getByRole("button", {
        name: "Create Session",
      }),
    );

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("failed")).toBeInTheDocument();
  });

  it("resumes the current active session from the landing page", async () => {
    currentActiveSessionMock.mockReturnValue(activeSessionFixture);
    const { user } = renderApp(<HomePage />);

    await user.click(
      screen.getByRole("button", {
        name: "Resume Session",
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith({
      params: { joinCode: activeSessionFixture.joinCode },
      to: "/host/$joinCode",
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });
});

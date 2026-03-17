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

vi.mock("@/integrations/convex/join", () => ({
  getJoinErrorDetails: () => ({
    code: null,
    message: "failed",
  }),
  useCreateSessionMutation: () => createSessionMock,
  useCurrentActiveSession: () => currentActiveSessionMock(),
}));

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
});

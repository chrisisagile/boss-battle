import { describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "@/test/render";
import { JoinCodeEntryPage } from "./index";

const { navigateMock } = vi.hoisted(() => ({
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

describe("JoinCodeEntryPage", () => {
  it("renders the manual join form", () => {
    renderApp(<JoinCodeEntryPage />);

    expect(screen.getByText("Phone Join")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue To Join" }),
    ).toBeInTheDocument();
  });
});

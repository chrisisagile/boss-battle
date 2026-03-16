import { describe, expect, it } from "vitest";
import { renderApp, screen } from "@/test/render";
import { HomePage } from "./index";

describe("HomePage", () => {
  it("renders the stripped-down application contract", () => {
    renderApp(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Clean application base. No demo routes, no fake data.",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Routing")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Infra")).toBeInTheDocument();
  });
});

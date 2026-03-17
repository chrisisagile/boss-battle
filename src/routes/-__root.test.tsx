import { describe, expect, it } from "vitest";
import { renderApp, screen } from "@/test/render";
import { AppShellLayout } from "./__root";

describe("AppShellLayout", () => {
  it("renders the shared application shell chrome", () => {
    renderApp(
      <AppShellLayout>
        <main>
          <h1>Round setup</h1>
        </main>
      </AppShellLayout>,
    );

    expect(screen.getByText("Boss Battle")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Round setup" }),
    ).toBeInTheDocument();
  });
});

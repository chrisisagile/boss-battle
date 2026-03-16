import { describe, expect, it, vi } from "vitest";
import { renderApp, screen } from "./render";

describe("renderApp", () => {
  it("provides a working user-event instance for interactive tests", async () => {
    const onClick = vi.fn();
    const { user } = renderApp(
      <button onClick={onClick} type="button">
        Ready
      </button>,
    );

    await user.click(screen.getByRole("button", { name: "Ready" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the shared test environment stubs", () => {
    renderApp(<div>Harness ready</div>);

    expect(import.meta.env.VITE_CONVEX_URL).toBe("http://127.0.0.1:3210");
    expect(screen.getByText("Harness ready")).toBeInTheDocument();
  });
});

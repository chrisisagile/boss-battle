import { describe, expect, it } from "vitest";
import { renderApp, screen } from "@/test/render";
import { Button } from "./button";

describe("Button", () => {
  it("renders a native button by default", () => {
    renderApp(<Button>Start battle</Button>);

    expect(
      screen.getByRole("button", { name: "Start battle" }),
    ).toBeInTheDocument();
  });

  it("renders the child element when asChild is enabled", () => {
    renderApp(
      <Button asChild>
        <a href="/join">Join now</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Join now" });

    expect(link).toHaveAttribute("href", "/join");
    expect(link).toHaveAttribute("data-slot", "button");
  });
});

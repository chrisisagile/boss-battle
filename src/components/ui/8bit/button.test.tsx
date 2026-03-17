import { describe, expect, it } from "vitest";
import { renderApp, screen } from "@/test/render";
import { Button } from "./button";

describe("8bit Button", () => {
  it("keeps outline buttons on semantic card/foreground colors", () => {
    renderApp(<Button variant="outline">Resume Session</Button>);

    expect(screen.getByRole("button", { name: "Resume Session" })).toHaveClass(
      "bg-card",
      "text-foreground",
    );
  });

  it("does not apply the base half-opacity disabled treatment", () => {
    renderApp(<Button disabled>Summoning...</Button>);

    expect(screen.getByRole("button", { name: "Summoning..." })).toHaveClass(
      "disabled:opacity-100",
      "disabled:brightness-95",
      "disabled:saturate-60",
    );
  });
});

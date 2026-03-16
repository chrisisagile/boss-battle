import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes so the last conflicting utility wins", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values while preserving valid class names", () => {
    expect(cn("rounded-md", false && "hidden", undefined, "text-sm")).toBe(
      "rounded-md text-sm",
    );
  });
});

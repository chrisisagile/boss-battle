import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("VITE_CONVEX_URL", "http://127.0.0.1:3210");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

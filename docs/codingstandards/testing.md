---
title: Testing Standards
description: Repository policy for fast unit and component tests, Aspire-backed browser smoke tests, naming, and test ownership.
doc_type: coding_standard
status: active
stack:
  - testing
  - vitest
  - testing-library
  - aspire
  - playwright
applies_to:
  - src/
  - devops/tests/
  - package.json
  - vitest.config.ts
keywords:
  - testing
  - vitest
  - testing library
  - playwright
  - aspire testing
  - e2e
  - smoke tests
---

# Testing Standards

## Purpose

Define how this repository verifies behavior with fast frontend tests and Aspire-backed browser smoke tests.

## Rules

- Must add or update tests when behavior changes.
- Must keep `pnpm test` fast, isolated, and deterministic. It must not require Docker, Aspire startup, or live Convex services.
- Must pair behavior checks with `pnpm exec tsc --noEmit` whenever TypeScript, TSX, Convex, or generated client contracts change.
- Must run `pnpm test:e2e` before calling work complete when changes affect user-facing flows, route rendering, AppHost wiring, Convex runtime behavior, or browser-visible integration between the web app and backend.
- Must colocate JS unit and component tests as `*.test.ts` or `*.test.tsx` beside the code they verify.
- Must prefix tests under `src/routes/` with TanStack Router's ignore prefix, such as `-index.test.tsx`, so they stay colocated without becoming route modules.
- Must keep browser E2E in the Aspire-backed test project under `devops/tests/`, not in ad hoc shell scripts or standalone Node runners.
- Must route all browser smoke and E2E coverage through Aspire so the environment contract matches the real AppHost graph.
- Must keep assertions behavioral. Verify rendered output, accessible roles, class-merging behavior, and real page readiness instead of implementation details.
- Must keep generated files out of test assertions unless generation itself is the behavior under test.
- Must keep unit and component tests free of hidden network dependencies.

## Preferred Patterns

- Prefer small Vitest tests for pure utilities, route components, and UI primitives.
- Prefer shared test helpers in `src/test/` for rendering and environment setup.
- Prefer one Aspire-backed smoke suite that proves the AppHost can boot the web app and serve the home route through a real browser.
- Prefer polling the real `web-app` endpoint through Aspire-assigned URLs instead of hard-coded localhost ports.
- Prefer readable test names that describe the user-visible contract.

## Avoid

- Avoid snapshot-heavy test suites for UI that can be asserted more directly.
- Avoid broad end-to-end coverage as a substitute for fast unit and component tests.
- Avoid mocking framework internals when a plain render or utility test will do.
- Avoid asserting on generated route tree output or Convex `_generated` files.
- Avoid putting slow Docker-dependent tests into Husky pre-commit hooks.

## Repo Notes

- `pnpm test` is the fast suite for Vitest and Testing Library.
- `pnpm test:watch` is the local watch mode for the same fast suite.
- `pnpm test:e2e` is the Aspire-backed browser smoke suite and depends on Docker plus Playwright browser installation.
- `pnpm test:all` is the aggregate local validation path when the machine has the full infra prerequisites.
- `src/test/render.tsx` and `src/test/setup.ts` are the shared frontend harness seams. Keep test helpers there instead of copy-pasting setup into each test file.
- For feature work that changes host/player gameplay flows, Convex-backed browser interactions, or runtime startup contracts, completion requires `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm test:e2e`.

## Running Tests

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm test:watch
pnpm test:e2e:install
pnpm test:e2e
pnpm test:all
```

- Use `pnpm test` for routine frontend unit and component validation.
- Use `pnpm exec tsc --noEmit` as the required static contract check for TypeScript and Convex changes.
- Use `pnpm test:watch` while actively changing UI or route code.
- Run `pnpm test:e2e:install` once per machine or after Playwright package upgrades.
- Use `pnpm test:e2e` as a required gate when changing gameplay flows, AppHost wiring, provider setup, route shell behavior, startup contracts, or Convex-backed browser behavior that needs a real browser.

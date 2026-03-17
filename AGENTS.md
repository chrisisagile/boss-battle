# The App

Mega Boss Battle is a live multiplayer audience game where players join by QR code, answer short quiz questions on their phones to earn action tokens, and then spend those tokens on team battle actions like Attack, Guard, Heal, or Charge. At the end of each round, all player choices are aggregated, the boss and party states are updated, and the shared results are displayed on the projector in real time. The team wins by defeating the boss before the party HP reaches zero or the round limit expires.

# Repo Instructions

## Coding Standards

The repository coding standards live under `docs/codingstandards/` and apply to all changes in this repo.

- Start with `docs/codingstandards/README.md`.
- Treat every `Must` statement in those documents as required policy.
- Use `docs/codingstandards/shared.md` together with the most specific stack document that applies to the files you are changing.
- Update the relevant standards doc in the same change when you introduce a new seam, workflow, ownership boundary, or required tool behavior.

Current standards set:

- `docs/codingstandards/shared.md`
- `docs/codingstandards/testing.md`
- `docs/codingstandards/react.md`
- `docs/codingstandards/tanstack-start.md`
- `docs/codingstandards/shadcn.md`
- `docs/codingstandards/convex.md`
- `docs/codingstandards/aspire.md`

## Repo Boundaries

- `src/` contains the React and TanStack Start application code.
- `src/components/ui/` contains owned shadcn UI source and UI variations, with 8bitcn as the approved retro registry.
- `convex/` contains the Convex schema and generated client boundary.
- `devops/` contains the Aspire AppHost and operational scripts, not application business logic.

## Generated And Local Artifacts

- Do not manually edit `src/routeTree.gen.ts`.
- Do not manually edit anything under `convex/_generated/`.
- Treat local env files and machine-local orchestration state as operational artifacts unless the repo explicitly documents them as committed source.

## Validation

- Keep Biome passing for JS, TS, JSON, and CSS changes.
- Run `pnpm exec tsc --noEmit` for TypeScript, TSX, Convex, and generated client contract changes before considering the work complete.
- Add or update fast tests for changed behavior, and keep `pnpm test` deterministic and Docker-free.
- Keep browser E2E in the Aspire-backed test project under `devops/tests/`.
- Run `pnpm test:e2e` before considering work complete when changes affect user-facing flows, route rendering, AppHost wiring, Convex runtime behavior, or browser-visible web-to-backend integration.
- Keep commit messages conventional and sentence-case so commitlint and Husky pass.
- Prefer focused validation for the area you changed, but call out clearly when the repo has no meaningful automated coverage for that path yet.

## Active Technologies
- TypeScript 5.7, React 19, TSX + TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, shadcn/8bitcn registry, `qrcode.react` (001-qr-game-join)
- Convex tables for `gameSessions` and `playerEntries`, plus browser `localStorage` for a per-device join identity (001-qr-game-join)
- TypeScript 5.7, React 19, Convex functions in JavaScript + TanStack Start, TanStack Router, TanStack Query, Tailwind CSS v4, Convex, `@convex-dev/react-query`, Cloudflare/Wrangler (002-quiz-token-awards)
- Convex tables for sessions, rounds, question bank, assignments, answers, and player token balances; browser local storage for player device identity (002-quiz-token-awards)
- TypeScript 5.7, React 19, Convex functions in JavaScript + TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, Cloudflare/Wrangler, owned shadcn/8bitcn UI including `PlayerProfileCard` plus repo-owned wrappers for `Character Sheet`, `Enemy Health Display`, `Mana Bar`, and `Health Bar` (003-persistent-battle-state)
- Convex tables for sessions, player entries, boss catalog, encounter state, combatant state, and skill definitions; browser `localStorage` only for per-device join identity (003-persistent-battle-state)
- TypeScript 5.7, React 19, Convex functions in TypeScript + TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, Cloudflare/Wrangler (004-game-loop)
- Convex tables for sessions, player entries, quiz rounds, assignments, answers, battle encounters, combatant states, boss definitions, and skill definitions; browser `localStorage` for per-device join identity (004-game-loop)
- TypeScript 5.7, React 19, Convex functions in TypeScript + TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, repo-owned 8bit UI wrappers, Cloudflare/Wrangler (feat/005-battle-feedback-balance)
- Convex tables for sessions, rounds, round participants, encounters, combatants, battle exchanges, skills, and boss definitions; browser `localStorage` for per-device join identity (feat/005-battle-feedback-balance)

## Recent Changes
- 001-qr-game-join: Added TypeScript 5.7, React 19, TSX + TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, shadcn/8bitcn registry, `qrcode.react`

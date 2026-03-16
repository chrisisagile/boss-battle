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
- Add or update fast tests for changed behavior, and keep `pnpm test` deterministic and Docker-free.
- Keep browser E2E in the Aspire-backed test project under `devops/tests/`.
- Keep commit messages conventional and sentence-case so commitlint and Husky pass.
- Prefer focused validation for the area you changed, but call out clearly when the repo has no meaningful automated coverage for that path yet.

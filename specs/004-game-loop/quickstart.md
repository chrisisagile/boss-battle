# Quickstart: Game Loop

## 1. Review the planning artifacts

- Read [spec.md](/home/chris/dev/personal/boss-battle/specs/004-game-loop/spec.md)
- Read [plan.md](/home/chris/dev/personal/boss-battle/specs/004-game-loop/plan.md)
- Read [research.md](/home/chris/dev/personal/boss-battle/specs/004-game-loop/research.md)
- Read [data-model.md](/home/chris/dev/personal/boss-battle/specs/004-game-loop/data-model.md)
- Read [route-game-loop-contract.md](/home/chris/dev/personal/boss-battle/specs/004-game-loop/contracts/route-game-loop-contract.md)
- Read [convex-game-loop-contract.md](/home/chris/dev/personal/boss-battle/specs/004-game-loop/contracts/convex-game-loop-contract.md)

## 2. Extend the Convex game-loop core first

- Update `convex/schema.ts` only through source edits plus regenerated outputs
- Extend `convex/gameSessions.ts` for room lock, lifecycle, and results-state
  summary fields
- Extend `convex/quizRounds.ts` and `convex/quizAssignments.ts` for explicit
  round phases, exchange counts, and current-player progress markers
- Extend `convex/playerEntries.ts` for room-start lock semantics and rejoin
  behavior
- Extend `convex/battleState.ts` and `convex/lib/battleState.ts` for automatic
  boss turns, target-aware player turns, random tie-breaking, exchange
  resolution, and final results transitions

## 3. Wire the host and player route shells

- Update `src/routes/index.tsx` to keep room creation isolated while preserving
  the current create/resume behavior
- Update `src/routes/host/$joinCode.tsx` and `src/components/join/` so the host
  can run lobby setup, view quiz completion markers, observe battle exchanges,
  and render final results from one live summary
- Update `src/routes/join/$joinCode.tsx` and supporting components so the
  player route can move cleanly through join, quiz, waiting, action-selection,
  removed/rejoin, and results states
- Keep Convex hook and logging changes centralized in
  `src/integrations/convex/join.ts`

## 3a. Review coding standards before and during implementation

- Read `docs/codingstandards/README.md` and the applicable standards documents
  before making changes
- If delegated subagents are available and allowed, run a dedicated
  standards-review subagent after each major slice to assess the changed code
  against `docs/codingstandards/`
- If that review suggests editing `docs/codingstandards/`, stop and ask the
  user before making any standards changes

## 4. Validate the feature

Run the narrowest useful checks first:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

Use focused test runs while iterating on the main game-loop seams:

```bash
pnpm test -- --run src/routes/-index.test.tsx src/routes/host/-\$joinCode.test.tsx src/routes/join/-\$joinCode.test.tsx
pnpm test -- --run src/components/join/host-battle-setup.test.tsx src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx
pnpm test -- --run convex/quizRounds.test.ts convex/battleState.test.ts convex/lib/quizRoundSelection.test.ts
```

If Convex schema or generated client contracts change, also run:

```bash
pnpm exec convex codegen
```

Because this feature changes user-facing host/player flows and Convex-backed
browser behavior, the final validation gate also includes:

```bash
pnpm test:e2e
```

Run focused integration checks incrementally after each major slice:

- After room creation and host lobby changes:

```bash
pnpm test -- --run src/routes/-index.test.tsx src/routes/host/-\$joinCode.test.tsx src/components/join/host-battle-setup.test.tsx
```

- After quiz progression or waiting-state changes:

```bash
pnpm test -- --run src/routes/join/-\$joinCode.test.tsx convex/quizRounds.test.ts convex/lib/quizRoundSelection.test.ts
```

- After battle resolution, disconnect, rejoin, or results-state changes:

```bash
pnpm test -- --run convex/battleState.test.ts src/routes/host/-\$joinCode.test.tsx src/routes/join/-\$joinCode.test.tsx src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx
```

When implementation appears complete, run:

```bash
pnpm test:e2e
```

If a focused integration test or the final `pnpm test:e2e` gate fails:

- investigate the failure in the same slice first
- fix the issue before continuing when it is related to the active game-loop work
- rerun the failing command after the fix
- if the failure is proven unrelated, record the exact command and the blocking reason before moving on

If the standards-review subagent finds a mismatch:

- fix the code to conform before continuing when the standards already cover the case
- if the finding would require changing `docs/codingstandards/`, stop and ask the user before editing those docs

## 5. Prepare for task breakdown

- Generate `tasks.md` from this planning package
- Group tasks by user story: room and lobby start, quiz-to-battle round
  execution, and game completion/results
- Include tasks for route state coverage, Convex domain tests, logging/context,
  and generated-file refreshes when schema contracts change

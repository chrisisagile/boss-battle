# Quickstart: Battle Feedback and Balance

## 1. Review the planning artifacts

- Read [spec.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/spec.md)
- Read [plan.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/plan.md)
- Read [research.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/research.md)
- Read [data-model.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/data-model.md)
- Read [route-battle-feedback-contract.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/contracts/route-battle-feedback-contract.md)
- Read [convex-battle-feedback-contract.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/contracts/convex-battle-feedback-contract.md)

## 2. Extend the Convex battle core first

- Update `convex/schema.ts` to add the exchange-scoped activity event payload
- Extend `convex/battleState.ts` so `resolveBattleExchange` persists ordered
  activity events and applies the updated balance baseline
- Move any new balance literals into named helpers or constants in
  `convex/lib/battleState.ts`
- Extend `convex/quizRounds.ts` and any host-summary seam used by
  `gameSessions.getHostOverview` so both host and player queries can surface
  the same `battleActivity` payload

## 3. Wire the host and player battle surfaces

- Update `src/integrations/convex/join.ts` to expose the extended summary data
  and any additional battle-resolution logging needed for feed failures
- Update `src/components/join/host-battle-arena.tsx` to render the shared feed
  beside party and boss state
- Update `src/components/join/player-battle-profile.tsx` to render the same
  feed without blocking player action controls
- Add or extend a repo-owned retro dialogue component under `src/components/join/`
  and `src/components/ui/8bit/` rather than depending on an external runtime UI

## 3a. Review coding standards before implementation

- Read `docs/codingstandards/README.md` and the applicable shared, testing,
  React, TanStack Start, shadcn, and Convex standards docs before changing code
- If delegated subagents are available and allowed, run a dedicated
  standards-review subagent after the main implementation slices and before merge
- If the work appears to require a coding standards edit, stop and ask the user
  before changing `docs/codingstandards/`

## 4. Validate the feature

Run the narrowest useful checks first:

```bash
pnpm exec tsc --noEmit
pnpm exec tsc -p convex/tsconfig.json --noEmit
pnpm lint
pnpm test
```

Use focused runs while iterating:

```bash
pnpm test -- --run convex/battleState.test.ts
pnpm test -- --run src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx
pnpm test -- --run src/routes/host/-\$joinCode.test.tsx src/routes/join/-\$joinCode.test.tsx
```

If Convex schema or generated client contracts change, also run:

```bash
pnpm exec convex codegen
```

Because this feature changes browser-visible host/player battle behavior and
Convex-backed live state, the final validation gate also includes:

```bash
pnpm test:e2e
```

Run focused checks incrementally after each major slice:

- After Convex exchange-event persistence and balance tuning:

```bash
pnpm test -- --run convex/battleState.test.ts
```

- After host feed rendering:

```bash
pnpm test -- --run src/components/join/host-battle-arena.test.tsx src/routes/host/-\$joinCode.test.tsx
```

- After player feed rendering and battle-state branching:

```bash
pnpm test -- --run src/components/join/player-battle-profile.test.tsx src/routes/join/-\$joinCode.test.tsx
```

When implementation appears complete, run:

```bash
pnpm test:e2e
```

If a focused test or `pnpm test:e2e` fails:

- investigate the failure in the same implementation effort first
- fix and rerun the failing command when it is related to this feature
- document only proven unrelated blockers with the exact failing command and reason

## 5. Prepare for task breakdown

- Generate `tasks.md` from this planning package
- Group tasks by user story: shared battle activity feed, special outcome
  visibility, and survivability rebalance
- Include tasks for Convex schema and battle-resolution updates, shared feed UI,
  route-state coverage, and final browser validation

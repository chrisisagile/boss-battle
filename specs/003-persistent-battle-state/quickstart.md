# Quickstart: Persistent Battle State

## 1. Review the planning artifacts

- Read [spec.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/spec.md)
- Read [plan.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/plan.md)
- Read [research.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/research.md)
- Read [data-model.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/data-model.md)
- Read [route-battle-contract.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/contracts/route-battle-contract.md)
- Read [convex-battle-contract.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/contracts/convex-battle-contract.md)

## 2. Implement Convex battle state first

- Extend `convex/schema.js` with boss-catalog, encounter, combatant, and skill entities
- Add or extend Convex modules for boss authoring, encounter start, player action submission, round resolution, host summaries, and player battle-state summaries
- Preserve the existing join and quiz contracts while extending them with battle-aware fields rather than replacing them wholesale

## 3. Wire host, projector, and player surfaces

- Update `src/routes/host/$joinCode.tsx` and supporting host components for encounter setup, between-round party summaries, and live arena rendering
- Update `src/routes/join/$joinCode.tsx` and supporting player components for join gating, combat profile display, action selection, knockout state, and post-round summaries
- Add owned 8bit wrappers under `src/components/ui/8bit/` for the approved battle presentation blocks and use them from repo-owned gameplay components
- Keep loading, empty, success, blocked, knockout, victory, defeat, and error states explicit in both route trees

## 4. Validate the feature

Run the narrowest useful checks first:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

If Convex schema or generated client contracts change, also run:

```bash
pnpm exec convex codegen
```

If host/projector route-shell behavior changes materially, also run:

```bash
pnpm test:e2e
```

## 5. Prepare for task breakdown

- Generate `tasks.md` from this plan package
- Keep tasks grouped by user story so battle persistence, player decision-making, and boss authoring remain independently testable slices
- Include tasks for battle-state validation, loading/error states, and any required generated-file refreshes

## 6. Validation outcomes

Completed validation for the current implementation snapshot:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm test -- --run src/routes/host/-$joinCode.test.tsx src/routes/join/-$joinCode.test.tsx
pnpm test -- --run convex/battleState.test.ts src/components/join/host-battle-arena.test.tsx src/components/join/host-battle-setup.test.tsx src/components/join/player-battle-profile.test.tsx src/routes/host/-$joinCode.test.tsx src/routes/join/-$joinCode.test.tsx
```

Current results:

- `pnpm exec tsc --noEmit`: pass
- `pnpm lint`: pass
- `pnpm test`: pass
- `pnpm exec convex codegen`: blocked because `CONVEX_DEPLOYMENT` is not set in this shell
- `pnpm test:e2e`: not run yet because the AppHost browser coverage task is still open

# Quickstart: Quiz Token Awards

## 1. Review the active spec and plan

- Read [spec.md](/home/chris/dev/personal/boss-battle/specs/002-quiz-token-awards/spec.md)
- Read [plan.md](/home/chris/dev/personal/boss-battle/specs/002-quiz-token-awards/plan.md)
- Read [research.md](/home/chris/dev/personal/boss-battle/specs/002-quiz-token-awards/research.md)

## 2. Implement the Convex domain first

- Extend `convex/schema.js` with quiz question, round, assignment, and answer entities
- Add Convex modules for round lifecycle, question assignment, answer scoring, and host/player summaries
- Preserve existing `gameSessions` and `playerEntries` behavior while adding token and round fields

## 3. Wire host and player routes

- Update `src/routes/host/$joinCode.tsx` and supporting host components for round setup, progress, and failure states
- Update `src/routes/join/$joinCode.tsx` and supporting player components for question display, answer submission, correctness feedback, and token balance updates
- Render active quiz questions with the 8bitcn `Card` component
- Show round-start transitions with the 8bitcn gaming `Chapter Intro` block on both host/projector and player screens
- Show quiz-earned points at quiz end with the 8bitcn gaming `Leaderboard` block
- Keep loading, empty, success, and error states explicit in both route trees

## 4. Validate the feature

Run the narrowest useful checks first:

```bash
pnpm test
```

If route-shell or AppHost behavior changes materially, also run:

```bash
pnpm test:e2e
```

### Verification outcomes

- `pnpm exec tsc --noEmit`: passed on 2026-03-17
- `pnpm lint`: passed on 2026-03-17
- `pnpm test`: passed on 2026-03-17 (`13` files, `30` tests)
- `pnpm exec convex codegen`: blocked on 2026-03-17 because `CONVEX_DEPLOYMENT` was not set in this shell

### Generated artifacts note

- `src/routeTree.gen.ts` did not require regeneration because no route file structure changed.
- `convex/_generated/` could not be regenerated in this shell without a configured Convex deployment context.

## 5. Prepare for task breakdown

- Use this plan plus the data model and contract docs to generate `tasks.md`
- Keep tasks grouped by user story so each slice stays independently testable

# Tasks: Battle Feedback and Balance

**Input**: Design documents from `/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Focused integration coverage is required for each implementation slice. Because this feature changes browser-visible host/player battle flows and Convex-backed live state, the final implementation-complete gate also runs `pnpm test:e2e`; if it fails, fix and rerun before calling the work complete unless the failure is proven unrelated and documented.

**Organization**: Tasks are grouped by user story so each story can be implemented, validated, and demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after listed dependencies are in place
- **[Story]**: Story ownership label for user-story phases only (`[US1]`, `[US2]`, `[US3]`)
- Every task includes the exact file path(s) it changes or validates

## Phase 1: Setup

**Purpose**: Confirm the applicable standards, active design package, and review workflow before editing runtime code.

- [X] T001 Review `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, `docs/codingstandards/shadcn.md`, and `docs/codingstandards/convex.md`
- [X] T002 [P] Review `specs/005-battle-feedback-balance/spec.md`, `specs/005-battle-feedback-balance/plan.md`, `specs/005-battle-feedback-balance/research.md`, `specs/005-battle-feedback-balance/data-model.md`, `specs/005-battle-feedback-balance/contracts/route-battle-feedback-contract.md`, and `specs/005-battle-feedback-balance/contracts/convex-battle-feedback-contract.md`
- [ ] T003 [P] If delegated subagents are available and allowed, run a standards-review subagent against `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, `docs/codingstandards/shadcn.md`, and `docs/codingstandards/convex.md`
- [X] T004 If implementation appears to require editing `docs/codingstandards/README.md` or any file under `docs/codingstandards/`, stop and ask the user before touching those paths

---

## Phase 2: Foundational

**Purpose**: Build the shared exchange-feed contract, schema, and UI seams that all user stories depend on.

**Checkpoint**: Do not start user-story implementation until these tasks are complete.

- [X] T005 Update `convex/schema.ts` to add structured `activityEvents` storage on `battleExchanges` for ordered exchange-scoped battle feed data
- [X] T006 [P] Extend `convex/gameSessions.ts` and `convex/quizRounds.ts` so the host and player summary queries both project the same `battleActivity` shape from the active exchange
- [ ] T007 [P] Extend `src/integrations/convex/join.ts` to type and expose the shared `battleActivity` summary plus any additional battle-feed logging helpers
- [X] T008 [P] Create a shared retro dialogue surface in `src/components/join/battle-dialogue-feed.tsx` and any supporting wrapper in `src/components/ui/8bit/`
- [X] T009 [P] Refresh fixtures for battle feed and combatant state in `src/test/session-fixtures.ts` and any related test helpers under `src/test/`
- [X] T010 Run `pnpm exec convex codegen` to refresh generated Convex contracts under `convex/_generated/`

---

## Phase 3: User Story 1 - Follow live battle actions (Priority: P1) 🎯 MVP

**Goal**: Show the same ordered current-action plus recent-history feed on both host and player battle surfaces during exchange resolution.

**Independent Test**: Start a battle exchange and verify that each monster and player action appears on both the host arena and player devices in the same order it resolves, including actor, target, action type, and immediate outcome.

### Tests for User Story 1

- [X] T011 [P] [US1] Expand Convex exchange-feed coverage in `convex/battleState.test.ts` for ordered event persistence on boss and player turns
- [X] T012 [P] [US1] Expand host/player route coverage in `src/routes/host/-$joinCode.test.tsx` and `src/routes/join/-$joinCode.test.tsx` for battle-resolution feed visibility on both surfaces
- [X] T013 [P] [US1] Expand component coverage in `src/components/join/host-battle-arena.test.tsx`, `src/components/join/player-battle-profile.test.tsx`, and `src/components/join/battle-dialogue-feed.test.tsx` for current-action and recent-history rendering
- [ ] T014 [P] [US1] Keep Aspire/browser coverage current in `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs` for shared battle-feed rendering in the live host/player flow

### Implementation for User Story 1

- [X] T015 [US1] Extend `convex/battleState.ts` to persist ordered `activityEvents` during `resolveBattleExchange`
- [X] T016 [US1] Extend `convex/gameSessions.ts` to expose active exchange feed data from `gameSessions.getHostOverview`
- [X] T017 [US1] Extend `convex/quizRounds.ts` to expose the same active exchange feed data from `quizRounds.getPlayerQuizState`
- [X] T018 [US1] Integrate the shared dialogue feed into `src/components/join/host-battle-arena.tsx` using `src/components/join/battle-dialogue-feed.tsx`
- [X] T019 [US1] Integrate the shared dialogue feed into `src/components/join/player-battle-profile.tsx` using `src/components/join/battle-dialogue-feed.tsx`
- [X] T020 [US1] Update `src/routes/host/$joinCode.tsx` and `src/routes/join/$joinCode.tsx` to pass the shared `battleActivity` data and render the feed in battle-resolution states
- [X] T021 [US1] Run `pnpm test -- --run convex/battleState.test.ts src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx src/components/join/battle-dialogue-feed.test.tsx src/routes/host/-$joinCode.test.tsx src/routes/join/-$joinCode.test.tsx` and fix or explicitly document any related failures before US2
- [ ] T022 [US1] If delegated subagents are available and allowed, run a standards-review subagent against `src/components/join/battle-dialogue-feed.tsx`, `src/components/join/host-battle-arena.tsx`, `src/components/join/player-battle-profile.tsx`, `src/routes/host/$joinCode.tsx`, `src/routes/join/$joinCode.tsx`, `src/integrations/convex/join.ts`, `convex/gameSessions.ts`, `convex/quizRounds.ts`, and `convex/battleState.ts`, then address findings before closing US1

---

## Phase 4: User Story 2 - Understand special and failed outcomes (Priority: P2)

**Goal**: Make healing, guarding, misses, skipped actions, and knockouts explicit and understandable on both battle surfaces.

**Independent Test**: Run exchanges that include damage, healing, guarding, misses, skipped actions, and knockouts, then confirm the host arena and player devices call out each outcome clearly and in sequence.

### Tests for User Story 2

- [X] T023 [P] [US2] Expand Convex outcome coverage in `convex/battleState.test.ts` for healing, guard reduction, missed attacks, skipped actions, and knockout event emission
- [ ] T024 [P] [US2] Expand route coverage in `src/routes/host/-$joinCode.test.tsx` and `src/routes/join/-$joinCode.test.tsx` for special-outcome and knockout feed states
- [ ] T025 [P] [US2] Expand component coverage in `src/components/join/host-battle-arena.test.tsx`, `src/components/join/player-battle-profile.test.tsx`, and `src/components/join/battle-dialogue-feed.test.tsx` for distinct outcome messaging and ordering

### Implementation for User Story 2

- [X] T026 [US2] Extend `convex/battleState.ts` to emit structured outcome types and summary text for heal, guard, miss, skipped, and knockout events
- [X] T027 [US2] Extend `convex/gameSessions.ts` and `convex/quizRounds.ts` so special outcomes and knockout states are exposed consistently in host/player feed projections
- [X] T028 [US2] Update `src/components/join/battle-dialogue-feed.tsx` to render distinct copy and visual treatment for heal, guard, miss, skipped, and knockout outcomes
- [ ] T029 [US2] Update `src/components/join/host-battle-arena.tsx`, `src/components/join/player-battle-profile.tsx`, and `src/components/join/battle-status-messages.ts` so special outcomes remain understandable alongside changing combat state
- [ ] T030 [US2] Run `pnpm test -- --run convex/battleState.test.ts src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx src/components/join/battle-dialogue-feed.test.tsx src/routes/host/-$joinCode.test.tsx src/routes/join/-$joinCode.test.tsx` and fix or explicitly document any related failures before US3
- [ ] T031 [US2] If delegated subagents are available and allowed, run a standards-review subagent against `src/components/join/battle-dialogue-feed.tsx`, `src/components/join/host-battle-arena.tsx`, `src/components/join/player-battle-profile.tsx`, `src/components/join/battle-status-messages.ts`, `convex/gameSessions.ts`, `convex/quizRounds.ts`, and `convex/battleState.ts`, then address findings before closing US2

---

## Phase 5: User Story 3 - Keep battles survivable and competitive (Priority: P3)

**Goal**: Rebalance standard encounters so players start with more staying power and default monster pressure no longer overwhelms the party before players can act.

**Independent Test**: Start new standard encounters with a full party, resolve the opening monster phase, and confirm the updated tuning leaves most parties able to respond with player actions instead of being nearly defeated immediately.

### Tests for User Story 3

- [X] T032 [P] [US3] Expand Convex balance coverage in `convex/battleState.test.ts` and `convex/lib/battleState.test.ts` for increased player durability, reduced default monster damage pressure, and the “most players still active” opening-phase target
- [ ] T033 [P] [US3] Expand host/player surface coverage in `src/components/join/host-battle-arena.test.tsx`, `src/components/join/player-battle-profile.test.tsx`, `src/routes/host/-$joinCode.test.tsx`, and `src/routes/join/-$joinCode.test.tsx` for updated health totals and surviving-opening-phase expectations
- [ ] T034 [P] [US3] Keep Aspire/browser coverage current in `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs` for standard encounters reaching player response turns after the opening monster phase

### Implementation for User Story 3

- [X] T035 [US3] Centralize standard balance constants and scaling helpers in `convex/lib/battleState.ts`
- [X] T036 [US3] Update `convex/battleState.ts` to use the new balance constants for player starting health, default monster damage pressure, and standard encounter setup
- [X] T037 [US3] Update default boss seeds or related setup in `convex/lib/battleState.ts` and any dependent fixtures in `convex/lib/sessionFixtures.ts` to reflect the new standard encounter baseline
- [X] T038 [US3] Update UI fixtures and display assumptions in `src/test/session-fixtures.ts`, `src/components/join/host-battle-arena.tsx`, and `src/components/join/player-battle-profile.tsx` for the revised survivability baseline where necessary
- [X] T039 [US3] Run `pnpm test -- --run convex/battleState.test.ts convex/lib/battleState.test.ts src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx src/routes/host/-$joinCode.test.tsx src/routes/join/-$joinCode.test.tsx` and fix or explicitly document any related failures before polish
- [ ] T040 [US3] If delegated subagents are available and allowed, run a standards-review subagent against `convex/lib/battleState.ts`, `convex/battleState.ts`, `convex/lib/sessionFixtures.ts`, `src/test/session-fixtures.ts`, `src/components/join/host-battle-arena.tsx`, and `src/components/join/player-battle-profile.tsx`, then address findings before closing US3

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize generated outputs, quickstart alignment, and repo-wide verification across all stories.

- [ ] T041 [P] Refresh generated Convex outputs with `pnpm exec convex codegen` for files under `convex/_generated/` after the final schema and function changes settle
- [ ] T042 [P] Update `specs/005-battle-feedback-balance/quickstart.md` and `specs/005-battle-feedback-balance/plan.md` if implementation changes the final validation commands, affected seams, or planned screen mocks
- [ ] T043 Run quickstart validation against `specs/005-battle-feedback-balance/quickstart.md` and record any mismatches in `specs/005-battle-feedback-balance/tasks.md` or the implementation notes
- [X] T044 Re-check whether any change to `docs/codingstandards/README.md` or files under `docs/codingstandards/` is still being considered and stop to ask the user before editing those paths
- [ ] T045 Run final repo-wide verification with `pnpm exec tsc --noEmit`, `pnpm exec tsc -p convex/tsconfig.json --noEmit`, `pnpm lint`, `pnpm test`, and `pnpm test:e2e`; if `pnpm test:e2e` fails, fix the issue and rerun it before completion unless the failure is proven unrelated and documented
- [ ] T046 If delegated subagents are available and allowed, run a final standards-review subagent against changed files under `src/`, changed files under `convex/`, `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs`, and the applicable docs under `docs/codingstandards/`, then address relevant findings before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and starts immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all user stories.
- **Phase 3: US1** depends on Phase 2 and delivers the MVP shared battle-action feed.
- **Phase 4: US2** depends on US1 because special and failed outcomes build on the shared feed contract and UI.
- **Phase 5: US3** depends on Phase 2 and can start after the foundational work, but it integrates more safely after US1 and US2 because the feed and tests already expose battle outcomes clearly.
- **Phase 6: Polish** depends on the desired story phases being complete.

### User Story Dependencies

- **US1**: No dependency on later stories; this is the MVP slice.
- **US2**: Depends on US1 feed persistence and rendering.
- **US3**: Depends on foundational battle setup and resolution logic; it can be implemented independently from the special-outcome copy work but benefits from the shared test coverage built in US1 and US2.

### Within Each User Story

- Expand focused integration coverage before or alongside the implementation it validates.
- Keep browser-visible AppHost coverage current as the story evolves.
- Fix slice-related integration failures before moving to the next story unless the failure is proven unrelated and documented.
- Run the standards-review subagent step when available and allowed before closing the story.

## Parallel Opportunities

- `T002` and `T003` can run in parallel after `T001`.
- `T006`, `T007`, `T008`, and `T009` can run in parallel after `T005`.
- `T011`, `T012`, `T013`, and `T014` can run in parallel for US1 coverage.
- `T023`, `T024`, and `T025` can run in parallel for US2 coverage.
- `T032`, `T033`, and `T034` can run in parallel for US3 coverage.
- `T041` and `T042` can run in parallel during polish once implementation behavior is stable.

## Parallel Example: User Story 1

```bash
Task: "Expand Convex exchange-feed coverage in convex/battleState.test.ts"
Task: "Expand host/player route coverage in src/routes/host/-$joinCode.test.tsx and src/routes/join/-$joinCode.test.tsx"
Task: "Expand component coverage in src/components/join/host-battle-arena.test.tsx, src/components/join/player-battle-profile.test.tsx, and src/components/join/battle-dialogue-feed.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Expand Convex outcome coverage in convex/battleState.test.ts"
Task: "Expand route coverage in src/routes/host/-$joinCode.test.tsx and src/routes/join/-$joinCode.test.tsx"
Task: "Expand component coverage in src/components/join/host-battle-arena.test.tsx, src/components/join/player-battle-profile.test.tsx, and src/components/join/battle-dialogue-feed.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Expand Convex balance coverage in convex/battleState.test.ts and convex/lib/battleState.test.ts"
Task: "Expand host/player surface coverage in src/components/join/host-battle-arena.test.tsx, src/components/join/player-battle-profile.test.tsx, src/routes/host/-$joinCode.test.tsx, and src/routes/join/-$joinCode.test.tsx"
Task: "Keep Aspire/browser coverage current in devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 and validate the shared host/player exchange feed independently.
3. Demo the ordered live battle feed before expanding outcome richness or rebalancing.

### Incremental Delivery

1. Deliver US1 for shared ordered battle-action visibility on host and player surfaces.
2. Deliver US2 for healing, guarding, misses, skipped actions, and knockout clarity.
3. Deliver US3 for survivability rebalance and standard encounter tuning.
4. Finish with Phase 6 repo-wide verification and final standards review.

### Validation Rule

Do not continue to the next story while the current story still has an unresolved focused integration failure or unresolved standards-review finding that applies to existing coding standards. Before calling the feature complete, run the final `pnpm test:e2e` gate and fix/rerun any related failure unless it is proven unrelated and documented.

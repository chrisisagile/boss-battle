# Tasks: Game Loop

**Input**: Design documents from `/home/chris/dev/personal/boss-battle/specs/004-game-loop/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Focused integration coverage is required for each implementation slice. Because this feature changes browser-visible host/player flows and Convex-backed runtime behavior, the final implementation-complete gate also runs `pnpm test:e2e`; if it fails, fix the issue and rerun before calling the work complete unless the failure is proven unrelated and documented.

**Organization**: Tasks are grouped by user story so each story can be implemented, validated, and demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after listed dependencies are in place
- **[Story]**: Story ownership label for user-story phases only (`[US1]`, `[US2]`, `[US3]`)
- Every task includes the exact file path(s) it changes or validates

## Phase 1: Setup

**Purpose**: Load repo standards, confirm affected seams, and establish the required review workflow before implementation starts.

- [X] T001 Review `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, and `docs/codingstandards/convex.md` before editing `src/` or `convex/`
- [X] T002 [P] Review the active feature package in `specs/004-game-loop/spec.md`, `specs/004-game-loop/plan.md`, `specs/004-game-loop/research.md`, `specs/004-game-loop/data-model.md`, `specs/004-game-loop/contracts/route-game-loop-contract.md`, and `specs/004-game-loop/contracts/convex-game-loop-contract.md`
- [X] T003 [P] If delegated subagents are available and allowed, run a standards-review subagent against `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, and `docs/codingstandards/convex.md` before implementation begins
- [X] T004 If implementation appears to require editing `docs/codingstandards/README.md` or any file under `docs/codingstandards/`, stop and ask the user before touching those paths

---

## Phase 2: Foundational

**Purpose**: Build the shared lifecycle, storage, validation, and hook seams that all stories depend on.

**Checkpoint**: Do not start user-story implementation until these tasks are complete.

- [X] T005 Update `convex/schema.ts` to add locked lobby-config fields on sessions plus `roundParticipants` and `battleExchanges` storage needed by the game loop
- [ ] T006 [P] Extend `convex/lib/joinValidation.ts`, `convex/lib/joinErrors.ts`, and `src/components/join/join-validation.ts` for room-lock, invalid-start, removed-player, and later-round rejoin validation rules
- [ ] T007 [P] Extend `convex/lib/battleValidation.ts` and `convex/lib/battleState.ts` for shared game-phase, exchange-progress, action-point economy, and termination helpers used across rounds
- [X] T008 [P] Refactor `src/integrations/convex/join.ts` to centralize the new host/player query summaries, lifecycle mutations, and logging for lobby, quiz, battle, rejoin, and results states
- [ ] T009 Run `pnpm exec convex codegen` to refresh generated Convex contracts under `convex/_generated/`
- [X] T010 Run foundational validation with `pnpm test -- --run convex/quizRounds.test.ts convex/battleState.test.ts convex/lib/quizRoundSelection.test.ts` and fix or document failures before starting US1

---

## Phase 3: User Story 1 - Host and launch a room (Priority: P1) 🎯 MVP

**Goal**: Let the host create a fresh isolated room, configure the lobby, and start the game with joining locked afterward.

**Independent Test**: Create a room from `/`, verify no browseable history appears, confirm `/host/$joinCode` shows join QR plus connected roster and config controls, then start the game and confirm new joins are blocked.

### Tests for User Story 1

- [X] T011 [P] [US1] Expand route integration coverage in `src/routes/-index.test.tsx` and `src/routes/host/-$joinCode.test.tsx` for fresh-room creation, single active-room resume, lobby loading/error states, and start-game join locking
- [X] T012 [P] [US1] Expand host lobby component coverage in `src/components/join/host-battle-setup.test.tsx` and `src/components/join/host-roster.test.tsx` for boss/question/category/difficulty config rules and connected-player rendering
- [X] T013 [P] [US1] Extend AppHost smoke coverage in `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs` for `/` to `/host/$joinCode` room launch and lobby rendering

### Implementation for User Story 1

- [X] T014 [US1] Extend `convex/gameSessions.ts` for isolated room creation, current-active-room lookup, join-status toggling, locked lobby config persistence, and host-end lifecycle fields
- [X] T015 [US1] Extend `convex/playerEntries.ts` for pre-start join acceptance, post-start join rejection, and room-level player presence checks used by host start-game validation
- [ ] T016 [US1] Update `src/routes/index.tsx` and `src/components/join/host-session-launcher.tsx` for create-room and single-active-room resume without exposing older sessions
- [X] T017 [US1] Update `src/routes/host/$joinCode.tsx`, `src/components/join/host-session-hero.tsx`, `src/components/join/join-qr-card.tsx`, and `src/components/join/host-join-status-toggle.tsx` for lobby summary, QR display, join open/closed status, and start-game entrypoint wiring
- [X] T018 [US1] Update `src/components/join/host-battle-setup.tsx`, `src/components/join/host-quiz-round-controls.tsx`, and `src/components/join/host-roster.tsx` for validated host config controls, readiness display, and start-game gating
- [X] T019 [US1] Run `pnpm test -- --run src/routes/-index.test.tsx src/routes/host/-$joinCode.test.tsx src/components/join/host-battle-setup.test.tsx src/components/join/host-roster.test.tsx` and fix or explicitly document any related failures before US2
- [ ] T020 [US1] If delegated subagents are available and allowed, run a standards-review subagent against `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, `docs/codingstandards/convex.md`, `src/routes/index.tsx`, `src/routes/host/$joinCode.tsx`, `src/components/join/host-battle-setup.tsx`, `src/components/join/host-roster.tsx`, `convex/gameSessions.ts`, and `convex/playerEntries.ts`, then address findings before closing US1

---

## Phase 4: User Story 2 - Run a quiz-to-battle round (Priority: P2)

**Goal**: Move active players from quiz questions into action selection and battle exchanges while the host sees readiness, exchange progress, disconnect handling, and turn resolution in a clear order.

**Independent Test**: Start a configured room, have players complete quizzes, verify ready markers and action-point awards, collect actions, resolve automatic boss turns before player turns, and confirm disconnect removal plus later-round rejoin behavior.

### Tests for User Story 2

- [ ] T021 [P] [US2] Expand Convex round-progression coverage in `convex/quizRounds.test.ts` and `convex/lib/quizRoundSelection.test.ts` for round start, random `exchangeLimit`, sequential quiz progression, scoring completion, and round advancement
- [ ] T022 [P] [US2] Expand Convex battle coverage in `convex/battleState.test.ts` for boss-first exchange resolution, random tie-breaking, round-local action points, no-actions-left termination, and exchange bookkeeping
- [ ] T023 [P] [US2] Expand route and component coverage in `src/routes/join/-$joinCode.test.tsx`, `src/routes/host/-$joinCode.test.tsx`, `src/components/join/host-battle-arena.test.tsx`, and `src/components/join/player-battle-profile.test.tsx` for quiz auto-advance, ready markers, waiting states, action selection, removed-player messaging, and later-round rejoin messaging
- [ ] T024 [P] [US2] Extend AppHost smoke coverage in `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs` for active quiz, waiting, and battle-arena rendering after game start

### Implementation for User Story 2

- [X] T025 [US2] Extend `convex/quizRounds.ts` and `convex/quizAssignments.ts` for explicit round phases, per-round assignments, sequential answer progression, readiness tracking, and round-complete scoring gates
- [ ] T026 [US2] Extend `convex/battleState.ts` and `convex/lib/battleState.ts` for public `startEncounter`, public `resolveBattleExchange`, automatic boss action and target selection, random player tie-breaking, and next-round or results transitions
- [ ] T027 [US2] Extend `convex/playerEntries.ts` and `convex/gameSessions.ts` for disconnect removal from the active round, `eligibleFromRoundNumber` updates, join-resolution responses, and per-round participation windows
- [X] T028 [US2] Update `src/integrations/convex/join.ts` for host and player summary mapping, mutation hooks, target-aware action submission, and lifecycle logging across quiz, waiting, action-selection, battle-resolution, removed, and rejoin states
- [X] T029 [US2] Update `src/routes/host/$joinCode.tsx`, `src/components/join/host-battle-arena.tsx`, `src/components/join/host-quiz-round-status.tsx`, and `src/components/join/battle-status-messages.ts` for arena-first projector flow, readiness markers, exchange progress, and round-state messaging
- [X] T030 [US2] Update `src/routes/join/$joinCode.tsx`, `src/components/join/round-chapter-intro.tsx`, `src/components/join/player-quiz-question.tsx`, `src/components/join/player-quiz-result.tsx`, and `src/components/join/quiz-status-messages.ts` for automatic quiz delivery, immediate answer progression, and waiting-for-others transitions
- [X] T031 [US2] Update `src/components/join/player-battle-profile.tsx` and `src/components/join/battle-status-messages.ts` for action-point display, valid target selection, knocked-out handling, removed-from-round messaging, and next-round rejoin messaging
- [X] T032 [US2] Run `pnpm test -- --run src/routes/join/-$joinCode.test.tsx src/routes/host/-$joinCode.test.tsx src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx convex/quizRounds.test.ts convex/battleState.test.ts convex/lib/quizRoundSelection.test.ts` and fix or explicitly document any related failures before US3
- [ ] T033 [US2] If delegated subagents are available and allowed, run a standards-review subagent against `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, `docs/codingstandards/convex.md`, `src/routes/host/$joinCode.tsx`, `src/routes/join/$joinCode.tsx`, `src/components/join/host-battle-arena.tsx`, `src/components/join/player-battle-profile.tsx`, `src/integrations/convex/join.ts`, `convex/quizRounds.ts`, `convex/quizAssignments.ts`, `convex/battleState.ts`, and `convex/playerEntries.ts`, then address findings before closing US2

---

## Phase 5: User Story 3 - Finish the game and show results (Priority: P3)

**Goal**: End the session cleanly on victory, defeat, no-actions-left, or host-end and show a clear final results state to both host and players.

**Independent Test**: Finish a live session through victory, defeat, no-actions-left, and host-ended paths, then verify both `/host/$joinCode` and `/join/$joinCode` land on explicit results screens with no further round progression.

### Tests for User Story 3

- [ ] T034 [P] [US3] Expand results-state coverage in `convex/battleState.test.ts` and `convex/quizRounds.test.ts` for player victory, boss victory, no-actions-left, host-ended completion, and blocked post-completion transitions
- [ ] T035 [P] [US3] Expand route and component coverage in `src/routes/host/-$joinCode.test.tsx`, `src/routes/join/-$joinCode.test.tsx`, `src/components/join/host-battle-arena.test.tsx`, and `src/components/join/player-battle-profile.test.tsx` for explicit results rendering and blocked post-end interactions
- [ ] T036 [P] [US3] Extend AppHost smoke coverage in `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs` for host/player terminal results states

### Implementation for User Story 3

- [ ] T037 [US3] Extend `convex/gameSessions.ts` and `convex/battleState.ts` for `completionReason`, host-ended termination, no-actions-left termination, and final host/player results projections
- [ ] T038 [US3] Update `src/routes/host/$joinCode.tsx`, `src/components/join/host-battle-arena.tsx`, and `src/components/join/battle-status-messages.ts` for victory, defeat, no-actions-left, and host-ended results states on the projector surface
- [ ] T039 [US3] Update `src/routes/join/$joinCode.tsx`, `src/components/join/player-battle-profile.tsx`, and `src/components/join/quiz-status-messages.ts` for player-facing results, blocked post-game actions, and clear end-of-session messaging
- [ ] T040 [US3] Update `src/routes/index.tsx` and `src/components/join/host-session-launcher.tsx` for start-new-room recovery after results without exposing prior room history
- [ ] T041 [US3] Run `pnpm test -- --run src/routes/host/-$joinCode.test.tsx src/routes/join/-$joinCode.test.tsx src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx convex/battleState.test.ts convex/quizRounds.test.ts` and fix or explicitly document any related failures before polish
- [ ] T042 [US3] If delegated subagents are available and allowed, run a standards-review subagent against `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, `docs/codingstandards/convex.md`, `src/routes/host/$joinCode.tsx`, `src/routes/join/$joinCode.tsx`, `src/components/join/host-battle-arena.tsx`, `src/components/join/player-battle-profile.tsx`, `convex/gameSessions.ts`, and `convex/battleState.ts`, then address findings before closing US3

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish generated artifacts, run final verification, and close any cross-story gaps.

- [ ] T043 [P] Refresh generated Convex outputs with `pnpm exec convex codegen` for files under `convex/_generated/` after the final schema and function changes settle
- [ ] T044 [P] Update `specs/004-game-loop/quickstart.md` and `specs/004-game-loop/plan.md` if implementation changes the final validation commands, affected seams, or review workflow captured there
- [ ] T045 Re-check whether any change to `docs/codingstandards/README.md` or files under `docs/codingstandards/` is still being considered and stop to ask the user before editing those paths
- [ ] T046 Run final repo-wide verification with `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, and `pnpm test:e2e`; if `pnpm test:e2e` fails, fix the issue and rerun it before completion unless the failure is proven unrelated and documented
- [ ] T047 If delegated subagents are available and allowed, run a final standards-review subagent against `docs/codingstandards/README.md`, `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`, `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`, `docs/codingstandards/convex.md`, changed files under `src/`, changed files under `convex/`, and `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs`, then address relevant findings before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and starts immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all user stories.
- **Phase 3: US1** depends on Phase 2 and delivers the MVP room/lobby/start flow.
- **Phase 4: US2** depends on Phase 3 because the quiz-to-battle loop starts from the locked game launched in US1.
- **Phase 5: US3** depends on Phase 4 because results and early termination rely on the completed round and battle lifecycle.
- **Phase 6: Polish** depends on the desired story phases being complete.

### User Story Dependencies

- **US1**: No dependency on later stories; this is the MVP slice.
- **US2**: Depends on US1 start-game and join-lock behavior.
- **US3**: Depends on US2 battle and round-resolution behavior.

### Within Each User Story

- Write or expand focused integration coverage before or alongside the implementation it validates.
- Keep browser-visible E2E coverage updated as the story evolves.
- Fix slice-related integration failures before moving to the next story unless the failure is proven unrelated and documented.
- Run the standards-review subagent step when available and allowed before closing the story.

## Parallel Opportunities

- `T002` and `T003` can run in parallel after `T001`.
- `T006`, `T007`, and `T008` can run in parallel after `T005`.
- `T011`, `T012`, and `T013` can run in parallel for US1 test coverage.
- `T021`, `T022`, `T023`, and `T024` can run in parallel for US2 test coverage.
- `T034`, `T035`, and `T036` can run in parallel for US3 test coverage.
- `T043` and `T044` can run in parallel during polish once feature behavior is stable.

## Parallel Example: User Story 1

```bash
Task: "Expand route integration coverage in src/routes/-index.test.tsx and src/routes/host/-$joinCode.test.tsx"
Task: "Expand host lobby component coverage in src/components/join/host-battle-setup.test.tsx and src/components/join/host-roster.test.tsx"
Task: "Extend AppHost smoke coverage in devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs"
```

## Parallel Example: User Story 2

```bash
Task: "Expand Convex round-progression coverage in convex/quizRounds.test.ts and convex/lib/quizRoundSelection.test.ts"
Task: "Expand Convex battle coverage in convex/battleState.test.ts"
Task: "Expand route and component coverage in src/routes/join/-$joinCode.test.tsx, src/routes/host/-$joinCode.test.tsx, src/components/join/host-battle-arena.test.tsx, and src/components/join/player-battle-profile.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Expand results-state coverage in convex/battleState.test.ts and convex/quizRounds.test.ts"
Task: "Expand route and component coverage in src/routes/host/-$joinCode.test.tsx, src/routes/join/-$joinCode.test.tsx, src/components/join/host-battle-arena.test.tsx, and src/components/join/player-battle-profile.test.tsx"
Task: "Extend AppHost smoke coverage in devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 and validate `src/routes/-index.test.tsx`, `src/routes/host/-$joinCode.test.tsx`, `src/components/join/host-battle-setup.test.tsx`, and `src/components/join/host-roster.test.tsx`.
3. Demo the host room creation, lobby, and start-game lock flow before moving into round logic.

### Incremental Delivery

1. Deliver US1 for room creation, lobby configuration, and start-game locking.
2. Deliver US2 for quiz progression, action-point economy, exchange resolution, and disconnect/rejoin handling.
3. Deliver US3 for results, host-ended termination, and start-new-room recovery.
4. Finish with Phase 6 repo-wide verification and final standards review.

### Validation Rule

Do not continue to the next story while the current story still has an unresolved focused integration failure or unresolved standards-review finding that applies to existing coding standards. Before calling the feature complete, run the final `pnpm test:e2e` gate and fix/rerun any related failure unless it is proven unrelated and documented.

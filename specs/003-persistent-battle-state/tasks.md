# Tasks: Persistent Battle State

**Input**: Design documents from `/specs/003-persistent-battle-state/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include targeted tests because the repo standards require fast automated coverage for changed behavior, plus `pnpm test:e2e` when host/projector route-shell behavior changes materially.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. `US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing app boundaries for battle-state work

- [X] T001 Review and align battle implementation seams in `/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/plan.md` and `/home/chris/dev/personal/boss-battle/AGENTS.md`
- [X] T002 [P] Add battle fixture helpers for host/player/component tests in `/home/chris/dev/personal/boss-battle/src/test/session-fixtures.ts`
- [X] T003 [P] Add Convex battle fixture helpers for schema and lifecycle tests in `/home/chris/dev/personal/boss-battle/convex/lib/sessionFixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core battle-state infrastructure that MUST be complete before any user story can ship

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Extend battle entities and indexes in `/home/chris/dev/personal/boss-battle/convex/schema.js`
- [X] T005 [P] Add shared battle validators and normalization helpers in `/home/chris/dev/personal/boss-battle/convex/lib/battleValidation.ts`
- [X] T006 [P] Add shared battle resolution utilities for health, action points, player-count scaling profiles, and sprite fallback selection in `/home/chris/dev/personal/boss-battle/convex/lib/battleState.ts`
- [X] T007 Create battle query and mutation module for boss catalog, encounter lifecycle, combatant state, and round resolution in `/home/chris/dev/personal/boss-battle/convex/battleState.ts`
- [X] T008 Extend generated-client hook accessors for battle summaries and actions in `/home/chris/dev/personal/boss-battle/src/integrations/convex/join.ts`
- [X] T009 Add shared battle-state error and status message mapping in `/home/chris/dev/personal/boss-battle/src/components/join/battle-status-messages.ts`

**Checkpoint**: Foundation ready; user story work can now proceed

---

## Phase 3: User Story 1 - Resolve battles across rounds (Priority: P1) 🎯 MVP

**Goal**: Persist party and boss health, action points, and encounter state across rounds with a live host/projector arena summary

**Independent Test**: Start a battle, resolve at least one round, refresh host and player views, and confirm party and boss state remains consistent across the next round boundary.

### Tests for User Story 1

- [X] T010 [P] [US1] Add Convex lifecycle tests for encounter creation, round persistence, multi-boss summaries, and early encounter end when all bosses are defeated in `/home/chris/dev/personal/boss-battle/convex/battleState.test.ts`
- [X] T011 [P] [US1] Add host battle summary render-state tests in `/home/chris/dev/personal/boss-battle/src/components/join/host-battle-arena.test.tsx`

### Implementation for User Story 1

- [X] T012 [P] [US1] Add host-side battle summary and lineup projection fields to `/home/chris/dev/personal/boss-battle/convex/gameSessions.ts`
- [X] T013 [P] [US1] Add player-side persisted combatant and party-summary projection fields to `/home/chris/dev/personal/boss-battle/convex/quizRounds.ts`
- [X] T014 [P] [US1] Create shared arena presentation components for party and boss combatants in `/home/chris/dev/personal/boss-battle/src/components/join/host-battle-arena.tsx`
- [X] T015 [P] [US1] Create retro health-bar and action-point-bar wrappers for arena rendering in `/home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-health-bar.tsx`
- [X] T016 [P] [US1] Create retro character-sheet and enemy-health-display wrappers in `/home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-character-sheet.tsx`
- [X] T017 [US1] Integrate persisted encounter, between-round party status, and projector arena states into `/home/chris/dev/personal/boss-battle/src/routes/host/$joinCode.tsx`
- [X] T018 [US1] Integrate persisted player battle summary and reconnect-safe post-round state into `/home/chris/dev/personal/boss-battle/src/routes/join/$joinCode.tsx`
- [X] T019 [US1] Add host/player logging for failed battle summary loads and encounter transitions in `/home/chris/dev/personal/boss-battle/src/integrations/convex/join.ts`

**Checkpoint**: User Story 1 is functional and independently testable

---

## Phase 4: User Story 2 - Make strategic player choices (Priority: P2)

**Goal**: Show each player their own combat profile, action points, skill categories, and knockout state so they can make strategic decisions between rounds

**Independent Test**: Load a joined player into active, low-health, and knocked-out states and verify the player route exposes only the valid actions and status messaging for each condition.

### Tests for User Story 2

- [X] T020 [P] [US2] Add Convex tests for skill affordability, knockout gating, revive transitions, and same-round heal or defend resolution order in `/home/chris/dev/personal/boss-battle/convex/battleState.test.ts`
- [X] T021 [P] [US2] Add player combat-profile and action-selection tests in `/home/chris/dev/personal/boss-battle/src/components/join/player-battle-profile.test.tsx`

### Implementation for User Story 2

- [X] T022 [P] [US2] Add skill-definition, player-action submission, knockout or revive transitions, and one-use study-effect persistence to `/home/chris/dev/personal/boss-battle/convex/battleState.ts`
- [X] T023 [P] [US2] Create player combat profile, knockout, and available-skill component in `/home/chris/dev/personal/boss-battle/src/components/join/player-battle-profile.tsx`
- [X] T024 [P] [US2] Create retro player-profile-card and action-point-bar wrappers in `/home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-player-profile-card.tsx`
- [X] T025 [US2] Integrate player battle actions, affordability messaging, and knockout-state handling into `/home/chris/dev/personal/boss-battle/src/routes/join/$joinCode.tsx`
- [X] T026 [US2] Add battle-action error mapping and client logging for invalid or unaffordable choices in `/home/chris/dev/personal/boss-battle/src/components/join/battle-status-messages.ts`

**Checkpoint**: User Story 2 is functional and independently testable

---

## Phase 5: User Story 3 - Configure scalable encounters (Priority: P3)

**Goal**: Let the host manage reusable bosses, scaling rules, multi-boss lineups, and stable sprites for balanced encounters

**Independent Test**: Configure one and then multiple bosses with and without custom sprites, start encounters at different player counts, and verify the host sees scaled boss state plus stable sprite assignment.

### Tests for User Story 3

- [X] T027 [P] [US3] Add Convex tests for boss catalog authoring, zero-boss lineup validation, player-count scaling of health and action points, and fallback sprite persistence in `/home/chris/dev/personal/boss-battle/convex/battleState.test.ts`
- [X] T028 [P] [US3] Add host encounter setup form tests for boss selection and invalid lineup states in `/home/chris/dev/personal/boss-battle/src/components/join/host-battle-setup.test.tsx`

### Implementation for User Story 3

- [X] T029 [P] [US3] Add boss catalog authoring, scaling-profile evaluation, and encounter-start validation to `/home/chris/dev/personal/boss-battle/convex/battleState.ts`
- [X] T030 [P] [US3] Create host boss setup and lineup management component in `/home/chris/dev/personal/boss-battle/src/components/join/host-battle-setup.tsx`
- [X] T031 [P] [US3] Create retro enemy-health-display and sprite-preview wrapper in `/home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-enemy-health-display.tsx`
- [X] T032 [US3] Integrate boss catalog selection, scaling summaries, and multi-boss encounter setup into `/home/chris/dev/personal/boss-battle/src/routes/host/$joinCode.tsx`
- [X] T033 [US3] Extend host overview and player join gating summaries for active-battle join blocking in `/home/chris/dev/personal/boss-battle/convex/gameSessions.ts`

**Checkpoint**: User Story 3 is functional and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and repo-wide cleanup across all stories

- [ ] T034 [P] Regenerate Convex generated client outputs after schema changes with `/home/chris/dev/personal/boss-battle/convex/_generated/`
- [X] T035 Run repository validation commands from `/home/chris/dev/personal/boss-battle/package.json` and record outcomes in `/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/quickstart.md`
- [ ] T036 [P] Add or update AppHost browser integration coverage for host/projector battle flow changes in `/home/chris/dev/personal/boss-battle/devops/tests/BossBattle.AppHost.Tests/`
- [ ] T037 Run `pnpm test:e2e` for host/projector battle flow changes and record the result in `/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and benefits from US1 battle-summary primitives
- **User Story 3 (Phase 5)**: Depends on Foundational completion and reuses the encounter model from US1
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1**: MVP slice; no dependency on later stories
- **US2**: Depends on shared battle entities and summary hooks from Foundational; can ship after US1
- **US3**: Depends on shared battle entities and encounter lifecycle from Foundational; can ship after US1

### Within Each User Story

- Tests should be written before or alongside implementation and fail before the corresponding fix when feasible
- Convex domain changes precede route wiring
- Shared UI wrappers precede route integration
- Story-specific logging and error handling finish before validation

### Parallel Opportunities

- `T002` and `T003` can run together
- `T005`, `T006`, `T008`, and `T009` can run together after `T004`
- In **US1**, `T012`, `T013`, `T014`, `T015`, and `T016` can run in parallel before route integration
- In **US2**, `T023` and `T024` can run in parallel after `T022`
- In **US3**, `T030` and `T031` can run in parallel after `T029`
- `T034` and `T036` can run in parallel after implementation stabilizes
- `T035` and `T037` can run as the final verification sequence after implementation is complete

---

## Parallel Example: User Story 1

```bash
Task: "Add host-side battle summary and lineup projection fields to /home/chris/dev/personal/boss-battle/convex/gameSessions.ts"
Task: "Add player-side persisted combatant and party-summary projection fields to /home/chris/dev/personal/boss-battle/convex/quizRounds.ts"
Task: "Create shared arena presentation components for party and boss combatants in /home/chris/dev/personal/boss-battle/src/components/join/host-battle-arena.tsx"
Task: "Create retro health-bar and action-point-bar wrappers for arena rendering in /home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-health-bar.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Add Convex tests for skill affordability, knockout gating, and revive transitions in /home/chris/dev/personal/boss-battle/convex/battleState.test.ts"
Task: "Create player combat profile, knockout, and available-skill component in /home/chris/dev/personal/boss-battle/src/components/join/player-battle-profile.tsx"
Task: "Create retro player profile and mana or action-point wrappers in /home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-player-profile-card.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Add boss catalog authoring and encounter-start validation to /home/chris/dev/personal/boss-battle/convex/battleState.ts"
Task: "Create host boss setup and lineup management component in /home/chris/dev/personal/boss-battle/src/components/join/host-battle-setup.tsx"
Task: "Create retro boss roster and sprite-preview wrapper in /home/chris/dev/personal/boss-battle/src/components/ui/8bit/battle-enemy-health-display.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate host/projector and player persistence behavior independently

### Incremental Delivery

1. Finish Setup + Foundational to establish the shared battle-state model
2. Deliver US1 for persistent encounter state and projector visibility
3. Deliver US2 for player strategy, knockout handling, and action submission
4. Deliver US3 for boss authoring, scaling, and multi-boss setup
5. Finish with regeneration and validation tasks, including `pnpm test:e2e` when the host/projector flow changed

### Parallel Team Strategy

1. One developer handles schema and shared Convex foundations
2. One developer handles host/projector UI primitives and route integration
3. One developer handles player battle profile and action-selection surfaces
4. After US1 foundations settle, host setup and player strategy work can proceed concurrently

---

## Notes

- All tasks use the required checklist format with Task ID, optional `[P]`, required `[US#]` labels for story tasks, and exact file paths
- User stories remain independently testable after the foundational phase
- Generated-file refresh is deferred to Polish so implementation can batch schema changes efficiently

# Tasks: QR Game Join

**Input**: Design documents from `/specs/001-qr-game-join/`
**Prerequisites**: [plan.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/plan.md), [spec.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/spec.md), [research.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/research.md), [data-model.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/data-model.md), [route-contract.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/contracts/route-contract.md), [convex-contract.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/contracts/convex-contract.md)

**Tests**: Include targeted automated tests because the specification defines independent test criteria for each story and repo policy requires changed behavior to add coverage.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently after the foundational phase.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install shared dependencies and prepare the owned retro UI seams for the feature.

- [X] T001 Add the QR rendering dependency in `package.json` and `pnpm-lock.yaml`
- [X] T002 [P] Install and adapt the selected 8bitcn source blocks into `src/components/ui/8bit/host-main-menu.tsx`, `src/components/ui/8bit/chapter-intro.tsx`, `src/components/ui/8bit/friend-list.tsx`, and `src/components/ui/8bit/player-profile-card.tsx`
- [X] T003 [P] Extend projector and mobile join theme tokens in `src/styles.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared data, validation, fixture, and integration contracts that all user stories build on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Define `gameSessions` and `playerEntries` tables plus indexes in `convex/schema.js`
- [X] T005 [P] Add shared join-code and display-name validation helpers in `convex/lib/joinValidation.ts`
- [X] T006 [P] Add browser device identity and join-form validation helpers in `src/components/join/device-id.ts` and `src/components/join/join-validation.ts`
- [X] T007 [P] Add shared contextual join error contracts and user-facing error copy in `convex/lib/joinErrors.ts` and `src/components/join/join-error-messages.ts`
- [X] T008 [P] Add reusable active-session and in-progress session fixtures in `convex/lib/sessionFixtures.ts` and `src/test/session-fixtures.ts`
- [X] T009 Implement session queries and mutations from the contract in `convex/gameSessions.ts`
- [X] T010 Implement player-entry queries and join mutation behavior in `convex/playerEntries.ts`
- [X] T011 Create typed Convex session and join helpers in `src/integrations/convex/join.ts`
- [X] T012 Regenerate generated Convex client files under `convex/_generated/` from `convex/schema.js`, `convex/gameSessions.ts`, and `convex/playerEntries.ts`

**Checkpoint**: Shared schema, validators, seeded fixtures, and typed integration helpers are ready for story work.

---

## Phase 3: User Story 1 - Start A Joinable Game (Priority: P1) 🎯 MVP

**Goal**: Let a host create or resume a joinable session and immediately show a scannable QR code plus manual join code on the large display.

**Independent Test**: Create a new session from `/` and confirm the app navigates to `/host/$joinCode` with a visible QR code, join code, join instructions, and join-open status.

### Tests for User Story 1

- [X] T013 [P] [US1] Add host landing create-or-resume tests in `src/routes/-index.test.tsx`
- [X] T014 [P] [US1] Add host display route tests for QR, join code, join-status, and empty-roster states in `src/routes/host/-$joinCode.test.tsx`

### Implementation for User Story 1

- [X] T015 [P] [US1] Build the host session launcher from the 8bitcn main-menu block in `src/routes/index.tsx` and `src/components/join/host-session-launcher.tsx`
- [X] T016 [P] [US1] Build the projector join presentation from 8bitcn chapter-intro and friend-list blocks in `src/components/join/host-session-hero.tsx`, `src/components/join/join-qr-card.tsx`, and `src/components/join/host-roster.tsx`
- [X] T017 [US1] Implement host session create, resume, and overview loading in `src/routes/index.tsx`, `src/routes/host/$joinCode.tsx`, and `src/integrations/convex/join.ts`
- [X] T018 [US1] Add host-loading, host-empty, host-error, and route-context failure states in `src/routes/host/$joinCode.tsx`

**Checkpoint**: User Story 1 is fully functional and testable on its own.

---

## Phase 4: User Story 2 - Join From A Mobile Device (Priority: P2)

**Goal**: Let players reach a mobile join experience from QR or manual code entry, claim a display name, and appear in the active host roster.

**Independent Test**: Open `/join/$joinCode` from a seeded active-session fixture on a phone, submit a display name, confirm the success state on mobile, and verify the roster count increments.

### Tests for User Story 2

- [X] T019 [P] [US2] Add manual join-code entry tests in `src/routes/join/-index.test.tsx`
- [X] T020 [P] [US2] Add player join route tests for success, duplicate-name rejection, unavailable-session errors, and seeded active-session fixtures in `src/routes/join/-$joinCode.test.tsx`

### Implementation for User Story 2

- [X] T021 [P] [US2] Create the manual join-code and display-name forms in `src/components/join/manual-join-form.tsx` and `src/components/join/player-name-form.tsx`
- [X] T022 [P] [US2] Build the mobile confirmation state from the 8bitcn player-profile-card block in `src/components/join/player-join-confirmation.tsx`
- [X] T023 [US2] Implement the manual code entry route and redirect behavior in `src/routes/join/index.tsx`
- [X] T024 [US2] Implement the session-specific player join flow, success state, roster refresh, and action-context failure messaging in `src/routes/join/$joinCode.tsx`, `src/integrations/convex/join.ts`, and `src/components/join/host-roster.tsx`
- [X] T025 [US2] Implement device reservation, duplicate-device rejoin handling, and no-partial-join-on-failure behavior in `convex/playerEntries.ts`, `src/integrations/convex/join.ts`, and `src/routes/join/$joinCode.tsx`

**Checkpoint**: User Story 2 is fully functional and testable against foundational session fixtures without depending on the host creation flow.

---

## Phase 5: User Story 3 - Allow Late Joiners Without Interrupting Play (Priority: P3)

**Goal**: Keep joining open during gameplay, let hosts close joining without ending the session, and defer late joiner participation until the next round when needed.

**Independent Test**: Use a seeded in-progress session fixture, join a new player while participation is active, confirm the player is added without resetting gameplay, and verify the player is flagged for the next participation opportunity.

### Tests for User Story 3

- [X] T026 [P] [US3] Add late-join eligibility and close-joining tests against seeded in-progress session fixtures in `src/routes/host/-$joinCode.test.tsx` and `src/routes/join/-$joinCode.test.tsx`

### Implementation for User Story 3

- [X] T027 [P] [US3] Extend session lifecycle and participation-window state in `convex/schema.js` and `convex/gameSessions.ts`
- [X] T028 [P] [US3] Add host join-status controls and projector late-join messaging in `src/components/join/host-join-status-toggle.tsx` and `src/components/join/host-session-hero.tsx`
- [X] T029 [US3] Implement late-join eligibility calculation and closed-session enforcement in `convex/playerEntries.ts` and `src/integrations/convex/join.ts`
- [X] T030 [US3] Implement in-progress join messaging, next-round eligibility copy, and late-join roster indicators in `src/routes/host/$joinCode.tsx`, `src/routes/join/$joinCode.tsx`, and `src/components/join/player-join-confirmation.tsx`

**Checkpoint**: User Story 3 is fully functional and testable against foundational in-progress fixtures without depending on User Story 2 to ship first.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regenerate generated files, verify real AppHost wiring, and finalize validation guidance.

- [X] T031 [P] Regenerate the router output after adding join routes in `src/routeTree.gen.ts`
- [X] T032 [P] Add Aspire-backed host-and-join smoke coverage in `devops/tests/BossBattle.AppHost.Tests/AppHostSmokeTests.cs`
- [X] T033 [P] Update implementation verification notes and success-criteria validation guidance in `specs/001-qr-game-join/quickstart.md`
- [X] T034 Add contextual failure logging for host session load, join submission, and join-status mutations in `src/integrations/convex/join.ts`, `src/routes/host/$joinCode.tsx`, and `src/routes/join/$joinCode.tsx`
- [X] T035 Run `pnpm lint`, `pnpm test`, and `pnpm test:e2e` against `package.json` and `devops/tests/BossBattle.AppHost.Tests/BossBattle.AppHost.Tests.csproj`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion and can proceed independently with seeded session fixtures.
- **Polish (Phase 6)**: Depends on the user stories you intend to ship.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers the MVP host flow.
- **User Story 2 (P2)**: Starts after Foundational and validates against seeded active-session fixtures rather than depending on User Story 1 to ship first.
- **User Story 3 (P3)**: Starts after Foundational and validates against seeded in-progress session fixtures rather than depending on User Story 2 to ship first.

### Dependency Graph

```text
Setup -> Foundational -> {US1 | US2 | US3} -> Polish
```

### Within Each User Story

- Tests should be written before implementation for that story and should fail first.
- Shared contracts and seeded fixtures come from the Foundational phase.
- Route state handling follows reusable component and helper creation.
- Story validation happens before moving to the next priority slice.

---

## Parallel Opportunities

- `T002` and `T003` can run in parallel once `T001` lands.
- `T005`, `T006`, `T007`, and `T008` can run in parallel after `T004`.
- `T013` and `T014` can run in parallel for `US1`.
- `T015` and `T016` can run in parallel for `US1`.
- `T019` and `T020` can run in parallel for `US2`.
- `T021` and `T022` can run in parallel for `US2`.
- `T027` and `T028` can run in parallel for `US3`.
- `T031`, `T032`, and `T033` can run in parallel once implementation is complete.

---

## Parallel Example: User Story 1

```bash
Task: "Add host landing create-or-resume tests in src/routes/-index.test.tsx"
Task: "Add host display route tests in src/routes/host/-$joinCode.test.tsx"

Task: "Build the host session launcher in src/routes/index.tsx and src/components/join/host-session-launcher.tsx"
Task: "Build the projector join presentation in src/components/join/host-session-hero.tsx, src/components/join/join-qr-card.tsx, and src/components/join/host-roster.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Add manual join-code entry tests in src/routes/join/-index.test.tsx"
Task: "Add player join route tests in src/routes/join/-$joinCode.test.tsx"

Task: "Create the manual join-code and display-name forms in src/components/join/manual-join-form.tsx and src/components/join/player-name-form.tsx"
Task: "Build the mobile confirmation state in src/components/join/player-join-confirmation.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Extend session lifecycle and participation-window state in convex/schema.js and convex/gameSessions.ts"
Task: "Add host join-status controls and projector late-join messaging in src/components/join/host-join-status-toggle.tsx and src/components/join/host-session-hero.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3.
4. Validate the host can create a session and display join credentials before layering on the player stories.

### Incremental Delivery

1. Complete Setup plus Foundational.
2. Ship User Story 1 as the MVP host flow.
3. Ship User Story 2 or User Story 3 next, using the foundational fixtures for independent validation.
4. Integrate the completed stories and finish with smoke coverage plus verification commands.

### Suggested MVP Scope

- Phase 1
- Phase 2
- Phase 3

---

## Notes

- `[P]` tasks touch different files or depend only on completed shared work.
- Story labels map each task back to one user story for independent delivery.
- `src/routeTree.gen.ts` and everything under `convex/_generated/` remain tool-owned outputs and must be regenerated instead of hand-edited.

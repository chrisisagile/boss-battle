# Tasks: Quiz Token Awards

**Input**: Design documents from `/specs/002-quiz-token-awards/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature requires focused automated coverage because the spec, constitution, and repo standards all require verification for changed behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. `US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared source and test scaffolding for the quiz feature.

- [X] T001 Create the repo-managed quiz question dataset scaffold in `src/data/quiz-questions.ts`
- [X] T002 [P] Create shared quiz test fixtures for sessions, rounds, questions, and assignments in `src/test/quiz-fixtures.ts`
- [X] T003 [P] Create shared quiz validation helpers for category, complexity, and round config inputs in `convex/lib/quizValidation.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the schema, domain seams, and client hooks required by every user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Extend quiz-related tables and session/player fields in `convex/schema.js`
- [X] T005 [P] Implement shared question-bank load and lookup helpers in `convex/quizQuestions.ts`
- [X] T006 [P] Implement round selection, no-repeat, and scoring utilities in `convex/lib/quizRoundSelection.ts`
- [X] T007 Implement shared round/assignment summary queries in `convex/quizRounds.ts`
- [X] T008 Update quiz-aware Convex client hooks and log helpers in `src/integrations/convex/join.ts`
- [X] T009 Create shared quiz status and error message helpers in `src/components/join/quiz-status-messages.ts`

**Checkpoint**: Foundation ready. Player answering, question-bank management, round controls, and shared summaries can now be implemented independently.

---

## Phase 3: User Story 1 - Earn Tokens From Quiz Answers (Priority: P1) 🎯 MVP

**Goal**: Let an eligible player receive an individualized multiple-choice quiz question, submit an answer choice, and receive immediate token feedback for correct answers.

**Independent Test**: Start from an active session with a seeded active round and assigned multiple-choice question, then confirm correct answers increase token balance, incorrect answers do not, and duplicate or expired submissions do not award extra tokens.

### Tests for User Story 1

- [X] T010 [P] [US1] Add player multiple-choice quiz answer and state coverage in `src/routes/join/-$joinCode.test.tsx`
- [X] T011 [P] [US1] Add no-repeat and scoring utility coverage in `convex/lib/quizRoundSelection.test.ts`

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement individualized question assignment, answer record persistence, and scoring functions in `convex/quizAssignments.ts`
- [X] T013 [P] [US1] Create player multiple-choice question and answer result components using the 8bitcn `Card` component in `src/components/join/player-quiz-question.tsx` and `src/components/join/player-quiz-result.tsx`
- [X] T014 [US1] Update player quiz route rendering, multiple-choice submission handling, and success/error state handling in `src/routes/join/$joinCode.tsx`
- [X] T015 [US1] Extend player token persistence and duplicate-award guards in `convex/playerEntries.ts`
- [X] T016 [US1] Wire player-facing quiz errors and scoring logs in `src/integrations/convex/join.ts` and `src/components/join/join-error-messages.ts`

**Checkpoint**: User Story 1 is fully functional and testable on its own with seeded round and question data.

---

## Phase 4: User Story 2 - Use A Reusable Question Bank (Priority: P2)

**Goal**: Maintain a reusable categorized multiple-choice question bank with complexity metadata that can be imported and selected for future rounds.

**Independent Test**: Load the managed question dataset, confirm ready questions include answer choices, category, complexity, accepted answer, and reward metadata, and verify selection only returns questions that satisfy the requested round rules.

### Tests for User Story 2

- [X] T017 [P] [US2] Add multiple-choice question dataset and validation coverage in `src/data/quiz-questions.test.ts` and `convex/lib/quizValidation.test.ts`

### Implementation for User Story 2

- [X] T018 [P] [US2] Populate categorized, complexity-tagged, multiple-choice quiz content in `src/data/quiz-questions.ts`
- [X] T019 [US2] Implement question-bank import, sync, and ready-question queries in `convex/quizQuestions.ts`
- [X] T020 [US2] Update category and complexity filtering plus exhausted-bank handling in `convex/lib/quizRoundSelection.ts`
- [X] T021 [US2] Surface question-bank coverage and invalid-question errors in `src/components/join/quiz-status-messages.ts` and `src/integrations/convex/join.ts`

**Checkpoint**: User Story 2 is fully functional and testable on its own with reusable question data powering valid selection.

---

## Phase 5: User Story 4 - Run Configurable Quiz Rounds (Priority: P2)

**Goal**: Let the host configure round length plus category/complexity rules, start a round, and end it automatically after the configured number of completed questions while showing the approved round-start presentation on the shared projector and player screens.

**Independent Test**: Configure a round from the host view, start it, verify the configured rules and round-start presentation appear on the shared projector and player screens, and confirm the round ends after exactly the configured number of completed questions without presenting additional round questions.

### Tests for User Story 4

- [X] T022 [P] [US4] Add host projector round configuration, lifecycle, and state coverage in `src/routes/host/-$joinCode.test.tsx`
- [X] T023 [P] [US4] Add round transition coverage in `convex/quizRounds.test.ts`

### Implementation for User Story 4

- [X] T024 [P] [US4] Implement round configuration, start, and completion mutations in `convex/quizRounds.ts`
- [X] T025 [P] [US4] Create host round controls and shared projector status panels in `src/components/join/host-quiz-round-controls.tsx` and `src/components/join/host-quiz-round-status.tsx`
- [X] T026 [P] [US4] Create a shared round-start presenter with the 8bitcn gaming `Chapter Intro` block in `src/components/join/round-chapter-intro.tsx`
- [X] T027 [US4] Update the shared projector route to show the `Chapter Intro` start state plus loading/empty/error states in `src/routes/host/$joinCode.tsx`
- [X] T028 [US4] Update the player quiz route to show the `Chapter Intro` start state plus loading/empty/error states before question delivery in `src/routes/join/$joinCode.tsx`
- [X] T029 [US4] Extend session lifecycle state for active round tracking and completion transitions in `convex/gameSessions.ts`

**Checkpoint**: User Story 4 is fully functional and testable on its own with host-controlled round setup and automatic round completion.

---

## Phase 6: User Story 3 - Show Token Gains To The Whole Room (Priority: P3)

**Goal**: Reflect awarded tokens and round progress in the shared projector summary and earned-points leaderboard so the room can follow quiz outcomes as an independently testable summary slice.

**Independent Test**: Seed earned-point results and round progress data, then confirm the shared projector route shows updated token totals, ranked earned points, and affected players without requiring additional quiz interactions during the test itself.

### Tests for User Story 3

- [X] T030 [P] [US3] Add shared projector summary and end-of-quiz leaderboard rendering coverage in `src/components/join/host-roster.test.tsx`

### Implementation for User Story 3

- [X] T031 [P] [US3] Create an end-of-quiz points summary using the 8bitcn gaming `Leaderboard` block in `src/components/join/quiz-points-leaderboard.tsx`
- [X] T032 [US3] Update shared projector roster and hero summary components for token totals, round progress, and leaderboard handoff in `src/components/join/host-roster.tsx` and `src/components/join/host-session-hero.tsx`
- [X] T033 [US3] Extend shared projector overview query payload with token balances and round summary data in `convex/gameSessions.ts`
- [X] T034 [US3] Update synchronized shared projector summary rendering to show the `Leaderboard` block at quiz end in `src/routes/host/$joinCode.tsx`

**Checkpoint**: User Story 3 is fully functional and testable on its own with visible shared token results and round progress.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finish shared validation, docs, and generated artifact follow-through.

- [X] T035 [P] Document required 8bitcn `Card`, `Chapter Intro`, and `Leaderboard` usage in `specs/002-quiz-token-awards/quickstart.md`
- [ ] T036 Regenerate and verify generated artifacts impacted by route or Convex contract changes in `src/routeTree.gen.ts` and `convex/_generated/`
- [X] T037 Run the planned verification commands and record outcomes in `specs/002-quiz-token-awards/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all story work.
- **Phase 3: US1** depends on Phase 2 and is the MVP slice.
- **Phase 4: US2** depends on Phase 2 and can proceed after or alongside US1, but its finished dataset improves later round coverage.
- **Phase 5: US4** depends on Phase 2 and benefits from US2’s question-bank import and filtering work.
- **Phase 6: US3** depends on Phase 2 and can be validated independently with seeded summary data, even though it will later consume scoring and round data from US1 and US4 in the full product flow.
- **Phase 7: Polish** depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after foundational work with no dependency on other stories.
- **US2 (P2)**: Starts after foundational work with no dependency on other stories.
- **US4 (P2)**: Starts after foundational work; integrates best after US2 because round rules depend on categorized question availability.
- **US3 (P3)**: Starts after foundational work and remains independently testable with seeded projector summary data.

### Within Each User Story

- Tests should be added before or alongside implementation and must fail before the main behavior is completed.
- Convex utilities and data functions should land before route integration.
- Route integration should land before cross-component summary polish.

### Parallel Opportunities

- `T002` and `T003` can run in parallel during setup.
- `T005` and `T006` can run in parallel during foundational work.
- `T010` and `T011` can run in parallel for US1 tests.
- `T012` and `T013` can run in parallel for US1 implementation.
- `T022` and `T023` can run in parallel for US4 tests.
- `T024`, `T025`, and `T026` can run in parallel for US4 implementation.
- `T031` can run in parallel with `T033` once leaderboard data needs are fixed.

---

## Parallel Example: User Story 1

```bash
Task: "Add player quiz answer flow coverage in src/routes/join/-$joinCode.test.tsx"
Task: "Add no-repeat and scoring utility coverage in convex/lib/quizRoundSelection.test.ts"

Task: "Implement individualized question assignment and answer scoring functions in convex/quizAssignments.ts"
Task: "Create player quiz question and answer result components in src/components/join/player-quiz-question.tsx and src/components/join/player-quiz-result.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "Add host round configuration and lifecycle coverage in src/routes/host/-$joinCode.test.tsx"
Task: "Add round transition coverage in convex/quizRounds.test.ts"

Task: "Implement round configuration, start, and completion mutations in convex/quizRounds.ts"
Task: "Create host round controls and status panels in src/components/join/host-quiz-round-controls.tsx and src/components/join/host-quiz-round-status.tsx"
Task: "Create a shared round-start presenter with the 8bitcn gaming Chapter Intro block in src/components/join/round-chapter-intro.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate player assignment, multiple-choice submission, and token feedback with `pnpm test`.

### Incremental Delivery

1. Finish Setup + Foundational to establish schema, client hooks, and shared validation.
2. Deliver US1 so players can answer and earn tokens.
3. Deliver US2 so the question bank becomes reusable and rule-driven.
4. Deliver US4 so hosts can configure and run rounds.
5. Deliver US3 so the room sees synchronized token and round summaries.
6. Finish with Polish tasks and full verification.

### Parallel Team Strategy

1. One developer handles Convex schema and shared utilities in Phase 2 while another prepares shared UI/test scaffolding from Phase 1.
2. After Phase 2, split player flow work (US1), question-bank work (US2), and host round controls (US4) across separate developers.
3. Merge shared-summary work (US3) after scoring and round data contracts stabilize.

---

## Notes

- All tasks follow the required checklist format with task ID, optional parallel marker, story label where required, and exact file paths.
- `US1` is the recommended MVP scope.
- Generated files must be regenerated by tooling, not edited manually.

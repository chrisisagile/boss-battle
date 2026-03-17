# Research: Quiz Token Awards

## Decision 1: Use Convex as the authoritative question bank and runtime game store

**Decision**: Store quiz questions, round configuration, assignments, answers, and token balances in Convex, and load the question bank from a repo-managed import source rather than serving questions only from a static client file.

**Rationale**: The feature requires host-controlled round rules, per-player individualized selection, no-repeat guarantees across multiple rounds, and realtime lobby/projector updates. Those behaviors need queryable server-side state and shared consistency across phones and the host display.

**Alternatives considered**:
- Keep questions only in a static file bundled into the client. Rejected because per-player assignment history, rule-based selection, and live host feedback need shared mutable state.
- Keep only answers in Convex and derive question state from the client. Rejected because it weakens runtime trust boundaries and makes no-repeat enforcement unreliable.

## Decision 2: Record individualized delivery with explicit assignment history

**Decision**: Create explicit per-player question assignment records for each round, keyed to session, round, player entry, and question.

**Rationale**: The spec requires that each player can receive different questions and must never receive the same question twice within a game. Assignment records make that rule directly enforceable, testable, and auditable, and they also provide a stable submission target for answer evaluation.

**Alternatives considered**:
- Store previously seen question IDs as an array on each player record. Rejected because it hides per-round timing and evaluation details and makes debugging or replay harder.
- Infer history from submitted answers only. Rejected because a delivered-but-unanswered question still counts as seen for repeat prevention.

## Decision 3: Track round lifecycle explicitly

**Decision**: Model quiz rounds as first-class records with configured question count, category rules, complexity rules, status, and completion progress.

**Rationale**: The host needs to start and end rounds, the system must stop after exactly the configured number of completed questions, and the host view must surface current round status and remaining questions. An explicit round entity keeps those transitions clear and avoids overloading the session record with transient lifecycle details.

**Alternatives considered**:
- Store all round state directly on `gameSessions`. Rejected because it would mix long-lived session state with per-round configuration and historical progress.
- Treat rounds as a purely UI-level counter. Rejected because round completion controls question delivery and token eligibility across all clients.

## Decision 4: Keep player token balance as a session-level counter with answer-level audit data

**Decision**: Store each player's current token balance on the player entry while also recording answer outcomes and awarded token counts on question assignment or answer records.

**Rationale**: The host roster and projector need immediate token totals without expensive aggregation on every paint, while planning and debugging still benefit from a per-question audit trail.

**Alternatives considered**:
- Derive token totals from all historical answers on every read. Rejected because the host and projector summaries are hot paths and should remain straightforward to query.
- Store only current balance with no answer-level award history. Rejected because it weakens correctness checks and makes disputes or bugs harder to investigate.

## Decision 5: Prefer narrow automated tests before Aspire-backed end-to-end coverage

**Decision**: Validate this feature primarily with focused Vitest and component tests plus targeted Convex contract coverage, and reserve AppHost E2E only for route-shell or orchestration regressions.

**Rationale**: Most new behavior lives in question selection rules, round transitions, and route-local loading/error states. Those are faster and more deterministic to cover with narrow tests, which aligns with the repository constitution and testing standards.

**Alternatives considered**:
- Rely mainly on Aspire-backed browser tests. Rejected because they are slower, broader, and not the narrowest useful verification layer for selection and validation rules.
- Skip automated coverage for Convex selection logic. Rejected because no-repeat and round-completion correctness are central feature contracts.

## Decision 6: Reuse the existing 8bitcn gaming registry for quiz presentation

**Decision**: Render active questions with the 8bitcn `Card` component, use the 8bitcn gaming `Chapter Intro` block to announce round start on host/projector and player screens, and use the 8bitcn gaming `Leaderboard` block to show quiz-earned points at the end of the quiz.

**Rationale**: The repository already uses shadcn/8bitcn as the approved retro UI source. Reusing documented 8bitcn components keeps the quiz flow visually consistent with the existing game language and avoids custom UI drift.

**Alternatives considered**:
- Build bespoke retro question, intro, and score-summary views. Rejected because it duplicates owned UI primitives and increases maintenance cost.
- Use generic shadcn primitives only. Rejected because the requested gaming presentation states are already covered by the approved 8bitcn registry.

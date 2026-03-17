# Implementation Plan: Quiz Token Awards

**Branch**: `[002-quiz-token-awards]` | **Date**: 2026-03-17 | **Spec**: [spec.md](/home/chris/dev/personal/boss-battle/specs/002-quiz-token-awards/spec.md)
**Input**: Feature specification from `/specs/002-quiz-token-awards/spec.md`

## Summary

Add a quiz-round gameplay slice where the host configures round length plus category and complexity rules, players receive individualized multiple-choice questions on their phones, correct answers award spendable action tokens, and the shared projector view updates with round progress and token totals in real time. The implementation will extend the existing TanStack Start + Convex join/session flow with explicit quiz question, round, assignment, and answer data contracts that preserve per-player no-repeat guarantees across a full game.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Convex functions in JavaScript  
**Primary Dependencies**: TanStack Start, TanStack Router, TanStack Query, Tailwind CSS v4, Convex, `@convex-dev/react-query`, Cloudflare/Wrangler, 8bitcn `Card`, 8bitcn gaming `Chapter Intro`, 8bitcn gaming `Leaderboard`  
**Storage**: Convex tables for sessions, rounds, question bank, assignments, answers, and player token balances; browser local storage for player device identity  
**Testing**: `pnpm test` with Vitest and Testing Library for route/component coverage, plus focused Convex behavior tests where possible; `pnpm test:e2e` only if AppHost route-shell behavior changes materially  
**Target Platform**: Cloudflare-hosted web application for modern mobile and desktop browsers  
**Project Type**: Full-stack web app  
**Performance Goals**: Player answer evaluation and token balance feedback within 10 seconds; shared projector token updates within 5 seconds of result finalization; host round setup in 15 seconds or less  
**Constraints**: Preserve existing TanStack Start route boundaries and Convex realtime patterns; keep Cloudflare-compatible runtime behavior; avoid edits to generated route tree or Convex generated files; keep `pnpm test` Docker-free; define loading, empty, success, and error states for player and shared projector quiz flows; use the approved 8bitcn `Card`, gaming `Chapter Intro`, and gaming `Leaderboard` blocks for the specified quiz presentation states  
**Scale/Scope**: 4 user stories; updates to `src/routes/join/$joinCode.tsx`, `src/routes/host/$joinCode.tsx`, join/host components, new quiz-focused components/hooks, and expanded Convex schema/functions for question bank, rounds, assignments, answers, and token summaries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Scope is captured as independently testable user stories with acceptance scenarios and measurable success criteria.
- [x] Runtime boundaries are identified: route params (`joinCode`), player answer forms, host round configuration forms, Convex queries/mutations/actions, browser device identity, and question import workflows.
- [x] Validation strategy is explicit for every untrusted input and no new unchecked `any` or silent fallback is required.
- [x] Test plan covers the narrowest useful automated tests for every changed behavior and names the verification commands to run.
- [x] Loading, empty, success, and error states are defined for each affected user-facing flow.
- [x] Observability and performance impact are addressed for SSR, streaming, bundle size, or network round trips when applicable.
- [x] Cloudflare, Convex, and `pnpm` workflow compatibility is preserved or the deviation is justified below.

**Pre-Phase-0 Assessment**: Pass. The spec is clarified enough to research concrete storage, assignment, and contract choices without additional user input.

**Post-Phase-1 Assessment**: Pass. The design keeps realtime state in Convex, uses route-local UI changes in `src/routes/host` and `src/routes/join`, keeps the shared projector surface on the host route, and records explicit validation, loading/empty/success/error handling, and verification commands.

## Project Structure

### Documentation (this feature)

```text
specs/002-quiz-token-awards/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── quiz-round-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── join/
│   └── ui/
├── integrations/
│   └── convex/
├── routes/
│   ├── host/
│   └── join/
└── test/

convex/
├── schema.js
├── gameSessions.ts
├── playerEntries.ts
└── lib/

devops/
└── tests/
```

**Structure Decision**: Keep gameplay UI inside the existing host/join route trees and `src/components/join/`, extend Convex under `convex/` with quiz-specific modules and schema fields/tables, and keep any seed/import helper data under repo-owned source rather than machine-local artifacts.

## Phase 0: Research Summary

- Choose Convex as the authoritative runtime store for quiz questions, rounds, assignments, answers, and token balances, with import/sync from a repo-managed question dataset.
- Model individualized delivery and no-repeat guarantees with explicit per-player question assignment records instead of deriving history from transient UI state.
- Preserve fast shared-projector updates by storing token balance on `playerEntries` while also recording assignment/answer outcomes for auditability.
- Keep verification centered on narrow Vitest/component coverage and targeted Convex contract tests before reaching for full Aspire E2E.

## Phase 1: Design Summary

- Add quiz-specific entities for question bank, round configuration, player assignments, and answer outcomes, with multiple-choice answer options stored as part of each quiz question contract.
- Extend host contracts so a round can be configured and started with question count plus category/complexity rules, and extend player contracts so answer submission is keyed to an assignment rather than only a join state.
- Keep route behavior resilient with explicit loading, empty, unavailable, closed-round, exhausted-question-bank, answer-finalized, and quiz-complete states for player and shared-projector flows.
- Use the 8bitcn `Card` component for question rendering, the 8bitcn gaming `Chapter Intro` block for round-start presentation on the shared projector and player screens, and the 8bitcn gaming `Leaderboard` block for end-of-quiz earned-point summaries.

## Phase 2: Implementation Strategy

1. Expand the Convex schema and domain functions for multiple-choice question import, round lifecycle, individualized assignment selection, answer evaluation, token awards, and shared-projector summaries.
2. Add host controls and shared projector display updates for round configuration, round progress, round-start presentation, earned-point summaries, and question-bank exhaustion or rule-mismatch errors.
3. Add player quiz-phase UI for `Card`-based question display, multiple-choice answer submission, `Chapter Intro` round-start presentation, result feedback, and updated token balance presentation.
4. Add focused tests for selection rules, no-repeat guarantees, loading/empty/error states, round completion, and player/projector rendering states.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

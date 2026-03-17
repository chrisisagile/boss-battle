# Implementation Plan: Persistent Battle State

**Branch**: `[003-persistent-battle-state]` | **Date**: 2026-03-17 | **Spec**: [spec.md](/home/chris/dev/personal/boss-battle/specs/003-persistent-battle-state/spec.md)
**Input**: Feature specification from `/specs/003-persistent-battle-state/spec.md`

## Summary

Extend the existing join and quiz game loop with Convex-backed persistent battle
state so the party and one or more active bosses retain health, action points,
knockout status, skills, and sprites across rounds. Reuse the current
`/host/$joinCode` and `/join/$joinCode` route shells, add a reusable boss
catalog plus encounter/combatant state, surface a shared projector arena view
and between-round party status, and keep approved retro presentation blocks
behind repo-owned 8bit UI wrappers.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Convex functions in JavaScript  
**Primary Dependencies**: TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, Cloudflare/Wrangler, owned shadcn/8bitcn UI including `PlayerProfileCard` plus repo-owned wrappers for `Character Sheet`, `Enemy Health Display`, `Mana Bar`, and `Health Bar`  
**Storage**: Convex tables for sessions, player entries, boss catalog, encounter state, combatant state, and skill definitions; browser `localStorage` only for per-device join identity  
**Testing**: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` with Vitest and Testing Library, targeted Convex behavior tests, and `pnpm test:e2e` when host/projector route-shell behavior changes materially  
**Target Platform**: Cloudflare-hosted web application for shared projector displays and modern mobile browsers  
**Project Type**: Full-stack web app  
**Performance Goals**: Host can start a configured battle in under 30 seconds, player and projector battle-state updates propagate within 5 seconds of a resolved round, and between-round status views remain readable with one live query subscription per route surface rather than stacked polling  
**Constraints**: Preserve existing host/join route ownership and Convex realtime patterns; do not hand-edit generated TanStack or Convex outputs; validate all route params, form payloads, Convex mutation arguments, and sprite references; use `action points` as the canonical runtime term across host, player, and projector UI; keep late-joining players out of active battles until the current battle ends; keep knocked-out players inactive until heal or revive; use approved retro battle presentation blocks through repo-owned wrappers; persist fallback sprite assignments so reconnects and projector renders stay visually stable  
**Scale/Scope**: 3 user stories; updates to `src/routes/host/$joinCode.tsx` and `src/routes/join/$joinCode.tsx`, new or expanded battle-focused components under `src/components/join/` and `src/components/ui/8bit/`, expanded Convex schema and domain modules, and targeted component plus domain tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Scope is captured as independently testable user stories with acceptance scenarios and measurable success criteria.
- [x] Runtime boundaries are identified: route params (`joinCode`), player action forms, host encounter setup forms, Convex queries/mutations, browser device identity, approved sprite-reference inputs, and route-local loading/error states.
- [x] Validation strategy is explicit for every untrusted input and no new unchecked `any` or silent fallback is required.
- [x] Test plan covers the narrowest useful automated tests for every changed behavior and names the verification commands to run.
- [x] Loading, empty, success, and error states are defined for each affected user-facing flow.
- [x] Observability and performance impact are addressed for SSR, streaming, bundle size, or network round trips when applicable.
- [x] Cloudflare, Convex, and `pnpm` workflow compatibility is preserved and no deviation is required.

**Pre-Phase-0 Assessment**: Pass. The clarified spec is specific enough to choose data ownership, battle lifecycle rules, and route contracts without further clarification.

**Post-Phase-1 Assessment**: Pass. The design keeps trusted state in Convex, extends existing route and hook seams instead of creating parallel shells, defines explicit loading/empty/error/projector states, and leaves verification centered on deterministic `pnpm` commands plus AppHost coverage only where host/projector integration shifts materially.

## Project Structure

### Documentation (this feature)

```text
specs/003-persistent-battle-state/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── convex-battle-contract.md
│   └── route-battle-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── join/
│   └── ui/
│       └── 8bit/
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
├── quizRounds.ts
└── lib/

devops/
└── tests/
```

**Structure Decision**: Keep host/player gameplay changes inside the existing
`src/routes/host/` and `src/routes/join/` shells, extract battle presentation
into `src/components/join/`, add owned 8bit battle wrappers under
`src/components/ui/8bit/`, extend the existing Convex hook seam in
`src/integrations/convex/join.ts`, and add new battle-oriented schema/modules
under `convex/` rather than introducing a separate service boundary.

## Phase 0: Research Summary

- Keep Convex as the authoritative store for encounter progression, boss
  catalog data, player combat state, and projector read models.
- Model reusable boss definitions separately from per-encounter combatant state
  so multiple bosses can share a template while carrying distinct health and
  sprite state.
- Define scaling profiles as player-count-based adjustments to boss health and
  action points at encounter start; do not auto-scale boss count or skill list
  in this feature slice.
- Persist either a custom sprite reference or a generated fallback sprite key
  on the combatant record so reconnects do not reroll visuals.
- Extend the current host/player summary queries and route flows instead of
  layering additional battle-only polling seams on top of them.
- Treat active-battle join attempts as blocked participation with explicit user
  messaging, matching the clarified "join after battle ends" rule.
- Persist study effects as a one-use next-round question advantage on the player
  combatant summary, consumed by the next quiz round after it is applied.
- Keep validation and verification focused on route-local state handling and
  Convex domain transitions before reaching for broad AppHost coverage.

## Phase 1: Design Summary

- Add battle-specific entities for boss definitions, encounter lifecycle,
  combatant state, and reusable skills while extending session/player records
  only where battle participation must intersect the existing join flow.
- Extend host/projector contracts to cover encounter setup, boss lineup,
  between-round party summaries, arena rendering, and victory/defeat states.
- Extend player contracts to cover combat profile visibility, available action
  categories, knockout state, and explicit blocked-join feedback when a battle
  is already underway.
- Resolve round outcomes by applying all queued same-round effects before the
  final victory or defeat check, and end the encounter immediately once all
  bosses are defeated.
- Keep sprite handling deterministic by storing either a database-defined sprite
  reference or a persisted fallback sprite key on each combatant.
- Preserve loading, empty, success, and error states for host, player, and
  projector-facing battle surfaces with explicit logging context for failed
  battle-state queries and mutations.

## Phase 2: Implementation Strategy

1. Expand the Convex schema and domain modules for boss definitions, encounter lifecycle, combatant persistence, skill metadata, round resolution, and battle-aware host/player summaries.
2. Extend `src/integrations/convex/join.ts` plus the host and player routes so battle state, join gating, and between-round summaries flow through the existing route contracts.
3. Add retro battle presentation wrappers and battle-specific components for player profile cards, character sheets, enemy health displays, action-point bars, health bars, projector arena composition, knockout messaging, and sprite fallbacks.
4. Add focused tests for encounter setup validation, round-to-round persistence, same-round resolution order, knockout and revive behavior, blocked late joins, summary query shaping, and host/player loading or failure states.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

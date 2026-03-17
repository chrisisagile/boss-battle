# Implementation Plan: Battle Feedback and Balance

**Branch**: `[feat/005-battle-feedback-balance]` | **Date**: 2026-03-17 | **Spec**: [spec.md](/home/chris/dev/personal/boss-battle/specs/005-battle-feedback-balance/spec.md)
**Input**: Feature specification from `/specs/005-battle-feedback-balance/spec.md`

## Summary

Improve battle clarity and survivability without changing the room or route
topology. Extend the existing host and player battle summaries so both surfaces
can render the same current-action plus recent-history feed during exchange
resolution, and rebalance standard encounters by increasing player durability
while reducing default monster damage pressure in the Convex battle domain.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Convex functions in TypeScript  
**Primary Dependencies**: TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, repo-owned 8bit UI wrappers, Cloudflare/Wrangler  
**Storage**: Convex tables for sessions, rounds, round participants, encounters, combatants, battle exchanges, skills, and boss definitions; browser `localStorage` for per-device join identity  
**Testing**: `pnpm exec tsc --noEmit`, `pnpm exec tsc -p convex/tsconfig.json --noEmit`, `pnpm lint`, `pnpm test`, focused route/component and Convex tests during implementation, and final `pnpm test:e2e` because host/player battle views and Convex-backed live flow change materially  
**Target Platform**: Cloudflare-hosted web application for a shared host/projector screen and modern mobile browsers  
**Project Type**: Full-stack web app  
**Performance Goals**: Battle activity updates should arrive through the same live summary refresh that reflects exchange resolution; hosts and players should identify actor, target, and outcome within 3 seconds of each event appearing; the feature should avoid additional route-level query fan-out by extending existing summary seams rather than adding parallel battle-feed queries  
**Constraints**: Preserve the existing `/host/$joinCode` and `/join/$joinCode` route ownership; keep Convex hooks and frontend logging centralized in `src/integrations/convex/join.ts`; validate route params, join identity, action submissions, and any new activity-feed fields at the trust boundary; do not hand-edit generated TanStack or Convex outputs; preserve `pnpm`, Cloudflare, and Convex realtime compatibility; use a repo-owned retro dialogue surface patterned after the approved 8bitcn gaming dialogue block reference; if a standards change seems required, stop and ask the user before editing `docs/codingstandards/`  
**Scale/Scope**: 3 user stories; updates to host arena and player battle surfaces, Convex battle-resolution summaries, exchange persistence, default player and boss tuning, and focused tests around host/player battle state and battle resolution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Scope is captured as independently testable user stories with acceptance scenarios and measurable success criteria.
- [x] Runtime boundaries are identified: route params (`joinCode`), player device identity, Convex summary queries, encounter start and resolve mutations, player action submissions, and any new activity-feed fields exposed to the UI.
- [x] Validation strategy is explicit for every untrusted input and no new unchecked `any` or silent fallback is required.
- [x] Test plan covers the narrowest useful automated tests for every changed behavior and names the verification commands to run.
- [x] Implementation slices define focused integration checks, and the plan defines when the final `pnpm test:e2e` gate runs plus how failures are fixed and rerun before the work is called complete.
- [x] Loading, empty, success, and error states are defined for each affected user-facing flow.
- [x] Observability and performance impact are addressed for SSR, streaming, bundle size, or network round trips when applicable.
- [x] Cloudflare, Convex, and `pnpm` workflow compatibility is preserved or the deviation is justified below.
- [x] If delegated subagents are available and allowed, the plan includes a standards-review subagent pass against `docs/codingstandards/` and the created code before merge.
- [x] Any change to `docs/codingstandards/` is called out as requiring an explicit stop and user confirmation before editing.

**Pre-Phase-0 Assessment**: Pass. The spec and clarification session already
settle the highest-impact product choices: both host and player surfaces receive
the same exchange-scoped feed, the feed shows the current action plus short
recent history, and standard encounters should leave most players still active
after the opening monster phase. Research can focus on repo-fit seams rather
than unresolved product scope.

**Post-Phase-1 Assessment**: Pass. The design extends existing host/player
summary queries, keeps battle activity scoped to the current exchange, centralizes
rebalance logic in the Convex battle domain, and preserves narrow route,
component, and Convex tests with a final AppHost/browser gate.

## Project Structure

### Documentation (this feature)

```text
specs/005-battle-feedback-balance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── convex-battle-feedback-contract.md
│   └── route-battle-feedback-contract.md
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
├── battleState.ts
├── quizRounds.ts
├── lib/
└── schema.ts

devops/
└── tests/
```

**Structure Decision**: Keep route ownership in
`src/routes/host/$joinCode.tsx` and `src/routes/join/$joinCode.tsx`, keep
feature composition in `src/components/join/`, keep retro presentation wrappers
under `src/components/ui/8bit/`, and keep authoritative balance and activity
logic in `convex/battleState.ts`, `convex/quizRounds.ts`, and `convex/schema.ts`
instead of introducing new route trees or a second client-side battle state
store.

## Phase 0: Research Summary

- Reuse `gameSessions.getHostOverview` for the host/projector surface and
  `quizRounds.getPlayerQuizState` for the player surface. Extend them with
  battle activity data rather than creating a separate battle-log query.
- Model the feed as exchange-scoped ordered activity events attached to
  `battleExchanges`, because the spec only requires the current action plus a
  short recent history for the active exchange, not a permanent transcript.
- Compose the same feed into both `HostBattleArena` and `PlayerBattleProfile`
  through a shared repo-owned retro dialogue component, rather than duplicating
  feed markup independently in each screen.
- Centralize the rebalance in the Convex battle domain by tuning player
  starting health plus default monster damage and scaling pressure in
  `convex/battleState.ts` and `convex/lib/battleState.ts`; do not add new
  host-configurable balance controls in this slice.
- Preserve the existing observability seam in `src/integrations/convex/join.ts`
  by extending battle-resolution and summary-load logging instead of adding a
  parallel logging path.
- Keep the route-level loading, unavailable, waiting, action-selection, battle-
  resolution, and error states explicit on both host and player surfaces so the
  feed does not appear as a silent background update.

## Phase 1: Design Summary

- Extend `battleExchanges` with an ordered `activityEvents` payload that records
  per-event actor identity, target identity, action label, outcome type,
  magnitude, and post-event combat state snapshots needed for UI messaging.
- Extend `gameSessions.getHostOverview` with a `battleActivity` summary for the
  current exchange, and extend `quizRounds.getPlayerQuizState` with the same
  exchange summary so both surfaces can render one shared feed contract.
- Keep the host arena responsible for the large-screen combined party/boss/feed
  view, while `PlayerBattleProfile` gains the same feed summary beside the
  player’s actionable state and battle controls.
- Introduce repo-owned feed presentation under `src/components/join/` and
  `src/components/ui/8bit/` so the game can match the approved retro dialogue
  style without depending directly on an external registry at runtime.
- Replace hard-coded combat tuning with named defaults so player starting
  health, boss strike pressure, and default boss catalog scaling can be changed
  coherently and tested together.
- Update battle-resolution tests to assert activity ordering, knockout/miss/heal
  event reporting, and the new survivability baseline for standard encounters.

## Runtime Ownership

### Query ownership

- `gameSessions.getHostOverview`
  Remains the host/projector summary and now includes the active exchange
  activity feed, encounter balance state, and any battle-resolution waiting or
  error messaging inputs the host surface needs.
- `quizRounds.getPlayerQuizState`
  Remains the single player summary and now includes the same active exchange
  activity feed, plus the player’s action-selection or waiting-state branches.

### Mutation ownership

- `battleState.startEncounter`
  Continues to initialize player and boss combatants, but the balance baseline
  for player health and default boss pressure now comes from centralized tuning
  constants rather than scattered literals.
- `battleState.submitPlayerAction`
  Remains the player-action intake point with the same validation boundary.
- `battleState.resolveBattleExchange`
  Becomes the authoritative producer of ordered activity-feed events for boss
  and player turns and applies the updated balance values during resolution.

### Presentation ownership

- `src/components/join/host-battle-arena.tsx`
  Continues to own the host/projector battle layout and gains the shared feed
  presentation.
- `src/components/join/player-battle-profile.tsx`
  Continues to own player battle controls and gains the same exchange feed for
  non-host viewers.
- `src/integrations/convex/join.ts`
  Remains the hook and frontend logging boundary for all new summary fields and
  battle-resolution failure logging.

## Standards Review Plan

- **Coding standards source**: `docs/codingstandards/README.md`,
  `docs/codingstandards/shared.md`, `docs/codingstandards/testing.md`,
  `docs/codingstandards/react.md`, `docs/codingstandards/tanstack-start.md`,
  `docs/codingstandards/shadcn.md`, and `docs/codingstandards/convex.md`
- **Delegated review step**: Run a dedicated standards-review subagent after
  the main implementation slices and again before merge, because delegated
  subagents are available and the feature spans React, TanStack Start, Convex,
  and retro UI wrappers.
- **Response plan**: Address standards findings in the same implementation
  effort before merge; if any finding appears to require a standards-doc change,
  stop and request user confirmation before editing `docs/codingstandards/`.
- **Coding standards edits**: No standards edits are planned. If one appears
  necessary, stop for explicit user approval first.

## Screen Mocks

### Host Arena With Battle Feed

```text
+----------------------------------------------------------------------------------+
| Battle Arena                                                           Round 2   |
| 3 active heroes                                                        1 KO      |
+----------------------------------------------------------------------------------+
| Party Health: [====================----] 42 / 54                                 |
+----------------------------------------------------------------------------------+
| HEROES                                   | MONSTERS                              |
| [Ari      HP 12/16 AP 2]                 | [Obsidian Hydra   HP 18/28 AP 2]      |
| [Jules    HP  0/16 KO 0]                 | [Neon Lich        HP 14/24 AP 3]      |
| [Mina     HP 14/16 AP 1]                 |                                        |
+----------------------------------------------------------------------------------+
| BATTLE DIALOGUE                                                                  |
| > Obsidian Hydra uses Boss Strike on Ari for 4 damage.                           |
|   Ari guards and reduces the hit.                                                |
|   Mina uses Rally Heal on Ari for 3 health.                                      |
|   Neon Lich misses Jules.                                                        |
+----------------------------------------------------------------------------------+
| [Continue Battle]                                              Exchange 1 of 3   |
+----------------------------------------------------------------------------------+
```

### Player Battle View With Shared Feed

```text
+--------------------------------------------------------------+
| Ari                                          Battle-ready    |
| HP 12 / 16                    AP 2           Active          |
+--------------------------------------------------------------+
| BATTLE DIALOGUE                                               |
| > Obsidian Hydra uses Boss Strike on Ari for 4 damage.        |
|   Ari guards and reduces the hit.                             |
|   Mina uses Rally Heal on Ari for 3 health.                   |
+--------------------------------------------------------------+
| Available Skills                                              |
| [Slash      1 AP]   Target: [Obsidian Hydra v]   [Use]        |
| [Rally Heal 1 AP]   Target: [Ari v]              [Use]        |
| [Shield Wall 1 AP]                               [Use]        |
| [Study Weakness 2 AP]                            [Use]        |
+--------------------------------------------------------------+
```

### Host Arena Between Exchanges

```text
+----------------------------------------------------------------------------------+
| Battle Arena                                                           Round 2   |
+----------------------------------------------------------------------------------+
| PARTY STATUS                              | BOSS STATUS                           |
| Ready: Ari, Mina                          | Remaining: Obsidian Hydra, Neon Lich |
| Waiting: Jules (KO)                       | Last exchange resolved                |
+----------------------------------------------------------------------------------+
| BATTLE DIALOGUE                                                                  |
| > Exchange 1 complete.                                                            |
|   Most players are still active.                                                  |
|   Waiting for next battle resolution.                                             |
+----------------------------------------------------------------------------------+
| [Continue Battle]                                              Exchange 2 of 3   |
+----------------------------------------------------------------------------------+
```

## Slice Verification Plan

- **Slice 1 verification**: `pnpm test -- --run convex/battleState.test.ts src/components/join/host-battle-arena.test.tsx`
- **Slice 2 verification**: `pnpm test -- --run src/routes/host/-\$joinCode.test.tsx src/routes/join/-\$joinCode.test.tsx src/components/join/player-battle-profile.test.tsx`
- **Slice 3 verification**: `pnpm test -- --run convex/battleState.test.ts src/components/join/host-battle-arena.test.tsx src/components/join/player-battle-profile.test.tsx`
- **Final browser gate**: `pnpm test:e2e`
- **Failure response**: Fix and rerun the failing focused command or `pnpm test:e2e` in the same implementation effort by default; only proven unrelated blockers may be deferred, and they must be recorded with the exact failing command and reason.

## Complexity Tracking

No constitution violations or justified complexity exceptions are required at
planning time.

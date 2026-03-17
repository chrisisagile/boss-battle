# Research: Battle Feedback and Balance

## Decision 1: Extend the existing host and player summary queries

**Decision**: Keep `gameSessions.getHostOverview` as the host/projector summary
and `quizRounds.getPlayerQuizState` as the player summary, extending each with
the current exchange activity feed instead of adding a separate battle-log
query.

**Rationale**: Both routes already branch from those queries, and the
performance goal favors no extra query fan-out. Extending the current summary
surfaces keeps the UI synchronized through one subscription per route, matches
the existing `src/integrations/convex/join.ts` boundary, and keeps battle feed
loading and error states aligned with the rest of the live room state.

**Alternatives considered**:
- Add a dedicated `battleActivity` query per surface. Rejected because it
  creates a second live dependency for the same screen and complicates ordering
  guarantees.
- Derive the feed only on the client from existing encounter fields. Rejected
  because the current schema does not preserve enough resolved-action detail to
  reconstruct misses, healing, guarding, or knockout timing safely.

## Decision 2: Persist ordered activity events on `battleExchanges`

**Decision**: Extend `battleExchanges` with an ordered `activityEvents` payload
for the active exchange rather than creating a separate top-level table.

**Rationale**: The feed requirement is exchange-scoped: current action plus a
short recent history for the same exchange. `battleExchanges` already owns
exchange ordering and resolution state, so keeping the feed there preserves one
authoritative record and avoids scattering exchange data across multiple
collections.

**Alternatives considered**:
- Add a new `battleActivityEvents` table. Rejected because it adds another
  top-level query path for data that is already naturally contained by one
  exchange.
- Store only free-form narration strings. Rejected because the host and player
  views need structured actor, target, outcome, and resulting-state data for
  testability and future reuse.

## Decision 3: Use one shared retro dialogue surface on both host and player views

**Decision**: Build one repo-owned battle dialogue component patterned after the
approved retro gaming dialogue reference and reuse it in both
`HostBattleArena` and `PlayerBattleProfile`.

**Rationale**: The clarified spec requires the same ordered feed on both
surfaces. One shared presentation component keeps terminology, layout, and
event rendering consistent and limits duplicated styling logic. This also fits
the repo’s existing pattern of owning 8bit wrappers under `src/components/ui/8bit/`
rather than depending on external runtime assets.

**Alternatives considered**:
- Implement separate host and player feed UIs. Rejected because it would drift
  in copy, ordering, and edge-case treatment.
- Limit the dialogue feed to the host surface. Rejected because clarification
  explicitly expanded the feature scope to player devices too.

## Decision 4: Keep balance tuning centralized in the Convex battle domain

**Decision**: Rebalance standard encounters by increasing player starting and
maximum health and lowering default monster damage pressure in
`convex/battleState.ts` and `convex/lib/battleState.ts`, without introducing new
host-configurable balance settings in this feature.

**Rationale**: The spec asks for a corrected baseline, not a new balancing UI.
The current tuning lives in Convex battle setup and resolution code, including
player starting health, default skill seeds, and boss scaling. Centralizing the
change there keeps the balance contract authoritative and testable.

**Alternatives considered**:
- Add host-editable health and damage sliders. Rejected because it expands the
  feature into new product configuration and makes acceptance tests fuzzy.
- Tune only the boss catalog seeds but not player health. Rejected because the
  requested outcome explicitly calls for both higher user hit points and lower
  monster attack pressure.

## Decision 5: Extend the current logging seam instead of adding a new one

**Decision**: Keep frontend observability in `src/integrations/convex/join.ts`
and extend it with feed-related and resolution-related context where needed.

**Rationale**: The repo already uses that module for host/player load and battle
transition logging. Reusing it satisfies the constitution’s observability
requirement without fragmenting battle logs across multiple utility layers.

**Alternatives considered**:
- Introduce a separate battle feed logger in a new integration module. Rejected
  because it duplicates an established seam.
- Skip additional feed observability entirely. Rejected because failures in the
  live activity feed would be hard to diagnose across host and player surfaces.

## Decision 6: Validate feed ordering and survivability with focused tests first

**Decision**: Use focused Convex tests for exchange event production and balance
rules, component tests for feed rendering on host and player surfaces, route
tests for state branching, and keep `pnpm test:e2e` as the final live-browser
gate.

**Rationale**: The risk splits cleanly: Convex owns ordered event generation and
rebalance math, while the route and component layers own visible state
branching. This produces faster evidence than leaning only on the AppHost test
suite while still respecting the repo’s final browser gate requirement.

**Alternatives considered**:
- Rely mostly on E2E validation. Rejected because battle ordering and balance
  regressions are easier to pinpoint in focused unit/integration tests.
- Rely mostly on manual playtesting. Rejected because the feature changes live
  state projection and battle rules in ways that need deterministic coverage.

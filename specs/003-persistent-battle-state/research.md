# Research: Persistent Battle State

## Decision 1: Keep Convex as the authoritative battle-state store

**Decision**: Store boss catalog records, encounter lifecycle, combatant state,
skill metadata, and projector summaries in Convex instead of deriving battle
state from client-only route state.

**Rationale**: The feature requires shared projector visibility, reconnect-safe
player state, multiple active bosses, and round-to-round persistence. Those are
all cross-client runtime guarantees that need a server-authoritative source of
truth.

**Alternatives considered**:
- Keep battle state in browser memory and reconstruct it from quiz outcomes.
  Rejected because reconnects and projector sync would become fragile.
- Store only aggregate party and boss totals. Rejected because player knockout,
  revives, skills, and sprite identity need per-combatant persistence.

## Decision 2: Separate reusable boss definitions from encounter combatants

**Decision**: Model reusable boss templates in a boss catalog and represent each
on-field boss as a separate encounter combatant record.

**Rationale**: The spec allows multiple bosses in the same round and expects
their state to persist independently. Reusable definitions keep content authoring
clean, while encounter combatants hold health, action points, effects, and
sprite state for that specific battle instance.

**Alternatives considered**:
- Store all boss data directly on the encounter record. Rejected because it
  makes content reuse and editing harder.
- Use one boss-state record per boss definition. Rejected because duplicate or
  repeated bosses in a single encounter would conflict.

## Decision 3: Persist fallback sprite assignments, not just custom sprite refs

**Decision**: Save either an explicit custom sprite reference or a generated
fallback sprite key on each combatant record.

**Rationale**: The spec requires random pixel-art defaults but also expects
state continuity across reconnects, rounds, and projector renders. Persisting
the selected fallback prevents each render from showing a different sprite.

**Alternatives considered**:
- Randomize fallback art at render time. Rejected because the same combatant
  could appear with different visuals across views or reloads.
- Require every combatant to have a custom sprite. Rejected because the spec
  explicitly requires random defaults when no configured sprite exists.

## Decision 4: Extend existing host and player live-query seams

**Decision**: Extend `gameSessions.getHostOverview` and the player quiz-state
query surface with battle-aware fields instead of adding separate route-level
battle polling contracts.

**Rationale**: The host and player routes already depend on these live queries.
Expanding those summaries keeps route data ownership centralized and avoids
stacking multiple realtime subscriptions for one screen.

**Alternatives considered**:
- Add independent battle-only queries and let routes merge them locally.
  Rejected because it increases loading-state complexity and network fan-out.
- Replace the existing summary queries outright. Rejected because the join and
  quiz flows already depend on them and incremental extension is lower risk.

## Decision 5: Treat active-battle late joins as blocked participation

**Decision**: When a battle is active, new players may not join that battle and
must wait until the battle ends before entering active participation.

**Rationale**: This matches the clarification outcome and keeps combat balance,
party scaling, and encounter resolution stable once a battle has started.

**Alternatives considered**:
- Queue late joiners into the next round of the same battle. Rejected because
  it changes scaling and party-state assumptions mid-encounter.
- Allow immediate full-state entry mid-battle. Rejected because it undermines
  fairness and complicates encounter balancing.

## Decision 6: Represent player and boss actions with reusable skill metadata

**Decision**: Define reusable skill metadata records with a category, action
cost, effect description, and carry-forward rules, then attach available skills
to player and boss combatants through their persisted combat state.

**Rationale**: The feature needs creative skills while still enforcing the
canonical categories of attack, heal, defend, and study. A reusable skill seam
lets content vary without changing route or round-resolution contracts.

**Alternatives considered**:
- Hardcode skill behavior only in UI components. Rejected because battle
  resolution and validation belong in trusted runtime state.
- Keep only broad category labels with no reusable metadata. Rejected because
  content authoring for bosses and players would become scattered and brittle.

## Decision 7: Keep verification narrow and battle-specific

**Decision**: Validate this feature primarily with targeted Convex behavior
tests, route/component tests, and standard type/lint checks, using AppHost E2E
only if the shared host/projector route shell changes materially.

**Rationale**: The highest-risk behaviors are state persistence, encounter
transitions, join gating, knockout/revive handling, and UI state rendering.
Those are better covered with deterministic narrow tests than broad browser
automation alone.

**Alternatives considered**:
- Rely mainly on end-to-end tests. Rejected because they are slower and less
  precise for domain-state regressions.
- Skip battle-state unit coverage and validate manually. Rejected because the
  feature introduces persistent state and lifecycle rules that should be tested
  directly.

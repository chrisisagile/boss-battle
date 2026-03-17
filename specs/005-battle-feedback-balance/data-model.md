# Data Model: Battle Feedback and Balance

## Overview

This feature extends the existing battle runtime rather than creating a new
game mode. The main model change is an exchange-scoped activity feed that both
host and player views can consume from the same live state, plus a clearer
balance baseline for standard encounters.

## Entities

### Battle Exchange

**Purpose**: Own one resolved combat pass inside a round, including player
action selections, boss summaries, and the ordered activity feed shown during
resolution.

**Persistence strategy**: Extend the existing `battleExchanges` table.

**Fields**:
- `roundId`
- `encounterId`
- `exchangeNumber`
- `status`: `pending | resolving | resolved`
- `bossActionSummary`
- `playerTurnOrder`
- `playerActions`
- `activityEvents`
- `resolvedAt`

**Validation rules**:
- `exchangeNumber` must remain unique within one round.
- `activityEvents` must be stored in resolution order.
- `status` must progress `pending -> resolving -> resolved`.
- `resolvedAt` must be present once `status` becomes `resolved`.

**State transitions**:
- `pending -> resolving` when battle resolution begins
- `resolving -> resolved` when all boss and player events for the exchange are persisted

### Battle Activity Event

**Purpose**: Represent one visible event in the exchange feed for both host and
player surfaces.

**Persistence strategy**: Nested structured object inside
`Battle Exchange.activityEvents`.

**Fields**:
- `eventNumber`
- `actorCombatantId`
- `actorName`
- `actorType`: `player | boss`
- `targetCombatantId`
- `targetName`
- `actionLabel`
- `outcomeType`: `damage | heal | guard | miss | skipped | knockout | status`
- `magnitude`
- `resultingTargetHealth`
- `resultingTargetState`
- `summaryText`

**Validation rules**:
- `eventNumber` must be unique and sequential within one exchange.
- `summaryText` must match the structured fields and never be the only source
  of truth.
- `resultingTargetState` must align with the post-event combatant state written
  for the same resolution step.
- `targetCombatantId` may be `null` only when an event truly has no target.

### Battle Activity Feed Projection

**Purpose**: The route-facing view model consumed by host and player UI to show
the current event plus a short recent history.

**Persistence strategy**: Derived from the active `Battle Exchange`; not a
standalone table.

**Fields**:
- `exchangeId`
- `exchangeNumber`
- `status`
- `currentEvent`
- `recentEvents`

**Validation rules**:
- `currentEvent` must be the newest visible item when any activity exists.
- `recentEvents` must preserve resolution order and remain scoped to the active
  exchange.
- The same feed projection must be available on both host and player summaries.

### Combatant State

**Purpose**: Persist battle-ready state for each player or boss and reflect the
results of each activity event.

**Persistence strategy**: Reuse the existing `combatantStates` table.

**Relevant fields**:
- `combatantType`
- `displayName`
- `currentHealth`
- `maxHealth`
- `currentActionPoints`
- `actionPointsPerRound`
- `state`
- `availableSkillIds`
- `nextQuizAdvantage`
- `lastUpdatedAt`

**Validation rules**:
- `currentHealth` must never exceed `maxHealth`.
- `currentActionPoints` must not fall below zero.
- A knocked-out or defeated combatant cannot be rendered as the next active
  actor in a new event.
- Post-event state changes must match the latest persisted feed event for that
  combatant.

### Combat Balance Profile

**Purpose**: Define the standard encounter durability and damage baseline used
by new sessions.

**Persistence strategy**: Conceptual model backed by centralized defaults in
battle setup and default boss/skill data; not a standalone table in this slice.

**Inputs**:
- player starting and maximum health
- default boss damage pressure
- default boss health and action-point scaling

**Validation rules**:
- Standard encounters should leave most players still active after the opening
  monster phase.
- Balance defaults must apply consistently to newly started standard sessions.
- Custom encounter data may still diverge, but it must not break feed fidelity.

## Relationships

- One `Battle Exchange` contains many `Battle Activity Event` records.
- One `Battle Activity Feed Projection` is derived from one active
  `Battle Exchange`.
- Many `Battle Activity Event` records reference one `Combatant State` as actor
  and optionally one `Combatant State` as target.
- One `Combat Balance Profile` influences many `Combatant State` initial values
  across new standard encounters.

# Convex Contract: Battle Feedback and Balance

## Queries

### `gameSessions.getHostOverview` (extended)

**Purpose**: Return the single host/projector summary for a live room,
including battle activity, party state, boss state, and current round status.

**Arguments**:
- `joinCode: string`

**Returns**:
- `null` when the room is missing or completed outside the live flow
- host summary including:
  - session metadata
  - active round summary
  - encounter summary
  - party combatants and boss lineup
  - `battleActivity` for the active exchange:
    - `exchangeId`
    - `exchangeNumber`
    - `status`
    - `currentEvent`
    - `recentEvents`

**Failure modes**:
- invalid `joinCode`
- missing room
- host summary cannot be assembled from current round or encounter state

### `quizRounds.getPlayerQuizState` (extended)

**Purpose**: Return the player-facing summary for join, quiz, waiting, battle,
and results states, including the active exchange feed during battle
resolution.

**Arguments**:
- `joinCode: string`
- `deviceId: string`

**Returns**:
- `null` when the room is unavailable
- player summary including:
  - player identity and eligibility
  - active round and battle status
  - current quiz or action-selection state
  - combatant summary
  - available skills and targets
  - `battleActivity` for the active exchange:
    - `exchangeId`
    - `exchangeNumber`
    - `status`
    - `currentEvent`
    - `recentEvents`

**Failure modes**:
- invalid `joinCode`
- invalid or unknown `deviceId`
- room no longer active

## Mutations

### `battleState.startEncounter` (updated balance baseline)

**Purpose**: Start a standard encounter using the current standard player and
monster balance baseline.

**Required inputs**:
- `sessionId`
- `bossDefinitionIds`
- `questionTarget`
- `allowedCategories`
- `allowedComplexities`

**Success outcome**:
- creates the encounter
- initializes player combatants with the updated standard durability baseline
- initializes bosses with the updated standard pressure baseline
- locks room config for the active encounter

**Failure modes**:
- invalid boss selection
- invalid round configuration
- no joined players
- room already active or completed

### `battleState.submitPlayerAction`

**Purpose**: Record one player action for the active exchange.

**Required inputs**:
- `roundId`
- `encounterId`
- `playerEntryId`
- `skillId`
- `targetId` when required by the selected skill

**Validation**:
- player belongs to the active encounter
- player is active in the current round
- skill is available and affordable
- target is valid for the chosen skill

### `battleState.resolveBattleExchange` (extended)

**Purpose**: Resolve one exchange, apply combat state changes, and persist the
ordered battle activity feed consumed by host and player views.

**Required inputs**:
- `roundId`
- `encounterId`

**Success outcome**:
- boss actions resolve first
- player actions resolve in the computed order
- combatant health, state, and action points are updated
- `battleExchanges.activityEvents` is persisted in resolution order
- the resulting host and player summaries expose the same current exchange feed

**Failure modes**:
- no active round
- no active encounter
- missing combatants
- invalid or incomplete player action state
- exchange state cannot be refreshed after resolution

## Activity Event Shape

Each `battleActivity` event exposed from the active exchange should include:

- `eventNumber`
- `actorCombatantId`
- `actorName`
- `actorType`
- `targetCombatantId`
- `targetName`
- `actionLabel`
- `outcomeType`
- `magnitude`
- `resultingTargetHealth`
- `resultingTargetState`
- `summaryText`

The route layer may render only the current event plus a short recent history,
but the Convex contract remains structured enough to drive tests and consistent
UI messaging.

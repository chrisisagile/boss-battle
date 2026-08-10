# Convex Contract: Game Loop

## Queries

### `gameSessions.getCurrentActive` (updated)

**Purpose**: Return the current host-resumable room, if any, without exposing a
  browseable history of past rooms.

**Arguments**:
- none

**Returns**:
- `null` when no non-completed room exists
- active room summary:
  - `sessionId`
  - `joinCode`
  - `status`
  - `joinStatus`
  - `currentRoundNumber`
  - `activeRoundId`
  - `activeEncounterId`
  - `battleJoinStatus`
  - `gamePhase`

### `gameSessions.getHostOverview` (extended)

**Purpose**: Return the single host/projector summary for a room from lobby
through results.

**Arguments**:
- `joinCode: string`

**Returns**:
- `null` when the room is missing or completed
- host summary:
  - current room metadata and join credential
  - lobby configuration summary
  - roster with per-player readiness / participation state
  - active round summary including `exchangeLimit` and `exchangesResolved`
  - encounter summary including party and boss state
  - results summary when the game is over

**Failure modes**:
- invalid `joinCode`
- missing room

### `gameSessions.resolveJoinableSession` (extended)

**Purpose**: Return whether a player can join the room and whether a previously
joined player may participate in the current or later round.

**Arguments**:
- `joinCode: string`

**Returns**:
- availability status
- session identifiers and round pointers
- join lock reason when blocked
- battle/game phase summary relevant to player entry

### `quizRounds.getPlayerQuizState` (extended)

**Purpose**: Return the single player-facing summary for join, quiz, waiting,
action selection, and results states.

**Arguments**:
- `joinCode: string`
- `deviceId: string`

**Returns**:
- `null` when the room is unavailable
- player summary:
  - room and player identity
  - active round and round participation state
  - current assignment, if any
  - latest scoring result
  - combatant summary
  - available battle actions and target options
  - game/battle phase
  - blocked join or waiting reason
  - results summary when complete

## Mutations

### `gameSessions.create`

**Purpose**: Create a new isolated room and return the host/join paths.

**Required inputs**:
- none

**Success outcome**:
- creates a new session in `lobby`
- returns `joinCode`, host path, and join path

**Failure modes**:
- unable to create a unique join code

### `gameSessions.setJoinStatus`

**Purpose**: Open or close room joining while the room is still in the
host-controlled pre-start lifecycle.

**Required inputs**:
- `sessionId`
- `joinStatus: open | closed`

**Failure modes**:
- room missing
- room already completed
- request conflicts with locked in-progress game rules

### `battleState.startEncounter` (extended)

**Purpose**: Public `Start Game` mutation. Transition the room from lobby to
active game, lock joining, persist the host config snapshot, create the
encounter, and initialize round 1.

**Required inputs**:
- `sessionId`
- selected boss definitions
- lobby round configuration (`questionTarget`, categories, complexities)

**Success outcome**:
- room join status becomes locked
- game phase moves out of `lobby`
- active encounter exists
- locked lobby configuration is stored on the session
- first round state is initialized through the shared round-start helper

**Failure modes**:
- no joined players
- invalid boss selection
- invalid quiz configuration
- room already started or completed

### `quizRounds.startRound` (extended)

**Purpose**: Shared internal round-start helper used by `battleState.startEncounter`
for round 1 and by `battleState.resolveBattleExchange` when a completed round
should advance to the next quiz round.

**Required inputs**:
- `sessionId`
- round question configuration

**Success outcome**:
- next `Game Round` is created
- `exchangeLimit` is randomly chosen as `1`, `2`, or `3`
- assignments are created for all active players

**Failure modes**:
- active round already exists
- invalid or unsatisfied question configuration
- room or encounter state does not allow a new round

### `quizAssignments.submitAnswer`

**Purpose**: Record a player’s answer and advance their quiz progression.

**Required inputs**:
- `assignmentId`
- `submittedChoiceId`

**Success outcome**:
- answer is recorded and scored
- next question is surfaced if one remains
- quiz completion markers can advance once all active players finish or are removed

**Failure modes**:
- invalid or expired assignment
- duplicate answer submission
- invalid answer choice

### `battleState.submitPlayerAction` (extended)

**Purpose**: Record a player battle action and target selection for the active
battle exchange.

**Required inputs**:
- `encounterId`
- `playerEntryId`
- `skillId`
- `targetId` or target metadata when required by the selected action

**Validation**:
- player belongs to the active room and encounter
- player is active, not knocked out, and still in the current round
- skill is available and affordable
- target is valid for the chosen action

**Failure modes**:
- no active encounter
- player removed or knocked out
- invalid skill or target
- insufficient action points
- duplicate finalized action for the same exchange

### `battleState.resolveBattleExchange` (new)

**Purpose**: Resolve exactly one battle exchange by choosing boss actions and
targets automatically, then applying ordered player turns, state changes, and
early-stop rules.

**Required inputs**:
- `encounterId`
- current round / exchange context

**Success outcome**:
- boss actions resolve first
- tied player order is randomized among equal action-point totals
- health, status, action points, and next-round advantages are updated
- exchange counters advance
- round moves to another exchange, the next quiz round, or results when
  terminal conditions are met

**Failure modes**:
- missing or inactive encounter
- missing combatants or invalid participation state
- unresolved required player actions when the design requires them

### `gameSessions.endGame`

**Purpose**: Allow the host to end the room early and transition to results.

**Required inputs**:
- `sessionId`

**Success outcome**:
- room status becomes completed
- result reason becomes `host_ended`
- host/player routes render the final results state

## Validation Rules

- Route params, form payloads, and Convex mutation arguments must be validated
  before use.
- No new player may join once the room is locked for an active game.
- A disconnected player is removed from the current round immediately.
- A disconnected player may return only in a later round if the game remains
  active.
- Boss actions and targets are chosen automatically by the runtime, not by the
  host.
- Round exchange counts are randomized once per round and remain fixed for that
  round.
- Player turn order is descending by current action points, with random
  tie-breaking for equal totals.
- `awardedTokens` remain the scored per-answer storage value, while the round
  sum of `awardedTokens` becomes spendable `currentActionPoints` for that
  round only.
- Unspent `currentActionPoints` expire at round end.

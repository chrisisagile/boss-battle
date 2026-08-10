# Convex Contract: Persistent Battle State

## Queries

### `gameSessions.getHostOverview` (extended)

**Purpose**: Return the host-display summary for a public session code,
including battle setup or active encounter state.

**Arguments**:
- `joinCode: string`

**Returns**:
- `null` when no active session matches
- Existing session, join, roster, and round fields
- Battle summary fields:
  - `encounter`: nullable encounter lifecycle summary
  - `partySummary`: aggregate party health and active-player counts
  - `bossLineup`: active boss combatants with health, action points, sprite, and state
  - `battleJoinStatus`: whether new players may actively participate

### `quizRounds.getPlayerQuizState` or successor player-state summary (extended)

**Purpose**: Return the player’s joined-state, quiz-state, and battle-state
projection from the existing join route seam.

**Arguments**:
- `joinCode: string`
- `deviceId: string`

**Returns**:
- Existing session and quiz payload
- Battle state fields:
  - `combatant`: nullable player combatant state
  - `partySummary`: lightweight party health summary
  - `availableSkills`: current skill choices and action-point affordability
  - `battleStatus`: `pre_battle | active_battle | post_round | victory | defeat`
  - `joinBlockReason`: nullable reason when a non-joined player cannot enter due to an active battle

## Mutations

### `bossCatalog.upsertDefinition`

**Purpose**: Create or update reusable boss definitions for encounter setup.

**Required inputs**:
- Boss identity and description
- Base health and action points
- Scaling profile
- Skill references
- Optional custom sprite reference

**Failure modes**:
- Invalid combat values
- Unknown or retired skills
- Invalid sprite reference

### `battleState.startEncounter`

**Purpose**: Start a battle for the current session with one or more bosses.

**Required inputs**:
- `sessionId`
- Selected boss definitions and lineup order
- Any encounter-specific scaling or overrides allowed by the host flow

**Success outcome**:
- Creates the active encounter
- Materializes party and boss combatants
- Locks mid-battle participation

**Failure modes**:
- Session missing or completed
- Encounter already active
- Invalid lineup or missing combatants

### `battleState.submitPlayerAction`

**Purpose**: Record a player’s chosen attack, heal, defend, or study action for
the current battle round.

**Required inputs**:
- `sessionId`
- `playerEntryId` or trusted joined-player identity
- `skillId`
- Any required target selection metadata if the chosen skill needs it

**Validation**:
- Player must belong to the session
- Player combatant must be active and not knocked out
- Skill must be available to that combatant
- Action-point cost must be affordable

**Failure modes**:
- Encounter missing or not active
- Player knocked out
- Invalid or unaffordable skill
- Duplicate finalized action for the same round

### `battleState.resolveRound`

**Purpose**: Apply all submitted player and boss actions, update combatant
health and action points, and advance encounter state.

**Required inputs**:
- `encounterId`
- Current battle round context

**Success outcome**:
- Updates party and boss combatant state
- Marks knockouts, revives, defeats, and carry-forward study effects
- Produces between-round summary or encounter completion state

**Failure modes**:
- Encounter not active
- Missing combatants or invalid state inputs
- Attempted resolution with unresolved mandatory action data

## Validation Rules

- Combatant health and action points must remain within non-negative,
  validated bounds
- A player at `0` health is `knocked_out` and cannot perform normal actions
  until healed or revived
- New players cannot become active combatants once an encounter is active
- Fallback sprite assignments must be persisted once chosen so clients render
  stable visuals across reloads

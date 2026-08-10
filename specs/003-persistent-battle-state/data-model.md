# Data Model: Persistent Battle State

## Overview

The feature extends the existing session, roster, and quiz loop with an
encounter-driven battle model that keeps reusable bosses separate from live
combatant state while preserving reconnect-safe projector and player views.

## Entities

### Game Session

**Purpose**: The live game container for joins, quiz rounds, and the currently
active battle encounter.

**Fields**:
- `joinCode`
- `status`: `lobby | in_progress | completed`
- `joinStatus`: `open | closed`
- `currentRoundNumber`
- `participationWindowStatus`: `idle | open | locked`
- `activeRoundId`
- `activeEncounterId`: nullable reference to the live battle encounter
- `battleJoinStatus`: `pre_battle | active_battle | post_battle`
- `createdAt`
- `updatedAt`
- `closedAt`
- `completedAt`

**Relationships**:
- Has many `Player Entry` records
- Has many `Game Round` records
- Has zero or one active `Battle Encounter`

### Player Entry

**Purpose**: The player identity and session membership record that battle
participation builds on top of.

**Fields**:
- `sessionId`
- `deviceId`
- `displayName`
- `normalizedDisplayName`
- `joinStatus`: `joined | removed`
- `eligibleFromRoundNumber`
- `tokenBalance`
- `joinedAt`
- `lastSeenAt`

**Validation rules**:
- `deviceId` must be normalized before use
- `displayName` remains unique per session among joined players
- `tokenBalance` cannot fall below zero
- A player cannot become an active combatant while `battleJoinStatus` is
  `active_battle`

**Relationships**:
- Belongs to one `Game Session`
- May have one `Combatant State` record for the active encounter

### Boss Definition

**Purpose**: A reusable boss-catalog entry that hosts can select when building
an encounter.

**Fields**:
- `name`
- `description`
- `baseHealth`
- `baseActionPointsPerRound`
- `scalingProfile`
- `skillIds`
- `defaultSpriteRef`: nullable custom sprite reference
- `status`: `draft | ready | retired`
- `createdAt`
- `updatedAt`

**Validation rules**:
- `name` must be unique among ready boss definitions
- `baseHealth` and `baseActionPointsPerRound` must be positive whole numbers
- `skillIds` must reference valid `Skill Definition` records
- Retired bosses cannot be added to new encounters

### Battle Encounter

**Purpose**: The live or historical battle that spans multiple quiz rounds for
one session.

**Fields**:
- `sessionId`
- `status`: `setup | active | victory | defeat | completed`
- `encounterNumber`
- `battleRoundNumber`
- `partyMaxHealth`
- `partyCurrentHealth`
- `activeBossCount`
- `startedAt`
- `endedAt`
- `lastResolvedAt`

**Validation rules**:
- Only one encounter may be `active` per session
- `partyCurrentHealth` cannot exceed `partyMaxHealth`
- `battleRoundNumber` increases only after a completed round resolution

**State transitions**:
- `setup -> active` when the host starts the battle
- `active -> victory` when all bosses are defeated
- `active -> defeat` when party defeat conditions are met
- `victory | defeat -> completed` when the session finalizes the encounter

### Combatant State

**Purpose**: The persisted round-to-round state for a single player or on-field
boss in an encounter.

**Fields**:
- `sessionId`
- `encounterId`
- `combatantType`: `player | boss`
- `playerEntryId`: nullable reference for party members
- `bossDefinitionId`: nullable reference for bosses
- `displayName`
- `lineupSlot`
- `currentHealth`
- `maxHealth`
- `currentActionPoints`
- `actionPointsPerRound`
- `state`: `active | knocked_out | defeated`
- `availableSkillIds`
- `pendingEffectIds`
- `spriteSource`: `custom | fallback`
- `spriteRef`: nullable explicit sprite reference
- `fallbackSpriteKey`: nullable persisted fallback art key
- `lastUpdatedAt`

**Validation rules**:
- Exactly one of `playerEntryId` or `bossDefinitionId` must be populated
- `currentHealth` cannot exceed `maxHealth`
- `currentActionPoints` cannot fall below zero
- Player combatants in `knocked_out` state cannot submit normal actions
- Boss combatants in `defeated` state cannot receive additional actions

**State transitions**:
- `active -> knocked_out` when a player reaches `0` health
- `knocked_out -> active` when a valid heal or revive restores health
- `active -> defeated` when a boss reaches `0` health

### Skill Definition

**Purpose**: A reusable skill record for player and boss actions.

**Fields**:
- `name`
- `category`: `attack | heal | defend | study`
- `description`
- `actionPointCost`
- `targetScope`
- `effectRule`
- `carryForwardRule`
- `status`: `draft | ready | retired`

**Validation rules**:
- `category` must use the canonical four-category list
- `actionPointCost` must be zero or greater
- `study` skills must define a next-round carry-forward benefit
- Retired skills cannot be assigned to new bosses or player loadouts

## Relationship Notes

- `Boss Definition` is reusable content; `Combatant State` is the per-encounter
  runtime record.
- `Battle Encounter` is the parent lifecycle record for all active party and
  boss combatants.
- `Player Entry` remains the identity record while `Combatant State` carries
  battle-specific health, actions, and sprite state.
- `Skill Definition` supports both player and boss actions, while category rules
  enforce the canonical gameplay buckets.

## Derived Views

- **Host Battle Overview**: session summary + active encounter + party health +
  boss lineup + join gating + between-round status
- **Player Battle Status**: joined player identity + combatant state + available
  skills + knockout or waiting messaging + current party summary
- **Projector Arena View**: party lineup + boss lineup + health/resource bars +
  stable sprites + victory/defeat or between-round states

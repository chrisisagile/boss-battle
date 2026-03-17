# Data Model: Game Loop

## Overview

The feature deepens the existing session, quiz, and battle schema into an
explicit room-to-results lifecycle. It reuses the current Convex entities but
adds clearer phase, participation, exchange, and outcome responsibilities so
host, player, and projector views can stay synchronized.

## Entities

### Game Session

**Purpose**: The top-level room record that controls join availability, current
phase, active round, active encounter, and final session outcome.

**Fields**:
- `joinCode`
- `status`: `lobby | in_progress | completed`
- `joinStatus`: `open | closed`
- `currentRoundNumber`
- `participationWindowStatus`: `idle | open | locked`
- `activeRoundId`
- `activeEncounterId`
- `battleJoinStatus`: `pre_battle | active_battle | post_battle`
- `gamePhase`: `lobby | quiz | waiting_for_players | action_selection | battle_resolution | results`
- `completionReason`: `players_won | bosses_won | host_ended | no_actions_left`
- `selectedBossDefinitionIds`
- `questionTargetPerRound`
- `allowedCategories`
- `allowedComplexities`
- `configLockedAt`
- `createdAt`
- `updatedAt`
- `closedAt`
- `completedAt`

**Validation rules**:
- `joinCode` must remain unique.
- `joinStatus` must be `closed` once the game starts and cannot reopen during
  an active game.
- Only one `activeRoundId` and one `activeEncounterId` may exist at a time.
- `completionReason` is required when `status` becomes `completed`.

**Relationships**:
- Has many `Player Entry` records
- Has many `Game Round` records
- Has zero or one active `Battle Encounter`
- Produces one final `Session Result` projection

### Player Entry

**Purpose**: The per-device player identity and membership record for a room.

**Fields**:
- `sessionId`
- `deviceId`
- `displayName`
- `normalizedDisplayName`
- `joinStatus`: `joined | removed`
- `eligibleFromRoundNumber`
- `tokenBalance`
- `nextQuizAdvantage`
- `joinedAt`
- `lastSeenAt`

**Validation rules**:
- `deviceId` and `displayName` must be normalized and validated before use.
- `displayName` must remain unique among joined players within a room.
- `eligibleFromRoundNumber` must not move backward.
- A removed player cannot submit quiz answers or battle actions for the current
  round.

**Relationships**:
- Belongs to one `Game Session`
- May map to one active `Round Participation` state in the current round
- May map to one active `Combatant State` in the current encounter

### Lobby Configuration

**Purpose**: The host-controlled pre-game setup that determines what the game
will use once the room starts.

**Persistence strategy**: Stored directly on `Game Session` as locked config
fields; this is a conceptual entity, not a standalone table.

**Fields**:
- `sessionId`
- `selectedBossDefinitionIds`
- `questionTargetPerRound`
- `allowedCategories`
- `allowedComplexities`
- `lockedAt`

**Validation rules**:
- At least one boss must be selected before game start.
- `questionTargetPerRound` must be positive.
- Categories and complexities must map to available question-bank values.
- Once the game starts, the configuration is read-only for that session.

**Relationships**:
- Belongs to one `Game Session`
- Feeds initial `Battle Encounter` creation and each `Game Round`

### Game Round

**Purpose**: A single quiz-to-battle cycle within a game session.

**Fields**:
- `sessionId`
- `roundNumber`
- `status`: `pending | active | completed`
- `questionTarget`
- `questionsCompleted`
- `allowedCategories`
- `allowedComplexities`
- `exchangeLimit`: `1 | 2 | 3`
- `exchangesResolved`
- `phase`: `quiz | waiting_for_players | action_selection | battle_resolution | completed`
- `createdByHostAt`
- `startedAt`
- `completedAt`

**Validation rules**:
- `exchangeLimit` is chosen randomly at round start and remains fixed for the
  round.
- `exchangesResolved` cannot exceed `exchangeLimit`.
- A round cannot complete until all active players have either finished the quiz
  or been removed from the round.

**State transitions**:
- `pending -> active` when the host starts the round
- `active(quiz) -> active(waiting_for_players)` when some, but not all, active players are done
- `active(waiting_for_players) -> active(action_selection)` when quiz scoring finishes
- `active(action_selection) -> active(battle_resolution)` when battle exchanges begin
- `active(battle_resolution) -> completed` when the round reaches an early-stop or exchange-limit boundary

### Round Participation

**Purpose**: The per-player view of whether that player is active in the current
round and what state they are in.

**Persistence strategy**: New `roundParticipants` table keyed by `roundId` and
`playerEntryId`.

**Fields**:
- `sessionId`
- `roundId`
- `playerEntryId`
- `status`: `active | quiz_complete | removed_disconnected | waiting_next_round | knocked_out`
- `completedQuizAt`
- `removedAt`
- `canReturnNextRound`

**Validation rules**:
- A player removed for disconnection cannot re-enter the same round.
- `canReturnNextRound` must be true only when the overall game is still active.
- A knocked-out player may remain in the room but cannot act during battle
  resolution.

### Quiz Assignment

**Purpose**: The player-specific question work item for a round batch.

**Fields**:
- `sessionId`
- `roundId`
- `playerEntryId`
- `quizQuestionId`
- `batchNumber`
- `status`: `presented | answered | expired | scored`
- `assignedAt`
- `expiresAt`
- `scoredAt`
- `awardedTokens`

**Validation rules**:
- One player may have at most one active assignment per batch.
- An assignment for a removed player may be expired or ignored, but not scored
  after removal.
- `awardedTokens` must match the configured difficulty reward of the linked
  question once scored.
- The round sum of a player's `awardedTokens` becomes that player's
  `currentActionPoints` for the active round, while cumulative leaderboard
  totals continue to roll into `tokenBalance`.

### Battle Encounter

**Purpose**: The battle lifecycle record tied to the current room and spanning
one or more quiz rounds until victory, defeat, or host termination.

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
- Only one encounter may be active per session.
- `partyCurrentHealth` cannot exceed `partyMaxHealth`.
- Encounter status must align with the session’s completion state when the game
  ends.

### Combatant State

**Purpose**: The persisted battle state for each player or boss in the current
encounter.

**Fields**:
- `sessionId`
- `encounterId`
- `combatantType`: `player | boss`
- `playerEntryId`
- `bossDefinitionId`
- `displayName`
- `lineupSlot`
- `currentHealth`
- `maxHealth`
- `currentActionPoints`
- `actionPointsPerRound`
- `state`: `active | knocked_out | defeated`
- `availableSkillIds`
- `pendingEffectIds`
- `spriteSource`
- `spriteRef`
- `fallbackSpriteKey`
- `nextQuizAdvantage`
- `lastUpdatedAt`

**Validation rules**:
- Exactly one of `playerEntryId` or `bossDefinitionId` must be populated.
- `currentActionPoints` cannot fall below zero.
- Knocked-out players cannot take battle actions.
- Defeated bosses cannot remain valid targets for later exchanges.
- `currentActionPoints` is round-local spendable currency and resets to zero at
  round end after exchange resolution is complete.

### Battle Exchange

**Purpose**: One boss-first combat pass within a round.

**Persistence strategy**: New `battleExchanges` table keyed by `roundId` and
`exchangeNumber`.

**Fields**:
- `roundId`
- `encounterId`
- `exchangeNumber`
- `status`: `pending | resolving | resolved`
- `bossActionSummary`
- `playerTurnOrder`
- `resolvedAt`

**Validation rules**:
- `exchangeNumber` starts at 1 and cannot exceed the round’s `exchangeLimit`.
- `playerTurnOrder` must be descending by current action points, with random
  tie-breaking among equal totals.
- Boss actions resolve before the first player turn begins.

### Session Result

**Purpose**: The final read model shown once the game ends.

**Persistence strategy**: Derived from `Game Session` completion fields plus
encounter summary; no standalone results table.

**Fields**:
- `sessionId`
- `winner`: `players | bosses | none`
- `terminationReason`: `players_won | bosses_won | no_actions_left | host_ended`
- `completedRoundNumber`
- `remainingPlayers`
- `remainingBosses`
- `completedAt`

**Validation rules**:
- Exactly one result is produced per completed session.
- `winner` and `terminationReason` must align.

## Relationship Notes

- `Game Session` owns the room lifecycle, join lock, and final results.
- `Lobby Configuration` is host-authored once and consumed by all rounds.
- `Game Round` owns quiz progression and battle-exchange budgeting.
- `Round Participation` is the seam for disconnect removal and later-round
  rejoin eligibility.
- `Battle Encounter` owns encounter-wide health and end conditions.
- `Combatant State` owns per-player and per-boss battle values.
- `Battle Exchange` describes one ordered resolution pass inside a round.

## Derived Views

- **Home Session Launcher**: current active room, create-room action, and room
  isolation messaging.
- **Host Overview**: room status, join lock state, lobby config, roster, quiz
  progress markers, exchange progress, encounter summary, and results state.
- **Player Game Loop View**: join eligibility, intro/waiting state, current
  question, action selection, combat profile, blocked or removed status,
  next-round rejoin messaging, and final result.
- **Projector Arena View**: party roster with ready markers, boss lineup,
  current encounter health and action-point state, exchange progress, and
  session outcome.

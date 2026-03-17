# Data Model: Quiz Token Awards

## Overview

The feature extends the existing session/join model with explicit quiz content, round lifecycle, individualized question delivery, answer evaluation, and token accounting.

## Entities

### Game Session

**Purpose**: The parent record for a live game, already used for join state and now extended to reference quiz progress.

**Fields**:
- `joinCode`
- `status`: `lobby | in_progress | completed`
- `joinStatus`: `open | closed`
- `currentRoundNumber`
- `participationWindowStatus`: `idle | open | locked`
- `activeRoundId`: nullable reference to the currently running quiz round
- `createdAt`
- `updatedAt`
- `closedAt`
- `completedAt`

**Relationships**:
- Has many `Player Entry` records
- Has many `Game Round` records
- Has many `Question Assignment` records through rounds and players

### Player Entry

**Purpose**: A player participating in a session, including device identity and current token balance.

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
- `deviceId` must be present and normalized before use
- `displayName` remains unique per session among joined players
- `tokenBalance` cannot go below zero in this feature slice

**Relationships**:
- Belongs to one `Game Session`
- Has many `Question Assignment` records
- Has many `Player Answer` records

### Quiz Question

**Purpose**: A reusable question definition available for live selection.

**Fields**:
- `prompt`
- `acceptedAnswer`
- `category`
- `complexity`
- `tokenReward`
- `status`: `draft | ready | retired`
- `sourceKey`: stable import identifier
- `createdAt`
- `updatedAt`

**Validation rules**:
- `acceptedAnswer`, `category`, `complexity`, and `tokenReward` are required for `ready` questions
- `tokenReward` must be a positive whole number
- `sourceKey` must be unique within the question bank

### Game Round

**Purpose**: The active or historical quiz round for a session.

**Fields**:
- `sessionId`
- `roundNumber`
- `status`: `pending | active | completed`
- `questionTarget`
- `questionsCompleted`
- `allowedCategories`: list
- `allowedComplexities`: list
- `startedAt`
- `completedAt`
- `createdByHostAt`

**Validation rules**:
- `questionTarget` must be greater than zero
- `questionsCompleted` cannot exceed `questionTarget`
- configuration becomes immutable after `status` changes to `active`

**State transitions**:
- `pending -> active` when the host starts the round
- `active -> completed` when the configured number of questions completes

### Question Assignment

**Purpose**: The record of a question delivered to one player in one round.

**Fields**:
- `sessionId`
- `roundId`
- `playerEntryId`
- `quizQuestionId`
- `status`: `presented | answered | expired | scored`
- `assignedAt`
- `expiresAt`
- `scoredAt`
- `awardedTokens`

**Validation rules**:
- One assignment per `(sessionId, playerEntryId, quizQuestionId)` across a single session
- Assigned question must satisfy the active round's category and complexity rules
- `awardedTokens` is zero unless the answer is scored correct

### Player Answer

**Purpose**: The player’s submitted answer for a specific assignment.

**Fields**:
- `assignmentId`
- `sessionId`
- `roundId`
- `playerEntryId`
- `submittedAnswer`
- `submittedAt`
- `evaluationResult`: `correct | incorrect | expired | invalid`
- `evaluatedAt`

**Validation rules**:
- At most one finalized answer per assignment
- Submissions after `expiresAt` are marked `expired` and award zero tokens

## Relationship Notes

- `Question Assignment` is the canonical no-repeat and delivery-history seam.
- `Player Answer` carries user input and evaluation outcome; `Question Assignment` carries delivery and award state.
- `Player Entry.tokenBalance` is the host/projector read model and is updated when an assignment is scored correct.

## Derived Views

- **Host Round Summary**: session + active round + joined players + token balances + remaining question count + round rule visibility
- **Player Quiz State**: joinable session info + active assignment + answer status + updated token balance
- **Projector Summary**: roster and token totals for the active session after scoring

# Contract: Quiz Round And Token Awarding

## Purpose

Define the user-facing and data-facing contract for host round control, individualized question delivery, answer submission, and token summary updates.

## Host Contract

### Start Round

**Actor**: Host  
**Trigger**: Host starts a new quiz round from `/host/$joinCode`

**Required inputs**:
- `sessionId`
- `questionTarget`
- `allowedCategories`
- `allowedComplexities`

**Success outcome**:
- A new active round is created for the session
- The round becomes visible in the host view with remaining question count
- Eligible players become assignable for quiz questions under the selected rules

**Failure outcomes**:
- Round cannot start because another round is active
- Round cannot start because question bank coverage is insufficient for the chosen rules
- Session is unavailable or completed

## Player Contract

### Receive Question

**Actor**: Player  
**Trigger**: Player is eligible during an active round

**Contract**:
- Player receives one active assignment at a time
- The selected question must satisfy the active round’s category and complexity rules
- The selected question must not have been previously delivered to that player in the same game

### Submit Answer

**Actor**: Player  
**Trigger**: Player submits the answer form from `/join/$joinCode`

**Required inputs**:
- `assignmentId`
- `submittedAnswer`

**Success outcome**:
- Answer is evaluated against the accepted answer for the assigned question
- Correct answers award the configured token amount exactly once
- Player sees correctness feedback and updated token balance

**Failure outcomes**:
- Assignment expired before submission finalized
- Assignment is invalid or no longer active
- Duplicate or repeat submission is rejected or ignored after final scoring

## Summary Contract

### Lobby And Projector Updates

**Actor**: Host and audience  
**Trigger**: An assignment is scored

**Contract**:
- Session summary reflects updated token totals for affected players
- Host view shows current round status, remaining question count, and round rules
- Shared summaries never show a token award before answer evaluation completes

## Validation Rules

- Display names remain unique per session according to existing join rules
- Round configuration is immutable after the round becomes active
- Questions without accepted answer, token reward, category, or complexity metadata cannot be assigned
- The same question cannot be assigned twice to the same player within one session

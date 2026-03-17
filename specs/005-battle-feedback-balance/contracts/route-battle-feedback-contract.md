# Route Contract: Battle Feedback and Balance

## Route Inventory

### `GET /host/$joinCode`

**Audience**: Host and shared projector

**Purpose**: Show the live room summary, party and boss state, and the active
exchange feed during battle resolution.

**Route params**:
- `joinCode`: six-character uppercase room code

**Data contract**:
- validate `joinCode` before querying
- subscribe to `gameSessions.getHostOverview`
- render `battleActivity.currentEvent` and `battleActivity.recentEvents`
  whenever an active exchange is resolving or has just resolved

**UI states**:
- Loading: session summary still resolving
- Empty: room missing or already ended
- Success:
  - lobby setup view
  - quiz and waiting states
  - battle arena with party summary, boss lineup, and dialogue feed
  - results state
- Error:
  - failed summary load
  - failed join-status update
  - failed encounter start
  - failed exchange resolve refresh

### `GET /join/$joinCode`

**Audience**: Player

**Purpose**: Show player join, quiz, waiting, action-selection, and live battle
feed states for the same room.

**Route params**:
- `joinCode`: six-character uppercase room code

**Data contract**:
- validate `joinCode`
- resolve device identity before querying `quizRounds.getPlayerQuizState`
- render the same `battleActivity` contract used by the host surface whenever
  battle activity is available

**UI states**:
- Loading: session or player summary still resolving
- Empty: invalid or expired room
- Success:
  - join form
  - round intro
  - quiz question flow
  - waiting state after quiz completion
  - battle action-selection view with player stats plus battle dialogue feed
  - results state
- Error:
  - blocked join
  - failed answer submission
  - failed battle action submission
  - failed summary refresh

## Feed Presentation Rules

- Both host and player routes render the same active exchange feed contract.
- Each route shows the current action plus a short recent history from the same
  exchange.
- Feed order must match battle resolution order.
- Knockouts, misses, healing, guarding, and skipped actions must be visible as
  distinct outcomes rather than inferred from health bars alone.

## Accessibility And Messaging Expectations

- Feed items must include explicit actor, target, and outcome text rather than
  relying on iconography or color alone.
- The host/projector surface must remain legible at a distance while preserving
  event order and combat context.
- The player surface must keep action controls usable while still exposing the
  exchange feed in the same battle phase.

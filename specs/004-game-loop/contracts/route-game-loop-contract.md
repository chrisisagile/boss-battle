# Route Contract: Game Loop

## Route Inventory

### `GET /`

**Audience**: Host

**Purpose**: Create a new room or resume the currently active room without
exposing older rooms.

**Data contract**:
- read current active room via `gameSessions.getCurrentActive`
- create a room via `gameSessions.create`
- navigate directly to `/host/$joinCode` after room creation

**UI states**:
- Loading: current active room is still being checked
- Success:
  - create-room CTA
  - optional resume CTA for the one active room
- Error:
  - failed room creation
  - failed active-room lookup

### `GET /host/$joinCode`

**Audience**: Host and shared projector

**Purpose**: Show the room lobby, locked-in game setup, quiz progression,
battle arena, and final results for one live room.

**Route params**:
- `joinCode`: six-character uppercase room code

**Data contract**:
- validate `joinCode` before querying
- subscribe to one host summary surface from `gameSessions.getHostOverview`
- send host actions through centralized Convex hooks in `src/integrations/convex/join.ts`

**Host actions**:
- close/open joining before game start when allowed
- configure bosses, question target, categories, and difficulty values
- start the game through `battleState.startEncounter`
- observe round advancement driven by battle lifecycle mutations rather than a
  second public round-start button after game start
- end the game early

**UI states**:
- Loading: room summary is still resolving
- Empty: room missing or already completed outside the live flow
- Success:
  - lobby with QR/join code, connected players, and config controls
  - quiz-in-progress view with per-player ready markers
  - battle arena view with boss and player state plus exchange progress
  - waiting/between-round state when applicable
  - results view for player win, boss win, no-actions-left, or host-ended finish
- Error:
  - invalid config
- failed start-game or round transition mutation
- failed join-lock update
- failed battle-resolution refresh

### `GET /join/$joinCode`

**Audience**: Player

**Purpose**: Show player join eligibility, current quiz state, waiting status,
battle action selection, removed/rejoin messaging, and final results.

**Route params**:
- `joinCode`: six-character uppercase room code

**Form contract**:
- Join input: `displayName` with persistent device identity
- Quiz answer input: selected choice for the current assignment
- Battle action input: selected action plus target when required

**Validation**:
- join remains subject to current room lock rules, display-name rules, and
  device identity rules
- quiz answers are accepted only for the active assignment
- battle actions are accepted only for active, non-knocked-out, non-removed
  players in the current round
- target selection is required only when the chosen action contract requires it

**UI states**:
- Loading: room or player summary still resolving
- Empty: invalid or expired room
- Success:
  - join form before the player joins
  - intro/round-start screen when a new quiz wave begins
  - active quiz question state
  - waiting-for-other-players state after finishing the quiz
  - battle action-selection state
  - knocked-out or removed-from-round state
  - rejoin-next-round messaging after a disconnect
  - results view once the game ends
- Error:
  - blocked join due to room lock or completed game
  - invalid answer submission
  - invalid or unaffordable battle action
  - failed summary refresh

## URL Rules

- Host and player routes continue to use only public `joinCode` paths.
- The host route remains the projector surface; this feature does not require a
  separate public projector URL.
- Route params must never expose internal Convex document IDs.

## Accessibility And Layout Expectations

- The host/projector surface must distinguish ready, waiting, knocked-out, and
  completed states without relying on color alone.
- Player flows must keep large touch targets and explicit labels for quiz
  progress, action points, targets, and battle availability.
- Loading, waiting, blocked, removed, victory, defeat, and host-ended results
  states require explicit text messaging in addition to visual treatments.

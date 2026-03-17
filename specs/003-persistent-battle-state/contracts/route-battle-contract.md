# Route Contract: Persistent Battle State

## Route Inventory

### `GET /host/$joinCode`

**Audience**: Host and shared projector

**Purpose**: Show encounter setup, boss lineup selection, between-round party
status, and the live battle arena for the active session.

**Route params**:
- `joinCode`: six-character uppercase session code

**Data contract**:
- Reject invalid route params before querying
- Subscribe to the host overview including encounter and roster summaries
- Render battle setup and live arena states from the same session summary seam

**UI states**:
- Loading: session or battle summary still resolving
- Empty: session missing or already completed
- Success:
  - pre-battle setup with boss selection and sprite visibility
  - active arena with party and boss health/action displays
  - between-round party-status summary after a round resolves
  - victory or defeat summary when encounter ends
- Error:
  - invalid encounter configuration
  - missing required combatants
  - failed battle mutation or summary reload

### `GET /join/$joinCode`

**Audience**: Player

**Purpose**: Show join eligibility, battle participation status, player combat
profile, available skills, and knockout or waiting states on the player's
device.

**Route params**:
- `joinCode`: six-character uppercase session code

**Form contract**:
- Join input: `displayName` with existing device identity
- Action input: selected skill or battle action choice
- Validation:
  - join remains subject to current display-name and device rules
  - battle actions are allowed only for active, non-knocked-out combatants
  - battle-active sessions block new participation until the battle ends

**UI states**:
- Loading: session or player battle state still resolving
- Empty: invalid or expired session
- Success:
  - pre-battle join form when no active battle blocks entry
  - battle-ready player profile between rounds
  - active action-selection state during a battle round
  - knocked-out state with explicit revive dependency
  - post-round summary showing health, action points, and current skill state
- Error:
  - unavailable session
  - blocked join while battle is active
  - invalid or unaffordable action
  - failed action submission or state refresh

## URL Rules

- Host and player routes continue to use public `joinCode` paths only
- Projector behavior remains embedded in the host route rather than requiring a
  second public route for this feature
- Route params must never expose internal Convex document identifiers

## Accessibility And Layout Expectations

- Projector-facing arena states must remain readable from a distance and must
  not rely on color alone to communicate low health, knockout, or defeat
- Player-facing action states must preserve large tap targets and explicit text
  labels for health, action points, and skill availability
- Loading, blocked, knockout, victory, and defeat states require accessible text
  messaging in addition to visuals

# Route Contract: QR Game Join

## Route Inventory

### `GET /`

**Audience**: Host

**Purpose**: Landing screen that lets the host create a new session or resume
the currently active one.

**UI states**:
- Loading: existing active-session lookup in progress
- Empty: no active session, show create-session call to action
- Success: active session exists, show resume/open-session affordance
- Error: failed to load session status

### `GET /host/$joinCode`

**Audience**: Host / projector display

**Route params**:
- `joinCode`: six-character uppercase session code

**Purpose**: Show the live session QR code, manual join code, join instructions,
joined-player roster, and host join-status controls.

**Data contract**:
- Reject invalid param shape before querying
- Query session overview by `joinCode`
- Subscribe to live roster updates

**UI states**:
- Loading: session overview or roster still resolving
- Empty: session not found
- Success: QR, join code, roster, and join-status control rendered
- Error: session completed or data fetch failed

### `GET /join`

**Audience**: Player on mobile or desktop fallback

**Purpose**: Manual join-code entry route when QR scanning is unavailable.

**Form contract**:
- Input: `joinCode`
- Validation: trim, uppercase, pattern `^[A-HJ-NP-Z2-9]{6}$`
- Success: redirect to `/join/$joinCode`
- Failure: inline validation or unavailable-session error

### `GET /join/$joinCode`

**Audience**: Player

**Route params**:
- `joinCode`: six-character uppercase session code

**Purpose**: Display the session-specific join flow and submit the player's
display name.

**Form contract**:
- Inputs: `displayName`, implicit browser `deviceId`
- Validation:
  - `displayName` trimmed, 2 to 24 visible characters
  - `deviceId` present or generated before submission
- Success: show joined confirmation card and waiting-state messaging
- Failure:
  - invalid or unavailable session
  - duplicate display name in the same session
  - closed or completed session

**UI states**:
- Loading: session lookup in progress
- Empty: invalid or expired session
- Success:
  - pre-join form when device is not yet attached
  - confirmation card when join succeeds
  - waiting-state message if eligibility starts next round
- Error: mutation failure or route data fetch failure

## URL Rules

- QR payloads must encode the canonical absolute URL for `/join/$joinCode`
- Manual entry always resolves through `/join`
- Host routes must not rely on internal Convex document IDs in the URL

## Accessibility And Layout Expectations

- Host surfaces must remain legible from a large display at distance
- Mobile join route must prioritize one-handed entry, large tap targets, and
  visible validation messaging
- Error and success messages must be announced in accessible text, not color
  alone

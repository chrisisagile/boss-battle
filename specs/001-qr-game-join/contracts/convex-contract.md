# Convex Contract: QR Game Join

## Queries

### `gameSessions.getCurrentActive`

**Purpose**: Return the single active non-completed session for the host landing
route, if one exists.

**Arguments**: none

**Returns**:
- `null` when no active session exists
- `{ sessionId, joinCode, status, joinStatus, currentRoundNumber }` otherwise

### `gameSessions.getHostOverview`

**Purpose**: Return the host-display projection for a specific public join code.

**Arguments**:
- `joinCode: string`

**Validation**:
- Must match the public join-code pattern

**Returns**:
- `null` when no active session matches
- `{ session, joinCredential, joinedPlayerCount, lateJoinerCount, roster }`

### `gameSessions.resolveJoinableSession`

**Purpose**: Resolve a player-visible session by join code before showing the
join form.

**Arguments**:
- `joinCode: string`

**Validation**:
- Must match the public join-code pattern

**Returns**:
- unavailable result with reason: `not_found`, `closed`, or `completed`
- available result with `{ sessionId, joinCode, status, joinStatus, currentRoundNumber, participationWindowStatus }`

## Mutations

### `gameSessions.create`

**Purpose**: Create a new joinable session when no active session exists.

**Arguments**: none

**Behavior**:
- generate a unique public join code
- initialize lobby state with `joinStatus="open"`
- return host and player navigation data

**Returns**:
- `{ sessionId, joinCode, hostPath, joinPath }`

**Failure modes**:
- `active_session_exists`

### `gameSessions.setJoinStatus`

**Purpose**: Open or close player joining without ending the session.

**Arguments**:
- `sessionId: Id<"gameSessions">`
- `joinStatus: "open" | "closed"`

**Returns**:
- `{ sessionId, joinStatus, closedAt }`

**Failure modes**:
- `session_not_found`
- `session_completed`

### `playerEntries.join`

**Purpose**: Attach the current browser device and display name to a joinable
session.

**Arguments**:
- `joinCode: string`
- `displayName: string`
- `deviceId: string`

**Validation**:
- join code shape and session availability
- trimmed display name length and visible characters
- case-insensitive duplicate display-name rejection within the session
- only one active joined entry per device within the session

**Returns**:
- `{ playerEntryId, sessionId, joinCode, displayName, eligibleFromRoundNumber, currentRoundNumber }`

**Failure modes**:
- `session_not_found`
- `session_closed`
- `session_completed`
- `duplicate_display_name`
- `device_already_joined`

## Derived Client Expectations

- Host views subscribe to `gameSessions.getHostOverview`
- Player join routes resolve session availability before enabling submission
- Client code uses generated Convex helpers only; no handwritten fetch protocol
- Validation errors return explicit machine-readable reasons so routes can render
  specific recovery guidance

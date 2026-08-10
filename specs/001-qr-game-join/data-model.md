# Data Model: QR Game Join

## Stored Entities


### GameSession

**Purpose**: Represents the live session owned by the host display, including
the join status and the current participation timing needed for late joiners.


| Field                       | Type                                    | Notes                                       |
| --------------------------- | --------------------------------------- | ------------------------------------------- |
| `_id`                       | Convex document ID                      | Internal identifier only                    |
| `joinCode`                  | string                                  | Six-character uppercase public code, unique |
| `status`                    | `"lobby" | "in_progress" | "completed"` | Overall session lifecycle                   |
| `joinStatus`                | `"open" | "closed"`                     | Whether new players can join                |
| `currentRoundNumber`        | number                                  | `0` while the host is in pre-game lobby     |
| `participationWindowStatus` | `"idle" | "open" | "locked"`            | Used to determine late-join eligibility     |
| `createdAt`                 | number                                  | Epoch milliseconds                          |
| `updatedAt`                 | number                                  | Epoch milliseconds                          |
| `closedAt`                  | number | null                           | Set when the host closes joining            |
| `completedAt`               | number | null                           | Set when the session ends                   |


**Indexes**:

- `by_join_code` on `joinCode`
- `by_status` on `status`

**Validation rules**:

- `joinCode` must match `^[A-HJ-NP-Z2-9]{6}$`
- `joinStatus` must be `"open"` or `"closed"`
- `status` may only advance forward in the lifecycle
- `closedAt` is required when `joinStatus` becomes `"closed"`
- `completedAt` is required when `status` becomes `"completed"`

### PlayerEntry

**Purpose**: Represents one player's successful membership in a specific game
session and the earliest round where they can participate.


| Field                     | Type                       | Notes                                                  |
| ------------------------- | -------------------------- | ------------------------------------------------------ |
| `_id`                     | Convex document ID         | Internal identifier                                    |
| `sessionId`               | reference to `GameSession` | Parent session                                         |
| `deviceId`                | string                     | Stable browser-generated UUID stored in `localStorage` |
| `displayName`             | string                     | Original casing shown to players                       |
| `normalizedDisplayName`   | string                     | Lowercased and trimmed for uniqueness                  |
| `joinStatus`              | `"joined" | "removed"`     | Stored state for roster membership                     |
| `eligibleFromRoundNumber` | number                     | Current or next round based on join timing             |
| `joinedAt`                | number                     | Epoch milliseconds                                     |
| `lastSeenAt`              | number | null              | Optional heartbeat-ready field for later presence work |


**Indexes**:

- `by_session` on `sessionId`
- `by_session_and_display_name` on `sessionId`, `normalizedDisplayName`
- `by_session_and_device` on `sessionId`, `deviceId`

**Validation rules**:

- `displayName` is required, trimmed, and 2 to 24 visible characters
- `normalizedDisplayName` must be unique within a session
- `deviceId` must be a non-empty UUID-style string
- Only one active `joined` entry per `(sessionId, deviceId)`
- `eligibleFromRoundNumber` must be `>= 0`

## Derived Read Models

### JoinCredential

Derived from `GameSession`; not stored as a separate table.


| Field        | Type    | Notes                                                         |
| ------------ | ------- | ------------------------------------------------------------- |
| `joinCode`   | string  | Human-readable fallback entry                                 |
| `joinUrl`    | string  | Canonical `/join/$joinCode` URL                               |
| `qrValue`    | string  | URL encoded into the QR component                             |
| `isJoinable` | boolean | True only when session exists, is active, and joining is open |


### HostDisplayView

Composed from `GameSession` and `PlayerEntry` rows.


| Field               | Type                     | Notes                                                                        |
| ------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `session`           | `GameSession` projection | Host-facing session metadata                                                 |
| `roster`            | `PlayerEntry[]`          | Live list of joined players                                                  |
| `joinedPlayerCount` | number                   | Count of active joined players                                               |
| `lateJoinerCount`   | number                   | Players whose `eligibleFromRoundNumber` is greater than `currentRoundNumber` |


## Relationships

- One `GameSession` has many `PlayerEntry` records.
- One `PlayerEntry` belongs to exactly one `GameSession`.
- `JoinCredential` is a derived projection of `GameSession`.
- `HostDisplayView` joins one `GameSession` to many `PlayerEntry` records.

## State Transitions

### GameSession


| From                                   | Event                            | To                                      |
| -------------------------------------- | -------------------------------- | --------------------------------------- |
| `lobby/open`                           | Host starts session              | `lobby/open`                            |
| `lobby/open`                           | Gameplay begins                  | `in_progress/open`                      |
| `in_progress/open`                     | Host closes joining              | `in_progress/closed`                    |
| `lobby/open`                           | Host closes joining before start | `lobby/closed`                          |
| `lobby/closed` or `in_progress/closed` | Host reopens joining             | matching state with `joinStatus="open"` |
| any non-completed state                | Session ends                     | `completed/closed`                      |


### PlayerEntry


| From                     | Event                                         | To                                                             |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------- |
| client-only pending form | Join succeeds before active window            | `joined` with `eligibleFromRoundNumber=currentRoundNumber`     |
| client-only pending form | Join succeeds during active window            | `joined` with `eligibleFromRoundNumber=currentRoundNumber + 1` |
| `joined`                 | Host removes player or future moderation flow | `removed`                                                      |


## Boundary Inputs Requiring Validation

- Route param `joinCode`
- Manual join code form input
- Display name form input
- Browser `deviceId` loaded from `localStorage`
- Convex mutation payloads for session creation, join, and join-status updates


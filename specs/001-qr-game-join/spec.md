# Feature Specification: QR Game Join

**Feature Branch**: `[001-qr-game-join]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "creating the ability for a host to create a game with a qr code that when players scan they can join the game that's in progress. the host will be ran on a computer with a large monitor, the players will be on mobile screens."

## Clarifications

### Session 2026-03-16

- Q: What level of player identity is required to join a game? → A: Players join with only a display name.
- Q: How should duplicate display names be handled within a game session? → A: Reject the duplicate and require a different display name.
- Q: When should player joining close for a game session? → A: Joining stays open until the host manually closes it.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start A Joinable Game (Priority: P1)

As a host, I can create a new game session that immediately shows a scannable QR code on the shared display so players can join without manual setup.

**Why this priority**: Without a host-created joinable session and visible QR code, the multiplayer game cannot start.

**Independent Test**: Can be fully tested by having a host create a session and confirming that a unique, active join screen appears on the large display with a scannable code and clear join instructions.

**Acceptance Scenarios**:

1. **Given** no active game session exists, **When** the host starts a new game, **Then** the system creates a new joinable session and displays a QR code tied to that session.
2. **Given** a new game session has been created, **When** the host views the shared display, **Then** the display shows the game join code, QR code, and current join status in a format readable from a distance.

---

### User Story 2 - Join From A Mobile Device (Priority: P2)

As a player, I can scan the QR code with my phone and enter the active game from a mobile-friendly join flow so I can participate without using the host screen.

**Why this priority**: The game depends on fast audience participation from personal devices, and mobile join is the core player entry path.

**Independent Test**: Can be fully tested against a valid active-session join
link or join-code fixture on a phone, entering the join flow, confirming entry,
and seeing the player counted in the active game without depending on the host
creation screen.

**Acceptance Scenarios**:

1. **Given** an active game session is accepting players, **When** a player scans the QR code on a phone, **Then** the player is taken directly to a mobile join experience for that specific game.
2. **Given** a player opens the mobile join experience for an active game, **When** the player submits a display name, **Then** the system confirms the player has joined and reserves that device for the selected game session.

---

### User Story 3 - Allow Late Joiners Without Interrupting Play (Priority: P3)

As a host, I can keep the game open for additional players while the session is in progress so late arrivals can join without disrupting the ongoing experience for current players.

**Why this priority**: Audience games often start before every participant is ready, so late entry preserves accessibility without blocking the main flow.

**Independent Test**: Can be fully tested against an in-progress joinable
session fixture by having a new player scan the active QR code mid-session and
confirming the host display and active roster update without resetting game
state.

**Acceptance Scenarios**:

1. **Given** a game is already in progress and still accepting players, **When** a late player scans the active QR code and joins, **Then** the player is added to the session without restarting or interrupting the current game state.
2. **Given** a player joins after a participation window has already started, **When** the current window closes, **Then** the late player becomes eligible at the next available participation opportunity.
3. **Given** a host no longer wants to accept new players, **When** the host closes joining for the active session, **Then** new join attempts are rejected while existing players remain in the game.

### Edge Cases

- If a player scans a QR code for a session that has already ended or is no longer accepting players, the system must explain that the game is unavailable and tell the player what to do next.
- If two players try to join with the same display name in the same session, the system must reject the duplicate name and require the joining player to choose a different display name before entry is confirmed.
- If a player loses connection after opening the join flow but before confirmation, the system must not count that player as joined unless confirmation succeeds.
- If the QR code cannot be scanned from the shared display, the system must also present a human-readable join code players can enter manually.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow a host to create a new game session that is marked as open for player joining.
- **FR-002**: The system MUST generate a session-specific QR code and a human-readable join code for each open game session.
- **FR-003**: The shared host display MUST present the QR code, join code, and clear join instructions in a format intended for large-screen viewing.
- **FR-004**: The system MUST route a player who scans a valid QR code to the matching active game session without requiring the player to search for the session manually.
- **FR-005**: The system MUST provide a mobile-optimized join flow for players using phones.
- **FR-006**: The system MUST require each joining player to provide only a display name before entry is confirmed.
- **FR-007**: The system MUST reject duplicate display names within the same game session and require the joining player to choose a different display name before entry is confirmed.
- **FR-008**: The system MUST confirm to the player when joining succeeds and show that the player is attached to the active game session.
- **FR-009**: The system MUST update the host view with the current joined-player count and roster as players enter the session.
- **FR-010**: The system MUST allow players to join a game that is already in progress if the host has not closed joining for that session.
- **FR-011**: The system MUST add late joiners without resetting the game session or interrupting current participants.
- **FR-012**: The system MUST define when a newly joined player becomes eligible to participate if they join after a round or response window has already started.
- **FR-013**: The system MUST reject join attempts for sessions that are invalid, closed, or completed and provide a clear explanation to the player.
- **FR-014**: The system MUST allow a player to join by manually entering the join code when QR scanning is unavailable.
- **FR-015**: The system MUST keep joining open during gameplay until the host explicitly closes joining for that session.
- **FR-016**: The system MUST allow the host to close joining without ending or resetting the active game session.

### Key Entities _(include if feature involves data)_

- **Game Session**: A live multiplayer game instance created by a host, including its join status, display state, player roster, and current progress state.
- **Host Display**: The shared large-screen game view that shows session join details, audience status, and other host-facing game information.
- **Player Entry**: A player's membership in a game session, including display name, join status, device association, and eligibility to participate.
- **Join Credential**: The scannable QR code and matching human-readable join code that point players to a specific active game session.

## Assumptions

- A single host controls the creation and visibility of one game session at a time from the shared display.
- Players join through a browser on their phone and do not need a separate native app to participate.
- Players can join without signing in, host approval, or entering an additional PIN beyond the session QR code or manual join code.
- A game remains open to new players after it starts until the host manually closes joining.
- Players who join after an active response window has started become eligible at the next available participation opportunity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A host can create a joinable game session and display a working QR code in 30 seconds or less without technical assistance.
- **SC-002**: At least 90% of first-time players can join an active session from the QR code to confirmed entry in 45 seconds or less on their phone.
- **SC-003**: A live session can accept at least 50 concurrent player joins before gameplay starts without requiring the host to retry or manually refresh the join screen.
- **SC-004**: When joining remains open, a late player can enter an in-progress game and appear in the host roster within 5 seconds without interrupting the current round.
- **SC-005**: In usability testing, at least 90% of players can complete the join flow on their first attempt using only the large-screen instructions.

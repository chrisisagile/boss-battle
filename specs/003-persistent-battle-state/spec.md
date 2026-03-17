# Feature Specification: Persistent Battle State

**Feature Branch**: `003-persistent-battle-state`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "Maintain and persist boss and party HP/status across rounds so players can track progress and strategies evolve. Included in this is the ability to have a database of bosses with skills, HP, action points per round, bosses should auto scale based on number of players so that more players means more and more difficult bosses, each round can have multiple bosses on the field. We must be able to track user health, user action points, user skills. Skills should be creative but broken into attack, heal, defend, and read/study. The state of each player and monster is saved. The party health must be visible between rounds, the projector must show a battle arena view with characters and monsters, and character art should support both random pixel-art defaults and database-defined sprites."

## Clarifications

### Session 2026-03-17

- Q: What happens to a player who reaches 0 health during battle progression? → A: A player is knocked out and can return only if healed or revived later.
- Q: How should a player who joins after battle progression has already started be handled? → A: A late-joining player can only join after the current battle ends.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resolve battles across rounds (Priority: P1)

As a player or host, I can see the current health, action points, and status of the party and all active bosses before, during, and after each round so the battle feels continuous and prior decisions still matter.

**Why this priority**: Without persistent combat state, the game loop has no strategic continuity and the battle outcome feels disconnected from player choices.

**Independent Test**: Complete one round, advance to the next round, and confirm that party health, boss health, action points, and active status effects match the previous round's outcome on both player and projector views.

**Acceptance Scenarios**:

1. **Given** a round has ended with damage and healing applied, **When** the next round begins, **Then** the saved party and boss health totals are shown unchanged from the prior round result until new actions are resolved.
2. **Given** a player has remaining action points and an active skill effect, **When** they reconnect or refresh before the next round, **Then** their saved combat state is restored and shown accurately.
3. **Given** multiple bosses are active in the same round, **When** the projector battle view is displayed, **Then** each boss appears with distinct health and action status that reflects the saved round state.

---

### User Story 2 - Make strategic player choices (Priority: P2)

As a player, I can review my own health, action points, and available skills so I can choose whether to attack, heal, defend, or study based on the current battle situation.

**Why this priority**: Persistent team play only becomes strategic when individual players can understand their own condition and trade off immediate impact versus future advantage.

**Independent Test**: Load a player state with partial health, limited action points, and available skills, then verify that the player can identify valid choices and that the selected category changes the saved battle state correctly after round resolution.

**Acceptance Scenarios**:

1. **Given** a player is low on health, **When** they review their combat profile between rounds, **Then** they can see enough state to decide whether a heal or defend action is needed.
2. **Given** a player selects a study-type skill, **When** the next quiz round is assigned, **Then** the game records that the player earned an easier question experience for that upcoming round.
3. **Given** a player has insufficient action points for a skill, **When** they review their options, **Then** the unavailable choice is clearly distinguishable from skills they can still use.

---

### User Story 3 - Configure scalable encounters (Priority: P3)

As a game operator, I can prepare bosses with reusable stats, skills, and artwork and run encounters that scale with participation so small and large groups both get an appropriate challenge.

**Why this priority**: The game needs reusable encounter setup and participation-based difficulty to stay manageable for hosts and balanced for different audience sizes.

**Independent Test**: Configure boss records, launch a session with different player counts, and verify that the encounter scales in difficulty, supports multiple simultaneous bosses, and renders configured or default sprites in the arena view.

**Acceptance Scenarios**:

1. **Given** a boss catalog contains named bosses with combat attributes and skills, **When** a host adds one or more bosses to a round, **Then** those bosses appear as separate combatants with their configured identities and saved state.
2. **Given** the same boss encounter is started with a larger party, **When** the round begins, **Then** boss difficulty increases according to the defined scaling rules so the challenge rises with player count.
3. **Given** a character or boss has no custom sprite assigned, **When** the battle arena is displayed, **Then** a random retro-style default image is used without blocking the encounter.

### Edge Cases

- If all bosses are defeated before all queued player actions are spent, the encounter ends immediately and any unused actions for that round expire without carrying over.
- If incoming damage, healing, and defense effects all resolve in the same round, the system applies the full round-resolution order before determining whether the party is defeated.
- Knocked-out players must remain visible in party summaries with an explicit knocked-out state and no normal action choices until a heal or revive returns them to active play.
- If a saved combatant references missing or invalid artwork, the system must keep the encounter playable by showing the persisted fallback sprite instead.
- If host configuration results in zero eligible bosses for an encounter, the system must block battle start and show the host a validation error before the arena view opens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST persist battle state across rounds for the party, each player, and each active boss within a game session.
- **FR-002**: The system MUST store and restore, at minimum, health, action points, skill availability, knockout state, and round-relevant status effects for each player.
- **FR-003**: The system MUST store and restore, at minimum, health, action points, skills, and round-relevant status effects for each active boss.
- **FR-004**: The system MUST allow a single round to contain more than one active boss combatant.
- **FR-005**: The system MUST provide a reusable boss catalog where each boss definition includes an identity, combat attributes, skill set, and visual representation settings.
- **FR-006**: The system MUST scale boss difficulty upward before an encounter starts by applying player-count-based adjustments to boss health and action points using the number of active players in the session.
- **FR-007**: The system MUST let players review their own health, action points, and available skill categories between rounds before making their next strategic choice.
- **FR-008**: The system MUST support player skill categories for attack, heal, defend, and study, with study producing a saved next-round question advantage that is persisted on the player until the next quiz round consumes it.
- **FR-009**: The system MUST treat a player who reaches 0 health as knocked out, preventing normal participation until that player is healed or otherwise revived.
- **FR-010**: The system MUST preserve party-wide health visibility between rounds in a format that is understandable to both the host and players.
- **FR-011**: The system MUST present a shared battle arena view on the projector that shows the current party combatants, active bosses, and each side's current health and action points.
- **FR-012**: The system MUST use the product's approved retro battle presentation patterns for player profile cards, character sheets, enemy health displays, action-point bars, and health bars so battle information is visually consistent.
- **FR-013**: The system MUST support a visual fallback for any character or boss without a configured sprite by assigning a random retro-style default image.
- **FR-014**: The system MUST allow character and boss sprites to be explicitly assigned and updated through saved content records so visuals can be controlled per combatant.
- **FR-015**: The system MUST keep battle state available after reconnects or refreshes during an active session so players and hosts return to the current encounter state instead of a reset view.
- **FR-016**: The system MUST prevent invalid battle progression by rejecting round resolution when required combatants, combat values, or scaling inputs are missing.
- **FR-017**: The system MUST prevent new players from becoming active combatants after a battle has started, allowing them to join only after the current battle ends.

### Key Entities *(include if feature involves data)*

- **Battle Session**: A live game instance that contains party members, one or more rounds, active bosses, and the cumulative combat state that carries forward until victory, defeat, or session end.
- **Combatant State**: The saved round-to-round state for a single player or boss, including health, action points, available skills, knockout or active condition, active effects, current visual assignment, and any next-round study advantage.
- **Boss Definition**: A reusable encounter record that defines a boss's name, base combat values, skill list, scaling behavior, and optional custom sprite.
- **Player Skill**: A categorized action a player can spend resources on, limited to attack, heal, defend, or study, with clear gameplay consequences and any carry-forward effects.
- **Encounter Lineup**: The set of bosses and party combatants currently shown in the battle arena for a specific round.

## Assumptions

- Hosts define or select scaling rules so that higher player counts always increase encounter difficulty, even if the exact tuning values change over time.
- Scaling rules adjust only boss health and action points for this feature slice; they do not alter boss identity, boss count, or skill lists automatically.
- Study effects influence only the next quiz round unless a future feature explicitly extends that duration.
- Party health visibility refers to both an aggregate team view and the underlying player-by-player state needed to explain that total.
- Random default art is acceptable when no custom sprite exists, but hosts may override visuals for named characters and bosses at any time before or during an active session if the product later supports live editing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In moderated playtests, hosts can run three consecutive rounds without losing or manually reconstructing party or boss combat state in 100% of sessions.
- **SC-002**: At least 90% of test players can correctly identify their current health, action points, and available skill categories within 10 seconds of opening the between-round status view.
- **SC-003**: At least 90% of test hosts can correctly identify the party's overall condition and the remaining health of every active boss within 10 seconds of viewing the projector arena.
- **SC-004**: In validation sessions covering small and large player counts, encounter difficulty increases in every larger-player scenario compared with the smaller-player baseline using the same boss setup.
- **SC-005**: In reconnect and refresh tests during active sessions, 100% of players and hosts return to the same battle state they last saw before disconnecting.

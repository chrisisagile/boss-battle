# Feature Specification: Battle Feedback and Balance

**Feature Branch**: `feat/005-battle-feedback-balance`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "we need better feedback on actions so when battle actions are resolving and the monsters are performing their actions, the battle arena host view should show the activity of what each person/monster does use https://www.8bitcn.com/docs/blocks/gaming/dialogue And we need to increase the hitpoints of the users and decrease the monster attack levels more better right now its extremely unbalanced"

## Clarifications

### Session 2026-03-17

- Q: How much battle action history should remain visible on the host arena during an exchange? → A: Show the current action plus a short recent history for the same exchange.
- Q: What survivability target should the rebalance aim for in standard encounters? → A: Standard encounters should leave most players still active after the opening monster phase.
- Q: Where should the detailed battle action feed be shown for this feature? → A: Show the same action feed on both the host arena and player devices.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Follow live battle actions (Priority: P1)

As a host or player, I can watch each battle action unfold on the battle display for my screen so I always know who acted, who was targeted, and what changed after each action resolves.

**Why this priority**: If the host and players cannot follow battle resolution in real time, the game feels confusing even when the underlying combat rules are correct.

**Independent Test**: Start a battle exchange and verify that each monster and player action appears on both the host arena and player devices in the same order it resolves, including the actor, target, action type, and immediate outcome.

**Acceptance Scenarios**:

1. **Given** a battle exchange is resolving, **When** a monster begins its turn, **Then** the host arena and player devices show that monster's action before the next combat event is processed.
2. **Given** a battle action changes health, status, or readiness, **When** the action resolves, **Then** the host arena and player devices show the affected combatant and the outcome of that action.
3. **Given** several actions happen in one exchange, **When** the exchange finishes, **Then** the host arena and player devices preserve the current action plus a short recent history for that exchange long enough for viewers to review what happened.

---

### User Story 2 - Understand special and failed outcomes (Priority: P2)

As a host or player, I can see not only successful attacks but also healing, guarding, missed actions, and knockouts so battle outcomes are explainable instead of looking random.

**Why this priority**: Clear feedback must cover the full range of battle outcomes, not just damage events, otherwise the arena still leaves players guessing about why combatants changed state.

**Independent Test**: Run exchanges that include damage, healing, guarding, misses, and knockouts, then confirm the host arena and player devices call out each outcome clearly and in sequence.

**Acceptance Scenarios**:

1. **Given** a combatant uses a healing or defensive action, **When** that action resolves, **Then** the host arena and player devices show the action and its protective or restorative effect.
2. **Given** an action misses, is blocked, or cannot complete as originally intended, **When** the outcome is known, **Then** the host arena and player devices show that outcome instead of implying a successful hit.
3. **Given** an action knocks out a player or monster, **When** the knockout occurs, **Then** the host arena and player devices show the knockout at the moment it happens and the affected side's state updates immediately afterward.

---

### User Story 3 - Keep battles survivable and competitive (Priority: P3)

As a player, I can survive long enough to answer questions and spend earned actions because the party starts with more staying power and monsters no longer overpower the team too quickly.

**Why this priority**: The current battle balance makes the game feel punishing before players can meaningfully participate, which undermines the quiz-to-battle loop.

**Independent Test**: Start new standard encounters with a full party, resolve the opening monster phase, and confirm the updated tuning leaves most parties able to respond with player actions instead of being nearly defeated immediately.

**Acceptance Scenarios**:

1. **Given** a new session begins with players at full health, **When** the first standard monster phase resolves, **Then** the party retains enough health for most active players to continue participating in the same exchange.
2. **Given** a standard monster attack hits a full-health player, **When** the hit resolves, **Then** the player usually remains active rather than being immediately knocked out by that one opening action.
3. **Given** a new encounter is started after the rebalance, **When** monster attacks are compared against the prior live baseline, **Then** their damage pressure is lower and player durability is higher for that new encounter.

### Edge Cases

- If a queued action becomes invalid because its target was already knocked out or fully healed by an earlier action, the host arena and player devices must show that the action was skipped, redirected, or otherwise changed.
- If multiple combatants affect the same target in one exchange, the host arena and player devices must show each outcome separately in resolution order rather than collapsing them into one unexplained health change.
- If a defensive effect reduces or prevents damage, the host arena and player devices must show the prevented or reduced outcome so the reduced health loss is understandable.
- If a monster or player is knocked out mid-exchange, remaining battle feedback on the host arena and player devices must reflect that updated state for all later actions in the same exchange.
- If an encounter uses non-standard custom tuning, the product must still show the same battle feedback quality on the host arena and player devices even if the balance targets are not identical to the standard baseline.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a live battle activity panel on the battle arena host view and on player devices while battle exchanges are resolving.
- **FR-002**: The battle activity panel MUST identify, for each resolved action, the acting combatant, the intended target or affected side, the action taken, and the immediate outcome.
- **FR-003**: The battle activity panel MUST present actions in the same order they are resolved by the game.
- **FR-004**: The system MUST update visible combatant health and status immediately after each action resolves so the arena state stays aligned with the reported outcome.
- **FR-005**: The system MUST show non-damage outcomes, including healing, guarding, misses, resisted actions, and knockouts, with the same clarity as successful attacks.
- **FR-006**: If a queued action is skipped, redirected, or otherwise changed because the battle state changed earlier in the same exchange, the system MUST show that revised outcome in the host and player feedback.
- **FR-007**: The battle activity panel MUST preserve the current action plus a short recent history from the current exchange until that exchange is complete.
- **FR-008**: The system MUST rebalance standard player-versus-monster combat so that standard encounters leave most players still active after the opening monster phase and player combatants begin new sessions with higher survivability than in the current live baseline.
- **FR-009**: The system MUST reduce the damage pressure of standard monster attacks in new sessions relative to the current live baseline.
- **FR-010**: The system MUST apply the rebalanced player durability and monster damage values consistently to newly started standard encounters.
- **FR-011**: The system MUST keep battle feedback behavior consistent across monster turns and player turns within every exchange and across the host arena and player devices.
- **FR-012**: The system MUST make knockout events visible at the moment they occur and reflect the resulting inactive state before later actions are shown.

### Key Entities *(include if feature involves data)*

- **Battle Activity Event**: A single resolved combat event that records who acted, who was affected, what happened, and the resulting change visible to hosts and players.
- **Exchange Activity Sequence**: The ordered set of battle activity events shown to hosts and players for one complete battle exchange.
- **Combat Balance Profile**: The baseline durability and damage expectations used to tune standard player and monster combat behavior for new encounters.
- **Combatant State Snapshot**: The current visible state of a player or monster after each action, including health, active or knocked-out status, and other round-relevant conditions.

## Assumptions

- The improved action feedback is required on both the host arena and player devices within this feature, with the same ordered exchange context shown on both surfaces.
- The rebalance applies to newly started standard encounters and does not require retroactively changing sessions already in progress.
- The rebalance focuses on global player durability and standard monster damage output, with standard encounters expected to leave most players still active after the opening monster phase; custom encounter exceptions can be tuned separately later if needed.
- The host needs the current action plus a short recent history for the current exchange to understand what happened; a permanent multi-round transcript is out of scope for this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In host and player observation tests, at least 90% of battle actions can be correctly identified by actor, target, and outcome within 3 seconds of appearing on either the arena or player view.
- **SC-002**: In exchange verification tests, 100% of resolved actions appear on the host arena and player devices in the same order they were applied, including damage, healing, defensive outcomes, misses, and knockouts.
- **SC-003**: In representative standard-encounter playtests, at least 80% of full-health parties still have a majority of active players after the opening monster phase.
- **SC-004**: In representative standard-encounter playtests, at least 80% of sessions reach player response turns in the first exchange without the party being effectively decided before players can act.
- **SC-005**: In host comprehension tests, at least 90% of hosts can correctly explain why a combatant gained or lost health immediately after an exchange by using only the arena feedback.

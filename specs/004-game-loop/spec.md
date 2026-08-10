# Feature Specification: Game Loop

**Feature Branch**: `feat/004-game-loop`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "we need a clear game loop implemented. the game process should follow the following flow: 1. a host creates a new room. they cant see past rooms since this could be used by multiple people at the same time. 2. once a new room is created, the host screen changes to the game lobby which displays the qr code and a list of users that are connected. additionally, there is a config panel that lets you setup the bosses, the number of questions in each quiz round, the categories to pick froma, nd the difficulty ratings to use. 3. The host can click on a \"Start game\" which will close the ability for others to login, and begin the process. 4. Round Start 5. The battle arens displays on the main screen, other things go away 6. players see their first quiz question automatically. 7. Players answer, as they answer the next quiz question shows. 8. As players complete their quizes, the battle arena updates with a check next to their name on the player side of the arena. 9. Once everyone has completed their quizes, the players action points are updated based on the answers they get rihgt (1 point for easy, 2 for medium, 3 for hard). 10. Players are then presented with their actions they can pick. 11. The battle round comenses with the battle boss going first. the battle boss side gets to pick an action and target. 12. Based on the battle boss's actions, players hitpoitns, action points, statuses, are deteremined. 13. Once battle bosses have finshed, then its the players times, player battle starts with the player wiht the highest action points first unless they have a knocked out status. 14. Player picks an action and target and next 15. New hit points, action points, statuses are determined based on the players actions. 16. Repeat for all players. 17. Repeat battle round randomly up to 3 times. or until all enemies or players are knocked out. or all players have no more action points 17. move to the next quiz round. 18. repeat until all players are knocked out, all enemies are eliminated, or game is ended. 19. A results screen is displayed."

## Clarifications

### Session 2026-03-17

- Q: How should the number of battle exchanges per quiz round be determined? → A: Randomly choose 1, 2, or 3 battle exchanges at the start of each quiz round, then keep that count fixed for the round.
- Q: How should a disconnected player be handled during an active quiz round? → A: Remove disconnected players from the current round immediately and continue without them.
- Q: How should player turn-order ties be resolved when action points are equal? → A: Randomly choose among tied players each time.
- Q: Can a disconnected player rejoin after missing a round? → A: The player may rejoin in a later round, but not the current round they missed.
- Q: Who chooses boss actions and targets during battle resolution? → A: Boss actions and targets are chosen automatically by the game.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host and launch a room (Priority: P1)

As a host, I can create a fresh room, configure the upcoming game, and start it when my players have joined so every session begins from a clean and controlled lobby.

**Why this priority**: The rest of the game loop depends on a reliable host-owned room that is isolated from prior sessions and can be configured before play begins.

**Independent Test**: Create a new room, confirm no earlier rooms are visible, confirm the lobby shows the join code and connected players, configure bosses and quiz settings, and start the game to verify new joins are blocked.

**Acceptance Scenarios**:

1. **Given** a host wants to run a new game, **When** they create a room, **Then** the system opens a new room and does not expose prior rooms from other or earlier sessions.
2. **Given** a room has been created, **When** the host enters the lobby, **Then** the lobby shows the join code, the list of currently connected players, and controls for bosses, question count, categories, and difficulty settings.
3. **Given** the host has finished setup, **When** they start the game, **Then** the room stops accepting new joins and the game advances into the first round.

---

### User Story 2 - Run a quiz-to-battle round (Priority: P2)

As a player, I move directly from quiz questions into battle choices, and as a host I can see each player’s round progress so the shared battle resolves in a clear and predictable order.

**Why this priority**: This is the core play loop. Without a deterministic flow from questions to action points to battle turns, the game cannot be played.

**Independent Test**: Start a configured room, have players answer quiz questions to completion, confirm the projector marks completed players, award action points by answer difficulty, collect player actions, and resolve boss and player turns in the required order.

**Acceptance Scenarios**:

1. **Given** a round has started, **When** the projector battle view appears, **Then** players are automatically shown their first quiz question and non-battle lobby content is removed from the host display.
2. **Given** a player answers a question, **When** additional questions remain in that round, **Then** the next quiz question is shown immediately without requiring the player to navigate manually.
3. **Given** a player disconnects during a round and reconnects later, **When** the next quiz round begins, **Then** that player may return as an active participant for the new round but does not re-enter the earlier missed round.
4. **Given** some players have finished their quiz and others have not, **When** the projector battle view updates, **Then** each completed player is visibly marked as ready while unfinished players remain unmarked.
5. **Given** all active players have completed their assigned quiz questions, **When** quiz scoring is finalized, **Then** each player receives action points based on correct answers using the configured difficulty values of 1 for easy, 2 for medium, and 3 for hard.
6. **Given** action points have been awarded, **When** battle resolution begins, **Then** the game automatically resolves boss-side actions and targets first before player turns begin.
7. **Given** boss actions have finished, **When** player turns are resolved, **Then** eligible players act in descending action-point order, skipping any knocked-out player, until all player turns are complete or the round ends early.
8. **Given** a quiz round still has unresolved battle exchanges, **When** no victory, defeat, or action-point exhaustion condition has been met, **Then** the system continues battle exchanges up to the randomly chosen round limit of one, two, or three exchanges that was set at round start.

---

### User Story 3 - Finish the game and show results (Priority: P3)

As a host or player, I can see when the game ends and review the outcome so the session has a clear conclusion instead of stopping in the middle of the loop.

**Why this priority**: A visible end state is necessary for group play, scoring closure, and deciding whether to start a new session.

**Independent Test**: Run the game until the party is defeated, all enemies are eliminated, or the host ends the session, and confirm that the game stops advancing rounds and displays a results summary.

**Acceptance Scenarios**:

1. **Given** all enemies are eliminated, **When** the current battle resolution finishes, **Then** the game ends immediately and displays a results screen showing a player victory.
2. **Given** all players are knocked out, **When** the current battle resolution finishes, **Then** the game ends immediately and displays a results screen showing a boss victory.
3. **Given** the host ends an in-progress game, **When** the end command is confirmed, **Then** the current session stops advancing and the results screen shows the game as ended by the host.

### Edge Cases

- If a host attempts to start the game without at least one connected player, the system must block game start and explain what is missing.
- If a player disconnects after the room is locked but before finishing their quiz, that player is removed from the current round immediately so the round can continue without waiting.
- If all players finish the quiz but none earned any action points, the battle round must end early after boss actions if no player can legally act.
- If multiple players have the same action-point total, the system must break the tie randomly for that turn order decision.
- If a victory or defeat condition is reached during a battle exchange, the system must stop remaining actions and move directly to the final outcome for the session.
- If the host ends the game during the lobby or during an active round, the system must prevent further progress and show the result as a host-ended session rather than an unresolved state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a host to create a new room for each game session.
- **FR-002**: The system MUST keep newly created rooms isolated from previous rooms so a host cannot browse or resume earlier sessions from the room-creation flow.
- **FR-003**: The system MUST transition the host into a game lobby immediately after room creation.
- **FR-004**: The lobby MUST show the room’s join code, the list of currently connected players, and the session’s current readiness state.
- **FR-005**: The system MUST allow the host to configure, before game start, the bosses to be used, the number of quiz questions per round, the quiz categories, and the difficulty ratings included in the session.
- **FR-006**: The system MUST prevent the host from starting the game until the minimum required configuration and player presence conditions are met.
- **FR-007**: When the host starts the game, the system MUST lock the room against additional joins for the remainder of that game session.
- **FR-008**: When a round begins, the system MUST switch the host display to the battle arena view and remove lobby-only content from that display.
- **FR-009**: When a round begins, the system MUST automatically deliver the first quiz question to every active player.
- **FR-010**: The system MUST present each player’s quiz questions sequentially, automatically advancing to the next question after each submitted answer until that player’s assigned set is complete.
- **FR-011**: The battle arena view MUST show which players have completed their quiz for the current round.
- **FR-012**: The system MUST wait until every active player for the round has either completed their quiz or otherwise been removed from round participation before finalizing quiz scoring.
- **FR-012a**: If a player disconnects during an active quiz round, the system MUST remove that player from the current round immediately and continue round completion checks without waiting for that player to reconnect.
- **FR-012b**: A player removed from a round because of disconnection MUST be allowed to rejoin as an active participant in a later round, but MUST NOT re-enter the round they missed after that round has continued without them.
- **FR-013**: The system MUST convert correct quiz answers into action points using the round’s difficulty values of 1 point for easy, 2 points for medium, and 3 points for hard.
- **FR-014**: After quiz scoring, the system MUST present each eligible player with the battle actions and valid targets available to them for that round.
- **FR-015**: Each battle exchange MUST begin with boss actions before any player action is resolved.
- **FR-016**: The system MUST choose boss actions and targets automatically for each battle exchange and MUST determine and apply the resulting health, action-point, and status changes before player turns begin.
- **FR-017**: Player turn order MUST be based on descending available action points at the start of player resolution for that exchange.
- **FR-017a**: If two or more eligible players have the same action-point total, the system MUST break that tie randomly when setting the player turn order for that exchange.
- **FR-018**: The system MUST skip players who are knocked out when determining who can act.
- **FR-019**: Each resolved player action MUST update the affected health, action points, statuses, and any remaining valid actions before the next player turn begins.
- **FR-020**: Each quiz round MUST randomly choose one, two, or three battle exchanges before the first exchange begins and MUST keep that chosen count fixed for the rest of the round unless an early-stop condition ends the round first.
- **FR-021**: The system MUST end the current round early if all enemies are knocked out, all players are knocked out, or no player can spend any remaining action points.
- **FR-022**: After a round ends without meeting a game-ending condition, the system MUST advance to the next quiz round and repeat the quiz-to-battle loop using the same session roster and configuration.
- **FR-023**: The game MUST continue until all players are knocked out, all enemies are eliminated, or the host explicitly ends the game.
- **FR-024**: When the game ends, the system MUST display a results screen summarizing the session outcome, including whether the players won, the bosses won, or the host ended the game.

### Key Entities *(include if feature involves data)*

- **Game Room**: A host-owned live session container that has a unique join code, a current phase, join availability, and the active set of connected players.
- **Lobby Configuration**: The pre-game setup choices for a room, including selected bosses, quiz question count, allowed categories, and included difficulty ratings.
- **Quiz Round**: A repeatable phase in which each active player answers a fixed set of questions before battle exchanges begin.
- **Round Participation**: The per-round record of whether a player is active, disconnected, removed from the current round, eligible to return next round, quiz-complete, action-ready, knocked out, or otherwise unable to act.
- **Battle Exchange**: One boss-first combat cycle followed by player actions in turn order, repeated up to the round’s randomly chosen exchange limit unless an early-stop condition is reached.
- **Boss Turn Resolution**: The automatic selection and execution of boss actions and targets at the start of a battle exchange before any player turn is processed.
- **Session Result**: The final outcome state for a room, including winner, termination reason, and end-of-game summary details.

## Assumptions

- A single host controls one active room at a time and uses that room as the authoritative session for all players who join through the displayed code.
- The session decides which connected players count as active participants for a round at round start, and a player who disconnects during that round is removed from the current round immediately so they do not block game progress.
- A disconnected player may return in a later round if the game is still active, but the product does not rewind or reopen the round that continued without them.
- Difficulty values of 1, 2, and 3 points are fixed for easy, medium, and hard answers within this feature and are not host-editable.
- Boss decisions are automated within the game loop; the host does not manually choose boss actions during live battle resolution.
- The number of battle exchanges for a round is randomly chosen as one, two, or three at round start and remains fixed for that round.
- If two or more players have the same action-point total, the product breaks that tie randomly for the current exchange.
- Results details focus on session outcome and participant status summary; deeper analytics can be added later without changing the core loop.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In host-run validation sessions, 100% of new games can be launched from room creation to first quiz question without exposing prior rooms or requiring manual state resets.
- **SC-002**: In moderated multiplayer tests, at least 90% of players complete a full quiz-to-battle round without needing host intervention to understand what happens next.
- **SC-003**: In round-progress tests, hosts can identify which players are still answering questions and which are ready for battle within 5 seconds of viewing the arena.
- **SC-004**: In scoring verification tests, 100% of action-point totals match the defined easy, medium, and hard reward values for the submitted correct answers.
- **SC-005**: In battle-order validation tests, 100% of exchanges resolve with boss turns first and player turns following the defined eligibility and ordering rules.
- **SC-005a**: In tie-order validation tests, 100% of tied player turns are assigned by the defined random tie-break rule without requiring host intervention.
- **SC-006**: In end-to-end playtests, 100% of sessions finish on a visible results screen once a victory, defeat, no-actions-remaining, or host-end condition is reached.

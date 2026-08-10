# Feature Specification: Quiz Token Awards

**Feature Branch**: `[002-quiz-token-awards]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "Players answer short quiz questions on their phones; correct answers award action tokens that can be spent in later phases. The game uses an expandable question bank. A player receives a question and submits an answer. A correct answer increments the player's token count and shows the updated token balance. Token awards are reflected in the lobby and projector summary."

## Clarifications

### Session 2026-03-17

- Q: How should quiz questions be delivered during a round? → A: Each player may receive a different question selected for them individually.
- Q: How should category and complexity affect live question selection? → A: The host sets category and complexity rules for the round, and the system selects questions within those rules.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Earn Tokens From Quiz Answers (Priority: P1)

As a player, I can receive a quiz question on my phone, answer it through a multiple-choice interaction, and immediately earn action tokens for a correct response so I can contribute to later battle phases.

**Why this priority**: The feature has no game value unless players can answer questions and reliably earn spendable tokens from correct responses.

**Independent Test**: Can be fully tested by placing a player in an active quiz phase, delivering a multiple-choice question, submitting both correct and incorrect answers, and confirming that only correct responses increase the player's available token total.

**Acceptance Scenarios**:

1. **Given** a player is eligible to answer a live quiz question, **When** the system selects a multiple-choice question for that player and the player submits the correct answer choice, **Then** the system awards the configured number of action tokens to that player and confirms the updated token balance.
2. **Given** a player is eligible to answer a live quiz question, **When** the system selects a multiple-choice question for that player and the player submits an incorrect answer choice, **Then** the system records the response and leaves the player's token balance unchanged.
3. **Given** a player has just submitted an answer, **When** the answer is evaluated, **Then** the player sees whether the answer was correct and what their current token balance is before the next phase begins.

---

### User Story 2 - Use A Reusable Question Bank (Priority: P2)

As a game operator, I can maintain a reusable bank of quiz questions and answer keys so new rounds can draw from an expandable set of prompts without rewriting content each time.

**Why this priority**: A repeatable question source is necessary to keep the quiz phase sustainable beyond a one-off demo and supports future game growth.

**Independent Test**: Can be fully tested by loading a prepared set of questions, starting a quiz phase, and confirming that valid questions can be presented to players from that set across multiple rounds.

**Acceptance Scenarios**:

1. **Given** the game has an available bank of approved quiz questions, **When** a new quiz phase starts, **Then** the system can select and present an appropriate question from that bank for each eligible player.
2. **Given** new questions are added to the maintained question bank before a game session, **When** future quiz phases are run, **Then** those added questions are available for selection without redefining the feature behavior.

---

### User Story 3 - Show Token Gains To The Whole Room (Priority: P3)

As a host and audience, I can see token gains reflected in the shared projector summary and earned-points leaderboard so everyone understands which players earned resources before the team chooses battle actions.

**Why this priority**: Shared visibility keeps the room coordinated and makes the quiz reward loop understandable in a live multiplayer setting.

**Independent Test**: Can be fully tested by awarding tokens to one or more players during a quiz phase and confirming that the shared projector summary updates to show the new token totals and a ranked earned-points summary without manual refresh or score recalculation.

**Acceptance Scenarios**:

1. **Given** one or more players have earned new tokens from quiz answers, **When** the quiz results are finalized, **Then** the shared projector summary shows each affected player's updated token balance.
2. **Given** one or more players have earned new tokens from quiz answers, **When** the earned-points summary is shown at the end of the quiz, **Then** it ranks players by quiz-earned points in a format suitable for the room to review.

---

### User Story 4 - Run Configurable Quiz Rounds (Priority: P2)

As a host, I can start and end a game round based on a configurable number of quiz questions and round-specific category and complexity rules so the room progresses through battle phases using a predictable round structure, with a clear round-start presentation on both the shared projector and player screens.

**Why this priority**: Token earning needs a defined round boundary so players and the host know when the quiz phase begins, when it is complete, and when the game should move on to action spending.

**Independent Test**: Can be fully tested by setting a round question count plus category and complexity rules, starting a round, showing the round-start presentation on both host/projector and player screens, delivering the configured number of matching questions, and confirming that the round closes and stops accepting further round questions until the next round is started.

**Acceptance Scenarios**:

1. **Given** a host has set the number of questions plus the category and complexity rules for a round, **When** the host starts a new round, **Then** the system opens a quiz round that tracks progress against that configured question total, shows a round-start presentation on the shared projector and player screens, and selects player questions that fit those rules.
2. **Given** an active round is in progress, **When** the configured number of questions has been completed, **Then** the system marks the round as ended and stops presenting additional round questions.
3. **Given** a round has ended, **When** the host prepares the next phase of gameplay, **Then** the completed round remains finalized and its awarded tokens remain available for later actions.

### Edge Cases

- If a player submits after the answer window closes, the system must reject or ignore the late submission and clearly communicate that no tokens were awarded.
- If the same player attempts to submit multiple answers for the same question, the system must count only one finalized response for token awarding.
- If a question is missing a valid answer key or reward value, the system must keep that question out of live play rather than awarding tokens unpredictably.
- If a question is missing valid answer choices for a multiple-choice interaction, the system must keep that question out of live play rather than presenting an incomplete prompt.
- If no more approved questions are available for a planned quiz phase, the system must alert the host that the next quiz question cannot be delivered.
- If a shared display update is delayed, the player's earned tokens must remain correct and appear in the next available lobby and projector refresh state.
- If the configured round length is reached while an answer is still being finalized, the system must finish evaluating the active question before ending the round.
- If the host changes the configured question count between rounds, the new value must apply only to future rounds, not the round already in progress.
- If a player remains in the game across multiple rounds, the system must continue selecting new questions for that player without reusing a question they have already received in the same game.
- If the host's chosen category and complexity rules cannot be satisfied for all players in a round, the system must tell the host before or during round setup rather than silently using questions outside those rules.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST present a quiz question selected for each eligible player during a quiz phase on the player's phone.
- **FR-002**: The system MUST present quiz questions as multiple-choice prompts with selectable answer choices on the player's phone.
- **FR-003**: The system MUST allow a player to submit one answer choice for an active quiz question before the submission window closes.
- **FR-004**: The system MUST evaluate whether a submitted answer choice matches the accepted correct answer for that question.
- **FR-005**: The system MUST award action tokens only when a player's submitted answer is evaluated as correct.
- **FR-006**: The system MUST keep a player's existing token balance unchanged when the submitted answer is incorrect or invalid.
- **FR-007**: The system MUST update the player's visible token balance immediately after answer evaluation is completed.
- **FR-008**: The system MUST preserve awarded tokens so they remain available for later gameplay phases where tokens can be spent.
- **FR-009**: The system MUST maintain a reusable collection of quiz questions that includes the prompt, answer choices, accepted correct answer, and token reward amount for each question.
- **FR-010**: The system MUST classify each quiz question by category and complexity so question sets can be organized and selected intentionally.
- **FR-011**: The system MUST support expanding the question collection with additional questions without changing player-facing quiz behavior.
- **FR-012**: The system MUST track which quiz questions have already been presented to each player during the current game across all rounds.
- **FR-013**: The system MUST prevent the same player from receiving the same quiz question more than once within a single game, even when that game spans multiple rounds.
- **FR-014**: The system MUST support selecting quiz questions independently per player rather than requiring the same question to be shown to every player at the same time.
- **FR-015**: The system MUST allow the host to define the category and complexity rules that apply to a round before that round starts.
- **FR-016**: The system MUST select quiz questions for players from within the active round's category and complexity rules.
- **FR-017**: The system MUST prevent questions that lack valid answer choices, an accepted correct answer, or a token reward from being used in live gameplay.
- **FR-018**: The system MUST render active quiz questions using the approved 8bitcn `Card` component pattern.
- **FR-019**: The system MUST show a round-start presentation on both the shared projector and player screens using the approved 8bitcn gaming `Chapter Intro` block.
- **FR-020**: The system MUST reflect awarded tokens in the shared projector summary after quiz answer evaluation.
- **FR-021**: The system MUST show an earned-points summary at the end of the quiz using the approved 8bitcn gaming `Leaderboard` block.
- **FR-022**: The system MUST ensure each player receives token credit for a given question at most once.
- **FR-023**: The system MUST handle expired or late answer submissions in a way that prevents token awards after the question is closed and explains the outcome to the player.
- **FR-024**: The system MUST allow the host to configure how many quiz questions make up a game round before that round starts.
- **FR-025**: The system MUST allow the host to start a new quiz round for the active game session.
- **FR-026**: The system MUST track how many questions have been completed in the current round against the configured round total.
- **FR-027**: The system MUST end the active quiz round once the configured number of questions has been completed.
- **FR-028**: The system MUST prevent additional quiz questions from being presented as part of a round after that round has ended.
- **FR-029**: The system MUST preserve all tokens awarded during a completed round for use in later gameplay phases.
- **FR-030**: The system MUST show the current round status, remaining question count, and active category and complexity rules to the host during an active round.

### Key Entities _(include if feature involves data)_

- **Quiz Question**: A prompt used during the quiz phase, including its answer choices, accepted answer, reward amount, category, complexity, readiness for live play, and suitability for individual player delivery.
- **Player Answer**: A player's submitted response to a specific quiz question, including submission timing, evaluation outcome, and award result.
- **Token Balance**: The running total of action tokens a player has earned and can later spend during battle phases.
- **Session Summary**: The shared view of player status for the active game session, including token totals shown in the lobby and on the projector.
- **Game Round**: A bounded quiz phase within a game session, including its start state, end state, configured question total, category and complexity rules, and progress through completed questions.
- **Question History**: The record of which quiz questions each player has already received during the current game so repeat delivery can be prevented across multiple rounds.

## Assumptions

- Each quiz question has one accepted correct answer used for token awarding.
- Each quiz question is presented as a multiple-choice prompt with a complete set of selectable answer choices.
- Every correct answer awards a predefined number of action tokens for that question.
- Token spending happens in a later gameplay phase and is outside the scope of this feature.
- Players answer questions on their own phones while the lobby and projector remain the shared reference points for the room.
- Quiz questions are selected independently for each eligible player rather than broadcast as a single shared prompt.
- The host prepares or approves the available question bank before live gameplay begins.
- Each round uses one host-defined question count that stays fixed for the duration of that round.
- The available question bank is large enough to avoid forced repeats for players within a single game session under normal play conditions.
- The host chooses a round's category and complexity rules before the round starts, and those rules stay fixed for that round once play begins.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 95% of eligible players can receive a quiz question, submit an answer, and see their updated token balance within 10 seconds of answer evaluation.
- **SC-002**: In a live session, 100% of correctly answered questions result in the intended token award appearing in the player's balance without manual correction.
- **SC-003**: In validation of a prepared question set, 100% of questions used in live gameplay include a valid answer and reward definition.
- **SC-004**: After quiz results are finalized, updated token totals appear in the lobby and projector summary for affected players within 5 seconds in at least 95% of rounds.
- **SC-004**: After quiz results are finalized, updated token totals appear in the shared projector summary for affected players within 5 seconds in at least 95% of rounds.
- **SC-005**: In moderated playtesting, at least 90% of players can tell from the phone and shared displays whether they earned tokens from a question without needing host explanation.
- **SC-006**: Hosts can configure and start a quiz round in 15 seconds or less before gameplay in at least 90% of observed sessions.
- **SC-007**: In 100% of validated rounds, the round ends after exactly the configured number of completed questions and no extra round question is delivered afterward.
- **SC-008**: In 100% of validated game sessions, no player receives the same quiz question more than once across all rounds in that session.
- **SC-009**: In 100% of validated rounds, every delivered question matches the host-selected category and complexity rules for that round.
- **SC-010**: In 100% of validated rounds, every delivered question is shown as a complete multiple-choice prompt with all answer choices visible before submission.
- **SC-011**: In moderated playtesting, at least 90% of participants recognize the round-start presentation and earned-points summary on both the shared projector and player screens without host explanation.

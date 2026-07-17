# Feature Specification: Leader Board

**Feature Branch**: `005-leader-board`
**Created**: 2026-07-17
**Status**: Draft
**Input**: User description: "Create a cool leaderboard inspired by old school video games"

**Grilling note**: This spec was sharpened via an interview session (grill-me) before drafting. Ten questions were put to the requester covering scope, ranking metric, retro-aesthetic depth, display surfaces, reveal timing, initials-entry qualification, win/loss dependency, board size/badges, tie-breaks, and content moderation. All raised ambiguities were resolved; none remain open.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host/TV arcade reveal at game end (Priority: P1)

When a game session finishes, the host's screen (the shared TV/big-screen view the party is watching) plays a retro arcade-cabinet-style reveal: CRT/scanline visuals, a chiptune-style sting, and a scrolling countdown that reveals the session's players from lowest to highest token balance, ending on the session's top scorer.

**Why this priority**: This is the centerpiece "cool, old-school" moment the feature exists to deliver — it's the payoff the whole party watches together, and it's the most visible, differentiating piece of the feature.

**Independent Test**: Complete a game session with 2+ players who have distinct token balances; confirm the host screen automatically transitions into the reveal sequence showing every player ranked by token balance, with scanline/CRT styling and audio, without requiring any manual navigation.

**Acceptance Scenarios**:

1. **Given** a session transitions from `in_progress` to `completed`, **When** the host screen is displaying the session, **Then** it automatically plays the arcade reveal sequence ranking all participating players by final token balance, highest last.
2. **Given** the session's `completionReason` is `players_won`, **When** the reveal sequence plays, **Then** the session is visually distinguished (e.g., gold treatment/badge) from sessions ending in `bosses_won`, `host_ended`, or `no_actions_left`.
3. **Given** the reveal sequence is playing, **When** a viewer is simply watching, **Then** no ranking or standings were visible at any point earlier in the session (see User Story 2 for the "no live leaks" requirement).

---

### User Story 2 - Standings stay hidden until the reveal (Priority: P1)

During active gameplay, no player or host view exposes token-balance rankings or standings. The first time anyone sees who's ahead is the User Story 1 reveal sequence at game end.

**Why this priority**: This is a hard constraint the requester was explicit about (to preserve suspense for the reveal) and it shapes the technical design (no live-updating leaderboard UI/query wired into the in-progress game screens) — getting it wrong undermines the P1 reveal experience entirely.

**Independent Test**: Play through an in-progress session and inspect every player and host screen; confirm none surfaces a ranked list of token balances or "who's winning" indicator.

**Acceptance Scenarios**:

1. **Given** a session with `status: "in_progress"`, **When** any player views their device, **Then** no ranked standings across players are shown.
2. **Given** a session with `status: "in_progress"`, **When** the host views the shared screen, **Then** no ranked standings are shown.

---

### User Story 3 - Persistent all-time high-score board with initials entry (Priority: P2)

Every player who finishes a completed game session is offered a classic arcade-style 3-letter initials entry prompt on their own device. Submitted scores are ranked by token balance into one persistent, global all-time Leaderboard that keeps only the top 5 entries across all games ever played. The player sees where their score landed relative to the current top 5.

**Why this priority**: This is what gives the "old school video game" concept lasting weight (a shared high-score table people care about across many game nights) rather than a one-off animation, but the game is still fully playable and satisfying via User Story 1 alone if this slips.

**Independent Test**: Complete a session, confirm every finishing player's device prompts for 3-letter initials, submit a score, and confirm the persistent all-time board reflects the correct top-5 ranking (including displacing a previous 5th-place entry when a higher score is submitted).

**Acceptance Scenarios**:

1. **Given** a player's session reaches `completed` and that player finished the game (was never removed/disconnected before completion), **When** their device shows the end-of-game screen, **Then** they are prompted to enter 3 initials.
2. **Given** a submitted score is higher than the current 5th-place all-time entry, **When** the submission is recorded, **Then** the all-time board's top 5 is re-ranked and the previous 5th-place entry is dropped.
3. **Given** a submitted score does not rank in the current top 5, **When** the submission is recorded, **Then** the all-time board is unchanged, and the submitting player's screen indicates they did not place.
4. **Given** an all-time entry was achieved in a session with `completionReason: players_won`, **When** the all-time board is displayed, **Then** that entry carries the same victory distinction used in User Story 1.

---

### User Story 4 - Compact phone recap with rank and badges (Priority: P3)

After a game session completes, each player's own phone shows a compact recap: their final rank and token balance for that session, whether they earned either secondary badge ("Boss Slayer" for most boss damage dealt, "Quiz Whiz" for best quiz accuracy), and whether they placed on the persistent all-time top 5.

**Why this priority**: Adds personal payoff and shareable bragging rights beyond the shared host-screen spectacle, but is additive polish on top of Stories 1–3 rather than required for the core "cool leaderboard" experience.

**Independent Test**: Complete a session as a specific player; confirm that player's phone shows their rank, token balance, any earned badge, and all-time placement status, independent of what the host screen is showing.

**Acceptance Scenarios**:

1. **Given** a session completes, **When** a player views their own device, **Then** they see their final rank and token balance for that session.
2. **Given** a player dealt the most boss damage or had the best quiz accuracy in the session, **When** they view their recap, **Then** the corresponding badge ("Boss Slayer" and/or "Quiz Whiz") is shown.
3. **Given** a player's all-time submission (User Story 3) did or did not place in the top 5, **When** they view their recap, **Then** that outcome is reflected.

---

### Edge Cases

- A player is removed/disconnected before the session reaches `completed`: they are excluded from that session's ranking, badge eligibility, and the initials-entry prompt, since they did not finish the game. [Assumption derived from the "every player who finishes a completed game" answer — confirm before implementation.]
- Tie in token balance, either within a session's ranking or at the all-time top-5 cutoff: broken by higher quiz accuracy. If accuracy is also tied, both entries share the rank/placement.
- Initials input content: filtered against a profanity list; rejected submissions must be re-prompted rather than silently accepted.
- Fewer than 5 all-time entries exist (early lifetime of the app): the board must show only the entries that exist, with no placeholder/fake rows.
- A session with only 1 finishing player: ranking is trivially size-1; both secondary badges trivially go to that player. Reveal sequence and initials entry should still function without special-casing that breaks the animation.
- A session ends via `host_ended` or `no_actions_left` with zero players having finished (e.g., host ends immediately after lobby): no ranking, reveal, or initials entry should occur since there is nothing to rank.
- Two or more players tied for a secondary badge (equal boss damage for "Boss Slayer", or equal accuracy for "Quiz Whiz"): the badge is shared and displayed for all tied players.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST rank all players who finished a completed game session by their final token balance, highest to lowest, to produce that session's Leaderboard.
- **FR-002**: System MUST NOT expose any cross-player ranking or standings on any player or host view while a session's `status` is `lobby` or `in_progress`.
- **FR-003**: Upon a session transitioning to `completed`, the host/TV screen MUST automatically present an arcade-style reveal: CRT/scanline visual treatment, chiptune-style audio, and a rank-by-rank scrolling countdown from lowest to highest token balance.
- **FR-004**: Sessions with `completionReason: players_won` MUST be visually distinguished (e.g., gold styling/badge) from sessions ending in `bosses_won`, `host_ended`, or `no_actions_left`, both in the host reveal (FR-003) and on the persistent all-time board (FR-006).
- **FR-005**: Every player who finished a completed session (i.e., was not removed/disconnected before completion) MUST be prompted on their own device to enter 3-letter initials for the persistent all-time board.
- **FR-006**: System MUST maintain one persistent, global all-time Leaderboard ranked by token balance, independent of and outliving any individual game session.
- **FR-007**: The persistent all-time Leaderboard MUST retain only the top 5 entries; a new submission that would rank higher than the current 5th entry MUST cause that 5th entry to be dropped.
- **FR-008**: When a player submits initials, their device MUST show the resulting current top 5 all-time board so the player can see whether and where they placed.
- **FR-009**: For each completed session, system MUST compute two secondary badges: "Boss Slayer" (player(s) with the highest total damage dealt to bosses in the session) and "Quiz Whiz" (player(s) with the highest quiz-answer accuracy in the session). If multiple players tie for a badge's underlying metric, all tied players share that badge.
- **FR-010**: The host/TV reveal sequence (FR-003) MUST surface the session's primary token-balance ranking together with the "Boss Slayer" and "Quiz Whiz" badge holders.
- **FR-011**: Each finishing player's own device MUST show, after session completion: their final session rank and token balance, whether they earned either secondary badge, and whether their submission placed on the persistent all-time top 5.
- **FR-012**: System MUST durably persist all Leaderboard-relevant data (per-session final token balances, boss-damage totals, quiz accuracy, all-time entries with initials) so the all-time board survives across sessions and app restarts.
- **FR-013**: System MUST exclude players who were removed or disconnected before a session reached `completed` from that session's ranking, badge computation, and the initials-entry prompt.
- **FR-014**: System MUST resolve tied token balances (within a session ranking or at the all-time top-5 cutoff) by comparing quiz-answer accuracy; if accuracy is also tied, the tied players share the rank/placement.
- **FR-015**: System MUST validate submitted initials against a profanity/content filter and re-prompt the player for a new submission if the filter rejects it, rather than silently storing or dropping it.

### Key Entities *(include if feature involves data)*

- **Session Leaderboard**: The ranked, per-session outcome derived from a single `gameSessions` record once `completed` — an ordered list of finishing players with their final token balance, boss-damage total, quiz accuracy, and `completionReason`-derived victory flag. Not persisted as new standalone state beyond what's needed to render the reveal and recap; sourced from existing `playerEntries`, `battleExchanges`, and `quizAnswers` data for that session.
- **All-Time Leaderboard Entry**: A persistent record capturing one player's qualifying score: 3-letter initials, token balance, originating session ID, victory flag, and achieved-at timestamp. The full table may hold history, but only the top 5 by token balance are ever surfaced.
- **Session Badge**: A computed (not necessarily persisted) award — "Boss Slayer" or "Quiz Whiz" — naming the session's winning player and the underlying metric value (total damage or accuracy percentage) that earned it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of sessions that reach `completed` with at least one finishing player automatically produce the host/TV reveal sequence and each finishing player's phone recap, with no manual navigation required to trigger either.
- **SC-002**: Zero standings or rankings are observable on any screen before a session reaches `completed` (verified by inspecting every in-progress player/host view across a full session playthrough).
- **SC-003**: The persistent all-time Leaderboard always reflects the correct top 5 token-balance entries across all completed sessions to date, immediately after each qualifying submission.
- **SC-004**: Victory sessions (`players_won`) are distinguishable from non-victory completions on both the host reveal and the all-time board by visual treatment alone, without reading any text.
- **SC-005**: Every finishing player can, without leaving the automatic end-of-game flow, answer three questions about their own outcome: their session rank/token balance, whether they earned a badge, and whether they placed on the all-time board.

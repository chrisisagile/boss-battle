# Files Containing "QR Game Join"

The phrase "QR Game Join" appears in the following files, all part of the
`001-qr-game-join` feature spec folder (`specs/001-qr-game-join/`):

- **`specs/001-qr-game-join/spec.md`**
  The feature specification. Describes the user-facing goal: a host running
  on a large monitor creates a game session and displays a QR code that
  players scan on their mobile devices to join. Includes clarifications on
  player identity (display name only), duplicate-name handling (rejected),
  and join-window behavior (stays open until the host manually closes it).

- **`specs/001-qr-game-join/plan.md`**
  The implementation plan. Summarizes the technical approach: a host-first
  flow backed by Convex that creates a game session, assigns a human-readable
  join code, and renders a QR code deep-linking players into a mobile join
  route. Also covers adapting 8bitcn UI blocks (main-menu, chapter-intro,
  friend-list, player-profile-card) into host/player screens.

- **`specs/001-qr-game-join/research.md`**
  Research notes and design decisions supporting the plan, including the
  choice to use a six-character uppercase join code as the public session
  handle (shared by both the QR code and manual entry path) and the
  rationale for keeping it simple and avoiding exposure of internal Convex
  document IDs.

- **`specs/001-qr-game-join/data-model.md`**
  Defines the stored data entities, notably `GameSession` — the live session
  record owned by the host display, including fields like `joinCode`,
  `status` (lobby/in_progress/completed), and `joinStatus` (open/closed).

- **`specs/001-qr-game-join/tasks.md`**
  The task breakdown for implementing the feature, organized by phase and
  user story (e.g., adding the QR rendering dependency, adapting UI
  components, and building out the join flow).

- **`specs/001-qr-game-join/quickstart.md`**
  Instructions for running the feature locally, including prerequisites
  (`pnpm install`, Docker for the self-hosted Convex stack, Playwright
  browser installation) and the steps to start the full dev stack.

- **`specs/001-qr-game-join/checklists/requirements.md`**
  A specification quality checklist used to validate completeness and
  clarity of `spec.md` before moving on to planning (e.g., no implementation
  details leaking into the spec, all mandatory sections completed).

- **`specs/001-qr-game-join/contracts/route-contract.md`**
  Defines the application routes involved in the feature (e.g., `GET /`),
  including their audience, purpose, and expected UI states (loading, empty,
  success) for both host and player-facing screens.

- **`specs/001-qr-game-join/contracts/convex-contract.md`**
  Defines the Convex backend contract: queries and mutations such as
  `gameSessions.getCurrentActive`, including their purpose, arguments, and
  return shapes, used to support the join/session flow.

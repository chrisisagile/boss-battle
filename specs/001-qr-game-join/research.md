# Research: QR Game Join

## Session Handle And Join URL

**Decision**: Use a six-character uppercase join code as the public session
handle, store it on the Convex `gameSessions` record, and use it in both the
host route (`/host/$joinCode`) and player join route (`/join/$joinCode`).
Generate QR values from the canonical player join URL and keep manual code entry
on `/join`.

**Rationale**: The feature requires both a scannable QR code and a human-readable
manual entry path. Reusing the same join code across QR and manual entry keeps
the validation surface small, avoids exposing internal Convex document IDs, and
gives the host display one code to explain from a distance.

**Alternatives considered**:
- Use Convex document IDs in the URL and a separate manual PIN. Rejected because
  it creates two public identifiers for one session and complicates validation.
- Use an opaque short-lived token in the QR code only. Rejected because manual
  entry is a required fallback and late joiners need a stable code while the
  host keeps joining open.

## Convex Persistence And Query Shape

**Decision**: Model session state in two tables: `gameSessions` for the shared
session lifecycle and `playerEntries` for per-player membership. Add indexes for
`joinCode`, normalized display names within a session, and per-device entries
within a session.

**Rationale**: Convex's schema-first tables and indexed queries fit the live
roster and duplicate-name requirements well. Separating sessions from player
entries keeps roster updates incremental, supports real-time host subscriptions,
and avoids rewriting a large embedded roster document on each join.

**Alternatives considered**:
- Store the entire roster inside a single session document. Rejected because it
  increases write contention and makes duplicate-name or device lookups more
  awkward.
- Keep join state in browser memory only. Rejected because the host roster and
  late-join behavior must stay synchronized across devices.

## Late Join Eligibility Rule

**Decision**: Persist an `eligibleFromRoundNumber` on each `playerEntries`
record. When a player joins during an active participation window, set it to the
next round number; otherwise set it to the current round number or lobby round.

**Rationale**: The spec explicitly states that players who join after a window
has started become eligible at the next available participation opportunity.
Storing the effective round on the player entry makes the rule inspectable,
testable, and independent from transient client timing.

**Alternatives considered**:
- Compute eligibility only in the client from current session state. Rejected
  because different clients could observe different timing and produce
  inconsistent eligibility.
- Add late joiners to the current round immediately. Rejected because it
  violates the stated assumption for in-progress participation windows.

## Host And Player UI Block Mapping

**Decision**: Use these 8bitcn blocks as the starting points for the feature:
- `main-menu` for the host landing/create-session surface
- `chapter-intro` for the large-screen join instructions and session callout
- `friend-list` for the live host roster and joined-player count
- `player-profile-card` for player join confirmation and mobile waiting state

**Rationale**: These blocks align with the repo's shadcn policy and the specific
surfaces in the feature. `main-menu` fits a projector-friendly entry screen,
`chapter-intro` matches a large hero-style state announcement, `friend-list`
maps directly to a live roster, and `player-profile-card` gives a strong mobile
identity confirmation pattern after join.

**Alternatives considered**:
- Build every screen from generic shadcn primitives. Rejected because the repo
  policy prefers 8bitcn as the retro gaming upstream before bespoke builds.
- Install unrelated 8bitcn blocks such as leaderboard or victory-state blocks.
  Rejected because they fit later gameplay and recap phases, not the join slice.

## QR Rendering Strategy

**Decision**: Render the QR code client-side in the host route with
`qrcode.react`, using the canonical `/join/$joinCode` URL as the encoded value.

**Rationale**: `qrcode.react` is a small React-native dependency that avoids a
server-generated image endpoint, keeps the route Cloudflare-compatible, and
produces SVG/canvas output directly inside the host display. The QR payload can
be regenerated whenever the route origin changes without additional backend
logic.

**Alternatives considered**:
- Generate QR PNGs on the server. Rejected because it adds a server boundary
  with no feature benefit.
- Use a lower-level QR library plus custom rendering. Rejected because the host
  screen only needs a stable React component, not a custom graphics layer.

## Validation And Error Handling

**Decision**: Validate join code, display name, and browser device identity at
both the route/form boundary and the Convex mutation boundary. Normalize display
names for case-insensitive duplicate detection and surface explicit error states
for invalid, closed, completed, and duplicate-name join attempts.

**Rationale**: The constitution requires explicit runtime validation and
resilient user-facing states. Dual validation keeps accidental client bypasses
from corrupting session data while still giving immediate UI feedback.

**Alternatives considered**:
- Validate only in the browser. Rejected because untrusted inputs still cross
  the Convex boundary.
- Return a generic join failure for all rejected cases. Rejected because the
  host and player need actionable feedback for recovery.

## Test Strategy

**Decision**: Keep fast coverage in Vitest and Testing Library for join helpers,
route components, and state rendering, then use Aspire-backed smoke coverage to
prove the AppHost boots the web app and serves the join surfaces with Convex
wiring intact.

**Rationale**: Repo policy requires `pnpm test` to stay deterministic and
Docker-free. The join feature spans UI and live backend wiring, so it needs both
fast local tests and one browser-level check through the real AppHost graph.

**Alternatives considered**:
- Put live Convex integration in the fast unit suite. Rejected because the repo
  explicitly keeps `pnpm test` free of live service dependencies.
- Rely only on manual QA. Rejected because duplicate-name handling, join-state
  rendering, and route errors are narrow enough to test automatically.

## References

- 8bitcn gaming blocks: https://www.8bitcn.com/docs/blocks/gaming/main-menu
- 8bitcn gaming blocks: https://www.8bitcn.com/docs/blocks/gaming/chapter-intro
- 8bitcn gaming blocks: https://www.8bitcn.com/docs/blocks/gaming/friend-list
- 8bitcn gaming blocks: https://www.8bitcn.com/docs/blocks/gaming/player-profile-card
- Convex schema quickstart: https://docs.convex.dev/quickstart/react
- Convex mutations contract: https://docs.convex.dev/functions/mutation-functions
- Convex indexing guidance: https://docs.convex.dev/database/reading-data/indexes/
- `qrcode.react` package: https://www.npmjs.com/package/qrcode.react

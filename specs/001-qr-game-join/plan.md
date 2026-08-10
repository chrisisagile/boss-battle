# Implementation Plan: QR Game Join

**Branch**: `[001-qr-game-join]` | **Date**: 2026-03-16 | **Spec**: [/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/spec.md](/home/chris/dev/personal/boss-battle/specs/001-qr-game-join/spec.md)
**Input**: Feature specification from `/specs/001-qr-game-join/spec.md`

## Summary

Build a host-first game-session flow that creates a Convex-backed session,
assigns a human-readable join code, and renders a QR code that deep-links
players into a mobile join route. Adapt the 8bitcn `main-menu`,
`chapter-intro`, `friend-list`, and `player-profile-card` blocks into repo-owned
host and player screens, enforce unique display names per session, keep the
host roster live during gameplay, and mark late joiners as eligible at the next
participation opportunity instead of interrupting the current round.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, TSX
**Primary Dependencies**: TanStack Start 1.132, TanStack Router, TanStack Query, Convex 1.27, `@convex-dev/react-query`, Tailwind CSS v4, shadcn/8bitcn registry, `qrcode.react`
**Storage**: Convex tables for `gameSessions` and `playerEntries`, plus browser `localStorage` for a per-device join identity
**Testing**: Vitest, Testing Library, route-adjacent component tests, helper unit tests, and Aspire-backed browser smoke coverage in `devops/tests/`
**Target Platform**: Cloudflare-hosted web app for shared large-screen host displays and modern mobile browsers
**Project Type**: Full-stack web app
**Performance Goals**: Host can create and display a scannable session in under 30 seconds, player join confirmations and roster updates propagate within 5 seconds, and the join flow stays within one mutation plus live query fan-out for at least 50 concurrent join attempts
**Constraints**: Preserve Cloudflare-compatible packages and `pnpm` workflows, keep generated route tree and Convex clients tool-generated, validate all untrusted route/form/Convex inputs, keep joining open until the host closes it, adapt 8bitcn blocks into repo-owned route/component boundaries instead of shipping demo markup unchanged, and keep later user stories independently runnable via foundational seeded session states rather than hidden product dependencies
**Scale/Scope**: 3 user stories, 4 route surfaces (`/`, `/host/$joinCode`, `/join`, `/join/$joinCode`), Convex schema plus session/player modules, reusable session-fixture helpers for active and in-progress states, shared join-flow UI wrappers, and targeted unit plus AppHost smoke validation

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] Scope is captured as independently testable user stories with acceptance
      scenarios and measurable success criteria.
- [x] Runtime boundaries are identified: route params (`joinCode`), forms
      (display name and manual join code), browser device identity storage,
      Convex queries/mutations, generated Convex client usage, and environment
      access through `VITE_CONVEX_URL`.
- [x] Validation strategy is explicit for every untrusted input and no new
      unchecked `any` or silent fallback is required.
- [x] Test plan covers the narrowest useful automated tests for every changed
      behavior and names the verification commands to run.
- [x] Loading, empty, success, and error states are defined for each affected
      user-facing flow.
- [x] Observability and performance impact are addressed for SSR, streaming,
      bundle size, or network round trips when applicable.
- [x] Cloudflare, Convex, and `pnpm` workflow compatibility is preserved and no
      deviation is required.

### Post-Design Re-check

- [x] Research resolved the feature's technical decisions without leaving any
      `NEEDS CLARIFICATION` markers.
- [x] The design keeps typed boundaries at route params, form payloads,
      local-storage device identity, and Convex function contracts.
- [x] The data model supports independent vertical slices for host creation,
      mobile joining, and late-join handling through foundational seeded active
      and in-progress session states.
- [x] Planned verification remains deterministic for `pnpm test`, with Aspire
      smoke coverage reserved for startup and live-wiring checks.
- [x] Error, empty, loading, and success states are defined for host and player
      views, including invalid, closed, duplicate-name, and completed-session
      join failures.

## Project Structure

### Documentation (this feature)

```text
specs/001-qr-game-join/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── convex-contract.md
│   └── route-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── join/
│   └── ui/
│       └── 8bit/
├── integrations/
│   └── convex/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── host/$joinCode.tsx
│   ├── join/index.tsx
│   └── join/$joinCode.tsx
├── styles.css
└── routeTree.gen.ts

convex/
├── schema.js
├── gameSessions.ts
├── playerEntries.ts
└── lib/

devops/tests/
└── BossBattle.AppHost.Tests/
```

**Structure Decision**: Keep route ownership in `src/routes/`, extract join and
roster composition into `src/components/join/`, adapt 8bitcn-generated pieces
under repo-owned UI paths (use shadcn cli to install ie pnpm dlx shadcn@latest add @8bitcn/chapter-intro), store live session state in `convex/`, add
shared session-fixture helpers under `convex/lib/` and `src/test/` so `US2`
and `US3` can run independently after the foundational phase, and keep browser
wiring verification in the Aspire-backed test project under `devops/tests/`.

## Complexity Tracking

No Constitution Check violations require justification at planning time.

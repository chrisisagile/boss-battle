---
title: shadcn UI Coding Standards
description: Repository policy for owned shadcn source, 8bitcn registry usage, Radix accessibility, theme tokens, and component extension in src/components/ui.
doc_type: coding_standard
status: active
stack:
  - shadcn
  - radix
  - react
  - tailwindcss
applies_to:
  - src/components/ui/
  - src/styles.css
  - components.json
keywords:
  - shadcn
  - 8bitcn
  - blocks
  - radix
  - theme tokens
  - tailwind
  - component variants
  - accessibility
---

# shadcn Standards

## Purpose

Define how shadcn and Radix-based UI code should be extended and maintained in this repository.

## Rules

- Must treat shadcn components as owned source code, not vendor code. If a component in `src/components/ui/` is wrong for this app, change it deliberately and review it like application code.
- Must treat 8bitcn as the active upstream registry for retro-themed shadcn additions in this repo. New retro primitives, themed widgets, and page-level game UI blocks should come from 8bitcn before custom-building them from scratch.
- Must keep base primitives under `src/components/ui/`.
- Must preserve Radix accessibility behavior when customizing components. Keyboard handling, aria attributes, focus behavior, and composition contracts must survive refactors.
- Must centralize theme tokens and semantic colors in `src/styles.css`.
- Must extend components through composition, variants, and small wrappers before forking duplicate primitives.
- Must keep `components.json` aligned with the current alias and style setup when shadcn components are added or regenerated.
- Must install new 8bitcn components and blocks through the shadcn CLI so the registry contract in `components.json` remains the source of truth.
- Must treat 8bitcn blocks as starting points. After installation, move game-specific business logic, live data wiring, and route ownership back into repo-owned `src/routes/` and `src/components/`.

## Preferred Patterns

- Prefer semantic utility classes backed by CSS variables such as `bg-background`, `text-foreground`, and `border-border`.
- Prefer variant-driven APIs for reusable component differences.
- Prefer local wrapper components when app-specific behavior needs to sit on top of a generic primitive.
- Prefer updating shared tokens in `src/styles.css` when the app theme changes.
- Prefer keeping 8-bit or branded variants clearly separated from base primitives, as in `src/components/ui/8bit/`.
- Prefer installing one 8bitcn component or block at a time and reviewing the generated file layout before adding another batch.
- Prefer composing game screens from smaller 8bitcn components unless a block already matches the screen contract closely.

## Avoid

- Avoid hard-coded hex color values in TSX class strings.
- Avoid copying a shadcn primitive into a second location just to change spacing or color.
- Avoid removing focus outlines, keyboard access, or label semantics during visual changes.
- Avoid placing theme decisions in page components when they belong in `src/styles.css`.
- Avoid treating `components.json` as disposable if aliases, registry setup, or style options change.
- Avoid dropping an 8bitcn block into a route unchanged if it still contains placeholder copy, demo state, or layout assumptions that do not match Boss Battle.
- Avoid mixing multiple retro registries or ad hoc copied snippets when the same primitive already exists in 8bitcn.

## Repo Notes

- `components.json` already registers `@8bitcn` at `https://www.8bitcn.com/r/{name}.json`, so repo-standard installs should use the shadcn CLI against that registry.
- `src/components/ui/button.tsx` is the canonical base-button seam.
- `src/components/ui/8bit/` is an intentional variation layer, not a license to duplicate the entire UI system.
- `src/styles.css` already defines semantic tokens and theme mappings. New visual work should extend that system rather than bypass it.
- 8bitcn documents its registry as a shadcn-compatible source and shows per-item installs in the form `pnpm dlx shadcn@latest add @8bitcn/<name>`.

## 8bitcn Workflow

### Install Process

1. Confirm the item exists in the official 8bitcn docs and that it matches the route or component seam you are building.
2. Install it with the shadcn CLI:

```bash
pnpm dlx shadcn@latest add @8bitcn/<name>
```

3. Move or adapt the generated code into the repo’s ownership boundaries:
   - base primitives stay in `src/components/ui/`
   - branded or retro variants belong under `src/components/ui/8bit/`
   - route-specific assembly stays in `src/routes/`
4. Replace placeholder copy, hard-coded demo values, and ad hoc theme colors before shipping.
5. Add or update tests when the installed component changes behavior.

### Block Install Examples

```bash
pnpm dlx shadcn@latest add @8bitcn/main-menu
pnpm dlx shadcn@latest add @8bitcn/leaderboard
pnpm dlx shadcn@latest add @8bitcn/victory-screen
pnpm dlx shadcn@latest add @8bitcn/game-over
pnpm dlx shadcn@latest add @8bitcn/game-progress
```

### Component Install Examples

```bash
pnpm dlx shadcn@latest add @8bitcn/button
pnpm dlx shadcn@latest add @8bitcn/enemy-health-display
pnpm dlx shadcn@latest add @8bitcn/health-bar
pnpm dlx shadcn@latest add @8bitcn/mana-bar
pnpm dlx shadcn@latest add @8bitcn/xp-bar
pnpm dlx shadcn@latest add @8bitcn/theme-selector
```

## Recommended 8bitcn Blocks

- `@8bitcn/main-menu`: preferred starting point for attract mode, lobby entry, or projector-side start screens.
- `@8bitcn/leaderboard`: preferred for round summaries, team rankings, and score recap screens.
- `@8bitcn/victory-screen`: preferred for post-battle win states and reward summaries.
- `@8bitcn/game-over`: preferred for loss states and restart/return-to-lobby affordances.
- `@8bitcn/game-progress`: preferred for boss-party progress summaries when a full page block is useful.
- `@8bitcn/player-profile-card`: preferred for player or team identity cards in lobby and roster flows.
- `@8bitcn/dialogue`: preferred for narrator text, boss taunts, and guided round transitions.
- `@8bitcn/difficulty-select`: preferred only if the game adds host-controlled match presets or encounter tiers.
- `@8bitcn/audio-settings`: preferred for host-side settings panels if the game exposes projector or stream audio controls.

## Recommended 8bitcn Components

- `@8bitcn/button`: default retro button source when the base shadcn button is not enough.
- `@8bitcn/card`, `@8bitcn/badge`, `@8bitcn/tabs`, `@8bitcn/table`: default structural primitives for game admin and scoreboard UI.
- `@8bitcn/dialog`, `@8bitcn/sheet`, `@8bitcn/toast`, `@8bitcn/tooltip`: default feedback and overlay primitives.
- `@8bitcn/input`, `@8bitcn/select`, `@8bitcn/radio-group`, `@8bitcn/switch`: preferred for host controls and player setup forms.
- `@8bitcn/enemy-health-display`, `@8bitcn/health-bar`, `@8bitcn/mana-bar`, `@8bitcn/xp-bar`, `@8bitcn/progress`: preferred for battle state and round progress.
- `@8bitcn/theme-selector` and `@8bitcn/retro-mode-switcher`: preferred only when theme switching is a real user feature, not a development toy.

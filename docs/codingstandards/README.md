---
title: Coding Standards Index
description: Entry point for repository coding standards across React, TanStack Start, shadcn, 8bitcn, Convex, Aspire, and shared practices.
doc_type: coding_standard_index
status: active
stack:
  - shared
  - testing
  - react
  - tanstack-start
  - shadcn
  - 8bitcn
  - convex
  - aspire
applies_to:
  - src/
  - convex/
  - devops/
keywords:
  - coding standards
  - repo policy
  - react
  - tanstack start
  - shadcn
  - 8bitcn
  - convex
  - aspire
  - docs
---

# Coding Standards

## Purpose

These documents define the implementation standards for this repository. They are policy, not optional guidance. New code, refactors, and reviews must use them as the default bar for `src/`, `convex/`, and `devops/`.

## Audience

- Engineers shipping product code in `src/`
- Engineers adding schema, queries, mutations, or actions in `convex/`
- Engineers changing Aspire orchestration and helper scripts in `devops/`
- Reviewers deciding whether a change is ready to merge

## Document Map

- [shared.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/shared.md): Cross-cutting rules for TypeScript, generated files, environment ownership, testing, accessibility, performance, and documentation updates.
- [testing.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/testing.md): Test pyramid, naming, fixture, and Aspire-backed browser testing policy for this repo.
- [react.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/react.md): React component, hook, state, effect, and testability standards for code under `src/`.
- [tanstack-start.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/tanstack-start.md): Route-module, provider-boundary, and server/client separation standards for TanStack Start.
- [shadcn.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/shadcn.md): Standards for owned shadcn source, 8bitcn registry usage, curated retro blocks/components, Radix accessibility, variants, and theme token usage.
- [convex.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/convex.md): Standards for schema design, function boundaries, generated clients, and indexing in `convex/`.
- [aspire.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/aspire.md): Standards for `devops/` AppHost orchestration, resource layering, endpoint wiring, and operational scripts.

## How To Use These Standards

- Must: treat every `Must` statement as merge-blocking unless a documented exception exists in the same change.
- Should: follow by default and justify deviations in code review.
- Avoid: use as a negative checklist during implementation and review.
- When multiple docs apply, obey the more specific document in addition to `shared.md`.

## Searchability

Every file in this folder includes frontmatter for ripgrep-based discovery.

Examples:

```bash
rg -n '^doc_type:' docs/codingstandards
rg -n 'stack:|keywords:|applies_to:' docs/codingstandards
rg -n '\\.test\\.(ts|tsx)$|test:e2e|Aspire.Hosting.Testing' docs/codingstandards
rg -n '8bitcn|main-menu|leaderboard|enemy-health-display' docs/codingstandards
rg -n 'VITE_CONVEX_URL|routeTree.gen|_generated|WaitFor' docs/codingstandards
rg -n '^## Rules|^## Avoid' docs/codingstandards
```

## Update Rule

Update these documents in the same change that introduces a new repo seam, changes an ownership boundary, or adds a new required workflow. If the code changes faster than the standards, the standards are stale.

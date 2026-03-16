---
title: Shared Coding Standards
description: Cross-cutting repository standards for TypeScript, generated files, environments, testing, accessibility, performance, and documentation upkeep.
doc_type: coding_standard
status: active
stack:
  - shared
  - typescript
  - tooling
applies_to:
  - src/
  - convex/
  - devops/
  - .vscode/
keywords:
  - typescript strictness
  - generated files
  - environment variables
  - testing
  - accessibility
  - performance
  - documentation
---

# Shared Standards

## Purpose

Define the repository-wide rules that apply across frontend code, Convex code, and Aspire orchestration.

## Rules

- Must keep TypeScript strict and treat type errors as design errors, not cleanup work for later.
- Must keep generated artifacts generated. `src/routeTree.gen.ts` and everything under `convex/_generated/` are outputs, not hand-edited sources.
- Must keep configuration ownership explicit. Browser-facing values belong in Vite or AppHost wiring, not ad hoc constants spread through `src/`.
- Must fail fast on missing required configuration, as `src/integrations/convex/provider.tsx` already does for `VITE_CONVEX_URL`.
- Must keep repo-local machine state out of versioned source unless the repository intentionally uses it as source. Local build outputs, generated metadata, and secret-bearing env files stay ignored.
- Must keep accessibility part of the default implementation path. Semantic HTML, keyboard reachability, visible focus treatment, and label relationships are not optional extras.
- Must keep performance decisions structural first: reduce unnecessary effects, unnecessary client work, and unnecessary provider churn before adding micro-optimizations.
- Must add or update tests when behavior changes and follow [testing.md](/home/chris/dev/personal/boss-battle/docs/codingstandards/testing.md).
- Must update these docs when a new boundary, workflow, or ownership rule becomes part of normal development.

## Preferred Patterns

- Prefer narrow ownership boundaries: route files own route concerns, provider modules own provider construction, Convex modules own data access, and `devops/` owns orchestration.
- Prefer named exports for application modules so ownership and imports stay explicit.
- Prefer environment propagation through AppHost resources into the web app over direct duplication of values in multiple places.
- Prefer token-driven styling from `src/styles.css` over hard-coded color literals in TSX.
- Prefer small, reviewable changes that keep generated files reproducible.

## Avoid

- Avoid editing generated files to get around build or type issues.
- Avoid storing secrets or machine-specific credentials in committed `.env.*` files.
- Avoid introducing new global singletons in random modules when a boundary module already exists.
- Avoid accepting TODO-driven correctness gaps in accessibility or configuration handling.
- Avoid treating missing tests as permission to skip future tests.

## Repo Notes

- `biome.jsonc` already encodes part of this policy by excluding generated artifacts and enforcing naming, import, and `noExplicitAny` rules.
- `.gitignore` treats `.aspire/`, `.wrangler/`, `src/routeTree.gen.ts`, `devops/bin/`, `devops/obj/`, and `convex/_generated/` as generated or local state.
- `src/routeTree.gen.ts` is referenced by `src/router.tsx`, so route changes must regenerate it rather than patch it by hand.
- `pnpm test` is now expected to stay Docker-free, while `pnpm test:e2e` is the slow Aspire-backed path.

---
title: Convex Coding Standards
description: Repository policy for Convex schema design, function boundaries, generated clients, validation, and indexing.
doc_type: coding_standard
status: active
stack:
  - convex
  - react
  - tanstack-query
applies_to:
  - convex/
  - src/integrations/convex/
  - devops/convex/
keywords:
  - convex schema
  - validators
  - query mutation action
  - generated client
  - indexes
  - data model
---

# Convex Standards

## Purpose

Define how this repo should model data and use Convex across schema, generated clients, and React integration.

## Rules

- Must treat `convex/schema.js` as the source of truth for the data model.
- Must define validators deliberately for public function arguments and stored document shapes. Validator-first APIs are easier to evolve safely than implicit payload contracts.
- Must choose the right function type: queries for reads, mutations for transactional writes, and actions only for non-transactional or external-system work.
- Must keep indexes aligned with real query patterns before data volume makes missing indexes a production problem.
- Must use generated Convex clients and server helpers instead of handwritten protocol calls.
- Must never manually edit anything under `convex/_generated/`.
- Must keep frontend integration with Convex routed through `src/integrations/convex/provider.tsx` unless a new boundary is explicitly introduced.
- Must keep fast tests off the live Convex backend. Browser checks that prove Convex wiring through Aspire belong in the AppHost smoke suite.

## Preferred Patterns

- Prefer small domain-focused Convex modules over one large catch-all file.
- Prefer explicit naming that reflects domain behavior rather than transport behavior.
- Prefer query shapes that match the UI need instead of returning oversized documents and trimming them in React.
- Prefer adding schema and indexes in the same change as the first real query or mutation that depends on them.
- Prefer keeping self-hosted operational wiring in `devops/convex/` and `devops/scripts/`, not inside application components.

## Avoid

- Avoid actions when a mutation or query can do the job.
- Avoid schema drift where frontend assumptions change without corresponding `convex/schema.js` updates.
- Avoid bypassing generated APIs with ad hoc fetch calls.
- Avoid storing unvalidated free-form blobs when a structured document is known.
- Avoid checking in regenerated `_generated` churn as if it were hand-authored logic.

## Repo Notes

- `convex/schema.js` is intentionally empty right now. That is a starting state, not a pattern for shipping features without schema.
- `src/integrations/convex/provider.tsx` already enforces a required backend URL through `VITE_CONVEX_URL`.
- `devops/convex/.env.self-hosted.local` is operational state for the self-hosted setup and should stay out of normal source changes.
- Convex integration breakage should be caught with both fast frontend tests around callers and the Aspire smoke suite around startup wiring.

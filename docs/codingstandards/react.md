---
title: React Coding Standards
description: Repository policy for React components, hooks, state ownership, effects, composition, and testability in src/.
doc_type: coding_standard
status: active
stack:
  - react
  - tanstack-query
  - typescript
applies_to:
  - src/
  - src/components/
  - src/integrations/
  - src/routes/
keywords:
  - component purity
  - hooks
  - effects
  - state ownership
  - composition
  - tanstack query
  - testability
---

# React Standards

## Purpose

Define how React code in `src/` should manage rendering, state, effects, and composition.

## Rules

- Must keep components pure during render. Render must derive UI from props, route context, and state without causing side effects.
- Must keep state as close as possible to the code that owns it. Do not hoist state to `__root.tsx` or provider layers unless multiple routes or broad app shell concerns truly need it.
- Must treat effects as integration points with external systems, not as a substitute for normal render logic or event handling.
- Must keep hooks unconditional and top-level. If a hook should only run in one scenario, the component boundary is wrong.
- Must use composition before prop-drilling multiple unrelated control props through several layers.
- Must keep provider creation boundaries stable. `src/integrations/tanstack-query/root-provider.tsx` owns `QueryClient` construction, and `src/integrations/convex/provider.tsx` owns the Convex client wrapper.
- Must keep React Query usage aligned with route and provider ownership. Query clients are created once per app context, not inside leaf components.
- Must make components testable by separating display logic from integration-heavy setup when behavior gets non-trivial.
- Must keep React unit and component tests in colocated `*.test.tsx` files and use the shared helpers in `src/test/` when they fit.

## Preferred Patterns

- Prefer route-level data and context boundaries over app-wide state for page-specific behavior.
- Prefer presentational components with explicit props for reusable UI sections like the `StatusCard` pattern in `src/routes/index.tsx`.
- Prefer deriving transient UI from props or local state instead of mirroring values through effects.
- Prefer custom hooks only when they encapsulate one clear integration or state concern.
- Prefer event handlers over effects for user-driven transitions.

## Avoid

- Avoid performing data writes, router mutations, or client construction during render.
- Avoid effect chains that copy values from props to state and then from state to more state.
- Avoid hiding ownership by importing provider internals directly into unrelated components.
- Avoid passing route-only data deep into generic shadcn primitives.
- Avoid default exports for new React modules in this repo.

## Repo Notes

- `src/routes/__root.tsx` is the shell boundary. Keep long-lived providers and document-level UI there, not page-specific business state.
- `src/routes/index.tsx` currently acts as the canonical example of a simple file route with local presentational composition.
- `src/integrations/tanstack-query/root-provider.tsx` and `src/integrations/convex/provider.tsx` are the current ownership seams for data providers. Preserve those seams when adding features.
- Route component tests should verify rendered contract without booting the full AppHost. Browser-level coverage belongs in the Aspire suite.

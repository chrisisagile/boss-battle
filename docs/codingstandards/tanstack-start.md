---
title: TanStack Start Coding Standards
description: Repository policy for TanStack Start route files, server-client boundaries, generated routing artifacts, and provider placement.
doc_type: coding_standard
status: active
stack:
  - tanstack-start
  - tanstack-router
  - react
applies_to:
  - src/routes/
  - src/router.tsx
  - src/routeTree.gen.ts
  - src/integrations/tanstack-query/
keywords:
  - file based routing
  - route modules
  - server functions
  - loaders
  - route tree
  - provider boundaries
  - client server separation
---

# TanStack Start Standards

## Purpose

Define how this repo uses TanStack Start for route ownership, data loading boundaries, and server versus client execution.

## Rules

- Must treat each file in `src/routes/` as the ownership boundary for one route module.
- Must keep route modules focused on route concerns: route definition, route-scoped data loading, metadata, and composition of page sections.
- Must keep shared providers outside leaf routes unless a provider is genuinely route-scoped.
- Must keep server-only code on the server side. Do not import server functions, Node-only modules, or secret-dependent code into client-rendered components.
- Must use server functions or loaders when data access needs server execution, secrets, or request-specific work.
- Must regenerate `src/routeTree.gen.ts` from the router toolchain when routes change. Never hand-edit it.
- Must keep file names and folder layout aligned with TanStack Router file-based routing so route ownership remains obvious in review.
- Must keep route-level unit tests focused on route modules and page contracts; AppHost and browser integration checks belong in `devops/tests/`.

## Preferred Patterns

- Prefer route-local composition in `src/routes/*.tsx` and extract shared UI only after a real reuse point exists.
- Prefer root-level providers in `src/routes/__root.tsx` when all routes need the same clients, shells, or global document setup.
- Prefer loaders or server functions for work that should not be repeated in client effects.
- Prefer thin route modules that delegate reusable UI to `src/components/` and integration setup to `src/integrations/`.
- Prefer explicit route context, like the `queryClient` context in `src/routes/__root.tsx`, over hidden ambient assumptions.

## Avoid

- Avoid putting route-only behavior into `src/router.tsx`.
- Avoid importing generated `src/routeTree.gen.ts` anywhere except the router setup that needs it.
- Avoid mixing browser-only and server-only dependencies in the same module.
- Avoid creating `QueryClient` or other long-lived providers inside route components.
- Avoid treating server functions as generic utility wrappers when plain shared functions would do.

## Repo Notes

- `src/router.tsx` consumes the generated route tree and should stay thin.
- `src/routes/__root.tsx` owns the document shell, CSS link injection, and shared provider mounting.
- `src/routes/demo/` still exists as a directory seam to watch during cleanup or future route work. Do not rebuild demo-style routes as the default application pattern.
- Export named page components from route files when that keeps unit testing straightforward without weakening route ownership.
- Prefix route-adjacent test files with `-` so TanStack Router ignores them during route tree generation.

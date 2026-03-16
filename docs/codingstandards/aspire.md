---
title: Aspire AppHost Coding Standards
description: Repository policy for Aspire AppHost orchestration, resource layering, environment wiring, dependencies, and scripts in devops/.
doc_type: coding_standard
status: active
stack:
  - aspire
  - csharp
  - apphost
  - devops
applies_to:
  - devops/
  - devops/scripts/
  - devops/convex/
keywords:
  - aspire
  - apphost
  - orchestration
  - resource references
  - environment wiring
  - waitfor
  - scripts
---

# Aspire Standards

## Purpose

Define how `devops/` should orchestrate the local application graph without becoming a second home for application logic.

## Rules

- Must keep the AppHost as orchestration code, not business logic.
- Must split resource concerns into focused layer classes, following the current separation between `ConvexLayer`, `WebAppLayer`, and `DeployPipeline`.
- Must wire endpoints and environment values through Aspire resource references when one resource depends on another.
- Must make startup dependencies explicit with resource relationships such as `WaitFor`.
- Must keep scripts operational and idempotent. Re-running `devops/scripts/*.sh` should converge on the desired state rather than require manual cleanup.
- Must keep path discovery centralized instead of scattering relative path assumptions across multiple files.
- Must keep deploy-time logic and run-mode logic separated, as `devops/Program.cs` does today.
- Must keep browser smoke and E2E tests under `devops/tests/` using Aspire’s testing host, not separate process orchestration.

## Preferred Patterns

- Prefer one class per orchestration concern.
- Prefer `WithEnvironment` fed by endpoint references instead of hard-coded localhost strings.
- Prefer executable resources for external tooling that already exists as scripts.
- Prefer clear failure messages when prerequisite files such as generated Convex env state are missing.
- Prefer keeping Convex-specific orchestration in `ConvexLayer.cs` and browser app orchestration in `WebAppLayer.cs`.

## Avoid

- Avoid embedding app-domain rules in AppHost code.
- Avoid duplicating path resolution logic when `AppHostPaths` or `RepoRootLocator` can own it.
- Avoid hidden startup ordering that relies on timing instead of declared dependencies.
- Avoid scripts that mutate local state differently on every run.
- Avoid putting source-of-truth environment values in both `devops/` and `src/` when Aspire can inject them.

## Repo Notes

- `devops/Program.cs` should stay small and orchestration-focused.
- `devops/ConvexLayer.cs` already demonstrates the expected pattern for resource creation, endpoint naming, environment injection, and dependency declaration.
- `devops/WebAppLayer.cs` is the current seam for web-specific env wiring, including `VITE_CONVEX_URL`.
- `devops/vite-env/.gitkeep` indicates that generated env handoff has a dedicated location. Preserve that boundary instead of inventing parallel handoff paths.
- `devops/tests/` is the correct home for AppHost smoke tests that validate the full graph, including Convex startup and frontend reachability.

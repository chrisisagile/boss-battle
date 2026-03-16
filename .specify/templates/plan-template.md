# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, or NEEDS CLARIFICATION  
**Primary Dependencies**: TanStack Start, TanStack Router, TanStack Query, Tailwind CSS v4, Convex, Cloudflare/Wrangler, or NEEDS CLARIFICATION  
**Storage**: Convex and browser-managed client state, or NEEDS CLARIFICATION  
**Testing**: Vitest, Testing Library, and focused integration checks, or NEEDS CLARIFICATION  
**Target Platform**: Cloudflare-hosted web application for modern browsers  
**Project Type**: Full-stack web app  
**Performance Goals**: [Route-specific UX and latency targets or NEEDS CLARIFICATION]  
**Constraints**: [SSR/streaming, bundle, runtime, or dependency constraints]  
**Scale/Scope**: [User story count, routes touched, data contracts affected]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Scope is captured as independently testable user stories with acceptance
      scenarios and measurable success criteria.
- [ ] Runtime boundaries are identified: route params, search params, forms,
      server functions, Convex calls, env/config, and any external APIs.
- [ ] Validation strategy is explicit for every untrusted input and no new
      unchecked `any` or silent fallback is required.
- [ ] Test plan covers the narrowest useful automated tests for every changed
      behavior and names the verification commands to run.
- [ ] Loading, empty, success, and error states are defined for each affected
      user-facing flow.
- [ ] Observability and performance impact are addressed for SSR, streaming,
      bundle size, or network round trips when applicable.
- [ ] Cloudflare, Convex, and `pnpm` workflow compatibility is preserved or the
      deviation is justified below.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
├── data/
├── integrations/
├── routes/
├── styles.css
├── router.tsx
└── routeTree.gen.ts

public/
tests/
├── integration/
└── unit/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

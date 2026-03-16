## Boss Battle

This repo is a stripped-down TanStack Start base with Convex still wired in.
The demo routes, mock data, and fake todo example are removed, but the Convex
provider, AppHost integration, and self-hosted sync flow remain so you can
build against a real backend immediately.

## Run locally

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Aspire AppHost, provisions the self-hosted Convex stack,
runs `convex dev`, and starts the frontend Vite watcher. If you only want the
frontend server, use `pnpm run dev:web`.

## Build and test

```bash
pnpm build
pnpm test
pnpm test:watch
pnpm test:e2e:install
pnpm test:e2e
pnpm test:all
```

`pnpm test` runs the fast Vitest and Testing Library suite only. It should stay
Docker-free and deterministic. `pnpm test:e2e` runs the Aspire-backed browser
smoke suite from `devops/tests/` against the full AppHost graph, including the
self-hosted Convex stack. `pnpm test:watch` keeps the fast suite running during
frontend development, and `pnpm test:all` runs the full fast-plus-E2E path.

Before running `pnpm test:e2e`, make sure:

- Docker is available for the self-hosted Convex containers
- the .NET and Aspire toolchain is installed
- Playwright browsers are installed with `pnpm test:e2e:install`

## Current shape

- `src/routes/__root.tsx` defines the app shell and wraps the app with TanStack Query and Convex providers.
- `src/routes/index.tsx` is the only route and the current starting page.
- `convex/schema.js` is intentionally empty so you can add real tables and functions from scratch.
- `devops/` still contains the AppHost and Convex orchestration for local development and deploys.

## Next step

Start adding real routes, Convex schema, queries, and mutations without having
to unwind starter-demo code first.

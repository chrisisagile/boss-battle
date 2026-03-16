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
```

## Current shape

- `src/routes/__root.tsx` defines the app shell and wraps the app with TanStack Query and Convex providers.
- `src/routes/index.tsx` is the only route and the current starting page.
- `convex/schema.js` is intentionally empty so you can add real tables and functions from scratch.
- `devops/` still contains the AppHost and Convex orchestration for local development and deploys.

## Next step

Start adding real routes, Convex schema, queries, and mutations without having
to unwind starter-demo code first.

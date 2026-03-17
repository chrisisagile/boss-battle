#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
env_file="$repo_root/devops/convex/.env.self-hosted.local"

cd "$repo_root"

if [[ -f "$env_file" ]]; then
  echo "Validating Convex source against the self-hosted development backend..."
  exec pnpm exec convex dev --once --tail-logs disable --env-file "$env_file"
fi

if [[ -n "${CONVEX_DEPLOYMENT:-}" || -n "${CONVEX_SELF_HOSTED_URL:-}" ]]; then
  echo "Validating Convex source against the configured Convex environment..."
  exec pnpm exec convex dev --once --tail-logs disable
fi

cat >&2 <<'EOF'
Convex validation could not start because no deployment context is configured.

Build now validates Convex before bundling the frontend. Provide one of:
- run `pnpm dev` once so `devops/convex/.env.self-hosted.local` is generated
- export `CONVEX_DEPLOYMENT`
- export `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY`
EOF
exit 1

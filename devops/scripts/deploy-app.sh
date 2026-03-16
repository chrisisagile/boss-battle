#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:?repo root is required}"
env_file="${2:?env file is required}"

cd "$repo_root"
exec pnpm exec convex deploy \
  --yes \
  --cmd "pnpm run deploy" \
  --cmd-url-env-var-name VITE_CONVEX_URL \
  --env-file "$env_file"

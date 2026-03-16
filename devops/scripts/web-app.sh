#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:?repo root is required}"
port="${PORT:?PORT is required}"

cd "$repo_root"
exec pnpm exec vite dev --host 127.0.0.1 --port "$port"

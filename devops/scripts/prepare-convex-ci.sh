#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
convex_root="$repo_root/devops/convex"
compose_file="$convex_root/docker-compose.yml"
override_file="$repo_root/devops/convex-dashboard.compose.override.yml"
env_file="$convex_root/.env.self-hosted.local"
backend_url="${CONVEX_SELF_HOSTED_URL:-http://127.0.0.1:3210}"

mkdir -p "$convex_root"

if [[ ! -f "$compose_file" ]]; then
  curl \
    --fail \
    --location \
    --output "$compose_file" \
    https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml
fi

cd "$convex_root"

compose_files=(-f "$compose_file")
if [[ -f "$override_file" ]]; then
  compose_files+=(-f "$override_file")
fi

docker compose "${compose_files[@]}" pull
docker compose "${compose_files[@]}" up -d

wait_for_backend() {
  local attempts=0
  until curl --fail --silent "$backend_url/version" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 60 ]]; then
      echo "Timed out waiting for Convex backend at $backend_url" >&2
      exit 1
    fi
    sleep 2
  done
}

extract_admin_key() {
  docker compose "${compose_files[@]}" exec -T backend sh -lc "/convex/generate_admin_key.sh" 2>/dev/null \
    | awk 'NF && $0 !~ /^Admin key:/ { print; exit }'
}

wait_for_admin_key() {
  local attempts=0
  local admin_key=""

  until [[ -n "$admin_key" ]]; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 60 ]]; then
      echo "Timed out waiting for Convex admin key." >&2
      exit 1
    fi

    admin_key="$(extract_admin_key)"
    if [[ -z "$admin_key" ]]; then
      sleep 2
    fi
  done

  printf '%s' "$admin_key"
}

wait_for_backend
admin_key="$(wait_for_admin_key)"

cat >"$env_file" <<EOF
CONVEX_SELF_HOSTED_URL=$backend_url
CONVEX_SELF_HOSTED_ADMIN_KEY=$admin_key
EOF

cd "$repo_root"
pnpm exec convex dev --once --tail-logs disable --env-file "$env_file"

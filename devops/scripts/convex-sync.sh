#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:?repo root is required}"
convex_root="${2:?convex root is required}"
env_file="${3:?env file is required}"

compose_file="$convex_root/docker-compose.yml"
backend_url="${CONVEX_SELF_HOSTED_URL:?CONVEX_SELF_HOSTED_URL is required}"

if [[ ! -f "$compose_file" ]]; then
  echo "Convex compose file not found at $compose_file" >&2
  exit 1
fi

cd "$convex_root"

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
  docker compose logs backend \
    | sed -n "s/.*CONVEX_SELF_HOSTED_ADMIN_KEY=\\([^[:space:]]*\\).*/\\1/p" \
    | tail -n 1
}

wait_for_admin_key() {
  local attempts=0
  local admin_key=""

  until [[ -n "$admin_key" ]]; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 60 ]]; then
      echo "Timed out waiting for Convex admin key in backend logs." >&2
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
exec pnpm exec convex dev --env-file "$env_file"

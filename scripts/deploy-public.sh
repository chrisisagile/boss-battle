#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
local_convex_env_file="$repo_root/devops/convex/.env.self-hosted.local"
local_convex_compose_file="$repo_root/devops/convex/docker-compose.yml"
local_convex_compose_override_file="$repo_root/devops/convex-dashboard.compose.override.yml"
snapshot_dir="$repo_root/.tmp/convex-deploy"
snapshot_path="$snapshot_dir/local-convex-snapshot.zip"
target_convex_url="${TARGET_CONVEX_URL:-https://rosy-sturgeon-572.convex.cloud/}"
local_convex_url=""
local_convex_admin_key=""
local_convex_port=""
local_convex_site_proxy_port=""

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_env_var() {
  local variable_name="$1"

  if [[ -z "${!variable_name:-}" ]]; then
    echo "Missing required environment variable: $variable_name" >&2
    exit 1
  fi
}

assert_file_exists() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    echo "Required file not found: $file_path" >&2
    exit 1
  fi
}

read_dotenv_value() {
  local variable_name="$1"
  local line

  line="$(grep -E "^${variable_name}=" "$local_convex_env_file" | tail -n 1 || true)"

  if [[ -z "$line" ]]; then
    echo "Missing $variable_name in $local_convex_env_file" >&2
    exit 1
  fi

  printf '%s' "${line#*=}"
}

load_local_convex_env() {
  local_convex_url="$(read_dotenv_value "CONVEX_SELF_HOSTED_URL")"
  local_convex_admin_key="$(read_dotenv_value "CONVEX_SELF_HOSTED_ADMIN_KEY")"
  local_convex_port="$(printf '%s' "$local_convex_url" | sed -E 's#^https?://[^:/]+:([0-9]+).*$#\1#')"
  local_convex_site_proxy_port="$((local_convex_port + 1))"
}

wait_for_local_convex() {
  local attempts=0

  until curl --fail --silent "${local_convex_url}/version" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 30 ]]; then
      return 1
    fi
    sleep 2
  done
}

start_local_convex_backend() {
  local -a compose_args

  assert_file_exists "$local_convex_compose_file"
  require_command docker

  compose_args=(-f "$local_convex_compose_file")
  if [[ -f "$local_convex_compose_override_file" ]]; then
    compose_args+=(-f "$local_convex_compose_override_file")
  fi

  print_step "Starting the local self-hosted Convex backend"
  (
    cd "$repo_root/devops/convex"
    PORT="$local_convex_port" \
      SITE_PROXY_PORT="$local_convex_site_proxy_port" \
      CONVEX_SELF_HOSTED_URL="$local_convex_url" \
      CONVEX_SELF_HOSTED_ADMIN_KEY="$local_convex_admin_key" \
      docker compose "${compose_args[@]}" up -d backend
  )
}

ensure_local_convex_ready() {
  if wait_for_local_convex; then
    return
  fi

  start_local_convex_backend

  if wait_for_local_convex; then
    return
  fi

  cat >&2 <<EOF
Local self-hosted Convex is not reachable with $local_convex_env_file.

The deploy script tried to start the backend automatically and it still did not
become ready at:
  $local_convex_url

Check Docker and the Convex container logs, then retry:
  docker compose -f devops/convex/docker-compose.yml ps
  docker compose -f devops/convex/docker-compose.yml logs backend
EOF
  exit 1
}

run_local_convex_export() {
  rm -f "$snapshot_path"

  env -u CONVEX_DEPLOY_KEY \
    CONVEX_SELF_HOSTED_URL="$local_convex_url" \
    CONVEX_SELF_HOSTED_ADMIN_KEY="$local_convex_admin_key" \
    pnpm exec convex export --path "$snapshot_path"
}

print_step() {
  echo
  echo "==> $1"
}

require_command pnpm
require_command curl
require_env_var CONVEX_DEPLOY_KEY
assert_file_exists "$local_convex_env_file"
load_local_convex_env
ensure_local_convex_ready

mkdir -p "$snapshot_dir"

cd "$repo_root"

print_step "Deploying Convex schema and functions to $target_convex_url"
pnpm exec convex deploy --yes

print_step "Exporting data from the local self-hosted Convex deployment"
run_local_convex_export

print_step "Importing local data into $target_convex_url"
pnpm exec convex import --replace-all --yes "$snapshot_path"

print_step "Publishing the public frontend with Cloudflare Workers"
pnpm exec convex deploy \
  --yes \
  --cmd "pnpm exec vite build && pnpm exec wrangler deploy" \
  --cmd-url-env-var-name VITE_CONVEX_URL

cat <<EOF

Deployment finished.

- Convex target: $target_convex_url
- Snapshot imported from: $snapshot_path
- Frontend publish command: pnpm exec vite build && pnpm exec wrangler deploy
EOF

#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
local_convex_env_file="$repo_root/devops/convex/.env.self-hosted.local"
snapshot_dir="$repo_root/.tmp/convex-deploy"
snapshot_path="$snapshot_dir/local-convex-snapshot.zip"
target_convex_url="${TARGET_CONVEX_URL:-https://rosy-sturgeon-572.convex.cloud/}"
local_convex_url=""
local_convex_admin_key=""

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
}

assert_local_convex_ready() {
  if ! curl --fail --silent "${local_convex_url}/version" >/dev/null; then
    cat >&2 <<EOF
Local self-hosted Convex is not reachable with $local_convex_env_file.

Start the local stack first with:
  pnpm dev
EOF
    exit 1
  fi
}

run_local_convex_export() {
  rm -f "$snapshot_path"

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
assert_local_convex_ready

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
  --cmd "pnpm run deploy" \
  --cmd-url-env-var-name VITE_CONVEX_URL

cat <<EOF

Deployment finished.

- Convex target: $target_convex_url
- Snapshot imported from: $snapshot_path
- Frontend publish command: pnpm run deploy
EOF

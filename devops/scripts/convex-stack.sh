#!/usr/bin/env bash
set -euo pipefail

convex_root="${1:?convex root is required}"

if [[ "${2:-}" == "up" || "${2:-}" == "down" || "${2:-}" == "config" || "${2:-}" == "pull" ]]; then
  env_file="$convex_root/.env.self-hosted.local"
  override_file="$(cd "$convex_root/.." && pwd)/convex-dashboard.compose.override.yml"
  compose_action="${2:?compose action is required}"
else
  env_file="${2:?env file is required}"
  override_file="${3:?compose override file is required}"
  compose_action="${4:?compose action is required}"
fi

compose_file="$convex_root/docker-compose.yml"

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

compose_args=()
if [[ -f "$env_file" ]]; then
  compose_args+=(--env-file "$env_file")
fi

docker compose "${compose_files[@]}" "${compose_args[@]}" pull
exec docker compose "${compose_files[@]}" "${compose_args[@]}" "$compose_action"

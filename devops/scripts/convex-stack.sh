#!/usr/bin/env bash
set -euo pipefail

convex_root="${1:?convex root is required}"
compose_action="${2:?compose action is required}"

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
docker compose pull
exec docker compose "$compose_action"

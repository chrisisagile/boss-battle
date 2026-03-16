#!/usr/bin/env bash
set -euo pipefail

project_path="devops/tests/BossBattle.AppHost.Tests/BossBattle.AppHost.Tests.csproj"
output_dir="devops/tests/BossBattle.AppHost.Tests/bin/Debug/net10.0"

dotnet build "$project_path"
node "$output_dir/.playwright/package/cli.js" install chromium

#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd
run pnpm exec concurrently -k -n web,desktop -c blue,green "pnpm --filter @sentinel/webapp run dev" "pnpm --filter @sentinel/desktopapp run tauri:dev"

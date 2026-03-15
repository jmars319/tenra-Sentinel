#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd
run pnpm run lint
run pnpm run typecheck
run ./scripts/verify-web.sh
run ./scripts/verify-desktop.sh
run ./scripts/verify-mobile.sh

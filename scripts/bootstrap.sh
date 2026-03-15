#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd

run ./scripts/check-env.sh
run ./scripts/check-packages.sh
run pnpm install
run ./scripts/verify-all.sh

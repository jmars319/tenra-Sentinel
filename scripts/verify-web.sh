#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd
run pnpm --filter @sentinel/webapp run typecheck
run pnpm --filter @sentinel/webapp run build

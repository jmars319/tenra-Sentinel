#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd
run pnpm --filter @sentinel/mobileapp run dev

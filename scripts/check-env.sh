#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd

require_command node
require_command pnpm

NODE_VERSION="$(node -v)"
PNPM_VERSION="$(pnpm -v)"

log "node ${NODE_VERSION}"
log "pnpm ${PNPM_VERSION}"

if command -v rustc >/dev/null 2>&1 && command -v cargo >/dev/null 2>&1; then
  log "$(rustc --version)"
  log "$(cargo --version)"
else
  log "rust/cargo not found; web and mobile workflows remain available, desktop verification will be limited"
fi

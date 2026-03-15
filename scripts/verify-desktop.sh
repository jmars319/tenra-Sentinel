#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd
run pnpm --filter @sentinel/desktopapp run typecheck
run pnpm --filter @sentinel/desktopapp run build

if command -v cargo >/dev/null 2>&1; then
  run cargo check --manifest-path apps/desktopapp/src-tauri/Cargo.toml
else
  log "cargo not found; skipping Rust-side verification"
fi

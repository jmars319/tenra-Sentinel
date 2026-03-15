#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf '[sentinel] %s\n' "$*"
}

fail() {
  printf '[sentinel] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
  fi
}

run() {
  log "$*"
  "$@"
}

repo_cd() {
  cd "$REPO_ROOT"
}

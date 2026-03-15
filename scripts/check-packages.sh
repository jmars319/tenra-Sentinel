#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_common.sh"

repo_cd

required_paths=(
  "apps/webapp/package.json"
  "apps/desktopapp/package.json"
  "apps/mobileapp/package.json"
  "packages/shared-types/package.json"
  "packages/domain/package.json"
  "packages/api-contracts/package.json"
  "packages/validation/package.json"
  "packages/realtime/package.json"
  "packages/auth/package.json"
  "packages/geo/package.json"
  "packages/privacy/package.json"
  "packages/ui/package.json"
  "packages/config/package.json"
  "docs/DEVELOPER_GUIDE.md"
  "docs/REPO_MAP.md"
  "docs/STABILITY_CHECKLIST.md"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    fail "Missing required path: $path"
  fi
done

log "workspace structure is present"

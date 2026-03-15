# Sentinel Developer Guide

## Bootstrap

From the repo root:

```bash
pnpm run bootstrap
```

Bootstrap checks the local toolchain, verifies the expected workspace layout, installs
dependencies, and runs the full verification flow.

## Running apps

Use the root scripts so each app starts through the same predictable entry point:

```bash
pnpm run dev:web
pnpm run dev:desktop
pnpm run dev:mobile
pnpm run dev:both
```

`dev:both` starts the web app and the desktop shell together. The web app is the primary
early product surface.

## Verifying the workspace

```bash
pnpm run verify:web
pnpm run verify:desktop
pnpm run verify:mobile
pnpm run verify:all
pnpm run doctor
```

`doctor` is the broader health check: environment, workspace structure, lint, typecheck,
and app build validation.

## Shared-domain-first architecture

Sentinel is intentionally organized around packages before app features:

- `@sentinel/shared-types` holds basic cross-cutting types like confidence, risk level,
  timestamps, and source identifiers.
- `@sentinel/domain` holds core concepts such as signals, evidence, assessments, and lookup
  lifecycle types.
- `@sentinel/api-contracts` defines request and response shapes used by app boundaries.
- `@sentinel/validation` provides runtime validation for contracts and domain payloads.
- `@sentinel/privacy` centralizes redaction-safe output handling.

The apps should remain thin. New domain logic should land in a package first, then the app
should consume it.

## Adding packages or apps

When adding a new package:

1. Create a new folder under `packages/`.
2. Use the `@sentinel/...` naming pattern.
3. Add a `package.json`, `tsconfig.json`, and `src/index.ts`.
4. Update `docs/REPO_MAP.md` if the new package changes the repo shape.

When adding a new app:

1. Create a folder under `apps/`.
2. Keep business logic in packages unless it is purely UI or platform glue.
3. Add root scripts only if the new app needs a standard daily workflow command.

## Practical Sentinel guidance

- Avoid binary certainty in new assessment models.
- Preserve source provenance in any new enrichment pipeline.
- Add validation alongside new contracts, not after.
- Prefer boring, observable workflows over speculative automation.

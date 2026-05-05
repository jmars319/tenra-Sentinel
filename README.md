# tenra Sentinel

tenra Sentinel is an explainable signal-aggregation engine that synthesizes fragmented data
sources into calm, confidence-weighted risk assessments.

It is not a blocker, not a search engine, and not an AI oracle. The intended role is a
reasoning layer: gather signals, preserve evidence and provenance, weigh uncertainty, and
return structured assessments that are understandable enough to inspect.

The first concrete use case is suspicious phone-number lookup. The product direction is
desktop-first, with web second for hosted/API review surfaces and mobile third for later
lightweight review.

## Repo structure

```text
apps/
  desktopapp/   Primary Tauri operator surface
  webapp/       Secondary hosted/API review surface
  mobileapp/    Third-surface Expo scaffold for later lightweight review

packages/
  shared-types/ Cross-cutting primitive types
  domain/       Signals, evidence, assessments, job lifecycle
  api-contracts/ Shared request/response shapes
  validation/   Runtime schemas
  realtime/     Future lookup progress events
  auth/         Minimal auth/session models
  geo/          Future geographic clustering types
  privacy/      Redaction-safe helpers
  ui/           Shared presentation tokens
  config/       App identity and env helpers

scripts/        Bootstrap, dev, verify, doctor
docs/           Developer and repo documentation
archive/        Reserved for retired experiments
```

## Core commands

```bash
pnpm run bootstrap
pnpm run dev:web
pnpm run dev:desktop
pnpm run dev:mobile
pnpm run dev:both
pnpm run verify:all
pnpm run doctor
```

## Current product state

- The desktop app is the primary surface and now runs a local phone lookup/review desk with manual review signals, evidence weighting, saved history, and Markdown export.
- The web app boots with a tenra Sentinel-specific homepage and a phone lookup form shell.
- The web app exposes a placeholder `/api/lookup/phone` route using shared contracts and validation.
- The mobile app is a valid Expo shell kept intentionally minimal.
- Shared packages define the initial tenra Sentinel vocabulary so product logic can expand without
  bloating the app layers.

## Next reading

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Repo Map](docs/REPO_MAP.md)
- [Stability Checklist](docs/STABILITY_CHECKLIST.md)

# tenra Sentinel

tenra Sentinel is an explainable signal-aggregation system for turning fragmented evidence into confidence-weighted risk assessments. Its role is to gather signals, preserve provenance, expose uncertainty, and make assessments reviewable.

The first concrete use case is suspicious phone-number lookup. Sentinel is not a blocker, search engine, or AI oracle.

## Operational Purpose

- Collect and normalize risk signals from bounded sources.
- Preserve evidence and confidence instead of returning opaque labels.
- Give operators a review desk for manual signal interpretation.
- Keep assessment logic understandable enough to inspect and challenge.

## Design Posture

- Evidence, provenance, and uncertainty are product primitives.
- Desktop-first review workflow with web/API support.
- Local pattern review before broader provider integrations.
- Shared contracts define lookup and assessment behavior.
- Mobile remains a later lightweight review surface.

## Architecture

```text
apps/
  desktopapp/   Primary Tauri operator surface
  webapp/       Next.js hosted/API review surface
  mobileapp/    Expo scaffold for future lightweight review

packages/
  domain/       Signals, evidence, assessments, and job lifecycle
  api-contracts/ Shared request and response shapes
  validation/   Runtime schemas
  privacy/      Redaction-safe helpers
  realtime/     Future progress events
  ui/           Shared presentation primitives
  config/       Product identity and environment helpers
```

## Current State

- The desktop app runs a local phone lookup and review desk.
- The shared local pattern-review provider powers both desktop and web API behavior.
- The desktop app supports manual review signals, evidence weighting, saved history, Markdown export, and JSON import/export.
- The web app exposes a phone lookup form shell and `/api/lookup/phone`.
- The mobile app is a valid but intentionally minimal Expo shell.

## Deployment Posture

Sentinel is currently a local-first and development-stage assessment tool. Any live deployment should treat provider coverage, data retention, privacy, and false-positive handling as explicit product and operational decisions.

## Working Locally

```bash
pnpm run bootstrap
pnpm run dev:desktop
pnpm run dev:web
pnpm run verify:all
pnpm run doctor
```

Use `pnpm run dev:mobile` only when working on the scaffolded mobile surface.

## Direction

- Improve assessment vocabulary and evidence weighting.
- Add provider integrations only behind clear provenance boundaries.
- Keep human review available for ambiguous assessments.
- Build toward stable risk summaries without claiming certainty where the evidence is weak.

## Related Documentation

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Repo Map](docs/REPO_MAP.md)
- [Stability Checklist](docs/STABILITY_CHECKLIST.md)

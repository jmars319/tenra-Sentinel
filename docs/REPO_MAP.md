# Sentinel by Tenra Repo Map

## Apps

### `apps/desktopapp`

Primary Tauri operator surface. It now supports offline phone number-pattern review,
manual review signals, evidence weighting, saved lookup history, source posture review,
and Markdown export. Source administration, queue visibility, and environment controls
can build from this surface.

### `apps/webapp`

Secondary hosted/API review surface. Hosts the initial phone-number lookup experience,
the local pattern-review API route, and a reasoning-oriented UI for structured
assessments.

### `apps/mobileapp`

Third-surface Expo shell reserved for future mobile intake and lightweight review workflows.
Kept minimal until desktop and web workflows justify a concrete mobile use case.

## Packages

### `packages/shared-types`

Cross-cutting primitives used everywhere: IDs, timestamps, confidence scores, risk levels,
source identifiers, and target kinds.

### `packages/domain`

The heart of Sentinel by Tenra’s vocabulary: signals, evidence, source observations, reasoning
summaries, risk assessments, and lookup job state.

### `packages/api-contracts`

Shared request and response contracts for phone lookup and service health.

### `packages/validation`

Runtime validation schemas for the domain and API contracts.

### `packages/realtime`

Future-facing realtime event shapes for lookup progress and status changes.

### `packages/auth`

Minimal shared auth and session models for future app access control.

### `packages/geo`

Light geographic types for future scam clustering, area-code context, and regional signal
analysis.

### `packages/privacy`

Helpers and types for redaction-safe output and exposure posture.

### `packages/ui`

Small shared presentation tokens and risk-level display helpers. This should stay compact.

### `packages/config`

Shared app identity, environment keys, and simple config helpers.

## Supporting folders

### `scripts`

Shell entry points for bootstrap, verification, environment checks, and app startup.

### `docs`

Working documentation for developers and repo stability.

### `archive`

Intentional holding area for retired experiments or obsolete implementation snapshots.

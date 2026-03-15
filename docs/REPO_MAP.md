# Sentinel Repo Map

## Apps

### `apps/webapp`

Primary product surface. Hosts the initial phone-number lookup experience, the placeholder
API route, and the first reasoning-oriented UI for structured assessments.

### `apps/desktopapp`

Thin Tauri desktop shell intended for future operator workflows such as queue management,
assessment review, source administration, and environment controls.

### `apps/mobileapp`

Thin Expo mobile scaffold for future mobile intake and lightweight review workflows. Kept
minimal until a concrete mobile use case is defined.

## Packages

### `packages/shared-types`

Cross-cutting primitives used everywhere: IDs, timestamps, confidence scores, risk levels,
source identifiers, and target kinds.

### `packages/domain`

The heart of Sentinel’s vocabulary: signals, evidence, source observations, reasoning
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

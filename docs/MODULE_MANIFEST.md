# Module Manifest

Generated from `tenra Hub/contracts/handoff-catalog.json` by `tenra Hub/scripts/generate-suite-contract-docs.mjs`.

## Standalone Mode

Runs as a complete risk lookup and brief review app with local lookup state, risk briefs, outbound previews, and import error handling.

## Repository Path

`capabilities/risk/Sentinel by Tenra`

## Required Suite Dependencies

- None

## Optional Suite Dependencies

- tenra Derive: Optional reasoning consumer and source.
- tenra Guardrail: Optional risk review consumer.
- tenra Assembly: Optional risk-aware content drafting consumer.
- tenra Facet: Optional orientation packet source.

## Provides

- risk brief
- derive preview
- guardrail preview
- import error state

## Consumes

- orientation packet
- reasoning brief

## Contracts

Emits:

- `tenra-sentinel.risk-brief.v1`

Accepts:

- `tenra-facet.orientation-packet.v1`
- `tenra-derive.reasoning-brief.v1`
- `tenra-vicina.workflow-handoff.v1`

## Rules

- Each app must remain complete and usable without another tenra app running.
- Suite integrations are optional module links, not required runtime dependencies.
- Shared functions should be exposed through explicit local APIs, exports, imports, or schemas.
- No app may read another app's private filesystem, database, or localStorage state.
- Registry can index and audit the module graph, but it must not become a hidden runtime bus.

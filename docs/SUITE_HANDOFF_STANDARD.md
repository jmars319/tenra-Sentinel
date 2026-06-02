# Suite Handoff Standard

Generated from `tenra Hub/contracts/handoff-catalog.json` by `tenra Hub/scripts/generate-suite-contract-docs.mjs`.

## App Role

risk lookup and brief source

keep unique; emit risk briefs to Derive, Guardrail, and Assembly rather than duplicating lookup workflows.

## Standalone Mode

Runs as a complete risk lookup and brief review app with local lookup state, risk briefs, outbound previews, and import error handling.

## Repository Path

`capabilities/risk/Sentinel by Tenra`

## Accepted Inputs

- `tenra-facet.orientation-packet.v1` from tenra Facet
- `tenra-derive.reasoning-brief.v1` from tenra Derive
- `tenra-vicina.workflow-handoff.v1` from Vicina by tenra

## Emitted Outputs

- `tenra-sentinel.risk-brief.v1` to tenra Derive, tenra Guardrail, tenra Assembly

## Standard Controls

- schema badge
- preview payload
- version comparison
- history
- inline errors
- endpoint health
- retry failed
- payload inspection
- brief comparison
- workflow timeline

## Status Vocabulary

- `draft`: Payload or route exists locally but has not been previewed.
- `previewed`: Payload was built and inspected without delivery.
- `queued`: Delivery is waiting for an endpoint, retry, or operator action.
- `sent`: Producer posted or exported the payload successfully.
- `accepted`: Consumer parsed and retained the payload.
- `rejected`: Consumer refused the payload for schema, routing, safety, or policy reasons.
- `failed`: Delivery failed before acceptance or rejection was known.
- `replayed`: Registry or a producer regenerated a prior payload for another delivery attempt.
- `received`: Consumer acknowledged receipt back to the source app.
- `dismissed`: Operator intentionally removed an item from an inbox, queue, or retry list.

## Local Storage

Prefix: `tenra.sentinel`

- `tenra.sentinel.riskBriefHistory.v1`
- `tenra.sentinel.outboundPreview.v1`
- `tenra.sentinel.importErrors.v1`

## Endpoints

- No suite HTTP endpoint is documented for this app yet.

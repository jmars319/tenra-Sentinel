import type { EvidenceItem, LookupJob, RiskAssessment, SourceObservation } from "@sentinel/domain";
import type { IsoTimestamp } from "@sentinel/shared-types";

export interface PhoneLookupQuery {
  phoneNumber: string;
  regionHint?: string | undefined;
  includeEvidence?: boolean | undefined;
}

export interface LookupResultNotice {
  code: "placeholder-result" | "provider-not-configured" | "redacted-output";
  summary: string;
}

export interface PhoneLookupResult {
  job: LookupJob;
  query: {
    rawInput: string;
    normalizedPhoneNumber: string;
    maskedPhoneNumber: string;
    regionHint?: string | undefined;
  };
  assessment: RiskAssessment;
  evidence: EvidenceItem[];
  sourceSummaries: SourceObservation[];
  notices: LookupResultNotice[];
  generatedAt: IsoTimestamp;
}

export interface HealthStatusResponse {
  service: string;
  status: "ok" | "degraded" | "not-configured";
  timestamp: IsoTimestamp;
  notes: string[];
}

export type SentinelRiskBriefConsumer =
  | "derive"
  | "guardrail"
  | "assembly"
  | "manual";

export interface SentinelRiskBrief {
  schema: "tenra-sentinel.risk-brief.v1";
  exportedAt: IsoTimestamp;
  sourceApp: "sentinel";
  lookup: PhoneLookupResult;
  handoff: {
    questionForDerive: string;
    recommendedConsumers: SentinelRiskBriefConsumer[];
    actionPosture: "observe" | "review" | "limit" | "avoid" | "insufficient-signal";
  };
}

export interface SentinelGuardrailReviewRequest {
  schema: "tenra-guardrail.external-action-review.v1";
  exportedAt: IsoTimestamp;
  sourceApp: "sentinel";
  actionKind: "moderation-action";
  actorLabel: string;
  targetLabel: string;
  summary: string;
  evidence: Array<{
    label: string;
    value: string;
  }>;
  recommendedDecision: "allow" | "review" | "deny";
  traceId: string;
}

export function buildSentinelRiskBrief(input: {
  lookup: PhoneLookupResult;
  exportedAt?: IsoTimestamp | undefined;
  recommendedConsumers?: SentinelRiskBriefConsumer[] | undefined;
}): SentinelRiskBrief {
  return {
    schema: "tenra-sentinel.risk-brief.v1",
    exportedAt: input.exportedAt ?? input.lookup.generatedAt,
    sourceApp: "sentinel",
    lookup: input.lookup,
    handoff: {
      questionForDerive:
        "Given the Sentinel evidence and source posture, what can be concluded, what remains uncertain, and what action should a human reviewer take next?",
      recommendedConsumers: input.recommendedConsumers ?? ["derive", "guardrail"],
      actionPosture: input.lookup.assessment.posture
    }
  };
}

export function buildSentinelGuardrailReviewRequest(input: {
  brief: SentinelRiskBrief;
  exportedAt?: IsoTimestamp | undefined;
}): SentinelGuardrailReviewRequest {
  const { brief } = input;
  const decision =
    brief.handoff.actionPosture === "avoid" || brief.handoff.actionPosture === "limit"
      ? "deny"
      : "review";

  return {
    schema: "tenra-guardrail.external-action-review.v1",
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    sourceApp: "sentinel",
    actionKind: "moderation-action",
    actorLabel: "Sentinel risk workbench",
    targetLabel: brief.lookup.query.maskedPhoneNumber,
    summary: brief.lookup.assessment.reasoning.headline,
    evidence: [
      { label: "Risk level", value: brief.lookup.assessment.level },
      { label: "Action posture", value: brief.handoff.actionPosture },
      { label: "Confidence", value: brief.lookup.assessment.confidence.band.label },
      ...brief.lookup.evidence.slice(0, 6).map((item) => ({
        label: item.label,
        value: item.redactionSafeSummary
      }))
    ],
    recommendedDecision: decision,
    traceId: `sentinel-${brief.lookup.job.id}-guardrail`
  };
}

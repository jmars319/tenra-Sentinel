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

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

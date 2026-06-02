import type {
  ConfidenceBand,
  ConfidenceScore,
  EvidenceDirection,
  Id,
  IsoTimestamp,
  LookupTargetKind,
  RiskLevel,
  SourceId,
} from "@sentinel/shared-types";

export type SignalCategory = "reputation" | "pattern" | "history" | "network" | "manual" | "system";
export type SourceObservationStatus = "not-configured" | "available" | "degraded" | "complete";
export type LookupJobStatus = "queued" | "running" | "completed" | "failed" | "insufficient-signal";
export type RiskPosture = "observe" | "review" | "limit" | "avoid" | "insufficient-signal";

export interface Signal {
  id: Id;
  category: SignalCategory;
  sourceId: SourceId;
  summary: string;
  direction: EvidenceDirection;
  weight: number;
  confidence: ConfidenceScore;
  observedAt: IsoTimestamp;
}

export interface EvidenceItem {
  id: Id;
  label: string;
  summary: string;
  direction: EvidenceDirection;
  confidence: ConfidenceScore;
  sourceId: SourceId;
  observedAt: IsoTimestamp;
  redactionSafeSummary: string;
}

export interface SourceObservation {
  sourceId: SourceId;
  status: SourceObservationStatus;
  observedAt: IsoTimestamp;
  summary: string;
}

export interface ReasoningSummary {
  headline: string;
  narrative: string;
  factors: string[];
}

export interface ConfidenceAssessment {
  score: ConfidenceScore;
  band: ConfidenceBand;
  rationale: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  posture: RiskPosture;
  confidence: ConfidenceAssessment;
  reasoning: ReasoningSummary;
  evidence: EvidenceItem[];
  sources: SourceObservation[];
}

export interface LookupJob {
  id: Id;
  targetKind: LookupTargetKind;
  submittedAt: IsoTimestamp;
  status: LookupJobStatus;
  correlationKey: string;
}

export interface PhoneLookupRequest {
  rawInput: string;
  normalizedPhoneNumber: string;
  regionHint?: string | undefined;
  includeEvidence?: boolean | undefined;
  requestedAt: IsoTimestamp;
}

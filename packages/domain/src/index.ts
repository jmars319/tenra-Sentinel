import {
  clampConfidenceScore,
  confidenceBandFromScore,
  type ConfidenceBand,
  type ConfidenceScore,
  type EvidenceDirection,
  type Id,
  type IsoTimestamp,
  type LookupTargetKind,
  type RiskLevel,
  type SourceId
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

export const buildConfidenceAssessment = (
  score: number,
  rationale: string
): ConfidenceAssessment => {
  const normalized = clampConfidenceScore(score);

  return {
    score: normalized,
    band: {
      label: confidenceBandFromScore(normalized),
      value: normalized
    },
    rationale
  };
};

export const createInsufficientSignalAssessment = (input: {
  observedAt: IsoTimestamp;
  sources: SourceObservation[];
  evidence?: EvidenceItem[];
  note?: string;
}): RiskAssessment => {
  const evidence = input.evidence ?? [];
  const note =
    input.note ??
    "Sentinel has not gathered enough corroborated signals to move beyond a neutral, explainable placeholder assessment.";

  return {
    level: "unknown",
    posture: "insufficient-signal",
    confidence: buildConfidenceAssessment(
      0.16,
      "Confidence remains intentionally low until real source integrations are configured."
    ),
    reasoning: {
      headline: "Insufficient signal",
      narrative: note,
      factors: [
        "No live source providers are configured yet.",
        "The result is returned to validate the lookup flow, not to assert a verdict."
      ]
    },
    evidence,
    sources: input.sources
  };
};

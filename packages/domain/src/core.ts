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

export interface PhoneLookupRequest {
  rawInput: string;
  normalizedPhoneNumber: string;
  regionHint?: string | undefined;
  includeEvidence?: boolean | undefined;
  requestedAt: IsoTimestamp;
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

export const hasMeaningfulEvidence = (evidence: EvidenceItem[]): boolean =>
  evidence.some((item) => item.direction !== "context-only");

export const createEvidenceWeightedAssessment = (input: {
  evidence: EvidenceItem[];
  sources: SourceObservation[];
}): RiskAssessment => {
  const meaningfulEvidence = input.evidence.filter(
    (item) => item.direction !== "context-only"
  );

  if (meaningfulEvidence.length === 0) {
    return createInsufficientSignalAssessment({
      observedAt: new Date().toISOString(),
      sources: input.sources,
      evidence: input.evidence
    });
  }

  const weightedSignal = meaningfulEvidence.reduce((total, item) => {
    if (item.direction === "supports-risk") {
      return total + item.confidence;
    }

    return total - item.confidence;
  }, 0);
  const normalizedSignal = weightedSignal / meaningfulEvidence.length;
  const averageConfidence =
    meaningfulEvidence.reduce((total, item) => total + item.confidence, 0) /
    meaningfulEvidence.length;

  let level: RiskLevel = "low";
  let posture: RiskPosture = "observe";
  let headline = "Cautious signal posture";
  let narrative =
    "The current provider evidence indicates a weak but reviewable signal. Additional corroboration is still recommended.";

  if (normalizedSignal >= 0.55) {
    level = "elevated";
    posture = "review";
    headline = "Corroborated risk indicators";
    narrative =
      "Multiple provider observations point toward elevated risk, but tenra Sentinel still treats the result as evidence-backed rather than certain.";
  } else if (normalizedSignal >= 0.2) {
    level = "moderate";
    posture = "observe";
    headline = "Some risk indicators detected";
    narrative =
      "Provider evidence suggests a moderate signal, but the current evidence set is still modest and should be reviewed with context.";
  } else if (normalizedSignal <= -0.35) {
    level = "low";
    posture = "observe";
    headline = "Signals lean away from immediate concern";
    narrative =
      "The current evidence set leans away from risk, but tenra Sentinel does not treat low-risk evidence as a guarantee.";
  }

  return {
    level,
    posture,
    confidence: buildConfidenceAssessment(
      Math.min(0.78, clampConfidenceScore(averageConfidence)),
      "Confidence is derived from the current evidence set and should increase only as independent signals accumulate."
    ),
    reasoning: {
      headline,
      narrative,
      factors: meaningfulEvidence.map((item) => item.redactionSafeSummary)
    },
    evidence: input.evidence,
    sources: input.sources
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
    "tenra Sentinel has not gathered enough corroborated signals to move beyond a neutral, explainable assessment.";

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
        "No meaningful provider evidence was available for this lookup.",
        "The result is returned to validate the lookup flow, not to assert a verdict."
      ]
    },
    evidence,
    sources: input.sources
  };
};

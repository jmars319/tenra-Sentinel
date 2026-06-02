import { clampConfidenceScore, type IsoTimestamp, type RiskLevel } from "@sentinel/shared-types";

import { buildConfidenceAssessment } from "./confidence";
import type { EvidenceItem, RiskAssessment, RiskPosture, SourceObservation } from "./types";

export const hasMeaningfulEvidence = (evidence: EvidenceItem[]): boolean =>
  evidence.some((item) => item.direction !== "context-only");

export const createEvidenceWeightedAssessment = (input: {
  evidence: EvidenceItem[];
  sources: SourceObservation[];
}): RiskAssessment => {
  const meaningfulEvidence = input.evidence.filter((item) => item.direction !== "context-only");

  if (meaningfulEvidence.length === 0) {
    return createInsufficientSignalAssessment({
      observedAt: new Date().toISOString(),
      sources: input.sources,
      evidence: input.evidence,
    });
  }

  const weightedSignal = meaningfulEvidence.reduce((total, item) => {
    if (item.direction === "supports-risk") {
      return total + item.confidence;
    }

    return total - item.confidence;
  }, 0);
  const normalizedSignal = weightedSignal / meaningfulEvidence.length;
  const averageConfidence = meaningfulEvidence.reduce((total, item) => total + item.confidence, 0) / meaningfulEvidence.length;

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
      "Multiple provider observations point toward elevated risk, but Sentinel by Tenra still treats the result as evidence-backed rather than certain.";
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
      "The current evidence set leans away from risk, but Sentinel by Tenra does not treat low-risk evidence as a guarantee.";
  }

  return {
    level,
    posture,
    confidence: buildConfidenceAssessment(
      Math.min(0.78, clampConfidenceScore(averageConfidence)),
      "Confidence is derived from the current evidence set and should increase only as independent signals accumulate.",
    ),
    reasoning: {
      headline,
      narrative,
      factors: meaningfulEvidence.map((item) => item.redactionSafeSummary),
    },
    evidence: input.evidence,
    sources: input.sources,
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
    "Sentinel by Tenra has not gathered enough corroborated signals to move beyond a neutral, explainable assessment.";

  return {
    level: "unknown",
    posture: "insufficient-signal",
    confidence: buildConfidenceAssessment(
      0.16,
      "Confidence remains intentionally low until real source integrations are configured.",
    ),
    reasoning: {
      headline: "Insufficient signal",
      narrative: note,
      factors: [
        "No meaningful provider evidence was available for this lookup.",
        "The result is returned to validate the lookup flow, not to assert a verdict.",
      ],
    },
    evidence,
    sources: input.sources,
  };
};

export type Id = string;
export type IsoTimestamp = string;
export type ConfidenceScore = number;
export type CountryCode = string;
export type LookupTargetKind = "phone-number" | "message" | "email" | "entity";
export type RiskLevel = "unknown" | "minimal" | "low" | "moderate" | "elevated" | "high" | "critical";
export type ConfidenceBandLabel = "very-low" | "low" | "moderate" | "high";
export type EvidenceDirection = "supports-risk" | "reduces-risk" | "context-only";
export type SourceId =
  | "manual-input"
  | "placeholder"
  | "local-pattern-review"
  | "community-report"
  | "reputation-feed"
  | "telecom-observation"
  | "internal-review";

export interface ConfidenceBand {
  label: ConfidenceBandLabel;
  value: ConfidenceScore;
}

export const confidenceBandFromScore = (score: ConfidenceScore): ConfidenceBandLabel => {
  if (score < 0.2) {
    return "very-low";
  }

  if (score < 0.45) {
    return "low";
  }

  if (score < 0.75) {
    return "moderate";
  }

  return "high";
};

export const clampConfidenceScore = (value: number): ConfidenceScore => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
};

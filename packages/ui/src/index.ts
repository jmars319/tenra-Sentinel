import type { ConfidenceBandLabel, RiskLevel } from "@sentinel/shared-types";

export const sentinelTokens = {
  color: {
    ink: "#17222f",
    surface: "#f4efe5",
    surfaceStrong: "#e7dcc9",
    accent: "#6f7f61",
    accentDeep: "#445246",
    line: "#cdbfa8",
    riskUnknown: "#8b8170",
    riskLow: "#6f8f5f",
    riskModerate: "#c38f43",
    riskHigh: "#b45139"
  }
} as const;

export const riskLevelToneMap: Record<
  RiskLevel,
  { label: string; accent: string }
> = {
  unknown: { label: "Insufficient signal", accent: sentinelTokens.color.riskUnknown },
  minimal: { label: "Minimal risk", accent: sentinelTokens.color.riskLow },
  low: { label: "Low risk", accent: sentinelTokens.color.riskLow },
  moderate: { label: "Moderate risk", accent: sentinelTokens.color.riskModerate },
  elevated: { label: "Elevated risk", accent: sentinelTokens.color.riskModerate },
  high: { label: "High risk", accent: sentinelTokens.color.riskHigh },
  critical: { label: "Critical risk", accent: sentinelTokens.color.riskHigh }
};

export const confidenceBandCopy: Record<ConfidenceBandLabel, string> = {
  "very-low": "Very low confidence",
  low: "Low confidence",
  moderate: "Moderate confidence",
  high: "High confidence"
};

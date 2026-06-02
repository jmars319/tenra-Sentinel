import { clampConfidenceScore, confidenceBandFromScore } from "@sentinel/shared-types";

import type { ConfidenceAssessment } from "./types";

export const buildConfidenceAssessment = (
  score: number,
  rationale: string,
): ConfidenceAssessment => {
  const normalized = clampConfidenceScore(score);

  return {
    score: normalized,
    band: {
      label: confidenceBandFromScore(normalized),
      value: normalized,
    },
    rationale,
  };
};

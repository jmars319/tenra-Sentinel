import { riskLevelToneMap } from "@sentinel/ui";

import type { SavedLookup } from "./sentinelTypes";

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

export const toMarkdown = (saved: SavedLookup) => {
  const { result } = saved;

  return [
    `# Sentinel Lookup ${result.query.maskedPhoneNumber}`,
    "",
    `Generated: ${result.generatedAt}`,
    `Region: ${result.query.regionHint ?? "n/a"}`,
    `Risk: ${riskLevelToneMap[result.assessment.level].label}`,
    `Posture: ${result.assessment.posture}`,
    `Confidence: ${result.assessment.confidence.score.toFixed(2)} (${result.assessment.confidence.band.label})`,
    "",
    "## Reasoning",
    "",
    result.assessment.reasoning.narrative,
    "",
    "## Factors",
    "",
    ...result.assessment.reasoning.factors.map((factor) => `- ${factor}`),
    "",
    "## Evidence",
    "",
    ...result.evidence.map((item) => `- ${item.label}: ${item.redactionSafeSummary}`),
    "",
    "## Sources",
    "",
    ...result.sourceSummaries.map((source) => `- ${source.sourceId}: ${source.status} - ${source.summary}`),
    saved.note.trim() ? ["", "## Operator Note", "", saved.note.trim()].join("\n") : "",
  ].join("\n");
};

export const toDeriveRiskBrief = (saved: SavedLookup) => {
  const { result } = saved;

  return [
    "# Derive Risk Brief From Sentinel",
    "",
    `Target: ${result.query.maskedPhoneNumber}`,
    `Region: ${result.query.regionHint ?? "n/a"}`,
    `Risk: ${riskLevelToneMap[result.assessment.level].label}`,
    `Confidence: ${result.assessment.confidence.score.toFixed(2)} (${result.assessment.confidence.band.label})`,
    `Generated: ${result.generatedAt}`,
    "",
    "## Question For Derive",
    "",
    "Given the Sentinel evidence and source posture below, what can be concluded, what remains uncertain, and what action should a human reviewer take next?",
    "",
    "## Current Reasoning",
    "",
    result.assessment.reasoning.narrative,
    "",
    "## Evidence",
    "",
    ...result.evidence.map((item) => `- ${item.label}: ${item.redactionSafeSummary}`),
    "",
    "## Sources",
    "",
    ...result.sourceSummaries.map((source) => `- ${source.sourceId}: ${source.status} - ${source.summary}`),
  ].join("\n");
};

import type { PhoneLookupResult } from "@sentinel/api-contracts";
import { createEvidenceWeightedAssessment, orchestratePhoneLookup, type EvidenceItem, type SourceObservation } from "@sentinel/domain";
import { redactPhoneNumber } from "@sentinel/privacy";

import { nowIso } from "./sentinelStorage";
import { reviewFlags } from "./reviewFlags";
import type { ReviewFlagId } from "./sentinelTypes";

export const normalizePhoneNumber = (input: string): string => {
  const trimmed = input.trim();
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+")) return digitsOnly;
  return `+${digitsOnly}`;
};

export const buildManualEvidence = (input: {
  flags: ReviewFlagId[];
  note: string;
  observedAt: string;
}): EvidenceItem[] => {
  const selected = reviewFlags.filter((flag) => input.flags.includes(flag.id));
  const evidence = selected.map((flag): EvidenceItem => ({
    id: `manual-${flag.id}`,
    label: flag.label,
    summary: flag.summary,
    direction: flag.direction,
    confidence: flag.confidence,
    sourceId: "internal-review",
    observedAt: input.observedAt,
    redactionSafeSummary: flag.summary,
  }));

  if (input.note.trim()) {
    evidence.push({
      id: "manual-review-note",
      label: "Operator note",
      summary: input.note.trim(),
      direction: "context-only",
      confidence: 0.35,
      sourceId: "manual-input",
      observedAt: input.observedAt,
      redactionSafeSummary: input.note.trim(),
    });
  }

  return evidence;
};

export const buildManualSourceObservation = (observedAt: string, evidence: EvidenceItem[]): SourceObservation => ({
  sourceId: "internal-review",
  status: evidence.some((item) => item.direction !== "context-only") ? "complete" : "available",
  observedAt,
  summary:
    evidence.length > 0
      ? `${evidence.length} manual review signal(s) captured.`
      : "Manual review is available, but no review signal was selected.",
});

export const buildResult = async (input: {
  phoneNumber: string;
  regionHint: string;
  note: string;
  flags: ReviewFlagId[];
}): Promise<PhoneLookupResult> => {
  const observedAt = nowIso();
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
  const redacted = redactPhoneNumber(normalizedPhoneNumber);
  const orchestration = await orchestratePhoneLookup({
    rawInput: input.phoneNumber,
    normalizedPhoneNumber,
    regionHint: input.regionHint,
    includeEvidence: true,
    requestedAt: observedAt,
  });
  const manualEvidence = buildManualEvidence({ flags: input.flags, note: input.note, observedAt });
  const evidence = [...manualEvidence, ...orchestration.evidence];
  const sourceSummaries = [buildManualSourceObservation(observedAt, manualEvidence), ...orchestration.sourceSummaries];
  const hasManualRiskSignal = manualEvidence.some((item) => item.direction !== "context-only");
  const assessment = hasManualRiskSignal
    ? createEvidenceWeightedAssessment({ evidence, sources: sourceSummaries })
    : orchestration.assessment;
  const notices: PhoneLookupResult["notices"] = [];

  if (assessment.posture === "insufficient-signal") {
    notices.push({
      code: "placeholder-result",
      summary:
        "Local pattern review did not produce enough evidence for a risk conclusion. Add review signals or corroborating context before acting on it.",
    });
  }

  if (orchestration.providerResults.some((result) => result.providerStatus === "placeholder")) {
    notices.push({
      code: "provider-not-configured",
      summary: "Live phone intelligence providers are not configured.",
    });
  }

  notices.push({
    code: "redacted-output",
    summary: `The lookup target is displayed in redacted form (${redacted.redactedValue}).`,
  });

  return {
    job: {
      id: `lookup-${Date.now()}`,
      targetKind: "phone-number",
      submittedAt: observedAt,
      status: assessment.posture === "insufficient-signal" ? "insufficient-signal" : "completed",
      correlationKey: normalizedPhoneNumber,
    },
    query: {
      rawInput: input.phoneNumber,
      normalizedPhoneNumber,
      maskedPhoneNumber: redacted.redactedValue,
      ...(input.regionHint ? { regionHint: input.regionHint } : {}),
    },
    assessment: { ...assessment, evidence, sources: sourceSummaries },
    evidence,
    sourceSummaries,
    notices,
    generatedAt: observedAt,
  };
};

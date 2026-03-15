import { NextResponse } from "next/server";
import type { PhoneLookupResult } from "@sentinel/api-contracts";
import { createInsufficientSignalAssessment, type EvidenceItem, type SourceObservation } from "@sentinel/domain";
import { redactPhoneNumber } from "@sentinel/privacy";
import { phoneLookupQuerySchema, phoneLookupResultSchema } from "@sentinel/validation";

const normalizePhoneNumber = (input: string): string => {
  const trimmed = input.trim();
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+")) {
    return digitsOnly;
  }

  return `+${digitsOnly}`;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = phoneLookupQuerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "The phone lookup request is incomplete or malformed."
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const normalizedPhoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
  const redacted = redactPhoneNumber(normalizedPhoneNumber);

  const sourceSummaries: SourceObservation[] = [
    {
      sourceId: "manual-input",
      status: "complete",
      observedAt: now,
      summary: "Input captured and normalized for assessment."
    },
    {
      sourceId: "placeholder",
      status: "not-configured",
      observedAt: now,
      summary: "No external reputation or telecom sources are configured yet."
    }
  ];

  const evidence: EvidenceItem[] = [
    {
      id: "placeholder-observation",
      label: "Lookup shell response",
      summary: "The phone lookup path is scaffolded but not enriched by live providers.",
      direction: "context-only",
      confidence: 0.22,
      sourceId: "placeholder",
      observedAt: now,
      redactionSafeSummary:
        "Lookup scaffold returned a placeholder response because provider integrations are not configured."
    }
  ];

  const payload: PhoneLookupResult = {
    job: {
      id: `lookup-${Date.now()}`,
      targetKind: "phone-number",
      submittedAt: now,
      status: "insufficient-signal",
      correlationKey: normalizedPhoneNumber
    },
    query: {
      rawInput: parsed.data.phoneNumber,
      normalizedPhoneNumber,
      maskedPhoneNumber: redacted.redactedValue,
      ...(parsed.data.regionHint ? { regionHint: parsed.data.regionHint } : {})
    },
    assessment: createInsufficientSignalAssessment({
      observedAt: now,
      sources: sourceSummaries,
      evidence,
      note: "This result confirms the shared Sentinel lookup flow. It does not claim a real scam verdict without configured source integrations."
    }),
    evidence,
    sourceSummaries,
    notices: [
      {
        code: "placeholder-result",
        summary: "This is a scaffold result intended to validate contracts, UX, and reasoning presentation."
      },
      {
        code: "provider-not-configured",
        summary: "Configure a live lookup provider before using Sentinel for real-world phone intelligence."
      },
      {
        code: "redacted-output",
        summary: `The lookup target is displayed in redacted form (${redacted.redactedValue}).`
      }
    ],
    generatedAt: now
  };

  const validatedPayload = phoneLookupResultSchema.parse(payload);
  return NextResponse.json(validatedPayload);
}

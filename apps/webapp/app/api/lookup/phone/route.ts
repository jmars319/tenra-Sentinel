import { NextResponse } from "next/server";
import type { PhoneLookupResult } from "@sentinel/api-contracts";
import { orchestratePhoneLookup } from "@sentinel/domain";
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
  const orchestration = await orchestratePhoneLookup({
    rawInput: parsed.data.phoneNumber,
    normalizedPhoneNumber,
    regionHint: parsed.data.regionHint,
    includeEvidence: parsed.data.includeEvidence,
    requestedAt: now
  });
  const includeEvidence = parsed.data.includeEvidence !== false;
  const evidence = includeEvidence ? orchestration.evidence : [];
  const assessment = includeEvidence
    ? orchestration.assessment
    : {
        ...orchestration.assessment,
        evidence: []
      };

  const notices: PhoneLookupResult["notices"] = [];

  if (orchestration.assessment.posture === "insufficient-signal") {
    notices.push({
      code: "placeholder-result",
      summary:
        "Local pattern review did not produce enough evidence for a risk conclusion."
    });
  }

  if (
    orchestration.providerResults.some(
      (result) => result.providerStatus === "placeholder"
    )
  ) {
    notices.push({
      code: "provider-not-configured",
      summary:
        "Live phone intelligence providers are not configured."
    });
  }

  notices.push({
    code: "redacted-output",
    summary: `The lookup target is displayed in redacted form (${redacted.redactedValue}).`
  });

  const payload: PhoneLookupResult = {
    job: {
      id: `lookup-${Date.now()}`,
      targetKind: "phone-number",
      submittedAt: now,
      status:
        orchestration.assessment.posture === "insufficient-signal"
          ? "insufficient-signal"
          : "completed",
      correlationKey: normalizedPhoneNumber
    },
    query: {
      rawInput: parsed.data.phoneNumber,
      normalizedPhoneNumber,
      maskedPhoneNumber: redacted.redactedValue,
      ...(parsed.data.regionHint ? { regionHint: parsed.data.regionHint } : {})
    },
    assessment,
    evidence,
    sourceSummaries: orchestration.sourceSummaries,
    notices,
    generatedAt: now
  };

  const validatedPayload = phoneLookupResultSchema.parse(payload);
  return NextResponse.json(validatedPayload);
}

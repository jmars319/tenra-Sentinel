import type { LookupProvider, ProviderObservationResult } from "./types";
import type { PhoneLookupRequest } from "../core";
import type { EvidenceItem } from "../core";

const tollFreeAreaCodes = new Set(["800", "833", "844", "855", "866", "877", "888"]);

const isSequential = (digits: string): boolean => {
  if (digits.length < 6) return false;

  return "0123456789".includes(digits) || "9876543210".includes(digits);
};

const getNanpParts = (digits: string) => {
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (national.length !== 10) {
    return null;
  }

  return {
    areaCode: national.slice(0, 3),
    exchange: national.slice(3, 6),
    line: national.slice(6)
  };
};

const buildEvidence = (input: PhoneLookupRequest): EvidenceItem[] => {
  const digits = input.normalizedPhoneNumber.replace(/\D/g, "");
  const nanp = getNanpParts(digits);
  const evidence: EvidenceItem[] = [];

  if (nanp) {
    evidence.push({
      id: "local-nanp-shape",
      label: "North American number shape",
      summary: "The number matches a standard North American 10-digit shape.",
      direction: "context-only",
      confidence: 0.38,
      sourceId: "local-pattern-review",
      observedAt: input.requestedAt,
      redactionSafeSummary: "The number shape is locally recognizable as a standard North American number."
    });

    if (tollFreeAreaCodes.has(nanp.areaCode)) {
      evidence.push({
        id: "local-toll-free-area",
        label: "Toll-free area code",
        summary: "The number uses a toll-free area code. This is context, not a risk finding by itself.",
        direction: "context-only",
        confidence: 0.34,
        sourceId: "local-pattern-review",
        observedAt: input.requestedAt,
        redactionSafeSummary:
          "The number uses a toll-free area code, which is useful context but not a standalone risk finding."
      });
    }

    if (nanp.areaCode === "900") {
      evidence.push({
        id: "local-premium-area",
        label: "Premium-rate area code",
        summary: "The number uses a 900 area code, which should receive extra review before calling back.",
        direction: "supports-risk",
        confidence: 0.62,
        sourceId: "local-pattern-review",
        observedAt: input.requestedAt,
        redactionSafeSummary:
          "The number uses a premium-rate area code and should receive extra review before callback."
      });
    }

    if (nanp.areaCode === "555" || nanp.exchange === "555") {
      evidence.push({
        id: "local-reserved-example-pattern",
        label: "Reserved or example-like pattern",
        summary: "The number contains a 555 area or exchange pattern, which can indicate example data or masking.",
        direction: "supports-risk",
        confidence: 0.48,
        sourceId: "local-pattern-review",
        observedAt: input.requestedAt,
        redactionSafeSummary:
          "The number contains a reserved or example-like pattern that may indicate placeholder data or masking."
      });
    }

    if (nanp.areaCode === "000" || nanp.exchange === "000" || nanp.line === "0000") {
      evidence.push({
        id: "local-zero-block-pattern",
        label: "Zero-block pattern",
        summary: "The number contains a zero-block area, exchange, or line pattern.",
        direction: "supports-risk",
        confidence: 0.58,
        sourceId: "local-pattern-review",
        observedAt: input.requestedAt,
        redactionSafeSummary:
          "The number contains a zero-block pattern that should be treated as low-quality or suspicious input."
      });
    }
  } else if (digits.length >= 8 && digits.length <= 15) {
    evidence.push({
      id: "local-international-shape",
      label: "International number shape",
      summary: "The number length is plausible for international dialing, but no carrier or reputation lookup was performed.",
      direction: "context-only",
      confidence: 0.32,
      sourceId: "local-pattern-review",
      observedAt: input.requestedAt,
      redactionSafeSummary:
        "The number length is plausible for international dialing, with no carrier or reputation lookup attached."
    });
  } else {
    evidence.push({
      id: "local-unusual-length",
      label: "Unusual number length",
      summary: "The number length is unusual for a callable phone number.",
      direction: "supports-risk",
      confidence: 0.5,
      sourceId: "local-pattern-review",
      observedAt: input.requestedAt,
      redactionSafeSummary: "The number length is unusual for a callable phone number."
    });
  }

  if (/(\d)\1{5,}/.test(digits)) {
    evidence.push({
      id: "local-repeated-digit-run",
      label: "Repeated digit run",
      summary: "The number contains a long repeated digit run.",
      direction: "supports-risk",
      confidence: 0.54,
      sourceId: "local-pattern-review",
      observedAt: input.requestedAt,
      redactionSafeSummary: "The number contains a long repeated digit run."
    });
  }

  if (isSequential(digits.slice(-7))) {
    evidence.push({
      id: "local-sequential-digits",
      label: "Sequential digit pattern",
      summary: "The number ends with a simple ascending or descending sequence.",
      direction: "supports-risk",
      confidence: 0.46,
      sourceId: "local-pattern-review",
      observedAt: input.requestedAt,
      redactionSafeSummary: "The number ends with a simple ascending or descending digit sequence."
    });
  }

  return evidence;
};

export class LocalPhoneSignalProvider implements LookupProvider {
  readonly id = "local-phone-pattern-provider";
  readonly sourceId = "local-pattern-review";
  readonly supportedTargets = ["phone-number"] as const;
  readonly isActive = true;

  async lookupPhoneNumber(
    input: PhoneLookupRequest
  ): Promise<ProviderObservationResult> {
    const evidence = buildEvidence(input);
    const riskSignalCount = evidence.filter((item) => item.direction === "supports-risk").length;

    return {
      providerId: this.id,
      providerStatus: "active",
      summary:
        riskSignalCount > 0
          ? `${riskSignalCount} local phone pattern signal(s) need review.`
          : "Local phone pattern review completed without a risk pattern.",
      observations: [
        {
          sourceId: this.sourceId,
          status: "complete",
          observedAt: input.requestedAt,
          summary:
            "Local phone pattern review checked number length, North American shape, reserved patterns, toll-free context, premium-rate context, and repeated or sequential digit patterns."
        }
      ],
      evidence
    };
  }
}

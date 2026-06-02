import type { EvidenceItem, PhoneLookupRequest } from "../../core";

import { getNanpParts, isTollFreeAreaCode } from "./nanp";
import { isSequential } from "./patterns";

export const buildEvidence = (input: PhoneLookupRequest): EvidenceItem[] => {
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
      redactionSafeSummary: "The number shape is locally recognizable as a standard North American number.",
    });

    if (isTollFreeAreaCode(nanp.areaCode)) {
      evidence.push({
        id: "local-toll-free-area",
        label: "Toll-free area code",
        summary: "The number uses a toll-free area code. This is context, not a risk finding by itself.",
        direction: "context-only",
        confidence: 0.34,
        sourceId: "local-pattern-review",
        observedAt: input.requestedAt,
        redactionSafeSummary:
          "The number uses a toll-free area code, which is useful context but not a standalone risk finding.",
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
        redactionSafeSummary: "The number uses a premium-rate area code and should receive extra review before callback.",
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
        redactionSafeSummary: "The number contains a reserved or example-like pattern that may indicate sample data or masking.",
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
        redactionSafeSummary: "The number contains a zero-block pattern that should be treated as low-quality or suspicious input.",
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
      redactionSafeSummary: "The number length is plausible for international dialing, with no carrier or reputation lookup attached.",
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
      redactionSafeSummary: "The number length is unusual for a callable phone number.",
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
      redactionSafeSummary: "The number contains a long repeated digit run.",
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
      redactionSafeSummary: "The number ends with a simple ascending or descending digit sequence.",
    });
  }

  return evidence;
};

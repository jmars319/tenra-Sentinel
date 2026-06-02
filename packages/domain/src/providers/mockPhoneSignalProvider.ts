import type { PhoneLookupRequest } from "../core";
import type { LookupProvider, ProviderObservationResult } from "./types";
import { buildEvidence } from "./localPhoneSignal/evidence";

export class LocalPhoneSignalProvider implements LookupProvider {
  readonly id = "local-phone-pattern-provider";
  readonly sourceId = "local-pattern-review";
  readonly supportedTargets = ["phone-number"] as const;
  readonly isActive = true;

  async lookupPhoneNumber(input: PhoneLookupRequest): Promise<ProviderObservationResult> {
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
            "Local phone pattern review checked number length, North American shape, reserved patterns, toll-free context, premium-rate context, and repeated or sequential digit patterns.",
        },
      ],
      evidence,
    };
  }
}

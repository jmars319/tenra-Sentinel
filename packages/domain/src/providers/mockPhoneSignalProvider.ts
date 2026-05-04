import type { LookupProvider, ProviderObservationResult } from "./types";
import type { PhoneLookupRequest } from "../core";

export class MockPhoneSignalProvider implements LookupProvider {
  readonly id = "mock-phone-signal-provider";
  readonly sourceId = "placeholder";
  readonly supportedTargets = ["phone-number"] as const;
  readonly isActive = true;

  async lookupPhoneNumber(
    input: PhoneLookupRequest
  ): Promise<ProviderObservationResult> {
    return {
      providerId: this.id,
      providerStatus: "placeholder",
      summary: "Live phone intelligence providers are not configured yet.",
      observations: [
        {
          sourceId: this.sourceId,
          status: "not-configured",
          observedAt: input.requestedAt,
          summary:
            "MockPhoneSignalProvider is returning a baseline observation because live integrations are not configured yet."
        }
      ],
      evidence: [
        {
          id: "mock-provider-placeholder-evidence",
          label: "Provider baseline response",
          summary:
            "The provider layer is active, but no live phone intelligence integrations have been configured yet.",
          direction: "context-only",
          confidence: 0.22,
          sourceId: this.sourceId,
          observedAt: input.requestedAt,
          redactionSafeSummary:
            "The provider adapter returned a baseline response because live integrations are not configured yet."
        }
      ]
    };
  }
}

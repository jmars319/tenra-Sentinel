import {
  createEvidenceWeightedAssessment,
  createInsufficientSignalAssessment,
  hasMeaningfulEvidence,
  type EvidenceItem,
  type PhoneLookupRequest,
  type RiskAssessment,
  type SourceObservation
} from "../core";
import {
  sentinelProviderRegistry,
  type LookupProvider,
  type LookupProviderRegistry,
  type ProviderObservationResult
} from "../providers";

export interface PhoneLookupOrchestrationResult {
  assessment: RiskAssessment;
  evidence: EvidenceItem[];
  sourceSummaries: SourceObservation[];
  providerResults: ProviderObservationResult[];
}

const createManualInputObservation = (
  input: PhoneLookupRequest
): SourceObservation => ({
  sourceId: "manual-input",
  status: "complete",
  observedAt: input.requestedAt,
  summary: `Input captured and normalized for ${input.normalizedPhoneNumber}.`
});

const createProviderFailureResult = (
  provider: LookupProvider,
  input: PhoneLookupRequest,
  error: unknown
): ProviderObservationResult => {
  const detail =
    error instanceof Error ? error.message : "Unknown provider failure.";

  return {
    providerId: provider.id,
    providerStatus: "error",
    summary: `Provider lookup failed: ${detail}`,
    observations: [
      {
        sourceId: provider.sourceId,
        status: "degraded",
        observedAt: input.requestedAt,
        summary: `${provider.id} failed during lookup orchestration.`
      }
    ],
    evidence: []
  };
};

export const orchestratePhoneLookup = async (
  input: PhoneLookupRequest,
  registry: LookupProviderRegistry = sentinelProviderRegistry
): Promise<PhoneLookupOrchestrationResult> => {
  const providers = registry.getProvidersForTarget("phone-number");
  const providerResults = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await provider.lookupPhoneNumber(input);
      } catch (error) {
        return createProviderFailureResult(provider, input, error);
      }
    })
  );

  const evidence = providerResults.flatMap((result) => result.evidence);
  const sourceSummaries = [
    createManualInputObservation(input),
    ...providerResults.flatMap((result) => result.observations)
  ];

  const assessment = hasMeaningfulEvidence(evidence)
    ? createEvidenceWeightedAssessment({
        evidence,
        sources: sourceSummaries
      })
    : createInsufficientSignalAssessment({
        observedAt: input.requestedAt,
        sources: sourceSummaries,
        evidence,
        note:
          "Sentinel by Tenra completed the provider orchestration step, but no meaningful phone-risk evidence is available yet."
      });

  return {
    assessment,
    evidence,
    sourceSummaries,
    providerResults
  };
};

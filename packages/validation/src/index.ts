import { z } from "zod";
import type { PhoneLookupQuery, PhoneLookupResult } from "@sentinel/api-contracts";
import type {
  ConfidenceAssessment,
  EvidenceItem,
  LookupJob,
  RiskAssessment,
  SourceObservation
} from "@sentinel/domain";
import type { ConfidenceBand, RiskLevel, SourceId } from "@sentinel/shared-types";

export const isoTimestampSchema = z.string().datetime({ offset: true });
export const sourceIdSchema = z.enum([
  "manual-input",
  "placeholder",
  "community-report",
  "reputation-feed",
  "telecom-observation",
  "internal-review"
]) satisfies z.ZodType<SourceId>;
export const riskLevelSchema = z.enum([
  "unknown",
  "minimal",
  "low",
  "moderate",
  "elevated",
  "high",
  "critical"
]) satisfies z.ZodType<RiskLevel>;

export const confidenceBandSchema = z.object({
  label: z.enum(["very-low", "low", "moderate", "high"]),
  value: z.number().min(0).max(1)
}) satisfies z.ZodType<ConfidenceBand>;

export const sourceObservationSchema = z.object({
  sourceId: sourceIdSchema,
  status: z.enum(["not-configured", "available", "degraded", "complete"]),
  observedAt: isoTimestampSchema,
  summary: z.string().min(1)
}) satisfies z.ZodType<SourceObservation>;

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  direction: z.enum(["supports-risk", "reduces-risk", "context-only"]),
  confidence: z.number().min(0).max(1),
  sourceId: sourceIdSchema,
  observedAt: isoTimestampSchema,
  redactionSafeSummary: z.string().min(1)
}) satisfies z.ZodType<EvidenceItem>;

export const confidenceAssessmentSchema = z.object({
  score: z.number().min(0).max(1),
  band: confidenceBandSchema,
  rationale: z.string().min(1)
}) satisfies z.ZodType<ConfidenceAssessment>;

export const reasoningSummarySchema = z.object({
  headline: z.string().min(1),
  narrative: z.string().min(1),
  factors: z.array(z.string().min(1)).min(1)
});

export const riskAssessmentSchema = z.object({
  level: riskLevelSchema,
  posture: z.enum(["observe", "review", "limit", "avoid", "insufficient-signal"]),
  confidence: confidenceAssessmentSchema,
  reasoning: reasoningSummarySchema,
  evidence: z.array(evidenceItemSchema),
  sources: z.array(sourceObservationSchema)
}) satisfies z.ZodType<RiskAssessment>;

export const lookupJobSchema = z.object({
  id: z.string().min(1),
  targetKind: z.enum(["phone-number", "message", "email", "entity"]),
  submittedAt: isoTimestampSchema,
  status: z.enum(["queued", "running", "completed", "failed", "insufficient-signal"]),
  correlationKey: z.string().min(1)
}) satisfies z.ZodType<LookupJob>;

export const phoneLookupQuerySchema = z.object({
  phoneNumber: z.string().min(7).max(32),
  regionHint: z.string().trim().min(2).max(8).optional(),
  includeEvidence: z.boolean().optional()
}) satisfies z.ZodType<PhoneLookupQuery>;

export const phoneLookupResultSchema = z.object({
  job: lookupJobSchema,
  query: z.object({
    rawInput: z.string().min(1),
    normalizedPhoneNumber: z.string().min(1),
    maskedPhoneNumber: z.string().min(1),
    regionHint: z.string().min(2).max(8).optional()
  }),
  assessment: riskAssessmentSchema,
  evidence: z.array(evidenceItemSchema),
  sourceSummaries: z.array(sourceObservationSchema),
  notices: z.array(
    z.object({
      code: z.enum(["placeholder-result", "provider-not-configured", "redacted-output"]),
      summary: z.string().min(1)
    })
  ),
  generatedAt: isoTimestampSchema
}) satisfies z.ZodType<PhoneLookupResult>;

export const healthStatusResponseSchema = z.object({
  service: z.string().min(1),
  status: z.enum(["ok", "degraded", "not-configured"]),
  timestamp: isoTimestampSchema,
  notes: z.array(z.string())
});

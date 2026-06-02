import type { PhoneLookupResult } from "@sentinel/api-contracts";
import type { EvidenceDirection } from "@sentinel/shared-types";

export type ReviewFlagId =
  | "payment-pressure"
  | "repeated-contact"
  | "spoofing"
  | "known-contact"
  | "expected-call";

export type SavedLookup = {
  id: string;
  phoneNumber: string;
  regionHint: string;
  note: string;
  selectedFlags: ReviewFlagId[];
  result: PhoneLookupResult;
};

export type SentinelHistoryExport = {
  exportedAt: string;
  lookups: SavedLookup[];
  schema: "tenra-sentinel-desktop-history:v1";
};

export type ReviewFlag = {
  id: ReviewFlagId;
  label: string;
  direction: EvidenceDirection;
  confidence: number;
  summary: string;
};

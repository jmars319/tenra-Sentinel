import type { ReviewFlag } from "./sentinelTypes";

export const reviewFlags: ReviewFlag[] = [
  {
    id: "payment-pressure",
    label: "Asked for money, codes, credentials, or urgent action",
    direction: "supports-risk",
    confidence: 0.78,
    summary: "Manual review noted pressure for payment, codes, credentials, or urgent action.",
  },
  {
    id: "repeated-contact",
    label: "Repeated contact or unusual timing",
    direction: "supports-risk",
    confidence: 0.62,
    summary: "Manual review noted repeated contact or unusual timing.",
  },
  {
    id: "spoofing",
    label: "Spoofing, mismatch, or identity concern",
    direction: "supports-risk",
    confidence: 0.72,
    summary: "Manual review noted possible spoofing, mismatch, or identity concern.",
  },
  {
    id: "known-contact",
    label: "Known contact or verified business",
    direction: "reduces-risk",
    confidence: 0.7,
    summary: "Manual review identified the number as a known contact or verified business.",
  },
  {
    id: "expected-call",
    label: "Expected call or confirmed context",
    direction: "reduces-risk",
    confidence: 0.56,
    summary: "Manual review found expected-call context or outside confirmation.",
  },
];

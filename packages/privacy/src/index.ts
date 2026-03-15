export type ExposurePosture = "internal-only" | "redacted" | "shareable";

export interface RedactionResult {
  originalLength: number;
  redactedValue: string;
  posture: ExposurePosture;
}

export const redactPhoneNumber = (input: string): RedactionResult => {
  const digitsOnly = input.replace(/\D/g, "");
  const visibleTail = digitsOnly.slice(-2);
  const hiddenLength = Math.max(0, digitsOnly.length - visibleTail.length);

  return {
    originalLength: input.length,
    redactedValue: `${"*".repeat(hiddenLength)}${visibleTail}`,
    posture: "redacted"
  };
};

"use client";

import { LookupFormSection } from "./phoneLookup/LookupFormSection";
import { PhoneLookupResultSection } from "./phoneLookup/PhoneLookupResultSection";
import { RiskBriefInboxSection } from "./phoneLookup/RiskBriefInboxSection";
import { usePhoneLookupState } from "./phoneLookup/usePhoneLookupState";

export function PhoneLookupForm() {
  const state = usePhoneLookupState();

  return (
    <>
      <LookupFormSection state={state} />
      <RiskBriefInboxSection state={state} />
      <PhoneLookupResultSection state={state} />
    </>
  );
}

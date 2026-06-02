"use client";

import { useState, type FormEvent } from "react";
import { buildSentinelRiskBrief, type PhoneLookupResult, type SentinelRiskBrief } from "@sentinel/api-contracts";
import { parseSentinelRiskBrief } from "@sentinel/validation";

interface ApiErrorPayload {
  error?: string;
}

export function usePhoneLookupState() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [regionHint, setRegionHint] = useState("US");
  const [result, setResult] = useState<PhoneLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riskBriefJson, setRiskBriefJson] = useState("");
  const [importedRiskBrief, setImportedRiskBrief] = useState<SentinelRiskBrief | null>(null);
  const [handoffMessage, setHandoffMessage] = useState("Paste a Sentinel risk brief to review it here.");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/lookup/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, regionHint }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
        throw new Error(payload?.error ?? "Lookup request failed.");
      }

      const payload = (await response.json()) as PhoneLookupResult;
      setResult(payload);
      setImportedRiskBrief(null);
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Lookup request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRiskBriefImport = () => {
    if (!riskBriefJson.trim()) {
      setHandoffMessage("Paste a Sentinel risk brief before importing.");
      return;
    }

    try {
      const brief = parseSentinelRiskBrief(JSON.parse(riskBriefJson));
      setResult(brief.lookup);
      setPhoneNumber(brief.lookup.query.rawInput);
      setRegionHint(brief.lookup.query.regionHint ?? "US");
      setImportedRiskBrief(brief);
      setError(null);
      setHandoffMessage(`Imported ${brief.schema} for ${brief.handoff.recommendedConsumers.join(", ")}.`);
    } catch (importError) {
      setImportedRiskBrief(null);
      setHandoffMessage(importError instanceof Error ? importError.message : "Risk brief import failed.");
    }
  };

  const riskBrief = result ? buildSentinelRiskBrief({ lookup: result }) : null;

  return {
    error,
    handleRiskBriefImport,
    handleSubmit,
    handoffMessage,
    importedRiskBrief,
    isLoading,
    phoneNumber,
    regionHint,
    result,
    riskBrief,
    riskBriefJson,
    setPhoneNumber,
    setRegionHint,
    setRiskBriefJson,
  };
}

export type PhoneLookupState = ReturnType<typeof usePhoneLookupState>;

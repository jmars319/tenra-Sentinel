"use client";

import { useState, type FormEvent } from "react";
import {
  buildSentinelRiskBrief,
  type PhoneLookupResult,
  type SentinelRiskBrief
} from "@sentinel/api-contracts";
import { riskLevelToneMap } from "@sentinel/ui";
import { parseSentinelRiskBrief } from "@sentinel/validation";

interface ApiErrorPayload {
  error?: string;
}

export function PhoneLookupForm() {
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber,
          regionHint
        })
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
      setError(
        submitError instanceof Error ? submitError.message : "Lookup request failed."
      );
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

  const accent = result ? riskLevelToneMap[result.assessment.level].accent : undefined;
  const riskBrief = result ? buildSentinelRiskBrief({ lookup: result }) : null;

  return (
    <>
      <form className="lookup-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Phone number</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            placeholder="+1 555 012 3456"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Region hint</span>
            <input
              autoCapitalize="characters"
              maxLength={8}
              placeholder="US"
              value={regionHint}
              onChange={(event) => setRegionHint(event.target.value.toUpperCase())}
            />
          </label>

          <label className="field">
            <span>Mode</span>
            <input value="Source review" readOnly />
          </label>
        </div>

        <button type="submit" disabled={isLoading || phoneNumber.trim().length === 0}>
          {isLoading ? "Preparing assessment..." : "Run phone lookup"}
        </button>
      </form>

      {error ? <p className="muted">{error}</p> : null}

      <section className="result-card handoff-import">
        <div className="result-header">
          <div>
            <strong>Risk brief inbox</strong>
            <p>Import Sentinel handoffs from Derive, Guardrail, Assembly, or manual review.</p>
          </div>
          <span className="pill">tenra-sentinel.risk-brief.v1</span>
        </div>
        <div className="lookup-form">
          <label className="field">
            <span>Risk brief JSON</span>
            <textarea
              rows={5}
              value={riskBriefJson}
              onChange={(event) => setRiskBriefJson(event.target.value)}
            />
          </label>
          <button type="button" onClick={handleRiskBriefImport}>
            Import risk brief
          </button>
          <p className="muted">{handoffMessage}</p>
        </div>
      </section>

      {result ? (
        <section className="result-card" style={{ borderLeftColor: accent }}>
          <div className="result-header">
            <div>
              <strong>{riskLevelToneMap[result.assessment.level].label}</strong>
              <p>
                {result.query.maskedPhoneNumber} • {result.assessment.confidence.score.toFixed(2)}
                {" "}
                confidence
              </p>
            </div>
            <span className="pill">{result.assessment.posture}</span>
          </div>

          <div className="result-grid">
            <div className="result-block">
              <strong>Reasoning summary</strong>
              <p>{result.assessment.reasoning.narrative}</p>
              <ul>
                {result.assessment.reasoning.factors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            </div>

            <div className="result-block">
              <strong>Source posture</strong>
              <ul>
                {result.sourceSummaries.map((source) => (
                  <li key={source.sourceId}>
                    {source.sourceId}: {source.status} ({source.summary})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="result-grid">
            <div className="result-block">
              <strong>Evidence</strong>
              <ul>
                {result.evidence.map((item) => (
                  <li key={item.id}>{item.redactionSafeSummary}</li>
                ))}
              </ul>
            </div>

            <div className="result-block">
              <strong>Notices</strong>
              <ul>
                {result.notices.map((notice) => (
                  <li key={notice.code}>{notice.summary}</li>
                ))}
              </ul>
            </div>
          </div>
          {riskBrief ? (
            <div className="result-block">
              <strong>Handoff</strong>
              <p>{riskBrief.schema}</p>
              <p>{riskBrief.handoff.recommendedConsumers.join(", ")}</p>
              {importedRiskBrief ? (
                <p>
                  Imported source: {importedRiskBrief.sourceApp}; action posture{" "}
                  {importedRiskBrief.handoff.actionPosture}.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

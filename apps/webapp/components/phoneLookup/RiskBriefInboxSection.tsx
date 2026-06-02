"use client";

import type { PhoneLookupState } from "./usePhoneLookupState";

export function RiskBriefInboxSection({ state }: { state: PhoneLookupState }) {
  return (
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
          <textarea rows={5} value={state.riskBriefJson} onChange={(event) => state.setRiskBriefJson(event.target.value)} />
        </label>
        <button type="button" onClick={state.handleRiskBriefImport}>
          Import risk brief
        </button>
        <p className="muted">{state.handoffMessage}</p>
      </div>
    </section>
  );
}

import { riskLevelToneMap } from "@sentinel/ui";

import type { PhoneLookupState } from "./usePhoneLookupState";

export function PhoneLookupResultSection({ state }: { state: PhoneLookupState }) {
  const result = state.result;
  if (!result) return null;
  const accent = riskLevelToneMap[result.assessment.level].accent;

  return (
    <section className="result-card" style={{ borderLeftColor: accent }}>
      <div className="result-header">
        <div>
          <strong>{riskLevelToneMap[result.assessment.level].label}</strong>
          <p>
            {result.query.maskedPhoneNumber} • {result.assessment.confidence.score.toFixed(2)} confidence
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

      {state.riskBrief ? (
        <div className="result-block">
          <strong>Handoff</strong>
          <p>{state.riskBrief.schema}</p>
          <p>{state.riskBrief.handoff.recommendedConsumers.join(", ")}</p>
          {state.importedRiskBrief ? (
            <p>
              Imported source: {state.importedRiskBrief.sourceApp}; action posture {state.importedRiskBrief.handoff.actionPosture}.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

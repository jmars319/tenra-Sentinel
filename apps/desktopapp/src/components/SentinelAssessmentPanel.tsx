import { confidenceBandCopy, riskLevelToneMap } from "@sentinel/ui";

import type { SentinelDeskState } from "../hooks/useSentinelDesk";

export function SentinelAssessmentPanel({ state }: { state: SentinelDeskState }) {
  const activeLookup = state.activeLookup;
  const activeTone = activeLookup ? riskLevelToneMap[activeLookup.result.assessment.level] : riskLevelToneMap.unknown;

  return (
    <section className="assessment-panel" aria-label="Assessment">
      {activeLookup ? (
        <>
          <header className="assessment-header" style={{ borderColor: activeTone.accent }}>
            <div>
              <span className="eyebrow">Assessment</span>
              <h2>{activeTone.label}</h2>
              <p>{activeLookup.result.assessment.reasoning.headline}</p>
            </div>
            <div className="score-card">
              <strong>{activeLookup.result.assessment.confidence.score.toFixed(2)}</strong>
              <span>{confidenceBandCopy[activeLookup.result.assessment.confidence.band.label]}</span>
            </div>
          </header>

          <div className="panel-grid">
            <ReasoningPanel state={state} />
            <EvidencePanel state={state} />
            <SourcesPanel state={state} />
            <DeriveContextPanel state={state} />
            <ExportPanel state={state} />
          </div>
        </>
      ) : (
        <section className="empty-state">
          <span className="eyebrow">No assessment selected</span>
          <h2>Run a lookup to create the first local assessment.</h2>
        </section>
      )}
    </section>
  );
}

function ReasoningPanel({ state }: { state: SentinelDeskState }) {
  const assessment = state.activeLookup?.result.assessment;
  if (!assessment) return null;

  return (
    <section className="panel-card">
      <header className="panel-header">
        <span>Reasoning</span>
        <strong>{assessment.posture}</strong>
      </header>
      <p>{assessment.reasoning.narrative}</p>
      <ul>
        {assessment.reasoning.factors.map((factor) => (
          <li key={factor}>{factor}</li>
        ))}
      </ul>
    </section>
  );
}

function EvidencePanel({ state }: { state: SentinelDeskState }) {
  const evidence = state.activeLookup?.result.evidence ?? [];

  return (
    <section className="panel-card">
      <header className="panel-header">
        <span>Evidence</span>
        <strong>{evidence.length}</strong>
      </header>
      <ul className="evidence-list">
        {evidence.map((item) => (
          <li key={item.id}>
            <strong>{item.label}</strong>
            <span>
              {item.direction} / {item.confidence.toFixed(2)}
            </span>
            <p>{item.redactionSafeSummary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourcesPanel({ state }: { state: SentinelDeskState }) {
  const sources = state.activeLookup?.result.sourceSummaries ?? [];

  return (
    <section className="panel-card">
      <header className="panel-header">
        <span>Sources</span>
        <strong>{sources.length}</strong>
      </header>
      <ul className="source-list">
        {sources.map((source) => (
          <li key={`${source.sourceId}-${source.observedAt}`}>
            <strong>{source.sourceId}</strong>
            <span>{source.status}</span>
            <p>{source.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeriveContextPanel({ state }: { state: SentinelDeskState }) {
  const context = state.deriveContext;
  if (!context) return null;

  return (
    <section className="panel-card">
      <header className="panel-header">
        <span>Derive Context</span>
        <strong>{context.confidence}</strong>
      </header>
      <p>{context.summary}</p>
      <p>{context.answerText}</p>
      {context.openQuestions.length ? (
        <ul className="evidence-list">
          {context.openQuestions.map((question) => (
            <li key={question}>
              <strong>Open question</strong>
              <p>{question}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ExportPanel({ state }: { state: SentinelDeskState }) {
  const activeLookup = state.activeLookup;
  if (!activeLookup) return null;
  const output = state.output;

  return (
    <section className="panel-card">
      <header className="panel-header">
        <span>Export</span>
        <strong>{activeLookup.result.query.maskedPhoneNumber}</strong>
      </header>
      <div className="action-row">
        <button type="button" onClick={output.copyMarkdown}>
          Copy Markdown
        </button>
        <button type="button" onClick={output.copyDeriveBrief}>
          Copy Derive Brief
        </button>
        <button type="button" onClick={() => output.previewOutbound("derive")}>
          Preview Derive
        </button>
        <button type="button" onClick={() => void output.copyRiskBrief("guardrail")}>
          Send Guardrail
        </button>
        <button type="button" onClick={() => output.previewOutbound("guardrail")}>
          Preview Guardrail
        </button>
        <button type="button" onClick={() => void output.copyGuardrailReview()}>
          Guardrail Review
        </button>
        <button type="button" onClick={output.exportGuardrailReview}>
          Review JSON
        </button>
        <button type="button" onClick={output.exportRiskBrief}>
          Risk JSON
        </button>
        <button type="button" onClick={output.exportMarkdown}>
          Export
        </button>
      </div>
      <pre>{output.outboundPreview || (state.activeRiskBrief ? JSON.stringify(state.activeRiskBrief, null, 2) : "")}</pre>
    </section>
  );
}

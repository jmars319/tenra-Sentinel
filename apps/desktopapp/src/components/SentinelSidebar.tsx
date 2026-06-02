import { sentinelAppName } from "@sentinel/config";
import { riskLevelToneMap } from "@sentinel/ui";

import type { SentinelDeskState } from "../hooks/useSentinelDesk";
import { formatTime } from "../lib/sentinelExports";
import { reviewFlags } from "../lib/reviewFlags";

type SentinelSidebarProps = {
  state: SentinelDeskState;
};

export function SentinelSidebar({ state }: SentinelSidebarProps) {
  return (
    <aside className="lookup-sidebar">
      <header className="brand-block">
        <span>Desktop operations</span>
        <h1>{sentinelAppName}</h1>
        <p>Local lookup review, evidence weighting, and source posture.</p>
      </header>

      <LookupFormPanel state={state} />
      <HandoffInboxPanel state={state} />
      <LookupHistoryPanel state={state} />
    </aside>
  );
}

function LookupFormPanel({ state }: SentinelSidebarProps) {
  const {
    importHistory,
    importInputRef,
    isRunning,
    note,
    notice,
    phoneNumber,
    regionHint,
    runLookup,
    selectedFlags,
    setNote,
    setPhoneNumber,
    setRegionHint,
    toggleFlag,
  } = state.form;

  return (
    <section className="lookup-form" aria-label="Phone lookup">
      <label>
        Phone number
        <input
          autoComplete="tel"
          inputMode="tel"
          placeholder="+1 555 012 3456"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
      </label>

      <label>
        Region
        <input
          autoCapitalize="characters"
          maxLength={8}
          value={regionHint}
          onChange={(event) => setRegionHint(event.target.value.toUpperCase())}
        />
      </label>

      <fieldset>
        <legend>Review signals</legend>
        {reviewFlags.map((flag) => (
          <label className="check-row" key={flag.id}>
            <input checked={selectedFlags.includes(flag.id)} type="checkbox" onChange={() => toggleFlag(flag.id)} />
            <span>{flag.label}</span>
          </label>
        ))}
      </fieldset>

      <label>
        Operator note
        <textarea
          placeholder="Add call details, message content, who reported it, or outside confirmation."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button disabled={isRunning} type="button" onClick={runLookup}>
        {isRunning ? "Running..." : "Run Lookup"}
      </button>
      <div className="history-actions">
        <button type="button" onClick={state.history.exportHistory}>
          Export History
        </button>
        <button type="button" onClick={() => importInputRef.current?.click()}>
          Import History
        </button>
      </div>
      <input ref={importInputRef} className="hidden-file-input" type="file" accept="application/json" onChange={importHistory} />
      <p className="notice" role="status">
        {notice}
      </p>
    </section>
  );
}

function HandoffInboxPanel({ state }: SentinelSidebarProps) {
  const { handoffImportError, handoffJson, importedRiskBrief, importRiskBrief, setHandoffJson } = state.handoff;
  const { copyRiskBrief } = state.output;

  return (
    <section className="lookup-form" aria-label="Risk brief handoff inbox">
      <label>
        Risk or Derive brief JSON
        <textarea
          placeholder='{"schema":"tenra-sentinel.risk-brief.v1",...} or {"schema":"tenra-derive.reasoning-brief.v1",...}'
          value={handoffJson}
          onChange={(event) => setHandoffJson(event.target.value)}
        />
      </label>
      <button type="button" onClick={importRiskBrief}>
        Import Brief
      </button>
      {handoffImportError ? <div className="notice error">{handoffImportError}</div> : null}
      {state.deriveContext ? (
        <div className="notice">
          Derive context: {state.deriveContext.confidence} confidence · {state.deriveContext.openQuestions.length} open question(s)
        </div>
      ) : null}
      {importedRiskBrief ? (
        <div className="history-actions">
          {importedRiskBrief.handoff.recommendedConsumers.map((consumer) => (
            <button key={consumer} type="button" onClick={() => void copyRiskBrief(consumer)}>
              Send {consumer}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function LookupHistoryPanel({ state }: SentinelSidebarProps) {
  const { activeId, savedLookups, setActiveId } = state.history;

  return (
    <nav className="history-list" aria-label="Lookup history">
      {savedLookups.map((lookup) => (
        <button
          className={lookup.id === activeId ? "history-item history-item-active" : "history-item"}
          key={lookup.id}
          onClick={() => setActiveId(lookup.id)}
          type="button"
        >
          <span>{lookup.result.query.maskedPhoneNumber}</span>
          <small>
            {riskLevelToneMap[lookup.result.assessment.level].label} / {formatTime(lookup.result.generatedAt)}
          </small>
        </button>
      ))}
    </nav>
  );
}

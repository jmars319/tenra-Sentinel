import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  buildSentinelGuardrailReviewRequest,
  buildSentinelRiskBrief,
  type PhoneLookupResult,
  type SentinelRiskBrief,
  type SentinelRiskBriefConsumer,
} from "@sentinel/api-contracts";
import { sentinelAppName } from "@sentinel/config";
import {
  createEvidenceWeightedAssessment,
  orchestratePhoneLookup,
  type EvidenceItem,
  type SourceObservation,
} from "@sentinel/domain";
import { redactPhoneNumber } from "@sentinel/privacy";
import type { EvidenceDirection } from "@sentinel/shared-types";
import { confidenceBandCopy, riskLevelToneMap } from "@sentinel/ui";
import { parseDeriveReasoningBriefContext, parseSentinelRiskBrief, type DeriveReasoningBriefContext } from "@sentinel/validation";
import { readDesktopStore, readLegacyLocalStorage, writeDesktopStore } from "./lib/desktopStore";

type ReviewFlagId =
  | "payment-pressure"
  | "repeated-contact"
  | "spoofing"
  | "known-contact"
  | "expected-call";

type SavedLookup = {
  id: string;
  phoneNumber: string;
  regionHint: string;
  note: string;
  selectedFlags: ReviewFlagId[];
  result: PhoneLookupResult;
};

type SentinelHistoryExport = {
  exportedAt: string;
  lookups: SavedLookup[];
  schema: "tenra-sentinel-desktop-history:v1";
};

type ReviewFlag = {
  id: ReviewFlagId;
  label: string;
  direction: EvidenceDirection;
  confidence: number;
  summary: string;
};

const storageKey = "tenra-sentinel-desktop-lookups:v1";

const reviewFlags: ReviewFlag[] = [
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

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sentinel-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

const todayForFilename = () => new Date().toISOString().slice(0, 10);

const downloadJsonFile = (value: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const normalizePhoneNumber = (input: string): string => {
  const trimmed = input.trim();
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+")) return digitsOnly;
  return `+${digitsOnly}`;
};

const buildManualEvidence = (input: {
  flags: ReviewFlagId[];
  note: string;
  observedAt: string;
}): EvidenceItem[] => {
  const selected = reviewFlags.filter((flag) => input.flags.includes(flag.id));
  const evidence = selected.map((flag): EvidenceItem => ({
    id: `manual-${flag.id}`,
    label: flag.label,
    summary: flag.summary,
    direction: flag.direction,
    confidence: flag.confidence,
    sourceId: "internal-review",
    observedAt: input.observedAt,
    redactionSafeSummary: flag.summary,
  }));

  if (input.note.trim()) {
    evidence.push({
      id: "manual-review-note",
      label: "Operator note",
      summary: input.note.trim(),
      direction: "context-only",
      confidence: 0.35,
      sourceId: "manual-input",
      observedAt: input.observedAt,
      redactionSafeSummary: input.note.trim(),
    });
  }

  return evidence;
};

const buildManualSourceObservation = (observedAt: string, evidence: EvidenceItem[]): SourceObservation => ({
  sourceId: "internal-review",
  status: evidence.some((item) => item.direction !== "context-only") ? "complete" : "available",
  observedAt,
  summary:
    evidence.length > 0
      ? `${evidence.length} manual review signal(s) captured.`
      : "Manual review is available, but no review signal was selected.",
});

const buildResult = async (input: {
  phoneNumber: string;
  regionHint: string;
  note: string;
  flags: ReviewFlagId[];
}): Promise<PhoneLookupResult> => {
  const observedAt = nowIso();
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
  const redacted = redactPhoneNumber(normalizedPhoneNumber);
  const orchestration = await orchestratePhoneLookup({
    rawInput: input.phoneNumber,
    normalizedPhoneNumber,
    regionHint: input.regionHint,
    includeEvidence: true,
    requestedAt: observedAt,
  });
  const manualEvidence = buildManualEvidence({
    flags: input.flags,
    note: input.note,
    observedAt,
  });
  const evidence = [...manualEvidence, ...orchestration.evidence];
  const sourceSummaries = [
    buildManualSourceObservation(observedAt, manualEvidence),
    ...orchestration.sourceSummaries,
  ];
  const hasManualRiskSignal = manualEvidence.some((item) => item.direction !== "context-only");
  const assessment = hasManualRiskSignal
    ? createEvidenceWeightedAssessment({ evidence, sources: sourceSummaries })
    : orchestration.assessment;
  const notices: PhoneLookupResult["notices"] = [];

  if (assessment.posture === "insufficient-signal") {
    notices.push({
      code: "placeholder-result",
      summary:
        "Local pattern review did not produce enough evidence for a risk conclusion. Add review signals or corroborating context before acting on it.",
    });
  }

  if (orchestration.providerResults.some((result) => result.providerStatus === "placeholder")) {
    notices.push({
      code: "provider-not-configured",
      summary: "Live phone intelligence providers are not configured.",
    });
  }

  notices.push({
    code: "redacted-output",
    summary: `The lookup target is displayed in redacted form (${redacted.redactedValue}).`,
  });

  return {
    job: {
      id: `lookup-${Date.now()}`,
      targetKind: "phone-number",
      submittedAt: observedAt,
      status: assessment.posture === "insufficient-signal" ? "insufficient-signal" : "completed",
      correlationKey: normalizedPhoneNumber,
    },
    query: {
      rawInput: input.phoneNumber,
      normalizedPhoneNumber,
      maskedPhoneNumber: redacted.redactedValue,
      ...(input.regionHint ? { regionHint: input.regionHint } : {}),
    },
    assessment: {
      ...assessment,
      evidence,
      sources: sourceSummaries,
    },
    evidence,
    sourceSummaries,
    notices,
    generatedAt: observedAt,
  };
};

const loadSavedLookups = () => {
  return [];
};

const isSavedLookup = (value: unknown): value is SavedLookup => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedLookup>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.phoneNumber === "string" &&
    typeof candidate.regionHint === "string" &&
    typeof candidate.note === "string" &&
    Array.isArray(candidate.selectedFlags) &&
    Boolean(candidate.result)
  );
};

const parseHistoryImport = (input: unknown): SavedLookup[] => {
  const lookups = Array.isArray(input)
    ? input
    : input && typeof input === "object" && Array.isArray((input as Partial<SentinelHistoryExport>).lookups)
      ? (input as Partial<SentinelHistoryExport>).lookups
      : null;

  if (!lookups || !lookups.every(isSavedLookup)) {
    throw new Error("Sentinel history JSON must contain lookup records.");
  }

  return lookups;
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const toMarkdown = (saved: SavedLookup) => {
  const { result } = saved;

  return [
    `# Sentinel Lookup ${result.query.maskedPhoneNumber}`,
    "",
    `Generated: ${result.generatedAt}`,
    `Region: ${result.query.regionHint ?? "n/a"}`,
    `Risk: ${riskLevelToneMap[result.assessment.level].label}`,
    `Posture: ${result.assessment.posture}`,
    `Confidence: ${result.assessment.confidence.score.toFixed(2)} (${result.assessment.confidence.band.label})`,
    "",
    "## Reasoning",
    "",
    result.assessment.reasoning.narrative,
    "",
    "## Factors",
    "",
    ...result.assessment.reasoning.factors.map((factor) => `- ${factor}`),
    "",
    "## Evidence",
    "",
    ...result.evidence.map((item) => `- ${item.label}: ${item.redactionSafeSummary}`),
    "",
    "## Sources",
    "",
    ...result.sourceSummaries.map((source) => `- ${source.sourceId}: ${source.status} - ${source.summary}`),
    saved.note.trim() ? ["", "## Operator Note", "", saved.note.trim()].join("\n") : "",
  ].join("\n");
};

const toDeriveRiskBrief = (saved: SavedLookup) => {
  const { result } = saved;

  return [
    "# Derive Risk Brief From Sentinel",
    "",
    `Target: ${result.query.maskedPhoneNumber}`,
    `Region: ${result.query.regionHint ?? "n/a"}`,
    `Risk: ${riskLevelToneMap[result.assessment.level].label}`,
    `Confidence: ${result.assessment.confidence.score.toFixed(2)} (${result.assessment.confidence.band.label})`,
    `Generated: ${result.generatedAt}`,
    "",
    "## Question For Derive",
    "",
    "Given the Sentinel evidence and source posture below, what can be concluded, what remains uncertain, and what action should a human reviewer take next?",
    "",
    "## Current Reasoning",
    "",
    result.assessment.reasoning.narrative,
    "",
    "## Evidence",
    "",
    ...result.evidence.map((item) => `- ${item.label}: ${item.redactionSafeSummary}`),
    "",
    "## Sources",
    "",
    ...result.sourceSummaries.map((source) => `- ${source.sourceId}: ${source.status} - ${source.summary}`),
  ].join("\n");
};

export default function App() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [regionHint, setRegionHint] = useState("US");
  const [note, setNote] = useState("");
  const [selectedFlags, setSelectedFlags] = useState<ReviewFlagId[]>([]);
  const [savedLookups, setSavedLookups] = useState<SavedLookup[]>(loadSavedLookups);
  const [activeId, setActiveId] = useState(savedLookups[0]?.id ?? "");
  const [handoffJson, setHandoffJson] = useState("");
  const [importedRiskBrief, setImportedRiskBrief] = useState<SentinelRiskBrief | null>(null);
  const [deriveContext, setDeriveContext] = useState<DeriveReasoningBriefContext | null>(null);
  const [notice, setNotice] = useState("Local lookup desk ready.");
  const [isRunning, setIsRunning] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    readDesktopStore<SavedLookup[]>(storageKey)
      .then((storedLookups) => {
        if (cancelled) return;

        const legacyLookups = readLegacyLocalStorage<SavedLookup[]>(storageKey);
        const nextLookups =
          Array.isArray(storedLookups) && storedLookups.length > 0
            ? storedLookups
            : Array.isArray(legacyLookups) && legacyLookups.length > 0
              ? legacyLookups
              : null;

        if (nextLookups) {
          setSavedLookups(nextLookups);
          setActiveId(nextLookups[0]?.id ?? "");
          setNotice(storedLookups ? "Desktop store loaded." : "Legacy workbench records migrated.");
        }

        setIsStoreReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNotice(error instanceof Error ? error.message : "Desktop store unavailable.");
        setIsStoreReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isStoreReady) return;

    void writeDesktopStore(storageKey, savedLookups).catch((error: unknown) => {
      setNotice(error instanceof Error ? error.message : "Desktop store write failed.");
    });
  }, [isStoreReady, savedLookups]);

  const activeLookup = savedLookups.find((lookup) => lookup.id === activeId) ?? savedLookups[0] ?? null;
  const activeTone = activeLookup ? riskLevelToneMap[activeLookup.result.assessment.level] : riskLevelToneMap.unknown;
  const markdown = useMemo(() => (activeLookup ? toMarkdown(activeLookup) : ""), [activeLookup]);
  const deriveRiskBrief = useMemo(() => (activeLookup ? toDeriveRiskBrief(activeLookup) : ""), [activeLookup]);
  const activeRiskBrief = useMemo(
    () => (activeLookup ? buildSentinelRiskBrief({ lookup: activeLookup.result }) : null),
    [activeLookup],
  );

  const toggleFlag = (flagId: ReviewFlagId) => {
    setSelectedFlags((current) =>
      current.includes(flagId) ? current.filter((id) => id !== flagId) : [...current, flagId],
    );
  };

  const runLookup = async () => {
    if (phoneNumber.trim().replace(/\D/g, "").length < 7) {
      setNotice("Enter at least 7 digits before running a lookup.");
      return;
    }

    setIsRunning(true);
    setNotice("Preparing local assessment...");

    try {
      const result = await buildResult({
        phoneNumber,
        regionHint,
        note,
        flags: selectedFlags,
      });
      const saved: SavedLookup = {
        id: createId(),
        phoneNumber,
        regionHint,
        note,
        selectedFlags,
        result,
      };
      setSavedLookups((current) => [saved, ...current]);
      setActiveId(saved.id);
      setNotice("Assessment saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Lookup failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const copyMarkdown = async () => {
    if (!activeLookup) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setNotice("Markdown copied.");
    } catch {
      setNotice("Clipboard copy failed. Export still works.");
    }
  };

  const copyDeriveBrief = async () => {
    if (!activeLookup) return;
    try {
      await navigator.clipboard.writeText(deriveRiskBrief);
      setNotice("Derive risk brief copied.");
    } catch {
      setNotice("Clipboard copy failed. Export still works.");
    }
  };

  const copyRiskBrief = async (consumer: SentinelRiskBriefConsumer = "derive") => {
    if (!activeLookup) return;
    const payload = buildSentinelRiskBrief({
      lookup: activeLookup.result,
      recommendedConsumers: [consumer],
    });
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setNotice(`Risk brief copied for ${consumer}.`);
    } catch {
      setNotice("Clipboard copy failed. Export still works.");
    }
  };

  const copyGuardrailReview = async () => {
    const brief = activeRiskBrief;
    if (!brief) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(buildSentinelGuardrailReviewRequest({ brief }), null, 2),
      );
      setNotice("Guardrail review packet copied.");
    } catch {
      setNotice("Clipboard copy failed. Risk JSON export still works.");
    }
  };

  const exportGuardrailReview = () => {
    const brief = activeRiskBrief;
    if (!brief) return;
    downloadJsonFile(
      buildSentinelGuardrailReviewRequest({ brief }),
      `tenra-sentinel-guardrail-review-${todayForFilename()}.json`,
    );
    setNotice("Guardrail review export created.");
  };

  const exportRiskBrief = () => {
    if (!activeLookup) return;
    downloadJsonFile(
      buildSentinelRiskBrief({ lookup: activeLookup.result }),
      `tenra-sentinel-risk-brief-${todayForFilename()}.json`,
    );
    setNotice("Risk brief export created.");
  };

  const importRiskBrief = () => {
    if (!handoffJson.trim()) {
      setNotice("Paste a Sentinel risk brief or Derive reasoning brief before importing.");
      return;
    }

    try {
      const parsed = JSON.parse(handoffJson) as { schema?: string };
      if (parsed.schema === "tenra-derive.reasoning-brief.v1") {
        const context = parseDeriveReasoningBriefContext(parsed);
        setDeriveContext(context);
        setHandoffJson("");
        setNotice("Imported Derive reasoning brief as Sentinel review context.");
        return;
      }

      const brief = parseSentinelRiskBrief(parsed);
      const saved: SavedLookup = {
        id: createId(),
        phoneNumber: brief.lookup.query.rawInput,
        regionHint: brief.lookup.query.regionHint ?? "",
        note: brief.handoff.questionForDerive,
        selectedFlags: [],
        result: brief.lookup,
      };
      setSavedLookups((current) => [saved, ...current]);
      setActiveId(saved.id);
      setImportedRiskBrief(brief);
      setNotice(`Imported ${brief.schema}; ready for ${brief.handoff.recommendedConsumers.join(", ")}.`);
    } catch (error) {
      setImportedRiskBrief(null);
      setNotice(error instanceof Error ? error.message : "Risk brief import failed.");
    }
  };

  const exportMarkdown = () => {
    if (!activeLookup) return;
    const slug = `sentinel-${activeLookup.result.query.maskedPhoneNumber.replace(/[^a-zA-Z0-9]+/g, "-")}`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Markdown export created.");
  };

  const exportHistory = () => {
    const payload: SentinelHistoryExport = {
      exportedAt: nowIso(),
      lookups: savedLookups,
      schema: "tenra-sentinel-desktop-history:v1",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `tenra-sentinel-history-${todayForFilename()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Lookup history export created.");
  };

  const importHistory = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const lookups = parseHistoryImport(JSON.parse(await file.text()));
      setSavedLookups(lookups);
      setActiveId(lookups[0]?.id ?? "");
      setNotice(`Imported ${lookups.length} lookup record(s).`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Lookup history import failed.");
    }
  };

  return (
    <main className="desktop-shell">
      <aside className="lookup-sidebar">
        <header className="brand-block">
          <span>Desktop operations</span>
          <h1>{sentinelAppName}</h1>
          <p>Local lookup review, evidence weighting, and source posture.</p>
        </header>

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
                <input
                  checked={selectedFlags.includes(flag.id)}
                  type="checkbox"
                  onChange={() => toggleFlag(flag.id)}
                />
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
            <button type="button" onClick={exportHistory}>
              Export History
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()}>
              Import History
            </button>
          </div>
          <input
            ref={importInputRef}
            className="hidden-file-input"
            type="file"
            accept="application/json"
            onChange={importHistory}
          />
          <p className="notice" role="status">
            {notice}
          </p>
        </section>

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
          {deriveContext ? (
            <div className="notice">
              Derive context: {deriveContext.confidence} confidence · {deriveContext.openQuestions.length} open question(s)
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

        <nav className="history-list" aria-label="Lookup history">
          {savedLookups.map((lookup) => (
            <button
              className={lookup.id === activeLookup?.id ? "history-item history-item-active" : "history-item"}
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
      </aside>

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
              <section className="panel-card">
                <header className="panel-header">
                  <span>Reasoning</span>
                  <strong>{activeLookup.result.assessment.posture}</strong>
                </header>
                <p>{activeLookup.result.assessment.reasoning.narrative}</p>
                <ul>
                  {activeLookup.result.assessment.reasoning.factors.map((factor) => (
                    <li key={factor}>{factor}</li>
                  ))}
                </ul>
              </section>

              <section className="panel-card">
                <header className="panel-header">
                  <span>Evidence</span>
                  <strong>{activeLookup.result.evidence.length}</strong>
                </header>
                <ul className="evidence-list">
                  {activeLookup.result.evidence.map((item) => (
                    <li key={item.id}>
                      <strong>{item.label}</strong>
                      <span>{item.direction} / {item.confidence.toFixed(2)}</span>
                      <p>{item.redactionSafeSummary}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel-card">
                <header className="panel-header">
                  <span>Sources</span>
                  <strong>{activeLookup.result.sourceSummaries.length}</strong>
                </header>
                <ul className="source-list">
                  {activeLookup.result.sourceSummaries.map((source) => (
                    <li key={`${source.sourceId}-${source.observedAt}`}>
                      <strong>{source.sourceId}</strong>
                      <span>{source.status}</span>
                      <p>{source.summary}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {deriveContext ? (
                <section className="panel-card">
                    <header className="panel-header">
                      <span>Derive Context</span>
                      <strong>{deriveContext.confidence}</strong>
                    </header>
                    <p>{deriveContext.summary}</p>
                    <p>{deriveContext.answerText}</p>
                    {deriveContext.openQuestions.length ? (
                      <ul className="evidence-list">
                        {deriveContext.openQuestions.map((question) => (
                          <li key={question}>
                            <strong>Open question</strong>
                            <p>{question}</p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                </section>
              ) : null}

              <section className="panel-card">
                <header className="panel-header">
                  <span>Export</span>
                  <strong>{activeLookup.result.query.maskedPhoneNumber}</strong>
                </header>
                <div className="action-row">
                  <button type="button" onClick={copyMarkdown}>
                    Copy Markdown
                  </button>
                  <button type="button" onClick={copyDeriveBrief}>
                    Copy Derive Brief
                  </button>
                  <button type="button" onClick={() => void copyRiskBrief("guardrail")}>
                    Send Guardrail
                  </button>
                  <button type="button" onClick={() => void copyGuardrailReview()}>
                    Guardrail Review
                  </button>
                  <button type="button" onClick={exportGuardrailReview}>
                    Review JSON
                  </button>
                  <button type="button" onClick={exportRiskBrief}>
                    Risk JSON
                  </button>
                  <button type="button" onClick={exportMarkdown}>
                    Export
                  </button>
                </div>
                <pre>{activeRiskBrief ? JSON.stringify(activeRiskBrief, null, 2) : markdown}</pre>
              </section>
            </div>
          </>
        ) : (
          <section className="empty-state">
            <span className="eyebrow">No assessment selected</span>
            <h2>Run a lookup to create the first local assessment.</h2>
          </section>
        )}
      </section>
    </main>
  );
}

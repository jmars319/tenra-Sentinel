import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  buildSentinelGuardrailReviewRequest,
  buildSentinelRiskBrief,
  type SentinelRiskBrief,
  type SentinelRiskBriefConsumer,
} from "@sentinel/api-contracts";
import { parseDeriveReasoningBriefContext, parseSentinelRiskBrief, type DeriveReasoningBriefContext } from "@sentinel/validation";

import { readDesktopStore, readLegacyLocalStorage, writeDesktopStore } from "../lib/desktopStore";
import { toDeriveRiskBrief, toMarkdown } from "../lib/sentinelExports";
import { buildResult } from "../lib/sentinelAssessment";
import {
  createId,
  downloadJsonFile,
  nowIso,
  parseHistoryImport,
  storageKey,
  todayForFilename,
} from "../lib/sentinelStorage";
import type { ReviewFlagId, SavedLookup, SentinelHistoryExport } from "../lib/sentinelTypes";

const loadSavedLookups = () => [];

export const useSentinelDesk = () => {
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
  const [handoffImportError, setHandoffImportError] = useState("");
  const [outboundPreview, setOutboundPreview] = useState("");
  const [notice, setNotice] = useState("Local lookup desk ready.");
  const [isRunning, setIsRunning] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);

  // Desktop persistence boundary
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

  // Lookup payload boundary
  const activeLookup = savedLookups.find((lookup) => lookup.id === activeId) ?? savedLookups[0] ?? null;
  const markdown = useMemo(() => (activeLookup ? toMarkdown(activeLookup) : ""), [activeLookup]);
  const deriveRiskBrief = useMemo(() => (activeLookup ? toDeriveRiskBrief(activeLookup) : ""), [activeLookup]);
  const activeRiskBrief = useMemo(
    () => (activeLookup ? buildSentinelRiskBrief({ lookup: activeLookup.result }) : null),
    [activeLookup],
  );

  // Risk review boundary
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
      const result = await buildResult({ phoneNumber, regionHint, note, flags: selectedFlags });
      const saved: SavedLookup = { id: createId(), phoneNumber, regionHint, note, selectedFlags, result };
      setSavedLookups((current) => [saved, ...current]);
      setActiveId(saved.id);
      setNotice("Assessment saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Lookup failed.");
    } finally {
      setIsRunning(false);
    }
  };

  // Suite transfer boundary
  const copyText = async (text: string, success: string, fallback: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(success);
    } catch {
      setNotice(fallback);
    }
  };

  const copyMarkdown = async () => {
    if (!activeLookup) return;
    await copyText(markdown, "Markdown copied.", "Clipboard copy failed. Export still works.");
  };

  const copyDeriveBrief = async () => {
    if (!activeLookup) return;
    await copyText(deriveRiskBrief, "Derive risk brief copied.", "Clipboard copy failed. Export still works.");
  };

  const copyRiskBrief = async (consumer: SentinelRiskBriefConsumer = "derive") => {
    if (!activeLookup) return;
    const payload = buildSentinelRiskBrief({ lookup: activeLookup.result, recommendedConsumers: [consumer] });
    await copyText(JSON.stringify(payload, null, 2), `Risk brief copied for ${consumer}.`, "Clipboard copy failed. Export still works.");
  };

  const copyGuardrailReview = async () => {
    const brief = activeRiskBrief;
    if (!brief) return;
    await copyText(
      JSON.stringify(buildSentinelGuardrailReviewRequest({ brief }), null, 2),
      "Guardrail review packet copied.",
      "Clipboard copy failed. Risk JSON export still works.",
    );
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

  // Suite inbox boundary
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
        setHandoffImportError("");
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
      setHandoffImportError("");
      setNotice(`Imported ${brief.schema}; ready for ${brief.handoff.recommendedConsumers.join(", ")}.`);
    } catch (error) {
      setImportedRiskBrief(null);
      const message = error instanceof Error ? error.message : "Risk brief import failed.";
      setHandoffImportError(message);
      setNotice(message);
    }
  };

  // Outbound preview boundary
  const previewOutbound = (target: "derive" | "guardrail") => {
    if (!activeRiskBrief) return;
    const payload =
      target === "guardrail"
        ? buildSentinelGuardrailReviewRequest({ brief: activeRiskBrief })
        : buildSentinelRiskBrief({ lookup: activeRiskBrief.lookup, recommendedConsumers: ["derive"] });
    setOutboundPreview(JSON.stringify(payload, null, 2));
  };

  // History portability boundary
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
    downloadJsonFile(payload, `tenra-sentinel-history-${todayForFilename()}.json`);
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

  return {
    activeLookup,
    activeRiskBrief,
    deriveContext,
    form: {
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
    },
    handoff: {
      handoffImportError,
      handoffJson,
      importedRiskBrief,
      importRiskBrief,
      setHandoffJson,
    },
    history: { activeId, exportHistory, savedLookups, setActiveId },
    output: {
      copyDeriveBrief,
      copyGuardrailReview,
      copyMarkdown,
      copyRiskBrief,
      exportGuardrailReview,
      exportMarkdown,
      exportRiskBrief,
      outboundPreview,
      previewOutbound,
    },
  };
};

export type SentinelDeskState = ReturnType<typeof useSentinelDesk>;

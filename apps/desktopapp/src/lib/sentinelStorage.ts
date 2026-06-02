import type { SavedLookup, SentinelHistoryExport } from "./sentinelTypes";

export const storageKey = "tenra-sentinel-desktop-lookups:v1";

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sentinel-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const nowIso = () => new Date().toISOString();

export const todayForFilename = () => new Date().toISOString().slice(0, 10);

export const downloadJsonFile = (value: unknown, filename: string) => {
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

export const isSavedLookup = (value: unknown): value is SavedLookup => {
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

export const parseHistoryImport = (input: unknown): SavedLookup[] => {
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

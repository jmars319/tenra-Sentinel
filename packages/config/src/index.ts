export const sentinelAppName = "Sentinel by Tenra";
export const sentinelTagline =
  "Explainable signal aggregation for calm, confidence-weighted risk assessment.";

export const sentinelApps = {
  web: "@sentinel/webapp",
  desktop: "@sentinel/desktopapp",
  mobile: "@sentinel/mobileapp"
} as const;

export const sentinelEnvKeys = {
  appName: "APP_NAME",
  apiBaseUrl: "API_BASE_URL",
  sessionSecret: "SESSION_SECRET",
  lookupProvider: "LOOKUP_PROVIDER",
  lookupProviderApiKey: "LOOKUP_PROVIDER_API_KEY",
  realtimeProvider: "REALTIME_PROVIDER",
  realtimeApiKey: "REALTIME_API_KEY",
  sentryDsn: "SENTRY_DSN"
} as const;

export type SentinelEnvKey =
  (typeof sentinelEnvKeys)[keyof typeof sentinelEnvKeys];

export const readEnv = (
  env: Record<string, string | undefined>,
  key: SentinelEnvKey,
  fallback?: string
): string => {
  const value = env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing Sentinel env value: ${key}`);
  }

  return value;
};

import { writeStructuredLog } from "./logger";

/**
 * Supported runtime setting keys for the guide application.
 */
export type GuideRuntimeSettingKey =
  | "GUIDE_DEFAULT_PORT"
  | "GUIDE_DEV_BUILD_DEBOUNCE_MS"
  | "GUIDE_DEV_WATCHER_WARMUP_MS"
  | "GUIDE_HOST"
  | "GUIDE_MANIFEST_MAX_AGE_SECONDS"
  | "GUIDE_MANIFEST_STALE_WHILE_REVALIDATE_SECONDS"
  | "GUIDE_REQUEST_ID_HEADER"
  | "GUIDE_SERVE_PORT"
  | "GUIDE_SOCIAL_ASSET_MAX_AGE_SECONDS"
  | "GUIDE_SOCIAL_ASSET_STALE_WHILE_REVALIDATE_SECONDS"
  | "GUIDE_STATIC_ASSET_MAX_AGE_SECONDS"
  | "GUIDE_STATIC_ASSET_STALE_WHILE_REVALIDATE_SECONDS";

/**
 * Environment variables consumed by the shared runtime-settings resolver.
 */
export interface GuideRuntimeEnvironment extends Readonly<Record<string, string | undefined>> {
  GUIDE_DEFAULT_PORT?: string;
  GUIDE_DEV_BUILD_DEBOUNCE_MS?: string;
  GUIDE_DEV_WATCHER_WARMUP_MS?: string;
  GUIDE_HOST?: string;
  GUIDE_MANIFEST_MAX_AGE_SECONDS?: string;
  GUIDE_MANIFEST_STALE_WHILE_REVALIDATE_SECONDS?: string;
  GUIDE_REQUEST_ID_HEADER?: string;
  GUIDE_SERVE_PORT?: string;
  GUIDE_SOCIAL_ASSET_MAX_AGE_SECONDS?: string;
  GUIDE_SOCIAL_ASSET_STALE_WHILE_REVALIDATE_SECONDS?: string;
  GUIDE_STATIC_ASSET_MAX_AGE_SECONDS?: string;
  GUIDE_STATIC_ASSET_STALE_WHILE_REVALIDATE_SECONDS?: string;
}

/**
 * Warning emitted when a runtime setting falls back to its default.
 */
export interface GuideRuntimeSettingWarning {
  fallbackValue: string;
  key: GuideRuntimeSettingKey;
  receivedValue: string;
}

/**
 * Stable default runtime settings for the guide application.
 */
export const GUIDE_RUNTIME_DEFAULTS = {
  defaultPort: 3000,
  devBuildDebounceMs: 150,
  devWatcherWarmupMs: 1000,
  host: "localhost",
  manifestMaxAgeSeconds: 3600,
  manifestStaleWhileRevalidateSeconds: 86400,
  requestIdHeader: "x-request-id",
  servePort: 3090,
  socialAssetMaxAgeSeconds: 86400,
  socialAssetStaleWhileRevalidateSeconds: 604800,
  staticAssetMaxAgeSeconds: 3600,
  staticAssetStaleWhileRevalidateSeconds: 86400,
} as const;

/**
 * Fully resolved runtime settings shared by config, server entrypoints, and scripts.
 */
export interface GuideRuntimeSettings {
  defaultPort: number;
  devBuildDebounceMs: number;
  devWatcherWarmupMs: number;
  host: string;
  manifestMaxAgeSeconds: number;
  manifestStaleWhileRevalidateSeconds: number;
  requestIdHeader: string;
  servePort: number;
  socialAssetMaxAgeSeconds: number;
  socialAssetStaleWhileRevalidateSeconds: number;
  staticAssetMaxAgeSeconds: number;
  staticAssetStaleWhileRevalidateSeconds: number;
  warnings: readonly GuideRuntimeSettingWarning[];
}

interface GuideResolvedStringSetting {
  value: string;
  warning: GuideRuntimeSettingWarning | null;
}

interface GuideResolvedNumberSetting {
  value: number;
  warning: GuideRuntimeSettingWarning | null;
}

const resolveGuideDefaultHost = (env: GuideRuntimeEnvironment): string =>
  typeof env.PORT === "string" && env.PORT.trim() ? "0.0.0.0" : GUIDE_RUNTIME_DEFAULTS.host;

const resolveRuntimeStringSetting = (
  env: GuideRuntimeEnvironment,
  key: GuideRuntimeSettingKey,
  fallbackValue: string,
  normalize: (value: string) => string
): GuideResolvedStringSetting => {
  const receivedValue = env[key];
  const normalizedValue = receivedValue?.trim();

  if (!normalizedValue) {
    return {
      value: fallbackValue,
      warning: null,
    };
  }

  const value = normalize(normalizedValue);
  if (!value) {
    return {
      value: fallbackValue,
      warning: {
        fallbackValue,
        key,
        receivedValue: receivedValue ?? "",
      },
    };
  }

  return {
    value,
    warning: null,
  };
};

const resolveRuntimeIntegerSetting = (
  env: GuideRuntimeEnvironment,
  key: GuideRuntimeSettingKey,
  fallbackValue: number
): GuideResolvedNumberSetting => {
  const receivedValue = env[key];
  const normalizedValue = receivedValue?.trim();

  if (!normalizedValue) {
    return {
      value: fallbackValue,
      warning: null,
    };
  }

  const value = Number(normalizedValue);
  if (!Number.isInteger(value) || value <= 0) {
    return {
      value: fallbackValue,
      warning: {
        fallbackValue: String(fallbackValue),
        key,
        receivedValue: receivedValue ?? "",
      },
    };
  }

  return {
    value,
    warning: null,
  };
};

/**
 * Resolves the shared guide runtime settings from environment variables.
 */
export const resolveGuideRuntimeSettings = (env: GuideRuntimeEnvironment): GuideRuntimeSettings => {
  const warnings: GuideRuntimeSettingWarning[] = [];
  const addWarning = (warning: GuideRuntimeSettingWarning | null): void => {
    if (warning) {
      warnings.push(warning);
    }
  };

  const host = resolveRuntimeStringSetting(env, "GUIDE_HOST", resolveGuideDefaultHost(env), (value) => value);
  addWarning(host.warning);

  const defaultPort = resolveRuntimeIntegerSetting(env, "GUIDE_DEFAULT_PORT", GUIDE_RUNTIME_DEFAULTS.defaultPort);
  addWarning(defaultPort.warning);

  const servePort = resolveRuntimeIntegerSetting(env, "GUIDE_SERVE_PORT", GUIDE_RUNTIME_DEFAULTS.servePort);
  addWarning(servePort.warning);

  const staticAssetMaxAgeSeconds = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_STATIC_ASSET_MAX_AGE_SECONDS",
    GUIDE_RUNTIME_DEFAULTS.staticAssetMaxAgeSeconds
  );
  addWarning(staticAssetMaxAgeSeconds.warning);

  const staticAssetStaleWhileRevalidateSeconds = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_STATIC_ASSET_STALE_WHILE_REVALIDATE_SECONDS",
    GUIDE_RUNTIME_DEFAULTS.staticAssetStaleWhileRevalidateSeconds
  );
  addWarning(staticAssetStaleWhileRevalidateSeconds.warning);

  const manifestMaxAgeSeconds = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_MANIFEST_MAX_AGE_SECONDS",
    GUIDE_RUNTIME_DEFAULTS.manifestMaxAgeSeconds
  );
  addWarning(manifestMaxAgeSeconds.warning);

  const manifestStaleWhileRevalidateSeconds = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_MANIFEST_STALE_WHILE_REVALIDATE_SECONDS",
    GUIDE_RUNTIME_DEFAULTS.manifestStaleWhileRevalidateSeconds
  );
  addWarning(manifestStaleWhileRevalidateSeconds.warning);

  const socialAssetMaxAgeSeconds = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_SOCIAL_ASSET_MAX_AGE_SECONDS",
    GUIDE_RUNTIME_DEFAULTS.socialAssetMaxAgeSeconds
  );
  addWarning(socialAssetMaxAgeSeconds.warning);

  const socialAssetStaleWhileRevalidateSeconds = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_SOCIAL_ASSET_STALE_WHILE_REVALIDATE_SECONDS",
    GUIDE_RUNTIME_DEFAULTS.socialAssetStaleWhileRevalidateSeconds
  );
  addWarning(socialAssetStaleWhileRevalidateSeconds.warning);

  const devBuildDebounceMs = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_DEV_BUILD_DEBOUNCE_MS",
    GUIDE_RUNTIME_DEFAULTS.devBuildDebounceMs
  );
  addWarning(devBuildDebounceMs.warning);

  const devWatcherWarmupMs = resolveRuntimeIntegerSetting(
    env,
    "GUIDE_DEV_WATCHER_WARMUP_MS",
    GUIDE_RUNTIME_DEFAULTS.devWatcherWarmupMs
  );
  addWarning(devWatcherWarmupMs.warning);

  const requestIdHeader = resolveRuntimeStringSetting(
    env,
    "GUIDE_REQUEST_ID_HEADER",
    GUIDE_RUNTIME_DEFAULTS.requestIdHeader,
    (value) => value.toLowerCase()
  );
  addWarning(requestIdHeader.warning);

  return {
    defaultPort: defaultPort.value,
    devBuildDebounceMs: devBuildDebounceMs.value,
    devWatcherWarmupMs: devWatcherWarmupMs.value,
    host: host.value,
    manifestMaxAgeSeconds: manifestMaxAgeSeconds.value,
    manifestStaleWhileRevalidateSeconds: manifestStaleWhileRevalidateSeconds.value,
    requestIdHeader: requestIdHeader.value,
    servePort: servePort.value,
    socialAssetMaxAgeSeconds: socialAssetMaxAgeSeconds.value,
    socialAssetStaleWhileRevalidateSeconds: socialAssetStaleWhileRevalidateSeconds.value,
    staticAssetMaxAgeSeconds: staticAssetMaxAgeSeconds.value,
    staticAssetStaleWhileRevalidateSeconds: staticAssetStaleWhileRevalidateSeconds.value,
    warnings,
  };
};

/**
 * Runtime settings resolved from the host environment at module load.
 * Falls back to defaults when running in a browser (where `Bun` is unavailable).
 */
export const GUIDE_RUNTIME_SETTINGS = resolveGuideRuntimeSettings(
  typeof Bun !== "undefined" ? Bun.env : ({} as GuideRuntimeEnvironment)
);

/**
 * Logs invalid runtime settings once a process has initialized its structured logger.
 */
export const logGuideRuntimeSettingWarnings = (
  component: string,
  warnings: readonly GuideRuntimeSettingWarning[] = GUIDE_RUNTIME_SETTINGS.warnings
): void => {
  warnings.forEach((warning) => {
    writeStructuredLog({
      component,
      level: "WARN",
      message: "Invalid runtime setting. Falling back to the shared default.",
      context: {
        fallbackValue: warning.fallbackValue,
        key: warning.key,
        receivedValue: warning.receivedValue,
      },
    });
  });
};

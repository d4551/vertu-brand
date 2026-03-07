import { GUIDE_RUNTIME_SETTINGS } from "./runtime-settings";

/**
 * Shared HTMX cache-vary contract for fragment and history-aware navigation.
 */
export const HTMX_VARY_HEADER = "HX-Request, HX-History-Restore-Request, HX-Target";

const GUIDE_SERVER_PROTOCOL = "http";
const GUIDE_DOWNLOADS_ROUTE = "/downloads";
const GUIDE_IMAGE_ASSETS_ROUTE = "/assets/images";

/**
 * Shared response header used to propagate request correlation ids.
 */
export const GUIDE_REQUEST_ID_HEADER = GUIDE_RUNTIME_SETTINGS.requestIdHeader;

/**
 * Stable HTMX request headers used by the SSR shell and test suite.
 */
export const HTMX_REQUEST_HEADERS = {
  historyRestoreRequest: "HX-History-Restore-Request",
  request: "HX-Request",
  target: "HX-Target",
} as const;

/**
 * HTMX runtime configuration applied through the document head.
 */
export const HTMX_CONFIG = {
  historyRestoreAsHxRequest: false,
  refreshOnHistoryMiss: false,
} as const;

const toGuideCacheControl = (maxAgeSeconds: number, staleWhileRevalidateSeconds: number): string =>
  `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`;

/**
 * Builds the canonical local origin for app-handle tests and social URL defaults.
 */
export const toGuideOrigin = (port: number, host = GUIDE_RUNTIME_SETTINGS.host): string =>
  `${GUIDE_SERVER_PROTOCOL}://${host}:${port}`;

/**
 * Builds the public download href for a generated asset file name.
 */
export const toGuideDownloadHref = (fileName: string): string => `${GUIDE_DOWNLOADS_ROUTE}/${fileName}`;

/**
 * Builds the root-served public asset href for a canonical brand-owned file.
 */
export const toGuidePublicAssetHref = (fileName: string): string => `/${fileName}`;

/**
 * Builds the public href for a generated image asset served from `/assets/images`.
 */
export const toGuideImageAssetHref = (fileName: string): string => `${GUIDE_IMAGE_ASSETS_ROUTE}/${fileName}`;

/**
 * Shared server runtime defaults for the local boot flow and static delivery.
 */
export const GUIDE_SERVER = {
  assetCacheControl: toGuideCacheControl(
    GUIDE_RUNTIME_SETTINGS.socialAssetMaxAgeSeconds,
    GUIDE_RUNTIME_SETTINGS.socialAssetStaleWhileRevalidateSeconds
  ),
  defaultPort: GUIDE_RUNTIME_SETTINGS.defaultPort,
  host: GUIDE_RUNTIME_SETTINGS.host,
  localOrigin: toGuideOrigin(GUIDE_RUNTIME_SETTINGS.defaultPort, GUIDE_RUNTIME_SETTINGS.host),
  manifestCacheControl: toGuideCacheControl(
    GUIDE_RUNTIME_SETTINGS.manifestMaxAgeSeconds,
    GUIDE_RUNTIME_SETTINGS.manifestStaleWhileRevalidateSeconds
  ),
  servePort: GUIDE_RUNTIME_SETTINGS.servePort,
  staticAssetCacheControl: toGuideCacheControl(
    GUIDE_RUNTIME_SETTINGS.staticAssetMaxAgeSeconds,
    GUIDE_RUNTIME_SETTINGS.staticAssetStaleWhileRevalidateSeconds
  ),
} as const;

/**
 * Public route paths served by the guide application.
 */
export const GUIDE_ROUTES = {
  clientScript: "/assets/guide.js",
  downloads: GUIDE_DOWNLOADS_ROUTE,
  downloadsHtml: toGuideDownloadHref("vertu-brand-guide.html"),
  guide: "/",
  socialAsset: "/social",
  socialPack: "/social/packs",
  socialPreview: "/social/preview",
  stylesheet: "/assets/guide.css",
} as const;

/**
 * Canonical downloadable assets used by the client enhancement layer.
 */
export const GUIDE_DOWNLOADS = {
  "dl-docx": {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileName: "VERTU-Letterhead.docx",
    href: toGuideDownloadHref("VERTU-Letterhead.docx"),
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-guide": {
    contentType: "text/html; charset=utf-8",
    fileName: "vertu-brand-guide.html",
    href: GUIDE_ROUTES.downloadsHtml,
    toastDatasetKey: "toastGuideDownload",
  },
  "dl-logo-black": {
    contentType: "image/png",
    fileName: "VERTU-Logo-Black.png",
    href: toGuideDownloadHref("VERTU-Logo-Black.png"),
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-logo-gold": {
    contentType: "image/png",
    fileName: "VERTU-Logo-Gold.png",
    href: toGuideDownloadHref("VERTU-Logo-Gold.png"),
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-logo-white": {
    contentType: "image/png",
    fileName: "VERTU-Logo-White.png",
    href: toGuideDownloadHref("VERTU-Logo-White.png"),
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-pptx": {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    fileName: "VERTU-Template.pptx",
    href: toGuideDownloadHref("VERTU-Template.pptx"),
    toastDatasetKey: "toastAssetDownload",
  },
} as const;

/**
 * Shared brand assets surfaced directly by the generated public runtime.
 */
export const GUIDE_BRAND_ASSETS = {
  logoBlack: toGuidePublicAssetHref("VERTU-Logo-Black.png"),
  logoGold: toGuidePublicAssetHref("VERTU-Logo-Gold.png"),
  logoWhite: toGuidePublicAssetHref("VERTU-Logo-White.png"),
} as const;

/**
 * Builds a stable local request URL for direct `app.handle()` tests and audits.
 */
export const toGuideRequestUrl = (pathAndSearch: string): string =>
  new URL(pathAndSearch, GUIDE_SERVER.localOrigin).toString();

/**
 * Stable ids for the download cards rendered in the guide.
 */
export type GuideDownloadId = keyof typeof GUIDE_DOWNLOADS;

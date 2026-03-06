/**
 * Shared HTMX cache-vary contract for fragment and history-aware navigation.
 */
export const HTMX_VARY_HEADER = "HX-Request, HX-History-Restore-Request, HX-Target";

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

/**
 * Shared server runtime defaults for the local boot flow and static delivery.
 */
export const GUIDE_SERVER = {
  assetCacheControl: "public, max-age=86400, stale-while-revalidate=604800",
  defaultPort: 3000,
  localOrigin: "http://localhost:3000",
  manifestCacheControl: "public, max-age=3600, stale-while-revalidate=86400",
  servePort: 3090,
  staticAssetCacheControl: "public, max-age=3600, stale-while-revalidate=86400",
} as const;

/**
 * Public route paths served by the guide application.
 */
export const GUIDE_ROUTES = {
  clientScript: "/assets/guide.js",
  downloadsHtml: "/downloads/vertu-brand-guide.html",
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
    href: "/downloads/VERTU-Letterhead.docx",
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
    href: "/downloads/VERTU-Logo-Black.png",
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-logo-gold": {
    contentType: "image/png",
    fileName: "VERTU-Logo-Gold.png",
    href: "/downloads/VERTU-Logo-Gold.png",
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-logo-white": {
    contentType: "image/png",
    fileName: "VERTU-Logo-White.png",
    href: "/downloads/VERTU-Logo-White.png",
    toastDatasetKey: "toastAssetDownload",
  },
  "dl-pptx": {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    fileName: "VERTU-Template.pptx",
    href: "/downloads/VERTU-Template.pptx",
    toastDatasetKey: "toastAssetDownload",
  },
} as const;

/**
 * Shared brand assets surfaced directly by the generated public runtime.
 */
export const GUIDE_BRAND_ASSETS = {
  logoBlack: "/VERTU-Logo-Black.png",
  logoGold: "/VERTU-Logo-Gold.png",
  logoWhite: "/VERTU-Logo-White.png",
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

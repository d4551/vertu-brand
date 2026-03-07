import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";

import { GUIDE_PATHS } from "./runtime-config";
import { guideObservabilityPlugin, resolveGuideRequestId } from "./observability-plugin";
import {
  GUIDE_DOWNLOADS,
  GUIDE_REQUEST_ID_HEADER,
  GUIDE_ROUTES,
  GUIDE_SERVER,
  HTMX_REQUEST_HEADERS,
  HTMX_VARY_HEADER,
} from "../shared/config";
import type { GuideDownloadId } from "../shared/config";
import { writeStructuredLog } from "../shared/logger";
import { logGuideRuntimeSettingWarnings } from "../shared/runtime-settings";
import { GUIDE_DOM_IDS, GUIDE_SELECTORS } from "../shared/shell-contract";
import { resolveGuideViewState } from "../shared/view-state";
import { renderDocument, renderGuidePage, renderGuideShell } from "./render/layout";
import { socialToolkitPlugin } from "./social-plugin";

const staticAssets = await staticPlugin({
  alwaysStatic: true,
  assets: GUIDE_PATHS.publicRoot,
  headers: {
    "Cache-Control": GUIDE_SERVER.staticAssetCacheControl,
  },
  indexHTML: false,
  prefix: "/",
});

/**
 * Sets attachment headers for a downloadable asset so the browser saves
 * the file instead of rendering it inline.
 */
const applyDownloadHeaders = (set: { headers: Record<string, string | number> }, downloadId: GuideDownloadId): void => {
  const entry = GUIDE_DOWNLOADS[downloadId];
  set.headers["Content-Type"] = entry.contentType;
  set.headers["Content-Disposition"] = `attachment; filename="${entry.fileName}"`;
};

/**
 * Resolves the on-disk path for a downloadable asset.
 * The HTML guide ships from a separate build output; all other assets
 * live in the static public root.
 */
const resolveDownloadPath = (downloadId: GuideDownloadId): string =>
  downloadId === "dl-guide"
    ? GUIDE_PATHS.downloadGuideHtmlOutput
    : `${GUIDE_PATHS.publicRoot}/${GUIDE_DOWNLOADS[downloadId].fileName}`;

/**
 * Main Elysia application for the SSR guide shell and static assets.
 */
export const app = new Elysia({ nativeStaticResponse: true })
  .use(guideObservabilityPlugin)
  .get(GUIDE_ROUTES.guide, ({ request, set }) => {
    const requestUrl = new URL(request.url);
    const guideRequestId = resolveGuideRequestId(request);
    const viewState = resolveGuideViewState(new URL(request.url));
    const isHtmxRequest = request.headers.get(HTMX_REQUEST_HEADERS.request) === "true";
    const isHistoryRestoreRequest = request.headers.get(HTMX_REQUEST_HEADERS.historyRestoreRequest) === "true";
    const htmxTarget = request.headers.get(HTMX_REQUEST_HEADERS.target);

    if (viewState.error) {
      set.status = 404;
    }

    set.headers["Cache-Control"] = "no-store";
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    set.headers[GUIDE_REQUEST_ID_HEADER] = guideRequestId;
    set.headers.Vary = HTMX_VARY_HEADER;

    if (isHtmxRequest && !isHistoryRestoreRequest) {
      if (htmxTarget === GUIDE_DOM_IDS.page || htmxTarget === GUIDE_SELECTORS.page) {
        return renderGuidePage(viewState, requestUrl.origin, requestUrl.searchParams);
      }

      return renderGuideShell(viewState, requestUrl.origin, requestUrl.searchParams);
    }

    return renderDocument(viewState, requestUrl.origin, requestUrl.searchParams);
  })
  .group("", (group) => {
    const downloadIds = Object.keys(GUIDE_DOWNLOADS) as GuideDownloadId[];
    for (const id of downloadIds) {
      const href = GUIDE_DOWNLOADS[id].href;
      group
        .get(href, ({ request, set }) => {
          const guideRequestId = resolveGuideRequestId(request);
          applyDownloadHeaders(set, id);
          set.headers[GUIDE_REQUEST_ID_HEADER] = guideRequestId;
          return Bun.file(resolveDownloadPath(id));
        })
        .head(href, ({ request, set }) => {
          const guideRequestId = resolveGuideRequestId(request);
          applyDownloadHeaders(set, id);
          set.headers[GUIDE_REQUEST_ID_HEADER] = guideRequestId;
          return "";
        });
    }
    return group;
  })
  .use(socialToolkitPlugin)
  .use(staticAssets);

/**
 * Starts the guide server.
 */
export const startGuideServer = (port: number): void => {
  logGuideRuntimeSettingWarnings("server");
  app.listen({
    hostname: GUIDE_SERVER.host,
    port,
  });
  writeStructuredLog({
    component: "server",
    level: "INFO",
    message: "Guide server listening",
    context: {
      host: GUIDE_SERVER.host,
      port,
    },
  });
};

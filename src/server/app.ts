import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";

import { GUIDE_PATHS } from "./runtime-config";
import { GUIDE_DOWNLOADS, GUIDE_ROUTES, GUIDE_SERVER, HTMX_REQUEST_HEADERS, HTMX_VARY_HEADER } from "../shared/config";
import type { GuideDownloadId } from "../shared/config";
import { writeStructuredLog } from "../shared/logger";
import { GUIDE_DOM_IDS, GUIDE_SELECTORS } from "../shared/shell-contract";
import { resolveGuideViewState } from "../shared/view-state";
import { renderDocument, renderGuidePage, renderGuideShell } from "./render/layout";

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
  .get(GUIDE_ROUTES.guide, ({ request, set }) => {
    const viewState = resolveGuideViewState(new URL(request.url));
    const isHtmxRequest = request.headers.get(HTMX_REQUEST_HEADERS.request) === "true";
    const isHistoryRestoreRequest = request.headers.get(HTMX_REQUEST_HEADERS.historyRestoreRequest) === "true";
    const htmxTarget = request.headers.get(HTMX_REQUEST_HEADERS.target);

    if (viewState.error) {
      set.status = 404;
    }

    set.headers["Cache-Control"] = "no-store";
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    set.headers.Vary = HTMX_VARY_HEADER;

    if (isHtmxRequest && !isHistoryRestoreRequest) {
      if (htmxTarget === GUIDE_DOM_IDS.page || htmxTarget === GUIDE_SELECTORS.page) {
        return renderGuidePage(viewState);
      }

      return renderGuideShell(viewState);
    }

    return renderDocument(viewState);
  })
  .group("", (group) => {
    const downloadIds = Object.keys(GUIDE_DOWNLOADS) as GuideDownloadId[];
    for (const id of downloadIds) {
      const href = GUIDE_DOWNLOADS[id].href;
      const entry = GUIDE_DOWNLOADS[id];
      group
        .get(href, async () => {
          const body = await Bun.file(resolveDownloadPath(id)).arrayBuffer();
          return new Response(body, {
            headers: {
              "Content-Disposition": `attachment; filename="${entry.fileName}"`,
              "Content-Type": entry.contentType,
            },
          });
        })
        .head(href, ({ set }) => {
          applyDownloadHeaders(set, id);
          return "";
        });
    }
    return group;
  })
  .use(staticAssets);

/**
 * Starts the guide server.
 */
export const startGuideServer = (port: number): void => {
  app.listen(port);
  writeStructuredLog({
    component: "server",
    level: "INFO",
    message: "Guide server listening",
    context: { port },
  });
};

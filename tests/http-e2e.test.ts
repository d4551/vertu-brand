import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { app } from "../src/server/app";
import { HTMX_REQUEST_HEADERS } from "../src/shared/config";
import { GUIDE_DOM_IDS } from "../src/shared/shell-contract";

let liveServer: ReturnType<typeof app.listen> | null = null;
let baseUrl = "";

beforeAll(() => {
  liveServer = app.listen(0);
  const port = liveServer.server?.port;
  if (!port) {
    throw new Error("Live test server did not expose a port.");
  }
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  liveServer?.stop?.();
  liveServer?.server?.stop?.();
});

describe("live HTTP smoke", () => {
  test("serves SSR documents and HTMX fragments end to end", async () => {
    const fullResponse = await fetch(`${baseUrl}/?section=s15&lang=zh&theme=light`);
    const fullHtml = await fullResponse.text();
    const fragmentResponse = await fetch(`${baseUrl}/?section=s14&lang=en&theme=dark`, {
      headers: {
        [HTMX_REQUEST_HEADERS.request]: "true",
        [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.shell,
      },
    });
    const fragmentHtml = await fragmentResponse.text();
    const pageResponse = await fetch(`${baseUrl}/?section=s15&lang=zh&theme=light`, {
      headers: {
        [HTMX_REQUEST_HEADERS.request]: "true",
        [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.page,
      },
    });
    const pageHtml = await pageResponse.text();
    const historyRestoreResponse = await fetch(`${baseUrl}/?section=s9&lang=bi&theme=dark`, {
      headers: {
        [HTMX_REQUEST_HEADERS.historyRestoreRequest]: "true",
        [HTMX_REQUEST_HEADERS.request]: "true",
      },
    });
    const historyRestoreHtml = await historyRestoreResponse.text();

    expect(fullResponse.status).toBe(200);
    expect(fullResponse.headers.get("vary")).toContain("HX-History-Restore-Request");
    expect(fullResponse.headers.get("vary")).toContain("HX-Target");
    expect(fullHtml.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(fullHtml).toContain('data-theme="light"');
    expect(fullHtml).toContain('aria-label="跳转到主内容"');
    expect(fullHtml).toContain(`id="${GUIDE_DOM_IDS.page}"`);
    expect(fullHtml).toContain(`id="${GUIDE_DOM_IDS.cover}"`);
    expect(fullHtml).not.toContain("/scripts/vendor/htmx.min.js");
    expect(fullHtml).not.toContain("/scripts/vendor/prism.min.js");
    expect(fullHtml).not.toContain("/styles/vendor/prism-tomorrow.min.css");
    expect(fragmentResponse.status).toBe(200);
    expect(fragmentHtml.startsWith("<!DOCTYPE html>")).toBe(false);
    expect(fragmentHtml).toContain(`id="${GUIDE_DOM_IDS.shell}"`);
    expect(fragmentHtml).toContain('data-active-section="s14"');
    expect(fragmentHtml).not.toContain(`id="${GUIDE_DOM_IDS.page}"`);
    expect(pageResponse.status).toBe(200);
    expect(pageHtml.startsWith("<!DOCTYPE html>")).toBe(false);
    expect(pageHtml).toContain(`id="${GUIDE_DOM_IDS.page}"`);
    expect(pageHtml).toContain(`id="${GUIDE_DOM_IDS.coverScroll}"`);
    expect(historyRestoreResponse.status).toBe(200);
    expect(historyRestoreHtml.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(historyRestoreHtml).toContain("hx-history-elt");
    expect(fullHtml).toContain(`id="${GUIDE_DOM_IDS.requestIndicator}"`);
  });

  test("serves scripts, downloads, and asset probes over HTTP", async () => {
    const scriptResponse = await fetch(`${baseUrl}/assets/guide.js`);
    const scriptBody = await scriptResponse.text();
    const stylesheetResponse = await fetch(`${baseUrl}/assets/guide.css`);
    const stylesheetBody = await stylesheetResponse.text();
    const guideDownloadResponse = await fetch(`${baseUrl}/downloads/vertu-brand-guide.html`, {
      method: "HEAD",
    });
    const assetHeadResponse = await fetch(`${baseUrl}/VERTU-Logo-Black.png`, { method: "HEAD" });
    const sourceFileResponse = await fetch(`${baseUrl}/README.md`, { method: "HEAD" });
    const authoringStylesheetResponse = await fetch(`${baseUrl}/styles/brand-guide.css`, { method: "HEAD" });
    const vendoredHtmxResponse = await fetch(`${baseUrl}/scripts/vendor/htmx.min.js`, { method: "HEAD" });
    const vendoredPrismResponse = await fetch(`${baseUrl}/scripts/vendor/prism.min.js`, { method: "HEAD" });
    const vendoredPrismStylesheetResponse = await fetch(`${baseUrl}/styles/vendor/prism-tomorrow.min.css`, {
      method: "HEAD",
    });

    expect(scriptResponse.status).toBe(200);
    expect(scriptResponse.headers.get("content-type")).toContain("text/javascript");
    expect(scriptBody.length).toBeGreaterThan(1000);
    expect(stylesheetResponse.status).toBe(200);
    expect(stylesheetResponse.headers.get("content-type")).toContain("text/css");
    expect(stylesheetBody).toContain("--color-v-gold");
    expect(guideDownloadResponse.status).toBe(200);
    expect(guideDownloadResponse.headers.get("content-disposition")).toContain("vertu-brand-guide.html");
    expect(assetHeadResponse.status).toBe(200);
    expect(assetHeadResponse.headers.get("content-type")).toContain("image/png");
    expect(sourceFileResponse.status).toBe(404);
    expect(authoringStylesheetResponse.status).toBe(404);
    expect(vendoredHtmxResponse.status).toBe(404);
    expect(vendoredPrismResponse.status).toBe(404);
    expect(vendoredPrismStylesheetResponse.status).toBe(404);
  });

  test("sets Content-Disposition attachment headers on all downloadable assets", async () => {
    const pptxHead = await fetch(`${baseUrl}/downloads/VERTU-Template.pptx`, { method: "HEAD" });
    const pptxGet = await fetch(`${baseUrl}/downloads/VERTU-Template.pptx`);
    const docxHead = await fetch(`${baseUrl}/downloads/VERTU-Letterhead.docx`, { method: "HEAD" });
    const docxGet = await fetch(`${baseUrl}/downloads/VERTU-Letterhead.docx`);
    const logoHead = await fetch(`${baseUrl}/downloads/VERTU-Logo-Gold.png`, { method: "HEAD" });
    const guideHead = await fetch(`${baseUrl}/downloads/vertu-brand-guide.html`, { method: "HEAD" });

    expect(pptxHead.status).toBe(200);
    expect(pptxHead.headers.get("content-disposition")).toContain("attachment");
    expect(pptxHead.headers.get("content-disposition")).toContain("VERTU-Template.pptx");
    expect(pptxGet.status).toBe(200);
    expect(pptxGet.headers.get("content-type")).toContain("presentationml");
    expect(pptxGet.headers.get("content-disposition")).toContain("attachment");

    expect(docxHead.status).toBe(200);
    expect(docxHead.headers.get("content-disposition")).toContain("attachment");
    expect(docxHead.headers.get("content-disposition")).toContain("VERTU-Letterhead.docx");
    expect(docxGet.status).toBe(200);
    expect(docxGet.headers.get("content-type")).toContain("wordprocessingml");
    expect(docxGet.headers.get("content-disposition")).toContain("attachment");

    expect(logoHead.status).toBe(200);
    expect(logoHead.headers.get("content-disposition")).toContain("attachment");
    expect(logoHead.headers.get("content-disposition")).toContain("VERTU-Logo-Gold.png");
    expect(logoHead.headers.get("content-type")).toContain("image/png");

    expect(guideHead.status).toBe(200);
    expect(guideHead.headers.get("content-disposition")).toContain("attachment");
    expect(guideHead.headers.get("content-disposition")).toContain("vertu-brand-guide.html");
  });
});

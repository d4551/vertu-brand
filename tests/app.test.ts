import { describe, expect, test } from "bun:test";

import { app } from "../src/server/app";
import { HTMX_REQUEST_HEADERS, toGuideRequestUrl } from "../src/shared/config";
import { GUIDE_NAVIGATION } from "../src/server/content/navigation";
import { resolveScrollProgressPercent, resolveTypePlaygroundState } from "../src/shared/guide-interactions";
import { GUIDE_DOM_IDS, GUIDE_HTMX, GUIDE_SELECTORS } from "../src/shared/shell-contract";
import { GUIDE_SECTION_IDS } from "../src/shared/view-state";
import { renderSectionMarkup } from "../src/server/content/source";

describe("guide shell rendering", () => {
  test("renders the full SSR document for direct navigation", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=zh&theme=light")));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("vary")).toContain("HX-Request");
    expect(response.headers.get("vary")).toContain("HX-Target");
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('data-lang="zh"');
    expect(html).toContain(`id="${GUIDE_DOM_IDS.page}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.cover}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.shell}"`);
    expect(html).toContain("/assets/guide.css");
    expect(html).toContain("/assets/guide.js");
    expect(html).not.toContain("tailwindcss-playcdn");
    expect(html).not.toContain("/styles/vendor/daisyui.css");
    expect(html).not.toContain("/scripts/vendor/htmx.min.js");
    expect(html).not.toContain("/scripts/vendor/prism.min.js");
    expect(html).not.toContain("/styles/vendor/prism-tomorrow.min.css");
    expect(html).not.toContain("/styles/brand-guide.css");
    expect(html).toContain("hx-history-elt");
    expect(html).toContain(`hx-target="${GUIDE_SELECTORS.page}"`);
    expect(html).toContain(`hx-sync="${GUIDE_SELECTORS.page}:replace"`);
    expect(html).toContain(`hx-sync="${GUIDE_SELECTORS.shell}:replace"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.scrollProgress}"`);
    expect(html).toContain('class="guide-progress-bar');
    expect(html).toContain(`id="${GUIDE_DOM_IDS.requestIndicator}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.coverScroll}"`);
    expect(html).toContain('class="guide-cover-title-en"');
    expect(html).toContain('class="guide-cover-title-zh"');
    expect(html).not.toContain("Apply");
    expect(html).not.toContain("HTMX + Elysia");
    expect(html).not.toContain("Server-rendered VERTU brand system with HTMX-driven section navigation.");
    expect(html).not.toContain("Server-driven via HTMX");
    expect(html).toContain("社交媒体模板预览");
  });

  test("renders only the shell fragment for HTMX section requests", async () => {
    const request = new Request(toGuideRequestUrl("/?section=s14&lang=en&theme=dark"), {
      headers: {
        [HTMX_REQUEST_HEADERS.request]: "true",
        [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.shell,
      },
    });
    const response = await app.handle(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(false);
    expect(html).not.toContain(`id="${GUIDE_DOM_IDS.page}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.shell}"`);
    expect(html).toContain('data-active-section="s14"');
  });

  test("renders the branded page fragment for HTMX language and theme requests", async () => {
    const request = new Request(toGuideRequestUrl("/?section=s15&lang=zh&theme=light"), {
      headers: {
        [HTMX_REQUEST_HEADERS.request]: "true",
        [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.page,
      },
    });
    const response = await app.handle(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(false);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.page}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.cover}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.shell}"`);
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('data-language="zh"');
  });

  test("returns a full document for HTMX history restoration requests", async () => {
    const request = new Request(toGuideRequestUrl("/?section=s11&lang=en&theme=dark"), {
      headers: {
        [HTMX_REQUEST_HEADERS.historyRestoreRequest]: "true",
        [HTMX_REQUEST_HEADERS.request]: "true",
      },
    });
    const response = await app.handle(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("hx-history-elt");
  });

  test("returns a typed invalid-section fallback envelope via HTTP status and alert content", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s404&lang=en&theme=dark")));
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain("The requested section was not found");
    expect(html).toContain('data-active-section="s0"');
  });
});

describe("legacy section extraction", () => {
  test("keeps every canonical section available for rendering", () => {
    GUIDE_SECTION_IDS.forEach((sectionId) => {
      const markup = renderSectionMarkup(sectionId, "bi");

      expect(markup).toContain(`id="${sectionId}"`);
      expect(markup.length).toBeGreaterThan(100);
    });
  });

  test("keeps interactive typography and download markers in migrated sections", () => {
    const typographyMarkup = renderSectionMarkup("s5", "en");
    const downloadsMarkup = renderSectionMarkup("s15", "en");

    expect(typographyMarkup).toContain('id="typePreview"');
    expect(typographyMarkup).toContain('id="typeFont"');
    expect(typographyMarkup).toContain('id="typeSize"');
    expect(typographyMarkup).toContain('id="typeWeight"');
    expect(typographyMarkup).toContain('id="typeTrack"');
    expect(downloadsMarkup).toContain('id="gen-canvas"');
    expect(downloadsMarkup).toContain('id="social-canvas"');
    expect(downloadsMarkup).toContain('id="dl-logo-black"');
    expect(downloadsMarkup).toContain('id="dl-guide"');
  });

  test("derives navigation titles and order from the authoring source metadata", () => {
    expect(GUIDE_NAVIGATION.map((item) => item.id)).toEqual([...GUIDE_SECTION_IDS]);
    expect(GUIDE_NAVIGATION[0]?.title.en).toBe("VERTU Brand Guide");
    expect(GUIDE_NAVIGATION[15]?.title.en).toBe("Downloads & Assets");
    expect(GUIDE_NAVIGATION[16]?.title.en).toBe("Agentic AI & LLM Guidelines");
  });

  test("marks only the active navigation item as the current page", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s5&lang=en&theme=dark")));
    const html = await response.text();
    const currentMatches = html.match(/aria-current="page"/g) ?? [];

    expect(currentMatches).toHaveLength(1);
    expect(html).not.toContain('aria-current="false"');
    expect(html).toContain(`hx-boost="${GUIDE_HTMX.boostEnabled}"`);
    expect(html).toContain(`hx-indicator="${GUIDE_HTMX.shellIndicator}"`);
    expect(html).toContain(`hx-swap="${GUIDE_HTMX.shellSwapShowMain}"`);
  });

  test("localizes supporting copy and explicit aria labels inside interactive sections", () => {
    const colorMarkup = renderSectionMarkup("s3", "zh");
    const pantoneMarkup = renderSectionMarkup("s4", "zh");
    const downloadsMarkup = renderSectionMarkup("s15", "zh");

    expect(colorMarkup).toContain("65% VERTU 黑");
    expect(colorMarkup).not.toContain("65% VERTU Black");
    expect(pantoneMarkup).toContain("金属金 · 主色");
    expect(pantoneMarkup).not.toContain("Metallic Gold · Primary");
    expect(downloadsMarkup).toContain("PNG · 1080×1080 · 深色");
    expect(downloadsMarkup).not.toContain("PNG · 1080×1080 · Dark");
    expect(downloadsMarkup).toContain('aria-label="下载适用于浅色背景的黑色 VERTU 标志 PNG"');
    expect(downloadsMarkup).toContain('aria-label="以 1080×1080 PNG 下载深色 Instagram 帖子预设"');
  });
});

describe("progressive enhancement helpers", () => {
  test("normalizes typography playground inputs into bounded UI state", () => {
    const state = resolveTypePlaygroundState("'IBM Plex Mono',monospace", "48", "700", "12");

    expect(state.previewClassName).toBe("type-preview-mono");
    expect(state.sizeLabel).toBe("48px");
    expect(state.weightLabel).toBe("700");
    expect(state.trackingLabel).toBe("0.12em");
  });

  test("falls back to safe typography defaults when input values are invalid", () => {
    const state = resolveTypePlaygroundState("unknown-font", "999", "0", "-999");

    expect(state.previewClassName).toBe("type-preview-default");
    expect(state.sizeLabel).toBe("96px");
    expect(state.weightLabel).toBe("300");
    expect(state.trackingLabel).toBe("-0.05em");
  });

  test("derives a bounded scroll progress percentage", () => {
    expect(resolveScrollProgressPercent(0, 2400, 800)).toBe(0);
    expect(resolveScrollProgressPercent(800, 2400, 800)).toBe(50);
    expect(resolveScrollProgressPercent(3200, 2400, 800)).toBe(100);
  });

  test("supports HEAD asset checks used by the download enhancement", async () => {
    const existingAsset = await app.handle(new Request(toGuideRequestUrl("/VERTU-Logo-Black.png"), { method: "HEAD" }));
    const missingAsset = await app.handle(new Request(toGuideRequestUrl("/missing-logo.png"), { method: "HEAD" }));
    const sourceFile = await app.handle(new Request(toGuideRequestUrl("/README.md"), { method: "HEAD" }));

    expect(existingAsset.status).toBe(200);
    expect(missingAsset.status).toBe(404);
    expect(sourceFile.status).toBe(404);
  });
});

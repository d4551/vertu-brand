import { describe, expect, test } from "bun:test";

import { app } from "../src/server/app";
import { GUIDE_ROUTES, HTMX_REQUEST_HEADERS, toGuideRequestUrl } from "../src/shared/config";
import { GUIDE_NAVIGATION } from "../src/server/content/navigation";
import { resolveScrollProgressPercent, resolveTypePlaygroundState } from "../src/shared/guide-interactions";
import { GUIDE_DOM_IDS, GUIDE_SELECTORS } from "../src/shared/shell-contract";
import { SOCIAL_GUIDE_QUERY_PARAMS } from "../src/shared/social-toolkit";
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
    expect(html).toContain('hx-push-url="true"');
    /* Cycle buttons: theme=light → next is system; lang=zh → next is bi */
    expect(html).toContain('hx-get="/?section=s15&lang=zh&theme=system"');
    expect(html).toContain('hx-get="/?section=s15&lang=bi&theme=light"');
    expect(html).toContain('href="#s1"');
    expect(html).toContain('data-guide-section-id="s1"');
    expect(html).toContain(`id="${GUIDE_DOM_IDS.scrollProgress}"`);
    expect(html).toContain('class="guide-progress-bar');
    expect(html).toContain(`id="${GUIDE_DOM_IDS.requestIndicator}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.coverScroll}"`);
    expect(html).toMatch(new RegExp(`<label[^>]+id="${GUIDE_DOM_IDS.drawerOpenButton}"[^>]+for="${GUIDE_DOM_IDS.drawerControl}"`));
    expect(html).toMatch(
      new RegExp(`<label[^>]+id="${GUIDE_DOM_IDS.drawerCloseButton}"[^>]+for="${GUIDE_DOM_IDS.drawerControl}"`)
    );
    expect(html).toContain('id="s0"');
    expect(html).toContain('id="s16"');
    expect(html).toContain('class="guide-cover-title-en"');
    expect(html).toContain('class="guide-cover-title-zh"');
    expect(html).not.toContain("HTMX + Elysia");
    expect(html).toContain("传播套件预览");
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
    expect(html).toContain('id="s0"');
    expect(html).toContain('id="s16"');
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

  test("serves the compiled stylesheet with a single sidebar overflow reset", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl(GUIDE_ROUTES.stylesheet)));
    const css = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    expect((css.match(/\.overflow-y-auto>\.menu\{/g) ?? [])).toHaveLength(1);
    expect(css).toContain(".overflow-y-auto>.menu{padding-bottom:var(--guide-page-padding-block)}");
    expect(css).toContain("[data-lang=bi] .guide-copy-en+.guide-copy-zh{margin-top:var(--guide-bilingual-gap)}");
    expect(css).not.toContain("50vh");
  });
});

describe("authoring section extraction", () => {
  test("keeps every canonical section available for rendering", () => {
    GUIDE_SECTION_IDS.forEach((sectionId) => {
      const markup = renderSectionMarkup(sectionId, "bi");

      expect(markup).toContain(`id="${sectionId}"`);
      expect(markup.length).toBeGreaterThan(100);
    });
  });

  test("keeps interactive typography and download markers in authoring sections", () => {
    const typographyMarkup = renderSectionMarkup("s5", "en");
    const downloadsMarkup = renderSectionMarkup("s15", "en");

    expect(typographyMarkup).toContain('id="typePreview"');
    expect(typographyMarkup).toContain('id="typeFont"');
    expect(typographyMarkup).toContain('id="typeSize"');
    expect(typographyMarkup).toContain('id="typeWeight"');
    expect(typographyMarkup).toContain('id="typeTrack"');
    expect(downloadsMarkup).toContain('id="gen-canvas"');
    expect(downloadsMarkup).toContain('id="social-toolkit-form"');
    expect(downloadsMarkup).toContain('class="asset-operator-grid"');
    expect(downloadsMarkup).toContain('class="social-toolkit-controls');
    expect(downloadsMarkup).toContain(`action="${GUIDE_ROUTES.guide}"`);
    expect(downloadsMarkup).toContain(`hx-get="${GUIDE_ROUTES.socialPreview}"`);
    expect(downloadsMarkup).toContain('hx-disabled-elt="find select"');
    expect(downloadsMarkup).toContain('id="social-preview-panel"');
    expect(downloadsMarkup).toContain(`id="social-format" name="${SOCIAL_GUIDE_QUERY_PARAMS.asset}"`);
    expect(downloadsMarkup).toContain(`id="social-theme" name="${SOCIAL_GUIDE_QUERY_PARAMS.theme}"`);
    expect(downloadsMarkup).toContain('hx-target="#social-preview-panel"');
    expect(downloadsMarkup).toContain('hx-trigger="submit"');
    expect(downloadsMarkup).toContain('hx-sync="this:replace"');
    expect(downloadsMarkup).not.toContain('hx-trigger="change, submit"');
    expect(downloadsMarkup).toContain('data-social-state="idle"');
    expect(downloadsMarkup).toContain('aria-busy="false"');
    expect(downloadsMarkup).toContain('value="campaign-event" data-asset-kinds="og-card,event-invite,announcement-card,quote-card,linkedin-post,x-header" data-default-theme="gold" data-default-approved-asset="quantum-flip" selected="selected"');
    expect(downloadsMarkup).toContain('option value="quantum-flip" selected="selected"');
    expect(downloadsMarkup).toContain('option value="gold" selected="selected"');
    expect(downloadsMarkup).toContain('id="dl-logo-black"');
    expect(downloadsMarkup).toContain('class="template-library-grid"');
    expect(downloadsMarkup).toContain('data-template-id="presentation"');
    expect(downloadsMarkup).toContain('data-template-id="letterhead"');
    expect(downloadsMarkup).toContain('id="dl-guide"');
  });

  test("renders shared responsive scaffolds for the rebuilt component and accessibility sections", () => {
    const componentsMarkup = renderSectionMarkup("s10", "bi");
    const accessibilityMarkup = renderSectionMarkup("s11", "bi");

    expect(componentsMarkup).toContain("component-specimens");
    expect(componentsMarkup).toContain("component-specimen__caption");
    expect(componentsMarkup).toContain("component-specimen__control");
    expect(componentsMarkup).toContain("guide-copy-en");
    expect(componentsMarkup).toContain("guide-copy-zh");
    expect(accessibilityMarkup).toContain("contrast-card-list");
    expect(accessibilityMarkup).toContain("contrast-table-mobile");
    expect(accessibilityMarkup).toContain("gauge-container-wrapper");
    expect(accessibilityMarkup).toContain("gauge-readout");
  });

  test("derives navigation titles and order from the authoring source metadata", () => {
    expect(GUIDE_NAVIGATION.map((item) => item.id)).toEqual([...GUIDE_SECTION_IDS]);
    expect(GUIDE_NAVIGATION[0]?.title.en).toBe("VERTU Brand Guide");
    expect(GUIDE_NAVIGATION[15]?.title.en).toBe("Downloads & Assets");
    expect(GUIDE_NAVIGATION[16]?.title.en).toBe("Agentic AI & LLM Guidelines");
  });

  test("marks only the active navigation item as the current location", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s5&lang=en&theme=dark")));
    const html = await response.text();
    const currentMatches = html.match(/aria-current="location"/g) ?? [];

    expect(currentMatches).toHaveLength(1);
    expect(html).not.toContain('aria-current="false"');
    expect(html).toContain('href="#s5"');
    expect(html).toContain('data-guide-section-id="s5"');
    expect(html).toContain("guide-theme-cycle");
    expect(html).toContain('data-guide-language="en"');
  });

  test("renders label-driven drawer controls and compact segmented sidebar controls", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=bi&theme=dark")));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.drawerOpenButton}"`);
    expect(html).toContain(`id="${GUIDE_DOM_IDS.drawerCloseButton}"`);
    expect(html).toContain(`for="${GUIDE_DOM_IDS.drawerControl}"`);
    expect(html).toContain('role="button"');
    expect(html).toContain("guide-lang-cycle");
    expect(html).toContain('data-guide-theme="dark"');
    expect(html).toContain('data-guide-language="bi"');
    expect(html).toContain("overflow-x-hidden");
  });

  test("renders the integrated social preview inside the main guide document", async () => {
    const response = await app.handle(
      new Request(
        toGuideRequestUrl(
          `/?section=s15&lang=bi&theme=dark&${SOCIAL_GUIDE_QUERY_PARAMS.pack}=campaign-event&${SOCIAL_GUIDE_QUERY_PARAMS.asset}=og-card&${SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset}=quantum-flip&${SOCIAL_GUIDE_QUERY_PARAMS.theme}=gold`
        )
      )
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('id="social-preview-panel"');
    expect(html).toContain('data-social-state="success"');
    expect(html).toContain(
      '<span data-lang-en="" class="guide-copy-en" lang="en">Download Manifest</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">下载清单</span>'
    );
    expect(html).toContain('class="social-preview-steps"');
    expect(html.match(/class="social-preview-step"/g) ?? []).toHaveLength(3);
    expect(html).toContain('class="social-preview-table-wrap"');
    expect(html).toContain('class="social-preview-card-list"');
    expect(html).toContain(`name="${SOCIAL_GUIDE_QUERY_PARAMS.pack}"`);
    expect(html).toContain(`name="${SOCIAL_GUIDE_QUERY_PARAMS.theme}"`);
    expect(html).not.toContain("<!DOCTYPE html>\n<!DOCTYPE html>");
  });

  test("localizes supporting copy and explicit aria labels inside interactive sections", () => {
    const colorMarkup = renderSectionMarkup("s3", "zh");
    const pantoneMarkup = renderSectionMarkup("s4", "zh");
    const downloadsMarkup = renderSectionMarkup("s15", "zh");

    expect(colorMarkup).toContain("65% VERTU 黑");
    expect(colorMarkup).not.toContain("65% VERTU Black");
    expect(pantoneMarkup).toContain("金属金 · 主色");
    expect(pantoneMarkup).not.toContain("Metallic Gold · Primary");
    expect(downloadsMarkup).toContain("传播套件 — 品牌常青");
    expect(downloadsMarkup).not.toContain("Campaign Pack — Signature");
    expect(downloadsMarkup).toContain("批准素材 — Agent Q");
    expect(downloadsMarkup).toContain('aria-label="下载适用于浅色背景的黑色 VERTU 标志 PNG"');
    expect(downloadsMarkup).toContain('aria-label="传播套件"');
    expect(downloadsMarkup).toContain('aria-label="传播套件预览"');
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

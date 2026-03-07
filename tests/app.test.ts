import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { GUIDE_SERVER_BOOT_OPTIONS } from "../src/server/boot";
import { app } from "../src/server/app";
import { GUIDE_ASSET_OPERATOR_IDS } from "../src/shared/asset-operator-contract";
import {
  GUIDE_SERVER,
  GUIDE_REQUEST_ID_HEADER,
  GUIDE_ROUTES,
  HTMX_REQUEST_HEADERS,
  toGuideImageAssetHref,
  toGuideRequestUrl,
} from "../src/shared/config";
import { GUIDE_NAVIGATION } from "../src/server/content/navigation";
import { resolveScrollProgressPercent, resolveTypePlaygroundState } from "../src/shared/guide-interactions";
import { resolveHtmxEventTarget } from "../src/shared/htmx-event-contract";
import { GUIDE_RUNTIME_DEFAULTS, resolveGuideRuntimeSettings } from "../src/shared/runtime-settings";
import {
  GUIDE_BUILD_WATCH_PATHS,
  GUIDE_BRAND_FILE_PATHS,
  GUIDE_FULL_BUILD_TRIGGER_PATHS,
  GUIDE_FONT_FILE_PATHS,
  GUIDE_PATHS,
  GUIDE_PUBLIC_DIRECTORIES,
  GUIDE_PUBLIC_FILES,
  GUIDE_SOCIAL_BUILD_INPUT_FILES,
  resolveGuideBrandFilePaths,
  resolveGuideBuildCommand,
  resolveGuideDevBuildTarget,
  resolveGuideFontFilePaths,
  resolveGuideFullBuildTriggerPaths,
  resolveGuidePaths,
  resolveGuidePublicAssetSourcePath,
  resolveGuidePublicDirectories,
  resolveGuidePublicFiles,
  resolveGuideServerCommand,
  resolveGuideSocialBuildInputFiles,
  resolveGuideStylesheetBuildCommand,
  resolveGuideServerPort,
} from "../src/server/runtime-config";
import { GUIDE_DOM_IDS, GUIDE_SELECTORS } from "../src/shared/shell-contract";
import { normalizeGuideSocialPreviewState, SOCIAL_GUIDE_QUERY_PARAMS } from "../src/shared/social-toolkit";
import {
  GUIDE_SECTION_IDS,
  resolveGuideDocumentLanguageTag,
  resolveGuideLocale,
  resolveGuideState,
} from "../src/shared/view-state";
import { renderSectionMarkup } from "../src/server/content/source";

describe("guide shell rendering", () => {
  test("resolves shared runtime settings from environment values with safe defaults", () => {
    const settings = resolveGuideRuntimeSettings({
      GUIDE_DEFAULT_PORT: "4100",
      GUIDE_DEV_BUILD_DEBOUNCE_MS: "220",
      GUIDE_DEV_WATCHER_WARMUP_MS: "1400",
      GUIDE_HOST: "127.0.0.1",
      GUIDE_MANIFEST_MAX_AGE_SECONDS: "600",
      GUIDE_MANIFEST_STALE_WHILE_REVALIDATE_SECONDS: "1200",
      GUIDE_REQUEST_ID_HEADER: "X-Correlation-Id",
      GUIDE_SERVE_PORT: "4190",
      GUIDE_SOCIAL_ASSET_MAX_AGE_SECONDS: "900",
      GUIDE_SOCIAL_ASSET_STALE_WHILE_REVALIDATE_SECONDS: "3600",
      GUIDE_STATIC_ASSET_MAX_AGE_SECONDS: "700",
      GUIDE_STATIC_ASSET_STALE_WHILE_REVALIDATE_SECONDS: "1800",
    });

    expect(settings.defaultPort).toBe(4100);
    expect(settings.devBuildDebounceMs).toBe(220);
    expect(settings.devWatcherWarmupMs).toBe(1400);
    expect(settings.host).toBe("127.0.0.1");
    expect(settings.manifestMaxAgeSeconds).toBe(600);
    expect(settings.manifestStaleWhileRevalidateSeconds).toBe(1200);
    expect(settings.requestIdHeader).toBe("x-correlation-id");
    expect(settings.servePort).toBe(4190);
    expect(settings.socialAssetMaxAgeSeconds).toBe(900);
    expect(settings.socialAssetStaleWhileRevalidateSeconds).toBe(3600);
    expect(settings.staticAssetMaxAgeSeconds).toBe(700);
    expect(settings.staticAssetStaleWhileRevalidateSeconds).toBe(1800);
    expect(settings.warnings).toEqual([]);
  });

  test("falls back to shared runtime defaults when environment values are invalid", () => {
    const settings = resolveGuideRuntimeSettings({
      GUIDE_DEFAULT_PORT: "0",
      GUIDE_DEV_BUILD_DEBOUNCE_MS: "later",
      GUIDE_HOST: "   ",
      GUIDE_REQUEST_ID_HEADER: "   ",
      GUIDE_SERVE_PORT: "-2",
    });

    expect(settings.defaultPort).toBe(GUIDE_RUNTIME_DEFAULTS.defaultPort);
    expect(settings.devBuildDebounceMs).toBe(GUIDE_RUNTIME_DEFAULTS.devBuildDebounceMs);
    expect(settings.host).toBe(GUIDE_RUNTIME_DEFAULTS.host);
    expect(settings.requestIdHeader).toBe(GUIDE_RUNTIME_DEFAULTS.requestIdHeader);
    expect(settings.servePort).toBe(GUIDE_RUNTIME_DEFAULTS.servePort);
    expect(settings.warnings).toEqual([
      {
        fallbackValue: String(GUIDE_RUNTIME_DEFAULTS.defaultPort),
        key: "GUIDE_DEFAULT_PORT",
        receivedValue: "0",
      },
      {
        fallbackValue: String(GUIDE_RUNTIME_DEFAULTS.servePort),
        key: "GUIDE_SERVE_PORT",
        receivedValue: "-2",
      },
      {
        fallbackValue: String(GUIDE_RUNTIME_DEFAULTS.devBuildDebounceMs),
        key: "GUIDE_DEV_BUILD_DEBOUNCE_MS",
        receivedValue: "later",
      },
    ]);
  });

  test("resolves HTMX event targets through the shared browser contract", () => {
    expect(
      resolveHtmxEventTarget(
        new CustomEvent("htmx:afterSwap", {
          detail: {
            target: new EventTarget(),
          },
        })
      )
    ).toBeNull();
    expect(
      resolveHtmxEventTarget(
        new CustomEvent("htmx:afterSwap", {
          detail: {},
        })
      )
    ).toBeNull();
    expect(
      resolveHtmxEventTarget(
        new CustomEvent("htmx:afterRequest", {
          detail: {
            target: null,
          },
        })
      )
    ).toBeNull();
  });

  test("resolves canonical guide state and locale helpers from raw inputs", () => {
    expect(
      resolveGuideState({
        language: "CN",
        section: " s15 ",
        theme: "system",
      })
    ).toEqual({
      language: "zh",
      section: "s15",
      theme: "system",
    });
    expect(resolveGuideState({ language: "fr", section: "missing", theme: "sepia" })).toEqual({
      language: "bi",
      section: "s0",
      theme: "dark",
    });
    expect(resolveGuideLocale("bi")).toBe("en");
    expect(resolveGuideLocale("zh")).toBe("zh");
    expect(resolveGuideDocumentLanguageTag("bi")).toBe("mul");
    expect(resolveGuideDocumentLanguageTag("zh")).toBe("zh");
    expect(normalizeGuideSocialPreviewState("SUCCESS")).toBe("success");
    expect(normalizeGuideSocialPreviewState("invalid")).toBe("idle");
  });

  test("resolves server ports from the shared entrypoint contract", () => {
    expect(
      resolveGuideServerPort({
        args: ["bun", "src/server/index.ts", "--listen", "4010"],
        defaultPort: 3000,
        env: {},
        includeLegacyPort: true,
      })
    ).toBe(4010);

    expect(
      resolveGuideServerPort({
        args: ["bun", "src/server/index.ts"],
        defaultPort: 3000,
        env: { GUIDE_PORT: "4020", PORT: "4999" },
        includeLegacyPort: true,
      })
    ).toBe(4020);

    expect(
      resolveGuideServerPort({
        args: ["bun", "src/server/serve.ts"],
        defaultPort: 3090,
        env: { GUIDE_PORT: "", PORT: "4999" },
        includeLegacyPort: true,
      })
    ).toBe(4999);
  });

  test("centralizes Bun command contracts for build, stylesheet compilation, and server entrypoints", () => {
    const fullBuildCommand = resolveGuideBuildCommand("full", GUIDE_PATHS.projectRoot);
    const appBuildCommand = resolveGuideBuildCommand("app", GUIDE_PATHS.projectRoot);
    const serverCommand = resolveGuideServerCommand("dev", GUIDE_PATHS.projectRoot);
    const serveCommand = resolveGuideServerCommand("serve", GUIDE_PATHS.projectRoot);
    const stylesheetCommand = resolveGuideStylesheetBuildCommand(GUIDE_PATHS);

    expect(fullBuildCommand.cmd).toEqual([process.execPath, "run", "build"]);
    expect(appBuildCommand.cmd).toEqual([process.execPath, "run", "build:app"]);
    expect(serverCommand.cmd).toEqual([process.execPath, resolve(GUIDE_PATHS.projectRoot, "src/server/index.ts")]);
    expect(serveCommand.cmd).toEqual([process.execPath, resolve(GUIDE_PATHS.projectRoot, "src/server/serve.ts")]);
    expect(stylesheetCommand.cmd).toEqual([
      process.execPath,
      "x",
      "tailwindcss",
      "-i",
      GUIDE_PATHS.stylesheetEntry,
      "-o",
      GUIDE_PATHS.stylesheetOutput,
      "--minify",
    ]);
    expect(fullBuildCommand.cwd).toBe(GUIDE_PATHS.projectRoot);
    expect(serverCommand.cwd).toBe(GUIDE_PATHS.projectRoot);
  });

  test("keeps server boot modes centralized instead of duplicating entrypoint defaults", () => {
    expect(GUIDE_SERVER_BOOT_OPTIONS.dev.defaultPort).toBe(GUIDE_SERVER.defaultPort);
    expect(GUIDE_SERVER_BOOT_OPTIONS.dev.includeLegacyPort).toBe(true);
    expect(GUIDE_SERVER_BOOT_OPTIONS.serve.defaultPort).toBe(GUIDE_SERVER.servePort);
    expect(GUIDE_SERVER_BOOT_OPTIONS.serve.includeLegacyPort).toBe(true);
  });

  test("routes local dev rebuilds through the shared app-vs-full build contract", () => {
    expect(resolveGuideDevBuildTarget(resolve(GUIDE_PATHS.projectRoot, "src/client/progressive-enhancements.ts"))).toBe("app");
    expect(resolveGuideDevBuildTarget(resolve(GUIDE_PATHS.projectRoot, "styles", "brand-guide.css"))).toBe("app");
    expect(resolveGuideDevBuildTarget(resolve(GUIDE_PATHS.projectRoot, "scripts/generate-templates.mjs"))).toBe("full");
    expect(resolveGuideDevBuildTarget(resolve(GUIDE_PATHS.projectRoot, "src/shared/template-catalog.ts"))).toBe("full");
    expect(resolveGuideDevBuildTarget(resolve(GUIDE_PATHS.projectRoot, "package.json"))).toBe("full");
  });

  test("watches shared build-config files that can invalidate local rebuild output", () => {
    expect(GUIDE_BUILD_WATCH_PATHS.files).toContain(resolve(GUIDE_PATHS.projectRoot, "bun.lock"));
    expect(GUIDE_BUILD_WATCH_PATHS.files).toContain(resolve(GUIDE_PATHS.projectRoot, "package.json"));
    expect(GUIDE_BUILD_WATCH_PATHS.files).toContain(resolve(GUIDE_PATHS.projectRoot, "tsconfig.json"));
  });

  test("derives staging build paths from the shared resolver instead of mirroring GUIDE_PATHS manually", () => {
    const stagingPaths = resolveGuidePaths({
      buildDirectory: resolve(GUIDE_PATHS.projectRoot, ".generated-next-test"),
      projectRoot: GUIDE_PATHS.projectRoot,
    });

    expect(stagingPaths.publicRoot).toBe(resolve(GUIDE_PATHS.projectRoot, ".generated-next-test/public"));
    expect(stagingPaths.clientScriptOutput).toBe(resolve(GUIDE_PATHS.projectRoot, ".generated-next-test/public/assets/guide.js"));
    expect(stagingPaths.sectionRegistryOutput).toBe(
      resolve(GUIDE_PATHS.projectRoot, ".generated-next-test/content/sections.generated.ts")
    );
  });

  test("derives copied public assets from the shared path contract", () => {
    const stagingPaths = resolveGuidePaths({
      buildDirectory: resolve(GUIDE_PATHS.projectRoot, ".generated-next-test"),
      projectRoot: GUIDE_PATHS.projectRoot,
    });
    const stagingDirectories = resolveGuidePublicDirectories(stagingPaths);
    const stagingFiles = resolveGuidePublicFiles(stagingPaths);

    expect(GUIDE_PUBLIC_DIRECTORIES.length).toBe(stagingDirectories.length);
    expect(GUIDE_PUBLIC_FILES.length).toBe(stagingFiles.length);
    expect(stagingDirectories[0]?.outputPath).toBe(resolve(GUIDE_PATHS.projectRoot, ".generated-next-test/public/assets/images"));
    expect(stagingFiles[0]?.outputPath.startsWith(resolve(GUIDE_PATHS.projectRoot, ".generated-next-test/public/"))).toBe(
      true
    );
  });

  test("keeps social fingerprint inputs centralized in runtime config", () => {
    expect(GUIDE_SOCIAL_BUILD_INPUT_FILES).toContain(resolve(GUIDE_PATHS.projectRoot, "scripts/build-app.ts"));
    expect(GUIDE_SOCIAL_BUILD_INPUT_FILES).toContain(resolve(GUIDE_PATHS.projectRoot, "src/shared/social-toolkit.ts"));
  });

  test("derives brand and font asset paths from shared project-root resolvers", () => {
    const brandFilePaths = resolveGuideBrandFilePaths(GUIDE_PATHS.projectRoot);
    const fontFilePaths = resolveGuideFontFilePaths(GUIDE_PATHS.projectRoot);

    expect(brandFilePaths).toEqual(GUIDE_BRAND_FILE_PATHS);
    expect(fontFilePaths).toEqual(GUIDE_FONT_FILE_PATHS);
    expect(brandFilePaths.logoBlack).toBe(resolve(GUIDE_PATHS.projectRoot, "VERTU-Logo-Black.png"));
    expect(fontFilePaths.dmSans400).toBe(
      resolve(GUIDE_PATHS.projectRoot, "node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff")
    );
  });

  test("derives full-build triggers and social fingerprint inputs from shared project-root resolvers", () => {
    expect(resolveGuideSocialBuildInputFiles(GUIDE_PATHS.projectRoot)).toEqual(GUIDE_SOCIAL_BUILD_INPUT_FILES);
    expect(resolveGuideFullBuildTriggerPaths(GUIDE_PATHS.projectRoot)).toEqual(GUIDE_FULL_BUILD_TRIGGER_PATHS);
    expect(GUIDE_FULL_BUILD_TRIGGER_PATHS).toContain(resolve(GUIDE_PATHS.projectRoot, "scripts/generate-templates.mjs"));
    expect(GUIDE_SOCIAL_BUILD_INPUT_FILES).toContain(resolve(GUIDE_PATHS.projectRoot, "src/server/social-renderer.ts"));
  });

  test("resolves public asset hrefs back to project-root source files through a shared helper", () => {
    expect(resolveGuidePublicAssetSourcePath(toGuideImageAssetHref("black-red.webp"), GUIDE_PATHS.projectRoot)).toBe(
      resolve(GUIDE_PATHS.projectRoot, "assets/images/black-red.webp")
    );
    expect(resolveGuidePublicAssetSourcePath("assets/images/black-red.webp", GUIDE_PATHS.projectRoot)).toBe(
      resolve(GUIDE_PATHS.projectRoot, "assets/images/black-red.webp")
    );
  });

  test("renders the full SSR document for direct navigation", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=zh&theme=light")));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
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
    expect(html).toContain(
      '<meta property="og:url" content="http://localhost:3000/?section=s15&amp;lang=zh&amp;theme=light">'
    );
    expect(html).toContain(
      '<link rel="canonical" href="http://localhost:3000/?section=s15&amp;lang=zh&amp;theme=light">'
    );
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
    expect(html).toMatch(
      new RegExp(`<label[^>]+id="${GUIDE_DOM_IDS.drawerOpenButton}"[^>]+for="${GUIDE_DOM_IDS.drawerControl}"`)
    );
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
        [GUIDE_REQUEST_ID_HEADER]: "section-fragment-request",
        [HTMX_REQUEST_HEADERS.request]: "true",
        [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.shell,
      },
    });
    const response = await app.handle(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get(GUIDE_REQUEST_ID_HEADER)).toBe("section-fragment-request");
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
    expect(response.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("hx-history-elt");
  });

  test("returns a typed invalid-section fallback envelope via HTTP status and alert content", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s404&lang=en&theme=dark")));
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(html).toContain("The requested section was not found");
    expect(html).toContain('data-active-section="s0"');
    expect(html).toContain(
      '<link rel="canonical" href="http://localhost:3000/?section=s0&amp;lang=en&amp;theme=dark">'
    );
  });

  test("uses a multilingual document language tag for bilingual SSR state", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=bi&theme=dark")));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="mul" data-theme="dark" data-lang="bi">');
  });

  test("serves the compiled stylesheet with a single sidebar overflow reset", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl(GUIDE_ROUTES.stylesheet)));
    const css = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    expect(css.match(/\.overflow-y-auto>\.menu\{/g) ?? []).toHaveLength(1);
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
    expect(downloadsMarkup).toContain(`id="${GUIDE_ASSET_OPERATOR_IDS.logoCanvas}"`);
    expect(downloadsMarkup).toContain(`id="${GUIDE_ASSET_OPERATOR_IDS.socialForm}"`);
    expect(downloadsMarkup).toContain('class="grid w-full items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"');
    expect(downloadsMarkup).toContain('class="social-toolkit-controls');
    expect(downloadsMarkup).toContain(`action="${GUIDE_ROUTES.guide}"`);
    expect(downloadsMarkup).toContain(`hx-get="${GUIDE_ROUTES.socialPreview}"`);
    expect(downloadsMarkup).toContain('hx-disabled-elt="find select"');
    expect(downloadsMarkup).toContain(`id="${GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel}"`);
    expect(
      downloadsMarkup
    ).toContain(`id="${GUIDE_ASSET_OPERATOR_IDS.socialAssetKind}" name="${SOCIAL_GUIDE_QUERY_PARAMS.asset}"`);
    expect(downloadsMarkup).toContain(`id="${GUIDE_ASSET_OPERATOR_IDS.socialTheme}" name="${SOCIAL_GUIDE_QUERY_PARAMS.theme}"`);
    expect(downloadsMarkup).toContain(`hx-target="#${GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel}"`);
    expect(downloadsMarkup).toContain('hx-trigger="submit"');
    expect(downloadsMarkup).toContain('hx-sync="this:replace"');
    expect(downloadsMarkup).not.toContain('hx-trigger="change, submit"');
    expect(downloadsMarkup).toContain('data-social-state="idle"');
    expect(downloadsMarkup).toContain('aria-busy="false"');
    expect(downloadsMarkup).toContain(
      'value="campaign-event" data-asset-kinds="og-card,event-invite,announcement-card,quote-card,linkedin-post,x-header" data-default-theme="gold" data-default-approved-asset="quantum-flip" selected="selected"'
    );
    expect(downloadsMarkup).toContain('option value="quantum-flip" selected="selected"');
    expect(downloadsMarkup).toContain('option value="gold" selected="selected"');
    expect(downloadsMarkup).toContain('id="dl-logo-black"');
    expect(downloadsMarkup).toContain('class="template-library-grid"');
    expect(downloadsMarkup).toContain('data-template-id="presentation"');
    expect(downloadsMarkup).toContain('data-template-id="letterhead"');
    expect(downloadsMarkup).toContain('id="dl-guide"');
    expect(downloadsMarkup).toContain('download="VERTU-Template.pptx"');
    expect(downloadsMarkup).toContain('download="VERTU-Letterhead.docx"');
    expect(downloadsMarkup).toContain('download="vertu-brand-guide.html"');
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

  test("preserves authored social form defaults when no embedded preview query is requested", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=en&theme=dark")));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('id="social-preview-panel"');
    expect(html).toContain('data-social-state="idle"');
    expect(html).toContain('value="campaign-event" data-asset-kinds="og-card,event-invite,announcement-card,quote-card,linkedin-post,x-header" data-default-theme="gold" data-default-approved-asset="quantum-flip" selected="selected"');
    expect(html).toContain('option value="quantum-flip" selected="selected"');
    expect(html).toContain('option value="gold" selected="selected"');
    expect(html).toContain("social-preview-idle");
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

  test("supports HEAD probes for generated assets and rejects non-public files", async () => {
    const existingAsset = await app.handle(new Request(toGuideRequestUrl("/VERTU-Logo-Black.png"), { method: "HEAD" }));
    const missingAsset = await app.handle(new Request(toGuideRequestUrl("/missing-logo.png"), { method: "HEAD" }));
    const sourceFile = await app.handle(new Request(toGuideRequestUrl("/README.md"), { method: "HEAD" }));

    expect(existingAsset.status).toBe(200);
    expect(missingAsset.status).toBe(404);
    expect(sourceFile.status).toBe(404);
  });
});

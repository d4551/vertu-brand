import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { GUIDE_PATHS } from "../src/server/runtime-config";
import {
  collectRepositoryPolicyFiles,
  findExportedDeclarationsMissingJsDoc,
  REPOSITORY_POLICY_ROOTS,
  REPOSITORY_POLICY_TOKENS,
  REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN,
} from "../src/shared/repository-policy";

const ROOT = GUIDE_PATHS.projectRoot;

describe("repository policy", () => {
  test("avoids console logging and try/catch blocks in maintained source", async () => {
    const files = await collectRepositoryPolicyFiles(REPOSITORY_POLICY_ROOTS);
    const contents = await Promise.all(files.map(async (file) => [file, await Bun.file(file).text()] as const));

    contents.forEach(([_file, source]) => {
      expect(source.includes(REPOSITORY_POLICY_TOKENS.console)).toBe(false);
      expect(/\btry\s*\{/.test(source)).toBe(false);
      expect(source.includes(REPOSITORY_POLICY_TOKENS.execCommand)).toBe(false);
    });
  });

  test("keeps authoring inline scripts free from console logging and try/catch blocks", async () => {
    const source = await Bun.file(join(ROOT, "index.html")).text();
    const inlineScripts = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(
      ([, scriptBody]) => scriptBody
    );

    inlineScripts.forEach((scriptBody) => {
      expect(scriptBody.includes(REPOSITORY_POLICY_TOKENS.console)).toBe(false);
      expect(/\btry\s*\{/.test(scriptBody)).toBe(false);
    });
  });

  test("keeps public TypeScript exports documented with JSDoc", async () => {
    const violations = await findExportedDeclarationsMissingJsDoc(REPOSITORY_POLICY_ROOTS);

    expect(violations).toEqual([]);
  });

  test("keeps SSR UI copy in the shared localization map instead of hardcoding control labels", async () => {
    const serverRenderSource = await Bun.file(join(ROOT, "src", "server", "render", "layout.ts")).text();
    const sectionRenderSource = await Bun.file(join(ROOT, "src", "server", "content", "source.ts")).text();

    [
      "Skip to main content",
      "Apply",
      "HTMX + Elysia",
      "Server-driven via HTMX",
      "Server-rendered VERTU brand system with HTMX-driven section navigation.",
      "SSR-first reference for visual identity, downloads, generators, and agent-ready implementation guidance.",
      "Logo variant",
      "Social media format",
      "Social media theme",
    ].forEach((literal) => {
      expect(serverRenderSource.includes(literal) || sectionRenderSource.includes(literal)).toBe(false);
    });
  });

  test("keeps section localization in the build output instead of mutating markup during requests", async () => {
    const sectionRenderSource = await Bun.file(join(ROOT, "src", "server", "content", "source.ts")).text();
    const sharedSectionMarkupSource = await Bun.file(join(ROOT, "src", "shared", "section-markup.ts")).text();
    const buildSource = await Bun.file(join(ROOT, "scripts", "build-app.ts")).text();

    expect(sectionRenderSource.includes("resolveCopy")).toBe(false);
    expect(sectionRenderSource.includes(".replace(")).toBe(false);
    expect(sectionRenderSource.includes('SECTION_REGISTRY.get(language)?.get(sectionId) ?? ""')).toBe(true);
    expect(sharedSectionMarkupSource.includes("prepareSectionMarkup")).toBe(true);
    expect(buildSource.includes("GuideLocalizedSectionRegistry")).toBe(true);
  });

  test("uses Bun HTMLRewriter for authoring extraction instead of parsing raw HTML sections with regex", async () => {
    const authoringGuideSource = await Bun.file(join(ROOT, "src", "shared", "authoring-guide.ts")).text();

    expect(authoringGuideSource.includes("new HTMLRewriter()")).toBe(true);
    expect(authoringGuideSource.includes("SECTION_BLOCK_PATTERN")).toBe(false);
    expect(authoringGuideSource.includes("SECTION_TITLE_PATTERN")).toBe(false);
    expect(authoringGuideSource.includes("extractGuideSections")).toBe(true);
  });

  test("keeps generated content imports behind a single server module", async () => {
    const generatedContentSource = await Bun.file(join(ROOT, "src", "server", "content", "generated.ts")).text();
    const navigationSource = await Bun.file(join(ROOT, "src", "server", "content", "navigation.ts")).text();
    const sectionSource = await Bun.file(join(ROOT, "src", "server", "content", "source.ts")).text();

    expect(generatedContentSource.includes("navigation.generated.ts")).toBe(true);
    expect(generatedContentSource.includes("sections.generated.ts")).toBe(true);
    expect(navigationSource.includes("navigation.generated.ts")).toBe(false);
    expect(sectionSource.includes("sections.generated.ts")).toBe(false);
    expect(navigationSource.includes('from "./generated"')).toBe(true);
    expect(sectionSource.includes('from "./generated"')).toBe(true);
  });

  test("uses the built Tailwind and daisyUI asset pipeline instead of browser-side utility generation", async () => {
    const serverRenderSource = await Bun.file(join(ROOT, "src", "server", "render", "layout.ts")).text();
    const sharedConfigSource = await Bun.file(join(ROOT, "src", "shared", "config.ts")).text();
    const authoringSource = await Bun.file(join(ROOT, "index.html")).text();

    [
      "tailwindcss-playcdn",
      "styles/vendor/daisyui.css",
      "/styles/brand-guide.css",
      "/scripts/vendor/htmx.min.js",
      "/scripts/vendor/prism.min.js",
      "/styles/vendor/prism-tomorrow.min.css",
    ].forEach((obsoleteReference) => {
      expect(serverRenderSource.includes(obsoleteReference) || authoringSource.includes(obsoleteReference)).toBe(false);
    });

    expect(serverRenderSource.includes("GUIDE_ROUTES.stylesheet")).toBe(true);
    expect(serverRenderSource.includes("GUIDE_ROUTES.clientScript")).toBe(true);
    expect(sharedConfigSource.includes("/assets/guide.css")).toBe(true);
    expect(sharedConfigSource.includes("/assets/guide.js")).toBe(true);
  });

  test("keeps Tailwind source scanning aligned with the actual project root", async () => {
    const guideStylesheetSource = await Bun.file(join(ROOT, "src", "client", "styles", "guide.css")).text();

    expect(guideStylesheetSource.includes('@source "../../../.generated/content";')).toBe(true);
    expect(guideStylesheetSource.includes('@source "../../../src";')).toBe(true);
    expect(guideStylesheetSource.includes('@import "prismjs/themes/prism-tomorrow.css";')).toBe(true);
    expect(guideStylesheetSource.includes('@source "../../../index.html";')).toBe(false);
  });

  test("serves only the generated public surface instead of exposing the repository root", async () => {
    const serverSource = await Bun.file(join(ROOT, "src", "server", "app.ts")).text();
    const runtimeConfigSource = await Bun.file(join(ROOT, "src", "server", "runtime-config.ts")).text();
    const socialRendererSource = await Bun.file(join(ROOT, "src", "server", "social-renderer.ts")).text();

    expect(serverSource.includes("staticPlugin")).toBe(true);
    expect(serverSource.includes("nativeStaticResponse: true")).toBe(true);
    expect(serverSource.includes('get("/*"')).toBe(false);
    expect(serverSource.includes("process.cwd()")).toBe(false);
    expect(runtimeConfigSource.includes("process.cwd()")).toBe(false);
    expect(runtimeConfigSource.includes("import.meta.dir")).toBe(true);
    expect(socialRendererSource.includes("process.cwd()")).toBe(false);
  });

  test("streams downloadable assets with Bun.file instead of buffering them into memory", async () => {
    const serverSource = await Bun.file(join(ROOT, "src", "server", "app.ts")).text();

    expect(serverSource.includes("return Bun.file(resolveDownloadPath(id));")).toBe(true);
    expect(serverSource.includes("Bun.file(resolveDownloadPath(id)).arrayBuffer()")).toBe(false);
  });

  test("keeps HTMX shell selectors and request contracts centralized", async () => {
    const layoutSource = await Bun.file(join(ROOT, "src", "server", "render", "layout.ts")).text();
    const enhancementSource = await Bun.file(join(ROOT, "src", "client", "progressive-enhancements.ts")).text();
    const socialToolkitSource = await Bun.file(join(ROOT, "src", "client", "social-toolkit.ts")).text();
    const htmxEventContractSource = await Bun.file(join(ROOT, "src", "shared", "htmx-event-contract.ts")).text();
    const viewStateSource = await Bun.file(join(ROOT, "src", "shared", "view-state.ts")).text();
    const sharedSocialToolkitSource = await Bun.file(join(ROOT, "src", "shared", "social-toolkit.ts")).text();
    const socialRendererSource = await Bun.file(join(ROOT, "src", "server", "social-renderer.ts")).text();

    expect(layoutSource.includes("GUIDE_DOM_IDS")).toBe(true);
    expect(layoutSource.includes("GUIDE_HTMX")).toBe(true);
    expect(viewStateSource.includes("resolveGuideState")).toBe(true);
    expect(viewStateSource.includes("resolveGuideDocumentLanguageTag")).toBe(true);
    expect(viewStateSource.includes("resolveGuideLocale")).toBe(true);
    expect(layoutSource.includes(`hx-target="\${GUIDE_SELECTORS.page}"`)).toBe(true);
    expect(layoutSource.includes(`hx-sync="\${GUIDE_SELECTORS.page}:replace"`)).toBe(true);
    expect(enhancementSource.includes("GUIDE_DOM_IDS")).toBe(true);
    expect(enhancementSource.includes("GUIDE_SELECTORS")).toBe(true);
    expect(enhancementSource.includes("resolveGuideState")).toBe(true);
    expect(enhancementSource.includes("resolveGuideDocumentLanguageTag")).toBe(true);
    expect(enhancementSource.includes("HTMX_BROWSER_EVENTS")).toBe(true);
    expect(enhancementSource.includes("resolveHtmxEventTarget")).toBe(true);
    expect(enhancementSource.includes("Reflect.get(")).toBe(false);
    expect(socialToolkitSource.includes("HTMX_BROWSER_EVENTS")).toBe(true);
    expect(socialToolkitSource.includes("resolveHtmxEventTarget")).toBe(true);
    expect(socialToolkitSource.includes("resolveGuideState")).toBe(true);
    expect(socialToolkitSource.includes("normalizeGuideSocialPreviewState")).toBe(true);
    expect(socialToolkitSource.includes("Reflect.get(")).toBe(false);
    expect(sharedSocialToolkitSource.includes("GUIDE_SOCIAL_PREVIEW_STATES")).toBe(true);
    expect(sharedSocialToolkitSource.includes("normalizeGuideSocialPreviewState")).toBe(true);
    expect(sharedSocialToolkitSource.includes("resolveGuideLocale")).toBe(true);
    expect(socialRendererSource.includes("resolveGuideLocale")).toBe(true);
    expect(layoutSource.includes("resolveGuideDocumentLanguageTag")).toBe(true);
    expect(layoutSource.includes("resolveGuideLocale")).toBe(true);
    expect(htmxEventContractSource.includes("HTMX_BROWSER_EVENTS")).toBe(true);
    expect(htmxEventContractSource.includes("resolveHtmxEventTarget")).toBe(true);
    expect(htmxEventContractSource.includes('interface HTMLElementEventMap')).toBe(true);
    expect(enhancementSource.includes("toSocialGuideHref")).toBe(true);
    expect(enhancementSource.includes("syncActiveSectionState")).toBe(true);
    expect(layoutSource.includes(`hx-indicator="\${GUIDE_HTMX.pageIndicator}"`)).toBe(true);
    expect(layoutSource.includes(`hx-get="\${themeCycleHref}"`) || layoutSource.includes(`hx-get="\${href}"`)).toBe(
      true
    );
    expect(layoutSource.includes('hx-push-url="true"')).toBe(true);
    expect(layoutSource.includes(`data-guide-section-id="\${item.id}"`)).toBe(true);
  });

  test("keeps extension boundaries lean before launch (no custom HTMX/Bun plugin layer)", async () => {
    const files = await collectRepositoryPolicyFiles([join(ROOT, "src"), join(ROOT, "scripts")]);
    const sources = await Promise.all(files.map(async (file) => [file, await Bun.file(file).text()] as const));

    sources.forEach(([_, source]) => {
      expect(source.includes(REPOSITORY_POLICY_TOKENS.htmxExtension)).toBe(false);
      expect(source.includes(REPOSITORY_POLICY_TOKENS.bunPlugin)).toBe(false);
    });
  });

  test("keeps social endpoint contracts centralized without hardcoded route literals", async () => {
    const socialPluginSource = await Bun.file(join(ROOT, "src", "server", "social-plugin.ts")).text();
    const socialToolkitSource = await Bun.file(join(ROOT, "src", "shared", "social-toolkit.ts")).text();
    const sectionMarkupSource = await Bun.file(join(ROOT, "src", "shared", "section-markup.ts")).text();

    expect(REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN.test(socialPluginSource)).toBe(false);
    expect(REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN.test(socialToolkitSource)).toBe(false);
    expect(socialPluginSource.includes("SOCIAL_ROUTE_TEMPLATES")).toBe(true);
    expect(socialPluginSource.includes("SOCIAL_QUERY_PARAMS")).toBe(true);
    expect(socialToolkitSource.includes("GUIDE_ROUTES.socialAsset")).toBe(true);
    expect(socialToolkitSource.includes("GUIDE_ROUTES.socialPack")).toBe(true);
    expect(socialToolkitSource.includes("GUIDE_ROUTES.socialPreview")).toBe(true);
    expect(socialToolkitSource.includes("SOCIAL_QUERY_PARAMS")).toBe(true);
    expect(sectionMarkupSource.includes("SOCIAL_GUIDE_QUERY_PARAMS")).toBe(true);
  });

  test("uses shared server origin defaults for social URL construction", async () => {
    const socialToolkitSource = await Bun.file(join(ROOT, "src", "shared", "social-toolkit.ts")).text();
    const sharedConfigSource = await Bun.file(join(ROOT, "src", "shared", "config.ts")).text();

    expect(socialToolkitSource.includes("http://localhost")).toBe(false);
    expect(socialToolkitSource.includes('path: "/assets/images/')).toBe(false);
    expect(socialToolkitSource.includes("toGuideImageAssetHref(")).toBe(true);
    expect(socialToolkitSource.includes("GUIDE_SERVER.localOrigin")).toBe(true);
    expect(socialToolkitSource.includes("url.hash = input.section")).toBe(false);
    expect(sharedConfigSource.includes("localOrigin: toGuideOrigin(")).toBe(true);
    expect(sharedConfigSource.includes('downloads: GUIDE_DOWNLOADS_ROUTE')).toBe(true);
    expect(sharedConfigSource.includes("href: toGuideDownloadHref(")).toBe(true);
    expect(sharedConfigSource.includes("toGuideImageAssetHref")).toBe(true);
  });

  test("centralizes runtime settings and request observability in shared server contracts", async () => {
    const runtimeSettingsSource = await Bun.file(join(ROOT, "src", "shared", "runtime-settings.ts")).text();
    const sharedConfigSource = await Bun.file(join(ROOT, "src", "shared", "config.ts")).text();
    const serverAppSource = await Bun.file(join(ROOT, "src", "server", "app.ts")).text();
    const observabilitySource = await Bun.file(join(ROOT, "src", "server", "observability-plugin.ts")).text();
    const socialPluginSource = await Bun.file(join(ROOT, "src", "server", "social-plugin.ts")).text();
    const socialPreviewSource = await Bun.file(join(ROOT, "src", "server", "social-preview-markup.ts")).text();
    const devSource = await Bun.file(join(ROOT, "scripts", "dev.ts")).text();

    expect(runtimeSettingsSource.includes("resolveGuideRuntimeSettings")).toBe(true);
    expect(runtimeSettingsSource.includes("GUIDE_RUNTIME_DEFAULTS")).toBe(true);
    expect(runtimeSettingsSource.includes("logGuideRuntimeSettingWarnings")).toBe(true);
    expect(sharedConfigSource.includes("GUIDE_RUNTIME_SETTINGS")).toBe(true);
    expect(sharedConfigSource.includes("GUIDE_REQUEST_ID_HEADER")).toBe(true);
    expect(serverAppSource.includes("guideObservabilityPlugin")).toBe(true);
    expect(serverAppSource.includes("GUIDE_SERVER.host")).toBe(true);
    expect(observabilitySource.includes("Guide request completed")).toBe(true);
    expect(observabilitySource.includes("GUIDE_REQUEST_ID_HEADER")).toBe(true);
    expect(observabilitySource.includes("resolveGuideRequestId")).toBe(true);
    expect(socialPluginSource.includes("resolveGuideRequestId")).toBe(true);
    expect(socialPluginSource.includes("buildSocialErrorResponse")).toBe(true);
    expect(socialPluginSource.includes("buildConditionalBinaryResponse")).toBe(true);
    expect(socialPluginSource.includes("buildConditionalManifestResponse")).toBe(true);
    expect(socialPluginSource.includes("manifest: unknown")).toBe(false);
    expect(socialPluginSource.includes("buildSocialHtmlResponse")).toBe(true);
    expect(socialPluginSource.includes("buildSocialRedirectResponse")).toBe(true);
    expect(socialPreviewSource.includes("new HTMLRewriter()")).toBe(true);
    expect(socialPreviewSource.includes("previewMarkup?.includes")).toBe(false);
    expect(socialPreviewSource.includes("replaceSocialPreviewPanel")).toBe(false);
    expect(socialPreviewSource.includes("updatePreviewPanelState")).toBe(false);
    expect(socialPreviewSource.includes("resolveGuideSocialPreviewState")).toBe(true);
    expect(devSource.includes("GUIDE_RUNTIME_SETTINGS.devBuildDebounceMs")).toBe(true);
    expect(devSource.includes("GUIDE_RUNTIME_SETTINGS.devWatcherWarmupMs")).toBe(true);
  });

  test("keeps generated template metadata in a shared catalog instead of duplicating UI and build literals", async () => {
    const brandTokensSource = await Bun.file(join(ROOT, "src", "shared", "brand-tokens.ts")).text();
    const templateCatalogSource = await Bun.file(join(ROOT, "src", "shared", "template-catalog.ts")).text();
    const templateMarkupSource = await Bun.file(join(ROOT, "src", "shared", "template-markup.ts")).text();
    const templateBuildSource = await Bun.file(join(ROOT, "scripts", "generate-templates.mjs")).text();
    const runtimeConfigSource = await Bun.file(join(ROOT, "src", "server", "runtime-config.ts")).text();
    const socialRendererSource = await Bun.file(join(ROOT, "src", "server", "social-renderer.ts")).text();

    expect(brandTokensSource.includes("GUIDE_BRAND_COLOR_TOKENS")).toBe(true);
    expect(brandTokensSource.includes("GUIDE_BRAND_FONT_FAMILIES")).toBe(true);
    expect(templateCatalogSource.includes("GUIDE_TEMPLATE_CATALOG")).toBe(true);
    expect(templateMarkupSource.includes("GUIDE_TEMPLATE_CATALOG")).toBe(true);
    expect(templateBuildSource.includes("GUIDE_TEMPLATE_CATALOG")).toBe(true);
    expect(templateBuildSource.includes("GUIDE_BRAND_RELEASE")).toBe(true);
    expect(templateBuildSource.includes("GUIDE_BRAND_COLOR_TOKENS")).toBe(true);
    expect(templateBuildSource.includes("GUIDE_BRAND_FONT_FAMILIES")).toBe(true);
    expect(templateBuildSource.includes("GUIDE_BRAND_FILE_PATHS")).toBe(true);
    expect(runtimeConfigSource.includes("GUIDE_BRAND_FILE_PATHS")).toBe(true);
    expect(socialRendererSource.includes("GUIDE_SOCIAL_THEME_TOKENS")).toBe(true);
  });

  test("keeps social approved-asset presentation copy in the shared registry instead of renderer conditionals", async () => {
    const socialToolkitSource = await Bun.file(join(ROOT, "src", "shared", "social-toolkit.ts")).text();
    const socialRendererSource = await Bun.file(join(ROOT, "src", "server", "social-renderer.ts")).text();
    const sectionMarkupSource = await Bun.file(join(ROOT, "src", "shared", "section-markup.ts")).text();
    const i18nSource = await Bun.file(join(ROOT, "src", "shared", "i18n.ts")).text();

    expect(socialToolkitSource.includes("label:")).toBe(true);
    expect(socialToolkitSource.includes("meta:")).toBe(true);
    expect(socialToolkitSource.includes("pickerLabel:")).toBe(true);
    expect(sectionMarkupSource.includes("SOCIAL_APPROVED_ASSETS[assetId]")).toBe(true);
    expect(sectionMarkupSource.includes("socialApprovedAssetAgentQ")).toBe(false);
    expect(sectionMarkupSource.includes("socialApprovedAssetQuantumFlip")).toBe(false);
    expect(sectionMarkupSource.includes("socialApprovedAssetSignature")).toBe(false);
    expect(i18nSource.includes("socialApprovedAssetAgentQ")).toBe(false);
    expect(i18nSource.includes("socialApprovedAssetQuantumFlip")).toBe(false);
    expect(i18nSource.includes("socialApprovedAssetSignature")).toBe(false);
    expect(socialRendererSource.includes('carouselHeading: request.language === "zh" ? "轮播帧" : "Carousel Frames"')).toBe(
      false
    );
    [
      "Agent Q Collector Edition",
      "Launch-approved hero asset",
      "Quantum Flip Gilded Detail",
      "Event-approved luxury detail",
      "Signature Black/Red Story",
      "Evergreen brand narrative anchor",
    ].forEach((literal) => {
      expect(socialRendererSource.includes(literal)).toBe(false);
    });
  });

  test("lint-gates verification scripts and fingerprints canonical social builds", async () => {
    const packageSource = await Bun.file(join(ROOT, "package.json")).text();
    const buildSource = await Bun.file(join(ROOT, "scripts", "build-app.ts")).text();
    const bootSource = await Bun.file(join(ROOT, "src", "server", "boot.ts")).text();
    const devSource = await Bun.file(join(ROOT, "scripts", "dev.ts")).text();
    const indexSource = await Bun.file(join(ROOT, "src", "server", "index.ts")).text();
    const runtimeConfigSource = await Bun.file(join(ROOT, "src", "server", "runtime-config.ts")).text();
    const serveSource = await Bun.file(join(ROOT, "src", "server", "serve.ts")).text();

    expect(packageSource.includes('"preaudit": "bun run lint && bun run build"')).toBe(true);
    expect(packageSource.includes('"pretest": "bun run lint && bun run build"')).toBe(true);
    expect(packageSource.includes('"pretypecheck": "bun run lint && bun run build"')).toBe(true);
    expect(buildSource.includes('new Bun.CryptoHasher("sha256")')).toBe(true);
    expect(buildSource.includes("socialBuildFingerprintOutput")).toBe(true);
    expect(buildSource.includes('socialBuildCache: canReuseCanonicalSocialBuild ? "reused" : "rebuilt"')).toBe(true);
    expect(runtimeConfigSource.includes("socialBuildFingerprintOutput")).toBe(true);
    expect(runtimeConfigSource.includes("GUIDE_DEV_BUILD_SCRIPTS")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuidePaths")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideBrandFilePaths")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideFontFilePaths")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuidePublicAssetSourcePath")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuidePublicDirectories")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuidePublicFiles")).toBe(true);
    expect(runtimeConfigSource.includes("GUIDE_SOCIAL_BUILD_INPUT_FILES")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideSocialBuildInputFiles")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideFullBuildTriggerPaths")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideDevBuildTarget")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideBuildCommand")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideServerCommand")).toBe(true);
    expect(runtimeConfigSource.includes("resolveGuideStylesheetBuildCommand")).toBe(true);
    expect(runtimeConfigSource.includes("GUIDE_SERVER_ENTRYPOINT_FILES")).toBe(true);
    expect(bootSource.includes("GUIDE_SERVER_BOOT_OPTIONS")).toBe(true);
    expect(bootSource.includes("bootGuideServer")).toBe(true);
    expect(devSource.includes("resolveGuideDevBuildTarget")).toBe(true);
    expect(devSource.includes("resolveGuideBuildCommand")).toBe(true);
    expect(devSource.includes("resolveGuideServerCommand")).toBe(true);
    expect(indexSource.includes('bootGuideServer("dev")')).toBe(true);
    expect(serveSource.includes('bootGuideServer("serve")')).toBe(true);
    expect(buildSource.includes("resolveGuidePaths")).toBe(true);
    expect(buildSource.includes("resolveGuidePublicAssetSourcePath")).toBe(true);
    expect(buildSource.includes("resolveGuidePublicDirectories")).toBe(true);
    expect(buildSource.includes("resolveGuidePublicFiles")).toBe(true);
    expect(buildSource.includes("GUIDE_SOCIAL_BUILD_INPUT_FILES")).toBe(true);
    expect(buildSource.includes("resolveGuideStylesheetBuildCommand")).toBe(true);
    expect(buildSource.includes("GUIDE_FONT_FILE_PATHS")).toBe(false);
    expect(buildSource.includes("path.slice(1)")).toBe(false);
    expect(buildSource.includes("toStagingPath")).toBe(false);
  });

  test("keeps accessibility localization data-driven instead of depending on authoring English literals", async () => {
    const authoringSource = await Bun.file(join(ROOT, "index.html")).text();
    const sectionMarkupSource = await Bun.file(join(ROOT, "src", "shared", "section-markup.ts")).text();
    const socialPreviewSource = await Bun.file(join(ROOT, "src", "server", "social-preview-markup.ts")).text();

    [
      'aria-label="Logo generator preview"',
      'aria-label="Campaign toolkit preview"',
      'aria-label="VERTU logo white on black background"',
      'aria-label="Copy VERTU Black #080808"',
    ].forEach((literal) => {
      expect(authoringSource.includes(literal)).toBe(false);
    });

    expect(authoringSource.includes('data-i18n-aria="logoGeneratorPreview"')).toBe(true);
    expect(authoringSource.includes('data-i18n-aria="socialToolkitPreviewAria"')).toBe(true);
    expect(authoringSource.includes('data-i18n-aria="logoBoxOnBlackAlt"')).toBe(true);
    expect(sectionMarkupSource.includes('aria-label="Logo generator preview"')).toBe(false);
    expect(sectionMarkupSource.includes('aria-label="Campaign toolkit preview"')).toBe(false);
    expect(socialPreviewSource.includes('aria-label="$\\{escapeAttribute(asset.fileName)}"')).toBe(false);
    expect(socialPreviewSource.includes('aria-label="$\\{escapeAttribute(frame.fileName)}"')).toBe(false);
    expect(socialPreviewSource.includes("socialToolkitLabelDownloadAssetAria")).toBe(true);
    expect(socialPreviewSource.includes("socialToolkitLabelPreviewFrameAria")).toBe(true);
    expect(socialPreviewSource.includes("socialToolkitLabelDownloadFrameAria")).toBe(true);
  });

  test("keeps downloads-surface DOM ids centralized across markup and browser enhancements", async () => {
    const assetOperatorContractSource = await Bun.file(join(ROOT, "src", "shared", "asset-operator-contract.ts")).text();
    const logoGeneratorSource = await Bun.file(join(ROOT, "src", "client", "logo-generator.ts")).text();
    const socialToolkitClientSource = await Bun.file(join(ROOT, "src", "client", "social-toolkit.ts")).text();
    const sectionMarkupSource = await Bun.file(join(ROOT, "src", "shared", "section-markup.ts")).text();
    const socialPreviewSource = await Bun.file(join(ROOT, "src", "server", "social-preview-markup.ts")).text();

    expect(assetOperatorContractSource.includes("GUIDE_ASSET_OPERATOR_IDS")).toBe(true);
    expect(logoGeneratorSource.includes("GUIDE_ASSET_OPERATOR_IDS")).toBe(true);
    expect(logoGeneratorSource.includes("GUIDE_ASSET_OPERATOR_SELECTORS")).toBe(true);
    expect(socialToolkitClientSource.includes("GUIDE_ASSET_OPERATOR_IDS")).toBe(true);
    expect(sectionMarkupSource.includes("GUIDE_ASSET_OPERATOR_IDS")).toBe(true);
    expect(socialPreviewSource.includes("GUIDE_ASSET_OPERATOR_IDS")).toBe(true);
    expect(logoGeneratorSource.includes('document.getElementById("gen-canvas")')).toBe(false);
    expect(socialToolkitClientSource.includes('previewPanel: "social-preview-panel"')).toBe(false);
  });
});

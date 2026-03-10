#!/usr/bin/env bun

import { join } from "node:path";

import { app } from "../src/server/app";
import { GUIDE_NAVIGATION } from "../src/server/content/navigation";
import { GUIDE_PATHS } from "../src/server/runtime-config";
import { GUIDE_ROUTES, HTMX_REQUEST_HEADERS, toGuideRequestUrl } from "../src/shared/config";
import { findInteractiveElementsMissingAriaLabels } from "../src/shared/markup";
import {
  collectRepositoryPolicyFiles,
  findExportedDeclarationsMissingJsDoc,
  REPOSITORY_POLICY_ROOTS,
  REPOSITORY_POLICY_TOKENS,
  REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN,
} from "../src/shared/repository-policy";
import { GUIDE_DOM_IDS, GUIDE_HTMX, GUIDE_SELECTORS } from "../src/shared/shell-contract";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS } from "../src/shared/view-state";
import { renderSectionMarkup } from "../src/server/content/source";
import { writeStructuredLog } from "../src/shared/logger";

const auditRoot = GUIDE_PATHS.projectRoot;

const issues: string[] = [];

const fullResponse = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=zh&theme=light")));
const fullHtml = await fullResponse.text();

if (fullResponse.status !== 200) {
  issues.push(`Expected SSR document status 200 but received ${fullResponse.status}`);
}

if (!fullResponse.headers.get("content-type")?.includes("text/html")) {
  issues.push("SSR document is not served with an HTML content type.");
}

if (!fullResponse.headers.get("vary")?.includes("HX-History-Restore-Request")) {
  issues.push("SSR document is missing the HTMX Vary header contract.");
}

if (!fullHtml.includes("<!DOCTYPE html>")) {
  issues.push("SSR document is missing the doctype.");
}

if (!fullHtml.includes(`id="${GUIDE_DOM_IDS.shell}"`)) {
  issues.push("SSR document is missing the guide shell.");
}

if (!fullHtml.includes(`id="${GUIDE_DOM_IDS.page}"`) || !fullHtml.includes(`id="${GUIDE_DOM_IDS.cover}"`)) {
  issues.push("SSR document is missing the branded cover wrapper.");
}

if (!fullHtml.includes("/assets/guide.css") || !fullHtml.includes("/assets/guide.js")) {
  issues.push("SSR document is missing the built application asset references.");
}

if (
  fullHtml.includes("tailwindcss-playcdn") ||
  fullHtml.includes("/styles/vendor/daisyui.css") ||
  fullHtml.includes("/styles/brand-guide.css") ||
  fullHtml.includes("/scripts/vendor/htmx.min.js") ||
  fullHtml.includes("/scripts/vendor/prism.min.js") ||
  fullHtml.includes("/styles/vendor/prism-tomorrow.min.css")
) {
  issues.push("SSR document still references browser-side or vendored assets instead of the compiled pipeline.");
}

if (!fullHtml.includes("hx-history-elt")) {
  issues.push("SSR shell is missing the HTMX history element marker.");
}

if (
  !fullHtml.includes(`hx-target="${GUIDE_SELECTORS.page}"`) ||
  !fullHtml.includes(`hx-sync="${GUIDE_SELECTORS.page}:replace"`)
) {
  issues.push("Global guide controls are missing the shared page-level HTMX contract.");
}

if (!fullHtml.includes('data-guide-section-id="s1"')) {
  issues.push("Guide navigation is missing the shared section-anchor contract.");
}

if (!fullHtml.includes(`hx-disabled-elt="${GUIDE_HTMX.disabledFormElements}"`)) {
  issues.push("HTMX state forms are missing the shared disabled-elements contract.");
}

if (!fullHtml.includes(`id="${GUIDE_DOM_IDS.scrollProgress}"`)) {
  issues.push("SSR document is missing the scroll progress indicator.");
}

if (!fullHtml.includes(`id="${GUIDE_DOM_IDS.coverScroll}"`)) {
  issues.push("SSR document is missing the branded scroll affordance.");
}

if (
  !fullHtml.includes(`id="${GUIDE_DOM_IDS.drawerOpenButton}"`) ||
  !fullHtml.includes(`aria-controls="${GUIDE_DOM_IDS.sidebarPanel}"`)
) {
  issues.push("Drawer open control is missing its accessible name.");
}

if (!fullHtml.includes(`id="${GUIDE_DOM_IDS.requestIndicator}"`)) {
  issues.push("SSR document is missing the HTMX request indicator.");
}

if (fullHtml.includes("HTMX + Elysia")) {
  issues.push("SSR shell still contains technical or obsolete primary-shell copy.");
}

if (!fullHtml.includes("传播套件预览")) {
  issues.push("Localized canvas accessibility copy is missing from the SSR document.");
}

if (
  !fullHtml.includes(
    'value="campaign-event" data-asset-kinds="og-card,event-invite,announcement-card,quote-card,linkedin-post,x-header" data-default-theme="gold" data-default-approved-asset="quantum-flip" selected="selected"'
  ) ||
  !fullHtml.includes('option value="quantum-flip" selected="selected"') ||
  !fullHtml.includes('option value="gold" selected="selected"') ||
  !fullHtml.includes('id="social-preview-panel"') ||
  !fullHtml.includes('data-social-state="idle"')
) {
  issues.push("SSR downloads section is not preserving the authored social preview defaults.");
}

for (const language of GUIDE_LANGUAGES) {
  for (const sectionId of GUIDE_SECTION_IDS) {
    const response = await app.handle(
      new Request(toGuideRequestUrl(`/?section=${sectionId}&lang=${language}&theme=dark`))
    );
    const html = await response.text();
    const missingInteractiveLabels = findInteractiveElementsMissingAriaLabels(html);

    missingInteractiveLabels.forEach((elementMarkup) => {
      issues.push(
        `Interactive element is missing an explicit accessible name for section ${sectionId} (${language}): ${elementMarkup}`
      );
    });
  }
}

const fragmentResponse = await app.handle(
  new Request(toGuideRequestUrl("/?section=s14&lang=en&theme=dark"), {
    headers: {
      [HTMX_REQUEST_HEADERS.request]: "true",
      [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.shell,
    },
  })
);
const fragmentHtml = await fragmentResponse.text();

if (fragmentHtml.includes("<!DOCTYPE html>")) {
  issues.push("HTMX fragment unexpectedly returned a full document.");
}

if (!fragmentResponse.headers.get("content-type")?.includes("text/html")) {
  issues.push("HTMX fragment is not served with an HTML content type.");
}

if (fragmentHtml.includes(`id="${GUIDE_DOM_IDS.page}"`)) {
  issues.push("Section-only HTMX swaps should not return the full branded page wrapper.");
}

const pageResponse = await app.handle(
  new Request(toGuideRequestUrl("/?section=s15&lang=zh&theme=light"), {
    headers: {
      [HTMX_REQUEST_HEADERS.request]: "true",
      [HTMX_REQUEST_HEADERS.target]: GUIDE_DOM_IDS.page,
    },
  })
);
const pageHtml = await pageResponse.text();

if (!pageHtml.includes(`id="${GUIDE_DOM_IDS.page}"`) || !pageHtml.includes(`id="${GUIDE_DOM_IDS.cover}"`)) {
  issues.push("Global HTMX swaps should return the branded page wrapper.");
}

const historyRestoreResponse = await app.handle(
  new Request(toGuideRequestUrl("/?section=s9&lang=bi&theme=dark"), {
    headers: {
      [HTMX_REQUEST_HEADERS.historyRestoreRequest]: "true",
      [HTMX_REQUEST_HEADERS.request]: "true",
    },
  })
);
const historyRestoreHtml = await historyRestoreResponse.text();

if (!historyRestoreHtml.includes("<!DOCTYPE html>")) {
  issues.push("HTMX history restore request did not receive a full document.");
}

if (!historyRestoreResponse.headers.get("content-type")?.includes("text/html")) {
  issues.push("HTMX history restore response is not served with an HTML content type.");
}

const stylesheetResponse = await app.handle(new Request(toGuideRequestUrl("/assets/guide.css")));
const stylesheetHtml = await stylesheetResponse.text();
const sourceFileResponse = await app.handle(new Request(toGuideRequestUrl("/README.md")));
const authoringStylesheetResponse = await app.handle(new Request(toGuideRequestUrl("/styles/brand-guide.css")));
const vendoredHtmxResponse = await app.handle(new Request(toGuideRequestUrl("/scripts/vendor/htmx.min.js")));
const vendoredPrismResponse = await app.handle(new Request(toGuideRequestUrl("/scripts/vendor/prism.min.js")));
const vendoredPrismStylesheetResponse = await app.handle(
  new Request(toGuideRequestUrl("/styles/vendor/prism-tomorrow.min.css"))
);

if (stylesheetResponse.status !== 200 || !stylesheetHtml.includes("--color-v-gold")) {
  issues.push("Built stylesheet route is missing or incomplete.");
}

if (sourceFileResponse.status !== 404) {
  issues.push("Source files are still reachable through the public server surface.");
}

if (authoringStylesheetResponse.status !== 404) {
  issues.push("Authoring-only styles are still reachable through the public server surface.");
}

if (
  vendoredHtmxResponse.status !== 404 ||
  vendoredPrismResponse.status !== 404 ||
  vendoredPrismStylesheetResponse.status !== 404
) {
  issues.push("Vendored browser scripts or styles are still reachable through the public server surface.");
}

const compiledStylesheetSource = await Bun.file(join(auditRoot, "src/client/styles/guide.css")).text();
const authoringGuideSource = await Bun.file(join(auditRoot, "src", "shared", "authoring-guide.ts")).text();
if (
  !compiledStylesheetSource.includes('@source "../../../.generated/content";') ||
  !compiledStylesheetSource.includes('@source "../../../src";')
) {
  issues.push("Tailwind source scanning paths are not aligned with the actual project root.");
}

if (compiledStylesheetSource.includes('@source "../../../index.html";')) {
  issues.push("Tailwind source scanning still points at the authoring HTML.");
}

if (
  !authoringGuideSource.includes("new HTMLRewriter()") ||
  authoringGuideSource.includes("SECTION_BLOCK_PATTERN") ||
  authoringGuideSource.includes("SECTION_TITLE_PATTERN")
) {
  issues.push("Authoring extraction has drifted away from the Bun HTMLRewriter pipeline.");
}

GUIDE_SECTION_IDS.forEach((sectionId) => {
  const markup = renderSectionMarkup(sectionId, "bi");

  if (!markup.includes(`id="${sectionId}"`)) {
    issues.push(`Section markup for ${sectionId} is missing its section id.`);
  }
});

const typographyMarkup = renderSectionMarkup("s5", "en");
if (!typographyMarkup.includes('id="typePreview"') || !typographyMarkup.includes('id="typeTrack"')) {
  issues.push("Typography playground controls are missing from the generated section markup.");
}

const downloadsMarkup = renderSectionMarkup("s15", "en");
if (
  !downloadsMarkup.includes('id="gen-canvas"') ||
  !downloadsMarkup.includes('id="social-toolkit-form"') ||
  !downloadsMarkup.includes(`action="${GUIDE_ROUTES.guide}"`) ||
  !downloadsMarkup.includes(`hx-get="${GUIDE_ROUTES.socialPreview}"`) ||
  !downloadsMarkup.includes('id="social-preview-panel"') ||
  !downloadsMarkup.includes('hx-target="#social-preview-panel"') ||
  !downloadsMarkup.includes('hx-sync="this:replace"')
) {
  issues.push("Download generators are missing from the generated section markup.");
}

const zhColorMarkup = renderSectionMarkup("s3", "zh");
if (!zhColorMarkup.includes("65% VERTU 黑") || zhColorMarkup.includes("65% VERTU Black")) {
  issues.push("Color distribution UI strings are not fully localized in the generated zh section markup.");
}

const zhPantoneMarkup = renderSectionMarkup("s4", "zh");
if (!zhPantoneMarkup.includes("金属金 · 主色") || zhPantoneMarkup.includes("Metallic Gold · Primary")) {
  issues.push("Pantone descriptor UI strings are not fully localized in the generated zh section markup.");
}

const zhDownloadsMarkup = renderSectionMarkup("s15", "zh");
if (
  !zhDownloadsMarkup.includes("传播套件 — 品牌常青") ||
  zhDownloadsMarkup.includes("Campaign Pack — Signature") ||
  !zhDownloadsMarkup.includes("批准素材 — Agent Q")
) {
  issues.push("Social toolkit preset labels are not fully localized in the generated zh downloads section.");
}

if (
  !zhDownloadsMarkup.includes('aria-label="下载适用于浅色背景的黑色 VERTU 标志 PNG"') ||
  !zhDownloadsMarkup.includes('aria-label="传播套件"') ||
  !zhDownloadsMarkup.includes('aria-label="传播套件预览"')
) {
  issues.push("Localized explicit aria labels are missing from the generated download controls.");
}

if (GUIDE_NAVIGATION.map((item) => item.id).join(",") !== GUIDE_SECTION_IDS.join(",")) {
  issues.push("Generated navigation metadata has drifted from the canonical section ids.");
}

if (GUIDE_NAVIGATION[0]?.title.en !== "VERTU Brand Guide" || GUIDE_NAVIGATION[15]?.title.en !== "Downloads & Assets") {
  issues.push("Generated navigation titles are not being sourced from the authoring guide metadata.");
}

const policyFiles = await collectRepositoryPolicyFiles(REPOSITORY_POLICY_ROOTS);
const policySources = await Promise.all(policyFiles.map(async (file) => [file, await Bun.file(file).text()] as const));

policySources.forEach(([file, source]) => {
  if (source.includes(REPOSITORY_POLICY_TOKENS.console)) {
    issues.push(`Console logging is still present in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (/\btry\s*\{/.test(source)) {
    issues.push(`Try/catch usage is still present in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (source.includes(REPOSITORY_POLICY_TOKENS.execCommand)) {
    issues.push(`document.execCommand fallback is still present in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (source.includes(REPOSITORY_POLICY_TOKENS.htmxExtension)) {
    issues.push(`Unexpected custom HTMX extension was introduced in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (source.includes(REPOSITORY_POLICY_TOKENS.bunPlugin)) {
    issues.push(`Unexpected Bun plugin API usage was introduced in ${file.replace(`${auditRoot}/`, "")}.`);
  }
});

const undocumentedExports = await findExportedDeclarationsMissingJsDoc(REPOSITORY_POLICY_ROOTS);
undocumentedExports.forEach(({ exportName, filePath }) => {
  issues.push(`Export ${exportName} is missing JSDoc in ${filePath.replace(`${auditRoot}/`, "")}.`);
});

const authoringDocumentSource = await Bun.file(join(auditRoot, "index.html")).text();
const authoringInlineScripts = [...authoringDocumentSource.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(
  ([, scriptBody]) => scriptBody
);

const socialPluginSource = await Bun.file(join(auditRoot, "src", "server", "social-plugin.ts")).text();
const clientEnhancementSource = await Bun.file(join(auditRoot, "src", "client", "progressive-enhancements.ts")).text();
const clientSocialToolkitSource = await Bun.file(join(auditRoot, "src", "client", "social-toolkit.ts")).text();
const socialPreviewSource = await Bun.file(join(auditRoot, "src", "server", "social-preview-markup.ts")).text();
const socialToolkitSource = await Bun.file(join(auditRoot, "src", "shared", "social-toolkit.ts")).text();
const sharedConfigSource = await Bun.file(join(auditRoot, "src", "shared", "config.ts")).text();
const htmxEventContractSource = await Bun.file(join(auditRoot, "src", "shared", "htmx-event-contract.ts")).text();
const runtimeSettingsSource = await Bun.file(join(auditRoot, "src", "shared", "runtime-settings.ts")).text();
const i18nSource = await Bun.file(join(auditRoot, "src", "shared", "i18n.ts")).text();
const sectionMarkupSource = await Bun.file(join(auditRoot, "src", "shared", "section-markup.ts")).text();
const viewStateSource = await Bun.file(join(auditRoot, "src", "shared", "view-state.ts")).text();
const serverAppSource = await Bun.file(join(auditRoot, "src", "server", "app.ts")).text();
const observabilitySource = await Bun.file(join(auditRoot, "src", "server", "observability-plugin.ts")).text();
const devSource = await Bun.file(join(auditRoot, "scripts", "dev.ts")).text();
const bootSource = await Bun.file(join(auditRoot, "src", "server", "boot.ts")).text();
const indexSource = await Bun.file(join(auditRoot, "src", "server", "index.ts")).text();
const runtimeConfigSource = await Bun.file(join(auditRoot, "src", "server", "runtime-config.ts")).text();
const serveSource = await Bun.file(join(auditRoot, "src", "server", "serve.ts")).text();
const buildSource = await Bun.file(join(auditRoot, "scripts", "build-app.ts")).text();
const generatedContentSource = await Bun.file(join(auditRoot, "src", "server", "content", "generated.ts")).text();
const navigationSource = await Bun.file(join(auditRoot, "src", "server", "content", "navigation.ts")).text();
const sectionSource = await Bun.file(join(auditRoot, "src", "server", "content", "source.ts")).text();
const socialRendererSource = await Bun.file(join(auditRoot, "src", "server", "social-renderer.ts")).text();
if (
  !runtimeSettingsSource.includes("resolveGuideRuntimeSettings") ||
  !runtimeSettingsSource.includes("GUIDE_RUNTIME_DEFAULTS") ||
  !runtimeSettingsSource.includes("logGuideRuntimeSettingWarnings") ||
  !sharedConfigSource.includes("GUIDE_RUNTIME_SETTINGS") ||
  !sharedConfigSource.includes("GUIDE_REQUEST_ID_HEADER") ||
  !serverAppSource.includes("guideObservabilityPlugin") ||
  !serverAppSource.includes("GUIDE_SERVER.host") ||
  !observabilitySource.includes("Guide request completed") ||
  !observabilitySource.includes("GUIDE_REQUEST_ID_HEADER") ||
  !observabilitySource.includes("resolveGuideRequestId") ||
  !socialPluginSource.includes("resolveGuideRequestId") ||
  !socialPluginSource.includes("buildSocialErrorResponse") ||
  !socialPluginSource.includes("buildConditionalBinaryResponse") ||
  !socialPluginSource.includes("buildConditionalManifestResponse") ||
  socialPluginSource.includes("manifest: unknown") ||
  !socialPluginSource.includes("buildSocialHtmlResponse") ||
  !socialPluginSource.includes("buildSocialRedirectResponse") ||
  !socialPreviewSource.includes("new HTMLRewriter()") ||
  socialPreviewSource.includes("previewMarkup?.includes") ||
  socialPreviewSource.includes("replaceSocialPreviewPanel") ||
  socialPreviewSource.includes("updatePreviewPanelState") ||
  !socialPreviewSource.includes("resolveGuideSocialPreviewState") ||
  !devSource.includes("GUIDE_RUNTIME_SETTINGS.devBuildDebounceMs") ||
  !devSource.includes("GUIDE_RUNTIME_SETTINGS.devWatcherWarmupMs")
) {
  issues.push("Runtime settings and request observability are drifting away from the shared typed contract.");
}

if (
  !htmxEventContractSource.includes("HTMX_BROWSER_EVENTS") ||
  !htmxEventContractSource.includes("resolveHtmxEventTarget") ||
  !htmxEventContractSource.includes("interface HTMLElementEventMap") ||
  !viewStateSource.includes("resolveGuideState") ||
  !viewStateSource.includes("resolveGuideDocumentLanguageTag") ||
  !viewStateSource.includes("resolveGuideLocale") ||
  !clientEnhancementSource.includes("HTMX_BROWSER_EVENTS") ||
  !clientEnhancementSource.includes("resolveHtmxEventTarget") ||
  !clientEnhancementSource.includes("resolveGuideState") ||
  !clientEnhancementSource.includes("resolveGuideDocumentLanguageTag") ||
  clientEnhancementSource.includes("Reflect.get(") ||
  !clientSocialToolkitSource.includes("HTMX_BROWSER_EVENTS") ||
  !clientSocialToolkitSource.includes("resolveHtmxEventTarget") ||
  !clientSocialToolkitSource.includes("resolveGuideState") ||
  !clientSocialToolkitSource.includes("normalizeGuideSocialPreviewState") ||
  !socialToolkitSource.includes("GUIDE_SOCIAL_PREVIEW_STATES") ||
  !socialToolkitSource.includes("normalizeGuideSocialPreviewState") ||
  !socialToolkitSource.includes("resolveGuideLocale") ||
  !socialRendererSource.includes("resolveGuideLocale") ||
  clientSocialToolkitSource.includes("Reflect.get(")
) {
  issues.push("HTMX browser event handling is drifting away from the shared typed event contract.");
}

if (
  REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN.test(socialPluginSource) ||
  REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN.test(socialToolkitSource) ||
  !socialPluginSource.includes("SOCIAL_ROUTE_TEMPLATES") ||
  !socialPluginSource.includes("SOCIAL_QUERY_PARAMS") ||
  !socialToolkitSource.includes("GUIDE_ROUTES.socialAsset") ||
  !socialToolkitSource.includes("GUIDE_ROUTES.socialPack") ||
  !socialToolkitSource.includes("GUIDE_ROUTES.socialPreview") ||
  !socialToolkitSource.includes("SOCIAL_QUERY_PARAMS") ||
  socialToolkitSource.includes('path: "/assets/images/') ||
  !socialToolkitSource.includes("toGuideImageAssetHref(") ||
  !socialToolkitSource.includes("pickerLabel:") ||
  !sectionMarkupSource.includes("SOCIAL_APPROVED_ASSETS[assetId]") ||
  sectionMarkupSource.includes("socialApprovedAssetAgentQ") ||
  sectionMarkupSource.includes("socialApprovedAssetQuantumFlip") ||
  sectionMarkupSource.includes("socialApprovedAssetSignature") ||
  !sharedConfigSource.includes("localOrigin: toGuideOrigin(") ||
  !sharedConfigSource.includes("href: toGuideDownloadHref(") ||
  !sharedConfigSource.includes("toGuideImageAssetHref") ||
  i18nSource.includes("socialApprovedAssetAgentQ") ||
  i18nSource.includes("socialApprovedAssetQuantumFlip") ||
  i18nSource.includes("socialApprovedAssetSignature") ||
  !sectionMarkupSource.includes("SOCIAL_GUIDE_QUERY_PARAMS") ||
  socialToolkitSource.includes("http://localhost") ||
  !socialToolkitSource.includes("GUIDE_SERVER.localOrigin")
) {
  issues.push("Shared route and origin contracts are drifting away from centralized config helpers.");
}

if (
  !serverAppSource.includes("return Bun.file(resolveDownloadPath(id));") ||
  serverAppSource.includes("Bun.file(resolveDownloadPath(id)).arrayBuffer()")
) {
  issues.push("Download routes are no longer streaming native Bun.file responses from the shared download contract.");
}

if (
  !runtimeConfigSource.includes("GUIDE_DEV_BUILD_SCRIPTS") ||
  !runtimeConfigSource.includes("resolveGuidePaths") ||
  !runtimeConfigSource.includes("resolveGuideBrandFilePaths") ||
  !runtimeConfigSource.includes("resolveGuideFontFilePaths") ||
  !runtimeConfigSource.includes("resolveGuidePublicAssetSourcePath") ||
  !runtimeConfigSource.includes("resolveGuidePublicDirectories") ||
  !runtimeConfigSource.includes("resolveGuidePublicFiles") ||
  !runtimeConfigSource.includes("GUIDE_SOCIAL_BUILD_INPUT_FILES") ||
  !runtimeConfigSource.includes("resolveGuideSocialBuildInputFiles") ||
  !runtimeConfigSource.includes("resolveGuideFullBuildTriggerPaths") ||
  !runtimeConfigSource.includes("resolveGuideDevBuildTarget") ||
  !runtimeConfigSource.includes("resolveGuideBuildCommand") ||
  !runtimeConfigSource.includes("resolveGuideServerCommand") ||
  !runtimeConfigSource.includes("resolveGuideStylesheetBuildCommand") ||
  !runtimeConfigSource.includes("GUIDE_SERVER_ENTRYPOINT_FILES") ||
  !bootSource.includes("GUIDE_SERVER_BOOT_OPTIONS") ||
  !bootSource.includes("bootGuideServer") ||
  !devSource.includes("resolveGuideDevBuildTarget") ||
  !devSource.includes("resolveGuideBuildCommand") ||
  !devSource.includes("resolveGuideServerCommand") ||
  !indexSource.includes('bootGuideServer("dev")') ||
  !serveSource.includes('bootGuideServer("serve")') ||
  !buildSource.includes("resolveGuidePaths") ||
  !buildSource.includes("resolveGuidePublicAssetSourcePath") ||
  !buildSource.includes("resolveGuidePublicDirectories") ||
  !buildSource.includes("resolveGuidePublicFiles") ||
  !buildSource.includes("GUIDE_SOCIAL_BUILD_INPUT_FILES") ||
  !buildSource.includes("resolveGuideStylesheetBuildCommand") ||
  buildSource.includes("GUIDE_FONT_FILE_PATHS") ||
  buildSource.includes("path.slice(1)") ||
  buildSource.includes("toStagingPath")
) {
  issues.push("Build orchestration is drifting away from the shared path and rebuild contracts.");
}

if (
  !generatedContentSource.includes("navigation.generated.ts") ||
  !generatedContentSource.includes("sections.generated.ts") ||
  navigationSource.includes("navigation.generated.ts") ||
  sectionSource.includes("sections.generated.ts") ||
  !navigationSource.includes('from "./generated"') ||
  !sectionSource.includes('from "./generated"')
) {
  issues.push("Generated content imports are drifting away from the shared server content module.");
}

authoringInlineScripts.forEach((scriptBody, index) => {
  if (scriptBody.includes(REPOSITORY_POLICY_TOKENS.console)) {
    issues.push(`Console logging is still present in index.html inline script #${index + 1}.`);
  }

  if (/\btry\s*\{/.test(scriptBody)) {
    issues.push(`Try/catch usage is still present in index.html inline script #${index + 1}.`);
  }
});

if (issues.length > 0) {
  issues.forEach((issue) => {
    writeStructuredLog({
      component: "audit",
      level: "ERROR",
      message: issue,
    });
  });
  process.exit(1);
}

writeStructuredLog({
  component: "audit",
  level: "INFO",
  message: "Brand guide audit passed",
  context: {
    checkedFiles: policyFiles.length,
    checkedSections: GUIDE_SECTION_IDS.length,
  },
});
process.exit(0);

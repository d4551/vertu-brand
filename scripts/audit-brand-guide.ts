#!/usr/bin/env bun

import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";

import { app } from "../src/server/app";
import { GUIDE_NAVIGATION } from "../src/server/content/navigation";
import { GUIDE_PATHS } from "../src/server/runtime-config";
import { GUIDE_ROUTES, HTMX_REQUEST_HEADERS, toGuideRequestUrl } from "../src/shared/config";
import { findInteractiveElementsMissingAriaLabels } from "../src/shared/markup";
import { GUIDE_DOM_IDS, GUIDE_HTMX, GUIDE_SELECTORS } from "../src/shared/shell-contract";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS } from "../src/shared/view-state";
import { renderSectionMarkup } from "../src/server/content/source";
import { writeStructuredLog } from "../src/shared/logger";

const auditRoot = GUIDE_PATHS.projectRoot;
const consoleToken = ["con", "sole."].join("");
const execCommandToken = ["exec", "Command("].join("");
const htmxExtensionToken = ["htmx", ".defineExtension("].join("");
const bunPluginToken = ["Bun", ".plugin("].join("");
const socialRouteLiteralPattern = /["'`]\/social(?:\/|\?)/;
const policyRoots = [
  join(auditRoot, "src"),
  join(auditRoot, "tests"),
  join(auditRoot, "scripts", "audit-brand-guide.ts"),
  join(auditRoot, "scripts", "build-app.ts"),
  join(auditRoot, "scripts", "generate-templates.mjs"),
];

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

const policyFiles = await collectFiles(policyRoots);
const policySources = await Promise.all(policyFiles.map(async (file) => [file, await Bun.file(file).text()] as const));

policySources.forEach(([file, source]) => {
  if (source.includes(consoleToken)) {
    issues.push(`Console logging is still present in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (/\btry\s*\{/.test(source)) {
    issues.push(`Try/catch usage is still present in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (source.includes(execCommandToken)) {
    issues.push(`document.execCommand fallback is still present in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (source.includes(htmxExtensionToken)) {
    issues.push(`Unexpected custom HTMX extension was introduced in ${file.replace(`${auditRoot}/`, "")}.`);
  }

  if (source.includes(bunPluginToken)) {
    issues.push(`Unexpected Bun plugin API usage was introduced in ${file.replace(`${auditRoot}/`, "")}.`);
  }
});

const authoringDocumentSource = await Bun.file(join(auditRoot, "index.html")).text();
const authoringInlineScripts = [...authoringDocumentSource.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(
  ([, scriptBody]) => scriptBody
);

const socialPluginSource = await Bun.file(join(auditRoot, "src", "server", "social-plugin.ts")).text();
const socialToolkitSource = await Bun.file(join(auditRoot, "src", "shared", "social-toolkit.ts")).text();
const sectionMarkupSource = await Bun.file(join(auditRoot, "src", "shared", "section-markup.ts")).text();
if (
  socialRouteLiteralPattern.test(socialPluginSource) ||
  socialRouteLiteralPattern.test(socialToolkitSource) ||
  !socialPluginSource.includes("SOCIAL_ROUTE_TEMPLATES") ||
  !socialPluginSource.includes("SOCIAL_QUERY_PARAMS") ||
  !socialToolkitSource.includes("GUIDE_ROUTES.socialAsset") ||
  !socialToolkitSource.includes("GUIDE_ROUTES.socialPack") ||
  !socialToolkitSource.includes("GUIDE_ROUTES.socialPreview") ||
  !socialToolkitSource.includes("SOCIAL_QUERY_PARAMS") ||
  !sectionMarkupSource.includes("SOCIAL_QUERY_PARAMS") ||
  socialToolkitSource.includes("http://localhost") ||
  !socialToolkitSource.includes("GUIDE_SERVER.localOrigin")
) {
  issues.push("Social endpoint contracts are drifting away from centralized shared route constants.");
}

authoringInlineScripts.forEach((scriptBody, index) => {
  if (scriptBody.includes(consoleToken)) {
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

async function collectFiles(entries: string[]): Promise<string[]> {
  const results: string[] = [];

  for (const entry of entries) {
    const stats = await lstat(entry);
    if (!stats.isDirectory()) {
      results.push(entry);
      continue;
    }

    const directoryEntries = await readdir(entry, { withFileTypes: true });
    const nestedFiles = await collectFiles(
      directoryEntries
        .filter((directoryEntry) => directoryEntry.name !== "vendor")
        .map((directoryEntry) => join(entry, directoryEntry.name))
    );
    results.push(...nestedFiles);
  }

  return results.filter((file) => /\.(?:js|mjs|ts)$/.test(file));
}

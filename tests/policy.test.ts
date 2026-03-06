import { describe, expect, test } from "bun:test";
import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";

import { GUIDE_PATHS } from "../src/server/runtime-config";
import { GUIDE_HTMX, GUIDE_SELECTORS } from "../src/shared/shell-contract";

const ROOT = GUIDE_PATHS.projectRoot;
const consoleToken = ["con", "sole."].join("");
const execCommandToken = ["exec", "Command("].join("");
const POLICY_ROOTS = [
  join(ROOT, "src"),
  join(ROOT, "tests"),
  join(ROOT, "scripts", "audit-brand-guide.ts"),
  join(ROOT, "scripts", "build-app.ts"),
  join(ROOT, "scripts", "generate-templates.mjs"),
];

describe("repository policy", () => {
  test("avoids console logging and try/catch blocks in maintained source", async () => {
    const files = await collectFiles(POLICY_ROOTS);
    const contents = await Promise.all(files.map(async (file) => [file, await Bun.file(file).text()] as const));

    contents.forEach(([file, source]) => {
      expect(source.includes(consoleToken)).toBe(false);
      expect(/\btry\s*\{/.test(source)).toBe(false);
      expect(source.includes(execCommandToken)).toBe(false);
    });
  });

  test("keeps the legacy download bootstrap free from console logging and try/catch blocks", async () => {
    const source = await Bun.file(join(ROOT, "index.html")).text();
    const inlineScripts = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(
      ([, scriptBody]) => scriptBody
    );

    inlineScripts.forEach((scriptBody) => {
      expect(scriptBody.includes(consoleToken)).toBe(false);
      expect(/\btry\s*\{/.test(scriptBody)).toBe(false);
    });
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
    const legacyGuideSource = await Bun.file(join(ROOT, "src", "shared", "legacy-guide.ts")).text();

    expect(legacyGuideSource.includes("new HTMLRewriter()")).toBe(true);
    expect(legacyGuideSource.includes("SECTION_BLOCK_PATTERN")).toBe(false);
    expect(legacyGuideSource.includes("SECTION_TITLE_PATTERN")).toBe(false);
    expect(legacyGuideSource.includes("extractGuideSections")).toBe(true);
  });

  test("uses the built Tailwind and daisyUI asset pipeline instead of browser-side utility generation", async () => {
    const serverRenderSource = await Bun.file(join(ROOT, "src", "server", "render", "layout.ts")).text();
    const sharedConfigSource = await Bun.file(join(ROOT, "src", "shared", "config.ts")).text();
    const legacyGuideSource = await Bun.file(join(ROOT, "index.html")).text();

    [
      "tailwindcss-playcdn",
      "styles/vendor/daisyui.css",
      "/styles/brand-guide.css",
      "/scripts/vendor/htmx.min.js",
      "/scripts/vendor/prism.min.js",
      "/styles/vendor/prism-tomorrow.min.css",
    ].forEach((legacyReference) => {
      expect(serverRenderSource.includes(legacyReference) || legacyGuideSource.includes(legacyReference)).toBe(false);
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

    expect(serverSource.includes("staticPlugin")).toBe(true);
    expect(serverSource.includes("nativeStaticResponse: true")).toBe(true);
    expect(serverSource.includes('get("/*"')).toBe(false);
    expect(serverSource.includes("process.cwd()")).toBe(false);
  });

  test("keeps HTMX shell selectors and request contracts centralized", async () => {
    const layoutSource = await Bun.file(join(ROOT, "src", "server", "render", "layout.ts")).text();
    const enhancementSource = await Bun.file(join(ROOT, "src", "client", "progressive-enhancements.ts")).text();

    expect(layoutSource.includes("GUIDE_DOM_IDS")).toBe(true);
    expect(layoutSource.includes("GUIDE_HTMX")).toBe(true);
    expect(layoutSource.includes('hx-target="${GUIDE_SELECTORS.page}"')).toBe(true);
    expect(layoutSource.includes('hx-sync="${GUIDE_SELECTORS.page}:replace"')).toBe(true);
    expect(layoutSource.includes('hx-sync="${GUIDE_SELECTORS.shell}:replace"')).toBe(true);
    expect(layoutSource.includes('hx-swap="${GUIDE_HTMX.shellSwapShowMain}"')).toBe(true);
    expect(enhancementSource.includes("GUIDE_DOM_IDS")).toBe(true);
    expect(enhancementSource.includes("GUIDE_SELECTORS")).toBe(true);
    expect(layoutSource.includes('hx-indicator="${GUIDE_HTMX.pageIndicator}"')).toBe(true);
    expect(layoutSource.includes('hx-indicator="${GUIDE_HTMX.shellIndicator}"')).toBe(true);
  });
});

const collectFiles = async (entries: string[]): Promise<string[]> => {
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
};

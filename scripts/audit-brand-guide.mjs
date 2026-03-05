#!/usr/bin/env bun

import { join } from "bun:path";

const root = import.meta.dir.replace(/\/scripts$/, "");
const HTML_FILE = join(root, "index.html");
const JS_FILE = join(root, "scripts/brand-guide.js");
const UNUSED_KEY_WARN_THRESHOLD = 10;

const html = await Bun.file(HTML_FILE).text();
const js = await Bun.file(JS_FILE).text();

const issues = [];
const warnings = [];

const collectMatches = (source, pattern, groupIndex = 1) => {
  const values = [];
  let match = pattern.exec(source);
  while (match) {
    values.push(match[groupIndex]);
    match = pattern.exec(source);
  }
  return values;
};

const htmlI18nKeys = collectMatches(html, /data-i18n-(?:aria|text|alt)="([^"]+)"/g);
const htmlI18nKeySet = new Set(htmlI18nKeys);

const uiSectionMatch = js.match(/ui:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*toast:/);
if (!uiSectionMatch) {
  issues.push("Unable to parse `APP_CONFIG.language.i18n.ui` section.");
}

const toastSectionMatch = js.match(/toast:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*\},\s*\n\s*\},\s*\n\s*(?:timing|files):/);
if (!toastSectionMatch) {
  issues.push("Unable to parse `APP_CONFIG.language.i18n.toast` section.");
}

const extractConfigKeys = (section) => collectMatches(section, /^\s*([A-Za-z0-9_]+):\s*\{\s*$/gm);

const uiKeys = uiSectionMatch ? extractConfigKeys(uiSectionMatch[1]) : [];
const toastKeys = toastSectionMatch ? extractConfigKeys(toastSectionMatch[1]) : [];
const uiKeySet = new Set(uiKeys);
const toastKeySet = new Set(toastKeys);

const missingUiKeys = [...htmlI18nKeySet].filter((key) => !uiKeySet.has(key));
if (missingUiKeys.length > 0) {
  issues.push(`Missing UI i18n keys for HTML references: ${missingUiKeys.join(", ")}`);
}

const unusedUiKeys = [...uiKeySet].filter((key) => !htmlI18nKeySet.has(key));
if (unusedUiKeys.length > UNUSED_KEY_WARN_THRESHOLD) {
  warnings.push(`Unused UI i18n keys exceed threshold (${UNUSED_KEY_WARN_THRESHOLD}): ${unusedUiKeys.length}`);
}

const toastUsageKeys = collectMatches(js, /getLocalizedMessage\("([^"]+)"/g);
const missingToastKeys = [...new Set(toastUsageKeys)].filter((key) => !toastKeySet.has(key));
if (missingToastKeys.length > 0) {
  issues.push(`Missing toast i18n keys used in JS: ${missingToastKeys.join(", ")}`);
}

const emptyAriaLabels = collectMatches(html, /aria-label="\s*"/g, 0);
if (emptyAriaLabels.length > 0) {
  issues.push("Found empty `aria-label` attributes.");
}

const idSet = new Set(collectMatches(html, /\sid="([^"]+)"/g));
const forRefs = collectMatches(html, /\sfor="([^"]+)"/g);
const ariaControlRefs = collectMatches(html, /\saria-controls="([^"]+)"/g).flatMap((value) =>
  value.split(/\s+/).filter(Boolean)
);

const missingForRefs = forRefs.filter((ref) => !idSet.has(ref));
if (missingForRefs.length > 0) {
  issues.push(`Missing IDs referenced by \`for\`: ${[...new Set(missingForRefs)].join(", ")}`);
}

const missingAriaControlRefs = ariaControlRefs.filter((ref) => !idSet.has(ref));
if (missingAriaControlRefs.length > 0) {
  issues.push(`Missing IDs referenced by \`aria-controls\`: ${[...new Set(missingAriaControlRefs)].join(", ")}`);
}

const copyKinds = new Set(collectMatches(html, /data-copy-kind="([^"]+)"/g));
const supportedCopyKinds = new Set(["color", "pantone"]);
const unknownCopyKinds = [...copyKinds].filter((kind) => !supportedCopyKinds.has(kind));
if (unknownCopyKinds.length > 0) {
  issues.push(`Unknown \`data-copy-kind\` values: ${unknownCopyKinds.join(", ")}`);
}

const missingCopyValues = collectMatches(
  html,
  /data-copy-kind="(?:color|pantone)"(?![^>]*data-copy-value="[^"]+")/g,
  0
);
if (missingCopyValues.length > 0) {
  issues.push("Found copy controls without `data-copy-value`.");
}

const executableExternalRefs = collectMatches(html, /<(?:script|img)\b[^>]*\s(?:src)=["'](https?:\/\/[^"']+)["']/gi);
if (executableExternalRefs.length > 0) {
  issues.push(`External executable/media URLs found: ${[...new Set(executableExternalRefs)].join(", ")}`);
}

const stylesheetExternalRefs = collectMatches(
  html,
  /<link\b[^>]*rel=["']stylesheet["'][^>]*\shref=["'](https?:\/\/[^"']+)["']/gi
);
if (stylesheetExternalRefs.length > 0) {
  issues.push(`External stylesheet URLs found: ${[...new Set(stylesheetExternalRefs)].join(", ")}`);
}

const anyExternalLinkRefs = collectMatches(html, /<link\b[^>]*\shref=["'](https?:\/\/[^"']+)["']/gi);
if (anyExternalLinkRefs.length > 0) {
  issues.push(`External link URLs found: ${[...new Set(anyExternalLinkRefs)].join(", ")}`);
}

const summaryPrefix = "[audit-brand-guide]";
if (issues.length > 0) {
  console.error(`${summaryPrefix} FAIL`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  for (const warning of warnings) {
    console.error(`- WARN: ${warning}`);
  }
  process.exit(1);
}

console.log(`${summaryPrefix} PASS`);
for (const warning of warnings) {
  console.log(`- WARN: ${warning}`);
}

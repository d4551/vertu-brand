import { GUIDE_ASSET_OPERATOR_IDS } from "./asset-operator-contract";
import { GUIDE_ROUTES } from "./config";
import { UI_COPY, renderLocalizedSpans, resolveCopy } from "./i18n";
import type { LocalizedCopy } from "./i18n";
import { stripMarkupText } from "./markup";
import { GUIDE_HTMX, GUIDE_SELECTORS } from "./shell-contract";
import {
  APPROVED_ASSET_IDS,
  SOCIAL_APPROVED_ASSETS,
  SOCIAL_GUIDE_QUERY_PARAMS,
  SOCIAL_PRESET_IDS,
  SOCIAL_PRESET_REGISTRY,
  resolveSectionSocialPreset,
  type SocialPresetId,
} from "./social-toolkit";
import { renderTemplateLibraryMarkup } from "./template-markup";
import type { GuideLanguage, GuideSectionId } from "./view-state";

/**
 * Typed registry of the canonical guide section markup.
 */
export type GuideSectionRegistry = ReadonlyMap<GuideSectionId, string>;

/**
 * Typed registry of localized guide section markup per supported language.
 */
export type GuideLocalizedSectionRegistry = ReadonlyMap<GuideLanguage, GuideSectionRegistry>;

/**
 * Generated navigation metadata derived from the authoring guide source.
 */
export interface GuideSectionMeta {
  id: GuideSectionId;
  index: string;
  title: LocalizedCopy;
}

/**
 * Normalizes and localizes a canonical section fragment for the target language.
 */
export const prepareSectionMarkup = (
  sourceMarkup: string,
  language: GuideLanguage,
  sectionId: GuideSectionId
): string => {
  let markup = sourceMarkup;
  markup = normalizeClassLists(markup);
  markup = annotateLocalizedContent(markup);
  markup = localizeTextTokens(markup, language);
  markup = localizeAttributeTokens(markup, language);
  markup = configureSocialToolkitForm(markup);
  markup = enhanceDownloadsSectionLayout(markup);
  markup = injectTemplateLibraryMarkup(markup, language);
  markup = localizeGeneratorControls(markup, language, sectionId);
  markup = localizeGeneratorPlaceholders(markup, language);
  markup = localizeCanvasLabels(markup, language);
  markup = localizeCopyTargetLabels(markup, language);
  markup = localizeControlAriaLabels(markup, language);
  markup = ensureContentAriaLabels(markup, language);

  return markup;
};

const normalizeClassLists = (markup: string): string =>
  markup.replace(/class="([^"]+)"/g, (_, classList: string) => {
    const cleaned = classList
      .split(/\s+/)
      .filter((token) => token && !/^reveal(?:-d\d+)?$/.test(token))
      .join(" ");

    return `class="${cleaned}"`;
  });

interface RewriterElementHandle {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}

const annotateLocalizedContent = (markup: string): string => {
  const appendClass = (element: RewriterElementHandle, className: string): void => {
    const currentClassName = element.getAttribute("class");
    const nextClassNames = new Set(
      String(currentClassName ?? "")
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean)
    );

    nextClassNames.add(className);
    element.setAttribute("class", [...nextClassNames].join(" "));
  };

  const rewriter = new HTMLRewriter()
    .on("[data-lang-en]", {
      element(element) {
        element.setAttribute("lang", "en");
        appendClass(element, "guide-copy-en");
      },
    })
    .on("[data-lang-cn]", {
      element(element) {
        element.setAttribute("lang", "zh-Hans");
        appendClass(element, "guide-copy-zh");
      },
    });

  return rewriter.transform(markup);
};

const localizeTextTokens = (markup: string, language: GuideLanguage): string => {
  return markup.replace(
    /(<([a-z][a-z0-9]*)\b[^>]+data-i18n-text="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (fullMatch, openTag: string, _tagName: string, key: string, _inner: string, closeTag: string) =>
      isUiCopyKey(key)
        ? `${openTag}${
            language === "bi"
              ? renderLocalizedSpans({
                  en: escapeHtml(resolveCopy(key, "en")),
                  zh: escapeHtml(resolveCopy(key, "zh")),
                })
              : escapeHtml(resolveCopy(key, language))
          }${closeTag}`
        : fullMatch
  );
};

const localizeCopyTargetLabels = (markup: string, language: GuideLanguage): string =>
  markup
    .replace(
      /<button([^>]*\bclass="[^"]*\bcolor-card\b[^"]*"[^>]*)data-copy-name="([^"]+)"([^>]*)data-copy-value="([^"]+)"([^>]*)>/g,
      (_fullMatch, beforeName: string, name: string, between: string, value: string, afterValue: string) =>
        upsertAriaLabel(
          `<button${beforeName}data-copy-name="${name}"${between}data-copy-value="${value}"${afterValue}>`,
          resolveCopy("copyColor", language, { name, value })
        )
    )
    .replace(
      /<button([^>]*\bclass="[^"]*\bpantone-chip\b[^"]*"[^>]*)data-copy-value="([^"]+)"([^>]*)>/g,
      (_fullMatch, beforeValue: string, value: string, afterValue: string) =>
        upsertAriaLabel(
          `<button${beforeValue}data-copy-value="${value}"${afterValue}>`,
          resolveCopy("copyPantone", language, { value })
        )
    );

const localizeAttributeTokens = (markup: string, language: GuideLanguage): string => {
  return markup
    .replace(/data-i18n-alt="([^"]+)" alt="[^"]*"/g, (fullMatch, key: string) =>
      isUiCopyKey(key) ? `data-i18n-alt="${key}" alt="${escapeAttribute(resolveCopy(key, language))}"` : fullMatch
    )
    .replace(/data-i18n-aria="([^"]+)" aria-label="[^"]*"/g, (fullMatch, key: string) =>
      isUiCopyKey(key)
        ? `data-i18n-aria="${key}" aria-label="${escapeAttribute(resolveCopy(key, language))}"`
        : fullMatch
    )
    .replace(/data-i18n-aria="([^"]+)"(?![^>]*aria-label=)/g, (fullMatch, key: string) =>
      isUiCopyKey(key)
        ? `data-i18n-aria="${key}" aria-label="${escapeAttribute(resolveCopy(key, language))}"`
        : fullMatch
    );
};

const configureSocialToolkitForm = (markup: string): string =>
  markup.replace(
    /<form\b[^>]*\bid="social-toolkit-form"[\s\S]*?>/,
    [
      `<form id="${GUIDE_ASSET_OPERATOR_IDS.socialForm}"`,
      `class="social-toolkit-controls"`,

      `action="${GUIDE_ROUTES.guide}"`,
      `method="get"`,
      `hx-get="${GUIDE_ROUTES.socialPreview}"`,
      `hx-indicator="${GUIDE_SELECTORS.requestIndicator}"`,
      `hx-disabled-elt="${GUIDE_HTMX.disabledFormElements}"`,
      `hx-swap="innerHTML"`,
      `hx-target="#${GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel}"`,
      `hx-trigger="submit"`,
      `hx-sync="this:replace"`,
      `>`,
    ].join(" ")
  );

const enhanceDownloadsSectionLayout = (markup: string): string =>
  markup
    .replace(
      /class="flex flex-col xl:flex-row gap-8 w-full"/g,
      'class="grid w-full items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"'
    )
    .replace(
      /class="flex flex-col xl:flex-row gap-8 w-full mb-8"/g,
      'class="mb-8 grid w-full items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"'
    )
    .replace(
      /class="flex flex-col gap-6 xl:flex-1 bg-base-200 p-6 rounded-xl border border-base-300"/g,
      'class="flex h-full flex-col gap-6 xl:flex-1 rounded-xl border border-base-300 bg-base-200 p-6 shadow-sm"'
    )
    .replace(
      /class="flex-1 flex flex-col items-center justify-center rounded-xl border overflow-hidden relative min-h-\[300px\] gen-preview-surface"/g,
      'class="asset-preview-panel relative flex h-full min-h-[300px] min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border bg-base-100/70 shadow-sm gen-preview-surface"'
    );

const injectTemplateLibraryMarkup = (markup: string, language: GuideLanguage): string => {
  const rewriter = new HTMLRewriter().on("[data-template-library-panel]", {
    element(element) {
      element.setInnerContent(renderTemplateLibraryMarkup(language), { html: true });
    },
  });

  return rewriter.transform(markup);
};

const localizeGeneratorControls = (markup: string, language: GuideLanguage, sectionId: GuideSectionId): string => {
  let result = markup;
  const defaultPresetId = resolveSectionSocialPreset(sectionId);
  const defaultPreset = SOCIAL_PRESET_REGISTRY[defaultPresetId];
  const presetOptionIds = SOCIAL_PRESET_IDS;
  const presetOptionCopyKeys = {
    "campaign-event": "socialPackEvent",
    "campaign-launch": "socialPackLaunch",
    "campaign-signature": "socialPackSignature",
  } as const satisfies Record<SocialPresetId, keyof typeof UI_COPY>;
  const defaultTheme = defaultPreset.defaultTheme;
  const defaultApprovedAssetId = defaultPreset.approvedAssetId;

  result = result.replace(
    new RegExp(`<select id="${GUIDE_ASSET_OPERATOR_IDS.logoVariant}"[\\s\\S]*?<\\/select>`),
    [
      `<select id="${GUIDE_ASSET_OPERATOR_IDS.logoVariant}" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("logoVariantLabel", language))}">`,
      `<option value="white">${escapeHtml(resolveCopy("genVariantWhite", language))}</option>`,
      `<option value="black">${escapeHtml(resolveCopy("genVariantBlack", language))}</option>`,
      `<option value="gold">${escapeHtml(resolveCopy("genVariantGold", language))}</option>`,
      "</select>",
    ].join("")
  );

  result = result.replace(
    new RegExp(`<select id="${GUIDE_ASSET_OPERATOR_IDS.socialPack}"[\\s\\S]*?<\\/select>`),
    [
      `<select id="${GUIDE_ASSET_OPERATOR_IDS.socialPack}" name="${SOCIAL_GUIDE_QUERY_PARAMS.pack}" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("socialPackLabel", language))}">`,
      ...presetOptionIds.map((presetId) => {
        const preset = SOCIAL_PRESET_REGISTRY[presetId];
        const isSelected = presetId === defaultPresetId ? ' selected="selected"' : "";
        return `<option value="${presetId}" data-asset-kinds="${escapeAttribute(preset.assetKinds.join(","))}" data-default-theme="${preset.defaultTheme}" data-default-approved-asset="${preset.approvedAssetId}"${isSelected}>${escapeHtml(
          resolveCopy(presetOptionCopyKeys[presetId], language)
        )}</option>`;
      }),
      "</select>",
    ].join("")
  );

  result = result.replace(
    new RegExp(`<select id="${GUIDE_ASSET_OPERATOR_IDS.socialAssetKind}"[\\s\\S]*?<\\/select>`),
    [
      `<select id="${GUIDE_ASSET_OPERATOR_IDS.socialAssetKind}" name="${SOCIAL_GUIDE_QUERY_PARAMS.asset}" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("socialAssetKindLabel", language))}">`,
      `<option value="og-card">${escapeHtml(resolveCopy("socialAssetKindOgCard", language))}</option>`,
      `<option value="ig-post">${escapeHtml(resolveCopy("socialAssetKindIgPost", language))}</option>`,
      `<option value="ig-story">${escapeHtml(resolveCopy("socialAssetKindIgStory", language))}</option>`,
      `<option value="linkedin-post">${escapeHtml(resolveCopy("socialAssetKindLinkedin", language))}</option>`,
      `<option value="x-header">${escapeHtml(resolveCopy("socialAssetKindXHeader", language))}</option>`,
      `<option value="docs-header">${escapeHtml(resolveCopy("socialAssetKindDocsHeader", language))}</option>`,
      `<option value="announcement-card">${escapeHtml(resolveCopy("socialAssetKindAnnouncement", language))}</option>`,
      `<option value="quote-card">${escapeHtml(resolveCopy("socialAssetKindQuote", language))}</option>`,
      `<option value="event-invite">${escapeHtml(resolveCopy("socialAssetKindEventInvite", language))}</option>`,
      "</select>",
    ].join("")
  );

  result = result.replace(
    new RegExp(`<select id="${GUIDE_ASSET_OPERATOR_IDS.socialApprovedAsset}"[\\s\\S]*?<\\/select>`),
    [
      `<select id="${GUIDE_ASSET_OPERATOR_IDS.socialApprovedAsset}" name="${SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset}" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("socialApprovedAssetLabel", language))}">`,
      ...APPROVED_ASSET_IDS.map((assetId) => {
        const asset = SOCIAL_APPROVED_ASSETS[assetId];
        const optionLabel =
          language === "zh"
            ? asset.pickerLabel.zh
            : language === "bi"
              ? `${asset.pickerLabel.en} · ${asset.pickerLabel.zh}`
              : asset.pickerLabel.en;
        return `<option value="${assetId}"${
          defaultApprovedAssetId === assetId ? ' selected="selected"' : ""
        }>${escapeHtml(optionLabel)}</option>`;
      }),
      "</select>",
    ].join("")
  );

  result = result.replace(
    new RegExp(`<select id="${GUIDE_ASSET_OPERATOR_IDS.socialTheme}"[\\s\\S]*?<\\/select>`),
    [
      `<select id="${GUIDE_ASSET_OPERATOR_IDS.socialTheme}" name="${SOCIAL_GUIDE_QUERY_PARAMS.theme}" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("socialThemeLabel", language))}">`,
      `<option value="dark"${defaultTheme === "dark" ? ' selected="selected"' : ""}>${escapeHtml(resolveCopy("socialThemeDark", language))}</option>`,
      `<option value="light"${defaultTheme === "light" ? ' selected="selected"' : ""}>${escapeHtml(resolveCopy("socialThemeLight", language))}</option>`,
      `<option value="gold"${defaultTheme === "gold" ? ' selected="selected"' : ""}>${escapeHtml(resolveCopy("socialThemeGold", language))}</option>`,
      "</select>",
    ].join("")
  );

  return result;
};

const localizeGeneratorPlaceholders = (markup: string, _language: GuideLanguage): string => markup;

const localizeCanvasLabels = (markup: string, _language: GuideLanguage): string =>
  markup.replace(
    new RegExp(`<div([^>]*\\bid="${GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel}"[^>]*)>`, "g"),
    (fullMatch, attributes: string) =>
      attributes.includes("aria-busy=") ? fullMatch : `<div${attributes} aria-busy="false">`
  );

const localizeControlAriaLabels = (markup: string, language: GuideLanguage): string => {
  let result = markup;

  const controlLabels = {
    [GUIDE_ASSET_OPERATOR_IDS.logoPadding]: resolveCopy("logoPaddingLabel", language),
    [GUIDE_ASSET_OPERATOR_IDS.logoTransparent]: resolveCopy("logoTransparentLabel", language),
    [GUIDE_ASSET_OPERATOR_IDS.socialApprovedAsset]: resolveCopy("socialApprovedAssetLabel", language),
    [GUIDE_ASSET_OPERATOR_IDS.socialAssetKind]: resolveCopy("socialAssetKindLabel", language),
    [GUIDE_ASSET_OPERATOR_IDS.socialPack]: resolveCopy("socialPackLabel", language),
    [GUIDE_ASSET_OPERATOR_IDS.socialTheme]: resolveCopy("socialThemeLabel", language),
    typeFont: resolveCopy("playgroundFontLabel", language),
    typeSize: resolveCopy("playgroundSizeLabel", language),
    typeTrack: resolveCopy("playgroundTrackingLabel", language),
    typeWeight: resolveCopy("playgroundWeightLabel", language),
  } satisfies Record<string, string>;

  Object.entries(controlLabels).forEach(([id, label]) => {
    result = addAriaLabelById(result, id, label);
  });

  return result;
};

const ensureContentAriaLabels = (markup: string, language: GuideLanguage): string =>
  markup.replace(
    /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g,
    (fullMatch, tagName: string, attributes: string, inner: string) => {
      if (attributes.includes("aria-label=") || attributes.includes("aria-labelledby=")) {
        return fullMatch;
      }

      const label = resolveVisibleLabel(inner, language);
      if (!label) {
        return fullMatch;
      }

      return `<${tagName}${attributes} aria-label="${escapeAttribute(label)}">${inner}</${tagName}>`;
    }
  );

const resolveVisibleLabel = (inner: string, language: GuideLanguage): string => {
  if (language === "bi") {
    const explicitEnglish = stripMarkupText(inner.replace(/<[^>]+data-lang-cn[^>]*>[\s\S]*?<\/[^>]+>/g, " "));
    if (explicitEnglish) {
      return explicitEnglish;
    }
  }

  return stripMarkupText(inner);
};

const addAriaLabelById = (markup: string, id: string, label: string): string =>
  markup.replace(new RegExp(`<([a-z]+)([^>]*\\bid="${id}"[^>]*)>`, "g"), (fullMatch) =>
    fullMatch.includes("aria-label=") || fullMatch.includes("aria-labelledby=")
      ? fullMatch
      : fullMatch.replace(/>$/, ` aria-label="${escapeAttribute(label)}">`)
  );

const upsertAriaLabel = (elementMarkup: string, label: string): string =>
  elementMarkup.includes('aria-label="')
    ? elementMarkup.replace(/aria-label="[^"]*"/, `aria-label="${escapeAttribute(label)}"`)
    : elementMarkup.replace(/>$/, ` aria-label="${escapeAttribute(label)}">`);

const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeHtml = (value: string): string => escapeAttribute(value).replaceAll("'", "&#39;");

const isUiCopyKey = (value: string): value is keyof typeof UI_COPY => Object.hasOwn(UI_COPY, value);

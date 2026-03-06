import { UI_COPY, resolveCopy } from "./i18n";
import type { LocalizedCopy } from "./i18n";
import { stripMarkupText } from "./markup";
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
export const prepareSectionMarkup = (sourceMarkup: string, language: GuideLanguage): string => {
  let markup = sourceMarkup;
  markup = normalizeClassLists(markup);
  markup = localizeTextTokens(markup, language);
  markup = localizeAttributeTokens(markup, language);
  markup = localizeGeneratorControls(markup, language);
  markup = localizeGeneratorPlaceholders(markup, language);
  markup = localizeCanvasLabels(markup, language);
  markup = localizeCopyTargetLabels(markup, language);
  markup = localizeControlAriaLabels(markup, language);
  markup = ensureContentAriaLabels(markup);

  return markup;
};

const normalizeClassLists = (markup: string): string =>
  markup.replace(/class="([^"]+)"/g, (_, classList: string) => {
    const cleaned = classList
      .split(/\s+/)
      .filter((token) => token && !/^reveal(?:-d\d+)?$/.test(token))
      .join(" ");

    return cleaned ? `class="${cleaned}"` : "";
  });

const localizeTextTokens = (markup: string, language: GuideLanguage): string => {
  return markup.replace(
    /(<[^>]+data-i18n-text="([^"]+)"[^>]*>)([\s\S]*?)(<\/[^>]+>)/g,
    (fullMatch, openTag: string, key: string, _inner: string, closeTag: string) =>
      isUiCopyKey(key) ? `${openTag}${escapeHtml(resolveCopy(key, language))}${closeTag}` : fullMatch
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
    .replace(/data-i18n-aria="([^"]+)"(?![^>]*aria-label=)/g, (fullMatch, key: string) =>
      isUiCopyKey(key)
        ? `data-i18n-aria="${key}" aria-label="${escapeAttribute(resolveCopy(key, language))}"`
        : fullMatch
    );
};

const localizeGeneratorControls = (markup: string, language: GuideLanguage): string => {
  let result = markup;

  result = result.replace(
    /<select id="gen-variant"[\s\S]*?<\/select>/,
    [
      `<select id="gen-variant" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("logoVariantLabel", language))}">`,
      `<option value="white">${escapeHtml(resolveCopy("genVariantWhite", language))}</option>`,
      `<option value="black">${escapeHtml(resolveCopy("genVariantBlack", language))}</option>`,
      `<option value="gold">${escapeHtml(resolveCopy("genVariantGold", language))}</option>`,
      "</select>",
    ].join("")
  );

  result = result.replace(
    /<select id="social-format"[\s\S]*?<\/select>/,
    [
      `<select id="social-format" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("socialFormatLabel", language))}">`,
      `<option value="ig-post">${escapeHtml(resolveCopy("socialFormatIgPost", language))}</option>`,
      `<option value="ig-story">${escapeHtml(resolveCopy("socialFormatIgStory", language))}</option>`,
      `<option value="linkedin">${escapeHtml(resolveCopy("socialFormatLinkedin", language))}</option>`,
      `<option value="x-header">${escapeHtml(resolveCopy("socialFormatXHeader", language))}</option>`,
      "</select>",
    ].join("")
  );

  result = result.replace(
    /<select id="social-theme"[\s\S]*?<\/select>/,
    [
      `<select id="social-theme" class="select select-bordered select-sm w-full bg-base-300 border-base-300 text-base-content" aria-label="${escapeAttribute(resolveCopy("socialThemeLabel", language))}">`,
      `<option value="dark">${escapeHtml(resolveCopy("socialThemeDark", language))}</option>`,
      `<option value="light">${escapeHtml(resolveCopy("socialThemeLight", language))}</option>`,
      `<option value="gold">${escapeHtml(resolveCopy("socialThemeGold", language))}</option>`,
      "</select>",
    ].join("")
  );

  return result;
};

const localizeGeneratorPlaceholders = (markup: string, language: GuideLanguage): string =>
  markup
    .replace(
      /id="social-headline"([^>]*)placeholder="[^"]*"/,
      `id="social-headline"$1placeholder="${escapeAttribute(resolveCopy("socialHeadlinePlaceholder", language))}" aria-label="${escapeAttribute(resolveCopy("socialHeadlineLabel", language))}"`
    )
    .replace(
      /id="social-subline"([^>]*)placeholder="[^"]*"/,
      `id="social-subline"$1placeholder="${escapeAttribute(resolveCopy("socialSublinePlaceholder", language))}" aria-label="${escapeAttribute(resolveCopy("socialSublineLabel", language))}"`
    );

const localizeCanvasLabels = (markup: string, language: GuideLanguage): string =>
  markup
    .replace(
      /aria-label="Logo generator preview"/g,
      `aria-label="${escapeAttribute(resolveCopy("logoGeneratorPreview", language))}"`
    )
    .replace(
      /aria-label="Social media template preview"/g,
      `aria-label="${escapeAttribute(resolveCopy("socialGeneratorPreview", language))}"`
    );

const localizeControlAriaLabels = (markup: string, language: GuideLanguage): string => {
  let result = markup;

  const controlLabels = {
    "gen-padding": resolveCopy("logoPaddingLabel", language),
    "gen-transparent": resolveCopy("logoTransparentLabel", language),
    "social-format": resolveCopy("socialFormatLabel", language),
    "social-headline": resolveCopy("socialHeadlineLabel", language),
    "social-subline": resolveCopy("socialSublineLabel", language),
    "social-theme": resolveCopy("socialThemeLabel", language),
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

const ensureContentAriaLabels = (markup: string): string =>
  markup.replace(
    /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g,
    (fullMatch, tagName: string, attributes: string, inner: string) => {
      if (attributes.includes("aria-label=") || attributes.includes("aria-labelledby=")) {
        return fullMatch;
      }

      const label = stripMarkupText(inner);
      if (!label) {
        return fullMatch;
      }

      return `<${tagName}${attributes} aria-label="${escapeAttribute(label)}">${inner}</${tagName}>`;
    }
  );

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

const isUiCopyKey = (value: string): value is keyof typeof UI_COPY =>
  Object.prototype.hasOwnProperty.call(UI_COPY, value);

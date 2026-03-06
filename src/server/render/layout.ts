import { GUIDE_BRAND_ASSETS, GUIDE_ROUTES, HTMX_CONFIG } from "../../shared/config";
import { GUIDE_HTMX, GUIDE_SELECTORS, GUIDE_DOM_IDS } from "../../shared/shell-contract";
import {
  renderLocalizedSpans,
  renderVisibleCopy,
  resolveCopy,
  resolveLocaleCopy,
  resolveToastCopy,
  type LocalizedCopy,
} from "../../shared/i18n";
import {
  nextGuideLanguage,
  nextGuideTheme,
  type GuideViewState,
} from "../../shared/view-state";
import {
  resolveGuideSocialQueryValues,
  resolveSectionSocialPreset,
  resolveSocialThemeFromGuideTheme,
  SOCIAL_PRESET_REGISTRY,
  toSocialGuideHref,
  toSocialAssetHref,
} from "../../shared/social-toolkit";
import { renderGuideSocialSectionMarkup, resolveGuideSocialPreviewRenderModel } from "../social-preview-markup";
import { GUIDE_NAVIGATION, type GuideNavigationItem } from "../content/navigation";
import { renderSectionMarkup } from "../content/source";

/**
 * Renders the full SSR document for direct navigation.
 */
export const renderDocument = (viewState: GuideViewState, requestOrigin: string, requestQuery: URLSearchParams): string => {
  const sectionTitle = GUIDE_NAVIGATION.find((item) => item.id === viewState.section)?.title[viewState.language === "zh" ? "zh" : "en"];
  const description =
    viewState.section === "s0"
      ? resolveCopy("guideDescription", viewState.language)
      : `${sectionTitle ?? resolveCopy("guideTitle", viewState.language)} · ${resolveCopy("guideDescription", viewState.language)}`;
  const htmxConfig = JSON.stringify(HTMX_CONFIG);
  const title =
    viewState.section === "s0"
      ? `${resolveCopy("guideDocumentTitle", viewState.language)} | ${resolveCopy("guideTitle", viewState.language)}`
      : `${sectionTitle ?? resolveCopy("guideDocumentTitle", viewState.language)} | ${resolveCopy("guideTitle", viewState.language)}`;
  const socialPreset = resolveSectionSocialPreset(viewState.section);
  const canonicalHref = resolveCanonicalGuideHref(viewState, requestOrigin, requestQuery);
  const socialImageHref = toSocialAssetHref(
    {
      approvedAssetId: SOCIAL_PRESET_REGISTRY[socialPreset].approvedAssetId,
      assetKind: "og-card",
      language: viewState.language,
      packId: socialPreset,
      presetId: socialPreset,
      section: viewState.section,
      theme: resolveSocialThemeFromGuideTheme(viewState.theme),
    },
    requestOrigin
  );

  return [
    "<!DOCTYPE html>",
    `<html lang="${resolveDocumentLanguageTag(viewState.language)}" data-theme="${viewState.theme}" data-lang="${viewState.language}">`,
    "<head>",
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <meta name="description" content="${escapeAttribute(description)}">`,
    `  <meta name="htmx-config" content="${escapeAttribute(htmxConfig)}">`,
    `  <meta property="og:url" content="${escapeAttribute(canonicalHref)}">`,
    `  <meta property="og:title" content="${escapeAttribute(title)}">`,
    `  <meta property="og:description" content="${escapeAttribute(description)}">`,
    '  <meta property="og:type" content="website">',
    `  <meta property="og:image" content="${escapeAttribute(socialImageHref)}">`,
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <meta name="twitter:image" content="${escapeAttribute(socialImageHref)}">`,
    `  <link rel="canonical" href="${escapeAttribute(canonicalHref)}">`,
    `  <title>${escapeHtml(title)}</title>`,
    `  <link href="${GUIDE_ROUTES.stylesheet}" rel="stylesheet">`,
    `  <script src="${GUIDE_ROUTES.clientScript}" type="module" defer></script>`,
    "</head>",
    '<body class="bg-base-100 text-base-content antialiased min-h-screen relative w-full overflow-x-hidden">',
    renderGuidePage(viewState, requestOrigin, requestQuery),
    "</body>",
    "</html>",
  ].join("\n");
};

/**
 * Renders the branded page wrapper for full-page HTMX swaps and direct SSR loads.
 */
export const renderGuidePage = (viewState: GuideViewState, requestOrigin: string, requestQuery: URLSearchParams): string => {
  const skipLabel = resolveCopy("skipToMainContent", viewState.language);

  return `
<div
  id="${GUIDE_DOM_IDS.page}"
  class="guide-page"
  hx-history-elt
  data-active-section="${viewState.section}"
  data-language="${viewState.language}"
  data-theme="${viewState.theme}"
  aria-busy="false"
>
  <a
    href="#${GUIDE_DOM_IDS.mainRegion}"
    aria-label="${escapeAttribute(skipLabel)}"
    class="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1200] focus:bg-primary focus:text-primary-content focus:font-semibold focus:px-4 focus:py-2 focus:rounded"
  >
    ${renderLocalizedSpans({
      en: resolveCopy("skipToMainContent", "en"),
      zh: resolveCopy("skipToMainContent", "zh"),
    })}
  </a>

  <div
    id="${GUIDE_DOM_IDS.scrollProgress}"
    class="guide-progress-bar fixed top-0 left-0 h-1 z-[1000] w-0 transition-all duration-150"
    aria-hidden="true"
  ></div>

  <div class="toast toast-end z-[2000] hidden" id="${GUIDE_DOM_IDS.toastContainer}" role="status" aria-live="polite" aria-atomic="true">
    <div class="alert alert-info">
      <span id="${GUIDE_DOM_IDS.toastMessage}"></span>
    </div>
  </div>

  <div
    id="${GUIDE_DOM_IDS.requestIndicator}"
    class="guide-request-indicator htmx-indicator"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <span class="loading loading-spinner loading-sm text-primary" aria-hidden="true"></span>
    <span>${renderLocalizedSpans({
      en: resolveCopy("guideLoadingState", "en"),
      zh: resolveCopy("guideLoadingState", "zh"),
    })}</span>
  </div>

  ${renderGuideCover(viewState)}
  ${renderGuideShell(viewState, requestOrigin, requestQuery)}
</div>`;
};

/**
 * Renders the HTMX swap target shell for section navigation.
 */
export const renderGuideShell = (
  viewState: GuideViewState,
  requestOrigin: string,
  requestQuery: URLSearchParams
): string => {
  return `
<div
  id="${GUIDE_DOM_IDS.shell}"
  class="drawer lg:drawer-open w-full guide-shell"
  data-active-section="${viewState.section}"
  data-language="${viewState.language}"
  data-theme="${viewState.theme}"
  aria-busy="false"
  data-copy-ready-label="${escapeAttribute(resolveCopy("copyReady", viewState.language))}"
  data-copy-done-label="${escapeAttribute(resolveCopy("copied", viewState.language))}"
  data-toast-asset-download="${escapeAttribute(resolveToastCopy("assetDownload", viewState.language))}"
  data-toast-asset-unavailable="${escapeAttribute(resolveToastCopy("assetUnavailable", viewState.language))}"
  data-toast-copy-code="${escapeAttribute(resolveToastCopy("copyCode", viewState.language))}"
  data-toast-copy-failed="${escapeAttribute(resolveToastCopy("copyFailed", viewState.language))}"
  data-toast-copy-hex="${escapeAttribute(resolveToastCopy("copyHex", viewState.language))}"
  data-toast-copy-pantone="${escapeAttribute(resolveToastCopy("copyPantone", viewState.language))}"
  data-toast-guide-download="${escapeAttribute(resolveToastCopy("guideDownload", viewState.language))}"
  data-toast-logo-contrast-invalid="${escapeAttribute(resolveToastCopy("logoContrastInvalid", viewState.language))}"
  data-toast-logo-download-failed="${escapeAttribute(resolveToastCopy("logoDownloadFailed", viewState.language))}"
  data-toast-logo-download-start="${escapeAttribute(resolveToastCopy("logoDownloadStart", viewState.language))}"
  data-toast-logo-generated="${escapeAttribute(resolveToastCopy("logoGenerated", viewState.language))}"
  data-toast-logo-source-unavailable="${escapeAttribute(resolveToastCopy("logoSourceUnavailable", viewState.language))}"
>
  <input id="${GUIDE_DOM_IDS.drawerControl}" type="checkbox" class="drawer-toggle" />

  <div class="drawer-content flex flex-col w-full relative" id="${GUIDE_DOM_IDS.mainContent}">
    <header class="navbar guide-topbar sticky top-0 z-50 lg:hidden">
      <div class="navbar-start min-w-0">
        <label
          id="${GUIDE_DOM_IDS.drawerOpenButton}"
          for="${GUIDE_DOM_IDS.drawerControl}"
          class="btn btn-square btn-ghost"
          aria-controls="${GUIDE_DOM_IDS.sidebarPanel}"
          aria-expanded="false"
          aria-label="${escapeAttribute(resolveCopy("openSidebar", viewState.language))}"
          role="button"
          tabindex="0"
        >
          <span class="sr-only">${escapeHtml(resolveCopy("openSidebar", viewState.language))}</span>
          ${renderMenuIcon()}
        </label>
        <a
          href="${GUIDE_SELECTORS.cover}"
          class="guide-brandmark"
          aria-label="${escapeAttribute(resolveCopy("guideHomeLabel", viewState.language))}"
        >VERTU</a>
      </div>
    </header>

    <main id="${GUIDE_DOM_IDS.mainRegion}" class="guide-main" tabindex="-1">
      ${
        viewState.error
          ? `<div role="alert" class="alert alert-warning guide-alert"><span>${escapeHtml(
              resolveCopy("invalidSectionMessage", viewState.language)
            )}</span></div>`
          : ""
      }

      <div id="${GUIDE_DOM_IDS.sectionPanel}" class="guide-stage">
        ${renderGuideSections(viewState, requestOrigin, requestQuery)}
      </div>
    </main>
  </div>

  <aside class="drawer-side z-50 lg:z-auto min-h-screen">
    <label
      id="${GUIDE_DOM_IDS.drawerOverlay}"
      for="${GUIDE_DOM_IDS.drawerControl}"
      class="drawer-overlay"
      aria-label="${escapeAttribute(resolveCopy("closeSidebar", viewState.language))}"
    ></label>
    <div id="${GUIDE_DOM_IDS.sidebarPanel}" class="guide-sidebar-panel">
      <div class="guide-sidebar-header">
        <div class="guide-sidebar-brand-row">
          <div class="guide-sidebar-brand">
            <a
              href="${GUIDE_SELECTORS.cover}"
              class="guide-sidebar-wordmark"
              aria-label="${escapeAttribute(resolveCopy("guideHomeLabel", viewState.language))}"
            >VERTU</a>
            <p class="guide-sidebar-title">${renderLocalizedSpans({
              en: resolveCopy("guideTitle", "en"),
              zh: resolveCopy("guideTitle", "zh"),
            })}</p>
          </div>
          <label
            id="${GUIDE_DOM_IDS.drawerCloseButton}"
            for="${GUIDE_DOM_IDS.drawerControl}"
            class="btn btn-sm btn-square btn-ghost lg:hidden"
            aria-controls="${GUIDE_DOM_IDS.sidebarPanel}"
            aria-expanded="false"
            aria-label="${escapeAttribute(resolveCopy("closeSidebar", viewState.language))}"
            role="button"
            tabindex="0"
          >
            <span class="sr-only">${escapeHtml(resolveCopy("closeSidebar", viewState.language))}</span>
            ${renderCloseIcon()}
          </label>
        </div>
        <p class="guide-sidebar-description">${renderLocalizedSpans({
          en: resolveCopy("guideDescription", "en"),
          zh: resolveCopy("guideDescription", "zh"),
        })}</p>
        ${renderSidebarControls(viewState, requestQuery)}
      </div>

      <nav
        id="${GUIDE_DOM_IDS.drawerNav}"
        class="guide-sidebar-nav"
        aria-label="${escapeAttribute(resolveCopy("sidebarNavigation", viewState.language))}"
      >
        <ul class="menu guide-nav-list">
          ${GUIDE_NAVIGATION.map((item) => renderNavigationItem(item, viewState)).join("")}
        </ul>
      </nav>
    </div>
  </aside>
</div>`;
};

const renderGuideCover = (viewState: GuideViewState): string => `
<header id="${GUIDE_DOM_IDS.cover}" class="cover hero guide-cover">
  <div class="cover-grain" aria-hidden="true"></div>
  <div class="cover-glow" aria-hidden="true"></div>
  <div class="hero-content guide-cover-content">
    <div class="guide-cover-body">
      <img
        class="cover-logo"
        src="${resolveCoverLogoPath(effectiveThemeForLogo(viewState.theme))}"
        alt=""
        aria-hidden="true"
        width="160"
        height="53"
      >
      <div class="cover-rule" aria-hidden="true"></div>
      <h1>${renderGuideCoverTitle()}</h1>
      <p class="cover-sub">${renderLocalizedSpans({
        en: resolveCopy("guideCoverSubtitle", "en"),
        zh: resolveCopy("guideCoverSubtitle", "zh"),
      })}</p>
      <div class="cover-meta">
        ${renderCoverMetaItem("guideCoverVersionLabel", "guideCoverVersionValue")}
        ${renderCoverMetaItem("guideCoverDateLabel", "guideCoverDateValue")}
        ${renderCoverMetaItem("guideCoverClassificationLabel", "guideCoverClassificationValue")}
      </div>
    </div>
  </div>
  <a
    id="${GUIDE_DOM_IDS.coverScroll}"
    href="#${GUIDE_DOM_IDS.mainRegion}"
    class="cover-scroll"
    aria-label="${escapeAttribute(resolveCopy("guideCoverScrollLabel", viewState.language))}"
  >
    <span>${renderLocalizedSpans({
      en: resolveCopy("guideCoverScrollPrompt", "en"),
      zh: resolveCopy("guideCoverScrollPrompt", "zh"),
    })}</span>
    <div class="cover-scroll-line" aria-hidden="true"></div>
  </a>
</header>`;

const ICON_MOON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="guide-theme-icon" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICON_SUN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="guide-theme-icon" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const ICON_SYSTEM =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="guide-theme-icon" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
const renderThemeIcon = (theme: GuideViewState["theme"]): string =>
  theme === "dark" ? ICON_MOON : theme === "light" ? ICON_SUN : ICON_SYSTEM;

const renderLanguageLabel = (lang: GuideViewState["language"], controlLocale: "en" | "zh"): string => {
  const key =
    lang === "en"
      ? "languageEnglishShort"
      : lang === "zh"
        ? "languageChineseShort"
        : "languageBilingualShort";
  return escapeHtml(resolveLocaleCopy(key, controlLocale));
};

const renderSidebarControls = (viewState: GuideViewState, requestQuery: URLSearchParams): string => {
  const socialQuery = resolveGuideSocialQueryValues(requestQuery);
  const controlLocale = viewState.language === "zh" ? "zh" : "en";
  const nextTheme = nextGuideTheme(viewState.theme);
  const nextLang = nextGuideLanguage(viewState.language);

  const themeCycleHref = toSocialGuideHref({
    approvedAssetId: socialQuery.approvedAssetId,
    assetKind: socialQuery.assetKind,
    guideTheme: nextTheme,
    language: viewState.language,
    packId: socialQuery.packId,
    section: viewState.section,
    socialTheme: socialQuery.socialTheme,
  });
  const themeAriaLabel =
    resolveCopy("toggleThemeTo", viewState.language, {
      value:
        nextTheme === "dark"
          ? resolveCopy("themeDark", viewState.language)
          : nextTheme === "light"
            ? resolveCopy("themeLight", viewState.language)
            : resolveCopy("themeSystem", viewState.language),
    });

  const langCycleHref = toSocialGuideHref({
    approvedAssetId: socialQuery.approvedAssetId,
    assetKind: socialQuery.assetKind,
    guideTheme: viewState.theme,
    language: nextLang,
    packId: socialQuery.packId,
    section: viewState.section,
    socialTheme: socialQuery.socialTheme,
  });
  const langAriaLabel =
    resolveCopy("toggleLanguageTo", viewState.language, {
      value:
        nextLang === "en"
          ? resolveCopy("languageEnglish", viewState.language)
          : nextLang === "zh"
            ? resolveCopy("languageChinese", viewState.language)
            : resolveCopy("languageBilingual", viewState.language),
    });

  return `
  <div class="guide-sidebar-controls">
    <div class="guide-control-field">
      <p class="guide-control-label">${renderVisibleCopy("themeLabel", viewState.language)}</p>
      <div class="guide-control-group guide-theme-group guide-theme-cycle" role="group" aria-label="${escapeAttribute(resolveCopy("toggleTheme", viewState.language))}">
        <a
          href="${themeCycleHref}"
          class="btn btn-sm guide-control-btn guide-theme-cycle"
          data-guide-theme="${viewState.theme}"
          aria-label="${escapeAttribute(themeAriaLabel)}"
          hx-get="${themeCycleHref}"
          hx-target="${GUIDE_SELECTORS.page}"
          hx-swap="${GUIDE_HTMX.pageSwap}"
          hx-indicator="${GUIDE_HTMX.pageIndicator}"
          hx-push-url="true"
          hx-sync="${GUIDE_SELECTORS.page}:replace"
        ><span class="guide-theme-icons">${renderThemeIcon(viewState.theme)}</span></a>
      </div>
    </div>
    <div class="guide-control-field">
      <p class="guide-control-label">${renderVisibleCopy("languageLabel", viewState.language)}</p>
      <div class="guide-control-group guide-lang-group guide-lang-cycle" role="group" aria-label="${escapeAttribute(resolveCopy("languageSelectLabel", viewState.language))}">
        <a
          href="${langCycleHref}"
          class="btn btn-sm guide-control-btn guide-lang-cycle"
          data-guide-language="${viewState.language}"
          aria-label="${escapeAttribute(langAriaLabel)}"
          hx-get="${langCycleHref}"
          hx-target="${GUIDE_SELECTORS.page}"
          hx-swap="${GUIDE_HTMX.pageSwap}"
          hx-indicator="${GUIDE_HTMX.pageIndicator}"
          hx-push-url="true"
          hx-sync="${GUIDE_SELECTORS.page}:replace"
        ><span class="guide-lang-label">${renderLanguageLabel(viewState.language, controlLocale)}</span></a>
      </div>
    </div>
  </div>`;
};

const renderNavigationItem = (item: GuideNavigationItem, viewState: GuideViewState): string => {
  const isActive = item.id === viewState.section;

  return `<li>
    <a
      href="#${item.id}"
      class="guide-nav-link ${isActive ? "menu-active" : ""}"
      data-guide-section-id="${item.id}"
      ${isActive ? 'aria-current="location"' : ""}
      aria-label="${escapeAttribute(inlineCopy(item.title, viewState.language))}"
    >
      <span class="guide-nav-index">${item.index}</span>
      <span class="guide-nav-copy">${renderLocalizedSpans(item.title)}</span>
    </a>
  </li>`;
};

const renderCoverMetaItem = (
  labelKey: "guideCoverVersionLabel" | "guideCoverDateLabel" | "guideCoverClassificationLabel",
  valueKey: "guideCoverVersionValue" | "guideCoverDateValue" | "guideCoverClassificationValue"
): string => `
<dl>
  <dt>${renderLocalizedSpans({
    en: resolveCopy(labelKey, "en"),
    zh: resolveCopy(labelKey, "zh"),
  })}</dt>
  <dd>${renderLocalizedSpans({
    en: resolveCopy(valueKey, "en"),
    zh: resolveCopy(valueKey, "zh"),
  })}</dd>
</dl>`;

const renderGuideSections = (viewState: GuideViewState, requestOrigin: string, requestQuery: URLSearchParams): string => {
  const socialPreviewModel = resolveGuideSocialPreviewRenderModel(
    requestQuery,
    viewState.language,
    viewState.section,
    requestOrigin
  );

  return GUIDE_NAVIGATION.map((item) => {
    const sectionMarkup = renderSectionMarkup(item.id, viewState.language);
    if (item.id !== "s15") {
      return sectionMarkup;
    }

    return renderGuideSocialSectionMarkup(sectionMarkup, viewState.language, viewState.section, socialPreviewModel);
  }).join("\n");
};

const renderGuideCoverTitle = (): string =>
  `<span class="guide-cover-title-en" data-lang-en="">${escapeHtml(resolveCopy("guideCoverTitlePrefix", "en"))} <em>${escapeHtml(
    resolveCopy("guideCoverTitleAccent", "en")
  )}</em> ${escapeHtml(resolveCopy("guideCoverTitleSuffix", "en"))}</span><span class="guide-cover-title-zh" data-lang-cn="">${escapeHtml(
    resolveCopy("guideCoverTitlePrefix", "zh")
  )}<em>${escapeHtml(resolveCopy("guideCoverTitleAccent", "zh"))}</em>${escapeHtml(resolveCopy("guideCoverTitleSuffix", "zh"))}</span>`;

const inlineCopy = (copy: LocalizedCopy, language: GuideViewState["language"]): string =>
  language === "zh" ? copy.zh : language === "bi" ? `${copy.en} · ${copy.zh}` : copy.en;

const resolveDocumentLanguageTag = (language: GuideViewState["language"]): string =>
  language === "zh" ? "zh" : language === "bi" ? "mul" : "en";

const resolveCanonicalGuideHref = (
  viewState: GuideViewState,
  requestOrigin: string,
  requestQuery: URLSearchParams
): string => {
  const socialQuery = resolveGuideSocialQueryValues(requestQuery);

  return new URL(
    toSocialGuideHref({
      approvedAssetId: socialQuery.approvedAssetId,
      assetKind: socialQuery.assetKind,
      guideTheme: viewState.theme,
      language: viewState.language,
      packId: socialQuery.packId,
      section: viewState.section,
      socialTheme: socialQuery.socialTheme,
    }),
    requestOrigin
  ).toString();
};

const resolveCoverLogoPath = (theme: GuideViewState["theme"]): string =>
  theme === "light" ? GUIDE_BRAND_ASSETS.logoBlack : GUIDE_BRAND_ASSETS.logoWhite;

const effectiveThemeForLogo = (theme: GuideViewState["theme"]): "dark" | "light" =>
  theme === "light" ? "light" : "dark";

const renderMenuIcon = (): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';

const renderCloseIcon = (): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="inline-block h-5 w-5 fill-none stroke-current" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6L18 18M6 18L18 6"></path></svg>';

const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeHtml = (value: string): string => escapeAttribute(value).replaceAll("'", "&#39;");

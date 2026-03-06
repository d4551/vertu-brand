import { GUIDE_BRAND_ASSETS, GUIDE_ROUTES, HTMX_CONFIG } from "../../shared/config";
import { GUIDE_HTMX, GUIDE_SELECTORS, GUIDE_DOM_IDS } from "../../shared/shell-contract";
import { renderLocalizedSpans, resolveCopy, resolveToastCopy, type LocalizedCopy } from "../../shared/i18n";
import { toGuideHref, type GuideViewState } from "../../shared/view-state";
import { GUIDE_NAVIGATION, type GuideNavigationItem } from "../content/navigation";
import { renderSectionMarkup } from "../content/source";

/**
 * Renders the full SSR document for direct navigation.
 */
export const renderDocument = (viewState: GuideViewState): string => {
  const description = resolveCopy("guideDescription", viewState.language);
  const htmxConfig = JSON.stringify(HTMX_CONFIG);
  const title = `${resolveCopy("guideDocumentTitle", viewState.language)} | ${resolveCopy("guideTitle", viewState.language)}`;

  return [
    "<!DOCTYPE html>",
    `<html lang="${viewState.language === "zh" ? "zh" : "en"}" data-theme="${viewState.theme}" data-lang="${viewState.language}">`,
    "<head>",
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <meta name="description" content="${escapeAttribute(description)}">`,
    `  <meta name="htmx-config" content="${escapeAttribute(htmxConfig)}">`,
    `  <meta property="og:title" content="${escapeAttribute(title)}">`,
    `  <meta property="og:description" content="${escapeAttribute(description)}">`,
    '  <meta property="og:type" content="website">',
    `  <link rel="canonical" href="${GUIDE_ROUTES.guide}">`,
    `  <title>${escapeHtml(title)}</title>`,
    `  <link href="${GUIDE_ROUTES.stylesheet}" rel="stylesheet">`,
    `  <script src="${GUIDE_ROUTES.clientScript}" type="module" defer></script>`,
    "</head>",
    '<body class="bg-base-100 text-base-content antialiased min-h-screen relative w-full overflow-x-hidden">',
    renderGuidePage(viewState),
    "</body>",
    "</html>",
  ].join("\n");
};

/**
 * Renders the branded page wrapper for full-page HTMX swaps and direct SSR loads.
 */
export const renderGuidePage = (viewState: GuideViewState): string => {
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
  ${renderGuideShell(viewState)}
</div>`;
};

/**
 * Renders the HTMX swap target shell for section navigation.
 */
export const renderGuideShell = (viewState: GuideViewState): string => {
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
        <button
          id="${GUIDE_DOM_IDS.drawerOpenButton}"
          type="button"
          class="btn btn-square btn-ghost"
          aria-controls="${GUIDE_DOM_IDS.sidebarPanel}"
          aria-expanded="false"
          aria-label="${escapeAttribute(resolveCopy("openSidebar", viewState.language))}"
        >
          <span class="sr-only">${escapeHtml(resolveCopy("openSidebar", viewState.language))}</span>
          ${renderMenuIcon()}
        </button>
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
        ${renderSectionMarkup(viewState.section, viewState.language)}
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
          <button
            id="${GUIDE_DOM_IDS.drawerCloseButton}"
            type="button"
            class="btn btn-sm btn-square btn-ghost lg:hidden"
            aria-controls="${GUIDE_DOM_IDS.sidebarPanel}"
            aria-expanded="false"
            aria-label="${escapeAttribute(resolveCopy("closeSidebar", viewState.language))}"
          >
            <span class="sr-only">${escapeHtml(resolveCopy("closeSidebar", viewState.language))}</span>
            ${renderCloseIcon()}
          </button>
        </div>
        <p class="guide-sidebar-description">${renderLocalizedSpans({
          en: resolveCopy("guideDescription", "en"),
          zh: resolveCopy("guideDescription", "zh"),
        })}</p>
        ${renderSidebarControls(viewState)}
      </div>

      <nav
        id="${GUIDE_DOM_IDS.drawerNav}"
        class="guide-sidebar-nav"
        aria-label="${escapeAttribute(resolveCopy("sidebarNavigation", viewState.language))}"
        hx-boost="${GUIDE_HTMX.boostEnabled}"
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
        src="${resolveCoverLogoPath(viewState.theme)}"
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

const renderSidebarControls = (viewState: GuideViewState): string => {
  const nextTheme = viewState.theme === "dark" ? "light" : "dark";
  const themeHref = toGuideHref({ language: viewState.language, section: viewState.section, theme: nextTheme });
  const themeLabel = resolveCopy("toggleTheme", viewState.language);

  const langButtons = (["en", "zh", "bi"] as const).map((lang) => {
    const href = toGuideHref({ language: lang, section: viewState.section, theme: viewState.theme });
    const isActive = viewState.language === lang;
    const label = lang === "en" ? "🇬🇧" : lang === "zh" ? "🇨🇳" : "BI";
    const ariaLabel = lang === "en"
      ? resolveCopy("languageEnglish", viewState.language)
      : lang === "zh"
        ? resolveCopy("languageChinese", viewState.language)
        : resolveCopy("languageBilingual", viewState.language);

    return `<a
      href="${href}"
      class="btn btn-sm join-item guide-lang-btn${isActive ? " btn-active" : ""}"
      aria-label="${escapeAttribute(ariaLabel)}"
      ${isActive ? 'aria-current="true"' : ""}
      hx-get="${href}"
      hx-target="${GUIDE_SELECTORS.page}"
      hx-swap="${GUIDE_HTMX.pageSwap}"
      hx-indicator="${GUIDE_HTMX.pageIndicator}"
      hx-push-url="true"
      hx-sync="${GUIDE_SELECTORS.page}:replace"
    >${label}</a>`;
  }).join("");

  return `
  <div class="guide-sidebar-controls">
    <a
      href="${themeHref}"
      class="btn btn-sm btn-circle btn-ghost guide-theme-toggle"
      aria-label="${escapeAttribute(themeLabel)}"
      hx-get="${themeHref}"
      hx-target="${GUIDE_SELECTORS.page}"
      hx-swap="${GUIDE_HTMX.pageSwap}"
      hx-indicator="${GUIDE_HTMX.pageIndicator}"
      hx-push-url="true"
      hx-sync="${GUIDE_SELECTORS.page}:replace"
    >
      ${viewState.theme === "dark" ? renderSunIcon() : renderMoonIcon()}
    </a>
    <div class="join guide-lang-group">
      ${langButtons}
    </div>
  </div>`;
};

const renderNavigationItem = (item: GuideNavigationItem, viewState: GuideViewState): string => {
  const isActive = item.id === viewState.section;
  const href = toGuideHref({
    language: viewState.language,
    section: item.id,
    theme: viewState.theme,
  });

  return `<li>
    <a
      href="${href}"
      class="guide-nav-link ${isActive ? "menu-active" : ""}"
      ${isActive ? 'aria-current="page"' : ""}
      aria-label="${escapeAttribute(inlineCopy(item.title, viewState.language))}"
      hx-indicator="${GUIDE_HTMX.shellIndicator}"
      hx-target="${GUIDE_SELECTORS.shell}"
      hx-swap="${GUIDE_HTMX.shellSwapShowMain}"
      hx-sync="${GUIDE_SELECTORS.shell}:replace"
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

const renderGuideCoverTitle = (): string =>
  `<span class="guide-cover-title-en" data-lang-en="">${escapeHtml(resolveCopy("guideCoverTitlePrefix", "en"))} <em>${escapeHtml(
    resolveCopy("guideCoverTitleAccent", "en")
  )}</em> ${escapeHtml(resolveCopy("guideCoverTitleSuffix", "en"))}</span><span class="guide-cover-title-zh" data-lang-cn="">${escapeHtml(
    resolveCopy("guideCoverTitlePrefix", "zh")
  )}<em>${escapeHtml(resolveCopy("guideCoverTitleAccent", "zh"))}</em>${escapeHtml(resolveCopy("guideCoverTitleSuffix", "zh"))}</span>`;

const renderSunIcon = (): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"></path></svg>';

const renderMoonIcon = (): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"></path></svg>';

const inlineCopy = (copy: LocalizedCopy, language: GuideViewState["language"]): string =>
  language === "zh" ? copy.zh : language === "bi" ? `${copy.en} · ${copy.zh}` : copy.en;

const resolveCoverLogoPath = (theme: GuideViewState["theme"]): string =>
  theme === "light" ? GUIDE_BRAND_ASSETS.logoBlack : GUIDE_BRAND_ASSETS.logoWhite;

const renderMenuIcon = (): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';

const renderCloseIcon = (): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="inline-block h-5 w-5 fill-none stroke-current" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6L18 18M6 18L18 6"></path></svg>';

const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeHtml = (value: string): string => escapeAttribute(value).replaceAll("'", "&#39;");

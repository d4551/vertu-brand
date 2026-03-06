import "htmx.org";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";

import { initializeLogoGenerator as initializeLogoGeneratorEnhancement } from "./logo-generator";
import { initializeSocialToolkit as initializeSocialToolkitEnhancement } from "./social-toolkit";
import { GUIDE_DOWNLOADS, type GuideDownloadId } from "../shared/config";
import { resolveScrollProgressPercent, resolveTypePlaygroundState } from "../shared/guide-interactions";
import { resolveGuideSocialQueryValues, toSocialGuideHref } from "../shared/social-toolkit";
import { GUIDE_DOM_IDS, GUIDE_SELECTORS } from "../shared/shell-contract";
import {
  isGuideSectionId,
  isGuideLanguage,
  normalizeGuideTheme,
  nextGuideTheme,
  nextGuideLanguage,
  type GuideSectionId,
} from "../shared/view-state";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let globalHandlersBound = false;
let toastTimer = 0;
let lastDrawerTrigger: HTMLElement | null = null;
let pendingViewportSyncFrame = 0;
let lastAnchoredViewKey = "";
const assetAvailabilityCache = new Map<string, Promise<boolean>>();

const isGuideDownloadId = (value: string): value is GuideDownloadId => value in GUIDE_DOWNLOADS;

const initializeGuide = (): void => {
  syncDocumentState();
  syncDrawerState();
  updateScrollProgress();
  alignViewToRequestedSection();
  syncActiveNavigation();
  initializeCodeHighlighting();
  initializeTypePlayground();
  initializeLogoGeneratorEnhancement({
    shellDataset,
    showToast,
    triggerDownload,
  });
  initializeSocialToolkitEnhancement({
    resolveGuidePage,
    resolveShell,
  });
};

const bindGlobalHandlers = (): void => {
  if (globalHandlersBound) {
    return;
  }

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("change", handleDocumentChange);
  document.addEventListener("keydown", handleDocumentKeydown);
  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("scroll", handleWindowScroll, { passive: true });
  window.addEventListener("popstate", handleHistoryChange);
  window.addEventListener("hashchange", handleHistoryChange);

  const colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  colorSchemeMedia.addEventListener("change", () => {
    const stateRoot = resolveGuidePage() || resolveShell();
    if (stateRoot?.dataset.theme === "system") {
      syncDocumentState();
    }
  });

  const body = document.body;
  if (body) {
    body.addEventListener("htmx:beforeRequest", handleBeforeRequest);
    body.addEventListener("htmx:afterRequest", handleAfterRequest);
    body.addEventListener("htmx:afterSwap", handleAfterSwap);
    body.addEventListener("htmx:historyRestore", handleHistoryRestore);
    body.addEventListener("htmx:responseError", handleAfterRequest);
    body.addEventListener("htmx:sendError", handleAfterRequest);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGuide, { once: true });
  } else {
    initializeGuide();
  }

  globalHandlersBound = true;
};

const handleDocumentClick = (event: Event): void => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const drawerOpenButton = target.closest<HTMLElement>(GUIDE_SELECTORS.drawerOpenButton);
  if (drawerOpenButton) {
    lastDrawerTrigger = drawerOpenButton;
    return;
  }

  const drawerCloseButton = target.closest<HTMLElement>(GUIDE_SELECTORS.drawerCloseButton);
  if (drawerCloseButton) {
    return;
  }

  const navigationLink = target.closest<HTMLAnchorElement>(".guide-nav-link[data-guide-section-id]");
  if (navigationLink) {
    const sectionId = navigationLink.dataset.guideSectionId;
    if (!sectionId || !isGuideSectionId(sectionId)) {
      return;
    }

    event.preventDefault();
    const nextSectionId: GuideSectionId = sectionId;
    syncActiveSectionState(nextSectionId, "push", true);
    if (isDrawerOpen()) {
      toggleDrawer(false, navigationLink);
    }
    focusMainRegion();
    return;
  }

  const colorCard = target.closest<HTMLElement>(".color-card");
  if (colorCard) {
    event.preventDefault();
    void handleCopy(colorCard.dataset.copyValue || colorCard.dataset.hex || "", "toastCopyHex");
    return;
  }

  const pantoneChip = target.closest<HTMLElement>(".pantone-chip");
  if (pantoneChip) {
    event.preventDefault();
    void handleCopy(pantoneChip.dataset.copyValue || "", "toastCopyPantone");
    return;
  }

  const codeCopyButton = target.closest<HTMLButtonElement>(".code-copy-btn");
  if (codeCopyButton) {
    event.preventDefault();
    const pre = codeCopyButton.closest(".mockup-code")?.querySelector("pre");
    void handleCodeCopy(codeCopyButton, pre?.innerText || pre?.textContent || "");
    return;
  }

  const downloadCard = target.closest<HTMLElement>(".download-card[id]");
  if (downloadCard && isGuideDownloadId(downloadCard.id)) {
    event.preventDefault();
    const download = GUIDE_DOWNLOADS[downloadCard.id];
    void probeAssetAvailability(download.href).then((isAvailable) => {
      if (!isAvailable) {
        showToast(shellDataset("toastAssetUnavailable"));
        return;
      }

      triggerDownload(download.href, download.fileName);
      const prefix = shellDataset(download.toastDatasetKey);
      showToast(prefix ? `${prefix}: ${download.fileName}` : download.fileName);
    });
  }
};

const handleDocumentChange = (event: Event): void => {
  const target = event.target;

  if (target instanceof HTMLInputElement && target.id === GUIDE_DOM_IDS.drawerControl) {
    syncDrawerState();
  }
};

const handleDocumentKeydown = (event: KeyboardEvent): void => {
  const drawerTrigger = event.target instanceof HTMLElement
    ? event.target.closest<HTMLElement>(`${GUIDE_SELECTORS.drawerOpenButton}, ${GUIDE_SELECTORS.drawerCloseButton}`)
    : null;

  if (drawerTrigger && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    drawerTrigger.click();
    return;
  }

  if (event.key === "Escape" && isDrawerOpen()) {
    toggleDrawer(false, lastDrawerTrigger);
    return;
  }

  if (event.key === "Tab" && isDrawerOpen()) {
    trapDrawerFocus(event);
  }
};

const handleWindowResize = (): void => {
  syncDrawerState();
  scheduleViewportSync();
};

const handleWindowScroll = (): void => {
  scheduleViewportSync();
};

const handleHistoryChange = (): void => {
  const hashSection = window.location.hash.replace(/^#/, "");
  if (window.location.hash && !isGuideSectionId(hashSection)) {
    syncActiveNavigation();
    return;
  }

  alignViewToRequestedSection();
  syncActiveNavigation();
};

const handleBeforeRequest = (event: Event): void => {
  if (isGuideTarget(event)) {
    setGuideBusyState(true);
  }
};

const handleAfterRequest = (event: Event): void => {
  if (isGuideTarget(event)) {
    setGuideBusyState(false);
  }
};

const handleAfterSwap = (event: Event): void => {
  setGuideBusyState(false);
  initializeGuide();

  const target = resolveHtmxTarget(event);
  if (target instanceof HTMLElement && (target.id === GUIDE_DOM_IDS.shell || target.id === GUIDE_DOM_IDS.page)) {
    focusMainRegion();
  }
};

const handleHistoryRestore = (): void => {
  setGuideBusyState(false);
  initializeGuide();
  focusMainRegion();
  syncActiveNavigation();
  scrollActiveNavigationIntoView();
};

const syncDocumentState = (): void => {
  const stateRoot = resolveGuidePage() || resolveShell();
  if (!stateRoot) {
    return;
  }

  const language = stateRoot.dataset.language || "bi";
  const theme = stateRoot.dataset.theme || "dark";

  document.documentElement.setAttribute("data-lang", language);
  const effectiveTheme =
    theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
  document.documentElement.setAttribute("data-theme", effectiveTheme);
  document.documentElement.lang = language === "zh" ? "zh" : "en";
};

const syncDrawerState = (): void => {
  const drawerCheckbox = document.getElementById(GUIDE_DOM_IDS.drawerControl);
  const mainContent = document.getElementById(GUIDE_DOM_IDS.mainContent);
  const isModal = window.innerWidth < 1024;
  if (!isModal && drawerCheckbox instanceof HTMLInputElement && drawerCheckbox.checked) {
    drawerCheckbox.checked = false;
  }

  const isOpen = isDrawerOpen();

  [
    document.getElementById(GUIDE_DOM_IDS.drawerOpenButton),
    document.getElementById(GUIDE_DOM_IDS.drawerCloseButton),
  ].forEach((element) => {
    if (element instanceof HTMLElement) {
      element.setAttribute("aria-expanded", String(isOpen));
    }
  });

  if (!(mainContent instanceof HTMLElement)) {
    return;
  }

  if ("inert" in mainContent) {
    Reflect.set(mainContent, "inert", isModal && isOpen);
  } else {
    setMainContentFocusable(mainContent, !(isModal && isOpen));
  }

  if (isOpen && drawerCheckbox instanceof HTMLInputElement) {
    const closeButton = document.getElementById(GUIDE_DOM_IDS.drawerCloseButton);
    if (closeButton instanceof HTMLElement) {
      closeButton.focus({ preventScroll: true });
    }
  }

  if (!isOpen && lastDrawerTrigger instanceof HTMLElement) {
    lastDrawerTrigger.focus({ preventScroll: true });
    lastDrawerTrigger = null;
  }
};

const trapDrawerFocus = (event: KeyboardEvent): void => {
  const sidebarPanel = document.getElementById(GUIDE_DOM_IDS.sidebarPanel);
  if (!(sidebarPanel instanceof HTMLElement)) {
    return;
  }

  const focusableElements = Array.from(sidebarPanel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden")
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);
  if (!(firstElement instanceof HTMLElement) || !(lastElement instanceof HTMLElement)) {
    return;
  }

  const activeElement = document.activeElement;
  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

const setMainContentFocusable = (container: HTMLElement, enabled: boolean): void => {
  container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((element) => {
    if (enabled) {
      const previousTabIndex = element.dataset.guideTabIndex;
      if (previousTabIndex === "") {
        element.removeAttribute("tabindex");
      } else if (previousTabIndex) {
        element.setAttribute("tabindex", previousTabIndex);
      }

      const previousAriaHidden = element.dataset.guideAriaHidden;
      if (previousAriaHidden === "null") {
        element.removeAttribute("aria-hidden");
      } else if (previousAriaHidden) {
        element.setAttribute("aria-hidden", previousAriaHidden);
      }

      delete element.dataset.guideTabIndex;
      delete element.dataset.guideAriaHidden;
      return;
    }

    if (!("guideTabIndex" in element.dataset)) {
      element.dataset.guideTabIndex = element.getAttribute("tabindex") ?? "";
      element.dataset.guideAriaHidden = element.getAttribute("aria-hidden") ?? "null";
    }

    element.setAttribute("tabindex", "-1");
    element.setAttribute("aria-hidden", "true");
  });
};

const toggleDrawer = (nextState: boolean, trigger: HTMLElement | null): void => {
  const drawerCheckbox = document.getElementById(GUIDE_DOM_IDS.drawerControl);

  if (!(drawerCheckbox instanceof HTMLInputElement)) {
    return;
  }

  drawerCheckbox.checked = nextState;
  lastDrawerTrigger = nextState ? trigger : lastDrawerTrigger;
  syncDrawerState();
};

const isDrawerOpen = (): boolean => {
  const drawerCheckbox = document.getElementById(GUIDE_DOM_IDS.drawerControl);
  return window.innerWidth < 1024 && drawerCheckbox instanceof HTMLInputElement && drawerCheckbox.checked;
};

const initializeCodeHighlighting = (): void => {
  Prism.highlightAllUnder(document.getElementById(GUIDE_DOM_IDS.sectionPanel) || document);
};

const initializeTypePlayground = (): void => {
  const preview = document.getElementById("typePreview");
  if (!(preview instanceof HTMLElement) || preview.dataset.enhanced === "true") {
    return;
  }

  const fontSelect = document.getElementById("typeFont");
  const sizeInput = document.getElementById("typeSize");
  const weightInput = document.getElementById("typeWeight");
  const trackingInput = document.getElementById("typeTrack");
  const sizeOutput = document.getElementById("typeSizeVal");
  const weightOutput = document.getElementById("typeWeightVal");
  const trackingOutput = document.getElementById("typeTrackVal");

  if (
    !(fontSelect instanceof HTMLSelectElement) ||
    !(sizeInput instanceof HTMLInputElement) ||
    !(weightInput instanceof HTMLInputElement) ||
    !(trackingInput instanceof HTMLInputElement) ||
    !(sizeOutput instanceof HTMLOutputElement) ||
    !(weightOutput instanceof HTMLOutputElement) ||
    !(trackingOutput instanceof HTMLOutputElement)
  ) {
    return;
  }

  preview.dataset.enhanced = "true";

  const applyTypeState = (): void => {
    const typeState = resolveTypePlaygroundState(
      fontSelect.value,
      sizeInput.value,
      weightInput.value,
      trackingInput.value
    );

    preview.className = `type-playground-preview ${typeState.previewClassName}`;
    preview.style.fontSize = `${typeState.fontSizePx}px`;
    preview.style.fontWeight = typeState.weightLabel;
    preview.style.letterSpacing = typeState.trackingLabel;
    setTextContent(sizeOutput, typeState.sizeLabel);
    setTextContent(weightOutput, typeState.weightLabel);
    setTextContent(trackingOutput, typeState.trackingLabel);
  };

  [fontSelect, sizeInput, weightInput, trackingInput].forEach((control) => {
    control.addEventListener("input", applyTypeState);
    control.addEventListener("change", applyTypeState);
  });

  applyTypeState();
};

const updateScrollProgress = (): void => {
  const progressBar = document.getElementById(GUIDE_DOM_IDS.scrollProgress);
  if (!(progressBar instanceof HTMLElement)) {
    return;
  }

  const percent = resolveScrollProgressPercent(
    window.scrollY,
    document.documentElement.scrollHeight,
    window.innerHeight
  );
  progressBar.style.width = `${percent}%`;
};

const scheduleViewportSync = (): void => {
  if (pendingViewportSyncFrame) {
    return;
  }

  pendingViewportSyncFrame = window.requestAnimationFrame(() => {
    pendingViewportSyncFrame = 0;
    updateScrollProgress();
    syncActiveNavigation();
  });
};

const focusMainRegion = (): void => {
  const mainRegion = document.getElementById(GUIDE_DOM_IDS.mainRegion);
  if (mainRegion instanceof HTMLElement) {
    mainRegion.focus({ preventScroll: true });
  }
};

const syncActiveNavigation = (): void => {
  const visibleSectionId = resolveVisibleSectionId();
  if (!visibleSectionId) {
    return;
  }

  syncActiveSectionState(visibleSectionId, "replace", false);
};

const scrollActiveNavigationIntoView = (): void => {
  const drawerNav = document.getElementById(GUIDE_DOM_IDS.drawerNav);
  const activeLink = drawerNav?.querySelector<HTMLElement>('[aria-current="location"]');

  if (!(drawerNav instanceof HTMLElement) || !(activeLink instanceof HTMLElement)) {
    return;
  }

  activeLink.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
};

const alignViewToRequestedSection = (): void => {
  const requestedSectionId = resolveRequestedSectionId();
  const page = resolveGuidePage();
  const shell = resolveShell();
  const viewKey = `${page?.dataset.language ?? shell?.dataset.language ?? "bi"}:${page?.dataset.theme ?? shell?.dataset.theme ?? "dark"}:${requestedSectionId}`;

  if (lastAnchoredViewKey === viewKey) {
    return;
  }

  lastAnchoredViewKey = viewKey;
  syncActiveSectionState(requestedSectionId, "replace", false);

  if (requestedSectionId === "s0") {
    window.scrollTo({ behavior: "auto", top: 0 });
    return;
  }

  const section = resolveGuideSection(requestedSectionId);
  if (section instanceof HTMLElement) {
    section.scrollIntoView({ behavior: "auto", block: "start" });
  }
};

const resolveRequestedSectionId = (): GuideSectionId => {
  const url = new URL(window.location.href);
  const hashSection = url.hash.replace(/^#/, "");
  if (isGuideSectionId(hashSection)) {
    return hashSection;
  }

  const querySection = url.searchParams.get("section");
  if (querySection && isGuideSectionId(querySection)) {
    const nextSectionId: GuideSectionId = querySection;
    return nextSectionId;
  }

  const stateSection = resolveGuidePage()?.dataset.activeSection ?? resolveShell()?.dataset.activeSection ?? "s0";
  return isGuideSectionId(stateSection) ? stateSection : "s0";
};

const resolveGuideSectionElements = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>(`#${GUIDE_DOM_IDS.sectionPanel} .guide-section[id]`));

const resolveGuideSection = (sectionId: GuideSectionId): HTMLElement | null =>
  resolveGuideSectionElements().find((section) => section.id === sectionId) ?? null;

const resolveVisibleSectionId = (): GuideSectionId | null => {
  const sections = resolveGuideSectionElements();
  if (sections.length === 0) {
    return null;
  }

  const focusLine = Math.min(window.innerHeight * 0.35, 320);
  let nearestSectionId = sections[0]?.id ?? "s0";
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= focusLine && rect.bottom >= focusLine && isGuideSectionId(section.id)) {
      return section.id;
    }

    const distance = Math.abs(rect.top - focusLine);
    if (distance < nearestDistance && isGuideSectionId(section.id)) {
      nearestDistance = distance;
      nearestSectionId = section.id;
    }
  }

  return isGuideSectionId(nearestSectionId) ? nearestSectionId : "s0";
};

const syncActiveSectionState = (sectionId: GuideSectionId, historyMode: "push" | "replace", shouldScroll: boolean): void => {
  [resolveGuidePage(), resolveShell()].forEach((root) => {
    if (root instanceof HTMLElement) {
      root.dataset.activeSection = sectionId;
    }
  });

  document.querySelectorAll<HTMLAnchorElement>(".guide-nav-link[data-guide-section-id]").forEach((link) => {
    const isActive = link.dataset.guideSectionId === sectionId;
    link.classList.toggle("menu-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  syncSidebarControlLinks(sectionId);
  scrollActiveNavigationIntoView();

  if (shouldScroll) {
    const section = resolveGuideSection(sectionId);
    if (section instanceof HTMLElement) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  syncSectionUrl(sectionId, historyMode);
};

const syncSidebarControlLinks = (sectionId: GuideSectionId): void => {
  const currentLanguage = resolveGuidePage()?.dataset.language ?? resolveShell()?.dataset.language ?? "bi";
  const currentTheme = resolveGuidePage()?.dataset.theme ?? resolveShell()?.dataset.theme ?? "dark";
  const url = new URL(window.location.href);
  const socialQuery = resolveGuideSocialQueryValues(url.searchParams);
  const language = isGuideLanguage(currentLanguage) ? currentLanguage : "bi";
  const theme = normalizeGuideTheme(currentTheme);

  const themeCycleBtn = document.querySelector<HTMLAnchorElement>(".guide-theme-cycle[data-guide-theme]");
  if (themeCycleBtn) {
    const currentTheme = themeCycleBtn.dataset.guideTheme;
    const nextTheme = currentTheme ? nextGuideTheme(normalizeGuideTheme(currentTheme)) : "light";
    const href = toSocialGuideHref({
      approvedAssetId: socialQuery.approvedAssetId,
      assetKind: socialQuery.assetKind,
      guideTheme: nextTheme,
      language,
      packId: socialQuery.packId,
      section: sectionId,
      socialTheme: socialQuery.socialTheme,
    });
    themeCycleBtn.href = href;
    themeCycleBtn.setAttribute("hx-get", href);
  }

  const langCycleBtn = document.querySelector<HTMLAnchorElement>(".guide-lang-cycle[data-guide-language]");
  if (langCycleBtn) {
    const currentLang = langCycleBtn.dataset.guideLanguage;
    const nextLang = currentLang && isGuideLanguage(currentLang) ? nextGuideLanguage(currentLang) : "zh";
    const href = toSocialGuideHref({
      approvedAssetId: socialQuery.approvedAssetId,
      assetKind: socialQuery.assetKind,
      guideTheme: theme,
      language: nextLang,
      packId: socialQuery.packId,
      section: sectionId,
      socialTheme: socialQuery.socialTheme,
    });
    langCycleBtn.href = href;
    langCycleBtn.setAttribute("hx-get", href);
  }
};

const syncSectionUrl = (sectionId: GuideSectionId, historyMode: "push" | "replace"): void => {
  const currentLanguage = resolveGuidePage()?.dataset.language ?? resolveShell()?.dataset.language ?? "bi";
  const currentTheme = resolveGuidePage()?.dataset.theme ?? resolveShell()?.dataset.theme ?? "dark";
  const currentUrl = new URL(window.location.href);
  const socialQuery = resolveGuideSocialQueryValues(currentUrl.searchParams);
  const language = isGuideLanguage(currentLanguage) ? currentLanguage : "bi";
  const theme = normalizeGuideTheme(currentTheme);
  const nextHref = toSocialGuideHref({
    approvedAssetId: socialQuery.approvedAssetId,
    assetKind: socialQuery.assetKind,
    guideTheme: theme,
    language,
    packId: socialQuery.packId,
    section: sectionId,
    socialTheme: socialQuery.socialTheme,
  });
  const url = new URL(nextHref, window.location.origin);

  if (window.location.pathname === url.pathname && window.location.search === url.search && window.location.hash === url.hash) {
    return;
  }

  const historyMethod = historyMode === "push" ? window.history.pushState : window.history.replaceState;
  historyMethod.call(window.history, window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
};

const setGuideBusyState = (busy: boolean): void => {
  [
    resolveGuidePage(),
    resolveShell(),
    document.getElementById(GUIDE_DOM_IDS.mainRegion),
    document.getElementById(GUIDE_DOM_IDS.sectionPanel),
  ].forEach((element) => {
    if (element instanceof HTMLElement) {
      element.setAttribute("aria-busy", String(busy));
    }
  });
};

const resolveHtmxTarget = (event: Event): HTMLElement | null => {
  if (!(event instanceof CustomEvent)) {
    return null;
  }

  const detail = Reflect.get(event, "detail");
  if (!detail || typeof detail !== "object") {
    return null;
  }

  const target = Reflect.get(detail, "target");
  return target instanceof HTMLElement ? target : null;
};

const isGuideTarget = (event: Event): boolean => {
  const targetId = resolveHtmxTarget(event)?.id;
  return targetId === GUIDE_DOM_IDS.page || targetId === GUIDE_DOM_IDS.shell;
};

const handleCopy = (text: string, toastKey: "toastCopyHex" | "toastCopyPantone"): Promise<void> =>
  copyToClipboard(text).then((didCopy) => {
    showToast(shellDataset(didCopy ? toastKey : "toastCopyFailed"));
  });

const handleCodeCopy = (button: HTMLButtonElement, text: string): Promise<void> =>
  copyToClipboard(text).then((didCopy) => {
    showToast(shellDataset(didCopy ? "toastCopyCode" : "toastCopyFailed"));
    const readyLabel = shellDataset("copyReadyLabel");
    const doneLabel = shellDataset("copyDoneLabel");

    if (!didCopy || !readyLabel || !doneLabel) {
      return;
    }

    button.textContent = doneLabel;
    window.setTimeout(() => {
      button.textContent = readyLabel;
    }, 1600);
  });

const copyToClipboard = (text: string): Promise<boolean> => {
  if (!text) {
    return Promise.resolve(false);
  }

  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function" || !window.isSecureContext) {
    return Promise.resolve(false);
  }

  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false
  );
};

const setTextContent = (element: HTMLElement, value: string): void => {
  element.textContent = value;
};

const probeAssetAvailability = (href: string): Promise<boolean> => {
  const cachedResponse = assetAvailabilityCache.get(href);
  if (cachedResponse) {
    return cachedResponse;
  }

  const request = fetch(href, { cache: "no-store", method: "HEAD" }).then(
    (response) => response.ok,
    () => false
  );
  const stableRequest = request.then((isAvailable) => {
    if (!isAvailable) {
      assetAvailabilityCache.delete(href);
    }

    return isAvailable;
  });

  assetAvailabilityCache.set(href, stableRequest);
  return stableRequest;
};

/**
 * Initiates a browser download by creating a temporary anchor element.
 * The anchor must be attached to the DOM for `.click()` to work across
 * all browsers — Safari silently ignores clicks on disconnected elements.
 */
const triggerDownload = (href: string, fileName: string): void => {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const showToast = (message: string): void => {
  const toastContainer = document.getElementById(GUIDE_DOM_IDS.toastContainer);
  const toastMessage = document.getElementById(GUIDE_DOM_IDS.toastMessage);

  if (!(toastContainer instanceof HTMLElement) || !(toastMessage instanceof HTMLElement) || !message) {
    return;
  }

  toastMessage.textContent = message;
  toastContainer.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastContainer.classList.add("hidden");
  }, 2200);
};

const resolveGuidePage = (): HTMLElement | null => document.getElementById(GUIDE_DOM_IDS.page);

const resolveShell = (): HTMLElement | null => document.getElementById(GUIDE_DOM_IDS.shell);

const shellDataset = (key: keyof DOMStringMap): string =>
  resolveShell()?.dataset[key] || resolveGuidePage()?.dataset[key] || "";

if (typeof document !== "undefined") {
  bindGlobalHandlers();
}

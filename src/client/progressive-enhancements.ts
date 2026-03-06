import "htmx.org";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";

import { GUIDE_DOWNLOADS, type GuideDownloadId } from "../shared/config";
import { resolveScrollProgressPercent, resolveTypePlaygroundState } from "../shared/guide-interactions";
import { GUIDE_DOM_IDS, GUIDE_SELECTORS } from "../shared/shell-contract";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const LOGO_DEFAULTS = {
  black: "#F2EDE5",
  gold: "#111111",
  white: "#080808",
} as const;

const LOGO_CONTRAST_POLICY = {
  black: { minBackgroundLuminance: 0.2 },
  gold: { maxBackgroundLuminance: 0.94 },
  white: { maxBackgroundLuminance: 0.82 },
} as const;

const SOCIAL_FORMATS = {
  "ig-post": { height: 1080, label: "Instagram-Post", width: 1080 },
  "ig-story": { height: 1920, label: "Instagram-Story", width: 1080 },
  linkedin: { height: 627, label: "LinkedIn-Post", width: 1200 },
  "x-header": { height: 500, label: "X-Header", width: 1500 },
} as const;

interface SocialTheme {
  background: string;
  headline: string;
  logo: HTMLImageElement | null;
  rule: string;
  subline: string;
}

interface SocialThemeLogos {
  black: HTMLImageElement | null;
  gold: HTMLImageElement | null;
  white: HTMLImageElement | null;
}

type SocialFormatKey = keyof typeof SOCIAL_FORMATS;
type SocialThemeKey = keyof ReturnType<typeof resolveSocialThemes>;

let globalHandlersBound = false;
let toastTimer = 0;
let lastDrawerTrigger: HTMLElement | null = null;
const assetAvailabilityCache = new Map<string, Promise<boolean>>();

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const isGuideDownloadId = (value: string): value is GuideDownloadId => value in GUIDE_DOWNLOADS;

const hasRecordKey = <Key extends string>(record: Record<Key, unknown>, value: string): value is Key =>
  Object.prototype.hasOwnProperty.call(record, value);

const resolveSocialFormatKey = (value: string): SocialFormatKey =>
  hasRecordKey(SOCIAL_FORMATS, value) ? value : "ig-post";

const resolveSocialThemeKey = (value: string, themes: Record<SocialThemeKey, SocialTheme>): SocialThemeKey =>
  hasRecordKey(themes, value) ? value : "dark";

const initializeGuide = (): void => {
  syncDocumentState();
  syncDrawerState();
  updateScrollProgress();
  syncActiveNavigation();
  initializeCodeHighlighting();
  initializeTypePlayground();
  initializeLogoGenerator();
  initializeSocialGenerator();
};

const bindGlobalHandlers = (): void => {
  if (globalHandlersBound) {
    return;
  }

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("change", handleDocumentChange);
  document.addEventListener("keydown", handleDocumentKeydown);
  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("scroll", updateScrollProgress, { passive: true });

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
    event.preventDefault();
    toggleDrawer(true, drawerOpenButton);
    return;
  }

  const drawerCloseButton = target.closest<HTMLElement>(GUIDE_SELECTORS.drawerCloseButton);
  if (drawerCloseButton) {
    event.preventDefault();
    toggleDrawer(false, drawerCloseButton);
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
  if (event.key === "Escape" && isDrawerOpen()) {
    toggleDrawer(false, lastDrawerTrigger);
  }
};

const handleWindowResize = (): void => {
  syncDrawerState();
  updateScrollProgress();
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
  if (target instanceof HTMLElement && target.id === GUIDE_DOM_IDS.shell) {
    focusMainRegion();
    scrollMainRegionIntoView();
  }
};

const handleHistoryRestore = (): void => {
  setGuideBusyState(false);
  initializeGuide();
  focusMainRegion();
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
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.lang = language === "zh" ? "zh" : "en";
};

const syncDrawerState = (): void => {
  const drawerCheckbox = document.getElementById(GUIDE_DOM_IDS.drawerControl);
  const mainContent = document.getElementById(GUIDE_DOM_IDS.mainContent);
  const isOpen = isDrawerOpen();
  const isModal = window.innerWidth < 1024;

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

const focusMainRegion = (): void => {
  const mainRegion = document.getElementById(GUIDE_DOM_IDS.mainRegion);
  if (mainRegion instanceof HTMLElement) {
    mainRegion.focus({ preventScroll: true });
  }
};

const scrollMainRegionIntoView = (): void => {
  const mainRegion = document.getElementById(GUIDE_DOM_IDS.mainRegion);
  if (mainRegion instanceof HTMLElement) {
    mainRegion.scrollIntoView({ block: "start" });
  }
};

const syncActiveNavigation = (): void => {
  window.requestAnimationFrame(() => {
    scrollActiveNavigationIntoView();
  });
};

const scrollActiveNavigationIntoView = (): void => {
  const drawerNav = document.getElementById(GUIDE_DOM_IDS.drawerNav);
  const activeLink = drawerNav?.querySelector<HTMLElement>('[aria-current="page"]');

  if (!(drawerNav instanceof HTMLElement) || !(activeLink instanceof HTMLElement)) {
    return;
  }

  activeLink.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
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

const initializeLogoGenerator = (): void => {
  const canvas = document.getElementById("gen-canvas");
  if (!(canvas instanceof HTMLCanvasElement) || canvas.dataset.enhanced === "true") {
    return;
  }

  const selectVariant = document.getElementById("gen-variant");
  const inputPadding = document.getElementById("gen-padding");
  const inputBgColor = document.getElementById("gen-bgcolor");
  const inputTransparent = document.getElementById("gen-transparent");
  const buttonDownload = document.getElementById("gen-download-btn");
  const feedback = document.getElementById("gen-contrast-feedback");
  const logoSources = {
    black: document.getElementById("src-logo-black"),
    gold: document.getElementById("src-logo-gold"),
    white: document.getElementById("src-logo-white"),
  } as const;

  if (
    !(selectVariant instanceof HTMLSelectElement) ||
    !(inputPadding instanceof HTMLInputElement) ||
    !(inputBgColor instanceof HTMLInputElement) ||
    !(inputTransparent instanceof HTMLInputElement) ||
    !(buttonDownload instanceof HTMLButtonElement) ||
    !(feedback instanceof HTMLElement)
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  canvas.dataset.enhanced = "true";
  inputBgColor.value = cssValue("--v-black", LOGO_DEFAULTS.white);

  const readVariant = (): keyof typeof logoSources =>
    selectVariant.value === "black" || selectVariant.value === "gold" ? selectVariant.value : "white";

  const readPadding = (): number => clamp(Number(inputPadding.value) || 40, 8, 300);

  const drawPreview = (): boolean => {
    const variant = readVariant();
    const source = logoSources[variant];
    const image = source instanceof HTMLImageElement ? source : null;
    const isTransparent = inputTransparent.checked;
    const background = inputBgColor.value || cssValue("--v-black", LOGO_DEFAULTS.white);

    if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) {
      feedback.textContent = shellDataset("toastLogoSourceUnavailable");
      return false;
    }

    const invalidContrast = !isTransparent && !passesContrastPolicy(variant, background);
    feedback.textContent = invalidContrast
      ? interpolateTemplate(shellDataset("toastLogoContrastInvalid"), { variant })
      : "";

    const targetWidth = 800;
    const padding = readPadding();
    const scale = (targetWidth - padding * 2) / image.naturalWidth;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const targetHeight = Math.max(1, Math.round(drawHeight + padding * 2));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    if (!isTransparent) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(image, padding, padding, drawWidth, drawHeight);
    return !invalidContrast;
  };

  const requestDownload = (): void => {
    const variant = readVariant();
    const okToExport = drawPreview();
    if (!okToExport && !inputTransparent.checked) {
      showToast(interpolateTemplate(shellDataset("toastLogoContrastInvalid"), { variant }));
      return;
    }

    if (!canvas.width || !canvas.height) {
      showToast(shellDataset("toastLogoDownloadFailed"));
      return;
    }

    showToast(shellDataset("toastLogoDownloadStart"));
    triggerDownload(
      canvas.toDataURL("image/png"),
      `VERTU-Logo-${variant}-${inputTransparent.checked ? "transparent" : "solid"}.png`
    );
    showToast(shellDataset("toastLogoGenerated"));
  };

  [selectVariant, inputPadding, inputBgColor, inputTransparent].forEach((element) => {
    element.addEventListener("input", drawPreview);
    element.addEventListener("change", drawPreview);
  });

  buttonDownload.addEventListener("click", requestDownload);
  Object.values(logoSources).forEach((source) => {
    if (source instanceof HTMLImageElement && !source.complete) {
      source.addEventListener("load", drawPreview);
    }
  });

  drawPreview();
};

const initializeSocialGenerator = (): void => {
  const canvas = document.getElementById("social-canvas");
  if (!(canvas instanceof HTMLCanvasElement) || canvas.dataset.enhanced === "true") {
    return;
  }

  const selectFormat = document.getElementById("social-format");
  const selectTheme = document.getElementById("social-theme");
  const inputHeadline = document.getElementById("social-headline");
  const inputSubline = document.getElementById("social-subline");
  const buttonDownload = document.getElementById("social-download-btn");
  const logoBlack = document.getElementById("src-logo-black");
  const logoWhite = document.getElementById("src-logo-white");
  const logoGold = document.getElementById("src-logo-gold");

  if (
    !(selectFormat instanceof HTMLSelectElement) ||
    !(selectTheme instanceof HTMLSelectElement) ||
    !(inputHeadline instanceof HTMLInputElement) ||
    !(inputSubline instanceof HTMLInputElement) ||
    !(buttonDownload instanceof HTMLButtonElement)
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const logos: SocialThemeLogos = {
    black: logoBlack instanceof HTMLImageElement ? logoBlack : null,
    gold: logoGold instanceof HTMLImageElement ? logoGold : null,
    white: logoWhite instanceof HTMLImageElement ? logoWhite : null,
  };

  canvas.dataset.enhanced = "true";

  const socialThemes = () => resolveSocialThemes(logos);

  const drawPreview = (): void => {
    const themes = socialThemes();
    const format = SOCIAL_FORMATS[resolveSocialFormatKey(selectFormat.value)];
    const theme = themes[resolveSocialThemeKey(selectTheme.value, themes)];
    const previewScale = Math.min(480 / format.width, 480 / format.height, 1);

    canvas.width = Math.round(format.width * previewScale);
    canvas.height = Math.round(format.height * previewScale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    renderSocialFrame(
      ctx,
      canvas.width,
      canvas.height,
      theme,
      inputHeadline.value.trim() || inputHeadline.placeholder,
      inputSubline.value.trim() || inputSubline.placeholder
    );
  };

  const requestDownload = (
    formatKey: keyof typeof SOCIAL_FORMATS,
    themeKey: keyof ReturnType<typeof socialThemes>
  ): void => {
    const format = SOCIAL_FORMATS[formatKey];
    const theme = socialThemes()[themeKey];
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = format.width;
    exportCanvas.height = format.height;
    const exportContext = exportCanvas.getContext("2d");

    if (!exportContext) {
      return;
    }

    renderSocialFrame(
      exportContext,
      format.width,
      format.height,
      theme,
      inputHeadline.value.trim() || inputHeadline.placeholder,
      inputSubline.value.trim() || inputSubline.placeholder
    );

    triggerDownload(exportCanvas.toDataURL("image/png"), `VERTU-Social-${format.label}-${themeKey}.png`);
  };

  [selectFormat, selectTheme, inputHeadline, inputSubline].forEach((element) => {
    element.addEventListener("input", drawPreview);
    element.addEventListener("change", drawPreview);
  });

  buttonDownload.addEventListener("click", () => {
    const themes = socialThemes();
    requestDownload(resolveSocialFormatKey(selectFormat.value), resolveSocialThemeKey(selectTheme.value, themes));
  });

  document.querySelectorAll<HTMLElement>(".social-preset-btn").forEach((button) => {
    if (button.dataset.enhanced === "true") {
      return;
    }

    button.dataset.enhanced = "true";
    button.addEventListener("click", () => {
      const themes = socialThemes();
      const formatKey = resolveSocialFormatKey(button.dataset.format || "");
      const themeKey = resolveSocialThemeKey(button.dataset.theme || "", themes);
      requestDownload(formatKey, themeKey);
    });
  });

  Object.values(logos).forEach((logo) => {
    if (logo && !logo.complete) {
      logo.addEventListener("load", drawPreview);
    }
  });

  drawPreview();
};

const renderSocialFrame = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: SocialTheme,
  headline: string,
  subline: string
): void => {
  context.clearRect(0, 0, width, height);
  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);

  const margin = Math.round(width * 0.09);
  const logoHeight = Math.round(height * 0.1);
  const logoY = Math.round(height * 0.3);

  if (theme.logo && theme.logo.complete && theme.logo.naturalWidth) {
    const logoWidth = Math.round(logoHeight * (theme.logo.naturalWidth / theme.logo.naturalHeight));
    context.drawImage(theme.logo, Math.round((width - logoWidth) / 2), logoY, logoWidth, logoHeight);
  }

  const ruleY = Math.round(logoY + logoHeight + height * 0.055);
  context.strokeStyle = theme.rule;
  context.lineWidth = Math.max(2, Math.round(height * 0.003));
  context.beginPath();
  context.moveTo(margin, ruleY);
  context.lineTo(width - margin, ruleY);
  context.stroke();

  context.fillStyle = theme.headline;
  context.font = `${Math.max(24, Math.round(height * 0.065))}px "Playfair Display", serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(headline, width / 2, ruleY + height * 0.04, width - margin * 2);

  context.fillStyle = theme.subline;
  context.font = `${Math.max(18, Math.round(height * 0.032))}px "IBM Plex Mono", monospace`;
  context.fillText(subline, width / 2, ruleY + height * 0.14, width - margin * 2);
};

const passesContrastPolicy = (variant: keyof typeof LOGO_CONTRAST_POLICY, hexColor: string): boolean => {
  const luminance = relativeLuminance(hexColor);
  const policy = LOGO_CONTRAST_POLICY[variant];

  if ("minBackgroundLuminance" in policy) {
    return luminance >= policy.minBackgroundLuminance;
  }

  return luminance <= policy.maxBackgroundLuminance;
};

const relativeLuminance = (hexColor: string): number => {
  const rgb = hexToRgb(hexColor);
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const hexToRgb = (hexColor: string): { b: number; g: number; r: number } => {
  const normalized = hexColor.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((channel) => `${channel}${channel}`)
          .join("")
      : normalized;

  return {
    b: Number.parseInt(value.slice(4, 6), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    r: Number.parseInt(value.slice(0, 2), 16),
  };
};

const cssValue = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

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

const interpolateTemplate = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);

const resolveSocialThemes = (logos: SocialThemeLogos): Record<"dark" | "gold" | "light", SocialTheme> => ({
  dark: {
    background: cssValue("--v-black", "#080808"),
    headline: cssValue("--v-cream", "#F2EDE5"),
    logo: logos.white,
    rule: cssValue("--v-gold", "#D4B978"),
    subline: cssValue("--v-titanium", "#B5AFA7"),
  },
  gold: {
    background: cssValue("--v-gold", "#D4B978"),
    headline: cssValue("--v-black", "#080808"),
    logo: logos.black,
    rule: cssValue("--v-black", "#080808"),
    subline: cssValue("--v-charcoal", "#111111"),
  },
  light: {
    background: cssValue("--v-ivory", "#FAF7F2"),
    headline: cssValue("--ink", "#1A1816"),
    logo: logos.black,
    rule: cssValue("--v-gold", "#D4B978"),
    subline: cssValue("--ink-soft", "#58534C"),
  },
});

if (typeof document !== "undefined") {
  bindGlobalHandlers();
}

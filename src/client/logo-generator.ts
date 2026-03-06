const LOGO_DEFAULTS = {
  black: "#F2EDE5",
  gold: "#111111",
  white: "#080808",
} as const;

const LOGO_CANVAS_LAYOUT = {
  maxDevicePixelRatio: 2,
  maxWidthPx: 1200,
  minWidthPx: 480,
  surfaceInsetPx: 32,
} as const;

const LOGO_CONTRAST_POLICY = {
  black: { minBackgroundLuminance: 0.2 },
  gold: { maxBackgroundLuminance: 0.94 },
  white: { maxBackgroundLuminance: 0.82 },
} as const;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const cssValue = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const interpolateTemplate = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);

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

/**
 * Runtime hooks required by the logo generator enhancement.
 */
export interface LogoGeneratorDependencies {
  shellDataset: (key: keyof DOMStringMap) => string;
  showToast: (message: string) => void;
  triggerDownload: (href: string, fileName: string) => void;
}

/**
 * Binds the canvas-based logo generator controls on the downloads section.
 */
export const initializeLogoGenerator = ({
  shellDataset,
  showToast,
  triggerDownload,
}: LogoGeneratorDependencies): void => {
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

  const resolveCanvasWidth = (): number => {
    const previewSurface = canvas.closest<HTMLElement>(".asset-preview-panel");
    const containerWidth = previewSurface?.clientWidth ?? canvas.parentElement?.clientWidth ?? canvas.clientWidth;
    const availableWidth = Math.max(containerWidth - LOGO_CANVAS_LAYOUT.surfaceInsetPx, LOGO_CANVAS_LAYOUT.minWidthPx);
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, LOGO_CANVAS_LAYOUT.maxDevicePixelRatio);

    return clamp(
      Math.round(availableWidth * devicePixelRatio),
      LOGO_CANVAS_LAYOUT.minWidthPx,
      LOGO_CANVAS_LAYOUT.maxWidthPx
    );
  };

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

    const targetWidth = resolveCanvasWidth();
    const padding = readPadding();
    const scale = (targetWidth - padding * 2) / image.naturalWidth;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const targetHeight = Math.max(1, Math.round(drawHeight + padding * 2));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = "100%";
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

  window.addEventListener("resize", drawPreview);

  buttonDownload.addEventListener("click", requestDownload);
  Object.values(logoSources).forEach((source) => {
    if (source instanceof HTMLImageElement && !source.complete) {
      source.addEventListener("load", drawPreview);
    }
  });

  drawPreview();
};

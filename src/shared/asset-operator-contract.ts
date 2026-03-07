/**
 * Stable DOM ids shared by the downloads/logo-generator/social-toolkit markup,
 * browser enhancements, and related tests.
 */
export const GUIDE_ASSET_OPERATOR_IDS = {
  logoBackgroundColor: "gen-bgcolor",
  logoCanvas: "gen-canvas",
  logoContrastFeedback: "gen-contrast-feedback",
  logoDownloadButton: "gen-download-btn",
  logoPadding: "gen-padding",
  logoSourceBlack: "src-logo-black",
  logoSourceGold: "src-logo-gold",
  logoSourceWhite: "src-logo-white",
  logoTransparent: "gen-transparent",
  logoVariant: "gen-variant",
  socialApprovedAsset: "social-approved-asset",
  socialAssetKind: "social-format",
  socialForm: "social-toolkit-form",
  socialHiddenLanguage: "social-language",
  socialHiddenSection: "social-section",
  socialPack: "social-pack",
  socialPreviewPanel: "social-preview-panel",
  socialTheme: "social-theme",
} as const;

/**
 * Stable class names shared by the downloads surface markup and browser-only enhancements.
 */
export const GUIDE_ASSET_OPERATOR_CLASS_NAMES = {
  logoPreviewSurface: "asset-preview-panel",
} as const;

/**
 * Stable selectors derived from the downloads-surface DOM contract.
 */
export const GUIDE_ASSET_OPERATOR_SELECTORS = {
  logoPreviewSurface: `.${GUIDE_ASSET_OPERATOR_CLASS_NAMES.logoPreviewSurface}`,
  socialPreviewPanel: `#${GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel}`,
} as const;

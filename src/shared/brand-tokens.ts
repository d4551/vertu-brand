/**
 * Stable brand identity metadata reused by server-owned template generation.
 */
export const GUIDE_BRAND_IDENTITY = {
  name: "VERTU",
} as const;

/**
 * Canonical brand color tokens shared by server-rendered surfaces and generated templates.
 */
export const GUIDE_BRAND_COLOR_TOKENS = {
  accentLight: "977D40",
  black: "080808",
  charcoal: "1A1816",
  cream: "F2EDE5",
  dark: "111111",
  gold: "D4B978",
  goldDeep: "C4A55E",
  inkMuted: "8E8880",
  inkOnGoldMuted: "3A342B",
  inkSoft: "58534C",
  ivory: "FAF7F2",
  titanium: "8A847C",
  titaniumLight: "B5AFA7",
  white: "FFFFFF",
} as const;

/**
 * Canonical premium font stack used by generated templates.
 */
export const GUIDE_BRAND_FONT_FAMILIES = {
  body: "DM Sans",
  display: "Instrument Serif",
  identity: "Playfair Display",
  mono: "IBM Plex Mono",
} as const;

/**
 * Safe system fallback fonts used when generated documents must avoid custom embeds.
 */
export const GUIDE_BRAND_SAFE_FONT_FAMILIES = {
  body: "Arial",
  display: "Times New Roman",
  identity: "Georgia",
  mono: "Courier New",
} as const;

/**
 * Supported social logo variants derived from the shared brand assets.
 */
export type GuideBrandLogoVariant = "black" | "white";

/**
 * Shared visual tokens for social asset themes.
 */
export const GUIDE_SOCIAL_THEME_TOKENS = {
  dark: {
    accent: GUIDE_BRAND_COLOR_TOKENS.gold,
    background: GUIDE_BRAND_COLOR_TOKENS.black,
    border: "rgba(212, 185, 120, 0.28)",
    card: "rgba(255, 255, 255, 0.06)",
    logoVariant: "white",
    muted: GUIDE_BRAND_COLOR_TOKENS.titaniumLight,
    text: GUIDE_BRAND_COLOR_TOKENS.cream,
  },
  gold: {
    accent: GUIDE_BRAND_COLOR_TOKENS.black,
    background: GUIDE_BRAND_COLOR_TOKENS.gold,
    border: "rgba(8, 8, 8, 0.18)",
    card: "rgba(255, 255, 255, 0.18)",
    logoVariant: "black",
    muted: GUIDE_BRAND_COLOR_TOKENS.inkOnGoldMuted,
    text: GUIDE_BRAND_COLOR_TOKENS.black,
  },
  light: {
    accent: GUIDE_BRAND_COLOR_TOKENS.gold,
    background: GUIDE_BRAND_COLOR_TOKENS.ivory,
    border: "rgba(17, 17, 17, 0.12)",
    card: "rgba(17, 17, 17, 0.04)",
    logoVariant: "black",
    muted: GUIDE_BRAND_COLOR_TOKENS.inkSoft,
    text: GUIDE_BRAND_COLOR_TOKENS.dark,
  },
} as const;

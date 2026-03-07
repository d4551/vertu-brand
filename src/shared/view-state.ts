/**
 * Supported guide languages.
 */
export const GUIDE_LANGUAGES = ["en", "zh", "bi"] as const;

/**
 * Supported guide languages.
 */
export type GuideLanguage = (typeof GUIDE_LANGUAGES)[number];

/**
 * Supported guide themes.
 */
export const GUIDE_THEMES = ["dark", "light", "system"] as const;

/**
 * Supported guide themes.
 */
export type GuideTheme = (typeof GUIDE_THEMES)[number];

/**
 * Canonical guide section identifiers.
 */
export const GUIDE_SECTION_IDS = [
  "s0",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "s12",
  "s13",
  "s14",
  "s15",
  "s16",
] as const;

const GUIDE_SECTION_ID_SET = new Set<string>(GUIDE_SECTION_IDS);
const GUIDE_LANGUAGE_SET = new Set<string>(GUIDE_LANGUAGES);

/**
 * Valid guide section identifier.
 */
export type GuideSectionId = (typeof GUIDE_SECTION_IDS)[number];

/**
 * Server error envelope for invalid view state.
 */
export interface GuideErrorEnvelope {
  code: "invalid_section";
  invalidSection: string;
}

/**
 * Normalized server-owned view state.
 */
export interface GuideViewState {
  error: GuideErrorEnvelope | null;
  language: GuideLanguage;
  section: GuideSectionId;
  theme: GuideTheme;
}

/**
 * Canonical guide state without error-envelope metadata.
 */
export interface GuideResolvedState {
  language: GuideLanguage;
  section: GuideSectionId;
  theme: GuideTheme;
}

/**
 * Raw guide state inputs resolved from URL parameters, DOM datasets, or form state.
 */
export interface GuideStateInput {
  language?: string | null;
  section?: string | null;
  theme?: string | null;
}

const LANGUAGE_ALIASES: Record<string, GuideLanguage> = {
  cn: "zh",
  chinese: "zh",
};

/**
 * Type guard for supported languages.
 */
export const isGuideLanguage = (value: string): value is GuideLanguage => GUIDE_LANGUAGE_SET.has(value);

/**
 * Type guard for section identifiers.
 */
export const isGuideSectionId = (value: string): value is GuideSectionId => GUIDE_SECTION_ID_SET.has(value);

/**
 * Normalizes the incoming language query value.
 */
export const normalizeGuideLanguage = (value: string | null): GuideLanguage => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  const normalized = LANGUAGE_ALIASES[raw] ?? raw;

  return isGuideLanguage(normalized) ? normalized : "bi";
};

/**
 * Normalizes the incoming theme query value.
 */
export const normalizeGuideTheme = (value: string | null): GuideTheme =>
  value === "light" ? "light" : value === "system" ? "system" : "dark";

/**
 * Next theme in cycle: dark → light → system → dark.
 */
export const nextGuideTheme = (current: GuideTheme): GuideTheme =>
  current === "dark" ? "light" : current === "light" ? "system" : "dark";

/**
 * Next language in cycle: en → zh → bi → en.
 */
export const nextGuideLanguage = (current: GuideLanguage): GuideLanguage =>
  current === "en" ? "zh" : current === "zh" ? "bi" : "en";

/**
 * Resolves a raw guide-state input into the canonical language, section, and theme.
 */
export const resolveGuideState = (input: GuideStateInput): GuideResolvedState => {
  const requestedSectionValue = String(input.section ?? "").trim();

  return {
    language: normalizeGuideLanguage(input.language ?? null),
    section: isGuideSectionId(requestedSectionValue) ? requestedSectionValue : "s0",
    theme: normalizeGuideTheme(input.theme ?? null),
  };
};

/**
 * Resolves the concrete locale key used for monolingual EN/ZH copy selection.
 */
export const resolveGuideLocale = (language: GuideLanguage): Extract<GuideLanguage, "en" | "zh"> =>
  language === "zh" ? "zh" : "en";

/**
 * Resolves the correct document language tag for the active guide language.
 */
export const resolveGuideDocumentLanguageTag = (language: GuideLanguage): "en" | "mul" | "zh" =>
  language === "bi" ? "mul" : resolveGuideLocale(language);

/**
 * Resolves a query string into the canonical guide view state.
 */
export const resolveGuideViewState = (url: URL): GuideViewState => {
  const requestedSection = url.searchParams.get("section");
  const state = resolveGuideState({
    language: url.searchParams.get("lang"),
    section: requestedSection,
    theme: url.searchParams.get("theme"),
  });

  return {
    error:
      requestedSection && !isGuideSectionId(requestedSection)
        ? {
            code: "invalid_section",
            invalidSection: requestedSection,
          }
        : null,
    language: state.language,
    section: state.section,
    theme: state.theme,
  };
};

/**
 * Builds a stable URL for SSR and HTMX navigation.
 */
export const toGuideHref = (state: Pick<GuideViewState, "language" | "section" | "theme">): string =>
  `/?section=${state.section}&lang=${state.language}&theme=${state.theme}`;

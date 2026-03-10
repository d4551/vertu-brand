import type { LocalizedCopy } from "./i18n";
import { GUIDE_ROUTES, GUIDE_SERVER, toGuideImageAssetHref } from "./config";
import {
  type GuideLanguage,
  type GuideSectionId,
  type GuideTheme,
  type GUIDE_THEMES,
  GUIDE_SECTION_IDS,
  isGuideSectionId,
  resolveGuideLocale,
  toGuideHref,
} from "./view-state";

/**
 * Supported social toolkit themes.
 */
export const SOCIAL_THEMES = ["dark", "light", "gold"] as const;

/**
 * Supported social toolkit themes.
 */
export type SocialTheme = (typeof SOCIAL_THEMES)[number];

/**
 * Supported social asset variants.
 */
export const SOCIAL_ASSET_KINDS = [
  "og-card",
  "ig-post",
  "ig-story",
  "linkedin-post",
  "x-header",
  "docs-header",
  "announcement-card",
  "quote-card",
  "event-invite",
] as const;

/**
 * Supported social asset variants.
 */
export type SocialAssetKind = (typeof SOCIAL_ASSET_KINDS)[number];

/**
 * Marketing distribution channels represented by the toolkit.
 */
export const SOCIAL_CHANNELS = [
  "open-graph",
  "instagram",
  "linkedin",
  "x",
  "documentation",
  "announcement",
  "event",
] as const;

/**
 * Marketing distribution channels represented by the toolkit.
 */
export type SocialChannel = (typeof SOCIAL_CHANNELS)[number];

/**
 * Approved product assets that may appear in campaign renders.
 */
export const APPROVED_ASSET_IDS = ["agent-q", "quantum-flip", "signature-black-red"] as const;

/**
 * Approved product assets that may appear in campaign renders.
 */
export type ApprovedAssetId = (typeof APPROVED_ASSET_IDS)[number];

/**
 * Campaign presets owned by the toolkit.
 */
export const SOCIAL_PRESET_IDS = ["campaign-signature", "campaign-launch", "campaign-event"] as const;

/**
 * Campaign presets owned by the toolkit.
 */
export type SocialPresetId = (typeof SOCIAL_PRESET_IDS)[number];

/**
 * Campaign pack identifiers.
 */
export type SocialPackId = SocialPresetId;

/**
 * Canonical route templates for social toolkit endpoints.
 */
export const SOCIAL_ROUTE_TEMPLATES = {
  assetPng: `${GUIDE_ROUTES.socialAsset}/:presetPng`,
  carouselPng: `${GUIDE_ROUTES.socialAsset}/carousel/:preset/:framePng`,
  packManifest: `${GUIDE_ROUTES.socialPack}/:packId`,
  preview: GUIDE_ROUTES.socialPreview,
} as const;

/**
 * Canonical query parameter keys for the social toolkit HTTP contract.
 */
export const SOCIAL_QUERY_PARAMS = {
  approvedAsset: "approvedAsset",
  asset: "asset",
  language: "lang",
  pack: "pack",
  section: "section",
  theme: "theme",
} as const;

/**
 * Namespaced guide-route query parameter keys used when the social toolkit
 * is embedded inside the main guide document.
 */
export const SOCIAL_GUIDE_QUERY_PARAMS = {
  approvedAsset: "socialApprovedAsset",
  asset: "socialAsset",
  pack: "socialPack",
  theme: "socialTheme",
} as const;

/**
 * Embedded social toolkit query values carried on the main guide route.
 */
export interface SocialGuideQueryValues {
  approvedAssetId: string | null;
  assetKind: string | null;
  packId: string | null;
  socialTheme: string | null;
}

/**
 * Canonical guide URL state for the embedded social toolkit.
 */
export interface SocialGuideHrefInput extends SocialGuideQueryValues {
  guideTheme: GuideTheme;
  language: GuideLanguage;
  section: GuideSectionId;
}

/**
 * Canonical preview-panel states used by the embedded social toolkit.
 */
export const GUIDE_SOCIAL_PREVIEW_STATES = ["idle", "loading", "success", "empty", "error"] as const;

/**
 * Canonical preview-panel states used by the embedded social toolkit.
 */
export type GuideSocialPreviewState = (typeof GUIDE_SOCIAL_PREVIEW_STATES)[number];

/**
 * Typed error envelope for invalid social toolkit requests.
 */
export interface SocialErrorEnvelope {
  code: "invalid_social_request";
  reason:
    | "invalid_approved_asset"
    | "invalid_asset_for_preset"
    | "invalid_asset_kind"
    | "invalid_carousel_frame"
    | "invalid_pack"
    | "invalid_preset"
    | "invalid_theme";
  value: string;
}

const GUIDE_SOCIAL_PREVIEW_STATE_SET = new Set<string>(GUIDE_SOCIAL_PREVIEW_STATES);

/**
 * Type guard for supported embedded social preview panel states.
 */
export const isGuideSocialPreviewState = (value: string): value is GuideSocialPreviewState =>
  GUIDE_SOCIAL_PREVIEW_STATE_SET.has(value);

/**
 * Normalizes arbitrary preview-state input into the canonical social preview state.
 */
export const normalizeGuideSocialPreviewState = (value: string | null | undefined): GuideSocialPreviewState => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return isGuideSocialPreviewState(normalized) ? normalized : "idle";
};

/**
 * Dimensions and channel metadata for a social asset.
 */
export interface SocialAssetDefinition {
  channel: SocialChannel;
  fileName: string;
  height: number;
  kind: SocialAssetKind;
  safeZone: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
  width: number;
}

/**
 * Approved image asset metadata.
 */
export interface SocialApprovedAssetDefinition {
  alt: LocalizedCopy;
  fileName: string;
  id: ApprovedAssetId;
  label: LocalizedCopy;
  meta: LocalizedCopy;
  pickerLabel: LocalizedCopy;
  path: string;
}

/**
 * Localized campaign copy used by the renderer.
 */
export interface SocialPresetCopy {
  description: LocalizedCopy;
  eyebrow: LocalizedCopy;
  quote: LocalizedCopy;
  quoteAttribution: LocalizedCopy;
  subtitle: LocalizedCopy;
  title: LocalizedCopy;
}

/**
 * Canonical campaign preset definition.
 */
export interface SocialPresetDefinition {
  approvedAssetId: ApprovedAssetId;
  assetKinds: readonly SocialAssetKind[];
  carouselFrames: readonly number[];
  copy: SocialPresetCopy;
  defaultTheme: SocialTheme;
  id: SocialPresetId;
}

/**
 * Normalized request passed to the renderer.
 */
export interface SocialRenderRequest {
  approvedAssetId: ApprovedAssetId;
  assetKind: SocialAssetKind;
  language: GuideLanguage;
  packId: SocialPackId;
  presetId: SocialPresetId;
  section: GuideSectionId;
  theme: SocialTheme;
}

/**
 * Manifest entry for one downloadable social asset.
 */
export interface SocialPackAssetManifestItem {
  channel: SocialChannel;
  fileName: string;
  height: number;
  href: string;
  kind: SocialAssetKind;
  width: number;
}

/**
 * Manifest entry for a carousel frame.
 */
export interface SocialCarouselFrameManifestItem {
  fileName: string;
  frame: number;
  height: number;
  href: string;
  width: number;
}

/**
 * JSON manifest returned for a campaign pack.
 */
export interface SocialPackManifest {
  approvedAssetId: ApprovedAssetId;
  assets: readonly SocialPackAssetManifestItem[];
  carouselFrames: readonly SocialCarouselFrameManifestItem[];
  description: string;
  language: GuideLanguage;
  packId: SocialPackId;
  presetId: SocialPresetId;
  section: GuideSectionId;
  theme: SocialTheme;
  title: string;
}

/**
 * Result wrapper for normalized requests.
 */
export type SocialRequestResolution =
  | {
      ok: true;
      value: SocialRenderRequest;
    }
  | {
      error: SocialErrorEnvelope;
      ok: false;
    };

/**
 * Shared channel registry used by the renderer, pack manifests, and tests.
 */
export const SOCIAL_ASSET_DEFINITIONS: Record<SocialAssetKind, SocialAssetDefinition> = {
  "announcement-card": {
    channel: "announcement",
    fileName: "announcement-card",
    height: 1200,
    kind: "announcement-card",
    safeZone: { bottom: 132, left: 104, right: 104, top: 104 },
    width: 1200,
  },
  "docs-header": {
    channel: "documentation",
    fileName: "docs-header",
    height: 675,
    kind: "docs-header",
    safeZone: { bottom: 72, left: 96, right: 96, top: 72 },
    width: 1600,
  },
  "event-invite": {
    channel: "event",
    fileName: "event-invite",
    height: 1350,
    kind: "event-invite",
    safeZone: { bottom: 112, left: 96, right: 96, top: 96 },
    width: 1080,
  },
  "ig-post": {
    channel: "instagram",
    fileName: "instagram-post",
    height: 1080,
    kind: "ig-post",
    safeZone: { bottom: 108, left: 96, right: 96, top: 96 },
    width: 1080,
  },
  "ig-story": {
    channel: "instagram",
    fileName: "instagram-story",
    height: 1920,
    kind: "ig-story",
    safeZone: { bottom: 180, left: 96, right: 96, top: 180 },
    width: 1080,
  },
  "linkedin-post": {
    channel: "linkedin",
    fileName: "linkedin-post",
    height: 627,
    kind: "linkedin-post",
    safeZone: { bottom: 72, left: 72, right: 72, top: 72 },
    width: 1200,
  },
  "og-card": {
    channel: "open-graph",
    fileName: "og-card",
    height: 630,
    kind: "og-card",
    safeZone: { bottom: 64, left: 72, right: 72, top: 72 },
    width: 1200,
  },
  "quote-card": {
    channel: "announcement",
    fileName: "quote-card",
    height: 1350,
    kind: "quote-card",
    safeZone: { bottom: 128, left: 96, right: 96, top: 96 },
    width: 1080,
  },
  "x-header": {
    channel: "x",
    fileName: "x-header",
    height: 500,
    kind: "x-header",
    safeZone: { bottom: 44, left: 84, right: 84, top: 44 },
    width: 1500,
  },
} as const;

/**
 * Approved product image registry.
 */
export const SOCIAL_APPROVED_ASSETS: Record<ApprovedAssetId, SocialApprovedAssetDefinition> = {
  "agent-q": {
    alt: { en: "Agent Q collector's edition", zh: "Agent Q 收藏家版本" },
    fileName: "agent-q-alligator-collectors-edition.webp",
    id: "agent-q",
    label: { en: "Agent Q Collector Edition", zh: "Agent Q 收藏家版" },
    meta: { en: "Launch-approved hero asset", zh: "限量发布素材" },
    pickerLabel: { en: "Approved Asset — Agent Q", zh: "批准素材 — Agent Q" },
    path: toGuideImageAssetHref("agent-q-alligator-collectors-edition.webp"),
  },
  "quantum-flip": {
    alt: { en: "Quantum Flip gilded lacquer finish", zh: "Quantum Flip 镀金漆面细节" },
    fileName: "quantum-flip-baqua-gilded-lacquer-gold-v.webp",
    id: "quantum-flip",
    label: { en: "Quantum Flip Gilded Detail", zh: "Quantum Flip 镀金细节" },
    meta: { en: "Event-approved luxury detail", zh: "私享活动视觉锚点" },
    pickerLabel: { en: "Approved Asset — Quantum Flip", zh: "批准素材 — Quantum Flip" },
    path: toGuideImageAssetHref("quantum-flip-baqua-gilded-lacquer-gold-v.webp"),
  },
  "signature-black-red": {
    alt: { en: "Signature black and red luxury handset", zh: "黑红配色高端手机细节" },
    fileName: "black-red.webp",
    id: "signature-black-red",
    label: { en: "Signature Black/Red Story", zh: "Signature 黑红系列" },
    meta: { en: "Evergreen brand narrative anchor", zh: "品牌常青视觉锚点" },
    pickerLabel: { en: "Approved Asset — Signature Black/Red", zh: "批准素材 — Signature 黑红系列" },
    path: toGuideImageAssetHref("black-red.webp"),
  },
} as const;

/**
 * Shared campaign preset registry.
 */
export const SOCIAL_PRESET_REGISTRY: Record<SocialPresetId, SocialPresetDefinition> = {
  "campaign-event": {
    approvedAssetId: "quantum-flip",
    assetKinds: ["og-card", "event-invite", "announcement-card", "quote-card", "linkedin-post", "x-header"],
    carouselFrames: [1, 2, 3],
    copy: {
      description: {
        en: "Invite-led campaign pack for salons, partner previews, and executive briefings.",
        zh: "适用于沙龙活动、合作伙伴预览与高层简报的邀请型传播套件。",
      },
      eyebrow: { en: "Private Event", zh: "私享活动" },
      quote: {
        en: "Curated for invitation-only audiences with a focus on setting, guest list, and reveal timing.",
        zh: "面向邀请制受众，重点突出场景、宾客名单与揭幕时刻。",
      },
      quoteAttribution: { en: "VERTU Experiences", zh: "VERTU 体验团队" },
      subtitle: { en: "Invitation-Only Salon Series", zh: "邀请制私享沙龙" },
      title: { en: "Private Preview Evening", zh: "私享预览之夜" },
    },
    defaultTheme: "gold",
    id: "campaign-event",
  },
  "campaign-launch": {
    approvedAssetId: "agent-q",
    assetKinds: ["og-card", "ig-post", "ig-story", "linkedin-post", "x-header", "announcement-card", "docs-header"],
    carouselFrames: [1, 2, 3],
    copy: {
      description: {
        en: "Launch-oriented campaign pack for hero reveals, partner recaps, and rollout headers.",
        zh: "面向新品发布、合作伙伴回顾与传播头图的发布型套件。",
      },
      eyebrow: { en: "Launch Campaign", zh: "发布传播" },
      quote: {
        en: "One hero claim, one proof line, and one premium image cue across every distribution surface.",
        zh: "在所有传播面保持一条核心主张、一条证据线索与一个高端视觉锚点。",
      },
      quoteAttribution: { en: "VERTU Launch Office", zh: "VERTU 发布团队" },
      subtitle: { en: "Crafted Beyond Measure", zh: "超越匠心" },
      title: { en: "Agent Q Collector Release", zh: "Agent Q 收藏家版发布" },
    },
    defaultTheme: "dark",
    id: "campaign-launch",
  },
  "campaign-signature": {
    approvedAssetId: "signature-black-red",
    assetKinds: ["og-card", "ig-post", "ig-story", "linkedin-post", "x-header", "docs-header", "quote-card"],
    carouselFrames: [1, 2, 3],
    copy: {
      description: {
        en: "Editorial brand pack for evergreen positioning, narrative headers, and social consistency.",
        zh: "面向常青品牌表达、叙事头图与社媒一致性的编辑型套件。",
      },
      eyebrow: { en: "Brand System", zh: "品牌系统" },
      quote: {
        en: "Use the same editorial hierarchy across cards, headers, and carousel frames to keep the campaign coherent.",
        zh: "在卡片、头图与轮播页之间保持统一的编辑层级，使整套传播语言一致。",
      },
      quoteAttribution: { en: "VERTU Brand Studio", zh: "VERTU 品牌工作室" },
      subtitle: { en: "Luxury Signals, Systemized", zh: "高端信号，系统化表达" },
      title: { en: "VERTU Signature Campaign Toolkit", zh: "VERTU 品牌传播套件" },
    },
    defaultTheme: "light",
    id: "campaign-signature",
  },
} as const;

const GUIDE_THEME_TO_SOCIAL_THEME: Record<(typeof GUIDE_THEMES)[number], SocialTheme> = {
  dark: "dark",
  light: "light",
  system: "dark",
};

const SECTION_TO_PRESET: Record<GuideSectionId, SocialPresetId> = {
  s0: "campaign-signature",
  s1: "campaign-signature",
  s2: "campaign-signature",
  s3: "campaign-signature",
  s4: "campaign-signature",
  s5: "campaign-signature",
  s6: "campaign-launch",
  s7: "campaign-launch",
  s8: "campaign-launch",
  s9: "campaign-launch",
  s10: "campaign-launch",
  s11: "campaign-event",
  s12: "campaign-event",
  s13: "campaign-event",
  s14: "campaign-event",
  s15: "campaign-event",
  s16: "campaign-event",
};

const SOCIAL_THEME_SET = new Set<string>(SOCIAL_THEMES);
const SOCIAL_PRESET_SET = new Set<string>(SOCIAL_PRESET_IDS);
const SOCIAL_ASSET_KIND_SET = new Set<string>(SOCIAL_ASSET_KINDS);
const APPROVED_ASSET_SET = new Set<string>(APPROVED_ASSET_IDS);
const SOCIAL_URL_FALLBACK_ORIGIN = GUIDE_SERVER.localOrigin;

const applyGuideSocialQueryValue = (
  searchParams: URLSearchParams,
  key: (typeof SOCIAL_GUIDE_QUERY_PARAMS)[keyof typeof SOCIAL_GUIDE_QUERY_PARAMS],
  value: string | null | undefined
): void => {
  if (value) {
    searchParams.set(key, value);
    return;
  }

  searchParams.delete(key);
};

const hasCanonicalSocialGuideFallback = (query: URLSearchParams): boolean =>
  query.has(SOCIAL_QUERY_PARAMS.pack) ||
  query.has(SOCIAL_QUERY_PARAMS.asset) ||
  query.has(SOCIAL_QUERY_PARAMS.approvedAsset);

/**
 * Validates whether a string is a supported social theme.
 */
export const isSocialTheme = (value: string): value is SocialTheme => SOCIAL_THEME_SET.has(value);

/**
 * Validates whether a string is a supported social preset.
 */
export const isSocialPresetId = (value: string): value is SocialPresetId => SOCIAL_PRESET_SET.has(value);

/**
 * Validates whether a string is a supported asset kind.
 */
export const isSocialAssetKind = (value: string): value is SocialAssetKind => SOCIAL_ASSET_KIND_SET.has(value);

/**
 * Validates whether a string is a supported approved asset identifier.
 */
export const isApprovedAssetId = (value: string): value is ApprovedAssetId => APPROVED_ASSET_SET.has(value);

/**
 * Resolves the default campaign preset for a guide section.
 */
export const resolveSectionSocialPreset = (section: GuideSectionId): SocialPresetId => SECTION_TO_PRESET[section];

/**
 * Resolves the default social theme for the current guide theme.
 */
export const resolveSocialThemeFromGuideTheme = (theme: (typeof GUIDE_THEMES)[number]): SocialTheme =>
  GUIDE_THEME_TO_SOCIAL_THEME[theme];

/**
 * Reads embedded social toolkit values from either namespaced guide params or
 * canonical preview-route params.
 */
export const resolveGuideSocialQueryValues = (query: URLSearchParams): SocialGuideQueryValues => ({
  approvedAssetId:
    query.get(SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset) ??
    (hasCanonicalSocialGuideFallback(query) ? query.get(SOCIAL_QUERY_PARAMS.approvedAsset) : null),
  assetKind:
    query.get(SOCIAL_GUIDE_QUERY_PARAMS.asset) ??
    (hasCanonicalSocialGuideFallback(query) ? query.get(SOCIAL_QUERY_PARAMS.asset) : null),
  packId:
    query.get(SOCIAL_GUIDE_QUERY_PARAMS.pack) ??
    (hasCanonicalSocialGuideFallback(query) ? query.get(SOCIAL_QUERY_PARAMS.pack) : null),
  socialTheme:
    query.get(SOCIAL_GUIDE_QUERY_PARAMS.theme) ??
    (hasCanonicalSocialGuideFallback(query) ? query.get(SOCIAL_QUERY_PARAMS.theme) : null),
});

/**
 * Builds the canonical guide URL for embedded social toolkit state.
 */
export const toSocialGuideHref = (input: SocialGuideHrefInput): string => {
  const url = new URL(
    toGuideHref({
      language: input.language,
      section: input.section,
      theme: input.guideTheme,
    }),
    GUIDE_SERVER.localOrigin
  );

  applyGuideSocialQueryValue(url.searchParams, SOCIAL_GUIDE_QUERY_PARAMS.pack, input.packId);
  applyGuideSocialQueryValue(url.searchParams, SOCIAL_GUIDE_QUERY_PARAMS.asset, input.assetKind);
  applyGuideSocialQueryValue(url.searchParams, SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset, input.approvedAssetId);
  applyGuideSocialQueryValue(url.searchParams, SOCIAL_GUIDE_QUERY_PARAMS.theme, input.socialTheme);

  return `${url.pathname}${url.search}`;
};

/**
 * Builds the canonical social image endpoint URL.
 */
export const toSocialAssetHref = (request: SocialRenderRequest, origin = ""): string => {
  const url = new URL(`${GUIDE_ROUTES.socialAsset}/${request.presetId}.png`, origin || SOCIAL_URL_FALLBACK_ORIGIN);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.asset, request.assetKind);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, request.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, request.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, request.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, request.theme);

  return origin ? url.toString() : `${url.pathname}${url.search}`;
};

/**
 * Builds the canonical carousel frame endpoint URL.
 */
export const toSocialCarouselHref = (request: SocialRenderRequest, frame: number, origin = ""): string => {
  const url = new URL(
    `${GUIDE_ROUTES.socialAsset}/carousel/${request.presetId}/${frame}.png`,
    origin || SOCIAL_URL_FALLBACK_ORIGIN
  );
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, request.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, request.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, request.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, request.theme);

  return origin ? url.toString() : `${url.pathname}${url.search}`;
};

/**
 * Builds the campaign pack manifest URL.
 */
export const toSocialPackHref = (
  request: Pick<SocialRenderRequest, "approvedAssetId" | "language" | "packId" | "section" | "theme">,
  origin = ""
): string => {
  const url = new URL(`${GUIDE_ROUTES.socialPack}/${request.packId}`, origin || SOCIAL_URL_FALLBACK_ORIGIN);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, request.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, request.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, request.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, request.theme);

  return origin ? url.toString() : `${url.pathname}${url.search}`;
};

/**
 * Builds a normalized render request or a typed error envelope.
 */
export const resolveSocialRenderRequest = (input: {
  approvedAsset?: string | null;
  asset?: string | null;
  language: GuideLanguage;
  preset?: string | null;
  section?: string | null;
  theme?: string | null;
}): SocialRequestResolution => {
  const fallbackSection = isGuideSectionId(String(input.section ?? ""))
    ? (String(input.section) as GuideSectionId)
    : "s0";
  const fallbackPreset = resolveSectionSocialPreset(fallbackSection);
  const preset = String(input.preset ?? fallbackPreset).trim() || fallbackPreset;

  if (!isSocialPresetId(preset)) {
    return {
      error: { code: "invalid_social_request", reason: "invalid_preset", value: preset },
      ok: false,
    };
  }

  const pack = SOCIAL_PRESET_REGISTRY[preset];
  const asset = String(input.asset ?? "").trim() || pack.assetKinds[0];
  if (!isSocialAssetKind(asset)) {
    return {
      error: { code: "invalid_social_request", reason: "invalid_asset_kind", value: asset },
      ok: false,
    };
  }

  if (!pack.assetKinds.includes(asset)) {
    return {
      error: { code: "invalid_social_request", reason: "invalid_asset_for_preset", value: asset },
      ok: false,
    };
  }

  const themeInput = String(input.theme ?? "").trim();
  const theme = themeInput ? themeInput : pack.defaultTheme;
  if (!isSocialTheme(theme)) {
    return {
      error: { code: "invalid_social_request", reason: "invalid_theme", value: themeInput },
      ok: false,
    };
  }

  const approvedAsset = String(input.approvedAsset ?? "").trim() || pack.approvedAssetId;
  if (!isApprovedAssetId(approvedAsset)) {
    return {
      error: { code: "invalid_social_request", reason: "invalid_approved_asset", value: approvedAsset },
      ok: false,
    };
  }

  const section = isGuideSectionId(String(input.section ?? "")) ? (String(input.section) as GuideSectionId) : "s0";

  return {
    ok: true,
    value: {
      approvedAssetId: approvedAsset,
      assetKind: asset,
      language: input.language,
      packId: preset,
      presetId: preset,
      section,
      theme,
    },
  };
};

/**
 * Builds a normalized campaign pack request or a typed pack error envelope.
 */
export const resolveSocialPackRequest = (input: {
  approvedAsset?: string | null;
  language: GuideLanguage;
  packId?: string | null;
  section?: string | null;
  theme?: string | null;
}): SocialRequestResolution => {
  const requestedPackId = String(input.packId ?? "").trim();
  if (!isSocialPresetId(requestedPackId)) {
    return {
      error: { code: "invalid_social_request", reason: "invalid_pack", value: requestedPackId },
      ok: false,
    };
  }

  return resolveSocialRenderRequest({
    approvedAsset: input.approvedAsset,
    language: input.language,
    preset: requestedPackId,
    section: input.section,
    theme: input.theme,
  });
};

/**
 * Validates a carousel frame against a preset.
 */
export const resolveSocialCarouselFrame = (
  presetId: SocialPresetId,
  frameValue: string | null | undefined
):
  | {
      frame: number;
      ok: true;
    }
  | {
      error: SocialErrorEnvelope;
      ok: false;
    } => {
  const frame = Number(frameValue ?? "");
  const isSupportedFrame = Number.isInteger(frame) && SOCIAL_PRESET_REGISTRY[presetId].carouselFrames.includes(frame);

  return isSupportedFrame
    ? { frame, ok: true }
    : {
        error: {
          code: "invalid_social_request",
          reason: "invalid_carousel_frame",
          value: String(frameValue ?? ""),
        },
        ok: false,
      };
};

/**
 * Resolves the human-readable section label used inside social assets.
 */
export const resolveSocialSectionLabel = (section: GuideSectionId, language: GuideLanguage): string =>
  language === "zh" ? `章节 ${section.slice(1)}` : `Section ${section.slice(1)}`;

/**
 * Resolves preset-localized copy.
 */
export const resolveSocialPresetCopy = (presetId: SocialPresetId): SocialPresetCopy => {
  const preset = SOCIAL_PRESET_REGISTRY[presetId];

  return {
    description: {
      en: preset.copy.description.en,
      zh: preset.copy.description.zh,
    },
    eyebrow: {
      en: preset.copy.eyebrow.en,
      zh: preset.copy.eyebrow.zh,
    },
    quote: {
      en: preset.copy.quote.en,
      zh: preset.copy.quote.zh,
    },
    quoteAttribution: {
      en: preset.copy.quoteAttribution.en,
      zh: preset.copy.quoteAttribution.zh,
    },
    subtitle: {
      en: preset.copy.subtitle.en,
      zh: preset.copy.subtitle.zh,
    },
    title: {
      en: preset.copy.title.en,
      zh: preset.copy.title.zh,
    },
  } satisfies SocialPresetCopy;
};

/**
 * Builds the download filename for a rendered social asset.
 */
export const buildSocialAssetFileName = (request: SocialRenderRequest): string =>
  `${["VERTU", request.packId, request.assetKind, request.language, request.theme, request.section].join("-")}.png`;

/**
 * Builds the download filename for a rendered carousel frame.
 */
export const buildSocialCarouselFileName = (request: SocialRenderRequest, frame: number): string =>
  `${["VERTU", request.packId, "carousel", `frame-${frame}`, request.language, request.theme, request.section].join(
    "-"
  )}.png`;

/**
 * Builds the static output path fragment for a rendered social asset.
 */
export const buildSocialStaticAssetPath = (request: SocialRenderRequest): string =>
  `${request.packId}/${request.language}/${request.theme}/${request.section}/${buildSocialAssetFileName(request)}`;

/**
 * Builds the static output path fragment for a rendered carousel frame.
 */
export const buildSocialStaticCarouselPath = (request: SocialRenderRequest, frame: number): string =>
  `${request.packId}/${request.language}/${request.theme}/${request.section}/${buildSocialCarouselFileName(request, frame)}`;

/**
 * Resolves the campaign pack manifest for the current request.
 */
export const resolveSocialPackManifest = (request: SocialRenderRequest, origin = ""): SocialPackManifest => {
  const preset = SOCIAL_PRESET_REGISTRY[request.packId];
  const copy = resolveSocialPresetCopy(request.presetId);
  const languageKey = resolveGuideLocale(request.language);

  return {
    approvedAssetId: request.approvedAssetId,
    assets: preset.assetKinds.map((kind) => {
      const definition = SOCIAL_ASSET_DEFINITIONS[kind];
      const itemRequest = { ...request, assetKind: kind } satisfies SocialRenderRequest;

      return {
        channel: definition.channel,
        fileName: buildSocialAssetFileName(itemRequest),
        height: definition.height,
        href: toSocialAssetHref(itemRequest, origin),
        kind,
        width: definition.width,
      } satisfies SocialPackAssetManifestItem;
    }),
    carouselFrames: preset.carouselFrames.map((frame) => ({
      fileName: buildSocialCarouselFileName(request, frame),
      frame,
      height: SOCIAL_ASSET_DEFINITIONS["ig-post"].height,
      href: toSocialCarouselHref(request, frame, origin),
      width: SOCIAL_ASSET_DEFINITIONS["ig-post"].width,
    })),
    description: copy.description[languageKey],
    language: request.language,
    packId: request.packId,
    presetId: request.presetId,
    section: request.section,
    theme: request.theme,
    title: copy.title[languageKey],
  };
};

/**
 * Returns the list of canonical build-time render requests.
 */
const CANONICAL_BUILD_LANGUAGES: readonly GuideLanguage[] = ["en", "zh"];

const CANONICAL_PRESET_SECTIONS: Record<SocialPresetId, GuideSectionId> = {
  "campaign-event": "s15",
  "campaign-launch": "s6",
  "campaign-signature": GUIDE_SECTION_IDS[0],
};

/**
 * Returns the list of canonical build-time render requests.
 */
export const resolveCanonicalSocialBuildRequests = (): readonly SocialRenderRequest[] =>
  SOCIAL_PRESET_IDS.flatMap((presetId) => {
    const preset = SOCIAL_PRESET_REGISTRY[presetId];
    const section = CANONICAL_PRESET_SECTIONS[presetId];

    return CANONICAL_BUILD_LANGUAGES.flatMap((language) =>
      SOCIAL_THEMES.flatMap((theme) =>
        preset.assetKinds.map(
          (assetKind) =>
            ({
              approvedAssetId: preset.approvedAssetId,
              assetKind,
              language,
              packId: preset.id,
              presetId: preset.id,
              section,
              theme,
            }) satisfies SocialRenderRequest
        )
      )
    );
  });

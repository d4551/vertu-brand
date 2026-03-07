import { extname } from "node:path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

type SatoriFontOptions = NonNullable<Parameters<typeof satori>[1]["fonts"]>[number];

import { GUIDE_BRAND_COLOR_TOKENS, GUIDE_BRAND_FONT_FAMILIES, GUIDE_SOCIAL_THEME_TOKENS } from "../shared/brand-tokens";
import { GUIDE_BRAND_ASSETS } from "../shared/config";
import {
  buildSocialAssetFileName,
  buildSocialCarouselFileName,
  resolveSocialPackManifest,
  resolveSocialPresetCopy,
  resolveSocialSectionLabel,
  SOCIAL_APPROVED_ASSETS,
  SOCIAL_ASSET_DEFINITIONS,
  type SocialAssetDefinition,
  type SocialPackManifest,
  type SocialRenderRequest,
  type SocialTheme,
} from "../shared/social-toolkit";
import { resolveGuideLocale } from "../shared/view-state";
import { GUIDE_FONT_FILE_PATHS, resolveGuidePublicAssetSourcePath } from "./runtime-config";

type SocialChild = SocialNode | string;

interface SocialNode {
  props: SocialNodeProps;
  type: string;
}

interface SocialNodeProps {
  alt?: string;
  children?: SocialChild | readonly SocialChild[];
  height?: number | string;
  src?: string;
  style?: Record<string, number | string>;
  width?: number | string;
}

interface SocialThemePalette {
  accent: string;
  background: string;
  border: string;
  card: string;
  logoPath: string;
  muted: string;
  text: string;
}

interface SocialFontDefinition {
  data: Promise<ArrayBuffer>;
  name: string;
  style: SatoriFontOptions["style"];
  weight: Exclude<SatoriFontOptions["weight"], undefined>;
}

interface ApprovedAssetPresentation {
  accent: string;
  label: string;
  meta: string;
}

/**
 * Preview payload returned by the toolkit preview endpoint.
 */
export interface SocialPreviewModel extends SocialPackManifest {
  primaryAssetFileName: string;
  primaryAssetHref: string;
}

const FONT_REGISTRY: readonly SocialFontDefinition[] = [
  {
    data: Bun.file(GUIDE_FONT_FILE_PATHS.dmSans400).arrayBuffer(),
    name: GUIDE_BRAND_FONT_FAMILIES.body,
    style: "normal",
    weight: 400,
  },
  {
    data: Bun.file(GUIDE_FONT_FILE_PATHS.dmSans700).arrayBuffer(),
    name: GUIDE_BRAND_FONT_FAMILIES.body,
    style: "normal",
    weight: 700,
  },
  {
    data: Bun.file(GUIDE_FONT_FILE_PATHS.playfairDisplay700).arrayBuffer(),
    name: GUIDE_BRAND_FONT_FAMILIES.identity,
    style: "normal",
    weight: 700,
  },
  {
    data: Bun.file(GUIDE_FONT_FILE_PATHS.instrumentSerif400).arrayBuffer(),
    name: GUIDE_BRAND_FONT_FAMILIES.display,
    style: "normal",
    weight: 400,
  },
  {
    data: Bun.file(GUIDE_FONT_FILE_PATHS.ibmPlexMono400).arrayBuffer(),
    name: GUIDE_BRAND_FONT_FAMILIES.mono,
    style: "normal",
    weight: 400,
  },
] as const;

const withHexPrefix = (value: string): string => `#${value}`;

const resolveLogoPath = (logoVariant: "black" | "white"): string =>
  logoVariant === "white" ? GUIDE_BRAND_ASSETS.logoWhite : GUIDE_BRAND_ASSETS.logoBlack;

const THEME_PALETTES: Record<SocialTheme, SocialThemePalette> = Object.fromEntries(
  Object.entries(GUIDE_SOCIAL_THEME_TOKENS).map(([theme, tokens]) => [
    theme,
    {
      accent: withHexPrefix(tokens.accent),
      background: withHexPrefix(tokens.background),
      border: tokens.border,
      card: tokens.card,
      logoPath: resolveLogoPath(tokens.logoVariant),
      muted: withHexPrefix(tokens.muted),
      text: withHexPrefix(tokens.text),
    },
  ])
) as Record<SocialTheme, SocialThemePalette>;

const assetCache = new Map<string, Promise<string>>();
const renderedAssetCache = new Map<string, Promise<Uint8Array>>();
const renderedCarouselCache = new Map<string, Promise<Uint8Array>>();
const RENDER_CACHE_MAX_ENTRIES = 192;

const element = (type: string, props: SocialNodeProps): SocialNode => ({ props, type });

const div = (style: Record<string, number | string>, children: readonly SocialChild[] = []): SocialNode =>
  element("div", { children, style: { display: "flex", ...style } });

const textBlock = (text: string, style: Record<string, number | string>, type = "div"): SocialNode =>
  element(type, { children: text, style: { display: "flex", ...style } });

const imageNode = (
  src: string,
  width: number,
  height: number,
  style: Record<string, number | string> = {}
): SocialNode => element("img", { height, src, style, width });

const resolveAssetMimeType = (filePath: string): string => {
  const extension = extname(filePath).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
};

const getAssetDataUrl = (relativePath: string): Promise<string> => {
  const cached = assetCache.get(relativePath);
  if (cached) {
    return cached;
  }

  const absolutePath = resolveGuidePublicAssetSourcePath(relativePath);
  const promise = Bun.file(absolutePath)
    .arrayBuffer()
    .then((buffer) => `data:${resolveAssetMimeType(absolutePath)};base64,${Buffer.from(buffer).toString("base64")}`);

  assetCache.set(relativePath, promise);
  return promise;
};

const getSatoriFonts = async (): Promise<readonly SatoriFontOptions[]> =>
  Promise.all(
    FONT_REGISTRY.map(async (font) => ({
      data: await font.data,
      name: font.name,
      style: font.style,
      weight: font.weight,
    }))
  );

const resolveThemePalette = (theme: SocialTheme): SocialThemePalette => THEME_PALETTES[theme];

const resolveRenderCacheKey = (request: SocialRenderRequest, frame?: number): string => {
  const keyParts = [
    request.packId,
    request.presetId,
    request.assetKind,
    request.approvedAssetId,
    request.language,
    request.theme,
    request.section,
  ];

  return typeof frame === "number" ? `${keyParts.join("|")}|frame:${frame}` : keyParts.join("|");
};

const resolveCachedPng = (
  cache: Map<string, Promise<Uint8Array>>,
  key: string,
  createValue: () => Promise<Uint8Array>
): Promise<Uint8Array> => {
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const pendingValue = createValue().then(
    (value) => value,
    (error: Error) => {
      cache.delete(key);
      throw error;
    }
  );

  if (cache.size >= RENDER_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey === "string") {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, pendingValue);

  return pendingValue;
};

const ASSET_ACCENT_COLORS = {
  black: withHexPrefix(GUIDE_BRAND_COLOR_TOKENS.black),
  dark: withHexPrefix(GUIDE_BRAND_COLOR_TOKENS.dark),
  gold: withHexPrefix(GUIDE_BRAND_COLOR_TOKENS.gold),
} as const;

const resolveApprovedAssetPresentation = (request: SocialRenderRequest): ApprovedAssetPresentation => {
  const language = resolveGuideLocale(request.language);
  const asset = SOCIAL_APPROVED_ASSETS[request.approvedAssetId];

  if (request.approvedAssetId === "agent-q") {
    return {
      accent: request.theme === "gold" ? ASSET_ACCENT_COLORS.black : ASSET_ACCENT_COLORS.gold,
      label: asset.label[language],
      meta: asset.meta[language],
    };
  }

  if (request.approvedAssetId === "quantum-flip") {
    return {
      accent: request.theme === "light" ? ASSET_ACCENT_COLORS.dark : ASSET_ACCENT_COLORS.gold,
      label: asset.label[language],
      meta: asset.meta[language],
    };
  }

  return {
    accent: request.theme === "gold" ? ASSET_ACCENT_COLORS.dark : ASSET_ACCENT_COLORS.gold,
    label: asset.label[language],
    meta: asset.meta[language],
  };
};

const renderApprovedAssetPanel = (
  request: SocialRenderRequest,
  definition: SocialAssetDefinition,
  palette: SocialThemePalette
): SocialNode => {
  const presentation = resolveApprovedAssetPresentation(request);

  return div(
    {
      alignItems: "stretch",
      backgroundColor: palette.card,
      border: `1px solid ${palette.border}`,
      borderRadius: 32,
      display: "flex",
      flexDirection: "column",
      gap: Math.max(16, Math.round(definition.width * 0.014)),
      justifyContent: "space-between",
      minHeight: Math.round(definition.width * 0.34),
      padding: Math.max(24, Math.round(definition.width * 0.025)),
      width: "100%",
    },
    [
      div(
        {
          display: "flex",
          flexDirection: "column",
          gap: 10,
        },
        [
          textBlock(presentation.label, {
            color: palette.text,
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.identity,
            fontSize: Math.max(24, Math.round(definition.width * 0.026)),
            lineHeight: 1.1,
          }),
          textBlock(presentation.meta, {
            color: palette.muted,
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.body,
            fontSize: Math.max(16, Math.round(definition.width * 0.014)),
            lineHeight: 1.35,
          }),
        ]
      ),
      div(
        {
          alignItems: "flex-end",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
        },
        [
          div(
            {
              alignItems: "flex-end",
              display: "flex",
              gap: 10,
            },
            [
              div(
                {
                  backgroundColor: presentation.accent,
                  borderRadius: 999,
                  height: 18,
                  width: 18,
                },
                []
              ),
              textBlock(request.approvedAssetId, {
                color: palette.muted,
                fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
                fontSize: Math.max(14, Math.round(definition.width * 0.012)),
                letterSpacing: Math.round(definition.width * 0.0013),
                textTransform: "uppercase",
              }),
            ]
          ),
          div(
            {
              background: `linear-gradient(135deg, ${presentation.accent} 0%, ${palette.background} 100%)`,
              borderRadius: 24,
              height: Math.max(120, Math.round(definition.width * 0.16)),
              width: Math.max(120, Math.round(definition.width * 0.16)),
            },
            []
          ),
        ]
      ),
    ]
  );
};

const renderPrimaryCardLayout = async (
  request: SocialRenderRequest,
  definition: SocialAssetDefinition
): Promise<SocialNode> => {
  const palette = resolveThemePalette(request.theme);
  const copy = resolveSocialPresetCopy(request.presetId);
  const languageKey = resolveGuideLocale(request.language);
  const sectionLabel = resolveSocialSectionLabel(request.section, request.language);
  const logoAssetSrc = await getAssetDataUrl(palette.logoPath);
  const isPortrait = definition.height > definition.width;
  const framePadding = Math.max(40, Math.round(definition.width * 0.06));
  const mediaWidth = isPortrait
    ? definition.width - definition.safeZone.left - definition.safeZone.right
    : Math.round(definition.width * 0.36);

  return div(
    {
      alignItems: "stretch",
      backgroundColor: palette.background,
      color: palette.text,
      display: "flex",
      flexDirection: isPortrait ? "column" : "row",
      height: "100%",
      width: "100%",
    },
    [
      div(
        {
          display: "flex",
          flex: "1 1 0",
          flexDirection: "column",
          gap: Math.max(18, Math.round(definition.width * 0.018)),
          justifyContent: "space-between",
          padding: framePadding,
        },
        [
          div(
            {
              display: "flex",
              flexDirection: "column",
              gap: Math.max(12, Math.round(definition.width * 0.014)),
            },
            [
              imageNode(logoAssetSrc, Math.round(definition.width * 0.16), Math.round(definition.width * 0.052)),
              textBlock(copy.eyebrow[languageKey], {
                color: palette.accent,
                fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
                fontSize: Math.max(16, Math.round(definition.width * 0.014)),
                letterSpacing: Math.round(definition.width * 0.002),
                textTransform: "uppercase",
              }),
              textBlock(copy.title[languageKey], {
                fontFamily: GUIDE_BRAND_FONT_FAMILIES.display,
                fontSize: Math.max(44, Math.round(definition.width * (isPortrait ? 0.068 : 0.052))),
                lineHeight: 1.02,
              }),
              textBlock(copy.subtitle[languageKey], {
                color: palette.muted,
                fontFamily: GUIDE_BRAND_FONT_FAMILIES.body,
                fontSize: Math.max(20, Math.round(definition.width * 0.02)),
                lineHeight: 1.4,
              }),
            ]
          ),
          div(
            {
              display: "flex",
              flexDirection: "column",
              gap: 12,
            },
            [
              textBlock(sectionLabel, {
                borderTop: `1px solid ${palette.border}`,
                fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
                fontSize: Math.max(14, Math.round(definition.width * 0.012)),
                letterSpacing: Math.round(definition.width * 0.0013),
                paddingTop: 16,
                textTransform: "uppercase",
              }),
              textBlock(copy.description[languageKey], {
                color: palette.muted,
                fontFamily: GUIDE_BRAND_FONT_FAMILIES.body,
                fontSize: Math.max(16, Math.round(definition.width * 0.014)),
                lineHeight: 1.45,
              }),
            ]
          ),
        ]
      ),
      div(
        {
          alignItems: "center",
          display: "flex",
          flex: isPortrait ? "1 1 0" : `0 0 ${mediaWidth}px`,
          justifyContent: "center",
          padding: framePadding,
          position: "relative",
        },
        [renderApprovedAssetPanel(request, definition, palette)]
      ),
    ]
  );
};

const renderQuoteCardLayout = async (
  request: SocialRenderRequest,
  definition: SocialAssetDefinition
): Promise<SocialNode> => {
  const palette = resolveThemePalette(request.theme);
  const copy = resolveSocialPresetCopy(request.presetId);
  const languageKey = resolveGuideLocale(request.language);
  const logoAssetSrc = await getAssetDataUrl(palette.logoPath);

  return div(
    {
      backgroundColor: palette.background,
      color: palette.text,
      display: "flex",
      flexDirection: "column",
      gap: 28,
      height: "100%",
      justifyContent: "space-between",
      padding: Math.max(72, Math.round(definition.width * 0.09)),
      width: "100%",
    },
    [
      div(
        {
          display: "flex",
          justifyContent: "space-between",
        },
        [
          textBlock(copy.eyebrow[languageKey], {
            color: palette.accent,
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
            fontSize: Math.max(18, Math.round(definition.width * 0.016)),
            letterSpacing: Math.round(definition.width * 0.002),
            textTransform: "uppercase",
          }),
          imageNode(logoAssetSrc, Math.round(definition.width * 0.18), Math.round(definition.width * 0.058)),
        ]
      ),
      textBlock(`“${copy.quote[languageKey]}”`, {
        fontFamily: GUIDE_BRAND_FONT_FAMILIES.display,
        fontSize: Math.max(44, Math.round(definition.width * 0.055)),
        lineHeight: 1.08,
      }),
      div(
        {
          borderTop: `1px solid ${palette.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          paddingTop: 20,
        },
        [
          textBlock(copy.quoteAttribution[languageKey], {
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.body,
            fontSize: Math.max(20, Math.round(definition.width * 0.02)),
            fontWeight: 700,
          }),
          textBlock(resolveSocialSectionLabel(request.section, request.language), {
            color: palette.muted,
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
            fontSize: Math.max(16, Math.round(definition.width * 0.014)),
            letterSpacing: Math.round(definition.width * 0.0015),
            textTransform: "uppercase",
          }),
        ]
      ),
    ]
  );
};

const renderEventInviteLayout = async (
  request: SocialRenderRequest,
  definition: SocialAssetDefinition
): Promise<SocialNode> => {
  const palette = resolveThemePalette(request.theme);
  const copy = resolveSocialPresetCopy(request.presetId);
  const languageKey = resolveGuideLocale(request.language);
  const logoAssetSrc = await getAssetDataUrl(palette.logoPath);

  return div(
    {
      alignItems: "stretch",
      backgroundColor: palette.background,
      color: palette.text,
      display: "flex",
      flexDirection: "column",
      gap: 28,
      height: "100%",
      padding: Math.max(68, Math.round(definition.width * 0.08)),
      width: "100%",
    },
    [
      div(
        {
          display: "flex",
          justifyContent: "space-between",
        },
        [
          textBlock(copy.eyebrow[languageKey], {
            color: palette.accent,
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
            fontSize: Math.max(18, Math.round(definition.width * 0.017)),
            letterSpacing: Math.round(definition.width * 0.002),
            textTransform: "uppercase",
          }),
          imageNode(logoAssetSrc, Math.round(definition.width * 0.18), Math.round(definition.width * 0.058)),
        ]
      ),
      textBlock(copy.title[languageKey], {
        fontFamily: GUIDE_BRAND_FONT_FAMILIES.display,
        fontSize: Math.max(56, Math.round(definition.width * 0.07)),
        lineHeight: 1.02,
      }),
      textBlock(copy.subtitle[languageKey], {
        color: palette.muted,
        fontFamily: GUIDE_BRAND_FONT_FAMILIES.body,
        fontSize: Math.max(22, Math.round(definition.width * 0.022)),
        lineHeight: 1.4,
      }),
      div(
        {
          display: "flex",
          flex: "1 1 0",
          width: "100%",
        },
        [renderApprovedAssetPanel(request, definition, palette)]
      ),
      textBlock(resolveSocialSectionLabel(request.section, request.language), {
        borderTop: `1px solid ${palette.border}`,
        fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
        fontSize: Math.max(16, Math.round(definition.width * 0.015)),
        letterSpacing: Math.round(definition.width * 0.0015),
        paddingTop: 18,
        textTransform: "uppercase",
      }),
    ]
  );
};

const renderCarouselFrameLayout = async (request: SocialRenderRequest, frame: number): Promise<SocialNode> => {
  const definition = SOCIAL_ASSET_DEFINITIONS["ig-post"];
  const palette = resolveThemePalette(request.theme);
  const copy = resolveSocialPresetCopy(request.presetId);
  const languageKey = resolveGuideLocale(request.language);
  const logoAssetSrc = await getAssetDataUrl(palette.logoPath);
  const frameTitle =
    frame === 1 ? copy.title[languageKey] : frame === 2 ? copy.subtitle[languageKey] : copy.quote[languageKey];

  return div(
    {
      backgroundColor: palette.background,
      color: palette.text,
      display: "flex",
      flexDirection: "column",
      gap: 20,
      height: "100%",
      padding: 72,
      width: "100%",
    },
    [
      div(
        {
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        },
        [
          textBlock(`${frame}/3`, {
            color: palette.accent,
            fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
            fontSize: 18,
            letterSpacing: 2,
          }),
          imageNode(logoAssetSrc, 160, 53),
        ]
      ),
      div(
        {
          display: "flex",
          flex: "1 1 0",
          width: "100%",
        },
        [renderApprovedAssetPanel(request, definition, palette)]
      ),
      textBlock(frameTitle, {
        fontFamily: frame === 3 ? GUIDE_BRAND_FONT_FAMILIES.display : GUIDE_BRAND_FONT_FAMILIES.identity,
        fontSize: frame === 3 ? 48 : 42,
        lineHeight: 1.08,
      }),
      textBlock(resolveSocialSectionLabel(request.section, request.language), {
        color: palette.muted,
        fontFamily: GUIDE_BRAND_FONT_FAMILIES.mono,
        fontSize: 16,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }),
    ]
  );
};

const renderSocialLayout = async (request: SocialRenderRequest): Promise<SocialNode> => {
  const definition = SOCIAL_ASSET_DEFINITIONS[request.assetKind];

  if (request.assetKind === "quote-card") {
    return renderQuoteCardLayout(request, definition);
  }

  if (request.assetKind === "event-invite") {
    return renderEventInviteLayout(request, definition);
  }

  return renderPrimaryCardLayout(request, definition);
};

/**
 * Renders one social asset to PNG bytes.
 */
export const renderSocialAssetPng = async (request: SocialRenderRequest): Promise<Uint8Array> => {
  const definition = SOCIAL_ASSET_DEFINITIONS[request.assetKind];
  const cacheKey = resolveRenderCacheKey(request);

  return resolveCachedPng(renderedAssetCache, cacheKey, async () => {
    const fonts = await getSatoriFonts();
    const rootNode = await renderSocialLayout(request);
    const svg = await satori(rootNode, {
      fonts: [...fonts],
      height: definition.height,
      width: definition.width,
    });

    return new Resvg(svg).render().asPng();
  });
};

/**
 * Renders one carousel frame to PNG bytes.
 */
export const renderSocialCarouselFramePng = async (
  request: SocialRenderRequest,
  frame: number
): Promise<Uint8Array> => {
  const definition = SOCIAL_ASSET_DEFINITIONS["ig-post"];
  const cacheKey = resolveRenderCacheKey(
    {
      ...request,
      assetKind: "ig-post",
    } satisfies SocialRenderRequest,
    frame
  );

  return resolveCachedPng(renderedCarouselCache, cacheKey, async () => {
    const fonts = await getSatoriFonts();
    const rootNode = await renderCarouselFrameLayout(request, frame);
    const svg = await satori(rootNode, {
      fonts: [...fonts],
      height: definition.height,
      width: definition.width,
    });

    return new Resvg(svg).render().asPng();
  });
};

/**
 * Builds the preview metadata consumed by the guide UI.
 */
export const resolveSocialPreviewModel = (request: SocialRenderRequest, origin = ""): SocialPreviewModel => {
  const manifest = resolveSocialPackManifest(request, origin);

  return {
    ...manifest,
    primaryAssetFileName: buildSocialAssetFileName(request),
    primaryAssetHref:
      manifest.assets.find((item) => item.kind === request.assetKind)?.href ?? manifest.assets[0]?.href ?? "",
  };
};

/**
 * Builds the attachment filename for a rendered route response.
 */
export const resolveSocialAttachmentFileName = (request: SocialRenderRequest, frame?: number): string =>
  typeof frame === "number" ? buildSocialCarouselFileName(request, frame) : buildSocialAssetFileName(request);

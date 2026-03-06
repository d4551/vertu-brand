import { Elysia, t } from "elysia";

import { GUIDE_ROUTES, GUIDE_SERVER, HTMX_REQUEST_HEADERS } from "../shared/config";
import { resolveGuideSocialQueryValues, toSocialGuideHref } from "../shared/social-toolkit";
import {
  resolveSocialAttachmentFileName,
  renderSocialAssetPng,
  renderSocialCarouselFramePng,
  resolveSocialPreviewModel,
  type SocialPreviewModel,
} from "./social-renderer";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS, isGuideSectionId, normalizeGuideLanguage } from "../shared/view-state";
import {
  APPROVED_ASSET_IDS,
  SOCIAL_ROUTE_TEMPLATES,
  SOCIAL_QUERY_PARAMS,
  type SocialAssetKind,
  SOCIAL_ASSET_KINDS,
  SOCIAL_CHANNELS,
  SOCIAL_PRESET_IDS,
  SOCIAL_THEMES,
  resolveSocialCarouselFrame,
  resolveSocialPackManifest,
  resolveSocialPackRequest,
  resolveSocialRenderRequest,
  toSocialPackHref,
  type SocialErrorEnvelope,
} from "../shared/social-toolkit";
import { renderSocialErrorState, renderSocialPreviewMarkup } from "./social-preview-markup";

const socialToolkitService = {
  renderSocialAssetPng,
  renderSocialCarouselFramePng,
  resolveSocialPackManifest,
  resolveSocialPreviewModel,
} as const;

const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeHtml = (value: string): string => escapeAttribute(value).replaceAll("'", "&#39;");

const resolveResponseEtag = (body: Uint8Array | string): string => `"${Bun.hash(body).toString(16)}"`;

const requestIncludesEtag = (request: Request, etag: string): boolean => {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (!ifNoneMatch) {
    return false;
  }

  return ifNoneMatch
    .split(",")
    .map((entry) => entry.trim())
    .some((entry) => entry === etag || entry === "*");
};

const parsePngRouteParam = (rawParam: string | undefined): string | null => {
  const value = String(rawParam ?? "").trim();
  if (!value.endsWith(".png")) {
    return null;
  }

  const base = value.slice(0, -4);
  return base ? base : null;
};

const socialErrorEnvelopeModel = t.Object({
  code: t.Literal("invalid_social_request"),
  reason: t.Union([
    t.Literal("invalid_approved_asset"),
    t.Literal("invalid_asset_for_preset"),
    t.Literal("invalid_asset_kind"),
    t.Literal("invalid_carousel_frame"),
    t.Literal("invalid_pack"),
    t.Literal("invalid_preset"),
    t.Literal("invalid_theme"),
  ]),
  value: t.String(),
});

const socialPackAssetManifestItemModel = t.Object({
  channel: t.String({ enum: SOCIAL_CHANNELS }),
  fileName: t.String(),
  height: t.Number(),
  href: t.String(),
  kind: t.String({ enum: SOCIAL_ASSET_KINDS }),
  width: t.Number(),
});

const socialCarouselFrameManifestItemModel = t.Object({
  fileName: t.String(),
  frame: t.Number(),
  height: t.Number(),
  href: t.String(),
  width: t.Number(),
});

const socialPackManifestModel = t.Object({
  approvedAssetId: t.String({ enum: APPROVED_ASSET_IDS }),
  assets: t.Array(socialPackAssetManifestItemModel),
  carouselFrames: t.Array(socialCarouselFrameManifestItemModel),
  description: t.String(),
  language: t.String({ enum: GUIDE_LANGUAGES }),
  packId: t.String({ enum: SOCIAL_PRESET_IDS }),
  presetId: t.String({ enum: SOCIAL_PRESET_IDS }),
  section: t.String({ enum: GUIDE_SECTION_IDS }),
  theme: t.String({ enum: SOCIAL_THEMES }),
  title: t.String(),
});

/**
 * Reusable Elysia plugin that owns social asset rendering and pack delivery.
 */
export const socialToolkitPlugin = new Elysia({ name: "socialToolkitPlugin" })
  .decorate("socialToolkit", socialToolkitService)
  .derive(({ request }) => ({
    requestOrigin: new URL(request.url).origin,
  }))
  .model({
    socialAssetParams: t.Object({
      presetPng: t.String(),
    }),
    socialAssetQuery: t.Object({
      [SOCIAL_QUERY_PARAMS.approvedAsset]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.asset]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.language]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.section]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.theme]: t.Optional(t.String()),
    }),
    socialCarouselParams: t.Object({
      framePng: t.String(),
      preset: t.String(),
    }),
    socialPackParams: t.Object({
      packId: t.String(),
    }),
    socialPackQuery: t.Object({
      [SOCIAL_QUERY_PARAMS.approvedAsset]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.language]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.section]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.theme]: t.Optional(t.String()),
    }),
    socialPreviewQuery: t.Object({
      [SOCIAL_QUERY_PARAMS.approvedAsset]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.asset]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.language]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.pack]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.section]: t.Optional(t.String()),
      [SOCIAL_QUERY_PARAMS.theme]: t.Optional(t.String()),
    }),
  })
  .get(
    SOCIAL_ROUTE_TEMPLATES.assetPng,
    async ({ params, query, request, set, socialToolkit }) => {
      const preset = parsePngRouteParam(params.presetPng);
      if (!preset) {
        set.status = 404;
        return {
          code: "invalid_social_request",
          reason: "invalid_preset",
          value: params.presetPng ?? "",
        } satisfies SocialErrorEnvelope;
      }

      const resolution = resolveSocialRenderRequest({
        approvedAsset: query[SOCIAL_QUERY_PARAMS.approvedAsset],
        asset: query[SOCIAL_QUERY_PARAMS.asset],
        language: normalizeGuideLanguage(query[SOCIAL_QUERY_PARAMS.language] ?? null),
        preset,
        section: query[SOCIAL_QUERY_PARAMS.section],
        theme: query[SOCIAL_QUERY_PARAMS.theme],
      });

      if (!resolution.ok) {
        set.status = 404;
        return resolution.error;
      }

      const body = await socialToolkit.renderSocialAssetPng(resolution.value);
      const etag = resolveResponseEtag(body);
      const contentDisposition = `inline; filename="${resolveSocialAttachmentFileName(resolution.value)}"`;
      const headers = {
        "Cache-Control": GUIDE_SERVER.assetCacheControl,
        "Content-Disposition": contentDisposition,
        "Content-Type": "image/png",
        ETag: etag,
      };

      if (requestIncludesEtag(request, etag)) {
        return new Response(null, {
          headers,
          status: 304,
        });
      }

      return new Response(Buffer.from(body), {
        headers,
      });
    },
    {
      params: "socialAssetParams",
      query: "socialAssetQuery",
      response: {
        404: socialErrorEnvelopeModel,
      },
    }
  )
  .get(
    SOCIAL_ROUTE_TEMPLATES.carouselPng,
    async ({ params, query, request, set, socialToolkit }) => {
      const frameValue = parsePngRouteParam(params.framePng);
      if (!frameValue) {
        set.status = 404;
        return {
          code: "invalid_social_request",
          reason: "invalid_carousel_frame",
          value: params.framePng ?? "",
        } satisfies SocialErrorEnvelope;
      }

      const requestResolution = resolveSocialRenderRequest({
        approvedAsset: query[SOCIAL_QUERY_PARAMS.approvedAsset],
        asset: "ig-post",
        language: normalizeGuideLanguage(query[SOCIAL_QUERY_PARAMS.language] ?? null),
        preset: params.preset,
        section: query[SOCIAL_QUERY_PARAMS.section],
        theme: query[SOCIAL_QUERY_PARAMS.theme],
      });

      if (!requestResolution.ok) {
        set.status = 404;
        return requestResolution.error;
      }

      const frameResolution = resolveSocialCarouselFrame(
        requestResolution.value.presetId,
        frameValue
      );
      if (!frameResolution.ok) {
        set.status = 404;
        return frameResolution.error;
      }

      const body = await socialToolkit.renderSocialCarouselFramePng(requestResolution.value, frameResolution.frame);
      const etag = resolveResponseEtag(body);
      const contentDisposition = `inline; filename="${resolveSocialAttachmentFileName(
        requestResolution.value,
        frameResolution.frame
      )}"`;
      const headers = {
        "Cache-Control": GUIDE_SERVER.assetCacheControl,
        "Content-Disposition": contentDisposition,
        "Content-Type": "image/png",
        ETag: etag,
      };

      if (requestIncludesEtag(request, etag)) {
        return new Response(null, {
          headers,
          status: 304,
        });
      }

      return new Response(Buffer.from(body), {
        headers,
      });
    },
    {
      params: "socialCarouselParams",
      query: "socialAssetQuery",
      response: {
        404: socialErrorEnvelopeModel,
      },
    }
  )
  .get(
    SOCIAL_ROUTE_TEMPLATES.packManifest,
    ({ params, query, request, requestOrigin, set, socialToolkit }) => {
      const resolution = resolveSocialPackRequest({
        approvedAsset: query[SOCIAL_QUERY_PARAMS.approvedAsset],
        language: normalizeGuideLanguage(query[SOCIAL_QUERY_PARAMS.language] ?? null),
        packId: params.packId,
        section: query[SOCIAL_QUERY_PARAMS.section],
        theme: query[SOCIAL_QUERY_PARAMS.theme],
      });

      if (!resolution.ok) {
        set.status = 404;
        return resolution.error;
      }

      const manifest = socialToolkit.resolveSocialPackManifest(resolution.value, requestOrigin);
      const manifestResponse = {
        ...manifest,
        assets: [...manifest.assets],
        carouselFrames: [...manifest.carouselFrames],
      };
      const serializedManifest = JSON.stringify(manifestResponse);
      const etag = resolveResponseEtag(serializedManifest);

      set.headers["Cache-Control"] = GUIDE_SERVER.manifestCacheControl;
      set.headers["Content-Type"] = "application/json; charset=utf-8";
      set.headers.ETag = etag;

      if (requestIncludesEtag(request, etag)) {
        return new Response(null, {
          headers: {
            "Cache-Control": GUIDE_SERVER.manifestCacheControl,
            ETag: etag,
          },
          status: 304,
        });
      }

      return manifestResponse;
    },
    {
      params: "socialPackParams",
      query: "socialPackQuery",
      response: {
        200: socialPackManifestModel,
        404: socialErrorEnvelopeModel,
      },
    }
  )
  .get(
    SOCIAL_ROUTE_TEMPLATES.preview,
    ({ query, request, requestOrigin, set, socialToolkit }) => {
      const language = normalizeGuideLanguage(query[SOCIAL_QUERY_PARAMS.language] ?? null);
      const isHtmxRequest = request.headers.get(HTMX_REQUEST_HEADERS.request) === "true";
      const section = String(query[SOCIAL_QUERY_PARAMS.section] ?? "").trim();
      const socialQuery = resolveGuideSocialQueryValues(
        new URLSearchParams({
          [SOCIAL_QUERY_PARAMS.approvedAsset]: String(query[SOCIAL_QUERY_PARAMS.approvedAsset] ?? ""),
          [SOCIAL_QUERY_PARAMS.asset]: String(query[SOCIAL_QUERY_PARAMS.asset] ?? ""),
          [SOCIAL_QUERY_PARAMS.pack]: String(query[SOCIAL_QUERY_PARAMS.pack] ?? ""),
          [SOCIAL_QUERY_PARAMS.theme]: String(query[SOCIAL_QUERY_PARAMS.theme] ?? ""),
        })
      );
      const resolution = resolveSocialRenderRequest({
        approvedAsset: query[SOCIAL_QUERY_PARAMS.approvedAsset],
        asset: query[SOCIAL_QUERY_PARAMS.asset],
        language,
        preset: query[SOCIAL_QUERY_PARAMS.pack],
        section: query[SOCIAL_QUERY_PARAMS.section],
        theme: query[SOCIAL_QUERY_PARAMS.theme],
      });

      if (!isHtmxRequest) {
        const location = toSocialGuideHref({
          approvedAssetId: socialQuery.approvedAssetId,
          assetKind: socialQuery.assetKind,
          guideTheme: query[SOCIAL_QUERY_PARAMS.theme] === "light" ? "light" : "dark",
          language,
          packId: socialQuery.packId,
          section: isGuideSectionId(section) ? section : "s0",
          socialTheme: socialQuery.socialTheme,
        });

        return new Response(null, {
          headers: {
            Location: location,
          },
          status: 302,
        });
      }

      set.headers["Content-Type"] = "text/html; charset=utf-8";

      if (!resolution.ok) {
        set.status = 404;
        return renderSocialErrorState(resolution.error, language);
      }

      const model = socialToolkit.resolveSocialPreviewModel(resolution.value, requestOrigin);
      return renderSocialPreviewMarkup(model);
    },
    {
      query: "socialPreviewQuery",
      response: {
        200: t.String(),
        404: t.String(),
      },
    }
  );

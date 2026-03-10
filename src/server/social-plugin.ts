import { Elysia, t } from "elysia";

import { GUIDE_REQUEST_ID_HEADER, GUIDE_SERVER, HTMX_REQUEST_HEADERS } from "../shared/config";
import { resolveGuideSocialQueryValues, toSocialGuideHref } from "../shared/social-toolkit";
import {
  resolveSocialAttachmentFileName,
  renderSocialAssetPng,
  renderSocialCarouselFramePng,
  resolveSocialPreviewModel,
} from "./social-renderer";
import { resolveGuideRequestId } from "./observability-plugin";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS, isGuideSectionId, normalizeGuideLanguage } from "../shared/view-state";
import {
  APPROVED_ASSET_IDS,
  SOCIAL_ROUTE_TEMPLATES,
  SOCIAL_QUERY_PARAMS,
  SOCIAL_ASSET_KINDS,
  SOCIAL_CHANNELS,
  SOCIAL_PRESET_IDS,
  SOCIAL_THEMES,
  resolveSocialCarouselFrame,
  resolveSocialPackManifest,
  resolveSocialPackRequest,
  resolveSocialRenderRequest,
  type SocialErrorEnvelope,
  type SocialPackManifest,
} from "../shared/social-toolkit";
import { renderSocialErrorState, renderSocialPreviewMarkup } from "./social-preview-markup";

const socialToolkitService = {
  renderSocialAssetPng,
  renderSocialCarouselFramePng,
  resolveSocialPackManifest,
  resolveSocialPreviewModel,
} as const;

const resolveResponseEtag = (body: Uint8Array | string): string => `"${Bun.hash(body).toString(16)}"`;

const resolveSocialResponseHeaders = (request: Request, headers: Record<string, string>): Record<string, string> => ({
  ...headers,
  [GUIDE_REQUEST_ID_HEADER]: resolveGuideRequestId(request),
});

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

const buildSocialErrorResponse = (request: Request, error: SocialErrorEnvelope): Response =>
  Response.json(error, {
    headers: resolveSocialResponseHeaders(request, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    }),
    status: 404,
  });

const buildConditionalBinaryResponse = (request: Request, body: Uint8Array, contentDisposition: string): Response => {
  const etag = resolveResponseEtag(body);
  const responseHeaders = resolveSocialResponseHeaders(request, {
    "Cache-Control": GUIDE_SERVER.assetCacheControl,
    "Content-Disposition": contentDisposition,
    "Content-Type": "image/png",
    ETag: etag,
  });

  if (requestIncludesEtag(request, etag)) {
    return new Response(null, {
      headers: responseHeaders,
      status: 304,
    });
  }

  return new Response(Buffer.from(body), {
    headers: responseHeaders,
  });
};

const buildConditionalManifestResponse = (request: Request, manifest: SocialPackManifest): Response => {
  const serializedManifest = JSON.stringify(manifest);
  const etag = resolveResponseEtag(serializedManifest);
  const responseHeaders = resolveSocialResponseHeaders(request, {
    "Cache-Control": GUIDE_SERVER.manifestCacheControl,
    "Content-Type": "application/json; charset=utf-8",
    ETag: etag,
  });

  if (requestIncludesEtag(request, etag)) {
    return new Response(null, {
      headers: responseHeaders,
      status: 304,
    });
  }

  return new Response(serializedManifest, {
    headers: responseHeaders,
  });
};

const buildSocialHtmlResponse = (request: Request, html: string, status = 200): Response =>
  new Response(html, {
    headers: resolveSocialResponseHeaders(request, {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    }),
    status,
  });

const buildSocialRedirectResponse = (request: Request, location: string): Response =>
  new Response(null, {
    headers: resolveSocialResponseHeaders(request, {
      Location: location,
    }),
    status: 302,
  });

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
    async ({ params, query, request, socialToolkit }) => {
      const preset = parsePngRouteParam(params.presetPng);
      if (!preset) {
        return buildSocialErrorResponse(request, {
          code: "invalid_social_request",
          reason: "invalid_preset",
          value: params.presetPng ?? "",
        });
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
        return buildSocialErrorResponse(request, resolution.error);
      }

      const body = await socialToolkit.renderSocialAssetPng(resolution.value);
      return buildConditionalBinaryResponse(
        request,
        body,
        `inline; filename="${resolveSocialAttachmentFileName(resolution.value)}"`
      );
    },
    {
      params: "socialAssetParams",
      query: "socialAssetQuery",
      response: {
        200: t.File(),
        404: socialErrorEnvelopeModel,
      },
    }
  )
  .get(
    SOCIAL_ROUTE_TEMPLATES.carouselPng,
    async ({ params, query, request, socialToolkit }) => {
      const frameValue = parsePngRouteParam(params.framePng);
      if (!frameValue) {
        return buildSocialErrorResponse(request, {
          code: "invalid_social_request",
          reason: "invalid_carousel_frame",
          value: params.framePng ?? "",
        });
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
        return buildSocialErrorResponse(request, requestResolution.error);
      }

      const frameResolution = resolveSocialCarouselFrame(requestResolution.value.presetId, frameValue);
      if (!frameResolution.ok) {
        return buildSocialErrorResponse(request, frameResolution.error);
      }

      const body = await socialToolkit.renderSocialCarouselFramePng(requestResolution.value, frameResolution.frame);
      return buildConditionalBinaryResponse(
        request,
        body,
        `inline; filename="${resolveSocialAttachmentFileName(requestResolution.value, frameResolution.frame)}"`
      );
    },
    {
      params: "socialCarouselParams",
      query: "socialAssetQuery",
      response: {
        200: t.File(),
        404: socialErrorEnvelopeModel,
      },
    }
  )
  .get(
    SOCIAL_ROUTE_TEMPLATES.packManifest,
    ({ params, query, request, requestOrigin, socialToolkit }) => {
      const resolution = resolveSocialPackRequest({
        approvedAsset: query[SOCIAL_QUERY_PARAMS.approvedAsset],
        language: normalizeGuideLanguage(query[SOCIAL_QUERY_PARAMS.language] ?? null),
        packId: params.packId,
        section: query[SOCIAL_QUERY_PARAMS.section],
        theme: query[SOCIAL_QUERY_PARAMS.theme],
      });

      if (!resolution.ok) {
        return buildSocialErrorResponse(request, resolution.error);
      }

      const manifest = socialToolkit.resolveSocialPackManifest(resolution.value, requestOrigin);
      const manifestResponse = {
        ...manifest,
        assets: [...manifest.assets],
        carouselFrames: [...manifest.carouselFrames],
      };
      return buildConditionalManifestResponse(request, manifestResponse);
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
    ({ query, request, requestOrigin, socialToolkit }) => {
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

        return buildSocialRedirectResponse(request, location);
      }

      if (!resolution.ok) {
        return buildSocialHtmlResponse(request, renderSocialErrorState(resolution.error, language), 404);
      }

      const model = socialToolkit.resolveSocialPreviewModel(resolution.value, requestOrigin);
      return buildSocialHtmlResponse(request, renderSocialPreviewMarkup(model));
    },
    {
      query: "socialPreviewQuery",
      response: {
        200: t.String(),
        404: t.String(),
      },
    }
  );

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";

import { app } from "../src/server/app";
import {
  buildSocialAssetFileName,
  buildSocialCarouselFileName,
  buildSocialStaticAssetPath,
  buildSocialStaticCarouselPath,
  resolveCanonicalSocialBuildRequests,
  resolveSocialCarouselFrame,
  resolveSocialPackManifest,
  resolveSocialPackRequest,
  resolveSocialRenderRequest,
  SOCIAL_ASSET_DEFINITIONS,
  SOCIAL_GUIDE_QUERY_PARAMS,
  SOCIAL_PRESET_IDS,
  SOCIAL_PRESET_REGISTRY,
  SOCIAL_QUERY_PARAMS,
  toSocialGuideHref,
  type SocialRenderRequest,
} from "../src/shared/social-toolkit";
import {
  GUIDE_REQUEST_ID_HEADER,
  GUIDE_ROUTES,
  GUIDE_SERVER,
  HTMX_REQUEST_HEADERS,
  toGuideRequestUrl,
} from "../src/shared/config";
import { GUIDE_PATHS } from "../src/server/runtime-config";

const launchRequest: SocialRenderRequest = {
  approvedAssetId: "agent-q",
  assetKind: "og-card",
  language: "en",
  packId: "campaign-launch",
  presetId: "campaign-launch",
  section: "s6",
  theme: "dark",
};

/**
 * Builds a canonical social asset path with optional query overrides.
 */
const buildSocialAssetPath = (
  overrides: Partial<{
    approvedAsset: string;
    asset: string;
    lang: string;
    preset: string;
    section: string;
    theme: string;
  }> = {}
): string => {
  const preset = overrides.preset ?? launchRequest.presetId;
  const url = new URL(`${GUIDE_ROUTES.socialAsset}/${preset}.png`, GUIDE_SERVER.localOrigin);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.asset, overrides.asset ?? launchRequest.assetKind);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, overrides.approvedAsset ?? launchRequest.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, overrides.lang ?? launchRequest.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, overrides.section ?? launchRequest.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, overrides.theme ?? launchRequest.theme);
  return `${url.pathname}${url.search}`;
};

/**
 * Builds a canonical social carousel frame path with optional query overrides.
 */
const buildSocialCarouselPath = (
  frame: number,
  overrides: Partial<{
    approvedAsset: string;
    lang: string;
    preset: string;
    section: string;
    theme: string;
  }> = {}
): string => {
  const preset = overrides.preset ?? launchRequest.presetId;
  const url = new URL(`${GUIDE_ROUTES.socialAsset}/carousel/${preset}/${frame}.png`, GUIDE_SERVER.localOrigin);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, overrides.approvedAsset ?? launchRequest.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, overrides.lang ?? launchRequest.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, overrides.section ?? launchRequest.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, overrides.theme ?? launchRequest.theme);
  return `${url.pathname}${url.search}`;
};

/**
 * Builds a canonical social manifest path with optional query overrides.
 */
const buildSocialPackPath = (
  overrides: Partial<{
    approvedAsset: string;
    asset: string;
    lang: string;
    packId: string;
    section: string;
    theme: string;
  }> = {}
): string => {
  const packId = overrides.packId ?? launchRequest.packId;
  const url = new URL(`${GUIDE_ROUTES.socialPack}/${packId}`, GUIDE_SERVER.localOrigin);
  if (overrides.asset) {
    url.searchParams.set(SOCIAL_QUERY_PARAMS.asset, overrides.asset);
  }
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, overrides.approvedAsset ?? launchRequest.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, overrides.lang ?? launchRequest.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, overrides.section ?? launchRequest.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, overrides.theme ?? launchRequest.theme);
  return `${url.pathname}${url.search}`;
};

/**
 * Builds a canonical social preview path with optional query overrides.
 */
const buildSocialPreviewPath = (
  overrides: Partial<{
    approvedAsset: string;
    asset: string;
    lang: string;
    pack: string;
    section: string;
    theme: string;
  }> = {}
): string => {
  const url = new URL(GUIDE_ROUTES.socialPreview, GUIDE_SERVER.localOrigin);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.pack, overrides.pack ?? launchRequest.packId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.asset, overrides.asset ?? launchRequest.assetKind);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.approvedAsset, overrides.approvedAsset ?? launchRequest.approvedAssetId);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.language, overrides.lang ?? launchRequest.language);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.section, overrides.section ?? launchRequest.section);
  url.searchParams.set(SOCIAL_QUERY_PARAMS.theme, overrides.theme ?? launchRequest.theme);
  return `${url.pathname}${url.search}`;
};

describe("social toolkit contracts", () => {
  test("keeps every preset bounded to declared assets and carousel frames", () => {
    SOCIAL_PRESET_IDS.forEach((presetId) => {
      const preset = SOCIAL_PRESET_REGISTRY[presetId];

      expect(preset.assetKinds.length).toBeGreaterThan(0);
      expect(preset.carouselFrames.length).toBe(3);
      preset.assetKinds.forEach((assetKind) => {
        expect(SOCIAL_ASSET_DEFINITIONS[assetKind]).toBeDefined();
      });
    });
  });

  test("normalizes valid social render requests and rejects invalid inputs deterministically", () => {
    const valid = resolveSocialRenderRequest({
      approvedAsset: "agent-q",
      asset: "og-card",
      language: "en",
      preset: "campaign-launch",
      section: "s6",
      theme: "dark",
    });
    const invalid = resolveSocialRenderRequest({
      approvedAsset: "agent-q",
      asset: "og-card",
      language: "en",
      preset: "nope",
      section: "s6",
      theme: "dark",
    });
    const invalidTheme = resolveSocialRenderRequest({
      approvedAsset: "agent-q",
      asset: "og-card",
      language: "en",
      preset: "campaign-launch",
      section: "s6",
      theme: "nope",
    });
    const invalidApprovedAsset = resolveSocialRenderRequest({
      approvedAsset: "nope",
      asset: "og-card",
      language: "en",
      preset: "campaign-launch",
      section: "s6",
      theme: "dark",
    });
    const invalidAssetForPreset = resolveSocialRenderRequest({
      approvedAsset: "agent-q",
      asset: "event-invite",
      language: "en",
      preset: "campaign-launch",
      section: "s6",
      theme: "dark",
    });

    expect(valid.ok).toBe(true);
    expect(valid.ok && valid.value.packId).toBe("campaign-launch");
    expect(invalid.ok).toBe(false);
    expect(!invalid.ok && invalid.error.reason).toBe("invalid_preset");
    expect(invalidTheme.ok).toBe(false);
    expect(!invalidTheme.ok && invalidTheme.error.reason).toBe("invalid_theme");
    expect(invalidApprovedAsset.ok).toBe(false);
    expect(!invalidApprovedAsset.ok && invalidApprovedAsset.error.reason).toBe("invalid_approved_asset");
    expect(invalidAssetForPreset.ok).toBe(false);
    expect(!invalidAssetForPreset.ok && invalidAssetForPreset.error.reason).toBe("invalid_asset_for_preset");
  });

  test("normalizes pack requests and emits pack-specific errors", () => {
    const valid = resolveSocialPackRequest({
      approvedAsset: "agent-q",
      language: "en",
      packId: "campaign-launch",
      section: "s6",
      theme: "dark",
    });
    const invalid = resolveSocialPackRequest({
      approvedAsset: "agent-q",
      language: "en",
      packId: "nope",
      section: "s6",
      theme: "dark",
    });

    expect(valid.ok).toBe(true);
    expect(valid.ok && valid.value.packId).toBe("campaign-launch");
    expect(invalid.ok).toBe(false);
    expect(!invalid.ok && invalid.error.reason).toBe("invalid_pack");
  });

  test("normalizes carousel frames with a typed error envelope", () => {
    const valid = resolveSocialCarouselFrame("campaign-launch", "2");
    const invalid = resolveSocialCarouselFrame("campaign-launch", "9");

    expect(valid.ok).toBe(true);
    expect(valid.ok && valid.frame).toBe(2);
    expect(invalid.ok).toBe(false);
    expect(!invalid.ok && invalid.error.reason).toBe("invalid_carousel_frame");
  });

  test("builds pack manifests with bounded asset and carousel urls", () => {
    const manifest = resolveSocialPackManifest(launchRequest, "https://vertu.example");

    expect(manifest.packId).toBe("campaign-launch");
    expect(manifest.assets.some((asset) => asset.kind === "og-card")).toBe(true);
    expect(
      manifest.assets.every((asset) => asset.href.startsWith(`https://vertu.example${GUIDE_ROUTES.socialAsset}/`))
    ).toBe(true);
    expect(manifest.carouselFrames).toHaveLength(3);
    expect(manifest.carouselFrames[0]?.href).toContain(`${GUIDE_ROUTES.socialAsset}/carousel/campaign-launch/1.png`);
  });

  test("keeps guide navigation state in query parameters without section hashes", () => {
    const href = toSocialGuideHref({
      approvedAssetId: "agent-q",
      assetKind: "og-card",
      guideTheme: "dark",
      language: "en",
      packId: "campaign-launch",
      section: "s6",
      socialTheme: "dark",
    });

    expect(href).toBe(
      `/?section=s6&lang=en&theme=dark&${SOCIAL_GUIDE_QUERY_PARAMS.pack}=campaign-launch&${SOCIAL_GUIDE_QUERY_PARAMS.asset}=og-card&${SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset}=agent-q&${SOCIAL_GUIDE_QUERY_PARAMS.theme}=dark`
    );
    expect(href.includes("#")).toBe(false);
  });

  test("writes canonical social build artifacts into the generated public surface", () => {
    const requests = resolveCanonicalSocialBuildRequests();
    const canonicalRequest = requests.find(
      (request) =>
        request.packId === "campaign-launch" &&
        request.assetKind === "og-card" &&
        request.language === "zh" &&
        request.theme === "gold" &&
        request.section === "s6"
    );

    expect(requests.some((request) => request.language === "zh")).toBe(true);
    expect(requests.some((request) => request.section === "s15")).toBe(true);
    expect(canonicalRequest).toBeDefined();
    expect(
      canonicalRequest
        ? existsSync(`${GUIDE_PATHS.socialPublicOutputRoot}/${buildSocialStaticAssetPath(canonicalRequest)}`)
        : false
    ).toBe(true);
    expect(
      canonicalRequest
        ? existsSync(`${GUIDE_PATHS.socialPublicOutputRoot}/${buildSocialStaticCarouselPath(canonicalRequest, 1)}`)
        : false
    ).toBe(true);
    expect(
      canonicalRequest
        ? existsSync(
            `${GUIDE_PATHS.socialManifestOutputRoot}/${canonicalRequest.packId}-${canonicalRequest.language}-${canonicalRequest.theme}-${canonicalRequest.section}.json`
          )
        : false
    ).toBe(true);
    expect(canonicalRequest ? buildSocialAssetFileName(canonicalRequest) : "").toContain("campaign-launch");
    expect(canonicalRequest ? buildSocialCarouselFileName(canonicalRequest, 1) : "").toContain("frame-1");
  });
});

describe("social toolkit routes", () => {
  test("embeds section-aware social metadata into the SSR document head", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s6&lang=en&theme=dark")));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('property="og:image"');
    expect(html).toContain(`${GUIDE_ROUTES.socialAsset}/campaign-launch.png`);
    expect(html).toContain('name="twitter:image"');
  });

  test("renders bounded PNG assets through the app route surface", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl(buildSocialAssetPath())));
    const buffer = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect(response.headers.get("cache-control")).toContain("max-age");
    expect(response.headers.get("etag")).toBeTruthy();
    expect(response.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(buffer[0]).toBe(137);
    expect(buffer[1]).toBe(80);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  test("returns HTTP 304 when the social asset ETag matches", async () => {
    const firstResponse = await app.handle(new Request(toGuideRequestUrl(buildSocialAssetPath())));
    const etag = firstResponse.headers.get("etag") ?? "";

    const secondResponse = await app.handle(
      new Request(toGuideRequestUrl(buildSocialAssetPath()), {
        headers: {
          "if-none-match": etag,
        },
      })
    );

    expect(firstResponse.status).toBe(200);
    expect(etag).toBeTruthy();
    expect(secondResponse.status).toBe(304);
    expect(secondResponse.headers.get("etag")).toBe(etag);
    expect(secondResponse.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
  });

  test("renders carousel frames and rejects invalid frame ids deterministically", async () => {
    const valid = await app.handle(new Request(toGuideRequestUrl(buildSocialCarouselPath(1))));
    const invalid = await app.handle(new Request(toGuideRequestUrl(buildSocialCarouselPath(99))));

    expect(valid.status).toBe(200);
    expect(valid.headers.get("content-type")).toContain("image/png");
    expect(valid.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(invalid.status).toBe(404);
    expect(invalid.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(await invalid.json()).toEqual({
      code: "invalid_social_request",
      reason: "invalid_carousel_frame",
      value: "99",
    });
  });

  test("serves JSON pack manifests and HTMX preview fragments", async () => {
    const manifestResponse = await app.handle(new Request(toGuideRequestUrl(buildSocialPackPath())));
    const manifestWithAssetResponse = await app.handle(
      new Request(toGuideRequestUrl(buildSocialPackPath({ asset: "event-invite" })))
    );
    const previewResponse = await app.handle(
      new Request(toGuideRequestUrl(buildSocialPreviewPath()), {
        headers: {
          [HTMX_REQUEST_HEADERS.request]: "true",
        },
      })
    );

    const manifest = await manifestResponse.json();
    const manifestWithAsset = await manifestWithAssetResponse.json();
    const previewMarkup = await previewResponse.text();

    expect(manifestResponse.status).toBe(200);
    expect(manifestWithAssetResponse.status).toBe(200);
    expect(manifestResponse.headers.get("content-type")).toContain("application/json");
    expect(manifestResponse.headers.get("etag")).toBeTruthy();
    expect(manifestResponse.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(manifest.packId).toBe("campaign-launch");
    expect(manifestWithAsset.packId).toBe("campaign-launch");
    expect(manifest.assets.length).toBeGreaterThan(3);
    expect("primaryAssetHref" in manifest).toBe(false);
    expect("primaryAssetFileName" in manifest).toBe(false);
    expect("carouselHeading" in manifest).toBe(false);

    expect(previewResponse.status).toBe(200);
    expect(previewResponse.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(previewMarkup).toContain('data-social-state="success"');
    expect(previewMarkup).toContain("campaign-launch");
    expect(previewMarkup).toContain("Download Manifest");
    expect(previewMarkup.startsWith("<!DOCTYPE html>")).toBe(false);
  });

  test("redirects direct social preview navigation back into the integrated guide route", async () => {
    const previewResponse = await app.handle(new Request(toGuideRequestUrl(buildSocialPreviewPath())));

    expect(previewResponse.status).toBe(302);
    expect(previewResponse.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(previewResponse.headers.get("location")).toBe(
      `/?section=s6&lang=en&theme=dark&${SOCIAL_GUIDE_QUERY_PARAMS.pack}=campaign-launch&${SOCIAL_GUIDE_QUERY_PARAMS.asset}=og-card&${SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset}=agent-q&${SOCIAL_GUIDE_QUERY_PARAMS.theme}=dark`
    );
  });

  test("renders social preview copy in bilingual mode without losing aria labels", async () => {
    const previewResponse = await app.handle(
      new Request(toGuideRequestUrl(buildSocialPreviewPath({ lang: "bi" })), {
        headers: {
          [HTMX_REQUEST_HEADERS.request]: "true",
        },
      })
    );
    const previewMarkup = await previewResponse.text();

    expect(previewResponse.status).toBe(200);
    expect(previewMarkup).toContain(
      '<span data-lang-en="" class="guide-copy-en" lang="en">Download Manifest</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">下载清单</span>'
    );
    expect(previewMarkup).toContain(
      '<span data-lang-en="" class="guide-copy-en" lang="en">Frame 1</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">轮播页 1</span>'
    );
    expect(previewMarkup).toContain(
      '<span data-lang-en="" class="guide-copy-en" lang="en">Open Graph Card</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">Open Graph 卡片</span>'
    );
    expect(previewMarkup).toContain(
      '<span data-lang-en="" class="guide-copy-en" lang="en">Preview</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">预览</span>'
    );
    expect(previewMarkup).toContain('aria-label="Preview carousel frame 1 · 预览轮播帧 1"');
  });

  test("renders localized reason labels in social preview error fragments", async () => {
    const zhErrorResponse = await app.handle(
      new Request(toGuideRequestUrl(buildSocialPreviewPath({ lang: "zh", theme: "bad" })), {
        headers: {
          [HTMX_REQUEST_HEADERS.request]: "true",
        },
      })
    );
    const zhErrorMarkup = await zhErrorResponse.text();

    expect(zhErrorResponse.status).toBe(404);
    expect(zhErrorResponse.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(zhErrorMarkup).toContain("主题无效");
    expect(zhErrorMarkup).not.toContain("invalid_theme");
  });

  test("returns HTTP 304 when the manifest ETag matches", async () => {
    const manifestPath = buildSocialPackPath();
    const firstResponse = await app.handle(new Request(toGuideRequestUrl(manifestPath)));
    const etag = firstResponse.headers.get("etag") ?? "";

    const secondResponse = await app.handle(
      new Request(toGuideRequestUrl(manifestPath), {
        headers: {
          "if-none-match": etag,
        },
      })
    );

    expect(firstResponse.status).toBe(200);
    expect(etag).toBeTruthy();
    expect(secondResponse.status).toBe(304);
    expect(secondResponse.headers.get("etag")).toBe(etag);
    expect(secondResponse.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
  });

  test("rejects invalid social route inputs with deterministic error envelopes", async () => {
    const invalidTheme = await app.handle(new Request(toGuideRequestUrl(buildSocialAssetPath({ theme: "nope" }))));
    const invalidApprovedAsset = await app.handle(
      new Request(toGuideRequestUrl(buildSocialAssetPath({ approvedAsset: "nope" })))
    );
    const invalidAssetForPreset = await app.handle(
      new Request(
        toGuideRequestUrl(
          buildSocialAssetPath({
            approvedAsset: "quantum-flip",
            asset: "docs-header",
            preset: "campaign-event",
            section: "s15",
            theme: "gold",
          })
        )
      )
    );
    const invalidPack = await app.handle(new Request(toGuideRequestUrl(buildSocialPackPath({ packId: "nope" }))));

    expect(invalidTheme.status).toBe(404);
    expect(invalidTheme.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(await invalidTheme.json()).toEqual({
      code: "invalid_social_request",
      reason: "invalid_theme",
      value: "nope",
    });

    expect(invalidApprovedAsset.status).toBe(404);
    expect(invalidApprovedAsset.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(await invalidApprovedAsset.json()).toEqual({
      code: "invalid_social_request",
      reason: "invalid_approved_asset",
      value: "nope",
    });

    expect(invalidAssetForPreset.status).toBe(404);
    expect(invalidAssetForPreset.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(await invalidAssetForPreset.json()).toEqual({
      code: "invalid_social_request",
      reason: "invalid_asset_for_preset",
      value: "docs-header",
    });

    expect(invalidPack.status).toBe(404);
    expect(invalidPack.headers.get(GUIDE_REQUEST_ID_HEADER)).toBeString();
    expect(await invalidPack.json()).toEqual({
      code: "invalid_social_request",
      reason: "invalid_pack",
      value: "nope",
    });
  });
});

import { GUIDE_ASSET_OPERATOR_IDS } from "../shared/asset-operator-contract";
import { renderLocalizedSpans, renderVisibleCopy, resolveCopy, type UI_COPY } from "../shared/i18n";
import {
  normalizeGuideSocialPreviewState,
  resolveSocialRenderRequest,
  resolveGuideSocialQueryValues,
  resolveSocialPresetCopy,
  toSocialPackHref,
  type SocialAssetKind,
  type SocialErrorEnvelope,
  type GuideSocialPreviewState,
  type SocialPackId,
  type SocialGuideQueryValues,
  type SocialTheme,
} from "../shared/social-toolkit";
import type { GuideLanguage, GuideSectionId } from "../shared/view-state";
import { resolveSocialPreviewModel, type SocialPreviewModel } from "./social-renderer";

/**
 * Embedded social preview state resolved for the main guide route.
 */
export interface GuideSocialPreviewRenderModel {
  formValues: SocialGuideQueryValues;
  previewMarkup: string | null;
  previewState: GuideSocialPreviewState;
}

const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeHtml = (value: string): string => escapeAttribute(value).replaceAll("'", "&#39;");

const renderLocalizedValue = (copy: { en: string; zh: string }, language: GuideLanguage): string =>
  language === "bi"
    ? renderLocalizedSpans({
        en: escapeHtml(copy.en),
        zh: escapeHtml(copy.zh),
      })
    : escapeHtml(language === "zh" ? copy.zh : copy.en);

const resolveSocialErrorReasonLabel = (reason: SocialErrorEnvelope["reason"], language: GuideLanguage): string => {
  const reasonCopyKey = {
    invalid_approved_asset: "socialToolkitReasonInvalidApprovedAsset",
    invalid_asset_for_preset: "socialToolkitReasonInvalidAssetForPreset",
    invalid_asset_kind: "socialToolkitReasonInvalidAssetKind",
    invalid_carousel_frame: "socialToolkitReasonInvalidCarouselFrame",
    invalid_pack: "socialToolkitReasonInvalidPack",
    invalid_preset: "socialToolkitReasonInvalidPreset",
    invalid_theme: "socialToolkitReasonInvalidTheme",
  } as const;

  return resolveCopy(reasonCopyKey[reason], language);
};

const ASSET_KIND_COPY_KEYS = {
  "announcement-card": "socialAssetKindAnnouncement",
  "docs-header": "socialAssetKindDocsHeader",
  "event-invite": "socialAssetKindEventInvite",
  "ig-post": "socialAssetKindIgPost",
  "ig-story": "socialAssetKindIgStory",
  "linkedin-post": "socialAssetKindLinkedin",
  "og-card": "socialAssetKindOgCard",
  "quote-card": "socialAssetKindQuote",
  "x-header": "socialAssetKindXHeader",
} as const satisfies Record<SocialAssetKind, keyof typeof UI_COPY>;

const resolveAssetKindCopyKey = (assetKind: SocialAssetKind): keyof typeof UI_COPY => ASSET_KIND_COPY_KEYS[assetKind];

const renderVisibleAssetKindLabel = (assetKind: SocialAssetKind, language: GuideLanguage): string =>
  renderVisibleCopy(resolveAssetKindCopyKey(assetKind), language);

const resolveAssetDownloadAriaLabel = (assetKind: SocialAssetKind, language: GuideLanguage): string =>
  resolveCopy("socialToolkitLabelDownloadAssetAria", language, {
    asset: resolveCopy(resolveAssetKindCopyKey(assetKind), language),
  });

const resolveCarouselPreviewAriaLabel = (frame: number, language: GuideLanguage): string =>
  resolveCopy("socialToolkitLabelPreviewFrameAria", language, { frame: String(frame) });

const resolveCarouselDownloadAriaLabel = (frame: number, language: GuideLanguage): string =>
  resolveCopy("socialToolkitLabelDownloadFrameAria", language, { frame: String(frame) });

/**
 * Renders a deterministic localized error fragment for invalid social requests.
 */
export const renderSocialErrorState = (error: SocialErrorEnvelope, language: GuideLanguage): string => {
  const bodyCopy = {
    en: resolveCopy("socialToolkitErrorBody", "en", {
      reason: resolveSocialErrorReasonLabel(error.reason, "en"),
      value: error.value || resolveCopy("socialToolkitErrorMissingValue", "en"),
    }),
    zh: resolveCopy("socialToolkitErrorBody", "zh", {
      reason: resolveSocialErrorReasonLabel(error.reason, "zh"),
      value: error.value || resolveCopy("socialToolkitErrorMissingValue", "zh"),
    }),
  };

  return [
    `<div class="alert alert-error social-preview-feedback" data-social-state="error" role="alert">`,
    `  <div class="social-preview-feedback__body">`,
    `    <p class="social-preview-feedback__title">${renderVisibleCopy("socialToolkitErrorTitle", language)}</p>`,
    `    <p class="social-preview-feedback__copy">${renderLocalizedValue(bodyCopy, language)}</p>`,
    `  </div>`,
    `</div>`,
  ].join("\n");
};

/**
 * Renders the integrated campaign toolkit preview fragment.
 */
export const renderSocialPreviewMarkup = (model: SocialPreviewModel): string => {
  const language = model.language;
  const presetCopy = resolveSocialPresetCopy(model.presetId);
  const manifestHref = toSocialPackHref(
    {
      approvedAssetId: model.approvedAssetId,
      language: model.language,
      packId: model.packId,
      section: model.section,
      theme: model.theme,
    },
    ""
  );
  const packLabel = resolveCopy("socialToolkitLabelCampaignPack", language);
  const downloadVisibleLabel = renderVisibleCopy("socialToolkitLabelDownload", language);
  const previewVisibleLabel = renderVisibleCopy("socialToolkitLabelPreview", language);
  const stepLabelKeys = [
    "socialToolkitLabelStepSelect",
    "socialToolkitLabelStepReview",
    "socialToolkitLabelStepExport",
  ] as const;
  const manifestLabel = resolveCopy("socialToolkitLabelDownloadManifest", language);
  const tableCaption = resolveCopy("socialToolkitAssetsTableCaption", language);
  const state = resolveGuideSocialPreviewState(model);

  return [
    `<div class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" data-social-state="${state}">`,
    `  <section class="card bg-base-200 border border-base-300 shadow-sm social-preview-shell">`,
    `    <div class="card-body social-preview-shell__body">`,
    `      <header class="social-preview-header">`,
    `        <div class="social-preview-header__copy">`,
    `          <p class="social-preview-eyebrow">${renderVisibleCopy("socialToolkitLabelCampaignPack", language)}</p>`,
    `          <h3 class="card-title social-preview-title">${renderLocalizedValue(presetCopy.title, language)}</h3>`,
    `          <p class="social-preview-description">${renderLocalizedValue(presetCopy.description, language)}</p>`,
    `        </div>`,
    `        <div class="social-preview-actions">`,
    `          <a class="btn btn-sm btn-outline social-preview-action" href="${escapeAttribute(manifestHref)}" download="VERTU-${escapeAttribute(
      model.packId
    )}.json" aria-label="${escapeAttribute(manifestLabel)}">${renderVisibleCopy("socialToolkitLabelDownloadManifest", language)}</a>`,
    `        </div>`,
    `      </header>`,
    `      <ol class="social-preview-steps" aria-label="${escapeAttribute(packLabel)}">${stepLabelKeys
      .map(
        (key, index) =>
          `<li class="social-preview-step"><span class="social-preview-step__count">${index + 1}</span><span class="social-preview-step__label">${renderVisibleCopy(
            key,
            language
          )}</span></li>`
      )
      .join("")}</ol>`,
    `      <div class="social-preview-media rounded-box border border-base-300 bg-base-100 p-3 sm:p-4">`,
    `        <img src="${escapeAttribute(model.primaryAssetHref)}" alt="${escapeAttribute(model.title)}" class="block h-auto w-full" loading="lazy">`,
    `      </div>`,
    `    </div>`,
    `  </section>`,
    `  <section class="card bg-base-200 border border-base-300 shadow-sm social-preview-assets">`,
    `    <div class="card-body gap-5">`,
    `      <div class="social-preview-assets__header">`,
    `        <div>`,
    `          <p class="social-preview-eyebrow">${renderVisibleCopy("socialToolkitLabelSingleAssets", language)}</p>`,
    `          <h3 class="card-title social-preview-assets__title">${escapeHtml(model.primaryAssetFileName)}</h3>`,
    `        </div>`,
    `      </div>`,
    model.assets.length
      ? [
          `      <div class="social-preview-table-wrap">`,
          `        <table class="table table-zebra table-sm social-preview-table">`,
          `          <caption class="sr-only">${escapeHtml(tableCaption)}</caption>`,
          `          <thead><tr><th scope="col">${renderVisibleCopy("socialToolkitLabelSingleAssets", language)}</th><th scope="col">${renderVisibleCopy(
            "socialToolkitLabelDimensions",
            language
          )}</th><th scope="col" class="text-right">${renderVisibleCopy("socialToolkitLabelDownload", language)}</th></tr></thead>`,
          `          <tbody>${model.assets
            .map(
              (asset) =>
                `<tr><td><p class="font-semibold">${renderVisibleAssetKindLabel(asset.kind, language)}</p><p class="text-xs text-base-content/60">${escapeHtml(
                  asset.fileName
                )}</p></td><td class="font-mono text-xs">${asset.width}×${asset.height}</td><td class="text-right"><a class="btn btn-xs btn-outline" href="${escapeAttribute(
                  asset.href
                )}" download="${escapeAttribute(asset.fileName)}" aria-label="${escapeAttribute(resolveAssetDownloadAriaLabel(
                  asset.kind,
                  language
                ))}">${downloadVisibleLabel}</a></td></tr>`
            )
            .join("")}</tbody>`,
          `        </table>`,
          `      </div>`,
          `      <div class="social-preview-card-list">${model.assets
            .map(
              (asset) =>
                `<article class="social-preview-asset-card"><div class="social-preview-asset-card__copy"><p class="social-preview-asset-card__label">${renderVisibleAssetKindLabel(
                  asset.kind,
                  language
                )}</p><p class="social-preview-asset-card__file">${escapeHtml(
                  asset.fileName
                )}</p></div><div class="social-preview-asset-card__meta"><span class="social-preview-asset-card__ratio">${
                  asset.width
                }×${asset.height}</span><a class="btn btn-sm btn-outline" href="${escapeAttribute(
                  asset.href
                )}" download="${escapeAttribute(asset.fileName)}" aria-label="${escapeAttribute(resolveAssetDownloadAriaLabel(
                  asset.kind,
                  language
                ))}">${downloadVisibleLabel}</a></div></article>`
            )
            .join("")}</div>`,
        ].join("\n")
      : `      <div class="alert alert-info social-preview-feedback"><span>${renderVisibleCopy("socialToolkitLabelNoAssets", language)}</span></div>`,
    model.carouselFrames.length
      ? `      <div class="social-preview-carousel"><div class="divider">${renderVisibleCopy(
          "socialToolkitLabelCarouselFrames",
          language
        )}</div><div class="social-preview-carousel__grid">${model.carouselFrames
          .map(
            (frame) =>
              `<article class="social-preview-carousel__card"><p class="social-preview-carousel__label">${renderLocalizedValue(
                {
                  en: `${resolveCopy("socialToolkitLabelFrame", "en")} ${frame.frame}`,
                  zh: `${resolveCopy("socialToolkitLabelFrame", "zh")} ${frame.frame}`,
                },
                language
              )}</p><p class="social-preview-carousel__ratio">${frame.width}×${frame.height}</p><div class="social-preview-carousel__actions"><a class="btn btn-xs btn-outline" href="${escapeAttribute(
                frame.href
              )}" target="_blank" rel="noopener" aria-label="${escapeAttribute(resolveCarouselPreviewAriaLabel(
                frame.frame,
                language
              ))}">${previewVisibleLabel}</a><a class="btn btn-xs btn-neutral" href="${escapeAttribute(
                frame.href
              )}" download="${escapeAttribute(frame.fileName)}" aria-label="${escapeAttribute(resolveCarouselDownloadAriaLabel(
                frame.frame,
                language
              ))}">${downloadVisibleLabel}</a></div></article>`
          )
          .join("")}</div></div>`
      : "",
    `    </div>`,
    `  </section>`,
    `</div>`,
  ].join("\n");
};

/**
 * Resolves the embedded preview panel state from a typed preview model.
 */
export const resolveGuideSocialPreviewState = (model: Pick<SocialPreviewModel, "assets" | "carouselFrames">): GuideSocialPreviewState =>
  normalizeGuideSocialPreviewState(model.assets.length || model.carouselFrames.length ? "success" : "empty");

const updateSelectedOption = (
  option: Pick<HTMLRewriterTypes.Element, "getAttribute" | "removeAttribute" | "setAttribute">,
  value: string | null
): void => {
  if (!value) {
    return;
  }

  if (option.getAttribute("value") === value) {
    option.setAttribute("selected", "selected");
    return;
  }

  option.removeAttribute("selected");
};

const renderGuideSocialSectionState = (
  sectionMarkup: string,
  language: GuideLanguage,
  activeSection: GuideSectionId,
  renderModel: GuideSocialPreviewRenderModel
): string => {
  const rewriter = new HTMLRewriter()
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialHiddenLanguage}`, {
      element(element) {
        element.setAttribute("value", language);
      },
    })
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialHiddenSection}`, {
      element(element) {
        element.setAttribute("value", activeSection);
      },
    })
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialPack} option`, {
      element(element) {
        updateSelectedOption(element, renderModel.formValues.packId);
      },
    })
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialAssetKind} option`, {
      element(element) {
        updateSelectedOption(element, renderModel.formValues.assetKind);
      },
    })
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialApprovedAsset} option`, {
      element(element) {
        updateSelectedOption(element, renderModel.formValues.approvedAssetId);
      },
    })
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialTheme} option`, {
      element(element) {
        updateSelectedOption(element, renderModel.formValues.socialTheme);
      },
    })
    .on(`#${GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel}`, {
      element(element) {
        element.setAttribute("data-social-state", renderModel.previewState);

        if (renderModel.previewMarkup) {
          element.setInnerContent(`\n${renderModel.previewMarkup}\n`, { html: true });
        }
      },
    });

  return rewriter.transform(sectionMarkup);
};

/**
 * Resolves embedded guide preview state from the main guide URL.
 */
export const resolveGuideSocialPreviewRenderModel = (
  query: URLSearchParams,
  language: GuideLanguage,
  section: GuideSectionId,
  requestOrigin: string
): GuideSocialPreviewRenderModel => {
  const formValues = resolveGuideSocialQueryValues(query);

  if (!formValues.packId && !formValues.assetKind && !formValues.approvedAssetId && !formValues.socialTheme) {
    return {
      formValues,
      previewMarkup: null,
      previewState: "idle",
    };
  }

  const resolution = resolveSocialRenderRequest({
    approvedAsset: formValues.approvedAssetId,
    asset: formValues.assetKind,
    language,
    preset: formValues.packId,
    section,
    theme: formValues.socialTheme,
  });

  if (!resolution.ok) {
    return {
      formValues,
      previewMarkup: renderSocialErrorState(resolution.error, language),
      previewState: "error",
    };
  }

  const previewModel = resolveSocialPreviewModel(resolution.value, requestOrigin);
  return {
    formValues: {
      approvedAssetId: resolution.value.approvedAssetId,
      assetKind: resolution.value.assetKind,
      packId: resolution.value.packId,
      socialTheme: resolution.value.theme,
    } satisfies {
      approvedAssetId: string;
      assetKind: SocialAssetKind;
      packId: SocialPackId;
      socialTheme: SocialTheme;
    },
    previewMarkup: renderSocialPreviewMarkup(previewModel),
    previewState: resolveGuideSocialPreviewState(previewModel),
  };
};

/**
 * Applies embedded social toolkit state to the generated downloads section.
 */
export const renderGuideSocialSectionMarkup = (
  sectionMarkup: string,
  language: GuideLanguage,
  activeSection: GuideSectionId,
  renderModel: GuideSocialPreviewRenderModel
): string => renderGuideSocialSectionState(sectionMarkup, language, activeSection, renderModel);

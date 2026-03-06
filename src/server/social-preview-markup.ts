import { renderLocalizedSpans, renderVisibleCopy, resolveCopy } from "../shared/i18n";
import {
  resolveSocialRenderRequest,
  resolveGuideSocialQueryValues,
  resolveSocialPresetCopy,
  toSocialPackHref,
  type SocialAssetKind,
  type SocialErrorEnvelope,
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

const resolveAssetKindLabel = (assetKind: SocialAssetKind, language: GuideLanguage): string => {
  const assetKindCopyKey = {
    "announcement-card": "socialAssetKindAnnouncement",
    "docs-header": "socialAssetKindDocsHeader",
    "event-invite": "socialAssetKindEventInvite",
    "ig-post": "socialAssetKindIgPost",
    "ig-story": "socialAssetKindIgStory",
    "linkedin-post": "socialAssetKindLinkedin",
    "og-card": "socialAssetKindOgCard",
    "quote-card": "socialAssetKindQuote",
    "x-header": "socialAssetKindXHeader",
  } as const;

  return resolveCopy(assetKindCopyKey[assetKind], language);
};

const renderVisibleAssetKindLabel = (assetKind: SocialAssetKind, language: GuideLanguage): string => {
  const assetKindCopyKey = {
    "announcement-card": "socialAssetKindAnnouncement",
    "docs-header": "socialAssetKindDocsHeader",
    "event-invite": "socialAssetKindEventInvite",
    "ig-post": "socialAssetKindIgPost",
    "ig-story": "socialAssetKindIgStory",
    "linkedin-post": "socialAssetKindLinkedin",
    "og-card": "socialAssetKindOgCard",
    "quote-card": "socialAssetKindQuote",
    "x-header": "socialAssetKindXHeader",
  } as const;

  return renderVisibleCopy(assetKindCopyKey[assetKind], language);
};

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
  const presetCopy = resolveSocialPresetCopy(model.presetId, language);
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
  const downloadLabel = resolveCopy("socialToolkitLabelDownload", language);
  const previewLabel = resolveCopy("socialToolkitLabelPreview", language);
  const downloadVisibleLabel = renderVisibleCopy("socialToolkitLabelDownload", language);
  const previewVisibleLabel = renderVisibleCopy("socialToolkitLabelPreview", language);
  const stepLabelKeys = [
    "socialToolkitLabelStepSelect",
    "socialToolkitLabelStepReview",
    "socialToolkitLabelStepExport",
  ] as const;
  const manifestLabel = resolveCopy("socialToolkitLabelDownloadManifest", language);
  const tableCaption = resolveCopy("socialToolkitAssetsTableCaption", language);
  const state = model.assets.length || model.carouselFrames.length ? "success" : "empty";

  return [
    `<div class="social-preview-grid" data-social-state="${state}">`,
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
    `      <div class="social-safe-zone-frame social-preview-media">`,
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
                )}" download="${escapeAttribute(asset.fileName)}" aria-label="${escapeAttribute(asset.fileName)}">${downloadVisibleLabel}</a></td></tr>`
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
                )}" download="${escapeAttribute(asset.fileName)}" aria-label="${escapeAttribute(asset.fileName)}">${downloadVisibleLabel}</a></div></article>`
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
              )}" target="_blank" rel="noopener" aria-label="${escapeAttribute(
                `${previewLabel} ${frame.fileName}`
              )}">${previewVisibleLabel}</a><a class="btn btn-xs btn-neutral" href="${escapeAttribute(
                frame.href
              )}" download="${escapeAttribute(frame.fileName)}" aria-label="${escapeAttribute(frame.fileName)}">${downloadVisibleLabel}</a></div></article>`
          )
          .join("")}</div></div>`
      : "",
    `    </div>`,
    `  </section>`,
    `</div>`,
  ].join("\n");
};

const updateSelectedOption = (selectMarkup: string, value: string | null): string => {
  const normalizedMarkup = selectMarkup.replaceAll(/\sselected="selected"/g, "");
  if (!value) {
    return normalizedMarkup;
  }

  const optionToken = `value="${escapeAttribute(value)}"`;
  return normalizedMarkup.replace(optionToken, `${optionToken} selected="selected"`);
};

const updateHiddenInputValue = (sectionMarkup: string, inputId: string, value: string): string =>
  sectionMarkup.replace(
    new RegExp(`(<input[^>]*id="${inputId}"[^>]*value=")([^"]*)(")`, "g"),
    `$1${escapeAttribute(value)}$3`
  );

const updateSelectValue = (sectionMarkup: string, selectId: string, value: string | null): string =>
  sectionMarkup.replace(
    new RegExp(`(<select[^>]*id="${selectId}"[^>]*>)([\\s\\S]*?)(</select>)`, "g"),
    (_fullMatch, openTag: string, optionsMarkup: string, closeTag: string) =>
      `${openTag}${updateSelectedOption(optionsMarkup, value)}${closeTag}`
  );

const updatePreviewPanelState = (sectionMarkup: string, previewMarkup: string | null): string => {
  const nextState = previewMarkup?.includes('data-social-state="error"')
    ? "error"
    : previewMarkup?.includes('data-social-state="success"')
      ? "success"
      : "idle";

  return sectionMarkup.replace(/(<div\s+id="social-preview-panel"[^>]*data-social-state=")([^"]+)(")/, `$1${nextState}$3`);
};

const replaceSocialPreviewPanel = (sectionMarkup: string, previewMarkup: string | null): string =>
  previewMarkup
    ? sectionMarkup.replace(
        /(<div\s+id="social-preview-panel"[^>]*>)\s*<div class="social-preview-idle[^"]*"[\s\S]*?<\/div>\s*(<\/div>)/,
        `$1\n${previewMarkup}\n          $2`
      )
    : sectionMarkup;

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
): string => {
  let markup = updateHiddenInputValue(sectionMarkup, "social-language", language);
  markup = updateHiddenInputValue(markup, "social-section", activeSection);
  markup = updateSelectValue(markup, "social-pack", renderModel.formValues.packId);
  markup = updateSelectValue(markup, "social-format", renderModel.formValues.assetKind);
  markup = updateSelectValue(markup, "social-approved-asset", renderModel.formValues.approvedAssetId);
  markup = updateSelectValue(markup, "social-theme", renderModel.formValues.socialTheme);
  markup = updatePreviewPanelState(markup, renderModel.previewMarkup);
  markup = replaceSocialPreviewPanel(markup, renderModel.previewMarkup);
  return markup;
};

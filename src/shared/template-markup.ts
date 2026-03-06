import { GUIDE_DOWNLOADS } from "./config";
import { renderLocalizedSpans, resolveCopy } from "./i18n";
import {
  DEFAULT_GUIDE_TEMPLATE_ID,
  GUIDE_TEMPLATE_CATALOG,
  GUIDE_TEMPLATE_IDS,
  type GuideTemplateId,
  type LocalizedText,
} from "./template-catalog";
import type { GuideLanguage } from "./view-state";

const renderTemplateText = (copy: LocalizedText, language: GuideLanguage): string =>
  language === "bi"
    ? copy.en === copy.zh
      ? escapeHtml(copy.en)
      : renderLocalizedSpans(copy)
    : language === "zh"
      ? escapeHtml(copy.zh)
      : escapeHtml(copy.en);

/**
 * Renders the server-owned template library cards for the downloads section.
 */
export const renderTemplateLibraryMarkup = (language: GuideLanguage): string => `
<span class="sub-label">${renderTemplateText(resolveTemplateCopy("templateLibraryTitle"), language)}</span>
<p class="body-copy template-library-intro">${renderTemplateText(resolveTemplateCopy("templateLibraryIntro"), language)}</p>
<div class="template-library-grid" role="list" aria-label="${escapeAttribute(resolveCopy("templateLibraryAria", language))}">
  ${GUIDE_TEMPLATE_IDS.map((templateId) => renderTemplateCardMarkup(language, templateId)).join("\n")}
  ${renderGuideArchiveCardMarkup(language)}
</div>`;

/**
 * Renders a template library preview card from the shared catalog.
 */
export const renderTemplateCardMarkup = (language: GuideLanguage, templateId: GuideTemplateId): string => {
  const template = GUIDE_TEMPLATE_CATALOG[templateId];
  const download = GUIDE_DOWNLOADS[template.downloadId];
  const downloadAria =
    template.downloadId === "dl-pptx" ? resolveCopy("downloadPptxAria", language) : resolveCopy("downloadDocxAria", language);

  return `<article class="template-library-entry" role="listitem">
    <a
      href="${download.href}"
      download="${escapeAttribute(download.fileName)}"
      class="download-card template-library-card w-full text-left"
      id="${template.downloadId}"
      data-template-id="${template.id}"
      aria-label="${escapeAttribute(downloadAria)}"
    >
      <div class="template-library-card__header">
        <div class="download-icon template-library-card__icon">.${escapeHtml(template.downloadId === "dl-pptx" ? "pptx" : "docx")}</div>
        <div class="template-library-card__heading">
          <div class="download-name">${renderTemplateText(template.name, language)}</div>
          <p class="template-library-card__description">${renderTemplateText(template.description, language)}</p>
        </div>
      </div>

      <dl class="template-library-spec-list">
        ${template.specs
          .map(
            (spec) => `<div class="template-library-spec">
              <dt>${renderTemplateText(spec.label, language)}</dt>
              <dd>${renderTemplateText(spec.value, language)}</dd>
            </div>`
          )
          .join("")}
      </dl>

      <ul class="template-library-highlight-list">
        ${template.highlights.map((highlight) => `<li>${renderTemplateText(highlight, language)}</li>`).join("")}
      </ul>

      <div class="template-library-card__footer">
        <span class="download-meta">${escapeHtml(download.fileName)}</span>
        <span class="template-library-card__action">${escapeHtml(resolveCopy("templateLibraryDownload", language))}</span>
      </div>
    </a>
  </article>`;
};

/**
 * Resolves the default template card id for server-owned section rendering.
 */
export const resolveDefaultTemplateCardId = (): GuideTemplateId => DEFAULT_GUIDE_TEMPLATE_ID;

const renderGuideArchiveCardMarkup = (language: GuideLanguage): string => {
  const guideDownload = GUIDE_DOWNLOADS["dl-guide"];

  return `<article class="template-library-entry" role="listitem">
    <a
      href="${guideDownload.href}"
      download="${escapeAttribute(guideDownload.fileName)}"
      class="download-card template-library-card w-full text-left"
      id="dl-guide"
      aria-label="${escapeAttribute(resolveCopy("downloadGuideAria", language))}"
    >
      <div class="template-library-card__header">
        <div class="download-icon template-library-card__icon">.html</div>
        <div class="template-library-card__heading">
          <div class="download-name">${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotName"), language)}</div>
          <p class="template-library-card__description">${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotDescription"), language)}</p>
        </div>
      </div>

      <dl class="template-library-spec-list">
        <div class="template-library-spec">
          <dt>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotFormatLabel"), language)}</dt>
          <dd>HTML</dd>
        </div>
        <div class="template-library-spec">
          <dt>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotSurfaceLabel"), language)}</dt>
          <dd>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotSurfaceValue"), language)}</dd>
        </div>
        <div class="template-library-spec">
          <dt>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotCoverageLabel"), language)}</dt>
          <dd>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotCoverageValue"), language)}</dd>
        </div>
      </dl>

      <ul class="template-library-highlight-list">
        <li>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotHighlightShell"), language)}</li>
        <li>${renderTemplateText(resolveTemplateCopy("templateGuideSnapshotHighlightArchive"), language)}</li>
      </ul>

      <div class="template-library-card__footer">
        <span class="download-meta">${escapeHtml(guideDownload.fileName)}</span>
        <span class="template-library-card__action">${escapeHtml(resolveCopy("templateLibraryDownload", language))}</span>
      </div>
    </a>
  </article>`;
};

const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeHtml = (value: string): string => escapeAttribute(value).replaceAll("'", "&#39;");

const resolveTemplateCopy = (
  key:
    | "templateGuideSnapshotCoverageLabel"
    | "templateGuideSnapshotCoverageValue"
    | "templateGuideSnapshotDescription"
    | "templateGuideSnapshotFormatLabel"
    | "templateGuideSnapshotHighlightArchive"
    | "templateGuideSnapshotHighlightShell"
    | "templateGuideSnapshotName"
    | "templateGuideSnapshotSurfaceLabel"
    | "templateGuideSnapshotSurfaceValue"
    | "templateLibraryIntro"
    | "templateLibraryTitle"
): LocalizedText => ({
  en: resolveCopy(key, "en"),
  zh: resolveCopy(key, "zh"),
});

import { GUIDE_ROUTES } from "./config";
import type { LocalizedCopy } from "./i18n";
import { stripMarkupText } from "./markup";
import type { GuideSectionMeta, GuideSectionRegistry } from "./section-markup";
import { GUIDE_SECTION_IDS, isGuideSectionId, type GuideSectionId } from "./view-state";

const SECTION_START_MARKER = "GUIDE_SECTION_START";
const SECTION_END_MARKER = "GUIDE_SECTION_END";
const SECTION_FRAGMENT_PATTERN = new RegExp(
  `<!--${SECTION_START_MARKER}:(s\\d+)-->([\\s\\S]*?)<!--${SECTION_END_MARKER}:\\1-->`,
  "g"
);

interface GuideAuthoringSection {
  id: GuideSectionId;
  index: string;
  markup: string;
  title: LocalizedCopy;
}

/**
 * Rewrites authoring-time relative asset URLs so the live SSR app can serve
 * them from the generated public root regardless of the current request path.
 */
export const rewriteLegacyAssetUrls = (markup: string): string => {
  const rewriter = new HTMLRewriter().on("[href]", {
    element(element) {
      const href = element.getAttribute("href");

      if (!href) {
        return;
      }

      if (href === "./index.html") {
        element.setAttribute("href", GUIDE_ROUTES.guide);
        return;
      }

      if (href.startsWith("./")) {
        element.setAttribute("href", `/${href.slice(2)}`);
      }
    },
  });

  rewriter.on("[src]", {
    element(element) {
      const src = element.getAttribute("src");

      if (src?.startsWith("./")) {
        element.setAttribute("src", `/${src.slice(2)}`);
      }
    },
  });

  return rewriter.transform(markup);
};

/**
 * Extracts the canonical authoring sections from the HTML source using Bun's
 * HTMLRewriter instead of regex-driven HTML parsing.
 */
export const extractGuideSections = (sourceHtml: string): readonly GuideAuthoringSection[] => {
  const markedSource = markGuideSections(sourceHtml);
  const sections = [...markedSource.matchAll(SECTION_FRAGMENT_PATTERN)].map(([_, rawSectionId, markup], index) => {
    if (!isGuideSectionId(rawSectionId)) {
      throw new Error(`Invalid guide section id in source markup: ${rawSectionId}`);
    }

    return {
      id: rawSectionId,
      index: `${index}`.padStart(2, "0"),
      markup,
      title: extractSectionTitle(markup, rawSectionId),
    } satisfies GuideAuthoringSection;
  });
  const extractedIds = sections.map((section) => section.id);

  if (extractedIds.join(",") !== GUIDE_SECTION_IDS.join(",")) {
    throw new Error(
      `Guide section order drift detected. Expected ${GUIDE_SECTION_IDS.join(",")} but found ${extractedIds.join(",")}`
    );
  }

  return sections;
};

/**
 * Extracts the canonical section registry from the authoring HTML source.
 */
export const extractGuideSectionRegistry = (sourceHtml: string): GuideSectionRegistry =>
  new Map(extractGuideSections(sourceHtml).map(({ id, markup }) => [id, markup] satisfies [GuideSectionId, string]));

/**
 * Extracts section order and titles from the authoring guide source.
 */
export const extractGuideSectionMetadata = (sourceHtml: string): readonly GuideSectionMeta[] =>
  extractGuideSections(sourceHtml).map(({ id, index, title }) => ({ id, index, title }));

const markGuideSections = (sourceHtml: string): string => {
  const rewriter = new HTMLRewriter().on("section.guide-section[id]", {
    element(section) {
      const sectionId = section.getAttribute("id");

      if (!sectionId || !isGuideSectionId(sectionId)) {
        return;
      }

      section.before(`<!--${SECTION_START_MARKER}:${sectionId}-->`, { html: true });
      section.after(`<!--${SECTION_END_MARKER}:${sectionId}-->`, { html: true });
    },
  });

  return rewriter.transform(sourceHtml);
};

const extractSectionTitle = (sectionMarkup: string, sectionId: GuideSectionId): LocalizedCopy => {
  let titleEn = "";
  let titleZh = "";

  const rewriter = new HTMLRewriter()
    .on("h2.section-title [data-lang-en]", {
      text(text) {
        titleEn += text.text;
      },
    })
    .on("h2.section-title [data-lang-cn]", {
      text(text) {
        titleZh += text.text;
      },
    });

  rewriter.transform(sectionMarkup);

  const title = {
    en: normalizeExtractedText(titleEn),
    zh: normalizeExtractedText(titleZh),
  } satisfies LocalizedCopy;

  if (!title.en || !title.zh) {
    throw new Error(`Missing localized title in guide section: ${sectionId}`);
  }

  return title;
};

const normalizeExtractedText = (value: string): string => stripMarkupText(value);

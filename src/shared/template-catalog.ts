import type { GuideDownloadId } from "./config";

/**
 * Shared localized text used by non-request-bound content registries.
 */
export interface LocalizedText {
  en: string;
  zh: string;
}

/**
 * Stable brand contact metadata reused across generated templates and guide chrome.
 */
export const GUIDE_BRAND_CONTACT = {
  company: "VERTU Limited",
  email: "press@vertu.com",
  websiteHref: "https://www.vertu.com",
  websiteLabel: "www.vertu.com",
} as const;

/**
 * Release metadata surfaced by the cover and generated collateral.
 */
export const GUIDE_BRAND_RELEASE = {
  classification: {
    en: "Internal + Partners",
    zh: "内部 + 合作伙伴",
  },
  date: {
    en: "March 2026",
    zh: "2026年3月",
  },
  year: "2026",
  version: "4.0",
} as const;

/**
 * Supported generated document templates.
 */
export const GUIDE_TEMPLATE_IDS = ["presentation", "letterhead"] as const;

/**
 * Supported generated document template identifiers.
 */
export type GuideTemplateId = (typeof GUIDE_TEMPLATE_IDS)[number];

/**
 * Structured template spec surfaced in the guide UI.
 */
export interface GuideTemplateSpec {
  label: LocalizedText;
  value: LocalizedText;
}

/**
 * Canonical generated-template definition shared by the UI and build pipeline.
 */
export interface GuideTemplateDefinition {
  description: LocalizedText;
  documentTitle: string;
  downloadId: Extract<GuideDownloadId, "dl-docx" | "dl-pptx">;
  fileDescription: string;
  highlights: readonly LocalizedText[];
  id: GuideTemplateId;
  name: LocalizedText;
  specs: readonly GuideTemplateSpec[];
}

const GUIDE_TEMPLATE_ID_SET = new Set<string>(GUIDE_TEMPLATE_IDS);

/**
 * Default template selected for the shared template library surface.
 */
export const DEFAULT_GUIDE_TEMPLATE_ID: GuideTemplateId = "presentation";

/**
 * Shared generated-template catalog.
 */
export const GUIDE_TEMPLATE_CATALOG = {
  letterhead: {
    description: {
      en: "Partner-facing premium correspondence shell with structured approval gates and editorial spacing.",
      zh: "面向合作伙伴的高端函件模板，包含结构化审批关卡与编辑式排版节奏。",
    },
    documentTitle: "VERTU Letterhead",
    downloadId: "dl-docx",
    fileDescription: "VERTU premium letterhead template.",
    highlights: [
      {
        en: "Premium editorial cover, approval checklist, and release-sheet body pages",
        zh: "包含编辑式封面、审批清单与发布页正文模板",
      },
      {
        en: "Brand-safe typography, gold border system, and partner-ready metadata blocks",
        zh: "内置品牌安全字体、金色边框体系与合作伙伴元数据模块",
      },
    ],
    id: "letterhead",
    name: {
      en: "Letterhead Template",
      zh: "信纸模板",
    },
    specs: [
      {
        label: {
          en: "Format",
          zh: "格式",
        },
        value: {
          en: "DOCX",
          zh: "DOCX",
        },
      },
      {
        label: {
          en: "Paper",
          zh: "纸张",
        },
        value: {
          en: "US Letter",
          zh: "US Letter",
        },
      },
      {
        label: {
          en: "Structure",
          zh: "结构",
        },
        value: {
          en: "3 pages · Gold borders",
          zh: "3页 · 金色边框",
        },
      },
    ],
  },
  presentation: {
    description: {
      en: "Narrative presentation system for launch, partner, and review decks with branded slide masters.",
      zh: "用于发布、合作与评审场景的叙事型演示系统，配备品牌化母版。",
    },
    documentTitle: "VERTU Brand Presentation",
    downloadId: "dl-pptx",
    fileDescription: "VERTU premium presentation template.",
    highlights: [
      {
        en: "Cover, overview, content, insight, and closing slides with premium tone mapping",
        zh: "包含封面、总览、内容、洞察与结尾页面，并统一高端视觉调性",
      },
      {
        en: "Optimized for one insight per slide and partner-ready campaign storytelling",
        zh: "面向单页单洞察与合作伙伴传播叙事进行优化",
      },
    ],
    id: "presentation",
    name: {
      en: "Presentation Template",
      zh: "演示文稿模板",
    },
    specs: [
      {
        label: {
          en: "Format",
          zh: "格式",
        },
        value: {
          en: "PPTX",
          zh: "PPTX",
        },
      },
      {
        label: {
          en: "Canvas",
          zh: "画幅",
        },
        value: {
          en: "16:9",
          zh: "16:9",
        },
      },
      {
        label: {
          en: "Structure",
          zh: "结构",
        },
        value: {
          en: "9 slides · Gold masters",
          zh: "9页 · 金色母版",
        },
      },
    ],
  },
} as const satisfies Record<GuideTemplateId, GuideTemplateDefinition>;

/**
 * Type guard for generated template identifiers.
 */
export const isGuideTemplateId = (value: string): value is GuideTemplateId => GUIDE_TEMPLATE_ID_SET.has(value);

/**
 * Resolves the requested template id or falls back to the shared default.
 */
export const normalizeGuideTemplateId = (value: string | null | undefined): GuideTemplateId =>
  value && isGuideTemplateId(value) ? value : DEFAULT_GUIDE_TEMPLATE_ID;

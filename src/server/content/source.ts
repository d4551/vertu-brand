import { SECTION_REGISTRY } from "../../../.generated/content/sections.generated.ts";
import type { GuideLanguage, GuideSectionId } from "../../shared/view-state";

/**
 * Renders the current section markup from the precompiled localized registry.
 */
export const renderSectionMarkup = (sectionId: GuideSectionId, language: GuideLanguage): string =>
  SECTION_REGISTRY.get(language)?.get(sectionId) ?? "";

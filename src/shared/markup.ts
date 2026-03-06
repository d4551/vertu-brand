const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&#39;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&nbsp;": " ",
  "&quot;": '"',
};

const INTERACTIVE_ELEMENT_PATTERN = /<(button|input|select|textarea|a)\b([^>]*?)(?:>([\s\S]*?)<\/\1>|\/?>)/g;

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const decodeEntities = (value: string): string =>
  value.replace(/&(?:amp|#39|gt|lt|nbsp|quot);/g, (entity) => ENTITY_MAP[entity] ?? entity);

/**
 * Strips HTML tags from a fragment and returns readable plain text.
 */
export const stripMarkupText = (fragment: string): string =>
  collapseWhitespace(decodeEntities(fragment.replace(/<[^>]+>/g, " ")));

/**
 * Lists interactive elements in rendered HTML that are missing an explicit accessible name.
 */
export const findInteractiveElementsMissingAriaLabels = (html: string): string[] => {
  const missingLabels: string[] = [];

  for (const match of html.matchAll(INTERACTIVE_ELEMENT_PATTERN)) {
    const [, tagName, attributes] = match;
    const normalizedAttributes = attributes || "";

    if (normalizedAttributes.includes("aria-label=") || normalizedAttributes.includes("aria-labelledby=")) {
      continue;
    }

    if (tagName === "input") {
      if (/type="hidden"/.test(normalizedAttributes) || /\bdrawer-toggle\b/.test(normalizedAttributes)) {
        continue;
      }
    }

    missingLabels.push(collapseWhitespace(match[0]).slice(0, 240));
  }

  return missingLabels;
};

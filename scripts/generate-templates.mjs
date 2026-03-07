/**
 * VERTU Brand Template Generator
 *
 * Generates the canonical PPTX and DOCX brand templates used by the build step.
 */
import PptxGenJS from "pptxgenjs";
import * as docx from "docx";
import { writeStructuredLog } from "../src/shared/logger.ts";
import {
  GUIDE_BRAND_COLOR_TOKENS,
  GUIDE_BRAND_FONT_FAMILIES,
  GUIDE_BRAND_IDENTITY,
  GUIDE_BRAND_SAFE_FONT_FAMILIES,
} from "../src/shared/brand-tokens.ts";
import { GUIDE_BRAND_CONTACT, GUIDE_BRAND_RELEASE, GUIDE_TEMPLATE_CATALOG } from "../src/shared/template-catalog.ts";
import { GUIDE_BRAND_FILE_PATHS } from "../src/server/runtime-config.ts";

/* ─────────────────────────────────────────────
   BRAND CONSTANTS
   ───────────────────────────────────────────── */

const BRAND = {
  colors: GUIDE_BRAND_COLOR_TOKENS,
  company: GUIDE_BRAND_CONTACT.company,
  email: GUIDE_BRAND_CONTACT.email,
  name: GUIDE_BRAND_IDENTITY.name,
  version: GUIDE_BRAND_RELEASE.version,
  website: GUIDE_BRAND_CONTACT.websiteHref,
  websiteText: GUIDE_BRAND_CONTACT.websiteLabel,
  year: GUIDE_BRAND_RELEASE.year,
};

const FONT_USE_SAFE = Bun.env.VERTU_TEMPLATE_SAFE_FONTS === "1";
const FONT_FACE = Object.fromEntries(
  Object.entries(GUIDE_BRAND_FONT_FAMILIES).map(([k, primary]) => [
    k,
    FONT_USE_SAFE ? GUIDE_BRAND_SAFE_FONT_FAMILIES[k] : primary,
  ])
);
const FONT_DOCX = Object.fromEntries(
  Object.entries(GUIDE_BRAND_FONT_FAMILIES).map(([k, primary]) => [
    k,
    FONT_USE_SAFE ? GUIDE_BRAND_SAFE_FONT_FAMILIES[k] : primary,
  ])
);

const PPTX = {
  layout: {
    width: 13.333,
    marginLeft: 0.8,
    marginRight: 0.6,
    footerY: 6.95,
    footerRuleY: 6.85,
  },
  style: {
    borderRadius: 0.06,
    cardGap: 0.28,
    cardPad: 0.24,
    evidenceGap: 0.3,
    evidenceRow: 0.36,
    footerText: 10,
    sectionTagSize: 10,
    coverTitle: 56,
    coverBody: 16,
    sectionTitle: 40,
    sectionBody: 15,
    panelTitle: 26,
    bigKpi: 52,
    closingTitle: 52,
  },
};

const PRESENTATION_TEMPLATE = GUIDE_TEMPLATE_CATALOG.presentation;
const LETTERHEAD_TEMPLATE = GUIDE_TEMPLATE_CATALOG.letterhead;

/* ── Logo images (base64-encoded for embedding) ── */
/**
 * Reads a local image file and returns a PNG data URL for PPTX embedding.
 *
 * @param {string} path
 * @returns {Promise<string>}
 */
const toBase64 = async (path) => {
  const buf = await Bun.file(path).arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
};

const LOGO = {
  white: await toBase64(GUIDE_BRAND_FILE_PATHS.logoWhite),
  black: await toBase64(GUIDE_BRAND_FILE_PATHS.logoBlack),
  gold: await toBase64(GUIDE_BRAND_FILE_PATHS.logoGold),
};

// Logo is 160×53 px → aspect ratio ~3.02:1
const LOGO_ASPECT = 160 / 53;

/* ═══════════════════════════════════════════════
   P P T X   T E M P L A T E
   ═══════════════════════════════════════════════ */

const slides = [
  {
    kind: "cover",
    tone: "dark",
    title: "VERTU",
    subtitle: "Brand Presentation System  ·  16:9 ·  2026",
    body: "A premium deck system for one insight per slide, editorial rhythm, and partner-ready campaign storytelling.",
    kpi: {
      value: "2",
      label: "Core story tracks",
    },
    bullets: [
      "Designed for 2026-style visual systems: modular composition, bold headline hierarchy, and high signal-to-noise",
      "Use a single claim and one clear proof point on each slide",
      "Keep motion and imagery as framing, not decoration",
    ],
  },
  {
    kind: "menu",
    tone: "dark",
    tag: "00  ·  OVERVIEW",
    title: "Deck Layout Map",
    subtitle: "Navigate by content blocks",
    body: "Use this module order for campaign decks with predictable review flow.",
    cards: [
      ["01  ·  IDENTITY", "Brand signature language and usage discipline"],
      ["02  ·  COLOUR", "Palette logic and contrast constraints"],
      ["03  ·  TYPOGRAPHY", "Hierarchy for readable premium composition"],
      ["04  ·  IMAGERY", "Bento composition and visual rhythm"],
      ["05  ·  DATA", "Single insight charts and decision framing"],
      ["06  ·  DELIVERY", "Review and release workflow control"],
      ["07  ·  ASSETS", "File standards for circulation"],
    ],
  },
  {
    kind: "content",
    tone: "dark",
    tag: "01  ·  IDENTITY",
    title: "Identity Foundation",
    subtitle: "Signature Architecture",
    body: "Brand presence is controlled by contrast, whitespace, and hierarchy.",
    bullets: [
      "Use primary wordmark states consistently on dark and light environments",
      "Gold accents reserved for section metadata and signature hierarchy",
      "Avoid over-decoration and mixed type-scale conflicts",
    ],
    evidence: [
      ["Tone", "Editorial restraint"],
      ["Scope", "Campaign, internal, partner-facing"],
    ],
  },
  {
    kind: "content",
    tone: "light",
    tag: "02  ·  COLOUR",
    title: "Colour Language",
    subtitle: "Palette & Contrast Rules",
    body: "Use palette relationships that preserve premium perception and clear contrast.",
    bullets: [
      "Primary surfaces: black, charcoal, cream, ivory, and titanium",
      "Gold should be a focused accent, never the default body tone",
      "Always preserve readability before decoration",
    ],
    evidence: [
      ["Foreground", "Black or cream surfaces"],
      ["Highlight", "Gold accent tags and separators"],
    ],
  },
  {
    kind: "content",
    tone: "dark",
    tag: "03  ·  TYPOGRAPHY",
    title: "Typography",
    subtitle: "Editorial Rhythm",
    body: "Respect display and body pairing with strict metadata spacing.",
    layout: "standard",
    bullets: [
      "Playfair Display for identity and headline blocks",
      "DM Sans for body structure and explanatory copy",
      "Mono only where metadata is the primary information carrier",
    ],
    evidence: [
      ["Title", "Reserved for section anchors"],
      ["Body", "One claim + supporting evidence"],
    ],
  },
  {
    kind: "content",
    tone: "light",
    tag: "04  ·  IMAGERY",
    title: "Imagery Direction",
    subtitle: "Bento Visual Language",
    layout: "bento",
    body: "Keep the environment quiet so material details remain primary, then distribute context across modular cards.",
    bullets: [
      "Use one principal image and three support blocks",
      "Give each card one visual role and one headline",
      "Maintain a single visual hierarchy across dark and light decks",
    ],
    cards: [
      ["Primary Panel", "Large visual first; keep surrounding elements calm."],
      ["Proof Panel", "Short claim backed by one data cue."],
      ["Context Panel", "Location, audience, and timing reference."],
      ["Execution Panel", "Production-ready status and next step."],
    ],
    hasMedia: true,
  },
  {
    kind: "content",
    tone: "dark",
    tag: "05  ·  DATA STORY",
    title: "Data Storytelling",
    subtitle: "Claim → Evidence → Decision",
    body: "Lead each data slide with one bold insight and one visual cue.",
    layout: "insight",
    kpi: {
      value: "1",
      label: "Insight per slide",
    },
    bullets: [
      "State the insight in one sentence, then prove it with one reference",
      "Choose simple chart framing over dense dashboards",
      "Show the action or decision clearly at the bottom",
    ],
    hasMedia: true,
  },
  {
    kind: "content",
    tone: "light",
    tag: "06  ·  DELIVERY",
    title: "Delivery Governance",
    subtitle: "Review, Legal & Localization",
    layout: "standard",
    body: "Quality gates must be completed before circulation, even for urgent partner updates.",
    bullets: [
      "Validate claims and pricing against the approved master sheet",
      "Route legal-sensitive language through legal review for every region",
      "Localize terminology and product references before multilingual release",
    ],
    evidence: [
      ["Brand Sign-off", "Mandatory"],
      ["Legal Sign-off", "As required by region"],
      ["Localization", "EN/CN approved pairs"],
    ],
  },
  {
    kind: "content",
    tone: "dark",
    tag: "07  ·  ASSETS",
    title: "Asset Standards",
    subtitle: "Files, Exports & Visual Consistency",
    body: "Every exported file should preserve visual hierarchy and metadata for reusability.",
    bullets: [
      "PPTX outputs must keep light/dark tone maps and 16:9 framing",
      "DOCX outputs retain spacing and metadata blocks for legal",
      "Generated PNG logos must be high-resolution and named by variant",
    ],
    evidence: [
      ["PPTX", "Editorial deck baseline + placeholders"],
      ["DOCX", "Letterhead and release shell"],
    ],
    hasMedia: true,
    layout: "media",
  },
  {
    kind: "closing",
    tone: "dark",
    title: "Thank You",
    subtitle: "Crafted Beyond Measure",
  },
];

const theme = (tone) =>
  tone === "light"
    ? {
        bg: BRAND.colors.ivory,
        fg: BRAND.colors.charcoal,
        heading: BRAND.colors.black,
        accent: BRAND.colors.accentLight, // WCAG AA gold on light
        muted: BRAND.colors.inkMuted,
        soft: BRAND.colors.inkSoft, // secondary body text
        panel: BRAND.colors.cream,
        rule: BRAND.colors.goldDeep,
        border: "E8E3DC", // subtle border
        glass: "EFE9DE",
        card: "F6F1E7",
        evidence: BRAND.colors.titaniumLight,
      }
    : {
        bg: BRAND.colors.black,
        fg: BRAND.colors.cream,
        heading: BRAND.colors.cream,
        accent: BRAND.colors.gold,
        muted: BRAND.colors.titaniumLight,
        soft: BRAND.colors.titaniumLight,
        panel: BRAND.colors.dark,
        rule: BRAND.colors.gold,
        border: "2A2622", // subtle dark border
        glass: "221E1A",
        card: "1D1A16",
        evidence: "3A352F",
      };

function buildPptx() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = BRAND.company;
  pptx.company = BRAND.company;
  pptx.title = `${PRESENTATION_TEMPLATE.documentTitle} v${BRAND.version}`;
  pptx.theme = {
    headFontFace: FONT_FACE.display,
    bodyFontFace: FONT_FACE.body,
  };

  /* ── Layout constants ── */
  const L = PPTX.layout.marginLeft; // left margin
  const R = PPTX.layout.marginRight; // right margin
  const FULL_W = PPTX.layout.width; // 16:9 width
  const BODY_W = FULL_W - L - R; // usable width
  const FOOTER_RULE_Y = PPTX.layout.footerRuleY;
  const menuTargets = slides
    .map((slide, idx) => (slide.kind === "content" ? idx + 1 : null))
    .filter((slideIndex) => slideIndex !== null);

  /* ── Slide masters — logo + footer rule + company + slide number ── */
  const masterLogoH = 0.22;
  const masterLogoW = masterLogoH * LOGO_ASPECT;

  pptx.defineSlideMaster({
    title: "VERTU_DARK",
    background: { color: BRAND.colors.black },
    objects: [
      {
        image: {
          data: LOGO.white,
          x: FULL_W - R - masterLogoW,
          y: 0.35,
          w: masterLogoW,
          h: masterLogoH,
          altText: `${BRAND.name} logo`,
        },
      },
      { line: { x: L, y: FOOTER_RULE_Y, w: BODY_W, h: 0, line: { color: BRAND.colors.gold, width: 0.75 } } },
    ],
  });

  pptx.defineSlideMaster({
    title: "VERTU_LIGHT",
    background: { color: BRAND.colors.ivory },
    objects: [
      {
        image: {
          data: LOGO.black,
          x: FULL_W - R - masterLogoW,
          y: 0.35,
          w: masterLogoW,
          h: masterLogoH,
          altText: `${BRAND.name} logo`,
        },
      },
      { line: { x: L, y: FOOTER_RULE_Y, w: BODY_W, h: 0, line: { color: BRAND.colors.goldDeep, width: 0.75 } } },
    ],
  });

  slides.forEach((s, i) => {
    const t = theme(s.tone);
    const master = s.tone === "light" ? "VERTU_LIGHT" : "VERTU_DARK";
    const slide = pptx.addSlide({ masterName: master });

    if (s.kind === "cover") {
      renderCover(slide, s, t, pptx, { L, BODY_W, FULL_W });
    } else if (s.kind === "menu") {
      renderMenu(slide, s, t, pptx, { L, BODY_W, menuTargets });
    } else if (s.kind === "closing") {
      renderClosing(slide, s, t, pptx, { L, BODY_W, FULL_W });
    } else {
      renderContent(slide, s, t, pptx, { L, BODY_W, FULL_W });
    }

    addSlideChrome(slide, i + 1, t, { L, R, FULL_W });
  });

  return pptx;
}

function addSectionHeader(slide, s, t, pptx, { L, contentW }) {
  if (s.tag) {
    slide.addText(s.tag, {
      x: L,
      y: 0.52,
      w: contentW,
      h: 0.26,
      fontFace: FONT_FACE.mono,
      color: t.accent,
      fontSize: PPTX.style.sectionTagSize,
      charSpacing: 4,
      margin: 0,
    });
  }

  slide.addText(s.title, {
    x: L,
    y: 0.82,
    w: contentW,
    h: 0.68,
    fontFace: FONT_FACE.display,
    color: t.heading,
    fontSize: PPTX.style.sectionTitle,
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.line, {
    x: L,
    y: 1.54,
    w: 2.1,
    h: 0,
    line: { color: t.rule, width: 0.75 },
  });

  slide.addText(s.subtitle || "", {
    x: L,
    y: 1.71,
    w: contentW,
    h: 0.24,
    fontFace: FONT_FACE.mono,
    color: t.accent,
    fontSize: 10,
    charSpacing: 3,
    margin: 0,
  });

  slide.addText(s.body, {
    x: L,
    y: 2.05,
    w: contentW,
    h: 0.72,
    fontFace: FONT_FACE.body,
    color: t.soft,
    fontSize: 15,
    lineSpacingMultiple: 1.45,
    margin: 0,
    valign: "top",
  });
}

function addSlideChrome(slide, slideIndex, t, { L, R, FULL_W }) {
  slide.addText(
    [
      {
        text: `${BRAND.company}  \u00B7  `,
        options: { fontFace: FONT_FACE.mono, color: t.muted, fontSize: PPTX.style.footerText, margin: 0 },
      },
      {
        text: BRAND.websiteText,
        options: {
          fontFace: FONT_FACE.mono,
          color: t.accent,
          fontSize: PPTX.style.footerText,
          underline: true,
          hyperlink: { url: BRAND.website, tooltip: `Open ${BRAND.websiteText}` },
          margin: 0,
        },
      },
    ],
    {
      x: L,
      y: PPTX.layout.footerY,
      w: 6,
      h: 0.25,
      margin: 0,
    }
  );

  slide.addText(String(slideIndex), {
    x: FULL_W - R - 0.6,
    y: PPTX.layout.footerY,
    w: 0.6,
    h: 0.22,
    fontFace: FONT_FACE.mono,
    color: t.accent,
    fontSize: PPTX.style.footerText,
    align: "right",
    margin: 0,
  });
}

function addPanel(pptx, slide, t, x, y, w, h, { fill, line, lineWidth } = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: PPTX.style.borderRadius,
    fill: { color: fill || t.card },
    line: { color: line || t.border, width: lineWidth || 0.5 },
  });
}

function addMediaPlaceholder(slide, t, pptx, { x, y, w, h }, label, helperText) {
  addPanel(pptx, slide, t, x, y, w, h, { fill: t.glass, line: t.border, lineWidth: 0.45 });
  slide.addText(label || "[ Image ]", {
    x,
    y: y + h * 0.38,
    w,
    h: 0.35,
    fontFace: FONT_FACE.mono,
    color: t.accent,
    fontSize: 12,
    align: "center",
    charSpacing: 2,
    margin: 0,
  });
  slide.addText(helperText || "Insert visual 1:1 or 16:9", {
    x,
    y: y + h * 0.38 + 0.45,
    w,
    h: 0.45,
    fontFace: FONT_FACE.mono,
    color: t.muted,
    fontSize: 10,
    align: "center",
    lineSpacingMultiple: 1.3,
    margin: 0,
  });
}

function addEvidenceBlock(slide, s, t, pptx, { L, width, y }) {
  if (!s.evidence) {
    return;
  }

  const footerBottom = PPTX.layout.footerY - 0.2;
  const baseRowHeight = PPTX.style.evidenceRow;
  const maxRows = Math.max(1, Math.floor((footerBottom - y - 0.34) / baseRowHeight));
  const visibleRows = maxRows === 1 ? 1 : Math.max(1, maxRows - 1);
  const rows = [...s.evidence.slice(0, visibleRows)];
  if (s.evidence.length > visibleRows) {
    const remaining = s.evidence.length - visibleRows;
    rows.push(["Evidence", `${remaining} more item(s)`]);
  }
  const rowHeight = Math.max(0.24, (footerBottom - y - 0.34) / Math.max(rows.length, 1));
  const rowFont = rowHeight >= 0.34 ? 10 : 9;
  const valueFont = rowHeight >= 0.34 ? 11 : 10;

  slide.addText("EVIDENCE", {
    x: L,
    y,
    w: 4,
    h: 0.22,
    fontFace: FONT_FACE.mono,
    color: t.accent,
    fontSize: 10,
    charSpacing: 4,
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.line, {
    x: L,
    y: y + 0.24,
    w: width,
    h: 0,
    line: { color: t.border, width: 0.5 },
  });

  rows.forEach(([label, value], idx) => {
    const rowY = y + 0.34 + idx * rowHeight;
    slide.addText(label, {
      x: L,
      y: rowY,
      w: 2.4,
      h: rowHeight,
      fontFace: FONT_FACE.mono,
      color: t.accent,
      fontSize: rowFont,
      margin: 0,
    });
    slide.addText(value, {
      x: L + 2.5,
      y: rowY,
      w: width - 2.5,
      h: rowHeight,
      fontFace: FONT_FACE.body,
      color: t.muted,
      fontSize: valueFont,
      margin: 0,
      valign: "top",
    });
  });
}

function renderCover(slide, s, t, pptx, { L, BODY_W, FULL_W }) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0,
    y: 0,
    w: FULL_W,
    h: 0,
    line: { color: BRAND.colors.gold, width: 1.5 },
  });

  addPanel(pptx, slide, t, L, 0.46, BODY_W, 1.1, { fill: t.glass, line: t.border, lineWidth: 0.4 });

  const coverLogoH = 0.5;
  const coverLogoW = coverLogoH * LOGO_ASPECT;
  slide.addImage({
    data: LOGO.white,
    x: L,
    y: 0.6,
    w: coverLogoW,
    h: coverLogoH,
    altText: `${BRAND.name} logo`,
  });

  slide.addText(s.title, {
    x: L + 3.1,
    y: 1.36,
    w: 9.2,
    h: 1.2,
    fontFace: FONT_FACE.identity,
    color: t.heading,
    fontSize: PPTX.style.coverTitle,
    charSpacing: 8,
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.line, {
    x: L,
    y: 2.7,
    w: 2.8,
    h: 0,
    line: { color: BRAND.colors.gold, width: 1 },
  });

  slide.addText(s.subtitle.toUpperCase(), {
    x: L,
    y: 2.85,
    w: 8.4,
    h: 0.3,
    fontFace: FONT_FACE.mono,
    color: t.accent,
    fontSize: 10.5,
    charSpacing: 3,
    margin: 0,
  });

  slide.addText(s.body, {
    x: L,
    y: 3.4,
    w: 9,
    h: 0.85,
    fontFace: FONT_FACE.body,
    color: t.soft,
    fontSize: 16,
    lineSpacingMultiple: 1.5,
    margin: 0,
    valign: "top",
  });

  if (s.kpi) {
    addPanel(pptx, slide, t, 10.28, 3.2, 2.45, 1.2, { fill: t.glass, line: t.border, lineWidth: 0.4 });
    slide.addText(s.kpi.value, {
      x: 10.4,
      y: 3.45,
      w: 0.9,
      h: 0.9,
      fontFace: FONT_FACE.identity,
      color: t.accent,
      fontSize: PPTX.style.bigKpi,
      margin: 0,
      align: "center",
      valign: "middle",
    });
    slide.addText(s.kpi.label, {
      x: 10.95,
      y: 3.62,
      w: 1.6,
      h: 0.55,
      fontFace: FONT_FACE.mono,
      color: t.soft,
      fontSize: 10,
      margin: 0,
      valign: "middle",
    });
  }

  if (s.bullets) {
    const panelY = 4.85;
    const panelH = 0.45 * s.bullets.length + 0.58;
    addPanel(pptx, slide, t, L, panelY, 9.2, panelH, { fill: t.card, line: t.border, lineWidth: 0.4 });
    slide.addText(
      s.bullets.map((b) => ({
        text: b,
        options: {
          bullet: true,
          fontSize: 14,
          fontFace: FONT_FACE.body,
          color: t.fg,
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
        },
      })),
      { x: L + 0.32, y: panelY + 0.12, w: 8.56, h: panelH - 0.24, valign: "top", margin: 0 }
    );
  }

  slide.addText(`v${BRAND.version}  \u00B7  ${BRAND.year}  \u00B7  ${BRAND.company}`, {
    x: L,
    y: 6.45,
    w: 8,
    h: 0.25,
    fontFace: FONT_FACE.mono,
    color: t.muted,
    fontSize: 10,
    charSpacing: 2,
    margin: 0,
  });
}

function renderMenu(slide, s, t, pptx, { L, BODY_W, menuTargets }) {
  addSectionHeader(slide, s, t, pptx, { L, contentW: BODY_W });
  const cards = s.cards || [];
  const cols = 3;
  const cardW = (BODY_W - PPTX.style.cardGap * (cols - 1)) / cols;
  const cardH = 1.0;
  const yBase = 3.18;

  cards.forEach((card, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = L + col * (cardW + PPTX.style.cardGap);
    const y = yBase + row * (cardH + PPTX.style.cardGap);
    addPanel(pptx, slide, t, x, y, cardW, cardH, { fill: t.card, line: t.border });
    slide.addText(card[0], {
      ...(menuTargets?.[i] ? { hyperlink: { slide: menuTargets[i], tooltip: `Jump to ${card[0]}` } } : {}),
      x: x + PPTX.style.cardPad,
      y: y + 0.12,
      w: cardW - PPTX.style.cardPad * 2,
      h: 0.26,
      fontFace: FONT_FACE.mono,
      color: t.accent,
      fontSize: 10,
      bold: true,
      margin: 0,
    });
    slide.addText(card[1], {
      x: x + PPTX.style.cardPad,
      y: y + 0.40,
      w: cardW - PPTX.style.cardPad * 2,
      h: cardH - 0.52,
      fontFace: FONT_FACE.body,
      color: t.fg,
      fontSize: 12.5,
      margin: 0,
    });
  });
}

function renderContent(slide, s, t, pptx, { L, BODY_W, FULL_W }) {
  const contentW = s.hasMedia ? 7.2 : BODY_W;
  if (s.layout === "bento") {
    renderBentoContent(slide, s, t, pptx, { L, BODY_W });
    return;
  }

  if (s.layout === "insight") {
    renderInsightContent(slide, s, t, pptx, { L, BODY_W });
    return;
  }

  addSectionHeader(slide, s, t, pptx, { L, contentW });

  if (s.bullets) {
    const panelY = 2.93;
    const rowH = s.hasMedia ? 0.46 : 0.38;
    const panelH = rowH * s.bullets.length + 0.45;
    const bulletFontSize = s.hasMedia ? 13 : 14;
    const useW = contentW - 0.03;
    addPanel(pptx, slide, t, L, panelY, useW, panelH, { fill: t.card, line: t.border, lineWidth: 0.4 });
    slide.addText(
      s.bullets.map((b) => ({
        text: b,
        options: {
          bullet: true,
          fontSize: bulletFontSize,
          fontFace: FONT_FACE.body,
          color: t.fg,
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
        },
      })),
      { x: L + 0.35, y: panelY + 0.12, w: useW - 0.56, h: panelH - 0.24, valign: "top", margin: 0 }
    );
    if (s.evidence) {
      addEvidenceBlock(slide, s, t, pptx, { L, width: contentW, y: panelY + panelH + PPTX.style.evidenceGap });
    }
  }

  if (s.layout === "media") {
    const mediaX = L + 0.18;
    const mediaW = BODY_W - 0.18;
    addMediaPlaceholder(
      slide,
      t,
      pptx,
      { x: mediaX, y: 3.04, w: mediaW, h: 3.65 },
      "[ Chart / Visual ]",
      "Insert visual evidence chart area here"
    );
    return;
  }

  if (s.hasMedia) {
    const mx = L + contentW + 0.3;
    const mw = FULL_W - mx - 0.6;
    const my = 0.5;
    const mh = 5.8;
    addMediaPlaceholder(slide, t, pptx, { x: mx, y: my, w: mw, h: mh }, "[ Image ]", "Insert visual 1:1 or 16:9");
  }
}

function renderBentoContent(slide, s, t, pptx, { L, BODY_W }) {
  addSectionHeader(slide, s, t, pptx, { L, contentW: BODY_W });
  const cards = s.cards || [];
  const cols = 2;
  const colW = (BODY_W - PPTX.style.cardGap) / cols;
  const rowH = 1.32;

  cards.forEach((card, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const cardX = L + col * (colW + PPTX.style.cardGap);
    const cardY = 3.0 + row * (rowH + PPTX.style.cardGap);
    addPanel(pptx, slide, t, cardX, cardY, colW, rowH, { fill: t.card, line: t.border, lineWidth: 0.45 });
    slide.addText(card[0], {
      x: cardX + PPTX.style.cardPad,
      y: cardY + 0.15,
      w: colW - PPTX.style.cardPad * 2,
      h: 0.34,
      fontFace: FONT_FACE.mono,
      color: t.accent,
      fontSize: 10,
      margin: 0,
    });
    slide.addText(card[1], {
      x: cardX + PPTX.style.cardPad,
      y: cardY + 0.55,
      w: colW - PPTX.style.cardPad * 2,
      h: rowH - 0.66,
      fontFace: FONT_FACE.body,
      color: t.fg,
      fontSize: 11.5,
      margin: 0,
      valign: "top",
    });
  });

  if (s.hasMedia) {
    addMediaPlaceholder(
      slide,
      t,
      pptx,
      { x: L, y: 6.0, w: BODY_W, h: 0.72 },
      "[ Visual cadence ]",
      "Insert optional montage strip, one to three supporting assets"
    );
  }
}

function renderInsightContent(slide, s, t, pptx, { L, BODY_W }) {
  addSectionHeader(slide, s, t, pptx, { L, contentW: BODY_W });
  const panelW = BODY_W * 0.58;
  const panelH = 1.7;

  addPanel(pptx, slide, t, L, 3.0, panelW, panelH, { fill: t.card, line: t.glass, lineWidth: 0.4 });
  if (s.kpi) {
    slide.addText(s.kpi.value, {
      x: L + 0.35,
      y: 3.25,
      w: 1.5,
      h: 0.9,
      fontFace: FONT_FACE.identity,
      color: t.accent,
      fontSize: PPTX.style.bigKpi,
      margin: 0,
      align: "center",
      valign: "middle",
    });
    slide.addText(s.kpi.label.toUpperCase(), {
      x: L + 1.94,
      y: 3.55,
      w: panelW - 2.1,
      h: 0.55,
      fontFace: FONT_FACE.mono,
      color: t.soft,
      fontSize: 10,
      margin: 0,
    });
  }

  if (s.bullets) {
    const listY = 5.05;
    const bulletH = 0.42 * s.bullets.length + 0.42;
    addPanel(pptx, slide, t, L, listY, panelW, bulletH, { fill: t.panel, line: t.border, lineWidth: 0.4 });
    slide.addText(
      s.bullets.map((b) => ({
        text: b,
        options: {
          bullet: true,
          fontSize: 12.5,
          fontFace: FONT_FACE.body,
          color: t.fg,
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
        },
      })),
      { x: L + 0.28, y: listY + 0.12, w: panelW - 0.56, h: bulletH - 0.24, valign: "top", margin: 0 }
    );
  }

  const mediaW = BODY_W - panelW - 0.34;
  const mediaX = L + panelW + 0.34;
  addMediaPlaceholder(
    slide,
    t,
    pptx,
    { x: mediaX, y: 3.0, w: mediaW, h: 3.0 },
    "[ Chart placeholder ]",
    "Insert one chart or one comparative visual"
  );
  addEvidenceBlock(slide, s, t, pptx, {
    L: mediaX,
    width: mediaW,
    y: 6.12,
  });
}

function renderClosing(slide, s, t, pptx, { FULL_W }) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0,
    y: 7.48,
    w: FULL_W,
    h: 0,
    line: { color: BRAND.colors.gold, width: 1.5 },
  });

  const closingLogoH = 0.5;
  const closingLogoW = closingLogoH * LOGO_ASPECT;
  slide.addImage({
    data: LOGO.white,
    altText: `${BRAND.name} logo`,
    x: (FULL_W - closingLogoW) / 2,
    y: 1.48,
    w: closingLogoW,
    h: closingLogoH,
  });

  slide.addText(s.title, {
    x: 0,
    y: 2.34,
    w: FULL_W,
    h: 1.0,
    fontFace: FONT_FACE.display,
    color: t.heading,
    fontSize: PPTX.style.closingTitle,
    align: "center",
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.line, {
    x: (FULL_W - 3.0) / 2,
    y: 3.5,
    w: 3.0,
    h: 0,
    line: { color: BRAND.colors.gold, width: 1 },
  });

  slide.addText(s.subtitle, {
    x: 0,
    y: 3.68,
    w: FULL_W,
    h: 0.5,
    fontFace: FONT_FACE.display,
    color: t.accent,
    fontSize: 22,
    italic: true,
    align: "center",
    margin: 0,
  });

  slide.addText(
    [
      {
        text: `${BRAND.websiteText}  \u00B7  `,
        options: {
          fontFace: FONT_FACE.mono,
          color: t.accent,
          fontSize: 10,
          charSpacing: 2,
          underline: true,
          hyperlink: { url: BRAND.website, tooltip: `Open ${BRAND.websiteText}` },
        },
      },
      {
        text: BRAND.email,
        options: {
          fontFace: FONT_FACE.mono,
          color: t.accent,
          fontSize: 10,
          charSpacing: 2,
          underline: true,
          hyperlink: { url: `mailto:${BRAND.email}` },
        },
      },
    ],
    {
      x: 0,
      y: 4.4,
      w: FULL_W,
      h: 0.3,
      margin: 0,
      align: "center",
    }
  );

  slide.addText(`${BRAND.company}  \u00B7  v${BRAND.version}  \u00B7  ${BRAND.year}`, {
    x: 0,
    y: 5.0,
    w: FULL_W,
    h: 0.25,
    fontFace: FONT_FACE.mono,
    color: t.accent,
    fontSize: 10,
    charSpacing: 3,
    align: "center",
    margin: 0,
  });
}

/* ═══════════════════════════════════════════════
   D O C X   L E T T E R H E A D
   ═══════════════════════════════════════════════ */

const {
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  PageBreak,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
  PageNumber,
} = docx;

// Logo buffer for DOCX embedding
const logoBlackBuf = await Bun.file(GUIDE_BRAND_FILE_PATHS.logoBlack).arrayBuffer();

const C = BRAND.colors; // shorthand

function txt(text, opts = {}) {
  return new TextRun({
    text,
    font: opts.font || FONT_DOCX.body,
    size: opts.size || 22,
    color: opts.color || C.black,
    bold: opts.bold || false,
    italics: opts.italics || false,
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { line: 276, ...(opts.spacing || {}) },
    alignment: opts.alignment,
    border: opts.border,
    children: typeof text === "string" ? [txt(text, opts)] : text,
  });
}

function heading(text, level, opts = {}) {
  return new Paragraph({
    heading: level,
    spacing: { before: 260, after: 120, ...(opts.spacing || {}) },
    children: [txt(text, { font: FONT_DOCX.display, size: opts.size || 32, color: opts.color || C.black, bold: true })],
  });
}

function goldRule() {
  return new Paragraph({
    border: { bottom: { color: C.gold, style: BorderStyle.SINGLE, size: 6, space: 6 } },
    spacing: { before: 60, after: 160 },
    children: [],
  });
}

function thinRule() {
  return new Paragraph({
    border: { bottom: { color: C.titaniumLight, style: BorderStyle.SINGLE, size: 2, space: 4 } },
    spacing: { before: 40, after: 120 },
    children: [],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 30, after: 30, line: 264 },
    children: [
      txt("\u2022  ", { font: FONT_DOCX.mono, size: 20, color: C.gold }),
      txt(text, { size: 21, color: C.charcoal }),
    ],
  });
}

function checkbox(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40, line: 264 },
    children: [
      txt("\u2610  ", { font: FONT_DOCX.mono, size: 24, color: C.gold }),
      txt(text, { size: 21, color: C.charcoal }),
    ],
  });
}

function buildDocxHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        border: { bottom: { color: C.gold, style: BorderStyle.SINGLE, size: 6, space: 8 } },
        spacing: { after: 140 },
        children: [
          new ImageRun({
            data: Buffer.from(logoBlackBuf),
            transformation: { width: 96, height: 32 },
            type: "png",
          }),
          txt("   \u00B7   ", { font: FONT_DOCX.mono, size: 18, color: C.gold }),
          txt(BRAND.company, { font: FONT_DOCX.mono, size: 15, color: C.titanium }),
        ],
      }),
    ],
  });
}

function buildDocxFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { top: { color: C.gold, style: BorderStyle.SINGLE, size: 4, space: 8 } },
        spacing: { before: 60 },
        children: [
          txt(BRAND.website, { font: FONT_DOCX.mono, size: 15, color: C.gold, bold: true }),
          txt("  \u00B7  ", { font: FONT_DOCX.mono, size: 15, color: C.titaniumLight }),
          txt(BRAND.email, { font: FONT_DOCX.mono, size: 15, color: C.titanium }),
          txt("  \u00B7  Page ", { font: FONT_DOCX.mono, size: 15, color: C.titaniumLight }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT_DOCX.mono, size: 15, color: C.titanium }),
        ],
      }),
    ],
  });
}

function buildMetadataTable() {
  const fields = [
    ["Document Title", "Sentence case with VERTU as the owning brand."],
    ["Reference Code", "Timestamped reference, e.g. VERTU-BRIEF-0001."],
    ["Date", "Issue date in YYYY-MM-DD format."],
    ["Approvals", "Brand and legal approvers where claims exist."],
    ["Region", "Locale and language variant for final circulation."],
  ];

  const cellMargins = { top: 70, bottom: 70, left: 100, right: 100 };
  const headerFill = { type: ShadingType.CLEAR, fill: C.black, color: "auto" };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: headerFill,
            margins: cellMargins,
            children: [para("Field", { font: FONT_DOCX.mono, size: 19, color: C.gold, bold: true })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            shading: headerFill,
            margins: cellMargins,
            children: [para("Guidance", { font: FONT_DOCX.mono, size: 19, color: C.gold, bold: true })],
          }),
        ],
      }),
      ...fields.map(
        ([label, detail], i) =>
          new TableRow({
            children: [
              new TableCell({
                margins: cellMargins,
                shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? C.white : C.ivory, color: "auto" },
                borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: C.titaniumLight } },
                children: [para(label, { font: FONT_DOCX.mono, size: 19, color: C.black, bold: true })],
              }),
              new TableCell({
                margins: cellMargins,
                shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? C.white : C.ivory, color: "auto" },
                borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: C.titaniumLight } },
                children: [para(detail, { size: 20, color: C.charcoal })],
              }),
            ],
          })
      ),
    ],
  });
}

function buildDocx() {
  return new Document({
    creator: BRAND.company,
    title: `${LETTERHEAD_TEMPLATE.documentTitle} v${BRAND.version}`,
    description: LETTERHEAD_TEMPLATE.fileDescription,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.0),
              right: convertInchesToTwip(0.85),
              bottom: convertInchesToTwip(0.85),
              left: convertInchesToTwip(0.85),
            },
            borders: {
              pageBorderTop: { style: BorderStyle.SINGLE, size: 10, color: C.gold, space: 24 },
              pageBorderBottom: { style: BorderStyle.SINGLE, size: 6, color: C.goldDeep, space: 24 },
            },
          },
        },
        headers: { default: buildDocxHeader() },
        footers: { default: buildDocxFooter() },
        children: [
          // ── Cover ──
          new Paragraph({ spacing: { before: 300 }, children: [] }),

          heading("VERTU", HeadingLevel.TITLE, { size: 72, spacing: { before: 0, after: 40 } }),

          goldRule(),

          para("Letterhead Template", {
            font: FONT_DOCX.display,
            size: 38,
            bold: true,
            color: C.charcoal,
            spacing: { before: 20, after: 60 },
          }),
          para("Crafted Beyond Measure", {
            font: FONT_DOCX.display,
            size: 22,
            italics: true,
            color: C.goldDeep,
            spacing: { before: 0, after: 240 },
          }),

          para(
            "The VERTU Letterhead template is built for partner-facing materials requiring a premium editorial tone.",
            { size: 22, color: C.charcoal, spacing: { before: 60, after: 60, line: 300 } }
          ),
          para(
            "Use this file as a working production shell. Keep content concise, proofed, and approved before circulation.",
            { size: 22, color: C.charcoal, spacing: { before: 40, after: 60, line: 300 } }
          ),
          para("Spacing and hierarchy should remain unchanged unless legal or regulatory needs require annotations.", {
            size: 22,
            color: C.charcoal,
            spacing: { before: 40, after: 100, line: 300 },
          }),

          thinRule(),

          para(`Prepared for: ${BRAND.company}`, {
            font: FONT_DOCX.mono,
            size: 19,
            color: C.titanium,
            spacing: { before: 80, after: 40 },
          }),

          goldRule(),

          heading("Template Metadata", HeadingLevel.HEADING_1, { size: 26, spacing: { before: 40, after: 100 } }),
          buildMetadataTable(),

          // ── Production Notes ──
          goldRule(),
          heading("Production Notes", HeadingLevel.HEADING_1, { size: 26, spacing: { before: 60, after: 80 } }),

          para("Use this letterhead for partner proposals, campaign briefs, and premium correspondence.", {
            size: 22,
            color: C.charcoal,
            spacing: { before: 60, after: 60 },
          }),

          para("Core Requirements", {
            font: FONT_DOCX.mono,
            size: 20,
            color: C.black,
            bold: true,
            spacing: { before: 100, after: 40 },
          }),
          bullet("Use approved logos and media only."),
          bullet("Preserve spacing: section headline, body statement, action notes."),
          bullet("Use title case for short labels; keep paragraphs concise."),
          bullet("Route legal claims through approved review channels."),

          // ── Page 2: Approval ──
          new Paragraph({ children: [new PageBreak()] }),

          heading("Approval Gate", HeadingLevel.HEADING_1, { size: 28, spacing: { before: 60, after: 80 } }),
          goldRule(),
          para("Confirm all checkpoints before circulation.", {
            size: 22,
            color: C.charcoal,
            spacing: { before: 40, after: 80 },
          }),

          checkbox("Brand tone and claims reviewed"),
          checkbox("Legal implications reviewed"),
          checkbox("Localization and jurisdiction confirmed"),
          checkbox("Visuals pass contrast and metadata checks"),

          thinRule(),

          para(`Prepared for: ${BRAND.company}`, {
            font: FONT_DOCX.mono,
            size: 19,
            color: C.titanium,
            spacing: { before: 80, after: 20 },
          }),
          para(BRAND.email, {
            font: FONT_DOCX.mono,
            size: 19,
            color: C.goldDeep,
            bold: true,
            spacing: { before: 20, after: 0 },
          }),

          // ── Page 3: Placeholder Body ──
          new Paragraph({ children: [new PageBreak()] }),

          heading("Partner Release Sheet", HeadingLevel.HEADING_1, { size: 28, spacing: { before: 60, after: 60 } }),
          goldRule(),

          para("[Campaign title]", { size: 24, bold: true, color: C.black, spacing: { before: 60, after: 40 } }),
          para("[Opening paragraph: audience, objective, and priority.]", {
            size: 22,
            color: C.charcoal,
            spacing: { before: 20, after: 80 },
          }),

          thinRule(),

          para("[Section 1]", { size: 23, bold: true, color: C.black, spacing: { before: 100, after: 20 } }),
          para("[Add campaign notes and partner commitments here.]", {
            size: 22,
            color: C.charcoal,
            spacing: { before: 20, after: 60 },
          }),

          para("[Section 2]", { size: 23, bold: true, color: C.black, spacing: { before: 100, after: 20 } }),
          para("[Add proof points, dates, and final actions here.]", {
            size: 22,
            color: C.charcoal,
            spacing: { before: 20, after: 60 },
          }),

          thinRule(),

          para("[Remove all placeholder brackets before publication.]", {
            italics: true,
            size: 21,
            color: C.goldDeep,
            spacing: { before: 140, after: 0 },
          }),
        ],
      },
    ],
  });
}

/* ─────────────────────────────────────────────
   BUILD & EXPORT
   ───────────────────────────────────────────── */

const pptx = buildPptx();
const pptxBuf = await pptx.write({ outputType: "uint8array" });
await Bun.write(GUIDE_BRAND_FILE_PATHS.presentationTemplate, pptxBuf);

const doc = buildDocx();
const docxBuf = new Uint8Array(await Packer.toBuffer(doc));
await Bun.write(GUIDE_BRAND_FILE_PATHS.letterheadTemplate, docxBuf);

writeStructuredLog({
  component: "templates",
  level: "INFO",
  message: "Generated presentation template",
  context: { kilobytes: Number((pptxBuf.byteLength / 1024).toFixed(0)), type: "pptx" },
});
writeStructuredLog({
  component: "templates",
  level: "INFO",
  message: "Generated letterhead template",
  context: { kilobytes: Number((docxBuf.byteLength / 1024).toFixed(0)), type: "docx" },
});

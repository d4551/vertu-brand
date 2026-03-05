# VERTU Downloads Enhancement Plan

## Overview
Enhance the Downloads & Assets section with social media template generation, improved letterhead design, PPTX polish, and new UI cards — all following existing VERTU brand patterns.

---

## 1. Social Media Template Generator (Client-Side Canvas)
**Pattern:** Mirror the existing Interactive Asset Generator in s15 — Canvas API + download button, no server needed.

### 1a. HTML — New bento card in s15 (index.html, after the Logo Files card)
- Add a `bento-col-12` card titled "Social Media Templates" / "社交媒体模板"
- Controls panel (left):
  - **Format select** — Instagram Post (1080×1080), Instagram Story (1080×1920), LinkedIn Post (1200×627), X/Twitter Header (1500×500)
  - **Theme toggle** — Dark (black bg, white/gold logo) / Light (ivory bg, black/gold logo)
  - **Headline input** — Custom text field for tagline (e.g. "Crafted Beyond Measure")
  - **Generate & Download button** (`.vertu-btn--filled`)
- Preview canvas (right) — live preview at scaled size
- All labels use `text-base-content`, `bg-base-200`, `border-base-300` (theme-aware tokens from our previous fixes)
- Bilingual `data-lang-en` / `data-lang-cn` on all labels

### 1b. CSS — Social media generator styles (brand-guide.css)
- `.social-preview-surface` with checkerboard pattern (reuse `.gen-preview-surface` pattern)
- Responsive: controls stack vertically on mobile

### 1c. JS — Canvas rendering + download (brand-guide.js)
- New `initSocialGenerator()` function, called on DOMContentLoaded
- Canvas rendering logic:
  - Fill background with brand color based on theme (dark: #080808, light: #FAF7F2)
  - Draw VERTU wordmark centered using the hidden source images (`src-logo-white`, `src-logo-black`, `src-logo-gold`)
  - Draw gold horizontal rule below logo (2px, gold #D4B978)
  - Draw headline text in DM Sans below the rule
  - Draw "VERTU" small footer text at bottom in IBM Plex Mono
  - Apply clear-space ratios proportional to canvas size
- Download via `canvas.toBlob()` → `URL.createObjectURL()` → anchor click
- Add format configs to `APP_CONFIG.playback`:
  ```
  socialFormats: {
    'ig-post':  { w: 1080, h: 1080, label: 'Instagram Post' },
    'ig-story': { w: 1080, h: 1920, label: 'Instagram Story' },
    'linkedin': { w: 1200, h: 627,  label: 'LinkedIn Post' },
    'x-header': { w: 1500, h: 500,  label: 'X / Twitter Header' },
  }
  ```
- Add bilingual i18n strings for all new UI text

### 1d. Quick-download cards — Static presets (no generator)
- Below the generator, add a `.download-grid` with 4 preset download buttons:
  - IG Post Dark, IG Story Dark, LinkedIn Dark, X Header Dark
- Each button generates the default dark-theme template on click and triggers download
- Uses same download-card pattern as logo files

---

## 2. PPTX Template Polish (generate-templates.mjs)
**Current state:** 9 slides with text-only layouts. Improvements:

### 2a. Add Slide Masters for consistent branding
- Define `VERTU_DARK` and `VERTU_LIGHT` masters using `pptx.defineSlideMaster()`:
  - Gold accent line (shape) across bottom of each slide
  - Footer text: "VERTU Limited · www.vertu.com" in IBM Plex Mono
  - Slide number in bottom-right
- Apply masters to all slides via `masterName`

### 2b. Add gold accent shapes to each slide
- Thin gold horizontal rule (`pptx.ShapeType.line`) below title on every module slide
- Gold rectangle accent bar on the left edge of cover slide

### 2c. Cover slide enhancement
- Add a black background with centered "VERTU" text in large Playfair Display
- Gold rule divider below title
- Subtitle and metadata below in DM Sans / IBM Plex Mono

### 2d. Verify generation works
- Run `node scripts/generate-templates.mjs` and confirm PPTX writes successfully

---

## 3. Letterhead Design Improvement (generate-templates.mjs)

### 3a. Premium header redesign
- Replace simple text header with:
  - "VERTU" in bold Playfair Display, left-aligned
  - Gold horizontal rule (paragraph border-bottom, color D4B978, 1.5pt)
  - "VERTU Limited · Version 4.0 · © 2026" in IBM Plex Mono below rule
  - More generous spacing (top margin 1in)

### 3b. Gold page border
- Add page borders using `IPageBordersOptions`:
  - Top: gold (#D4B978) single line, 6pt
  - Bottom: gold single line, 4pt
  - Left/Right: none (clean editorial look)

### 3c. Cover page refinement
- Increase title size (52pt Playfair Display)
- Add gold divider paragraph after title (using paragraph border-bottom)
- Improve metadata table: gold header row, alternating cream/ivory rows (already exists, refine spacing)
- Add brand tagline: "Crafted Beyond Measure" in italics after intro

### 3d. Body page improvements
- Add subtle section divider (gold border-bottom on heading paragraphs)
- Increase line spacing for body text (1.3x → 1.5x for readability)
- Footer: add gold dot separator between company and URL

### 3e. Document background
- Set document background to subtle ivory (#FDFBF7) using `Document({ background: { color: 'FDFBF7' } })`

### 3f. Verify generation
- Run build and confirm DOCX writes successfully

---

## 4. UI Updates — Download Cards (index.html + brand-guide.css)

### 4a. Add Social Media section to downloads
- New bento card between Templates and Design Tokens cards
- Contains the interactive generator (from step 1) + preset download cards

### 4b. Update APP_CONFIG.files
- No static file entries needed for social media (generated client-side)
- Existing PPTX/DOCX entries remain (they download the regenerated files)

### 4c. Update template card descriptions
- PPTX: Update to reflect slide masters and gold accents
- DOCX: Update to reflect premium letterhead with page borders

---

## Build & Verification Sequence
1. Edit `generate-templates.mjs` — PPTX masters + letterhead redesign
2. Run `node scripts/generate-templates.mjs` to regenerate .pptx and .docx
3. Edit `index.html` — Add social media generator HTML + preset cards
4. Edit `brand-guide.css` — Add social generator styles
5. Edit `brand-guide.js` — Add social generator JS + i18n strings
6. Visual verification in preview server — both themes, all viewports
7. Test downloads: social media PNGs, PPTX, DOCX, logo PNGs

---

## Files Modified
| File | Changes |
|------|---------|
| `scripts/generate-templates.mjs` | PPTX slide masters, gold accents, letterhead redesign |
| `index.html` | Social media generator HTML, preset download cards |
| `styles/brand-guide.css` | Social generator surface styles |
| `scripts/brand-guide.js` | Social generator JS, i18n strings, APP_CONFIG updates |
| `VERTU-Template.pptx` | Regenerated with improvements |
| `VERTU-Letterhead.docx` | Regenerated with premium design |

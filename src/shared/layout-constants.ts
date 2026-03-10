/**
 * Shared layout constants used by JS and referenced in CSS comments.
 * Keep in sync with Tailwind/daisyUI breakpoints and brand-guide.css.
 *
 * Breakpoint reference (Tailwind v4):
 *   sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1400px
 */
export const LAYOUT_CONSTANTS = {
  /** Drawer becomes modal below this width (matches lg: 1024px) */
  drawerModalBreakpointPx: 1024,

  /** Drawer sidebar CSS uses width <= 1023px for mobile */
  drawerMobileMaxPx: 1023,

  /** Sidebar width when open at lg+ (for content area calculations) */
  sidebarWidthPx: 320,

  /** Scroll-padding-top for anchor links (navbar height) */
  scrollPaddingTopPx: 72,

  /** Focus line for visible-section detection: viewport ratio (0–1) */
  visibleSectionFocusRatio: 0.35,

  /** Max focus line offset in px (caps the ratio on tall viewports) */
  visibleSectionFocusMaxPx: 320,
} as const;

/** Toast display duration in ms */
export const TOAST_DURATION_MS = 2200;

/** Copy button "copied" label reset delay in ms */
export const COPY_BUTTON_RESET_MS = 1600;

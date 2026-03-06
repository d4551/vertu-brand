/**
 * Stable DOM ids shared by the SSR shell, HTMX wiring, and browser-only enhancements.
 */
export const GUIDE_DOM_IDS = {
  cover: "guide-cover",
  coverScroll: "guide-cover-scroll",
  drawerCloseButton: "drawerCloseButton",
  drawerControl: "guide-drawer-control",
  drawerNav: "drawerNav",
  drawerOpenButton: "drawerOpenButton",
  drawerOverlay: "drawerOverlay",
  mainContent: "guide-main-content",
  mainRegion: "guide-main-region",
  page: "guide-page",
  requestIndicator: "guide-request-indicator",
  scrollProgress: "scrollProgress",
  sectionPanel: "guide-section-panel",
  shell: "guide-shell",
  sidebarPanel: "guide-sidebar-panel",
  toastContainer: "toastContainer",
  toastMessage: "toastMessage",
} as const;

/**
 * Stable selectors derived from the shell ids for server markup and client code.
 */
export const GUIDE_SELECTORS = {
  cover: `#${GUIDE_DOM_IDS.cover}`,
  coverScroll: `#${GUIDE_DOM_IDS.coverScroll}`,
  drawerCloseButton: `#${GUIDE_DOM_IDS.drawerCloseButton}`,
  drawerControl: `#${GUIDE_DOM_IDS.drawerControl}`,
  drawerOpenButton: `#${GUIDE_DOM_IDS.drawerOpenButton}`,
  mainContent: `#${GUIDE_DOM_IDS.mainContent}`,
  mainRegion: `#${GUIDE_DOM_IDS.mainRegion}`,
  page: `#${GUIDE_DOM_IDS.page}`,
  requestIndicator: `#${GUIDE_DOM_IDS.requestIndicator}`,
  scrollProgress: `#${GUIDE_DOM_IDS.scrollProgress}`,
  sectionPanel: `#${GUIDE_DOM_IDS.sectionPanel}`,
  shell: `#${GUIDE_DOM_IDS.shell}`,
  sidebarPanel: `#${GUIDE_DOM_IDS.sidebarPanel}`,
  toastContainer: `#${GUIDE_DOM_IDS.toastContainer}`,
  toastMessage: `#${GUIDE_DOM_IDS.toastMessage}`,
} as const;

/**
 * Shared HTMX request behavior for the server-driven shell.
 */
export const GUIDE_HTMX = {
  boostEnabled: "true",
  disabledFormElements: "find select",
  pageIndicator: GUIDE_SELECTORS.requestIndicator,
  pageSwap: "outerHTML",
  shellIndicator: GUIDE_SELECTORS.requestIndicator,
  shellSwap: "outerHTML",
  shellSwapShowMain: `outerHTML show:${GUIDE_SELECTORS.mainRegion}:top`,
} as const;

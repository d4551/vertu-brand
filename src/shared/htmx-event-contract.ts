/**
 * Canonical HTMX browser event names used by progressive enhancements.
 */
export const HTMX_BROWSER_EVENTS = {
  afterRequest: "htmx:afterRequest",
  afterSwap: "htmx:afterSwap",
  beforeRequest: "htmx:beforeRequest",
  historyRestore: "htmx:historyRestore",
  responseError: "htmx:responseError",
  sendError: "htmx:sendError",
  timeout: "htmx:timeout",
} as const;

/**
 * Shared HTMX event detail contract for events that expose a target element.
 */
export interface HtmxTargetedEventDetail {
  elt?: Element | null;
  target?: EventTarget | null;
  xhr?: XMLHttpRequest;
}

/**
 * HTMX request lifecycle event detail contract.
 */
export interface HtmxRequestLifecycleEventDetail extends HtmxTargetedEventDetail {
  failed?: boolean;
  successful?: boolean;
}

/**
 * HTMX swap-complete event detail contract.
 */
export interface HtmxAfterSwapEventDetail extends HtmxTargetedEventDetail {
  fragment?: DocumentFragment | Element | null;
}

/**
 * HTMX history restore event detail contract.
 */
export interface HtmxHistoryRestoreEventDetail {
  path?: string;
}

/**
 * Resolves an HTMLElement target from a typed HTMX browser event.
 */
export const resolveHtmxEventTarget = (
  event: CustomEvent<HtmxAfterSwapEventDetail | HtmxRequestLifecycleEventDetail>
): HTMLElement | null => (isHTMLElementTarget(event.detail.target) ? event.detail.target : null);

const isHTMLElementTarget = (target: EventTarget | null | undefined): target is HTMLElement =>
  typeof HTMLElement !== "undefined" && target instanceof HTMLElement;

declare global {
  interface DocumentEventMap {
    "htmx:afterRequest": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:afterSwap": CustomEvent<HtmxAfterSwapEventDetail>;
    "htmx:beforeRequest": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:historyRestore": CustomEvent<HtmxHistoryRestoreEventDetail>;
    "htmx:responseError": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:sendError": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:timeout": CustomEvent<HtmxRequestLifecycleEventDetail>;
  }

  interface HTMLElementEventMap {
    "htmx:afterRequest": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:afterSwap": CustomEvent<HtmxAfterSwapEventDetail>;
    "htmx:beforeRequest": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:historyRestore": CustomEvent<HtmxHistoryRestoreEventDetail>;
    "htmx:responseError": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:sendError": CustomEvent<HtmxRequestLifecycleEventDetail>;
    "htmx:timeout": CustomEvent<HtmxRequestLifecycleEventDetail>;
  }
}

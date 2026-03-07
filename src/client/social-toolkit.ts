import { GUIDE_ASSET_OPERATOR_IDS } from "../shared/asset-operator-contract";
import {
  HTMX_BROWSER_EVENTS,
  resolveHtmxEventTarget,
  type HtmxAfterSwapEventDetail,
  type HtmxRequestLifecycleEventDetail,
} from "../shared/htmx-event-contract";
import { normalizeGuideSocialPreviewState, toSocialGuideHref } from "../shared/social-toolkit";
import { resolveGuideState } from "../shared/view-state";

let socialPreviewEventsBound = false;
let pendingSocialSubmitFrame = 0;

type SocialHistoryMode = "push" | "replace";

const resolveSocialPreviewTarget = (
  event: CustomEvent<HtmxAfterSwapEventDetail | HtmxRequestLifecycleEventDetail>
): HTMLElement | null => {
  const target = resolveHtmxEventTarget(event);
  return target?.id === GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel ? target : null;
};

const syncPreviewPanelState = (panel: HTMLElement): void => {
  const stateRoot = panel.querySelector<HTMLElement>("[data-social-state]");
  const state = normalizeGuideSocialPreviewState(stateRoot?.dataset.socialState ?? panel.dataset.socialState);
  panel.dataset.socialState = state;
  panel.setAttribute("aria-busy", state === "loading" ? "true" : "false");
};

const resolveSelectedPackOption = (selectPack: HTMLSelectElement): HTMLOptionElement | null =>
  selectPack.selectedOptions[0] ?? null;

const hasOptionValue = (selectElement: HTMLSelectElement, value: string): boolean =>
  Array.from(selectElement.options).some((option) => option.value === value);

const applyHistoryMode = (form: HTMLFormElement, href: string, historyMode: SocialHistoryMode): void => {
  if (historyMode === "replace") {
    form.setAttribute("hx-replace-url", href);
    form.removeAttribute("hx-push-url");
    return;
  }

  form.setAttribute("hx-push-url", href);
  form.removeAttribute("hx-replace-url");
};

const queuePreviewSubmit = (form: HTMLFormElement, previewPanel: HTMLElement, historyMode: SocialHistoryMode): void => {
  if (pendingSocialSubmitFrame) {
    window.cancelAnimationFrame(pendingSocialSubmitFrame);
  }

  pendingSocialSubmitFrame = window.requestAnimationFrame(() => {
    pendingSocialSubmitFrame = 0;
    if (!form.isConnected || !previewPanel.isConnected) {
      return;
    }

    form.dataset.socialHistoryMode = historyMode;
    previewPanel.dataset.socialState = "loading";
    previewPanel.setAttribute("aria-busy", "true");
    form.requestSubmit();
  });
};

/**
 * Runtime hooks required by the social toolkit enhancement.
 */
export interface SocialToolkitDependencies {
  resolveGuidePage: () => HTMLElement | null;
  resolveShell: () => HTMLElement | null;
}

/**
 * Syncs social toolkit hidden form fields and initial preview submit behavior.
 */
export const initializeSocialToolkit = ({ resolveGuidePage, resolveShell }: SocialToolkitDependencies): void => {
  const form = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialForm);
  const selectAssetKind = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialAssetKind);
  const hiddenLanguage = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialHiddenLanguage);
  const hiddenSection = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialHiddenSection);
  const selectPack = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialPack);
  const selectApprovedAsset = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialApprovedAsset);
  const selectTheme = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialTheme);
  const previewPanel = document.getElementById(GUIDE_ASSET_OPERATOR_IDS.socialPreviewPanel);

  if (
    !(form instanceof HTMLFormElement) ||
    !(selectAssetKind instanceof HTMLSelectElement) ||
    !(hiddenLanguage instanceof HTMLInputElement) ||
    !(hiddenSection instanceof HTMLInputElement) ||
    !(selectPack instanceof HTMLSelectElement) ||
    !(selectApprovedAsset instanceof HTMLSelectElement) ||
    !(selectTheme instanceof HTMLSelectElement) ||
    !(previewPanel instanceof HTMLElement)
  ) {
    return;
  }

  if (!socialPreviewEventsBound && document.body) {
    document.body.addEventListener(HTMX_BROWSER_EVENTS.afterSwap, (event) => {
      const target = resolveSocialPreviewTarget(event);
      if (target) {
        syncPreviewPanelState(target);
      }
    });
    document.body.addEventListener(HTMX_BROWSER_EVENTS.responseError, (event) => {
      const target = resolveSocialPreviewTarget(event);
      if (target) {
        target.dataset.socialState = "error";
        target.setAttribute("aria-busy", "false");
      }
    });
    document.body.addEventListener(HTMX_BROWSER_EVENTS.sendError, (event) => {
      const target = resolveSocialPreviewTarget(event);
      if (target) {
        target.dataset.socialState = "error";
        target.setAttribute("aria-busy", "false");
      }
    });
    document.body.addEventListener(HTMX_BROWSER_EVENTS.timeout, (event) => {
      const target = resolveSocialPreviewTarget(event);
      if (target) {
        target.dataset.socialState = "error";
        target.setAttribute("aria-busy", "false");
      }
    });
    socialPreviewEventsBound = true;
  }

  const syncAllowedAssetKinds = (): void => {
    const selectedPackOption = resolveSelectedPackOption(selectPack);
    const allowedKindList = selectedPackOption?.dataset.assetKinds
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
    const allowedKinds = new Set<string>(allowedKindList);

    Array.from(selectAssetKind.options).forEach((option) => {
      const isAllowed = allowedKinds.size === 0 || allowedKinds.has(option.value);
      option.disabled = !isAllowed;
      option.hidden = !isAllowed;
    });

    if (allowedKinds.size > 0 && !allowedKinds.has(selectAssetKind.value)) {
      selectAssetKind.value = allowedKindList[0] ?? selectAssetKind.value;
    }
  };

  const syncFormState = (): string => {
    const guideState = resolveGuideState({
      language: resolveGuidePage()?.dataset.language ?? resolveShell()?.dataset.language,
      section: resolveGuidePage()?.dataset.activeSection ?? resolveShell()?.dataset.activeSection,
      theme: resolveGuidePage()?.dataset.theme ?? resolveShell()?.dataset.theme,
    });

    hiddenLanguage.value = guideState.language;
    hiddenSection.value = guideState.section;

    const selectedPackOption = resolveSelectedPackOption(selectPack);
    if (selectedPackOption) {
      const defaultTheme = selectedPackOption.dataset.defaultTheme;
      if (selectTheme.dataset.userSelected !== "true" && defaultTheme && hasOptionValue(selectTheme, defaultTheme)) {
        selectTheme.value = defaultTheme;
      }

      const defaultApprovedAsset = selectedPackOption.dataset.defaultApprovedAsset;
      if (
        selectApprovedAsset.dataset.userSelected !== "true" &&
        defaultApprovedAsset &&
        hasOptionValue(selectApprovedAsset, defaultApprovedAsset)
      ) {
        selectApprovedAsset.value = defaultApprovedAsset;
      }
    }

    syncAllowedAssetKinds();
    return toSocialGuideHref({
      approvedAssetId: selectApprovedAsset.value,
      assetKind: selectAssetKind.value,
      guideTheme: guideState.theme,
      language: guideState.language,
      packId: selectPack.value,
      section: guideState.section,
      socialTheme: selectTheme.value,
    });
  };

  applyHistoryMode(form, syncFormState(), "replace");
  syncPreviewPanelState(previewPanel);

  if (form.dataset.enhanced === "true") {
    return;
  }

  form.dataset.enhanced = "true";
  form.addEventListener("change", (event) => {
    if (event.target === selectPack) {
      syncAllowedAssetKinds();
    }

    if (event.target === selectApprovedAsset) {
      selectApprovedAsset.dataset.userSelected = "true";
    }

    if (event.target === selectTheme) {
      selectTheme.dataset.userSelected = "true";
    }

    applyHistoryMode(form, syncFormState(), "push");
    queuePreviewSubmit(form, previewPanel, "push");
  });
  form.addEventListener("submit", () => {
    const historyMode = form.dataset.socialHistoryMode === "replace" ? "replace" : "push";
    applyHistoryMode(form, syncFormState(), historyMode);
    delete form.dataset.socialHistoryMode;
    previewPanel.dataset.socialState = "loading";
    previewPanel.setAttribute("aria-busy", "true");
  });

  if (normalizeGuideSocialPreviewState(previewPanel.dataset.socialState) === "idle") {
    form.dataset.socialHistoryMode = "replace";
    form.requestSubmit();
  }
};

import { toSocialGuideHref } from "../shared/social-toolkit";
import { isGuideLanguage, isGuideSectionId, normalizeGuideTheme } from "../shared/view-state";

const SOCIAL_TOOLKIT_IDS = {
  assetKind: "social-format",
  form: "social-toolkit-form",
  hiddenLanguage: "social-language",
  hiddenSection: "social-section",
  pack: "social-pack",
  previewPanel: "social-preview-panel",
  selectTheme: "social-theme",
} as const;

let socialPreviewEventsBound = false;
let pendingSocialSubmitFrame = 0;

type SocialHistoryMode = "push" | "replace";

const syncPreviewPanelState = (panel: HTMLElement): void => {
  const stateRoot = panel.querySelector<HTMLElement>("[data-social-state]");
  const state = stateRoot?.dataset.socialState ?? panel.dataset.socialState ?? "idle";
  if (state) {
    panel.dataset.socialState = state;
  }
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
  const form = document.getElementById(SOCIAL_TOOLKIT_IDS.form);
  const selectAssetKind = document.getElementById(SOCIAL_TOOLKIT_IDS.assetKind);
  const hiddenLanguage = document.getElementById(SOCIAL_TOOLKIT_IDS.hiddenLanguage);
  const hiddenSection = document.getElementById(SOCIAL_TOOLKIT_IDS.hiddenSection);
  const selectPack = document.getElementById(SOCIAL_TOOLKIT_IDS.pack);
  const selectApprovedAsset = document.getElementById("social-approved-asset");
  const selectTheme = document.getElementById(SOCIAL_TOOLKIT_IDS.selectTheme);
  const previewPanel = document.getElementById(SOCIAL_TOOLKIT_IDS.previewPanel);

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
    document.body.addEventListener("htmx:afterSwap", (event: Event) => {
      const detail = event instanceof CustomEvent ? Reflect.get(event, "detail") : null;
      const target = detail && typeof detail === "object" ? Reflect.get(detail, "target") : null;
      if (target instanceof HTMLElement && target.id === SOCIAL_TOOLKIT_IDS.previewPanel) {
        syncPreviewPanelState(target);
      }
    });
    document.body.addEventListener("htmx:responseError", (event: Event) => {
      const detail = event instanceof CustomEvent ? Reflect.get(event, "detail") : null;
      const target = detail && typeof detail === "object" ? Reflect.get(detail, "target") : null;
      if (target instanceof HTMLElement && target.id === SOCIAL_TOOLKIT_IDS.previewPanel) {
        target.dataset.socialState = "error";
        target.setAttribute("aria-busy", "false");
      }
    });
    document.body.addEventListener("htmx:sendError", (event: Event) => {
      const detail = event instanceof CustomEvent ? Reflect.get(event, "detail") : null;
      const target = detail && typeof detail === "object" ? Reflect.get(detail, "target") : null;
      if (target instanceof HTMLElement && target.id === SOCIAL_TOOLKIT_IDS.previewPanel) {
        target.dataset.socialState = "error";
        target.setAttribute("aria-busy", "false");
      }
    });
    document.body.addEventListener("htmx:timeout", (event: Event) => {
      const detail = event instanceof CustomEvent ? Reflect.get(event, "detail") : null;
      const target = detail && typeof detail === "object" ? Reflect.get(detail, "target") : null;
      if (target instanceof HTMLElement && target.id === SOCIAL_TOOLKIT_IDS.previewPanel) {
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
    const languageValue = resolveGuidePage()?.dataset.language || resolveShell()?.dataset.language || "bi";
    const sectionValue = resolveGuidePage()?.dataset.activeSection || resolveShell()?.dataset.activeSection || "s0";
    const guideThemeValue = resolveGuidePage()?.dataset.theme || resolveShell()?.dataset.theme || "dark";
    const language = isGuideLanguage(languageValue) ? languageValue : "bi";
    const section = isGuideSectionId(sectionValue) ? sectionValue : "s0";
    const guideTheme = normalizeGuideTheme(guideThemeValue);

    hiddenLanguage.value = language;
    hiddenSection.value = section;

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
      guideTheme,
      language,
      packId: selectPack.value,
      section,
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

  if (previewPanel.dataset.socialState === "idle") {
    form.dataset.socialHistoryMode = "replace";
    form.requestSubmit();
  }
};

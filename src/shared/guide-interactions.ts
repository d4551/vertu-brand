const TYPE_PREVIEW_CLASS_NAMES = {
  "'DM Sans',sans-serif": "type-preview-body",
  "'IBM Plex Mono',monospace": "type-preview-mono",
  "'Playfair Display',serif": "type-preview-default",
} as const;

const DEFAULT_TYPE_PREVIEW_CLASS_NAME = TYPE_PREVIEW_CLASS_NAMES["'Playfair Display',serif"];

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const hasRecordKey = <Key extends string>(record: Record<Key, string>, value: string): value is Key =>
  Object.hasOwn(record, value);

const normalizeTrackingLabel = (trackingValue: number): string => `${Number(trackingValue.toFixed(2))}em`;

const resolveTypePreviewClassName = (fontValue: string): string =>
  hasRecordKey(TYPE_PREVIEW_CLASS_NAMES, fontValue)
    ? TYPE_PREVIEW_CLASS_NAMES[fontValue]
    : DEFAULT_TYPE_PREVIEW_CLASS_NAME;

const readNumericInput = (value: string, fallback: number): number => {
  const parsed = value.trim() === "" ? Number.NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Normalizes the typography playground inputs into a bounded render model.
 */
export const resolveTypePlaygroundState = (
  fontValue: string,
  sizeValue: string,
  weightValue: string,
  trackingValue: string
): {
  fontSizePx: number;
  fontWeight: number;
  previewClassName: string;
  trackingEm: number;
  trackingLabel: string;
  weightLabel: string;
  sizeLabel: string;
} => {
  const previewClassName = resolveTypePreviewClassName(fontValue);
  const fontSizePx = clamp(readNumericInput(sizeValue, 48), 12, 96);
  const fontWeight = clamp(Math.round(readNumericInput(weightValue, 400) / 100) * 100, 300, 700);
  const trackingEm = clamp(readNumericInput(trackingValue, 0), -5, 30) / 100;

  return {
    fontSizePx,
    fontWeight,
    previewClassName,
    sizeLabel: `${fontSizePx}px`,
    trackingEm,
    trackingLabel: normalizeTrackingLabel(trackingEm),
    weightLabel: `${fontWeight}`,
  };
};

/**
 * Converts document scroll metrics into a bounded progress-bar percentage.
 */
export const resolveScrollProgressPercent = (
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number
): number => {
  const availableDistance = Math.max(scrollHeight - viewportHeight, 0);
  if (availableDistance === 0) {
    return 0;
  }

  return clamp((Math.max(scrollTop, 0) / availableDistance) * 100, 0, 100);
};

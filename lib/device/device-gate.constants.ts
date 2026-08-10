/**
 * Single source of truth for the desktop-only viewport policy. Anything
 * that needs to know the threshold — the detection hook, the restricted
 * screen's "Required: ≥ Npx" readout — imports from here, never
 * hardcodes 1024 independently.
 */
export const DEVICE_GATE_MIN_WIDTH_PX = 1024;

export const DEVICE_GATE_MEDIA_QUERY =
  `(min-width: ${DEVICE_GATE_MIN_WIDTH_PX}px)` as const;

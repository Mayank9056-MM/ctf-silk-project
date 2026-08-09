export const eventControlKeys = {
  /**
   * The one and only key. Backs useEventControl()'s query directly, and
   * is what every EventControl mutation hook (pause, resume, and
   * toggling registration) invalidates on success.
   */
  all: ["event-control"] as const,
};

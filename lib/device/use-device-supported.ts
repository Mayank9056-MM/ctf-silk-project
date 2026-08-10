"use client";

import { useSyncExternalStore } from "react";
import { DEVICE_GATE_MEDIA_QUERY } from "./device-gate.constants";

/**
 * Capability-based, not UA-based: subscribes to a single matchMedia
 * query and re-evaluates on change (covers window resize AND device
 * rotation, unlike a one-time window.innerWidth read on mount).
 *
 * getServerSnapshot fails OPEN (true = "supported"). This is a UX/
 * compatibility boundary, not a security control (see DeviceGate's own
 * header), so there is no reason to default-block a visitor the server
 * can't yet evaluate. See this feature's accompanying design note for
 * the accepted trade-off this creates (a brief possible flash on an
 * actually-unsupported device) and why it was not "fixed" with a
 * synchronous pre-hydration script.
 */
function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(DEVICE_GATE_MEDIA_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(DEVICE_GATE_MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useDeviceSupported(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

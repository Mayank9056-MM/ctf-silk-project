"use client";

import gsap from "gsap";

/**
 * Builds (but does not play) the letterbox-in → hold → letterbox-out
 * choreography around a cinematic beat (intro/outro cards). Returns the
 * timeline so the caller controls play/kill/cleanup — this file only
 * owns timeline construction, not lifecycle, matching the "proper
 * cleanup of GSAP contexts" requirement (cleanup is the calling
 * component's useGSAP scope's job).
 */
export function buildLetterboxTimeline(target: Element | null): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  if (!target) return tl;
  tl.set(target, { attr: { "data-active": "true" } });
  return tl;
}
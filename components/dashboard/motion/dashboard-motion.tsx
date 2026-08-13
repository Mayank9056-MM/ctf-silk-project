"use client";

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

/**
 * The dashboard's single one-shot entrance timeline. GSAP owns this and
 * only this — every local UI transition (popovers, hover, list changes)
 * belongs to Motion instead (see dashboard-reveal.tsx / dashboard-stagger.tsx).
 * Targets are matched by className within `scope`, so a target that
 * doesn't exist on a given render (e.g. no announcements) simply matches
 * zero elements — no "GSAP target not found" warnings.
 */
export function useDashboardEntrance(): RefObject<HTMLDivElement | null> {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(".sr-dash-anim-bg", { opacity: 0, duration: 0.35 }, 0)
          .from(
            ".sr-dash-anim-header",
            { opacity: 0, y: -8, duration: 0.3 },
            0.1,
          )
          .from(
            ".sr-dash-anim-status",
            { opacity: 0, y: 6, duration: 0.3 },
            0.2,
          )
          .from(
            ".sr-dash-anim-character",
            { opacity: 0, x: 24, duration: 0.6, ease: "power3.out" },
            0.15,
          )
          .from(".sr-dash-anim-hero", { opacity: 0, y: 10, duration: 0.4 }, 0.3)
          .from(
            ".sr-dash-anim-intel",
            { opacity: 0, y: 10, duration: 0.35, stagger: 0.06 },
            0.42,
          )
          .from(
            ".sr-dash-anim-secondary",
            { opacity: 0, y: 10, duration: 0.35, stagger: 0.07 },
            0.52,
          );

        // Once the timeline actually completes, strip every inline style it
        // added — CSS already guarantees opacity:1 (see globals.css), so
        // this just avoids leaving stray inline styles behind after a
        // finished animation, and removes one more way a stuck mid-flight
        // interrupt could leave something in a half-set state.
        tl.set(
          ".sr-dash-anim-bg, .sr-dash-anim-header, .sr-dash-anim-status, .sr-dash-anim-character, .sr-dash-anim-hero, .sr-dash-anim-intel, .sr-dash-anim-secondary",
          { clearProps: "opacity,transform" },
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          ".sr-dash-anim-bg, .sr-dash-anim-header, .sr-dash-anim-status, .sr-dash-anim-character, .sr-dash-anim-hero, .sr-dash-anim-intel, .sr-dash-anim-secondary",
          { opacity: 1, x: 0, y: 0, clearProps: "opacity,transform" },
        );
      });

      return () => mm.revert();
    },
    { scope: scopeRef },
  );

  return scopeRef;
}

"use client";

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

/**
 * Same one-shot-entrance-with-reduced-motion-fallback pattern as
 * dashboard-motion.tsx / story-gsap.ts, retargeted to this page's own
 * class names. Podium cards stagger in with a slightly heavier ease
 * than the rest of the page, since they're the visual anchor.
 */
export function useLeaderboardEntrance(): RefObject<HTMLDivElement | null> {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(".sr-lb-anim-bg", { opacity: 0, duration: 0.4 }, 0)
          .from(".sr-lb-anim-hero", { opacity: 0, y: -10, duration: 0.35 }, 0.05)
          .from(
            ".sr-lb-anim-podium",
            { opacity: 0, y: 24, duration: 0.5, stagger: 0.08, ease: "power3.out" },
            0.2,
          )
          .from(".sr-lb-anim-table", { opacity: 0, y: 14, duration: 0.4 }, 0.45);

        tl.set(
          ".sr-lb-anim-bg, .sr-lb-anim-hero, .sr-lb-anim-podium, .sr-lb-anim-table",
          { clearProps: "opacity,transform" },
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          ".sr-lb-anim-bg, .sr-lb-anim-hero, .sr-lb-anim-podium, .sr-lb-anim-table",
          { opacity: 1, y: 0, clearProps: "opacity,transform" },
        );
      });

      return () => mm.revert();
    },
    { scope: scopeRef },
  );

  return scopeRef;
}
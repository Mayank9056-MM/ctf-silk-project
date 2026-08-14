"use client";

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/** Same one-shot-entrance-with-reduced-motion-fallback pattern as dashboard-motion.tsx, retargeted to the story stage's own class names. */
export function useStoryStageEntrance(): RefObject<HTMLDivElement | null> {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(".sr-story-anim-nav", { opacity: 0, y: -6, duration: 0.3 }, 0)
          .from(".sr-story-anim-content", { opacity: 0, y: 10, duration: 0.4 }, 0.15);
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".sr-story-anim-nav, .sr-story-anim-content", { opacity: 1, y: 0, clearProps: "opacity,transform" });
      });
      return () => mm.revert();
    },
    { scope: scopeRef },
  );

  return scopeRef;
}
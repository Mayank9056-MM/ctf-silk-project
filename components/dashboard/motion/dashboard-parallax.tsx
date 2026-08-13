"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

/**
 * Extremely subtle pointer-driven parallax for the hero backdrop and
 * character layers — a few pixels of drift, not a game-character
 * "breathing" effect. Disabled entirely under reduced motion. Uses
 * gsap.quickTo so repeated pointermove events don't stack tweens.
 */
export function useHeroParallax(
  containerRef: RefObject<HTMLDivElement | null>,
  layerRefs: RefObject<HTMLDivElement | null>[],
) {
  const reducedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onChange = () => (reducedRef.current = mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const movers = layerRefs
      .map((r, i) => {
        const el = r.current;
        if (!el) return null;
        return {
          x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
          strength: 6 - i * 2,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    function onPointerMove(e: PointerEvent) {
      if (reducedRef.current || movers.length === 0) return;
      const rect = container!.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      movers.forEach((m) => {
        m.x(relX * m.strength);
        m.y(relY * m.strength);
      });
    }

    function onPointerLeave() {
      movers.forEach((m) => {
        m.x(0);
        m.y(0);
      });
    }

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layerRefs identity is stable across renders (created once in investigation-hero)
  }, [containerRef]);
}
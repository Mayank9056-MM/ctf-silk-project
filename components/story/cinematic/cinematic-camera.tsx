"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface CinematicCameraProps {
  children: ReactNode;
  /** Re-mount/trigger a fresh drift by changing this on scene change. */
  triggerKey: string;
}

/** A generic slow scale+drift wrapper — operates on whatever DOM content is passed in (a background layer, a character layer), never assumes a specific image, so it works identically once real asset layers exist. */
export function CinematicCamera({ children, triggerKey }: CinematicCameraProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { scale: 1.04, x: 6 },
          { scale: 1, x: 0, duration: 6, ease: "power1.out" },
        );
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [triggerKey] },
  );

  return (
    <div ref={ref} className="absolute inset-0">
      {children}
    </div>
  );
}
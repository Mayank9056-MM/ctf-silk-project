"use client";

import Image from "next/image";
import { useRef } from "react";
import { CHARACTER_ASSETS } from "@/lib/assets/character-assets";
import { useHeroParallax } from "../motion/dashboard-parallax";

interface InvestigationCharacterProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * `unoptimized` — this is the actual fix for the white-background bug.
 * The asset's alpha is fine in the source file; the symptom (flat white
 * box, only through next/image, not on the raw file) matches Next's
 * image-optimization pipeline re-encoding and flattening WebP alpha
 * during resize/reformat. `unoptimized` serves the file byte-for-byte,
 * bypassing that pipeline entirely for this one decorative asset.
 *
 * Trade-off, stated plainly: the browser now loads the full source
 * file with no automatic resizing/format negotiation. Fine for a
 * single fixed hero image with `priority`, but if the exported WebP is
 * large, check its file size — the better long-term fix is exporting a
 * pre-sized WebP with alpha and re-enabling optimization, not leaving
 * every image on the page unoptimized.
 */
export function InvestigationCharacter({ containerRef }: InvestigationCharacterProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  useHeroParallax(containerRef, [layerRef]);

  return (
    <div
      ref={layerRef}
      className="sr-dash-anim-character pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block"
      aria-hidden="true"
    >
      <div className="relative h-full w-full">
        <Image
          src={CHARACTER_ASSETS.ethan.dashboard}
          alt=""
          fill
          priority
          unoptimized
          sizes="46vw"
          className="sr-dash-character sr-hero-character-mask object-contain object-bottom"
        />
      </div>
    </div>
  );
}
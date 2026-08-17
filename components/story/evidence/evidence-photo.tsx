"use client";

import Image from "next/image";

interface EvidencePhotoProps {
  src: string;
  alt: string;
}

/**
 * `unoptimized` — this works identically whether attachmentUrl ends up
 * a local /public/assets/... path or an external (e.g. Cloudinary) URL,
 * without needing next.config.ts's images.remotePatterns set up for a
 * host that isn't decided yet (see the hosting-decision question in the
 * accompanying message). Once a final host is chosen and remotePatterns
 * configured, this can drop `unoptimized` for real resizing/format
 * negotiation — a one-line change here, not a rewrite.
 */
export function EvidencePhoto({ src, alt }: EvidencePhotoProps) {
  return (
    <div className="sr-evidence-photo-frame">
      <span className="sr-evidence-tape sr-evidence-tape--left" aria-hidden="true" />
      <span className="sr-evidence-tape sr-evidence-tape--right" aria-hidden="true" />
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image src={src} alt={alt} fill unoptimized sizes="240px" className="object-cover" />
      </div>
    </div>
  );
}
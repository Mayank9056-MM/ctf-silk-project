"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

interface EvidenceDetailImageProps {
  src: string;
  alt: string;
}

/** unoptimized — same Cloudinary-agnostic reasoning as EvidencePhoto; drop it once next.config.ts's remotePatterns is set for res.cloudinary.com. */
export function EvidenceDetailImage({ src, alt }: EvidenceDetailImageProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="sr-evidence-detail-image-frame relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-(--sr-border-normal)"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Image src={src} alt={alt} fill unoptimized sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" />
    </motion.div>
  );
}
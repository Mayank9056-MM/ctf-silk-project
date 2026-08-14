"use client";

/** Re-exports the dashboard's pointer-parallax hook rather than duplicating it — same generic "drift N layers toward the pointer" implementation applies unchanged to story background/character layers. */
export { useHeroParallax as useStageParallax } from "@/components/dashboard/motion/dashboard-parallax";

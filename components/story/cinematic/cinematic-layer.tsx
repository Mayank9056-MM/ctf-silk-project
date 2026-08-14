import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface CinematicLayerProps {
  children: ReactNode;
  /** z-index-only depth token — keeps every stage layer's stacking order declared in one place instead of ad hoc z-[N] scattered per component. */
  depth: "background" | "atmosphere" | "character" | "lighting" | "content" | "overlay";
  className?: string;
  style?: CSSProperties;
}

const DEPTH_Z: Record<CinematicLayerProps["depth"], string> = {
  background: "z-0",
  atmosphere: "z-[1]",
  character: "z-[2]",
  lighting: "z-[3]",
  content: "z-[10]",
  overlay: "z-[30]",
};

export function CinematicLayer({ children, depth, className, style }: CinematicLayerProps) {
  return (
    <div className={cn("absolute inset-0", DEPTH_Z[depth], className)} style={style}>
      {children}
    </div>
  );
}
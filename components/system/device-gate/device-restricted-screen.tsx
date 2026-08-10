"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Monitor, Smartphone, TriangleAlert } from "lucide-react";

import { SystemShell } from "@/components/system/system-shell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DEVICE_GATE_MIN_WIDTH_PX } from "@/lib/device/device-gate.constants";

const DIAGNOSTIC_LINES = [
  "> evaluating workstation class...",
  "> viewport capability check failed",
  "> minimum resolution not met",
];

/**
 * Rendered in place of the entire application when the current
 * viewport doesn't meet DEVICE_GATE_MIN_WIDTH_PX. This is a UX/
 * compatibility boundary, not a security control — actual
 * authorization continues to be enforced server-side exactly as
 * before; nothing here should ever be read as "the API is protected
 * by this screen."
 *
 * Uses Framer Motion, not GSAP, deliberately — this project's own
 * animation doctrine reserves GSAP exclusively for cutscene-type
 * scenes and gives Motion every other UI transition/reveal. A system
 * screen like this one is squarely Motion's territory.
 */
export function DeviceRestrictedScreen() {
  const [viewport, setViewport] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <SystemShell caseId="SR-0417">
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sr-card sr-system-card"
      >
        <span className="sr-eyebrow sr-eyebrow-accent">
          FBI Cyber Division — Workstation Verification
        </span>

        <div
          className="relative mx-auto my-6 flex h-16 w-16 items-center justify-center"
          aria-hidden="true"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500/15" />
          <span className="sr-status-ring relative flex h-16 w-16 items-center justify-center rounded-full">
            <Monitor className="h-6 w-6" strokeWidth={1.6} />
          </span>
        </div>

        <h1 className="sr-title" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>
          Workstation <span>Required</span>
        </h1>
        <p className="sr-subtitle" style={{ marginBottom: 4 }}>
          This case file was built for a full investigator&apos;s terminal — not
          a handheld device.
        </p>
        <p className="sr-subtitle">
          Sign in from a desktop or laptop to continue the investigation.
        </p>

        <Badge
          variant="outline"
          className="mx-auto mt-4 gap-1.5 border-red-500/40 text-[11px] tracking-[0.14em] text-red-400 uppercase"
        >
          <TriangleAlert className="h-3 w-3" />
          Unsupported viewport
        </Badge>

        <Separator className="my-5 opacity-20" />

        <div className="sr-loading-lines">
          {DIAGNOSTIC_LINES.map((line, i) => (
            <motion.span
              key={line}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.35 }}
            >
              {line}
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + DIAGNOSTIC_LINES.length * 0.15 }}
          className="mt-4 flex items-center justify-between text-[11px]"
          style={{ color: "var(--sr-dimmer)" }}
        >
          <span className="flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            Detected:{" "}
            {viewport ? `${viewport.width} × ${viewport.height}px` : "reading…"}
          </span>
          <span>Required: ≥ {DEVICE_GATE_MIN_WIDTH_PX}px width</span>
        </motion.div>
      </motion.div>
    </SystemShell>
  );
}

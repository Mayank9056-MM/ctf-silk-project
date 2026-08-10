"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { ParticleField } from "@/components/auth/particle-field";
import { HudTop } from "@/components/auth/hud-top";
import { CaseIdentifier } from "@/components/auth/case-identifier";
import { AuthNarrativePanel } from "@/components/auth/auth-narrative-panel";
import { DEFAULT_CASE_ID } from "@/lib/constants/case";
import { AuthNarrativeStatus } from "./auth.types";

gsap.registerPlugin(useGSAP);

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  caseId?: string;
  /** "centered" (login — single card) or "split" (register — two-column). */
  variant?: "centered" | "split";
  panelTitle?: string;
  narrative?: {
    title: string;
    description: string;
    statuses: AuthNarrativeStatus[];
  };
}

/**
 * One timeline serves both variants. Selectors that don't exist on the
 * current page (e.g. .sr-anim-narrative on /login) simply match zero
 * elements — GSAP no-ops silently, so this isn't two timelines
 * pretending to be one. .sr-anim-field gets a real stagger now, per the
 * "form fields should feel like a secure interface becoming active"
 * requirement; previously the whole form faded in as a single block.
 */
export function AuthShell({
  children,
  eyebrow,
  caseId = DEFAULT_CASE_ID,
  variant = "centered",
  panelTitle,
  narrative,
}: AuthShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(".sr-anim-bg", { opacity: 0, duration: 0.35 }, 0)
          .from(".sr-anim-hud", { opacity: 0, duration: 0.3 }, 0.08)
          .from(".sr-anim-case", { opacity: 0, y: -3, duration: 0.28 }, 0.16);

        if (variant === "split") {
          tl.from(
            ".sr-anim-narrative",
            { opacity: 0, y: 5, duration: 0.35 },
            0.24,
          )
            .from(".sr-anim-panel", { opacity: 0, y: 7, duration: 0.35 }, 0.32)
            .from(
              ".sr-anim-panel-title",
              { opacity: 0, y: 4, duration: 0.25 },
              0.38,
            )
            .from(
              ".sr-anim-field",
              { opacity: 0, y: 4, duration: 0.28, stagger: 0.045 },
              0.42,
            )
            .from(
              ".sr-anim-checklist",
              { opacity: 0, y: 4, duration: 0.25 },
              0.62,
            )
            .from(
              ".sr-anim-cta",
              { opacity: 0, scale: 0.97, duration: 0.28 },
              0.72,
            );
        } else {
          tl.from(".sr-anim-title", { opacity: 0, y: 5, duration: 0.35 }, 0.24)
            .from(
              ".sr-anim-subtitle",
              { opacity: 0, y: 7, duration: 0.35 },
              0.32,
            )
            .from(".sr-anim-form", { opacity: 0, y: 7, duration: 0.35 }, 0.42)
            .from(
              ".sr-anim-cta",
              { opacity: 0, scale: 0.97, duration: 0.28 },
              0.72,
            );
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const common = ".sr-anim-bg, .sr-anim-hud, .sr-anim-case, .sr-anim-cta";
        const targets =
          variant === "split"
            ? `${common}, .sr-anim-narrative, .sr-anim-panel, .sr-anim-panel-title, .sr-anim-field, .sr-anim-checklist`
            : `${common}, .sr-anim-title, .sr-anim-subtitle, .sr-anim-form`;
        gsap.set(targets, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: "opacity,transform",
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [variant] },
  );

  return (
    <div className="sr-screen" ref={containerRef}>
      <div className="sr-anim-bg">
        <ParticleField />
        <div className="sr-vignette" aria-hidden="true" />
        <div className="sr-grain" aria-hidden="true" />
        <div className="sr-scanlines" aria-hidden="true" />
      </div>
      <HudTop caseId={caseId} />

      {variant === "split" && narrative ? (
        <div className="sr-split-content">
          <div className="sr-anim-narrative">
            <AuthNarrativePanel
              eyebrow={eyebrow}
              title={narrative.title}
              description={narrative.description}
              statuses={narrative.statuses}
            />
          </div>
          <div className="sr-anim-panel sr-panel">
            <span className="sr-anim-case sr-case-row">
              <CaseIdentifier caseId={caseId} variant="badge" />
            </span>
            {panelTitle && (
              <span className="sr-anim-panel-title sr-panel-title">
                {panelTitle}
                <span className="sr-panel-title-meta">FORM // 01</span>
              </span>
            )}
            {children}
          </div>
        </div>
      ) : (
        <div className="sr-content">
          <div className="sr-card">
            <span className="sr-anim-case sr-case-row">
              <CaseIdentifier caseId={caseId} variant="badge" />
            </span>
            <span className="sr-eyebrow sr-eyebrow-accent">{eyebrow}</span>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

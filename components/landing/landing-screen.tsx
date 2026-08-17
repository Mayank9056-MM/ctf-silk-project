"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { ParticleField } from "@/components/auth/particle-field";
import { HudTop } from "@/components/auth/hud-top";
import { LandingHero } from "./landing-hero";
import { LandingRules } from "./landing-rules";
import { LandingFooter } from "./landing-footer";

gsap.registerPlugin(useGSAP);

/**
 * Same one-shot-entrance-with-reduced-motion-fallback pattern as
 * AuthShell — this page is the thing that leads INTO login/register,
 * so it shares AuthShell's exact ambient chrome (ParticleField, HUD,
 * vignette/grain/scanlines from .sr-anim-bg's sibling classes) rather
 * than introducing a second visual system a player would notice
 * switching between landing → login.
 */
export function LandingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(".sr-landing-anim-bg", { opacity: 0, duration: 0.4 }, 0)
          .from(".sr-landing-anim-hud", { opacity: 0, duration: 0.3 }, 0.08)
          .from(".sr-landing-anim-case", { opacity: 0, y: -3, duration: 0.28 }, 0.16)
          .from(".sr-landing-anim-title", { opacity: 0, y: 14, duration: 0.5 }, 0.24)
          .from(".sr-landing-anim-tagline", { opacity: 0, y: 8, duration: 0.35 }, 0.4)
          .from(".sr-landing-anim-blurb", { opacity: 0, y: 8, duration: 0.35 }, 0.48)
          .from(".sr-landing-anim-stats", { opacity: 0, y: 8, duration: 0.35, stagger: 0.06 }, 0.56)
          .from(".sr-landing-anim-cta", { opacity: 0, y: 8, scale: 0.98, duration: 0.35 }, 0.66)
          .from(".sr-landing-anim-rules-title", { opacity: 0, y: 8, duration: 0.3 }, 0.8)
          .from(
            ".sr-landing-anim-rule",
            { opacity: 0, y: 14, duration: 0.4, stagger: 0.06, ease: "power3.out" },
            0.88,
          );

        tl.set(
          ".sr-landing-anim-bg, .sr-landing-anim-hud, .sr-landing-anim-case, .sr-landing-anim-title, .sr-landing-anim-tagline, .sr-landing-anim-blurb, .sr-landing-anim-stats, .sr-landing-anim-cta, .sr-landing-anim-rules-title, .sr-landing-anim-rule",
          { clearProps: "opacity,transform" },
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          ".sr-landing-anim-bg, .sr-landing-anim-hud, .sr-landing-anim-case, .sr-landing-anim-title, .sr-landing-anim-tagline, .sr-landing-anim-blurb, .sr-landing-anim-stats, .sr-landing-anim-cta, .sr-landing-anim-rules-title, .sr-landing-anim-rule",
          { opacity: 1, y: 0, scale: 1, clearProps: "opacity,transform" },
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef },
  );

  return (
    <div className="sr-screen" ref={containerRef}>
      <div className="sr-landing-anim-bg">
        <ParticleField />
        <div className="sr-vignette" aria-hidden="true" />
        <div className="sr-grain" aria-hidden="true" />
        <div className="sr-scanlines" aria-hidden="true" />
      </div>

      <div className="sr-landing-anim-hud">
        <HudTop />
      </div>

      <div className="relative z-[5] mx-auto flex max-w-[980px] flex-col gap-14 px-5 pb-20 pt-28 sm:px-8">
        <LandingHero />
        <LandingRules />
        <LandingFooter />
      </div>
    </div>
  );
}
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CaseIdentifier } from "@/components/auth/case-identifier";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/constants/brand";

/**
 * Ember/beam/smoke layers reused verbatim from the dashboard hero's own
 * CSS (.sr-hero-ember / .sr-hero-beam / .sr-hero-smoke are generic
 * decorative classes, not scoped to any specific parent selector except
 * the one character-blend rule this component never triggers) — same
 * lighting language, no new gradient math invented for this page.
 */
export function LandingHero() {
  return (
    <div className="sr-landing-hero">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="sr-hero-ember absolute inset-0" />
        <div className="sr-hero-beam absolute inset-0" />
        <div className="sr-hero-smoke absolute inset-0" />
        <div className="sr-hero-grain absolute inset-0" />
      </div>

      <div className="relative z-[1]">
        <span className="sr-landing-anim-case sr-case-row">
          <CaseIdentifier variant="badge" />
        </span>

        <h1 className="sr-landing-anim-title sr-landing-title">
          {PLATFORM_NAME.split(" ").map((word, i) =>
            i === 0 ? (
              <span key={i}>{word} </span>
            ) : (
              <span key={i} className="text-[color:var(--sr-text)]" style={{ WebkitTextFillColor: "unset", color: "var(--sr-text)" }}>
                {word}{" "}
              </span>
            ),
          )}
        </h1>

        <p className="sr-landing-anim-tagline sr-landing-tagline">{PLATFORM_TAGLINE}</p>

        <p className="sr-landing-anim-blurb sr-landing-blurb">
          A live cybersecurity investigation. Every solved challenge uncovers evidence, advances
          the case, and moves your name up the board. Access is granted only to registered
          investigators.
        </p>

        <dl className="sr-landing-anim-stats mt-8 flex flex-wrap gap-x-10 gap-y-4">
          <div className="sr-landing-stat">
            <dt>Format</dt>
            <dd>Jeopardy-style CTF</dd>
          </div>
          <div className="sr-landing-stat">
            <dt>Clearance</dt>
            <dd>Registration required</dd>
          </div>
          <div className="sr-landing-stat">
            <dt>Standings</dt>
            <dd>Live, freezes near close</dd>
          </div>
        </dl>

        <div className="sr-landing-anim-cta sr-button-row" style={{ justifyContent: "flex-start", marginTop: 32 }}>
          <Link href="/login" className="sr-button" style={{ width: "auto", minWidth: 190 }}>
            <ShieldCheck size={14} style={{ marginRight: 8 }} aria-hidden="true" />
            Access Terminal
          </Link>
          <Link href="/register" className="sr-button sr-button-secondary" style={{ width: "auto", minWidth: 190 }}>
            Request Clearance
          </Link>
        </div>
      </div>
    </div>
  );
}
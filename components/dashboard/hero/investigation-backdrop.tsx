/**
 * components/dashboard/hero/investigation-backdrop.tsx
 *
 * Pure gradient/atmosphere layer — no imagery. Sits between the hero
 * floor and the character layer so GSAP/parallax can address them
 * independently (spec section 15's depth-layer requirement).
 *
 * Every gradient here is defined once in globals.css (.sr-hero-*) so
 * this component stays a thin composition of layers, not a place where
 * gradient math gets reinvented per-usage.
 *
 * sr-hero-smoke sits on top of the ember: a slow-drifting blurred haze
 * specifically so the character reads as standing in lit smoke rather
 * than pasted in front of a static gradient. Purely decorative — no
 * GSAP target, no entrance dependency, just a CSS keyframe (respects
 * prefers-reduced-motion on its own).
 */
export function InvestigationBackdrop() {
  return (
    <div className="absolute inset-0 sr-hero-floor bg-(--sr-hero-floor)" aria-hidden="true">
      <div className="sr-hero-ember absolute inset-0" />
      <div className="sr-hero-beam absolute inset-0" />
      <div className="sr-hero-smoke absolute inset-0" />
      <div className="sr-hero-gradient-x absolute inset-0" />
      <div className="sr-hero-gradient-bottom absolute inset-0" />
      <div className="sr-hero-gradient-top absolute inset-0" />
      <div className="sr-hero-grain absolute inset-0" />
    </div>
  );
}
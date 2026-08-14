interface SceneLightingProps {
  /** "warm" (crimson key light, tension/discovery) or "cold" (investigation blue, institutional space) — deliberately just these two per spec's color-system rule, not an arbitrary color prop. */
  tone: "warm" | "cold";
}

export function SceneLighting({ tone }: SceneLightingProps) {
  const color = tone === "warm" ? "rgba(228,35,47,0.14)" : "rgba(71,109,130,0.16)";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: `radial-gradient(ellipse 55% 45% at 75% 25%, ${color} 0%, transparent 60%)` }}
      aria-hidden="true"
    />
  );
}
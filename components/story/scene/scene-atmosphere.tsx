/** Pure CSS ambient layers — fog/dust/light bloom — genuinely doesn't need any image asset, so fully buildable now. Kept extremely subtle per spec section on ambient effects. */
export function SceneAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 70% 30%, rgba(71,109,130,0.10) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 40% 50% at 20% 80%, rgba(228,35,47,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
export function EvidencePin({ color = "var(--sr-crimson-hot)" }: { color?: string }) {
  return (
    <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2" aria-hidden="true">
      <div
        className="size-3 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
        style={{ background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), transparent), ${color}` }}
      />
    </div>
  );
}
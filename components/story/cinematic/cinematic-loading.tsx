/** In-stage loading beat (a scene transition awaiting the next fetch), distinct from states/story-loading.tsx (the full-page initial load). Deliberately quieter — no full-screen takeover, since the stage itself is already visible. */
export function CinematicLoading() {
  return (
    <div className="absolute inset-0 z-[20] flex items-center justify-center bg-(--sr-bg-void)/60 backdrop-blur-[2px]">
      <span className="size-1.5 animate-pulse rounded-full bg-(--sr-crimson-hot)" aria-hidden="true" />
    </div>
  );
}
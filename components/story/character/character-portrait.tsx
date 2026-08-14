import Image from "next/image";
import { cn } from "@/lib/utils";

interface CharacterPortraitProps {
  imageUrl: string | null;
  displayName: string;
  /** Whether this is the currently-speaking character — drives emphasis, not layout. */
  active: boolean;
}

/** Dialogue-speaker presentation, per spec's asset guidance ("portrait: dialogue speaker presentation"). Meaningful alt text here, unlike the decorative silhouette/full-body layers — a portrait genuinely conveys who is speaking. */
export function CharacterPortrait({ imageUrl, displayName, active }: CharacterPortraitProps) {
  return (
    <div
      className={cn(
        "relative size-14 shrink-0 overflow-hidden rounded-full border transition-all duration-300",
        active ? "border-(--sr-crimson-hot) opacity-100" : "border-(--sr-border-normal) opacity-55",
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={displayName} fill sizes="56px" className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-(--sr-bg-surface) text-[10px] text-(--sr-text-muted)">
          {displayName.charAt(0)}
        </div>
      )}
    </div>
  );
}
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SceneBackgroundProps {
  /**
   * Resolved, already-safe URL — this component never resolves a path
   * itself. That's use-story-assets.ts's job once lib/assets/
   * story-assets.ts's contents are known; until then, `null` renders a
   * pure gradient floor rather than a guessed or missing image.
   */
  imageUrl: string | null;
}

export function SceneBackground({ imageUrl }: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-(--sr-bg-void)" />
      {imageUrl && (
        <Image src={imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-(--sr-bg-void) via-transparent to-(--sr-bg-void)/40" />
    </div>
  );
}
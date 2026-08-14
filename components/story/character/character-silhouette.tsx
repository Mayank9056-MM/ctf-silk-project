import Image from "next/image";

interface CharacterSilhouetteProps {
  imageUrl: string | null;
  /** Left/right anchoring — a silhouette in the background composition, not a dialogue speaker. */
  side: "left" | "right";
}

/** Background/atmospheric use only — see spec's asset-usage guidance ("silhouette: background / atmospheric composition"). Same mask/blend treatment established for the dashboard hero's Ethan asset. */
export function CharacterSilhouette({ imageUrl, side }: CharacterSilhouetteProps) {
  if (!imageUrl) return null;
  return (
    <div
      className={`sr-hero-character-mask sr-dash-character pointer-events-none absolute inset-y-0 ${side}-0 w-[40%] opacity-70`}
      aria-hidden="true"
    >
      <Image src={imageUrl} alt="" fill sizes="40vw" className="object-contain object-bottom" />
    </div>
  );
}
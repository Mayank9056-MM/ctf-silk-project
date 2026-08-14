import { CharacterSilhouette } from "./character-silhouette";

interface CharacterLayerProps {
  imageUrl: string | null;
  side: "left" | "right";
}

/** Composition point for the background character presence within the stage — currently a thin wrapper over CharacterSilhouette; kept as its own file since story-stage.tsx composes against this name per the spec's file list, and it's the natural place to add a second layered character (e.g. two figures in one scene) without touching story-stage.tsx itself. */
export function CharacterLayer({ imageUrl, side }: CharacterLayerProps) {
  return <CharacterSilhouette imageUrl={imageUrl} side={side} />;
}
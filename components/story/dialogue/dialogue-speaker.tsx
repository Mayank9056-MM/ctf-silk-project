import { CharacterPortrait } from "../character/character-portrait";
import { CharacterNameplate } from "../character/character-nameplate";
import type { DialogueLineDTO } from "@/modules/story/types/dialogue.dto";

export function DialogueSpeaker({ speaker }: { speaker: DialogueLineDTO["speaker"] }) {
  if (!speaker) return null;
  return (
    <div className="flex items-center gap-3">
      <CharacterPortrait imageUrl={speaker.portraitUrl} displayName={speaker.displayName} active />
      <CharacterNameplate displayName={speaker.displayName} />
    </div>
  );
}
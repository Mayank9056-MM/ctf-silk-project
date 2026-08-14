"use client";

import { useState } from "react";
import { ChoiceList } from "./choice-list";
import { ChoiceConfirmation } from "./choice-confirmation";
import { useSelectChoice } from "@/modules/story/hooks/use-select-choice";
import type { ChoiceDTO } from "@/modules/story/types/scene.dto";

interface ChoicePanelProps {
  currentSceneId: string;
  choices: ChoiceDTO[];
}

/** Owns the mutation lifecycle — disables the whole list the instant one choice is picked (protection against double submission), regardless of which item was clicked. */
export function ChoicePanel({ currentSceneId, choices }: ChoicePanelProps) {
  const selectChoice = useSelectChoice();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = choices.find((c) => c.id === pickedId) ?? null;

  function handleSelect(choiceId: string) {
    if (selectChoice.isPending) return;
    setPickedId(choiceId);
    selectChoice.mutate({ currentSceneId, choiceId });
  }

  if (picked && (selectChoice.isPending || selectChoice.isSuccess)) {
    return <ChoiceConfirmation choice={picked} />;
  }

  return <ChoiceList choices={choices} onSelect={handleSelect} disabled={selectChoice.isPending} />;
}
"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChoiceItem } from "./choice-item";
import type { ChoiceDTO } from "@/modules/story/types/scene.dto";

interface ChoiceListProps {
  choices: ChoiceDTO[];
  onSelect: (choiceId: string) => void;
  disabled: boolean;
}

export function ChoiceList({ choices, onSelect, disabled }: ChoiceListProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, staggerChildren: 0.05 }}
    >
      {choices.map((choice) => (
        <ChoiceItem key={choice.id} choice={choice} onSelect={onSelect} disabled={disabled} />
      ))}
    </motion.div>
  );
}
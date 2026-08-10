// components/auth/submit-button.tsx
"use client";

import { useFormStatus } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

interface SubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

/**
 * GSAP owns the OUTER div (.sr-anim-cta) for the one-shot mount
 * animation. Motion owns the INNER motion.button for hover/press only.
 * These must be two different nodes — sharing one node between GSAP's
 * imperative style writes and Motion's MotionValue-driven style
 * reconciliation is what caused the CTA to get stuck at opacity:0.
 */
export function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const reduceMotion = useReducedMotion();

  return (
    <div className="sr-anim-cta">
      <motion.button
        type="submit"
        className="sr-button"
        disabled={pending}
        whileHover={
          reduceMotion || pending
            ? undefined
            : { boxShadow: "0 0 0 1px var(--sr-accent, #c4272a)", filter: "brightness(1.05)" }
        }
        whileTap={reduceMotion || pending ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        {pending ? pendingLabel : idleLabel}
      </motion.button>
    </div>
  );
}
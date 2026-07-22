"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

/** useFormStatus reports the nearest parent <form>'s status, so this must render inside that form. */
export function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="sr-button" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
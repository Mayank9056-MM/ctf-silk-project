"use client";

import { useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TriangleAlert } from "lucide-react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  errors?: string[];
  required?: boolean;
}

/**
 * Identical controlled/uncontrolled split and aria wiring as before.
 * The only additions are presentational: a `focused` state driving a
 * sr-field-focused class for the accent/glow, and a Motion entrance for
 * the error message — the error TEXT is never delayed or hidden by the
 * animation, only its reveal is eased in.
 */
export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  value,
  onValueChange,
  errors,
  required = true,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errors && errors.length > 0);
  const errorId = hasError ? `${name}-error` : undefined;
  const isControlled = value !== undefined;

  return (
    <div
      className={`sr-field${focused ? " sr-field-focused" : ""}${hasError ? " sr-field-error" : ""}`}
    >
      <label className="sr-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={hasError}
        aria-describedby={errorId}
        className={`sr-input${hasError ? " sr-input-error" : ""}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...(isControlled
          ? {
              value,
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                onValueChange?.(e.target.value),
            }
          : { defaultValue })}
      />
      <AnimatePresence>
        {hasError && (
          <motion.p
            id={errorId}
            className="sr-error-text"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <TriangleAlert
              className="mr-1 -mt-0.5 inline-block h-3 w-3"
              aria-hidden="true"
            />
            {errors![0]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

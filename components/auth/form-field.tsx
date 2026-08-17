"use client";

import { useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TriangleAlert, Eye, EyeOff } from "lucide-react";

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
 * sr-field-focused class for the accent/glow, a Motion entrance for
 * the error message — the error TEXT is never delayed or hidden by the
 * animation, only its reveal is eased in — and, for `type="password"`
 * fields only, a reveal toggle.
 *
 * The toggle only ever flips the INPUT's own `type` attribute between
 * "password" and "text" on this one field — it does nothing else,
 * reads nothing else, and has no server-side counterpart to keep in
 * sync with. `autoComplete` is left exactly as the caller passed it
 * (e.g. "current-password" / "new-password"); toggling visibility
 * doesn't change what should be autofilled.
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
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(errors && errors.length > 0);
  const errorId = hasError ? `${name}-error` : undefined;
  const isControlled = value !== undefined;
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div
      className={`sr-field${focused ? " sr-field-focused" : ""}${hasError ? " sr-field-error" : ""}`}
    >
      <label className="sr-label" htmlFor={name}>
        {label}
      </label>
      <div className="sr-input-wrap">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={hasError}
          aria-describedby={errorId}
          className={`sr-input${hasError ? " sr-input-error" : ""}${isPassword ? " sr-input-has-action" : ""}`}
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
        {isPassword && (
          <button
            type="button"
            className="sr-input-action"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            // Password managers/autofill triggers can steal focus on
            // mousedown before the click fires — tabIndex stays default
            // (keyboard-reachable), this only stops it grabbing focus
            // away from the input on a mouse click.
            tabIndex={-1}
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
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
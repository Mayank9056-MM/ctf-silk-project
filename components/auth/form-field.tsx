import type { ChangeEvent } from "react";

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
  const hasError = Boolean(errors && errors.length > 0);
  const errorId = hasError ? `${name}-error` : undefined;
  const isControlled = value !== undefined;

  return (
    <div className="sr-field">
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
        {...(isControlled
          ? {
              value,
              onChange: (e: ChangeEvent<HTMLInputElement>) => onValueChange?.(e.target.value),
            }
          : { defaultValue })}
      />
      {hasError && (
        <p id={errorId} className="sr-error-text" role="alert">
          {errors![0]}
        </p>
      )}
    </div>
  );
}
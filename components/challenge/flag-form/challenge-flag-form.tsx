// components/challenge/flag-form/challenge-flag-form.tsx
"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { Loader2 } from "lucide-react";

import { SubmitFlagError } from "@/modules/submission/hooks/use-submit-flag";
import type { SubmitFlagResultDTO } from "@/modules/submission/types/submission.dto";

interface ChallengeFlagFormProps {
  challengeId: string;
  mutation: UseMutationResult<SubmitFlagResultDTO, Error, { challengeId: string; flag: string }>;
}

interface FlagFieldValues {
  flag: string;
}

export function ChallengeFlagForm({ challengeId, mutation }: ChallengeFlagFormProps) {
  const inputId = useId();
  const [rateLimitedUntilReset, setRateLimitedUntilReset] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FlagFieldValues>({ defaultValues: { flag: "" } });

  const isSubmitting = mutation.isPending;
  const submitError = mutation.error instanceof SubmitFlagError ? mutation.error : undefined;
  const errorCode = submitError?.code;
  const isRateLimited = errorCode === "TOO_MANY_REQUESTS";
  const isUnavailable = errorCode === "FORBIDDEN" || errorCode === "UNAUTHORIZED" || errorCode === "NOT_FOUND";
  const isValidationError = errorCode === "VALIDATION_ERROR";
  const isIncorrect = mutation.isSuccess && !mutation.data.isCorrect;
  const isGenericError = mutation.isError && !isRateLimited && !isUnavailable && !isValidationError;

  // The server's actual Zod message for the flag field ("Invalid flag
  // format. Expected: CTF{example_flag}"), falling back to the
  // ActionState-level message if for some reason no field-level error
  // came through.
  const validationMessage = submitError?.errors?.flag?.[0] ?? submitError?.message;

  function onSubmit(values: FlagFieldValues) {
    if (isSubmitting) return;
    mutation.mutate(
      { challengeId, flag: values.flag },
      {
        onSettled: () => {
          if (isRateLimited) setRateLimitedUntilReset(true);
        },
      },
    );
  }

  function handleTryAgain() {
    mutation.reset();
    setRateLimitedUntilReset(false);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}
      >
        Submit Flag
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="CTF{...}"
          disabled={isSubmitting || rateLimitedUntilReset}
          aria-invalid={Boolean(errors.flag) || isIncorrect || isValidationError}
          aria-describedby={`${inputId}-result`}
          className={cn(
            "w-full rounded-md border bg-(--sr-bg-void) px-3 py-2.5 text-sm outline-none transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
            storyTheme.text.primary,
            storyTheme.font.mono,
            errors.flag || isIncorrect || isValidationError
              ? "border-(--sr-crimson-hot) focus:border-(--sr-crimson-hot)"
              : "border-(--sr-border-normal) focus:border-(--sr-investigation-blue)",
          )}
          {...register("flag", { required: "A flag is required." })}
        />

        <button
          type="submit"
          disabled={isSubmitting || rateLimitedUntilReset}
          className={cn(
            "flex shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity",
            "bg-(--sr-crimson-hot) hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Verifying
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>

      <div id={`${inputId}-result`} role="status" aria-live="polite" className="min-h-[1.25rem]">
        {errors.flag && <p className="text-[12px] text-(--sr-crimson-hot)">{errors.flag.message}</p>}

        {isValidationError && (
          <p className="text-[12px] text-(--sr-crimson-hot)">{validationMessage}</p>
        )}

        {isIncorrect && (
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <p className={cn(storyTheme.text.secondary)}>Incorrect flag. The submitted flag is not valid.</p>
            <button type="button" onClick={handleTryAgain} className="shrink-0 text-(--sr-investigation-blue) underline underline-offset-2">
              Try Again
            </button>
          </div>
        )}

        {isRateLimited && (
          <p className="text-[12px] text-(--sr-status-warning)">
            Too many submissions. Please wait a moment before trying again.
          </p>
        )}

        {isUnavailable && (
          <p className="text-[12px] text-(--sr-status-warning)">
            This investigation node is not currently available for submissions.
          </p>
        )}

        {isGenericError && (
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <p className="text-(--sr-crimson-hot)">Submission failed. Please try again.</p>
            <button type="button" onClick={handleTryAgain} className="shrink-0 text-(--sr-investigation-blue) underline underline-offset-2">
              Retry
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
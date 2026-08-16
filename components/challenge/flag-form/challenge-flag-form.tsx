"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { Loader2 } from "lucide-react";

import { SubmitFlagError } from "@/modules/submission/hooks/use-submit-flag";
import { SUBMISSION_CONSTANTS } from "@/modules/submission/constants/submission.constants";
import type { SubmitFlagResultDTO } from "@/modules/submission/types/submission.dto";

interface ChallengeFlagFormProps {
  challengeId: string;
  mutation: UseMutationResult<SubmitFlagResultDTO, Error, { challengeId: string; flag: string }>;
}

interface FlagFieldValues {
  flag: string;
}

/**
 * How often the cooldown display re-derives its remaining time from
 * `cooldownExpiresAt`. Deliberately NOT a decrementing counter
 * (`setInterval(() => setRemaining(prev => prev - 1))`) — every tick
 * recomputes from the stored absolute timestamp, so a throttled/missed
 * tick (backgrounded tab, etc.) just catches up to the correct value on
 * the next one instead of compounding drift.
 */
const COOLDOWN_TICK_MS = 200;

/** How long the "you can try again" confirmation stays visible before the status region goes quiet. */
const RECOVERY_MESSAGE_MS = 4000;

export function ChallengeFlagForm({ challengeId, mutation }: ChallengeFlagFormProps) {
  const inputId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FlagFieldValues>({ defaultValues: { flag: "" } });

  const isSubmitting = mutation.isPending;
  const submitError = mutation.error instanceof SubmitFlagError ? mutation.error : undefined;
  const errorCode = submitError?.code;
  const isUnavailable = errorCode === "FORBIDDEN" || errorCode === "UNAUTHORIZED" || errorCode === "NOT_FOUND";
  const isValidationError = errorCode === "VALIDATION_ERROR";
  const isIncorrect = mutation.isSuccess && !mutation.data.isCorrect;

  // ------------------------------------------------------------------
  // Rate-limit cooldown — a purely local UX timer, never an
  // authorization decision. SubmissionService.assertNotRateLimited()
  // (and the global checkRateLimit() ahead of it) remain the only real
  // gate; this only controls how a stale 429 mutation result is
  // *presented* and *cleared*, without a page reload.
  // ------------------------------------------------------------------
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [justRecovered, setJustRecovered] = useState(false);

  // Always-current escape hatch for the effects below, so they can call
  // the LATEST mutation.reset() without listing the whole `mutation`
  // object (a new reference on every mutation state change) as a
  // dependency — that would tear down and rebuild the interval on every
  // tick, which is the exact "duplicated/leaked timer" failure mode to
  // avoid.
  const mutationRef = useRef(mutation);
  mutationRef.current = mutation;

  // Detects a FRESH 429 by the error object's own identity, not just
  // `isError` — so this never re-arms an already-running cooldown just
  // because the component re-rendered for an unrelated reason, but DOES
  // start a brand-new cooldown if the server rejects again after a
  // previous one already cleared (server stays authoritative — see the
  // "after cooldown" section below).
  const handledErrorRef = useRef<unknown>(null);
  useEffect(() => {
    const error = mutation.error;
    if (!error || error === handledErrorRef.current) return;
    handledErrorRef.current = error;

    if (error instanceof SubmitFlagError && error.code === "TOO_MANY_REQUESTS") {
      setJustRecovered(false);
      setCooldownExpiresAt(Date.now() + SUBMISSION_CONSTANTS.RATE_LIMIT_WINDOW_MS);
    }
    // No `else` — every other error kind (incorrect, validation,
    // unavailable, generic) is fully owned by its own render branch
    // below and must never be auto-reset.
  }, [mutation.error]);

  // Ticks the cooldown display and clears the stale mutation state the
  // instant the local window actually expires — this IS the fix.
  useEffect(() => {
    if (cooldownExpiresAt === null) return;

    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const remaining = Math.max(0, cooldownExpiresAt - Date.now());
      setRemainingMs(remaining);

      if (remaining <= 0) {
        setCooldownExpiresAt(null);
        mutationRef.current.reset();
        setJustRecovered(true);
      }
    }

    tick();
    const intervalId = setInterval(tick, COOLDOWN_TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [cooldownExpiresAt]);

  // Independent, self-clearing timer for the brief recovery message —
  // its own cleanup, never interacts with the cooldown interval above.
  useEffect(() => {
    if (!justRecovered) return;
    const timeoutId = setTimeout(() => setJustRecovered(false), RECOVERY_MESSAGE_MS);
    return () => clearTimeout(timeoutId);
  }, [justRecovered]);

  const isRateLimited = cooldownExpiresAt !== null;
  const isGenericError =
    mutation.isError && !isRateLimited && !isUnavailable && !isValidationError && errorCode !== "TOO_MANY_REQUESTS";

  // The server's actual Zod message for the flag field, falling back to
  // the ActionState-level message if no field-level error came through.
  const validationMessage = submitError?.errors?.flag?.[0] ?? submitError?.message;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  function onSubmit(values: FlagFieldValues) {
    if (isSubmitting || isRateLimited) return;
    mutation.mutate({ challengeId, flag: values.flag });
  }

  function handleTryAgain() {
    mutation.reset();
    reset();
  }

  const isDisabled = isSubmitting || isRateLimited;

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
          disabled={isDisabled}
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
          disabled={isDisabled}
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
          ) : isRateLimited ? (
            `Retry in ${remainingSeconds}s`
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
            {submitError?.message ?? "Too many submissions."} Try again in {remainingSeconds}{" "}
            second{remainingSeconds === 1 ? "" : "s"}.
          </p>
        )}

        {!isRateLimited && justRecovered && (
          <p className="text-[12px] text-(--sr-investigation-blue)">You can try submitting again.</p>
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
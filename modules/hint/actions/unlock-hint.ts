"use server";

// ============================================================================
// unlock-hint.ts
// ============================================================================
//
// The Server Action entry point for unlocking a hint. Everything real —
// order checks, affordability, the transaction spanning PlayerHint
// creation and the XP deduction, the P2002 race-safety net — lives in
// hint.service.ts. This file authenticates the caller, validates the
// request shape, delegates the entire operation, and translates only
// genuinely unexpected failures. It never opens a transaction, never
// touches a repository, and never decides whether an unlock is allowed.
//
// WHY THIS STAYS THIN, ESPECIALLY HERE
// -------------------------------------------
// unlockHint is a real write with real consequences (XP spent,
// PlayerHint created) — more consequential than a plain read, which
// makes it MORE important every decision lives in exactly one tested
// place, not less. An action that tried to pre-check anything here
// would just be a second, untested copy of a rule hint.service.ts
// already owns correctly.
//
// WHY NO ADDITIONAL PERMISSION CHECK
// ---------------------------------------
// requireAuth() alone is sufficient. Unlocking hints, like viewing them,
// is core gameplay available to every authenticated player — not an
// elevated capability distinguishing one role from another. Inventing a
// permission here would gate an ordinary feature behind a distinction
// this game doesn't have.
//
// WHY TRANSACTIONS AND BUSINESS RULES STAY IN THE SERVICE
// --------------------------------------------------------------
// This file has no business opening a Prisma transaction or deciding
// order/affordability — reaching for either here would be exactly the
// layering violation this architecture exists to prevent. Every
// rejection (already unlocked, wrong order, insufficient XP, hint not
// found, and the P2002-derived race outcome) arrives already as a
// specific ApiError from hint.service.ts; this file's only job is
// letting it pass through unchanged.
// ============================================================================

import { hintLogger as log } from "@/lib/logger/logger.scopes";
import { ApiError } from "@/lib/errors/ApiError";

import { requireAuth } from "@/modules/auth/authorization/require-auth";

import { unlockHintSchema } from "../validations/unlock-hint.schema";
import { hintService } from "../services/hint.service";
import type { HintUnlockDTO } from "../types/hint.dto";

export async function unlockHint(input: unknown): Promise<HintUnlockDTO> {
  const user = await requireAuth();

  const { hintId } = unlockHintSchema.parse(input);

  try {
    return await hintService.unlockHint(user.userId, hintId);
  } catch (error) {
    // ALREADY_UNLOCKED, PREVIOUS_HINT_REQUIRED, INSUFFICIENT_XP, and
    // hint-not-found are all normal, expected outcomes already
    // represented as ApiErrors — including the P2002-derived race
    // outcome, exactly as expected as its pre-check counterpart. Passed
    // through unchanged, never logged. Anything else is a genuine
    // surprise worth an on-call signal.
    if (error instanceof ApiError) throw error;

    log.error("Unlock hint failed unexpectedly", error, {
      actorId: user.userId,
      hintId,
    });
    throw error;
  }
}

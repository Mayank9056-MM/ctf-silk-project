"use server";

// ============================================================================
// get-challenge-hints.ts
// ============================================================================
//
// The Server Action entry point for viewing a challenge's hints.
// Everything real happens in hint.service.ts — this file only
// authenticates the caller, validates the request shape, delegates, and
// translates unexpected failures. It never touches Prisma, a
// repository, the mapper, or any business rule.
//
// WHY THIS STAYS THIN
// ------------------------
// Every other action in this project follows the identical shape: auth,
// validate, delegate, translate unexpected errors. Putting a decision
// here that belongs in hint.service.ts would mean that decision exists
// nowhere else and is untestable without going through Next.js's action
// machinery.
//
// WHY NO ADDITIONAL PERMISSION CHECK
// ---------------------------------------
// requireAuth() alone is sufficient. Viewing hints is a core gameplay
// capability available to every authenticated player — it isn't an
// elevated capability distinguishing one role from another the way
// VIEW_AUDIT_LOG distinguishes admins from players. Adding a
// hasPermission() check here would be gating an ordinary feature behind
// a distinction that has no real counterpart in this game.
// ============================================================================

import { hintLogger as log } from "@/lib/logger/logger.scopes";
import { ApiError } from "@/lib/errors/ApiError";

import { requireAuth } from "@/modules/auth/authorization/require-auth";

import { getHintsSchema } from "../validations/get-hints.schema";
import { hintService } from "../services/hint.service";
import type { HintListDTO } from "../types/hint.dto";

export async function getChallengeHints(input: unknown): Promise<HintListDTO> {
  const user = await requireAuth();

  const { challengeId } = getHintsSchema.parse(input);

  try {
    return await hintService.getChallengeHints(user.userId, challengeId);
  } catch (error) {
    // A missing challenge, or any other business-rule rejection, is
    // already a correct, expected ApiError from hint.service.ts —
    // passed through unchanged, not logged. Anything else is a genuine
    // surprise worth an on-call signal.
    if (error instanceof ApiError) throw error;

    log.error("Get challenge hints failed unexpectedly", error, {
      actorId: user.userId,
      challengeId,
    });
    throw error;
  }
}

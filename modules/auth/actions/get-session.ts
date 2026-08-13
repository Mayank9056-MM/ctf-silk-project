"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "../utils/get-current-user";
import { userRepository } from "../repositories/user.repository";
import { toPublicUser } from "../utils/user.mapper";
import type { PublicUser } from "../types/user.types";

/**
 * Returns the currently authenticated user's public profile, or null
 * if there is no valid session — never throws, so client components
 * can treat "logged out" as ordinary data rather than an error branch.
 *
 * Deliberately does a real DB read via userRepository.findById rather
 * than trusting the access token payload alone: the token only carries
 * { userId, role } (see access-token.service.ts) — no username. This
 * is also why require-auth.ts's `payload.username` read is dead code
 * (always undefined); that's a pre-existing bug in this codebase, not
 * something introduced here, and it's left untouched since fixing JWT
 * signing wasn't asked for.
 *
 * Treats a banned account the same as no session — a banned user has
 * no meaningful "current user" to show, even though their access token
 * may still verify until it expires naturally.
 */
export async function getSessionAction(): Promise<PublicUser | null> {
  const payload = await getCurrentUser();
  if (!payload) return null;

  const user = await userRepository.findById(prisma, payload.userId);
  if (!user || user.status === "BANNED") return null;

  return toPublicUser(user);
}
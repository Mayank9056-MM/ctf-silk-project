// modules/dashboard/actions/get-dashboard.ts
"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardDTO } from "../types/dashboard.dto";

/**
 * Matches every other read action shown in this codebase (get-announcement,
 * get-notification, get-announcements, etc.) — no ActionState wrapper,
 * no try/catch. ApiError propagates untouched; TanStack Query's own
 * error channel handles it on the client. This deliberately does NOT
 * follow the {success,message} shape used by loginAction/registerAction
 * — those are useActionState-bound form actions with a different calling
 * convention (see this session's earlier notes on why); this action has
 * no form and is invoked imperatively, exactly like every other read.
 */
export async function getDashboard(): Promise<DashboardDTO> {
  const user = await requireAuth();
  return dashboardService.getDashboard(user.userId);
}
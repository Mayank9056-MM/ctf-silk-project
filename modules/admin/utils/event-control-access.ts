// modules/admin/utils/event-control-access.ts

import type { AuditActor } from "@/modules/audit/types/audit.types";

import { assertCanAccessAdmin } from "./admin-access";

/**
 * Authorizes every EventControl operation (view state, pause, resume,
 * enable/disable registration). Delegates entirely to
 * assertCanAccessAdmin() — with one SUPER_ADMIN and no EventControl-
 * specific permission in this project, there is no distinction today
 * between "can access Admin" and "can manage EventControl" for this
 * function to enforce on its own.
 *
 * Does NOT inspect EventControl's own state (current mode, whether
 * registration is already enabled, etc.) — that's a business-state
 * question for event-control.service.ts, not an identity question.
 */
export function assertCanManageEventControl(actor: AuditActor): void {
  assertCanAccessAdmin(actor);
}
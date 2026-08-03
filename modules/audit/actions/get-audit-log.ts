"use server";

// ============================================================================
// get-audit-log.ts
// ============================================================================
//
// The ONLY entry point the Admin Dashboard uses to search/filter/paginate
// the audit log. Every real decision — filtering, sorting, pagination,
// DTO construction, the database itself — lives in audit-query.service.ts.
// This file gates access, validates shape, hands off, returns.
// ============================================================================

import { auditLogger as log } from "@/lib/logger/logger.scopes";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { hasPermission } from "@/modules/auth/authorization/has-permission";
import { Permission } from "@/modules/auth/authorization/permission";

import { getAuditSchema } from "../validations/get-audit.schema";
import { queryAuditLog } from "../services/audit-query.service";
import type { AuditSearchResponseDTO } from "../types/audit.dto";

export async function getAuditLog(
  input: unknown,
): Promise<AuditSearchResponseDTO> {
  const user = await requireAuth();

  // Coarse gate only — category-level visibility (SECURITY/EMERGENCY
  // restricted to a Security Officer tier) is a query-time concern for
  // audit-query.service.ts, not something this layer narrows.
  if (!hasPermission(user.role, Permission.VIEW_AUDIT_LOG)) {
    throw ApiError.forbidden(
      ErrorCode.PERMISSION_DENIED,
      "You do not have permission to view the audit log.",
    );
  }

  const { filters, pagination, sort } = getAuditSchema.parse(input);

  try {
    return await queryAuditLog(filters, pagination, sort);
  } catch (error) {
    // ApiErrors here are expected outcomes (bad sort field, an
    // over-wide date range) — the caller already knows how to render
    // them. Only an unrecognized failure is worth an on-call signal.
    if (error instanceof ApiError) throw error;

    log.error("Audit log query failed unexpectedly", error, {
      actorId: user.userId,
    });
    throw error;
  }
}

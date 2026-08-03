"use server";

// ============================================================================
// get-audit-log-by-id.ts
// ============================================================================
//
// Single-row counterpart to get-audit-log.ts. Backs the Audit Detail Drawer
// opened when an admin clicks a row in the Audit Table. Every real decision
// — the lookup itself, null-vs-404 aside, DTO construction — lives in
// audit-query.service.ts. This file gates access, validates shape, hands
// off, and translates "no row" into the one decision that genuinely
// belongs here.
// ============================================================================

import { auditLogger as log } from "@/lib/logger/logger.scopes";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { hasPermission } from "@/modules/auth/authorization/has-permission";
import { Permission } from "@/modules/auth/authorization/permission";

import { getAuditDetailSchema } from "../validations/get-audit.schema";
import { getAuditDetail } from "../services/audit-query.service";
import type { AuditDetailDTO } from "../types/audit.dto";

export async function getAuditLogById(input: unknown): Promise<AuditDetailDTO> {
  const user = await requireAuth();

  // Same coarse gate as get-audit-log.ts — category-level restriction
  // (SECURITY/EMERGENCY) is a query-time concern the service/mapper own,
  // not something duplicated at this layer.
  if (!hasPermission(user.role, Permission.VIEW_AUDIT_LOG)) {
    throw ApiError.forbidden(
      ErrorCode.PERMISSION_DENIED,
      "You do not have permission to view the audit log.",
    );
  }

  const { id } = getAuditDetailSchema.parse(input);

  try {
    // A miss is a 404, not an empty state — per getAuditDetail()'s own
    // doc comment, that translation is deliberately left to this layer.
    const detail = await getAuditDetail(id);

    if (!detail) {
      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Audit log entry not found.",
      );
    }

    return detail;
  } catch (error) {
    // NOT_FOUND is an expected outcome the caller already renders.
    // Anything else is a real signal worth on-call attention.
    if (error instanceof ApiError) throw error;

    log.error("Audit log detail lookup failed unexpectedly", error, {
      action: "getAuditLogById",
      actorId: user.userId,
      auditId: id,
    });
    throw error;
  }
}

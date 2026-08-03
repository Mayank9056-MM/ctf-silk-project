import { useQuery } from "@tanstack/react-query";

import { getAuditLogById } from "../actions/get-audit-log-by-id";
import { auditKeys } from "../constants/audit.keys";

/**
 * Backs the Audit Detail Drawer. Same enabled-gating pattern as
 * useChallenge(slug) — only runs once an id actually exists, since the
 * drawer can mount before a row has been clicked.
 *
 * getAuditLogById() validates against `{ id: string }` (getAuditDetailSchema),
 * not a bare string, so the wrap here is required, not stylistic. The
 * non-null assertion on auditId reflects a real invariant enforced by
 * `enabled` — queryFn never runs while auditId is undefined.
 */
export function useAuditLogDetail(auditId: string | undefined) {
  return useQuery({
    queryKey: auditKeys.detail(auditId ?? ""),
    queryFn: () => getAuditLogById({ id: auditId as string }),
    enabled: Boolean(auditId),
  });
}

import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";

import { getAuditLog } from "../actions/get-audit-log";
import { auditKeys } from "../constants/audit.keys";
import type { getAuditSchema } from "../validations/get-audit.schema";

type AuditLogRequest = z.input<typeof getAuditSchema>;

/**
 * Backs the Admin Audit Table. getAuditLog() itself takes `unknown` —
 * validation is the action's job, not this hook's — but typing this
 * hook's parameter against getAuditSchema's own input type gives a
 * caller real filters/pagination/sort autocomplete without this file
 * duplicating a single field from that schema.
 *
 * Unlike useChallenge/useLeaderboard, getAuditLog() throws ApiError
 * directly rather than returning an ActionState<T> {success, data}
 * wrapper, so there's no `result.success` branch to unwrap here — a
 * thrown ApiError becomes this query's own `error`, which is already
 * what TanStack Query expects from a rejecting queryFn.
 */
export function useAuditLog(request: AuditLogRequest) {
  return useQuery({
    queryKey: auditKeys.list(request),
    queryFn: () => getAuditLog(request),
  });
}
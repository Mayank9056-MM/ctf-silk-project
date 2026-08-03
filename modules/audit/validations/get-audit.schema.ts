// ============================================================================
// get-audit.schema.ts
// ============================================================================
//
// The ONLY validation layer for reading audit data. Every read-side action
// (get-audit-log.ts, get-audit-log-by-id.ts, and any future resource/actor
// history action) parses its raw input through one of the schemas below
// BEFORE calling audit-query.service.ts — per this project's standing rule,
// audit-query.service.ts itself never validates.
//
// Output shapes are deliberately typed to match what audit-query.service.ts's
// functions actually accept (AuditSearchFilters / AuditPagination / AuditSort
// from audit.types.ts) — not the looser, all-optional client-facing shapes
// in audit-filter.dto.ts. Those DTOs describe what a CLIENT can construct;
// this file is what turns that into something the service can trust.
// ============================================================================

import { z } from "zod";
import {
  AuditAction,
  AuditActorType,
  AuditResourceType,
} from "@/app/generated/prisma/enums";
import { AuditCategory } from "../constants/audit.categories";
import {
  AuditSeverity,
  AuditSortField,
  AuditSortDirection,
} from "../types/audit.enums";
import {
  AUDIT_LIMITS,
  AUDIT_DEFAULTS,
  AUDIT_SEARCH,
} from "../constants/audit.constants";
import type {
  AuditSearchFilters,
  AuditPagination,
  AuditSort,
} from "../types/audit.types";

// ----------------------------------------------------------------------------
// Shared primitives
// ----------------------------------------------------------------------------

/**
 * IDs in this schema are validated as non-empty, bounded strings rather
 * than `.uuid()`. Nothing in the modules read so far (schema.prisma's
 * actual `@id` generator wasn't part of this handoff) confirms whether
 * User/Challenge/Story ids are UUIDs, cuids, or something else — and
 * guessing wrong here would silently reject every legitimate id in
 * production. Tighten to `.uuid()` (or whatever the real generator is)
 * once that's confirmed; a wrong assumption here is worse than a
 * slightly looser one.
 */
const entityIdSchema = z.string().trim().min(1).max(255);

/**
 * Dates cross the Server Action boundary as ISO strings, per
 * AuditFilterInput's own doc comment in audit-filter.dto.ts ("the
 * client-safe primitive form... parsed to Date only inside
 * get-audit.schema.ts, never here"). `z.coerce.date()` accepts that
 * string and produces the Date the rest of the codebase (AuditSearchFilters,
 * AuditRepositoryFilters) actually expects — one parse, not a Date
 * built ad hoc in every action.
 */
const isoDateSchema = z.coerce.date({
  error: () => ({ message: "Must be a valid ISO 8601 date string" }),
});

/**
 * Shared date-range check, used by both getAuditSchema and
 * getAuditStatisticsSchema — factored out as a function (not a
 * schema-level .refine() copy-pasted twice) so the two can never
 * silently drift out of sync the way audit.repository.ts's own module
 * header warns against for duplicated filter logic.
 */
function validateDateRange(
  occurredAfter: Date | undefined,
  occurredBefore: Date | undefined,
  ctx: z.RefinementCtx,
): void {
  if (!occurredAfter || !occurredBefore) return;

  if (occurredAfter > occurredBefore) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["occurredAfter"],
      message: "occurredAfter must not be later than occurredBefore",
    });
    return;
  }

  const spanDays =
    (occurredBefore.getTime() - occurredAfter.getTime()) / 86_400_000;

  if (spanDays > AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["occurredBefore"],
      message: `Date range cannot exceed ${AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS} days`,
    });
  }
}

/**
 * Free-text search. AUDIT_SEARCH.MIN_QUERY_LENGTH exists specifically
 * to stop an expensive ILIKE query firing on a 1-2 character partial
 * term (see its own doc comment in audit.constants.ts) — enforcing
 * that here, at validation, is what actually prevents that query from
 * ever reaching the repository, not just a UI-layer debounce.
 * `.trim()` before the length check so " ab " doesn't sneak past as
 * "3 characters" of mostly whitespace; an explicit empty string is
 * rejected rather than silently coerced to "no search," since the
 * client-facing contract already treats an OMITTED field as "no
 * search" (see AuditFilterInput) — an explicit "" is a different,
 * invalid input, not a synonym for absence.
 */
const searchTextSchema = z
  .string()
  .trim()
  .min(
    AUDIT_SEARCH.MIN_QUERY_LENGTH,
    `Search text must be at least ${AUDIT_SEARCH.MIN_QUERY_LENGTH} characters`,
  )
  .optional();

// ----------------------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------------------

/**
 * pageSize is clamped to AUDIT_LIMITS.MAX_QUERY_ROWS at the very first
 * layer input touches — audit-query.service.ts's toRepositoryPagination
 * re-clamps it again defensively, but that's belt-and-suspenders, not
 * a substitute for catching an out-of-range request here with a clean
 * Zod error instead of a silently-truncated result downstream.
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(AUDIT_LIMITS.MAX_QUERY_ROWS)
    .default(AUDIT_DEFAULTS.PAGE_SIZE),
});

// ----------------------------------------------------------------------------
// Sort
// ----------------------------------------------------------------------------

/**
 * AuditSortField (audit.enums.ts) declares FOUR sortable fields —
 * occurredAt, severity, category, action — but only two of those are
 * real AuditLog columns; severity/category are derived per-row from
 * AUDIT_EVENTS at read time (see audit.mapper.ts), and
 * audit-query.service.ts's toRepositorySort already throws ApiError if
 * either reaches it. Rejecting the unsupported two HERE, at validation,
 * gives a client a clean Zod field error instead of a service-layer
 * ApiError several calls deeper — same information, better-timed.
 *
 * This is a real gap between audit.enums.ts's declared surface and
 * what audit.repository.ts can execute; noted rather than silently
 * "fixed" by narrowing AuditSortField itself, since that enum may be
 * intentionally forward-declared for a future CASE-based sort — not
 * this file's call to make.
 */
const SUPPORTED_SORT_FIELDS = [
  AuditSortField.OCCURRED_AT,
  AuditSortField.ACTION,
] as const;

const sortFieldSchema = z
  .enum(AuditSortField)
  .refine(
    (field): field is (typeof SUPPORTED_SORT_FIELDS)[number] =>
      (SUPPORTED_SORT_FIELDS as readonly AuditSortField[]).includes(field),
    {
      message:
        'Sorting by "severity" or "category" is not supported — those are derived per-row, not real columns. Use "occurredAt" or "action".',
    },
  );

/**
 * NOTE: AUDIT_DEFAULTS.SORT_FIELD is currently "createdAt" in
 * audit.constants.ts — that value doesn't match any real column or
 * AuditSort field ("occurredAt" is the actual timestamp column; there
 * is no createdAt on AuditLog). Using it as this schema's default
 * would silently produce an invalid default sort. Flagging this as a
 * latent bug in audit.constants.ts rather than quietly working around
 * it forever — AUDIT_DEFAULTS.SORT_FIELD should be corrected to
 * "occurredAt" there. Defaulting explicitly to AuditSortField.OCCURRED_AT
 * here in the meantime so validation stays correct regardless.
 */
const sortSchema = z.object({
  field: sortFieldSchema.default(AuditSortField.OCCURRED_AT),
  direction: z
    .enum(AuditSortDirection)
    .default(AUDIT_DEFAULTS.SORT_DIRECTION as AuditSortDirection),
});

/**
 * AuditSortField's values are the exact plain strings AuditSort.field
 * expects ("occurredAt" | "action"), but TS treats an enum member as a
 * distinct nominal type from a plain string-literal union even when
 * the runtime values are identical — the same enum-vs-literal-union
 * gap already bridged elsewhere in this module (see
 * getAuditEventDefinition in audit.events.ts). One narrow, explicit
 * cast here, not scattered across every call site.
 */
function toAuditSort(sort: {
  field: AuditSortField;
  direction: AuditSortDirection;
}): AuditSort {
  return {
    field: sort.field as AuditSort["field"],
    direction: sort.direction as AuditSort["direction"],
  };
}

// ----------------------------------------------------------------------------
// Filters
// ----------------------------------------------------------------------------

const filtersSchema = z
  .object({
    categories: z
      .array(z.nativeEnum(AuditCategory))
      .max(AUDIT_SEARCH.MAX_CATEGORY_FILTERS)
      .optional(),
    severities: z
      .array(z.nativeEnum(AuditSeverity))
      .max(AUDIT_SEARCH.MAX_CATEGORY_FILTERS)
      .optional(),
    actions: z
      .array(z.nativeEnum(AuditAction))
      .max(AUDIT_LIMITS.MAX_SEARCH_TERMS)
      .optional(),
    actorId: entityIdSchema.optional(),
    actorType: z.nativeEnum(AuditActorType).optional(),
    resourceType: z.nativeEnum(AuditResourceType).optional(),
    resourceId: entityIdSchema.optional(),
    success: z.boolean().optional(),
    searchText: searchTextSchema,
    occurredAfter: isoDateSchema.optional(),
    occurredBefore: isoDateSchema.optional(),
  })
  .superRefine((filters, ctx) =>
    validateDateRange(filters.occurredAfter, filters.occurredBefore, ctx),
  )
  .default({});

function toAuditSearchFilters(
  filters: z.infer<typeof filtersSchema>,
): AuditSearchFilters {
  return filters;
}

// ----------------------------------------------------------------------------
// Exported schemas
// ----------------------------------------------------------------------------

/**
 * Backs queryAuditLog() — the one generic search behind every list/
 * filter/pagination use case. All three sections default independently
 * so `getAuditSchema.parse({})` is a valid, fully-defaulted request
 * (first-load of the admin dashboard with no filters applied yet).
 */
export const getAuditSchema = z
  .object({
    filters: filtersSchema,
    pagination: paginationSchema,
    sort: sortSchema,
  })
  .transform((value) => ({
    filters: toAuditSearchFilters(value.filters),
    pagination: value.pagination as AuditPagination,
    sort: toAuditSort(value.sort),
  }));

export type GetAuditInput = z.infer<typeof getAuditSchema>;

/** Backs getAuditDetail() — a single row lookup by id. */
export const getAuditDetailSchema = z.object({
  id: entityIdSchema,
});

export type GetAuditDetailInput = z.infer<typeof getAuditDetailSchema>;

/**
 * Backs getAuditStatistics(). Both bounds are optional — the service
 * itself defaults an omitted range to AUDIT_DEFAULTS.DEFAULT_LOOKBACK_DAYS
 * ending now (see audit-query.service.ts), so this schema's job is only
 * to validate a range IF one is supplied, not to invent one.
 */
export const getAuditStatisticsSchema = z
  .object({
    occurredAfter: isoDateSchema.optional(),
    occurredBefore: isoDateSchema.optional(),
  })
  .superRefine((range, ctx) =>
    validateDateRange(range.occurredAfter, range.occurredBefore, ctx),
  );

export type GetAuditStatisticsInput = z.infer<typeof getAuditStatisticsSchema>;

/**
 * Backs getResourceHistory(). Deliberately does NOT reuse
 * AuditHistoryRequest's all-optional shape (audit-filter.dto.ts) —
 * that type allows a value with no scoping field set at all, which
 * getResourceHistory's actual signature (two required parameters)
 * can't accept. Required fields here close that gap at the validation
 * boundary instead of leaving it to surface as a confusing runtime
 * failure inside the service.
 */
export const getResourceHistorySchema = z.object({
  resourceType: z.nativeEnum(AuditResourceType),
  resourceId: entityIdSchema,
  pagination: paginationSchema,
});

export type GetResourceHistoryInput = z.infer<typeof getResourceHistorySchema>;

/** Backs getActorHistory() — same rationale as getResourceHistorySchema above. */
export const getActorHistorySchema = z.object({
  actorId: entityIdSchema,
  pagination: paginationSchema,
});

export type GetActorHistoryInput = z.infer<typeof getActorHistorySchema>;

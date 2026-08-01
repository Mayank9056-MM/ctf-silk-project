
export const AUDIT_LIMITS = {
  /**
   * Maximum rows returned by a single admin dashboard query, regardless
   * of requested page size. Protects the API and DB from an admin (or a
   * misbehaving script) requesting an unbounded result set — at 2,000+
   * concurrent participants generating audit rows, an unpaginated query
   * could return millions of rows and take down the DB connection pool.
   */
  MAX_QUERY_ROWS: 500,

  /**
   * Maximum rows a single export job (CSV/JSON) is allowed to produce.
   * Beyond this, the export must be chunked into multiple files or the
   * request rejected with a "narrow your date range" error. Chosen to
   * keep a single export file under a size a browser/email client can
   * still handle (~50k rows ≈ single-digit MB of CSV).
   */
  MAX_EXPORT_ROWS: 50_000,

  /**
   * Maximum depth of nested objects permitted inside an event's
   * `metadata` JSON payload. Audit metadata is developer-supplied at
   * every call site; without a depth ceiling, a bug (e.g. accidentally
   * serializing a circular/self-referential object graph, like passing
   * a full Prisma model with relations instead of a DTO) could produce
   * pathologically deep JSON that is slow to index and slow to render
   * in the dashboard's JSON viewer.
   */
  MAX_METADATA_DEPTH: 5,

  /**
   * Maximum serialized size (in bytes) of a single event's metadata
   * JSON payload before it is rejected at write time. Prevents a single
   * audit row from ballooning the audit table's average row size, which
   * degrades index performance across the entire table, not just that
   * row.
   */
  MAX_METADATA_SIZE_BYTES: 16_384, // 16 KB

  /**
   * Maximum number of distinct `resourceIds` that can be passed to a
   * single "audit history for these resources" batch lookup (e.g. the
   * admin bulk-viewing history for a set of challenges). Prevents a
   * single request from expanding into an unbounded `WHERE resourceId
   * IN (...)` clause.
   */
  MAX_BATCH_RESOURCE_IDS: 100,

  /**
   * Maximum allowable date-range span (in days) for any search or
   * export query. Wide date ranges over a high-volume audit table are
   * the single most common cause of slow admin-dashboard queries;
   * capping the range forces pagination-by-time instead of scanning
   * the whole table.
   */
  MAX_SEARCH_WINDOW_DAYS: 180,

  /**
   * Maximum number of free-text search terms combined in a single
   * dashboard search query (space-separated keywords). Bounds the
   * complexity of the generated `ILIKE`/full-text query plan.
   */
  MAX_SEARCH_TERMS: 8,
} as const;

// ----------------------------------------------------------------------------
// DEFAULTS
// ----------------------------------------------------------------------------
// Values applied when a caller does not explicitly specify one. These are
// starting points, always clamped against AUDIT_LIMITS above — a default
// must never itself exceed the corresponding limit (enforced by the
// invariant assertions at the bottom of this file).
// ----------------------------------------------------------------------------
export const AUDIT_DEFAULTS = {
  /** Rows per page when the admin dashboard first loads the audit table. */
  PAGE_SIZE: 25,

  /** Default sort column for the audit dashboard table. */
  SORT_FIELD: "createdAt",

  /** Default sort direction — most recent events first. */
  SORT_DIRECTION: "desc",

  /**
   * Default lookback window (in days) applied when an admin opens the
   * audit dashboard without specifying a date range. Chosen to surface
   * "this week's activity" without immediately scanning the full table.
   */
  DEFAULT_LOOKBACK_DAYS: 7,

  /**
   * Default severity floor applied to the live "recent activity" feed
   * shown on the admin home dashboard (as opposed to the full audit
   * log page). Filters out routine INFO-level noise so the at-a-glance
   * feed highlights events worth an admin's attention.
   */
  ACTIVITY_FEED_MIN_SEVERITY: "WARNING",
} as const;

// ----------------------------------------------------------------------------
// EXPORT
// ----------------------------------------------------------------------------
// Tuning for the audit export pipeline (CSV/JSON generation for compliance
// reports, incident post-mortems, and event-day dispute resolution).
// ----------------------------------------------------------------------------
export const AUDIT_EXPORT = {
  /**
   * Number of rows fetched from the DB per batch while streaming an
   * export. Streaming in batches (rather than loading MAX_EXPORT_ROWS
   * into memory at once) keeps export-worker memory usage flat and
   * predictable regardless of export size.
   */
  BATCH_SIZE: 1_000,

  /** Supported export output formats. */
  SUPPORTED_FORMATS: ["csv", "json"] as const,

  /**
   * Row-count threshold above which an export is generated
   * asynchronously (background job + downloadable link/email) instead
   * of synchronously in the request/response cycle, to avoid tying up
   * an HTTP worker or hitting a gateway timeout.
   */
  ASYNC_THRESHOLD_ROWS: 5_000,

  /**
   * How long a generated export file remains downloadable before it's
   * purged from storage. Exports often contain sensitive data (PII,
   * security incident detail), so they should not persist indefinitely
   * as a passive data-exposure risk.
   */
  DOWNLOAD_LINK_TTL_HOURS: 24,

  /**
   * CSV field delimiter. Explicit constant (rather than a hardcoded
   * `','` at the call site) because some compliance tooling used by
   * partner institutions expects semicolon-delimited CSV for
   * locales where comma is the decimal separator.
   */
  CSV_DELIMITER: ",",
} as const;

// ----------------------------------------------------------------------------
// SEARCH
// ----------------------------------------------------------------------------
// Tuning for the admin dashboard's audit search/filter experience.
// ----------------------------------------------------------------------------
export const AUDIT_SEARCH = {
  /**
   * Minimum character length before a free-text search query is sent
   * to the backend. Prevents firing an expensive full-text query on
   * every single keystroke of a 1-2 character partial term.
   */
  MIN_QUERY_LENGTH: 3,

  /**
   * Debounce delay (ms) applied to the dashboard search input before
   * dispatching a query, balancing perceived responsiveness against
   * request volume during active typing.
   */
  DEBOUNCE_MS: 300,

  /**
   * Maximum number of category filters that can be combined in a
   * single search (an admin selecting multiple category checkboxes).
   * Effectively unbounded in practice (there are only 13 categories),
   * but declared explicitly rather than relying on the category enum's
   * size as an implicit ceiling.
   */
  MAX_CATEGORY_FILTERS: AUDIT_LIMITS.MAX_SEARCH_TERMS,
} as const;

// ----------------------------------------------------------------------------
// CACHE
// ----------------------------------------------------------------------------
// Cache TTLs for audit-derived read paths. The audit log itself is never
// cached (every write must be immediately visible for incident response),
// but aggregate/derived views are safe to cache briefly.
// ----------------------------------------------------------------------------
export const AUDIT_CACHE = {
  /**
   * TTL for the "distinct actors in the last N days" list used to
   * populate the actor-filter dropdown. This list changes slowly
   * (new admins are rare) so a short cache meaningfully reduces load
   * on a query that would otherwise scan a large date range on every
   * dashboard page load.
   */
  ACTOR_FILTER_LIST_TTL_SECONDS: 300,

  /**
   * TTL for category-level event-count aggregates shown as badges next
   * to each category filter (e.g. "Security (12)"). Short-lived because
   * during a live event these counts should feel close to real-time,
   * but a few seconds of staleness is an acceptable tradeoff against
   * running a COUNT(*) GROUP BY on every dashboard render.
   */
  CATEGORY_COUNT_TTL_SECONDS: 15,

  /**
   * TTL for a completed export's generated file metadata (size, row
   * count, download URL) once the export job finishes, cached to avoid
   * re-querying job status on every poll from the dashboard while the
   * user waits for an async export.
   */
  EXPORT_STATUS_TTL_SECONDS: 60,
} as const;

// ----------------------------------------------------------------------------
// PERFORMANCE
// ----------------------------------------------------------------------------
// Concurrency and throughput tuning specific to the audit write path,
// which must stay non-blocking under the 2,000+ concurrent participant
// load this platform is built for.
// ----------------------------------------------------------------------------
export const AUDIT_PERFORMANCE = {
  /**
   * Maximum number of audit write operations buffered in-memory before
   * being flushed to the DB as a single batched INSERT. Audit writes
   * happen on the hot path of gameplay actions (e.g. every flag
   * submission may trigger an audit event); batching prevents audit
   * writes from becoming a per-request DB round-trip bottleneck during
   * peak concurrent load.
   */
  WRITE_BUFFER_MAX_SIZE: 50,

  /**
   * Maximum time (ms) an audit event can sit in the write buffer before
   * being flushed, even if WRITE_BUFFER_MAX_SIZE hasn't been reached.
   * Bounds worst-case write latency so audit events are never delayed
   * indefinitely during low-traffic periods.
   */
  WRITE_BUFFER_FLUSH_INTERVAL_MS: 2_000,

  /**
   * Number of retry attempts for a failed audit write before it's
   * routed to the dead-letter path (see AUDIT_PERFORMANCE.DEAD_LETTER_*
   * below). Audit writes must not be silently dropped, but they also
   * must not block the primary gameplay action indefinitely on a
   * transient DB blip.
   */
  WRITE_RETRY_ATTEMPTS: 3,

  /** Base delay (ms) for exponential backoff between write retries. */
  WRITE_RETRY_BASE_DELAY_MS: 100,

  /**
   * Whether a failed audit write (after exhausting retries) should be
   * persisted to a local dead-letter file/queue for later replay,
   * rather than lost. Non-negotiable for a live competition — a lost
   * audit record during a scoring dispute is a serious operational gap.
   */
  DEAD_LETTER_ENABLED: true,
} as const;

// ----------------------------------------------------------------------------
// VALIDATION
// ----------------------------------------------------------------------------
// Constants consumed by the Zod schemas that validate audit event input at
// the service boundary, before an event is ever written.
// ----------------------------------------------------------------------------
export const AUDIT_VALIDATION = {
  /** Minimum length for a human-readable event `description` field. */
  MIN_DESCRIPTION_LENGTH: 3,

  /**
   * Maximum length for a human-readable event `description` field.
   * Descriptions render inline in the dashboard table; unbounded length
   * would break table layout and bloat row size for what is meant to be
   * a one-line summary (full context belongs in `metadata`).
   */
  MAX_DESCRIPTION_LENGTH: 500,

  /**
   * Maximum length for a single metadata key. Guards against
   * pathological or accidentally-serialized keys (e.g. a stringified
   * object mistakenly used as a key).
   */
  MAX_METADATA_KEY_LENGTH: 100,

  /**
   * Regex constraining metadata keys to a predictable shape
   * (camelCase or snake_case alphanumerics). Prevents keys containing
   * whitespace, dots, or brackets that could be misinterpreted as JSON
   * path expressions by downstream tooling (e.g. the dashboard's
   * metadata search-by-key feature).
   */
  METADATA_KEY_PATTERN: /^[a-zA-Z][a-zA-Z0-9_]*$/,
} as const;

// ----------------------------------------------------------------------------
// RETENTION
// ----------------------------------------------------------------------------
// How long audit data is kept before archival/deletion. Retention is
// deliberately category-aware (see AUDIT_RETENTION_BY_CATEGORY) rather
// than a single global TTL, because compliance requirements differ by
// domain: a security incident record has very different retention needs
// than a routine CMS content edit.
// ----------------------------------------------------------------------------
export const AUDIT_RETENTION = {
  /**
   * Default retention (days) for any category not explicitly listed in
   * AUDIT_RETENTION_BY_CATEGORY. Conservative default chosen to satisfy
   * a typical one-year internal audit cycle.
   */
  DEFAULT_RETENTION_DAYS: 365,

  /**
   * Grace period (days) after the retention window expires before a
   * record is hard-deleted, during which it is soft-deleted /
   * excluded from normal queries but recoverable. Protects against
   * accidental data loss from a retention-job bug.
   */
  SOFT_DELETE_GRACE_PERIOD_DAYS: 30,

  /**
   * Hour of day (UTC, 0-23) the retention/archival cron job runs.
   * Scheduled off-peak, well outside typical live-event hours, so a
   * bulk archival job never competes with gameplay traffic for DB I/O.
   */
  ARCHIVAL_JOB_HOUR_UTC: 3,
} as const;

/**
 * Category-specific retention overrides, in days. Keys intentionally
 * reference `AuditCategory` from audit.categories.ts (imported below)
 * rather than raw strings, so this table can never silently drift out of
 * sync if a category is renamed.
 *
 * Rationale per category is documented inline — retention periods below
 * are illustrative defaults; final values should be confirmed against
 * the institution's actual compliance/legal requirements before go-live.
 */
import { AuditCategory } from "./audit.categories";

export const AUDIT_RETENTION_BY_CATEGORY: Partial<
  Record<AuditCategory, number>
> = {
  // Security incidents are retained the longest — post-incident and
  // legal review windows commonly span multiple years.
  [AuditCategory.SECURITY]: 1_825, // 5 years
  [AuditCategory.EMERGENCY]: 1_825, // 5 years

  // Leaderboard integrity records must survive well beyond the event
  // itself in case of a delayed dispute or academic-integrity inquiry.
  [AuditCategory.LEADERBOARD]: 1_095, // 3 years
  [AuditCategory.MODERATION]: 1_095, // 3 years

  // Authentication and user-admin history: standard 1-year compliance
  // window, aligned with AUDIT_RETENTION.DEFAULT_RETENTION_DAYS.
  [AuditCategory.AUTHENTICATION]: 365,
  [AuditCategory.USER]: 365,

  // Low-stakes content categories can be pruned sooner — a banner-text
  // edit has negligible long-term audit value.
  [AuditCategory.CMS]: 180,
};

// ----------------------------------------------------------------------------
// INVARIANT ASSERTIONS
// ----------------------------------------------------------------------------
// Fails fast at module load (not at runtime deep in a query) if a default
// is ever edited to exceed its corresponding hard limit — catches the
// "someone bumped PAGE_SIZE past MAX_QUERY_ROWS" class of bug in CI rather
// than in production.
// ----------------------------------------------------------------------------
if (AUDIT_DEFAULTS.PAGE_SIZE > AUDIT_LIMITS.MAX_QUERY_ROWS) {
  throw new Error(
    "[audit.constants] AUDIT_DEFAULTS.PAGE_SIZE must not exceed AUDIT_LIMITS.MAX_QUERY_ROWS",
  );
}

if (AUDIT_EXPORT.ASYNC_THRESHOLD_ROWS > AUDIT_LIMITS.MAX_EXPORT_ROWS) {
  throw new Error(
    "[audit.constants] AUDIT_EXPORT.ASYNC_THRESHOLD_ROWS must not exceed AUDIT_LIMITS.MAX_EXPORT_ROWS",
  );
}

if (
  AUDIT_DEFAULTS.DEFAULT_LOOKBACK_DAYS > AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS
) {
  throw new Error(
    "[audit.constants] AUDIT_DEFAULTS.DEFAULT_LOOKBACK_DAYS must not exceed AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS",
  );
}

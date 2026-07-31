import { env } from "@/config/env";
import { redact } from "./redact";
import type { LogLevel, LogContext, LogEntry } from "./logger.types";

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = env.NODE_ENV === "production" ? "info" : "debug";

/**
 * Structured logger with automatic redaction and per-module scoping via
 * .child(). Zero external dependencies — console under the hood, same
 * reasoning as Postgres over Redis for rate limiting and an in-process
 * Map over Redis for story-cache: this app runs as one long-lived
 * process, and console output is already what every hosting platform
 * (Docker logs, PM2, Vercel, Railway) captures without extra wiring.
 * Reach for pino/winston only if real log volume or a multi-transport
 * need ever demands it — not preemptively for one event.
 *
 * Instantiate one per module via .child(), not a single shared instance
 * used everywhere directly — that's what makes every log line
 * self-identifying without repeating `{ module: "..." }` at every call
 * site. See logger.scopes.ts for the canonical registry.
 *
 * NEVER throws. A logging call failing must never take down the request
 * it was trying to describe — every path here degrades to a missing log
 * line, not a 500.
 */
export class Logger {
  private readonly bindings: LogContext;

  constructor(bindings: LogContext = {}) {
    this.bindings = bindings;
  }

  /**
   * Returns a new Logger with additional persistent context merged in.
   *   const log = new Logger().child({ module: "submission" });
   *   log.info("flag submitted", { userId, challengeId });
   * always includes `module: "submission"`, no repetition per call.
   * Chainable — a further .child({ requestId }) narrows scope again.
   */
  child(bindings: LogContext): Logger {
    return new Logger({ ...this.bindings, ...bindings });
  }

  debug(message: string, context?: LogContext): void {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write("warn", message, context);
  }

  /** Accepts the caught value directly (unknown) — matches every catch block in this codebase. */
  error(message: string, error?: unknown, context?: LogContext): void {
    this.write("error", message, context, error);
  }

  /**
   * A named domain event (see story.events.ts's STORY_EVENTS) — an
   * `info` entry with a stable `event` field, filterable/countable by
   * name independent of the human-readable message.
   */
  event(name: string, context?: LogContext): void {
    this.write("info", name, { ...context, event: name });
  }

  private write(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    try {
      if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

      const entry: LogEntry = { level, message, timestamp: new Date().toISOString() };

      const mergedContext = { ...this.bindings, ...context };
      if (Object.keys(mergedContext).length > 0) {
        entry.context = redact(mergedContext) as LogContext;
      }

      if (error !== undefined) {
        entry.error =
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { name: "UnknownError", message: String(error) };
      }

      this.output(entry);
    } catch (loggingError) {
      console.error("[logger] failed to log:", loggingError);
    }
  }

  private output(entry: LogEntry): void {
    if (env.NODE_ENV === "production") {
      const line = JSON.stringify(entry);
      (entry.level === "error" || entry.level === "warn" ? console.error : console.log)(line);
      return;
    }

    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}`;
    const method = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;
    method(prefix, entry.message, entry.context ?? "", entry.error ?? "");
  }
}
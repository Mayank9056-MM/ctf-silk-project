/**
 * Key names redacted automatically, everywhere, by pattern rather than
 * an explicit list — covers passwordHash, flagHash, submittedFlagHash,
 * tokenHash, refreshToken, and any future field this project adds that
 * happens to match. Structural, not disciplinal: the same principle as
 * hashIdentifier() normalizing rate-limit keys internally rather than
 * trusting every call site to remember — nobody logging an object has
 * to remember which fields are secret; the logger already knows.
 */
const SENSITIVE_KEY_PATTERN = /password|secret|hash|token/i;
const EMAIL_KEY_PATTERN = /^email$/i;
const REDACTED = "[REDACTED]";

function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return REDACTED;
  return `${local.length <= 1 ? "*" : `${local[0]}***`}@${domain}`;
}

/** Deep-redacts a value before it's ever serialized into a log line. */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redact(item, seen));

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = REDACTED;
    } else if (EMAIL_KEY_PATTERN.test(key) && typeof val === "string") {
      result[key] = maskEmail(val);
    } else {
      result[key] = redact(val, seen);
    }
  }
  return result;
}
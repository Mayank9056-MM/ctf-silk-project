/**
 * Intentional no-op.
 *
 * Hints/Advisor is listed as a "Future module" — no Hint or Advisor
 * Prisma model exists yet (the project's own architecture rule: never
 * build schema or seed infrastructure ahead of a real, scheduled
 * feature — vocabulary is fine, tables are not).
 *
 * This file exists only so seed.ts's step list and package.json's
 * `seed:hints` script don't need to change the moment the Hints module
 * actually lands. Replace this body with real seed logic then — not
 * before, and not by inventing a model shape now to fill the gap.
 */
export async function seedHints(): Promise<void> {
  console.log("  (skipped — no Hint model exists yet)");
}
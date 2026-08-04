// ============================================================================
// reset-db.ts
// ============================================================================
//
// Wraps `prisma migrate reset` + `prisma generate` + seed.ts behind an
// explicit typed confirmation — the one script in this folder capable of
// destroying a database, and the only one that asks before doing
// anything.
//
// Runs child_process commands directly (this is a local/CI dev tool, not
// application code — none of the "no Prisma outside repositories"
// layering applies to scripts/, which sits outside the app's runtime
// architecture entirely). Not invoked as part of writing this file;
// review the commands below before running it against any database that
// matters.
// ============================================================================

import { execSync } from "node:child_process";
import * as readline from "node:readline/promises";
import { main as runSeed } from "./seed";
import "dotenv/config"

const CONFIRMATION_PHRASE = "reset";

async function confirm(): Promise<boolean> {
  if (process.env.CI === "true" || process.argv.includes("--yes")) {
    // CI and explicit --yes both skip the interactive prompt — CI has
    // no stdin to read from, and --yes is an intentional opt-out for
    // scripted local use (a Makefile target, a pre-test setup script).
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(
    "\n⚠️  This will PERMANENTLY DELETE all data in the configured database, then re-migrate and re-seed it.",
  );
  const answer = await rl.question(
    `Type "${CONFIRMATION_PHRASE}" to continue: `,
  );
  rl.close();

  return answer.trim() === CONFIRMATION_PHRASE;
}

/**
 * Three distinct, individually-loggable steps rather than one combined
 * shell command — if `migrate reset` succeeds but `generate` fails
 * (a stale node_modules, a version mismatch), the failure is
 * unambiguous about which stage broke, rather than a single opaque
 * combined-command exit code.
 */
async function resetDatabase(): Promise<void> {
  const confirmed = await confirm();
  if (!confirmed) {
    console.log("[reset-db] Aborted — confirmation phrase did not match.");
    process.exitCode = 1;
    return;
  }

  console.log("\n[reset-db] → prisma migrate reset");
  execSync("npx prisma migrate reset --force --skip-seed", {
    stdio: "inherit",
  });

  console.log("\n[reset-db] → prisma generate");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("\n[reset-db] → seed.ts");
  await runSeed();

  console.log("\n[reset-db] Database reset and seeded.");
}

if (require.main === module) {
  resetDatabase().catch((error) => {
    console.error("\n[reset-db] Failed:", error);
    process.exitCode = 1;
  });
}
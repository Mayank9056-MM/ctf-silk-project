import { Logger } from "./logger";

/**
 * One instance per module, created once here rather than each module
 * writing `new Logger({ module: "..." })` inline — a typo'd module name
 * ("submision") would silently create an inconsistent log tag with no
 * compiler error to catch it. Import the module's own logger from here;
 * add a new line when a new module needs one.
 */
export const authLogger = new Logger({ module: "auth" });
export const challengeLogger = new Logger({ module: "challenge" });
export const submissionLogger = new Logger({ module: "submission" });
export const leaderboardLogger = new Logger({ module: "leaderboard" });
export const eventLogger = new Logger({ module: "event" });
export const storyLogger = new Logger({ module: "story" });
export const rateLimitLogger = new Logger({ module: "rate-limit" });

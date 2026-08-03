import { compareFlag } from "../utils/hash-flag";
import { challengeLogger as log } from "@/lib/logger/logger.scopes";

class FlagService {
  async verify(submittedFlag: string, flagHash: string): Promise<boolean> {
    try {
      return compareFlag(submittedFlag.trim(), flagHash);
    } catch (error) {
      log.error(
        "Flag comparison threw — likely a malformed stored flagHash",
        error,
      );
      throw error;
    }
  }
}

export const flagService = new FlagService();

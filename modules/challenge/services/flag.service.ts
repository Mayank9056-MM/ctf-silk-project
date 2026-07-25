import { compareFlag } from "../utils/hash-flag";

class FlagService {
  async verify(submittedFlag: string, flagHash: string): Promise<boolean> {
    return compareFlag(submittedFlag.trim(), flagHash);
  }
}

export const flagService = new FlagService();

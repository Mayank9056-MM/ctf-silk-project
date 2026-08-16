// lib/action-state.ts
import type { ErrorCode } from "@/lib/errors/ErrorCode";

export type ActionState<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | undefined>;
  /**
   * Present only on failure, and only when the failure originated from
   * a thrown ApiError. Lets the client discriminate WHICH failure this
   * is (rate-limited vs. forbidden vs. not-found, etc.) without
   * string-matching `message`, which is free-text and not a contract.
   * Optional and additive — every existing action that never sets this
   * still type-checks and behaves identically.
   */
  code?: ErrorCode;
};
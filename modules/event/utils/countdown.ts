// modules/event/lib/countdown.ts

import type { EventCountdown } from "../types";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Calculate the remaining time until until a target date.
 *
 * If the target time has already passed, all values are zero.
 */
export function getCountDown(
  targetDate: Date,
  now: Date = new Date(),
): EventCountdown {
  const remaining = Math.max(targetDate.getTime() - now.getTime(), 0);

  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMiliseconds: remaining,
  };
}

/**
 * Returns true if the countdown has finished.
 */
export function isCountdownFinished(
  targetDate: Date,
  now: Date = new Date(),
): boolean {
  return now >= targetDate;
}

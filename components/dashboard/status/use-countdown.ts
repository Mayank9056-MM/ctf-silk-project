"use client";

import { useEffect, useRef, useState } from "react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  expired: boolean;
}

const ZERO: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
  expired: true,
};

function computeParts(target: Date | null): CountdownParts {
  if (!target) return ZERO;
  const diffMs = target.getTime() - Date.now();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    expired: totalSeconds <= 0,
  };
}

/**
 * Client-side ticking countdown to a single target Date. Deliberately
 * independent of the server's EventCountdown shape — it just needs
 * event.startsAt/endsAt, both already real Dates on DashboardDTO — so
 * the dashboard never refetches on a per-second cadence. Pauses while
 * the tab is hidden and re-syncs immediately on return.
 */
export function useCountdown(target: Date | null): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() =>
    computeParts(target),
  );
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    setParts(computeParts(targetRef.current));
    if (!target) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const tick = () => setParts(computeParts(targetRef.current));

    const start = () => {
      if (intervalId) return;
      tick();
      intervalId = setInterval(tick, 1000);
    };
    const stop = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };
    const onVisibility = () =>
      document.visibilityState === "visible" ? start() : stop();

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.getTime()]);

  return parts;
}

export function formatCountdown(p: CountdownParts): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return p.days > 0
    ? `${p.days}d ${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`
    : `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
}

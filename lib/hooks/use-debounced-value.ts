"use client";

import { useEffect, useState } from "react";

/**
 * Extracted from the identical inline debounce effect duplicated in
 * AuditPanel and PlayersPanel (and needed again for any future
 * search-driven admin panel). One implementation, one place to tune
 * the delay.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
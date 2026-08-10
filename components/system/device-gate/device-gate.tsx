"use client";

import type { ReactNode } from "react";

import { useDeviceSupported } from "@/lib/device/use-device-supported";
import { DeviceRestrictedScreen } from "./device-restricted-screen";

/**
 * Global desktop-only gate. Wraps the entire app's {children} in
 * app/layout.tsx so every route — current and future — is covered
 * with no per-route wiring.
 *
 * This is a UX/compatibility boundary, not an authorization mechanism.
 * A client-side viewport check can trivially be spoofed by anyone
 * calling the API directly — it does not, and must not be relied on
 * to, protect anything. Real authorization stays entirely server-side,
 * unchanged by this component.
 *
 * When unsupported, this unmounts {children} outright rather than
 * hiding it with CSS — the point isn't just visual concealment, it's
 * that a gated device's app tree (and its data-fetching hooks) should
 * never mount at all.
 */
export function DeviceGate({ children }: { children: ReactNode }) {
  const supported = useDeviceSupported();

  if (!supported) {
    return <DeviceRestrictedScreen />;
  }

  return <>{children}</>;
}

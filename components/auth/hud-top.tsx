"use client";

import { useEffect, useState } from "react";

import { CaseIdentifier } from "./case-identifier";
import { DEFAULT_CASE_ID } from "@/lib/constants/case";

export function HudTop({ caseId = DEFAULT_CASE_ID }: { caseId?: string }) {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sr-hud sr-anim-hud" aria-hidden="true">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="sr-hud-dot" />
        SECURE LINK · SR-DIVISION NET
      </div>
      <CaseIdentifier caseId={caseId} variant="inline" />
      <div className="hidden md:block">CLEARANCE // LEVEL 03</div>
      <div className="hidden lg:block">CONNECTION // ENCRYPTED</div>
      <div>{time}</div>
    </div>
  );
}

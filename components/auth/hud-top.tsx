"use client";

import { useEffect, useState } from "react";

export function HudTop({ caseId = "SR-0417" }: { caseId?: string }) {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sr-hud" aria-hidden="true">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="sr-hud-dot" />
        SECURE LINK · SR-DIVISION NET
      </div>
      <div>CASE #{caseId}</div>
      <div>{time}</div>
    </div>
  );
}
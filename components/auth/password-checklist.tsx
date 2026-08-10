"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "8+ characters", test: (v) => v.length >= 8 },
  { label: "Uppercase", test: (v) => /[A-Z]/.test(v) },
  { label: "Lowercase", test: (v) => /[a-z]/.test(v) },
  { label: "Number", test: (v) => /[0-9]/.test(v) },
];

/**
 * 2x2 compact grid instead of the old 4-row vertical list. The dot/check
 * swap happens inside a fixed 14x14 icon slot (.sr-checklist-icon) so the
 * label never shifts horizontally when a rule flips — layout stability
 * was an explicit requirement, not just a nice-to-have.
 */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <div className="sr-checklist-panel">
      <span className="sr-checklist-title">Password Integrity</span>
      <ul className="sr-checklist sr-checklist-grid">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.label}
              className={`sr-checklist-item${met ? " sr-met" : ""}`}
            >
              <span className="sr-checklist-icon" aria-hidden="true">
                <AnimatePresence mode="wait" initial={false}>
                  {met ? (
                    <motion.span
                      key="met"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="unmet"
                      className="sr-checklist-icon-dot"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                    />
                  )}
                </AnimatePresence>
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

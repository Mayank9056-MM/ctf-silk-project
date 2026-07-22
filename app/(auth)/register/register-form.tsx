"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { registerAction } from "@/modules/auth/actions/register";
import { INITIAL_REGISTER_ACTION_STATE } from "@/modules/auth/types/action-state";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";

const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
];

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_REGISTER_ACTION_STATE);
  const [password, setPassword] = useState("");

  return (
    <>
      <h1 className="sr-title">
        Recruit <span>Intake</span>
      </h1>
      <p className="sr-subtitle">He wants answers. Get clearance to help find them.</p>

      {state.message && (
        <div className="sr-form-message sr-error" role="alert">
          {state.message}
        </div>
      )}

      <form action={formAction} noValidate>
        <FormField
          label="Full Name"
          name="fullName"
          autoComplete="name"
          placeholder="Ethan Carter"
          errors={state.fieldErrors?.fullName}
        />

        <FormField
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="ecarter"
          errors={state.fieldErrors?.username}
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="agent@fbi-cyber.gov"
          errors={state.fieldErrors?.email}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          value={password}
          onValueChange={setPassword}
          errors={state.fieldErrors?.password}
        />

        <ul className="sr-checklist">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className={`sr-checklist-item${met ? " sr-met" : ""}`}>
                <span className="sr-checklist-dot" />
                {rule.label}
              </li>
            );
          })}
        </ul>

        <FormField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          errors={state.fieldErrors?.confirmPassword}
        />

        <SubmitButton idleLabel="Submit for Clearance" pendingLabel="Processing…" />
      </form>

      <p className="sr-footer-link">
        Already cleared? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
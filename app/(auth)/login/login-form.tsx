"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/modules/auth/actions/login";
import { INITIAL_LOGIN_ACTION_STATE } from "@/modules/auth/types/action-state";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";

interface LoginFormProps {
  redirectTo?: string;
  justRegistered?: boolean;
}

export function LoginForm({ redirectTo, justRegistered }: LoginFormProps) {
  const [state, formAction] = useActionState(
    loginAction,
    INITIAL_LOGIN_ACTION_STATE,
  );

  return (
    <>
      <h1 className="sr-title">
        Agent <span>Access</span>
      </h1>
      <p className="sr-subtitle">
        Some cases close on paper. Sign in to pick up where you left off.
      </p>

      {justRegistered && !state.message && (
        <div className="sr-form-message sr-success">
          Account created. Sign in to begin the investigation.
        </div>
      )}

      {state.message && (
        <div className="sr-form-message sr-error" role="alert">
          {state.message}
        </div>
      )}

      <form action={formAction} noValidate>
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}

        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="agent@fbi-cyber.gov"
          autoComplete="email"
          errors={state.fieldErrors?.email}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••••"
          autoComplete="current-password"
          errors={state.fieldErrors?.password}
        />

        <SubmitButton idleLabel="Authenticate" pendingLabel="Verifying…" />
      </form>

      <p className="sr-footer-link">
        No clearance on file? <Link href="/register">Request access</Link>
      </p>
    </>
  );
}

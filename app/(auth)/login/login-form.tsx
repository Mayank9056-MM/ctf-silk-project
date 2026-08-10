"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

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
      <h1 className="sr-title sr-anim-title">
        Agent <span>Access</span>
      </h1>
      <p className="sr-subtitle sr-anim-subtitle">
        Some cases close on paper. This one didn&apos;t.
      </p>

      <AnimatePresence mode="wait">
        {justRegistered && !state.message && (
          <motion.div
            key="registered"
            className="sr-form-message sr-success"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ShieldCheck className="mr-1.5 -mt-0.5 inline-block h-3.5 w-3.5" aria-hidden="true" />
            Clearance request accepted. Sign in to begin the investigation.
          </motion.div>
        )}

        {state.message && (
          <motion.div
            key="error"
            className="sr-form-message sr-error"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {state.message}
          </motion.div>
        )}
      </AnimatePresence>

      <form action={formAction} noValidate className="sr-anim-form">
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
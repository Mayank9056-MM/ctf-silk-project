"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { registerAction } from "@/modules/auth/actions/register";
import { INITIAL_REGISTER_ACTION_STATE } from "@/modules/auth/types/action-state";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { PasswordChecklist } from "@/components/auth/password-checklist";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_REGISTER_ACTION_STATE);
  const [password, setPassword] = useState("");

  return (
    <>
      {state.message && (
        <motion.div
          className="sr-form-message sr-error"
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {state.message}
        </motion.div>
      )}

      <form action={formAction} noValidate className="sr-form-grid">
        <div className="sr-anim-field">
          <FormField
            label="Full Name"
            name="fullName"
            autoComplete="name"
            placeholder="Ethan Carter"
            errors={state.fieldErrors?.fullName}
          />
        </div>

        <div className="sr-anim-field">
          <FormField
            label="Username"
            name="username"
            autoComplete="username"
            placeholder="ecarter"
            errors={state.fieldErrors?.username}
          />
        </div>

        <div className="sr-anim-field sr-field-span-2">
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="agent@fbi-cyber.gov"
            errors={state.fieldErrors?.email}
          />
        </div>

        <div className="sr-anim-field">
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
        </div>

        <div className="sr-anim-field">
          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            errors={state.fieldErrors?.confirmPassword}
          />
        </div>

        <div className="sr-anim-checklist sr-field-span-2">
          <PasswordChecklist password={password} />
        </div>

        <div className="sr-field-span-2">
          <SubmitButton idleLabel="Submit for Clearance" pendingLabel="Processing…" />
        </div>
      </form>

      <p className="sr-footer-link">
        Already cleared? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
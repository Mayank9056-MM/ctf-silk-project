import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/app/(auth)/register/register-form";

export const metadata: Metadata = { title: "Request Access — Operation Silk Road" };

export default function RegisterPage() {
  return (
    <AuthShell eyebrow="FBI Cyber Division — New Recruit Intake">
      <RegisterForm />
    </AuthShell>
  );
}
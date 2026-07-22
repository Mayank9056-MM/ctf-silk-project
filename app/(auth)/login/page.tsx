import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = { title: "Secure Access — Operation Silk Road" };

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; registered?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell eyebrow="FBI Cyber Division — Secure Access">
      <LoginForm redirectTo={params.redirectTo} justRegistered={params.registered === "true"} />
    </AuthShell>
  );
}
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/app/(auth)/register/register-form";

export const metadata: Metadata = {
  title: "Request Access — FBI Cyber Division",
};

export default function RegisterPage() {
  return (
    <AuthShell
      variant="split"
      eyebrow="FBI Cyber Division"
      panelTitle="Create Clearance Profile"
      narrative={{
        title: "New Recruit Intake",
        description: "He wants answers. Get clearance to help find them.",
        statuses: [
          { label: "Case Status", value: "Active" },
          { label: "Clearance", value: "Level 03" },
          { label: "Secure Network", value: "Connected", pulse: true },
        ],
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}

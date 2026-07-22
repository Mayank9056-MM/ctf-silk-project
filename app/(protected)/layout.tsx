import type { ReactNode } from "react";

import { getCurrentUser } from "@/modules/auth/utils/get-current-user";
import { SessionProvider } from "@/components/auth/session-provider";
import { SessionRecovery } from "@/components/auth/session-recovery";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <SessionRecovery redirectTo="/dashboard" />;
  }

  return <SessionProvider>{children}</SessionProvider>;
}
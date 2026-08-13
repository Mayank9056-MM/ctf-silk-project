"use client";

import { useTransition } from "react";
import { LogOut, RefreshCw, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { useSession } from "@/modules/auth/hooks/use-session";
import { useRefreshSession } from "@/modules/auth/hooks/use-refresh-session";
import { logoutAction } from "@/modules/auth/actions/logout";

/**
 * DropdownMenuTrigger (Base UI Menu.Trigger) renders its own interactive
 * element by default — same nested-button hazard already hit on the
 * notification bell's PopoverTrigger — so this styles the trigger
 * directly rather than nesting a Button component inside it.
 *
 * Sign-out is invoked by calling logoutAction() directly as a function
 * from a click handler, NOT via <form action={logoutAction}>. A
 * <form>/<button type="submit"> nested inside DropdownMenuItem (itself
 * an interactive menuitem-role element with its own click/keyboard
 * handling) would be the same nested-interactive-element problem in a
 * different shape. Calling a Server Action directly is a fully
 * supported convention distinct from the form-action convention — this
 * is the correct tool for "trigger this from inside something that
 * isn't a form," not a workaround.
 *
 * redirect() inside logoutAction() throws Next's internal NEXT_REDIRECT
 * signal — this is documented to work when the action is invoked inside
 * startTransition from a Client Component, which is exactly the shape
 * used here. Flagging that I could not execute this app to confirm the
 * redirect actually fires end-to-end; verify after wiring.
 *
 * `user.username` — PublicUser's exact field names weren't given to me
 * directly, only inferred (register.schema takes fullName/username/
 * email, and toPublicUser is an Omit<User, ...> over those same Prisma
 * fields). If the real field is named differently, swap it here only.
 */
export function PlayerMenu() {
  const { data: user, isLoading } = useSession();
  const refreshSession = useRefreshSession();
  const [loggingOut, startLogoutTransition] = useTransition();

  function handleLogout() {
    startLogoutTransition(async () => {
      await logoutAction();
    });
  }

  if (isLoading) {
    return (
      <span
        className={cn(
          "h-4 w-16 animate-pulse rounded",
          dashboardTheme.background.surfaceStrong,
        )}
        aria-hidden="true"
      />
    );
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] transition-colors",
          "hover:bg-(--sr-bg-surface-strong)",
          dashboardTheme.text.secondary,
          dashboardTheme.font.ui,
        )}
      >
        <UserIcon className="size-3.5" aria-hidden="true" />
        {user.username}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "border",
          dashboardTheme.background.elevated,
          dashboardTheme.border.normal,
        )}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className={dashboardTheme.text.muted}>
            Signed in as{" "}
            <span className={dashboardTheme.text.primary}>{user.username}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className={dashboardTheme.border.subtle} />

        <DropdownMenuItem
          onClick={() => refreshSession.mutate()}
          disabled={refreshSession.isPending}
          className={dashboardTheme.text.secondary}
        >
          <RefreshCw
            className={cn(
              "size-3.5",
              refreshSession.isPending && "animate-spin",
            )}
            aria-hidden="true"
          />
          {refreshSession.isPending ? "Refreshing…" : "Refresh session"}
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

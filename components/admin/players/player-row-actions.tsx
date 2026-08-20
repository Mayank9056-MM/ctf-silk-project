"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { UserStatus } from "@/app/generated/prisma/enums";
import type { PlayerDTO } from "@/modules/admin/types/player-management.dto";
import { useBanPlayer } from "@/modules/admin/hooks/player-management/use-ban-player";
import { useUnbanPlayer } from "@/modules/admin/hooks/player-management/use-unban-player";
import { useResetPlayerPassword } from "@/modules/admin/hooks/player-management/use-reset-player-password";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface PlayerRowActionsProps {
  player: PlayerDTO;
}

export function PlayerRowActions({ player }: PlayerRowActionsProps) {
  const [confirmAction, setConfirmAction] = useState<"ban" | "unban" | "reset" | null>(
    null,
  );
  const [resetResult, setResetResult] = useState<string | null>(null);

  const banPlayer = useBanPlayer();
  const unbanPlayer = useUnbanPlayer();
  const resetPassword = useResetPlayerPassword();

  const isBanned = player.status === UserStatus.BANNED;
  const pending = banPlayer.isPending || unbanPlayer.isPending || resetPassword.isPending;

  function handleConfirm() {
    if (confirmAction === "ban") {
      banPlayer.mutate(
        { playerId: player.id },
        { onSuccess: () => setConfirmAction(null) },
      );
    } else if (confirmAction === "unban") {
      unbanPlayer.mutate(
        { playerId: player.id },
        { onSuccess: () => setConfirmAction(null) },
      );
    } else if (confirmAction === "reset") {
      resetPassword.mutate(
        { playerId: player.id },
        {
          onSuccess: (result) => {
            setConfirmAction(null);
            setResetResult(result.temporaryPassword);
          },
        },
      );
    }
  }

  const activeError =
    (confirmAction === "ban" && banPlayer.error) ||
    (confirmAction === "unban" && unbanPlayer.error) ||
    (confirmAction === "reset" && resetPassword.error) ||
    null;

  return (
    <>
      <DropdownMenu>
        {/*
          Base UI's Menu.Trigger has no `asChild` prop — that's a Radix
          pattern. It uses `render`, the same pattern already used
          correctly elsewhere in this codebase (DialogClose,
          AlertDialogCancel). Without this, Base UI silently ignores an
          unrecognized `asChild` prop and renders its OWN real <button>
          around whatever children it's given — which was this file's
          <Button> (itself a real <button>), producing the nested
          <button><button> hydration warning from the dev log.
        */}
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isBanned ? (
            <DropdownMenuItem onClick={() => setConfirmAction("unban")}>
              Unban player
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setConfirmAction("ban")}
              className="text-destructive"
            >
              Ban player
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setConfirmAction("reset")}>
            Reset password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmAction !== null} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "ban" && `Ban ${player.username}?`}
              {confirmAction === "unban" && `Unban ${player.username}?`}
              {confirmAction === "reset" && `Reset password for ${player.username}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "ban" &&
                "This immediately revokes all of their active sessions. They will be signed out everywhere and unable to sign back in."}
              {confirmAction === "unban" &&
                "This restores their ability to sign in and play."}
              {confirmAction === "reset" &&
                "This revokes all of their active sessions and generates a new temporary password, shown once."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {activeError ? (
            <p className="text-sm text-destructive">{activeError.message}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={pending}>
              {pending ? "Working…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResetPasswordDialog
        open={resetResult !== null}
        onOpenChange={(open) => !open && setResetResult(null)}
        username={player.username}
        temporaryPassword={resetResult}
      />
    </>
  );
}
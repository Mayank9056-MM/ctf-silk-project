"use client";

import { useRef, useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string | null;
  temporaryPassword: string | null;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  username,
  temporaryPassword,
}: ResetPasswordDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  async function handleCopy() {
    if (!temporaryPassword) return;
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked (permissions, insecure context, unsupported
      // browser) — fall back to selecting the text so the admin can
      // still copy manually via keyboard, and tell them explicitly
      // rather than silently doing nothing on a one-time secret.
      setCopyFailed(true);
      const selection = window.getSelection();
      const range = document.createRange();
      if (textRef.current && selection) {
        range.selectNodeContents(textRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setCopied(false);
        setCopyFailed(false);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password reset for {username}</DialogTitle>
          <DialogDescription>
            This temporary password is shown once and cannot be retrieved
            again. Share it with the player through a secure channel — the
            event organizers have been told to relay it, per the
            notification already sent to this player.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--ops-border)] bg-[var(--ops-bg-elevated)] px-3 py-2 font-mono text-sm">
          <span ref={textRef} className="truncate select-all">
            {temporaryPassword}
          </span>
          <Button size="icon" variant="ghost" onClick={handleCopy} aria-label="Copy temporary password">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>

        {copyFailed ? (
          <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Automatic copy was blocked by your browser. The password above is now selected — press Ctrl/Cmd+C to copy it manually.
          </p>
        ) : null}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
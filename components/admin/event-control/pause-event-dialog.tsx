"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { usePauseEvent } from "@/modules/admin/hooks/event-control/use-pause-event";

interface PauseEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pausing a live event is the single highest-blast-radius action on
 * this dashboard — every player is locked out of gameplay the moment
 * this succeeds. A confirmation dialog with an optional but
 * visible reason field exists specifically so that decision is
 * deliberate, not a stray click, and so the reason (surfaced back to
 * players via the paused-state banner elsewhere in the product) gets
 * captured at the moment someone actually knows why.
 */
export function PauseEventDialog({ open, onOpenChange }: PauseEventDialogProps) {
  const [reason, setReason] = useState("");
  const { mutate, isPending, error } = usePauseEvent();

  function handleConfirm() {
    mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause the event?</DialogTitle>
          <DialogDescription>
            Every player is locked out of gameplay immediately. This does
            not affect the leaderboard or existing solves.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="pause-reason">Reason (optional, shown to players)</Label>
          <Textarea
            id="pause-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Investigating a scoring anomaly on Chapter 2"
            rows={3}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Pausing…" : "Pause event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { EventOperationalMode } from "@/app/generated/prisma/enums";
import { useEventControl } from "@/modules/admin/hooks/event-control/use-event-control";
import { useResumeEvent } from "@/modules/admin/hooks/event-control/use-resume-event";
import { useToggleRegistration } from "@/modules/admin/hooks/event-control/use-toggle-registration";
import { PauseEventDialog } from "./pause-event-dialog";

/**
 * The primary control surface for the platform's single Event
 * singleton. Two independent controls, matching EventControlService's
 * own orthogonal design (mode vs. registrationEnabled) — pausing
 * gameplay does not imply closing registration, and vice versa.
 */
export function EventControlCard() {
  const { data, isLoading, isError } = useEventControl();
  const resumeEvent = useResumeEvent();
  const toggleRegistration = useToggleRegistration();
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="ops-card">
        <div className="ops-card-header">
          <span className="ops-card-title">Event Control</span>
        </div>
        <div className="ops-card-body space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="ops-card">
        <div className="ops-card-header">
          <span className="ops-card-title">Event Control</span>
        </div>
        <div className="ops-card-body">
          <p className="text-sm text-destructive">
            Could not load event control state.
          </p>
        </div>
      </div>
    );
  }

  const isPaused = data.mode === EventOperationalMode.PAUSED;

  return (
    <div className="ops-card">
      <div className="ops-card-header">
        <span className="ops-card-title">Event Control</span>
        <span className="ops-badge" data-tone={isPaused ? "warn" : "live"}>
          {isPaused ? "Paused" : "Live"}
        </span>
      </div>

      <div className="ops-card-body space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Gameplay</p>
            <p className="text-xs text-[var(--ops-text-dim)]">
              {isPaused
                ? data.pauseReason
                  ? `Paused: ${data.pauseReason}`
                  : "Paused — players are locked out."
                : "Players can submit flags and progress the story."}
            </p>
          </div>
          {isPaused ? (
            <Button
              size="sm"
              onClick={() => resumeEvent.mutate()}
              disabled={resumeEvent.isPending}
            >
              {resumeEvent.isPending ? "Resuming…" : "Resume event"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setPauseDialogOpen(true)}
            >
              Pause event
            </Button>
          )}
        </div>

        {resumeEvent.error ? (
          <p className="text-sm text-destructive">{resumeEvent.error.message}</p>
        ) : null}

        <hr className="ops-divider" />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="registration-toggle" className="text-sm font-medium">
              Registration
            </Label>
            <p className="text-xs text-[var(--ops-text-dim)]">
              {data.registrationEnabled
                ? "New players can currently sign up."
                : "New sign-ups are currently blocked."}
            </p>
          </div>
          <Switch
            id="registration-toggle"
            checked={data.registrationEnabled}
            disabled={toggleRegistration.isPending}
            onCheckedChange={(checked) => toggleRegistration.mutate(checked)}
          />
        </div>

        {toggleRegistration.error ? (
          <p className="text-sm text-destructive">
            {toggleRegistration.error.message}
          </p>
        ) : null}
      </div>

      <PauseEventDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen} />
    </div>
  );
}

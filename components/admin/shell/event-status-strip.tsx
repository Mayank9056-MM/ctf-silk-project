"use client";

import { EventOperationalMode } from "@/app/generated/prisma/enums";
import { useEventControl } from "@/modules/admin/hooks/event-control/use-event-control";

/**
 * The one thing every admin needs visible no matter which page they're
 * on during a live event: is gameplay running right now. Pinned in the
 * topbar rather than living only on the Overview page — an admin
 * triaging a player-ban report on /admin/players should never have to
 * navigate away to check whether the event is paused.
 *
 * Deliberately reads directly from useEventControl() rather than
 * receiving props — this is the signature element the whole shell is
 * built around, so it owns its own data rather than depending on
 * whichever page happens to be mounted.
 */
export function EventStatusStrip() {
  const { data, isLoading, isError } = useEventControl();

  if (isLoading) {
    return (
      <div className="ops-status-strip">
        <div className="ops-status-item">
          <span className="ops-dot" />
          Loading event state…
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="ops-status-strip">
        <div className="ops-status-item">
          <span className="ops-dot" data-tone="critical" />
          <strong>EVENT STATE UNAVAILABLE</strong>
        </div>
      </div>
    );
  }

  const isPaused = data.mode === EventOperationalMode.PAUSED;

  return (
    <div className="ops-status-strip">
      <div className="ops-status-item">
        <span className="ops-dot" data-tone={isPaused ? "warn" : "live"} />
        <strong>{isPaused ? "PAUSED" : "LIVE"}</strong>
      </div>

      <div className="ops-status-item">
        <span
          className="ops-dot"
          data-tone={data.registrationEnabled ? "ok" : "neutral"}
        />
        Registration {data.registrationEnabled ? "open" : "closed"}
      </div>

      {isPaused && data.pauseReason ? (
        <div className="ops-status-item">
          <span className="ops-dot" data-tone="warn" />
          {data.pauseReason}
        </div>
      ) : null}
    </div>
  );
}

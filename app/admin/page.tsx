import { EventControlCard } from "@/components/admin/event-control/event-control-card";
import { OverviewStats } from "@/components/admin/overview/overview-stats";


export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="ops-page-header">
        <div>
          <h1 className="ops-page-title">Overview</h1>
          <p className="ops-page-subtitle">
            Live operational status for the current event.
          </p>
        </div>
      </div>

      <OverviewStats />

      <div className="grid gap-4 lg:grid-cols-2">
        <EventControlCard />
      </div>
    </div>
  );
}

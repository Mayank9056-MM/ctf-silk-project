import { AnnouncementsPanel } from "@/components/admin/announcements/announcements-panel";

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="ops-page-header">
        <div>
          <h1 className="ops-page-title">Announcements</h1>
          <p className="ops-page-subtitle">
            Broadcast messages to every player on the platform.
          </p>
        </div>
      </div>

      <AnnouncementsPanel />
    </div>
  );
}

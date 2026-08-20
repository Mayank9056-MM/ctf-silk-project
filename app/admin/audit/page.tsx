import { AuditPanel } from "@/components/admin/audit/audit-panel";


export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div className="ops-page-header">
        <div>
          <h1 className="ops-page-title">Audit Log</h1>
          <p className="ops-page-subtitle">
            Every administrative and security-relevant action on the platform.
          </p>
        </div>
      </div>

      <AuditPanel />
    </div>
  );
}

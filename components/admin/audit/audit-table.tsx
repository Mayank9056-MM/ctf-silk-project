import type { AuditListItemDTO } from "@/modules/audit/types/audit.dto";
import { AuditSeverity } from "@/modules/audit/types/audit.enums";
import { OpsEmptyState } from "../shell/ops-empty-state";

interface AuditTableProps {
  items: readonly AuditListItemDTO[];
  onSelect: (id: string) => void;
}

const SEVERITY_TONE: Record<AuditSeverity, "ok" | "warn" | "critical"> = {
  [AuditSeverity.INFO]: "ok",
  [AuditSeverity.WARNING]: "warn",
  [AuditSeverity.CRITICAL]: "critical",
};

export function AuditTable({ items, onSelect }: AuditTableProps) {
  if (items.length === 0) {
    return <OpsEmptyState message="No audit events match these filters." />;
  }

  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Actor</th>
            <th>Resource</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelect(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(item.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View audit event: ${item.action}`}
              className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            >
              <td className="ops-table-mono whitespace-nowrap">
                {new Date(item.occurredAt).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              </td>
              <td>
                <div className="font-medium">{item.action}</div>
                <div className="text-xs text-[var(--ops-text-dim)] max-w-xs truncate">
                  {item.summary}
                </div>
              </td>
              <td className="ops-table-mono">{item.category}</td>
              <td>
                <span className="ops-badge" data-tone={SEVERITY_TONE[item.severity]}>
                  {item.severity}
                </span>
              </td>
              <td className="ops-table-mono">{item.actor.label}</td>
              <td className="ops-table-mono">{item.resource.label}</td>
              <td>
                <span className="ops-badge" data-tone={item.success ? "ok" : "critical"}>
                  {item.success ? "OK" : "Failed"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
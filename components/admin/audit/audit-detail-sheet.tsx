"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuditLogDetail } from "@/modules/audit/hooks/use-audit-log-detail";

interface AuditDetailSheetProps {
  auditId: string | null;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="ops-stat-label">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--ops-text-faint)]">—</span>;
  }
  return (
    <pre className="ops-table-mono whitespace-pre-wrap break-all rounded-md border border-[var(--ops-border)] bg-[var(--ops-bg-elevated)] p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AuditDetailSheet({ auditId, onOpenChange }: AuditDetailSheetProps) {
  const { data, isLoading, isError, error } = useAuditLogDetail(auditId ?? undefined);

  return (
    <Sheet open={auditId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit event detail</SheetTitle>
          <SheetDescription>{auditId}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : isError || !data ? (
            <p className="text-sm text-destructive">
              {error?.message ?? "Failed to load this event."}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Occurred">
                  {new Date(data.occurredAt).toLocaleString()}
                </Field>
                <Field label="Outcome">
                  <span className="ops-badge" data-tone={data.success ? "ok" : "critical"}>
                    {data.success ? "Succeeded" : "Failed"}
                  </span>
                </Field>
                <Field label="Action">{data.action}</Field>
                <Field label="Category">{data.category}</Field>
                <Field label="Severity">{data.severity}</Field>
                <Field label="Actor">
                  {data.actor.label}{" "}
                  <span className="text-[var(--ops-text-faint)]">({data.actor.type})</span>
                </Field>
                <Field label="Resource">
                  {data.resource.label}{" "}
                  <span className="text-[var(--ops-text-faint)]">({data.resource.type})</span>
                </Field>
                <Field label="Request ID">{data.requestId ?? "—"}</Field>
                <Field label="IP address">{data.ipAddress ?? "—"}</Field>
                <Field label="User agent">{data.userAgent ?? "—"}</Field>
              </div>

              <div>
                <div className="ops-stat-label mb-1">Summary</div>
                <p className="text-sm">{data.summary}</p>
              </div>

              {data.reason ? (
                <div>
                  <div className="ops-stat-label mb-1">Reason</div>
                  <p className="text-sm">{data.reason}</p>
                </div>
              ) : null}

              <div>
                <div className="ops-stat-label mb-1">Before</div>
                <JsonBlock value={data.before} />
              </div>
              <div>
                <div className="ops-stat-label mb-1">After</div>
                <JsonBlock value={data.after} />
              </div>
              <div>
                <div className="ops-stat-label mb-1">Metadata</div>
                <JsonBlock value={data.metadata} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

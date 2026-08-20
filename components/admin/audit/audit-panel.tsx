"use client";

import { useEffect, useState } from "react";

import { useAuditLog } from "@/modules/audit/hooks/use-audit-log";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { AuditFiltersBar, type AuditFilterState } from "./audit-filters-bar";
import { AuditTable } from "./audit-table";
import { AuditDetailSheet } from "./audit-detail-sheet";
import { PaginationFooter } from "@/components/admin/shell/pagination-footer";
import { OpsTableSkeleton } from "@/components/admin/shell/ops-table-skeleton";
import { OpsErrorState } from "@/components/admin/shell/ops-error-state";

const PAGE_SIZE = 25;

const EMPTY_FILTERS: AuditFilterState = {
  searchText: "",
  category: "ALL",
  severity: "ALL",
  success: "ALL",
};

export function AuditPanel() {
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.searchText);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.category, filters.severity, filters.success]);

  const { data, isLoading, isError, error, refetch } = useAuditLog({
    filters: {
      searchText: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
      categories: filters.category === "ALL" ? undefined : [filters.category],
      severities: filters.severity === "ALL" ? undefined : [filters.severity],
      success: filters.success === "ALL" ? undefined : filters.success === "true",
    },
    pagination: { page, pageSize: PAGE_SIZE },
    sort: {},
  });

  return (
    <div className="ops-card">
      <div className="ops-card-header">
        <span className="ops-card-title">Audit Log</span>
      </div>
      <div className="ops-card-body space-y-4">
        <AuditFiltersBar value={filters} onChange={setFilters} />

        {isLoading ? (
          <OpsTableSkeleton rows={8} rowHeight="h-9" />
        ) : isError || !data ? (
          <OpsErrorState
            message={error?.message ?? "Failed to load the audit log."}
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <AuditTable items={data.items} onSelect={setSelectedId} />
            <PaginationFooter
              page={data.pagination.page}
              pageSize={data.pagination.pageSize}
              totalCount={data.pagination.totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AuditDetailSheet
        auditId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
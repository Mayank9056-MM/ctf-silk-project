"use client";

import { useEffect, useState } from "react";

import { UserStatus } from "@/app/generated/prisma/enums";
import { usePlayers } from "@/modules/admin/hooks/player-management/use-players";
import { PLAYER_MANAGEMENT_PAGINATION } from "@/modules/admin/constants/player-management.constants";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { PlayersToolbar } from "./players-toolbar";
import { PaginationFooter } from "../shell/pagination-footer";
import { PlayersTable } from "./players-table";
import { OpsTableSkeleton } from "../shell/ops-table-skeleton";
import { OpsErrorState } from "../shell/ops-error-state";

const PAGE_SIZE = PLAYER_MANAGEMENT_PAGINATION.DEFAULT_PAGE_SIZE;

export function PlayersPanel() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const { data, isLoading, isError, error, refetch } = usePlayers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
  });

  return (
    <div className="ops-card">
      <div className="ops-card-header">
        <span className="ops-card-title">Players</span>
      </div>
      <div className="ops-card-body space-y-4">
        <PlayersToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          status={status}
          onStatusChange={setStatus}
        />

        {isLoading ? (
          <OpsTableSkeleton />
        ) : isError || !data ? (
          <OpsErrorState message={error?.message ?? "Failed to load players."} onRetry={() => refetch()} />
        ) : (
          <>
            <PlayersTable players={data.players} />
            <PaginationFooter
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
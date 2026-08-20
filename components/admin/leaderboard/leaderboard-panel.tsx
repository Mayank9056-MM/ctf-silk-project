"use client";

import { useState } from "react";

import { LEADERBOARD_CONSTANTS } from "@/modules/leaderboard/constants/leaderboard.constants";
import { FreezeToggle } from "./freeze-toggle";
import { useAdminLeaderboard } from "@/modules/leaderboard/hooks/use-admin-leaderboard";
import { LeaderboardTable } from "./leaderboard-table";
import { PaginationFooter } from "../shell/pagination-footer";
import { OpsTableSkeleton } from "../shell/ops-table-skeleton";
import { OpsErrorState } from "../shell/ops-error-state";

const PAGE_SIZE = LEADERBOARD_CONSTANTS.DEFAULT_PAGE_SIZE;

export function LeaderboardPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useAdminLeaderboard(page, PAGE_SIZE);

  return (
    <div className="ops-card">
      <div className="ops-card-header">
        <span className="ops-card-title">Leaderboard</span>
        {data ? <FreezeToggle frozenAt={data.leaderboardFrozenAt} /> : null}
      </div>
      <div className="ops-card-body space-y-4">
        {isLoading ? (
          <OpsTableSkeleton />
        ) : isError || !data ? (
          <OpsErrorState
            message={error?.message ?? "Failed to load the leaderboard."}
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <LeaderboardTable rows={data.rows} />
            <PaginationFooter
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
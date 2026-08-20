"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ANNOUNCEMENT_PAGINATION } from "@/modules/announcement/constants/announcement.constants";
import { useAnnouncements } from "@/modules/announcement/hooks/use-announcements";
import { AnnouncementDialog } from "./announcement-dialog";
import { AnnouncementsTable } from "./announcements-table";
import { PaginationFooter } from "../shell/pagination-footer";

const PAGE_SIZE = ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE;

/**
 * Reads through useAnnouncements() — the PUBLIC list hook — because no
 * admin-scoped equivalent exists in this module (see
 * announcement.service.ts: getAnnouncements() is unauthenticated by
 * design, and the only admin-gated read is getAnnouncementForAdmin, a
 * single-item lookup, not a list). Practical effect: this panel shows
 * exactly what players currently see, filtered to PUBLISHED — an
 * admin cannot browse already-archived announcements here. If that's
 * needed, it's a new getAnnouncementsForAdmin action/service method,
 * not something this panel can safely fabricate client-side.
 */
export function AnnouncementsPanel() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, error } = useAnnouncements(page, PAGE_SIZE);

  return (
    <div className="ops-card">
      <div className="ops-card-header">
        <span className="ops-card-title">Announcements</span>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New announcement
        </Button>
      </div>
      <div className="ops-card-body space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-destructive">
            {error?.message ?? "Failed to load announcements."}
          </p>
        ) : (
          <>
            <AnnouncementsTable announcements={data.announcements} />
            <PaginationFooter
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AnnouncementDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

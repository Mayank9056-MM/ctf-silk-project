"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "@/components/dashboard/dashboard-theme";
import { srButtonGhost } from "@/components/dashboard/dashboard-button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";

interface LeaderboardPagerProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pageWindow(current: number, total: number): number[] {
  const span = 2;
  const start = Math.max(1, current - span);
  const end = Math.min(total, current + span);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

/**
 * Uses only the structural (nav/ul/li) shadcn pagination primitives —
 * NOT PaginationLink, which is anchor-based and implies real navigation.
 * Pagination here is internal component state, not a URL, so plain
 * <button> elements are the correct semantic (an <a> with no real href
 * is an accessibility anti-pattern).
 */
export function LeaderboardPager({ page, totalPages, onPageChange }: LeaderboardPagerProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <Pagination>
      <PaginationContent className="gap-1.5">
        <PaginationItem>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              srButtonGhost,
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </PaginationItem>

        {pages[0] > 1 && <span className={cn("px-1 text-[11px]", dashboardTheme.text.muted, dashboardTheme.font.mono)}>…</span>}

        {pages.map((p) => (
          <PaginationItem key={p}>
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md text-[11px] font-medium tabular-nums transition-colors",
                dashboardTheme.font.mono,
                p === page
                  ? cn("border", dashboardTheme.border.strong, dashboardTheme.text.primary, dashboardTheme.background.surfaceStrong)
                  : srButtonGhost,
              )}
            >
              {p}
            </button>
          </PaginationItem>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <span className={cn("px-1 text-[11px]", dashboardTheme.text.muted, dashboardTheme.font.mono)}>…</span>
        )}

        <PaginationItem>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              srButtonGhost,
            )}
            aria-label="Next page"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
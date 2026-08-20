"use client";

import { useState } from "react";
import { Pencil, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { AnnouncementPriority, ContentStatus } from "@/app/generated/prisma/enums";
import type { AnnouncementDTO } from "@/modules/announcement/types/announcement.dto";
import { useArchiveAnnouncement } from "@/modules/announcement/hooks/use-archive-announcement";
import { AnnouncementDialog } from "./announcement-dialog";

interface AnnouncementsTableProps {
  announcements: readonly AnnouncementDTO[];
}

const PRIORITY_TONE: Record<AnnouncementPriority, "neutral" | "warn" | "critical"> = {
  [AnnouncementPriority.NORMAL]: "neutral",
  [AnnouncementPriority.IMPORTANT]: "warn",
  [AnnouncementPriority.CRITICAL]: "critical",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AnnouncementsTable({ announcements }: AnnouncementsTableProps) {
  const [editing, setEditing] = useState<AnnouncementDTO | null>(null);
  const [archiving, setArchiving] = useState<AnnouncementDTO | null>(null);
  const archiveAnnouncement = useArchiveAnnouncement();

  if (announcements.length === 0) {
    return <div className="ops-empty">No published announcements.</div>;
  }

  return (
    <>
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-[var(--ops-text-dim)] max-w-md truncate">
                    {a.message}
                  </div>
                </td>
                <td>
                  <span className="ops-badge" data-tone={PRIORITY_TONE[a.priority]}>
                    {a.priority}
                  </span>
                </td>
                <td>
                  <span
                    className="ops-badge"
                    data-tone={a.status === ContentStatus.ARCHIVED ? "neutral" : "ok"}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="ops-table-mono">{formatDate(a.createdAt)}</td>
                <td className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(a)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setArchiving(a)}>
                    <Archive className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnnouncementDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        announcement={editing}
      />

      <AlertDialog open={archiving !== null} onOpenChange={(o) => !o && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive &ldquo;{archiving?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived announcements are removed from the player-facing feed
              immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiveAnnouncement.error ? (
            <p className="text-sm text-destructive">
              {archiveAnnouncement.error.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveAnnouncement.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveAnnouncement.isPending}
              onClick={() =>
                archiving &&
                archiveAnnouncement.mutate(
                  { id: archiving.id },
                  { onSuccess: () => setArchiving(null) },
                )
              }
            >
              {archiveAnnouncement.isPending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

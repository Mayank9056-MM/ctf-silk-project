"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AnnouncementPriority } from "@/app/generated/prisma/enums";
import { ANNOUNCEMENT_LIMITS } from "@/modules/announcement/constants/announcement.constants";
import type { AnnouncementDTO } from "@/modules/announcement/types/announcement.dto";
import { useCreateAnnouncement } from "@/modules/announcement/hooks/use-create-announcement";
import { useUpdateAnnouncement } from "@/modules/announcement/hooks/use-update-announcement";

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Present when editing; null/undefined when creating. Typed against
   * the PUBLIC AnnouncementDTO (no author) rather than
   * AnnouncementAdminDTO — see announcements-panel.tsx's own note on
   * why: no admin-scoped LIST action exists for this module, only
   * getAnnouncementForAdmin (a single-item read), so the table this
   * dialog is opened from only ever has AnnouncementDTO rows to hand it.
   */
  announcement?: Pick<
    AnnouncementDTO,
    "id" | "title" | "message" | "priority"
  > | null;
}

type AnnouncementFormState = {
  title: string;
  message: string;
  priority: AnnouncementPriority;
};

const EMPTY: AnnouncementFormState = {
  title: "",
  message: "",
  priority: AnnouncementPriority.NORMAL,
};

export function AnnouncementDialog({
  open,
  onOpenChange,
  announcement,
}: AnnouncementDialogProps) {
  const isEditing = Boolean(announcement);
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY);

  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();

  const mutation = isEditing ? updateAnnouncement : createAnnouncement;

  useEffect(() => {
    if (open) {
      setForm(
        announcement
          ? {
              title: announcement.title,
              message: announcement.message,
              priority: announcement.priority,
            }
          : EMPTY,
      );
    }
  }, [open, announcement]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isEditing && announcement) {
      updateAnnouncement.mutate(
        { id: announcement.id, ...form },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createAnnouncement.mutate(form, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit announcement" : "New announcement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={form.title}
              maxLength={ANNOUNCEMENT_LIMITS.TITLE_MAX_LENGTH}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ann-message">Message</Label>
            <Textarea
              id="ann-message"
              value={form.message}
              maxLength={ANNOUNCEMENT_LIMITS.MESSAGE_MAX_LENGTH}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              rows={5}
              required
            />
            <p className="text-xs text-[var(--ops-text-faint)] text-right">
              {form.message.length}/{ANNOUNCEMENT_LIMITS.MESSAGE_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, priority: v as AnnouncementPriority }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AnnouncementPriority.NORMAL}>
                  Normal
                </SelectItem>
                <SelectItem value={AnnouncementPriority.IMPORTANT}>
                  Important
                </SelectItem>
                <SelectItem value={AnnouncementPriority.CRITICAL}>
                  Critical
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mutation.error ? (
            <p className="text-sm text-destructive">{mutation.error.message}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Publish announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

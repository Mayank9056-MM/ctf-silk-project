export const announcementKeys = {
  all: ["announcements"] as const,

  lists: () => [...announcementKeys.all, "list"] as const,

  list: (page: number, pageSize: number) =>
    [...announcementKeys.lists(), page, pageSize] as const,

  details: () => [...announcementKeys.all, "detail"] as const,

  detail: (id: string) => [...announcementKeys.details(), id] as const,
} as const;

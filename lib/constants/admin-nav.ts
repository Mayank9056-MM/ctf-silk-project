/**
 * Single source of truth for admin sidebar links — matching this project's
 * own established pattern of centralizing anything that would otherwise
 * be repeated across a nav component and a route guard (see
 * DEFAULT_CASE_ID / PLATFORM_NAME's own header comments for the same
 * reasoning). Adding a new admin section is one entry here, not a hunt
 * through the sidebar component.
 */
export interface AdminNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: "gauge" | "shield-alert" | "users" | "megaphone" | "scroll" | "trophy";
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: "gauge" },
  { href: "/admin/players", label: "Players", icon: "users" },
  { href: "/admin/announcements", label: "Announcements", icon: "megaphone" },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: "trophy" },
  { href: "/admin/audit", label: "Audit Log", icon: "scroll" },
] as const;

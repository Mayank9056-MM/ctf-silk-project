"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  ShieldAlert,
  Users,
  Megaphone,
  ScrollText,
  Trophy,
} from "lucide-react";

import { PLATFORM_NAME } from "@/lib/constants/brand";
import { ADMIN_NAV_ITEMS, AdminNavItem } from "@/lib/constants/admin-nav";

const ICONS: Record<AdminNavItem["icon"], React.ComponentType<{ className?: string }>> = {
  gauge: Gauge,
  "shield-alert": ShieldAlert,
  users: Users,
  megaphone: Megaphone,
  scroll: ScrollText,
  trophy: Trophy,
};

/**
 * Exact-match highlighting for "/admin" (Overview would otherwise stay
 * lit on every nested route), prefix-match for every other section so
 * e.g. /admin/players and a future /admin/players/[id] both highlight
 * "Players".
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="ops-sidebar">
      <div className="ops-brand">
        <div className="ops-brand-title">{PLATFORM_NAME}</div>
        <div className="ops-brand-subtitle">ADMIN CONSOLE</div>
      </div>

      <nav className="ops-nav">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="ops-nav-link"
              data-active={active}
            >
              <Icon className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

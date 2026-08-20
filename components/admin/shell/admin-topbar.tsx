import { LogOut } from "lucide-react";
import Link from "next/link";
import { EventStatusStrip } from "./event-status-strip";



interface AdminTopbarProps {
  adminName: string;
}

export function AdminTopbar({ adminName }: AdminTopbarProps) {
  return (
    <header className="ops-topbar">
      <EventStatusStrip />

      <div className="flex items-center gap-4">
        <span className="ops-status-item">
          <strong>{adminName}</strong>
        </span>
        <Link
          href="/dashboard"
          className="ops-status-item hover:text-[var(--ops-text)] transition-colors"
          title="Exit to player dashboard"
        >
          <LogOut className="size-3.5" />
          Exit console
        </Link>
      </div>
    </header>
  );
}

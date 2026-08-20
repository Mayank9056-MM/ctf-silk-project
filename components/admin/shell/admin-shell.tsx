import "@/app/globals.css";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { OpsPortalRoot } from "./ops-portal-root";

interface AdminShellProps {
  adminName: string;
  children: React.ReactNode;
}

/**
 * The visual shell every /admin/* page renders inside. Deliberately a
 * plain Server Component wrapper — AdminSidebar/EventStatusStrip are
 * the only parts that need client interactivity (usePathname, TanStack
 * Query), so the shell itself stays server-rendered.
 *
 * .ops-root is now rendered by OpsPortalRoot (a thin client component)
 * instead of a plain <div> here — see that file's doc comment. Reason:
 * Select/Dialog/AlertDialog all portal their popup content to
 * document.body by default, which sits OUTSIDE .ops-root's DOM
 * subtree, so .ops-root's dark-mode CSS variable overrides never
 * reached them. OpsPortalRoot hands those portals a real container
 * node living inside .ops-root, fixing that without touching anything
 * outside /admin.
 */
export function AdminShell({ adminName, children }: AdminShellProps) {
  return (
    <OpsPortalRoot>
      <div className="ops-shell">
        <AdminSidebar />
        <AdminTopbar adminName={adminName} />
        <main className="ops-main">{children}</main>
      </div>
    </OpsPortalRoot>
  );
}
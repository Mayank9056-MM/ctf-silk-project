import { Skeleton } from "@/components/ui/skeleton";

/** Preserves the real layout's shape (per spec section 20) rather than a centered spinner — header/status/hero/intel/side-column proportions match dashboard-screen.tsx's actual grid. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );
}
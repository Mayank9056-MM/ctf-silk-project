import { Skeleton } from "@/components/ui/skeleton";

/** Replaces the `Array.from({ length: N }).map(...)` skeleton block duplicated in every panel — one call site, one row height convention. */
export function OpsTableSkeleton({ rows = 6, rowHeight = "h-10" }: { rows?: number; rowHeight?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`${rowHeight} w-full`} />
      ))}
    </div>
  );
}
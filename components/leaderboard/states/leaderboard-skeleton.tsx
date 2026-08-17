import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
      <Skeleton className="h-[420px] w-full rounded-lg" />
    </div>
  );
}
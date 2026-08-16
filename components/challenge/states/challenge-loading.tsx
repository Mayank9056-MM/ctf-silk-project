// components/challenge/states/challenge-loading.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { Skeleton } from "@/components/ui/skeleton";

/** Preserves ChallengeScreen's real layout shape (header/metadata/objective/
 * attachments/flag-form), same convention as DashboardSkeleton, rather than
 * a centered spinner. */
export function ChallengeLoading() {
  return (
    <div className={cn("min-h-dvh", storyTheme.background.void)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}
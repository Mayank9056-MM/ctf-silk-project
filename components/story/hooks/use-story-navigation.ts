// components/story/hooks/use-story-navigation.ts
"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { storyKeys } from "@/modules/story/constants/story.keys";

const STORY_ROUTE = "/story";

/**
 * The single canonical way any part of the app returns the player to
 * Story and picks up their authoritative current state. Deliberately
 * accepts NO destination — no sceneId, chapterId, or nextSceneId
 * parameter of any kind. There is exactly one Story route; the server
 * (via getCurrentScene, through useStory()) decides what renders there
 * on the next mount. A caller passing in a "next scene" would defeat
 * the entire point of this hook existing.
 *
 * CHANGED: now awaits a forced refetch (via `refetchQueries` with
 * `type: "all"`) BEFORE navigating, instead of firing invalidateQueries
 * and immediately calling router.push. invalidateQueries only refetches
 * queries that currently have an ACTIVE OBSERVER — at the moment this
 * runs, the Story route hasn't mounted yet, so storyKeys.currentScene
 * has no observer, and invalidation alone just flags it stale without
 * forcing a fetch. StoryScreen only guards on `isLoading` (not
 * `isFetching`), so it was rendering straight from the STALE cache the
 * instant it mounted — the old CHALLENGE_GATE scene — while the real
 * refetch happened in the background. A player clicking the resulting
 * (stale) "Proceed to Challenge" CTA before that background fetch
 * resolved would re-enter a challenge the server had already moved
 * past. `refetchQueries({ ..., type: "all" })` — unlike the default
 * `type: "active"` — refetches the query in the cache regardless of
 * whether anything currently observes it, and its returned promise
 * only resolves once that fetch completes. Awaiting it before
 * router.push means the cache already holds fresh data by the time
 * StoryScreen mounts, so there's no stale-first-render window at all.
 *
 * Both currentScene and progress are refetched — currentScene because
 * that's literally what determines what StoryScreen renders next, and
 * progress because completedSceneCount (used by ProgressIndicator in
 * StoryNavigation) can change independently of which scene is current.
 */
export function useStoryNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function continueInvestigation() {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: storyKeys.currentScene, type: "all" }),
      queryClient.refetchQueries({ queryKey: storyKeys.progress, type: "all" }),
    ]);
    router.push(STORY_ROUTE);
  }

  return { continueInvestigation };
}
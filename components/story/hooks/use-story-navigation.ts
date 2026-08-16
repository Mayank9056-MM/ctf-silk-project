// modules/story/hooks/use-story-navigation.ts
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
 * invalidateQueries (not setQueryData) is deliberate — this hook has no
 * server response to seed the cache with; it only knows "the player's
 * story-relevant state may have changed," so it marks the relevant
 * story query keys stale and lets useStory() (via useCurrentScene)
 * refetch fresh on the next render of StoryScreen. Same pattern
 * useSubmitFlag already uses for challengeKeys.all.
 *
 * Both currentScene and progress are invalidated — currentScene because
 * that's literally what determines what StoryScreen renders next, and
 * progress because completedSceneCount (used by ProgressIndicator in
 * StoryNavigation) can change independently of which scene is current.
 */
export function useStoryNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  function continueInvestigation() {
    queryClient.invalidateQueries({ queryKey: storyKeys.currentScene });
    queryClient.invalidateQueries({ queryKey: storyKeys.progress });
    router.push(STORY_ROUTE);
  }

  return { continueInvestigation };
}
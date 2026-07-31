import { useMutation, useQueryClient } from "@tanstack/react-query";

import { selectChoice } from "../actions/select-choice";
import { storyKeys } from "../constants/story.keys";

interface SelectChoiceVariables {
  currentSceneId: string;
  choiceId: string;
}

/**
 * Mirrors useAdvanceScene exactly, for the reason flagged last turn:
 * selectChoice returns the identical StoryStateDTO shape, for the
 * identical reason (it's the same underlying transition, just reached
 * via a Choice instead of linear order) — same no-optimistic-update
 * stance, same setQueryData-plus-dual-invalidation on success.
 */
export function useSelectChoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ currentSceneId, choiceId }: SelectChoiceVariables) => {
      const result = await selectChoice(currentSceneId, choiceId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(storyKeys.currentScene, data);
      queryClient.invalidateQueries({ queryKey: storyKeys.chapterMap });
      queryClient.invalidateQueries({ queryKey: storyKeys.progress });
    },
  });
}
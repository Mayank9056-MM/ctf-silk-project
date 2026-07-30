/**
 * Shared vocabulary of "things that happened in the story" — deliberately
 * serving two purposes with one registry rather than two separate ones,
 * since they're fundamentally the same set of facts:
 *
 *   1. Event names for the client-side story/dialogue state machine —
 *      the earlier frontend library doctrine specifically recommended
 *      xState for this exact system. These constants are the vocabulary
 *      that machine's dispatched events would use (SCENE_ADVANCED,
 *      CHOICE_SELECTED, etc.), so client and server never drift into
 *      inventing two different names for the same transition.
 *   2. Structured tags for server-side logging/analytics — the domain
 *      design doc's Analytics section already noted that
 *      SceneCompletion/ChoiceSelection timestamps double as a completion
 *      funnel with zero extra tracking; these constants are what a
 *      future structured-log call would tag each row with, instead of
 *      ad hoc strings scattered across service methods.
 *
 * NOT yet wired into any service method — this file defines the
 * vocabulary; nothing in story-navigation.service.ts currently emits
 * these. Wiring one in is as small as a console.log/structured-log call
 * right after each transition's transaction commits inside
 * applyTransition — not done here since "add logging" wasn't asked for,
 * and inventing the call sites speculatively would be exactly the kind
 * of placeholder code this build has consistently avoided.
 */
export const STORY_EVENTS = {
  SCENE_ADVANCED: "story.scene_advanced",
  CHOICE_SELECTED: "story.choice_selected",
  CHAPTER_COMPLETED: "story.chapter_completed",
  STORY_COMPLETED: "story.story_completed",
  STORY_RESTARTED: "story.story_restarted",
} as const;

export type StoryEventName = (typeof STORY_EVENTS)[keyof typeof STORY_EVENTS];
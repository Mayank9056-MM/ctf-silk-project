import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

/** Renders when data resolved successfully but there is genuinely nothing to show — e.g. a chapter map with zero published chapters. Distinct from story-error (a failure) and story-loading (in flight). */
export function StoryEmpty({ message }: { message: string }) {
  return (
    <p
      className={cn(
        "py-10 text-center text-[12px] italic",
        storyTheme.text.muted,
        storyTheme.font.body,
      )}
    >
      {message}
    </p>
  );
}

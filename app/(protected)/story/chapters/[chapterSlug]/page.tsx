// app/(protected)/story/chapters/[chapterSlug]/page.tsx
import { StoryScreen } from "@/components/story/story-screen";

/**
 * The [chapterSlug] param is NOT used to fetch anything — per the
 * architecture's own rule, "the URL must not become the source of truth
 * for progression." getCurrentScene() always returns the player's real
 * position regardless of what chapter slug sits in the address bar, so
 * this route renders the identical StoryScreen as /story. Its only
 * purpose is giving a chapter-scoped URL for bookmarking/sharing/browser
 * history — cosmetic, never authoritative.
 *
 * FLAG: I don't have this route's original page.tsx, so I can't confirm
 * this is actually what it's meant to do (vs. e.g. rendering a
 * chapter-map deep-link into ChapterMapOverlay). Worth a quick check
 * against whatever this page currently does before replacing it.
 */
export default function ChapterPage() {
  return <StoryScreen />;
}
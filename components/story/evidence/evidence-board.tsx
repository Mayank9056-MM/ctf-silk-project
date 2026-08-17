import { EvidenceBoardHeader } from "./evidence-board-header";
import { EvidenceCard } from "./evidence-card";
import type { EvidenceBoardDTO } from "@/modules/story/types/evidence.dto";

/**
 * LOCKED items are filtered out entirely, not rendered as "classified"
 * placeholders — per this request, the board shows only what the player
 * has actually gotten from the story, not a hinted-at count of what
 * still exists. This is a real product change from the previous
 * version, which showed locked folders as a teaser; if you want that
 * teaser back later, it's re-adding the `EvidenceCardLocked` branch,
 * not a rewrite.
 *
 * `recovered`/`total` are now both computed against the SAME filtered
 * (unlocked-only) set, not against `board.items.length` — the header's
 * "X / Y Recovered" no longer counts hidden locked items in the
 * denominator, since a player has no way to know that denominator
 * exists anymore now that locked items aren't shown at all.
 */
export function EvidenceBoard({ board }: { board: EvidenceBoardDTO }) {
  const visibleItems = board.items.filter(
    (item): item is Extract<typeof item, { state: "AVAILABLE" | "DISCOVERED" }> =>
      item.state === "AVAILABLE" || item.state === "DISCOVERED",
  );
  const recovered = visibleItems.filter((i) => i.state === "DISCOVERED").length;

  return (
    <div className="sr-corkboard relative min-h-dvh px-10 py-12">
      <div className="sr-corkboard-strings" aria-hidden="true" />
      <div className="relative z-[1] mx-auto max-w-6xl">
        <EvidenceBoardHeader chapter={board.chapter} recovered={recovered} total={visibleItems.length} />
        {visibleItems.length === 0 ? (
          <p className="py-16 text-center text-[12px] italic text-(--sr-text-muted)">
            No evidence recovered for this chapter yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
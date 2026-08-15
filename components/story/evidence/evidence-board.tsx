import { EvidenceBoardHeader } from "./evidence-board-header";
import { EvidenceCard } from "./evidence-card";
import { EvidenceCardLocked } from "./evidence-card-locked";
import type { EvidenceBoardDTO } from "@/modules/story/types/evidence.dto";

/**
 * Recovered/total definitions deliberately match the dashboard's
 * EvidenceStat exactly (recovered = DISCOVERED count, total = full item
 * count) — one consistent meaning for "recovered" across the app, not a
 * page-local redefinition.
 */
export function EvidenceBoard({ board }: { board: EvidenceBoardDTO }) {
  const recovered = board.items.filter((i) => i.state === "DISCOVERED").length;

  return (
    <div className="sr-corkboard relative min-h-dvh px-10 py-12">
      <div className="sr-corkboard-strings" aria-hidden="true" />
      <div className="relative z-[1] mx-auto max-w-6xl">
        <EvidenceBoardHeader chapter={board.chapter} recovered={recovered} total={board.items.length} />
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {board.items.map((item) =>
            item.state === "LOCKED" ? (
              <EvidenceCardLocked key={item.id} id={item.id} />
            ) : (
              <EvidenceCard key={item.id} item={item} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
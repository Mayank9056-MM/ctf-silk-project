
import { cn } from "@/lib/utils";

import { SceneKicker } from "../scene/scene-kicker";
import type { EvidencePreviewDTO } from "@/modules/story/types/evidence.dto";
import { EvidenceUnlockAnimation } from "../evidence/evidence-unlock-animation";
import { EvidencePreview } from "../evidence/evidence-preview";
import { EvidenceCta } from "../evidence/evidence-cta";

interface EvidenceRevealProps {
  evidence: EvidencePreviewDTO;
  onContinue: () => void;
}

/** Never renders more than EvidencePreviewDTO provides — title + type-icon only, per spec's explicit "the preview DTO is intentionally limited, respect that." Full content is only ever available via the Evidence Board itself. */
export function EvidenceReveal({ evidence, onContinue }: EvidenceRevealProps) {
  return (
    <EvidenceUnlockAnimation>
      <div className="flex flex-col gap-3">
        <SceneKicker>Evidence Recovered</SceneKicker>
        <EvidencePreview evidence={evidence} />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              "rounded-sm bg-(--sr-crimson-hot) px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90",
            )}
          >
            Continue
          </button>
          <EvidenceCta />
        </div>
      </div>
    </EvidenceUnlockAnimation>
  );
}
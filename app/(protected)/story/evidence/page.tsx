"use client";

import { useEvidenceBoard } from "@/modules/story/hooks/use-evidence-board";
import { StoryLoading } from "@/components/story/states/story-loading";
import { StoryError } from "@/components/story/states/story-error";
import { StoryEmpty } from "@/components/story/states/story-empty";
import { EvidenceBoard } from "@/components/story/evidence/evidence-board";
import { EvidenceBoardBackLink } from "@/components/story/navigation/evidence-board-back-link";

export default function EvidenceBoardPage() {
  const { data, isLoading, isError, refetch } = useEvidenceBoard();

  if (isLoading) return <StoryLoading />;
  if (isError || !data) return <StoryError onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="px-10 pt-8">
        <EvidenceBoardBackLink />
      </div>

      {data.items.length === 0 ? (
        <StoryEmpty message="No evidence recovered for this chapter yet." />
      ) : (
        <EvidenceBoard board={data} />
      )}
    </div>
  );
}
"use client";

import { useEvidenceBoard } from "@/modules/story/hooks/use-evidence-board";
import { StoryLoading } from "@/components/story/states/story-loading";
import { StoryError } from "@/components/story/states/story-error";
import { StoryEmpty } from "@/components/story/states/story-empty";
import { EvidenceBoard } from "@/components/story/evidence/evidence-board";

export default function EvidenceBoardPage() {
  const { data, isLoading, isError, refetch } = useEvidenceBoard();

  if (isLoading) return <StoryLoading />;
  if (isError || !data) return <StoryError onRetry={() => refetch()} />;
  if (data.items.length === 0) return <StoryEmpty message="No evidence recovered for this chapter yet." />;

  return <EvidenceBoard board={data} />;
}
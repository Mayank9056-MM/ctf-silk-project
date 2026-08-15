"use client";

// ============================================================================
// components/story/hooks/use-scene-assets.ts
// ============================================================================
//
// Deliberately thin. scene.mapper.ts already resolved
// Scene.metadata.backgroundAssetKey server-side (via
// lib/assets/story-assets.ts) before it ever reaches the client as
// SceneDTO.backgroundUrl — this hook does NOT re-resolve, re-validate, or
// touch any asset key itself.
//
// CORRECTED against evidence.dto.ts: SceneDTO.evidence is an
// EvidencePreviewDTO (id, title, type only) — it does NOT carry
// attachmentUrl. That's not an omission; it mirrors this codebase's
// existing preview/full-detail split (see EvidenceBoardItemDTO's LOCKED
// variant, ChoiceDTO vs AdminChoiceDTO). An EVIDENCE_REVEAL scene tells
// the player evidence exists — the actual attachment image is only
// available via evidenceService.getEvidence()'s full EvidenceDTO, a
// separate fetch, not something scene.mapper.ts can hand over early.
//
// A previous version of this hook assumed
// scene.evidence?.attachmentUrl existed. It doesn't. Removed rather than
// left in as dead/broken code.
// ============================================================================

import type { SceneDTO } from "@/modules/story/types/scene.dto";

interface SceneAssets {
  backgroundUrl: string | null;
  /**
   * True when this scene revealed evidence and a consumer should fetch
   * its full attachment via the evidence module — this hook does not
   * fetch it itself (no data-fetching belongs in an assets hook), it
   * only signals that there's something to go get.
   */
  evidenceId: string | null;
}

export function useSceneAssets(scene: SceneDTO | null | undefined): SceneAssets {
  if (!scene) {
    return { backgroundUrl: null, evidenceId: null };
  }

  return {
    backgroundUrl: scene.backgroundUrl,
    evidenceId: scene.evidence?.id ?? null,
  };
}
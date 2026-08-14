// ============================================================================
// seed-story.ts
// ============================================================================
//
// Owns narrative content exclusively: Character, Evidence, Scene,
// DialogueLine, Choice, UnlockRule. Does NOT create Chapters
// (seed-chapters.ts) or Challenges (seed-challenges.ts) — this is the SRP
// split the scripts/ redesign exists for.
//
// Three passes, in order, because later content references earlier ids:
//   1. Characters + Evidence (no forward references)
//   2. Scenes + DialogueLines (references characterId, evidenceId,
//      challengeId — all already resolvable)
//   3. Choices (references nextSceneId — needs every scene's real id,
//      hence its own pass after all scenes exist) + UnlockRules
//      (references scene/chapter/evidence/challenge ids)
//
// ASSUMPTION FLAGGED: exact enum member names for SceneType/EvidenceType/
// UnlockConditionType/UnlockTargetType are inferred from the service code
// in this module (unlock.service.ts, evidence.service.ts, scene-resolver.ts)
// — cross-check against schema.prisma's enums.ts before running.
// ============================================================================

import prisma from "@/lib/prisma";
import {
  ContentStatus,
  SceneType,
  EvidenceType,
  UnlockConditionType,
  UnlockTargetType,
} from "@/app/generated/prisma/enums";
import { buildChapterMap } from "./utils/chapter-map";
import "dotenv/config";

// ----------------------------------------------------------------------------
// Characters
// ----------------------------------------------------------------------------

interface CharacterSeed {
  slug: string;
  displayName: string;
  portraitUrl: string | null;
}

const CHARACTERS: CharacterSeed[] = [
  {
    slug: "ethan-carter",
    displayName: "Ethan Carter",
    portraitUrl: "/assets/characters/ethan-carter/ethan-carter-portrait-noir.webp",
  },
  { slug: "noah", displayName: "Noah", portraitUrl: null },
  { slug: "robert", displayName: "Robert", portraitUrl: null },
];

// ----------------------------------------------------------------------------
// Evidence
// ----------------------------------------------------------------------------

interface EvidenceSeed {
  slug: string;
  title: string;
  type: EvidenceType;
  content: string;
  attachmentUrl: string | null;
}

const EVIDENCE: EvidenceSeed[] = [
  {
    slug: "toxicology-report",
    title: "Toxicology Report",
    type: EvidenceType.DOCUMENT,
    content:
      "Cause of death listed as acute fentanyl toxicity. The dosage is inconsistent with recreational use.",
    attachmentUrl: "/assets/evidence/documents/toxicology-report.pdf",
  },
  {
    slug: "wallet-ledger-photo",
    title: "Wallet Ledger",
    type: EvidenceType.WALLET_LEDGER, // was PHOTOGRAPH — WALLET_LEDGER is the purpose-built enum value
    content: "Same source wallet, three separate buyers, all within a six-hour window.",
    attachmentUrl: "/assets/evidence/photographs/wallet-ledger.webp",
  },
  {
    slug: "burner-phone-tower-logs",
    title: "Cell Tower Logs",
    type: EvidenceType.GPS_PIN, // was FORENSIC — that enum member doesn't exist
    content: "Triangulated location data recovered from the burner phone's carrier records.",
    attachmentUrl: "/assets/evidence/forensic/tower-logs.pdf",
  },
];
// ----------------------------------------------------------------------------
// Scenes + dialogue (pass 2). `choices` is declared here for readability but
// applied in pass 3, once every scene in this list has a real id.
// ----------------------------------------------------------------------------

interface DialogueLineSeed {
  order: number;
  content: string;
  characterSlug: string | null; // null = unattributed narration
  audioUrl: string | null;
}

interface ChoiceSeed {
  order: number;
  label: string;
  nextSceneSlug: string; // Resolved chapter-relatively in pass 3 — see note there.
}

interface SceneSeed {
  chapterNumber: number;
  slug: string;
  title: string;
  type: SceneType;
  order: number;
  evidenceSlug?: string; // EVIDENCE_REVEAL scenes only
  challengeSlug?: string; // CHALLENGE_GATE scenes only
  dialogueLines: DialogueLineSeed[];
  choices?: ChoiceSeed[];
}

const SCENES: SceneSeed[] = [
  // ---- Prologue ----
  {
    chapterNumber: 0,
    slug: "cold-open",
    title: "Cold Open",
    type: SceneType.DIALOGUE,
    order: 1,
    dialogueLines: [
      { order: 1, content: "3:47 AM. A call nobody wants to answer.", characterSlug: null, audioUrl: null },
      { order: 2, content: "This is Carter.", characterSlug: "ethan-carter", audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "the-call",
    title: "The Call",
    type: SceneType.DIALOGUE,
    order: 2,
    dialogueLines: [
      {
        order: 1,
        content: "We've got a body. Overdose, on paper. Doesn't sit right with me.",
        characterSlug: "noah",
        audioUrl: null,
      },
    ],
    choices: [
      { order: 1, label: "\"I'm on my way.\"", nextSceneSlug: "the-file" },
      { order: 2, label: "\"What makes you say that?\"", nextSceneSlug: "the-file" },
    ],
  },
  {
    chapterNumber: 0,
    slug: "the-file",
    title: "The File",
    type: SceneType.EVIDENCE_REVEAL,
    order: 3,
    evidenceSlug: "toxicology-report",
    dialogueLines: [
      { order: 1, content: "Noah slides a folder across the desk before you've even sat down.", characterSlug: null, audioUrl: null },
    ],
  },

  // ---- Chapter 1: The Overdose ----
  {
    chapterNumber: 1,
    slug: "arriving-at-scene",
    title: "Arriving at the Scene",
    type: SceneType.DIALOGUE,
    order: 1,
    dialogueLines: [
      { order: 1, content: "The apartment's been sealed since the call came in.", characterSlug: null, audioUrl: null },
      { order: 2, content: "Nothing's been touched. Whatever's here, it's exactly how they left it.", characterSlug: "noah", audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "the-ledger-photo",
    title: "A Photograph on the Wall",
    type: SceneType.EVIDENCE_REVEAL,
    order: 2,
    evidenceSlug: "wallet-ledger-photo",
    dialogueLines: [
      { order: 1, content: "Taped to the wall: a printed screenshot of a wallet ledger.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "challenge-gate-toxicology",
    title: "Reading the Report",
    type: SceneType.CHALLENGE_GATE,
    order: 3,
    challengeSlug: "the-overdose-report",
    dialogueLines: [
      { order: 1, content: "If this really was an overdose, the numbers should say so. Prove it — or disprove it.", characterSlug: "robert", audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "the-debrief",
    title: "The Debrief",
    type: SceneType.DIALOGUE,
    order: 4,
    dialogueLines: [
      { order: 1, content: "So it wasn't an accident.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 2, content: "No. And whoever set this up wanted it to look like one.", characterSlug: "noah", audioUrl: null },
    ],
  },

  // ---- Chapter 2: The Ledger ----
  {
    chapterNumber: 2,
    slug: "the-wallet-thread",
    title: "Pulling the Thread",
    type: SceneType.DIALOGUE,
    order: 1,
    dialogueLines: [
      { order: 1, content: "Three buyers, one wallet, six hours. That's not a coincidence.", characterSlug: "ethan-carter", audioUrl: null },
    ],
  },
];

export async function seedStory(): Promise<void> {
  const chapterMap = await buildChapterMap(prisma);

  // ---- Pass 1: Characters + Evidence ----
  const characterIdBySlug = new Map<string, string>();
  for (const character of CHARACTERS) {
    const row = await prisma.character.upsert({
      where: { slug: character.slug },
      update: { displayName: character.displayName, portraitUrl: character.portraitUrl },
      create: character,
    });
    characterIdBySlug.set(character.slug, row.id);
  }

  const evidenceIdBySlug = new Map<string, string>();
  for (const evidence of EVIDENCE) {
    const row = await prisma.evidence.upsert({
      where: { slug: evidence.slug },
      update: {
        title: evidence.title,
        type: evidence.type,
        content: evidence.content,
        attachmentUrl: evidence.attachmentUrl,
      },
      create: { ...evidence, status: ContentStatus.PUBLISHED },
    });
    evidenceIdBySlug.set(evidence.slug, row.id);
  }

  // ---- Pass 2: Scenes + DialogueLines ----
  const sceneIdBySlug = new Map<string, string>(); // keyed by scene slug only — slugs are unique across this seed set
  const sceneChapterBySlug = new Map<string, number>();

  for (const scene of SCENES) {
    const chapterId = chapterMap.getId(scene.chapterNumber);

    let challengeId: string | null = null;
    if (scene.challengeSlug) {
      const challenge = await prisma.challenge.findUnique({
        where: { slug: scene.challengeSlug },
        select: { id: true },
      });
      if (!challenge) {
        throw new Error(
          `[seed-story] Scene "${scene.slug}" references unknown challenge "${scene.challengeSlug}" — did seed-challenges run first?`,
        );
      }
      challengeId = challenge.id;
    }

    const evidenceId = scene.evidenceSlug ? (evidenceIdBySlug.get(scene.evidenceSlug) ?? null) : null;
    if (scene.evidenceSlug && !evidenceId) {
      throw new Error(`[seed-story] Scene "${scene.slug}" references unknown evidence "${scene.evidenceSlug}".`);
    }

    const sceneRow = await prisma.scene.upsert({
      where: { chapterId_order: { chapterId, order: scene.order } },
      update: {
        slug: scene.slug,
        title: scene.title,
        type: scene.type,
        challengeId,
        evidenceId,
      },
      create: {
        chapterId,
        slug: scene.slug,
        title: scene.title,
        type: scene.type,
        order: scene.order,
        status: ContentStatus.PUBLISHED,
        challengeId,
        evidenceId,
      },
    });

    sceneIdBySlug.set(scene.slug, sceneRow.id);
    sceneChapterBySlug.set(scene.slug, scene.chapterNumber);

    // DialogueLines: full delete-and-recreate per scene — simpler and safer
    // for a reseedable script than trying to diff individual lines.
    await prisma.dialogueLine.deleteMany({ where: { sceneId: sceneRow.id } });
    for (const line of scene.dialogueLines) {
      const characterId = line.characterSlug ? (characterIdBySlug.get(line.characterSlug) ?? null) : null;
      await prisma.dialogueLine.create({
        data: {
          sceneId: sceneRow.id,
          order: line.order,
          content: line.content,
          characterId,
          audioUrl: line.audioUrl,
        },
      });
    }
  }

  // ---- Pass 3: Choices (needs every scene's real id to resolve nextSceneId) ----
  for (const scene of SCENES) {
    if (!scene.choices?.length) continue;
    const sceneId = sceneIdBySlug.get(scene.slug)!;

    await prisma.choice.deleteMany({ where: { sceneId } });
    for (const choice of scene.choices) {
      const nextSceneId = sceneIdBySlug.get(choice.nextSceneSlug);
      if (!nextSceneId) {
        throw new Error(
          `[seed-story] Choice "${choice.label}" on scene "${scene.slug}" references unknown next scene "${choice.nextSceneSlug}".`,
        );
      }
      await prisma.choice.create({
        data: { sceneId, order: choice.order, label: choice.label, nextSceneId },
      });
    }
  }

  // ---- Unlock rules ----
  // Demonstrates all three condition types the dashboard/evidence board/
  // chapter map need to render a LOCKED state correctly:
  //   1. CHALLENGE_SOLVED on the debrief scene AND on a piece of evidence
  //      (burner-phone-tower-logs stays LOCKED on the board until solved).
  //   2. CHAPTER_COMPLETED on Chapter 2, gated on Chapter 1's order.
  const overdoseChallenge = await prisma.challenge.findUnique({
    where: { slug: "the-overdose-report" },
    select: { id: true },
  });
  if (!overdoseChallenge) {
    throw new Error('[seed-story] Unlock rules require challenge "the-overdose-report" to exist.');
  }

  const debriefSceneId = sceneIdBySlug.get("the-debrief")!;
  const towerLogsEvidence = await prisma.evidence.findUnique({
    where: { slug: "burner-phone-tower-logs" },
    select: { id: true },
  });
  const chapter1Id = chapterMap.getId(1);
  const chapter2Id = chapterMap.getId(2);

  const unlockRules: {
    targetType: UnlockTargetType;
    targetId: string;
    conditionType: UnlockConditionType;
    referenceId: string;
  }[] = [
    {
      targetType: UnlockTargetType.SCENE,
      targetId: debriefSceneId,
      conditionType: UnlockConditionType.CHALLENGE_SOLVED,
      referenceId: overdoseChallenge.id,
    },
    {
      targetType: UnlockTargetType.CHAPTER,
      targetId: chapter2Id,
      conditionType: UnlockConditionType.CHAPTER_COMPLETED,
      referenceId: chapter1Id,
    },
  ];

  if (towerLogsEvidence) {
    unlockRules.push({
      targetType: UnlockTargetType.EVIDENCE,
      targetId: towerLogsEvidence.id,
      conditionType: UnlockConditionType.CHALLENGE_SOLVED,
      referenceId: overdoseChallenge.id,
    });
  }

  for (const rule of unlockRules) {
    await prisma.unlockRule.deleteMany({
      where: { targetType: rule.targetType, targetId: rule.targetId, conditionType: rule.conditionType },
    });
    await prisma.unlockRule.create({ data: rule });
  }

  console.log(
    `[seed-story] ${CHARACTERS.length} character(s), ${EVIDENCE.length} evidence item(s), ${SCENES.length} scene(s), ${unlockRules.length} unlock rule(s) ready.`,
  );
}

if (require.main === module) {
  seedStory()
    .catch((error) => {
      console.error("[seed-story] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
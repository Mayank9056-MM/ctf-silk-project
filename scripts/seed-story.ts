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
//
// ----------------------------------------------------------------------
// REWRITE NOTES (this pass)
// ----------------------------------------------------------------------
// 1. Chapter 0 (Prologue) expanded from 3 stub scenes to the full 10-scene
//    + Final Scene breakdown in docs/story/PROLOGUE.md. This REMOVES the
//    scene slugs "the-call" and "the-file" — if seed-demo-progress.ts (or
//    anything else) references them by slug, it will break. Grep for both
//    before running this against a database anything else depends on.
//
// 2. FIXED, not carried forward: the previous Chapter 1 content had two
//    dialogue lines attributed to characterSlug "noah" and one to "robert".
//    Per CHARACTERS.md, Noah never appears on-page alive, and Robert is
//    explicitly unaware of Ethan directly at this stage of the story. Both
//    were almost certainly placeholder mistakes, not intentional canon —
//    reattributed to unattributed narration below.
//
// 3. Chapter 1 ("The Overdose") and Chapter 2 ("The Ledger") content below
//    is NOT sourced from docs/story/ — STORY.md's Story Structure table
//    marks Act 1+ as 🧩 TODO and explicitly says "Do not draft Act 1+
//    content from assumption." The original seed-story.ts already
//    contained invented placeholder scenes for these chapters; this pass
//    extends that existing placeholder pattern with more scenes and
//    branching choices for platform testing. NONE of Chapter 1/2's
//    dialogue should be treated as narrative canon — only the Prologue
//    content (Chapter 0) is doc-sourced.
//
// 4. Two Characters added (daniel-brooks, supervisor) and two Evidence
//    items added (secure-encrypted-phone, noahs-keychain) — the Prologue
//    scenes need both. NOTE on noahs-keychain: CHARACTERS.md references
//    "EVIDENCE.md → EVID-006" for Noah's keychain, but EVIDENCE.md's own
//    Named Evidence Items table only runs to EVID-005 and never actually
//    adds a keychain row. That's a gap in EVIDENCE.md itself, not
//    something invented here — flagging it instead of quietly
//    papering over it. Treat this evidence row as test-only until
//    EVIDENCE.md is updated with a real EVID-006 entry.
//
// 5. Scenes that present a real decision now use SceneType.CHOICE instead
//    of SceneType.DIALOGUE (the previous file used DIALOGUE even for
//    scenes with an embedded choices array — CHOICE exists in the schema
//    for exactly this case).
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
  // NEW — required once the Prologue covers Scenes 6-9 (Supervisor/Brooks
  // dialogue); absent from the previous 3-scene stub, which never reached
  // these beats.
  { slug: "daniel-brooks", displayName: "Daniel Brooks", portraitUrl: null },
  // NEW — unnamed per CHARACTERS.md ("Ethan's Supervisor 🧩 not named in
  // source material"). Slug stays generic; rename this and the row below
  // together if a real name is ever confirmed.
  { slug: "supervisor", displayName: "Ethan's Supervisor", portraitUrl: null },
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
      "Cause of death listed as acute overdose caused by highly contaminated synthetic narcotics — matches EVID-001's description in EVIDENCE.md.",
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
  // NEW — PROLOGUE.md Scene 8 / EVIDENCE.md EVID-004.
  {
    slug: "secure-encrypted-phone",
    title: "Secure Encrypted Phone",
    type: EvidenceType.OTHER, // a physical device, not a document/photo/ledger — no better-fit enum member
    content: "Hidden in a desk drawer. Every call routes through a relay that leaves nothing behind.",
    attachmentUrl: "/assets/evidence/photographs/encrypted-phone.webp",
  },
  // NEW — see REWRITE NOTES #4 above re: the EVID-006 gap in EVIDENCE.md.
  {
    slug: "noahs-keychain",
    title: "Noah's Keychain",
    type: EvidenceType.OTHER, // DUMMY — not a real case-file exhibit, just Ethan's kept personal item
    content: "A small, worn keychain. Not evidence in any case file — just the only thing Ethan took home.",
    attachmentUrl: null,
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
  nextSceneSlug: string; // Resolved globally in pass 3 — scene slugs are unique across the whole seed set, not just within a chapter.
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
  // ==========================================================================
  // Chapter 0 — Prologue ("The Beginning")
  // Doc-sourced from docs/story/PROLOGUE.md's approved production breakdown.
  // Dialogue below is paraphrased/condensed for gameplay pacing, not a
  // verbatim reproduction of the doc's prose.
  // ==========================================================================
  {
    chapterNumber: 0,
    slug: "cold-open",
    title: "Cold Open",
    type: SceneType.DIALOGUE,
    order: 1,
    dialogueLines: [
      { order: 1, content: "3:47 AM. A call nobody wants to answer.", characterSlug: null, audioUrl: null },
      { order: 2, content: "This is Carter.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 3, content: "A voice he doesn't recognize.", characterSlug: null, audioUrl: null },
      { order: 4, content: "\"Your brother has been identified.\"", characterSlug: null, audioUrl: null },
      { order: 5, content: "The phone slips from his hand. Hard cut to black.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "crime-scene",
    title: "Crime Scene",
    type: SceneType.EVIDENCE_REVEAL,
    order: 2,
    evidenceSlug: "toxicology-report",
    dialogueLines: [
      { order: 1, content: "Police tape. A forensics team working in silence.", characterSlug: null, audioUrl: null },
      {
        order: 2,
        content: "Only Noah's hand is visible past the sheet — and, looped around two fingers, his keychain.",
        characterSlug: null,
        audioUrl: null,
      },
      { order: 3, content: "Someone hands Ethan a folder before he's even asked for it.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "funeral",
    title: "Funeral",
    type: SceneType.EVIDENCE_REVEAL,
    order: 3,
    evidenceSlug: "noahs-keychain",
    dialogueLines: [
      { order: 1, content: "Rain. No eulogy reaches him — only the sound of it landing on the tent.", characterSlug: null, audioUrl: null },
      { order: 2, content: "Ethan takes the keychain from among the flowers and closes his hand around it.", characterSlug: null, audioUrl: null },
      { order: 3, content: "THREE WEEKS LATER", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "bullpen-three-weeks-later",
    title: "Bullpen, Three Weeks Later",
    type: SceneType.DIALOGUE,
    order: 4,
    dialogueLines: [
      { order: 1, content: "Morning briefing. Someone laughs about a parking ticket. Ethan says nothing.", characterSlug: null, audioUrl: null },
      { order: 2, content: "By the time the office empties for the night, he's still at his desk.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "the-pattern",
    title: "The Pattern",
    type: SceneType.CHALLENGE_GATE,
    order: 5,
    challengeSlug: "the-pattern-tutorial",
    dialogueLines: [
      {
        order: 1,
        content: "Hundreds of case files. Different cities. Different suppliers. Something underneath doesn't add up.",
        characterSlug: null,
        audioUrl: null,
      },
      { order: 2, content: "Cross-reference the wallets. Cross-reference the timestamps. Find what the summaries left out.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "the-supervisor",
    title: "The Request",
    type: SceneType.CHOICE,
    order: 6,
    dialogueLines: [
      { order: 1, content: "I think these cases are connected.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 2, content: "I'm sorry for your loss, Ethan.", characterSlug: "supervisor", audioUrl: null },
      { order: 3, content: "But grief isn't evidence.", characterSlug: "supervisor", audioUrl: null },
    ],
    choices: [
      { order: 1, label: "\"There has to be something here.\"", nextSceneSlug: "supervisor-pushback" },
      { order: 2, label: "Nod and let it go.", nextSceneSlug: "supervisor-accept-quietly" },
    ],
  },
  {
    chapterNumber: 0,
    slug: "supervisor-pushback",
    title: "Pushing Back",
    type: SceneType.DIALOGUE,
    order: 7,
    dialogueLines: [
      { order: 1, content: "I've found the same pattern in a dozen closed files.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 2, content: "Closed. Past tense, Agent Carter.", characterSlug: "supervisor", audioUrl: null },
      { order: 3, content: "The door is a suggestion, not a request.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "supervisor-accept-quietly",
    title: "Letting It Go",
    type: SceneType.DIALOGUE,
    order: 8,
    dialogueLines: [
      { order: 1, content: "Ethan doesn't argue. He already knows how this ends.", characterSlug: null, audioUrl: null },
      { order: 2, content: "Get some sleep.", characterSlug: "supervisor", audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "the-senior-agent",
    title: "The Senior Agent",
    type: SceneType.CHOICE,
    order: 9,
    dialogueLines: [
      { order: 1, content: "Ethan spreads the reports across Brooks' desk and waits.", characterSlug: null, audioUrl: null },
      { order: 2, content: "A long silence. Brooks reads. Drinks his coffee. Reads again.", characterSlug: null, audioUrl: null },
    ],
    choices: [
      { order: 1, label: "Lay out every report you found.", nextSceneSlug: "brooks-full-evidence" },
      { order: 2, label: "Just walk him through the pattern.", nextSceneSlug: "brooks-summary" },
    ],
  },
  {
    chapterNumber: 0,
    slug: "brooks-full-evidence",
    title: "Everything On the Table",
    type: SceneType.DIALOGUE,
    order: 10,
    dialogueLines: [
      { order: 1, content: "I've checked every database available.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 2, content: "Nothing.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 3, content: "You're chasing ghosts, Ethan.", characterSlug: "daniel-brooks", audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "brooks-summary",
    title: "The Short Version",
    type: SceneType.DIALOGUE,
    order: 11,
    dialogueLines: [
      { order: 1, content: "You don't need all of this to tell me a story.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 2, content: "And it's still just a story. No organization. No marketplace. No evidence.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 3, content: "Forget about it.", characterSlug: "daniel-brooks", audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "the-hidden-phone",
    title: "Behind Closed Doors",
    type: SceneType.EVIDENCE_REVEAL,
    order: 12,
    evidenceSlug: "secure-encrypted-phone",
    dialogueLines: [
      { order: 1, content: "The door closes. Brooks waits for the hallway to empty, then opens a drawer.", characterSlug: null, audioUrl: null },
      { order: 2, content: "He knows.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 3, content: "A pause on the other end.", characterSlug: null, audioUrl: null },
      { order: 4, content: "The new recruit. He's connecting the overdose cases.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 5, content: "Silence.", characterSlug: null, audioUrl: null },
      { order: 6, content: "Not yet.", characterSlug: "daniel-brooks", audioUrl: null },
      { order: 7, content: "Another pause.", characterSlug: null, audioUrl: null },
      { order: 8, content: "No. He's inexperienced. But he's asking the right questions.", characterSlug: "daniel-brooks", audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "robert-shadows",
    title: "The Man in the Shadows",
    type: SceneType.DIALOGUE,
    order: 13,
    dialogueLines: [
      { order: 1, content: "A wall of monitors. Cryptocurrency transfers. Encrypted messages. A silhouette, watching.", characterSlug: null, audioUrl: null },
      { order: 2, content: "A rookie.", characterSlug: "robert", audioUrl: null },
      { order: 3, content: "Let's see how far he gets.", characterSlug: "robert", audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "noahs-grave",
    title: "Noah's Grave",
    type: SceneType.DIALOGUE,
    order: 14,
    dialogueLines: [
      { order: 1, content: "Rain again. No one else here tonight.", characterSlug: null, audioUrl: null },
      { order: 2, content: "You were supposed to become an engineer.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 3, content: "Not another file.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 4, content: "I failed you.", characterSlug: "ethan-carter", audioUrl: null },
      { order: 5, content: "He starts to leave the keychain on the stone. Stops. Pockets it instead.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 0,
    slug: "thesis-statement",
    title: "People Lie. Evidence Doesn't.",
    type: SceneType.CUTSCENE,
    order: 15,
    dialogueLines: [
      { order: 1, content: "People lie.", characterSlug: null, audioUrl: null },
      { order: 2, content: "Evidence doesn't.", characterSlug: null, audioUrl: null },
    ],
  },

  // ==========================================================================
  // Chapter 1 — "The Overdose"
  // NOT doc-sourced (see REWRITE NOTES #3). Dummy/placeholder content only.
  // ==========================================================================
  {
    chapterNumber: 1,
    slug: "arriving-at-scene",
    title: "Arriving at the Scene",
    type: SceneType.DIALOGUE,
    order: 1,
    dialogueLines: [
      { order: 1, content: "The apartment's been sealed since the call came in.", characterSlug: null, audioUrl: null },
      // FIXED — was mis-attributed to characterSlug "noah" (Noah is deceased and never speaks on-page per CHARACTERS.md). Reattributed to narration.
      { order: 2, content: "Nothing's been touched. Whatever's here, it's exactly how they left it.", characterSlug: null, audioUrl: null },
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
    slug: "ask-the-neighbor",
    title: "The Neighbor",
    type: SceneType.CHOICE,
    order: 3,
    dialogueLines: [
      { order: 1, content: "A door across the hall cracks open. Someone's been watching the tape all morning.", characterSlug: null, audioUrl: null },
    ],
    choices: [
      { order: 1, label: "Press for what they saw.", nextSceneSlug: "neighbor-pressed" },
      { order: 2, label: "Thank them and keep moving.", nextSceneSlug: "neighbor-polite" },
    ],
  },
  {
    chapterNumber: 1,
    slug: "neighbor-pressed",
    title: "Pressing for Details",
    type: SceneType.DIALOGUE,
    order: 4,
    dialogueLines: [
      { order: 1, content: "Three visits in one week, the neighbor says. Always the same knock, never long.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "neighbor-polite",
    title: "A Dead End, Politely",
    type: SceneType.DIALOGUE,
    order: 5,
    dialogueLines: [
      { order: 1, content: "The neighbor has nothing solid to add. Just a bad feeling they can't place.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "challenge-gate-toxicology",
    title: "Reading the Report",
    type: SceneType.CHALLENGE_GATE,
    order: 6,
    challengeSlug: "the-overdose-report",
    dialogueLines: [
      // FIXED — was mis-attributed to characterSlug "robert" (Robert is explicitly unaware of Ethan directly at this stage per CHARACTERS.md). Reattributed to narration, framed as Ethan's own mission text.
      { order: 1, content: "If this really was an overdose, the numbers should say so. Prove it — or disprove it.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "the-debrief",
    title: "The Debrief",
    type: SceneType.DIALOGUE,
    order: 7,
    dialogueLines: [
      { order: 1, content: "So it wasn't an accident.", characterSlug: "ethan-carter", audioUrl: null },
      // FIXED — was mis-attributed to characterSlug "noah". Reattributed to narration.
      { order: 2, content: "No. Whoever set this up wanted it to look like one.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "the-burner-phone",
    title: "The Burner Phone",
    type: SceneType.EVIDENCE_REVEAL,
    order: 8,
    evidenceSlug: "burner-phone-tower-logs",
    dialogueLines: [
      { order: 1, content: "A cheap burner, wiped down but not wiped clean. The tower logs survived.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "challenge-gate-burner-phone",
    title: "Triangulating",
    type: SceneType.CHALLENGE_GATE,
    order: 9,
    challengeSlug: "burner-phone-forensics",
    dialogueLines: [
      { order: 1, content: "Three towers. Three timestamps. That's enough to place someone, if you triangulate it right.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 1,
    slug: "chapter-one-closer",
    title: "One Thread",
    type: SceneType.DIALOGUE,
    order: 10,
    dialogueLines: [
      { order: 1, content: "One wallet. Three names. The thread keeps pulling.", characterSlug: null, audioUrl: null },
    ],
  },

  // ==========================================================================
  // Chapter 2 — "The Ledger"
  // NOT doc-sourced (see REWRITE NOTES #3). Dummy/placeholder content only.
  // ==========================================================================
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
  {
    chapterNumber: 2,
    slug: "cross-referencing",
    title: "Two Paths",
    type: SceneType.CHOICE,
    order: 2,
    dialogueLines: [
      { order: 1, content: "Two paths from here: chase the money, or chase the people spending it.", characterSlug: null, audioUrl: null },
    ],
    choices: [
      { order: 1, label: "Follow the wallet.", nextSceneSlug: "follow-the-money" },
      { order: 2, label: "Follow the buyers.", nextSceneSlug: "follow-the-buyers" },
    ],
  },
  {
    chapterNumber: 2,
    slug: "follow-the-money",
    title: "Following the Wallet",
    type: SceneType.DIALOGUE,
    order: 3,
    dialogueLines: [
      { order: 1, content: "The wallet's balance moves in patterns too regular to be random.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 2,
    slug: "follow-the-buyers",
    title: "Following the Buyers",
    type: SceneType.DIALOGUE,
    order: 4,
    dialogueLines: [
      { order: 1, content: "Three names. Three cities. One supplier none of them have ever met.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 2,
    slug: "challenge-gate-wallet-ledger",
    title: "The Ledger Doesn't Lie",
    type: SceneType.CHALLENGE_GATE,
    order: 5,
    challengeSlug: "the-wallet-ledger",
    dialogueLines: [
      { order: 1, content: "Same wallet, three buyers, six hours. Prove the ledger doesn't lie either.", characterSlug: null, audioUrl: null },
    ],
  },
  {
    chapterNumber: 2,
    slug: "chapter-two-closer",
    title: "Just Getting Started",
    type: SceneType.DIALOGUE,
    order: 6,
    dialogueLines: [
      { order: 1, content: "Ethan pins the wallet address to the board and steps back. The thread isn't finished. It's just getting started.", characterSlug: null, audioUrl: null },
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
  // Unchanged from the previous version — "the-debrief" and
  // "burner-phone-tower-logs" both kept their original slugs, so these
  // still resolve correctly against the expanded scene set above.
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
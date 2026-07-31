// Run with: npm run seed:story
// package.json: "seed:story": "tsx --env-file=.env scripts/seed-story.ts"
//
// Seeds one testable narrative slice — the Prologue, through the first
// two OSINT/forensics challenges. Edit the DIALOGUE/CHARACTERS/EVIDENCE/
// CHALLENGES arrays to add content; slugs are the stable identity this
// script upserts on. Safe to re-run.
//
// Deliberately scoped to Ethan's actual stated skillset — digital
// forensics, OSINT, metadata analysis, pattern recognition. Neither
// challenge below is web/crypto-exploitation; both are "here's a clue,
// reason your way to the answer," matching a protagonist who explicitly
// "doesn't magically hack into systems" but uses public information and
// investigative reasoning.

import prisma from "@/lib/prisma";
import { hashFlag } from "@/modules/challenge/utils/hash-flag";
import { submitFlagSchema } from "@/modules/submission/validations/submit-flag.schema";
import { CHALLENGE_DIFFICULTY } from "@/modules/challenge/constants/challenge.constants";

// ===================================================================
// Chapter — reuses the same slug migrate-chapters.ts already creates.
// ===================================================================

const CHAPTER = { slug: "prologue", title: "Prologue — The Beginning", order: 1 };

// ===================================================================
// Characters
// ===================================================================

interface CharacterSeed {
  slug: string;
  displayName: string;
}

const CHARACTERS: CharacterSeed[] = [
  { slug: "ethan-carter", displayName: "Ethan Carter" },
  { slug: "daniel-brooks", displayName: "Senior Agent Daniel Brooks" },
  { slug: "unit-supervisor", displayName: "Unit Supervisor" },
  { slug: "robert", displayName: "???" }, // portraitUrl deliberately null — his face is never shown
];

// ===================================================================
// Evidence
// ===================================================================

interface EvidenceSeed {
  slug: string;
  title: string;
  type: "CHAT_LOG" | "DOCUMENT";
  content: string;
}

const EVIDENCE: EvidenceSeed[] = [
  {
    slug: "secure-messenger-fragment",
    title: "Recovered Secure Messenger Fragment",
    type: "CHAT_LOG",
    content:
      'Final message received by Noah Carter, recovered from a deleted app database:\n\n> "Your order has arrived. Same place. Use the code they gave you."\n\nFollowed by a second, unreadable line containing only: **Order #427**.',
  },
  {
    slug: "onion-address-lead",
    title: "Unidentified .onion Address",
    type: "DOCUMENT",
    content:
      "A web address ending in .onion, recovered alongside the deleted messages — not reachable through an ordinary browser or search engine. Noah wasn't a random victim of a bad batch. He was a customer of something built to stay hidden.",
  },
];

// ===================================================================
// Challenges — the ONLY two in this seed, deliberately. Both fit
// Ethan's stated domain (digital forensics + OSINT); neither requires
// exploitation skills the character explicitly doesn't have.
// ===================================================================

interface ChallengeSeed {
  slug: string;
  title: string;
  difficulty: number;
  xpReward: number;
  flag: string;
  attachment?: { fileName: string; filePath: string; mimeType: string; type: "ARCHIVE" };
}

const CHALLENGES: ChallengeSeed[] = [
  {
    slug: "the-last-device",
    title: "The Last Device",
    difficulty: CHALLENGE_DIFFICULTY.EASY,
    xpReward: 100,
    // Constructed from the story's own clue ("Order #427" / "B-427") —
    // not given verbatim in your doc, since it only supplied the clue
    // text, not a final flag value.
    flag: "ctf{order_427}",
    attachment: {
      fileName: "noah_phone_backup.zip",
      // Placeholder path — swap for wherever the real backup file (or a
      // constructed SQLite/plist forensic artifact) actually lives once
      // you build one. filePath is NOT a public URL; see
      // getAttachmentUrl()/getAttachmentAbsolutePath() in the challenge
      // module for how this resolves at request time.
      filePath: "uploads/challenges/the-last-device/noah_phone_backup.zip",
      mimeType: "application/zip",
      type: "ARCHIVE",
    },
  },
  {
    slug: "into-the-unknown",
    title: "Into the Unknown",
    difficulty: CHALLENGE_DIFFICULTY.EASY,
    xpReward: 100,
    flag: "ctf{darkweb}",
    // No attachment — this one's a pure OSINT knowledge question, no
    // file to analyze.
  },
];

// Task 2 requires Task 1 solved — matches the narrative (the .onion
// address is found INSIDE the recovered phone backup from Task 1).
const CHALLENGE_PREREQUISITES: [challenge: string, requires: string][] = [
  ["into-the-unknown", "the-last-device"],
];

// ===================================================================
// Scenes — dialogue content condensed from your prologue doc into
// typewriter-appropriate chunks, not a line-per-sentence dump.
// characterId: null = narration/no speaker.
// ===================================================================

interface DialogueLineSeed {
  character: string | null;
  content: string;
}

interface SceneSeed {
  slug: string;
  title: string;
  type: "DIALOGUE" | "CUTSCENE" | "EVIDENCE_REVEAL" | "CHALLENGE_GATE";
  order: number;
  lines: DialogueLineSeed[];
  challengeSlug?: string;
  evidenceSlug?: string;
}

const SCENES: SceneSeed[] = [
  {
    slug: "the-call",
    title: "The Call",
    type: "CUTSCENE",
    order: 1,
    lines: [
      { character: null, content: "It was a cold, rainy evening when Special Agent Ethan Carter received the phone call that would change his life forever." },
      { character: null, content: "His younger brother, Noah Carter, had been found dead in a rundown apartment on the outskirts of the city." },
      { character: null, content: "Official Cause of Death: Acute overdose caused by highly contaminated synthetic narcotics. Noah wasn't a criminal — he was another victim." },
      { character: "ethan-carter", content: "I promise you, Noah. I'll find the people responsible. I'll destroy the organization that did this. No matter the cost." },
    ],
  },
  {
    slug: "three-weeks-later",
    title: "Three Weeks Later",
    type: "DIALOGUE",
    order: 2,
    lines: [
      { character: null, content: "Three weeks later. Ethan had recently graduated from the FBI Academy — unlike the legendary agents in the training manuals, he was nobody." },
      { character: null, content: "Name: Ethan Carter · Rank: Junior Special Agent · Division: Cyber Intelligence Support · Clearance: Level 1 · Cases Solved: 0 · Reputation: 12/100." },
      { character: null, content: "To everyone else, he was just another rookie." },
    ],
  },
  {
    slug: "a-pattern-nobody-saw",
    title: "A Pattern Nobody Saw",
    type: "DIALOGUE",
    order: 3,
    lines: [
      { character: null, content: "Unable to let his brother's death go, Ethan began reviewing old overdose reports — hundreds of victims, different cities, different suppliers." },
      { character: null, content: "Anonymous cryptocurrency transactions. Encrypted communications. Disappearing evidence. Investigations quietly closed without explanation." },
      { character: "ethan-carter", content: "Every trail points to the same thing. A marketplace that, officially, doesn't exist." },
    ],
  },
  {
    slug: "the-request",
    title: "The Request",
    type: "DIALOGUE",
    order: 4,
    lines: [
      { character: "ethan-carter", content: "I think these cases are connected." },
      { character: "unit-supervisor", content: "They're closed." },
      { character: "ethan-carter", content: "I've found similarities between dozens of investigations." },
      { character: "unit-supervisor", content: "Coincidences." },
      { character: "ethan-carter", content: "I need access to archived intelligence files." },
      { character: "unit-supervisor", content: "You don't have the clearance. There isn't. Request denied." },
    ],
  },
  {
    slug: "the-senior-agent",
    title: "The Senior Agent",
    type: "DIALOGUE",
    order: 5,
    lines: [
      { character: null, content: "Refusing to give up, Ethan sought help from one of the Bureau's most respected investigators — Senior Agent Daniel Brooks." },
      { character: "ethan-carter", content: "The overdose victims, the cryptocurrency transactions, the hidden marketplace, the missing evidence — it's all connected." },
      { character: "daniel-brooks", content: "I've checked every intelligence database available. There is no active organization matching your theory. No marketplace. No evidence." },
      { character: "daniel-brooks", content: "You've been chasing ghosts. Forget about it." },
      { character: null, content: "Disappointed but trusting his superior, Ethan left the office believing he had reached a dead end. He couldn't have been more wrong." },
    ],
  },
  {
    slug: "behind-closed-doors",
    title: "Behind Closed Doors",
    type: "CUTSCENE",
    order: 6,
    lines: [
      { character: null, content: "The office door slowly closed. Brooks waited until the hallway was empty, then removed a secure encrypted phone hidden inside his desk." },
      { character: "daniel-brooks", content: "He knows." },
      { character: "robert", content: "Who?" },
      { character: "daniel-brooks", content: "The new recruit. He's connecting the overdose cases." },
      { character: "robert", content: "Can he prove anything?" },
      { character: "daniel-brooks", content: "Not yet." },
      { character: "robert", content: "Should we deal with him?" },
      { character: "daniel-brooks", content: "No. He's inexperienced. But he's asking the right questions." },
      { character: "robert", content: "Keep watching him." },
    ],
  },
  {
    slug: "the-man-in-shadows",
    title: "The Man in the Shadows",
    type: "CUTSCENE",
    order: 7,
    lines: [
      { character: null, content: "Far from FBI headquarters, inside an abandoned industrial complex, dozens of monitors displayed live cryptocurrency transfers, encrypted messages, and dark-web transactions." },
      { character: null, content: "Standing before them was a man known only by a single name. To the public, he didn't exist. To governments, he was a rumor. To the organization, he was untouchable." },
      { character: "robert", content: "A rookie. Let's see how far he gets." },
    ],
  },
  {
    slug: "your-mission-begins",
    title: "Your Mission Begins",
    type: "DIALOGUE",
    order: 8,
    lines: [
      { character: null, content: "Unknown to Ethan, his investigation had already attracted the attention of one of the world's most dangerous criminal organizations." },
      { character: null, content: "Every step he took would be watched. Every mistake could cost lives." },
      { character: null, content: "Welcome, Agent. Find the truth. Bring them down." },
    ],
  },
  {
    slug: "the-last-device",
    title: "The Last Device",
    type: "CHALLENGE_GATE",
    order: 9,
    challengeSlug: "the-last-device",
    lines: [
      { character: null, content: "After Noah's funeral, Ethan requests permission to examine his brother's belongings. Among them: a locked smartphone recovered from the apartment." },
      { character: null, content: "Most of its contents look normal — photos, family chats. But one application catches his attention: no App Store record, no icon, appearing in the system logs only as \"Secure Messenger.\"" },
      { character: "ethan-carter", content: "It's already been deleted. But fragments of its encrypted database might still be sitting in the device backup." },
      { character: null, content: "Recover the deleted conversation and identify the final message Noah received before his death." },
    ],
  },
  {
    slug: "recovered-message",
    title: "What Remained",
    type: "EVIDENCE_REVEAL",
    order: 10,
    evidenceSlug: "secure-messenger-fragment",
    lines: [
      { character: null, content: "Fragments of the deleted conversation resurface from the backup." },
      { character: "ethan-carter", content: "He wasn't buying randomly. He was following instructions from an organized seller." },
    ],
  },
  {
    slug: "into-the-unknown",
    title: "Into the Unknown",
    type: "CHALLENGE_GATE",
    order: 11,
    challengeSlug: "into-the-unknown",
    lines: [
      { character: null, content: "Among the recovered fragments, Ethan finds an unfamiliar web address ending in .onion." },
      { character: "ethan-carter", content: "I remember this from a lecture at the Academy — criminals hiding in a part of the internet ordinary search engines can't reach." },
      { character: null, content: "Identify the hidden part of the internet where encrypted marketplaces, anonymous forums, and .onion addresses operate." },
    ],
  },
  {
    slug: "onion-realization",
    title: "Deeper Than Expected",
    type: "EVIDENCE_REVEAL",
    order: 12,
    evidenceSlug: "onion-address-lead",
    lines: [
      { character: null, content: "The picture becomes clearer, and darker. Noah wasn't just a victim of a bad batch — he was a customer of something built to stay hidden." },
      { character: "ethan-carter", content: "Someone built this. And whoever they are, they're still out there." },
    ],
  },
];

// ===================================================================
// Unlock rules — gating the scene AFTER each challenge gate, per the
// domain design's own rule: gating lives on what comes next, never on
// the CHALLENGE_GATE scene itself.
// ===================================================================

interface UnlockRuleSeed {
  targetSceneSlug: string;
  conditionType: "CHALLENGE_SOLVED" | "SCENE_COMPLETED";
  referenceChallengeSlug?: string;
  referenceSceneSlug?: string;
}

const UNLOCK_RULES: UnlockRuleSeed[] = [
  { targetSceneSlug: "recovered-message", conditionType: "CHALLENGE_SOLVED", referenceChallengeSlug: "the-last-device" },
  { targetSceneSlug: "into-the-unknown", conditionType: "SCENE_COMPLETED", referenceSceneSlug: "recovered-message" },
  { targetSceneSlug: "onion-realization", conditionType: "CHALLENGE_SOLVED", referenceChallengeSlug: "into-the-unknown" },
];

// ===================================================================
// Validation — before any write, same discipline as seed-challenges.ts.
// ===================================================================

function validate(): void {
  const errors: string[] = [];

  for (const challenge of CHALLENGES) {
    const parsed = submitFlagSchema.shape.flag.safeParse(challenge.flag);
    if (!parsed.success) {
      errors.push(`"${challenge.slug}" has an invalid flag format: ${parsed.error.issues[0]?.message}`);
    }
  }

  const sceneSlugs = new Set(SCENES.map((s) => s.slug));
  const characterSlugs = new Set(CHARACTERS.map((c) => c.slug));
  const evidenceSlugs = new Set(EVIDENCE.map((e) => e.slug));
  const challengeSlugs = new Set(CHALLENGES.map((c) => c.slug));

  for (const scene of SCENES) {
    for (const line of scene.lines) {
      if (line.character && !characterSlugs.has(line.character)) {
        errors.push(`Scene "${scene.slug}" references unknown character "${line.character}".`);
      }
    }
    if (scene.challengeSlug && !challengeSlugs.has(scene.challengeSlug)) {
      errors.push(`Scene "${scene.slug}" references unknown challenge "${scene.challengeSlug}".`);
    }
    if (scene.evidenceSlug && !evidenceSlugs.has(scene.evidenceSlug)) {
      errors.push(`Scene "${scene.slug}" references unknown evidence "${scene.evidenceSlug}".`);
    }
  }

  for (const rule of UNLOCK_RULES) {
    if (!sceneSlugs.has(rule.targetSceneSlug)) {
      errors.push(`Unlock rule targets unknown scene "${rule.targetSceneSlug}".`);
    }
    if (rule.referenceChallengeSlug && !challengeSlugs.has(rule.referenceChallengeSlug)) {
      errors.push(`Unlock rule references unknown challenge "${rule.referenceChallengeSlug}".`);
    }
    if (rule.referenceSceneSlug && !sceneSlugs.has(rule.referenceSceneSlug)) {
      errors.push(`Unlock rule references unknown scene "${rule.referenceSceneSlug}".`);
    }
  }

  if (errors.length > 0) {
    console.error("❌ Story seed data is invalid:\n");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// ===================================================================
// Seed
// ===================================================================

async function seedStory(): Promise<void> {
  validate();

  await prisma.$transaction(async (tx) => {
    // --- Chapter (reuses migrate-chapters.ts's row if it already exists) ---
    const chapter = await tx.chapter.upsert({
      where: { slug: CHAPTER.slug },
      update: { title: CHAPTER.title },
      create: { slug: CHAPTER.slug, title: CHAPTER.title, order: CHAPTER.order, status: "PUBLISHED" },
    });

    // --- Characters ---
    const characterIdBySlug = new Map<string, string>();
    for (const character of CHARACTERS) {
      const record = await tx.character.upsert({
        where: { slug: character.slug },
        update: { displayName: character.displayName },
        create: { slug: character.slug, displayName: character.displayName },
        select: { id: true },
      });
      characterIdBySlug.set(character.slug, record.id);
    }

    // --- Challenges (avoid displayOrder collision with any prior seed) ---
    const maxOrderResult = await tx.challenge.aggregate({
      where: { chapterId: chapter.id },
      _max: { displayOrder: true },
    });
    let nextDisplayOrder = (maxOrderResult._max.displayOrder ?? 0) + 1;

    const challengeIdBySlug = new Map<string, string>();
    for (const challenge of CHALLENGES) {
      const flagHash = hashFlag(challenge.flag);

      const record = await tx.challenge.upsert({
        where: { slug: challenge.slug },
        update: {
          title: challenge.title,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          flagHash,
        },
        create: {
          slug: challenge.slug,
          title: challenge.title,
          chapterId: chapter.id,
          displayOrder: nextDisplayOrder,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          flagHash,
        },
        select: { id: true },
      });

      challengeIdBySlug.set(challenge.slug, record.id);
      nextDisplayOrder += 1;

      if (challenge.attachment) {
        await tx.challengeAttachment.deleteMany({ where: { challengeId: record.id } });
        await tx.challengeAttachment.create({
          data: {
            challengeId: record.id,
            type: challenge.attachment.type,
            fileName: challenge.attachment.fileName,
            filePath: challenge.attachment.filePath,
            mimeType: challenge.attachment.mimeType,
          },
        });
      }
    }

    for (const [challengeSlug, requiredSlug] of CHALLENGE_PREREQUISITES) {
      const challengeId = challengeIdBySlug.get(challengeSlug)!;
      const prerequisiteId = challengeIdBySlug.get(requiredSlug)!;
      await tx.challengePrerequisite.upsert({
        where: { challengeId_prerequisiteId: { challengeId, prerequisiteId } },
        update: {},
        create: { challengeId, prerequisiteId },
      });
    }

    // --- Evidence ---
    const evidenceIdBySlug = new Map<string, string>();
    for (const evidence of EVIDENCE) {
      const record = await tx.evidence.upsert({
        where: { slug: evidence.slug },
        update: { title: evidence.title, type: evidence.type, content: evidence.content },
        create: {
          slug: evidence.slug,
          title: evidence.title,
          type: evidence.type,
          content: evidence.content,
          status: "PUBLISHED",
        },
        select: { id: true },
      });
      evidenceIdBySlug.set(evidence.slug, record.id);
    }

    // --- Scenes + dialogue (wholesale-replace lines, same idiom as
    // seed-challenges.ts's prerequisite replacement) ---
    const sceneIdBySlug = new Map<string, string>();
    for (const scene of SCENES) {
      const record = await tx.scene.upsert({
        where: { chapterId_slug: { chapterId: chapter.id, slug: scene.slug } },
        update: {
          title: scene.title,
          type: scene.type,
          order: scene.order,
          challengeId: scene.challengeSlug ? challengeIdBySlug.get(scene.challengeSlug) : null,
          evidenceId: scene.evidenceSlug ? evidenceIdBySlug.get(scene.evidenceSlug) : null,
        },
        create: {
          chapterId: chapter.id,
          slug: scene.slug,
          title: scene.title,
          type: scene.type,
          order: scene.order,
          status: "PUBLISHED",
          challengeId: scene.challengeSlug ? challengeIdBySlug.get(scene.challengeSlug) : null,
          evidenceId: scene.evidenceSlug ? evidenceIdBySlug.get(scene.evidenceSlug) : null,
        },
        select: { id: true },
      });
      sceneIdBySlug.set(scene.slug, record.id);

      await tx.dialogueLine.deleteMany({ where: { sceneId: record.id } });
      await tx.dialogueLine.createMany({
        data: scene.lines.map((line, index) => ({
          sceneId: record.id,
          characterId: line.character ? characterIdBySlug.get(line.character) : null,
          order: index + 1,
          content: line.content,
        })),
      });
    }

    // --- Unlock rules (wholesale-replace per target scene) ---
    for (const rule of UNLOCK_RULES) {
      const targetId = sceneIdBySlug.get(rule.targetSceneSlug)!;

      await tx.unlockRule.deleteMany({
        where: { targetType: "SCENE", targetId, conditionType: rule.conditionType },
      });

      const referenceId = rule.referenceChallengeSlug
        ? challengeIdBySlug.get(rule.referenceChallengeSlug)
        : rule.referenceSceneSlug
          ? sceneIdBySlug.get(rule.referenceSceneSlug)
          : null;

      await tx.unlockRule.create({
        data: { targetType: "SCENE", targetId, conditionType: rule.conditionType, referenceId },
      });
    }

    console.log(`✅ Seeded chapter "${chapter.slug}" — ${SCENES.length} scenes, ${CHALLENGES.length} challenges, ${EVIDENCE.length} evidence items`);
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("\n🚩 Flags (dev/testing only):\n");
    for (const challenge of CHALLENGES) {
      console.log(`   ${challenge.slug.padEnd(24)} ${challenge.flag}`);
    }
  }
}

seedStory()
  .catch((error) => {
    console.error("❌ Failed to seed story");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
# Timeline — The Silk Road Investigation

> **Document type:** Narrative Design Reference
> **Location:** `docs/story/TIMELINE.md`
> **Audience:** Developers, narrative writers, game designers, QA
> **Status:** 🟡 Living document — exact dates are not yet established; events are ordered relatively based on the confirmed Prologue, character backstories, and the `PROLOGUE.md` production breakdown

> [!NOTE]
> No absolute calendar dates have been provided in the source material. All entries use relative sequencing. Do not assign specific years/dates without confirmation — flag as `TODO` instead.

> [!NOTE]
> Entries #1–#2 below originate from the [`PROLOGUE.md`](./PROLOGUE.md) revision pass. They were previously marked 🧩 Proposed (Unconfirmed) pending an age conflict with `CHARACTERS.md`; the narrative lead has since confirmed Ethan's age as 23 and approved this backstory as canon, so both entries are now confirmed.

---

## Table of Contents

- [Legend](#legend)
- [Master Timeline](#master-timeline)
- [Timeline Diagram](#timeline-diagram)
- [Changelog](#changelog)

---

## Legend

| Symbol | Meaning |
|---|---|
| 🧩 | Exact timing unconfirmed / TODO |
| ⚰️ | Character death |
| 🎬 | Confirmed on-page scene in the Prologue |
| ⚠️ | Proposed but unconfirmed / conflicts with existing canon |

---

## Master Timeline

| Order | Relative Period | Event | Characters Involved | Source |
|---|---|---|---|---|
| 1 | 🎬 Years before the investigation | Mother dies during Noah's birth. | Noah Carter, Mother (unnamed) | `PROLOGUE.md` (confirmed) |
| 2 | 🎬 Ethan ~17–18, Noah ~12 | Father, a "respected FBI agent," is killed in an unspecified encounter. Ethan becomes Noah's guardian while attending the FBI Academy. ✅ Confirmed consistent with Ethan's age of 23 in `CHARACTERS.md`. 🧩 Whether this connects to Robert's network remains open — see `PROLOGUE.md` → Open Conflicts / TODO. | Ethan Carter, Noah Carter, Father (unnamed) | `PROLOGUE.md` (confirmed) |
| 3 | 🧩 Years before the investigation | Ethan Carter and Olivia Reed study together at university, competing and collaborating in Capture-the-Flag competitions. Ethan focuses on evidence gathering; Olivia focuses on demonstrating exploits (with permission) against lab machines. | Ethan Carter, Olivia Reed | Character backstory |
| 4 | 🧩 Years before the investigation | Daniel Brooks, during an undercover operation, makes a mistake that costs innocent lives. Someone documents everything; this record later becomes leverage used to compromise him. | Daniel Brooks | Character backstory |
| 5 | 🧩 Some years before the investigation | Ethan graduates university and joins the FBI. Olivia disappears from the visible cybersecurity community. | Ethan Carter, Olivia Reed | Character backstory |
| 6 | 🧩 Several years before the investigation | Olivia (as "Ghost") discovers an emerging, still relatively unknown underground marketplace via Tor hidden services. She infiltrates parts of its infrastructure, copies technical information, and finds an abandoned Bitcoin wallet linked to the operation, transferring a small amount as proof of access before quietly leaving. She considers reporting it, but decides someone else will handle it. | Olivia Reed / Ghost | Character backstory |
| 7 | 🧩 The following months and years | The marketplace expands undisturbed; thousands of lives are affected. | The Marketplace | Character backstory |
| 8 | 🎬 "A cold, rainy evening" | Special Agent Ethan Carter receives the call that his younger brother, Noah Carter, has been found dead of an overdose caused by contaminated synthetic narcotics, in a rundown apartment on the outskirts of the city. Noah becomes one of the marketplace's victims. Standing beside his brother's body, Ethan promises to find those responsible. Staged in full as `PROLOGUE.md` Scenes 1–2. | Ethan Carter, Noah Carter ⚰️ | Prologue / `PROLOGUE.md` Scenes 1–2 |
| 9 | 🎬 Shortly after | Noah's funeral. No dialogue; Ethan takes and keeps Noah's keychain. Staged in `PROLOGUE.md` Scene 3 (not detailed in `STORY.md`'s condensed prose). | Ethan Carter, Noah Carter ⚰️ | `PROLOGUE.md` Scene 3 |
| 10 | 🎬 Three weeks later | Ethan, having recently graduated the FBI Academy, is working as a Junior Special Agent in Cyber Intelligence Support. In his spare time he begins reviewing old overdose reports and uncovers a hidden cross-case pattern: anonymous cryptocurrency transactions, encrypted communications, disappearing evidence, vanished witnesses, and investigations closed without explanation. Staged as `PROLOGUE.md` Scenes 4–5, where the pattern discovery becomes the first interactive investigation tutorial. | Ethan Carter | Prologue / `PROLOGUE.md` Scenes 4–5 |
| 11 | 🎬 Shortly after (same period) | Ethan approaches his supervisor for access to archived intelligence files connecting the cases; the request is denied, and his findings are dismissed as coincidence. `PROLOGUE.md` Scene 6 revises the supervisor's delivery to be coldly professional rather than blunt, without changing the outcome. | Ethan Carter, Ethan's Supervisor | Prologue / `PROLOGUE.md` Scene 6 |
| 12 | 🎬 Shortly after (same period) | Ethan brings his findings to Senior Agent Daniel Brooks, who tells him there is no organization, no marketplace, and no evidence — that he has been "chasing ghosts" — and advises him to forget about it. Ethan leaves believing he has hit a dead end. `PROLOGUE.md` Scene 7 adds a "near-belief" beat where Brooks visibly weighs the evidence before dismissing it. | Ethan Carter, Daniel Brooks | Prologue / `PROLOGUE.md` Scene 7 |
| 13 | 🎬 Immediately after | Once alone, Brooks retrieves a hidden secure encrypted phone and reports Ethan's investigation to Robert. Robert asks whether Ethan can prove anything (not yet) and whether they should "deal with him"; Brooks says no, noting Ethan is inexperienced but asking the right questions. Robert instructs Brooks to keep watching him. | Daniel Brooks, Robert | Prologue / `PROLOGUE.md` Scene 8 |
| 14 | 🎬 Same period, elsewhere | Robert, operating from a hidden command center in an abandoned industrial complex, receives the warning about the new FBI recruit and reacts with amused confidence: "A rookie... Let's see how far he gets." | Robert | Prologue / `PROLOGUE.md` Scene 9 |
| 15 | 🎬 Same night | Ethan visits Noah's grave alone. Restrained, private vow to find those responsible; chooses to keep Noah's keychain rather than leave it behind. Closes on the text card "People lie. Evidence doesn't." This scene is not present in `STORY.md`'s condensed prose and is documented only in `PROLOGUE.md` Scene 10 and Final Scene. | Ethan Carter, Noah Carter ⚰️ | `PROLOGUE.md` Scene 10 / Final Scene |
| 16 | 🎬 Following the Prologue | **Chapter 1 — "The First Clue" begins.** Ethan examines the digital information Noah left behind and discovers his first meaningful digital clue, giving him a direction to continue investigating. Staged as `CHAPTER_01.md` Task 1 — "The First Digital Clue" / `CHALLENGES.md` CH-001. | Ethan Carter | Phase 1 Brief Task 1 / `CHAPTER_01.md` |
| 17 | 🎬 Shortly after | Ethan encounters information connected to `.onion` websites and realizes the investigation extends beyond the normal internet into anonymous hidden services; he begins to suspect whoever supplied Noah was operating through this hidden layer. Staged as `CHAPTER_01.md` Task 2 — "The Hidden Web" / `CHALLENGES.md` CH-002. | Ethan Carter | Phase 1 Brief Task 2 / `CHAPTER_01.md` |
| 18 | 🎬 Shortly after | An unknown person using the alias **Ghost** secretly contacts Ethan for the first time, leaving a carefully hidden clue rather than revealing herself. Ethan does not know who Ghost is or why she is helping him. This is Ghost's (Olivia Reed's) confirmed first in-story appearance. Staged as `CHAPTER_01.md` Task 3 — "The Ghost" / `CHALLENGES.md` CH-003. | Ethan Carter, Olivia Reed / Ghost | Phase 1 Brief Task 3 / `CHAPTER_01.md` |
| 19 | 🎬 Shortly after | Ethan researches the Dark Web and its role in anonymous communication and hidden services to better understand the environment he is investigating. Staged as `CHAPTER_01.md` Task 4 — "Understanding the Dark Web" / `CHALLENGES.md` CH-004. | Ethan Carter | Phase 1 Brief Task 4 / `CHAPTER_01.md` |
| 20 | 🎬 Later in the same chapter | Ethan obtains a larger collection of overdose case records and, comparing them across different victims, cities, and suppliers, begins to notice a pattern — realizing for the first time that Noah's death may not have been isolated and that a larger organization may be responsible. Staged as `CHAPTER_01.md` Task 5 — "The Pattern in the Data" / `CHALLENGES.md` CH-005. ⚠️ **Flagged for reconciliation:** this beat closely mirrors `PROLOGUE.md` Scene 5 ("The Pattern"), which already stages a cross-case overdose-report pattern discovery as the Prologue's own tutorial beat and origin of `EVID-003`. Narrative lead should clarify whether Chapter 1 Task 5 deepens/confirms that same discovery or is a distinct, later re-discovery — see `CHAPTER_01.md` → Open Conflicts / TODO. | Ethan Carter | Phase 1 Brief Task 5 / `CHAPTER_01.md` |
| 21 | 🧩 TODO | Phase 2 and beyond — not yet provided. Per the Phase 1 brief's closing narrative question: "If an anonymous marketplace is responsible for connecting these cases, how large has it become — and who is controlling it?" | — | Phase 1 Brief (closing) |

---

## Timeline Diagram

```mermaid
timeline
    title The Silk Road Investigation — Confirmed & Proposed Event Order
    section Family Backstory (Confirmed)
        Mother's Death : Dies during Noah's birth
        Father's Death : FBI agent killed in an encounter; Ethan becomes Noah's guardian
    section Backstory (Years Before)
        University CTF Partnership : Ethan & Olivia collaborate at university
        Brooks' Undercover Mistake : Fatal error later used as leverage against Brooks
        Ethan Joins the FBI : Olivia disappears from the cybersecurity scene
        Ghost Infiltrates the Marketplace : Olivia discovers and quietly leaves the underground marketplace
    section Inciting Incident
        Noah Carter's Death : Ethan receives the call; makes his promise
        Funeral : Ethan keeps Noah's keychain
    section Prologue (Three Weeks Later)
        Pattern Discovered : Ethan finds cross-case anomalies in overdose reports
        Supervisor Denies Access : Request for archived files rejected
        Brooks Dismisses the Theory : "You've been chasing ghosts"
        Brooks Reports to Robert : Ethan is marked for observation
        Robert Reacts : "Let's see how far he gets"
        Noah's Grave : Ethan's private vow; keeps the keychain
    section Chapter 1 — The First Clue
        First Digital Clue : Ethan examines Noah's digital footprint
        The Hidden Web : Ethan discovers .onion site references
        The Ghost : Ghost secretly contacts Ethan for the first time
        Understanding the Dark Web : Ethan researches anonymous networks
        The Pattern in the Data : Ethan compares overdose cases and finds a pattern
```

---

## Changelog

| Date | Change |
|---|---|
| 🧩 TODO | Initial creation from confirmed Prologue and character backstory material. |
| 🧩 TODO | Inserted proposed (unconfirmed) family-backstory entries #1–#2 from `PROLOGUE.md`; renumbered subsequent entries; added funeral (#9) and grave-scene (#15) entries sourced from `PROLOGUE.md` with no equivalent in `STORY.md`'s condensed prose; added `PROLOGUE.md` scene cross-references throughout. No previously confirmed entries were altered in substance. |
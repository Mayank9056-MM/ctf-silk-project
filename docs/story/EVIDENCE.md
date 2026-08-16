# Evidence — The Silk Road Investigation

> **Document type:** Production Reference
> **Location:** `docs/story/EVIDENCE.md`
> **Audience:** Challenge creators, narrative writers, QA, developers
> **Status:** 🟡 Living document — this catalog should be updated every time a new piece of narrative or in-game evidence is introduced

This document tracks every piece of evidence referenced in the story and every evidence item implemented in the CTF, so challenge creators can keep gameplay clues consistent with established narrative facts.

---

## Table of Contents

- [Purpose](#purpose)
- [Narrative Evidence Motifs (Confirmed)](#narrative-evidence-motifs-confirmed)
- [Named Evidence Items](#named-evidence-items)
- [Evidence Catalog Template](#evidence-catalog-template)
- [Chain-of-Custody Guidelines](#chain-of-custody-guidelines)
- [Changelog](#changelog)

---

## Purpose

Evidence in *The Silk Road Investigation* is not decorative — it is the primary mechanism through which the player advances the story, consistent with Ethan Carter's core philosophy:

> "People lie. Evidence doesn't."

This file exists so that every challenge creator implementing a CTF puzzle can check what evidence has already been established narratively, avoid contradictions, and log new evidence in one central place.

---

## Narrative Evidence Motifs (Confirmed)

The Prologue establishes several recurring categories of evidence that define the "pattern nobody saw." These motifs should be treated as the toolbox for early-game challenge design:

- [ ] Anonymous cryptocurrency transactions
- [ ] Encrypted communications
- [ ] Disappearing evidence (files/records that vanish from the record)
- [ ] Witnesses who suddenly vanish
- [ ] Investigations quietly closed without explanation

> [!TIP]
> Each of these five motifs maps naturally onto a CTF challenge category — see [`CHALLENGES.md`](./CHALLENGES.md) for the category breakdown.

---

## Named Evidence Items

| Evidence ID | Name | Description | Related Character(s) | Status |
|---|---|---|---|---|
| EVID-001 | Official Cause-of-Death Report (Noah Carter) | States: "Cause of Death: Acute overdose caused by highly contaminated synthetic narcotics." | Noah Carter, Ethan Carter | 🎬 Confirmed in Prologue |
| EVID-002 | Abandoned Bitcoin Wallet Transaction | An abandoned Bitcoin wallet associated with the marketplace's operation; Ghost transferred a small amount from it years ago as proof she had reached the target infrastructure. | Olivia Reed / Ghost, The Marketplace | 🎬 Confirmed in character backstory |
| EVID-003 | Cross-Case Overdose Report Pattern | Hundreds of overdose case files across different cities/suppliers that Ethan connects via recurring anomalies. | Ethan Carter | 🎬 Confirmed in Prologue |
| EVID-004 | Secure Encrypted Phone (Brooks) | Hidden inside Brooks' desk; used to report directly to Robert. | Daniel Brooks, Robert | 🎬 Confirmed in Prologue |
| EVID-005 | Old Newspaper Clipping (Brooks) | Kept hidden in Brooks' desk; relates to his failed undercover operation. Exact contents not yet described. | Daniel Brooks | 🎬 Referenced in character backstory — content 🧩 TODO |
| EVID-006 | Noah's Keychain | Kept by Ethan; introduced at the crime scene (`PROLOGUE.md` Scene 2) and again at Noah's grave (`PROLOGUE.md` Scene 10), where Ethan chooses to pocket it rather than leave it behind. Recurring emotional prop, not a puzzle artifact. | Ethan Carter, Noah Carter | 🎬 Confirmed in `PROLOGUE.md` — logged here for the first time; previously referenced by `CHARACTERS.md` without a catalog entry |
| EVID-007 | Noah's Recovered Cloud Backup | Digital effects (phone export, laptop backup, cloud archive) released to Ethan under next-of-kin authorization. Contains a recovered file with metadata pointing to a non-standard domain suffix. | Ethan Carter, Noah Carter | 🎬 Confirmed in `CHAPTER_01.md` Task 1 |
| EVID-008 | Onion Service Reference | A partial, obscured `.onion` address surfaced from browser/network artifacts tied to the same account as EVID-007. Incomplete — not independently usable. | Ethan Carter | 🎬 Confirmed in `CHAPTER_01.md` Task 2 |
| EVID-009 | Ghost's First Contact | Anonymous, unsigned message to Ethan's work inbox containing a hidden/encoded clue that completes the partial address in EVID-008. Olivia Reed / Ghost's first confirmed in-story contact. | Ethan Carter, Olivia Reed / Ghost | 🎬 Confirmed in `CHAPTER_01.md` Task 3 |
| EVID-010 | Dark Web Primer / Annotated Hidden-Service Descriptor | Ethan's own annotated research notes on Tor and hidden services, produced while working through EVID-008/EVID-009. | Ethan Carter | 🎬 Confirmed in `CHAPTER_01.md` Task 4 |
| EVID-011 | Multi-City Case Comparison Set | A larger overdose case record set (multiple cities/suppliers) that, cross-referenced against EVID-003 and EVID-007–EVID-010, surfaces a shared low-value cryptocurrency touchpoint linking Noah's supply chain to at least two other victims. | Ethan Carter | 🎬 Confirmed in `CHAPTER_01.md` Task 5 |

---

## Evidence Catalog Template

Use this table to log new evidence items as challenges are built. Copy the row format below into the table above once an item is finalized.

| Evidence ID | Name | Type | Related Challenge | Related Character | Chain of Custody | Notes |
|---|---|---|---|---|---|---|
| EVID-0XX | 🧩 TODO | 🧩 TODO (Document / Digital File / Physical Object / Testimony / Financial Record) | 🧩 TODO | 🧩 TODO | 🧩 TODO | 🧩 TODO |

**Field Guide**

- **Evidence ID** — Unique identifier, format `EVID-0XX`, sequential.
- **Name** — Short, in-fiction display name.
- **Type** — Document, Digital File, Physical Object, Testimony, or Financial Record.
- **Related Challenge** — Cross-reference the `Challenge ID` from [`CHALLENGES.md`](./CHALLENGES.md).
- **Related Character** — Cross-reference [`CHARACTERS.md`](./CHARACTERS.md).
- **Chain of Custody** — Who discovered it, and in what order it was handled in-fiction (relevant for narrative consistency and for any "chain of custody" style puzzle mechanics).
- **Notes** — Anything a challenge creator needs to know before building content around this item.

---

## Chain-of-Custody Guidelines

> [!IMPORTANT]
> Because the story's central theme is that institutions suppress or lose evidence, any evidence design should reinforce — not contradict — the established pattern of disappearing records. When designing a challenge, consider explicitly whether this piece of evidence:
> 1. Was meant to be found (a deliberate leak/clue, e.g., something Ghost surfaces), or
> 2. Was meant to be hidden/destroyed (something the player recovers despite the marketplace's efforts).

---

## Changelog

| Date | Change |
|---|---|
| 🧩 TODO | Initial creation; five named evidence items logged from confirmed Prologue and character material. |
| 2026-08-15 | Logged EVID-006 (Noah's keychain), previously referenced by `CHARACTERS.md`/`PROLOGUE.md` but never catalogued here. Added EVID-007–EVID-011 from `CHAPTER_01.md` Tasks 1–5. No previously confirmed entries altered. |
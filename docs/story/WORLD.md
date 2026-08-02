# World — The Silk Road Investigation

> **Document type:** Narrative Design Reference
> **Location:** `docs/story/WORLD.md`
> **Audience:** Developers, narrative writers, game designers, artists, UI/UX designers
> **Status:** 🟡 Living document — world detail is limited to what the Prologue, `PROLOGUE.md`, and character backstories confirm; most geographic and institutional detail is `TODO`

This document is the "atlas" of the game world: locations, institutions, tone, and the full relationship map connecting every character and organization introduced so far.

---

## Table of Contents

- [World Snapshot](#world-snapshot)
- [Known Locations](#known-locations)
- [Institutions & Factions](#institutions--factions)
- [Tone & Visual Identity](#tone--visual-identity)
- [Full Relationship Diagram](#full-relationship-diagram)
- [Location Map (Conceptual)](#location-map-conceptual)
- [Changelog](#changelog)

---

## World Snapshot

| Field | Value |
|---|---|
| Time Period | Present day (contemporary setting implied by FBI, cryptocurrency, Tor, encrypted phones) |
| Country / Region | 🧩 TODO — not specified in source material |
| Core Conflict | A rookie FBI agent investigating a hidden global narcotics marketplace vs. an untouchable criminal leader who has compromised the agent's own mentor |
| Central Institutions | Federal Bureau of Investigation; The Marketplace / Robert's Network |
| Central Technology Motifs | Cryptocurrency, encrypted communications, Tor hidden services, digital forensics, OSINT |

---

## Known Locations

| Location | Description | Associated Character(s) | Status |
|---|---|---|---|
| Rundown apartment, outskirts of the city | Where Noah Carter was found dead. | Noah Carter | 🎬 Confirmed |
| FBI office (Ethan's supervisor) | Where Ethan's request for archive access is denied. | Ethan Carter, Ethan's Supervisor | 🎬 Confirmed |
| Daniel Brooks' office | Contains commendations on the walls, a desk with a hidden secure encrypted phone and an old newspaper clipping. Where Brooks tells Ethan to "forget about it," and where Brooks secretly calls Robert. | Ethan Carter, Daniel Brooks | 🎬 Confirmed |
| Abandoned industrial complex (hidden command center) | Robert's base of operations; dozens of monitors track cryptocurrency transfers, encrypted messages, shipment routes, and dark-web transactions. | Robert | 🎬 Confirmed |
| Olivia Reed's apartment | Filled with monitors, notebooks, old hard drives, and whiteboards covered in network diagrams — her home research lab. | Olivia Reed / Ghost | 🎬 Confirmed (character profile) |
| University (unnamed) | Where Ethan and Olivia met and competed in CTF competitions. | Ethan Carter, Olivia Reed | 🎬 Confirmed (character backstory) |
| Cemetery / grave site | Site of Noah's funeral (`PROLOGUE.md` Scene 3) and Ethan's later private visit (`PROLOGUE.md` Scene 10). Exact name/location not yet specified. | Ethan Carter, Noah Carter | 🎬 Confirmed in `PROLOGUE.md` — 🧩 name/location TODO |

> 🧩 **TODO** — No city, state, or country has been specified for any location. Do not assign a real-world city without confirmation.

---

## Institutions & Factions

See [`ORGANIZATIONS.md`](./ORGANIZATIONS.md) for full detail. Summary:

- **Federal Bureau of Investigation** — public law enforcement institution; internally compromised at at least one senior level.
- **The Marketplace** — hidden global narcotics distribution network; officially denied to exist.
- **Robert's Network** — the command/leverage structure behind The Marketplace, capable of compromising federal agents.

---

## Tone & Visual Identity

| Element | Direction |
|---|---|
| Overall Mood | Quiet procedural tension; grief-driven persistence; institutional menace rather than overt violence |
| Color Language | Cold blues/greys for FBI and hacking spaces; warm neutral tones for outwardly "trustworthy" institutional spaces (e.g., Brooks' office) masking hidden corruption; near-black/red accents reserved for Robert's hidden command center |
| Sound Design Direction | Restraint-driven: several `PROLOGUE.md` scenes (funeral, grave) are deliberately dialogue-free, relying on ambient sound (rain, shovel) to carry the emotional beat — see `PROLOGUE.md` → Pacing & Silence Notes |
| UI Motifs | Whiteboard/corkboard with red string (Ethan's investigation style); terminal/monitor walls (Robert's command center); notebook and case-file aesthetics; Noah's keychain as a recurring emotional prop (see `EVIDENCE.md` → EVID-006) |

---

## Full Relationship Diagram

```mermaid
graph TD
    Noah["Noah Carter ⚰️<br/>Victim"]
    Ethan["Ethan Carter ✅<br/>Junior Special Agent, FBI"]
    Supervisor["Ethan's Supervisor 🧩<br/>Unnamed"]
    Brooks["Daniel Brooks 🎭<br/>Senior Supervisory Special Agent"]
    Olivia["Olivia Reed 🕵️<br/>a.k.a. Ghost"]
    Robert["Robert 🕵️<br/>Marketplace Leader"]
    Marketplace["The Marketplace<br/>Underground Narcotics Network"]
    FBI["Federal Bureau of Investigation"]
    Mother["Mother 🧩⚰️<br/>Proposed / Unconfirmed"]
    Father["Father 🧩⚰️<br/>Proposed / Unconfirmed<br/>FBI Agent"]

    Noah -- "younger brother of" --> Ethan
    Marketplace -- "supplied contaminated narcotics that killed" --> Noah

    Ethan -- "member of" --> FBI
    Brooks -- "member of" --> FBI
    Supervisor -- "member of" --> FBI

    Ethan -- "reports to, denied access by" --> Supervisor
    Ethan -- "trusts, seeks help from" --> Brooks
    Brooks -. "secretly informs" .-> Robert
    Robert -- "leads" --> Marketplace

    Ethan -- "former university friend / CTF rival of" --> Olivia
    Olivia -. "anonymously guides investigation of<br/>(true identity unknown to Ethan)" .-> Ethan
    Olivia -- "years earlier, infiltrated" --> Marketplace
    Olivia -- "carries guilt over inaction regarding" --> Marketplace

    Mother -. "proposed parent of (unconfirmed)" .-> Ethan
    Mother -. "proposed parent of (unconfirmed)" .-> Noah
    Father -. "proposed parent of (unconfirmed)" .-> Ethan
    Father -. "proposed parent of (unconfirmed)" .-> Noah

    classDef victim fill:#3a3a3a,color:#fff,stroke:#888;
    classDef protagonist fill:#123c5c,color:#fff,stroke:#4a90d9;
    classDef compromised fill:#4a2020,color:#fff,stroke:#a54a4a;
    classDef hidden fill:#1f2a44,color:#fff,stroke:#4a6fa5;
    classDef antagonist fill:#000,color:#fff,stroke:#a51c1c;
    classDef institution fill:#2a2a2a,color:#fff,stroke:#666;
    classDef proposed fill:#2a2a1a,color:#fff,stroke:#c9a227,stroke-dasharray: 4 3;

    class Noah victim;
    class Ethan protagonist;
    class Brooks compromised;
    class Olivia hidden;
    class Robert,Marketplace antagonist;
    class FBI,Supervisor institution;
    class Mother,Father proposed;
```

---

## Location Map (Conceptual)

```mermaid
graph LR
    subgraph PublicWorld["Visible World"]
        Apartment["Rundown Apartment<br/>(Noah's death)"]
        FBIOffice["FBI Offices<br/>(Supervisor + Brooks)"]
        University["University<br/>(Ethan & Olivia's past)"]
        Cemetery["Cemetery / Grave Site<br/>(Funeral + Ethan's private visit)"]
    end

    subgraph HiddenWorld["Hidden World"]
        OliviaLab["Olivia's Apartment<br/>(Home Research Lab)"]
        Complex["Abandoned Industrial Complex<br/>(Robert's Command Center)"]
        TorNetwork["Tor Hidden Services<br/>(The Marketplace)"]
    end

    Apartment -.->|"evidence trail leads to"| FBIOffice
    Apartment -.->|"leads to"| Cemetery
    FBIOffice -.->|"Brooks secretly reports to"| Complex
    OliviaLab -.->|"years-old infiltration of"| TorNetwork
    Complex -->|"commands"| TorNetwork
```

---

## Changelog

| Date | Change |
|---|---|
| 🧩 TODO | Initial creation from confirmed Prologue and character backstory material. |
| 🧩 TODO | Added Cemetery / grave site location and Location Map node from `PROLOGUE.md`; added proposed Mother/Father nodes (unconfirmed) to the Full Relationship Diagram; noted Pacing & Silence direction under Tone & Visual Identity. |
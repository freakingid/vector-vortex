# ROADMAP — Vector Vortex

Changeset sequence from the current skeleton to ship. One line per changeset:
what it ships, which GDD sections it covers.

⛔ **This file is a plan, not a contract.** A changeset's real scope is its
`PLANNED-FEATURES-CS0##.md`, written just before it starts. Renumbering later
changesets is expected and cheap; editing a spec doc mid-flight is not.

---

## The sequence

| CS | What ships | GDD §§ |
|---|---|---|
| **CS001** | Repo skeleton, the sixteen well definitions, the depth model, static well rendering, `tools/well-lab.html` | §3, §16 |
| **CS002** | Fixed-timestep loop, one input struct across four devices, Skimmer movement and snap assist, shots, `tools/feel-lab.html` | §2, §4.1–4.2, §9, §16.1 |
| **CS003** | Entity spine: the class contract, spawner, collision, the Vaulter, well-clear, death and respawn, the Purge | §4.3–4.5, §6.1, §6.3, §6.5 |
| **CS004** | The rest of the Classic roster: Carrier and its three variants, Weaver, Thorn, Drifter, Surger | §6.1–6.3 |
| **CS005** | Level flow: the Dive, well progression and colour bands, the heat clock, the introduction schedule, telemetry as the tuning instrument | §5, §3.6–3.7, §8, §15.6 |
| **CS006** | Front of house: scoring and extra lives, HUD, screen state machine, title → mode → Start Depth → play → game over | §4.6, §7, §10.4, §13 |
| **CS007** | Audio engine: `AudioSys` + `MusicSys`, per-frame lookahead scheduler, voices, `tools/music-lab.html` with the per-layer solo button, Classic SFX | §11.1–11.3, §11.7–11.8 |
| **CS008** | The intensity director: live-danger signal, filter sweep, two or three earned layers, the solo audition | §11.4–11.6 |
| **CS009** | Meta: kit profiles, local top-10 per mode, leaderboard wiring, achievements | §15.1–15.5 |
| **CS010** | Overdrive core: mode flags, Jump, combo multiplier, the Reaver | §13, §14.2, §14.4, §14.6 |
| **CS011** | Overdrive tokens and the remaining enemies: five powerups, the Warden, the Mimic on probation | §14.1, §14.6 |
| **CS012** | The ring-flight Dive, hard-capped at 4 s / 6 rings | §14.5 |
| **CS013** | Onboarding: first-run prompts, attract mode, the teach-in-four-seconds pass on level 1 | §12 |
| **CS014** | Ship: performance budget on both targets, device matrix, 100-run soak, legal sweep, acceptance-criteria sweep | §17, §18, §19 |

---

## Why this order

**Control feel is provable at CS002, before anything can be shot.** P1 is the
pillar that cannot be recovered by tuning a constant later — a rim that feels
imprecise is a game nobody finishes, and every system built on top of a bad rim
has to be re-felt when it changes. CS002 ends with a measuring instrument
(`feel-lab`) and a traverse-and-stop number, not an impression.

**The music risk lands at CS008, mid-run, not at the end.** This is the one
system with a recorded prior failure. It cannot come earlier: the director's
trigger is live danger, so auditioning it requires a game that produces danger —
CS003 through CS006. CS008 is the first changeset where the audition is
meaningful, and it is followed by six more, so a failed audition has room to take
its named retreat (drop the `tier` fields; every gate builds always-on) without
threatening the ship date.

**A playable Classic game exists at CS006.** Everything after it is addition.
If the schedule breaks, the game that ships is Classic-only and complete rather
than Overdrive-half-done.

**Overdrive is sequenced by risk, cheapest first.** CS010 is flags and one
parameter-variant enemy. CS011 is content. CS012 is the only piece with a
different control model and the highest build cost, so it sits alone, late, and
cuttable in one commit.

⛔ **Cut order under schedule pressure, in this order:** CS012 (ring-flight
falls back to the Classic thorn-dodge), then the Mimic in CS011, then CS007's
third track — `title` plus one gameplay track is a shippable floor. None of
these three cuts touches another changeset's code.

---

## GDD open questions — all resolved

⛔ **GDD §21 carries no open questions.** All seven are resolved as of
2026-08-30; #1 and #4–#7 below were taken on the recommended defaults. Strike
them through in §21 the same way #2 and #3 already are, and append the
`DECISIONS.md` entry, before CS001 P3 starts.

| GDD §21 | Resolution | Lands in |
|---|---|---|
| #1 Dim band (§3.7) | Keep as specced: levels 65–80 at `DIM_BAND_ALPHA` 0.18, lanes lighting on occupancy, shot travel and Surger charge. Spend no tuning time on it — the renderer handles lane occupancy anyway, so the band is a few lines on top of work already required. Re-audition only if telemetry ever shows a player past level 65. | CS001 P3 |
| #4 Achievements | Local-only. The evaluator returns a payload-shaped object from day one, so server-backing later is wiring rather than a rewrite. | CS009 |
| #5 Aggregate telemetry | Strictly local CSV export. Nothing is posted anywhere. It is a tuning instrument and explicitly not anti-cheat; a destination adds a privacy surface for no tuning benefit. | CS005 |
| #6 Mimic | Build it. ~100 lines against an existing shot path, and the probation verdict needs a playtest rather than an argument. Cut it in CS014, without ceremony, if it reads cheap. | CS011, verdict in CS014 |
| #7 Track count | Three at launch: `title`, `pulse`, `drive`. `deep` and `rush` are new table entries with no code change, so they are post-ship content, not a scope cut. | CS007 |

⚠ **`STATUS.md`'s "no blocking open questions" line is now true.** It was ahead
of the GDD when CS002 was specced; the resolutions above close the gap.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Fourteen changesets, sized so each holds 3–5 phases of one session each | A phase that repeatedly overruns a session means the changeset was too coarse; split it rather than letting phases sprawl |
| 2 | Enemies split across CS003 and CS004: spine plus one enemy, then the roster | If the Vaulter turns out to exercise every hook in the entity contract, CS004 becomes mechanical and could merge into CS003 |
| 3 | Telemetry ships in CS005 with the heat clock, not in CS009 with the other meta systems | It is a tuning instrument, and the tuning it serves is difficulty. If difficulty tuning turns out to need nothing beyond `feel-lab`, move it back to CS009 |
| 4 | Meta (CS009) sits after audio, not before | Meta's only external dependency is the Worker registry entry, which Paul can make in parallel today. If that registration proves slow, move CS009 earlier |
| 5 | Front of house (CS006) comes before audio | The audio director reads score, combo, lives and level; specifying it against a real HUD and a real game-over path is cheaper than against placeholders |
| 6 | Onboarding is CS013, late | Prompts are cheap and depend on every system they name. Level 1's teach-in-four-seconds behaviour is a spawner tuning question already owned by CS005 |
| 7 | No changeset is reserved for refactoring | If the CS006 HUD and the CS009 meta screens end up duplicating layout code, propose a refactor changeset then — don't reserve time for a problem that may not appear |
| 8 | `ROADMAP.md` is its own file, not a section of `DECISIONS.md`. Paul's call, 2026-08-30 | It needs editing every time a changeset is renumbered, and `DECISIONS.md` is append-only. Adding it means one row in `CLAUDE.md`'s document map and one in GDD §16.4, both on the "on demand only" read contract |

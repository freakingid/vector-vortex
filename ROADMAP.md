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
| **CS004** | The Carrier and its split, the Weaver and its bolt, the Thorn; the `anchored` contract field and the debug spawn bench | §4.2, §4.5, §6.1–6.3, §6.5 |
| **CS005** | The Drifter and the Surger: lane-boundary riding and the `laneHop` fold-point fix, the discharge telegraph, the remaining two cargo rows | §6.1–6.3, §3.5 |
| **CS006** | Level flow: the Dive, well progression and colour bands, the heat clock, the introduction schedule, telemetry as the tuning instrument | §5, §3.6–3.7, §8, §15.6 |
| **CS007** | Front of house: scoring and extra lives, HUD, screen state machine, title → mode → Start Depth → play → game over | §4.6, §7, §10.4, §13 |
| **CS008** | Audio engine: `AudioSys` + `MusicSys`, per-frame lookahead scheduler, voices, `tools/music-lab.html` with the per-layer solo button, Classic SFX | §11.1–11.3, §11.7–11.8 |
| **CS009** | The intensity director: live-danger signal, filter sweep, two or three earned layers, the solo audition | §11.4–11.6 |
| **CS010** | Meta: kit profiles, local top-10 per mode, leaderboard wiring, achievements | §15.1–15.5 |
| **CS011** | Overdrive core: mode flags, Jump, combo multiplier, the Reaver | §13, §14.2, §14.4, §14.6 |
| **CS012** | Overdrive tokens and the remaining enemies: five powerups, the Warden, the Mimic on probation | §14.1, §14.6 |
| **CS013** | The ring-flight Dive, hard-capped at 4 s / 6 rings | §14.5 |
| **CS014** | Onboarding: first-run prompts, attract mode, the teach-in-four-seconds pass on level 1 | §12 |
| **CS015** | Ship: performance budget on both targets, device matrix, 100-run soak, legal sweep, acceptance-criteria sweep | §17, §18, §19 |

⛔ **The +1 renumber from CS005 onward landed with CS004's split** (2026-08-30)
and the sequence above is the corrected one. `PLANNED-FEATURES-CS004.md`
inventoried twelve in-repo pointers saying `CS005` meaning *level flow*; CS004
P1 found **seventeen**, plus twenty-two more that said `CS006` meaning *front of
house* and two that said `CS014` meaning *ship* — the whole tail shifted, not
just the one label — and swept all of them. If you find another, it means the
same thing: read it, decide what it meant, and add one.

**CS001 through CS004 are closed.** Their narratives are in `log/CS00#.md`;
`STATUS.md` carries only the changeset in flight. CS004's row below is what
actually shipped — three enemies, the bolt, `splitLanes()`, the seventh contract
field and the five-key debug bench — with ⚠ no introduction schedule and ⚠ no
scoring, both of which it deliberately left to CS006 and CS007.

---

## Why this order

**Control feel is provable at CS002, before anything can be shot.** P1 is the
pillar that cannot be recovered by tuning a constant later — a rim that feels
imprecise is a game nobody finishes, and every system built on top of a bad rim
has to be re-felt when it changes. CS002 ends with a measuring instrument
(`feel-lab`) and a traverse-and-stop number, not an impression.

**The Classic roster takes two changesets, split by risk, not by count.** CS004
is the three enemies that pour into CS003's contract as it shipped — the
Carrier's split is the spawner's first non-spawner caller, and the Thorn is what
`purgeable` and `blocksClear` were written for. CS005 is the two whose
*readability is the feature*: both the Drifter's visible invulnerability and the
Surger's telegraph carry a ⛔ in §6.3, both need geometry or rendering work the
spine did not anticipate, and both are the enemies whose failure mode is a death
the player cannot account for. The split is also forced — the Drifter Carrier
(L18) and Surger Carrier (L23) cannot be built before their cargo exists.

**The music risk lands at CS009, mid-run, not at the end.** This is the one
system with a recorded prior failure. It cannot come earlier: the director's
trigger is live danger, so auditioning it requires a game that produces danger —
CS003 through CS007. CS009 is the first changeset where the audition is
meaningful, and it is followed by six more, so a failed audition has room to take
its named retreat (drop the `tier` fields; every gate builds always-on) without
threatening the ship date.

**A playable Classic game exists at CS007.** Everything after it is addition.
If the schedule breaks, the game that ships is Classic-only and complete rather
than Overdrive-half-done.

**Overdrive is sequenced by risk, cheapest first.** CS011 is flags and one
parameter-variant enemy. CS012 is content. CS013 is the only piece with a
different control model and the highest build cost, so it sits alone, late, and
cuttable in one commit.

⛔ **Cut order under schedule pressure, in this order:** CS013 (ring-flight
falls back to the Classic thorn-dodge), then the Mimic in CS012, then CS008's
third track — `title` plus one gameplay track is a shippable floor. None of
these three cuts touches another changeset's code.

---

## GDD open questions — all resolved

⛔ **GDD §21 carries no open questions.** All seven are resolved as of
2026-08-30; #1 and #4–#7 below were taken on the recommended defaults.

| GDD §21 | Resolution | Lands in |
|---|---|---|
| #1 Dim band (§3.7) | Keep as specced: levels 65–80 at `DIM_BAND_ALPHA` 0.18, lanes lighting on occupancy, shot travel and Surger charge. Spend no tuning time on it — the renderer handles lane occupancy anyway, so the band is a few lines on top of work already required. Re-audition only if telemetry ever shows a player past level 65. | CS001 P3 — **shipped** |
| #4 Achievements | Local-only. The evaluator returns a payload-shaped object from day one, so server-backing later is wiring rather than a rewrite. | CS010 |
| #5 Aggregate telemetry | Strictly local CSV export. Nothing is posted anywhere. It is a tuning instrument and explicitly not anti-cheat; a destination adds a privacy surface for no tuning benefit. | CS006 |
| #6 Mimic | Build it. ~100 lines against an existing shot path, and the probation verdict needs a playtest rather than an argument. Cut it in CS015, without ceremony, if it reads cheap. | CS012, verdict in CS015 |
| #7 Track count | Three at launch: `title`, `pulse`, `drive`. `deep` and `rush` are new table entries with no code change, so they are post-ship content, not a scope cut. | CS008 |

---

## Still open, and not owned by a changeset

Design calls for Paul, all carried in `STATUS.md`. The first two are not enemy
questions, so CS004 did not touch them and CS005 will not either. The third is
an enemy question that only becomes reachable when the introduction schedule
lands, which is why it is named against CS006 rather than left unowned.

- **GDD §3.3's `throatOffset` is undefined.** No well uses it and the GDD never
  says what it offsets; `wellThroat()` defaults it to zero.
- ⚠ **A standing Thorn holds a spawner slot** (CS004 P5). `updateSpawner()`
  blocks on `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)`, a count
  of *everything* in the one array — so three Thorns nobody shoots hold the
  spawner shut and the well never clears. Unreachable in a played build today
  (⚠ `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]`, so no Weaver ever spawns);
  **live the moment CS006's introduction schedule lands Weavers at L5**, which
  makes it CS006's to answer rather than a standing task. Measured repro and the
  numbers are in `STATUS.md`.
- **The Flat well (11) is geometrically degenerate.** Its rim is a straight line,
  so it renders with zero depth. An offset throat is what would fix it, which is
  why it is the same question. The natural landing spot is **CS006** with well
  progression. ⚠ `STATUS.md` used to attribute a CS004 landing spot to this
  file, which was never in it; CS004 P1 corrected that line and both documents
  now say CS006.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Fifteen changesets, sized so each holds 3–5 phases of one session each | A phase that repeatedly overruns a session means the changeset was too coarse; split it rather than letting phases sprawl |
| 2 | Enemies split across three changesets: spine plus one enemy, then the three that fit the contract, then the two that need new machinery | Originally two. CS004's scope check found a contract field missing, a `laneHop` degeneracy the Drifter is the first entity to reach, and two cargo rows that cannot be built before their cargo. If CS005 turns out to be two clean sessions, merge it back and renumber again |
| 3 | Telemetry ships in CS006 with the heat clock, not in CS010 with the other meta systems | It is a tuning instrument, and the tuning it serves is difficulty. If difficulty tuning turns out to need nothing beyond `feel-lab`, move it back to CS010 |
| 4 | Meta (CS010) sits after audio, not before | Meta's only external dependency is the Worker registry entry, which Paul can make in parallel today. If that registration proves slow, move CS010 earlier |
| 5 | Front of house (CS007) comes before audio | The audio director reads score, combo, lives and level; specifying it against a real HUD and a real game-over path is cheaper than against placeholders |
| 6 | ⚠ **GDD §12's four-second promise is onboarding, and it is CS014's.** Settled 2026-08-30 | CS003 P5 flagged that this file and `STATUS.md` disagreed — this file read it as a spawner-tuning question for the level-flow changeset, `STATUS.md` read it as onboarding. `STATUS.md` wins: it needs spawn lanes weighted toward the player's lane, which is a *teaching* decision made against a first-run experience, not a difficulty curve. If CS006's heat pass finds it falls out of the spawner for free, take it there and note the move |
| 7 | No changeset is reserved for refactoring | If the CS007 HUD and the CS010 meta screens end up duplicating layout code, propose a refactor changeset then — don't reserve time for a problem that may not appear |
| 8 | `ROADMAP.md` is its own file, not a section of `DECISIONS.md`. Paul's call, 2026-08-30 | It needs editing every time a changeset is renumbered, and `DECISIONS.md` is append-only. Adding it means one row in `CLAUDE.md`'s document map and one in GDD §16.4, both on the "on demand only" read contract |
| 9 | The enemy palette is chosen as a set in CS004 P1, all six Classic colours at once, all ⚠ provisional | Picking four now and two in CS005 guarantees a clash, and `C` already carries forward-looking constants. `tools/glow-lab.html` remains unbuilt and unowned; whichever changeset takes the art pass owns it |
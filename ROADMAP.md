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
| **CS005** | The Drifter and the Surger: the boundary lattice and `laneHop`'s fold-bound parameter, the discharge telegraph, the remaining two cargo rows | §6.1–6.3, §3.5, §6.5 |
| **CS006** | The well ends: the Dive, well progression and the colour-band roll, `laneState` and the dim band, `throatOffset` and the two degenerate wells, GDD §4.5 item 5 | §3.3, §3.6–3.7, §5, §4.5 |
| **CS007** | The run escalates: the heat clock and every value derived from it, GDD §8.1's introduction schedule, the spawner-stall call, telemetry as the tuning instrument | §8, §8.1, §15.6 |
| **CS008** | Front of house: scoring and extra lives, HUD, screen state machine, title → mode → Start Depth → play → game over | §4.6, §7, §10.4, §13 |
| **CS009** | Audio engine: `AudioSys` + `MusicSys`, per-frame lookahead scheduler, voices, `tools/music-lab.html` with the per-layer solo button, Classic SFX | §11.1–11.3, §11.7–11.8 |
| **CS010** | The intensity director: live-danger signal, filter sweep, two or three earned layers, the solo audition | §11.4–11.6 |
| **CS011** | Meta: kit profiles, local top-10 per mode, leaderboard wiring, achievements | §15.1–15.5 |
| **CS012** | Overdrive core: mode flags, Jump, combo multiplier, the Reaver | §13, §14.2, §14.4, §14.6 |
| **CS013** | Overdrive tokens and the remaining enemies: five powerups, the Warden, the Mimic on probation | §14.1, §14.6 |
| **CS014** | The ring-flight Dive, hard-capped at 4 s / 6 rings | §14.5 |
| **CS015** | Onboarding: first-run prompts, attract mode, the teach-in-four-seconds pass on level 1 | §12 |
| **CS016** | Ship: performance budget on both targets, device matrix, 100-run soak, legal sweep, acceptance-criteria sweep | §17, §18, §19 |

⛔ **The sequence above has been renumbered +1 twice, and the second time is the
current one.** The first landed with CS004's split (2026-08-30):
`PLANNED-FEATURES-CS004.md` inventoried twelve in-repo pointers saying `CS005`
meaning *level flow*; CS004 P1 found **seventeen**, plus twenty-two more that
said `CS006` meaning *front of house* and two that said `CS014` meaning *ship* —
the whole tail shifted, not just the one label — and swept all of them.

⛔ **The second landed with CS006's split** (2026-08-30, CS006 P0): CS006 became
*the well ends*, a new CS007 became *the run escalates*, and everything from the
old CS007 onward shifted by one. The sweep read every `CS006`-and-later pointer
in `src/`, `scratchpad/` and the root documents and found **seventy-three**,
plus forty-seven renumbered labels in this file. ⛔ `log/` (34 hits) and
`archive/` (85 hits) were deliberately NOT swept — a closed record says what a
closed session believed, and correcting it is falsifying it. If you find another
live pointer, it means the same thing both times: read it, decide what it
*meant*, and correct it.

**CS001 through CS005 are closed.** Their narratives are in `log/CS00#.md`;
`STATUS.md` carries only the changeset in flight. CS004's row above is what
actually shipped — three enemies, the bolt, `splitLanes()`, the seventh contract
field and the five-key debug bench — with ⚠ no introduction schedule and ⚠ no
scoring, both of which it deliberately left to CS007 and CS008.

**CS005 held as ONE changeset and did not want the seam after P2.** Five phases,
in the order the row above names them: the boundary lattice (P1), the Drifter
(P2), the Surger (P3), the two cargo rows (P4), the soak and the close (P5). The
plan's own worry was that P1's geometry plus two entities plus two cargo rows
was two changesets' work; it was not, and the reason is that ⛔ **P1 shipped no
entity.** A phase of pure geometry, pinned bit-identical to the previous build
by a 16,856-case sweep, is what let P2 and P3 each be one entity against a
settled helper rather than an entity *and* an argument about lane arithmetic.
⚠ The one thing that did grow past its estimate was `src/07-enemies.js` — see
below, and it is CS012's.

**What CS005 shipped against the row: everything, plus one field mutation the
plan did not have.** The Classic roster is complete at six, GDD §6.2's variant
table is complete at three, and four of GDD §4.5's five death conditions are
live (only item 5, a Thorn during the Dive, is unwired, and it is not a
`killDepth`). ⛔ The Surger expresses §4.5 item 3 by **mutating `killDepth` to
`0` and restoring it** rather than by an eighth contract field or a branch in
the collision pass — recorded in GDD §6.5 and `DECISIONS.md`, and the roster's
first mutated contract field.

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

**The music risk lands at CS010, mid-run, not at the end.** This is the one
system with a recorded prior failure. It cannot come earlier: the director's
trigger is live danger, so auditioning it requires a game that produces danger —
CS003 through CS008. CS010 is the first changeset where the audition is
meaningful, and it is followed by six more, so a failed audition has room to take
its named retreat (drop the `tier` fields; every gate builds always-on) without
threatening the ship date.

**Level flow is two changesets, split by cause, not by size.** The old CS006
carried five systems and the seam is visible once the files are counted: the
well half (progression, the band roll, `laneState`, `throatOffset`, the Dive)
and the run half (the heat clock, the introduction schedule, the spawner-stall
call, telemetry) **share exactly one file, `23-main.js`, and they share it in two
different functions.** The well is CS006; the run is CS007.

⛔ **The split's real justification is `test-cs004-p1.js`'s `GOLDEN_LANES`, and
both halves move it.** The Dive changes when level 2 starts inside the golden's
3,000-tick window; heat changes the spawn interval; the introduction schedule
changes the draw count per spawn. Split, that is **two small, separately-reasoned
re-records** instead of one large one that absorbs three unrelated causes at
once — and a re-record is the one moment a stray RNG draw can be laundered into a
new baseline, so a re-record with one nameable cause is worth two commits. The
supporting reasons: CS006 already has to edit four closed test files without
adding two more to the same `run-all.js` output, and the heat clock's guard is
written in `respawnSkimmer()`, which the Dive changes — so heat has to land
*after* the Dive rather than beside it.

**A playable Classic game exists at CS008.** Everything after it is addition.
If the schedule breaks, the game that ships is Classic-only and complete rather
than Overdrive-half-done.

**Overdrive is sequenced by risk, cheapest first.** CS012 is flags and one
parameter-variant enemy. CS013 is content. CS014 is the only piece with a
different control model and the highest build cost, so it sits alone, late, and
cuttable in one commit.

⛔ **Cut order under schedule pressure, in this order:** CS014 (ring-flight
falls back to the Classic thorn-dodge), then the Mimic in CS013, then CS009's
third track — `title` plus one gameplay track is a shippable floor. None of
these three cuts touches another changeset's code.

---

## GDD open questions — all resolved

⛔ **GDD §21 carries no open questions.** All seven are resolved as of
2026-08-30; #1 and #4–#7 below were taken on the recommended defaults.

| GDD §21 | Resolution | Lands in |
|---|---|---|
| #1 Dim band (§3.7) | Keep as specced: levels 65–80 at `DIM_BAND_ALPHA` 0.18, lanes lighting on occupancy, shot travel and Surger charge. Spend no tuning time on it — the renderer handles lane occupancy anyway, so the band is a few lines on top of work already required. Re-audition only if telemetry ever shows a player past level 65. | CS001 P3 — **shipped** |
| #4 Achievements | Local-only. The evaluator returns a payload-shaped object from day one, so server-backing later is wiring rather than a rewrite. | CS011 |
| #5 Aggregate telemetry | Strictly local CSV export. Nothing is posted anywhere. It is a tuning instrument and explicitly not anti-cheat; a destination adds a privacy surface for no tuning benefit. | CS007 |
| #6 Mimic | Build it. ~100 lines against an existing shot path, and the probation verdict needs a playtest rather than an argument. Cut it in CS016, without ceremony, if it reads cheap. | CS013, verdict in CS016 |
| #7 Track count | Three at launch: `title`, `pulse`, `drive`. `deep` and `rush` are new table entries with no code change, so they are post-ship content, not a scope cut. | CS009 |

---

## Still open, and not owned by a changeset

Design calls for Paul, all carried in `STATUS.md`, plus one measured
engineering note that is not a design call at all. The first two are not enemy
questions, so neither CS004 nor CS005 touched them. The third is an enemy
question that only becomes reachable when the introduction schedule lands, which
is why it is named against CS007 rather than left unowned. The last is the
module seam, named against CS012 for the same reason.

- **GDD §3.3's `throatOffset` is undefined.** No well uses it and the GDD never
  says what it offsets; `wellThroat()` defaults it to zero.
- ⚠ **A standing Thorn holds a spawner slot** (CS004 P5). `updateSpawner()`
  blocks on `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)`, a count
  of *everything* in the one array — so three Thorns nobody shoots hold the
  spawner shut and the well never clears. Unreachable in a played build today
  (⚠ `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]`, so no Weaver ever spawns);
  **live the moment CS007's introduction schedule lands Weavers at L5**, which
  makes it CS007's to answer rather than a standing task. Measured repro and the
  numbers are in `STATUS.md`.
- **The Flat well (11) is geometrically degenerate.** Its rim is a straight line,
  so it renders with zero depth. An offset throat is what would fix it, which is
  why it is the same question. The natural landing spot is **CS006** with well
  progression. ⚠ `STATUS.md` used to attribute a CS004 landing spot to this
  file, which was never in it; CS004 P1 corrected that line and both documents
  now say CS006.
- ⛔ **`src/07-enemies.js` wants splitting, and the moment is CS012.** Measured
  at the CS005 close, not felt: it went from **39.1 KB / 782 lines** at CS004
  close (`74fb50c`) to **65.2 KB / 1,277 lines** — **+67% by size for two
  entities** — and it is **65% comment by line** (833 of 1,277), which is
  correct and is the point: this is the file where an entity's contract, its
  cycle and every judgment call behind them are written down. CS012 and CS013
  add three more entities (Reaver, Warden, Mimic), which puts it past 100 KB.

  ⛔ **Not now, and not as its own changeset.** The natural seam is **Classic
  versus Overdrive** — it falls exactly where the roster does, so it is a move
  and not a redesign — and the natural moment is **CS012**, when a new enemy
  module is being created anyway and the split costs one file that was going to
  be written regardless. `build.js`'s two-way `MANIFEST` check makes adding a
  module cheap and safe: a file on disk but unlisted fails the build, and so
  does a file listed but absent. Assumption #7 says no changeset is reserved for
  refactoring; ⛔ **this note is the alternative that rule asks for** — recording
  the measurement and the moment is what stops a future session rediscovering it
  as a surprise and taking the seam somewhere worse.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Sixteen changesets, sized so each holds 3–5 phases of one session each | A phase that repeatedly overruns a session means the changeset was too coarse; split it rather than letting phases sprawl |
| 2 | ✅ **Settled — enemies split across three changesets**, and the split was right. Spine plus one enemy (CS003), the three that fit the contract (CS004), the two that needed new machinery (CS005) | Originally two. CS004's scope check found a contract field missing, a `laneHop` degeneracy the Drifter is the first entity to reach, and two cargo rows that cannot be built before their cargo. The open question left here was whether CS005 was really two sessions; it was **five phases in one changeset and wanted no seam**, because P1 shipped geometry and no entity, which is what kept P2 and P3 to one entity each. ⛔ Nothing further changes this — the Classic roster is complete. The three Overdrive enemies are CS012 and CS013 and are scoped there |
| 3 | Telemetry ships with the heat clock, not with the other meta systems. ⚠ Since CS006's split that is the **new CS007**, not CS006 — the same pairing it always had, one row further down | It is a tuning instrument, and the tuning it serves is difficulty. An instrument built one changeset *before* the thing it measures ships with a column list that has to be edited the moment heat lands, and `TELEMETRY_FIELDS` and `push()` must be edited together (GDD §15.6). If difficulty tuning turns out to need nothing beyond `feel-lab`, move it back to CS011 with the other meta systems |
| 4 | Meta (CS011) sits after audio, not before | Meta's only external dependency is the Worker registry entry, which Paul can make in parallel today. If that registration proves slow, move CS011 earlier |
| 5 | Front of house (CS008) comes before audio | The audio director reads score, combo, lives and level; specifying it against a real HUD and a real game-over path is cheaper than against placeholders |
| 6 | ⚠ **GDD §12's four-second promise is onboarding, and it is CS015's.** Settled 2026-08-30 | CS003 P5 flagged that this file and `STATUS.md` disagreed — this file read it as a spawner-tuning question for the level-flow changeset, `STATUS.md` read it as onboarding. `STATUS.md` wins: it needs spawn lanes weighted toward the player's lane, which is a *teaching* decision made against a first-run experience, not a difficulty curve. If CS007's heat pass finds it falls out of the spawner for free, take it there and note the move |
| 7 | No changeset is reserved for refactoring | If the CS008 HUD and the CS011 meta screens end up duplicating layout code, propose a refactor changeset then — don't reserve time for a problem that may not appear |
| 8 | `ROADMAP.md` is its own file, not a section of `DECISIONS.md`. Paul's call, 2026-08-30 | It needs editing every time a changeset is renumbered, and `DECISIONS.md` is append-only. Adding it means one row in `CLAUDE.md`'s document map and one in GDD §16.4, both on the "on demand only" read contract |
| 9 | The enemy palette is chosen as a set in CS004 P1, all six Classic colours at once, all ⚠ provisional | Picking four now and two in CS005 guarantees a clash, and `C` already carries forward-looking constants. `tools/glow-lab.html` remains unbuilt and unowned; whichever changeset takes the art pass owns it |
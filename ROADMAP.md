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

**CS001 through CS007 are closed.** Their narratives are in `log/CS00#.md`;
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

**CS006 held as ONE changeset after splitting itself in two, and shipped its row
in full.** Six phases: the renumber (P0), past-99 progression and the band roll
(P1), `throatOffset` and the two degenerate wells (P2), the Dive (P3),
`laneState` and the dim band (P4), the soak and the close (P5). ⛔ **The Dive
REPLACED CS003 P2's between-wells hold** — the constant, the `state` field and
the branch are all deleted, and neither name survives in the built file — and it
lands GDD §4.5's fifth and last death condition, with the death-loop guard that
makes a fully thorned well terminate. `C.MIN_LANE_SPOKE_PX` 60 lands as a
**gate**: the Flat and the Stair were the only two wells under it, both are
offset, and no untouched well is inside 20 % of the line.

⚠ **What CS006 deliberately left.** The Dive has **no visual** — no camera
widen, no doppler, no descent rendering; GDD §5 scopes those as presentation and
no changeset owns them yet, which makes it the largest gap in the build between
what is simulated and what is seen. The spawner stall it inherited is untouched
and still CS007's, on purpose: the design call belongs to the changeset that
makes it reachable. And ⛔ **the single sanctioned baseline re-record was NOT the
one the plan predicted** — `test-cs004-p1.js`'s `GOLDEN_LANES` is green and
untouched, and `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is what the Dive moved.
`log/CS006.md` carries the cause, and CS006 P5 replaced the golden's guard role
with a draws-per-spawn count so CS007 could move it without laundering anything.
⚠ **CS007 never needed to** — see the correction under "Why this order" — but the
count is what let all three of CS007's `P1_DETERMINISM_HASH` re-records be
*checked* rather than merely recorded, which is the job it was built for.

**CS007 held as ONE changeset and shipped its row in full.** Five phases — the
spawner-stall split (P1), the heat clock and every value derived from it (P2),
GDD §8.1's introduction schedule (P3), telemetry (P4), the soak and the close
(P5). ⚠ **It was planned as six and dropped to five when Paul answered H1**: the
guarantee is held by a hard `C.CLIMB_MULT_MAX` of 1.40 with
`C.RESPAWN_PUSH_DEPTH` staying 0.55 at every level, so the phase that was to
build a derived push had no production code left to write.

**What CS007 shipped against the row.** ⛔ **One clock** — `heat()` and seven
accessors beside `C`, Form A endpoint interpolation, `C.HEAT_FULL_LEVEL` 99, and
`heat(1)` exactly 0. ⛔ **The introduction schedule as DATA** — `C.SPAWN_SCHEDULE`,
seven `{ level, kind }` rows, `eligibleKinds(level)` a function of the level and
nothing else, and CS004's ⚠ TEMPORARY bench constant deleted outright. ⛔ **The
spawner-stall call built as settled** — the release budget counts THREATS, the
readability ceiling keeps counting ENTITIES, `wellCleared()` untouched and no
Thorn expiring. ⛔ **Telemetry** — 29 columns including all eight heat-derived
values, a ring, a session switch that is OFF at every launch, and a CSV export to
`console.log`. And a **fifth soak file**, `test-cs007-p5.js`, which owns the run
that moves between bands rather than one pinned to a level.

⚠ **What CS007 deliberately left.** ⛔ **Nothing was tuned.** The instrument was
built and the curve was chosen from measured option tables, but no playtest
evidence has been collected and GDD §8.2's targets are still targets — the ask is
in `PLAYTEST.md`, and it is the one thing the suite cannot check. ⛔ **No
persistence** for the telemetry buffer: `kit-storage` owns the keyspace and
`22-meta.js` is still a placeholder, so CS011 owns it. **No scoring, no HUD, no
Start Depth** (CS008's), **no Dive visual**, **no spawn-lane weighting toward the
player's lane** (GDD §12's four-second promise is onboarding and is CS015's), and
**`src/07-enemies.js` is not split** — still CS012's. ⛔ **And the four-key
`C.TELEMETRY_PLACEHOLDER` shrinks rather than staying**: CS008 deletes two keys,
Start Depth a third and the combo the fourth, and a key left there after its
column has a real source is a column silently reporting zero.

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

⛔ **The split's real justification is a BASELINE RE-RECORD, and this paragraph
named the wrong baseline** — see the ⚠ correction below, written after both
changesets measured it. It predicted `test-cs004-p1.js`'s `GOLDEN_LANES` on three
grounds: the Dive changing when level 2 starts inside its 3,000-tick window, heat
changing the spawn interval, and the introduction schedule changing the draw count
per spawn. **All three are measured false.** The argument for splitting survives
intact on the baseline that did move: **separately-reasoned re-records instead of
one that absorbs three unrelated causes at once** — and a re-record is the one
moment a stray RNG draw can be laundered into a new baseline, so a re-record with
one nameable cause is worth two commits. The
supporting reasons: CS006 already has to edit four closed test files without
adding two more to the same `run-all.js` output, and the heat clock's guard is
written in `respawnSkimmer()`, which the Dive changes — so heat has to land
*after* the Dive rather than beside it.

⚠ **MEASURED AT BOTH CLOSES, AND THE PREMISE ABOVE IS WRONG IN BOTH HALVES — the
split is still right, for a better reason.** The Dive does **not** move
`GOLDEN_LANES`: its 3,000-tick window now crosses a well clear, but the extra
1.6 s of dive costs it no spawn, so the recorded sequence is identical and CS006
re-recorded nothing there. ⛔ **And neither does the introduction schedule, which
is what this paragraph used to predict.** Measured at CS007 P3: the golden's
window ends at **level 2** (2,065 ticks at level 1, 935 at level 2), and GDD
§8.1's eligible set is **one entry** throughout that band — a one-entry set spends
no draw, so the draw count per spawn is unchanged where the golden lives. ⛔ **And
it was not heat either** (the other prediction, in `PLANNED-FEATURES-CS007.md`
§1.1): level 2's spawn interval is **1.5472**, not the 1.428 four documents
printed, which is level *5*'s. `GOLDEN_LANES` is on its original `9ebd27b`
recording, all sixteen entries, through the whole of CS006 and CS007.

⛔ **What actually moved, both times, was `test-cs006-p2.js`'s
`P1_DETERMINISM_HASH`** — once in CS006 (the Dive) and three times in CS007 (the
threats split, heat, and a closed soak's fixture becoming a level), each with one
nameable cause. **The conclusion holds and is stronger for it: two changesets
meant separately-reasoned re-records rather than one that absorbed three unrelated
causes at once.** `test-cs006-p5.js`'s draws-per-spawn count is what made each of
CS007's three checkable rather than merely recorded — it needs no baseline and
survives every retune, and CS007 P3 made it a function of the LEVEL, which is
strictly more than it could say before.

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
| #5 Aggregate telemetry | Strictly local CSV export. Nothing is posted anywhere. It is a tuning instrument and explicitly not anti-cheat; a destination adds a privacy surface for no tuning benefit. | CS007 P4 — **shipped**; ⛔ persistence is CS011's |
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

- ✅ **CLOSED by CS006 P2 — GDD §3.3's `throatOffset` is defined.** It is a
  translation of the throat polygon in normalized rim space, applied **after**
  the centroid scale, DATA and never written at runtime. GDD §3.3 carries the
  definition; `test-cs006-p2.js` asserts it on all sixteen wells.
- ✅ **CLOSED by CS007 P1 — a standing Thorn holds a spawner slot, and the budget
  now counts THREATS** (found CS004 P5, settled by Paul before CS007's spec, built
  at `adb0bd7`). `updateSpawner()` blocks on `state.enemies.length >=
  min(ENEMY_CONCURRENT, ENEMY_CAP)`, a count of *everything* in the one array —
  so three Thorns nobody shoots hold the spawner shut and the well never clears.
  ⛔ **CS007 P1 built the split**: the release budget counts `blocksClear && !dead`
  (`threatCount()`), `C.ENEMY_CAP` keeps counting entities at one enforcement
  site, no Thorn expires and `wellCleared()` is untouched. Reasoning in
  `DECISIONS.md`; the repro, the re-record and its cause in `log/CS007.md`.
  ⛔ **`test-cs007-p5.js` verifies it end to end on a played board**: every blocked
  beat in a twenty-run soak is legal against a threat count recomputed off GDD
  §6.5's contract field, and reverting `threatCount()` turns that red.
- ✅ **CLOSED by CS006 P2 — the Flat (11) and the Stair (9) are offset.** The
  Flat's shortest lane-centre spoke went 23.6 → 151.8 px, the Stair's 30.4 →
  79.6 px, both past `C.MIN_LANE_SPOKE_PX` 60. ⚠ **The numbers are settled and
  the picture is not** — nobody has looked at either shape, and the ask is in
  `PLAYTEST.md`.
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
| 6 | ⚠ **GDD §12's four-second promise is onboarding, and it is CS015's.** Settled 2026-08-30 | CS003 P5 flagged that this file and `STATUS.md` disagreed — this file read it as a spawner-tuning question for the level-flow changeset, `STATUS.md` read it as onboarding. `STATUS.md` wins: it needs spawn lanes weighted toward the player's lane, which is a *teaching* decision made against a first-run experience, not a difficulty curve. If CS007's heat pass finds it falls out of the spawner for free, take it there and note the move. ⚠ **It did not** — CS007 touched no spawn-lane selection at all, and `pickSpawnLane()` is unchanged since CS003 |
| 7 | No changeset is reserved for refactoring | If the CS008 HUD and the CS011 meta screens end up duplicating layout code, propose a refactor changeset then — don't reserve time for a problem that may not appear |
| 8 | `ROADMAP.md` is its own file, not a section of `DECISIONS.md`. Paul's call, 2026-08-30 | It needs editing every time a changeset is renumbered, and `DECISIONS.md` is append-only. Adding it means one row in `CLAUDE.md`'s document map and one in GDD §16.4, both on the "on demand only" read contract |
| 9 | The enemy palette is chosen as a set in CS004 P1, all six Classic colours at once, all ⚠ provisional | Picking four now and two in CS005 guarantees a clash, and `C` already carries forward-looking constants. `tools/glow-lab.html` remains unbuilt and unowned; whichever changeset takes the art pass owns it |
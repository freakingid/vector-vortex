# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS005 (P4 of 5 done) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS005

- **P1 — the boundary lattice.** ✅ `laneHop`'s optional fold bounds,
  `laneBoundaryLo/Hi()`, `boundaryFrom()`, `scratchpad/test-cs005-p1.js`. No
  entity, no rendering, no new `C` key.

`laneHop(well, lane, delta, dir, lo, hi)` folds about `lo`/`hi` instead of `0`
and `lanes - 1`, which stay the defaults. ⛔ **The four-argument form is pinned
bit-identical to the pre-change build** by a 16,856-case sweep (16 wells ×
quarter-lane values two lanes past each end × seven deltas × both directions),
hashed over raw float64 bytes; `GOLDEN_SWEEP` was recorded from `74fb50c`.

⚠ **`laneBoundaryHi` is `lanes - 0.5` on a CLOSED well, not `lanes - 1.5`.** The
prompt specified the open-well answer only. The closed value is forced, not
chosen: the spec requires `boundaryFrom(Ring, 0, -1)` to give `15.5`, and P5
asserts a settled rider's lane lies inside `[laneBoundaryLo, laneBoundaryHi]`.

`boundaryFrom()` is the birth half-step and ⛔ **does not go through `laneHop`**
— folding an off-lattice start overshoots to `1.5`. One reversal suffices,
proven by exhaustion over every integer lane of every well, both directions;
each open well reverses on exactly two of its births.

**Mutation-checked, six:** either default bound moved, `boundaryFrom` never
reversing, reversing twice, `laneBoundaryLo` at `0`, and `laneBoundaryHi`
losing its closed branch each turn `test-cs005-p1.js` red.

- **P2 — the Drifter.** ✅ `class Drifter`, `drawDrifter` + two polys, the
  `drifter` kind, debug key `5`, eight `C` keys, `scratchpad/test-cs005-p2.js`.
  Registry `enemies` 4 → 5, `enemyKinds` 5 → 6.

⛔ **`killDepth` is `1 - C.RIM_CONTACT_DEPTH`, and the two shipped comments that
predicted `0` are corrected** (`07-enemies.js`'s base class, `09-collision.js`'s
`collideSkimmer` header), with GDD §4.5, §6.5's field row and §6.1/§6.3. Zero
would have been lethal from the throat on the spawn step — `collideSkimmer` has
no term for where the Skimmer is.

Born at the lane **centre** it was handed; the first `update()` half-crosses onto
the lattice via `boundaryFrom()`. ⛔ The constructor neither snaps nor takes a
`well` — three closed test files assert the constructed values. Depth climbs in
**both** phases, which is why an armoured Drifter cannot become the Thorn stall.
Crosses go through `laneHop` with P1's bounds and write `dir` back.

⚠ **One judgment call, and it is a deliberate difference from the Vaulter.** A
homing answer of `0` falls back to the stored heading rather than skipping the
beat: a Vaulter that declines a hop is merely still, a Drifter that declines a
cross stays **armoured**. GDD §6.1 carries it.

**Mutation-checked, ten:** `killDepth = 0`, `onShot` consuming while riding,
`laneHop` with the default fold bounds, the `dir` write-back dropped, a snapping
constructor, one poly drawn always closed, the climb confined to the cross,
`boundaryFrom` replaced by `laneHop`, homing removed, and `crossDur()` not
derived — each turns `test-cs005-p2.js` red.

- **P3 — the Surger.** ✅ `class Surger`, `SURGER_POLY`, `drawSurger` +
  `drawSurgeLane`, the `surger` kind, debug key `6`, five `C` keys,
  `scratchpad/test-cs005-p3.js`. Registry `enemies` 5 → 6, `enemyKinds` 6 → 7.
  ⛔ **The Classic roster is complete.**

⛔ **The discharge is `killDepth` MUTATED TO `0` AND RESTORED — no eighth
contract field, and `collideSkimmer()` grew no branch.** With `0` the depth test
is unconditionally true and the only term left is `laneHit()`, which is GDD §4.5
item 3 verbatim. `setPhase()` is the one writer of both `phase` and `killDepth`.
⚠ The same number is wrong on the Drifter and right here: there it would be
permanent, here it is a 0.30 s window behind a 0.45 s fuse.

⛔ **The lane is never lethal during the telegraph**, checked through the real
`G.update()` rather than by inspection. ⛔ `C.SURGE_DISCHARGE <
C.RESPAWN_INVULN` is asserted from the constants: §4.4's push only *lowers* a
depth, so it does nothing against a zero. ⚠ Depth rises in the **climb phase
only** — the opposite of the Drifter's rule, and stated.

**Mutation-checked, ten:** a lethal telegraph, an unrestored `killDepth`, the
timer not reset at a transition, the climb running in every phase, a Surger born
armed, a written `lane`, `shotAlpha()` on the fuse, the live lane losing its
width multiplier, the fuse borrowing the Thorn's scratch, and `SURGE_DISCHARGE`
raised past `RESPAWN_INVULN` — each turns `test-cs005-p3.js` red.

- **P4 — the two cargo rows.** ✅ `CARGO.drifter` / `CARGO.surger`
  (`07-enemies.js`), `carrierDrifter` / `carrierSurger` in `ENEMY_KINDS`
  (`08-spawner.js`), `CARGO_GLYPHS.drifter` / `.surger`
  (`14-render-entities.js`), `scratchpad/test-cs005-p4.js`. Registry
  `enemyKinds` 7 → 9; `enemies` **untouched at 6**. ⛔ **GDD §6.2's variant
  table is complete.**

⛔ **Three table rows and two glyphs, and NO CODE PATH.** `Carrier.onShot()`,
`splitLanes()` and `drawCarrier()` are unchanged and serve all three rows; there
is no branch on cargo anywhere, asserted against the built text. All three
variants build the same `Carrier` with `killDepth = 1 - C.RIM_CONTACT_DEPTH` —
a Carrier is a Carrier, and the cargo only matters after it dies.

⛔ **The glyph design rule is now WRITTEN DOWN at `CARGO_GLYPHS` and in GDD
§6.2: a glyph is a miniature of its cargo's own gesture** — chevron/arm,
zigzag/bar, scatter/cluster — which is what makes the read learnable. ⛔ The two
**opposite** responses (Drifter: move away; Surger: hold still) are carried by
**compact versus full-width**, the channel that survives at throat depth.

⛔ **`test-cs005-p4.js` is deliberately short.** CS004's `CARGO` loops now cover
three rows instead of one, so the split, the two draws, the child kind, the
child depth and `splitLanes`' lanes are asserted three times over without an
edit; this file confirms that coverage arrived and adds the rest: a rim split
yields two children at the parent's exact depth that begin their own birth
crosses (Drifter) or their own fuses (Surger) **independently** — stepping one
never advances the other — plus the two glyph-shape ⛔s (plain arrays, one
`closePath` per Carrier) stated here so a reshape fails with a clear message
rather than in CS004's file with a confusing one.

**Mutation-checked, seven:** a `{poly, closed}` glyph row, a closed glyph, a
cargo branch in the build, a variant with a `0` or absent `killDepth`, a
full-width drifter glyph, a drifter glyph that stops doubling back, and a bench
key per variant — each turns `test-cs005-p4.js` red.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js` passes: 23 test files, zero skips, ~6 s.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer.
- CS002 closed 2026-08-30 — the loop, the Skimmer, shots, and all four input
  devices (mouse/keyboard/touch/gamepad), verified on real hardware.
- CS003 closed 2026-08-30 — the seeded RNG, the entity contract, the Vaulter,
  the spawner and well lifecycle, the one collision pass, the Purge, death,
  lives, respawn and the game-over stop.
- CS004 closed 2026-08-30 — the Carrier and `splitLanes()`, the Weaver and its
  bolt, the Thorn and the chip economy, the `anchored` contract field, the debug
  bench, and the extended §17 soak. Full narrative, shipped constants, every
  judgment call and the seventeen-row mutation-check record are in
  `log/CS004.md`. ⛔ **With CS005 P2 and P3 the Classic roster is complete and
  four of GDD §4.5's five death conditions are live** — only item 5 (a Thorn
  during the Dive) is unwired, and it is not a `killDepth`.
- ⛔ **Read GDD §6.5 before adding an enemy.** It now carries seven contract
  fields, six wiring points, the one array / one spawn entry / one well entry /
  one collision pass rule, and — new in CS004 — why `Carrier.onShot()` may push
  into `state.enemies` from inside the collision pass's own loop.
- ⛔ **Two soaks, and they prove different things.** `test-cs003-p5.js` catches
  GDD §3.5's wrapping hop with a per-tick lane SPEED bound, because a wrapped hop
  on a 13-lane strip lands inside `[0, 12]` and a range check passes it.
  `test-cs004-p5.js` asserts the STRONGER form for the four entities that do not
  hop at all: `lane` is exactly the lane it entered with, `Object.is`, no epsilon.
  ⛔ Both are still the Vaulter's and ⛔ **neither file is edited by CS005** —
  CS005's own tests carry the per-entity bounds. `test-cs005-p2.js` uses the
  Drifter's derived `2 * DT / C.DRIFT_CROSS_TIME`.
- ⛔ **`test-cs004-p1.js` carries a GOLDEN spawn-lane sequence** recorded from the
  build at `9ebd27b`, before `pickSpawnKind()` existed. It is the only guard on
  the no-draw rule that works end to end: the determinism hashes compare two runs
  of the *same* build, so a stream shift is self-consistent there and invisible.
  Retuning the spawner legitimately re-records it; a stray RNG draw does not.
- `tools/well-lab.html` — well polygons and the perspective curve.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- ⛔ **A STANDING THORN HOLDS A SPAWNER SLOT, and the well can stall.** Found by
  CS004 P5's soak, measured, not inferred. `updateSpawner()` blocks on
  `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)` — a count of
  **everything in the one array, Thorns included** — and `ENEMY_CONCURRENT` is 3.
  A Thorn nobody shoots is permanent, so **three standing Thorns hold the spawner
  shut**: the quota never spends, the well never clears, and because a Thorn does
  not kill, nothing threatens the player either.

  Repro, exact: three Thorns at any length, quota full, no input — after 100
  simulated seconds the level, the quota and the board are where they started.
  Measured cost with Weavers in the spawn mix: **three enemies born in 5,000
  ticks** on the Fan.

  ⚠ **Unreachable in a played build today**, and only because
  `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]` so no Weaver ever spawns. It goes
  **live the moment CS006's introduction schedule puts Weavers at L5.** ⛔ Not
  fixed here: the answer is a design call (does the concurrency budget count
  *threats* or *entities*? does the clear condition change? does a Thorn expire?)
  and it belongs to the changeset that makes it reachable. `test-cs004-p5.js`
  works around it with a documented fixture — `C.ENEMY_CONCURRENT` raised to
  `C.ENEMY_CAP` for the six-well soak only, and put back afterwards. ⛔
  `C.ENEMY_CAP` is untouched; it is a readability ceiling, not a difficulty knob.

  ⚠ **CS005 P2 gives CS006's design call one new input, and does not answer it.**
  A riding Drifter is a second entity that is temporarily neither a threat the
  player can remove nor a slot they can free — but it is **self-resolving where a
  Thorn is not**, for two reasons that are decisions rather than luck: it crosses
  on a fixed cadence, so the window is bounded by `C.DRIFT_RIDE_TIME`; and it
  climbs in **both** phases, so it reaches the rim and forces a resolution. So
  "does the concurrency budget count *threats* or *entities*?" now has a case
  where the honest answer is "neither, for 0.85 s".
- **`tools/glow-lab.html` does not exist.** `CLAUDE.md`'s design-instruments
  section lists it as the home of the line-weight and glow-falloff decisions
  measured against a busy frame. It is also the instrument the ⚠ colour
  placeholders below are waiting on.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR` (`#FFFFFF`),
  `VAULTER_COLOR` (`#FF4A4A`) and the six CS004 P1 added (`CARRIER_COLOR`,
  `WEAVER_COLOR`, `WEAVER_BOLT_COLOR`, `THORN_COLOR`, `DRIFTER_COLOR`,
  `SURGER_COLOR`) are all inference, not design — the GDD specifies no enemy
  palette. They were chosen **as one set** against the constraint recorded in
  `C`: an enemy colour must read against all seven band colours (§3.6), because
  the well cycles and the enemies do not. ⛔ **All six are judgeable now** —
  press `0` for the full staggered row, or `5` / `6` for a Drifter or a Surger
  alone. ⚠ The
  Drifter's `#FF5AC8` and the Vaulter's `#FF4A4A` are the closest pair in the
  set and they are the two whose silhouettes span a comparable footprint.
- **`drawWell()`'s `laneState` parameter is still unwired**, and CS005 P3 did
  not wire it. Lane occupancy lighting (GDD §3.7) belongs with the dim band, in
  CS006. ⛔ The Surger's telegraph shipped as an **entity draw**
  (`drawSurgeLane`) and must not be moved onto `laneState` when that lands:
  `isLaneLit()` is a boolean over spokes and cannot express a progressive fill.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: that is onboarding and it is
  **CS014's**.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way (contact tolerance is half a lane), and GDD §6.1 says only
  "direction from `laneDelta`". Flagged for CS006's tuning pass in case the
  jitter reads as indecision rather than menace.
- **GDD §3.3's `throatOffset` is undefined** — no well uses it and the GDD never
  says what it offsets. `wellThroat` defaults it to zero. Design call for Paul.
- **The Flat well (11) is geometrically degenerate**: its rim is a straight line,
  so it renders with zero depth. Same underlying question as `throatOffset` (an
  offset throat is what would fix it). Design call for Paul before CS006.

## Findings from CS005 P3 (hazards the phase prompt did not name)

- ⛔ **THE PROMPT NAMED THE MUTATION AND NOT ITS RESTORE, AND THE RESTORE IS THE
  HALF THAT FAILS SILENTLY.** A discharge that ended without putting the rim band
  back leaves a permanently lane-lethal enemy, indistinguishable downstream from
  a bug in `collideSkimmer` and reachable only after ~3 s of play. `setPhase()`
  is therefore the **one writer of both `phase` and `killDepth`**.
- ⚠ **THE PROMPT'S CYCLE TABLE DECIDED SOMETHING THE CONSTANT TABLE DID NOT.**
  It attributes "depth rises at `C.SURGE_CLIMB`" to the `climb` line only, and
  unlike the Drifter's spec it carries no "in both phases" ⛔ — so the climb is
  the climb phase's, and shipped that way. ⚠ Which makes
  `PLANNED-FEATURES-CS005.md`'s "throat→rim ≈ 6.7 s" (`1 / SURGE_CLIMB`) **not**
  the shipped figure: the climb owns 2.60 of every 3.35 s cycle, so it is
  ≈ 8.6 s. `00-config.js` and GDD §6.1 carry the honest number and the reason.
  The pause was kept because it is a fourth channel on the fuse; ⛔ if CS006
  wants 6.7 s it raises `SURGE_CLIMB`, it does not move the climb into the other
  two phases.
- ⛔ **THE STALE `killDepth` PREDICTIONS WERE IN TWO MORE PLACES — the two P2
  had just rewritten.** `07-enemies.js`'s base class said "NOTHING IN THE ROSTER
  IS ZERO" and `09-collision.js`'s `collideSkimmer` header said a zero here is
  an unaccountable death. Both were true when written and both are now
  half-true: a **resting** zero is still wrong, a **transient** one behind a fuse
  is what item 3 is. Both corrected, and both now say which kind they mean. ⚠ P2
  found the same shape one changeset ago — a comment that names a value rots the
  moment a second entity means something else by it.
- ⚠ **THE SURGER KILLS BY TWO OF §4.5's FIVE CONDITIONS**, the only entity that
  does: its resting `killDepth` is the rim band, so item 1 applies to it exactly
  as to a Vaulter, on top of item 3. Free, correct, and in none of the planning
  docs; §4.5, §6.1 and the class now say it.
- ⚠ **THE FUSE AND THE DISCHARGE ARE ONE DRAWER AND THE WIDTH IS THE ONLY
  DIFFERENCE**, because the fuse reaching the rim and the lane going live are the
  **same instant**. ⛔ `SURGE_LIT_WIDTH` is the discharge's only: if the fuse
  proves too faint in traffic the fix is a second multiplier, since raising this
  one costs the state change its whole read.

## Findings from CS005 P2 (hazards the phase prompt did not name)

- ⛔ **The stale `killDepth = 0` prediction was in FIVE places, not the two the
  prompt named.** The prompt named `07-enemies.js`'s base class and
  `09-collision.js`'s `collideSkimmer` header. GDD §4.5's "conditions 2, 3 and 5
  are still unwired" paragraph, GDD §6.5's `killDepth` field row and
  `STATUS.md`'s own carried-task list said the same thing. All five are
  corrected. ⚠ A wrong value repeated across a doc set is worse than one comment,
  because the second reader finds *corroboration*.
- ⚠ **A bench-spawned Drifter rides BETWEEN lattice points forever, and that is
  correct.** Debug key `5` spawns in the Skimmer's **continuous** lane, and
  `boundaryFrom()` carries a fractional lane through unchanged (its own header
  says so). The result stays legal and stays inside `[laneBoundaryLo,
  laneBoundaryHi]` — asserted — it is simply never *on* the lattice. Nothing the
  spawner or `splitLanes()` produces is fractional, so it is a bench artefact
  only. ⛔ Do not "fix" it by snapping in the constructor; that is the birth model
  three closed test files depend on.
- ⚠ **`23-main.js`'s bench header said "the bench has five and the roster has
  six".** True while CS004 was the present tense and stale the moment P2 landed a
  sixth key. Rewritten as the rule instead of the count: one key per §6.1 roster
  row, none for a Carrier variant, six plus the row is where the bench stops.
- ⚠ **The Drifter's `well.closed` freedom is asserted against the BUILT file's
  text**, because there is no behavioural way to prove an absence. `test-cs005-p2.js`
  slices `class Drifter` out of the concatenated script and drops line comments
  before searching — ⛔ the class's own header *explains* that `boundaryFrom` is
  where the topology is read, so a raw text search finds the words in prose. Do
  not grow that filter into a general comment stripper (`_harness.js`'s header
  says why).

## Findings from CS004 P5 — ⛔ moved to `log/CS004.md`

A closed changeset's findings are not this file's (`CLAUDE.md`, STATUS.md
format). All six are in `log/CS004.md`'s P5 section verbatim; the spawner stall
also stays in Known issues above, because it is still open. Two are rules rather
than history and are kept here:

- ⛔ **`log/CS003.md`'s changeset numbers predate the +1 renumber, and a closed
  log is never revised** — CS004 P5 added a translation note to it instead. The
  same will be true of `log/CS004.md` and `log/CS005.md`: **note, do not
  rewrite.**
- ⛔ **`test-cs004-p5.js`'s roster count is a DERIVATION** — the distinct classes
  `ENEMY_KINDS` can build, minus the projectiles — which is why CS005's two
  roster rows and four kinds cost it no edit.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- ⚠ `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch in `Game.update()`
  that reads them are TEMPORARY and are CS006's to delete when the Dive lands.
- ⚠ `C.DEBUG_SPAWN_KINDS`, `pickSpawnKind()` (`08-spawner.js`) and the debug
  spawn actions in `23-main.js` (five before P2, six after, and six is where the
  bench stops) are TEMPORARY. GDD §8.1's introduction
  schedule replaces all of them, and that is CS006's. ⛔ The list is a bench,
  never a difficulty knob — do not tune the game by editing it.
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board and the craft that died on it. `r` restarts. CS007 owns the screen, the
  submission and the real restart flow, and the `restart` debug action should be
  folded into it rather than left as a second way in.
- **No scoring anywhere.** `PTS_VAULTER`, `PTS_CARRIER`, `PTS_WEAVER`,
  `PTS_THORN` and `PURGE_SAVED_BONUS` are deliberately unread until `addScore()`
  lands in CS007, which is the one entry point (`CLAUDE.md`, Scoring).
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ **Settled for CS005: `enemies` is 6** (GDD §6.1 roster rows,
  complete) **and `enemyKinds` is 9** (`ENEMY_KINDS` rows). P4 raised only the
  second, by two, because a Carrier variant is a kind and not a roster row. ⛔
  The next mover of either is an Overdrive enemy (GDD §6.4), not a cargo.

## Still to come this changeset — the soak and the close

`PLANNED-FEATURES-CS005.md` and `IMPLEMENTATION-PHASES-CS005.md` are both in
flight. P1–P4 are spent; what is left is P5. Everything the ✅ entries
here used to carry is in the phase ledger above.

- ✅ **The two cargo rows are done** (P4). `test-cs004-p5.js`'s §17 item 6 case
  is a loop over the `CARGO` table that discovers each cargo's carrier from
  `ENEMY_KINDS`, so it grew from one row to three and cost no edit, exactly as
  CS004 wrote it to.
- ⛔ **`MAX_LANE_STEP` is per-entity in CS005's OWN tests and neither closed
  soak is edited** (`PLANNED-FEATURES-CS005.md` finding 7 — the earlier note
  here that both needed editing was wrong; neither soak's board can contain a
  CS005 entity). `test-cs005-p2.js` carries the Drifter's bound as the derived
  `2 * DT / C.DRIFT_CROSS_TIME`; P5's soak inherits it, and the Surger joins the
  **strong** `Object.is` form — `test-cs005-p3.js` already proves it on every
  well, so P5 is extending coverage rather than establishing it.
- ⛔ **The Drifter's `killDepth` was recorded here as `0` and that was WRONG**;
  P2 shipped the rim band and corrected five passages. ⛔ Do not "restore" it —
  and note that P3's Surger ships a `0` on purpose, transiently, which is not
  the same claim. Both readings are written down at every site that carries one.

## Playtest asks (open only)

- ⛔ **THE ASK THIS PHASE EXISTS FOR: is the fuse legible as a COUNTDOWN, in
  traffic?** Press `6`. The read is meant to be *the charge is coming up the
  lane at me and I have until it arrives*, not *that lane is bright*. ⛔
  `C.SURGE_TELEGRAPH` (0.45 s) is the knob if it is too short to act on. ⚠ This
  session is headless: the geometry is asserted, the legibility is not.
- ⚠ **The fuse is the same shape as a Thorn, in nearly the band's own colour** —
  `THORN_COLOR` `#A98CFF` against `SURGER_COLOR` `#9AF0FF`, and §8.1 puts the
  Surger at L13, still inside the cyan band. Motion separates them: one grows
  and vanishes, one is static and permanent. Both ⚠ provisional. Press `3`, let
  a Weaver lay one, then press `6` in the same lane.
- **Does the PAUSE read?** A Surger stops climbing the instant its lane arms. If
  that reads as glitching rather than as bracing, say so — making the climb
  continuous is one line.
- ⚠ **Is a discharging lane obviously lethal END TO END?** It kills at any depth
  for 0.30 s, including down in the throat where a lane has never been a threat
  before. If it reads as "bright near the rim", that half is learned by dying.
- **Does 2.60 s between discharges feel like a rhythm you can play around?**
  ⚠ CS006 makes `C.SURGE_INTERVAL` heat-derived, so the level-1 base is what
  that phase will scale from.
- Does the flattened X read as a *threat* at throat depth, and is
  `VAULTER_SIZE` 0.70 enough silhouette to see it coming?
- Does `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3 produce level-1 pressure
  that feels fair?
- Does the death sequence read? 1.2 s of hit-stop with no fragmentation and no
  sound is a long time to look at a frozen board — CS007 adds the fragmentation
  and CS008 the sound, but the freeze LENGTH is settled now and worth judging
  bare.
- Is `RESPAWN_PUSH_DEPTH` 0.55 far enough? The clamp plus `RESPAWN_INVULN` 1.5 s
  is meant to guarantee a Vaulter cannot climb back into contact before the
  blink stops. Provable at `VAULT_CLIMB` 0.18; it stops being provable the moment
  CS006's heat curve raises the climb rate.
- Is `HIT_DEPTH_TOL` 0.05 generous enough that a shot fired at a climbing
  Vaulter connects when it looks like it should?
- **Is the cargo glyph readable at THROAT depth?** GDD §6.2 says reading it fast
  is the skill that separates competent from good, so the deep end is the test,
  not the rim. Press `2` and watch one climb the whole way.
- ⚠ **Should the glyph be stroked in the CARGO's colour rather than the hull's?**
  It ships in `CARRIER_COLOR` because §3.6's palette note says silhouette carries
  the read; a cargo-coloured glyph is one lookup away and is an art call.
- **Does `CARRIER_CLIMB` 0.11 — nine seconds throat to rim — read as §6.2's
  "shoot deep; you have time", or just as slow?**
- **Does the Weaver's cycle read as a cycle?** Press `3` and watch one for ten
  seconds: *it comes up, it spits, it goes back down.* If the retreat reads as a
  second approach, `C.WEAVER_RETREAT` is the knob.
- **Is the bolt legible enough to dodge?** It is the one thing in Classic that
  cannot be shot, so the whole answer is rotating out of the lane. ~1.4 s from
  the apex to the rim.
- ⚠ **Does a Weaver sitting on the rim in your lane read as safe?** Its body
  never kills, which is correct and is going to look wrong the first time.
- **Is a landing chip visible?** `THORN_TIP_LEN` 0.05 of twice-drawn tip is the
  whole feedback for a hit on the one enemy that does not die when you hit it.
  Press `3`, let a Weaver finish a climb, then hold fire down that lane.
- **Does a full-length Thorn sealing its own lane feel like lane denial or like
  a wall?** At `THORN_MAX` 1.00 the tip sits at the rim, so a shot is consumed
  the instant it is fired. Standing in a sealed lane is safe and useless.
- **Does a Thorn sheltering an enemy spawned behind it read as a consequence or
  as the game cheating?** A shot stops at the tip, so anything below it cannot be
  hit until it climbs past — inherited from the original, self-resolving, and the
  lane you failed to keep clean is the lesson.
- ⛔ **THE ASK THIS PHASE EXISTS FOR: are the two Drifter states separable at a
  GLANCE, on a busy well?** Press `5` a few times and watch one climb, then press
  `0` for the full row. The read is three channels at once — a compact **closed**
  knot at 0.70x line weight and 0.55 alpha while it is armoured on a boundary,
  against a splayed **open** scatter at 1.60x and full alpha while it crosses.
  GDD §6.3 carries a ⛔ on this and the headless gate only proves the three
  channels are still *separated*, not that a player can read them in traffic.
  ⚠ **This session is headless and could not judge it** — the numbers are
  asserted, the look is not.
- ⚠ **Is the riding state legible at THROAT depth?** It is the one silhouette in
  the build drawn below full alpha, and `laneLineWidth(0)` is 1.0 px before the
  0.70 multiplier. `C.DRIFT_RIDE_ALPHA` is the knob and raising it costs
  separation from the crossing state, so this is a real trade rather than a
  free fix.
- **Does `C.DRIFT_RIDE_TIME` 0.85 s against `C.DRIFT_CROSS_TIME` 0.45 s feel
  like an enemy you answer or one you wait out?** It is shootable about a third
  of the time; ⛔ raising the ride is the fastest way to make it unanswerable.
- ⚠ **Does a riding Drifter reading as "in two lanes at once" land as menace or
  as a hitbox bug?** A boundary is exactly `HIT_LANE_TOL` from two lane centres,
  so it kills in both and shields shots in both. It is the largest lethal
  footprint in Classic and it is intended.
- **Does the birth read?** A Drifter comes out of the throat vulnerable and
  slides half a lane before it arms. That half-second is the whole tutorial for
  the entity, and it is deliberately at the depth where the player has the most
  time.
- ⚠ **The palette, on a busy well.** Press `0`: do the four Classic enemy colours
  separate from each other and from the cyan band, and does the Thorn read as
  scenery rather than as a creature?

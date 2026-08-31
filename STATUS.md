# Vector Vortex — STATUS
Version: 0.0.2 · Changeset: CS006 (P3 done) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS006

One line per phase here; reasoning goes to `log/CS006.md`.

- **P0 — the +1 renumber sweep.** CS006 split in two: CS006 is *the well ends*,
  a new CS007 is *the run escalates*, and the tail shifts +1 (front of house
  CS008 … ship CS016). `ROADMAP.md`'s sequence table, its renumber note, its
  "Why this order" section and assumptions #1–#7 are updated. **Seventy-three
  stale pointers found and corrected outside `ROADMAP.md`** — 26 in `src/`, 20
  in `scratchpad/`, 12 in the GDD, 9 here, 5 in `PLAYTEST.md`, 1 in
  `DECISIONS.md` — plus 47 renumbered labels inside `ROADMAP.md` itself. CS004's
  split predicted twelve and found forty-one; ⚠ 73 is *higher*, not lower, which
  is the expected direction: there are two more changesets of documents than
  there were then. ⛔ `log/` (34 hits) and `archive/` (85 hits) were NOT swept —
  a closed record says what a closed session believed, and correcting it
  falsifies it. They were read and deliberately left. No code changed: all 52
  differing lines in `dist/` are comment text, and the suite is green at 24
  files, zero skips.

- **P1 — past-99 progression, `state.bandRoll`, and the draw-path rule.**
  Confirmed the trap before building: a counting proxy over `state.rng` shows
  `Game.draw()` spends **zero** draws today, and `Game.frame()` runs 0–5 updates
  against exactly one draw (hit-stop: ~72 draws, zero updates). ⛔ **Nothing in
  the draw path may call `state.rng()`** is now an invariant in `CLAUDE.md` under
  Math and lifecycle, reasoned in `RATIONALE.md#draw-path-rng`. `nextWell()`
  gained the `state.level > C.BAND_RNG_LEVEL` branch — two draws, shape then
  `state.bandRoll` — and ⛔ **nothing was added to `enterWell()`**, whose third
  caller is the `w` debug key. `Game.draw()` passes `state.bandRoll`;
  `wellBandColor` now reads `C.BAND_RNG_LEVEL` instead of a second literal 99.
  `state.level` carries a ⚠ SETTLED note saying the clock does *not* hold and
  naming CS007's §17 item 7 consequence. `test-cs006-p1.js`: 29 assertions,
  including 600 draws against zero updates and 100 `w` presses, both proved
  non-vacuous. ⛔ The stream below 100 is unmoved — `GOLDEN_LANES` is still
  green. Suite green at 25 files, zero skips.

  ⚠ **One closed test was edited, and it is the only one.** `test-cs005-p3.js`
  pinned the literal `drawWell(ctx, well, state.level, null, 0)`, including the
  fifth argument, which was never CS005 P3's to own. Narrowed to
  `.../drawWell\(ctx, well, state\.level, null,/` — the laneState claim is
  unchanged. Paul's call, asked and answered. ⛔ **CS006 P4 breaks the same
  assertion again** (`null` → `lit`) and is what legitimately retires it.

- **P2 — `throatOffset` defined, the two degenerate wells, and the legibility
  gate.** Swept all sixteen wells for the shortest lane-**centre** spoke before
  touching anything and confirmed the planned numbers: Flat 23.6 px, Stair
  30.4 px, then a gap to Twist 73.9 and Double-Vee 76.5, everything else ≥ 85.
  GDD §3.3 now carries the field's definition — ⛔ a translation of the throat
  polygon in normalized rim space applied **after** the centroid scale, DATA,
  never written at runtime because `wellThroat()` memoizes — and
  `src/03-wells.js`'s header carries it at the field. The Flat gets
  `{x: 0, y: -0.50}` (min spoke 23.6 → **151.8 px**, ratio 1.98), the Stair
  `{x: 0, y: -0.35}` (30.4 → **79.6 px**, ratio 4.84). Both are the computed
  candidates, unmoved by the audition, and both land inside the max/min family
  the other fourteen occupy (widest shipped: Double-Vee 4.25). ⛔
  `C.MIN_LANE_SPOKE_PX` 60 lands as a **gate, not a tunable**, and GDD §17
  item 2 grew the walk. ⛔ **The 10,000-tick hash at seed 20260830 is unmoved**
  (1743051713), asserted against a constant recorded at `8e0fb7c` rather than
  claimed in a comment; `screenPos` moved on exactly the two offset wells and
  every lane-space helper on none. `test-cs006-p2.js`: 380 assertions. Suite
  green at 26 files, zero skips.

  ⚠ **A SECOND CLOSED TEST WAS EDITED, AND THIS PHASE'S PROMPT ⛔ SAID NONE MAY
  BE — PAUL'S CALL TO CONFIRM.** `test-cs001-p2.js` derives the throat as
  `centroid + (rim − centroid) × throatScale` with **no offset term**: exact on
  all sixteen wells until this phase gave two of them a nonzero offset, and
  unsatisfiable afterwards by *any* implementation of the field the same prompt
  ⛔ requires. The two instructions cannot both hold, and the only way to keep
  the file untouched was to land no offsets, which is the phase. Added
  `+ offX`/`+ offY` and nothing else — same sixteen wells, same 1e-12, same
  message, no narrowing. ⛔ **`PLANNED-FEATURES-CS006.md` assumption #15 already
  covers this** ("a closed phase's test is rewritten in place when a later
  changeset replaces the behaviour it asserts"); it was written for P3's four
  edits and P2 hit it first. The stronger offset-aware form of the same claim,
  decomposed into *translate* and *does not rescale*, is now also in
  `test-cs006-p2.js` for all sixteen wells, so no coverage rests on the edit.
  Full record, because `STATUS.md` resets at the close: `DECISIONS.md`,
  2026-08-30.

- **P3 — the Dive, GDD §4.5 item 5, and the death-loop guard.** `src/11-dive.js`
  is the whole feature and it **replaced** CS003 P2's one-second hold: the
  constant, the `state` field and the branch are deleted, and
  ⛔ **neither name survives anywhere in the built file** (asserted). The Dive
  short-circuits — during one there is no spawner, no entity pass, no Purge, no
  collision pass and no clear check, all four proved by counting proxies — and
  its branch sits below the game-over stop. ⛔ **`startDive()` filters the board
  to `anchored`, not to Thorns**, and the case that proves it has a live
  `WeaverBolt` on the board at clear. Beats: grace `C.DIVE_GRACE` 0.35 s at
  depth 1 with ⛔ no strike test, then a 2.25 s descent 1 → 0. The strike is
  `dive.depth <= thorn.depth` — the build's only two-depth comparison — routed
  through `killSkimmer()`. ⛔ **A dive respawn lands in the nearest Thorn-free
  lane** by a deterministic outward walk, ties toward increasing lane, and if
  every lane is thorned **the struck Thorn dies** — the termination guarantee,
  and the only non-shot path to a Thorn's death. `respawnSkimmer()` gained an
  optional `lane`; its default is unchanged and asserted. A fully thorned Fan
  terminates at the cost of exactly one life and one Thorn. ⛔ A dive spends
  **zero** RNG draws, transition included. `test-cs006-p3.js`: 201 assertions.

  ⚠ **THE PROMPT'S ONE PERMITTED RED LANDED ON THE OTHER BASELINE, AND THE
  PREDICTION WAS INVERTED — PAUL'S CALL TO CONFIRM.** `test-cs004-p1.js`'s
  `GOLDEN_LANES` is ⛔ **green**, measured: its 3,000-tick window does cross one
  well clear (level reaches 2), but the extra 1.6 s costs it no spawn, so the
  sequence is identical and no re-record is owed. What went red instead is
  ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH`**, and it is unreachable by any
  post-P3 build for two independent reasons: the between-wells beat is 2.6 s
  rather than 1.0 s, and the soak's hash now mixes `dive.timer`/`dive.depth`
  where it mixed the deleted field. ⛔ **Left red, and P5 owns the single
  re-record** — re-recording it here would make P2's claim ("`throatOffset`
  moved no simulation") assert nothing about P2. ⛔ **The cause is proven, not
  assumed:** driven tick by tick against the build at `40044ee` over the fields
  both builds share, the two are **bit-identical for 1,112 ticks and diverge on
  exactly the tick `wellCleared()` first returns true**, in one field —
  `shots.length`, which is `startDive()` clearing the player's shots. Nothing
  else moved. The alternative is re-recording it now with that cause named; it
  is Paul's call which. ✅ **Settled 2026-08-31: leave it red, P5 re-records.**
  Full record, because `STATUS.md` resets at the close: `DECISIONS.md`.

  ⚠ **SEVEN CLOSED TEST FILES WERE TOUCHED, NOT FOUR, AND THE PROMPT SCOPED
  FOUR.** The four it named were edited as instructed (`test-cs003-p2.js`'s
  assertions rewritten to the Dive; the three soak hashes' deleted field
  replaced by `dive.timer` + `dive.depth`, not dropped). The other three are
  ⛔ **fixtures, not assertions**: `test-cs003-p3.js`, `test-cs003-p4.js`,
  `test-cs004-p3.js` and `test-cs004-p4.js` all built quiet boards by draining
  the quota to zero, and a drained quota with no `blocksClear` survivor is now
  a **cleared well** — so the Dive ate the board on the next step, before the
  case could assert on it. Every repair is the same one line, `spawn.remaining =
  1` instead of `0`, which is half of `wellCleared()`'s two conditions, adds no
  entity for a length assertion to count, and is the trap `test-cs003-p2.js`
  already documents. ⛔ **No assertion was weakened or deleted.**
  `test-cs003-p5.js` needed one more: its soak's first game-over moved from
  inside 10,000 ticks to tick **10,091**, because the Dive is ~1,100 safe ticks
  per 10,000 — `TICKS` is 12,000 now, which strengthens GDD §17 item 1 rather
  than relaxing it. Suite: **27 files, one red, zero skips.** ✅ **Confirmed by
  Paul, 2026-08-31** — record in `DECISIONS.md`.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js` passes: 26 test files, zero skips, ~9 s.
- CS001 closed — 16 wells, the depth model, the well renderer.
- CS002 closed — the loop, the Skimmer, shots, and all four input devices
  (mouse/keyboard/touch/gamepad), verified on real hardware.
- CS003 closed — the seeded RNG, the entity contract, the Vaulter, the spawner
  and well lifecycle, the one collision pass, the Purge, death, lives, respawn
  and the game-over stop.
- CS004 closed — the Carrier and `splitLanes()`, the Weaver and its bolt, the
  Thorn and the chip economy, the `anchored` contract field, the debug bench.
- CS005 closed 2026-08-30 — the boundary lattice and `laneHop`'s fold-bound
  parameter, the Drifter, the Surger, the two remaining cargo rows, and the
  six-kind §17 soak. ⛔ **The Classic roster is complete at six and GDD §6.2's
  variant table at three. Four of GDD §4.5's five death conditions are live** —
  only item 5 (a Thorn during the Dive) is unwired, and it is not a `killDepth`.
  Full narrative, shipped constants, every judgment call and the thirty-seven-row
  mutation-check record are in `log/CS005.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields, six wiring
  points, the one array / one spawn entry / one well entry / one collision pass
  rule, why `Carrier.onShot()` may push into `state.enemies` from inside the
  collision pass's own loop, and — new in CS005 — that `killDepth` is a field an
  entity may **mutate and restore** within its own cycle.
- ⛔ **Three soaks, and they prove different things on different boards.**
  `test-cs003-p5.js` runs the shipped `["vaulter"]` and catches GDD §3.5's
  wrapping hop with a per-tick lane SPEED bound. `test-cs004-p5.js` runs a
  three-kind list and asserts the STRONGER exact-lane form for the four entities
  that do not hop. `test-cs005-p5.js` runs six kinds and carries the per-entity
  bounds in three tiers. ⛔ **CS005 edited neither closed soak**, and a future
  changeset should extend the pattern the same way rather than widening a closed
  file's assertions.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound.** Proved by mutation at the CS005 close: a wrapping Drifter cross
  leaves both a range check and a per-tick speed bound green, because
  `crossDur()` scales with the cross distance. GDD §3.5 and
  `RATIONALE.md#boundary-lattice` carry it.
- ⛔ **`test-cs004-p1.js` carries a GOLDEN spawn-lane sequence** recorded from
  the build at `9ebd27b`, before `pickSpawnKind()` existed. It is the only guard
  on the no-draw rule that works end to end: the determinism hashes compare two
  runs of the *same* build, so a stream shift is self-consistent there and
  invisible. Retuning the spawner legitimately re-records it; a stray RNG draw
  does not.
- `tools/well-lab.html` — well polygons, the perspective curve, and (CS006 P2)
  live `throatOffset.x`/`.y` sliders plus a **Legibility** readout: shortest
  lane-**centre** spoke and its lane, max/min ratio, PASS/FAIL against
  `C.MIN_LANE_SPOKE_PX`, and the shortest lane drawn green or red on the canvas
  so the eye can find it. ⛔ It measures the lane CENTRE, which is not any line
  it draws — the renderer draws vertex spokes, and on the Stair the shortest of
  each is a different lane. ⚠ Its duplicated slice was checked against the build
  headlessly and agrees to 1e-13 px on all sixteen wells; ⛔ **the visual
  audition has not happened** — the ask is in `PLAYTEST.md`.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- ⛔ **A STANDING THORN HOLDS A SPAWNER SLOT, and the well can stall.** Found by
  CS004 P5's soak, measured, not inferred. `updateSpawner()` blocks on
  `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)` — a count of
  **everything in the one array, Thorns included** — and `ENEMY_CONCURRENT` is
  3. A Thorn nobody shoots is permanent, so **three standing Thorns hold the
  spawner shut**: the quota never spends, the well never clears, and because a
  Thorn does not kill, nothing threatens the player either. Repro: three Thorns
  at any length, quota full, no input — after 100 simulated seconds the level,
  the quota and the board are where they started.

  ⚠ **Unreachable in a played build today**, and only because
  `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]`. It goes **live the moment
  CS007's introduction schedule puts Weavers at L5.** ⛔ Not fixed yet: the
  answer is a design call — *does the concurrency budget count threats or
  entities? does the clear condition change? does a Thorn expire?* — and it
  belongs to the changeset that makes it reachable. Both closing soaks work
  around it with a documented fixture (`C.ENEMY_CONCURRENT` raised to
  `C.ENEMY_CAP` for the six-well pass only, put back afterwards). ⛔
  `C.ENEMY_CAP` is untouched; it is a readability ceiling, not a difficulty knob.

  ⚠ **CS005 gave that design call two new inputs and answered neither.**
  1. A **riding Drifter** is temporarily neither a threat the player can remove
     nor a slot they can free — but it is **self-resolving where a Thorn is
     not**, and for reasons that are decisions rather than luck: it crosses on a
     fixed cadence, so the window is bounded by `C.DRIFT_RIDE_TIME`, and it
     climbs in **both** phases, so it reaches the rim and forces a resolution.
     "Threats or entities?" now has a case where the honest answer is "neither,
     for 0.85 s".
  2. ⛔ A **rim-parked Carrier is NOT self-resolving**, and it stalled a seeded
     run at the CS005 close: one Carrier at depth 1.00 with the quota spent, for
     the full 30,000-tick cap. A Carrier is "slow, one lane, never hops" and has
     no rim behaviour at all, so a well whose only survivor is a rim Carrier
     never clears unless the player enters its lane. ⚠ **Three of the six roster
     classes park rather than hunt** — Carrier, Weaver, Surger. The Vaulter
     hunts and the Drifter homes; those two will come to you. Fixed in the soak
     *fixture*, never in the build. This is the same design call seen from the
     other side and it is CS007's.
- **The Dive has no visual, and a dive currently reads as 2.6 s of a still
  board.** `Game.draw()` paints the well, the surviving Thorns and a Skimmer
  still drawn at the rim; nothing shows the descent. ⛔ Deliberate — GDD §5's
  camera widen, doppler and the descent's own rendering are presentation and
  `PLANNED-FEATURES-CS006.md` scopes them out of P3 — but it is the largest
  gap between the simulation and what a player sees, and nothing in CS006 owns
  it. `state.dive.depth` is the value a renderer wants and it is already there.
- ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included** — the descent is
  `DIVE_TIME - DIVE_GRACE` = 2.25 s, not 2.6. Written down because it is easy to
  read the two constants as additive, and CS014's `DIVE_TIME_OD` 4.0 inherits the
  same reading.
- **`drawWell()`'s `laneState` parameter is still unwired.** Lane occupancy
  lighting (GDD §3.7) belongs with the dim band, in CS006. ⛔ The Surger's
  telegraph shipped as an **entity draw** (`drawSurgeLane`) and must not be
  moved onto `laneState` when that lands: `isLaneLit()` is a boolean over spokes
  and cannot express a progressive fill.
- **`tools/glow-lab.html` does not exist and has no owner.** It is the
  instrument for the **global** glow constants, which CS005 did not touch — both
  new entities read as per-entity multipliers on `laneLineWidth` only. What
  CS005 did instead is a headless three-channel separation gate in
  `test-cs005-p2.js`, so a retune cannot silently collapse the Drifter's two
  states into one. Palette asks: see `PLAYTEST.md`.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR`,
  `VAULTER_COLOR` and the six CS004 P1 added are inference, not design — the GDD
  specifies no enemy palette. They were chosen **as one set** against the
  constraint recorded in `C`: an enemy colour must read against all seven band
  colours (§3.6), because the well cycles and the enemies do not. ⛔ All six are
  judgeable on hardware now, and both CS005 colours for the first time.
- ⛔ **`src/07-enemies.js` wants splitting, and the moment is CS012.** Measured
  at the CS005 close. The measurement, the seam and the reasoning are in
  `ROADMAP.md` under "Still open" — ⛔ not restated here.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: that is onboarding and it is
  **CS015's**.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way, and GDD §6.1 says only "direction from `laneDelta`". Flagged for
  CS007's tuning pass in case the jitter reads as indecision rather than menace.
- ⚠ **A run that STARTS past level 99 gets the modulo well and a `bandRoll` of
  0.** `startGame()` still does `wellIndex = (level - 1) % WELLS.length` and
  `newState()` ships `bandRoll: 0`, so GDD §3.6's roll only ever happens on a
  level *transition*. Unreachable today — every run starts at level 1 — and it
  goes live with GDD §4.6's Start Depth, which caps at 81 and so may never reach
  it. ⛔ Not fixed: the changeset that lands Start Depth owns what a run starting
  past the boundary rolls, and the fix is one branch shared with `nextWell()`.
- ⚠ **A closed test may pin the literal text of a line a later phase is
  scheduled to change.** `test-cs005-p3.js` pinned all five `drawWell` arguments
  to assert one of them. Source-text assertions are the right tool for "this is
  still unwired", but ⛔ **pin only the argument the claim is about** — a regex
  over the whole call turns every future edit to that line into a red with a
  misleading message.
- ⛔ **Playtest asks live in `PLAYTEST.md`**, twenty-nine of them, five marked
  ⛔. Not session context — pull it up at the machine with a build in front of
  you, never during a build phase.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- ⚠ `C.DEBUG_SPAWN_KINDS`, `pickSpawnKind()` (`08-spawner.js`) and the six debug
  spawn actions in `23-main.js` are TEMPORARY. GDD §8.1's introduction schedule
  replaces all of them, and that is CS007's. ⛔ The list is a bench, never a
  difficulty knob — do not tune the game by editing it. ⛔ One key per §6.1
  roster row, none for a Carrier variant; six plus the `0` row is where the
  bench stops.
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board. `r` restarts. CS008 owns the screen, the submission and the real
  restart flow, and the `restart` debug action should be folded into it rather
  than left as a second way in.
- **No scoring anywhere.** `PTS_VAULTER`, `PTS_CARRIER`, `PTS_WEAVER`,
  `PTS_THORN` and `PURGE_SAVED_BONUS` are deliberately unread until `addScore()`
  lands in CS008, which is the one entry point (`CLAUDE.md`, Scoring). ⚠ The
  Drifter and the Surger shipped **no** points constants at all — GDD §6.1 gives
  the Drifter 250/500/750 by depth and the Surger 200, and CS008 lands both.
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ **Settled: `enemies` is 6** (GDD §6.1 roster rows, complete) **and
  `enemyKinds` is 9** (`ENEMY_KINDS` rows). ⛔ The next mover of either is an
  Overdrive enemy (GDD §6.4), not a cargo.

## Next up — CS006 P4

**`laneState` and the dim band.** GDD §3.6–3.7. `drawWell()`'s fifth-from-last
`laneState` parameter has been unwired since CS001 P3 and this is what wires it.
⛔ **It legitimately breaks `test-cs005-p3.js`'s narrowed source pin** (`null` →
`lit`), which is what P1 recorded as the assertion's retirement moment. ⛔ **The
Surger's telegraph must NOT move onto `laneState`**: `isLaneLit()` is a boolean
over spokes and cannot express a progressive fill (`drawSurgeLane` stays an
entity draw).

⛔ CS006's scope was split at P0 and it is four systems, not five: past-99 well
progression and the colour-band roll (**P1, done**), `throatOffset` and the two
degenerate wells (**P2, done**), the Dive (**P3, done**), and `laneState` with
the dim band — GDD §3.3, §3.6–3.7, §5, §4.5 item 5.
`PLANNED-FEATURES-CS006.md` and `IMPLEMENTATION-PHASES-CS006.md` are written and
are the authority on the phase order.

⛔ **P5 OWNS EXACTLY ONE BASELINE RE-RECORD AND IT IS NOT THE ONE ANYBODY
PREDICTED.** It is `test-cs006-p2.js`'s `P1_DETERMINISM_HASH`, red since P3,
cause proven and written at the assertion itself and in P3's ledger entry above.
`test-cs004-p1.js`'s `GOLDEN_LANES` is **green and owes nothing** — measured,
not assumed. ⛔ A re-record is the one moment a stray RNG draw can be laundered
into a new baseline, so it happens once, deliberately, with the cause named. If
P4 moves `GOLDEN_LANES` (it should not — `laneState` is a draw-path change and
⛔ nothing in the draw path may call `state.rng()`), that is a **second**
nameable cause and gets its own line.

⛔ **The heat clock, GDD §8.1's introduction schedule, the spawner-stall call and
telemetry are the NEW CS007** and are not this changeset's:

1. ⛔ **The introduction schedule is what makes the spawner stall live** — and
   both are CS007's. CS006 does not delete `C.DEBUG_SPAWN_KINDS` and must not
   answer the "threats or entities?" design call ahead of it.
2. ⛔ **The heat clock is what breaks `SURGE_DISCHARGE < RESPAWN_INVULN`** —
   CS007's, asserted from the constants in `test-cs005-p3.js`.

⚠ **One clock: `game.level`** (`CLAUDE.md`, Config; `DIFFICULTY-NOTES.md`). Every
heat-derived value comes off it, in CS007. No parallel clocks.

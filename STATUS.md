# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS004 (P3 of 5 done) · Wells: 16/16 · Enemies: 3/6 Classic · Tracks: 0/5

## Phase ledger — CS004

- **P1 — the seventh contract field, the debug bench, the pointer sweep.** ✅
  `anchored` on the `Enemy` base, the respawn skip, five named debug spawn
  actions, `C.DEBUG_SPAWN_KINDS` + `pickSpawnKind()`, the six Classic enemy
  colours, and the changeset renumber across the repo.

`anchored` is the seventh contract field and says ⛔ **what `depth` MEANS** —
`false` is a position, `true` is a length rooted at the throat. `respawnSkimmer()`
skips anchored entities. ⚠ **This is not a narrowing of GDD §4.4's settled rim
push:** the band is untouched — everything above `RESPAWN_PUSH_DEPTH` still comes
down to it, in every lane — and the ⚠ comment was extended, not replaced, in the
code and in GDD §4.4. Every enemy that exists today is `false` and unaffected.

The bench is five named actions on the existing `actionKeys` path (`1`–`4`, `0`),
never a second listener; the three unbuilt kinds are no-ops because
`spawnEnemy()` returns `null` for an unknown kind. `pickSpawnKind()` reads ⚠
`C.DEBUG_SPAWN_KINDS` (`["vaulter"]`) and ⛔ **spends no RNG draw on a one-entry
list** — the spawn-lane sequence is byte-identical to the pre-change build.

**Mutation-checked:** removing the anchored skip, narrowing the clamp to a rim
band, and an unconditional `rngPick` each turn the suite red.

- **P2 — the Carrier, the split, and the cargo table.** ✅ `class Carrier`,
  `CARGO`, `splitLanes()`, the `carrierVaulter` kind, the hull and the cargo
  glyph, and `scratchpad/test-cs004-p2.js` (91 assertions).

The Carrier climbs one lane at `C.CARRIER_CLIMB` 0.11 and stops at the rim;
`killDepth` is `1 - C.RIM_CONTACT_DEPTH`, the Vaulter's expression. ⛔ It touches
no lane helper at all, so "never hops" is an absence of code and the test
asserts **exact** lane equality over 3,000 ticks on all sixteen wells.

⛔ `splitLanes(well, lane)` lives in `03-wells.js` beside `laneHop`, because what
makes it hard is GDD §3.5 and nothing about cargo: on an open well the pair is
**shifted inward**, never clamped, so the gap stays two lanes at the wall — a
lane-0 parent on the Vee yields 0 and 2, and one child still occupies the lane
the parent died in. One helper serves all three §6.2 rows.

⛔ Both children go through `spawnEnemy()`, so the split inherits the safe-spawn
lowering, `C.ENEMY_CAP` (a split with one slot free adds exactly one child), and
two RNG draws. The push happens inside `collideShots()`'s own loop; the ⚠ SETTLED
reasoning is at the call site in `07-enemies.js` and in `09-collision.js`, along
with the ⚠ note that the Purge kills without calling `onShot()`.

**Mutation-checked, all three red:** a split that pushes straight into
`state.enemies` (8 assertions), a `splitLanes` that is a bare
`laneNormalize(lane ± 1)` (3), and a conditional `break` in `collideShots` (3
here plus 2 in `test-cs003-p3.js`).

- **P3 — the Weaver, its bolt, and GDD §4.5 item 4.** ✅ `class Weaver`,
  `class WeaverBolt`, the `weaver` and `weaverBolt` kinds, the open spiral and
  the dart, and `scratchpad/test-cs004-p3.js` (99 assertions).

The cycle is a phase string and one up-counting timer: climb at
`C.WEAVER_CLIMB` to `C.WEAVER_APEX` 0.55, hold `C.WEAVER_APEX_HOLD`, retreat at
the faster `C.WEAVER_RETREAT`, repeat. ⛔ `fired` is a per-CYCLE latch, not a
cooldown — the bolt goes out on the FIRST step of the hold, so the player reads
it while its parent is still at the apex. A Weaver that arrived ABOVE the apex
turns around from where it is rather than teleporting down to the line.

⛔ The Weaver's `killDepth` is the roster's first `null`: its body never kills at
any depth, the rim included, and the test proves it through the real
`collideSkimmer`. `blocksClear` stays `true`. The bolt is the mirror —
`killDepth = 1 - C.RIM_CONTACT_DEPTH` (GDD §4.5 item 4, live, with no new
collision code), `blocksClear = false`, `purgeable = true`, ⚠ `onShot` returns
`false` so it is not shootable, and it dies at `depth 1` the step AFTER arriving
so the rim step is still lethal.

⛔ `Weaver.fire()` goes through `spawnEnemy()` — the second non-spawner caller —
so the bolt inherits `C.ENEMY_CAP`, the safe-spawn lowering and one RNG draw.
The `layThorn()` hook is an empty one-liner naming P4.

**Mutation-checked, all six red:** a rim-band `killDepth` on the Weaver, a
consuming bolt `onShot`, a fire without the latch (21 bolts a cycle), a
`blocksClear` left true, a `fire()` that pushes straight into `state.enemies`,
and a Weaver drawn as a closed path.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js` passes: 16 test files, zero skips.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer. Full
  narrative in `log/CS001.md`.
- CS002 closed 2026-08-30 — the loop, the Skimmer, shots, and all four input
  devices (mouse/keyboard/touch/gamepad), verified on real hardware. Full
  narrative in `log/CS002.md`.
- CS003 closed 2026-08-30 — the seeded RNG, the entity contract, the Vaulter,
  the spawner and well lifecycle, the one collision pass, the Purge, death,
  lives, respawn and the game-over stop. Shipped constants, every judgment call
  and the mutation-check record are in `log/CS003.md`.
- ⛔ GDD §17 item 1 (determinism) and item 3 (enemy wall behaviour) are both
  covered by `scratchpad/test-cs003-p5.js`, driven through the real
  `startGame` / `nextWell` / `update`. **Item 3's finding is worth knowing
  before touching lane code:** a range check alone does not catch §3.5's bug —
  a wrapped hop on a 13-lane strip lands inside `[0, 12]`. The tell is the
  per-tick lane SPEED, and that is what the soak asserts.
- ⛔ **`test-cs004-p1.js` carries a GOLDEN spawn-lane sequence** recorded from
  the build at `9ebd27b`, before `pickSpawnKind()` existed. It is the only
  guard on the no-draw rule that works end to end: `test-cs003-p5.js`'s
  determinism hash compares two runs of the *same* build, so a stream shift is
  self-consistent there and invisible. Retuning the spawner legitimately
  re-records it; a stray RNG draw does not.
- ⛔ CS004 reads GDD §6.5 before adding an enemy. It now spells out **seven**
  contract fields, the one enemy array, the one spawn entry point, the one
  well entry and the one collision pass.
- `tools/well-lab.html` — well polygons and the perspective curve.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- **`tools/glow-lab.html` does not exist.** `CLAUDE.md`'s design-instruments
  section lists it as the home of the line-weight and glow-falloff decisions
  measured against a busy frame. It is also the instrument the eight ⚠ colour
  placeholders below are waiting on.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR` (`#FFFFFF`),
  `VAULTER_COLOR` (`#FF4A4A`) and the six CS004 P1 added (`CARRIER_COLOR`,
  `WEAVER_COLOR`, `WEAVER_BOLT_COLOR`, `THORN_COLOR`, `DRIFTER_COLOR`,
  `SURGER_COLOR`) are all inference, not design — the GDD specifies no enemy
  palette. They were chosen **as one set** against the constraint recorded in
  `C`: an enemy colour must read against all seven band colours (§3.6), because
  the well cycles and the enemies do not. ⛔ **The set cannot actually be judged
  until P4**, because `spawnRow` currently puts two silhouettes on screen.
- **`drawWell()`'s `laneState` parameter is still unwired.** Lane occupancy
  lighting (GDD §3.7) belongs with the dim band, in CS006. Note
  `PLANNED-FEATURES-CS004.md` finding 6: the Surger's telegraph is an entity
  draw and must NOT be built on `laneState`.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: that is onboarding and it is
  **CS014's**. (The earlier ⚠ note that `STATUS.md` and `ROADMAP.md` disagreed
  is resolved; the renumbered `ROADMAP.md` says the same thing.)
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way (contact tolerance is half a lane), and GDD §6.1 says only
  "direction from `laneDelta`". Flagged for CS006's tuning pass in case the
  jitter reads as indecision rather than menace.
- **GDD §3.3's `throatOffset` is undefined** — no well uses it and the GDD never
  says what it offsets. `wellThroat` defaults it to zero. Design call for Paul.
- **The Flat well (11) is geometrically degenerate**: its rim is a straight
  line, so it renders with zero depth. Same underlying question as
  `throatOffset` (an offset throat is what would fix it). It has no owner —
  `ROADMAP.md` never put well progression in CS004, and well progression is
  CS006 — so it is a design call for Paul before CS006 rather than a task.

## Findings from P1 (hazards the phase prompt did not name)

- ⛔ **The +1 renumber is wider than the `CS005` pointers, and stopping at them
  would have made the repo worse.** Everything from CS005 on shifted, so **front
  of house moved CS006 → CS007**, **onboarding CS013 → CS014** and **ship
  CS014 → CS015**. Sweeping only the `CS005` strings would have left `CS006`
  meaning *two different changesets inside one file*: `23-main.js` would say
  both "the introduction schedule and the heat clock are CS006's" and, three
  functions later, "CS006 owns the real restart flow". P1 swept the lot —
  **22 front-of-house mentions** across `src/02-state.js`,
  `src/09-collision.js`, `src/23-main.js`, `VECTOR-VORTEX-GDD.md` and the CS003
  P3/P4 test files, plus **2 ship mentions** (`VECTOR-VORTEX-GDD.md` §21 #6 and
  `DECISIONS.md`, both the Mimic's probation verdict). ⚠ If a future session
  finds another, the rule is the same: read it, decide what it *meant*, and add
  one.
- **Seventeen `CS005` sites, not twelve.** The inventory in
  `PLANNED-FEATURES-CS004.md` missed three in `scratchpad/test-cs003-p2.js`
  (the `SPAWN_MIN` heat-floor comment, its assertion string, and the
  `WELL_CLEAR_HOLD` note) and counted `src/09-collision.js` outside the total.
  All seventeen are swept.
- **The duplicate root `_harness.js` was already gone.** Paul removed it in
  `7817d33`, after CS003 P5. P1 verified its absence and the green suite rather
  than deleting it; the stale `STATUS.md` entry is what remained, and it is
  gone now.
- **GDD §6.1's "The other five are CS004's" was stale from the split.** Rewritten
  to name which three are CS004's and which two are CS005's.

## Findings from P2 (hazards the phase prompt did not name)

- ⛔ **The bench key `2` was one string short of working, and P1's "touching
  nothing here" was wrong about it.** `ENEMY_KINDS` needs one row per Carrier
  VARIANT — the cargo is half of what the entity is — so the kind is
  `carrierVaulter`, not `carrier`, and the bench's `DEBUG_SPAWN_ACTIONS` and
  `DEBUG_ROW_KINDS` both named `"carrier"`. Both are updated. That also made
  `test-cs004-p1.js`'s "`2`/`3`/`4` are no-ops" assertion false, so it now covers
  `3` and `4` only, with a ⚠ note saying why; **P3 and P4 will each do the same
  to their own digit.** The bench has five keys and the roster has six — CS005's
  two cargo rows do not get keys of their own.
- **`test-registry.js`'s `enemies` count went 1 → 2 here, not 1 → 4 in P5.**
  `test-cs003-p5.js` compares `Object.keys(ENEMY_KINDS).length` against it, so
  the suite goes red the moment a kind lands. P3 and P4 raise it again; ⛔ P5's
  instruction is therefore **confirm it is 4 and make the check smarter**, not
  raise it — by then `ENEMY_KINDS` holds more rows than the roster has entries.
- **The `splitLanes` prose in `PLANNED-FEATURES-CS004.md` and the P2 prompt has a
  slip, and the concrete example is the one that shipped.** "The pair still
  straddles a lane, and the lane it straddles is the parent's" cannot be true at
  a wall: children at 0 and 2 straddle lane **1**. What is actually true there,
  and what keeps the trap honest, is that **one child occupies the parent's own
  lane**. The named outcome (0 and 2) is unambiguous and is what the code does.
- **At the rim the cargo glyph's apex touches the hull's near tip, and that is
  `entityPoints()`, not the shape.** It clamps every poly so the poly's
  outermost point lands exactly ON the rim, so two polys drawn at the same depth
  meet there however differently they are proportioned. It happens only in the
  clamp band, it is documented at the shape data, and ⛔ fixing it would mean
  changing `entityPoints`, which finding 4 puts out of scope.

## Findings from P3 (hazards the phase prompt did not name)

- ⛔ **`ENEMY_KINDS` stopped matching the roster count at P3, not at P5.**
  `test-cs003-p5.js` compared `Object.keys(ENEMY_KINDS).length` against
  `test-registry.js`'s `enemies`, and the bolt is a kind with no GDD §6.1 roster
  row — so that equality went red the moment the Weaver landed. STATUS predicted
  this for P5 ("confirm it is 4 and make the check smarter"); it arrived a phase
  early. Fixed by **splitting the number in two, in the one file allowed to name
  a global count**: `enemies` (3) counts roster rows and `enemyKinds` (4) counts
  `ENEMY_KINDS` rows, and `test-cs003-p5.js` now compares against the latter.
  ⛔ **CS005 raises both, and by different amounts** — the Drifter and the Surger
  are two roster rows but four kinds, because `carrierDrifter` and
  `carrierSurger` come with them.
- **The bolt's death step is an ORDERING decision, not a clamp.** `Game.update()`
  runs the entity pass, then collision, and `collideSkimmer()` skips anything
  already `dead` — so killing the bolt on the step its depth reaches 1 would make
  the rim step silently non-lethal. It dies on the step AFTER. The lethal band
  starts nine steps earlier at `killDepth`, so this is belt and braces; it is
  written that way so the belt does not depend on the braces.
- **`Weaver.fire()` reads the GLOBAL `state`, the same way `Carrier.onShot()`
  does**, because that is how `spawnEnemy()` finds the current well. Any test
  that drives a Weaver's cycle on a well the state is not pointing at puts its
  bolts somewhere else; `test-cs004-p3.js`'s all-sixteen-wells lane soak calls
  `useWell(wi)` per well for exactly this reason, and the trap is in its header.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- ⚠ `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch in `Game.update()`
  that reads them are TEMPORARY and are CS006's to delete when the Dive lands.
- ⚠ `C.DEBUG_SPAWN_KINDS`, `pickSpawnKind()` (`08-spawner.js`) and the five
  debug spawn actions in `23-main.js` are TEMPORARY. GDD §8.1's introduction
  schedule replaces all of them, and that is CS006's. ⛔ The list is a bench,
  never a difficulty knob — do not tune the game by editing it.
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board and the craft that died on it. `r` restarts. CS007 owns the screen, the
  submission and the real restart flow, and the `restart` debug action should be
  folded into it rather than left as a second way in.
- `scratchpad/test-registry.js` now carries TWO counts. `enemies` is 3 (P3
  raised it for the Weaver) and counts GDD §6.1 roster rows; `enemyKinds` is 4
  and counts `ENEMY_KINDS` rows. P4 raises both by one for the Thorn. ⛔ Both
  live there and in no other file, and the Weaver's bolt is a kind and not a
  roster row.

## Next up

- CS004 P4 — the Thorn and the chip economy, plus the Weaver's lay-and-adopt.
  ⛔ `Weaver.layThorn(well, state)` in `src/07-enemies.js` is the empty hook P4
  fills; it is called every step of the climb phase and nowhere else.
- ⛔ P4 lights up debug digit `4` and must narrow `test-cs004-p1.js`'s no-op
  loop the way P2 and P3 did — the loop is down to `["4"]` and P4 empties it, so
  ⛔ **delete the case rather than leave a loop over nothing.**
- ⛔ P4 raises BOTH registry counts (`enemies` 3 → 4, `enemyKinds` 4 → 5).
- ⛔ P4 is where P1's `anchored` fix is proved through the real death path: a
  Thorn at `depth 0.9` still measures `0.9` after a death and respawn.
- ⛔ The bolt is now the roster's real non-consuming `onShot`, so CS005's
  armoured Drifter has a working precedent and a mutation check to copy.

## Playtest asks (open only)

- Does the flattened X read as a *threat* at throat depth, and is
  `VAULTER_SIZE` 0.70 enough silhouette to see it coming?
- Does `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3 produce level-1 pressure
  that feels fair? Both halves are fully observable now — a death costs a life
  and freezes the board.
- Does the death sequence read? 1.2 s of hit-stop with no fragmentation and no
  sound is a long time to look at a frozen board — CS007 adds the fragmentation
  and CS008 the sound, but the freeze LENGTH is settled now and worth judging
  bare.
- Is `RESPAWN_PUSH_DEPTH` 0.55 far enough? The clamp plus `RESPAWN_INVULN` 1.5 s
  is meant to guarantee a Vaulter cannot climb back into contact before the
  blink stops. It is provable at `VAULT_CLIMB` 0.18; it stops being provable the
  moment CS006's heat curve raises the climb rate.
- Is `HIT_DEPTH_TOL` 0.05 generous enough that a shot fired at a climbing
  Vaulter connects when it looks like it should? The band is ~3x the distance a
  shot covers in one step, so misses should read as aim, never as luck.
- **Is the cargo glyph readable at throat depth?** §6.2 says reading it fast is
  the skill that separates competent from good, so the deep end is the test, not
  the rim. Press `2` and watch one climb the whole way.
- ⚠ **Should the glyph be stroked in the CARGO's colour rather than the hull's?**
  It ships in `CARRIER_COLOR` because §3.6's palette note says silhouette carries
  the read; a cargo-coloured glyph is one lookup away and is an art call, not a
  phase's.
- **Does `CARRIER_CLIMB` 0.11 — nine seconds throat to rim — read as §6.2's
  "shoot deep; you have time", or just as slow?**
- ⚠ **The palette, once P4 lands.** Press `0` on a busy well: do six enemy
  colours stay separable from each other and from the cyan band, and does the
  Thorn read as scenery rather than as a creature?
- **Does the Weaver's cycle read as a cycle?** Press `3` and watch one for ten
  seconds: *it comes up, it spits, it goes back down.* If the retreat reads as a
  second approach, `C.WEAVER_RETREAT` is the knob.
- **Is the bolt legible enough to dodge?** It is the one thing in Classic that
  cannot be shot, so the whole answer is rotating out of the lane. ~1.4 s from
  the apex to the rim.
- ⚠ **Does a Weaver sitting on the rim in your lane read as safe?** Its body
  never kills, which is correct and is going to look wrong the first time.

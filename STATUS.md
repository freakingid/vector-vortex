# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS005 (not started) · Wells: 16/16 · Enemies: 4/6 Classic · Tracks: 0/5

## Phase ledger — CS005

- Not started. `PLANNED-FEATURES-CS005.md` and `IMPLEMENTATION-PHASES-CS005.md`
  do not exist yet.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js` passes: 19 test files, zero skips, ~4 s.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer.
- CS002 closed 2026-08-30 — the loop, the Skimmer, shots, and all four input
  devices (mouse/keyboard/touch/gamepad), verified on real hardware.
- CS003 closed 2026-08-30 — the seeded RNG, the entity contract, the Vaulter,
  the spawner and well lifecycle, the one collision pass, the Purge, death,
  lives, respawn and the game-over stop.
- CS004 closed 2026-08-30 — the Carrier and `splitLanes()`, the Weaver and its
  bolt, the Thorn and the chip economy, the `anchored` contract field, the debug
  bench, and the extended §17 soak. **Four of six Classic enemies; GDD §4.5
  conditions 1 and 4 live.** Full narrative, shipped constants, every judgment
  call and the seventeen-row mutation-check record are in `log/CS004.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** It now carries seven contract
  fields, six wiring points, the one array / one spawn entry / one well entry /
  one collision pass rule, and — new in CS004 — why `Carrier.onShot()` may push
  into `state.enemies` from inside the collision pass's own loop.
- ⛔ **Two soaks, and they prove different things.** `test-cs003-p5.js` catches
  GDD §3.5's wrapping hop with a per-tick lane SPEED bound, because a wrapped hop
  on a 13-lane strip lands inside `[0, 12]` and a range check passes it.
  `test-cs004-p5.js` asserts the STRONGER form for the four entities that do not
  hop at all: `lane` is exactly the lane it entered with, `Object.is`, no epsilon.
  ⛔ `MAX_LANE_STEP` is still the Vaulter's and has to become **per-entity** in
  CS005 — see the carried tasks.
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
  the well cycles and the enemies do not. The four Classic ones are judgeable now
  — press `0` for the staggered row; the two CS005 reads are not.
- **`drawWell()`'s `laneState` parameter is still unwired.** Lane occupancy
  lighting (GDD §3.7) belongs with the dim band, in CS006. ⛔ The Surger's
  telegraph is an entity draw and must **not** be built on `laneState`.
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

## Findings from CS004 P5 (hazards the phase prompt did not name)

- ⛔ **The spawner stall above.** It is the finding of the changeset and it was
  found by the soak coming back nearly empty, not by reading the code.
- ⚠ **GDD §6.5's field table was already seven fields.** The P5 prompt asked for
  six → seven; CS004 P1 had done it when it added `anchored`. P5 confirmed it and
  added the half that was genuinely missing: the row now says that the field is
  **not** a narrowing of §4.4's settled rim push, and points at
  `RATIONALE.md#thorn-depth`.
- ⚠ **The P5 prompt's "raise `enemies` from 1 to 4" was stale.** P2, P3 and P4
  each raised it as their enemy landed, and P3 created `enemyKinds` besides. P5
  confirmed 4 and 5 rather than raising anything, and replaced the bare
  comparison with a **derivation**: the roster is the distinct classes
  `ENEMY_KINDS` can build, minus the projectiles. ⛔ CS005 adds two roster rows
  and four kinds and needs no edit to that check.
- ⚠ **`log/CS003.md`'s changeset numbers predate the +1 renumber.** CS004 P1
  swept the live repo but left the closed log as written, which is right — a
  historical record is not revised. P5 added a header note to it saying so, and
  giving the translation. ⛔ The same will be true of `log/CS004.md` after the
  next renumber; note, do not rewrite.
- ⛔ **A LEGAL INVARIANT WAS BEING VIOLATED IN SHIPPED OUTPUT, and P5 fixed it.**
  `src/14-render-entities.js` carried the homaged title in a comment — one word,
  from CS002 P3 — and `src/` is concatenated into `dist/vector-vortex.html`, so it
  was a string in the shipped artifact. `CLAUDE.md` and GDD §18 item 1 both say
  the word appears in **no file**, comments included, and GDD §19's Quality
  criteria say the same. The comment now cites GDD §10.3 for the reason instead
  and carries a ⛔ note saying why it must not come back. ⚠ **The design docs keep
  the word** — §18 has to name what it prohibits, and the GDD is not shipped.
  `grep -rn` over `src/`, `tools/`, `build.js` and `README.md` is now zero.
- **The recorded input list is now checked against the FUNCTION**, not trusted.
  `test-cs004-p5.js` drives `replay()` into a recorder and asserts it never
  presses `r`, `w` or any of the five debug digits — a debug spawn inside a
  hashed run makes the hash depend on a key map, and that failure would look like
  flaky determinism rather than like its cause.

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
- **No scoring anywhere.** `PTS_VAULTER`, `PTS_CARRIER`, `PTS_WEAVER`,
  `PTS_THORN` and `PURGE_SAVED_BONUS` are deliberately unread until `addScore()`
  lands in CS007, which is the one entry point (`CLAUDE.md`, Scoring).
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. `enemies` is **4** (GDD §6.1 roster rows) and `enemyKinds` is **5**
  (`ENEMY_KINDS` rows). ⛔ **CS005 raises both, by different amounts** — the
  Drifter and the Surger are two roster rows but four kinds, because
  `carrierDrifter` and `carrierSurger` come with them.

## Next up — CS005: the Drifter and the Surger

No planning docs yet. What CS004 leaves on the table for it, from
`ROADMAP.md` and the phases that found it:

- ⛔ **`laneHop()`'s half-lane fold point is CS005's**, and the Drifter is the
  entity that makes it matter — it is the first thing in the build that rides
  lane *boundaries* and moves continuously in lane space. ⛔ Do not change the
  helper without the entity that exercises it; the Vaulter's behaviour on that
  path is documented and correct.
- ⛔ **`MAX_LANE_STEP` has to become per-entity**, in `test-cs003-p5.js` and
  `test-cs004-p5.js` both. Today it is `2 * DT / C.VAULT_HOP_TIME` — the
  Vaulter's hop — and a continuously-moving Drifter will either trip it or force
  it so wide it stops catching anything.
- ⛔ **The armoured Drifter has two shipped precedents for `onShot`.** The
  Weaver's bolt is the non-consuming one (`return false`, the shot flies on, and
  ⚠ it still costs that shot its resolution for the few steps of overlap because
  the `break` is unconditional); the Thorn is the consuming one. Both have
  mutation checks to copy.
- ⛔ **Two cargo rows, and they add no test.** `test-cs004-p5.js`'s §17 item 6
  case is a loop over the `CARGO` table that discovers each cargo's carrier from
  `ENEMY_KINDS`, so CS005 adds `carrierDrifter` and `carrierSurger` rows and
  nothing else.
- ⛔ **The Surger owns its telegraph as an entity draw**, not on `laneState`.
  `SURGE_TELEGRAPH` (0.45 s) already exists in `C` and is unread.
- ⚠ The Drifter's `killDepth` is `0` — lethal at any depth — which is GDD §4.5
  item 2 and needs no collision code, exactly as the bolt's rim band did not.

## Playtest asks (open only)

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
- ⚠ **The palette, on a busy well.** Press `0`: do the four Classic enemy colours
  separate from each other and from the cyan band, and does the Thorn read as
  scenery rather than as a creature?

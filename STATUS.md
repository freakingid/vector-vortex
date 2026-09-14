# Vector Vortex — STATUS
Version: 0.0.4 · Changeset: CS008 (P6 done — ⛔ P7, the Controls page, next) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS008

One line per phase here; ⛔ **reasoning goes to `log/CS008.md` as the phase
goes**, not to this file (`CLAUDE.md`, Session rules, 2026-08-31).

- **Planning (2026-09-13)** — the plan and phases docs, eight phases, every
  call Paul's (plan §0). Three handover claims were measured false. Built nothing.

- **P1 — the rim fix, (A) + (B) + ε.** An enemy arriving at the rim in a firing
  lane is killed on every cooldown phase, 24/24. Both planned re-records landed
  at the planned values. Mutation-checked (`log/CS008.md`).

- **Planning, P1b (at `0b41f55`)** — K1–K4 answered: the rim sweep, levels 1–4
  deathless for a fire-holder (a P8 ask), and armour, bolts and a sub-rim
  discharge still kill.

- **P1b — the crossing fix, the rim sweep.** With fire held, a rim enemy a shot
  could kill dies on contact. C1–C13 and N1–N3 are 24/24, and the hash is
  **1229033515**. Mutation-checked.

- **P2 — scoring and extra lives.** `addScore()`, `clearBonuses()`, `points()`;
  lives at 20k then every 40k. No baseline moved. 14 of 14 mutations red.

- **P3 — mode and Start Depth.** `startGame(seed, opts)`, `startBonus()`, the
  session record behind `levelRecord()`, `startDepthOptions()`. No baseline
  moved. 7 of 7 mutations red.

- **P4 — text, the HUD, the fragmentation.** `drawText()` is the one text site;
  also `drawHud(ctx, view)` + `hudLayout()`, and `drawFragments()` on hit-stop
  progress. No baseline moved. 12 of 12 mutations red.

- **P5 (2026-09-13) — the screens.** Boot is the title. `update()`'s stop is
  `screen !== "play"` and runs the menu step. `createMenu()` + `drawMenu()` are
  kit-menu's draft (`src/15-render-hud.NOTES.md`). The screens are title, mode
  (OVERDRIVE locked), START DEPTH (list + bonus), options (a stub) and game over
  (RESTART same mode and depth, new seed / QUIT TO TITLE). `quitToTitle()` has
  the CS011 note, and `r`/`restart` are deleted.
  - ⛔ **Touch measured first. Paul's call: outside play, drag moves and a tap
    above the zone confirms.** kit-input **0.4.0** adds `configure()` +
    `touchTapFire`, flipped in `syncScreen()`.
  - `test-cs008-p5.js`, 309 assertions: the whole flow on four devices, back,
    one row per tap, the stop on every screen, H4. **11 of 11 mutations red.**
  - **No baseline moved.** `test-cs003-p4.js` was rewritten in place; one new
    cause below. GDD §10.5 + its §0 row; the two parked asks un-parked.

- **P6 (2026-09-13) — pause, Options, Credits.** A `"pause"` screen reached from
  Escape (`back` in play), `p`, gamepad Start, a top-centre touch target, and
  the page going hidden. Its rows are RESUME / OPTIONS / QUIT TO TITLE, and
  resume is instant.
  - ⛔ **`frame()` drains the freeze only on `play`/`gameover`.** OPTIONS
    (TELEMETRY, EXPORT, CONTROLS stub, CREDITS) is reachable from the title
    and from pause.
  - kit-input **0.5.0**: `gamepadActions`, `touchTopAction`, `hiddenAction`,
    `pageHidden()`, and `configure({ touchTopTarget })`.
  - `test-cs008-p6.js`, 208 assertions. **16 of 16 mutations red.** No
    baseline moved; `test-cs008-p5.js` has two claims rewritten in place.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules, 395.1 KB); the
  manifest is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **41 test files, all green, zero skips.**
- CS001 closed — 16 wells, the depth model, the well renderer.
- CS002 closed — the loop, the Skimmer, shots, and all four input devices
  (mouse/keyboard/touch/gamepad), verified on real hardware.
- CS003 closed — the seeded RNG, the entity contract, the Vaulter, the spawner
  and well lifecycle, the one collision pass, the Purge, death, lives, respawn
  and the game-over stop.
- CS004 closed — the Carrier and `splitLanes()`, the Weaver and its bolt, the
  Thorn and the chip economy, the `anchored` contract field, the debug bench.
- CS005 closed — the boundary lattice and `laneHop`'s fold-bound parameter, the
  Drifter, the Surger, the two remaining cargo rows, the six-kind §17 soak.
  ⛔ **The Classic roster is complete at six and GDD §6.2's variant table at
  three.**
- CS006 closed — the +1 renumber and the CS006/CS007 split, past-99 well
  progression and the colour-band roll, `throatOffset` and the two degenerate
  wells behind `C.MIN_LANE_SPOKE_PX`, **the Dive**, and `laneState` gated to the
  dim band. ⛔ **All five of GDD §4.5's death conditions are live.**
- **CS007 closed 2026-08-31 — the run escalates.** ⛔ **One clock**: `heat()` and
  seven accessors beside `C`, Form A endpoint interpolation, `HEAT_FULL_LEVEL`
  99, `heat(1)` exactly 0, and GDD §4.4's respawn guarantee held by a hard
  `C.CLIMB_MULT_MAX` 1.40 with `C.RESPAWN_PUSH_DEPTH` staying 0.55 at every
  level. ⛔ **GDD §8.1's introduction schedule as DATA** — `C.SPAWN_SCHEDULE`,
  seven rows, `eligibleKinds(level)` a function of the level and nothing else,
  and CS004's ⚠ TEMPORARY bench constant deleted. ⛔ **The spawner-stall split** —
  the release budget counts THREATS, the readability ceiling counts ENTITIES.
  ⛔ **Telemetry** — 29 columns, the ring, the session switch, the CSV. Full
  narrative, the shipped constants, every judgment call, the four baseline
  re-records with one cause each, the eleven closed-file edits and the
  acceptance-criteria verdicts are in `log/CS007.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields, six wiring
  points, the one array / one spawn entry / one well entry / one collision pass
  rule, and — CS006 — **the Dive**: an entity that is `blocksClear: false` and
  not `anchored` must decide explicitly whether it survives a dive.
  `startDive()` filters to `anchored`, so today the answer is *no*.
- ⛔ **FIVE SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS — which
  is stated as a LEVEL in each of them.** `test-cs003-p5.js` is the VAULTER soak
  (level 2) and catches GDD §3.5's wrapping hop with a per-tick lane SPEED bound.
  `test-cs004-p5.js` runs the schedule's three-kind band (level 7) and asserts
  the STRONGER exact-lane form; it also asserts that band ENDS at 8, because a
  level-9 Drifter crosses lanes and its `hopless` assertions do not describe one.
  `test-cs005-p5.js` and `test-cs006-p5.js` run the full board (level 23) — the
  latter owns **the Dive**. ⛔ **`test-cs007-p5.js` is the only one that pins no
  level at all**: it owns the ESCALATING run, twenty runs from level 1 to the
  stop, and it arms **no `C` fixture** because raising `C.ENEMY_CONCURRENT` the
  way the other four do would flatten the concurrency ladder it is there to
  watch. ⛔ A future changeset extends the pattern with a sixth file rather than
  widening a closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule, and
  since CS007 P3 it is a function of the LEVEL.** Draws per interval spawn are
  `spawnEnemy`'s 1 (the heading) plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, plus **+0 at levels 1–2 and +1 from level 3** — each
  counted directly on the shipped function. ⛔ **It needs no baseline and survives
  every retune**, which is what let all three of CS007's `P1_DETERMINISM_HASH`
  re-records be checked rather than merely recorded.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are STILL
  the ORIGINAL recording from `9ebd27b`** — through CS006, CS007, CS008 P1, P1b and P2,
  character for character, and a separate prefix assertion now holds them.
  ⛔ **THE ONE EXCEPTION: CS008 P1 APPENDED `2, 5`, and it has ONE cause — the
  climb stops at the kill band**, so held fire clears the window sooner and two
  more spawns fit. Written at the assertion. It covers appends from that cause
  only; the rule below is not weakened for anything else. ⚠ Five documents predicted a move (the
  Dive, then heat, then the schedule) and all three predictions are **measured
  false**: the golden's 3,000-tick window ends at level 2, `heat(1)` is 0 and the
  eligible set there is one entry, which spends no draw. ⛔ **A move is a defect,
  not a baseline** — heat leaking into level 1, or a stray draw.
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is a CROSS-FILE one** — it runs the closed `test-cs005-p5.js` in a child
  process. It stands at **1229033515** (CS008 P1b, the crossing fix — two causes
  measured apart and written at the assertion: the sweep alone 4203989832, the
  soaks' first-run `lives = 1` alone 2859072280; the planned value, matched to
  the digit before the re-record). ⛔ Re-record it **once per change, with
  one named cause written at the assertion**, and check the move against the
  draws-per-spawn count above.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound.** Proved by mutation at the CS005 close: a wrapping Drifter cross leaves
  both a range check and a per-tick speed bound green, because `crossDur()`
  scales with the cross distance. GDD §3.5 and `RATIONALE.md#boundary-lattice`.
- `tools/well-lab.html` — well polygons, the perspective curve, live
  `throatOffset` sliders and a **Legibility** readout. ⚠ Its duplicated slice
  agrees with the build to 1e-13 px on all sixteen wells; ⛔ **the visual audition
  has not happened** — the ask is in `PLAYTEST.md`.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- ⛔ **CS008 P5 — A CLOSED REPLAY THAT OUTLIVES ITS GAME OVER NOW MEETS A LIVE
  MENU.** The stop used to be inert; now a scripted Fire there RESTARTS on a time
  seed and a Purge quits. `test-cs008-p3.js` hit it (game over at tick 7,938 of
  8,000) and its driver now stops pressing at the stop. ⛔ **P8's sixth soak and
  any new replay must do the same**, or restart through `startGame(seed)` as the
  soaks do. Same family as P2's lesson: an emulation that adds no export, method
  or key cannot see an assertion that pins one.
- ⛔ **CS008 P4 — `test-cs008-p4.js` scans the WHOLE built file, comments
  included.** Any `fillRect`/`strokeRect` text, or a second `.fillText(` /
  `.strokeText(`, turns it red. ⛔ Never name those calls in a comment.
  `test-cs002-p3.js` also bans the text `ctx.fill` in `14-render-entities.js`.
  `test-cs002-p1.js` bans `e.key`, `.touches`, `getGamepads`, `clientX` and
  `addEventListener` outside `04-input.js`, and `C.`/`state.` inside it.
- ⛔ **CS008 P6 — `Game.update()` calls `syncScreen()` TWICE: before and AFTER
  `input.sample()`.** A named action that changes the screen inside `sample()`
  (pause) makes that step the new screen's entry step. Remove the second call
  and a Fire held in play confirms RESUME. P7's capture must respect it too.
- ⛔ **CS008 P6 — `frame()` drains `hitStopLeft` only while the screen is
  `"play"` or `"gameover"`.** Any other screen HOLDS a freeze, which is right
  for pause and its pages. P7's CONTROLS page inherits it. A new screen that
  should drain a freeze has to be added there by name.
- ⛔ **CS008 P6 — `Game.draw()` must not name `Telemetry`** (`test-cs007-p4.js`).
  The OPTIONS row's ON/OFF detail is written in `update()`'s menu stop instead.
- ⚠ **CS008 P6 — the three "Atari" mentions in `14-render-entities.js`
  comments.** GDD §18.1 says "no Atari marks anywhere — code, comments".
  `CLAUDE.md`'s list does not name it, and P6 did not touch them. Paul's call.
- ⚠ **The touch buttons, and P6's top-centre pause target, are not drawn.**
  The target is live in play only.
- ⚠ **CS008 P4 — the HUD's mirror side reads `C.INPUT_MIRROR`** (`_hudView.mirror`
  in `Game.draw()`). P7 re-points that one line at the input module.
- ⚠ **CS008 P4 — a dead craft is not drawn once the freeze is spent**, so the
  game-over board has no craft on it. That is the fragmentation finishing.
- ⚠ **`drawFragments`, `drawHud` and `drawMenu` read `C` for sizes and colours.**
  kit-fx and kit-menu extraction each owe an options argument (both `.NOTES.md`).
- ⚠ **`test-cs007-p4.js` finds the telemetry module by the text
  `// 22-meta.js`**, first occurrence. ⛔ Never start a comment line with a
  module file name.
- ⚠ **`_harness.js` has `buildGame({ stub: [names] })`** (P2: rebind to a no-op)
  **and `{ spy: [names] }`** (P5: count calls, pass through). Both act after
  evaluation, so internal callers reach them.

- ⚠ **THREE OF THE SIX ROSTER CLASSES PARK RATHER THAN HUNT — Carrier, Weaver,
  Surger — and that is what stalls a SOAK now that wells progress.** ⛔ Not a
  build defect, and ⛔ **not the standing-Thorn stall, which CS007 P1 FIXED** — a
  parked entity is `blocksClear: true`, so it correctly holds a release slot and
  correctly blocks the clear. A well whose only survivors are parked never
  clears, and a scripted driver whose rotation never reaches their lane neither
  kills them nor dies to them. ⛔ **The repair is the driver, never the build** —
  `replayWide`'s wall-to-wall pin, CS005's, now in four soak files.
  ⚠ **The Purge is the played answer** (GDD §4.3); a soak that never presses it is
  the only thing that stalls. ⛔ No code change — the reading is the record.
- ⛔ **The Dive has no visual, and a dive reads as 2.6 s of a still board.**
  `Game.draw()` paints the well, the surviving Thorns and a Skimmer still drawn
  at the rim; nothing shows the descent. ⛔ Deliberate — GDD §5's camera widen,
  doppler and the descent's own rendering are presentation and CS006 scoped them
  out — but it is **the largest gap in the build between what is simulated and
  what is seen**, and no changeset owns it. `state.dive.depth` is the value a
  renderer wants and it is already there. The `PLAYTEST.md` ask names the failure
  mode that makes it more than cosmetic: *when a Thorn kills you in a dive, can
  you tell what killed you?*
- ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included** — the descent is
  `DIVE_TIME - DIVE_GRACE` = 2.25 s, not 2.6. Easy to read the two constants as
  additive, and CS014's `DIVE_TIME_OD` 4.0 inherits the same reading.
- ⚠ **The dive death-loop bound in `test-cs006-p5.js` is a BOUND, not a mechanism
  proof, and it is measured at exactly its limit.** No run loses more than two
  lives inside one dive sequence (worst 2, seed 21622307). ⛔ Reducing
  `diveRespawn()` to the naive version leaves that soak **green**. The
  mutation-sensitive proof is `test-cs006-p3.js`'s staged cases.
- ⚠ **`test-cs007-p5.js`'s well-stall gate is a STALL GATE and not a P1
  detector** — measured at the CS007 close: reverting `threatCount()` to
  `state.enemies.length` leaves it green (worst well 2,555 ticks against 2,435),
  because an escalating run tops out near level 9 and never accumulates the
  Thorns that shut a well. ⛔ **The assertion beside it IS a detector** and turns
  red on that mutation: every blocked beat must be legal against a threat count
  recomputed off GDD §6.5's `blocksClear` field.
- **`tools/glow-lab.html` does not exist and has no owner.** It is the instrument
  for the **global** glow constants, which nothing since CS004 has touched.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR`, `VAULTER_COLOR`
  and the six CS004 P1 added are inference, not design — the GDD specifies no
  enemy palette. They were chosen **as one set** against the constraint recorded
  in `C`: an enemy colour must read against all seven band colours (§3.6),
  because the well cycles and the enemies do not. ⛔ All are judgeable on
  hardware now, and ⛔ **the debug bench keys they are judged with are permanent**
  (Paul's H5 call, CS007 P3).
- ⛔ **`src/07-enemies.js` wants splitting, and the moment is CS012.** Measured at
  the CS005 close. The measurement, the seam and the reasoning are in
  `ROADMAP.md` under "Still open" — ⛔ not restated here.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: onboarding, and **CS015's**.
  ⚠ CS007 touched no spawn-lane selection, so it did not fall out for free.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way, and GDD §6.1 says only "direction from `laneDelta`". ⚠ Flagged for
  CS007's tuning pass and **not taken — CS007 tuned nothing**, it built the
  instrument. Still open, still unowned.
- ⚠ **A run that STARTS past level 99 would get the modulo well and a
  `bandRoll` of 0** — `startGame()` does `wellIndex = (level - 1) % WELLS.length`
  and never rolls. ⛔ **Unreachable while `C.START_DEPTH_CAP` is 81** (plan
  §1.12; CS008 P3 shipped the cap). `startGame(seed, { startDepth })` itself does
  not validate, so only a direct API caller can reach it. Raising the cap past
  99 owns the fix: one branch shared with `nextWell()`.
- ⚠ **A closed test may pin the literal text of a line a later phase is scheduled
  to change.** `test-cs005-p3.js` pinned all five `drawWell` arguments to assert
  one of them. Source-text assertions are the right tool for "this is still
  unwired", but ⛔ **pin only the argument the claim is about**.
- ⚠ **PREDICTED, CS008 P1: a SECOND Purge now prefers a Weaver bolt above 0.95
  over a parked enemy.** `purgeTarget()` takes the highest depth, and enemies
  now park at 0.95 while a bolt spends ~9 steps above it. Plan §2 flagged it;
  not measured, and no phase owns it. ⚠ Since P2, that Purge pays **0** —
  a bolt has no points.
- ⚠ **THE SCRIPTED SOAK PLAYER HOLDS FIRE, SO SINCE P1b IT BARELY DIES** — the
  sweep kills what it crosses. Four closed fixtures were repaired for exactly
  that: `st.lives = 1` on the FIRST run of three soaks' `hashRun()` (never after
  a restart — that drops the respawn from the hash), and `test-cs007-p4.js`'s
  `CAPTURE_TICKS` 7,300 (deaths at 7,028 and 7,574; ⛔ 8,000 stops inside the
  window and goes red). ⛔ **A later fixture that needs a death or a game over
  inside a window will hit the same wall** — and P8's sixth soak is one.
- ⛔ **A CHOSEN LEVEL IS REACHED FROM THE START DEPTH SCREEN**, not `w` (`w`
  cycles the shape and never `state.level`). A fresh session lists 1–9 only; a
  sitting runs `levelRecord().noteCleared(81)` in the console first
  (`PLAYTEST.md`, maintenance notes). Both formerly parked asks now say so.
- ⛔ **Playtest asks live in `PLAYTEST.md`**, not session context. Pull it up at
  the machine with a build in front of you, never during a build phase.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- ✅ **`C.TELEMETRY_PLACEHOLDER` IS ONE KEY, `maxCombo`.** CS008 took three
  bites, not two (plan §1.10): `score` in P2, `mode` and `startDepth` in P3.
  `maxCombo` goes with GDD §14.4's combo. ⛔ A key left there after its column
  has a real source is a column silently reporting a constant.
- ⚠ **THE TELEMETRY COLUMN LIST IS FROZEN UNTIL A CHANGESET DELIBERATELY MOVES
  IT** (GDD §15.6). A column added in CS008 invalidates every CS007 log, which is
  why the four above already ship at known constants. ⛔ Adding or reordering one
  edits `TELEMETRY_FIELDS`, `TELEMETRY_KINDS` and `telemetryRow()` **together**;
  `test-cs007-p4.js` goes red on any two of the three drifting.
- ⛔ **CS011 OWNS TELEMETRY PERSISTENCE**, and CS007 P4 built the row shape and
  the export so it is wiring rather than a rewrite. What is missing: the
  `telemetry` key's profile scope, `Profiles.keyFor(base)` as the one route to
  it, and GDD §15.6's `read()` rejecting any envelope `v` that does not match the
  current shape. ⛔ **Not buildable before `22-meta.js` exists.**
- ⛔ **`vector-vortex` IS ALREADY REGISTERED** in `coinless-kit`'s
  `services/leaderboard/src/registry.js` (measured at `79206f3`) with all seven
  `statsFields`, and CS007 P4's column names map onto them **totally**. ⛔ What
  remains is confirming the **deployed** Worker carries it, and that is CS011's.
- ⚠ **`CLAUDE.md` carries no telemetry rule**, and P4 did not add one for the
  reason P3 did not add a schedule rule before Paul did (`49cfec6`): whether a
  system earns a rule in a 50 KB auto-loading file is Paul's call, not a build
  phase's. GDD §15.6 carries the shipped column table, the ring, the surface and
  the no-persistence rule; only the code-map line was updated.
- ⚠ **PAUL REPLACES THE CREDITS COPY BEFORE SHIP.** `C.CREDITS_LINES` is U6's
  placeholder: "VECTOR VORTEX", "COINLESS GAMES", and a generated VERSION line.
- Backport `kit-input` (`src/04-input.js`, **v0.5.0**) and, after P7, `kit-menu`
  (`src/15-render-hud.js`, v0.1.0) to coinless-kit. Each is a separate manual
  step, verified against that repo's own suite.
- ⚠ **The leaderboard submission is CS011's** (`ROADMAP.md`). P5 built its seat:
  `quitToTitle()` carries GDD §15.4's ordering note, and nothing submits.
- The Overdrive `PTS_REAVER`, `PTS_MIMIC` and `PTS_WARDEN` are unread; CS012's.
- ⛔ **THE SEVEN DEBUG SPAWN ACTIONS SHIP UNTIL CS016** decides whether debug keys
  ship at all (Paul's H5 call, 2026-08-31). They are **not** ⚠ TEMPORARY, the
  ⚠ provisional palette still needs judging, and `PLAYTEST.md` is written around
  them.
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ Settled: `enemies` is 6 (GDD §6.1 roster rows, complete) and
  `enemyKinds` is 9 (`ENEMY_KINDS` rows). ⛔ The next mover of either is an
  Overdrive enemy (GDD §6.4), not a cargo. **CS007 moved neither.**

## Next up — ⛔ P7, THE CONTROLS PAGE

⛔ **Paste P7's prompt from `IMPLEMENTATION-PHASES-CS008.md` into a fresh
session.** A build phase reads the document, not the planning conversation
(`CLAUDE.md` rule 3c).

**The sequence:** P1 · P1b · P2 · P3 · P4 · P5 · P6 pause and Options · **P7 the
Controls page** · P8 the front-door soak and the close.

⛔ **What P7–P8 must not lose:**

1. ⛔ **A baseline move in P7–P8 is a defect.** The hash is 1229033515 and
   `GOLDEN_LANES` has its P1 +2 appended entries. P6 moved neither.
2. ⚠ **kit-input is 0.5.0 (P6), so P7's bump is 0.6.0.** The plan's "0.5.0"
   is stale by one. Both P5's and P6's version assertions accept any later
   MINOR, so P7 edits neither.
3. ⛔ **Reserved, and refused by P7's rebinding:** Escape (`back`, which pauses
   in play), `p` (`pause`), gamepad button 9 (`C.GAMEPAD_PAUSE_BUTTON`), the
   debug keys and the digits. `t` and `e` are bench keys; refuse them too.
4. ⚠ **`syncScreen()` writes three switches on every screen change.** It sets
   `touchAutofire: C.TOUCH_AUTOFIRE` on entering play, and P7's TOUCH AUTO-FIRE
   setting must be what it reads. It also sets `touchTapFire` and
   `touchTopTarget`.
5. ⚠ **The CONTROLS stub is `SCREENS.controls`** (`23-main.js`): the line NOT
   BUILT YET and a BACK row to OPTIONS. P7 replaces it. OPTIONS' BACK returns
   to `optionsFrom` (title or pause), and a page P7 adds under OPTIONS goes back
   with `backToOptions`.
6. ⚠ **Two readings P6 took, flagged for Paul, and neither is built on:**
   - the HUD draws over OPTIONS opened from pause (`runOnScreen()`), per H4's
     reason: a run exists there;
   - `p`, Start and the touch target pause but do not resume (plan §7:
     `pause` applies on play only). RESUME, Purge and Escape resume.
7. ⚠ **Nothing has been tuned against GDD §8.2's targets**, and P8 writes K2's
   levels-1–4 ask.
8. ⚠ **P7 must confirm the sensitivity slider range with Paul.**

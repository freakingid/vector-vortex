# Vector Vortex — STATUS
Version: 0.0.5 · Changeset: CS009 (P2 done 2026-09-16 — P3 next) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 2/5

## Phase ledger — CS009

One line per phase here; ⛔ **reasoning goes to `log/CS009.md` as the phase
goes**, not to this file (`CLAUDE.md`, Session rules, 2026-08-31).

| Phase | Commit | One line |
|---|---|---|
| P1 | `edfc2e1` | The engine: kit-input 0.7.0 `onGesture`, kit-audio 0.1.0 (four buses, the scheduler with the stall resync), the harness fake. No sound yet. 6 of 6 mutations red |
| P2 | this commit | `tools/music-lab.html` (SOLO, MUTE, gain/cutoff, PASS/FAIL, COPY TABLE) and the `title` (32 s) and `pulse` (108 s, A→B→C) tables. Lab BLOCK A/B identical to `16`/`17`. 8 of 8 mutations red |

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules, 443.0 KB); the
  manifest is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **45 test files, all green, zero skips.**
- **CS009 P1 — the engine.** `16-audio-engine.js` is kit-audio **0.1.0**
  (`.NOTES.md`). `19-sfx.js` builds `AudioSys` / `MusicSys` from `C`, and
  `AudioSys.unlock()` is kit-input **0.7.0**'s `onGesture`. ⛔ `ctx` is null
  until a key, click or lifted touch, and every entry point returns early on it.
  ⛔ `buildGame({ audio: true })` installs the recording fake (`X._audio`). The
  default is still no audio API.
- **CS009 P2 — music-lab and two tracks.** `tools/music-lab.html` plays
  `MUSIC_TRACKS` (`17-audio-tracks.js`): `title` 32 s, `pulse` 108 s (A→B→C),
  no `tier`, worst step 9 and 14 nodes of 16. ⚠ **The tracks are unauditioned;
  the lab is where Paul judges them (A6).** Nothing waits on it. The music plays
  nowhere in the game yet (P3).
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
- CS006 closed — the +1 renumber, past-99 progression and the band roll,
  `throatOffset` behind `C.MIN_LANE_SPOKE_PX`, **the Dive**, and `laneState`
  gated to the dim band. ⛔ **All five of GDD §4.5's death conditions are live.**
- CS007 closed 2026-08-31 — **the run escalates.** ⛔ One clock (`heat()` and
  seven accessors, `heat(1)` exactly 0, the respawn guarantee held by
  `C.CLIMB_MULT_MAX` 1.40), GDD §8.1's schedule as DATA, the spawner-stall split,
  telemetry. `log/CS007.md`.
- **CS008 closed 2026-09-13 — the rim fix and front of house.** Every arrival
  at the rim is killable, and a fire-holding crossing kills (the rim sweep).
  Scoring through `addScore()`, extra lives, the clear bonuses. Mode and Start
  Depth with its bonus. One text path (`drawText()`), the HUD, the death
  fragmentation. Title, mode, START DEPTH, game over with RESTART, pause from
  five sources, OPTIONS, CREDITS, the Controls page with rebinding. kit-input
  **0.6.0**, kit-menu **0.1.0** (`src/15-render-hud.js`), kit-fx's first draft
  (`src/14-render-entities.NOTES.md`). Phase ledger, mutation records, baseline
  ledger, closed-file edits and the §10 and §19 verdicts are in `log/CS008.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields (plus
  `points()`, CS008 P2), the wiring points, the one array / one spawn entry /
  one well entry / one collision pass rule, and the Dive: an entity that is
  `blocksClear: false` and not `anchored` must decide whether it survives a dive.
- ⛔ **SIX SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS.**
  `test-cs003-p5.js` is the Vaulter soak (level 2, the per-tick lane SPEED
  bound). `test-cs004-p5.js` runs the three-kind band (level 7, the exact-lane
  form). `test-cs005-p5.js` and `test-cs006-p5.js` run the full board (level 23);
  the latter owns the Dive. `test-cs007-p5.js` pins no level and arms no `C`
  fixture: it owns the ESCALATING run. ⛔ **`test-cs008-p8.js` is the only one
  that enters through the FRONT DOOR**: one session from the boot title, twenty
  cases through START DEPTH 1 / 5 / 9, RESTART and QUIT TO TITLE, driven by key
  presses and `Game.frame()`. It asserts item 8 played, the Start Depth bonus at
  most once, and the rim-arrival property at the shot pass. ⛔ A future changeset
  extends the pattern with a seventh file rather than widening a closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule**, a
  function of the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, plus +0 at levels 1–2 and +1 from level 3. It needs
  no baseline and survives every retune.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are the
  ORIGINAL `9ebd27b` recording**, held by a separate prefix assertion. ⛔ **The
  one exception: CS008 P1 appended `2, 5`, with one cause — the climb stops at
  the kill band.** It covers that cause only. ⛔ **Any other move is a defect,
  not a baseline** — heat leaking into level 1, or a stray draw.
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is CROSS-FILE** (it runs `test-cs005-p5.js` in a child process). It
  stands at **1229033515** (CS008 P1b, two causes measured apart and written at
  the assertion). ⛔ Re-record it **once per change, one named cause at the
  assertion**, checked against the draws-per-spawn count.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound** (CS005 close; `RATIONALE.md#boundary-lattice`).
- `tools/well-lab.html` (the sixteen polygons, `throatOffset` sliders, a
  Legibility readout; ⛔ the visual audition has not happened) and
  `tools/feel-lab.html` (traverse-and-stop, reachable over LAN via `npm run
  serve`).

## Known issues

- ⚠ **R2 — A PAD-ONLY PLAYER IS SILENT UNTIL A KEY, CLICK OR TAP** (PREDICTED:
  a gamepad button is not browser user activation). kit-input's `onGesture`
  fires on `keydown`, `mousedown` and `touchend` only. No changeset owns a fix.
- ⛔ **CS009 TRAPS IN AUDIO CODE** (plan §1.4, §1.5, §1.13). (1) Never write the
  vocabulary scan's banned word, even as "… Audio" in a comment:
  `test-cs008-p6.js` scans the whole built file. (2) Never write `.key` after
  an identifier ending in `e` (`tone.key`): `test-cs002-p1.js` bans the
  substring `e.key` outside `04-input.js`. (3) Never start a comment line with
  `// 21-telemetry.js` or `// 22-meta.js`. (4) No platform RNG: the noise is
  `mulberry32(C.AUDIO_NOISE_SEED)`.
- ⛔ **`MusicSys.setState()` BEFORE THE FIRST GESTURE IS DROPPED** (ported
  as-is: it returns on a null `ctx` without recording the name). P3's frame
  hook must call it every frame, not once on a screen change.
- ⛔ **A test that counts scheduled steps counts NOTES, never distinct start
  times.** A late step clamps to `currentTime`, so a burst collapses to one
  instant. That reading hid a deleted resync (`log/CS009.md`, P1).
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A TWO-FILE
  EDIT.** `test-cs009-p2.js` holds music-lab's BLOCK A and BLOCK B identical to
  them (whole files, trailing whitespace aside). Copy the file into the lab's
  block. ⛔ `17-audio-tracks.js` must name no game global, even in a comment
  (the lab runs it with none). ⛔ Its layer lines stay one line each, in
  `{ name: "…", … steps: … }` form, and the lab's top-level functions close at
  column 0: COPY TABLE and the test both find them that way.

- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** (CS008 P5). A
  scripted Fire there RESTARTS on a time seed and a Purge quits. ⛔ Any new
  replay stops pressing at the stop, or restarts through `startGame(seed)` as the
  pinned soaks do. And ⛔ **a driver that starts at the title must spend two live
  steps before its first press**: the title's entry step latches held keys, and
  every later press lands one screen behind (CS008 P8, measured).
- ⛔ **THE SCRIPTED FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4** (the rim sweep).
  Four closed fixtures carry the repair (`st.lives = 1` on the first `hashRun()`
  of three soaks, `test-cs007-p4.js`'s `CAPTURE_TICKS` 7,300 — ⛔ 8,000 stops
  inside the window). `test-cs008-p8.js` turns passive after 9,000 steps. ⛔ A
  new fixture that needs a death inside a window will hit the same wall.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included.** Any
  `fillRect`/`strokeRect`, or a second `.fillText(` / `.strokeText(`, turns it
  red; ⛔ never name those calls in a comment. `test-cs002-p3.js` bans the text
  `ctx.fill` in `14-render-entities.js`. `test-cs002-p1.js` bans `e.key`,
  `.touches`, `getGamepads`, `clientX` and `addEventListener` outside
  `04-input.js`, and `C.`/`state.` inside it.
- ⛔ **`test-cs008-p6.js` bans "atari" in the WHOLE built file**, comments
  included (GDD §18.1). Write "the original's".
- ⛔ **`Game.update()` calls `syncScreen()` TWICE, before and AFTER
  `input.sample()`** (CS008 P6). A named action that changes the screen inside
  `sample()` makes that step the new screen's entry step. Remove the second call
  and a Fire held in play confirms RESUME.
- ⛔ **`frame()` drains `hitStopLeft` only on `"play"` and `"gameover"`.** Every
  other screen HOLDS a freeze. A new screen that should drain one is added there
  by name.
- ⛔ **While a CONTROLS row owns the input, the menu still steps and its answer
  is ignored** (`stepControlMode()`, CS008 P7). ⛔ **CS009's volume row must do
  the same**, or a Purge held past its exit backs out of the page.
- ⛔ **`Game.reset()` restores the controls** (`resetControls()`). A test
  claiming a setting SURVIVES a quit uses `Game.quitToTitle()` alone.
- ⛔ **`Game.draw()` must not name `Telemetry`** (`test-cs007-p4.js`), and ⚠
  **that test finds the telemetry module by the text `// 22-meta.js`** — never
  start a comment line with a module file name.
- ⚠ **`_harness.js`**: `buildGame({ stub })` rebinds a named top-level function
  to a no-op; `{ spy }` counts calls and, since CS008 P8, runs optional
  `.before` / `.after` hooks around the real call. Both act after evaluation,
  so internal callers reach them. A function inside `Game`'s closure cannot be
  reached this way.
- ⚠ **No played board reaches `C.LIVES_MAX`** (`test-cs008-p8.js`, peak 4 of 6), so
  a played `lives <= LIVES_MAX` bound cannot fail. The cap's proof is
  `test-cs008-p2.js`'s staged rows.
- ⚠ **`C.MENU_COL_W` is 460** so "MOUSE SENSITIVITY" clears an adjusting detail.
  A longer row label (CS009's) needs the same arithmetic.
- ⚠ **The touch buttons and the top-centre pause target are live but not
  drawn.** No changeset owns them.
- ⚠ **A dead craft is not drawn once the freeze is spent**, so the game-over
  board has no craft. That is the fragmentation finishing.
- ⚠ **`drawFragments`, `drawHud` and `drawMenu` read `C` for sizes and colours.**
  kit-fx and kit-menu extraction each owe an options argument (both `.NOTES.md`).
- ⚠ **THREE ROSTER CLASSES PARK RATHER THAN HUNT** — Carrier, Weaver, Surger. A
  well whose only survivors are parked never clears, and a driver whose rotation
  never reaches their lane stalls. ⛔ **The repair is the driver, never the
  build** (`replayWide`'s wall-to-wall pin). The Purge is the played answer.
- ⛔ **The Dive has no visual**, and a dive reads as 2.6 s of a still board. No
  changeset owns it; `state.dive.depth` is the value a renderer wants.
- ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included** (descent 2.25 s).
  CS014's `DIVE_TIME_OD` inherits the same reading.
- ⚠ **The dive death-loop bound in `test-cs006-p5.js` is a BOUND measured at its
  limit**, not a mechanism proof; `test-cs006-p3.js`'s staged cases are.
- ⚠ **`test-cs007-p5.js`'s well-stall gate does not catch a reverted
  `threatCount()`**; the blocked-beat assertion beside it does.
- ⚠ **PREDICTED, not measured: a second Purge prefers a Weaver bolt above 0.95
  over a parked enemy**, and pays 0. No changeset owns it.
- ⚠ **A run that STARTS past level 99 would get the modulo well and no band
  roll.** Unreachable while `C.START_DEPTH_CAP` is 81; raising the cap owns the
  fix (one branch shared with `nextWell()`).
- ⚠ **A closed test may pin the literal text of a line a later phase changes.**
  ⛔ Pin only the argument the claim is about.
- **The whole enemy palette, the menu palette and the HUD sizes are ⚠
  provisional**, and `tools/glow-lab.html` does not exist and has no owner.
- ⛔ **`src/07-enemies.js` wants splitting at CS012** (`ROADMAP.md`, "Still open").
- **GDD §12's four-second promise is not delivered** — CS015's (spawn lanes
  weighted toward the player).
- **A rim Vaulter hunts the Skimmer's continuous lane**, so a player parked
  between two centres has it hopping back and forth. Unowned.
- ⛔ **A chosen level is reached from START DEPTH**, never `w`; a sitting runs
  `levelRecord().noteCleared(81)` in the console first. ⛔ **There are no
  playtests** (Paul, 2026-09-16); a would-be ask goes in `SKIPPED-PLAYTESTS.md`.

## Open questions (blocking)

- None.

## Carried tasks

- ⛔ **CS009 — the over-cap life sound.** `addScore()`'s `else` branch names the
  seat (GDD 4.4, "never silently swallowed").
- ⛔ **CS009 — OPTIONS' Sound/Music row** (Paul's U5). It is a row mode on a menu
  page; see the Known issue above.
- ⛔ **CS011 — persistence of the Start Depth record, the Controls settings and
  the bindings.** All three are session-only. `levelRecord()` is the one
  function re-pointed at the profile store.
- ⛔ **CS011 — the `'quit'` and `'died'` leaderboard submits at `quitToTitle()`'s
  seat**, in the order its comment gives (read whether a run was playing BEFORE
  the overwrite; game over's QUIT is not a second submit).
- ⛔ **CS011 owns telemetry persistence**: the `telemetry` key's profile scope,
  `Profiles.keyFor(base)`, and GDD §15.6's `read()` rejecting a mismatched
  envelope `v`.
- ⛔ **`vector-vortex` IS REGISTERED** in coinless-kit's registry with all seven
  `statsFields` (measured at `79206f3`); confirming the deployed Worker is
  CS011's.
- ✅ **`C.TELEMETRY_PLACEHOLDER` is one key, `maxCombo`**, which goes with GDD
  §14.4's combo. ⛔ The telemetry column list is frozen until a changeset
  deliberately moves it; `TELEMETRY_FIELDS`, `TELEMETRY_KINDS` and
  `telemetryRow()` move together.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's
  call.
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- Backport kit-input (**0.7.0**), kit-menu (0.1.0), kit-fx and kit-audio (0.1.0) to coinless-kit —
  each a separate manual step, verified against that repo's own suite.
- The Overdrive `PTS_REAVER`, `PTS_MIMIC`, `PTS_WARDEN` are unread — CS012's.
- ⛔ **The seven debug spawn actions ship until CS016** (Paul's H5 call).
- ⛔ `scratchpad/test-registry.js`: `enemies` 6 and `enemyKinds` 9. The next
  mover of either is an Overdrive enemy.

## Next up — ⛔ CS009 P3, music in the game and the OPTIONS rows

⛔ **CS009 is planned** (2026-09-16, at `d1847e2`): `PLANNED-FEATURES-CS009.md`
and `IMPLEMENTATION-PHASES-CS009.md`, six phases. Every design call is
answered (plan §0, A1–A9; `DECISIONS.md` pointer written in P1). Paste P3's
prompt from `IMPLEMENTATION-PHASES-CS009.md`.

⛔ **What the plan measured that every CS009 phase must respect:**

1. ⛔ **Three whole-file scans bite audio code** (plan §1.4, §1.5): no platform
   RNG (the noise buffer takes its own `mulberry32` stream), no `\bweb\b` even
   in a comment, and `test-cs002-p1.js` bans the SUBSTRING `e.key` outside
   `04-input.js`. `C` already holds a comment naming the timers, so a
   `setTimeout` scan must strip comments.
2. ⛔ **Orbital Overhaul's scheduler bursts 931 notes after a 60 s stall**
   (plan §1.3); a hidden tab is a shipped pause source here. ✅ P1 resyncs.
3. ⛔ **The OPTIONS rows go after CREDITS** — above TELEMETRY they turn 99 closed
   assertions red (plan §1.8).
4. ⚠ SETTLED — the Surger charge tone stays audible over music at every tier;
   P5's headless headroom gate stands in for the hardware check.
5. ⛔ No baseline moves in CS009 (plan §9).

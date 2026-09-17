# Vector Vortex — STATUS
Version: 0.0.8 · Changeset: CS012 (P2 of 6 done) · Wells: 16/16 · Enemies: 6/6 Classic, 1/3 Overdrive · Tracks: 3/5

## Phase ledger — CS012

**Planned at `de53c0d`; ✅ Paul took every recommendation in
`PLANNED-FEATURES-CS012.md` §0 (O1–O16), 2026-09-16.** Six phases (`IMPLEMENTATION-PHASES-CS012.md`):
P1 `drive`; P2 mode flags, the Reaver, Overdrive's schedule; P3 OVERDRIVE on MODE,
its own board, SCORES' OVERDRIVE view, the record per mode; P4 the combo; P5 Jump;
P6 the tenth soak and the close. This ledger gets one line per phase. CS011's
ledger is in `log/CS011.md`. Reasoning, measurements and mutation records are in
`log/CS012.md`.

| Phase | Commit | One line |
|---|---|---|
| P1 | this commit | `drive` (138 BPM, 36 bars A→B→C, six layers, untiered, unmarked; kick `beat: true`) in `17-audio-tracks.js` and both labs; `C.MODE_TRACK.overdrive`, DRIVE on MUSIC TRACK; `tracks` 3. `test-cs012-p1.js` (55). Headroom 1.0345 → 0.3505; worst 13 nodes. Four closed files in place (three outside plan §11). 9 of 9 red |
| P2 | this commit | `C.MODE_FLAGS` + `modeHas()`; `C.SPAWN_SCHEDULE_OVERDRIVE` merged by `eligibleKinds(level, mode)`; `07-enemies-overdrive.js`, `Reaver extends Vaulter` (hop ÷ 1.6, hunts mid-climb); `REAVER_POLY`; kill pitch 1.15 via sfx-lab's new KILL PITCH table. `COUNTS` 7 / 10. `test-cs012-p2.js` (158). One closed edit (`test-cs009-p4.js` voices). 12 of 12 mutations red |

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  620.9 KB); the manifest is checked both directions against `src/`, and a
  missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **62 test files, all green, zero skips**.
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
- **CS008 closed 2026-09-13 — the rim fix and front of house.** Scoring through
  `addScore()`, extra lives, the clear bonuses, mode and Start Depth, one text path
  (`drawText()`), the HUD, title → mode → START DEPTH → play → game over, pause from
  five sources, OPTIONS, CREDITS, CONTROLS with rebinding. kit-menu **0.1.0**,
  kit-fx's first draft. `log/CS008.md`.
- **CS009 closed 2026-09-16 — the audio engine.** kit-audio's buses, lookahead
  scheduler and SFX player; `title` and `pulse`; music by screen; the four volumes
  and MUSIC TRACK; `C.SFX` at 23 seats; the held Surger tone. `log/CS009.md`.
- **CS010 closed 2026-09-16 — the intensity director.** kit-audio **0.3.0**,
  `createDirector` fed by `dangerInputs()`, `pulse`'s `cycle` and `tick`, the
  limiter, the duck and dips, the rim pulse. `log/CS010.md`.
- **CS011 closed 2026-09-16 — meta.** kit-names, kit-storage and kit-profile
  inlined at build; one declared `Store`; a silent ANONYMOUS first profile;
  settings, the Start Depth record (`progress`) and telemetry rows per profile;
  the run's three seats and the ONE gate `Meta.eligible()`; the local top 10
  (`createScores`, the kit-scores draft); kit-input **0.8.0**'s text mode,
  PROFILE and NAME; kit-leaderboard **0.2.1** behind one `Leaderboard`; SCORES'
  LOCAL / ONLINE and the queued line. Phase ledger, mutation records, baseline
  ledger, review notes and the §10 verdicts are in `log/CS011.md`; GDD §19's Meta
  and Audio verdicts are in GDD §19.
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**, and every
  audio entry point returns early on it. `buildGame({ audio: true })` installs
  the recording fake (`X._audio`); the default is still no audio API.
- ⛔ **A seat writes no `state` and draws nothing.** The Surger tone is one held
  voice per telegraphing Surger, keyed in a `Map` in `19-sfx.js`. ⛔ The headroom
  gate (`test-cs009-p5.js`, ⚠ provisional) is D16's limiter curve model: 0.450
  against 0.3512 `pulse` and 0.3408 `title`; `drive`'s is its own
  (`test-cs012-p1.js`, 1e-9 s tie tolerance), 0.3505. ⛔ It holds only at the rendered
  settings, so `test-cs010-p1.js` pins `C.MUSIC_LIMIT` to D2's literals.
- ⚠ **SETTLED — MUSIC IS STRUCK, NEVER SWELLED** (Paul, 2026-09-16; `CLAUDE.md`
  Audio, GDD §11.3). ✅ Paul's lab picks are ported: 120 BPM on both tracks, every
  layer PASS, played at his lab gains behind the limiter. ⚠ **`pulse` loops at
  72 s** (Paul chose the tempo; ≥ 36 bars, `DECISIONS.md`).
- ⛔ **Read GDD §6.5 before adding an enemy.** Eight contract fields (plus
  `points()`), the wiring points, and the Dive: an entity that is
  `blocksClear: false` and not `anchored` must decide whether it survives a dive.
- ⛔ **NINE SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS.**
  `test-cs003-p5.js` (Vaulter, level 2, the per-tick lane SPEED bound);
  `test-cs004-p5.js` (three kinds, level 7); `test-cs005-p5.js` and
  `test-cs006-p5.js` (full board, level 23; the latter owns the Dive);
  `test-cs007-p5.js` (the ESCALATING run, no level pinned). ⛔ The front-door
  soaks: `test-cs008-p8.js` (START DEPTH 1 / 5 / 9, RESTART, QUIT, the rim-arrival
  property); `test-cs009-p6.js` (audio on vs off, one hash per frame);
  `test-cs010-p5.js` (`dangerInputs` spied vs a constant reading, one hash);
  **`test-cs011-p6.js` (a working store vs `storage: "blocked"`, one hash per frame,
  97,322 frames; PROFILE → SOAK, OPTIONS, a bench run, a pause quit, a fake
  leaderboard; then a reload over the working `Map`).** ⛔ A future changeset adds
  a tenth file rather than widening a closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule**, a
  function of the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, plus +0 at levels 1–2 and +1 from level 3.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are the
  ORIGINAL `9ebd27b` recording**, held by a separate prefix assertion. ⛔ **The
  one exception: CS008 P1 appended `2, 5`, with one cause — the climb stops at
  the kill band.** ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is CROSS-FILE** (it runs `test-cs005-p5.js` in a child process). It
  stands at **1229033515** (CS008 P1b; unmoved through CS009–CS011). ⛔ Re-record
  it **once per change, one named cause at the assertion**, checked against the
  draws-per-spawn count.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound** (`RATIONALE.md#boundary-lattice`).
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity.
  `tools/well-lab.html` (⛔ the visual audition has not happened) and
  `tools/feel-lab.html` (`npm run serve` for LAN).

## Known issues

### Meta (CS011)

- ⛔ **`22-meta.js` IS THE ONLY ROUTE TO STORAGE.** `Store` declares every key
  (`settings`, `progress`, `telemetry`, `scores`; kit-profile's `profiles`), and
  kit-storage THROWS on an undeclared one. ⛔ **Profile `p0`'s scope is the ROOT
  store.** ⛔ `legacyRosterKey: null`, never `''`. ⛔ **`Profiles.remove()`'s
  `OWN_KEYS` is the declared per-profile list**; CS015 adds `achievements` there
  and to `Store`. Never `scores` or `profiles`, never `clear()`.
- ⛔ **THE BOOT BLOCK RUNS INSIDE THE HARNESS** (`Meta.boot()` writes `profiles` in
  every build). ⛔ The inline banner is a dash rule, never `// ===…`, and no comment
  line starts with a module file name. ⛔ **kit-leaderboard cannot be inlined**:
  `test-cs009-p1.js:508` bans its `setTimeout` and `test-cs002-p1.js` its
  `addEventListener`.
- ⛔ **THE RUN'S END IS `Meta.runEnded(outcome)`**, seated at `startGame()`'s last
  line (`runStarted`), `quitToTitle()`'s first (on pause), and `frame()` after the
  steps. It does nothing when no run is open; `Game.reset()` does not drop a run.
  ⛔ **ONE GATE, `Meta.eligible()`**, read once for the row and the submit; a
  bench digit, `0` or `w` in play closes it. ⛔ **Meta writes no `state`**
  (`test-cs011-p3.js`, `-p6.js` hash around every call).
- ⛔ **CS012 — Overdrive's board.** `Leaderboard.submit()` sends `mode` in stats but
  one `C.GAME_ID`, so an Overdrive run would post to Classic's board, and the
  Worker keeps one best row per player per id. `max_combo` reads
  `C.TELEMETRY_PLACEHOLDER.maxCombo` (one source to change). SCORES lists CLASSIC
  only; `createScores` already keeps `overdrive` apart.
- ⛔ **`Leaderboard` IS THE ONE READER OF `window.KitLeaderboard` AND IS LAZY ON
  EVERY CALL** until it finds the global. The harness never runs the bridge; a
  test that wants a board sets a fake on `X._env.win`. ⛔ SCORES' VIEW row exists
  only with the module, and every entry opens LOCAL.
- ⚠ **`test-cs011-p5.js` reads coinless-kit's `registry.js` with `git show
  f0b0eb2:`** from `../coinless-kit`; without that repo it SKIPS loudly.
- ⛔ **Texts pinned by a closed `mutate`, each exactly once in the build.**
  `test-cs011-p2.js`: `hooks.resetSettings();` and
  `if (!on && state.screen !== "play") Meta.saveTelemetry();`.
  `test-cs011-p3.js`: `if (state.screen === "gameover" && Meta.runOpen()) Meta.runEnded("died");`,
  `return run !== null && !run.bench;` and `sfx("gameOver");`.
  `test-cs011-p4.js`: `input.captureText(state.screen === "profileName" ? onNameText : null);`,
  `for (const key of OWN_KEYS) scope.remove(key);` and `Profiles.remove`'s
  kit-first body, whitespace included. `test-cs011-p5.js`:
  `const answer = b => { if (t === token) done(b); };` (build) and
  `currentRunId = mintRunId();` (`lib/kit-leaderboard/kit-leaderboard.js`).
- ⛔ **Never write the text `audioFrame()` inside `frame()`, comments included**
  (`test-cs009-p3.js` counts it there).
- ⛔ **The title has four rows (PLAY, OPTIONS, SCORES, PROFILE)**, asserted in
  order by `test-cs011-p3.js` and `-p4.js`, and `test-cs011-p6.js` navigates the
  title, OPTIONS (MUSIC VOLUME at 5, CONTROLS at 2) and PROFILE by index. The
  queued line is the title's one info line. Game over has three lines.
- ⛔ **A score row stamps `profileName` when the run ends.** SCORES' rows are
  rebuilt on entry, on VIEW and when the board answers, never in `draw()`.
- ⛔ **NAME steps in place of the menu model** (`stepName()`, beside
  `stepControlMode()`), and the text mode is armed and ended in `syncScreen()`
  only. ⚠ **On NAME the keyboard's default Fire and Purge keys type** (Space, Z, X;
  Shift swallowed); `test-cs011-p4.js` rebinds Fire to ArrowDown.
- ⚠ **SETTLED — DELETE RUNS kit-profile's `remove(id)` BEFORE THE `remove(key)`
  CALLS**, the reverse of R12's wording (Paul, 2026-09-16). Do not "restore" R12.
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP** (`test-cs011-p2.js`). `t` turning
  capture off in play writes nothing; the rows wait for the next seat. ⛔ **A
  settings save runs inside `update()`** on a menu step, and `levelRecord()`
  reads storage on every call (never cache it).
- ⛔ **A switch runs `beforeChange` (rows to the OUTGOING scope), then `change`:
  `resetSettings()`, the incoming `settings`, an emptied ring.** SELECT, a new
  profile and deleting the active profile all switch this way.
- ⛔ **`Game.reset()` restores the controls and the sound rows and writes
  nothing.** A test claiming a setting survives a quit uses `quitToTitle()` alone;
  one claiming it survives a RELOAD builds again over the same `Map`. ⛔ The stored
  `settings` outlive `reset()`, so a closed test that changes a row leaves the
  harness `Map` holding it.
- ⚠ **A `Store.set` spy sees only `p0`'s writes**: kit-storage builds a new
  object for every other `scope()` call.
- ⚠ **PLAN FINDING — the stored `lastUsed` stays `""` after a first boot.**
  Accepted by Paul. ⛔ **Do not "fix" it by renaming `legacyProfileId`**: that
  moves `p0` off the root store.
- ⚠ `test-cs007-p4.js:479`'s comment still names `Profiles.keyFor` (a closed
  file; not an assertion).

### Audio (CS009, CS010, CS012 P1)

- ⚠ **FINDING (CS012 P1, MEASURED): THE HEADROOM GATE CANNOT CATCH A LOUDER
  TRACK.** Under D16's curve (ratio 20, makeup +13.68 dB) a doubled layer moves
  the model by 1/20 of its dB (`drive`'s kick ×2: 0.3505 → 0.3564); red needs an
  input of 152.8. The plan's "doubling one layer's gain turns it red" was a
  false prediction; `test-cs012-p1.js` proves the gate reads the gains and goes
  red without the limiter instead. Whether the gate should also bound the
  limiter's INPUT is Paul's call, not a phase's.
- ⛔ **`drive` IS UNTIERED, UNMARKED AND UNHEARD** (O13). Its gains are the
  composer's and no mix was rendered. ⛔ **Paul's lab port (a later commit)
  rewrites `test-cs012-p1.js`'s "no tier" and "no audition mark" assertions in
  place**, and a tier on a layer the lab marks PASS is all `test-cs009-p2.js`
  allows. music-lab's slowest step for `drive` is 76 BPM.
- ⚠ **sfx-lab plays only `pulse` in context** (`test-cs009-p4.js` pins
  `tracks: { pulse: … }`), so the Surger tone over `drive` has no lab audition.
- ✅ **R11 is closed:** an Overdrive run (`startGame(seed, { mode: "overdrive" })`)
  plays `drive` on AUTO. ⛔ `test-cs012-p1.js`'s reload starts `startGame(9)` and
  asserts `state.mode === "classic"`, and its OPTIONS driver steps right 1 from
  PLAY: P3's MODE work must keep both or repair them in place.
- ⛔ **One `beat: true` layer per track**: `pulse`'s `heart`, `drive`'s `kick`
  (`test-cs010-p4.js` reads `title` and `pulse`; `test-cs012-p1.js` reads `drive`).

- ⚠ **R2 — A PAD-ONLY PLAYER IS SILENT UNTIL A KEY, CLICK OR TAP** (PREDICTED).
  kit-input's `onGesture` fires on `keydown`, `mousedown` and `touchend` only.
  No changeset owns a fix.
- ⛔ **CS009 TRAPS IN AUDIO CODE.** (1) Never write the vocabulary scan's banned
  word, even as "… Audio" in a comment: `test-cs008-p6.js` scans the whole built
  file. (2) Never write `.key` after an identifier ending in `e` (`tone.key`):
  `test-cs002-p1.js` bans the substring `e.key` outside `04-input.js`. (3) Never
  start a comment line with `// 21-telemetry.js` or `// 22-meta.js`. (4) No
  platform RNG: the noise is `mulberry32(C.AUDIO_NOISE_SEED)`.
- ⛔ **`test-cs009-p3.js` PINS THE TEXT `function audioFrame()` AND ITS CALL**, so
  the frame's play-step count travels in a closure variable (`playSteps`).
- ⛔ **THE SURGER TONE IS DECIDED AT FRAME END** (`audioFrame()`): frozen or off
  play stops every voice; a live run with no step holds them. ⛔ Do not stop the
  tone on a frame with no step.
- ⛔ **A MENU STEP'S SOUND IS READ OFF ITS ANSWER**, and `syncScreen()` sets
  `menuEntering` so an entry step's cursor reset is silent. A screen change that
  skips `syncScreen()` would make its first step play a `menuMove`.
- ⚠ **Every seat call is `sfx(`, scanned by `test-cs009-p5.js`**: each names its
  `C.SFX` event as a string literal, with no assignment in its arguments.
- ⛔ **KIT-AUDIO 0.3.0.** Track gain → sweep → limiter → duck → dip → `music`.
  Every group is OPTIONAL; the duck node is always built. ⛔ A tier needs `gating`
  AND the track's `bar`. ⛔ `scheduleStep` never reads intensity. ⛔ The duck and
  dip pin from their own breakpoints, never `.value`.
- ⛔ **THE DIRECTOR.** `audioFrame()` runs it, then `setIntensity`, `setSweep` and
  `setDuck`, ⛔ BEFORE `setState()`. Its one board reader is `dangerInputs(state,
  out)`; **any new `heat(` call turns `test-cs007-p2.js` red** (use `heatT()`), and
  **`19-sfx.js`'s code may not name `state`**. `INT_W_COMBO` is fed 0 until CS012.
  ⚠ **A run resets the director only when play is entered from a non-run screen**;
  a `startGame()` called while already on play does NOT reset.
- ⛔ **THE RIM PULSE is `Game`'s closure variable `rimGlow`**, set after
  `MusicSys.update()` and 0 off play. ⛔ `audioFrame()`'s body may not contain the
  text "draw", comments included.
- ⚠ **`Game.reset()` leaves the screen on play**, so a fixture's `frame(0)` before
  `quitToTitle()` schedules real `pulse` notes on the fake at t = 0.
- ⛔ **`test-cs010-p3.js` pins both labs' `LAB` copies to `C`**: a change to
  `C.MUSIC_LIMIT`, `C.LAYER_THRESHOLD`, `C.LAYER_CROSSFADE` or `C.FILTER_*` is a
  three-file edit. ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS
  A THREE-FILE EDIT** (both labs' BLOCK A / B; `00-config.js`'s SFX group is
  sfx-lab's BLOCK SFX). ⛔ Each `C.SFX` event stays ONE line starting `    name:`;
  `17-audio-tracks.js` names no game global, and its layer lines stay one line
  each.
- ⚠ **Classic's intensity peaks at 0.668**, so the sweep never fully opens in
  Classic. CS012 re-measures with the combo.
- ⚠ **The Surger tone alone renders at sample peak 1.106** at unity. Unowned.
- ⛔ **`MusicSys.setState()` BEFORE THE FIRST GESTURE IS DROPPED**, which is why
  `audioFrame()` calls it every frame. ⛔ Never move it onto a screen change.
- ⚠ **The VOICE row controls an empty bus (A3).** Unowned.
- ⛔ **A test that counts scheduled steps counts NOTES, never distinct start
  times.**
- ⚠ **`test-cs009-p5.js`'s headroom sort compares exact floats**: a tempo whose
  `stepDur` is not a binary fraction (138 BPM) reads a back-to-back pair as an
  overlap. A future tempo port repairs that fixture in place. (`drive`'s own gate
  sorts ends 1e-9 s early: 417 such pairs, none at its loudest moment.)

### Menus, input and the front door (CS008)

- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU.** A scripted Fire
  there RESTARTS on a time seed and a Purge quits. ⛔ Stop pressing at the stop,
  or restart through `startGame(seed)`. ⛔ **A driver that starts at the title
  spends two live steps before its first press.**
- ⛔ **THE SCRIPTED FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4** (the rim sweep).
  Four closed fixtures carry the repair; the front-door soaks turn passive after
  9,000 steps. ⛔ A new fixture that needs a death inside a window hits the same
  wall.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect` and one `.fillText(` / `.strokeText(` site; never name
  those calls in a comment. `test-cs002-p3.js` bans `ctx.fill` in
  `14-render-entities.js`. `test-cs002-p1.js` bans `e.key`, `.touches`,
  `getGamepads`, `clientX` and `addEventListener` outside `04-input.js`, and
  `C.`/`state.` inside it. ⛔ **`test-cs008-p6.js` bans "atari" in the whole
  built file** (write "the original's").
- ⛔ **`Game.update()` calls `syncScreen()` TWICE, before and AFTER
  `input.sample()`.** Remove the second and a Fire held in play confirms RESUME.
- ⛔ **`frame()` drains `hitStopLeft` only on `"play"` and `"gameover"`.** A new
  screen that should drain one is added there by name.
- ⛔ **While a row owns the input, the menu still steps and its answer is
  ignored** (`stepControlMode()`).
- ⛔ **OPTIONS HAS TEN ROWS, AND THE WINDOW SHOWS SEVEN.** A test that reads its
  labels scrolls the window (`test-cs008-p6.js`). ⛔ Rows added to OPTIONS
  go before BACK, never above TELEMETRY: the closed tests navigate it by index.
- ⛔ **`Game.draw()` must not name `Telemetry`** (`test-cs007-p4.js`), and ⚠
  **that test finds the telemetry module by the text `// 22-meta.js`**.
- ⚠ **`_harness.js`**: `{ stub }` rebinds a named top-level function to a no-op;
  `{ spy }` counts calls and runs optional `.before` / `.after` hooks. A function
  inside `Game`'s closure cannot be reached this way. `{ store, storage, crypto,
  mutate }` and `_env.storageReads` are CS011's (its header).
- ⚠ **No played board reaches `C.LIVES_MAX`**; the cap's proof is
  `test-cs008-p2.js`'s staged rows.
- ⚠ **`C.MENU_COL_W` is 460** so "MOUSE SENSITIVITY" clears an adjusting detail. A
  longer label needs the same arithmetic.
- ⚠ **The touch buttons and the top-centre pause target are live but not drawn.**
- ⚠ **A dead craft is not drawn once the freeze is spent** (the game-over board
  has no craft).
- ⚠ **`drawFragments`, `drawHud` and `drawMenu` read `C` for sizes and colours.**
  kit-fx and kit-menu extraction each owe an options argument.
- ⚠ **A closed test may pin the literal text of a line a later phase changes.**
  ⛔ Pin only the argument the claim is about.

### The board (CS003–CS007)

- ⚠ **THREE ROSTER CLASSES PARK RATHER THAN HUNT** — Carrier, Weaver, Surger. ⛔
  **The repair is the driver, never the build** (`replayWide`'s wall-to-wall pin).
- ⛔ **The Dive has no visual.** No changeset owns it; `state.dive.depth` is the
  value a renderer wants.
- ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included** (descent 2.25 s).
  CS014's `DIVE_TIME_OD` inherits the same reading.
- ⚠ **The dive death-loop bound in `test-cs006-p5.js` is a BOUND measured at its
  limit**; `test-cs006-p3.js`'s staged cases are the mechanism proof.
- ⚠ **`test-cs007-p5.js`'s well-stall gate does not catch a reverted
  `threatCount()`**; the blocked-beat assertion beside it does.
- ⚠ **PREDICTED: a second Purge prefers a Weaver bolt above 0.95 over a parked
  enemy**, and pays 0. Unowned.
- ⚠ **A run that STARTS past level 99 would get the modulo well and no band
  roll.** Unreachable while `C.START_DEPTH_CAP` is 81.
- **The enemy palette, the menu palette and the HUD sizes are ⚠ provisional**, and
  `tools/glow-lab.html` does not exist and has no owner.
- ✅ **The enemy split is done (CS012 P2, O15).** ⛔ An Overdrive enemy goes in
  `07-enemies-overdrive.js` and enters through `C.SPAWN_SCHEDULE_OVERDRIVE`; there
  is no bench key for one (O16), and `DEBUG_ROW_KINDS` stays Classic's six.
- ⛔ **THE REAVER (CS012 P2) IS A `Vaulter` SUBCLASS.** The Vaulter's hop duration
  and mid-climb heading are overridable readers (`hopDuration()`,
  `midClimbDir()`) and both intervals are `÷ this.hopRate` (1). ⛔ Keep
  `C.VAULT_CLIMB * climbMult()` textually as is (five call sites,
  `test-cs007-p2.js`). ⛔ `bandRun`-style `instanceof X.Vaulter` checks in closed
  files also match a Reaver; they run Classic, so none sees one today.
- ⚠ **FINDING (CS012 P2, MEASURED): CS008 P1's ε and `atRim()` mutations no longer
  redden a rim-arrival table alone.** P1b's sweep masks them under held fire. A
  CS013 item-13 test for the Warden or Mimic mutates the sweep AND ε together
  (`test-cs012-p2.js` §9: 18/24). `atRim()` cannot redden a Reaver case at all (it
  hunts mid-climb).
- ⚠ **A wall-pinned, fire-holding driver parks an Overdrive L7 board with no
  Reaver released** (Weavers and Carriers fill the budget). `test-cs012-p2.js`'s
  `pinWall()` alternates the sweeping replay with a fire-released wall pin.
- **GDD §12's four-second promise is not delivered** — CS016's.
- **A rim Vaulter hunts the Skimmer's continuous lane**, so a player parked
  between two centres has it hopping back and forth. Unowned.
- ⛔ **A chosen level is reached from START DEPTH**, never `w`; a sitting runs
  `levelRecord().noteCleared(81)` in the console first. ⛔ **There are no
  playtests** (Paul, 2026-09-16); a would-be ask goes in `SKIPPED-PLAYTESTS.md`.

## Open questions (blocking)

- None. O1–O16 are answered (every recommendation).

## Carried tasks

- ✅ **The deployed Worker lists `vector-vortex`** (`GET /v1/health`,
  2026-09-16), and **Paul's M7 redeploy is done** (2026-09-16): `maxMetricPerSecond`
  100,000 at coinless-kit `e9a4c2c`, over the worst measured 86,616/s. Rows posted
  before it keep their flag (the Worker flags at insert). ⚠ The deployed
  `statsFields` cannot be read remotely; the repo's registry has all seven.
- ⛔ **CS012 — Overdrive's online board** (its own game id, registered), SCORES'
  OVERDRIVE view, and `max_combo`'s real source (above, Meta).
  ✅ **Paul's O11 registry edit is done: coinless-kit `e2efed5`** (2026-09-16).
  `vector-vortex-overdrive` and `vector-vortex` both at `maxMetricPerSecond`
  150,000 (F1's raise), the same seven `statsFields`, `maxMetric` and durations.
  MEASURED 2026-09-16: `GET /v1/health` lists `orbital-overhaul`, `vector-vortex`,
  `vector-vortex-overdrive`, and both boards answer (empty). ⛔ **P3's test pins
  `e2efed5`, never `f8d34f3`**: that commit replaced `vector-vortex` rather than
  adding beside it, and was live for a few minutes (Classic submits answered
  `INVALID_GAME`, which kit-leaderboard drops); `e2efed5` restored it.
- ⛔ **CS012 — the director's combo input and the Overdrive intensity
  re-measure** (Paul's D6): `INT_W_COMBO` is fed 0 in Classic.
- ✅ **CS012 P1 — `drive`** (Paul's A5): the track, `C.MODE_TRACK.overdrive`,
  `"drive"` appended to `C.MUSIC_TRACK_CHOICES`, `tracks` 3. ⛔ Its lab session
  (PASS marks, tiers, balance) is Paul's and ports as its own commit.
- `PTS_REAVER` is read (CS012 P2). `PTS_MIMIC` and `PTS_WARDEN` are unread — CS013's.
- ⛔ **CS015 — achievements** (Paul's M4), planned once Overdrive exists.
- ✅ **`C.TELEMETRY_PLACEHOLDER` is one key, `maxCombo`**, which goes with GDD
  §14.4's combo. ⛔ The telemetry column list is frozen until a changeset
  deliberately moves it; `TELEMETRY_FIELDS`, `TELEMETRY_KINDS`, `telemetryRow()`
  and `22-meta.js`'s declared `telemetry` version move together.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's
  call.
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- Backport kit-input (**0.8.0**), kit-menu (0.1.0), kit-fx, kit-audio (**0.3.0**)
  and kit-leaderboard (**0.2.1**, `lib/`) to coinless-kit — each a separate manual
  step, verified against that repo's own suite. `createScores`
  (`src/22-meta.NOTES.md`) is kit-scores' draft.
- ⛔ **The seven debug spawn actions ship until CS017** (Paul's H5 call).
- ⛔ `scratchpad/test-registry.js`: `enemies` 7 and `enemyKinds` 10 (CS012 P2, the
  Reaver). The next movers are CS013's Warden and Mimic.
- ⛔ **`C.MODE_FLAGS` / `modeHas()` have no game reader yet**; P4 (combo) and P5
  (Jump) are the first. `modeHas(name)` defaults to `state.mode`.

## Next up — CS012 P3 (Overdrive at the front door, and its own board)

Run `IMPLEMENTATION-PHASES-CS012.md` P3 in a new session.
✅ P3's registry precondition is met (coinless-kit `e2efed5`, Carried tasks).

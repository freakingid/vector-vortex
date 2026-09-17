# Vector Vortex — STATUS
Version: 0.0.8 · Changeset: CS012 (P1-P5 done; P6 next) · Wells: 16/16 · Enemies: 6/6 Classic, 1/3 Overdrive · Tracks: 3/5

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
| P1 | `79a4840` | `drive` (138 BPM, 36 bars A→B→C, six layers, untiered, unmarked; kick `beat: true`) in `17-audio-tracks.js` and both labs; `C.MODE_TRACK.overdrive`, DRIVE on MUSIC TRACK; `tracks` 3. `test-cs012-p1.js` (55). Headroom 1.0345 → 0.3505; worst 13 nodes. Four closed files in place (three outside plan §11). 9 of 9 red |
| P2 | `7fdbf43` | `C.MODE_FLAGS` + `modeHas()`; `C.SPAWN_SCHEDULE_OVERDRIVE` merged by `eligibleKinds(level, mode)`; `07-enemies-overdrive.js`, `Reaver extends Vaulter` (hop ÷ 1.6, hunts mid-climb); `REAVER_POLY`; kill pitch 1.15 via sfx-lab's new KILL PITCH table. `COUNTS` 7 / 10. `test-cs012-p2.js` (158). One closed edit (`test-cs009-p4.js` voices). 12 of 12 mutations red |
| P3 | `4a4a81c` | MODE: OVERDRIVE enabled and FIRST (the row order IS GDD §13's highlight), carried as `pendingMode`; `C.LEADERBOARD_GAME_IDS` and one kit client per mode, routed by `state.mode`, `load(mode, done)`, `queueLength()` summing both; SCORES' MODE row, per-mode LOCAL and ONLINE, entry on the last run's mode; `progress` **v2** `{ classic, overdrive }` with a `migrate`, `levelRecord(mode)` / `startDepthOptions(mode)`. `test-cs012-p3.js` (93). 13 closed files repaired in place, every one in plan §11 — no unlisted red. 10 of 10 mutations red |
| P5 | `10c11a6` | THE JUMP: `state.jump` + `updateJump()` (a TOTAL no-op outside `modeHas("jump")`), O6's phases with the cooldown from LANDING; ONE skip in `collideSkimmer()` that takes the rim sweep with it; no fire airborne OR recovering; `resetJump()` at `enterWell()`, the respawn and `startDive()`; the draw-only lift + rim shadow; kit-audio **0.4.0**'s optional `highpass` group, `setHighpass()` from `audioFrame()`, both labs' BLOCK A; the Overdrive-only HUD glyph. `STATE_FIELDS.CS012: ["jump"]`. `test-cs012-p5.js` (172). ⚠ **Six closed assertions in three files repaired that plan §11 did NOT predict** (Audio, below). 15 of 15 mutations red. ⚠ **This file is over its ~400 lines** (424 at P3, 484 at P5): P6's close compresses |
| P4 | this commit | THE COMBO: `state.combo` `{ mult, kills, since, peak }` and five functions in `12-scoring.js`, every one a no-op outside `modeHas("combo")`; O3's build (+0.5 per 4), lapse (one step per window, ⛔ the kill count KEPT) and death (×1 at once); O5's Dive hold, in the function AND at the call site; ⛔ **the multiplier at the four kill lines, never in `addScore()`** (O4); `dangerInputs()`'s real combo input (R5); the centre-top readout and its ELLIPSE ring; `C.SFX.comboLost` at ONE seat, `comboDrop()`; `max_combo` / `maxCombo` off `state.combo.peak`, `C.TELEMETRY_PLACEHOLDER` deleted whole (R7). `STATE_FIELDS.CS012` += `"combo"`. `test-cs012-p4.js` (350). ⚠ **Three closed assertions plan §11 did NOT predict** (below). 5 of 5 mutations red. MEASURED: Overdrive director max **0.6519** |

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  655.0 KB); the manifest is checked both directions against `src/`, and a
  missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **65 test files, all green, zero skips**.
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
- ⛔ **`Leaderboard` HOLDS ONE KIT CLIENT PER MODE** (CS012 P3), over
  `C.LEADERBOARD_GAME_IDS`, both made by the first call that finds the module,
  Classic first (C's key order, which `test-cs011-p5.js` reads); a throwing
  `create()` is not retried, per client. `beginRun()`/`submit()` route by
  `state.mode`, `load(mode, done)` fetches the board SCORES shows, `queueLength()`
  **sums both**. ⛔ **`C.GAME_ID` is the SAVE keyspace, never a board id.** ⛔ **One
  stale token covers both** — a MODE step on ONLINE is a newer load. ✅ `max_combo`
  is `state.combo.peak` (CS012 P4), 0 on a Classic run.
- ⛔ **`Leaderboard` IS THE ONE READER OF `window.KitLeaderboard` AND IS LAZY ON
  EVERY CALL** until it finds the global. The harness never runs the bridge; a
  test that wants a board sets a fake on `X._env.win`, and a fake serving both
  clients must count its queues per `gameId`. ⛔ SCORES' VIEW row exists only with
  the module, and every entry opens LOCAL.
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`**, from `../coinless-kit`, and
  each SKIPS LOUDLY without it: `test-cs011-p5.js` at `git show f0b0eb2:` and
  **`test-cs012-p3.js` at `e2efed5`** (Paul's O11 commit; ⛔ never `f8d34f3`).
  ⛔ **P6 cannot close with a skip.**
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
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** (CS012 P3, O9), and ⛔
  **the row ORDER is GDD §13's default highlight** — no mark, no colour, no flag.
  A driver that wants a Classic run steps ONE row down first; thirteen closed
  files carry that repair. The row writes `pendingMode`, and ⛔ **START DEPTH is
  built for `pendingMode`, never `state.mode`**, which at MODE names the LAST run's.
- ⛔ **SCORES' ROWS ARE MODE, VIEW (module only), THE ENTRIES, BACK**, so **VIEW is
  row 1**. ⛔ Rebuilt on entry, on MODE, on VIEW and when a board answers, never in
  `draw()`. ⛔ **The entry mode is the last run STARTED this session**
  (`lastRunMode`, a module-level `let` written by `startGame()`), else MODE's first
  row. `SCORES_MODES` is read OFF `SCREENS.mode.items`, so they cannot drift.
- ⛔ **A score row stamps `profileName` when the run ends.**
- ⛔ **NAME steps in place of the menu model** (`stepName()`, beside
  `stepControlMode()`), and the text mode is armed and ended in `syncScreen()`
  only. ⚠ **On NAME the keyboard's default Fire and Purge keys type** (Space, Z, X;
  Shift swallowed); `test-cs011-p4.js` rebinds Fire to ArrowDown.
- ⚠ **SETTLED — DELETE RUNS kit-profile's `remove(id)` BEFORE THE `remove(key)`
  CALLS**, the reverse of R12's wording (Paul, 2026-09-16). Do not "restore" R12.
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP** (`test-cs011-p2.js`). `t` turning
  capture off in play writes nothing; the rows wait for the next seat. ⛔ **A
  settings save runs inside `update()`** on a menu step, and `levelRecord(mode)`
  reads storage on every call (never cache it).
- ⛔ **`progress` IS v2 AND PER MODE** (CS012 P3, O12): `{ classic, overdrive }`,
  `migrate`d from v1's `{ highestCleared }` into `classic`; ⛔ the key name did not
  move. `levelRecord(mode)` / `startDepthOptions(mode)` default to `state.mode`,
  and `readProgress()` returns BOTH modes so `noteCleared()` writes the pair.
  ⛔ **A console unlock is `levelRecord("classic").noteCleared(81)`.**
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
- ⛔ **KIT-AUDIO 0.4.0 (CS012 P5).** Track gain → sweep → **high-pass** → limiter
  → duck → dip → `music`. ⛔ **The high-pass is BEFORE the limiter, with the
  sweep** — both are tone controls on the programme, where the duck and dip are
  after it because a duck in front of a limiter measured −1.9 dB.
  `highpass: { hz, tc }` is optional like the rest; `setHighpass(on)` is
  idempotent, called every frame from `audioFrame()` with `jumpAirborne(state)`,
  and moves by `setTargetAtTime` — its "off" is a resting 0 Hz pass-through,
  never a bypass. ⛔ **Its `Q` is a fixed Butterworth and NOT a tunable**: that is
  what keeps `test-cs009-p5.js`'s D16 model standing unedited, and
  `test-cs012-p5.js` RUNS that file in a child process rather than copying it.
- ⚠ **FINDING (CS012 P5, MEASURED): EVERY KIT `VERSION` BUMP IS A CLOSED-FILE
  EDIT, AND PLAN §11 DID NOT PREDICT IT.** Three closed files pin `AUDIO_VERSION`
  by literal (`test-cs009-p1.js:100`, `test-cs009-p4.js:98`,
  `test-cs010-p1.js:38`) and two pin the signal path node by node
  (`test-cs009-p1.js`'s `gameRoute`; `test-cs010-p1.js`'s "only the sweep feeds
  the limiter" and its path walk). All six were rewritten in place to 0.4.0 and
  the new chain; none was deleted or weakened. ⛔ **A future plan that names a kit
  version bump owes §11 a row per pinning file, and one for the path if the bump
  moves a node.**
- ⛔ **KIT-AUDIO'S OTHER GROUPS (CS010 P1).** Track gain → sweep → limiter → duck → dip → `music`.
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
  Classic. ✅ **RE-MEASURED on Overdrive (CS012 P4): 0.6519** over 16,000 played
  frames at levels 1, 6, 13 and 23, with the Reaver, the Jump and the combo live
  and the multiplier reaching ×8 — plan §1.4's model said 0.521 with neither the
  Reaver nor the Jump. ⛔ **GDD §19 keeps its ✗ and no weight is rescaled** (O14,
  D6). P6's soak re-measures on its own boards.
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

### The Jump (CS012 P5)

- ⛔ **AIRBORNE IS A PHASE, NOT A DEPTH.** `state.jump` `{ phase, t, cool,
  latched }`; `collideSkimmer()` SKIPS ITS WHOLE PASS while `phase` is `"air"`,
  which takes the rim sweep with it. ⛔ **There is still no Skimmer `depth` and
  exactly ONE two-depth comparison in the build** (the dive strike). Six shipped
  comments and two GDD sections predicted the Jump would end that; all were
  corrected. ⛔ Do not re-open it.
- ⛔ **`updateJump()` MUST STAY A TOTAL NO-OP OUTSIDE `modeHas("jump")`** — it
  writes nothing, `latched` included. `test-cs012-p5.js` hashes a 4,000-step
  Classic session with the jump key pressed every 50 steps against one without,
  step by step, and ⛔ **only `state.input.jump` is set aside from that hash**.
- ⛔ **THE COOLDOWN COUNTS FROM LANDING** (O6), and `JUMP_RECOVERY` is its first
  beat rather than a fourth timer. Recovery is contact-lethal and cannot fire.
- ⛔ **`resetJump()` HAS THREE CALLERS** — `enterWell()`, `respawnSkimmer()` and
  `startDive()` — and ⛔ **it does NOT clear `latched`**, which is the Purge
  charge's rule. `killSkimmer()` forces `latched` true.
- ⛔ **SIGNATURES MOVED:** `skimmerPoints(well, lane, squash, lift)` (a fourth,
  optional argument; three-argument callers are bit-identical) and
  `Skimmer.draw(ctx, well, lift)`. The HUD view carries `jump`, `null` in
  Classic.
- ⛔ **`test-cs012-p5.js` PINS TWO TEXTS BY `mutate`, each exactly once in the
  build:** `  if (jumpAirborne(state)) return;` (with its newline) and
  `state.input.fire && jumpCanFire(state) &&`. It also `mutate`s
  `  JUMP_LIFT:            0.12,` to prove the lift is draw-only.
- ⚠ **It RUNS `test-cs009-p5.js` in a child process** (D16's headroom gate), so
  a change that reddens that file reddens this one too, with a less useful
  message.
- ⛔ **A PHASE LENGTH IS NOT `Math.ceil(limit / C.FIXED_DT)`.** `1/60` is not a
  binary fraction, so a count-up timer takes 54 steps to reach 0.90 s and **13**
  to reach 0.20 s where `ceil` says 12. Assert the property (the first step at or
  past the limit is the last in the phase), never the step count.

### The combo (CS012 P4)

- ⛔ **THE MULTIPLIER IS APPLIED AT THE FOUR KILL LINES, NEVER IN `addScore()`**
  (O4, R6; `CLAUDE.md` Scoring, GDD §7). What is multiplied is exactly what
  builds it: kill points at the three kill sites. ⛔ **Chips, the three clear
  bonuses and the Start Depth bonus are not multiplied and build nothing**, and
  the Dive's termination kill still pays nothing.
- ⛔ **All five functions are no-ops (or exactly 1) outside `modeHas("combo")`**,
  and `comboDrop()` is the ONE fall and the ONE `sfx("comboLost")` seat.
  ⛔ **A lapse does NOT empty the kill count** — O3 empties it on a death alone,
  and `test-cs012-p4.js` asserts that as its own line. ⛔ `since` WRAPS at
  `C.COMBO_WINDOW`, which is what makes the HUD ring refill per half step.
- ⛔ **FINDING (CS012 P4, MEASURED): THE CENTRE-TOP BAND IS 76.29 px TALL.** The
  Fan well (index 14) is an arc across the top, so its throat zone reaches
  y 76.29 with an x span (504.6–775.4) that straddles the centre; every other
  well starts at y 154 or lower. So `C.HUD_COMBO_Y` is **6**, not `HUD_MARGIN`
  24 — at 24 the 56 px em box alone breaches it — and the ring is an **ellipse**
  rather than a circle, because a circle around the widest reading would be
  148 px tall. Shipped sum 6 + 56 + 2 × 4 = 70, clearance **6.29 px**.
  ⛔ **`C.HUD_COMBO_SIZE` cannot rise past ~62 without moving the Fan or
  relaxing GDD §10.3**, and the test asserts the clearance is real AND under
  40 px so a quiet shrink is as visible as a breach. ⚠ The readout DOES overlap
  the undrawn top-centre pause target — O8 measured and accepted that; the two
  corner touch buttons are clear.
- ⚠ **FINDING (CS012 P4, MEASURED): DELETING A CONFIG OBJECT IS A DIFFERENT GREP
  FROM RE-SOURCING ONE OF ITS KEYS.** Plan §11 predicted the four files that read
  `C.TELEMETRY_PLACEHOLDER.maxCombo`; it missed `test-cs007-p4.js:153` and
  `:160`, which test key ABSENCE (`!("score" in …)`) and become a `TypeError`
  when the object goes. Both were rewritten in place to
  `!("TELEMETRY_PLACEHOLDER" in C)`. ⛔ **A future plan that deletes a config
  object owes §11 a grep for `in <OBJECT>` as well as for `<OBJECT>.`.**
  A third unpredicted edit: `test-cs009-p4.js`'s lab `CONTEXT` table needs a
  `comboLost` row, because `:155` asserts every `EVENTS` entry has an in-context
  sequence — the event list drives FOUR assertions there, not three.
- ⛔ **GDD §17 item 8 WITH A MULTIPLIER IS ASSERTED PER `addScore` CALL, NOT PER
  STEP** (`test-cs012-p4.js`). A step can span a step up, so "that step's
  multiplier" is not a number; the soak records `state.combo.mult` live at each
  call and classifies it by whether `state.tally.kills` has just risen. ⛔ The
  board's price multiset holds prices > 0 ONLY — a zero-price death is a bolt
  self-terminating or a Thorn taken by its last chip, and both are 0 either way.
- ⛔ **`instanceof` IS PER BUILD.** `test-cs012-p4.js` builds seven games; a
  `gddPoints()` closed over the outer one matched nothing in any of them and
  every non-vacuity check passed on zero. It takes the build as an argument.
  ⛔ **And `mutantRed()` asserts the mutation string was found exactly once
  BEFORE asserting red** — a `buildGame` throw on a stale string reads as a pass
  otherwise.
- ⛔ **SIX MUTATION STRINGS TAKE THE COMBO OUT** (`COMBO_OUT`, `test-cs012-p4.js`),
  one per kill line plus `comboDeath()` and `updateCombo()`. The three kill lines
  are textually identical, so each string carries the line that follows it
  (`break;` / `continue;` / the Purge's own `if`). A phase that edits a kill line
  repairs that list.

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

- ✅ **Both boards are registered and deployed.** Paul's O11 commit, coinless-kit
  `e2efed5` (2026-09-16), has `vector-vortex` and `vector-vortex-overdrive` at
  `maxMetricPerSecond` **150,000**, the same seven `statsFields`, `maxMetric`
  10,000,000 and durations 5–86,400 s. MEASURED 2026-09-16: `GET /v1/health` lists
  `orbital-overhaul`, `vector-vortex`, `vector-vortex-overdrive`, and both boards
  answer (empty). ⛔ Never pin `f8d34f3`: it replaced `vector-vortex` rather than
  adding beside it, and was live for a few minutes (Classic submits answered
  `INVALID_GAME`, which kit-leaderboard drops); `e2efed5` restored it. ⚠ The
  deployed `statsFields` cannot be read remotely; the repo's registry has all seven.
- ✅ **F1 IS CLOSED, BY PAUL, IN THAT SAME COMMIT.** The plan measured (§1.5) a
  sharp-bot Start Depth 81 **Classic** run at 100,078/s against the then-deployed
  100,000 — a legitimate run would have been flagged. `e2efed5` raised Classic's
  bound to 150,000 too. Nothing is outstanding.
- ✅ **CS012 P3 — Overdrive's online board and SCORES' OVERDRIVE view shipped**
  (above, Meta). ✅ **P4 gave `max_combo` its real source**, `state.combo.peak`.
- ✅ **CS012 P4 — the director's combo input and the Overdrive intensity
  re-measure are done** (Paul's D6): `INT_W_COMBO` is fed
  `clamp01(mult / C.INT_COMBO_MAX)` in Overdrive and still exactly 0 in Classic,
  and the Overdrive maximum is 0.6519 (Audio, above).
- ✅ **CS012 P1 — `drive`** (Paul's A5): the track, `C.MODE_TRACK.overdrive`,
  `"drive"` appended to `C.MUSIC_TRACK_CHOICES`, `tracks` 3. ⛔ Its lab session
  (PASS marks, tiers, balance) is Paul's and ports as its own commit.
- `PTS_REAVER` is read (CS012 P2). `PTS_MIMIC` and `PTS_WARDEN` are unread — CS013's.
- ⛔ **CS015 — achievements** (Paul's M4), planned once Overdrive exists.
- ✅ **`C.TELEMETRY_PLACEHOLDER` IS GONE WHOLE** (CS012 P4): its last key,
  `maxCombo`, reads `state.combo.peak`, and `21-telemetry.js`'s `P` went with it.
  ⛔ **`TELEMETRY_FIELDS` did not move, so `telemetry` stays v1** — `maxCombo`
  kept index 20 and only its source changed. ⛔ The column list is frozen until a
  changeset deliberately moves it; `TELEMETRY_FIELDS`, `TELEMETRY_KINDS`,
  `telemetryRow()` and `22-meta.js`'s declared `telemetry` version move together.
  ⛔ A future column with a scheduled source mints its own constant; it does not
  resurrect this one.
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
- ✅ **`C.MODE_FLAGS` / `modeHas()` HAVE TWO GAME READERS** — P5's `updateJump()`
  and `Game.draw()`'s HUD view, and P4's five combo functions plus
  `dangerInputs()`. `modeHas(name)` defaults to `state.mode`; the combo passes
  `state.mode` explicitly where the function takes it as a parameter.

## Next up — CS012 P6 (the tenth soak, the re-measure, the close)

Run `IMPLEMENTATION-PHASES-CS012.md` P6 in a new session. ⚠ **P5 ran before P4**,
so read "The Jump" and "The combo" hazards together.
⛔ It owns the tenth soak file (a new one, never a widened closed one), the
Overdrive re-measure against P4's **0.6519**, and the close: reviewing and
compressing `log/CS012.md`, moving what is left of this file into it, and
resetting this file. ⛔ **This file is over its ~400 lines and the close is what
fixes that.**
⛔ **Zero skips at the close**, and `test-cs012-p3.js` SKIPS LOUDLY without
`../coinless-kit` at `e2efed5` — P6 cannot close with a skip.
⛔ GDD §19's rows CS012 owns: the combo row closes when P6 plays it; the sweep
row keeps its ✗ with P4's number recorded (O14).

# Vector Vortex — STATUS
Version: 0.0.6 · Changeset: CS010 (not started — planning next) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 2/5

## Phase ledger — CS010

Nothing built yet. One line per phase here; ⛔ **reasoning goes to
`log/CS010.md` as the phase goes**, not to this file (`CLAUDE.md`, Session
rules, 2026-08-31).

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules, 467.1 KB); the
  manifest is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **49 test files, all green, zero skips.**
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
- **CS009 closed 2026-09-16 — the audio engine.** kit-audio **0.2.0**
  (`src/16-audio-engine.js`: four buses, the lookahead scheduler with the stall
  resync, the SFX player) and kit-input **0.7.0**'s `onGesture`. `title` and
  `pulse`, untiered, from `tools/music-lab.html`. Music by screen
  (`musicStateFor()`, `audioFrame()` once per frame). OPTIONS' MASTER / MUSIC /
  SFX / VOICE VOLUME and MUSIC TRACK, session-only. `C.SFX` (Paul's 21 picks from
  `tools/sfx-lab.html`) at 23 `sfx(name, voice)` seats, `sfxVoice` as the eighth
  contract field, the held Surger tone and the over-cap life sound. Phase ledger,
  mutation records, baseline ledger and the §10 verdicts are in `log/CS009.md`;
  GDD §19's Audio verdict is in GDD §19.
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**, and every
  audio entry point returns early on it. `buildGame({ audio: true })` installs
  the recording fake (`X._audio`); the default is still no audio API.
- ⛔ **A seat writes no `state` and draws nothing.** The Surger tone is one held
  voice per telegraphing Surger, keyed in a `Map` in `19-sfx.js` (never a field
  on the entity), and `set(chargeTip())` each frame. ⛔ The headroom gate
  (`test-cs009-p5.js`, `HEADROOM_RATIO` 1.0, ⚠ provisional) measures the
  UNTIERED tracks: 0.450 against 0.434 `pulse`, 0.3005 `title`.
- ⚠ **Both tracks are unauditioned**: no layer carries an `audition` mark.
- ⛔ **Read GDD §6.5 before adding an enemy.** Eight contract fields (plus
  `points()`, CS008 P2), the wiring points, the one array / one spawn entry /
  one well entry / one collision pass rule, and the Dive: an entity that is
  `blocksClear: false` and not `anchored` must decide whether it survives a dive.
- ⛔ **SEVEN SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS.**
  `test-cs003-p5.js` is the Vaulter soak (level 2, the per-tick lane SPEED
  bound). `test-cs004-p5.js` runs the three-kind band (level 7, the exact-lane
  form). `test-cs005-p5.js` and `test-cs006-p5.js` run the full board (level 23);
  the latter owns the Dive. `test-cs007-p5.js` pins no level and arms no `C`
  fixture: it owns the ESCALATING run. ⛔ **`test-cs008-p8.js` is the only one
  that enters through the FRONT DOOR**: one session from the boot title, twenty
  cases through START DEPTH 1 / 5 / 9, RESTART and QUIT TO TITLE, driven by key
  presses and `Game.frame()`. It asserts item 8 played, the Start Depth bonus at
  most once, and the rim-arrival property at the shot pass. ⛔
  **`test-cs009-p6.js` plays one front-door session twice, audio on and audio
  off, and compares a whole-board hash on every frame** (104,107). It also holds
  the node ceiling, the stall bound after a 60 s hidden gap, held voices ≤
  telegraphing Surgers, and every §7 event sounded. It stages the Start Depth
  record (23) and one run's lives at the cap, in both sessions. ⛔ A future
  changeset extends the pattern with an eighth file rather than widening a
  closed one.
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
- `tools/music-lab.html` (SOLO, MUTE, PASS / FAIL, COPY TABLE) and
  `tools/sfx-lab.html` (2–3 candidates per event, COPY OUT) are the porting
  sources for `17-audio-tracks.js` and `C.SFX`, bound to the build by text
  identity (`test-cs009-p2.js`, `-p4.js`).
- `tools/well-lab.html` (the sixteen polygons, `throatOffset` sliders, a
  Legibility readout; ⛔ the visual audition has not happened) and
  `tools/feel-lab.html` (traverse-and-stop, reachable over LAN via `npm run
  serve`).

## Known issues

- ⚠ **R2 — A PAD-ONLY PLAYER IS SILENT UNTIL A KEY, CLICK OR TAP** (PREDICTED:
  a gamepad button is not browser user activation). kit-input's `onGesture`
  fires on `keydown`, `mousedown` and `touchend` only. No changeset owns a fix.
- ⛔ **CS009 TRAPS IN AUDIO CODE** (`archive/PLANNED-FEATURES-CS009.md` §1.4, §1.5, §1.13). (1) Never write the
  vocabulary scan's banned word, even as "… Audio" in a comment:
  `test-cs008-p6.js` scans the whole built file. (2) Never write `.key` after
  an identifier ending in `e` (`tone.key`): `test-cs002-p1.js` bans the
  substring `e.key` outside `04-input.js`. (3) Never start a comment line with
  `// 21-telemetry.js` or `// 22-meta.js`. (4) No platform RNG: the noise is
  `mulberry32(C.AUDIO_NOISE_SEED)`.
- ⛔ **`test-cs009-p3.js` PINS THE TEXT `function audioFrame()` AND ITS CALL
  `audioFrame()`.** So CS009 P5 passes the frame's play-step count through a
  closure variable (`playSteps`), not a parameter. A signature change turns
  `test-cs009-p3.js`'s seat assertions red.
- ⛔ **THE SURGER TONE IS DECIDED AT FRAME END** (`audioFrame()`). If the frame ends
  frozen (`hitStopLeft > 0`) or off play, every voice stops. If the run is live and
  no step ran, the voices hold, so a 120 Hz display does not chop the tone. ⛔ Do not
  stop the tone on a frame with no step: that chops it at every other frame.
- ⛔ **A MENU STEP'S SOUND IS READ OFF ITS ANSWER**, and `syncScreen()` sets
  `menuEntering` so that an entry step's cursor reset is silent. A new screen
  change that skips `syncScreen()` would make its first step play a
  `menuMove`. Unspecified and silent: leaving an adjusting row, a capture,
  entering pause.
- ⚠ **Every seat call is `sfx(`, and `test-cs009-p5.js` scans the built file for
  them.** Each call must name its `C.SFX` event as a string literal, and its
  arguments must hold no assignment.
- ⚠ **GDD §11.5 names `MUSIC_LAYER_CROSSFADE`; `C` has `LAYER_CROSSFADE`.**
  Neither is read. CS010 reconciles the name when it reads one.
- ⛔ **EVERY CS010 CONSTANT IS ALREADY IN `C` AND UNREAD** (MEASURED at the
  CS009 close, a grep of `src/` for `C.<key>`): the ten `INT_*` keys,
  `LAYER_THRESHOLD`, `LAYER_CROSSFADE`, `FILTER_MIN_HZ`, `FILTER_MAX_HZ`,
  `MUSIC_DUCK_GAIN`, `MUSIC_DUCK_RAMP`. `INT_W_COMBO` has no source before
  CS012's combo.
- ⛔ **`MusicSys.setState()` BEFORE THE FIRST GESTURE IS DROPPED** (ported
  as-is: it returns on a null `ctx` without recording the name). That is why
  `audioFrame()` calls it every frame. ⛔ Never move it onto a screen change.
- ⚠ **The VOICE row controls an empty bus (A3).** It moves `AudioSys.voice`,
  which nothing feeds. Whatever feeds it needs its own GDD section and changeset.
- ⛔ **OPTIONS HAS TEN ROWS, AND THE WINDOW SHOWS SEVEN.** A test that reads its
  labels scrolls the window (`test-cs008-p6.js`), and a detail lookup puts the
  cursor near the row first. ⛔ Rows added to OPTIONS go before BACK, never above
  TELEMETRY: the closed tests navigate it by index.
- ⛔ **`Game.reset()` restores the sound rows too** (`resetSound()`, a `setVol`
  per bus). A test claiming a volume survives a quit uses `quitToTitle()` alone.
- ⛔ **A test that counts scheduled steps counts NOTES, never distinct start
  times.** A late step clamps to `currentTime`, so a burst collapses to one
  instant. That reading hid a deleted resync (`log/CS009.md`, P1).
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A THREE-FILE
  EDIT.** `test-cs009-p2.js` holds music-lab's BLOCK A and BLOCK B identical to
  them, and `test-cs009-p4.js` holds sfx-lab's (whole files, trailing whitespace
  aside). Copy the file into BOTH labs' blocks. ⛔ **`00-config.js`'s SFX group
  is sfx-lab's BLOCK SFX**, header comment included: a recipe change goes
  lab-first, then COPY OUT, then the group back into the block. ⛔ Each `C.SFX`
  event stays ONE line starting `    name:`, because COPY OUT finds it that way. ⛔ `17-audio-tracks.js` must name no game global, even in a comment
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
- ⛔ **While a row owns the input, the menu still steps and its answer is
  ignored** (`stepControlMode()`, CS008 P7; OPTIONS' sound rows since CS009 P3).
  Remove the ignored step and a Purge held past a row's exit backs out of the
  page (P3's M2).
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
  CS009's sound rows fit (`test-cs009-p3.js`). A longer label needs the same
  arithmetic.
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

- ⛔ **CS011 — persistence of the Start Depth record, the Controls settings, the
  bindings, the four volumes and the MUSIC TRACK setting.** All are
  session-only. `levelRecord()` is the one
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
- ⚠ **Paul has music-lab feedback he has not yet put into words** (2026-09-16):
  he dislikes some things in the tracks. Asked at CS009's close; the answer is
  pending. Nothing waits on it, but CS010's plan tiers layers of those tracks.
- ⛔ **CS012 — `drive`** (Paul's A5): the track, `C.MODE_TRACK.overdrive`, and
  `"drive"` appended to `C.MUSIC_TRACK_CHOICES`. The registry's `tracks` goes
  2 → 3.
- Backport kit-input (**0.7.0**), kit-menu (0.1.0), kit-fx and kit-audio
  (**0.2.0**) to coinless-kit — each a separate manual step, verified against
  that repo's own suite.
- The Overdrive `PTS_REAVER`, `PTS_MIMIC`, `PTS_WARDEN` are unread — CS012's.
- ⛔ **The seven debug spawn actions ship until CS016** (Paul's H5 call).
- ⛔ `scratchpad/test-registry.js`: `enemies` 6 and `enemyKinds` 9. The next
  mover of either is an Overdrive enemy.

## Next up — ⛔ CS010 PLANNING

⛔ **CS010 is the intensity director** (`ROADMAP.md`): the live-danger signal,
the filter sweep, two or three earned layers and the solo audition (GDD
§11.4–11.6). A planning session writes `PLANNED-FEATURES-CS010.md` and
`IMPLEMENTATION-PHASES-CS010.md`, marks every claim MEASURED or PREDICTED, and
writes no code.

⛔ **What CS010's plan must not lose:**

1. ⛔ **CS010 may tier only a layer marked PASS (Paul's A6), and no layer is
   marked.** A PASS is Paul's mark in `tools/music-lab.html`; a lab is not a
   playtest. What CS010 does with no marks is a call for Paul, and so is his
   unworded track feedback (Carried tasks). The plan names both and stops.
2. ⚠ **SETTLED — the Surger charge tone is audible over music at every tier.**
   `test-cs009-p5.js`'s gate measures untiered tracks. A sweep or a tier
   re-runs it.
3. ⛔ **The loader throws on any `tier` twice over.** CS010 deletes the "not
   supported" throw and keeps the `1..4` range throw. ⛔ `scheduleStep` still
   never reads intensity: gating is a gain node (`test-cs009-p1.js` M2, M3).
4. ⛔ **The director reads `state` and writes none of it, and draws nothing.**
   `test-cs009-p6.js`'s frame-by-frame hash is the proof shape.
5. ⛔ **Tier changes latch to the bar line**, and the menu duck and the 6 dB dips
   ramp, never a bare set (GDD §11.5, §11.6). The `duck` node already exists at
   unity. GDD §17 item 9's two remaining clauses become testable here.
6. ⛔ Every audio edit obeys the known issues above: the three-file rule, the
   pinned `function audioFrame()` text, and the banned substrings.

# PLANNED-FEATURES-CS009 — the audio engine

**The engine and its scheduler, `tools/music-lab.html` with a solo button on
every layer, the `title` and `pulse` tracks, music in the game, the five
Sound/Music rows on OPTIONS, `tools/sfx-lab.html`, and the Classic SFX,
including the Surger charge tone and the over-cap life sound.**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run and where. A PREDICTED one says so.

**Baseline for every measurement: commit `d1847e2`.** `node build.js` → 24
modules, 414.0 KB. `node scratchpad/run-all.js` → **43 files passed, zero
skips, exit 0** (35.7 s wall). Orbital Overhaul measurements are at
`ADD-Orbital-Overhaul` commit **`5abd37a`**.

**How the probes ran.** Orbital Overhaul's `MusicSys` (its `orbital-overhaul.html`
lines 2173–2583) was extracted into the session's temporary directory and driven
in Node against a recording fake `AudioContext`. The two OPTIONS placement
variants (§1.8) were each built in a detached throwaway worktree of `d1847e2`,
also in the temporary directory, then removed. ⛔ **Nothing in this repository's
`src/`, `scratchpad/` or `tools/` was touched** (`CLAUDE.md` rule 3a).

**Read for this plan, beyond the prompt's list:** GDD §4.3, §4.4, §5, §6.3,
§10.5, §13, §15.1, §15.7, §16.1–16.4, §17, §19; `archive/PLANNED-FEATURES-CS008.md`
§0 (for U5's wording) and `log/CS008.md` (one grep, for `MENU_COL_W`'s
arithmetic). Nothing else from `log/` or `archive/`.

---

## ⛔ 0. PAUL'S CALLS — ✅ ALL ANSWERED 2026-09-16, IN THIS SESSION

⛔ A build phase builds these; it does not re-open them. P1 writes the
`DECISIONS.md` pointer.

| # | The call | ✅ Answer |
|---|---|---|
| A1 | What goes on OPTIONS (carried U5 task; GDD §11.1 names a Music Volume slider, §11.7 a selectable track, neither names rows) | **MASTER VOLUME, MUSIC VOLUME, SFX VOLUME, VOICE VOLUME, MUSIC TRACK.** Every row works like the sensitivity rows: **Fire arms, rotate adjusts, Fire / Purge / Escape exits.** Volumes are **0–100 % in 10 % steps** |
| A2 | Default volumes | **All four 100 %** — unity, so the build plays the mix the labs hand over |
| A3 | What the voice bus carries (the GDD has no voice system) | **The bus and its row ship now, with nothing routed to them.** The row is live and controls silence. Whatever feeds it needs its own GDD section and changeset |
| A4 | What MUSIC TRACK can choose before CS012 | **AUTO / PULSE.** AUTO plays the mode's default (§13: Classic → `pulse`, Overdrive → `drive` from CS012). PULSE forces `pulse`. `drive` joins the list at CS012. The title screens always play `title` |
| A5 | Which tracks CS009 composes (ROADMAP #7 says three) | **`title` and `pulse`.** `pulse` is ≥ 90 s before its loop point, A→B→C (§11.3). ⛔ **`drive` moves to CS012**, when Overdrive can reach it. The close edits ROADMAP #7 and the cut-order sentence |
| A6 | The solo audition against "no work waits on Paul" | **CS009's tracks carry NO `tier` field**, so every layer is always on and no gated layer ships. The lab gets per-layer SOLO, MUTE, gain and cutoff, and a PASS / FAIL mark per layer that the copy-out writes into the data. ⛔ **CS010 may tier only a layer marked PASS.** Until Paul uses the lab, the build ships Claude's composition |
| A7 | How the SFX are made | **`tools/sfx-lab.html` with 2–3 candidates per event** (Orbital Overhaul's CS042 pattern), each playable alone and in context, with a copy-out. ⛔ **The build ships candidate A**, so nothing waits. Paul may pick another later, and a later session ports it |
| A8 | Which SFX ship | **The core set, with no spawn cues** — §7's table. An enemy announces itself (§1.1 P2) through its own action cue, not a spawn sound |
| A9 | How the kill sound tells kinds apart (§6.5: read contract fields, never class names) | **An eighth contract field, `sfxVoice`**, a string each class sets. GDD §6.5 and `CLAUDE.md`'s wiring list gain it |

### ⚠ Readings this plan takes and flags — none is a call Paul left open

Each follows from an answer above, an existing definition, or a measurement.
⛔ **If Paul objects to any, the phase that builds it stops.**

- **The OPTIONS rows go after CREDITS and before BACK**, in A1's order.
  MEASURED §1.8: at the top they break 99 closed assertions; there they break 3.
- **MUSIC TRACK is an adjusting row too**, because A1 says every row works like
  the sensitivity rows. Rotate steps through `AUTO`, `PULSE` and clamps at both
  ends, as the sensitivity rows do. A change in play crossfades at once.
- **Volume is linear gain**, `steps / 10`, as Orbital Overhaul's `setVol` is
  (MEASURED, its line 1548). ⛔ A change ramps over `C.AUDIO_VOL_RAMP`, never a
  bare `.value` set.
- **Session-only until CS011**, exactly as the Controls page is: the settings
  live outside `state`, a quit to the title keeps them, and `Game.reset()`
  restores the defaults. ⛔ No `state` field is added.
- **§11.6 stays CS010's** (ROADMAP's row): the duck node is built at unity in
  P1 because §11.1's signal path contains it. The menu duck, the 6 dB event
  dips and the kick-driven rim pulse are not wired.
- **Music by screen.** Title, mode, START DEPTH, and OPTIONS opened from the title
  (with its pages) play `title`. Play, the dive, pause, and OPTIONS opened from
  pause (with its pages) play the gameplay track. Game over fades to silence
  over `C.MUSIC_FADE_OUT` (C's own comment names game over). RESTART starts the
  gameplay track again.
- **The over-cap sound fires only for an award refused at the cap.** A milestone
  crossed on a stopped run (`screen === "gameover"`) is not an award past the cap
  (GDD §4.4), so it is silent. GDD §4.4 measured that case at 0 in 268 game overs.
- **The third and later Purge presses make no sound.** GDD §4.3 has them do
  nothing.
- **The Dive's termination kill makes no kill sound.** It is not a player kill
  (GDD §5, `11-dive.js`), and the strike sound covers the moment.
- **The Surger tone tracks the fuse, not a clock.** Each frame, its pitch is set
  from `Surger.chargeTip()`. It is silent on every frame on which no play step
  runs: pause, any menu, and the death freeze. So it cannot run ahead of a
  frozen fuse or play out after one.
- **SFX recipes are DATA in `C`** (an `SFX` group), not a second exception
  beside "tracks are DATA". `CLAUDE.md`'s "every tunable lives in C" then needs
  no new carve-out.

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — there is no audio in the build, and no closed test names it.

`src/16-audio-engine.js`, `17-audio-tracks.js`, `18-audio-director.js` and
`19-sfx.js` are one-line placeholders of 96, 96, 98 and 87 bytes (`wc -c`).
`grep -rn "16-audio\|17-audio\|18-audio\|19-sfx\|AudioSys\|MusicSys" scratchpad/*.js`
→ **no hits**. Filling the four modules repairs no closed assertion.

### 1.2 MEASURED — `C` already carries the audio constants, CS010's included.

`src/00-config.js` lines 510–533, group `Audio (GDD 11)`: `MUSIC_LOOKAHEAD` 0.20,
`MUSIC_CROSSFADE` 0.60, `MUSIC_FADE_OUT` 1.00, `MUSIC_DUCK_GAIN` 0.50,
`MUSIC_DUCK_RAMP` 0.15, `LAYER_THRESHOLD` `{2: 0.30, 3: 0.55, 4: 0.80}`,
`LAYER_CROSSFADE` 1.20, `FILTER_MIN_HZ` 600, `FILTER_MAX_HZ` 18000, and the
`INT_*` director weights. ⛔ CS009 reads the first three and adds its own below
them. The duck, layer, filter and `INT_*` values are CS010's and stay unread.

### 1.3 MEASURED — Orbital Overhaul's scheduler: no drift, a burst after a stall, 8–13 nodes a step.

Probe: OO's `MusicSys` and six track tables under a fake `AudioContext` whose
`currentTime` the probe advances by 1/60 s a frame.

| What | Result |
|---|---|
| Drift over 10 minutes (36,000 frames of `drift`, `stepDur` 0.17) | `nextStepTime − t0 − steps × stepDur` = **−2.1 × 10⁻¹¹ s** |
| One second of frames on `warehouse` (`stepDur` 0.12) | 11 steps, 17 notes: correct |
| ⛔ **One `update()` after a 60 s gap** (a hidden tab: no frames run) | **931 notes over 500 steps, every one clamped to the same instant** |
| Worst nodes created by one step (gain + low-pass + high-pass + 1 or 2 oscillators, or 1 buffer source) | `title` 13, `zen` 13, `derelict` 8, `drift` 13, `warehouse` 12, `highscore` 12 |

⛔ **The burst is a defect CS009 does not port.** OO's `scheduleStep` clamps a
late step to `currentTime` and its catch-up guard is 1,024 steps, so a returning
tab fires every missed note at once. In Vector Vortex the hidden tab is a
shipped pause source (GDD §10.5), so the gap is routine. P1 **resyncs** instead:
when `nextStepTime` is more than one lookahead behind, it advances `step` and
`nextStepTime` by the whole number of missed steps, which keeps bar phase and
schedules none of them. PREDICTED: one post-gap `update()` then schedules at most
`ceil(MUSIC_LOOKAHEAD / stepDur) + 1` steps.

### 1.4 MEASURED — three scans of the WHOLE built file bite a verbatim port.

| Scan | Where | What it catches in OO's audio code |
|---|---|---|
| No `Math` + `.random` in the built file | `test-cs003-p1.js:116`, `test-cs003-p2.js:362` | OO's `ensureNoiseBuf()` and `explosion()` both fill buffers with it |
| No `\bweb\b` (case-insensitive) in the built file, comments included | `test-cs008-p6.js:424` | one comment in OO's scheduler names the browser audio API by its two-word name (1 hit in the extracted block) |
| (future) no `setTimeout` / `setInterval` | — | ⛔ **the built file already has one hit, a COMMENT**: `C.MUSIC_LOOKAHEAD`'s "never setTimeout/setInterval" (dist line 560). P1's scan must strip comments, as `test-cs007-p4.js`'s scanner does |

⛔ **The noise buffer takes its own `mulberry32` stream from its own seed**
(`C.AUDIO_NOISE_SEED`), passed into the engine as a function. That is what
`01-rng.js`'s header prescribes for draws that must not move with the run's
stream ("it takes its own stream from its own seed"). ⛔ **It is never
`state.rng`.** The labs use the same generator, so what Paul hears is what ships.

### 1.5 MEASURED — `test-cs002-p1.js` bans SUBSTRINGS, and `e.key` is an easy one to write.

`test-cs002-p1.js:426` bans `addEventListener`, `e.key`, `.touches`,
`getGamepads`, `movementX` and `clientX` as **substrings** in every module but
`04-input.js`. ⛔ **`tone.key`, `table.key`, `voice.key`, `name.key`:** any
identifier ending in `e` followed by `.key` turns it red. Audio code should not
use a property named `key`.

### 1.6 MEASURED — kit-input has no gesture hook, and nothing else may listen.

`grep -n "gesture\|onGesture" src/04-input.js` → no hits. `attach()` listens on
`keydown`, `keyup`, `mousedown`, `mouseup`, `mousemove`, `contextmenu`, `blur`,
`visibilitychange` and the four touch events (`04-input.js:751–818`). §1.5's scan
forbids `addEventListener` anywhere else. So the audio unlock has to come
through kit-input: **0.7.0 (MINOR) adds an optional `onGesture` callback**,
called synchronously inside the `keydown`, `mousedown` and `touchend` handlers.

PREDICTED, not measured (no browser here): those three events count as user
activation in current browsers, and `touchstart` and a gamepad button press do
not. ⚠ **A pad-only player therefore hears nothing until a key, click or tap.**
See Risk R2.

### 1.7 MEASURED — the harness has no fake `AudioContext`.

`scratchpad/_harness.js:86` sets `win.AudioContext` to `undefined`, and
`buildGame()` passes `undefined` as the `AudioContext` parameter (line 207). So
every existing test runs the guarded no-op path, which is the invariant. P1 adds
an **opt-in** `buildGame({ audio: true })` that installs a recording fake. The
default stays `undefined`, so no closed test changes (PREDICTED).

### 1.8 MEASURED — where the five OPTIONS rows go decides which closed tests break.

Each variant added five inert rows (`MASTER VOLUME`, `MUSIC VOLUME`,
`SFX VOLUME`, `VOICE VOLUME`, `MUSIC TRACK`) to `SCREENS.options` in its own
worktree, then ran the full suite.

| Placement | Result |
|---|---|
| Above TELEMETRY | **2 files red: `test-cs008-p6.js` 18/254, `test-cs008-p7.js` 81/172.** The tests reach CONTROLS and CREDITS by row index (`right(2)`, `tapRight(3)`) |
| ⛔ **After CREDITS, before BACK** | **1 file red: `test-cs008-p6.js` 3/254.** Every index-navigated row keeps its index |

The three are all at `test-cs008-p6.js:337–348`, and P3 rewrites them in place:
- `OPTIONS rows are TELEMETRY / EXPORT / CONTROLS / CREDITS / BACK`. It reads the
  drawn texts, and with 10 rows the 7-row window (`C.MENU_VISIBLE_ROWS`) no
  longer draws BACK.
- `no Sound or Music row (CS009's)`. The claim itself moves.
- `four rows carry a detail` (got 7).

`test-cs008-p8.js` (the front door) stayed green under both placements.

### 1.9 MEASURED — the row labels fit `C.MENU_COL_W` 460 by the suite's own arithmetic.

`test-cs008-p6.js`'s overlap rule is `l.x + len × C.MENU_TEXT_SIZE (30) ×
C.TEXT_CHAR_W (0.62) < r.x − len × 30 × 0.62`, with `labelX` 410 and `detailX`
870. Gaps: `MASTER VOLUME` / `‹100%›` **106.6 px**, `MUSIC TRACK` / `‹PULSE›`
**125.2 px**, against the shipped `MOUSE SENSITIVITY` / `‹×1.2›` **32.2 px**. The
placement variant ran that assertion on the inert rows and it passed.
⛔ `C.MENU_COL_W` does not move.

### 1.10 MEASURED — OO's music-lab has MUTE, not SOLO. OO's sfx-lab is the A7 precedent.

`grep -n "solo" tools/music-lab.html` (OO) → no control. It has a per-layer
`mute` button, and its header says the mute node is "lab-only, NOT to be
ported". The per-layer solo button GDD §11.4(c) requires does not exist anywhere
yet. OO's `tools/sfx-lab.html` (63.6 KB) puts three candidates per event beside
"▶ in context" buttons and a copy-to-clipboard block. Its header says the
candidates' own source is what the copy-out prints, "so what you hear is
byte-for-byte what gets pasted". CS009's labs adopt that property as a test (§4,
§6).

### 1.11 MEASURED — the seats already exist, and two of them are single writers.

| Sound | Seat (all MEASURED by grep at `d1847e2`) |
|---|---|
| Fire | `updateShots()`, `src/06-shots.js:77` (`state.shots.push`) |
| Kill | the three kill sites `12-scoring.js`'s header names: `collideShots()`, `collideSkimmer()`, `updatePurge()` (`09-collision.js:84, 202, 346`) |
| Carrier split / Thorn chip | `Carrier.onShot` `07-enemies.js:445`, `Thorn.onShot` `:845` |
| Weaver bolt launch | `Weaver.fire()` `:645` |
| Drifter crossing | `this.phase = "cross"` `:1096` |
| Surger charge / discharge | ⛔ `Surger.setPhase()` `:1282`, the ONE writer of `phase`; `chargeTip()` `:1288` gives 0..1 fuse progress |
| Death / game over | `killSkimmer()` `09-collision.js:238`; `screen = "gameover"` at `:279` |
| Respawn | `respawnSkimmer()` `23-main.js:113` |
| Extra life / over-cap | ⛔ `addScore()`'s `while`, `12-scoring.js`. The `else` comment is the seat CS008 left |
| Well clear | the clear edge in `Game.update()` (`if (wellCleared(state))`) |
| Dive / dive strike | `startDive()` `11-dive.js:80`, `diveStrike()` `:141` |
| Menu move / confirm / back | `Game.update()`'s non-play branch: `menu.step()` returns the action name and `menu.cursor` is readable |

⛔ **No entity carries a kind** (`grep "this.kind" src/07-enemies.js` → none):
A9's field is what the kill site reads.

### 1.12 MEASURED — an eighth contract field breaks exactly one closed assertion and no hash.

`test-cs004-p1.js:71–74` asserts `Object.keys(new Enemy(...))` is exactly the
seven fields in contract order. That is the one closed assertion `sfxVoice`
breaks, and P5 rewrites it in place, as CS008 P2 rewrote the signature list for
`points()` (the comment at `:69` records it). The soak hashes mix **named** fields
(`test-cs003-p5.js:126–159`: `e.lane`, `e.depth`, `e.dead`, …) and never
enumerate an entity (`grep "Object.keys(e)"` → none). PREDICTED: no hash moves.

### 1.13 MEASURED — `test-cs007-p4.js` finds the telemetry module by the FIRST `// 21-telemetry.js` and `// 22-meta.js`.

`raw.indexOf(...)`, lines 466–467. ⛔ A comment line in modules 16–19 that
starts with either text would move the slice. Each module's own first line names
itself, which is safe.

---

## 2. THE SHAPE

| Module | Side | Owns |
|---|---|---|
| `16-audio-engine.js` | ⛔ **kit-audio draft** — no `C`, no `state`, no game global | `createAudioEngine(opts)` (context, the four buses, unlock, volume), `createMusic(engine, opts)` (the scheduler, crossfade, layer gates, the duck node), `createSfxPlayer(engine)` (one-shot recipes and held voices). `AUDIO_VERSION` `"0.1.0"`. `src/16-audio-engine.NOTES.md` from its first commit |
| `17-audio-tracks.js` | game DATA | `buildTitleTrack()`, `buildPulseTrack()`, `MUSIC_TRACKS`. ⛔ Ported byte-for-byte from music-lab's BLOCK B |
| `18-audio-director.js` | — | ⛔ **Untouched. CS010's.** |
| `19-sfx.js` | game glue | the instances (`AudioSys`, `MusicSys`, `Sfx`) built from `C`, `musicStateFor()`, `sfx(name, arg)`, `audioFrame()` (music update and the Surger tones) |

PREDICTED names; P1 may rename inside this shape, but not across the kit line.

- ⛔ **The kit line is `04-input.js`'s precedent** (MEASURED:
  `test-cs002-p1.js:436–438` asserts no `C.` and no `state.` in its slice).
  Tunables arrive through `opts`, and the noise generator arrives as a function.
- ⛔ **`AudioSys.ctx` is the guard `CLAUDE.md` names**: every entry point in all
  three objects, and every function in `19-sfx.js`, returns early when it is null.
- ⛔ **Nothing audio-side writes `state` or calls `state.rng()`.** `sfx()` is
  called from simulation seats, and `audioFrame()` runs once per `Game.frame()`,
  after the steps and before `draw()`. It reads `state` and never writes it.
- **Signal path, as §11.1:** note envelopes → layer gate → track gain
  (crossfaded) → duck (unity in CS009) → `music` bus → `master` bus →
  destination. SFX → `sfx` bus → `master`. `voice` bus → `master` (empty, A3).

---

## 3. P1 — THE ENGINE

- **kit-input 0.7.0 (MINOR): `onGesture`** (§1.6). An optional callback, called
  synchronously in the `keydown`, `mousedown` and `touchend` handlers. Absent, it
  changes nothing. It gets a `.NOTES.md` entry (game-agnostic, backport
  `not yet`). `23-main.js` passes `() => AudioSys.unlock()`.
- **`unlock()`** creates the context once, inside the gesture (`AudioContext` or
  `webkitAudioContext`), and builds the four buses at `vol` levels held since
  boot. Every later gesture resumes a `suspended` context.
- **`createMusic`** is OO `5abd37a`'s `MusicSys`, ported, with **four departures,
  each tested:**
  1. The noise buffer comes from the injected generator (§1.4).
  2. Stall resync (§1.3).
  3. No comment contains the word §1.4 bans.
  4. The optional per-layer sink hook (`opts.layerSink`), so the lab's
     SOLO/MUTE nodes live outside the ported code. The build passes none.
  
  ⛔ **`setIntensity` is not ported.** It is the director's interface, and it is
  CS010's. Every gate is built at 1.
- **Track contract** (§11.3) plus one data-only field: `audition` (`"pass"` |
  `"fail"`, absent = not judged). ⛔ The scheduler never reads it (A6). ⛔
  **P1's loader rejects a `tier` outside `1..4`** (`CLAUDE.md`) and, in CS009,
  any `tier` at all (A6).
- **New `C` (Audio group; PREDICTED values):**
  - `AUDIO_NOISE_SEED`
  - `AUDIO_VOL_STEPS` 10
  - `AUDIO_VOL_DEFAULT` 10 (A2)
  - `AUDIO_VOL_RAMP` 0.03 s
  - `MUSIC_STEP_NODE_MAX` 16: ⚠ provisional, ≥ OO's measured worst of 13
- **Harness:** `buildGame({ audio: true })`, the recording fake (§1.7). It counts
  every created node by type, records connections, param automation and
  `start()` times, and lets a test set `currentTime`. P1 adds `AudioSys`,
  `MusicSys` and the factories that exist to `EXPORTS`. P4 adds `Sfx`.
- ⛔ **No sound plays in P1's build.** No track exists and no seat calls `sfx()`.
  P1 tests the engine against a synthetic table handed to `createMusic`.

## 4. P2 — `tools/music-lab.html`, AND THE TWO TRACKS

- **The lab** (standalone HTML, not shipped):
  - **BLOCK A** is `createMusic` and `createAudioEngine` copied from
    `16-audio-engine.js`. ⛔ The test asserts they are identical text.
  - **BLOCK B** is the track builders. ⛔ The test asserts it is identical text
    to `17-audio-tracks.js`'s builders.
  - **Per layer:** SOLO, MUTE, a gain slider, a cutoff slider (when the layer
    has one), and a PASS / FAIL / — mark.
  - **Transport:** track picker, play/stop, a loop-position ribbon with section
    marks (A / B / C), and bar/step readout.
  - **COPY TABLE** emits BLOCK B text with every edited `gain` and `cutoff`
    rewritten and each marked layer's `audition` field set. It is the one route
    Paul's changes take back into the repo.
  - ⛔ **SOLO is exclusive-additive** (any soloed layer mutes every unsoloed
    one), and it is the §11.4(c) gate's instrument. ⛔ A mark without a SOLO
    listen is allowed. The gate is Paul's judgement, not an interlock.
- **The tracks**, composed by Claude in the lab, ported verbatim:
  - **`pulse`** — Classic's gameplay track. "Sparse, tonal, near-ambient at
    foundation" (§11.7). ⛔ **≥ 90 s before the loop point**, in A→B→C sections.
    ⛔ **The melody is in the always-on foundation** (`CLAUDE.md`), and in CS009
    every layer is foundation.
  - **`title`** — no length target (PREDICTED 20–40 s).
  - ⛔ **Every layer is written to pass the solo test**, recognisable alone. That
    is Claude's composition target. Paul's mark is the verdict (A6).
- **Registry:** `test-registry.js` `tracks` 0 → **2**.
- ⛔ **Worst nodes per step ≤ `C.MUSIC_STEP_NODE_MAX`** on both tracks, measured
  from the tables (§17 item 9).
- The music still plays nowhere in the game. That is P3.

## 5. P3 — MUSIC IN THE GAME, AND THE OPTIONS ROWS

- **`musicStateFor(screen, optionsFrom, mode, trackSetting)`**, a pure function,
  applies §0's music-by-screen reading. `C.MODE_TRACK` `{ classic: "pulse" }`,
  and CS012 adds `overdrive: "drive"`. `AUTO` resolves through it and `PULSE`
  forces `pulse`.
- **`audioFrame()`** is called once per `Game.frame()` after the steps. It
  calls `MusicSys.setState(musicStateFor(...))` (idempotent) and
  `MusicSys.update()`. Headless and before a gesture, it no-ops.
- **The five rows** go after CREDITS, before BACK (§1.8). Labels and details:
  `MASTER VOLUME 100%`, `MUSIC VOLUME 100%`, `SFX VOLUME 100%`,
  `VOICE VOLUME 100%`, `MUSIC TRACK AUTO`. While a row is armed, its detail
  shows `‹…›`.
  - ⛔ **A row mode, through `stepControlMode()`'s mechanism.** The menu still
    steps, and its answer is ignored (STATUS known issue; `CLAUDE.md`-level
    rule from CS008 P7). `adjusting` generalises from `"mouse" | "touch"` to
    the row's key.
  - ⛔ **Any exit keeps the value.**
  - The details are written in `update()`, beside the telemetry detail. They
    are ⛔ never written in `draw()`.
  - `Game.reset()` restores the defaults. `quitToTitle()` keeps them.
- **Closed-file rewrites:** `test-cs008-p6.js`'s three assertions (§1.8), in
  place. The row list comes from a scroll through the window, "no Sound or Music
  row" becomes the five rows present, and the detail count follows the drawn
  window. ⛔ Nothing else in a closed file.
- ⛔ **Voice (A3):** the row sets the `voice` bus gain. P3's test asserts the bus
  exists, moves, and has no input connected.

## 6. P4 — `tools/sfx-lab.html`, AND THE SFX PLAYER

- **`createSfxPlayer(engine)`** (kit side) plays a recipe:
  - One or two oscillators (type, start → end frequency, glide time), or noise
    (from the injected generator).
  - An optional low-pass or high-pass filter with a sweep.
  - An attack/hold/release envelope and a peak gain.
  - `play(recipe, { pitch })` for one-shots.
  - `hold(recipe)` returns `{ set(t01), stop() }` for a held voice whose pitch
    follows `t01` (the Surger).
- **Recipes are DATA in `C.SFX`** (§0 reading), one entry per §7 event. The kill
  sound is one recipe plus `C.SFX_KILL_PITCH` keyed by `sfxVoice`.
- **The lab:**
  - 2–3 candidates per event, **A** listed first.
  - Per event: ▶ each candidate, ▶ in context (the neighbours it plays among,
    e.g. fire + kill + split), and a picked marker.
  - **A copy-out** emits the `C.SFX` block text for the picked candidates.
  - ⛔ The test asserts the lab's candidate-A block is identical text to
    `00-config.js`'s `SFX` group (A7).
  - ⛔ **The player code in the lab is `createSfxPlayer` copied from
    `16-audio-engine.js`**, identity-asserted like music-lab's BLOCK A.
- ⛔ **The Surger tone's candidates are auditioned against `pulse` playing**:
  its "in context" button runs the music.
- No seat calls `sfx()` yet. That is P5.

## 7. P5 — THE CLASSIC SFX IN THE GAME

| Event | Seat (§1.11) | Notes |
|---|---|---|
| `fire` | `updateShots()` push | one per shot |
| `kill` | the three kill sites, on the false → true `dead` edge | pitch from `C.SFX_KILL_PITCH[e.sfxVoice]`. ⛔ not the Dive's termination kill |
| `split` | `Carrier.onShot`, where the split happens | |
| `chip` | `Thorn.onShot` | per chip |
| `bolt` | `Weaver.fire()` | |
| `cross` | Drifter `phase = "cross"` | the moment it opens (§6.3's vulnerable read) |
| `surgeCharge` | ⛔ held voice, reconciled in `audioFrame()` | one per telegraphing Surger, keyed by the entity in a `Map` owned by `19-sfx.js` (⛔ no field on the entity). `set(chargeTip())` each frame. It stops on phase exit, death, a frame with no play step, and any non-play screen |
| `surgeDischarge` | `Surger.setPhase("discharge")` | |
| `death` | `killSkimmer()` | |
| `gameOver` | `killSkimmer()`, where it sets `"gameover"` | the music fade is P3's |
| `respawn` | `respawnSkimmer()` | |
| `purge` / `purgeWeak` | `updatePurge()`, uses 1 and 2 | ⛔ `purgeWeak` is "distinctly feeble" (§4.3); use 3+ silent |
| `extraLife` | `addScore()`, the award branch | |
| `lifeLost` | ⛔ `addScore()`'s `else`, when `lives >= C.LIVES_MAX` and `screen !== "gameover"` | the carried task (§4.4 "never silently swallowed") |
| `wellClear` | the clear edge in `Game.update()` | |
| `dive` | `startDive()` | the rising sweep (§5). A repeated dive plays it again |
| `diveStrike` | `diveStrike()` when it hits | |
| `menuMove` / `menuConfirm` / `menuBack` | `Game.update()`'s non-play branch | back = the action equals `screen.back`. An adjusting row's step plays `menuMove` |

- **A9: `sfxVoice`**, the eighth contract field. The base default is `null`, and
  every class sets its own: `vaulter`, `carrier`, `weaver`, `weaverBolt`,
  `thorn`, `drifter`, `surger`. ⛔ A test asserts that no roster class leaves
  it `null`. P5 rewrites `test-cs004-p1.js:71–74` in place (§1.12) and adds the
  field to GDD §6.5 and to `CLAUDE.md`'s wiring rule ("decide explicitly its
  `sfxVoice`").
- ⛔ **The Surger headroom gate (§11.8, SETTLED).** Headless proxy at the default
  volumes, with every layer sounding (A6: untiered is the loudest a track can
  be). The charge tone's peak gain at `master` must be ≥ the loudest step's
  summed layer peak gains at `master`, on `pulse` and on `title`. ⚠ The 0 dB
  ratio is provisional, and it is the knob in the `SKIPPED-PLAYTESTS.md` entry.
  ⛔ Hardware verification is the skipped playtest, logged there, not waited on.
- **`SKIPPED-PLAYTESTS.md`** gets two entries (CS009 P5):
  1. The Surger tone audible over `pulse` on real hardware.
  2. The overall SFX mix and clutter at high spawn rates.

## 8. P6 — THE AUDIO SOAK, THE DOCS, THE CLOSE

- **`scratchpad/test-cs009-p6.js` — the seventh soak** (STATUS: "a future
  changeset extends the pattern with a seventh file"). It uses
  `test-cs008-p8.js`'s front-door driver shape and runs the **same scripted
  session twice**, once with `buildGame({ audio: true })` after a scripted gesture
  and once without. ⛔ **The state hash must be identical**, which proves audio
  spends no draw and writes no state across real play. It also asserts:
  - no exception;
  - nodes per scheduled step ≤ `C.MUSIC_STEP_NODE_MAX`;
  - no stall burst across a scripted 60 s hidden gap;
  - every §7 event fired at least once, or is named in a skip list with its
    reason (⛔ skip loudly);
  - live held Surger voices never exceed telegraphing Surgers on the board.
- **Docs:**
  - GDD §11: a "Shipped, CS009" note per subsection. §4.4: the over-cap sound
    ships. §6.5: `sfxVoice` (if P5 did not already add it). §10.5: the OPTIONS
    table. §16.4: `tools/`. §17 item 9: the node ceiling, shipped.
  - `CLAUDE.md`: `tools/sfx-lab.html` in Design instruments; the sfx-lab port
    rule beside music-lab's.
  - `ROADMAP.md`: CS009's row as shipped; #7 `drive` → CS012; the cut-order
    sentence's "CS009's third track" becomes CS012's `drive`.
  - `STATUS.md` reset. The CS011 persistence task gains the four volumes and the
    track setting.
  - `log/CS009.md` closed.
- ⛔ **Zero skips**, and `P1_DETERMINISM_HASH` and `GOLDEN_LANES` asserted
  unmoved.

---

## 9. ⛔ THE BASELINE LEDGER

| Baseline | Moves in CS009? |
|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` **1229033515** | ⛔ **No, in every phase** (PREDICTED: no audio code writes `state` or draws from `state.rng`, and the hashes mix named fields, §1.12). A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | ⛔ **No** (PREDICTED, same reason) |
| `test-registry.js` `tracks` | **0 → 2 in P2** (MEASURED that the key exists and reads 0) |
| `test-registry.js` `enemies` 6, `enemyKinds` 9, `STATE_FIELDS` | ⛔ **No** — no enemy, kind or `state` field is added |

**Closed-file edits, all in place:**
- P3: `test-cs008-p6.js`, 3 assertions (MEASURED, §1.8).
- P5: `test-cs004-p1.js`, 1 assertion (MEASURED, §1.12).
- ⛔ **Any other closed assertion going red is a finding to stop on**, not a
  repair.

## 10. ⛔ ACCEPTANCE CRITERIA

1. Headless, every audio entry point no-ops, and the 43 closed files stay green
   except the four named assertions, which are rewritten in place.
2. No `setTimeout`/`setInterval` outside comments in the built file. No platform
   RNG anywhere in it. No `\bweb\b`.
3. The scheduler's drift over 10 simulated minutes is < 1 × 10⁻⁶ s.
4. After a 60 s gap, one `update()` schedules ≤ `ceil(MUSIC_LOOKAHEAD /
   stepDur) + 1` steps.
5. `scheduleStep` reads no intensity and no `audition`. It is mutation-checked:
   a gate that skips a layer turns the test red.
6. `pulse` ≥ 90 s before its loop point; both tracks untiered; worst nodes per
   step ≤ `C.MUSIC_STEP_NODE_MAX`.
7. music-lab's BLOCK A and BLOCK B, and sfx-lab's player and candidate-A block,
   are identical text to their build sources.
8. music-lab has a SOLO and a MUTE per layer, and its copy-out writes `audition`.
9. The five OPTIONS rows adjust the four buses and the track, keep their value on
   every exit, survive a quit to title, and reset on `Game.reset()`. The menu
   still steps under a row mode.
10. Every §7 event fires from its seat. `lifeLost` fires only at the cap on a
    live run. `purgeWeak` is a different recipe from `purge`.
11. The Surger tone follows `chargeTip()`, is silent under pause and in the death
    freeze, and passes the headroom gate.
12. Audio-on and audio-off front-door sessions hash identically.
13. kit-input 0.7.0 and kit-audio 0.1.0 each have a `.NOTES.md` entry.

## 11. ⛔ WHAT CS009 DOES NOT DO

- **The intensity director, tiers, the filter sweep, ducking, event dips, the
  rim pulse, the Dive's "drops to foundation"** — CS010 (§11.4–11.6).
- **`drive`** — CS012 (A5). **`rush`, `deep`** — post-ship (ROADMAP #7).
- **Persistence** of the volumes and the track — CS011.
- **Anything on the voice bus** (A3).
- **Spawn cues** (A8), **the combo-loss sound** (§14.4, CS012), **the Dive's
  visual** (unowned).

## 12. RISKS

| # | Risk | Mitigation |
|---|---|---|
| R1 | P2 is a composition phase with no audition inside it, and 90 s of `pulse` is real work | P2 owns only two tracks. Paul's audition is the lab, whenever he chooses (A6). The phase's gate is the identity test, the node ceiling and the length, not taste |
| R2 | A pad-only player hears nothing until a key, click or tap (PREDICTED, §1.6) | Logged in `STATUS.md` as a known issue at P1. Browser policy, not a fix |
| R3 | A future comment writes one of the substrings §1.4/§1.5 ban | The phase prompts name them. The suite fails loudly, not silently |
| R4 | The byte-identity tests make every engine edit a two-file edit | That is the point (`CLAUDE.md`: "port verbatim"). The failure message names both files |
| R5 | Held Surger voices leak if a Surger is removed by the end-of-frame filter without a phase exit | `audioFrame()` reconciles against the board each frame, not against events. The P6 soak asserts voices ≤ telegraphing Surgers |
| R6 | Six phases against ROADMAP's 3–5 guideline | Precedent: CS008 held nine. If P4 overruns, split sfx-lab (P4) from the player (P4b), with no renumber |
| R7 | `C` grows past 50 KB with `C.SFX` (MEASURED: 49,562 bytes now) | No ceiling applies to `C` (`CLAUDE.md`'s 50 KB is `CLAUDE.md`'s own). Noted, not acted on |

## 13. ASSUMPTIONS

- The OO port source is `ADD-Orbital-Overhaul` at `5abd37a`, `orbital-overhaul.html`
  lines 2173–2583. Its `tools/music-lab.html` and `tools/sfx-lab.html` are the
  lab templates. None of its track data is ported: the §18 vocabulary scan and
  §11.7's track list both point at new tracks.
- Linear gain for volume is acceptable (§0). A perceptual curve would be a
  tuning call nobody has asked for.
- The composed tracks and candidate-A SFX are Claude's, unauditioned at close,
  and that is shippable under Paul's 2026-09-16 no-playtest call. The labs make
  his later changes a data port.

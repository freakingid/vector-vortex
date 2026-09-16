# IMPLEMENTATION-PHASES-CS009

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

**Baseline:** CS008 closed; CS009 planned at `d1847e2`. `node build.js` → 24
modules, 414.0 KB. `node scratchpad/run-all.js` → **43 files, zero skips**
(35.7 s).
- `test-registry.js`: `wells: 16`, `openWells: 6`, `tracks: 0`, `enemies: 6`,
  `enemyKinds: 9`.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- `src/16-audio-engine.js`, `17-audio-tracks.js`, `18-audio-director.js` and
  `19-sfx.js` are placeholders.
- kit-input (`src/04-input.js`) is **0.6.0**.

✅ **Every design call is answered — Paul, 2026-09-16,
`PLANNED-FEATURES-CS009.md` §0 (A1–A9).** Eleven readings are flagged there.
⛔ If Paul objects to a reading, the phase that builds it stops.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The engine: kit-input `onGesture`, buses, the scheduler, the harness fake | Opus 5 | **high** |
| P2 | `tools/music-lab.html` with SOLO, and the `title` and `pulse` tracks | Opus 5 | **high** |
| P3 | Music in the game, and the five OPTIONS rows | Opus 5 | **high** |
| P4 | `tools/sfx-lab.html`, the SFX player, `C.SFX` | Opus 5 | medium |
| P5 | The Classic SFX at their seats, `sfxVoice`, the Surger tone and its gate | Opus 5 | **high** |
| P6 | The seventh soak (audio on vs off), the docs, the close | Opus 5 | **high** |

---

## ⛔ Why the seam falls here

**P1 has no sound and no track** — the CS005 P1 and CS008 P3 shape. The engine,
the stall fix and the unlock path are headless and provable against a synthetic
table. Every later phase then stands on a scheduler that has already passed its
drift, stall and node tests.

**P2 before P3, because P3 needs a track to route.** P2 is also where the
byte-identity tests first bind the lab to the build. After P2, an engine edit
that forgets the lab turns the suite red.

**P3 before P4/P5, because the SFX gate listens against the music.** P5's
headroom gate (plan §7) compares the Surger tone with `pulse` at the default
volumes, and those volumes are P3's rows.

**P4 before P5: the lab and the player, then the seats.** P4 touches no
simulation file. P5 touches six (`06`, `07`, `09`, `11`, `12`, `23`) and adds a
contract field, so P5 carries the closed-file edit and P4 stays baseline-free.

**P6 is the close and a seventh soak** — `STATUS.md`: "a future changeset
extends the pattern with a seventh file rather than widening a closed one."

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P6 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** A move is a defect (plan §9) |
| P1–P6 | `GOLDEN_LANES` | ⛔ **No** |
| P2 | `test-registry.js` `tracks` | 0 → 2 |

### ⛔ Closed-file edits — four assertions, in place

| Phase | File | What |
|---|---|---|
| P3 | `test-cs008-p6.js:337–348` | the OPTIONS row list, "no Sound or Music row", the detail count (plan §1.8) |
| P5 | `test-cs004-p1.js:71–74` | the seven contract fields become eight (plan §1.12) |

---

## P1 — the engine

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS009.md` §0, §1.1–1.7,
> §1.13, §2, §3, §9 and §10. Then `VECTOR-VORTEX-GDD.md` §0, §1, §11.1–11.3,
> §15.7, §17. Then `src/04-input.js` and `src/04-input.NOTES.md`,
> `src/01-rng.js`, `scratchpad/_harness.js`, and `Game.init()` / `Game.frame()`
> in `src/23-main.js`. Then `lib/MODULE-NOTES-TEMPLATE.md`. The port source is
> `../ADD-Orbital-Overhaul/orbital-overhaul.html` lines 1522–1553 (`AudioSys`
> buses) and 2173–2583 (`MusicSys`), at commit `5abd37a`. ultrathink.
>
> ⛔ **Answered (§0).** Four buses: master, music, sfx, voice. Volumes default to
> 100 %. Tracks carry no `tier` in CS009. §11.6 ducking is CS010's.
>
> **1. kit-input 0.7.0 (MINOR): `onGesture`.**
> - An optional callback, called synchronously inside the `keydown`, `mousedown`
>   and `touchend` handlers. Absent, nothing changes.
> - ⛔ It reads no `C` and no `state` (`test-cs002-p1.js:436–438`).
> - `.NOTES.md` entry: game-agnostic, backport `not yet`.
>
> **2. `src/16-audio-engine.js` — kit-audio 0.1.0.** ⛔ No `C`, no `state`, no
> game global: every tunable comes through `opts`, and the noise generator is an
> injected function.
> - `createAudioEngine(opts)`: `ctx` null until `unlock()`. Inside the gesture,
>   `unlock()` creates the context once and builds master / music / sfx / voice
>   at the held `vol`. A later call resumes a suspended context.
>   `setVol(bus, v)` ramps over `opts.volRamp` and never sets a bare `.value`.
> - `createMusic(engine, opts)`: OO's `MusicSys`, ported, with **the four
>   departures in plan §3**, each with its own assertion:
>   1. the injected noise generator;
>   2. ⛔ **stall resync** (plan §1.3: OO bursts 931 notes after a 60 s gap);
>   3. no banned word in a comment;
>   4. `opts.layerSink`.
> - `setIntensity` is NOT ported (CS010). The duck node is built at unity.
> - The track loader throws on any `tier` field in CS009, and on a `tier`
>   outside `1..4` always.
> - `src/16-audio-engine.NOTES.md` from this commit (the draft kit doc,
>   `CLAUDE.md`).
>
> **3. `src/19-sfx.js`.**
> - The instances `AudioSys` and `MusicSys`, built from `C`, with the noise
>   generator `mulberry32(C.AUDIO_NOISE_SEED)`. ⛔ Never `state.rng`.
> - An empty `MUSIC_TRACKS` for now.
> - `23-main.js` passes `onGesture: () => AudioSys.unlock()` to `createInput`.
> - ⛔ **Every function returns early on `!AudioSys.ctx`.**
>
> **4. `C`, Audio group.** `AUDIO_NOISE_SEED`, `AUDIO_VOL_STEPS` 10,
> `AUDIO_VOL_DEFAULT` 10, `AUDIO_VOL_RAMP`, `MUSIC_STEP_NODE_MAX` 16 (⚠
> provisional).
>
> **5. `_harness.js`.**
> - `buildGame({ audio: true })` installs a recording fake `AudioContext`. It
>   counts nodes by type, records connections, param automation and `start()`
>   times, and lets the test set `currentTime`.
> - The default stays `undefined`.
> - Add the new globals to `EXPORTS`.
>
> **6. Your test, `scratchpad/test-cs009-p1.js`.**
> - Headless: every entry point no-ops, `ctx` stays null, nothing throws.
> - `onGesture` fires on each of the three events and not on `keyup`,
>   `mousemove` or `touchstart`. `unlock()` is idempotent.
> - The bus graph and `setVol` ramps.
> - The scheduler, on a synthetic table:
>   - it schedules exactly the steps inside the lookahead;
>   - ⛔ drift < 1e-6 s over 10 simulated minutes;
>   - ⛔ one post-gap `update()` schedules ≤ `ceil(lookahead / stepDur) + 1`
>     steps. Mutation-check it: without the resync, the test is red;
>   - `scheduleStep` never reads intensity or `audition`. Mutation-check it: a
>     gate that skips a layer is red;
>   - worst nodes per step are counted and asserted under the ceiling.
> - The built file, **comments stripped** (plan §1.4 — `C` already has a
>   comment that names the timers), has no `setTimeout` or `setInterval`. No
>   platform RNG. No `\bweb\b`.
> - The kit-audio slice has no `C.` and no `state.`.
>
> **7. ⛔ Traps (plan §1.4, §1.5, §1.13).**
> - Never write the word the vocabulary scan bans, even in "… Audio" in a
>   comment.
> - Never write a `.key` property after an identifier ending in `e`.
> - Never start a comment line with `// 21-telemetry.js` or `// 22-meta.js`.
>
> **8. ⛔ No baseline moves.** Run `node scratchpad/test-cs006-p2.js` and confirm
> **1229033515**.
>
> **9. Docs.**
> - `DECISIONS.md`: a one-line pointer to plan §0 (A1–A9, Paul, 2026-09-16).
> - GDD §11.1–11.2: "Shipped, CS009 P1" notes, including the stall resync.
> - `STATUS.md`: the ledger line; Known issue R2 (a pad-only player is silent
>   until a key, click or tap); the traps above.
> - `log/CS009.md`: created, with the phase's reasoning.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P2 — `tools/music-lab.html`, and the `title` and `pulse` tracks

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS009.md` §0 (A5, A6),
> §1.3, §1.4, §1.10, §4 and §10. Then `VECTOR-VORTEX-GDD.md` §0, §1, §11.3–11.5,
> §11.7, §13, §18. Then `RATIONALE.md#music-layers`. Then
> `src/16-audio-engine.js` and its `.NOTES.md`, and `src/19-sfx.js`. The lab
> template is `../ADD-Orbital-Overhaul/tools/music-lab.html` (`5abd37a`). ⛔ Take
> its shape; take none of its track data or its names. ultrathink.
>
> ⛔ **Answered (§0).**
> - `title` and `pulse` only; `drive` is CS012's.
> - No `tier` field on any layer.
> - Every layer gets SOLO and MUTE, gain and cutoff sliders, and a
>   PASS / FAIL / — mark.
> - The copy-out writes `audition`.
> - Nothing waits on Paul's audition.
>
> **1. `tools/music-lab.html`** (standalone, not shipped, opens from `file://`).
> - **BLOCK A** is the engine code, copied from `16-audio-engine.js`.
> - **BLOCK B** is the track builders.
> - SOLO is exclusive-additive. MUTE and SOLO nodes are attached through
>   `opts.layerSink`, never inside BLOCK A.
> - Transport, a track picker, a loop ribbon with A/B/C section marks, and a
>   bar/step readout.
> - **COPY TABLE** emits BLOCK B with edited `gain` and `cutoff` values and the
>   `audition` marks.
>
> **2. Compose, in the lab.**
> - **`pulse`**: Classic's gameplay track, "sparse, tonal, near-ambient at
>   foundation" (§11.7). ⛔ **≥ 90 s before the loop point**, A→B→C sections.
>   ⛔ The melody is in the foundation.
> - **`title`**: no length target.
> - ⛔ **Write every layer to be recognisable played solo** (§11.4(c)). It is
>   your composition target, not Paul's verdict.
> - ⛔ Worst nodes per step ≤ `C.MUSIC_STEP_NODE_MAX`. If a track needs more,
>   stop and record it; do not raise the ceiling in this phase.
>
> **3. Port, verbatim.** BLOCK B → `src/17-audio-tracks.js` (`buildTitleTrack`,
> `buildPulseTrack`, `MUSIC_TRACKS`). `19-sfx.js` hands `MUSIC_TRACKS` to
> `MusicSys`. ⛔ No gain is re-tuned in the build (`CLAUDE.md`).
>
> **4. Registry.** `test-registry.js` `tracks` 0 → **2**.
>
> **5. Your test, `scratchpad/test-cs009-p2.js`.**
> - ⛔ **BLOCK A is identical text to its `16-audio-engine.js` source, and BLOCK
>   B to `17-audio-tracks.js`'s builders.** Extract both by marker, and make the
>   failure name both files.
> - The lab has a SOLO control and a MUTE control per layer (by the markup the
>   lab generates, asserted through its layer renderer's source).
> - Both tracks: no `tier`; `pulse` length ≥ 90 s; worst nodes per step ≤ the
>   ceiling; every `audition` value absent, `"pass"` or `"fail"`; every note
>   frequency finite and > 0.
> - The track count is read from the registry, never written here.
>
> **6. ⛔ No baseline moves.** The music plays nowhere in the game yet (P3).
>
> **7. Docs.**
> - GDD §11.3 and §11.7: shipped notes (the two tracks, their lengths and
>   sections, `audition`).
> - `CLAUDE.md` Design instruments: the music-lab line gains "SOLO, MUTE, the
>   PASS/FAIL mark and COPY TABLE".
> - `STATUS.md`: the ledger line. Note "the tracks are unauditioned; the lab is
>   where Paul judges them (A6)".
> - `log/CS009.md`: how each section was built, and the node counts.
> - ⛔ No `SKIPPED-PLAYTESTS.md` entry: a lab is not a playtest (`CLAUDE.md`).
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P3 — music in the game, and the OPTIONS rows

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS009.md` §0 (A1–A4 and
> the readings on placement, the track row, linear gain, session-only and music
> by screen), §1.8, §1.9, §5 and §10. Then `VECTOR-VORTEX-GDD.md` §0, §1, §10.5,
> §11.1, §11.7, §13. Then `src/23-main.js` (SCREENS, `stepControlMode()`,
> `refreshControlRows()`, `menuAction()`, `update()`, `frame()`, `reset()`),
> `src/15-render-hud.js`, `src/19-sfx.js`, and `scratchpad/test-cs008-p6.js`
> lines 320–350 and `test-cs008-p7.js`'s sensitivity section. ultrathink.
>
> ⛔ **Answered (§0).**
> - MASTER / MUSIC / SFX / VOICE VOLUME and MUSIC TRACK, after CREDITS and
>   before BACK.
> - Each row: Fire arms, rotate adjusts, Fire / Purge / Escape exits.
> - Volumes are 0–100 % in 10 % steps, default 100 %.
> - MUSIC TRACK is AUTO / PULSE.
> - The voice bus is empty.
> - Session-only.
>
> **1. Music by screen.**
> - `musicStateFor()` is pure. `C.MODE_TRACK` is `{ classic: "pulse" }`.
> - `audioFrame()` is called once per `Game.frame()`, after the steps and before
>   `draw()`. It calls `setState` (idempotent), then `update()`.
> - Game over fades to silence. RESTART and entering play start the gameplay
>   track.
> - ⛔ No `state` write, no draw.
>
> **2. The rows.**
> - Generalise `adjusting` to the row's key. ⛔ **The menu still steps under a
>   row mode and its answer is ignored** (`STATUS.md` Known issue). A Purge held
>   past the exit must not back out of OPTIONS.
> - Rotate: one step per whole `MENU_ROTATE_STEP`, clamped. Any exit keeps the
>   value.
> - The details are written in `update()`, never in `draw()`.
> - `Game.reset()` restores the defaults; `quitToTitle()` keeps them.
> - A MUSIC TRACK change in play crossfades at once.
>
> **3. ⛔ Closed-file rewrites, in place:** `test-cs008-p6.js`'s three assertions
> (plan §1.8). Restore each one's precondition:
> - the row list read through a scroll of the window;
> - "no Sound or Music row" becomes the five rows present;
> - the detail count follows the drawn window.
>
> Touch nothing else in a closed file. **Any other closed failure is a finding:
> stop.**
>
> **4. Your test, `scratchpad/test-cs009-p3.js`.**
> - `musicStateFor()` across every screen, both `optionsFrom` values, and both
>   track settings.
> - With the fake context, driven through `frame()`: the title plays `title`,
>   play plays `pulse`, and game over ramps the track gain to silence over
>   `MUSIC_FADE_OUT`.
> - Each volume row moves its bus through `setVol` ramps. VOICE moves a bus with
>   no input.
> - Clamps at 0 % and 100 %; exit by each of Fire, Purge and Escape keeps the
>   value; a held Purge does not leave OPTIONS.
> - Survives `quitToTitle()`; resets on `Game.reset()`.
> - The labels do not overlap their `‹…›` details (the suite's arithmetic,
>   plan §1.9).
>
> **5. ⛔ No baseline moves** (confirm 1229033515).
>
> **6. Docs.**
> - GDD §10.5: the OPTIONS table and a Sound/Music bullet. §11.7: routing,
>   AUTO / PULSE.
> - `STATUS.md`: remove the carried Sound/Music task; the ledger line; add
>   "the VOICE row controls an empty bus (A3)"; the CS011 persistence task gains
>   the four volumes and the track.
> - `log/CS009.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P4 — `tools/sfx-lab.html`, the SFX player, `C.SFX`

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS009.md` §0 (A7, A8, and
> the `C.SFX` reading), §6, §7 (the event list only) and §10. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §4.3, §4.4, §5, §6.3, §11.8. Then
> `src/16-audio-engine.js` and its `.NOTES.md`, `src/19-sfx.js`, and the Audio
> group in `src/00-config.js`. The lab template is
> `../ADD-Orbital-Overhaul/tools/sfx-lab.html` (`5abd37a`). ⛔ Take its shape,
> not its sounds or names.
>
> ⛔ **Answered (§0).**
> - 2–3 candidates per event; the build ships A.
> - The core set, no spawn cues.
> - The kill sound varies by `sfxVoice` (the field itself is P5's).
>
> **1. `createSfxPlayer(engine)`** in `16-audio-engine.js` (kit side).
> - `play(recipe, { pitch })` and `hold(recipe)` → `{ set(t01), stop() }`.
> - Recipes are plain data: oscillators or noise, glide, filter and sweep, an
>   envelope, a peak gain.
> - Guarded. The injected noise generator only.
> - Bump kit-audio to 0.2.0 (MINOR) with a `.NOTES.md` entry.
>
> **2. `C.SFX`** — one recipe per event in plan §7's table, and
> `C.SFX_KILL_PITCH` keyed by the seven `sfxVoice` values. Every recipe is
> candidate A, ported verbatim.
>
> **3. `tools/sfx-lab.html`.**
> - Candidates per event, with A first.
> - ▶ per candidate, ▶ in context, and a picked mark.
> - `surgeCharge` is auditioned as a held voice driven 0 → 1 over
>   `C.SURGE_TELEGRAPH`, **with `pulse` playing** (the lab loads BLOCK A and
>   `pulse`'s builder by the same identity rule as music-lab).
> - `purgeWeak` sits beside `purge` in context.
> - A copy-out emits the `C.SFX` block for the picked candidates.
>
> **4. Your test, `scratchpad/test-cs009-p4.js`.**
> - ⛔ The lab's player code is identical text to `createSfxPlayer`, and its
>   candidate-A block is identical text to `00-config.js`'s `SFX` group.
> - Every §7 event has a recipe and ≥ 2 candidates.
> - `purgeWeak` differs from `purge`.
> - With the fake context: `play` builds a bounded node set that stops itself;
>   `hold().set()` moves frequency; `stop()` ends every node.
> - Headless no-op.
>
> **5. ⛔ No seat calls anything yet, and no baseline moves.**
>
> **6. Docs.**
> - `CLAUDE.md` Design instruments: `tools/sfx-lab.html`, with "the build ships
>   the picked candidate; port verbatim".
> - GDD §11.8: shipped note.
> - `STATUS.md`: the ledger line.
> - `log/CS009.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P5 — the Classic SFX at their seats

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS009.md` §0 (A8, A9, and
> the over-cap, Purge, dive-kill and Surger-tone readings), §1.11, §1.12, §7, §9
> and §10. Then `VECTOR-VORTEX-GDD.md` §0, §1, §4.3, §4.4, §5, §6.3, §6.5, §11.8.
> Then `src/12-scoring.js`, `src/09-collision.js`, `src/11-dive.js`,
> `src/06-shots.js`, the `Enemy` base and the seven classes in
> `src/07-enemies.js`, `src/19-sfx.js`, and `scratchpad/test-cs004-p1.js` lines
> 60–80. ultrathink.
>
> ⛔ **Answered (§0).**
> - The core set, no spawn cues.
> - `sfxVoice` is an eighth contract field.
> - `lifeLost` fires only at the cap on a live run.
> - `purgeWeak` is distinctly feeble; use 3+ is silent.
> - The Dive's termination kill is silent.
> - The Surger tone follows `chargeTip()` and is silent on any frame with no
>   play step.
>
> **1. `sfxVoice`.**
> - The base default is `null`. Each of the seven classes sets its own.
> - ⛔ Rewrite `test-cs004-p1.js:71–74` in place: eight fields, contract order,
>   and the comment records why.
> - GDD §6.5: the field. `CLAUDE.md`'s "New enemies wire into seven places"
>   rule: decide `sfxVoice` explicitly.
>
> **2. The seats** — plan §7's table, one `sfx(name, arg)` call each.
> - ⛔ The kill fires on the false → true `dead` edge at the three kill sites.
> - `addScore()`'s `else` comment becomes the `lifeLost` call.
> - ⛔ **No seat writes `state` and none draws.**
>
> **3. The Surger tone.**
> - `audioFrame()` reconciles held voices against the board: one per Surger in
>   `telegraph`, in a `Map` owned by `19-sfx.js` (⛔ no field on the entity), and
>   `set(chargeTip())`.
> - A voice stops when its Surger leaves `telegraph`, dies or is filtered, and
>   on any frame that ran no play step (pause, a menu, the death freeze).
>   ⛔ **`Game.frame()` must tell `audioFrame()` whether a play step ran**;
>   `hitStopLeft > 0` alone is not the answer on a pause.
>
> **4. ⛔ The headroom gate (§11.8, SETTLED).** At the default volumes, the
> `surgeCharge` peak gain at `master` must be ≥ the loudest step's summed layer
> peaks at `master`, for `pulse` and `title`. ⚠ The 0 dB ratio is provisional.
> If candidate A fails it, raise that recipe's gain in the lab and re-port.
> ⛔ Never exempt the tone from the SFX bus.
>
> **5. Your test, `scratchpad/test-cs009-p5.js`.**
> - Use `{ spy: ["sfx"] }` headless for the seats, and the fake context for
>   nodes.
> - Each event fires from a staged board through the real `Game.update()`.
> - `lifeLost` fires at the cap and not on a stopped run. Stage both, as
>   `test-cs008-p2.js` stages the cap.
> - `purgeWeak` on use 2; nothing on use 3.
> - No kill sound on the Dive's termination kill.
> - Every roster class has a non-null `sfxVoice`.
> - The Surger voice count equals the telegraphing count each frame. Its
>   frequency rises with `chargeTip()`. It is silent under pause and inside the
>   death freeze, driven through `frame()`.
> - The headroom gate.
> - ⛔ Mutation-check the tone: a voice started once and never `set()` is red.
>
> **6. ⛔ No baseline moves.** Confirm 1229033515, and that `GOLDEN_LANES` is
> green.
>
> **7. Docs.**
> - GDD §4.4: the over-cap sound ships. §6.3: the tone ships. §11.8: the seats.
> - `SKIPPED-PLAYTESTS.md`, two entries (plan §7): the Surger tone on hardware,
>   and SFX mix and clutter. Knobs: `C.SFX.surgeCharge` gain and the gate ratio;
>   `C.AUDIO_VOL_DEFAULT`.
> - `STATUS.md`: remove the over-cap carried task; the ledger line.
> - `log/CS009.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P6 — the seventh soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS009.md` §8–§12. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §11, §17, §19. Then `scratchpad/test-cs008-p8.js`
> (the front-door driver), `log/CS009.md` in full, and `ROADMAP.md`'s sequence,
> cut-order paragraph and GDD open-questions table. ultrathink.
>
> **1. `scratchpad/test-cs009-p6.js` — the seventh soak.**
> - Build one front-door driver, as `test-cs008-p8.js` does. ⛔ Don't widen that
>   file.
> - Run the same scripted session twice: once with `buildGame({ audio: true })`
>   and a scripted gesture, once without.
> - ⛔ **The state hash is identical.**
> - No exception.
> - Nodes per step ≤ `C.MUSIC_STEP_NODE_MAX`.
> - A scripted 60 s gap causes no burst.
> - Held Surger voices ≤ telegraphing Surgers on every frame.
> - Every §7 event fires at least once, or a skip names it and why. ⛔ Skip
>   loudly; the close then asserts zero skips across the suite, so an event the
>   driver cannot reach is staged instead.
> - ⛔ Obey `STATUS.md`'s replay traps: two live steps before the first press,
>   and no press past a game over.
>
> **2. The review.** Read `log/CS009.md`'s phase entries together. Reconcile
> anything two phases said differently.
>
> **3. Docs.**
> - GDD §11: every subsection's CS009 note, checked against the code.
> - §17 item 9: the node ceiling ships; intensity and bar latching stay CS010's.
> - §19 Audio: which criteria CS009 met, and which are CS010's or CS011's
>   (persistence).
> - `CLAUDE.md` code map, if a module's one-liner changed.
> - `ROADMAP.md`:
>   - CS009's row as shipped;
>   - a "What CS009 shipped / left" paragraph;
>   - GDD §21 #7: `drive` → CS012;
>   - the cut-order "CS009's third track" becomes CS012's `drive`;
>   - CS012's row gains `drive`.
> - `STATUS.md`: reset for CS010; compress the ledger into `log/CS009.md`.
> - `log/CS009.md`: the close entry.
> - Update `C.GAME_VERSION` per the house pattern.
>
> **4.** ⛔ Zero skips. `P1_DETERMINISM_HASH` 1229033515 and `GOLDEN_LANES`
> unmoved.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Six phases in one changeset | P4 overrunning: split sfx-lab (P4) from the player and `C.SFX` (P4b), with no renumber |
| 2 | No baseline moves anywhere in CS009 | Any move is a defect in an audio seat, not a re-record |
| 3 | kit-input takes one MINOR bump (0.7.0); kit-audio 0.1.0 (P1) → 0.2.0 (P4) | P4's player landing in P1 instead |
| 4 | P4 is medium effort: a lab and a data port, no simulation file | The identity tests or `C.SFX`'s size making it more than a port |
| 5 | The labs bind to the build by text identity, not by loading `dist/` | A lab that must run the built file, which would need `file://` script loading of `dist/` |

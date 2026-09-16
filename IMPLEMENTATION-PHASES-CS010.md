# IMPLEMENTATION-PHASES-CS010

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

**Baseline:** CS009 closed, then Paul's music-lab ports; CS010 planned at
`d40f222`. `node build.js` → 24 modules, 468.8 KB. `node scratchpad/run-all.js`
→ **49 files, zero skips** (44.0 s).
- `test-registry.js`: `tracks: 2`, `enemies: 6`, `enemyKinds: 9`.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- kit-audio (`src/16-audio-engine.js`) is **0.2.0**; `src/18-audio-director.js`
  is a one-line placeholder.
- The headroom gate reads 0.4184 (`pulse`, trimmed 8.2 dB) and 0.4404 (`title`)
  against the tone's 0.450.

✅ **Every design call is answered — Paul, 2026-09-16,
`PLANNED-FEATURES-CS010.md` §0 (D1–D16).** Eleven readings (R1–R11) are flagged
there. ⛔ If Paul objects to a reading, the phase that builds it stops.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | kit-audio 0.3.0: tier gates with the bar-line latch, the sweep, the limiter, the duck and dip, `onBeat`; the fake's compressor; the headroom gate after the limiter | Opus 5 | **high** |
| P2 | The director: `dangerInputs`, the smoothing, intensity and the sweep in play, the duck by screen, the dips | Opus 5 | **high** |
| P3 | The earned layers (`cycle`, `tick`), Paul's gains, `title`'s ground, music-lab's INTENSITY and TIER, the articulation gate | Opus 5 | **high** |
| P4 | The rim pulse on `heart` | Opus 5 | medium |
| P5 | The eighth soak (the director spied), the docs, the close | Opus 5 | **high** |

---

## ⛔ Why the seams fall here

**P1 is the whole kit edit, and it plays nothing new.** Every change to
`16-audio-engine.js` is a three-file edit and pins a version in two closed
files (plan §1.4, §1.5). One engine phase means one sync and one bump. It is
proven on synthetic tables, the CS009 P1 shape. It must also carry the
limiter's gate rewrite: once the limiter is on the game's path,
`test-cs009-p5.js` stays green while measuring the wrong thing (plan §1.4 D2).

**P2 before P3, because a tier needs someone to move it.** P2 wires the
director with every layer still untiered, so nothing audible changes except the
sweep, the duck and the dips. Its proofs are about reading `state` and shaping a
number.

**P3 changes the music.** The tiers, Paul's gains and `title`'s ground are one
BLOCK B port, with the lab controls that produce it. The fixture collision at
0.450 (plan §1.4 G) and the `test-cs009-p2.js` rewrite land with the data that
causes them.

**P4 is the only render change**, and it depends on a data mark and on P1's
`onBeat`. It is small and visual, and kept apart so a readability problem cannot
hold the music back.

**P5 is the close and the eighth soak.** A played bar-line assertion needs tiered
layers (P3). A director spy needs the director (P2).

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P5 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** A move is a defect (plan §8) |
| P1–P5 | `GOLDEN_LANES` | ⛔ **No** |
| P1 | kit-audio `AUDIO_VERSION` | 0.2.0 → 0.3.0 |

### ⛔ Closed-file edits — in place, MEASURED (plan §1.4)

| Phase | File | What |
|---|---|---|
| P1 | `test-cs009-p1.js` | 7: the four "refuses tier N in CS009 (A6)", "not ported (CS010)", "the track gain feeds the duck", "kit-audio is 0.2.0" |
| P1 | `test-cs009-p4.js:98` | 1: "kit-audio is 0.2.0" |
| P1 | `test-cs009-p5.js` | 2: the headroom assertions become D16's curve model |
| P3 | `test-cs009-p2.js` | 1: "pulse: no layer carries a tier (A6)" |
| P3 | `test-cs009-p5.js` | the Surger-voice fixture (nine assertions' precondition): find a voice by its route, not a gain equal to 0.45 |

---

## P1 — kit-audio 0.3.0: the gates, the sweep, the limiter, the duck

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS010.md` §0, §1.3–1.7,
> §2, §3, §8 and §9. Then `VECTOR-VORTEX-GDD.md` §0, §1, §11.1–11.6, §11.8, §17.
> Then `RATIONALE.md#music-layers`. Then `src/16-audio-engine.js` and its
> `.NOTES.md`, `src/19-sfx.js`, `C`'s Audio group in `src/00-config.js`,
> `scratchpad/_harness.js`, `scratchpad/test-cs009-p1.js` and the headroom gate
> at the foot of `scratchpad/test-cs009-p5.js`. The port source is
> `../ADD-Orbital-Overhaul/orbital-overhaul.html` lines 2405–2500 (`setDuck`,
> `setIntensity`, `setState`'s gates), at commit `5abd37a`. ultrathink.
>
> ⛔ **Answered (§0).**
> - Thresholds 0.25 / 0.40 (D5).
> - `LAYER_CROSSFADE` 0.03 s, on the gate, from the bar line (D11).
> - Limiter −24 dB, knee 0, ratio 20, attack 1 ms, release 100 ms (D2), on the
>   path note → gate → track gain → sweep → limiter → duck → dip → `music`
>   (plan §1.6, measured).
> - Sweep exponential (D14).
> - Dips −6 dB: down 0.15 s, held 0.5 s, back 0.15 s (D9).
> - The gate after the limiter is the curve model with the settings pinned (D16).
> - No layer is tiered in P1.
>
> **1. `src/16-audio-engine.js` — kit-audio 0.3.0 (MINOR).** ⛔ No `C`, no
> `state`, no game global. `createMusic` gains **optional groups** (R5: a new
> required option makes `test-cs009-p1.js` throw):
> - `gating { thresholds, ramp }`: each layer's gate starts at the current
>   level's target. `setIntensity(f)` clamps f to [0, 1], and for each gate whose
>   target flips, schedules its ramp **at the next bar line on the scheduler's
>   own grid** (R6).
>   ⛔ `update`, `scheduleStep` and `playNote` are not touched
>   (`test-cs009-p1.js:411`).
> - `sweep { minHz, maxHz, q, tc }`: a low-pass built once in `ensureGraph()`,
>   open at `maxHz`. `setSweep(f)` moves it to `minHz × (maxHz / minHz)^f` with
>   `setTargetAtTime`.
> - `limiter { threshold, knee, ratio, attack, release }`: a
>   `DynamicsCompressorNode` built once, after the sweep.
> - `duck { gain, ramp, dipGain, dipHold }`: `setDuck(on)`, idempotent (OO's),
>   and `dip()`. The dip is its own node after the duck (R9). Down over `ramp`,
>   held `dipHold`, back over `ramp`. ⛔ Ramps only.
> - `onBeat(t)`: called for each note of a layer with `beat: true`, at its start
>   time.
> - **The loader:** delete the "not supported" throw. A `tier` needs a `gating`
>   group and the track's `bar` (R4). A `tier` outside `1..4` still throws.
> - An absent group builds no node and changes nothing.
> - Rewrite the header's "Not ported" lines. `.NOTES.md` entry: MINOR,
>   game-agnostic, backport `not yet`.
>
> **2. ⛔ Three-file edit.** Copy the file whole into BLOCK A of
> `tools/music-lab.html` and `tools/sfx-lab.html`. Pass the limiter group to both
> labs' `createMusic` calls, from their `LAB` preview copy (D3: the lab is
> limited).
>
> **3. `src/19-sfx.js`** passes `gating`, `sweep`, `limiter` and `duck` from `C`.
> No director yet: the sweep stays open, and the duck and dip sit at unity.
>
> **4. `C`, Audio group.**
> - `LAYER_THRESHOLD` `{ 2: 0.25, 3: 0.40, 4: 0.80 }` (R10: key 4 unchanged,
>   unread).
> - `LAYER_CROSSFADE` 0.03.
> - `FILTER_Q` −3.0103 (R2) and `FILTER_TC` 0.05 (R3, ⚠ provisional).
> - `MUSIC_LIMIT` `{ threshold: -24, knee: 0, ratio: 20, attack: 0.001, release: 0.10 }`.
> - `MUSIC_DIP_GAIN` 0.50, `MUSIC_DIP_HOLD` 0.50.
>
> **5. `_harness.js`.** The fake gains `createDynamicsCompressor()`: `threshold`,
> `knee`, `ratio`, `attack` and `release` params (Chromium's defaults, −24 / 30 /
> 12 / 0.003 / 0.25) and `reduction` 0. ⛔ Without it, five files are red.
>
> **6. Closed files, in place** (plan §1.4; ⛔ nothing else).
> - `test-cs009-p1.js`: the four tier refusals become acceptances (with `gating`
>   and `bar`); "not ported" becomes ported; "the track gain feeds the duck"
>   becomes the §1.6 route; the version becomes 0.3.0.
> - `test-cs009-p4.js:98`: the version.
> - ⛔ `test-cs009-p5.js`'s two headroom assertions become **D16's model**: the
>   loudest all-on envelope sum `x` → `limitOut(x)` = the spec's hard-knee curve
>   `T + (x_dB − T)/R` above T, plus makeup `−0.6 × (T − T/R)` dB → × duck, dip,
>   `vol.music` and `vol.master` ≤ the tone's peak at master / `HEADROOM_RATIO`.
>   Assert `knee === 0` first, because the curve is exact only then. Expect 0.3350
>   (`pulse`) and 0.3359 (`title`) at today's gains (plan §1.7).
>
> **7. Your test, `scratchpad/test-cs010-p1.js`** (synthetic tables, the fake):
> - ⛔ every gate change lands on a bar line; **mutation: a setter at `currentTime`
>   is red** (plan §1.3). Read the logged `t`, never `.value` (the fake's
>   `.value` is the last target);
> - a gate targets only 0 or 1 and ramps over `C.LAYER_CROSSFADE`;
> - `setSweep` follows D14 with `setTargetAtTime`;
> - the limiter's params equal `C.MUSIC_LIMIT`;
> - ⛔ a graph walk proves no track gain reaches `music` except through
>   sweep → limiter → duck → dip;
> - duck and dip: ramps only, never above 1, and none of those nodes gets a bare
>   `.value` set after construction (`rec.valueSets`);
> - `onBeat` fires once per marked note, at its start;
> - absent groups build no node;
> - a tier without `gating` or `bar` throws;
> - the sweep's Q has no peak (≤ −3.0103);
> - the kit slice has no `C.` and no `state`.
>
> **8. ⛔ Traps.** Never write the vocabulary scan's banned word, even in a
> comment. Never `.key` after an identifier ending in `e`. Never start a comment
> line with `// 21-telemetry.js` or `// 22-meta.js`. ⛔ Do not rename
> `function audioFrame()`.
>
> **9. ⛔ No baseline moves.** Run `node scratchpad/test-cs006-p2.js` and confirm
> **1229033515**.
>
> **10. Docs.**
> - `DECISIONS.md`: a one-line pointer: "CS010's audio calls (D1–D16) and
>   readings (R1–R11), Paul, 2026-09-16: `PLANNED-FEATURES-CS010.md` §0,
>   answered in the planning session."
> - GDD §11.1's path. §11.5: "one-pole" becomes the Butterworth biquad (R2), and
>   `MUSIC_LAYER_CROSSFADE` becomes `C.LAYER_CROSSFADE` at 0.03 s (D11).
>   §11.8: the gate's new form.
> - `STATUS.md`: the ledger line, and remove the crossfade-name known issue.
> - `log/CS010.md`: created, with the phase's reasoning.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P2 — the director

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS010.md` §0, §1.1,
> §1.2, §1.4 (E1, E2 and the state-writing row), §2, §4 and §9. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §5, §11.4–11.6, §13, §14.4. Then
> `DIFFICULTY-NOTES.md`. Then `src/18-audio-director.js`, `src/19-sfx.js`,
> `audioFrame()` and `optionsFrom` in `src/23-main.js`, `heatT()` in
> `src/00-config.js`, and `scratchpad/test-cs009-p3.js`'s `audioFrame()` pins.
> ultrathink.
>
> ⛔ **Answered (§0).**
> - Counts and nearest use live, non-`anchored` entities, nearest 0 with none
>   (D15).
> - `heatT()`, and `INT_HEAT_MAX` is deleted (D7).
> - The combo term is 0, with no rescale (D6).
> - Play only, the Dive reading 0, a run starting from 0, title's sweep open,
>   pause holding (D8).
> - Duck on pause-side screens; dips on `purge`, `purgeWeak`, `death` and
>   `extraLife` (D9).
>
> **1. `src/18-audio-director.js` — kit-audio draft.** ⛔ No `C`, no `state`.
> `createDirector({ attack, release, weights })` returns
> `{ frame(inputs, now), reset(), level }`: a weighted sum of 0..1 inputs,
> clamped to [0, 1], smoothed per R1 on the clock it is handed. Document it in
> `src/16-audio-engine.NOTES.md` (one kit).
>
> **2. `src/23-main.js` — top-level `dangerInputs(state, out)`** (R7: top-level
> so a harness spy reaches it; ⛔ never in `19-sfx.js`, whose code may not name
> `state`, `test-cs009-p1.js:489`).
> - It writes `out` and nothing else: `count`, `proximity`, `peril`,
>   `heat = heatT(state.level)` and `combo = 0`.
> - ⛔ Never call `heat(` (`test-cs007-p2.js`, plan §1.4 E1).
> - ⛔ No allocation per frame.
>
> **3. `audioFrame()`.** ⛔ Keep the text `function audioFrame()`, setState
> before `MusicSys.update()`, no `state.x =`, and no "draw" in its body
> (`test-cs009-p3.js`).
> - **Play:** `Director.frame(...)` with the inputs, or with a zero reading
>   during a Dive, then `setIntensity` and `setSweep` with its level.
> - **The first play frame of a run** (entered from a non-run screen):
>   `Director.reset()`.
> - **Title screens:** `setSweep(1)`.
> - **Pause-side screens:** nothing, so the level is held.
> - **Every frame:** `MusicSys.setDuck(duckFor(state.screen, optionsFrom))`.
>
> **4. `src/19-sfx.js`.**
> - The `Director` instance from `C`.
> - `duckFor(screen, optionsFrom)`: pure, beside `musicStateFor`.
> - `sfx()` calls `MusicSys.dip()` when its name is in `C.MUSIC_DIP_EVENTS`
>   (R8). ⛔ No new seat; every seat line keeps `test-cs009-p5.js`'s form.
>
> **5. `C`.** `MUSIC_DIP_EVENTS`. ⛔ Delete `INT_HEAT_MAX`.
>
> **6. Harness `EXPORTS`:** `createDirector`, `Director`, `dangerInputs`,
> `duckFor`.
>
> **7. Your test, `scratchpad/test-cs010-p2.js`.**
> - Intensity ∈ [0, 1] on staged boards, the empty one included.
> - A step up reaches 63 % in `INT_ATTACK` and a step down in `INT_RELEASE`.
>   ⛔ **Mutation: symmetric smoothing is red.**
> - A Thorn moves neither term; a bolt counts.
> - ⛔ `dangerInputs` leaves a whole-`state` hash unchanged on every call.
> - A Dive reads 0; RESTART resets to 0; pause holds the level.
> - The duck is 0.5 on exactly D9's screens.
> - The four dips fire, and `lifeLost` does not.
> - `title` sets the sweep open.
> - The director slice has no `C.` and no `state`.
>
> **8. ⛔ No baseline moves.** Confirm 1229033515.
>
> **9. Docs.**
> - GDD §11.4 and §11.6: "Shipped, CS010 P2".
> - `SKIPPED-PLAYTESTS.md`: the duck and dips on hardware (knobs
>   `MUSIC_DUCK_GAIN`, `MUSIC_DUCK_RAMP`, `MUSIC_DIP_GAIN`, `MUSIC_DIP_HOLD`).
> - `STATUS.md` ledger line.
> - `log/CS010.md`, including R4 of plan §11 (title's tail through a closing
>   sweep) if you observe it.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P3 — the earned layers, Paul's gains, and music-lab

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS010.md` §0, §1.4 (C
> and G), §1.6–1.8, §5 and §9. Then `VECTOR-VORTEX-GDD.md` §0, §1, §11.3–11.5,
> §11.7, §11.8. Then `RATIONALE.md#music-layers`. Then `tools/music-lab.html`,
> `src/17-audio-tracks.js`, `scratchpad/test-cs009-p2.js` and
> `scratchpad/test-cs009-p5.js`. ultrathink.
>
> ⛔ **Answered (§0).**
> - `cycle` is tier 2 and `tick` tier 3; `title` is untiered (D1).
> - `pulse` goes back to Paul's lab gains exactly: `melody` 0.070, `swell` 0.049,
>   `cycle` 0.070, and `bassline`, `heart` and `tick` 0.450 (D3).
> - `title`'s ground is 0.45 (D4).
> - music-lab gains INTENSITY and TIER, and no envelope controls (D12).
> - Length ≥ 36 bars, confirmed (D13).
>
> **1. `tools/music-lab.html`.**
> - An **INTENSITY** slider calling BLOCK A's `setIntensity` and `setSweep`, with
>   a readout of the latched tier and the bars to the next line.
> - A **TIER** control per layer (—, 2, 3, 4), enabled only on a PASS layer.
> - ⛔ **COPY TABLE writes `tier`** beside `audition`, one line per layer, and
>   removes it for —. Tempo and layer edits are unchanged.
> - Header rewritten.
>
> **2. The port**, as COPY TABLE prints it, into `src/17-audio-tracks.js` and
> both labs' BLOCK B (⛔ three files).
> - `bar: 16` on both builders; D1's tiers; D3's gains; D4.
> - Delete the trim comment. Rewrite the header's "no layer carries a `tier`".
>
> **3. Closed files, in place.**
> - `test-cs009-p2.js`'s "no layer carries a tier (A6)" becomes: a tier only on a
>   PASS layer, in `1..4`, on a track with `bar`.
> - ⛔ **`test-cs009-p5.js`'s Surger-voice fixture**: its `surgeVoices()` finds a
>   gain node ramping to exactly 0.45, and D3's 0.450 notes match it (plan §1.4
>   G: nine assertions red). Repair it to find a voice by its route into
>   `AudioSys.sfx` and its recipe oscillators. The precondition is restored,
>   never relaxed.
> - The headroom gate should now read 0.3512 and 0.3408 (plan §1.7). ⛔ Stop if
>   it does not.
>
> **4. Your test, `scratchpad/test-cs010-p3.js`.**
> - ⛔ **The articulation gate**, on every layer of every `MUSIC_TRACKS` entry, at
>   the track's own `stepDur`:
>   - `atk` ≤ 0.005;
>   - decay starts ≤ 0.05 s, where decay start is
>     `max(min(atk, dur/2), dur − min(rel, dur))`, as `playNote` shapes it;
>   - the longest written note ≤ the builder's `const GATE` entry, read from the
>     file's text;
>   - `cutoffTo` < `cutoff` wherever both are set.
>   ⛔ **Mutation: an `atk` of 0.02 is red, and so is a sweep that opens.**
> - ⛔ **COPY TABLE's tempo rewrite**, run from the lab's own `rewriteBlockB`
>   (plan §1.8: two lines change, a second rewrite restores, a bare edit
>   throws), and its new `tier` rewrite, the same way.
> - Every tiered layer is PASS; `melody` is untiered; `title` has no tier.
>
> **5. The render, rebuilt in your temporary directory** (plan header):
> - `chrome-headless-shell` from `~/.cache/ms-playwright`, driven over its
>   debugging protocol, 48 kHz mono `OfflineAudioContext`.
> - `16-audio-engine.js` and `17-audio-tracks.js` evaluated verbatim, with the
>   context class shadowed to the offline one; `C.MUSIC_LIMIT` on the path.
> - One loop scheduled by `scheduleStep` from T0 = 1 s, measured over
>   [T0, T0 + loop]: sample peak, and the level gated in 400 ms blocks with those
>   more than 10 dB under the mean block power dropped.
> - Expect `pulse` peak 0.454 / −24.30 dB and `title` 0.413 / −25.37 dB (plan
>   §1.6). Record it in `log/CS010.md`. ⛔ Off by more than 0.5 dB: stop and
>   report.
>
> **6. ⛔ No baseline moves.** Confirm 1229033515.
>
> **7. Docs.**
> - GDD §11.3 and §11.5's shipped notes; §11.7's tables (tiers, gains, the new
>   render column).
> - `SKIPPED-PLAYTESTS.md`:
>   - the tiered `pulse` (knobs `LAYER_THRESHOLD`, `LAYER_CROSSFADE`, the tiers);
>   - the limiter on hardware (`C.MUSIC_LIMIT`), in Firefox and Safari too (plan
>     §11 R3);
>   - `title` at ground 0.45.
> - `STATUS.md` ledger line; remove the `title` ground carried task.
> - `log/CS010.md`.
>
> Tell Paul music-lab has changed and ask him to open it: INTENSITY, TIER, and
> the limiter. Name what to hand back: a COPY TABLE if he moves a tier or a gain.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P4 — the rim pulse

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS010.md` §0 (D10), §1.9,
> §6 and §9. Then `VECTOR-VORTEX-GDD.md` §0, §1, §10.2, §10.3, §11.6. Then
> `drawWell()` and `glowStroke()` in `src/13-render-well.js`, `draw()` and
> `audioFrame()` in `src/23-main.js`, `src/19-sfx.js`, and
> `scratchpad/test-cs008-p4.js`'s whole-file scans.
>
> ⛔ **Answered (D10).**
> - `heart`'s onsets drive it, through `onBeat` (P1) and the audio clock, never
>   an `AnalyserNode`.
> - Rim only, width and alpha, about 0.1 s, capped, no fill.
> - Play only; no audio means no pulse.
> - It writes no `state`.
>
> **1. Data.** `heart` gains `beat: true` in `17-audio-tracks.js` and both labs'
> BLOCK B (⛔ three files). Check that COPY TABLE passes the field through.
>
> **2. `src/19-sfx.js`.** `onBeat` fills a fixed ring of onset times. No
> allocation per frame.
>
> **3. `audioFrame()`** computes `rimGlow` in a `Game` closure variable (⛔ never
> on `state`; no "draw" in the body):
> - 1 when `AudioSys.now()` reaches an onset;
> - falling to 0 over `C.RIM_PULSE_TIME`;
> - 0 off play and with no context.
>
> **4. `draw()` → `drawWell(..., rimGlow)`**, an optional sixth argument (plan
> §1.9: closed calls pass five).
> - The rim's `glowStroke` width is × `1 + C.RIM_PULSE_W × glow`.
> - Its alpha is × `1 + C.RIM_PULSE_ALPHA × glow`, capped at 1.
> - ⛔ No fill, no `state.rng()`, and nothing else in the well changes.
>
> **5. `C`.** `RIM_PULSE_TIME` 0.10, `RIM_PULSE_W` 0.5, `RIM_PULSE_ALPHA` 0.5
> (⚠ provisional).
>
> **6. Your test, `scratchpad/test-cs010-p4.js`.**
> - The glow rises only once the clock reaches an onset. The lookahead schedules
>   0.2 s early, and ⛔ **mutation: a glow at scheduling time is red**.
> - It is 0 headless, off play and under pause.
> - A frame's `state` hash is unchanged by `draw()`.
> - Only the rim stroke's width and alpha move.
> - Width ≤ `C.LINE_W_RIM × (1 + C.RIM_PULSE_W)`.
>
> **7. ⛔ Traps.** `test-cs008-p4.js` scans the whole file: no
> `fillRect`/`strokeRect`, no second `.fillText(`, not even in a comment.
> `test-cs002-p3.js` bans `ctx.fill` in `14-render-entities.js`.
>
> **8. ⛔ No baseline moves.** Confirm 1229033515.
>
> **9. Docs.**
> - GDD §11.6: "Shipped, CS010 P4".
> - `SKIPPED-PLAYTESTS.md`: the rim pulse over a busy rim (knobs `RIM_PULSE_*`).
> - `STATUS.md` ledger line.
> - `log/CS010.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P5 — the eighth soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS010.md` §7–§12. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §11, §17, §19. Then
> `scratchpad/test-cs009-p6.js` (the driver and the hasher), `log/CS010.md` in
> full, and `ROADMAP.md`'s sequence and "What CS009 deliberately left".
>
> **1. `scratchpad/test-cs010-p5.js` — the eighth soak.** ⛔ Do not widen
> `test-cs009-p6.js`. Use its front-door driver shape (Start Depths 1 / 13 / 23,
> RESTART, QUIT TO TITLE), audio on.
> - ⛔ **Spy `dangerInputs`**: hash `state` before and after every call, and
>   every pair matches. Plan §1.4 measured that nothing else catches a director
>   that writes `state` in both sessions. **Mutation-check it.**
> - A second session with `dangerInputs` stubbed to a constant matches the
>   first's `state` hash on every frame.
> - Intensity ∈ [0, 1] on every frame.
> - ⛔ **Every gate automation lands on a bar line** of the live track.
> - `cycle` and `tick` each entered and left at least once.
> - No bare `.value` set on the gates, sweep, limiter, duck or dip after
>   construction.
> - The duck is 0.5 on exactly D9's frames. All four dip events dipped.
> - `rimGlow` is 0 on every non-play frame.
> - Nodes per step ≤ `C.MUSIC_STEP_NODE_MAX`.
> - ⛔ The replay traps: two live steps before the first press, and no press past
>   a game over.
>
> **2. The review.** Read `log/CS010.md`'s entries together, and reconcile what
> two phases said differently.
>
> **3. Docs.**
> - GDD §11.1–11.8 checked against the code; §5's line; §17 item 9's intensity
>   range and bar-line clauses.
> - GDD §19 Audio: what CS010 met. Name "filter sweep audible end to end" as not
>   met by Classic play (plan §1.1), and "by ear on hardware" as a skipped
>   playtest.
> - `CLAUDE.md`'s code map: `18-audio-director.js`.
> - `ROADMAP.md`: CS010's row as shipped, and a "What CS010 shipped / left"
>   paragraph (the combo input and the Overdrive re-measure are CS012's).
> - `STATUS.md`: reset for CS011; the ledger compressed into `log/CS010.md`.
> - `log/CS010.md`: the close entry. `C.GAME_VERSION` per the house pattern.
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
| 1 | Five phases | P1 overrunning: split the limiter and the model gate into P1b, with no renumber (plan §11 R8) |
| 2 | One kit-audio bump (0.3.0), in P1 | A later phase needing an engine edit: 0.3.1 for a fix, 0.4.0 for a feature, with its own three-file sync |
| 3 | No baseline moves anywhere in CS010 | Any move is a defect in an audio path, not a re-record |
| 4 | P4 is medium effort: one data mark, one closure value, one draw argument | The rim's readability needing more than the caps |
| 5 | The render stays a per-phase probe, not a lab | Paul asking for a level meter in music-lab |

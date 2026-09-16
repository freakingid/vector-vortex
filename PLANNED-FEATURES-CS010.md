# PLANNED-FEATURES-CS010 — the intensity director

**The live-danger signal, the filter sweep, two earned layers on `pulse` that
enter on the bar line, the menu duck and the event dips, a limiter on the music
with Paul's lab balance restored behind it, music-lab's intensity and tier
controls, and the rim pulse on the kick (GDD §11.4–11.6).**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run. A PREDICTED one says so.

**Baseline for every measurement: commit `d40f222`.** `node build.js` → 24
modules, 468.8 KB. `node scratchpad/run-all.js` → **49 files passed, zero skips,
exit 0** (44.0 s wall). Orbital Overhaul measurements are at
`ADD-Orbital-Overhaul` **`5abd37a`**.

**How the probes ran.** All of them lived in the session's temporary directory
and are gone.
- **The intensity probe** is `test-cs009-p6.js`'s front-door session (its
  `drive()`, its menu presses, Start Depths 1 / 13 / 23, two runs each), with
  the audio API absent, minus the hidden gap and the life-cap staging. It computes
  §11.4(a)'s raw value from `C.INT_*` on every half-frame and smooths it (§1.1).
- **The variants** were built in a detached worktree of `d40f222`. Each engine
  or track edit was copied into both labs' BLOCK A / BLOCK B by script, then the
  whole suite was run (§1.4).
- **The render** used headless Chromium 151 (`chrome-headless-shell`, driven
  over its debugging protocol). It rendered `src/16-audio-engine.js` and
  `src/17-audio-tracks.js` verbatim into a 48 kHz mono `OfflineAudioContext`:
  one loop scheduled from T0 = 1 s, measured over [T0, T0 + loop]. The level is
  **gated**: 400 ms blocks, dropping every block whose power is more than 10 dB
  under the mean block power. It reproduces `log/CS009.md`'s gated levels
  within 0.2 dB (`pulse` −33.40 against −33.5, `title` −29.73 against −29.6).
  It does NOT reproduce the log's sample peaks (0.377 against 0.346; 0.4545
  against 0.446). MEASURED: the sample peak moves with the rate (`pulse` 0.377
  at 48 kHz, 0.337 at 44.1 kHz). Peaks below are this render's, at 48 kHz.
- ⛔ **Nothing in this repository's `src/`, `scratchpad/` or `tools/` was
  touched** (`CLAUDE.md` rule 3a).

**Read for this plan, beyond the prompt's list:** GDD §5 (one line, 380: "music
drops to its foundation layer"), `scratchpad/test-cs009-p1.js`, `-p2.js`,
`-p3.js`, `-p4.js` (their audio assertions), `scratchpad/test-cs007-p2.js`
(its heat call-site scan), `scratchpad/_harness.js`,
`archive/IMPLEMENTATION-PHASES-CS009.md` (for shape). Nothing else from `log/`
or `archive/`.

---

## ⛔ 0. PAUL'S CALLS — ✅ ALL ANSWERED 2026-09-16, IN THIS SESSION

⛔ A build phase builds these and does not re-open them. P1 writes the
`DECISIONS.md` pointer. Each answer was put to Paul with the measurement beside
it (§1) and a recommendation, and **he took every recommendation.**

| # | The call | ✅ Answer |
|---|---|---|
| D1 | Which PASS layers become the earned layers | **`pulse`: `cycle` is tier 2 (the hook), `tick` is tier 3 (the groove).** `melody`, `swell`, `bassline` and `heart` are the always-on foundation. **No danger layer**: two earned layers, not three. **`title` stays untiered** |
| D2 | The limiter's strength | **Threshold −24 dB, knee 0, ratio 20, attack 1 ms, release 100 ms** (a `DynamicsCompressorNode`) |
| D3 | The gains and the lab once the limiter exists | **`pulse` goes back to exactly Paul's lab balance**: `melody` 0.070, `swell` 0.049, `cycle` 0.070, `bassline`, `heart` and `tick` 0.450. The 8.2 dB trim goes. **music-lab plays through the same limiter**, so what he hears is what ships |
| D4 | `title`'s ground | **0.45** |
| D5 | The tier thresholds | **0.25 (tier 2) and 0.40 (tier 3)** |
| D6 | `INT_W_COMBO` in Classic | **The combo term is 0 in Classic, and nothing is rescaled** (GDD §13: Classic has no combo, ever). CS012 re-measures Overdrive with its combo |
| D7 | The heat term | **`heatT(level)`**, the existing accessor, normalised at level 99. **`C.INT_HEAT_MAX` is deleted** |
| D8 | Where intensity acts | **In play only, the Dive included.** `title`: untiered, the sweep fully open. Pause and OPTIONS opened from pause: intensity and sweep held, the duck on. **In a Dive the danger reading is 0**, so the release drops the layers at bar lines and closes the sweep (GDD §5). **A new run starts from 0.** Game over is silent |
| D9 | The duck and the dips | **Duck to `C.MUSIC_DUCK_GAIN` on pause, and on OPTIONS and its pages opened from pause.** Not on title, mode, START DEPTH or title-side OPTIONS; not on game over. **−6 dB dips on `purge`, `purgeWeak`, `death` and `extraLife`** (not `lifeLost`): down over 0.15 s, held 0.5 s, back over 0.15 s. Every change is a ramp |
| D10 | The rim pulse | **CS010 owns it, as its own phase.** `heart` carries a data mark; the scheduler reports each onset's context time; the rim lights when the audio clock reaches it (never an `AnalyserNode`). It raises the rim's `glowStroke` width and alpha for ~0.1 s, capped, with no fill, in play only. No audio means no pulse. It writes no `state`. The caps are provisional |
| D11 | The layer ramp's name and length | **`C.LAYER_CROSSFADE` survives, at 0.03 s.** The GDD's `MUSIC_LAYER_CROSSFADE` is edited to it. A layer enters or leaves **on** the bar line with a 30 ms de-click ramp on its gate node, never on a note's envelope |
| D12 | What music-lab gains | **An INTENSITY slider** that drives the real bar-latched setter and the sweep through BLOCK A, with a bar-line readout; **a TIER control per PASS layer** that COPY TABLE writes; **the limiter in the lab's path.** No ATK / REL / GATE controls |
| D13 | `pulse`'s length target | **Confirmed: ≥ 36 bars in A→B→C sections** (Claude's reading in `DECISIONS.md`, now Paul's) |
| D14 | The sweep's mapping | **Exponential: `FILTER_MIN_HZ × (FILTER_MAX_HZ / FILTER_MIN_HZ)^i`** |
| D15 | What counts as an enemy for danger | **Live and not `anchored`**: Weaver bolts count, Thorns do not. Nearest is the deepest of those, and **0 with none** |
| D16 | What the headroom gate asserts once the limiter exists | **The curve model with the settings pinned.** The all-layers-on envelope sum goes through the limiter's static curve and makeup (Web Audio spec, knee 0) and must stay ≤ the tone's peak. The limiter settings equal the rendered ones. Every track reaches the bus only through the limiter. Gates, sweep, duck and dip never exceed unity, which covers every tier. The render is the cross-check, recorded in `log/` |

⚠ **One number moved after Paul answered D5.** The shares put to him (tier 2 at
47 %, tier 3 at 15 % of fire-held play) were measured with §11.4(a)'s
`heat / INT_HEAT_MAX`. With D7's `heatT()` and D15's count, the same session
measures **40.3 % and 11.3 %** (§1.1). The order of the options is unchanged.

### ⚠ Readings this plan takes and flags — none is a call Paul left open

Each follows from an answer, a definition, or a measurement. ⛔ **If Paul
objects to one, the phase that builds it stops.**

- **R1 — Smoothing is a one-pole exponential on the audio clock.** Each frame,
  `s += (raw − s) × (1 − e^(−dt/τ))`, with τ = `INT_ATTACK` when raw > s and
  `INT_RELEASE` otherwise, and dt the change in `AudioSys.now()`. That is §19's
  "rises ~0.4 s, falls ~2.5 s" read as time constants.
- **R2 — The sweep is a `BiquadFilterNode` low-pass with Q = −3.0103 dB**
  (Butterworth), not the "one-pole" §11.5 names. MEASURED in Chromium 151: an
  `IIRFilterNode` exposes no automatable parameter (its prototype has
  `getFrequencyResponse` and nothing else), so a one-pole cannot sweep. A
  low-pass Q is in dB, and −3.0103 dB puts no peak at the cutoff, so the filter
  never raises a partial (§1.7). The close edits §11.5.
- **R3 — The sweep follows intensity continuously; only tiers latch.** The sweep
  adds no notes (§11.5), so it moves each frame with `setTargetAtTime` and a
  time constant, **`C.FILTER_TC` 0.05 s (⚠ PREDICTED, provisional)**, so it
  never steps.
- **R4 — A track's bar is DATA: `bar: 16`** (steps per bar) on both tables. The
  loader requires it on any track with a tiered layer.
- **R5 — The new engine options are OPTIONAL GROUPS** (`gating`, `sweep`,
  `limiter`, `duck`, `onBeat`). A group that is present requires every number
  in it. A group that is absent leaves CS009's behaviour: no node, unity. MEASURED
  (§1.4): a new *required* top-level option makes `test-cs009-p1.js` throw
  before its first assertion. kit-audio is therefore **0.3.0, MINOR**.
- **R6 — The latch lives in the setter.** `setIntensity(f)` schedules each
  flipped gate's ramp at the next bar line on the scheduler's own grid.
  `update()`, `scheduleStep()` and `playNote()` are not touched, so
  `test-cs009-p1.js:411`'s scan of them stays green (MEASURED, variant A).
- **R7 — The danger read is a top-level function in `23-main.js`,
  `dangerInputs(state, out)`.** It cannot live in `19-sfx.js`: MEASURED,
  `test-cs009-p1.js:489` bans the word `state` in that module's code. It is top-level so the
  eighth soak can spy it (`_harness.js`: a function inside `Game`'s closure
  cannot be spied). The smoothing and the weighted mix are kit-shaped in
  `18-audio-director.js`, which `CLAUDE.md` lists as kit-audio.
- **R8 — The dips ride on `sfx()`.** `C.MUSIC_DIP_EVENTS` lists D9's four
  events. `sfx(name)` calls `MusicSys.dip()` when the name is listed, so there is
  no new seat, and `test-cs009-p5.js`'s seat scan is unaffected (PREDICTED).
- **R9 — The dip is its own gain node after the duck**, so a dip inside a duck
  multiplies, and neither ramp cancels the other.
- **R10 — Tier 4's threshold key stays 0.80.** No layer carries tier 4 (D1), so
  nothing reads it, and D5 set only tiers 2 and 3.
- **R11 — The director runs on every play frame, frozen or not.** The music
  plays through a death freeze, and `peril` enters when the life is lost.

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the intensity signal on played boards.

863 s of play (103,556 half-frames, 14.4 min), levels 1–7, 13–19 and 23–29, six
runs. ⚠ **The scripted player holds fire for 9,000 steps (~150 s) and then
releases it**, so every run is a long fire-held phase and a short dying one.
It clears the board fast. **A human board probably runs hotter (PREDICTED, not
measured).**

**The final reading (D5, D6, D7, D14, D15, R1; the Dive reads 0 per D8):**

| Smoothed intensity | p10 | p50 | p90 | p99 | max | ≥ 0.25 (`cycle`) | ≥ 0.40 (`tick`) |
|---|---|---|---|---|---|---|---|
| Fire held (791 s) | 0.079 | 0.217 | 0.410 | 0.490 | 0.517 | **40.3 %** | **11.3 %** |
| Dying (72 s) | 0.323 | 0.416 | 0.602 | 0.656 | 0.668 | 95.9 % | 56.1 % |
| In a Dive (92 s) | 0.072 | 0.176 | 0.307 | 0.396 | 0.514 | 23.6 % | 0.9 % |

**First crossings, from the run's first play frame:**

| Run | tier 2 (0.25) | tier 3 (0.40) |
|---|---|---|
| Start Depth 1, run a / b | 11.7 s L1 / 11.7 s L1 | 160.5 s L7, dying / 99.9 s L5 |
| Start Depth 13, run a / b | 8.8 s L13 / 4.5 s L13 | 32.5 s L14 / 7.1 s L13 |
| Start Depth 23, run a / b | 4.2 s L23 / 4.6 s L23 | 13.8 s L23 / 24.7 s L23 |

**⛔ The shipped thresholds repeat Orbital Overhaul's failure, and CS010 does
not ship them.** With `C.LAYER_THRESHOLD` `{2: 0.30, 3: 0.55, 4: 0.80}` and
§11.4(a) as written: tier 3 was above threshold **0.0 %** of fire-held play and
first crossed 2–5 s before the end of 5 of the 6 runs, while dying; **tier 4 never crossed in any
run** (max 0.693). Orbital Overhaul's tier 4 first crossed at wave 11. Here a
tier-3 or tier-4 layer would not be heard in ordinary play at all. The melody is
in the foundation, so "no tune" does not repeat. What would repeat is "a layer
nobody hears". D5 answers it.

**Candidate thresholds, share of fire-held / dying time** (§11.4(a)'s
`heat / INT_HEAT_MAX` reading, before D7):

| Tiers 2 / 3 / 4 | Fire held | Dying |
|---|---|---|
| 0.30 / 0.55 / 0.80 (shipped) | 32.8 / 0.0 / 0.0 % | 94.3 / 20.1 / 0.0 % |
| ✅ 0.25 / 0.40 / 0.55 | 46.8 / 14.6 / 0.0 % | 97.2 / 67.5 / 20.1 % |
| 0.20 / 0.35 / 0.50 | 61.3 / 24.3 / 1.4 % | 100 / 86.3 / 30.6 % |
| 0.25 / 0.45 / 0.60 | 46.8 / 5.8 / 0.0 % | 97.2 / 46.3 / 12.0 % |

**What latching costs.** At 120 BPM a bar is 2 s.
- **The wait for the bar line:** mean 0.93 s, p90 1.59 s, max 1.98 s, over 137
  latched changes. That is **9.5 latched tier changes a minute**, against 13.3
  unlatched, so the latch also absorbs flutter.
- **The attack lag** from the raw value crossing a threshold to the smoothed one
  crossing it: p50 0.36 s, p90 0.45 s, max 0.63 s (on the pre-D7 reading).
- **PREDICTED from those parts:** danger to a layer at full level is about
  0.36 + 0.93 + 0.03 ≈ **1.3 s median** and 0.63 + 1.98 + 0.03 ≈ **2.6 s
  worst**. With `LAYER_CROSSFADE` at its old 1.20 s, the worst case would be
  about 3.8 s.

**The sweep (D14)** sits at p10 794 Hz, p50 1,323 Hz, p90 2,547 Hz, max 5,819 Hz
over play. ⚠ **In Classic it never fully opens**: the weights without combo sum
to 0.85, and the played maximum is 0.668. So §19's "filter sweep audible end to
end" is not met by Classic play (§9).

### 1.2 MEASURED — the inputs' real ranges.

| Input | Range |
|---|---|
| `heat(L) / INT_HEAT_MAX` (2.0) | L1 0, L13 0.552, L23 0.707, L29 0.775, **first ≥ 1.0 at level 52** (heat(51) 1.9998, heat(52) 2.0198); L99 1.48 |
| ✅ `heatT(L)` (D7) | normalised at `heat(99)` 2.960, so it saturates at 99: L29 0.524 |
| Live non-anchored entities | p50 1, p90 3, **max 7** against `INT_EXPECTED_ENEMIES` 10. All live entities: max 9. Threats (`blocksClear`): max 6. `enemyConcurrent()` is 3 at L1 and 5 at L23–29 |
| Nearest depth, non-anchored | p50 0.328, p90 0.950, max 1.000 |
| ⛔ Nearest with **no** enemy | `Math.max(...[])` reads **−Infinity**, which `clamp01` maps to 0. ⚠ A reading of `undefined.depth` or `NaN` would pass NaN through `Math.max(0, Math.min(1, NaN))` (MEASURED: NaN), and §17 item 9's `[0, 1]` would fail. D15 reads 0 with none |
| ⛔ Thorns in "nearest" | Counting `anchored` entities changed the nearest reading on **16,143 of 103,556 frames (15.6 %)**: a Thorn's depth is a length (`CLAUDE.md`), not a position |
| `peril` (lives ≤ 1) | 8.2 % of play frames |
| **The weights** | 0.30 + 0.30 + 0.15 + 0.15 + 0.10 = **1.00; 0.85 without combo; 0.70 without combo or peril** |
| `INT_W_COMBO` | no source before CS012, and ⛔ **none ever in Classic** (GDD §13) |

### 1.3 MEASURED — bar-line latching is observable on the recording fake.

The probe ported OO's `setIntensity` into a worktree copy of `createMusic` and
scheduled each flipped gate at the next bar line (R6). A three-layer synthetic
table (tiers 1, 2, 4; `bar` 16; `stepDur` 0.125) was driven through 40 s of
60 Hz `update()`s, with a `setIntensity()` every 97 frames:
- **30 gate changes recorded, every one exactly on the 2 s grid** (1e-9) and
  none in the past; the longest wait was 1.983 s.
- ⛔ **Mutation:** with the setter scheduling at `currentTime`, **30 of 30 were
  off the grid.**

The fake logs each automation call's `t`, so a test reads the latch directly.
⚠ The fake's `param.value` is the last value written or targeted, not the value
at `currentTime` (`_harness.js`'s own warning). A setter that pins the current
value with `setValueAtTime(param.value, t)` therefore reads a future target on
the fake. Test the logged `t` and `v`, never `.value`.

OO's `setIntensity` (`5abd37a` lines 2440–2460) does **not** latch. It ramps at
`currentTime`, and it is called once per wave. **The latch is a new
departure**, not a port.

### 1.4 MEASURED — what each change turns red.

Cumulative variants in a worktree of `d40f222`, labs synced, whole suite:

| Change | Red |
|---|---|
| **A.** OO's `setIntensity` and `setDuck` ported with the latch; the loader's "not supported" throw deleted and the `1..4` throw kept (48 engine lines added or changed, build +1.8 KB) | **`test-cs009-p1.js` 5/165**: "the loader refuses tier 1/2/3/4 in CS009 (A6)" ×4, "the intensity setter and menu ducking are not ported (CS010)" |
| **A + a required `createMusic` option** (the glue passing it) | `test-cs009-p1.js` **throws before its first assertion** (its `musicOpts` fixture omits it) → R5 |
| **C.** `pulse`'s `tick` given `tier: 2` | + **`test-cs009-p2.js` 1/64**: "pulse: no layer carries a tier (A6)". The headroom gate and the soak stay green |
| **D1.** A sweep and a limiter on the music path, **fake not updated** | **5 files**: `test-cs009-p1.js`, `-p2.js`, `-p3.js` and `-p5.js` throw at `createDynamicsCompressor`; `-p6.js` 14/65 |
| **D2.** The same, **fake given `createDynamicsCompressor`** | + `test-cs009-p1.js` 1: "the track gain feeds the duck". ⚠ **`test-cs009-p5.js` stays GREEN while no longer measuring what reaches the bus** (§1.6) |
| **E1.** A director in `audioFrame()` calling `heat(state.level)` | + **`test-cs007-p2.js` 1/188**: "heat() is named NOWHERE ELSE … (got 2, want 1)" → D7 |
| **E2.** The same with `heatT(state.level)`, plus `setDuck` in `audioFrame()` | **nothing more.** `test-cs009-p3.js`'s pins hold: the text `function audioFrame()`, `setState(musicStateFor(` before `MusicSys.update()`, no `state.x =`, no `draw` |
| ⛔ **E2 + the director WRITING `state.dangerSeen` on every play frame** | **nothing more, in any file.** `test-cs009-p6.js`, `test-cs009-p3.js` and `test-cs006-p2.js` are all green: the write happens in both of p6's sessions, and it sits outside `audioFrame()`'s body → R7, P5 |
| `AUDIO_VERSION` "0.3.0" | + `test-cs009-p1.js:100` 1, **`test-cs009-p4.js:98` 1/168** |
| **G.** `pulse` at Paul's lab gains (0.450) and `title`'s ground at 0.450 | + **`test-cs009-p5.js` 11/214**: the two headroom assertions (1.0771, 0.5904), and ⛔ **nine Surger-tone fixture assertions**. The fixture finds a voice as a gain node ramping to exactly `R.gain` (0.45), and music notes at 0.450 × g 1 match. At 0.449, only the two headroom assertions are red |
| Every variant with the fake updated | `test-cs009-p6.js` green: the frame-by-frame hash, 65 assertions |

**Worst nodes per scheduled step** with the sweep and limiter on the path
(`P6_MEASURE=1`): **14 over 6,901 steps, unchanged.** Both nodes are built once
per graph, never per step.

### 1.5 MEASURED — what porting the setter and the duck costs.

- OO's `setDuck` is 14 lines and its `setIntensity` 21 (`5abd37a`
  2425–2460). Variant A added or changed **48 lines** in `16-audio-engine.js`. It is a
  **three-file edit**: the variant's sync script copied it into both labs'
  BLOCK A, and `test-cs009-p2.js` and `-p4.js` stayed green.
- **kit-audio 0.2.0 → 0.3.0.** Two closed assertions pin the string (§1.4).
- `createMusic` has **four call sites** (grep): `19-sfx.js`, `tools/music-lab.html:962`,
  `tools/sfx-lab.html:1124`, and `test-cs009-p1.js` (six calls through `musicOpts`).

### 1.6 MEASURED — the limiter.

**Chromium 151's `DynamicsCompressorNode`:** defaults −24 / 30 / 12 / 0.003 /
0.25 (threshold, knee, ratio, attack, release), `reduction` 0. The fake in D2
used the same defaults. ⚠ **It applies automatic makeup gain** (Web Audio spec:
`(1 / curve(1.0))^0.6`), so a limited mix comes out louder.

**Where it sits.** ⛔ **After the sweep, before the duck.** Rendered at
threshold −18 dB:

| A 0.5 gain (the duck) placed… | Gated level | Peak |
|---|---|---|
| no duck | −22.87 dB | 0.608 |
| **before** the limiter | −24.74 dB (**−1.9 dB**) | 0.552 |
| **after** the limiter | −28.89 dB (**−6.0 dB**) | 0.304 |

A duck or a dip in front of a limiter is mostly swallowed. The MUSIC VOLUME bus
is after the limiter too, so the slider stays linear. Path: **note → gate →
track gain → sweep → limiter → duck → dip → `music` bus → `master`.**

**Renders.** All at Paul's lab balance except where "shipped". Knee 0, ratio 20,
attack 2 ms and release 100 ms unless named.

| Mix | Peak | Gated |
|---|---|---|
| `pulse` shipped (trimmed), no limiter | 0.377 | −33.40 dB |
| `pulse` at Paul's balance, no limiter | 0.954 | −25.74 dB |
| −6 dB | 0.871 | −22.78 |
| −10 dB | 0.789 | −21.91 |
| −14 dB | 0.691 | −22.26 |
| −18 dB | 0.608 | −22.87 |
| −24 dB | 0.500 | −24.04 |
| −18 dB, attack 1 ms / 5 ms | 0.544 / 0.769 | −23.10 / −22.29 |
| −18 dB, release 250 ms / 50 ms | 0.592 / 0.634 | −23.76 / −21.93 |
| −18 dB, knee 6 | 0.648 | −22.58 |
| ✅ **−24 dB, attack 1 ms (D2)** | **0.454** | **−24.30 (+9.1 dB over shipped)** |
| ✅ D2, sweep closed at 600 Hz | 0.401 | −23.91 |
| `title` shipped, no limiter | 0.4545 | −29.73 |
| `title` shipped, D2 | 0.403 | −25.64 |
| ✅ `title`, ground 0.45, D2 (D4) | **0.413** | **−25.37** |
| `title`, ground 0.45, no limiter | 0.585 | −27.78 |

**The Surger tone** (`C.SFX.surgeCharge` played once, measured over its hold):
**sample peak 1.106, RMS −6.58 dB.** Against D2's `pulse`: **+7.7 dB peak, and
17.7 dB over the music's gated level.** Against today's trimmed `pulse`: +9.3 dB
and 26.8 dB.

⚠ **The tone alone renders past full scale (1.106).** A real destination clips
there. That is a CS009 fact, not a CS010 change, and no changeset owns it (§11 R5).

**The fake** needs `createDynamicsCompressor()` returning a node with
`threshold`, `knee`, `ratio`, `attack` and `release` params and a `reduction`
field. Without it, five files are red (§1.4 D1). It makes no sound, so it
**cannot measure level after the limiter**. Hence D16's model.

### 1.7 MEASURED — headroom under the tiers and the sweep, and what the gate becomes.

**Tiers only remove layers.** The gate's own arithmetic (note-envelope peaks
overlapping in time), on the built tables:

| `pulse` layers sounding | Shipped gains | Paul's lab gains |
|---|---|---|
| all six | 0.4184 | **1.0771** |
| D1's foundation (`melody`, `swell`, `bassline`, `heart`) | 0.3941 | 1.0141 |
| foundation + `cycle` | 0.4184 | 1.0771 |
| `melody` + `swell` + `bassline` + `cycle` | 0.2434 | 0.6271 |

Each alone at Paul's gains: `melody` 0.070, `swell` 0.0441, `bassline` 0.450,
`cycle` 0.063, `heart` 0.450, `tick` 0.2475. `title`: 0.4404 shipped, **0.5904
with the ground at 0.45**. At a 1e-9 tie tolerance, the all-on sums of both
tracks (shipped, and `pulse` at Paul's gains) are unchanged at 120 BPM.

So **the all-layers-on sum bounds every tier**, as long as nothing downstream
exceeds unity: a gate targets only 0 or 1, the sweep has no resonant peak (R2),
and the duck and dip are ≤ 1.

**The sweep's own level**, rendered on shipped `pulse` at 600 Hz: Q −3.0103 dB
gives peak 0.328 and −33.70 dB; Chromium's default Q (1 dB) gives **0.367 and
−33.27 dB**, louder than the open mix's −33.40. Closed all the way, the sweep
costs `pulse` 0.3 dB, so it changes timbre, not loudness.

**⛔ What the gate asserts from P1 on (D16).**
1. The loudest all-on envelope sum at master before the limiter (today's
   arithmetic) is `x`.
2. `limitOut(x)` = the spec's hard-knee curve, `T + (x_dB − T) / R` above the
   threshold, plus makeup `−0.6 × (T − T/R)` dB. With knee 0 the curve is exact.
3. ⛔ `limitOut(x) × duck (1) × dip (1) × vol.music × vol.master ≤ tone peak at
   master / HEADROOM_RATIO`.

MEASURED arithmetic at D2's settings:

| | Envelope in | `limitOut` | Margin under 0.45 | Rendered peak |
|---|---|---|---|---|
| `pulse`, Paul's gains | 1.0771 | **0.3512** | 2.15 dB | 0.454 (+2.23 dB over the model) |
| `title`, ground 0.45 | 0.5904 | **0.3408** | 2.41 dB | 0.413 (+1.68 dB) |
| `pulse` shipped (P1 and P2, before D3) | 0.4184 | 0.3350 | | |
| `title` shipped | 0.4404 | 0.3359 | | |

At −18 dB the model would read 0.4567 for `pulse`: red. ⚠ **The model is not a
bound on the rendered transient** (+1.7 to +2.2 dB at 1 ms attack), which is why
D16 pins the settings to the rendered ones and records the render in `log/`.

### 1.8 MEASURED — articulation and COPY TABLE's tempo rewrite, today.

**Every layer of both tracks passes the struck rule**, computed off the built
`MUSIC_TRACKS` as `playNote()` shapes a note (decay starts at
`max(min(atk, dur/2), dur − min(rel, dur))`):

| Layer | `atk` | Decay starts by | Longest written note / `GATE` | Sweep |
|---|---|---|---|---|
| `title` theme, bells, ground | 0.004 | 0.004 s | 3/3, 1/1, 2/2 | — |
| `title` glow | 0.004 | 0.004 s | 2/2 | 1600 → 900, closes |
| `pulse` melody, bassline | 0.004 | 0.004 s | 3/3, 2/2 | — |
| `pulse` swell | 0.004 | 0.004 s | 2/2 | 1400 → 700, closes |
| `pulse` cycle | 0.005 | 0.005 s | 1/1 | 1800 → 500, closes |
| `pulse` heart | 0.003 | 0.003 s | 1/1 | `drop` 12 (a falling pitch) |
| `pulse` tick | 0.001 | 0.001 s | 1/1 | — |

`GATE` is read from each builder's `const GATE = {…}` text. Decay start depends
on `stepDur`, so a test computes it at the track's own tempo.

**COPY TABLE's tempo rewrite**, run in Node from the lab's own
`rewriteBlockB`: `{ builder: "buildPulseTrack", stepDur: "60 / 132 / 4" }` and
`{ builder: "buildTitleTrack", stepDur: "60 / 96 / 4" }` changed **exactly two
lines**. A second rewrite restored 120. An edit with no name and no tempo threw.
The evaluated `pulse.stepDur` was 0.11363636363636363. ⛔
**`test-cs009-p2.js` contains no tempo edit** (0 `stepDur: "` matches).

**`test-cs009-p5.js`'s exact-float sort** (STATUS) is a hazard only for a tempo
whose `stepDur` is not a binary fraction. CS010 moves no tempo (D13), and a note
ends at `t + dur × stepDur`, which D3's gains and D1's tiers do not change.
**PREDICTED: no repair needed.**

### 1.9 MEASURED — the surfaces CS010 touches.

- **`drawWell(ctx, well, level, laneState, rng)`** has five parameters, and
  every closed call passes five (`test-cs001-p3.js:56–58`,
  `test-cs006-p4.js:275–276`). The rim is `glowStroke(ctx, color, C.LINE_W_RIM,
  baseAlpha)` at `13-render-well.js:159`. An optional sixth argument is additive
  (PREDICTED green).
- **`GDD §11.5` names `MUSIC_LAYER_CROSSFADE`; `C` has `LAYER_CROSSFADE` 1.20**,
  and nothing reads either (grep).
- **`test-registry.js` `tracks` is 2**; CS010 adds no track.

---

## 2. THE SHAPE

| Module | Side | Owns in CS010 |
|---|---|---|
| `16-audio-engine.js` | ⛔ **kit-audio 0.3.0** — no `C`, no `state`, no game global | `createMusic` gains the optional groups (R5): **`gating`** `{ thresholds, ramp }` → tier gates and `setIntensity(f)`, latched to the bar line (R6); **`sweep`** `{ minHz, maxHz, q, tc }` → `setSweep(f)`; **`limiter`** `{ threshold, knee, ratio, attack, release }`; **`duck`** `{ gain, ramp, dipGain, dipHold }` → `setDuck(on)` and `dip()`; **`onBeat(t)`**, called for each note of a layer marked `beat`. The loader accepts a `tier` in `1..4`, requires `gating` and the track's `bar` for one, and still throws outside `1..4` |
| `17-audio-tracks.js` | game DATA (BLOCK B) | `bar: 16` on both tables; `cycle` tier 2 and `tick` tier 3; Paul's `pulse` gains; `title` ground 0.45; `heart` `beat: true` (P4) |
| `18-audio-director.js` | ⛔ **kit-audio draft** — no `C`, no `state` | `createDirector({ attack, release, weights })` → `{ frame(inputs, now), reset(), level }`: a weighted mix of 0..1 inputs, smoothed asymmetrically on the clock it is handed (R1). It names no game term |
| `19-sfx.js` | game glue (⛔ no `state` in its code, `test-cs009-p1.js:489`) | the groups from `C` into `createMusic`; the `Director` instance; `duckFor(screen, optionsFrom)` (pure, beside `musicStateFor`); `sfx()` calling `MusicSys.dip()` for `C.MUSIC_DIP_EVENTS` (R8); the beat ring (P4) |
| `23-main.js` | game | top-level `dangerInputs(state, out)` (R7, D6, D7, D15); `audioFrame()` gains the director, `setIntensity`, `setSweep` and `setDuck` lines and the rim glow (P4); `draw()` hands the glow to `drawWell` |
| `13-render-well.js` | game render | `drawWell`'s optional sixth argument, the rim glow (P4) |

PREDICTED names; a phase may rename inside this shape, not across the kit line.

- ⛔ **`scheduleStep` still never reads intensity.** Gating is the gate node
  (`test-cs009-p1.js` M2, M3). ⛔ **The retreat stays data-only**: delete the
  `tier` fields and every gate builds open.
- ⛔ **The director reads `state`, writes none of it, and draws nothing.** Its
  one `state` reader is `dangerInputs`, and the eighth soak spies it (P5).
- ⛔ **Every duck, dip, gate and sweep change is automation, never a bare
  `.value` set after construction.**

---

## 3. P1 — KIT-AUDIO 0.3.0: THE GATES, THE SWEEP, THE LIMITER, THE DUCK

- **`16-audio-engine.js`** — §2's groups, ported from OO `5abd37a` where OO has
  them (`setDuck`; `setIntensity`'s gate loop), with **departures 5–7, each
  tested**:
  5. **the bar-line latch** in the setter (R6; §1.3);
  6. **the sweep and the limiter**, built once in `ensureGraph()` on the path
     §1.6 fixes, with the sweep fully open until `setSweep()` is called;
  7. **the dip node and `onBeat`**.
  - A gate ramp runs over `gating.ramp` from the bar line. The initial gate
    level on `setState()` is the current intensity's target, set before
    anything plays (OO's own idiom).
  - Header, "not ported" line and loader comment rewritten. `AUDIO_VERSION`
    "0.3.0". `.NOTES.md` entry: MINOR, game-agnostic, backport `not yet`.
- **Both labs' BLOCK A**, whole (three-file edit). **Both labs' `createMusic`
  calls pass the limiter** from their `LAB` preview copy (D3), so the lab is
  limited from P1.
- **`19-sfx.js`** passes `gating`, `sweep`, `limiter` and `duck` from `C`. No
  director yet: in P1 the sweep stays open, no gate is tiered, and the duck and
  dip sit at unity.
- **`C`, Audio group:**
  - `LAYER_THRESHOLD` `{ 2: 0.25, 3: 0.40, 4: 0.80 }` (D5, R10)
  - `LAYER_CROSSFADE` **0.03** (D11)
  - `FILTER_Q` −3.0103 (R2)
  - `FILTER_TC` 0.05 (R3, ⚠ provisional)
  - `MUSIC_LIMIT` `{ threshold: -24, knee: 0, ratio: 20, attack: 0.001, release: 0.10 }` (D2)
  - `MUSIC_DIP_GAIN` 0.50 and `MUSIC_DIP_HOLD` 0.50; the dip ramps reuse `MUSIC_DUCK_RAMP` (D9)
- **`_harness.js`:** the fake gains `createDynamicsCompressor()` (§1.6), before
  the engine uses it.
- **Closed-file rewrites, in place** (MEASURED, §1.4):
  - `test-cs009-p1.js`, 7 assertions:
    - the four "refuses tier N in CS009 (A6)" become "accepts tier N (with
      `gating` and `bar`)";
    - "not ported (CS010)" becomes "ported";
    - "the track gain feeds the duck" becomes the §1.6 route;
    - `AUDIO_VERSION` becomes 0.3.0.
  - `test-cs009-p4.js:98`, the version.
  - ⛔ **`test-cs009-p5.js`'s two headroom assertions become D16's model** (§1.7),
    because the limiter is on the path from this commit.
- **`scratchpad/test-cs010-p1.js`**, on synthetic tables and the fake:
  - every latched change lands on the grid, and **mutation: a setter at `currentTime` is red** (§1.3);
  - a gate targets only 0 or 1 and ramps over `C.LAYER_CROSSFADE`;
  - `setSweep` follows the D14 mapping with `setTargetAtTime`;
  - the limiter's params equal `C.MUSIC_LIMIT`, and the route is §1.6's (a graph walk: no track gain reaches `music` except through the limiter);
  - duck and dip ramp, never a bare set, and never exceed 1;
  - `onBeat` fires once per marked note at its start time;
  - an absent group builds no node (R5);
  - a tier without `gating` or `bar` throws;
  - `update`, `scheduleStep` and `playNote` are untouched by the scan;
  - the kit slice has no `C.` or `state`.
- ⛔ **Traps:**
  - never write the vocabulary scan's banned word, not even in a comment on this node's API name;
  - never `.key` after an identifier ending in `e`;
  - the fake's `.value` trap (§1.3).

## 4. P2 — THE DIRECTOR

- **`18-audio-director.js`** — `createDirector` (§2). ⛔ No `C`, no `state`: a
  slice scan in the phase's test.
- **`23-main.js`** — top-level **`dangerInputs(state, out)`**, which writes only
  `out`:
  - `count` = live non-`anchored` entities / `INT_EXPECTED_ENEMIES`, clamped;
  - `proximity` = their deepest `depth`, 0 with none;
  - `peril` = lives ≤ 1;
  - `heat` = `heatT(state.level)`;
  - `combo` = 0, because Classic has no combo and CS012 supplies one (D6, D7, D15).
- **`audioFrame()`** (⛔ keep the text `function audioFrame()`, the setState-then-update order, no `state.x =`, no "draw"). Adds:
  - on play: `Director.frame(dangerInputs(...), AudioSys.now())`, with a Dive reading 0 (D8), then `setIntensity(level)` and `setSweep(level)`;
  - on the first play frame of a run: `Director.reset()`;
  - on `title` screens: `setSweep(1)`;
  - on pause-side screens: nothing is set, so both are held;
  - every frame: `MusicSys.setDuck(duckFor(state.screen, optionsFrom))`.
- **`19-sfx.js`** — `duckFor`, the `Director` instance, and `sfx()`'s dip (R8).
- **`C`:**
  - `MUSIC_DIP_EVENTS` `["purge", "purgeWeak", "death", "extraLife"]`;
  - ⛔ **delete `INT_HEAT_MAX`** (D7);
  - `INT_COMBO_MAX` stays for CS012.
- **`scratchpad/test-cs010-p2.js`:**
  - intensity ∈ [0, 1] on staged boards, including an empty one;
  - the attack and release step responses match R1 (and ⛔ **mutation: symmetric smoothing is red**);
  - a Thorn changes neither term;
  - `dangerInputs` changes no `state` (a hash before and after every call);
  - the Dive reads 0;
  - a RESTART starts from 0;
  - pause holds the level;
  - the duck is 0.5 on exactly D9's screens;
  - the four dips fire and `lifeLost` does not;
  - `test-cs007-p2.js` green is the heat proof.
- ⛔ No layer is tiered yet (P3), so no played gate moves in P2. The engine's
  latch is P1's proof, and the played one is P5's.
- `SKIPPED-PLAYTESTS.md`: the duck and dips on hardware (knobs
  `MUSIC_DUCK_GAIN`, `MUSIC_DIP_GAIN`, `MUSIC_DIP_HOLD`, `MUSIC_DUCK_RAMP`).

## 5. P3 — THE EARNED LAYERS, PAUL'S GAINS, AND MUSIC-LAB

- **`tools/music-lab.html`** (D12):
  - an **INTENSITY** slider driving `setIntensity` and `setSweep` through BLOCK A, with a readout of the latched tier and the bars until the next line;
  - a **TIER** control per layer (—, 2, 3, 4), enabled only on a PASS layer;
  - ⛔ **COPY TABLE writes `tier`** beside `audition`, by the same one-line rule. A tempo edit and a layer edit are unchanged.
  - The lab's header is rewritten to match.
- **The port**, as COPY TABLE's output would print it, into `17-audio-tracks.js`
  and both labs' BLOCK B:
  - `bar: 16` on both builders;
  - `cycle` `tier: 2`, `tick` `tier: 3` (D1);
  - `pulse` at D3's gains, with the trim comment removed;
  - `title` ground 0.45 (D4).
  - The file header's "no layer carries a tier" is rewritten.
- **Closed-file edits, in place:**
  - `test-cs009-p2.js` "no layer carries a tier (A6)" becomes "a tier only on a PASS layer, in `1..4`, with the track's `bar`" (MEASURED as the one assertion, §1.4 C).
  - ⛔ **`test-cs009-p5.js`'s Surger-voice fixture is REPAIRED** to find a voice by its route into `AudioSys.sfx` and its recipe oscillators, never by a gain equal to 0.45 (§1.4 G: nine assertions red at 0.450).
  - p5's headroom gate reads 0.3512 / 0.3408 (PREDICTED from §1.7, which the phase re-measures).
- **`scratchpad/test-cs010-p3.js`:**
  - ⛔ **the articulation gate** on every layer of every `MUSIC_TRACKS` entry, at the track's own `stepDur`: `atk` ≤ 0.005; decay starts ≤ 0.05 s; the longest note ≤ the builder's `GATE`; `cutoffTo` < `cutoff` wherever both are set. **Mutation: an `atk` of 0.02, or a sweep that opens, is red.**
  - ⛔ **COPY TABLE's tempo rewrite**, and its new `tier` rewrite, run from the lab's own `rewriteBlockB` (§1.8).
  - Every tiered layer is PASS, and `melody` is untiered.
- **The render, re-run and recorded in `log/CS010.md`**: D2's `pulse` and `title`
  peak and gated level, and the model's margin. ⛔ If the render and §1.6
  disagree by more than 0.5 dB, stop and report it.
- `SKIPPED-PLAYTESTS.md`:
  - the tiered `pulse` (thresholds D5, `LAYER_CROSSFADE`);
  - the limiter's sound on hardware (`C.MUSIC_LIMIT`);
  - `title` at ground 0.45.

## 6. P4 — THE RIM PULSE

- **`17-audio-tracks.js`** and both labs' BLOCK B: `heart` gains `beat: true`
  (a three-file edit; COPY TABLE passes an unknown field through, PREDICTED, and
  the test checks it).
- **`19-sfx.js`** — `onBeat` fills a small ring of upcoming onset times, with no
  allocation per frame.
- **`audioFrame()`** computes `rimGlow` (0..1) from the ring and `AudioSys.now()`:
  - it is 1 at an onset and falls to 0 over `C.RIM_PULSE_TIME`;
  - it is 0 off play, and 0 with no context;
  - it lives in a `Game` closure variable, ⛔ never on `state`.
- **`draw()`** passes it to `drawWell`'s optional sixth argument (§1.9), which
  scales the rim's `glowStroke` width by `1 + C.RIM_PULSE_W × glow` and its
  alpha by `1 + C.RIM_PULSE_ALPHA × glow`, capped at 1.
  - ⛔ No fill, no `state.rng()`, rim only (depth 1, nowhere near
    `C.READABILITY_DEPTH`).
- **`C`:** `RIM_PULSE_TIME` 0.10, `RIM_PULSE_W` 0.5, `RIM_PULSE_ALPHA` 0.5 (⚠
  PREDICTED, provisional).
- **`scratchpad/test-cs010-p4.js`:**
  - the glow rises only once the clock reaches an onset, and never before (the lookahead schedules 0.2 s ahead);
  - it is 0 headless, off play and under pause;
  - `draw()` spends no draw, and the frame's `state` hash is unchanged;
  - only the rim stroke changes;
  - the width stays ≤ `LINE_W_RIM × (1 + RIM_PULSE_W)`;
  - `test-cs008-p4.js`'s fill and text scans stay green;
  - **mutation: a glow that ignores the onset time is red**.
- `SKIPPED-PLAYTESTS.md`: the rim pulse's readability over a busy rim (knobs
  `RIM_PULSE_*`).

## 7. P5 — THE EIGHTH SOAK, THE DOCS, THE CLOSE

- **`scratchpad/test-cs010-p5.js` — the eighth soak** (`STATUS.md`: extend with
  an eighth file, never widen `test-cs009-p6.js`). It uses p6's front-door
  driver shape, with Start Depths 1 / 13 / 23, audio on.
  - ⛔ **`dangerInputs` is spied, and `state` is hashed before and after every
    call. Every pair must match.** That is the proof §1.4 found missing.
  - A second session with `dangerInputs` stubbed to a constant must match the
    first's state hash frame by frame. That proves the music cannot steer the run.
  - Intensity ∈ [0, 1] on every frame.
  - ⛔ **Every gate automation is on a bar line** of the live track.
  - Duck, dip, gate and sweep have no bare `.value` set after construction.
  - The duck is 0.5 on exactly D9's frames.
  - All four dip events dipped.
  - `tick` and `cycle` both entered and left at least once.
  - The rim glow is 0 on every non-play frame.
  - Nodes per step ≤ `C.MUSIC_STEP_NODE_MAX`.
  - Obey the replay traps.
- **The review**: `log/CS010.md`'s phase entries read together.
- **Docs:**
  - GDD §11.1, the path; §11.4–11.6, "Shipped, CS010" notes, with §11.5's "one-pole" and `MUSIC_LAYER_CROSSFADE` corrected; §11.7's table at D3 / D4 and its render; §11.8, the model gate; §17 item 9's two clauses; §19 Audio's verdicts; §5's line.
  - `CLAUDE.md` code map (`18-audio-director.js` is no longer empty).
  - `ROADMAP.md`'s row and a "what CS010 shipped / left" paragraph.
  - `STATUS.md` reset.
  - `log/CS010.md` closed; `C.GAME_VERSION`.
- ⛔ Zero skips. `P1_DETERMINISM_HASH` 1229033515 and `GOLDEN_LANES` unmoved.

---

## 8. ⛔ THE BASELINE LEDGER

| Baseline | Moves in CS010? |
|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` **1229033515** | ⛔ **No, in any phase.** MEASURED green in variant E2 and in the state-writing mutation (which proves the hash cannot see a both-sessions write, §1.4). A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | ⛔ **No** (PREDICTED: no audio code draws from `state.rng`) |
| `test-registry.js` `tracks` 2, `enemies` 6, `enemyKinds` 9 | ⛔ **No** |
| kit-audio `AUDIO_VERSION` | 0.2.0 → **0.3.0 in P1** (the only bump) |

**Closed-file edits, all in place** (MEASURED unless marked):
- **P1:** `test-cs009-p1.js` 7; `test-cs009-p4.js` 1; `test-cs009-p5.js` 2 (the headroom gate becomes D16's model).
- **P3:** `test-cs009-p2.js` 1; `test-cs009-p5.js`'s Surger-voice fixture (nine assertions' precondition, repaired, not relaxed).
- **P4:** none (PREDICTED, §1.9).
- ⛔ **Any other closed assertion going red is a finding to stop on**, not a repair.

## 9. ⛔ ACCEPTANCE CRITERIA

1. Headless, every audio entry point still no-ops, and the 49 closed files stay green except §8's named edits.
2. `scheduleStep`, `playNote` and `update` read no intensity, tier or audition. A gate only ever targets 0 or 1.
3. ⛔ **Every tier change lands on a bar line**, mutation-checked on the fake (P1) and on a played session (P5).
4. Intensity ∈ [0, 1] on every frame. The attack and release match `INT_ATTACK` / `INT_RELEASE`, and symmetric smoothing is red.
5. The sweep maps D14's curve, and is open on `title` and held under pause.
6. The duck is 0.5 on exactly D9's screens. The dips fire on D9's four events. Every change is a ramp.
7. The limiter is on §1.6's path with `C.MUSIC_LIMIT`, in the game and in both labs' `createMusic` calls.
8. ⛔ **D16's gate holds on `pulse` and `title` at D3 / D4's gains**, covering every tier by the unity invariants.
9. `pulse` carries tiers on `cycle` (2) and `tick` (3) only, both PASS. `title` is untiered. `melody` is never tiered.
10. ⛔ The articulation gate passes on every layer of every track. COPY TABLE's tempo and tier rewrites are tested.
11. music-lab has INTENSITY and TIER, and plays through the limiter.
12. The rim pulses on `heart`'s onsets in play only, by the audio clock, with no fill and no state.
13. ⛔ `dangerInputs` writes no `state` on any call of the eighth soak, and a stubbed director leaves the run's hash unchanged.
14. kit-audio 0.3.0 with a `.NOTES.md` entry; `18-audio-director.js` is covered by the kit's notes.

## 10. ⛔ WHAT CS010 DOES NOT DO

- **A danger layer or any new composition** (D1, D13). The tier-4 threshold is unread.
- **The combo input**: CS012, with the Overdrive re-measure (D6).
- **ATK / REL / GATE controls** in music-lab (D12).
- **Tiers on `title`**, and **`drive`** (CS012).
- **Persistence** of anything: CS011.
- **§19's "filter sweep audible end to end" in Classic** (§1.1: Classic peaks at 0.668). CS010 reports it and does not rescale (D6).
- **The Surger tone's own clip at 1.106** (§1.6), **R2's pad-only silence**,
  **the voice bus**, **the Dive's visual**: all unowned, as before.

## 11. RISKS

| # | Risk | Mitigation |
|---|---|---|
| R1 | Human boards run hotter than the scripted player's (PREDICTED), so the layers sound more often than §1.1 says | D5 was chosen on the scripted numbers. Telemetry can replot intensity from a real run later. A retune is two constants and a `SKIPPED-PLAYTESTS.md` knob |
| R2 | D16's model under-reads the rendered transient by 1.7–2.2 dB (§1.7) | The settings are pinned to the render, and P3 re-renders. The tone still sits 7.7 dB above the music's rendered peak |
| R3 | Makeup gain and transient behaviour differ in Firefox and Safari (PREDICTED; the spec defines the curve, not the detector) | Logged in `SKIPPED-PLAYTESTS.md` with the limiter entry |
| R4 | A `title` → play crossfade passes `title`'s tail through a sweep that is closing (PREDICTED: darker over 0.6 s) | Accepted. Noted in P2's log entry |
| R5 | The Surger tone renders at sample peak 1.106 at unity (MEASURED) and clips at the destination | Not CS010's. Recorded in `STATUS.md` known issues, unowned |
| R6 | A music gain equal to a recipe gain collides with a fixture that finds voices by gain value (§1.4 G) | P3 repairs the fixture to find voices by route |
| R7 | A director that writes `state` passes every closed test (MEASURED) | R7's top-level spy and P5's before/after hash |
| R8 | P1 is the largest phase: the engine, the fake, the glue, `C`, both labs and 10 closed assertions | It is one engine edit and one version bump. Splitting it means two three-file edits and two bumps. If it overruns, split the limiter and the model gate into P1b with no renumber |
| R9 | Tier 3 at Start Depth 1 first crossed at 99.9 s in one run and only while dying in the other (§1.1) | Accepted: the groove is earned. It enters within 7–33 s from Start Depth 13 |

## 12. ASSUMPTIONS

- OO `5abd37a`'s `setDuck` / `setIntensity` are the port source for the duck
  and the gate loop. The latch, sweep, limiter, dip and `onBeat` are new.
- The Web Audio spec's `DynamicsCompressorNode` curve and makeup are what
  Chromium implements. MEASURED against the render: within 2.2 dB, and above the
  model, never below.
- The render method (§ header) is the level instrument. It is rebuilt per phase
  in the temporary directory, as CS009's was, and is not shipped.
- The scripted driver's boards are the only measured boards. The shipped
  numbers stand, and the ear checks are skipped playtests.

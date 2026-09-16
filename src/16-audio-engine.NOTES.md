# kit-audio — change notes

**Module:** `src/16-audio-engine.js`
**Vendored from:** *originated here (Vector Vortex), destined for coinless-kit as `kit-audio`*
**Current version:** `0.2.0`
**Depends on:** nothing. The host supplies a noise generator and calls `unlock()` from a user gesture.

---

## Contract summary

Three factories. `createAudioEngine(opts)` owns the audio context and four
buses: `master`, `music`, `sfx` and `voice`. `createMusic(engine, opts)` is a
step-sequencer that plays **data** tables into the `music` bus. It uses
per-frame lookahead scheduling on the context's own clock and never a timer.
`createSfxPlayer(engine, opts)` (0.2.0) plays one-shot and held voices built
from **recipe** data into the `sfx` bus.

**⛔ The module reads no host global.** No config object, no game object, no
game function, in either direction. Numeric tunables are **required** and throw
when missing (kit-input's rule): a default here would be a second tuning
surface competing with the host's config. The only globals it touches are the
platform's context class (`AudioContext`, else `window.webkitAudioContext`),
looked up at `unlock()` time.

**⛔ Nothing starts before a user gesture.** `engine.ctx` is `null` until
`unlock()` runs, and every entry point on both objects returns early while it
is. A host with no audio API runs every call as a no-op. Creating the context
can fail, and that is the normal silent path: `unlock()` returns `false`.

### `createAudioEngine(opts)`

| Option | Required | Meaning |
|---|---|---|
| `volRamp` | yes | Seconds a `setVol()` change ramps over. |
| `vol` | yes | `{ master, music, sfx, voice }`, linear gain ≥ 0 (1 = unity). Held from creation, so a host can apply saved settings before any gesture. |

| Surface | Meaning |
|---|---|
| `ctx` | The context, or `null` before a successful `unlock()`. |
| `master` / `music` / `sfx` / `voice` | The bus gain nodes, or `null`. `master` → destination; the other three → `master`. |
| `vol` | The held levels. |
| `unlock()` | Call **inside** a user gesture. The first call creates the context and builds the buses at the held levels. Every call resumes a `suspended` context. Returns whether a context exists. |
| `setVol(bus, v)` | Holds the level; if the graph exists, ⛔ **ramps** to it over `volRamp` (cancel, pin the current value, linear ramp). Never a bare `.value` set. Throws on an unknown bus or a level that is not a finite number ≥ 0. |
| `now()` | `ctx.currentTime`, or 0. |

### `createMusic(engine, opts)`

| Option | Required | Meaning |
|---|---|---|
| `tracks` | no (default `{}`) | `{ name: track \| null }`. `null` is a named silence. Checked at creation. |
| `lookahead` | yes | Seconds. Each `update()` schedules every step starting inside this window. |
| `crossfade` | yes | Seconds. Track-to-track fade on `setState()`. |
| `fadeOut` | yes | Seconds. The fade when `setState()` names a silence. |
| `noise` | yes | `() => number in [0, 1)`. Fills the 2 s noise buffer once. Pass a **seeded** generator, and the host keeps its determinism. |
| `layerSink` | no | `({ ctx, track, index, layer, out }) => node \| null`, called per layer on each `setState()`. Return a node the layer's gate should feed (the host connects it onward to `out`), or `null` for the plain path. This is where a lab hangs SOLO and MUTE. |

| Surface | Meaning |
|---|---|
| `setState(name)` | Crossfade to `tracks[name]`, or fade to silence if there is none. Idempotent for the current name. |
| `update()` | Call **once per frame**. Schedules the lookahead window, and resyncs after a stall (below). |
| `scheduleStep(step, t)` / `playNote(layer, cell, t, i)` / `ensureGraph()` / `ensureNoiseBuf()` | Internal, exposed for tests and labs. Each is ctx-guarded. |
| `state`, `track`, `step`, `nextStepTime`, `duck`, `trackGain`, `layerGates`, `noiseBuf` | Read-only for a host. |

**Track contract (DATA):**

```js
{ stepDur, steps, layers: [ { name, type, cutoff, cutoffTo, cutoffTime, q, hp,
    detune, drop, dropTime, noise, gain, atk, rel, audition,
    steps: [ { f, dur, g } | null ] } ] }
```

- `audition` is `"pass"`, `"fail"` or absent. It is a mark for whoever tiers the track later. ⛔ The scheduler never reads it.
- ⛔ **`tier` is refused in 0.1.0.** A tier outside `1..4` is always an error. Any tier at all is an error until an intensity setter exists; without one, a tier is a gate nobody moves.

**Signal path:** note envelope → layer gate (open) → track gain (crossfaded) → duck (unity) → `music` bus → `master` → destination.

```js
const engine = createAudioEngine({ volRamp: 0.03, vol: { master: 1, music: 1, sfx: 1, voice: 1 } });
const music = createMusic(engine, {
  tracks: { title: buildTitle(), off: null },
  lookahead: 0.2, crossfade: 0.6, fadeOut: 1.0,
  noise: mulberry32(1234),
});
input = createInput({ /* ... */ onGesture: () => engine.unlock() });   // kit-input 0.7.0
// each frame:
music.setState(screen === "title" ? "title" : "off");
music.update();
```

### `createSfxPlayer(engine, opts)` (0.2.0)

| Option | Required | Meaning |
|---|---|---|
| `noise` | yes | `() => number in [0, 1)`. Fills a 1 s noise buffer once, on the first noise recipe. Pass a seeded generator. |

| Surface | Meaning |
|---|---|
| `play(recipe, { pitch, when })` | Sounds a recipe once. `pitch` (default 1, > 0) multiplies every frequency in it, the filter's included. `when` is an absolute context time; one in the past, or absent, means now. ⛔ Every source it starts is stopped at `atk + hold + rel` plus a 0.02 s tail. Throws on a bad recipe, even with no context. |
| `hold(recipe)` | Starts a voice that attacks to `gain` and sustains. Returns `{ set(t01), stop() }`. `set` clamps `t01` to 0..1 and moves every frequency to `f · (to / f)^t01` with a 0.01 s time constant (`glide`, `sweep` and `hold` are not read). `stop` releases over `rel`, then stops every source; a second `stop`, and any `set` after it, do nothing. With no context it returns a handle whose calls do nothing. |

**Recipe contract (DATA):**

```js
{ osc: [ { type, f, to } ],            // one or two; type sine | square | sawtooth | triangle
  noise: true,                         // instead of osc: the injected noise, looped
  glide,                               // s, f -> to; required when any osc has `to`
  filter: { type, f, to, q },          // optional; lowpass | highpass
  sweep,                               // s, filter f -> to; required when the filter has `to`
  atk, hold, rel, gain }               // envelope (atk, rel > 0; hold >= 0) and linear peak
```

Exactly one of `osc` and `noise`. An unknown field throws (`sfxCheckRecipe`),
so a typo in a host's table fails loudly. **Nodes per sound:** one gain, at
most one filter, one or two sources. Signal path: sources → [filter] → envelope
gain → `sfx` bus.

**Three behaviours worth knowing before wiring it**

1. ⛔ **`scheduleStep` never consults intensity.** Every layer is always
   scheduled; gating is a downstream gain node. Note timing is therefore fixed
   whatever a director does.
2. ⛔ **Stall resync.** When `nextStepTime` is more than one lookahead behind
   the clock (a hidden tab runs no frames), `update()` advances the cursor and
   the clock by the whole number of missed steps and schedules none of them.
   Bar phase holds. One `update()` after any gap schedules at most
   `ceil(lookahead / stepDur) + 1` steps.
3. **Nodes per step are the host's budget.** A note is a gain, an optional
   low-pass, an optional high-pass, and one oscillator (two with `detune`) or
   one buffer source. The host asserts its worst step against its own ceiling.

---

## Changes

Newest last. One entry per change.

### 2026-09-16 — first cut: context, buses, scheduler (`VERSION` — → 0.1.0)

**What changed.** New module. `createAudioEngine()` is Orbital Overhaul's
`AudioSys` bus graph (commit `5abd37a`, lines 1522–1553), with four buses and a
ramped `setVol`. The source set a bare `.value`. `createMusic()` is that
game's `MusicSys` (lines 2173–2583), ported with **four departures**, each
asserted by Vector Vortex's `scratchpad/test-cs009-p1.js`:

1. The noise buffer is filled from the injected `noise` generator. The source
   used the platform's unseeded one.
2. **Stall resync** in `update()`. Measured on the source: one update after a
   60 s gap fired 931 notes clamped to one instant.
3. No comment names the browser audio API by a word the host's vocabulary scan
   bans.
4. `opts.layerSink`.

Consequences of removing game names, not behaviour changes: the tunables are
options, not constants; the source's `"off"` state name became "any name with
no track", which fades over `fadeOut`; guards were added to `scheduleStep` and
`playNote`. **Not ported:** `setIntensity` and `setDuck`. Every layer gate and
the duck node are built at unity. The loader (tier and audition checks) is new.

**Why.** Vector Vortex CS009 P1. The game needs music and SFX (GDD §11), and
§11.1 adopts that game's proven system rather than reinventing it.

**Game-agnostic?** Yes. The module names no Vector Vortex concept. Track
names, the bus levels, the noise seed and when to call `unlock()` all belong to
the host. The host's suite scans this module's slice for `C.`, `state.`, and
the game's globals.

**Backport status.** `not yet`. The intensity director (CS010) will change the
surface.

### 2026-09-16 — the SFX player (`VERSION` 0.1.0 → 0.2.0)

**What changed.** Additive. `createSfxPlayer(engine, { noise })` with `play`
and `hold`, and `sfxCheckRecipe(recipe)`, which both call. New, not a port:
Orbital Overhaul's sound effects are hand-written methods, one per event, and a
kit module cannot hold a host's events. Here a sound is data the host owns.
Nothing in `createAudioEngine` or `createMusic` changed.

**Why.** Vector Vortex CS009 P4 (GDD §11.8). The game's `C.SFX` table holds one
recipe per event and its `tools/sfx-lab.html` auditions 2–3 candidates each,
playing them through this code verbatim.

**Game-agnostic?** Yes. It names no event, no entity and no config. The recipe
table, the pitch map and when to hold a voice belong to the host. The host's
suite checks this slice for `C.`, its game globals and a platform random call.

**Backport status.** `not yet`.


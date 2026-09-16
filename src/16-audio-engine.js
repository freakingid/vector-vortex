// 16-audio-engine.js — kit-audio (draft). The context, four buses, the music scheduler, and the SFX player.
//
// ⛔ THIS MODULE READS NO GAME GLOBAL. Not the config object, not the mutable
// game object, not a game function, in either direction. Every tunable arrives
// through the factories' options, and 19-sfx.js is what passes them in. The
// noise source is an injected function, so this file draws from no generator
// of its own. That is CLAUDE.md's boundary contract ("Kit modules and
// extraction"). Backport packet: src/16-audio-engine.NOTES.md.
//
// ⛔ NOTHING STARTS BEFORE A USER GESTURE. `engine.ctx` is null until unlock()
// runs inside one (the host calls it from kit-input's onGesture), and EVERY
// entry point below returns early while it is null. A host with no audio API
// at all (the headless suite) therefore runs every call as a no-op.
//
// ⛔ THE MUSIC SCHEDULER IS PER-FRAME LOOKAHEAD, NEVER A TIMER (GDD 11.2). Each
// update() schedules every step that starts inside the lookahead window, at an
// absolute context time. Note timing is then sample-accurate and has nothing
// to do with the frame rate.
//
// ⛔ scheduleStep NEVER CONSULTS INTENSITY, and never reads a layer's
// `audition` mark. Every layer is always scheduled; gating is a downstream
// gain node. That is what keeps a track's note timing provably fixed whatever
// a director does later.
//
// createMusic() is Orbital Overhaul's music system (commit 5abd37a), ported.
// It departs from that source in exactly four places, each marked DEPARTURE
// below and each asserted by test-cs009-p1.js:
//   1. the noise buffer is filled from the injected generator;
//   2. update() RESYNCS after a stall instead of bursting every missed note;
//   3. no comment names the browser audio API by the word the host's
//      vocabulary scan bans;
//   4. opts.layerSink, so a lab's per-layer SOLO/MUTE nodes live outside this
//      code.
// Not ported (0.1.0): the intensity setter and menu ducking. Every layer gate
// and the duck node are built at unity.
//
// createSfxPlayer() (0.2.0) is new here, not a port: one-shot and held voices
// built from recipe DATA, into the sfx bus. Its noise is injected too.

const AUDIO_VERSION = "0.2.0";

// The four buses, in build order. master goes to the output; the other three
// go to master. A bus nothing feeds yet is still built, so its volume row works.
const AUDIO_BUSES = ["master", "music", "sfx", "voice"];

// ⛔ Numeric tunables are REQUIRED, never defaulted (kit-input's rule): a
// default here would be a second tuning surface competing with the host's.
function audioRequireNum(opts, owner, name) {
  const v = opts[name];
  if (typeof v !== "number" || !isFinite(v)) {
    throw new Error(owner + ": options." + name + " must be a finite number");
  }
  return v;
}

// A bus level is linear gain: 0 is silence, 1 is unity.
function audioCheckVol(where, v) {
  if (typeof v !== "number" || !isFinite(v) || v < 0) {
    throw new Error(where + " must be a finite number >= 0");
  }
  return v;
}

// The platform's context class, or null. Looked up at unlock() time, not at
// load, so a host (or a test) that installs one late is still heard.
function audioContextClass() {
  if (typeof AudioContext === "function") return AudioContext;
  if (typeof window !== "undefined" && window && typeof window.webkitAudioContext === "function") {
    return window.webkitAudioContext;
  }
  return null;
}

// createAudioEngine({ volRamp, vol: { master, music, sfx, voice } })
function createAudioEngine(options) {
  const opts = options || {};
  const volRamp = audioRequireNum(opts, "createAudioEngine", "volRamp");
  if (!opts.vol || typeof opts.vol !== "object") {
    throw new Error("createAudioEngine: options.vol must be an object");
  }
  // ⛔ HELD FROM BOOT. The levels exist before the context does, so a host
  // can set them from its settings long before the first gesture, and unlock()
  // builds each bus at the level held.
  const vol = {};
  for (let i = 0; i < AUDIO_BUSES.length; i++) {
    const bus = AUDIO_BUSES[i];
    vol[bus] = audioCheckVol("createAudioEngine: options.vol." + bus, opts.vol[bus]);
  }

  const engine = {
    VERSION: AUDIO_VERSION,
    ctx: null,
    vol,
    master: null, music: null, sfx: null, voice: null,
    unlock, setVol, now,
  };

  // Call from inside a user gesture. The first call creates the context and
  // the buses; every call resumes a suspended context. Returns whether a
  // context exists. ⛔ A context that cannot be created is the normal silent
  // path, not an error: the game plays without sound.
  function unlock() {
    if (!engine.ctx) {
      const Ctor = audioContextClass();
      if (!Ctor) return false;
      let ctx;
      try { ctx = new Ctor(); } catch (err) { return false; }
      engine.ctx = ctx;
      for (let i = 0; i < AUDIO_BUSES.length; i++) {
        const bus = AUDIO_BUSES[i];
        const g = ctx.createGain();
        g.gain.value = vol[bus];      // built before anything plays: a level, not a change
        g.connect(bus === "master" ? ctx.destination : engine.master);
        engine[bus] = g;
      }
    }
    if (engine.ctx.state === "suspended" && typeof engine.ctx.resume === "function") {
      const p = engine.ctx.resume();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    return true;
  }

  // Set a bus level. Held always; pushed to the graph if it exists. ⛔ A RAMP
  // over volRamp, never a bare .value set: a stepped gain clicks.
  function setVol(bus, v) {
    if (AUDIO_BUSES.indexOf(bus) < 0) throw new Error("setVol: no bus named " + bus);
    vol[bus] = audioCheckVol("setVol: " + bus, v);
    if (!engine.ctx) return;
    const param = engine[bus].gain, t = engine.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(vol[bus], t + volRamp);
  }

  function now() { return engine.ctx ? engine.ctx.currentTime : 0; }

  return engine;
}

// The track loader. A track is DATA (GDD 11.3):
//   { stepDur, steps, layers: [ { name, type, cutoff, cutoffTo, cutoffTime, q,
//     hp, detune, drop, dropTime, noise, gain, atk, rel, audition,
//     steps: [cell | null] } ] }      cell = { f, dur, g }
// A track may be null: a named silence.
// ⛔ `tier` IS REFUSED IN 0.1.0. A tier outside 1..4 is always an error (a
// threshold table has no key for it, so the layer would be silent forever).
// Any tier at all is an error until the intensity setter is ported: without
// it, a tier would be a gate nobody opens or closes.
// `audition` is "pass", "fail" or absent. It is a mark for whoever tiers the
// track later, and the scheduler never reads it.
function audioCheckTracks(tracks) {
  if (!tracks || typeof tracks !== "object") throw new Error("createMusic: options.tracks must be an object");
  const names = Object.keys(tracks);
  for (let n = 0; n < names.length; n++) {
    const track = tracks[names[n]];
    if (track === null) continue;
    const at = "createMusic: track " + names[n];
    if (!track || typeof track !== "object") throw new Error(at + " must be an object or null");
    if (typeof track.stepDur !== "number" || !(track.stepDur > 0)) throw new Error(at + ": stepDur must be > 0");
    if (!Number.isInteger(track.steps) || track.steps < 1) throw new Error(at + ": steps must be a positive integer");
    if (!Array.isArray(track.layers)) throw new Error(at + ": layers must be an array");
    for (let i = 0; i < track.layers.length; i++) {
      const layer = track.layers[i];
      const la = at + " layer " + i;
      if (!layer || !Array.isArray(layer.steps)) throw new Error(la + ": steps must be an array");
      if (layer.tier !== undefined) {
        if (!Number.isInteger(layer.tier) || layer.tier < 1 || layer.tier > 4) {
          throw new Error(la + ": tier must be an integer in 1..4");
        }
        throw new Error(la + ": tier is not supported in kit-audio " + AUDIO_VERSION + " (no intensity gating)");
      }
      if (layer.audition !== undefined && layer.audition !== "pass" && layer.audition !== "fail") {
        throw new Error(la + ": audition must be \"pass\", \"fail\" or absent");
      }
    }
  }
}

// createMusic(engine, { tracks, lookahead, crossfade, fadeOut, noise, layerSink })
//   tracks     { name: track | null }, checked by audioCheckTracks
//   lookahead  s — each update(), schedule every step starting inside this window
//   crossfade  s — track-to-track fade on setState()
//   fadeOut    s — the fade when setState() names a silence
//   noise      () => number in [0, 1) — fills the noise buffer
//   layerSink  optional ({ ctx, track, index, layer, out }) => node | null
//
// Signal path: note envelopes -> layer gate -> [track gain, crossfaded] -> duck -> engine.music
function createMusic(engine, options) {
  if (!engine || typeof engine.unlock !== "function") {
    throw new Error("createMusic: engine must come from createAudioEngine()");
  }
  const opts = options || {};
  const lookahead = audioRequireNum(opts, "createMusic", "lookahead");
  const crossfade = audioRequireNum(opts, "createMusic", "crossfade");
  const fadeOut   = audioRequireNum(opts, "createMusic", "fadeOut");
  // DEPARTURE 1: the noise source is injected, so a host keeps its own seeded
  // stream and the build holds no unseeded draw.
  if (typeof opts.noise !== "function") throw new Error("createMusic: options.noise must be a function");
  const noise = opts.noise;
  // DEPARTURE 4: a host's per-layer insert. Returns the node a layer's gate
  // should feed (which the host has connected onward to `out`), or null for
  // the plain path. A lab hangs SOLO and MUTE here; a game passes none.
  const layerSink = typeof opts.layerSink === "function" ? opts.layerSink : null;
  const tracks = opts.tracks === undefined ? {} : opts.tracks;
  audioCheckTracks(tracks);

  return {
    duck: null,          // GainNode: track graph -> engine.music. ⛔ unity in 0.1.0
    trackGain: null,     // GainNode for the currently-scheduled track; replaced (crossfaded) on setState
    state: "off",        // current track name, or a name with no track (silence)
    track: null,         // the active step table, or null for a silence
    step: 0,             // scheduler cursor into track.steps
    nextStepTime: 0,     // absolute ctx time of the next step to schedule
    layerGates: null,    // [{ node }] parallel to this.track.layers, or null
    noiseBuf: null,      // lazily-built 2 s mono white-noise buffer, for `noise: true` layers

    // Lazily build the duck node once the bus graph exists (first user gesture).
    ensureGraph() {
      if (this.duck || !engine.ctx || !engine.music) return;
      this.duck = engine.ctx.createGain();
      this.duck.gain.value = 1.0;
      this.duck.connect(engine.music);
    },

    // Crossfade to a named track. Fades out and retires the previous track's
    // gain (already-scheduled notes ring out and nothing new feeds it), and
    // starts a fresh gain ramping up for the new one. A name with no track
    // fades to silence over fadeOut and leaves trackGain null, so the
    // scheduler idles.
    setState(s) {
      if (!engine.ctx) return;
      this.ensureGraph();
      if (s === this.state) return;
      const ctx = engine.ctx, t = ctx.currentTime;
      const next = tracks[s] || null;
      if (this.trackGain) {
        const g = this.trackGain, fade = next ? crossfade : fadeOut;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0.0001, t + fade);
        this.trackGain = null;
      }
      this.state = s;
      this.track = next;
      this.step = 0;
      this.layerGates = null;
      if (this.track && this.duck) {
        this.nextStepTime = t;                    // start scheduling from now, never in the past
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(1, t + crossfade);
        g.connect(this.duck);
        this.trackGain = g;
        // One persistent gate per layer, open. The track-level crossfade above
        // fades the whole track in, so a gate needs no ramp of its own.
        this.layerGates = this.track.layers.map((layer, index) => {
          const node = ctx.createGain();
          node.gain.value = 1;
          const sink = layerSink ? layerSink({ ctx, track: s, index, layer, out: g }) : null;
          node.connect(sink || g);
          return { node };
        });
      }
    },

    // The lookahead scheduler: once per frame, schedule every step whose start
    // time falls inside the next `lookahead` seconds, on the context's clock.
    update() {
      if (!engine.ctx) return;
      this.ensureGraph();
      if (!this.track || !this.trackGain) return;
      const ctx = engine.ctx, now = ctx.currentTime, horizon = now + lookahead;
      const stepDur = this.track.stepDur;
      // DEPARTURE 2: ⛔ STALL RESYNC. No frame runs while a tab is hidden, and
      // a hidden tab is a shipped pause source, so a long gap is routine. The
      // source clamped every missed step to `now` and fired them all at once
      // (931 notes after 60 s). Past one lookahead behind, skip the whole
      // missed steps instead: the cursor and the clock advance together, so bar
      // phase holds, and nothing that should already have sounded is played.
      if (this.nextStepTime < now - lookahead) {
        const missed = Math.floor((now - this.nextStepTime) / stepDur);
        this.nextStepTime += missed * stepDur;
        this.step = (this.step + missed) % this.track.steps;
      }
      let guard = 1024;                           // bound catch-up (never dump the loop)
      while (this.nextStepTime < horizon && guard-- > 0) {
        this.scheduleStep(this.step, this.nextStepTime);
        this.nextStepTime += stepDur;
        this.step = (this.step + 1) % this.track.steps;
      }
    },

    scheduleStep(step, tStep) {
      if (!engine.ctx || !this.track || !this.layerGates) return;
      const t = Math.max(tStep, engine.ctx.currentTime); // a late step must not schedule into the past
      const layers = this.track.layers;
      // Every layer is scheduled unconditionally, whatever its mark and
      // whatever the intensity. Gating is a downstream GAIN gate
      // (this.layerGates), never a scheduling omission.
      for (let i = 0; i < layers.length; i++) {
        const cell = layers[i].steps[step];
        if (cell) this.playNote(layers[i], cell, t, i);
      }
    },

    // Lazily build a cached 2 s mono white-noise buffer, for `noise: true` layers.
    ensureNoiseBuf() {
      if (this.noiseBuf || !engine.ctx) return;
      const ctx = engine.ctx, n = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = noise() * 2 - 1;   // DEPARTURE 1
      this.noiseBuf = buf;
    },

    playNote(layer, cell, t, layerIndex) {
      if (!engine.ctx || !this.track || !this.layerGates) return;
      const ctx = engine.ctx, dur = cell.dur * this.track.stepDur;
      const peak = (cell.g == null ? 1 : cell.g) * layer.gain;
      const atk = Math.min(layer.atk == null ? 0.4 : layer.atk, dur * 0.5);
      const rel = Math.min(layer.rel == null ? 0.5 : layer.rel, dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + atk);
      g.gain.setValueAtTime(peak, t + Math.max(atk, dur - rel));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let sink = g;
      if (layer.cutoff) {
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.Q.value = layer.q || 1;
        f.frequency.setValueAtTime(layer.cutoff, t);
        if (layer.cutoffTo)
          f.frequency.exponentialRampToValueAtTime(layer.cutoffTo, t + Math.min(layer.cutoffTime || dur, dur));
        f.connect(sink); sink = f;
      }
      if (layer.hp) {
        const f = ctx.createBiquadFilter();
        f.type = "highpass"; f.frequency.value = layer.hp;
        f.connect(sink); sink = f;
      }
      if (layer.noise) {
        this.ensureNoiseBuf();
        const s = ctx.createBufferSource();
        s.buffer = this.noiseBuf; s.connect(sink);
        s.start(t); s.stop(t + dur + 0.05);
      } else {
        const freqs = layer.detune ? [cell.f, cell.f * Math.pow(2, layer.detune / 1200)] : [cell.f];
        for (const fr of freqs) {
          const o = ctx.createOscillator();
          o.type = layer.type; o.frequency.setValueAtTime(fr, t);
          if (layer.drop)
            o.frequency.exponentialRampToValueAtTime(Math.max(24, fr * Math.pow(2, -layer.drop / 12)),
                                                     t + (layer.dropTime || 0.06));
          o.connect(sink); o.start(t); o.stop(t + dur + 0.1);
        }
      }
      g.connect(this.layerGates[layerIndex].node);   // through this layer's gate
    },
  };
}

// ---------------------------------------------------------------------------
// The SFX player (0.2.0). A sound is a RECIPE, plain data:
//   { osc: [ { type, f, to } ] | noise: true, glide, filter: { type, f, to, q },
//     sweep, atk, hold, rel, gain }
//   osc     one or two oscillators; type is a wave name, f the start frequency
//           and `to` (optional) the end frequency, reached over `glide` s
//   noise   true instead of osc: the injected generator's buffer, looped
//   filter  optional; type "lowpass" or "highpass", f -> `to` over `sweep` s
//   atk / hold / rel  s: the envelope, rising to `gain` (linear peak)
// A recipe names exactly one of osc and noise. A `to` needs its glide or sweep.
//
// play(recipe, { pitch, when }) sounds it once. `pitch` multiplies every
// frequency in it, the filter's included, so one recipe serves many voices.
// `when` is an absolute context time (default: now). Every source stops itself
// at the end of the release.
//
// hold(recipe) starts a voice that sustains at `gain` until stop(). It returns
// { set(t01), stop() }: set() moves every frequency to f + (to - f) * t01 on an
// exponential curve (glide and sweep are not read), and stop() releases over
// `rel` and stops every source. Held before a context exists, it returns a
// handle whose calls do nothing.
const SFX_WAVES = ["sine", "square", "sawtooth", "triangle"];
const SFX_FILTERS = ["lowpass", "highpass"];
const SFX_RECIPE_FIELDS = ["osc", "noise", "glide", "filter", "sweep", "atk", "hold", "rel", "gain"];
const SFX_FLOOR = 0.0001;     // an exponential ramp's silence: it cannot reach 0
const SFX_TAIL = 0.02;        // s a source outlives its release, so it never clicks off
const SFX_SET_TC = 0.01;      // s time constant of a held voice's set()

function sfxPositive(v) { return typeof v === "number" && isFinite(v) && v > 0; }

// Throws on a recipe the player cannot build, naming the field.
function sfxCheckRecipe(r) {
  const bad = why => { throw new Error("sfx recipe: " + why); };
  if (!r || typeof r !== "object") bad("must be an object");
  for (const k of Object.keys(r)) if (SFX_RECIPE_FIELDS.indexOf(k) < 0) bad("unknown field " + k);
  const hasOsc = r.osc !== undefined, hasNoise = r.noise === true;
  if (r.noise !== undefined && r.noise !== true) bad("noise must be true or absent");
  if (hasOsc === hasNoise) bad("needs exactly one of osc and noise");
  let glides = false;
  if (hasOsc) {
    if (!Array.isArray(r.osc) || r.osc.length < 1 || r.osc.length > 2) bad("osc must hold one or two oscillators");
    for (const o of r.osc) {
      if (!o || SFX_WAVES.indexOf(o.type) < 0) bad("osc type must be one of " + SFX_WAVES.join(", "));
      if (!sfxPositive(o.f)) bad("osc f must be > 0");
      if (o.to !== undefined) { if (!sfxPositive(o.to)) bad("osc to must be > 0"); glides = true; }
    }
  }
  if (glides && !sfxPositive(r.glide)) bad("an osc `to` needs glide > 0");
  if (r.filter !== undefined) {
    const fl = r.filter;
    if (!fl || SFX_FILTERS.indexOf(fl.type) < 0) bad("filter type must be one of " + SFX_FILTERS.join(", "));
    if (!sfxPositive(fl.f)) bad("filter f must be > 0");
    if (fl.q !== undefined && !sfxPositive(fl.q)) bad("filter q must be > 0");
    if (fl.to !== undefined) {
      if (!sfxPositive(fl.to)) bad("filter to must be > 0");
      if (!sfxPositive(r.sweep)) bad("a filter `to` needs sweep > 0");
    }
  }
  if (!sfxPositive(r.atk)) bad("atk must be > 0");
  if (typeof r.hold !== "number" || !isFinite(r.hold) || r.hold < 0) bad("hold must be >= 0");
  if (!sfxPositive(r.rel)) bad("rel must be > 0");
  if (!sfxPositive(r.gain)) bad("gain must be > 0");
}

// createSfxPlayer(engine, { noise })
//   noise  () => number in [0, 1) — fills the noise buffer once
// Signal path: sources -> [filter] -> envelope gain -> engine.sfx
function createSfxPlayer(engine, options) {
  if (!engine || typeof engine.unlock !== "function") {
    throw new Error("createSfxPlayer: engine must come from createAudioEngine()");
  }
  const opts = options || {};
  if (typeof opts.noise !== "function") throw new Error("createSfxPlayer: options.noise must be a function");
  const noise = opts.noise;
  let noiseBuf = null;

  // A cached 1 s mono white-noise buffer, filled from the injected generator.
  function ensureNoiseBuf() {
    if (noiseBuf || !engine.ctx) return;
    const ctx = engine.ctx, n = ctx.sampleRate;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = noise() * 2 - 1;
    noiseBuf = buf;
  }

  // The node set: one gain, at most one filter, one or two sources. Started at
  // t, connected to the sfx bus, envelope attack scheduled; never stopped here.
  function voice(r, pitch, t) {
    const ctx = engine.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(SFX_FLOOR, t);
    g.gain.exponentialRampToValueAtTime(r.gain, t + r.atk);
    g.connect(engine.sfx);
    let sink = g, filter = null;
    if (r.filter) {
      filter = ctx.createBiquadFilter();
      filter.type = r.filter.type;
      filter.Q.value = r.filter.q || 1;
      filter.frequency.setValueAtTime(r.filter.f * pitch, t);
      filter.connect(g);
      sink = filter;
    }
    const sources = [], oscs = [];
    if (r.noise) {
      ensureNoiseBuf();
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf; s.loop = true;
      s.connect(sink); s.start(t);
      sources.push(s);
    } else {
      for (const o of r.osc) {
        const s = ctx.createOscillator();
        s.type = o.type;
        s.frequency.setValueAtTime(o.f * pitch, t);
        s.connect(sink); s.start(t);
        sources.push(s); oscs.push(s);
      }
    }
    return { g, filter, sources, oscs };
  }

  function play(recipe, o) {
    sfxCheckRecipe(recipe);
    const po = o || {};
    const pitch = po.pitch === undefined ? 1 : po.pitch;
    if (!sfxPositive(pitch)) throw new Error("sfx play: pitch must be > 0");
    if (!engine.ctx || !engine.sfx) return;
    const now = engine.ctx.currentTime;
    const t = typeof po.when === "number" && po.when > now ? po.when : now;
    const v = voice(recipe, pitch, t);
    const end = t + recipe.atk + recipe.hold + recipe.rel;
    recipe.osc && recipe.osc.forEach((osc, i) => {
      if (osc.to !== undefined) v.oscs[i].frequency.exponentialRampToValueAtTime(osc.to * pitch, t + recipe.glide);
    });
    if (v.filter && recipe.filter.to !== undefined) {
      v.filter.frequency.exponentialRampToValueAtTime(recipe.filter.to * pitch, t + recipe.sweep);
    }
    v.g.gain.setValueAtTime(recipe.gain, t + recipe.atk + recipe.hold);
    v.g.gain.exponentialRampToValueAtTime(SFX_FLOOR, end);
    for (const s of v.sources) s.stop(end + SFX_TAIL);
  }

  function hold(recipe) {
    sfxCheckRecipe(recipe);
    if (!engine.ctx || !engine.sfx) return { set() {}, stop() {} };
    const ctx = engine.ctx;
    const v = voice(recipe, 1, ctx.currentTime);
    let stopped = false;
    const along = (a, b, k) => (b === undefined ? a : a * Math.pow(b / a, k));
    return {
      set(t01) {
        if (stopped || typeof t01 !== "number" || !isFinite(t01)) return;
        const k = Math.min(1, Math.max(0, t01)), now = ctx.currentTime;
        recipe.osc && recipe.osc.forEach((osc, i) => {
          v.oscs[i].frequency.setTargetAtTime(along(osc.f, osc.to, k), now, SFX_SET_TC);
        });
        if (v.filter) v.filter.frequency.setTargetAtTime(along(recipe.filter.f, recipe.filter.to, k), now, SFX_SET_TC);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime, gain = v.g.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(Math.max(gain.value, SFX_FLOOR), now);
        gain.exponentialRampToValueAtTime(SFX_FLOOR, now + recipe.rel);
        for (const s of v.sources) s.stop(now + recipe.rel + SFX_TAIL);
      },
    };
  }

  return { VERSION: AUDIO_VERSION, play, hold };
}

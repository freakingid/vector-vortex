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
// It departs from that source in seven places, each marked DEPARTURE below.
// 1-4 are asserted by test-cs009-p1.js, 5-7 by test-cs010-p1.js:
//   1. the noise buffer is filled from the injected generator;
//   2. update() RESYNCS after a stall instead of bursting every missed note;
//   3. no comment names the browser audio API by the word the host's
//      vocabulary scan bans;
//   4. opts.layerSink, so a lab's per-layer SOLO/MUTE nodes live outside this
//      code;
//   5. (0.3.0) setIntensity() LATCHES each gate change to the next bar line
//      on the scheduler's own grid; the source ramped at currentTime;
//   6. (0.3.0) the sweep and the limiter, built once, between the track gain
//      and the duck;
//   7. (0.3.0) the dip node after the duck, and the onBeat report;
//   8. (0.4.0) the optional high-pass between the sweep and the limiter, and
//      setHighpass().
// Ported in 0.3.0: the intensity setter's gate loop and setDuck(). Each new
// group (gating, sweep, limiter, duck, highpass) is OPTIONAL: an absent group
// builds no node, and the music behaves as 0.2.0 did.
//
// createSfxPlayer() (0.2.0) is new here, not a port: one-shot and held voices
// built from recipe DATA, into the sfx bus. Its noise is injected too.

const AUDIO_VERSION = "0.4.0";

// The four buses, in build order. master goes to the output; the other three
// go to master. A bus nothing feeds yet is still built, so its volume row works.
const AUDIO_BUSES = ["master", "music", "sfx", "voice"];

// ⛔ A SECOND-ORDER BUTTERWORTH'S Q, IN dB — the units this audio API reads Q in
// for a low-pass or a high-pass. It is the flattest response with no peak at
// the cutoff, so a filter built with it is at or under unity at every
// frequency and cannot raise a host's headroom budget. The optional high-pass
// below is built at it, and is not a tunable: a peaking high-pass would be a
// different effect, not a louder one.
const AUDIO_BUTTERWORTH_Q = -3.0103;

// The high-pass's resting cutoff: 0 Hz is a pass-through, so "off" is a
// frequency and not a bypass switch — which is what lets it move by a time
// constant in both directions instead of clicking in and out of the path.
const AUDIO_HP_OFF_HZ = 0;

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

// An optional group of numbers: null when absent, and every named field
// required when present (a present group is the host saying it tunes them).
function audioGroup(opts, name, fields) {
  const g = opts[name];
  if (g === undefined) return null;
  if (!g || typeof g !== "object") throw new Error("createMusic: options." + name + " must be an object");
  for (let i = 0; i < fields.length; i++) audioRequireNum(g, "createMusic: options." + name, fields[i]);
  return g;
}

// The track loader. A track is DATA (GDD 11.3):
//   { stepDur, steps, bar, layers: [ { name, tier, type, cutoff, cutoffTo,
//     cutoffTime, q, hp, detune, drop, dropTime, noise, gain, atk, rel,
//     audition, beat, steps: [cell | null] } ] }      cell = { f, dur, g }
// A track may be null: a named silence.
// ⛔ A `tier` outside 1..4 is always an error (a threshold table has no key for
// it, so the layer would be silent forever). A tier in 1..4 needs the gating
// group, or it is a gate nobody opens or closes, and the track's `bar` (steps
// per bar, dividing `steps`), or there is no bar line to latch it to.
// `audition` is "pass", "fail" or absent. It is a mark for whoever tiers the
// track later, and the scheduler never reads it.
// `beat` is true or absent: each note of a marked layer is reported to onBeat.
function audioCheckTracks(tracks, gating) {
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
    if (track.bar !== undefined && (!Number.isInteger(track.bar) || track.bar < 1 || track.steps % track.bar !== 0)) {
      throw new Error(at + ": bar must be a positive integer that divides steps");
    }
    for (let i = 0; i < track.layers.length; i++) {
      const layer = track.layers[i];
      const la = at + " layer " + i;
      if (!layer || !Array.isArray(layer.steps)) throw new Error(la + ": steps must be an array");
      if (layer.tier !== undefined) {
        if (!Number.isInteger(layer.tier) || layer.tier < 1 || layer.tier > 4) {
          throw new Error(la + ": tier must be an integer in 1..4");
        }
        if (!gating) throw new Error(la + ": a tier needs options.gating");
        if (track.bar === undefined) throw new Error(la + ": a tier needs the track's bar");
      }
      if (layer.audition !== undefined && layer.audition !== "pass" && layer.audition !== "fail") {
        throw new Error(la + ": audition must be \"pass\", \"fail\" or absent");
      }
      if (layer.beat !== undefined && layer.beat !== true) throw new Error(la + ": beat must be true or absent");
    }
  }
}

// A gain's level at time t, off the breakpoints this module scheduled on it
// ([[t, v], ...], linear between them, flat outside). ⛔ Never a param's
// `.value`: during a ramp, and on a recording fake, that is not the level now.
function audioLevelAt(points, t) {
  if (!points.length || t <= points[0][0]) return points.length ? points[0][1] : 1;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (t < b[0]) return b[0] === a[0] ? b[1] : a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
  }
  return points[points.length - 1][1];
}

function audioClamp01(f) {
  return typeof f === "number" && isFinite(f) ? Math.max(0, Math.min(1, f)) : 0;
}

// createMusic(engine, { tracks, lookahead, crossfade, fadeOut, noise, layerSink,
//                       gating, sweep, limiter, duck, onBeat })
//   tracks     { name: track | null }, checked by audioCheckTracks
//   lookahead  s — each update(), schedule every step starting inside this window
//   crossfade  s — track-to-track fade on setState()
//   fadeOut    s — the fade when setState() names a silence
//   noise      () => number in [0, 1) — fills the noise buffer
//   layerSink  optional ({ ctx, track, index, layer, out }) => node | null
// The optional groups (0.3.0, 0.4.0). Absent, a group builds no node and
// changes nothing:
//   gating     { thresholds: { 2, 3, 4 }, ramp } — tier gates and setIntensity(f)
//   sweep      { minHz, maxHz, q, tc } — a low-pass and setSweep(f)
//   highpass   { hz, tc } — a Butterworth high-pass and setHighpass(on)
//   limiter    { threshold, knee, ratio, attack, release } — a compressor node
//   duck       { gain, ramp, dipGain, dipHold } — setDuck(on) and dip()
//   onBeat     optional (t) => void — each note of a `beat: true` layer, at its start
//
// Signal path: note envelopes -> layer gate -> [track gain, crossfaded]
//   -> [sweep] -> [highpass] -> [limiter] -> duck -> [dip] -> engine.music
// ⛔ The duck and the dip sit AFTER the limiter: in front of it, a 6 dB duck
// comes out as about 2 dB.
// ⛔ The high-pass sits BEFORE it, with the sweep: it is a tone change on the
// programme and belongs on the same side of the limiter as the other one, so
// what the limiter sees is the sound the host asked for.
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
  const gating   = audioGroup(opts, "gating", ["ramp"]);
  if (gating) {
    if (!gating.thresholds || typeof gating.thresholds !== "object") {
      throw new Error("createMusic: options.gating.thresholds must be an object");
    }
    for (const tier of [2, 3, 4]) audioRequireNum(gating.thresholds, "createMusic: options.gating.thresholds", tier);
  }
  const sweepOpts = audioGroup(opts, "sweep", ["minHz", "maxHz", "q", "tc"]);
  const hpOpts    = audioGroup(opts, "highpass", ["hz", "tc"]);
  const limitOpts = audioGroup(opts, "limiter", ["threshold", "knee", "ratio", "attack", "release"]);
  const duckOpts  = audioGroup(opts, "duck", ["gain", "ramp", "dipGain", "dipHold"]);
  if (opts.onBeat !== undefined && typeof opts.onBeat !== "function") {
    throw new Error("createMusic: options.onBeat must be a function");
  }
  const onBeat = opts.onBeat || null;
  const tracks = opts.tracks === undefined ? {} : opts.tracks;
  audioCheckTracks(tracks, gating);
  const sweepHz = f => sweepOpts.minHz * Math.pow(sweepOpts.maxHz / sweepOpts.minHz, f);

  return {
    duck: null,          // GainNode: the menu duck, after the limiter. Unity without the duck group
    dipNode: null,       // GainNode after the duck (duck group only): the event dips
    limiter: null,       // compressor node (limiter group only)
    highpass: null,      // high-pass BiquadFilterNode (highpass group only)
    sweep: null,         // low-pass BiquadFilterNode (sweep group only)
    inlet: null,         // the node a track gain feeds: the first of sweep, highpass, limiter, duck
    trackGain: null,     // GainNode for the currently-scheduled track; replaced (crossfaded) on setState
    state: "off",        // current track name, or a name with no track (silence)
    track: null,         // the active step table, or null for a silence
    step: 0,             // scheduler cursor into track.steps
    nextStepTime: 0,     // absolute ctx time of the next step to schedule
    layerGates: null,    // [{ node, tier, target, from, at }] parallel to this.track.layers, or null
    noiseBuf: null,      // lazily-built 2 s mono white-noise buffer, for `noise: true` layers
    intensity: 0,        // 0..1, held by setIntensity(); read only by the gates
    sweepLevel: 1,       // 0..1, held by setSweep(); 1 is fully open
    sweepTarget: null,   // Hz last targeted, so a per-frame setSweep() is idempotent
    highpassed: false,   // last high-pass target, so a per-frame setHighpass() is idempotent
    ducked: false,       // last duck target, so a per-frame setDuck() is idempotent
    duckLevels: [],      // breakpoints scheduled on the duck (audioLevelAt)
    dipLevels: [],       // breakpoints scheduled on the dip

    // Lazily build the post-track chain once the bus graph exists (first user
    // gesture), downstream first. Each node is built ONCE per graph, at the
    // level held so far: a level, not a change.
    ensureGraph() {
      if (this.duck || !engine.ctx || !engine.music) return;
      const ctx = engine.ctx;
      let out = engine.music;
      if (duckOpts) {
        this.dipNode = ctx.createGain();
        this.dipNode.gain.value = 1.0;
        this.dipNode.connect(out);
        out = this.dipNode;
      }
      this.duck = ctx.createGain();
      this.duck.gain.value = this.ducked ? duckOpts.gain : 1.0;   // honour a duck asked for before the graph
      this.duck.connect(out);
      out = this.duck;
      if (limitOpts) {
        const l = ctx.createDynamicsCompressor();
        l.threshold.value = limitOpts.threshold;
        l.knee.value = limitOpts.knee;
        l.ratio.value = limitOpts.ratio;
        l.attack.value = limitOpts.attack;
        l.release.value = limitOpts.release;
        l.connect(out);
        this.limiter = l;
        out = l;
      }
      // ⛔ AFTER THE LIMITER IN BUILD ORDER IS BEFORE IT IN SIGNAL ORDER: this
      // chain is wired downstream first, so the node built here feeds the
      // limiter and the sweep below feeds this one. Built at the level held so
      // far, never at a change, exactly like the duck.
      if (hpOpts) {
        const h = ctx.createBiquadFilter();
        h.type = "highpass";
        h.Q.value = AUDIO_BUTTERWORTH_Q;
        h.frequency.value = this.highpassed ? hpOpts.hz : AUDIO_HP_OFF_HZ;
        h.connect(out);
        this.highpass = h;
        out = h;
      }
      if (sweepOpts) {
        const s = ctx.createBiquadFilter();
        s.type = "lowpass";
        s.Q.value = sweepOpts.q;
        this.sweepTarget = sweepHz(this.sweepLevel);
        s.frequency.value = this.sweepTarget;
        s.connect(out);
        this.sweep = s;
        out = s;
      }
      this.inlet = out;
    },

    // A layer's gate level at the held intensity: 1 or 0, never between.
    gateTarget(tier) {
      if (!gating || !tier || tier === 1) return 1;
      return this.intensity >= gating.thresholds[tier] ? 1 : 0;
    },

    // The first bar line at or after `now`, on the scheduler's own grid: the
    // step under the cursor starts at nextStepTime, and a bar starts on every
    // step index divisible by the track's `bar`.
    nextBar(now) {
      const stepDur = this.track.stepDur, bar = this.track.bar;
      let k = Math.ceil((now - this.nextStepTime) / stepDur - 1e-9);
      const idx = (((this.step + k) % bar) + bar) % bar;
      if (idx) k += bar - idx;
      return this.nextStepTime + k * stepDur;
    },

    // The intensity setter, 0..1, clamped. OO's gate loop, idempotent: a gate
    // moves only when its target flips. DEPARTURE 5: ⛔ THE CHANGE LATCHES TO
    // THE NEXT BAR LINE, where the gate ramps over gating.ramp; the source
    // ramped at currentTime, and a layer entering mid-phrase sounds like a bug.
    // A flip back before that bar line withdraws the waiting change.
    setIntensity(f) {
      this.intensity = audioClamp01(f);
      if (!engine.ctx || !gating || !this.track || !this.layerGates) return;
      const now = engine.ctx.currentTime;
      let tBar = null;
      for (const lg of this.layerGates) {
        const target = this.gateTarget(lg.tier);
        if (target === lg.target) continue;
        const prev = lg.target, p = lg.node.gain;
        lg.target = target;
        if (lg.at >= now) {                      // still waiting for its bar line
          p.cancelScheduledValues(lg.at);
          const back = target === lg.from;
          lg.at = -Infinity;
          if (back) continue;
        }
        if (tBar === null) tBar = this.nextBar(now);
        lg.from = prev;
        lg.at = tBar;
        p.cancelScheduledValues(tBar);
        p.setValueAtTime(prev, tBar);
        p.linearRampToValueAtTime(target, tBar + gating.ramp);
      }
    },

    // The sweep, 0..1 (1 fully open): minHz * (maxHz / minHz)^f, moved with a
    // time constant so it never steps. It adds no notes, so it does not latch.
    setSweep(f) {
      this.sweepLevel = audioClamp01(f);
      if (!engine.ctx || !sweepOpts) return;
      this.ensureGraph();
      if (!this.sweep) return;
      const hz = sweepHz(this.sweepLevel);
      if (hz === this.sweepTarget) return;
      this.sweepTarget = hz;
      this.sweep.frequency.setTargetAtTime(hz, engine.ctx.currentTime, sweepOpts.tc);
    },

    // ⛔ THE HIGH-PASS, ON OR OFF (0.4.0). Idempotent under per-frame calls —
    // the host is expected to call it every frame with a boolean — so it
    // automates on the flip and on nothing else. ⛔ It MOVES BY setTargetAtTime
    // over highpass.tc and ⛔ NEVER by a bare .value after the graph is built:
    // a .value during a ramp is a step, and this one's whole job is to arrive
    // and leave without a click. "Off" is AUDIO_HP_OFF_HZ, a pass-through, so
    // the node stays in the path and the transition is a frequency move.
    setHighpass(on) {
      if (!hpOpts) return;
      on = !!on;
      if (on === this.highpassed) return;
      if (!engine.ctx) { this.highpassed = on; return; }   // no graph yet: ensureGraph honours it
      this.ensureGraph();                                  // build at the CURRENT level first
      this.highpassed = on;
      if (!this.highpass) return;
      this.highpass.frequency.setTargetAtTime(on ? hpOpts.hz : AUDIO_HP_OFF_HZ,
                                              engine.ctx.currentTime, hpOpts.tc);
    },

    // The menu duck, OO's setDuck: idempotent under per-frame calls, and ⛔ a
    // RAMP over duck.ramp, never a bare .value set.
    setDuck(on) {
      if (!duckOpts) return;
      on = !!on;
      if (on === this.ducked) return;
      if (!engine.ctx) { this.ducked = on; return; }   // no graph yet: ensureGraph honours it
      this.ensureGraph();                              // build at the CURRENT level first
      this.ducked = on;
      if (!this.duck) return;
      const t = engine.ctx.currentTime, p = this.duck.gain;
      const from = audioLevelAt(this.duckLevels, t), to = on ? duckOpts.gain : 1.0;
      p.cancelScheduledValues(t);
      p.setValueAtTime(from, t);
      p.linearRampToValueAtTime(to, t + duckOpts.ramp);
      this.duckLevels = [[t, from], [t + duckOpts.ramp, to]];
    },

    // An event dip (DEPARTURE 7): down to duck.dipGain over duck.ramp, held
    // duck.dipHold, back to unity over duck.ramp. Its own node, so a dip inside
    // a duck multiplies and neither cancels the other. A dip during a dip
    // starts again from the level it has reached.
    dip() {
      if (!duckOpts || !engine.ctx) return;
      this.ensureGraph();
      if (!this.dipNode) return;
      const t = engine.ctx.currentTime, p = this.dipNode.gain, r = duckOpts.ramp;
      const from = audioLevelAt(this.dipLevels, t), low = duckOpts.dipGain;
      p.cancelScheduledValues(t);
      p.setValueAtTime(from, t);
      p.linearRampToValueAtTime(low, t + r);
      p.setValueAtTime(low, t + r + duckOpts.dipHold);
      p.linearRampToValueAtTime(1.0, t + r + duckOpts.dipHold + r);
      this.dipLevels = [[t, from], [t + r, low], [t + r + duckOpts.dipHold, low], [t + r + duckOpts.dipHold + r, 1.0]];
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
        g.connect(this.inlet);
        this.trackGain = g;
        // One persistent gate per layer, built straight at its target for the
        // CURRENT intensity (OO's idiom): the track-level crossfade above fades
        // the whole track in, so a gate needs no ramp of its own. Later changes
        // latch to a bar line in setIntensity(). Without a tier a gate is open.
        this.layerGates = this.track.layers.map((layer, index) => {
          const node = ctx.createGain();
          const target = this.gateTarget(layer.tier);
          node.gain.value = target;
          const sink = layerSink ? layerSink({ ctx, track: s, index, layer, out: g }) : null;
          node.connect(sink || g);
          return { node, tier: layer.tier || 1, target, from: target, at: -Infinity };
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
        if (!cell) continue;
        this.playNote(layers[i], cell, t, i);
        if (onBeat && layers[i].beat) onBeat(t);     // DEPARTURE 7: the onset, on the context clock
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
// { set(t01), stop() }: set() moves every frequency to f * (to / f)^t01 on an
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

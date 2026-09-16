// test-cs010-p1.js — CS010 P1: kit-audio 0.3.0 (GDD 11.1, 11.5, 11.6, 11.8; plan §3).
// Asserts what P1 owns, on SYNTHETIC tables and the recording fake: the tier
// gates latch to the bar line on the scheduler's grid and ramp 0 <-> 1 over
// C.LAYER_CROSSFADE; setSweep follows D14 by setTargetAtTime; the limiter carries
// C.MUSIC_LIMIT; a graph walk proves every track reaches `music` only through
// sweep -> limiter -> duck -> dip; the duck and the dip ramp, stay in [0, 1] and
// get no bare .value; onBeat fires once per marked note at its start; absent
// groups build nothing; the loader's new refusals; the kit slice's boundary.
//
// ⛔ TRAPS.
//  1. The fake's `.value` is the LAST target, never the level now (_harness.js).
//     Every assertion reads the logged `t` and `v`.
//  2. Setter calls land OFF the grid on purpose (every 97 frames at 60 Hz), so
//     a setter scheduling at currentTime is red. Mutation-checked by hand
//     (log/CS010.md): nextBar() returning `now` turns this file red.
//  3. The fake's setTargetAtTime drops its time constant, so the sweep's is
//     read through a wrapper on that one param.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

installSeed(20261001);
const X = H.buildGame({ audio: true });
const { C } = X;
const rec = X._audio;
const ROOT = path.join(__dirname, "..");
const EPS = 1e-9;

for (const k of ["LAYER_THRESHOLD", "FILTER_Q", "FILTER_TC", "MUSIC_LIMIT", "MUSIC_DIP_GAIN", "MUSIC_DIP_HOLD"]) hasKnob(X, k, null, H);
hasKnob(X, "LAYER_CROSSFADE", { def: 0.03 }, H);
H.eq(C.LAYER_THRESHOLD[2], 0.25, "tier 2's threshold is 0.25 (D5)");
H.eq(C.LAYER_THRESHOLD[3], 0.40, "tier 3's threshold is 0.40 (D5)");
H.eq(C.LAYER_THRESHOLD[4], 0.80, "tier 4's key is unchanged (R10)");
H.eq(X.AUDIO_VERSION, "0.3.0", "kit-audio is 0.3.0");
// ⛔ D16: the curve model stands in for the render ONLY at the rendered settings (D2).
H.eq(JSON.stringify(C.MUSIC_LIMIT), JSON.stringify({ threshold: -24, knee: 0, ratio: 20, attack: 0.001, release: 0.10 }),
  "⛔ C.MUSIC_LIMIT is exactly the rendered limiter, D2 (the headroom model's premise)");

const GATING = { thresholds: C.LAYER_THRESHOLD, ramp: C.LAYER_CROSSFADE };
const SWEEP = { minHz: C.FILTER_MIN_HZ, maxHz: C.FILTER_MAX_HZ, q: C.FILTER_Q, tc: C.FILTER_TC };
const DUCK = { gain: C.MUSIC_DUCK_GAIN, ramp: C.MUSIC_DUCK_RAMP, dipGain: C.MUSIC_DIP_GAIN, dipHold: C.MUSIC_DIP_HOLD };
function opts(tracks, extra) {
  return Object.assign({ tracks, lookahead: C.MUSIC_LOOKAHEAD, crossfade: C.MUSIC_CROSSFADE,
    fadeOut: C.MUSIC_FADE_OUT, noise: X.mulberry32(C.AUDIO_NOISE_SEED) }, extra);
}
function throwsWith(f, re) { try { f(); } catch (err) { return re.test(err.message); } return false; }

// A synthetic table: 16 steps to a bar, 4 bars, 0.125 s steps (a bar is 2 s).
const STEP = 0.125, BAR = 16, STEPS = 64;
function row(pred) { const a = []; for (let s = 0; s < STEPS; s++) a.push(pred(s) ? { f: 220, dur: 1 } : null); return a; }
function synth(extra) {
  return Object.assign({ stepDur: STEP, steps: STEPS, bar: BAR, layers: [
    { name: "ground", type: "sine", gain: 0.1, atk: 0.004, rel: 0.1, steps: row(s => s % 4 === 0) },
    { name: "hook", tier: 2, type: "square", gain: 0.05, atk: 0.004, rel: 0.1, steps: row(s => s % 2 === 0) },
    { name: "groove", tier: 3, type: "triangle", gain: 0.05, atk: 0.001, rel: 0.05, steps: row(() => true) },
    { name: "kick", beat: true, type: "sine", gain: 0.2, atk: 0.003, rel: 0.1, steps: row(s => s % 8 === 3) },
  ] }, extra);
}

const untiered = () => Object.assign(synth(), { layers: synth().layers.map(l => Object.assign({}, l, { tier: undefined })) });

const A = X.AudioSys;
A.unlock();
const ctx = A.ctx;

// ---------------------------------------------------------------------------
// ⛔ the bar-line latch
// ---------------------------------------------------------------------------
{
  const M = X.createMusic(A, opts({ syn: synth() }, { gating: GATING }));
  const T0 = 10;
  ctx.currentTime = T0;
  rec.clear();
  M.setState("syn");
  const gates = M.layerGates.map(g => g.node);
  H.eq(M.layerGates.map(g => g.node.gain.value).join(","), "1,0,0,1", "at intensity 0 the gates are built at their targets");
  H.eq(rec.automation.filter(a => gates.includes(a.node)).length, 0, "a gate is BUILT at its level, not ramped");

  const LEVELS = [0.1, 0.3, 0.5, 0.2, 0.9, 0.0, 0.45, 0.26, 0.39, 1.0, 0.24];
  let calls = 0, offGrid = 0, past = 0, changes = 0, badRamp = 0, badTarget = 0;
  const bars = [];
  for (let f = 0; f <= 60 * 40; f++) {
    ctx.currentTime = T0 + f / 60;
    M.update();
    if (f % 97 === 0 && f > 0) {
      const now = ctx.currentTime;
      const from = rec.automation.length;
      M.setIntensity(LEVELS[calls++ % LEVELS.length]);
      const mine = rec.automation.slice(from).filter(a => gates.includes(a.node));
      for (const a of mine) {
        const n = (a.t - T0) / (BAR * STEP);
        if (a.fn !== "linearRampToValueAtTime" && Math.abs(n - Math.round(n)) > EPS) offGrid++;
        if (a.fn !== "linearRampToValueAtTime" && a.t < now - EPS) past++;
        if (a.fn === "setValueAtTime") {
          changes++;
          bars.push(a.t - now);
          const ramp = mine[mine.indexOf(a) + 1];
          if (!ramp || ramp.fn !== "linearRampToValueAtTime" || ramp.node !== a.node ||
              Math.abs(ramp.t - (a.t + C.LAYER_CROSSFADE)) > EPS) badRamp++;
          if (!(a.v === 0 || a.v === 1) || !ramp || !(ramp.v === 0 || ramp.v === 1) || ramp.v === a.v) badTarget++;
        }
      }
    }
  }
  H.assert(changes >= 10, `fixture: the gates changed many times (${changes})`);
  H.eq(offGrid, 0, "⛔ every gate change (cancel and start) lands on a bar line of the scheduler's grid");
  H.eq(past, 0, "⛔ no gate change is scheduled in the past");
  H.eq(badRamp, 0, "⛔ every gate change ramps from its bar line over C.LAYER_CROSSFADE");
  H.eq(badTarget, 0, "⛔ a gate moves only between 0 and 1");
  H.assert(bars.some(w => w > 0.5), "fixture: a change waited for a later bar line (the setter was off the grid)");
  H.assert(Math.max(...bars) <= BAR * STEP + EPS, "a change waits at most one bar");
  H.eq(rec.automation.filter(a => a.node === gates[0] || a.node === gates[3]).length, 0, "an untiered gate is never moved");
  H.eq(rec.valueSets.filter(v => gates.includes(v.node)).length, 4, "a gate gets no bare .value after it is built");

  // The tier's threshold decides the target: a change to 0.40 opens tier 3.
  ctx.currentTime += 0.77;
  M.setIntensity(0);
  ctx.currentTime += BAR * STEP + 0.1;                    // past that change's bar line and ramp
  const from = rec.automation.length;
  M.setIntensity(0.40);
  const opened = rec.automation.slice(from).filter(a => a.fn === "linearRampToValueAtTime");
  H.eq(opened.map(a => gates.indexOf(a.node) + ":" + a.v).join(","), "1:1,2:1", "at 0.40 tiers 2 and 3 open (>= threshold)");
  // A flip back before the bar line withdraws the change, and schedules no other.
  const from2 = rec.automation.length;
  M.setIntensity(0.1);
  const back = rec.automation.slice(from2);
  H.assert(back.length === 2 && back.every(a => a.fn === "cancelScheduledValues" && a.t === opened[0].t - C.LAYER_CROSSFADE),
    "⛔ a flip back before the bar line only cancels the waiting change, at its bar line");
  M.setIntensity(0.1);
  H.eq(rec.automation.length, from2 + 2, "setIntensity is idempotent: no flip, no automation");

  // After a stall the scheduler's cursor is behind the clock; the grid still holds.
  ctx.currentTime += 31.3;
  const from3 = rec.automation.length;
  M.setIntensity(1);
  const st = rec.automation.slice(from3).filter(a => a.fn === "setValueAtTime");
  const n = st.length ? (st[0].t - T0) / (BAR * STEP) : NaN;
  H.assert(st.length === 2 && Math.abs(n - Math.round(n)) < EPS && st[0].t >= ctx.currentTime - EPS,
    "⛔ with the cursor a stall behind, the change still lands on the next bar line");
  for (const [f, want] of [[-3, 0], [7, 1], [NaN, 0]]) {
    M.setIntensity(f);
    H.eq(M.intensity, want, `setIntensity clamps ${f} to ${want}`);
  }
}

// ---------------------------------------------------------------------------
// the sweep
// ---------------------------------------------------------------------------
{
  const M = X.createMusic(A, opts({ syn: synth() }, { gating: GATING, sweep: SWEEP }));
  ctx.currentTime = 200;
  M.ensureGraph();
  const S = M.sweep;
  H.assert(S && S.kind === "biquad" && S.type === "lowpass", "the sweep is a low-pass biquad");
  H.eq(S.Q.value, C.FILTER_Q, "its Q is C.FILTER_Q");
  H.assert(C.FILTER_Q <= -3.0103, "⛔ the sweep's Q has no peak (<= -3.0103 dB, R2)");
  H.eq(S.frequency.value, C.FILTER_MAX_HZ, "it is built fully open, at C.FILTER_MAX_HZ");
  const tcs = [];
  const real = S.frequency.setTargetAtTime;
  S.frequency.setTargetAtTime = function (v, t, tc) { tcs.push(tc); return real.call(this, v, t); };
  const sets = rec.valueSets.length;
  let bad = 0;
  for (const f of [0, 0.25, 0.5, 0.75, 1, 0.1]) {
    const from = rec.automation.length;
    ctx.currentTime += 0.1;
    M.setSweep(f);
    const a = rec.automation.slice(from);
    const want = C.FILTER_MIN_HZ * Math.pow(C.FILTER_MAX_HZ / C.FILTER_MIN_HZ, f);
    if (a.length !== 1 || a[0].node !== S || a[0].fn !== "setTargetAtTime" ||
        Math.abs(a[0].v - want) > 1e-6 || a[0].t !== ctx.currentTime) bad++;
  }
  H.eq(bad, 0, "⛔ setSweep(f) targets C.FILTER_MIN_HZ × (MAX / MIN)^f by setTargetAtTime, now (D14)");
  H.assert(tcs.length === 6 && tcs.every(tc => tc === C.FILTER_TC), "with the time constant C.FILTER_TC");
  const from = rec.automation.length;
  M.setSweep(0.1);
  H.eq(rec.automation.length, from, "setSweep is idempotent");
  M.setSweep(-1); M.setSweep(2);
  const ends = rec.automation.slice(from).map(a => a.v);
  H.assert(Math.abs(ends[0] - C.FILTER_MIN_HZ) < 1e-6 && Math.abs(ends[1] - C.FILTER_MAX_HZ) < 1e-6, "setSweep clamps to [0, 1]");
  H.eq(rec.valueSets.length, sets, "the sweep gets no bare .value after it is built");
}

// ---------------------------------------------------------------------------
// the game's instance: the limiter and ⛔ the route, on a build of its own, so
// no synthetic instance above has connected anything to its music bus
// ---------------------------------------------------------------------------
{
  const Z = H.buildGame({ audio: true });
  const M = Z.MusicSys, A = Z.AudioSys, rec = Z._audio;
  A.unlock();
  const ctx = A.ctx;
  ctx.currentTime = 300;
  M.setState("pulse");
  const L = M.limiter;
  H.assert(L && L.kind === "compressor", "the game's music has a limiter");
  for (const k of ["threshold", "knee", "ratio", "attack", "release"]) {
    H.eq(L[k].value, C.MUSIC_LIMIT[k], `the limiter's ${k} is C.MUSIC_LIMIT.${k}`);
  }
  M.setState("title");
  const into = node => rec.connections.filter(c => c.to === node).map(c => c.from);
  const trackGains = rec.connections.filter(c => c.to === M.sweep).map(c => c.from);
  H.assert(trackGains.length >= 2 && trackGains.includes(M.trackGain), "fixture: two tracks' gains were built");
  H.assert(into(A.music).every(n => n === M.dipNode) && into(A.music).length === 1, "⛔ only the dip feeds the music bus");
  H.assert(into(M.dipNode).length === 1 && into(M.dipNode)[0] === M.duck, "⛔ only the duck feeds the dip");
  H.assert(into(M.duck).length === 1 && into(M.duck)[0] === L, "⛔ only the limiter feeds the duck");
  H.assert(into(L).length === 1 && into(L)[0] === M.sweep, "⛔ only the sweep feeds the limiter");
  // Walk every path out of every track gain: each ends sweep -> limiter -> duck -> dip -> music.
  const outs = node => rec.connections.filter(c => c.from === node).map(c => c.to);
  let paths = 0, bad = 0;
  for (const g of trackGains) {
    const stack = [[g]];
    while (stack.length) {
      const p = stack.pop(), last = p[p.length - 1], next = outs(last);
      if (last === A.music || next.length === 0) {
        paths++;
        const tail = p.slice(1).map(n => n.id).join(">");
        if (tail !== [M.sweep, L, M.duck, M.dipNode, A.music].map(n => n.id).join(">")) bad++;
        continue;
      }
      for (const n of next) stack.push(p.concat([n]));
    }
  }
  H.assert(paths >= 2, `fixture: the walk found every track's path (${paths})`);
  H.eq(bad, 0, "⛔ no track gain reaches music except through sweep → limiter → duck → dip (§1.6)");
  H.assert(M.layerGates.every(g => outs(g.node).length === 1 && outs(g.node)[0] === M.trackGain),
    "every layer gate feeds its track gain");
  M.setState(Z.MUSIC_SILENCE);
}

// ---------------------------------------------------------------------------
// the duck and the dip
// ---------------------------------------------------------------------------
{
  // A duck asked for before any context is honoured at build (OO's idiom).
  const E = X.createAudioEngine({ volRamp: C.AUDIO_VOL_RAMP, vol: { master: 1, music: 1, sfx: 1, voice: 1 } });
  const early = X.createMusic(E, opts({}, { duck: DUCK }));
  early.setDuck(true);
  E.unlock();
  early.ensureGraph();
  H.eq(early.duck.gain.value, C.MUSIC_DUCK_GAIN, "a duck set before the context is built at C.MUSIC_DUCK_GAIN");

  const M = X.createMusic(A, opts({}, { duck: DUCK }));
  ctx.currentTime = 400;
  M.ensureGraph();
  const D = M.duck, P = M.dipNode;
  const sets = rec.valueSets.length, from = rec.automation.length;
  const log = () => rec.automation.slice(from).filter(a => a.node === D || a.node === P);

  M.setDuck(true);
  let a = log();
  H.assert(a.length === 3 && a[1].fn === "setValueAtTime" && a[1].v === 1 && a[2].fn === "linearRampToValueAtTime" &&
    a[2].v === C.MUSIC_DUCK_GAIN && Math.abs(a[2].t - (400 + C.MUSIC_DUCK_RAMP)) < EPS && a.every(x => x.node === D),
    "setDuck(true) ramps the duck to C.MUSIC_DUCK_GAIN over C.MUSIC_DUCK_RAMP");
  M.setDuck(true);
  H.eq(log().length, 3, "setDuck is idempotent");
  ctx.currentTime = 400 + C.MUSIC_DUCK_RAMP / 2;          // mid-ramp
  M.setDuck(false);
  a = log();
  const mid = 1 + (C.MUSIC_DUCK_GAIN - 1) / 2;
  H.assert(Math.abs(a[4].v - mid) < 1e-9 && a[5].v === 1, "a mid-ramp undo starts from the level reached, not the fake's .value");

  ctx.currentTime = 401;
  M.dip();
  a = log().slice(6);
  const t = 401, r = C.MUSIC_DUCK_RAMP, h = C.MUSIC_DIP_HOLD;
  const shape = a.map(x => `${x.fn}:${x.v === undefined ? "" : x.v}:${+(x.t - t).toFixed(9)}`).join(" ");
  H.eq(shape, `cancelScheduledValues::0 setValueAtTime:1:0 linearRampToValueAtTime:${C.MUSIC_DIP_GAIN}:${r} ` +
    `setValueAtTime:${C.MUSIC_DIP_GAIN}:${+(r + h).toFixed(9)} linearRampToValueAtTime:1:${+(r + h + r).toFixed(9)}`,
    "⛔ dip(): down over the ramp, held C.MUSIC_DIP_HOLD, back over the ramp");
  H.assert(a.every(x => x.node === P), "the dip moves only the dip node, so a dip inside a duck multiplies");
  ctx.currentTime = t + r + h + r / 2;                     // halfway back up
  M.dip();
  const again = log().slice(11);
  H.assert(Math.abs(again[1].v - (C.MUSIC_DIP_GAIN + (1 - C.MUSIC_DIP_GAIN) / 2)) < 1e-9,
    "a dip during a dip starts from the level reached");

  const all = log();
  H.assert(all.every(x => x.v === undefined || (x.v >= 0 && x.v <= 1)), "⛔ the duck and the dip never target above 1");
  H.assert(all.every(x => x.fn === "cancelScheduledValues" || x.fn === "setValueAtTime" || x.fn === "linearRampToValueAtTime"),
    "⛔ the duck and the dip only ramp (a pin, then a linear ramp)");
  H.eq(rec.valueSets.length, sets, "⛔ neither gets a bare .value after it is built");
}

// ---------------------------------------------------------------------------
// onBeat
// ---------------------------------------------------------------------------
{
  const beats = [];
  const M = X.createMusic(A, opts({ syn: untiered() }, { onBeat: t => beats.push(t) }));
  const T0 = 500;
  ctx.currentTime = T0;
  M.setState("syn");
  const kickGate = M.layerGates[3].node;
  const n0 = rec.nodes.length;
  for (let f = 0; f < 60 * 20; f++) { ctx.currentTime = T0 + f / 60; M.update(); }
  const kicks = rec.nodes.slice(n0).filter(n => n.kind === "gain" && rec.connections.some(c => c.from === n && c.to === kickGate));
  const starts = kicks.map(g => rec.automation.find(x => x.node === g).t);
  H.assert(kicks.length >= 20, `fixture: the beat layer played (${kicks.length})`);
  H.eq(beats.length, kicks.length, "⛔ onBeat fires once per note of the beat layer, and for no other layer");
  H.assert(beats.every((t, i) => t === starts[i]), "⛔ each at its note's start time");
  const loops = Math.floor(kicks.length / 8);
  H.assert(beats.slice(0, loops * 8).every((t, i) => Math.abs(t - (T0 + (3 + 8 * i) * STEP)) < 1e-6), "on steps 3, 11, 19 …");
}

// ---------------------------------------------------------------------------
// absent groups, and the loader
// ---------------------------------------------------------------------------
{
  const before = Object.assign({}, rec.created);
  const M = X.createMusic(A, opts({ plain: untiered() }));
  ctx.currentTime = 600;
  const fromA = rec.automation.length;
  M.setState("plain");
  H.eq((rec.created.compressor || 0) - (before.compressor || 0), 0, "no limiter group: no compressor");
  H.eq((rec.created.biquad || 0) - (before.biquad || 0), 0, "no sweep group: no low-pass");
  H.assert(M.sweep === null && M.limiter === null && M.dipNode === null, "no group: no sweep, limiter or dip node");
  H.assert(M.inlet === M.duck && rec.connections.some(c => c.from === M.duck && c.to === A.music), "and the path is 0.2.0's");
  const trackAuto = rec.automation.length;
  M.setIntensity(1); M.setSweep(0); M.setDuck(true); M.dip();
  H.eq(rec.automation.length, trackAuto, "with no groups, the setters change nothing");
  H.assert(rec.automation.slice(fromA).every(a => a.node === M.trackGain), "fixture: only the track fade-in was scheduled");

  const make = (t, extra) => () => X.createMusic(A, opts({ t }, extra));
  const tiered = synth();
  H.assert(throwsWith(make(tiered), /a tier needs options\.gating/), "⛔ a tier without the gating group throws");
  H.assert(throwsWith(make(synth({ bar: undefined }), { gating: GATING }), /a tier needs the track's bar/),
    "⛔ a tier without the track's bar throws");
  H.assert(!throwsWith(make(tiered, { gating: GATING }), /./), "a tier with both loads");
  H.assert(throwsWith(make(synth({ bar: 12 }), { gating: GATING }), /bar must be/), "a bar that does not divide steps throws");
  const badTier = synth(); badTier.layers[1] = Object.assign({}, badTier.layers[1], { tier: 5 });
  H.assert(throwsWith(make(badTier, { gating: GATING }), /tier must be an integer in 1\.\.4/), "⛔ tier 5 still throws, gating or not");
  const badBeat = synth(); badBeat.layers[3] = Object.assign({}, badBeat.layers[3], { beat: 1 });
  H.assert(throwsWith(make(badBeat, { gating: GATING }), /beat must be true/), "beat must be true or absent");
  H.assert(throwsWith(make(null, { sweep: { minHz: 1, maxHz: 2, q: 0 } }), /options\.sweep: options\.tc/), "a present group requires every number");
  H.assert(throwsWith(make(null, { gating: { ramp: 1, thresholds: { 2: 0.1, 3: 0.2 } } }), /thresholds/), "gating requires thresholds 2, 3 and 4");
  H.assert(throwsWith(make(null, { onBeat: 3 }), /onBeat must be a function/), "onBeat must be a function");
}

// ---------------------------------------------------------------------------
// the built file
// ---------------------------------------------------------------------------
{
  const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
  const i = script.indexOf("\n// 16-audio-engine.js"), j = script.indexOf("\n// 17-audio-tracks.js");
  const kit = i >= 0 && j > i ? script.slice(i, j) : "";
  H.assert(kit.includes("setIntensity(f)") && kit.includes("createDynamicsCompressor()"), "the kit-audio slice is real");
  H.assert(!/\bC\./.test(kit), "⛔ kit-audio has no C.");
  H.assert(!/\bstate\s*[.[]/.test(kit), "⛔ kit-audio reads no game state");
  H.assert(/### 2026-09-16 — the gates, the sweep, the limiter, the duck \(`VERSION` 0\.2\.0 → 0\.3\.0\)/
    .test(fs.readFileSync(path.join(ROOT, "src", "16-audio-engine.NOTES.md"), "utf8")),
    "src/16-audio-engine.NOTES.md carries the 0.3.0 entry");
}

H.report("test-cs010-p1.js");

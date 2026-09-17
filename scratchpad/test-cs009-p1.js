// test-cs009-p1.js — CS009 P1: the audio engine (GDD 11.1–11.2, 15.7; plan §3).
// Asserts what P1 owns: kit-input 0.7.0's onGesture (which events call it);
// the headless no-op path; unlock() and the four buses; setVol()'s ramp; the
// track loader's tier and audition checks; the scheduler on a SYNTHETIC table
// (the lookahead window, drift over 10 minutes, the stall resync, every layer
// scheduled whatever its mark, nodes per step under C.MUSIC_STEP_NODE_MAX); the
// four departures from Orbital Overhaul; and the built-file scans.
//
// ⛔ TRAPS.
//  1. No track exists in P1, so every scheduler case builds its OWN instance
//     through createMusic() with the game's C values, on the game's AudioSys.
//  2. The fake's clock is the test's: every case writes ctx.currentTime.
//  3. The timer scan strips comments first: C's MUSIC_LOOKAHEAD comment names
//     both timers (plan §1.4). Character scanner, never a regex.
//  4. Mutation-checked by hand (log/CS009.md): delete the resync block, and
//     skip a layer in scheduleStep. Both turn this file red.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

installSeed(20260916);
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));

function sliceModules(src) {
  const re = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;
  const marks = [];
  let m;
  while ((m = re.exec(src)) !== null) marks.push({ name: m[1].trim(), head: m.index, body: m.index + m[0].length });
  const out = {};
  for (let i = 0; i < marks.length; i++) {
    out[marks[i].name] = src.slice(marks[i].body, i + 1 < marks.length ? marks[i + 1].head : src.length);
  }
  return out;
}

// test-cs007-p4.js's character scanner, copied deliberately (its header says why).
function stripComments(src) {
  let out = "", i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c; i++;
      while (i < n) {
        if (src[i] === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c; i++;
  }
  return out;
}

// A DOM target that records its listeners, so a case can fire one event type.
function fakeTarget() {
  const l = {};
  return {
    l,
    addEventListener(type, fn) { (l[type] = l[type] || []).push(fn); },
    removeEventListener(type, fn) { if (l[type]) l[type] = l[type].filter(f => f !== fn); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    fire(type, ev) { for (const f of (l[type] || []).slice()) f(Object.assign({ preventDefault() {} }, ev)); },
  };
}
const TOUCH = { changedTouches: [{ identifier: 7, clientX: 640, clientY: 700 }] };

function inputOpts(C, extra) {
  return Object.assign({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS, keySpeedMin: C.KEY_SPEED_MIN,
    keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP, pointerLockOffer: false,
    touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC, touchAutofire: C.TOUCH_AUTOFIRE,
    touchButtonR: C.TOUCH_BUTTON_R, gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: false, worldW: C.WORLD_W, worldH: C.WORLD_H,
  }, extra);
}

// ---------------------------------------------------------------------------
// headless: the default build has no audio API, and nothing throws
// ---------------------------------------------------------------------------
{
  const X = H.buildGame();
  const { C, AudioSys, MusicSys } = X;
  H.assert(X._audio === null, "the default build installs no fake");
  H.eq(X.AUDIO_VERSION, "0.4.0", "kit-audio is 0.4.0");   // CS012 P5: the optional high-pass, MINOR
  H.assert(AudioSys && MusicSys, "AudioSys and MusicSys exist");
  for (const k of ["AUDIO_NOISE_SEED", "AUDIO_VOL_RAMP"]) hasKnob(X, k, null, H);
  hasKnob(X, "AUDIO_VOL_STEPS", { def: 10 }, H);
  hasKnob(X, "AUDIO_VOL_DEFAULT", { def: 10 }, H);
  hasKnob(X, "MUSIC_STEP_NODE_MAX", { def: 16 }, H);
  let threw = null;
  try {
    H.eq(AudioSys.unlock(), false, "headless: unlock() reports no context");
    AudioSys.setVol("music", 0.5);
    H.eq(AudioSys.vol.music, 0.5, "headless: setVol() still holds the level");
    H.eq(AudioSys.now(), 0, "headless: now() is 0");
    MusicSys.ensureGraph(); MusicSys.setState("anything"); MusicSys.update();
    MusicSys.scheduleStep(0, 0); MusicSys.ensureNoiseBuf();
    MusicSys.playNote({ gain: 1, steps: [] }, { f: 440, dur: 1 }, 0, 0);
    X.Game.frame(0); X.Game.frame(1000);
  } catch (err) { threw = err; }
  H.assert(threw === null, `headless: no audio entry point throws (${threw && threw.message})`);
  H.assert(AudioSys.ctx === null, "headless: ctx stays null");
  for (const bus of X.AUDIO_BUSES) H.assert(AudioSys[bus] === null, `headless: no ${bus} bus`);
  H.assert(MusicSys.duck === null && MusicSys.noiseBuf === null && MusicSys.state === "off",
    "headless: the music system built nothing and changed no state");
}

// ---------------------------------------------------------------------------
// kit-input 0.7.0: onGesture, on a fresh instance
// ---------------------------------------------------------------------------
{
  const X = H.buildGame();
  const { C } = X;
  const ver = X.createInput(inputOpts(C)).VERSION.split(".").map(Number);
  H.assert(ver[0] > 0 || ver[1] >= 7, "kit-input is at least 0.7.0");
  H.assert(/### 2026-09-16 — a user-gesture callback \(`VERSION` 0\.6\.0 → 0\.7\.0\)/
    .test(fs.readFileSync(path.join(ROOT, "src", "04-input.NOTES.md"), "utf8")),
    "src/04-input.NOTES.md carries the 0.7.0 entry");

  let calls = 0;
  const input = X.createInput(inputOpts(C, { onGesture: () => { calls++; } }));
  const doc = fakeTarget(), win = fakeTarget(), el = fakeTarget();
  input.attach({ document: doc, window: win, element: el });
  const cases = [
    [doc, "keyup", { key: "z" }, 0],
    [el, "mousemove", { movementX: 4 }, 0],
    [el, "touchstart", TOUCH, 0],
    [el, "touchcancel", TOUCH, 0],
    [win, "mouseup", { button: 0 }, 0],
    [el, "contextmenu", {}, 0],
    [doc, "keydown", { key: "z" }, 1],
    [doc, "keydown", { key: "q" }, 1],        // an unbound key is still a gesture
    [el, "mousedown", { button: 0 }, 1],
    [el, "mousedown", { button: 2 }, 1],
    [el, "touchstart", TOUCH, 0],
    [el, "touchend", TOUCH, 1],
  ];
  for (const [target, type, ev, want] of cases) {
    const before = calls;
    target.fire(type, ev);
    H.eq(calls - before, want, `onGesture is called ${want} time(s) by ${type}`);
  }
  const before = calls;
  input.keyDown("z"); input.setButton("fire", true); input.touchStart(3, 600, 700); input.touchEnd(3);
  const pad = { buttons: [], axes: [0] };
  for (let i = 0; i < 16; i++) pad.buttons.push({ pressed: i === 14 || i === 0 });
  input.pollGamepads({ navigator: { getGamepads: () => [pad] } });
  input.sample(C.FIXED_DT, { rotate: 0, fire: false, purge: false, jump: false });
  H.eq(calls - before, 0, "the sink, a gamepad poll and sample() never call onGesture");

  const plain = X.createInput(inputOpts(C));
  const d2 = fakeTarget(), e2 = fakeTarget();
  plain.attach({ document: d2, window: fakeTarget(), element: e2 });
  let threw = null;
  try { d2.fire("keydown", { key: "z" }); e2.fire("mousedown", { button: 0 }); e2.fire("touchend", TOUCH); }
  catch (err) { threw = err; }
  H.assert(threw === null, "without onGesture the three handlers run as 0.6.0 did");
}

// ---------------------------------------------------------------------------
// the game's wiring, unlock() and the bus graph
// ---------------------------------------------------------------------------
const XA = H.buildGame({ audio: true });
const { C } = XA;
const A = XA.AudioSys;
const rec = XA._audio;
{
  const doc = fakeTarget(), win = fakeTarget(), el = fakeTarget();
  XA.Game.input.attach({ document: doc, window: win, element: el });
  doc.fire("keyup", { key: "z" });
  el.fire("mousemove", { movementX: 3 });
  el.fire("touchstart", TOUCH);
  H.assert(A.ctx === null && rec.contexts.length === 0, "keyup, mousemove and touchstart create no context");

  A.setVol("sfx", 0.3);                      // held before the context exists
  doc.fire("keydown", { key: "z" });
  H.assert(A.ctx !== null && rec.contexts.length === 1, "a key press through the game's input creates the context");
  const unity = C.AUDIO_VOL_DEFAULT / C.AUDIO_VOL_STEPS;
  H.eq(unity, 1, "the default level is unity (A2)");
  const gains = rec.created.gain;
  H.eq(gains, 4, "unlock() builds exactly four gain nodes");
  for (const bus of ["master", "music", "sfx", "voice"]) {
    const g = A[bus];
    H.assert(g && g.kind === "gain", `the ${bus} bus is a gain node`);
    const out = rec.connections.filter(c => c.from === g);
    H.eq(out.length, 1, `the ${bus} bus has one output`);
    H.assert(out[0] && out[0].to === (bus === "master" ? A.ctx.destination : A.master),
      `the ${bus} bus feeds ${bus === "master" ? "the destination" : "master"}`);
    H.eq(g.gain.value, bus === "sfx" ? 0.3 : unity, `the ${bus} bus is built at its held level`);
  }

  A.ctx.state = "suspended";
  el.fire("mousedown", { button: 0 });
  H.eq(rec.resumes, 1, "a later gesture resumes a suspended context");
  H.eq(A.ctx.state, "running", "and it is running");
  el.fire("touchend", TOUCH);
  doc.fire("keydown", { key: "x" });
  H.eq(A.unlock(), true, "unlock() reports the context");
  H.eq(rec.contexts.length, 1, "unlock() is idempotent: one context");
  H.eq(rec.created.gain, gains, "unlock() is idempotent: no second set of buses");
  H.eq(rec.resumes, 1, "a running context is not resumed again");

  // setVol ramps and never writes a bare .value.
  rec.clear();
  A.ctx.currentTime = 5;
  for (const bus of XA.AUDIO_BUSES) {
    const before = A[bus].gain.value;
    rec.automation.length = 0;
    A.setVol(bus, 0.4);
    const a = rec.automation.filter(e => e.node === A[bus]);
    H.eq(a.length, 3, `setVol(${bus}) schedules three automation calls`);
    H.assert(a[0] && a[0].fn === "cancelScheduledValues" && a[0].t === 5, `setVol(${bus}) cancels from now`);
    H.assert(a[1] && a[1].fn === "setValueAtTime" && a[1].v === before && a[1].t === 5,
      `setVol(${bus}) pins the current level at now`);
    H.assert(a[2] && a[2].fn === "linearRampToValueAtTime" && a[2].v === 0.4 && a[2].t === 5 + C.AUDIO_VOL_RAMP,
      `setVol(${bus}) ramps to the level over C.AUDIO_VOL_RAMP`);
    H.eq(A.vol[bus], 0.4, `setVol(${bus}) holds the level`);
  }
  H.eq(rec.valueSets.length, 0, "⛔ setVol never writes a bare .value");
  let bad = 0;
  for (const f of [() => A.setVol("drums", 1), () => A.setVol("music", NaN), () => A.setVol("music", -0.1)]) {
    try { f(); } catch (err) { bad++; }
  }
  H.eq(bad, 3, "setVol throws on an unknown bus and a bad level");
}

// ---------------------------------------------------------------------------
// the track loader
// ---------------------------------------------------------------------------
function musicOpts(tracks, extra) {
  return Object.assign({
    tracks, lookahead: C.MUSIC_LOOKAHEAD, crossfade: C.MUSIC_CROSSFADE,
    fadeOut: C.MUSIC_FADE_OUT, noise: XA.mulberry32(C.AUDIO_NOISE_SEED),
  }, extra);
}
function oneLayer(fields) {
  return { t: { stepDur: 0.2, steps: 4, layers: [Object.assign({ type: "sine", gain: 0.1, steps: [null, null, null, null] }, fields)] } };
}
function throwsWith(f, re) {
  try { f(); } catch (err) { return re.test(err.message); }
  return false;
}
{
  const make = t => () => XA.createMusic(A, musicOpts(t));
  for (const tier of [0, 5, 2.5, "2"]) {
    H.assert(throwsWith(make(oneLayer({ tier })), /tier must be an integer in 1\.\.4/),
      `⛔ the loader refuses tier ${JSON.stringify(tier)} as outside 1..4`);
  }
  // CS010 P1 rewrote these in place: the setter is ported, so a tier in 1..4 is
  // accepted, given the gating group and the track's bar.
  const gating = { thresholds: C.LAYER_THRESHOLD, ramp: C.LAYER_CROSSFADE };
  for (const tier of [1, 2, 3, 4]) {
    const t = oneLayer({ tier });
    t.t.bar = 4;
    H.assert(!throwsWith(() => XA.createMusic(A, musicOpts(t, { gating })), /./),
      `⛔ the loader accepts tier ${tier} (with gating and bar)`);
  }
  H.assert(throwsWith(make(oneLayer({ audition: "maybe" })), /audition must be/), "the loader refuses a bad audition mark");
  for (const audition of ["pass", "fail", undefined]) {
    H.assert(!throwsWith(make(oneLayer({ audition })), /./), `the loader accepts audition ${audition}`);
  }
  H.assert(!throwsWith(make({ silence: null }), /./), "a null track is a named silence");
  H.assert(throwsWith(() => XA.createMusic(A, musicOpts({}, { noise: undefined })), /noise must be a function/),
    "createMusic requires the noise generator");
  H.assert(throwsWith(() => XA.createMusic(A, musicOpts({}, { lookahead: undefined })), /lookahead/),
    "createMusic requires the lookahead");
}

// ---------------------------------------------------------------------------
// the scheduler, on a synthetic table
// ---------------------------------------------------------------------------
const STEP = 0.17, STEPS = 16, F = 440;
const reads = [];
let recording = false;
function watched(layer) {
  return new Proxy(layer, { get(t, k) { if (recording && typeof k === "string") reads.push(k); return t[k]; } });
}
function cells(pred, dur) {
  const a = [];
  for (let s = 0; s < STEPS; s++) a.push(pred(s) ? { f: F, dur, g: 0.9 } : null);
  return a;
}
// Four layers exercising every branch of playNote. Step 0 is the worst step:
// lead 5 (gain, low-pass, high-pass, two oscillators) + bass 2 + hat 3 (gain,
// high-pass, buffer source) + pad 4 (gain, low-pass, two oscillators) = 14.
const SYN_LAYERS = [
  { name: "lead", type: "square", cutoff: 800, cutoffTo: 2000, cutoffTime: 0.05, q: 3, hp: 200, detune: 7,
    gain: 0.05, atk: 0.01, rel: 0.1, steps: cells(() => true, 1) },
  { name: "bass", type: "sine", gain: 0.07, atk: 0.01, rel: 0.2, steps: cells(s => s % 2 === 0, 2) },
  { name: "hat", noise: true, hp: 6000, gain: 0.01, atk: 0.001, rel: 0.03, audition: "fail",
    steps: cells(s => s % 4 === 0, 1) },
  { name: "pad", type: "triangle", cutoff: 900, detune: 10, gain: 0.04, atk: 0.5, rel: 1, audition: "pass",
    steps: cells(s => s === 0, 16) },
];
const NOTES_PER_LOOP = SYN_LAYERS.map(l => l.steps.filter(Boolean).length);
const SYN = { stepDur: STEP, steps: STEPS, layers: SYN_LAYERS.map(watched) };

function distinctStarts(from) {
  const ts = [];
  for (let i = from || 0; i < rec.starts.length; i++) {
    const t = rec.starts[i].t;
    if (!ts.length || Math.abs(ts[ts.length - 1] - t) > 1e-9) ts.push(t);
  }
  return ts;
}

// the lookahead window
{
  const sinks = [];
  const M = XA.createMusic(A, musicOpts({ syn: SYN, quiet: null }, {
    layerSink: arg => { sinks.push(arg); if (arg.index !== 1) return null; const n = arg.ctx.createGain(); n.connect(arg.out); return n; },
  }));
  H.assert("intensity" in M && typeof M.setIntensity === "function" && typeof M.setDuck === "function",
    "⛔ the intensity setter and menu ducking are ported (CS010)");
  // The game's instance, for the route below (CS010 P1): read before the clear.
  const GM = XA.MusicSys;
  GM.setState("title");
  const feeds = (from, to) => !!from && !!to && rec.connections.some(c => c.from === from && c.to === to);
  // ⛔ CS012 P5 inserted the high-pass between the sweep and the limiter (GDD
  // 11.1). The CLAIM is unchanged — the game's music reaches the bus down one
  // named chain and no other — and only the chain moved.
  const gameRoute = feeds(GM.trackGain, GM.sweep) && feeds(GM.sweep, GM.highpass) &&
    feeds(GM.highpass, GM.limiter) && feeds(GM.limiter, GM.duck) &&
    feeds(GM.duck, GM.dipNode) && feeds(GM.dipNode, A.music) && GM.limiter.kind === "compressor";
  GM.setState(XA.MUSIC_SILENCE);
  A.ctx.currentTime = 1.0;
  rec.clear();
  M.setState("syn");
  H.assert(M.duck && M.duck.gain.value === 1, "the duck node is built at unity");
  H.assert(rec.connections.some(c => c.from === M.duck && c.to === A.music), "the duck feeds the music bus");
  H.assert(M.trackGain && rec.connections.some(c => c.from === M.trackGain && c.to === M.duck) && gameRoute,
    "the track gain feeds the duck with no groups, and the game's goes track gain → sweep → high-pass → limiter → duck → dip → music");
  H.eq(M.layerGates.length, SYN_LAYERS.length, "one gate per layer");
  H.assert(M.layerGates.every(g => g.node.gain.value === 1), "every gate is open");

  // DEPARTURE 4: layerSink.
  H.eq(sinks.length, SYN_LAYERS.length, "layerSink is called once per layer on setState");
  H.assert(sinks.every((s, i) => s.index === i && s.track === "syn" && s.out === M.trackGain && s.ctx === A.ctx),
    "layerSink is handed the context, the track name, the index and the track gain");
  for (let i = 0; i < SYN_LAYERS.length; i++) {
    const out = rec.connections.filter(c => c.from === M.layerGates[i].node);
    const want = i === 1 ? out.length === 1 && out[0].to.kind === "gain" && out[0].to !== M.trackGain
                         : out.length === 1 && out[0].to === M.trackGain;
    H.assert(want, `gate ${i} feeds ${i === 1 ? "the node layerSink returned" : "the track gain (layerSink returned null)"}`);
  }

  M.update();
  let ts = distinctStarts();
  H.eq(ts.length, 2, "at t=1.0 the first update() schedules exactly the steps before 1.2");
  H.assert(Math.abs(ts[0] - 1.0) < 1e-9 && Math.abs(ts[1] - 1.17) < 1e-9, "at 1.0 and 1.17");
  H.eq(M.step, 2, "the cursor stands on step 2");
  M.update();
  H.eq(distinctStarts().length, 2, "a second update() at the same time schedules nothing");
  A.ctx.currentTime = 1.13;                  // horizon 1.33: step 2 at 1.34 is outside
  M.update();
  H.eq(distinctStarts().length, 2, "at t=1.13 step 2 (1.34) is still outside the window");
  A.ctx.currentTime = 1.15;                  // horizon 1.35
  M.update();
  ts = distinctStarts();
  H.eq(ts.length, 3, "at t=1.15 exactly step 2 joins");
  H.assert(Math.abs(ts[2] - 1.34) < 1e-9, "at 1.34");

  M.setState("quiet");
  const fade = rec.automation.filter(e => e.fn === "linearRampToValueAtTime" && e.v === 0.0001);
  H.assert(fade.length === 1 && Math.abs(fade[0].t - (1.15 + C.MUSIC_FADE_OUT)) < 1e-9,
    "a named silence fades the track out over fadeOut");
  H.assert(M.trackGain === null && M.track === null, "and the scheduler idles");
  const n = rec.starts.length;
  A.ctx.currentTime = 3; M.update();
  H.eq(rec.starts.length, n, "an idle scheduler schedules nothing");
}

// drift, every layer scheduled, and the stall
{
  const M = XA.createMusic(A, musicOpts({ syn: SYN }));
  const T0 = 100;
  A.ctx.currentTime = T0;
  rec.clear();
  M.setState("syn");
  const gateOf = new Map(M.layerGates.map((g, i) => [g.node, i]));
  reads.length = 0;
  recording = true;
  const FRAMES = 36000;                        // 10 minutes at 60 Hz
  for (let f = 0; f <= FRAMES; f++) {           // frame 0 is setState's own instant
    A.ctx.currentTime = T0 + f / 60;
    M.update();
  }
  recording = false;
  const ts = distinctStarts();
  const steps = ts.length;
  H.assert(steps > 3500, `10 minutes schedule ~3,530 steps (got ${steps})`);
  let worst = 0;
  for (let k = 0; k < steps; k++) worst = Math.max(worst, Math.abs(ts[k] - (T0 + k * STEP)));
  H.assert(worst < 1e-6, `⛔ every step starts within 1e-6 s of T0 + k * stepDur over 10 minutes (worst ${worst})`);
  const drift = M.nextStepTime - T0 - steps * STEP;
  H.assert(Math.abs(drift) < 1e-6, `⛔ the cursor's drift after 10 minutes is < 1e-6 s (${drift})`);
  H.eq(M.step, steps % STEPS, "the step cursor agrees with the clock");

  // ⛔ every layer, every note, whatever its mark
  const loops = Math.floor(steps / STEPS), tail = steps % STEPS;
  for (let i = 0; i < SYN_LAYERS.length; i++) {
    let want = loops * NOTES_PER_LOOP[i];
    for (let s = 0; s < tail; s++) if (SYN_LAYERS[i].steps[s]) want++;
    const got = rec.connections.filter(c => gateOf.get(c.to) === i).length;
    H.eq(got, want, `⛔ layer ${SYN_LAYERS[i].name} (audition ${SYN_LAYERS[i].audition || "absent"}) gets every note`);
  }
  H.assert(reads.length > 0, "the read log is live");
  for (const k of ["audition", "tier", "intensity"]) {
    H.assert(!reads.includes(k), `⛔ scheduling never reads a layer's ${k}`);
  }
  const src = M.scheduleStep.toString() + M.playNote.toString() + M.update.toString();
  H.assert(!/intensity|audition|tier/.test(stripComments(src)), "⛔ update, scheduleStep and playNote name no intensity, audition or tier");

  // DEPARTURE 1: the noise buffer is the injected stream.
  H.assert(M.noiseBuf !== null, "the hat layer built the noise buffer");
  const d = M.noiseBuf ? M.noiseBuf.getChannelData(0) : [], ref = XA.mulberry32(C.AUDIO_NOISE_SEED);
  let same = d.length === A.ctx.sampleRate * 2;
  for (let i = 0; i < d.length && same; i++) same = d[i] === Math.fround(ref() * 2 - 1);
  H.assert(same, "⛔ the noise buffer is exactly mulberry32(C.AUDIO_NOISE_SEED), mapped to [-1, 1)");
  H.eq(rec.buffers, 1, "the noise buffer is built once");

  // ⛔ DEPARTURE 2: a 60 s stall. ⚠ STEPS ARE COUNTED BY THE LEAD LAYER'S
  // NOTES (one on every step), NEVER BY DISTINCT START TIMES: the burst this
  // guards against clamps every missed step to the same instant, and a
  // distinct-time count reads 353 steps as one.
  const leadNotes = () => rec.connections.filter(c => gateOf.get(c.to) === 0).length;
  const phaseStep = M.step, phaseTime = M.nextStepTime;
  const now = T0 + FRAMES / 60 + 60;
  A.ctx.currentTime = now;
  const from = rec.starts.length, leadFrom = leadNotes();
  M.update();
  const burst = leadNotes() - leadFrom;
  const bound = Math.ceil(C.MUSIC_LOOKAHEAD / STEP) + 1;
  H.assert(burst >= 1 && burst <= bound,
    `⛔ one update() after a 60 s gap schedules 1..${bound} steps (got ${burst})`);
  H.assert(rec.starts.slice(from).every(s => s.t >= now - 1e-9), "nothing is scheduled into the past");
  const advanced = Math.round((M.nextStepTime - phaseTime) / STEP);
  H.eq(M.step, (phaseStep + advanced) % STEPS, "⛔ the resync keeps bar phase: the cursor moved with the clock");
  H.assert(M.nextStepTime >= now + C.MUSIC_LOOKAHEAD && M.nextStepTime < now + C.MUSIC_LOOKAHEAD + STEP,
    "and the next step is the first one past the window");
  A.ctx.currentTime = now + 1 / 60;
  const lead2 = leadNotes();
  M.update();
  H.assert(leadNotes() - lead2 <= 1, "the frame after the stall is an ordinary frame");
}

// worst nodes per step
{
  const M = XA.createMusic(A, musicOpts({ syn: SYN }));
  A.ctx.currentTime = 2000;
  M.setState("syn");
  M.ensureNoiseBuf();
  let worst = 0, worstStep = -1;
  for (let s = 0; s < STEPS; s++) {
    const before = rec.nodes.length;
    M.scheduleStep(s, 2000 + s * STEP);
    const n = rec.nodes.length - before;
    if (n > worst) { worst = n; worstStep = s; }
  }
  H.eq(worst, 14, "the synthetic table's worst step creates 14 nodes (the count is real)");
  H.eq(worstStep, 0, "on step 0");
  H.assert(worst <= C.MUSIC_STEP_NODE_MAX, `⛔ worst nodes per step ${worst} <= C.MUSIC_STEP_NODE_MAX ${C.MUSIC_STEP_NODE_MAX}`);
}

// the game's instance
{
  const M = XA.MusicSys;
  M.ensureNoiseBuf();
  const d = M.noiseBuf && M.noiseBuf.getChannelData(0), ref = XA.mulberry32(C.AUDIO_NOISE_SEED);
  let same = !!d;
  for (let i = 0; d && i < 4096 && same; i++) same = d[i] === Math.fround(ref() * 2 - 1);
  H.assert(same, "⛔ MusicSys's noise is mulberry32(C.AUDIO_NOISE_SEED)");
}

// ---------------------------------------------------------------------------
// the built file
// ---------------------------------------------------------------------------
{
  const mods = sliceModules(script);
  const kit = mods["16-audio-engine.js"], glue = mods["19-sfx.js"];
  H.assert(kit && kit.includes("function createMusic("), "the kit-audio slice is real");
  H.assert(glue && glue.includes("createAudioEngine("), "the 19-sfx.js slice is real");
  H.assert(!/\bC\./.test(kit), "⛔ kit-audio reads no game config — no C. in its slice");
  H.assert(!/\bstate\s*[.[]/.test(kit), "⛔ kit-audio reads no game state");
  for (const g of ["AudioSys", "MusicSys", "MUSIC_TRACKS", "mulberry32", "Game"]) {
    H.assert(!new RegExp(`\\b${g}\\b`).test(kit), `⛔ kit-audio names no game global (${g})`);
  }
  H.assert(!/\bweb\b/i.test(kit), "⛔ DEPARTURE 3: the kit-audio slice, comments included, never says the banned word");
  H.assert(!/layerSink/.test(glue), "the game passes no layerSink");
  H.assert(!/\bstate\b/.test(stripComments(glue)), "⛔ 19-sfx.js's code reads no game state");
  H.assert(/mulberry32\(C\.AUDIO_NOISE_SEED\)/.test(glue), "19-sfx.js seeds the noise from C.AUDIO_NOISE_SEED");
  H.assert(/onGesture:\s*\(\) => AudioSys\.unlock\(\)/.test(mods["23-main.js"]), "23-main.js passes onGesture: () => AudioSys.unlock()");

  const code = stripComments(script);
  H.assert(code.length < script.length, "the scanner actually stripped comments");
  H.assert(!/\bsetTimeout\b|\bsetInterval\b/.test(code), "⛔ the built file's code has no setTimeout or setInterval");
  H.assert(!/Math\s*\.\s*random/.test(script), "⛔ the built file has no platform random generator");
  H.assert(!/\bweb\b/i.test(script), "⛔ the built file never says the banned word");
}

H.report();

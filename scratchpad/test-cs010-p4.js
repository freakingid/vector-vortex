// test-cs010-p4.js — CS010 P4: the rim pulse (GDD 11.6; plan §6; Paul's D10).
// Asserts what P4 owns: `heart` alone carries `beat: true` of `title` and `pulse`
// (CS012's `drive` marks its own), and COPY TABLE keeps it; the onset ring and
// beatGlow(); played on the fake, the rim glow on EVERY
// frame equals the reading of the onsets the clock has REACHED; 0 headless, on
// the title and under pause; draw() writes no state and spends no draw; only the
// rim's two strokes move, and its width stays under the cap.
//
// ⛔ TRAPS.
//  1. The lookahead schedules an onset up to C.MUSIC_LOOKAHEAD early, so a glow
//     read off the SCHEDULE lights the rim 0.2 s before the beat. The played
//     block asserts frames with a pending onset exist where the glow must be 0.
//     Mutation-checked by hand (log/CS010.md).
//  2. The glow is a closure variable in Game: it is read off the rim's drawn
//     width, the first path draw() strokes.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

installSeed(20261004);
const ROOT = path.join(__dirname, "..");
const X = H.buildGame({ audio: true });
const { C, state } = X;
const G = X.Game, A = X.AudioSys, M = X.MusicSys;
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const lab = fs.readFileSync(path.join(ROOT, "tools", "music-lab.html"), "utf8");
const EPS = 1e-9;

// ---------------------------------------------------------------------------
// C and the data
// ---------------------------------------------------------------------------
for (const k of ["RIM_PULSE_TIME", "RIM_PULSE_W", "RIM_PULSE_ALPHA", "RIM_PULSE_RING"]) hasKnob(X, k, null, H);
H.eq(C.RIM_PULSE_TIME, 0.10, "C.RIM_PULSE_TIME is 0.10 (provisional)");
H.eq(C.RIM_PULSE_W, 0.5, "C.RIM_PULSE_W is 0.5 (provisional)");
H.eq(C.RIM_PULSE_ALPHA, 0.5, "C.RIM_PULSE_ALPHA is 0.5 (provisional)");
H.assert(X.noteBeat !== null && X.beatGlow !== null, "noteBeat and beatGlow are exported");
{
  const marked = [];
  for (const [k, t] of Object.entries(X.MUSIC_TRACKS)) for (const L of t.layers) if (L.beat) marked.push(k + "." + L.name);
  // ⛔ REWRITTEN IN PLACE (CS012 P1). This counted every track. CS012 O13 gives
  // `drive` its own beat layer (test-cs012-p1.js), so the claim is read over the
  // two tracks this phase marked: of title's and pulse's layers, only heart.
  H.eq(marked.filter(m => /^(title|pulse)\./.test(m)).join(","), "pulse.heart", "⛔ exactly one layer of title and pulse is marked beat: pulse's heart");
  H.assert(/beat: true, audition: "pass", steps: heart \}/.test(script), "the mark sits before the audition mark on heart's line");
}

// COPY TABLE passes the mark through: the lab's own rewrite, every heart edit.
{
  const fnText = (src, name) => { const at = src.indexOf("\nfunction " + name + "(");
    return at < 0 ? null : src.slice(at + 1, src.indexOf("\n}\n", at) + 2); };
  const b = lab.indexOf("// ===== BLOCK B BEGIN");
  const blockB = lab.slice(lab.indexOf("\n", b) + 1, lab.indexOf("// ===== BLOCK B END"));
  const rewrite = new Function(fnText(lab, "rewriteBlockB") + "\nreturn rewriteBlockB;")();
  const load = text => new Function(text + "\n;return MUSIC_TRACKS;")();
  const out = rewrite(blockB, [
    { builder: "buildPulseTrack", name: "heart", gain: "0.300", audition: "fail" },
    { builder: "buildPulseTrack", name: "heart", audition: "pass", tier: 3 },
    { builder: "buildPulseTrack", name: "heart", tier: null },
    { builder: "buildPulseTrack", stepDur: "60 / 132 / 4" },
  ]);
  const heart = load(out).pulse.layers.find(L => L.name === "heart");
  H.eq(heart.beat, true, "⛔ COPY TABLE keeps heart's beat: true through gain, audition, tier and tempo edits");
  H.eq(heart.gain, 0.3, "fixture: the rewrite did edit heart's line");
}

// ---------------------------------------------------------------------------
// the ring and beatGlow(), before any context: both no-ops
// ---------------------------------------------------------------------------
H.eq(A.ctx, null, "fixture: no context yet");
X.noteBeat(0);
H.eq(X.beatGlow(0), 0, "⛔ no context: beatGlow is 0");

A.unlock();
{
  const T = C.RIM_PULSE_TIME;
  H.eq(X.beatGlow(0), 0, "no onset recorded: 0 (the context-less noteBeat recorded nothing)");
  X.noteBeat(10);
  H.eq(X.beatGlow(9.999), 0, "⛔ an onset still ahead lights nothing");
  H.eq(X.beatGlow(10), 1, "⛔ 1 when the clock reaches the onset");
  H.close(X.beatGlow(10 + T / 2), 0.5, EPS, "half at half of C.RIM_PULSE_TIME (linear)");
  H.close(X.beatGlow(10 + T), 0, EPS, "0 at C.RIM_PULSE_TIME");
  H.eq(X.beatGlow(10 + T * 1.01), 0, "and never below 0 after it");
  X.noteBeat(10.25);
  H.close(X.beatGlow(10.05), 0.5, EPS, "a later pending onset does not replace the reached one");
  H.eq(X.beatGlow(10.25), 1, "and lights once reached");
  for (let i = 0; i < C.RIM_PULSE_RING * 3; i++) X.noteBeat(20 + i * 0.25);
  H.eq(X.beatGlow(20 + (C.RIM_PULSE_RING * 3 - 1) * 0.25), 1, "the ring wraps and keeps the newest onsets");
  H.eq(X.beatGlow(1000), 0, "and long after the last, 0");
  for (let i = 0; i < C.RIM_PULSE_RING; i++) X.noteBeat(-Infinity);   // empty the ring for the played block
  H.eq(X.beatGlow(1e9), 0, "fixture: the ring is empty again");
}

// ---------------------------------------------------------------------------
// drawWell's sixth argument: only the rim's strokes move, capped, no fill
// ---------------------------------------------------------------------------
const ctx2d = X._env.canvas.getContext("2d");
const PATCH = ["beginPath", "moveTo", "lineTo", "closePath", "stroke", "fill", "fillRect", "strokeRect", "fillText"];
function record(fn) {
  const prev = {};
  for (const k of PATCH) prev[k] = ctx2d[k];
  const log = { paths: [], calls: [], fills: 0 };
  let cur = null;
  ctx2d.beginPath = () => { cur = { strokes: [] }; log.paths.push(cur); log.calls.push("B"); };
  ctx2d.moveTo = (x, y) => log.calls.push(`M${x},${y}`);
  ctx2d.lineTo = (x, y) => log.calls.push(`L${x},${y}`);
  ctx2d.closePath = () => log.calls.push("Z");
  ctx2d.stroke = () => {
    const s = { w: ctx2d.lineWidth, a: ctx2d.globalAlpha, c: ctx2d.strokeStyle, op: ctx2d.globalCompositeOperation };
    if (cur) cur.strokes.push(s);
    log.calls.push(`S${s.w},${s.a},${s.c},${s.op}`);
  };
  ctx2d.fill = ctx2d.fillRect = ctx2d.strokeRect = () => { log.fills++; };
  try { fn(ctx2d); } finally { for (const k of PATCH) ctx2d[k] = prev[k]; }
  return log;
}
const CAP = C.LINE_W_RIM * (1 + C.RIM_PULSE_W);
{
  for (const [level, tag] of [[1, "full-alpha band"], [70, "dim band"]]) {
    const well = X.WELLS[3];
    const base = record(ctx => X.drawWell(ctx, well, level, null, 0));
    const five = record(ctx => X.drawWell(ctx, well, level, null, 0, 0));
    H.eq(five.calls.join("|"), base.calls.join("|"), `${tag}: a glow of 0 draws exactly the five-argument well`);
    const lit = record(ctx => X.drawWell(ctx, well, level, null, 0, 1));
    H.eq(lit.calls.length, base.calls.length, `${tag}: the same calls`);
    const diff = [];
    base.calls.forEach((c, i) => { if (c !== lit.calls[i]) diff.push(i); });
    const rimStrokes = base.calls.map((c, i) => c[0] === "S" && i < base.calls.indexOf("B", 1) ? i : -1).filter(i => i >= 0);
    H.eq(rimStrokes.length, 2, `fixture (${tag}): the rim path is the first, with two strokes`);
    H.assert(diff.every(i => rimStrokes.includes(i)) && diff.length > 0, `⛔ ${tag}: only the rim's strokes change`);
    const [bw, bt] = base.paths[0].strokes, [lw, lt] = lit.paths[0].strokes;
    H.close(lt.w, CAP, EPS, `⛔ ${tag}: the thin width is LINE_W_RIM x (1 + RIM_PULSE_W) at glow 1`);
    H.close(lw.w / bw.w, 1 + C.RIM_PULSE_W, EPS, `${tag}: and the wide pass scales with it`);
    const wantA = Math.min(1, X.wellBaseAlpha(level) * (1 + C.RIM_PULSE_ALPHA));
    H.close(lt.a, C.GLOW_THIN_ALPHA * wantA, EPS, `⛔ ${tag}: alpha x (1 + RIM_PULSE_ALPHA), capped at 1`);
    H.assert(lit.paths.slice(1).every((p, i) => JSON.stringify(p) === JSON.stringify(base.paths[i + 1])),
             `${tag}: every other path is untouched`);
    const over = record(ctx => X.drawWell(ctx, well, level, null, 0, 7));
    H.assert(over.paths[0].strokes[1].w <= CAP + EPS && over.paths[0].strokes[1].a <= C.GLOW_THIN_ALPHA + EPS,
             `⛔ ${tag}: a glow above 1 is capped`);
    H.eq(lit.fills + over.fills, 0, `⛔ ${tag}: no fill`);
  }
  const at = script.indexOf("\nfunction drawWell(");
  const body = script.slice(at, script.indexOf("\n}\n", at));
  H.assert(!/fill|rng\(/.test(body), "⛔ drawWell's body names no fill and draws no random value");
}

// ---------------------------------------------------------------------------
// played on the fake: the glow on every frame is the REACHED onsets' reading
// ---------------------------------------------------------------------------
function hashState() {
  const seen = new Map();
  let h = 2166136261;
  const mix = s => { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; };
  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  function walk(v) {
    if (typeof v === "function") return;
    if (typeof v === "number") { f64[0] = v; mix("n" + u32[0] + "," + u32[1]); return; }
    if (v === null || typeof v !== "object") { mix(typeof v + String(v)); return; }
    if (seen.has(v)) { mix("@" + seen.get(v)); return; }
    seen.set(v, seen.size);
    mix(Array.isArray(v) ? "[" + v.length : "{" + (v.constructor ? v.constructor.name : ""));
    for (const k of Object.keys(v)) { mix(k); walk(v[k]); }
  }
  walk(state);
  return h;
}

// Every heart note the scheduler plays, at the time it is reported to onBeat.
const onsets = [];
{ const p = M.playNote; M.playNote = function (layer, cell, t) { if (layer.name === "heart") onsets.push(t); return p.apply(this, arguments); }; }
const expected = now => {
  let last = -Infinity;
  for (const t of onsets) if (t <= now && t > last) last = t;
  return Math.max(0, 1 - (now - last) / C.RIM_PULSE_TIME);
};

// The glow read off the drawn rim, and draw()'s own effect on state and the stream.
let drawMoves = 0, drawDraws = 0, draws = 0, hBefore = 0, d0 = 0;
{
  const rng = state.rng;
  state.rng = function () { draws++; return rng.apply(this, arguments); };
  // draw()'s first call is clearRect: the hash and the draw count are taken
  // there, after audioFrame(), and compared once frame() returns.
  ctx2d.clearRect = () => { hBefore = hashState(); d0 = draws; };
}
function frameGlow(fn) {
  const log = record(fn);
  if (hashState() !== hBefore) drawMoves++;
  if (draws !== d0) drawDraws++;
  const w = log.paths[0].strokes[1].w;
  return { glow: (w / C.LINE_W_RIM - 1) / C.RIM_PULSE_W, w };
}

const MS = C.FIXED_DT * 1000;
let now = 1758300000000;
Date.now = () => (now += 7919);
let clock = 0;
function halfFrame() {
  clock += MS / 2;
  A.ctx.currentTime = clock / 1000;
  return frameGlow(() => G.frame(clock));
}
function liveStep() { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); }
function steps(n) { for (let i = 0; i < n; i++) liveStep(); }
const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
const FIRE = key(" "), ESC = key("Escape"), RIGHT = key("ArrowRight");
function press(b) { b.down(); liveStep(); b.up(); liveStep(); }

G.reset(); G.frame(0); G.quitToTitle(); steps(2);
{
  let lit = 0;
  for (let i = 0; i < 240; i++) if (halfFrame().glow !== 0) lit++;
  H.eq(M.state, "title", "fixture: the title plays");
  H.eq(lit, 0, "⛔ the title never pulses");
}
// ⛔ REPAIRED IN PLACE AT CS012 P3 (O9): OVERDRIVE is MODE's first row and its
// default highlight, so the one step down restores this file's precondition, a
// CLASSIC run — `pulse` is the track whose `heart` carries beat: true here.
press(FIRE); press(RIGHT); press(FIRE);
FIRE.down();
for (let n = 0; state.screen !== "play" && n < 16; n++) halfFrame();
FIRE.up();
H.eq(state.screen, "play", "fixture: play, from the front door");
{
  let bad = 0, frames = 0, peak = 0, pending = 0, lit = 0, maxW = 0;
  for (let i = 0; i < 4800; i++) {
    state.invulnTime = 0;
    if (state.screen !== "play") break;
    const n0 = onsets.length;
    const r = halfFrame();
    const tNow = A.ctx.currentTime;
    frames++;
    if (Math.abs(r.glow - expected(tNow)) > 1e-6) bad++;
    if (onsets.slice(n0).some(t => t > tNow + 0.05) && expected(tNow) === 0) pending++;
    if (r.glow > 0) lit++;
    peak = Math.max(peak, r.glow);
    maxW = Math.max(maxW, r.w);
  }
  H.assert(frames > 4000, `fixture: the run stayed in play (${frames} frames)`);
  H.assert(onsets.length > 20, `fixture: heart played (${onsets.length} onsets)`);
  H.eq(bad, 0, `⛔ on every play frame the glow is the reading of the onsets the clock has reached (${frames})`);
  H.assert(pending > 10, `⛔ and frames that scheduled a heart onset ahead read 0 there (${pending}): a glow at scheduling time is red`);
  H.assert(lit > 0 && peak > 0.5, `the rim did pulse (${lit} frames, peak ${peak.toFixed(3)})`);
  H.assert(maxW <= CAP + EPS, `⛔ the rim width stays <= LINE_W_RIM x (1 + RIM_PULSE_W) (${maxW})`);
}

// ⛔ Pause: the music plays on, ducked, and the rim is still.
{
  press(ESC);
  H.eq(state.screen, "pause", "fixture: paused");
  const n0 = onsets.length;
  let lit = 0, reached = 0;
  for (let i = 0; i < 480; i++) { const r = halfFrame(); if (r.glow !== 0) lit++; if (expected(A.ctx.currentTime) > 0) reached++; }
  H.assert(onsets.length > n0 && reached > 0, `fixture: heart kept playing under pause (${onsets.length - n0} onsets)`);
  H.eq(lit, 0, "⛔ under pause the rim does not pulse");
  press(ESC);
  H.eq(state.screen, "play", "fixture: resumed");
}
H.eq(drawMoves, 0, "⛔ draw() changed no state on any frame");
H.eq(drawDraws, 0, "⛔ draw() spent no draw from the run's stream");

// ---------------------------------------------------------------------------
// headless: the same front door, and draw() passes a glow of 0
// ---------------------------------------------------------------------------
{
  const Z = H.buildGame({ spy: ["drawWell"] });
  const glows = new Set();
  Z.drawWell.before = (ctx, well, level, lanes, roll, g) => glows.add(g);
  const ZG = Z.Game, Zs = Z.state;
  let tz = 0;
  const stepZ = () => { tz += MS; ZG.frame(tz); };
  const pressZ = k => { ZG.input.keyDown(k); stepZ(); stepZ(); ZG.input.keyUp(k); stepZ(); stepZ(); };
  ZG.reset(); ZG.frame(0); ZG.quitToTitle();
  for (let i = 0; i < 4; i++) stepZ();
  pressZ(" "); pressZ("ArrowRight"); pressZ(" ");     // PLAY, OVERDRIVE -> CLASSIC, CLASSIC
  ZG.input.keyDown(" ");
  for (let n = 0; Zs.screen !== "play" && n < 16; n++) stepZ();
  ZG.input.keyUp(" ");
  H.eq(Zs.screen, "play", "fixture: headless play");
  H.eq(Z.AudioSys.ctx, null, "fixture: headless has no context");
  for (let i = 0; i < 600; i++) { Zs.invulnTime = 0; stepZ(); }
  H.assert(Z.drawWell.calls > 600, "fixture: draw() drew the well every frame");
  H.eq([...glows].join(","), "0", "⛔ headless, draw() passes a glow of 0 on every frame");
}

H.report("test-cs010-p4.js");

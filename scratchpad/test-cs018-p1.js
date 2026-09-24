// test-cs018-p1.js — CS018 P1: GDD 19's ten coverage gaps, one carrier each
// (plan §3, G1–G10; Q4–Q9). G1 heat over 1..200; G2 `pulse`'s A→B→C; G3 the
// stick at 36 deflections; G4 the shot's throat fade; G5 dist/ against src/ and
// build.js's injectScript(); G6 the week key in three zones; G7 level 1's first
// seconds; G8 / G9 the four values GDD 19's Audio clauses name; G10 the page's
// markup and the package's lib files in the vocabulary scan.
// ⛔ TRAPS. 1. dist/ is read only AFTER the first buildGame(), which rebuilds a
//     stale one. 2. G6 re-runs THIS file in child processes (`--tz-child`), and
//     each asserts its own zone offset first: a Node without zone data falls
//     back to UTC silently, which would make the non-UTC children vacuous.
//  3. G7's Date.now is WALL time, the frame clock plus a base, so every run
//     seeds differently; the 0–89-step title jitter is the test's OWN stream,
//     far under the demo's 20 s. MODE is OVERDRIVE then CLASSIC; two live
//     steps before the first press. 4. G7's active driver is a PROXY for "a
//     player who moves and fires": fire held, steered through the MOUSE path at
//     most KEY_SPEED_MAX lanes a second (key taps oscillate round the target).
//  5. G10 reads the word list FROM test-cs008-p6.js; this file writes none.
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const H = require("./_harness.js");
const { installSeed, mulberry32 } = require("./_seeded-random.js");

const SEED = 20261218;
installSeed(SEED);                          // ⛔ above the first buildGame()

const ROOT = path.join(__dirname, "..");
const J = JSON.stringify;

// G6's nine instants: test-cs015-p1.js §6's boundaries, each with its key.
const WEEK_CASES = [
  ["2020-01-01T00:00:00Z", "2020-W01"], ["2021-01-01T00:00:00Z", "2020-W53"],
  ["2025-12-29T00:00:00Z", "2026-W01"], ["2026-01-01T00:00:00Z", "2026-W01"],
  ["2027-01-03T00:00:00Z", "2026-W53"], ["2027-01-04T00:00:00Z", "2027-W01"],
  ["2026-09-20T23:30:00Z", "2026-W38"], ["2026-09-21T00:00:00Z", "2026-W39"],
  ["2026-09-20T23:59:59Z", "2026-W38"],
];
// The mutant reads the LOCAL calendar in isoDayIndex() and isoWeekKey().
const LOCAL_MUTANT = [
  ["  return (new Date(ms).getUTCDay() + 6) % DAYS_PER_WEEK;",
   "  return (new Date(ms).getDay() + 6) % DAYS_PER_WEEK;"],
  ["  const day = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());",
   "  const day = Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());"],
];
const OFFSET_AT = Date.UTC(2026, 0, 15, 12);   // no zone below moves at this instant

function weekKeys(Z) {
  return WEEK_CASES.map(([iso]) => Z.createAchievements({
    defs: Z.C.ACHIEVEMENTS, load: () => null, save: () => {}, now: () => Date.parse(iso),
  }).weekKey());
}

// ---- G6's child: one zone, printed as JSON, nothing asserted here (trap 2) --
if (process.argv.includes("--tz-child")) {
  const shipped = weekKeys(H.buildGame());
  const local = weekKeys(H.buildGame({ mutate: LOCAL_MUTANT }));
  process.stdout.write(J({ tz: process.env.TZ, offset: new Date(OFFSET_AT).getTimezoneOffset(), shipped, local }));
  return;
}

const X = H.buildGame();
const { C } = X;
const B = require("../build.js");
const html = fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8");   // trap 1
const script = H.extractScript(html);
const count = (text, s) => { let n = 0; for (let at = text.indexOf(s); at >= 0; at = text.indexOf(s, at + 1)) n++; return n; };

// ===========================================================================
// G1. ⛔ GDD 17 ITEM 7 — heat(n+1) > heat(n) FOR n IN 1..200, INCLUSIVE
// ===========================================================================
{
  let compared = 0, notMono = null;
  for (let n = 1; n <= 200; n++) {
    compared++;
    if (!(X.heat(n + 1) > X.heat(n))) notMono = notMono || `heat(${n + 1}) <= heat(${n})`;
  }
  H.eq(compared, 200, "G1: two hundred comparisons, n = 1 … 200 (test-cs007-p2.js's loop stops at 199)");
  H.assert(!notMono, `⛔ G1: heat(n+1) > heat(n) for every n in 1..200 inclusive (${notMono})`);
  H.assert(Number.isFinite(X.heat(201)), `G1: heat(201), the last compared, is finite (${X.heat(201)})`);
}

// ===========================================================================
// G2. ⛔ `pulse` RUNS A→B→C (GDD 11.7; plan Q8) — drive's method, its bassline
// ===========================================================================
{
  const pulse = X.MUSIC_TRACKS.pulse;
  const bars = pulse.steps / pulse.bar;
  const layer = name => pulse.layers.find(L => L.name === name);
  const notes = (L, b) => L.steps.slice(b * pulse.bar, (b + 1) * pulse.bar);
  const figure = (L, b) => notes(L, b).map((c, s) => (c ? s : -1)).filter(s => s >= 0).join(",");
  const semis = (a, b) => Math.round(12 * Math.log2(b.f / a.f));
  const bass = layer("bassline"), heart = layer("heart"), melody = layer("melody");
  H.assert(bass && heart && melody, "G2: fixture: `pulse` has its bassline, heart and melody");
  H.eq(bars, 36, "G2: `pulse` runs 36 bars");

  const starts = [0];
  for (let b = 1; b < bars; b++) if (figure(bass, b) !== figure(bass, b - 1)) starts.push(b);
  H.eq(J(starts), J([0, 12, 24]), "⛔ G2: three sections by the bassline's figure: A from bar 0, B from 12, C from 24");

  const perBar = b => notes(heart, b).filter(Boolean).length;
  const inA = [], inB = [];
  for (let b = 0; b < 12; b++) inA.push(perBar(b));
  for (let b = 12; b < 24; b++) inB.push(perBar(b));
  H.assert(inA.every(n => n === 2) && inB.every(n => n === 4),
           `⛔ G2: the heart doubles from A to B, 2 → 4 notes a bar (A ${J(inA)}, B ${J(inB)})`);

  // GDD 11.7's B, restated to the data (Q8): the bassline leaps a fifth in A
  // and an OCTAVE in B, and the tune sits higher.
  const leap = b => { const ns = notes(bass, b).filter(Boolean); return semis(ns[0], ns[1]); };
  const leapsA = [], leapsB = [];
  for (let b = 0; b < 12; b++) leapsA.push(leap(b));
  for (let b = 12; b < 24; b++) leapsB.push(leap(b));
  H.assert(leapsA.every(n => n === 7) && leapsB.every(n => n === 12),
           `G2: the bassline leaps a fifth in every A bar and an octave in every B bar (${J(leapsA)} / ${J(leapsB)})`);
  const meanMidi = (b0, b1) => {
    const ns = melody.steps.slice(b0 * pulse.bar, b1 * pulse.bar).filter(Boolean);
    return ns.reduce((s, c) => s + 12 * Math.log2(c.f / 440) + 69, 0) / ns.length;
  };
  const mA = meanMidi(0, 12), mB = meanMidi(12, 24);
  H.assert(mB > mA, `G2: the tune sits higher in B (mean MIDI A ${mA.toFixed(1)}, B ${mB.toFixed(1)})`);
}

// ===========================================================================
// G3. ⛔ THE STICK IS PROPORTIONAL (GDD 9.4, 19 Core) — 36 deflections, exact
// ===========================================================================
{
  const makeInput = () => X.createInput({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS,
    keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP,
    pointerLockOffer: C.POINTER_LOCK_OFFER,
    touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC,
    touchAutofire: C.TOUCH_AUTOFIRE, touchButtonR: C.TOUCH_BUTTON_R,
    gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: C.INPUT_MIRROR, worldW: C.WORLD_W, worldH: C.WORLD_H,
  });
  // test-cs002-p4.js's fakeWin form: a plain `{ navigator: { getGamepads } }`.
  const fakeWin = x => {
    const buttons = [];
    for (let i = 0; i < 16; i++) buttons.push({ pressed: false });
    return { navigator: { getGamepads: () => [{ axes: [x], buttons }] } };
  };
  const gp = makeInput();
  const rotateAt = x => { gp.pollGamepads(fakeWin(x)); return gp.sample(C.FIXED_DT).rotate; };

  H.eq(C.GAMEPAD_DEADZONE, 0.15, "G3: fixture: the sweep starts at the shipped deadzone");
  const xs = [];
  for (let k = 0; k <= 17; k++) { const x = (15 + 5 * k) / 100; xs.push(x, -x); }
  H.eq(xs.length, 36, "G3: 36 deflections, 0.15 … 1.00 by 0.05, both signs");
  const wrong = xs.filter(x => rotateAt(x) !== x * C.GAMEPAD_SENS * C.FIXED_DT);
  H.eq(wrong.length, 0, `⛔ G3: rotate is exactly x × GAMEPAD_SENS × dt at every deflection (${J(wrong)})`);
  const unDoubled = xs.filter(x => Math.abs(x) <= 0.5 && rotateAt(2 * x) !== 2 * rotateAt(x));
  H.eq(unDoubled.length, 0, `⛔ G3: doubling a deflection doubles rotate, exactly (${J(unDoubled)})`);
  H.eq(rotateAt(0.8), 2 * rotateAt(0.4), "G3: 0.8 against 0.4 is exactly 2×");
  H.eq(rotateAt(C.GAMEPAD_DEADZONE - 0.01), 0, "G3: non-vacuity: just inside the deadzone is still zero");
}

// ===========================================================================
// G4. ⛔ THE SHOT FADES BELOW READABILITY_DEPTH (GDD 10.3) — read off the context
// ===========================================================================
function strokes(Z, fn) {
  const ctx = Z._env.canvas.getContext("2d");
  const prev = ctx.stroke;
  const log = [];
  ctx.stroke = () => { log.push({ a: ctx.globalAlpha, c: ctx.strokeStyle }); };
  try { fn(ctx); } finally { ctx.stroke = prev; }
  return log;
}
// [depth, the fraction of full alpha GDD 10.3 asks for]: 0 at the throat, linear
// to READABILITY_DEPTH, full at and above it.
const FADE = [[0, 0], [0.01, 0.04], [0.0625, 0.25], [0.125, 0.5], [0.1875, 0.75], [0.25, 1], [0.5, 1], [1, 1]];
const pairIs = (log, i, f) => log[i] && log[i + 1] &&
  Math.abs(log[i].a - C.GLOW_WIDE_ALPHA * f) <= 1e-12 && Math.abs(log[i + 1].a - C.GLOW_THIN_ALPHA * f) <= 1e-12;
function shotFades(Z) {
  const bad = [];
  for (const [d, f] of FADE) {
    const log = strokes(Z, ctx => Z.drawShot(ctx, Z.WELLS[0], 0, d));
    if (!(log.length === 2 && log[0].c === Z.C.SKIMMER_COLOR && pairIs(log, 0, f))) bad.push(`${d}: ${J(log)}`);
  }
  return bad;
}
// One real draw() of a play board with one shot staged below the line.
function boardFade(Z) {
  const st = Z.state;
  Z.startGame(SEED);
  Z.Game.update(Z.C.FIXED_DT);
  st.enemies.length = 0; st.shots.length = 0;
  const shot = new Z.Shot(Z.WELLS[st.wellIndex], st.skimmer.lane, false);
  shot.t = Z.C.SHOT_TIME * 0.875;
  st.shots.push(shot);
  const f = shot.depth() / Z.C.READABILITY_DEPTH;
  const log = strokes(Z, () => Z.Game.draw());
  const found = log.some((s, i) => s.c === Z.C.SKIMMER_COLOR && log[i + 1] && log[i + 1].c === Z.C.SKIMMER_COLOR &&
    Math.abs(s.a - Z.C.GLOW_WIDE_ALPHA * f) <= 1e-9 && Math.abs(log[i + 1].a - Z.C.GLOW_THIN_ALPHA * f) <= 1e-9);
  return { f, found, strokes: log.length };
}
{
  const bad = shotFades(X);
  H.eq(bad.length, 0, `⛔ G4: drawShot()'s two passes at GLOW_WIDE_ALPHA / GLOW_THIN_ALPHA × depth / 0.25 below ` +
       `the line, 0 at the throat, full at and above it (${bad.join(" | ")})`);
  const b = boardFade(X);
  H.assert(b.f > 0 && b.f < 1, `G4: fixture: the staged shot sits below the line (fraction ${b.f})`);
  H.assert(b.found, `⛔ G4: one real Game.draw(): the staged shot's SKIMMER_COLOR pair carries the faded alpha (${b.strokes} strokes)`);

  const LINE = "glowStroke(ctx, pierce ? C.TOKEN_COLOR : C.SKIMMER_COLOR, laneLineWidth(depth), shotAlpha(depth));";
  H.eq(count(script, LINE), 1, "G4: the mutated line is in the build exactly once");
  const M = H.buildGame({ mutate: [[LINE, LINE.replace("shotAlpha(depth)", "1")]] });
  H.assert(shotFades(M).length > 0, "⛔ G4: mutation: drawShot() at full alpha is red on the direct draw");
  H.assert(!boardFade(M).found, "⛔ G4: mutation: and red on the real Game.draw()");
}

// ===========================================================================
// G5. ⛔ dist/ AGAINST src/ (GDD 19 Quality; plan Q6) — slice properties only
// ===========================================================================
const BANNER = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;   // the module banner, as test-cs012-p1.js reads it
const KIT = B.kitBlock();
const BODIES = B.MANIFEST.map(f => fs.readFileSync(path.join(ROOT, "src", f), "utf8").trimEnd());
function sliceProblems(text) {
  const errs = [];
  const heads = [];
  for (const m of text.matchAll(BANNER)) heads.push({ name: m[1], at: m.index, end: m.index + m[0].length });
  if (J(heads.map(h => h.name)) !== J(B.MANIFEST)) {
    errs.push(`banners are not MANIFEST, once each, in order: ${J(heads.map(h => h.name))}`);
    return errs;
  }
  let residue = text.slice(0, heads[0].at);
  heads.forEach((h, i) => {
    const seg = text.slice(h.end, i + 1 < heads.length ? heads[i + 1].at : text.length);
    if (count(text, BODIES[i]) !== 1) errs.push(`${h.name}'s body is in the script ${count(text, BODIES[i])} times`);
    if (!seg.startsWith(BODIES[i])) { errs.push(`${h.name}'s slice is not its src/ file`); return; }
    let rest = seg.slice(BODIES[i].length);
    if (h.name === B.KIT_INLINE_AFTER) {
      const k = rest.indexOf(KIT);
      if (k < 0 || !/^\s*$/.test(rest.slice(0, k))) errs.push(`kitBlock() does not follow ${h.name}`);
      rest = rest.replace(KIT, "");
    }
    residue += rest;
  });
  if (count(text, KIT) !== 1) errs.push(`kitBlock() is in the script ${count(text, KIT)} times`);
  if (!/^\s*"use strict";\s*$/.test(residue)) errs.push(`the residue is ${J(residue.slice(0, 80))}`);
  return errs;
}
{
  const errs = sliceProblems(script);
  H.eq(errs.length, 0, `⛔ G5: all ${B.MANIFEST.length} modules verbatim under their banners, once each, in ` +
       `MANIFEST order; kitBlock() once, after ${B.KIT_INLINE_AFTER}; the residue "use strict"; (${errs.join(" | ")})`);
  H.eq(B.MANIFEST.length, 26, "G5: fixture: 26 modules");

  // non-vacuity: one byte changed in one module, and two modules swapped
  const at = script.indexOf(BODIES[14]) + Math.floor(BODIES[14].length / 2);
  const flipped = script.slice(0, at) + (script[at] === "x" ? "y" : "x") + script.slice(at + 1);
  H.assert(sliceProblems(flipped).length > 0, "G5: non-vacuity: one byte changed in one module is red");
  const heads = [...script.matchAll(BANNER)].map(m => m.index);
  const swapped = script.slice(0, heads[1]) + script.slice(heads[2], heads[3]) +
                  script.slice(heads[1], heads[2]) + script.slice(heads[3]);
  H.assert(sliceProblems(swapped).length > 0, "G5: non-vacuity: two modules swapped is red");

  // the page is the shell with its marker replaced by the script, and nothing else
  const MARKER = "<!--BUILD:SCRIPT-->";
  const shell = fs.readFileSync(path.join(ROOT, "src", "shell.html"), "utf8");
  const tag = "<script>" + script + "</script>";
  H.eq(count(shell, MARKER), 1, "G5: fixture: the shell carries the marker once");
  H.eq(count(html, tag), 1, "G5: fixture: the game's script tag is in the page once");
  H.assert(html === B.injectScript(shell, tag), "⛔ G5: the page equals injectScript(shell, script)");

  // ⛔ injectScript() is `$`-safe: the probe is carried verbatim
  const PROBE = "x$&y$$z$`w$'v";
  const want = shell.slice(0, shell.indexOf(MARKER)) + PROBE + shell.slice(shell.indexOf(MARKER) + MARKER.length);
  H.assert(B.injectScript(shell, PROBE) === want, "⛔ G5: injectScript() carries $&, $$, $` and $' verbatim (plan Q6)");
  H.assert(shell.replace(MARKER, PROBE) !== want,
           "G5: non-vacuity: a STRING replacement rewrites the same probe (the hazard Q6 fixed)");
}

// ===========================================================================
// G6. ⛔ THE WEEK KEY IS UTC IN EVERY ZONE (GDD 15.5; plan Q5) — three children
// ===========================================================================
{
  for (const [from] of LOCAL_MUTANT) H.eq(count(script, from), 1, `G6: the mutated line is in the build once: ${from.trim()}`);
  const ZONES = [["UTC", 0], ["Pacific/Kiritimati", -840], ["Pacific/Pago_Pago", 660]];
  const want = J(WEEK_CASES.map(c => c[1]));
  for (const [tz, offset] of ZONES) {
    let out = null;
    try {
      out = JSON.parse(execFileSync(process.execPath, [__filename, "--tz-child"],
        { cwd: ROOT, encoding: "utf8", stdio: "pipe", env: Object.assign({}, process.env, { TZ: tz }) }));
    } catch (e) { out = { error: String(e.message).split("\n")[0] }; }
    if (!H.eq(out.offset, offset, `⛔ G6: precondition: the ${tz} child's offset (trap 2${out.error ? "; " + out.error : ""})`)) continue;
    H.eq(J(out.shipped), want, `⛔ G6: under TZ=${tz} the shipped week key is right on all nine instants`);
    const differs = out.local.filter((k, i) => k !== WEEK_CASES[i][1]).length;
    if (offset === 0) H.eq(differs, 0, "G6: under UTC the local-reading mutant is GREEN — the gap, shown");
    else H.assert(differs > 0, `⛔ G6: under TZ=${tz} the local-reading mutant is RED (${differs}/9 keys wrong)`);
  }
}

// ===========================================================================
// G7. ⛔ LEVEL 1'S FIRST SECONDS (GDD 12; plan Q4) — 64 front-door runs
// ===========================================================================
{
  const BASE = Date.UTC(2026, 9, 5, 12);
  const S = { clock: 0 };
  const realNow = Date.now;
  Date.now = () => BASE + S.clock;          // trap 3
  const store = new Map();
  const Y = H.buildGame({ store, spy: ["startGame"] });
  const st = Y.state, G = Y.Game, MS = Y.C.FIXED_DT * 1000;
  const own = mulberry32(SEED ^ 0x1e7e1);   // the TEST's stream; the game never reads it
  const starts = [];
  Y.startGame.before = (seed, opts) => starts.push(!!(opts && opts.attract));

  const halfFrame = () => { S.clock += MS / 2; G.frame(S.clock); };
  let titleRun = 0, titleMax = 0;
  const tick = () => {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
    if (st.screen === "title") titleMax = Math.max(titleMax, ++titleRun); else titleRun = 0;
  };
  const press = k => { G.input.keyDown(k); tick(); G.input.keyUp(k); tick(); };
  const right = () => { G.input.keyDown("ArrowRight"); tick(); tick(); G.input.keyUp("ArrowRight"); tick(); };
  // the active driver (trap 4): toward the deepest live enemy's lane, capped
  const steer = () => {
    const sk = st.skimmer;
    if (!sk || sk.dead) return;
    let best = null;
    for (const e of st.enemies) if (!e.dead && (best === null || e.depth > best.depth)) best = e;
    if (best === null) return;
    const cap = Y.C.KEY_SPEED_MAX * Y.C.FIXED_DT;
    const d = Math.max(-cap, Math.min(cap, Y.laneDelta(Y.WELLS[st.wellIndex], sk.lane, best.lane)));
    if (d !== 0) G.input.mouseMove(d / G.input.setting("mouseSens"));
  };

  halfFrame(); tick(); tick();              // trap 3: two live steps
  const MODES = ["overdrive", "classic"];
  const runs = [];
  for (let k = 0; k < 64; k++) {
    const mode = MODES[k % 2], active = k < 32;
    const jitter = Math.floor(own() * 90);
    for (let n = 0; n < jitter; n++) tick();
    press(" ");                             // PLAY
    if (mode === "classic") right();        // MODE is OVERDRIVE, then CLASSIC
    press(" ");                             // the mode
    press(" ");                             // START DEPTH's first row, LEVEL 1
    const r = { mode, active, seed: st.seed, t: null,
                started: st.screen === "play" && st.level === 1 && st.mode === mode && st.tally.kills === 0 };
    if (active) G.input.keyDown(" ");
    for (let n = 0; n < 15 * 60 && r.t === null; n++) {
      if (active) steer();
      tick();
      if (active ? st.tally.kills > 0 : st.tally.deaths > 0) r.t = st.time;
    }
    r.deathsFirst = active && st.tally.deaths > 0;
    G.input.keyUp(" ");
    G.quitToTitle();
    tick(); tick();
    runs.push(r);
  }
  Date.now = realNow;

  H.eq(runs.filter(r => !r.started).length, 0, "G7: every run entered play at level 1 in its mode through the front door");
  H.eq(new Set(runs.map(r => r.seed)).size, 64, "⛔ G7: 64 TIME-SEEDED runs, every seed distinct");
  H.eq(starts.filter(Boolean).length, 0, "G7: no title visit idled into the demo");
  H.assert(titleMax < Y.C.ATTRACT_IDLE / Y.C.FIXED_DT, `G7: every title visit pressed inside ATTRACT_IDLE (${titleMax} steps)`);
  const stats = rs => {
    const t = rs.map(r => r.t).filter(v => v !== null).sort((a, b) => a - b);
    return { n: t.length, lo: t[0], med: t[t.length >> 1], hi: t[t.length - 1] };
  };
  for (const mode of MODES) {
    const act = runs.filter(r => r.mode === mode && r.active), pas = runs.filter(r => r.mode === mode && !r.active);
    H.eq(act.length + pas.length, 32, `G7: fixture: 16 active and 16 passive ${mode} runs`);
    const a = stats(act), p = stats(pas);
    H.assert(a.n === 16 && a.hi <= 3.0,
             `⛔ G7: ${mode}, moving and firing: every run's first kill within 3.0 s (${J(a)})`);
    H.eq(act.filter(r => r.deathsFirst).length, 0, `G7: ${mode}: no active run lost a craft first`);
    H.assert(p.n === 16 && p.lo >= 6.883 - Y.C.FIXED_DT && p.hi <= 12,
             `⛔ G7: ${mode}, doing nothing: every run's first craft lost in [6.883 s − one tick, 12 s] (${J(p)})`);
    console.log(`  MEASURED (CS018 P1, G7): ${mode} first kill ${a.lo.toFixed(2)}–${a.hi.toFixed(2)} s ` +
                `(median ${a.med.toFixed(2)}); first craft lost ${p.lo.toFixed(3)}–${p.hi.toFixed(2)} s (median ${p.med.toFixed(2)})`);
  }
}

// ===========================================================================
// G8. ⛔ INTENSITY RISES ~0.4 s AND FALLS ~2.5 s (GDD 19 Audio; plan Q7)
// G9. ⛔ THE SWEEP RUNS 600 Hz → 18 kHz (GDD 19 Audio; plan Q7)
// ===========================================================================
{
  const PINS = [
    { key: "INT_ATTACK", want: 0.40, line: "INT_ATTACK:           0.40,", to: "0.41", clause: "G8: GDD 19 Audio, \"rises ~0.4 s\"" },
    { key: "INT_RELEASE", want: 2.50, line: "INT_RELEASE:          2.50,", to: "2.51", clause: "G8: GDD 19 Audio, \"falls ~2.5 s\"" },
    { key: "FILTER_MIN_HZ", want: 600, line: "FILTER_MIN_HZ:        600,", to: "601", clause: "G9: GDD 19 Audio, the sweep's 600 Hz" },
    { key: "FILTER_MAX_HZ", want: 18000, line: "FILTER_MAX_HZ:        18000,", to: "18001", clause: "G9: GDD 19 Audio, the sweep's 18 kHz" },
  ];
  for (const p of PINS) {
    H.eq(X.C[p.key], p.want, `⛔ ${p.clause}: C.${p.key} is ${p.want}`);
    H.eq(count(script, p.line), 1, `${p.clause.slice(0, 3)} the C line is in the build exactly once: ${p.line}`);
    const M = H.buildGame({ mutate: [[p.line, p.line.replace(/[\d.]+,$/, p.to + ",")]] });
    H.assert(!Object.is(M.C[p.key], p.want), `⛔ ${p.clause}: mutation: C.${p.key} ${p.to} is red`);
  }
}

// ===========================================================================
// G10. ⛔ NO BANNED WORD IN THE PAGE'S MARKUP OR THE PACKAGE (GDD 18, 19 Quality)
// ===========================================================================
{
  // ⛔ The list is READ from test-cs008-p6.js (trap 5), never written here.
  const p6 = fs.readFileSync(path.join(__dirname, "test-cs008-p6.js"), "utf8");
  const listed = /const WORDS = \[([^\]]*)\];/.exec(p6);
  const WORDS = listed ? [...listed[1].matchAll(/"([a-z]+)"/g)].map(m => m[1]) : [];
  const adds = [...new Set([...p6.matchAll(/WORDS\.concat\("([a-z]+)"\)/g)].map(m => m[1]))];
  const except = /w === "([a-z]+)" \? "([^"]+)" : w/.exec(p6);
  H.eq(WORDS.length, 9, "G10: fixture: test-cs008-p6.js's list read, nine words");
  H.eq(adds.length, 1, "G10: fixture: and its one addition, the maker's name");
  H.assert(except !== null, "G10: fixture: and its one exception");
  const ALL = WORDS.concat(adds);
  const banned = w => new RegExp(except && w === except[1] ? except[2] : w, "i");
  const hits = text => ALL.filter(w => banned(w).test(text)).concat(/\bT-\d{4}\b/.test(text) ? ["T-####"] : []);

  const pkg = fs.readFileSync(path.join(ROOT, "package-for-itch.sh"), "utf8");
  const libLine = /^LIB_FILES=\(([^)]*)\)/m.exec(pkg);
  const LIB = libLine ? libLine[1].trim().split(/\s+/) : [];
  H.assert(LIB.length > 0 && LIB.every(f => fs.existsSync(path.join(ROOT, f))),
           `G10: fixture: package-for-itch.sh's LIB_FILES read, every file on disk (${J(LIB)})`);
  const markup = html.split("<script>" + script + "</script>").join("");
  H.assert(markup.length > 0 && markup.length < html.length && markup.includes('type="module"'),
           `G10: fixture: the markup is the page with the game's script cut out, the module bridge kept (${markup.length} bytes)`);

  H.eq(J(hits(markup)), "[]", "⛔ G10: the page's markup names no banned word and no T-#### name");
  for (const f of LIB) {
    H.eq(J(hits(fs.readFileSync(path.join(ROOT, f), "utf8"))), "[]", `⛔ G10: ${f} names no banned word and no T-#### name`);
  }

  // non-vacuity: probes built from the list, as the closed file's are
  for (const probe of [WORDS[1] + "_kill", "THE " + WORDS[1].toUpperCase(), WORDS[8] + "_lane", adds[0] + "Mark", "T-" + "1981"]) {
    H.assert(hits(markup + " " + probe).length > 0, `G10: non-vacuity: the scan catches "${probe}" in the markup`);
  }
  H.assert(except && new RegExp(except[1], "i").test(markup) && !banned(except[1]).test(markup),
           "G10: non-vacuity: the markup carries the exception's prefix, and the exception is what lets it pass");
  H.eq(J(hits(fs.readFileSync(__filename, "utf8"))), "[]", "⛔ G10: this file writes no banned word (CLAUDE.md vocabulary)");
}

H.report("test-cs018-p1.js");

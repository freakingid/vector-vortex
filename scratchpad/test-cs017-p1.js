// test-cs017-p1.js — CS017 P1: GDD 17's budget, by counter and by identity
// (plan S2, S3-A, S4-A, §3). Three claims:
//   1. THE FRAME-BUDGET GATE: one draw() of S2's board — Overdrive L23, 16
//      enemies, 24 shots, 2 tokens, the combo at ×4, a prompt mid-fade, a
//      death's fragments — issues exactly the strokes and text calls MEASURED
//      at the HEAD before the fixes (ed8474d). A counter, never a clock.
//   2. THE FIVE DRAW-PATH SITES ALLOCATE NOTHING, each by an observable the old
//      line fails: projectPoly() hands drawPoly the SAME arrays every frame;
//      drawShot() one pair for every shot; drawText()'s font is built once per
//      size (a string has no identity, so the probe changes C.TEXT_FONT_FAMILY
//      after the first build and the cached string must not move); a fade's
//      colour is built once per 1/C.PROMPT_FADE_STEPS (no toFixed on a warm one);
//      wellBandColor() takes no array iterator (S3 addendum, Paul).
//   3. THE DRAW PATH WRITES NO STATE: a played Overdrive session through
//      Game.frame() hashes identically, frame by frame, with the five old lines.
// ⚠ Node cannot measure the BYTES (the harness canvas is a Proxy that boxes
// every double it stores): tools/perf-probe.js does, in Chromium (plan §1.3).
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const fs = require("fs");
const path = require("path");

const SEED = 1701;
installSeed(SEED);                                      // ⛔ above the first build

// ⛔ MEASURED at ed8474d, before the four fixes, on stage()'s board below.
const BUDGET_STROKES = 156;
const BUDGET_TEXT_CALLS = 8;                            // fillText + strokeText
const BUDGET_DRAW_TEXTS = 4;

const SPIES = ["drawPoly", "drawShot", "drawText", "drawPrompt", "drawFragments", "drawToken"];
const build = opts => { installSeed(SEED); return H.buildGame(Object.assign({ spy: SPIES }, opts)); };

// Each mutant puts ONE old line back (ed8474d's text), so it must go red.
const OLD = {
  projectPoly: ["  const out = points._screen;\n" +
                "  for (let i = 0; i < points.length; i++) {\n" +
                "    out[i].x = C.WELL_CX + points[i].x * C.WELL_RADIUS;\n" +
                "    out[i].y = C.WELL_CY + points[i].y * C.WELL_RADIUS;\n" +
                "  }",
                "  const out = new Array(points.length);\n" +
                "  for (let i = 0; i < points.length; i++) {\n" +
                "    out[i] = {\n" +
                "      x: C.WELL_CX + points[i].x * C.WELL_RADIUS,\n" +
                "      y: C.WELL_CY + points[i].y * C.WELL_RADIUS,\n" +
                "    };\n" +
                "  }"],
  drawShot:    ["  drawPoly(ctx, _shotPair, false);", "  drawPoly(ctx, [_shotHead, _shotTail], false);"],
  drawText:    ["  ctx.font = textFont(size);", "  ctx.font = size + \"px \" + C.TEXT_FONT_FAMILY;"],
  drawPrompt:  [" : promptFadeColor(a);", " : \"rgba(\" + _promptRgb + \",\" + a.toFixed(3) + \")\";"],
  wellBandColor: ["  for (let i = 0; i < bands.length; i++) {\n    if (level <= bands[i].hi) return bands[i].color;",
                  "  for (const band of bands) {\n    if (level <= band.hi) return band.color;"],
};

// ---------------------------------------------------------------------------
// S2's board, through startGame() and the real constructors. Every kind the two
// rosters hold, once where there is room; the craft dead mid-freeze, which is
// what draws the fragments (a live craft draws itself instead).
// ---------------------------------------------------------------------------
const KINDS = ["vaulter", "reaver", "carrierVaulter", "carrierDrifter", "carrierSurger", "weaver",
               "weaverBolt", "thorn", "drifter", "surger", "warden", "mimic", "mimicShot",
               "vaulter", "reaver", "drifter"];

function stage(X) {
  const { C, state } = X;
  X.Game.reset();
  X.startGame(4242, { mode: "overdrive", startDepth: 23 });
  const well = X.WELLS[state.wellIndex];
  const lanes = X.wellVertCount(well) - (well.closed ? 0 : 1);
  for (let i = 0; i < KINDS.length; i++) {
    state.enemies.push(X.ENEMY_KINDS[KINDS[i]](i % lanes, 0.15 + 0.8 * (i / KINDS.length), 1));
  }
  state.powers.spread = true;
  for (let i = 0; i < C.SPREAD_SHOT_MAX; i++) {
    const s = new X.Shot(well, i % lanes, i % 3 === 0);
    s.t = (i / C.SPREAD_SHOT_MAX) * C.SHOT_TIME * 0.95;
    state.shots.push(s);
  }
  // dropToken()'s shape; dropToken() itself spends a draw on a kill.
  for (const kind of ["lance", "spread"]) {
    state.tokens.push({ kind, lane: state.tokens.length + 2, depth: C.TOKEN_HOVER_DEPTH,
                        age: 0.5, dead: false, collected: false });
  }
  state.combo.mult = 4;
  X.promptQueue.rows.push(C.PROMPTS[0]);
  X.promptQueue.t = C.PROMPT_TIME - C.PROMPT_FADE / 2;
  state.skimmer.dead = true;
  X.Game.hitStop(C.HIT_STOP_DEATH / 2);
}

// One draw() of the staged board, counted at the canvas.
function countDraw(X) {
  const ctx = X._env.canvas.getContext("2d");
  const n = { strokes: 0, texts: 0, strings: [] };
  const prev = { stroke: ctx.stroke, fillText: ctx.fillText, strokeText: ctx.strokeText };
  ctx.stroke = () => { n.strokes++; };
  ctx.fillText = (s) => { n.texts++; n.strings.push(s); };
  ctx.strokeText = () => { n.texts++; };
  for (const k of SPIES) X[k].calls = 0;
  try { X.Game.draw(); } finally { Object.assign(ctx, prev); }
  for (const k of SPIES) n[k] = X[k].calls;
  return n;
}

// ---------------------------------------------------------------------------
// The five probes. Each takes a build and returns { ok, why }; a mutant must
// return ok false. ⛔ Every read is guarded: a probe that throws is a defect.
// ---------------------------------------------------------------------------
const PROBES = {
  // The rim and throat rings are drawWell()'s first two drawPoly() calls.
  projectPoly(X) {
    stage(X);
    const seen = [];
    X.drawPoly.before = (ctx, pts) => { if (seen[seen.length - 1].length < 2) seen[seen.length - 1].push(pts); };
    for (let i = 0; i < 3; i++) { seen.push([]); X.Game.draw(); }
    X.drawPoly.before = null;
    const [a, b, c] = seen;
    const ok = a.length === 2 && a[0] !== a[1] && a[0] === b[0] && a[1] === b[1] && b[0] === c[0] && b[1] === c[1];
    return { ok, why: `rim ${a[0] === b[0] ? "same" : "fresh"}, throat ${a[1] === b[1] ? "same" : "fresh"} across frames`,
             rim: a[0] && a[0].map(p => [p.x, p.y]) };
  },
  drawShot(X) {
    stage(X);
    const pairs = new Set();
    let inShot = false, n = 0;
    X.drawShot.before = () => { inShot = true; };
    X.drawShot.after = () => { inShot = false; };
    X.drawPoly.before = (ctx, pts) => { if (inShot) { pairs.add(pts); n++; } };
    X.Game.draw(); X.Game.draw();
    X.drawShot.before = X.drawShot.after = X.drawPoly.before = null;
    return { ok: n === 2 * X.C.SPREAD_SHOT_MAX && pairs.size === 1, why: `${pairs.size} distinct arrays over ${n} shot draws` };
  },
  drawText(X) {
    const ctx = X._env.canvas.getContext("2d"), C = X.C;
    const fonts = [];
    Object.defineProperty(ctx, "font", { configurable: true, get: () => fonts[fonts.length - 1], set: v => { fonts.push(v); } });
    const family = C.TEXT_FONT_FAMILY;
    try {
      X.drawText(ctx, "A", 0, 0, C.PROMPT_SIZE, "#ffffff");
      X.drawText(ctx, "B", 0, 0, C.PROMPT_SIZE + 1, "#ffffff");
      const first = fonts[0];
      C.TEXT_FONT_FAMILY = "probe-family";              // read only on a cache miss
      X.drawText(ctx, "C", 0, 0, C.PROMPT_SIZE, "#ffffff");
      const again = fonts[2];
      const ok = first === `${C.PROMPT_SIZE}px ${family}` && fonts[1] === `${C.PROMPT_SIZE + 1}px ${family}` &&
                 again === first;
      return { ok, why: `size ${C.PROMPT_SIZE} after the family changed: ${JSON.stringify(again)}` };
    } finally {
      C.TEXT_FONT_FAMILY = family;
      delete ctx.font;
    }
  },
  // Warm one alpha, then draw it and a second alpha inside the same step: the
  // same colour, and no Number#toFixed (the builder's one number-to-text).
  drawPrompt(X) {
    const ctx = X._env.canvas.getContext("2d"), C = X.C, q = X.promptQueue;
    const colors = [];
    X.drawText.before = (c, str, x, y, size, color) => { colors.push(color); };
    const toFixed = Number.prototype.toFixed;
    let calls = 0;
    try {
      q.rows.length = 0; q.rows.push(C.PROMPTS[0]);
      const at = a => { q.t = C.PROMPT_TIME - a * C.PROMPT_FADE; X.drawPrompt(ctx, q); };
      at(0.5);                                          // warm
      Number.prototype.toFixed = function () { calls++; return toFixed.apply(this, arguments); };
      at(0.5);
      at(0.5 + 0.3 / C.PROMPT_FADE_STEPS);
      const ok = colors.length === 3 && colors[1] === colors[0] && colors[2] === colors[0] &&
                 /^rgba\(255,255,255,0\.5/.test(colors[0]) && calls === 0;
      return { ok, why: `${calls} toFixed on warm draws; colours ${JSON.stringify(colors)}` };
    } finally {
      Number.prototype.toFixed = toFixed;
      X.drawText.before = null;
      q.rows.length = 0; q.t = 0;
    }
  },
  // A `for…of` over an array calls Array.prototype[Symbol.iterator]; an
  // indexed loop does not. Every band level and one past the table.
  wellBandColor(X) {
    const proto = Array.prototype, iter = proto[Symbol.iterator];
    let calls = 0;
    const colors = [];
    try {
      proto[Symbol.iterator] = function () { calls++; return iter.apply(this, arguments); };
      for (let level = 1; level <= X.C.BAND_RNG_LEVEL + 1; level++) colors.push(X.wellBandColor(level, 0.5));
    } finally { proto[Symbol.iterator] = iter; }
    const ok = calls === 0 && colors.every(c => typeof c === "string" && c.length > 0);
    return { ok, why: `${calls} array iterators over ${colors.length} levels`, colors };
  },
};

// ---------------------------------------------------------------------------
// 1. The frame-budget gate, on the fixed build
// ---------------------------------------------------------------------------
const X = build();
const { C, state } = X;
stage(X);
H.eq(state.screen, "play", "the board is a play frame (the HUD draws)");
H.eq(state.enemies.length, C.ENEMY_CAP, "⛔ non-vacuous: the board holds ENEMY_CAP enemies");
H.eq(C.ENEMY_CAP, 16, "S2: 16 enemies");
H.eq(state.shots.length, C.SPREAD_SHOT_MAX, "⛔ non-vacuous: the board holds Spread's cap in force");
H.eq(C.SPREAD_SHOT_MAX, 24, "S2: 24 shots");
H.eq(state.tokens.length, C.MAX_TOKENS, "⛔ non-vacuous: the board holds MAX_TOKENS tokens");
H.eq(C.MAX_TOKENS, 2, "S2: 2 tokens");
H.eq(new Set(KINDS).size, Object.keys(X.ENEMY_KINDS).length, "every ENEMY_KINDS row is on the board");
const n = countDraw(X);
H.eq(n.strokes, BUDGET_STROKES, "⛔ THE GATE: strokes per draw() on S2's board did not move");
H.eq(n.texts, BUDGET_TEXT_CALLS, "⛔ THE GATE: fillText + strokeText per draw() did not move");
H.eq(n.drawText, BUDGET_DRAW_TEXTS, "⛔ and drawText() calls per draw()");
H.eq(n.drawShot, C.SPREAD_SHOT_MAX, "every shot drew");
H.eq(n.drawToken, C.MAX_TOKENS, "both tokens drew");
H.eq(n.drawFragments, 1, "the death's fragments drew");
H.eq(n.drawPrompt, 1, "the prompt drew");
H.assert(n.strings.includes(C.PROMPTS[0].text), "the fading prompt's line is on the frame");
H.assert(n.strings.includes(X.hudComboText({ combo: 4 })), "the combo readout is on the frame");
H.eq(countDraw(X).strokes, BUDGET_STROKES, "a second draw() of the same board costs the same");

// ---------------------------------------------------------------------------
// 2. The four sites, each mutation-checked with its old line put back
// ---------------------------------------------------------------------------
const SCRIPT = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const count = s => { let k = 0, at = -1; while ((at = SCRIPT.indexOf(s, at + 1)) >= 0) k++; return k; };
const fixed = {};
for (const name of Object.keys(PROBES)) {
  const r = PROBES[name](build());
  fixed[name] = r;
  H.assert(r.ok, `⛔ ${name}() allocates nothing on the draw path (${r.why})`);
}
for (const name of Object.keys(OLD)) {
  const [from, to] = OLD[name];
  if (!H.eq(count(from), 1, `the ${name} line is in the build exactly once (the mutant can be built)`)) continue;
  let r = null;
  try { r = PROBES[name](build({ mutate: [[from, to]] })); } catch (e) { r = { threw: String(e && e.message) }; }
  H.assert(r && !r.threw, `the ${name} mutant runs (${r && r.threw})`);
  H.assert(r && !r.threw && r.ok === false, `⛔ MUTANT: ${name}()'s old line put back is RED (${r && r.why})`);
}

// ---------------------------------------------------------------------------
// 3. The draw path writes no state: new against old, frame by frame
// ---------------------------------------------------------------------------
const HEAD_MUTATE = Object.values(OLD);
{
  const Y = build({ mutate: HEAD_MUTATE });
  stage(Y);
  const m = countDraw(Y);
  H.eq(m.strokes, BUDGET_STROKES, "the HEAD draw path issues the same strokes (the constant was read off it)");
  H.eq(m.texts, BUDGET_TEXT_CALLS, "and the same text calls");
  const rimOld = PROBES.projectPoly(Y).rim, rimNew = fixed.projectPoly.rim;
  H.assert(rimOld && rimNew && JSON.stringify(rimOld) === JSON.stringify(rimNew),
           "⛔ the cached rim projects to exactly the HEAD's screen points");
  const bandOld = PROBES.wellBandColor(Y).colors, bandNew = fixed.wellBandColor.colors;
  H.assert(bandOld.length > 0 && JSON.stringify(bandOld) === JSON.stringify(bandNew),
           `⛔ the indexed loop answers exactly the HEAD's colour at every level 1..${C.BAND_RNG_LEVEL + 1}`);
}

function hashState(st, q) {
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
  walk(st); walk(q);
  return h;
}

const FRAMES = 3600;
const BASE = 1758600000000;
function playSession(Y) {
  const G = Y.Game, st = Y.state, inp = G.input, MS = Y.C.FIXED_DT * 1000;
  let f = 0;
  const realNow = Date.now;
  Date.now = () => BASE + f * MS;                       // wall time: a read does not advance it
  const hashes = [];
  const seen = { shots: 0, faded: 0, texts: 0, restarts: 0 };
  try {
    G.reset();
    Y.startGame(SEED, { mode: "overdrive", startDepth: 1 });
    for (f = 0; f < FRAMES; f++) {
      if (f % 53 === 0)  inp.keyDown("ArrowRight");
      if (f % 53 === 11) inp.keyUp("ArrowRight");
      if (f % 71 === 0)  inp.keyDown("ArrowLeft");
      if (f % 71 === 31) inp.keyUp("ArrowLeft");
      if (f % 13 === 0)  inp.keyDown(" ");
      if (f % 13 === 9)  inp.keyUp(" ");
      const q = Y.promptQueue;
      if (q.rows.length && q.t > Y.C.PROMPT_TIME - Y.C.PROMPT_FADE) seen.faded++;
      const shots0 = Y.drawShot.calls, texts0 = Y.drawText.calls;
      G.frame(BASE + f * MS);
      seen.shots += Y.drawShot.calls - shots0;
      seen.texts += Y.drawText.calls - texts0;
      if (st.screen === "gameover") { seen.restarts++; Y.startGame(SEED + seen.restarts * 7919, { mode: "overdrive", startDepth: 1 }); }
      hashes.push(hashState(st, Y.promptQueue));
    }
  } finally { Date.now = realNow; }
  return { hashes, seen };
}
{
  const a = playSession(build());
  const b = playSession(build({ mutate: HEAD_MUTATE }));
  let first = -1;
  for (let i = 0; i < FRAMES; i++) if (a.hashes[i] !== b.hashes[i]) { first = i; break; }
  H.eq(first, -1, `⛔ a played Overdrive session hashes identically, frame by frame, with the HEAD draw path (${FRAMES} frames)`);
  H.assert(a.seen.shots > 1000, `non-vacuous: shots drew (${a.seen.shots})`);
  H.assert(a.seen.faded > 10, `non-vacuous: a prompt faded on screen (${a.seen.faded} frames)`);
  H.assert(a.seen.texts > FRAMES, `non-vacuous: text drew every frame (${a.seen.texts})`);
}

H.report();

// test-cs008-p4.js — CS008 P4: text, the HUD and the death fragmentation (GDD
// 10.2, 10.3, 10.4, 4.3, 4.4; plan §5). Asserts what P4 owns: drawText() is
// the one fillText/strokeText site and no rectangle is drawn anywhere; the HUD
// rectangles hudLayout() returns clear the throat zone on all sixteen wells and
// both touch buttons, mirrored and not, and the drawn geometry sits inside
// them; reserve icons are lives − 1; the Purge glyph is bright / dim / absent;
// and drawFragments() is a pure function of hit-stop progress.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The touch buttons are probed through the REAL hit test (createInput's
//     touchStart), not a copy of touchButtonCenters(), with a positive control
//     at each button's centre so a probe that never registers cannot pass.
//  2. The stub ctx is a Proxy Game holds, so recording patches its methods and
//     restores them; a recorder that never sees a stroke is asserted against.
//  3. The freeze only exists in Game.frame(), driven at HALF a step per frame
//     (test-cs003-p4.js's rule) so the last frozen frame is observable.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260914;
installSeed(SEED);
const X = H.buildGame();
const { C, state, WELLS } = X;
const G = X.Game;
const script = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

for (const n of ["drawText", "drawHud", "hudLayout", "PURGE_GLYPH_POLY", "drawFragments", "fragmentT"]) {
  H.assert(X[n] !== null, `the build defines ${n}`);
}

// ---------------------------------------------------------------------------
// ⛔ ONE TEXT PATH, NO RECTANGLES (T1, GDD 10.2)
// ---------------------------------------------------------------------------

const count = (s, re) => (s.match(re) || []).length;
H.eq(count(script, /\.fillText\s*\(/g), 1, "⛔ exactly one fillText call site in the built file");
H.eq(count(script, /\.strokeText\s*\(/g), 1, "⛔ exactly one strokeText call site in the built file");
H.eq(count(script, /fillRect/g), 0, "⛔ no fillRect anywhere in the built file");
H.eq(count(script, /strokeRect/g), 0, "⛔ no strokeRect anywhere in the built file");

function fnBody(name) {
  const i = script.indexOf(`function ${name}(`);
  if (i < 0) return "";
  let j = script.indexOf("{", i), depth = 0;
  for (let k = j; k < script.length; k++) {
    if (script[k] === "{") depth++;
    else if (script[k] === "}" && --depth === 0) return script.slice(i, k + 1);
  }
  return "";
}
const textBody = fnBody("drawText");
H.assert(/\.fillText\s*\(/.test(textBody) && /\.strokeText\s*\(/.test(textBody),
         "⛔ and both sites are inside drawText()");
H.assert(textBody.includes('"lighter"') && !textBody.includes("shadowBlur"),
         "drawText glows by GDD 10.2's two passes under lighter, never shadowBlur");
H.assert(!/fillText|strokeText/.test(fnBody("drawHud")) && fnBody("drawHud").includes("drawText("),
         "drawHud writes its text through drawText()");

// ---------------------------------------------------------------------------
// The recorder (TRAP 2)
// ---------------------------------------------------------------------------

const ctx2d = X._env.canvas.getContext("2d");
const PATCH = ["beginPath", "moveTo", "lineTo", "closePath", "stroke", "fillText", "strokeText"];
function record(fn) {
  const prev = {};
  for (const k of PATCH) prev[k] = ctx2d[k];
  const log = { paths: [], texts: [], calls: [] };
  let cur = null;
  ctx2d.beginPath = () => { cur = { pts: [], closed: false, strokes: [] }; log.paths.push(cur); log.calls.push("B"); };
  ctx2d.moveTo = (x, y) => { cur.pts.push({ x, y }); log.calls.push(`M${x},${y}`); };
  ctx2d.lineTo = (x, y) => { cur.pts.push({ x, y }); log.calls.push(`L${x},${y}`); };
  ctx2d.closePath = () => { cur.closed = true; log.calls.push("Z"); };
  ctx2d.stroke = () => {
    const s = { w: ctx2d.lineWidth, a: ctx2d.globalAlpha, c: ctx2d.strokeStyle };
    if (cur) cur.strokes.push(s);
    log.calls.push(`S${s.w},${s.a},${s.c}`);
  };
  ctx2d.fillText = (str, x, y) => { log.texts.push({ kind: "fill", str, x, y, a: ctx2d.textAlign, c: ctx2d.fillStyle, f: ctx2d.font }); };
  ctx2d.strokeText = (str, x, y) => { log.texts.push({ kind: "stroke", str, x, y, a: ctx2d.textAlign }); };
  try { fn(ctx2d); } finally { for (const k of PATCH) ctx2d[k] = prev[k]; }
  return log;
}

// drawText: the wide dim stroke, then the bright fill, same string and place.
{
  const log = record(ctx => X.drawText(ctx, "LEVEL 7", 100, 50, 28, "#123456", "right"));
  H.eq(log.texts.map(t => t.kind).join(","), "stroke,fill", "drawText strokes wide first, then fills");
  H.assert(log.texts.every(t => t.str === "LEVEL 7" && t.x === 100 && t.y === 50 && t.a === "right"),
           "both passes draw the same string at the same place and alignment");
  H.assert(log.texts[1].f.includes(C.TEXT_FONT_FAMILY) && log.texts[1].f.startsWith("28px"),
           "the font is the size over C.TEXT_FONT_FAMILY");
}

// ---------------------------------------------------------------------------
// The HUD rectangles
// ---------------------------------------------------------------------------

function view(o) {
  return Object.assign({ score: 0, lives: C.START_LIVES, level: 1, levelColor: "#3FE0FF",
                         purgeUses: 0, mirror: false, icon: X.SKIMMER_POLY }, o);
}
function copyLayout(v) {
  const L = X.hudLayout(v);
  const r = k => ({ x: L[k].x, y: L[k].y, w: L[k].w, h: L[k].h });
  return { score: r("score"), lives: r("lives"), level: r("level"), purge: r("purge"),
           lifeIcons: L.lifeIcons, purgeAlpha: L.purgeAlpha };
}
const RECTS = ["score", "lives", "level", "purge"];
// The widest each corner gets: an eight-digit score, a full reserve, three digits of level.
const WIDE = { score: 99999999, lives: C.LIVES_MAX, level: 999, purgeUses: 0 };
const overlap = (r, b) => r.x < b.x1 && r.x + r.w > b.x0 && r.y < b.y1 && r.y + r.h > b.y0;

for (const mirror of [false, true]) {
  const L = copyLayout(view(Object.assign({}, WIDE, { mirror })));
  for (const k of RECTS) {
    const r = L[k];
    H.assert(r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= C.WORLD_W && r.y + r.h <= C.WORLD_H,
             `${k} (mirror ${mirror}) is a real rectangle on the world`);
  }
  H.assert(L.score.x + L.score.w < L.level.x, `score and level do not collide at their widest (mirror ${mirror})`);
  H.assert(L.lives.x + L.lives.w < L.purge.x, `lives and the Purge glyph do not collide (mirror ${mirror})`);

  // ⛔ GDD 10.3 — the throat zone's bounding box on every well, sampled over
  // every lane position at quarter-lane steps and every depth below the line.
  let bad = 0;
  for (let w = 0; w < WELLS.length; w++) {
    const well = WELLS[w];
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const p = { x: 0, y: 0 };
    const hi = X.wellVertCount(well) - 1;
    for (let lane = 0; lane <= hi; lane += 0.25) {
      for (let d = 0; d < C.READABILITY_DEPTH; d += 0.01) {
        X.screenPos(well, lane, d, p);
        b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x);
        b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y);
      }
    }
    for (const k of RECTS) if (overlap(L[k], b)) { bad++; console.error(`well ${w} ${k} mirror ${mirror}`); }
  }
  H.eq(bad, 0, `⛔ no HUD rectangle overlaps the throat zone on any of the 16 wells (mirror ${mirror})`);

  // ⛔ H3 — the real touch hit test, probed over every rectangle (TRAP 1).
  const input = X.createInput({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS,
    keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP,
    pointerLockOffer: C.POINTER_LOCK_OFFER,
    touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC,
    touchAutofire: C.TOUCH_AUTOFIRE, touchButtonR: C.TOUCH_BUTTON_R,
    gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: mirror, worldW: C.WORLD_W, worldH: C.WORLD_H,
  });
  const hits = (x, y) => {
    input.touchStart(1, x, y);
    const s = input.sample(C.FIXED_DT);
    const hit = s.purge || s.jump;   // read before reset(): `s` is the module's shared struct
    input.touchEnd(1);
    input.reset();
    return hit;
  };
  const m = C.TOUCH_BUTTON_R * 1.5, bx = mirror ? m : C.WORLD_W - m;
  H.assert(hits(bx, m) && hits(bx, C.WORLD_H - m), `the probe registers at both button centres (mirror ${mirror})`);
  let touched = 0, probes = 0;
  for (const k of RECTS) {
    const r = L[k];
    for (let x = r.x; x <= r.x + r.w; x += 1) {
      for (let y = r.y; y <= r.y + r.h; y += 1) { probes++; if (hits(x, y)) { touched++; break; } }
    }
  }
  H.assert(probes > 1000, `the probe covered the rectangles (${probes})`);
  H.eq(touched, 0, `⛔ no HUD rectangle point lands on a touch button (mirror ${mirror})`);
}

// ---------------------------------------------------------------------------
// What drawHud draws: inside its rectangles, lives − 1 icons, the Purge glyph
// ---------------------------------------------------------------------------

const inside = (pt, r) => pt.x >= r.x - 1e-9 && pt.x <= r.x + r.w + 1e-9 && pt.y >= r.y - 1e-9 && pt.y <= r.y + r.h + 1e-9;

for (const mirror of [false, true]) {
  for (let lives = 0; lives <= C.LIVES_MAX; lives++) {
    for (const uses of [0, 1, 2, 3, 7]) {
      const v = view({ score: 123450, lives, level: 42, levelColor: "#FF4FD8", purgeUses: uses, mirror });
      const L = copyLayout(v);
      const log = record(ctx => X.drawHud(ctx, v));
      const tag = `lives ${lives}, uses ${uses}, mirror ${mirror}`;

      const icons = log.paths.filter(p => p.pts.length > 0 && p.pts.every(pt => inside(pt, L.lives)));
      const glyphs = log.paths.filter(p => p.pts.length > 0 && p.pts.every(pt => inside(pt, L.purge)));
      H.eq(log.paths.length, icons.length + glyphs.length, `every HUD path is inside its corner (${tag})`);
      H.eq(icons.length, Math.max(0, lives - 1), `⛔ H1 — reserve icons equal lives − 1 (${tag})`);
      H.assert(icons.every(p => p.closed && p.pts.length === X.SKIMMER_POLY.length),
               `each icon is the craft's own closed outline (${tag})`);

      const want = uses === 0 ? 1 : (uses === 1 ? C.HUD_PURGE_DIM_ALPHA : 0);
      if (want === 0) {
        H.eq(glyphs.length, 0, `⛔ the Purge glyph is ABSENT at ${uses} uses (${tag})`);
      } else {
        H.eq(glyphs.length, 1, `the Purge glyph is drawn at ${uses} uses (${tag})`);
        const thin = glyphs[0] && glyphs[0].strokes[1];
        H.close(thin ? thin.a : NaN, C.GLOW_THIN_ALPHA * want, 1e-12,
                `⛔ the glyph is ${uses === 0 ? "BRIGHT" : "DIM"} at ${uses} uses (${tag})`);
      }

      const fills = log.texts.filter(t => t.kind === "fill");
      const sc = fills.find(t => t.str === "123450"), lv = fills.find(t => t.str === "LEVEL 42");
      H.assert(sc && sc.x === L.score.x && sc.y === L.score.y && sc.a === "left",
               `score top-left at its rectangle (${tag})`);
      H.assert(lv && lv.x === L.level.x + L.level.w && lv.y === L.level.y && lv.a === "right" && lv.c === "#FF4FD8",
               `⛔ H2 — "LEVEL n" right-aligned at its rectangle, in the view's colour (${tag})`);
    }
  }
}

// Game.draw() hands the HUD the live numbers, and the band colour from bandRoll.
{
  G.reset();
  X.startGame(SEED);
  G.update(C.FIXED_DT);
  state.level = 150; state.bandRoll = 0.5; state.score = 777; state.lives = 4; state.purgeUses = 1;
  const log = record(() => G.draw());
  const lv = log.texts.find(t => t.kind === "fill" && t.str === "LEVEL 150");
  H.assert(lv && lv.c === X.wellBandColor(150, 0.5), "⛔ Game.draw() colours LEVEL n with wellBandColor(level, bandRoll)");
  H.assert(log.texts.some(t => t.kind === "fill" && t.str === "777"), "Game.draw() shows state.score");
  const L = copyLayout(view({ score: 777, lives: 4, level: 150, purgeUses: 1, mirror: C.INPUT_MIRROR }));
  const icons = log.paths.filter(p => p.pts.length && p.pts.every(pt => inside(pt, L.lives)));
  H.eq(icons.length, 3, "Game.draw() draws lives − 1 reserve craft off state.lives");
  H.assert(log.texts.length >= 4 && log.calls.lastIndexOf("B") < log.calls.length,
           "the recorder saw the HUD (TRAP 2)");
  // Last: nothing strokes after the HUD's final path.
  const lastHudPath = log.paths[log.paths.length - 1];
  H.assert(lastHudPath.pts.every(pt => inside(pt, L.purge)), "⛔ the HUD is drawn LAST in Game.draw()");
}

// ---------------------------------------------------------------------------
// ⛔ THE FRAGMENTATION IS A PURE FUNCTION OF HIT-STOP PROGRESS (U9)
// ---------------------------------------------------------------------------

{
  const pts = X.SKIMMER_POLY.map((p, i) => ({ x: 600 + p.l * 40, y: 600 + p.d * 90 }));
  const a = record(ctx => X.drawFragments(ctx, pts, true, 0.37, "#FFFFFF"));
  const b = record(ctx => X.drawFragments(ctx, pts, true, 0.37, "#FFFFFF"));
  H.assert(a.calls.length > 0, "the fragments draw (TRAP 2)");
  H.eq(a.calls.join("|"), b.calls.join("|"), "⛔ identical hit-stop progress gives identical draw calls");
  const c = record(ctx => X.drawFragments(ctx, pts, true, 0.38, "#FFFFFF"));
  H.assert(a.calls.join("|") !== c.calls.join("|"), "and different progress gives different calls");

  H.eq(a.paths.length, pts.length, "closed: one fragment per outline segment, the closing edge included");
  H.eq(record(ctx => X.drawFragments(ctx, pts, false, 0.37, "#FFFFFF")).paths.length, pts.length - 1,
       "open: one fewer");
  H.assert(a.paths.every(p => p.pts.length === 2 && !p.closed), "each fragment is one open two-point segment");
  H.close(a.paths[0].strokes[1].a, C.GLOW_THIN_ALPHA * (1 - 0.37), 1e-12, "fades as 1 − t");

  // t = 0 is the craft itself, segment for segment.
  const z = record(ctx => X.drawFragments(ctx, pts, true, 0, "#FFFFFF"));
  let off = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], s = z.paths[i].pts;
    off = Math.max(off, Math.hypot(s[0].x - p.x, s[0].y - p.y), Math.hypot(s[1].x - q.x, s[1].y - q.y));
  }
  H.close(off, 0, 1e-9, "at t = 0 every fragment lies on its own outline segment");

  // Outward: each segment's midpoint moves C.FRAG_DRIFT away from the centroid by t = 1⁻.
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const late = record(ctx => X.drawFragments(ctx, pts, true, 0.999999, "#FFFFFF"));
  let drift = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const s0 = z.paths[i].pts, s1 = late.paths[i].pts;
    const r0 = Math.hypot((s0[0].x + s0[1].x) / 2 - cx, (s0[0].y + s0[1].y) / 2 - cy);
    const r1 = Math.hypot((s1[0].x + s1[1].x) / 2 - cx, (s1[0].y + s1[1].y) / 2 - cy);
    drift = Math.min(drift, r1 - r0);
  }
  H.close(drift, C.FRAG_DRIFT, 1e-3, "every segment drifts outward by C.FRAG_DRIFT");
  H.eq(record(ctx => X.drawFragments(ctx, pts, true, 1, "#FFFFFF")).calls.length, 0, "t = 1 is spent and draws nothing");

  // ⛔ No RNG reachable: the two functions name nothing but C, Math and the primitives.
  for (const name of ["drawFragments", "fragmentT"]) {
    const body = fnBody(name).replace(/\/\/[^\n]*/g, "");
    H.assert(body.length > 0, `${name} found in the built file`);
    for (const bad of ["rng", "random", "state", "Game", "Date", "performance", "hitStopLeft"]) {
      H.assert(!body.includes(bad), `⛔ ${name} names no "${bad}"`);
    }
    const called = new Set((body.match(/\b([A-Za-z_$][\w$]*)\s*\(/g) || []).map(s => s.replace(/\s*\($/, "")));
    for (const fn of called) {
      H.assert(["function", name, "drawPoly", "glowStroke", "sqrt", "cos", "sin", "if", "for"].includes(fn),
               `⛔ ${name} calls only the primitives and Math (found ${fn})`);
    }
  }
}

// ⛔ t runs 0 → 1 across C.HIT_STOP_DEATH, through the real loop (TRAP 3).
{
  const MS = C.FIXED_DT * 1000;
  G.reset();
  X.startGame(SEED);
  state.spawn.remaining = 1; state.spawn.timer = 0; state.enemies = []; state.shots = [];
  let clock = 0;
  G.frame(0);
  G.frame(clock += MS);                          // one live step, so the craft exists
  const realRng = state.rng;
  state.rng = () => { throw new Error("the draw path spent a draw"); };

  X.killSkimmer(state);
  H.assert(state.skimmer.dead && G.hitStopLeft === C.HIT_STOP_DEATH, "the fixture died and froze");

  const ts = [], alphas = [];
  let threw = null, frozenSteps = 0, strokesSeen = 0;
  const lanes = state.skimmer.lane;
  try {
    ts.push(X.fragmentT(G.hitStopLeft, C.HIT_STOP_DEATH));
    let log = record(() => G.draw());
    alphas.push(log.paths.length ? log.paths[0].strokes[1].a : null);
    for (let n = 0; n < 400 && state.skimmer.dead; n++) {
      const before = G.hitStopLeft, ticks = G.stats.ticks;
      log = record(() => { clock += MS / 2; G.frame(clock); });
      if (before > 0 && G.stats.ticks === ticks && G.stats.lastSteps > 0) frozenSteps++;
      if (!state.skimmer.dead) break;
      const t = X.fragmentT(G.hitStopLeft, C.HIT_STOP_DEATH);
      ts.push(t);
      const frag = log.paths.filter(p => p.pts.length === 2 && p.strokes[0] && p.strokes[0].c === C.SKIMMER_COLOR);
      strokesSeen += frag.length;
      alphas.push(frag.length ? frag[0].strokes[1].a : null);
    }
  } catch (e) { threw = e; }
  state.rng = realRng;

  H.eq(threw, null, "⛔ no draw across the whole freeze reaches state.rng");
  H.eq(ts[0], 0, "⛔ t is 0 on the death frame");
  H.eq(ts[ts.length - 1], 1, "⛔ t is 1 as the freeze ends");
  H.assert(ts.every((t, i) => i === 0 || t >= ts[i - 1]), "t never runs backwards");
  H.close(frozenSteps * C.FIXED_DT, C.HIT_STOP_DEATH, C.FIXED_DT + 1e-9,
          "⛔ and it takes C.HIT_STOP_DEATH of frozen steps to get there");
  H.assert(strokesSeen > 0, "the fragments reached Game.draw()'s renderer");
  let alphaBad = 0;
  for (let i = 0; i < ts.length; i++) {
    if (ts[i] < 1) { if (alphas[i] === null || Math.abs(alphas[i] - C.GLOW_THIN_ALPHA * (1 - ts[i])) > 1e-12) alphaBad++; }
    else if (alphas[i] !== null) alphaBad++;
  }
  H.eq(alphaBad, 0, "⛔ Game.draw() fragments at exactly 1 − t every frame, and draws none once spent");
  H.eq(state.skimmer.dead, false, "the next live step respawns the craft");
  H.eq(state.skimmer.lane, lanes, "in the same lane");
}

H.report("test-cs008-p4.js");

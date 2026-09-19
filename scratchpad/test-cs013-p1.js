// test-cs013-p1.js — CS013 P1: Overdrive's tokens (GDD 10.3, 14.1, 16.3, 17
// items 8 and 12; PLANNED-FEATURES-CS013.md T1–T6, T10, T11, R2, R3, R11).
// Asserts what P1 owns: the two tables as data, the mode flag, dropToken()'s one
// draw per Overdrive kill and none in Classic, the drop curve and the kinds at
// every band edge, a token's life (birth, rise, hover, collection, expiry), the
// well owning tokens and powers, Bounty and Recharge, the faded draw, and
// MAX_TOKENS on played boards — mutation-checked.
//
// ⛔ TRAPS.
//  1. startGame() rebuilds state.rng, so a counting wrapper goes on AFTER it.
//  2. Expected values are WRITTEN OUT (GDD 14.1's literals and T2/T3's table).
//  3. A step count is never asserted: 1/60 is not a binary fraction (STATUS).
//  4. mutantRed() finds its string exactly once in the build BEFORE it asserts
//     red, and a mutant's run reports counts, never a throw.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260919;
installSeed(SEED);                          // ⛔ above the first buildGame()
const SPIES = ["dropToken", "collectToken", "addScore", "glowStroke", "drawPoly", "drawToken"];
const X = H.buildGame({ spy: SPIES });
const C = X.C, G = X.Game, S = X.state, DT = C.FIXED_DT;
const J = JSON.stringify;
const SCRIPT = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const RING = 0, VEE = 7;
H.assert(X.WELLS[RING].closed && X.WELLS[RING].lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(!X.WELLS[VEE].closed && X.WELLS[VEE].lanes === 13, "fixture: WELLS[7] is the open 13-lane Vee");

// A quiet board: spawner held, nothing on it, no input.
function quiet(mode, wellIndex) {
  G.reset();
  X.startGame(SEED, { mode });
  S.wellIndex = wellIndex === undefined ? RING : wellIndex;
  X.enterWell();
  S.spawn.remaining = 1;
  S.spawn.timer = -1e9;
  S.enemies = [];
  S.shots = [];
  G.input.reset();
  return X.WELLS[S.wellIndex];
}
function victim(Z, lane, depth) { const v = new Z.Vaulter(lane, depth, 1); v.dead = true; return v; }
function withStream(values, fn) {
  const real = S.rng;
  let i = 0, draws = 0;
  S.rng = () => { draws++; return values[Math.min(i++, values.length - 1)]; };
  try { fn(); } finally { S.rng = real; }
  return draws;
}

// ---------------------------------------------------------------------------
// 1. THE TWO TABLES, THE FLAG AND THE STATE (R2, R3, plan §8) — trap 2
// ---------------------------------------------------------------------------
H.eq(J(C.MODE_FLAGS.classic), J({ jump: false, combo: false, tokens: false }), "⛔ Classic's row: tokens false (R3)");
H.eq(J(C.MODE_FLAGS.overdrive), J({ jump: true, combo: true, tokens: true }), "⛔ Overdrive's row: tokens true (R3)");
H.eq(J(Object.keys(C.MODE_FLAGS)), J(["classic", "overdrive"]), "⛔ a field in the rows, never a new top-level mode key");
H.eq(X.modeHas("tokens", "classic"), false, "modeHas(\"tokens\", \"classic\") is false");
H.eq(X.modeHas("tokens", "overdrive"), true, "modeHas(\"tokens\", \"overdrive\") is true");
H.eq(J(C.TOKEN_WEIGHTS), J({ bounty: 3, lance: 2, spread: 2, ward: 2, recharge: 1 }), "⛔ the drop-weight table is T3's, in its key order");
for (const [k, v] of [["MAX_TOKENS", 2], ["TOKEN_HOVER_DEPTH", 0.8], ["BOUNTY_POINTS", 2000], ["TOKEN_LIFE", 9],
                      ["TOKEN_DROP_CHANCE", 0.1], ["TOKEN_RISE", 0.3], ["LANCE_CHIP_MULT", 3], ["SPREAD_SHOT_MAX", 24],
                      ["TOKEN_COLOR", "#FFF347"]]) {
  H.eq(C[k], v, `C.${k} is GDD 14.1's / plan §0's ${v}`);
}
{
  const fnText = n => { const at = SCRIPT.indexOf(`\nfunction ${n}(`); return SCRIPT.slice(at, SCRIPT.indexOf("\n}\n", at)); };
  const code = n => fnText(n).replace(/\/\/.*$/gm, "");
  const BUDGET = /BOUNTY_POINTS|LANCE_CHIP_MULT|SPREAD_SHOT_MAX/, WEIGHT = /TOKEN_WEIGHTS|TOKEN_DROP_CHANCE/;
  H.assert(!BUDGET.test(code("tokenKind")) && !BUDGET.test(code("dropToken")), "⛔ the drop side names no budget (plan §8)");
  H.assert(!WEIGHT.test(code("collectToken")), "⛔ and the effect side names no weight — the two tables are two");
  H.assert(!/rng|random/i.test(code("drawToken") + code("tokenGlyph")), "⛔ nothing in the token's draw path draws a random value");
  const warm = Object.keys(C).filter(k => /_COLOR$/.test(k) && k !== "TOKEN_COLOR").map(k => C[k]);
  const bands = (C.BAND_COLORS || []).map(b => b.color).concat(C.BAND_RNG_COLORS || []);
  H.assert(warm.concat(bands).every(c => typeof c !== "string" || c.toUpperCase() !== C.TOKEN_COLOR.toUpperCase()),
           "⛔ C.TOKEN_COLOR is no enemy's, band's or HUD's colour (T10; STATUS: O16 stays closed)");
}
{
  const n = X.newState();
  H.eq(J(n.tokens), "[]", "⛔ newState(): tokens is an empty array (R2)");
  H.eq(J(n.powers), J({ lance: false, spread: false, ward: false }), "⛔ newState(): every power off (R2)");
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE DROP, STAGED THROUGH THE REAL dropToken() (T2, T3, T4)
// ---------------------------------------------------------------------------
quiet("overdrive");
{
  const P = { 0: 0.1, 1: 0.05, 3: 0.025 };  // T2's curve, written out: 0.10 / (1 + threats)
  for (const n of [0, 1, 3]) {
    quiet("overdrive");
    for (let i = 0; i < n; i++) S.enemies.push(new X.Vaulter(5 + i, 0.5, 1));
    S.enemies.push(victim(X, 9, 0.5));        // a dead enemy is not a threat
    H.eq(X.threatCount(S), n, `fixture: ${n} live threats`);
    let d = withStream([P[n] * (1 - 1e-9)], () => X.dropToken(S, victim(X, 3, 0.4)));
    H.eq(S.tokens.length, 1, `⛔ ${n} threats: a draw just under ${P[n]} drops`);
    H.eq(d, 1, `and spends exactly one draw`);
    S.tokens = [];
    d = withStream([P[n]], () => X.dropToken(S, victim(X, 3, 0.4)));
    H.eq(S.tokens.length, 0, `⛔ ${n} threats: a draw AT ${P[n]} does not — p falls as the board fills`);
    H.eq(d, 1, "and still spends exactly one draw");
  }

  // T3's kinds at every band edge, off the SAME draw rescaled (p = 0.1).
  const EDGES = [[0.3, "bounty", "lance"], [0.5, "lance", "spread"], [0.7, "spread", "ward"], [0.9, "ward", "recharge"]];
  const kindAt = u => { quiet("overdrive"); withStream([u], () => X.dropToken(S, victim(X, 3, 0.4))); return S.tokens.length ? S.tokens[0].kind : null; };
  H.eq(kindAt(0), "bounty", "⛔ the bottom of the draw is a Bounty");
  H.eq(kindAt(0.1 * (1 - 1e-9)), "recharge", "⛔ the top of the drop band is a Recharge");
  for (const [e, lo, hi] of EDGES) {
    H.eq(kindAt(0.1 * (e - 1e-9)), lo, `⛔ just under the ${e} edge is ${lo}`);
    H.eq(kindAt(0.1 * (e + 1e-9)), hi, `⛔ just over it is ${hi}`);
  }

  // MAX_TOKENS: the draw is spent and the drop discarded.
  quiet("overdrive");
  withStream([0], () => { X.dropToken(S, victim(X, 1, 0.4)); X.dropToken(S, victim(X, 5, 0.4)); });
  H.eq(S.tokens.length, C.MAX_TOKENS, "fixture: two tokens on the board");
  const d = withStream([0], () => X.dropToken(S, victim(X, 9, 0.4)));
  H.eq(S.tokens.length, 2, "⛔ at MAX_TOKENS a winning draw adds nothing");
  H.eq(d, 1, "⛔ and still spends exactly its one draw");

  // Birth (T4): the victim's lane rounded to a centre; its depth or the hover's.
  const born = (wi, lane, depth) => { quiet("overdrive", wi); withStream([0], () => X.dropToken(S, victim(X, lane, depth))); return S.tokens[0]; };
  let t = born(RING, 3.4, 0.12);
  H.eq(J([t.lane, t.depth, t.age, t.dead]), J([3, 0.12, 0, false]), "⛔ born at the victim's lane centre and depth, age 0");
  t = born(RING, 15.6, 0.97);
  H.eq(J([t.lane, t.depth]), J([0, 0.8]), "⛔ across a Ring's seam it wraps to lane 0; a rim kill is born at the hover depth");
  t = born(VEE, 12.4, 0.5);
  H.eq(t.lane, 12, "⛔ an open well's end lane stays in range");
  t = born(RING, -0.4, 0.5);
  H.assert(Object.is(t.lane, 0), "a lane of -0.4 is +0, never -0");

  // ⛔ Classic: a total no-op — no draw, no token.
  quiet("classic");
  const dc = withStream([0], () => X.dropToken(S, victim(X, 3, 0.4)));
  H.eq(dc, 0, "⛔ Classic: dropToken() spends NO draw");
  H.eq(S.tokens.length, 0, "⛔ and drops nothing");
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE LIFE ON THE BOARD, STAGED (T4) — trap 3
// ---------------------------------------------------------------------------
function stage(wi, lane, depth, kind) {
  const well = quiet("overdrive", wi);
  const u = { bounty: 0, lance: 0.035, spread: 0.055, ward: 0.075, recharge: 0.095 }[kind || "lance"];
  withStream([u], () => X.dropToken(S, victim(X, lane, depth)));
  return { well, t: S.tokens[0] };
}
{
  // Out of lane: it rises, hovers, and expires — never collected.
  const { t } = stage(RING, 3, 0.05);
  S.skimmer.lane = 8;
  let prev = t.depth, badRise = 0, badHold = 0, alive = 0, reached = false;
  while (S.tokens.indexOf(t) >= 0) {
    if (!(t.age < C.TOKEN_LIFE)) badHold++;
    G.update(DT);
    alive++;
    if (S.tokens.indexOf(t) < 0) break;
    const want = Math.min(prev + C.TOKEN_RISE * DT, C.TOKEN_HOVER_DEPTH);
    if (Math.abs(t.depth - want) > 1e-12 || t.lane !== 3) badRise++;
    if (t.depth === C.TOKEN_HOVER_DEPTH) reached = true;
    prev = t.depth;
    if (alive > 10000) break;
  }
  H.eq(badRise, 0, "⛔ it rises at C.TOKEN_RISE to the hover depth, holds there, and never leaves its lane");
  H.assert(reached, "fixture: it reached the hover depth");
  H.eq(badHold, 0, "⛔ every live token's age is under C.TOKEN_LIFE");
  H.assert(t.dead && !t.collected && t.age >= C.TOKEN_LIFE && t.age - DT < C.TOKEN_LIFE,
           `⛔ it expired on the step its age reached C.TOKEN_LIFE, uncollected (age ${t.age.toFixed(4)})`);
  H.close(alive * DT, C.TOKEN_LIFE, DT, "and it lived C.TOKEN_LIFE, to within a step");
}
{
  // In lane: not collected while rising; collected once it hovers.
  const { t } = stage(RING, 3, 0.05);
  S.skimmer.lane = 3;
  let early = 0, guard = 0;
  while (S.tokens.indexOf(t) >= 0 && guard++ < 10000) {
    G.update(DT);
    if (t.collected && t.depth < C.TOKEN_HOVER_DEPTH) early++;
  }
  H.eq(early, 0, "⛔ a rising token cannot be collected");
  H.assert(t.collected && t.depth === C.TOKEN_HOVER_DEPTH && t.age < C.TOKEN_LIFE,
           "⛔ a craft in its lane collects it once it hovers");
  H.eq(S.powers.lance, true, "⛔ a Lance pickup sets its lasting flag (R11)");
}
{
  // Lane tolerance, airborne, and a dead craft — through updateTokens() directly.
  const one = (craftLane, setup) => {
    const { well, t } = stage(RING, 3, 0.9);
    S.skimmer.lane = craftLane;
    if (setup) setup();
    X.updateTokens(S, well, DT);
    return t.collected;
  };
  H.eq(one(3.5), true, "⛔ within C.HIT_LANE_TOL (half a lane) it is collected");
  H.eq(one(3.6), false, "⛔ past it, it is not");
  H.eq(one(2.5), true, "and on the other side");
  H.eq(one(3, () => { S.jump.phase = "air"; }), true, "⛔ an airborne craft collects (a pickup is not contact)");
  H.eq(one(3, () => { S.skimmer.dead = true; }), false, "⛔ a dead craft does not");
  const { well } = stage(RING, 3, 0.9);
  S.skimmer.lane = 3;
  withStream([0], () => X.dropToken(S, victim(X, 3, 0.9)));
  const n0 = X.collectToken.calls;
  X.updateTokens(S, well, DT);
  H.eq(X.collectToken.calls - n0, 2, "two tokens in one lane are both taken in one pass");
  H.eq(S.tokens.length, 0, "⛔ and the pass's own filter removes them");
}

// ---------------------------------------------------------------------------
// 4. ⛔ THE WELL OWNS THEM (T5)
// ---------------------------------------------------------------------------
function loaded() {
  stage(RING, 3, 0.3);
  S.skimmer.lane = 9;
  S.powers.lance = S.powers.spread = S.powers.ward = true;
}
loaded();
X.startDive(S);
H.eq(J([S.tokens.length, S.powers]), J([0, { lance: false, spread: false, ward: false }]), "⛔ a Dive empties the tokens and resets every power");
loaded();
X.enterWell();
H.eq(J([S.tokens.length, S.powers]), J([0, { lance: false, spread: false, ward: false }]), "⛔ so does a new well");
{
  loaded();
  S.invulnTime = C.RESPAWN_INVULN;
  const lives = S.lives;
  // ⛔ REPAIRED IN PLACE, CS013 P2 (T9): THE WARD NOW ABSORBS THE FIRST HIT, so
  // reaching a death takes a second one and the shell is spent by the hit it
  // absorbed rather than by the death. T5's claim is unchanged and is what the
  // assertion below still reads: a DEATH keeps the tokens, Lance and Spread.
  X.killSkimmer(S);
  H.eq(J([S.skimmer.dead, S.lives, S.powers.ward]), J([false, lives, false]),
       "fixture: the Ward absorbed the first hit — no death, no life, and the shell spent");
  S.invulnTime = C.RESPAWN_INVULN;           // the Ward armed the respawn window
  X.killSkimmer(S);
  H.eq(S.lives, lives - 1, "fixture: the craft died");
  G.update(DT);                              // the respawn step
  H.assert(!S.skimmer.dead, "fixture: and respawned");
  H.eq(J([S.tokens.length, S.powers]), J([1, { lance: true, spread: true, ward: false }]), "⛔ a death keeps the tokens, Lance and Spread (T5)");
}
{
  loaded();
  const t = { kind: "lance", lane: 9, depth: 0.8, age: 0, dead: false, collected: false };
  const before = J([S.powers, S.score, S.purgeUses, S.combo]);
  X.collectToken(S, t);
  X.collectToken(S, Object.assign({}, t, { kind: "ward" }));
  X.collectToken(S, Object.assign({}, t, { kind: "spread" }));
  H.eq(J([S.powers, S.score, S.purgeUses, S.combo]), before, "⛔ a duplicate changes nothing (T5)");
  H.assert(t.dead && t.collected, "and is still taken");
}

// ---------------------------------------------------------------------------
// 5. ⛔ BOUNTY AND RECHARGE (T6) — GDD 14.1's +2,000, written out
// ---------------------------------------------------------------------------
{
  quiet("overdrive");
  S.combo.mult = 3; S.combo.kills = 2; S.combo.since = 1.25;
  const combo = J(S.combo), s0 = S.score, calls0 = X.addScore.calls;
  X.collectToken(S, { kind: "bounty", lane: 0, depth: 0.8, age: 0, dead: false, collected: false });
  H.eq(S.score - s0, 2000, "⛔ a Bounty pays 2,000 at ×3 — NOT multiplied");
  H.eq(X.addScore.calls - calls0, 1, "⛔ once, through addScore()");
  H.eq(J(S.combo), combo, "⛔ and builds nothing: the combo is untouched");
  S.score = S.nextLife - 1;
  const lives = S.lives;
  X.collectToken(S, { kind: "bounty", lane: 0, depth: 0.8, age: 0, dead: false, collected: false });
  H.eq(S.lives, Math.min(lives + 1, C.LIVES_MAX), "a Bounty that crosses a milestone pays its life, as any addScore() does");
}
function clearPays(recharge) {
  quiet("overdrive");
  S.purgeUses = 2;
  const spent = S.tally.purgesSpent;
  if (recharge) X.collectToken(S, { kind: "recharge", lane: 0, depth: 0.8, age: 0, dead: false, collected: false });
  const uses = S.purgeUses;
  S.spawn.remaining = 0;
  const paid = [];
  X.addScore.before = n => paid.push(n);
  G.update(DT);
  X.addScore.before = null;
  return { uses, paid, dive: S.dive.active, spent: S.tally.purgesSpent - spent };
}
{
  const r = clearPays(true), c = clearPays(false);
  H.eq(r.uses, 0, "⛔ a Recharge restores the Purge to full strength (purgeUses 0)");
  H.eq(r.spent, 0, "and tally.purgesSpent does not move");
  H.assert(r.dive && c.dive, "fixture: both wells cleared");
  H.assert(r.paid.indexOf(500) >= 0, `⛔ the clear then pays "Purge unspent" (500) again (${J(r.paid)})`);
  H.eq(c.paid.indexOf(500), -1, "and without the Recharge it does not (the control)");
}

// ---------------------------------------------------------------------------
// 6. ⛔ THE LOOK (T4, T10; GDD 10.3) — glowStroke spied
// ---------------------------------------------------------------------------
{
  const well = quiet("overdrive");
  const ctx = new Proxy({}, { get: () => () => {} });
  const look = (kind, depth, age) => {
    const strokes = [], paths = [];
    X.glowStroke.before = (c, color, w, alpha) => strokes.push({ color, alpha });
    X.drawPoly.before = (c, pts, closed) => paths.push({ pts, n: pts.length, closed });
    const real = S.rng;
    S.rng = () => { throw new Error("a draw in the draw path"); };
    let threw = null;
    try { X.drawToken(ctx, well, kind, 3, depth, age); } catch (e) { threw = e.message; }
    S.rng = real;
    X.glowStroke.before = null; X.drawPoly.before = null;
    return { strokes, paths, threw };
  };
  const KINDS = ["bounty", "lance", "spread", "ward", "recharge"];
  const shapes = new Set();
  for (const k of KINDS) {
    const lo = look(k, 0.1, 0), hi = look(k, 0.8, 0);
    H.eq(lo.threw, null, `${k}: ⛔ the draw spends no draw from the run's stream`);
    H.assert(lo.strokes.length >= 2 && lo.strokes.every(s => s.color === C.TOKEN_COLOR && s.alpha === X.shotAlpha(0.1)),
             `⛔ ${k} below READABILITY_DEPTH strokes in C.TOKEN_COLOR at shotAlpha()'s ${X.shotAlpha(0.1)}`);
    H.assert(hi.strokes.every(s => s.alpha === 1), `${k} at the hover depth strokes at full alpha`);
    H.eq(lo.strokes.length, lo.paths.length, `${k}: every path is stroked once, through glowStroke`);
    shapes.add(J(X.tokenGlyph(k)));
    const again = look(k, 0.8, 0);
    H.assert(again.paths.every((p, i) => p.pts === hi.paths[i].pts || p.pts.length === hi.paths[i].pts.length),
             `${k}: the same scratch arrays are reused frame to frame`);
  }
  H.eq(shapes.size, 5, "⛔ five kinds, five different glyphs");
  H.eq(X.tokenGlyph("recharge")[0].poly.length, X.PURGE_GLYPH_POLY.length, "⛔ Recharge's glyph is PURGE_GLYPH_POLY itself");
  const ring = age => { const p = look("bounty", 0.8, age).paths; return p[p.length - 1]; };
  H.eq(ring(0).n, C.TOKEN_RING_SEG + 1, "⛔ a fresh token's ring is whole (a polyline, C.TOKEN_RING_SEG segments)");
  H.eq(ring(C.TOKEN_LIFE / 2).n, C.TOKEN_RING_SEG / 2 + 1, "⛔ it depletes with age: half its life, half a ring");
  H.eq(ring(0).closed, false, "and it is an open polyline");
  H.eq(look("bounty", 0.8, C.TOKEN_LIFE).paths.length, 1, "at C.TOKEN_LIFE the ring is gone — no numerals, no blink");
  H.eq(look("bounty", 0, 0).strokes.length, 0, "at the throat (alpha 0) nothing is stroked");

  // Game.draw() draws them, after the well and before the enemies (plan §3).
  stage(RING, 3, 0.5);
  S.enemies.push(new X.Vaulter(6, 0.5, 1));
  const order = [];
  X.drawToken.before = () => order.push("token");
  const realDraw = S.enemies[0].draw;
  S.enemies[0].draw = function () { order.push("enemy"); return realDraw.apply(this, arguments); };
  G.draw();
  X.drawToken.before = null;
  H.eq(J(order), J(["token", "enemy"]), "⛔ Game.draw() draws the token BEFORE the enemies");
}

// ---------------------------------------------------------------------------
// 7. ⛔ PLAYED BOARDS: ONE DRAW PER OVERDRIVE KILL, MAX_TOKENS, ALL FIVE KINDS
// ---------------------------------------------------------------------------
// A hunter: fire held, turning toward the rim-most live enemy (plan §1.3's).
let RIGHT = 0;
{
  quiet("overdrive");
  const l0 = S.skimmer.lane;
  G.input.keyDown("ArrowRight");
  for (let i = 0; i < 10; i++) G.update(DT);
  G.input.reset();
  RIGHT = Math.sign(X.laneDelta(X.WELLS[RING], l0, S.skimmer.lane));
  H.assert(RIGHT !== 0, "fixture: ArrowRight turns the craft");
}
function hunt(Z, i) {
  const st = Z.state, inp = Z.Game.input, well = Z.WELLS[st.wellIndex];
  inp.keyDown(" ");                         // fire held throughout
  if (i % 311 === 0) inp.keyDown("x");
  if (i % 311 === 4) inp.keyUp("x");
  let best = null;
  for (const e of st.enemies) if (!e.dead && !e.anchored && (best === null || e.depth > best.depth)) best = e;
  inp.keyUp("ArrowRight"); inp.keyUp("ArrowLeft");
  if (!best || !st.skimmer) return;
  const d = Z.laneDelta(well, st.skimmer.lane, best.lane) * RIGHT;
  if (d > 0.3) inp.keyDown("ArrowRight"); else if (d < -0.3) inp.keyDown("ArrowLeft");
  // ⛔ CS013 P3, IN PLACE: an ALOFT entity is killable only by the Jump (W4)
  // and it blocks the clear (W5), so a driver that never jumps stalls every
  // board from L11 — the kills, the clears and the drop variety this section
  // counts all fall with it. ⛔ The repair is the DRIVER, never the build and
  // never a lowered level: it jumps when something aloft is already in reach,
  // which is exactly the answer the player has.
  if (st.enemies.some(e => !e.dead && e.aloft &&
        Math.abs(Z.laneDelta(well, e.lane, st.skimmer.lane)) <= Z.C.HIT_LANE_TOL)) {
    inp.keyDown("arrowup");
  } else {
    inp.keyUp("arrowup");
  }
}
const BOARDS = [[1, 11], [6, 12], [11, 13], [16, 14], [23, 15]];
function played(Z, ticks) {
  const st = Z.state, ZG = Z.Game, ZDT = Z.C.FIXED_DT;
  const out = { steps: 0, kills: 0, calls: 0, badDraws: 0, badCount: 0, drops: 0, noDrops: 0, atMax: 0,
                over: 0, kinds: {}, collected: {}, badAge: 0, badPos: 0, classic: 0, first: null };
  const fail = (k, m) => { out[k]++; if (!out.first) out.first = `${k}: ${m}`; };
  let draws = 0, d0 = 0, t0 = 0;
  const wrap = () => { const raw = st.rng; st.rng = function () { draws++; return raw(); }; };   // trap 1
  Z.dropToken.before = () => { d0 = draws; t0 = Z.liveTokens(st); };
  Z.dropToken.after = () => {
    out.calls++;
    if (draws - d0 !== 1) fail("badDraws", `a dropToken() spent ${draws - d0} draws`);
    if (t0 >= Z.C.MAX_TOKENS) out.atMax++;
    if (st.tokens.length > t0) { out.drops++; const k = st.tokens[st.tokens.length - 1].kind; out.kinds[k] = (out.kinds[k] || 0) + 1; }
    else out.noDrops++;
  };
  Z.collectToken.before = (s, t) => { out.collected[t.kind] = (out.collected[t.kind] || 0) + 1; };
  for (const [level, seed] of BOARDS) {
    ZG.reset(); Z.startGame(seed, { mode: "overdrive", startDepth: level }); wrap(); ZG.input.reset();
    for (let i = 0; i < ticks; i++) {
      if (st.screen === "gameover") { ZG.input.reset(); Z.startGame(seed + i, { mode: "overdrive", startDepth: level }); wrap(); }
      hunt(Z, i);
      const k0 = st.tally.kills, c0 = out.calls;
      ZG.update(ZDT);
      out.steps++;
      out.kills += st.tally.kills - k0;
      if (out.calls - c0 !== st.tally.kills - k0) fail("badCount", `step ${i}: ${out.calls - c0} dropToken() calls against ${st.tally.kills - k0} kills`);
      if (st.tokens.length > Z.C.MAX_TOKENS) fail("over", `${st.tokens.length} tokens`);
      const well = Z.WELLS[st.wellIndex];
      for (const t of st.tokens) {
        if (!(t.age < Z.C.TOKEN_LIFE)) fail("badAge", `age ${t.age}`);
        if (!(Number.isInteger(t.lane) && t.lane >= 0 && t.lane <= well.lanes - 1 && t.depth >= 0 && t.depth <= Z.C.TOKEN_HOVER_DEPTH)) {
          fail("badPos", `${t.lane}, ${t.depth}`);
        }
      }
    }
  }
  Z.dropToken.before = Z.dropToken.after = Z.collectToken.before = null;
  return out;
}
const TICKS = 4000;                         // × five boards = 20,000 steps
{
  installSeed(SEED);
  const Y = H.buildGame({ spy: ["dropToken", "collectToken"] });
  const r = played(Y, TICKS);
  if (process.env.P1_MEASURE) console.log(J(r));
  H.eq(r.steps, 20000, "fixture: 20,000 played Overdrive steps");
  H.eq(r.badCount, 0, `⛔ dropToken() is called ONCE PER KILL — every kill at a kill site rolls (T2)${r.first ? " — " + r.first : ""}`);
  H.eq(r.badDraws, 0, "⛔ and every Overdrive call spends EXACTLY ONE draw, drop or no drop");
  H.eq(r.over, 0, "⛔ MAX_TOKENS is never exceeded");
  H.eq(r.badAge + r.badPos, 0, `⛔ every live token is younger than TOKEN_LIFE, on a lane centre in range, below the hover depth${r.first ? " — " + r.first : ""}`);
  H.assert(r.kills > 300 && r.drops > 10 && r.noDrops > r.drops,
           `non-vacuity: ${r.kills} kills, ${r.drops} drops, ${r.noDrops} rolls that dropped nothing`);
  H.assert(r.atMax > 0, `non-vacuity: ${r.atMax} played rolls were made with the board at MAX_TOKENS`);
  H.eq(J(Object.keys(r.kinds).sort()), J(["bounty", "lance", "recharge", "spread", "ward"]),
       `non-vacuity: all five kinds dropped (${J(r.kinds)})`);
  H.assert(Object.keys(r.collected).length >= 3, `non-vacuity: tokens were collected in play (${J(r.collected)})`);
}

// ---------------------------------------------------------------------------
// 8. ⛔ CLASSIC IS UNTOUCHED — the hash against the tokens stubbed out
// ---------------------------------------------------------------------------
// test-cs009-p6.js's whole-board hasher, unchanged.
function makeHasher(Z, extras) {
  const wells = new Map(Z.WELLS.map((w, i) => [w, i]));
  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  let h = 0, seen = null;
  const mixU = v => { h = Math.imul(h ^ v, 16777619) >>> 0; };
  const num = v => { f64[0] = v; mixU(u32[0]); mixU(u32[1]); };
  const str = s => { for (let i = 0; i < s.length; i++) mixU(s.charCodeAt(i)); mixU(0x1f); };
  function walk(v) {
    switch (typeof v) {
      case "number": mixU(1); num(v); return;
      case "string": mixU(2); str(v); return;
      case "boolean": mixU(v ? 3 : 4); return;
      case "undefined": mixU(5); return;
      case "function": return;
    }
    if (v === null) { mixU(6); return; }
    if (wells.has(v)) { mixU(7); num(wells.get(v)); return; }
    if (seen.has(v)) { mixU(8); num(seen.get(v)); return; }
    seen.set(v, seen.size);
    if (Array.isArray(v)) { mixU(9); num(v.length); for (let i = 0; i < v.length; i++) walk(v[i]); return; }
    str(v.constructor ? v.constructor.name : "");
    for (const k of Object.keys(v)) { str(k); walk(v[k]); }
  }
  return function () { h = 2166136261; seen = new Map(); walk(Z.state); walk(extras()); return h; };
}
const CLASSIC_STEPS = 5000;
function classicSession(opts) {
  installSeed(SEED);
  const Z = H.buildGame(opts);
  const ZG = Z.Game, st = Z.state, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { startDepth: 13 });
  const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
  const out = { hashes: [], tokens: 0, powers: 0, kills: 0, purges: 0 };
  for (let i = 0; i < CLASSIC_STEPS; i++) {
    hunt(Z, i);                             // held fire, scheduled Purges
    const k0 = st.tally.kills, p0 = st.tally.purgesSpent;
    ZG.update(ZDT);
    out.kills += st.tally.kills - k0; out.purges += st.tally.purgesSpent - p0;
    if (st.screen === "gameover") Z.startGame((SEED + i) >>> 0, { startDepth: 13 });
    out.hashes.push(hash());
    if (st.tokens.length) out.tokens++;
    if (st.powers.lance || st.powers.spread || st.powers.ward) out.powers++;
  }
  return out;
}
const firstDiff = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return i; return -1; };
const STUB = { stub: ["dropToken", "updateTokens"] };
const classicStub = classicSession(STUB);
{
  const real = classicSession({});
  H.eq(firstDiff(real.hashes, classicStub.hashes), -1,
       `⛔ CLASSIC IS UNTOUCHED: the state hash is identical on all ${CLASSIC_STEPS} steps against dropToken() and updateTokens() stubbed`);
  H.eq(real.tokens + real.powers, 0, "⛔ and a Classic run never holds a token or a power");
  H.assert(real.kills > 50 && real.purges > 0 && new Set(real.hashes).size > CLASSIC_STEPS / 2,
           `non-vacuity: the Classic run killed (${real.kills}), purged (${real.purges}) and its hash moves`);
}

// ---------------------------------------------------------------------------
// 9. ⛔ MUTATION-CHECKED — trap 4
// ---------------------------------------------------------------------------
function mutantRed(from, to, what, run) {
  const found = SCRIPT.split(from).length - 1;
  H.eq(found, 1, `fixture: ${what} — the mutation string is in the build exactly once`);
  if (found !== 1) return;
  let red = null, threw = null;
  try { red = run([[from, to]]); } catch (e) { threw = e.message; }
  H.eq(threw, null, `fixture: ${what} — the mutant ran without a throw`);
  H.assert(red === true, `⛔ MUTATION — ${what} turns the claim red${red === true ? "" : " (it did NOT)"}`);
}
mutantRed("  if (!modeHas(\"tokens\", state.mode)) return;\n", "", "the mode gate removed from dropToken()", mutate => {
  const m = classicSession({ mutate });
  return firstDiff(m.hashes, classicStub.hashes) >= 0 || m.tokens > 0;
});
mutantRed("  const u = state.rng();\n", "  if (liveTokens(state) >= C.MAX_TOKENS) return;\n  const u = state.rng();\n",
          "the draw made conditional on room for a drop", mutate => {
  installSeed(SEED);
  const Z = H.buildGame({ mutate, spy: ["dropToken", "collectToken"] });
  // the staged board at MAX_TOKENS, then the played count
  const st = Z.state;
  Z.Game.reset(); Z.startGame(SEED, { mode: "overdrive" });
  const raw = st.rng;
  let n = 0;
  st.rng = () => { n++; return 0; };
  for (const lane of [1, 5, 9]) Z.dropToken(st, victim(Z, lane, 0.4));
  st.rng = raw;
  const r = played(Z, 1500);
  return n !== 3 || r.badDraws > 0;
});

H.report("test-cs013-p1.js");

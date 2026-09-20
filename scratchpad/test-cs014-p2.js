// test-cs014-p2.js — CS014 P2: the Dive you can see, and the two seats
// (GDD 5, 10.2, 10.3, 11.8, 14.5; PLANNED-FEATURES-CS014.md RF7-A, RF8-A, R8,
// R11). Asserts what P2 owns: diveDrawDepth(), the descent drawn in BOTH modes
// as C.DIVE_RUNGS cross-sections of the well, a ring drawn as the arc the take
// pass reads, the z-order (above the well, below the enemies), the readability
// contract in the throat zone, RF8-A's two seats at the one line that resolves
// a ring — and ⛔ THE HASH DOES NOT MOVE, in either mode, proved the way
// C.JUMP_LIFT at 0 is (test-cs012-p5.js).
//
// ⛔ TRAPS.
//  1. A ring is resolved on the first step the descent REACHES its depth, so a
//     fixture that jumps dive.depth never resolves one — drive the beat.
//  2. The draw path's scratch arrays are SHARED, so a spy that keeps a `pts`
//     reference is looking at the next call's points. Copy, or compare counts.
//  3. pow(x, 1/k) after pow(x, k) is not the identity in binary: the grace
//     beat's exactness is a branch in diveDrawDepth(), not a tolerance here.
//  4. The dive's END is nextWell() -> enterWell() -> resetDive() on the same
//     step, so the rings must be read BEFORE the step, never after.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260920;
installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame({ spy: ["glowStroke", "drawPoly", "drawWell", "drawRing", "drawDiveRungs", "sfx", "addScore"] });
const C = X.C, G = X.Game, state = X.state, DT = C.FIXED_DT;
const J = JSON.stringify;
const ROOT = path.join(__dirname, "..");
const SCRIPT = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const LAB_PATH = "tools/sfx-lab.html";

const RING = 0, FAN = 14;
const ctx = X._env.canvas.getContext("2d");

// A cleared well, a craft on the rim, nothing alive — test-cs014-p1.js's.
function board(mode, level, wellIndex) {
  G.reset();
  X.startGame(SEED, { mode: mode, startDepth: 1 });
  state.level = level;
  state.wellIndex = wellIndex === undefined ? (level - 1) % X.WELLS.length : wellIndex;
  X.enterWell();
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  state.invulnTime = C.RESPAWN_INVULN;
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// Every glowStroke and every drawPoly one draw call makes, with the run's
// stream booby-trapped: ⛔ nothing in the draw path may spend a draw.
function look(fn) {
  const strokes = [], paths = [];
  X.glowStroke.before = (c, color, w, alpha) => strokes.push({ color, w, alpha });
  X.drawPoly.before = (c, pts, closed) => paths.push({ pts, n: pts.length, closed, first: pts[0] });
  const real = state.rng;
  state.rng = () => { throw new Error("a draw in the draw path"); };
  let threw = null;
  try { fn(); } catch (e) { threw = e.message; }
  state.rng = real;
  X.glowStroke.before = null; X.drawPoly.before = null;
  return { strokes, paths, threw };
}

// ---------------------------------------------------------------------------
// 1. ⛔ THE CONSTANTS (R11) — EVERY VALUE IN C, NONE IN THE RENDERER
// ---------------------------------------------------------------------------
for (const [k, v] of [["DIVE_RUNGS", 10], ["DIVE_RUNG_ALPHA", 0.40],
                      ["RING_ARC_SEG", 16], ["RING_ALPHA", 0.90], ["RING_COLOR", "#4AFFD1"]]) {
  H.eq(C[k], v, `C.${k} is ${J(v)}`);
}
H.assert(C.DIVE_RUNGS > 0 && C.RING_ARC_SEG > 0, "the two segment counts are positive");
// ⛔ THE RING'S COLOUR REACHES FOR NO OTHER CONSTANT (STATUS.md). It is its own
// literal, and it is none of the palette's — not the token gold a diver has
// just had every power of stripped by startDive(), and not a band colour.
{
  const taken = [C.TOKEN_COLOR, C.SKIMMER_COLOR, C.HUD_COLOR, C.VAULTER_COLOR, C.REAVER_COLOR,
                 C.CARRIER_COLOR, C.WEAVER_COLOR, C.WEAVER_BOLT_COLOR, C.THORN_COLOR,
                 C.DRIFTER_COLOR, C.SURGER_COLOR, C.WARDEN_COLOR, C.MIMIC_COLOR]
    .concat(C.BAND_COLORS.map(b => b.color)).concat(C.BAND_RNG_COLORS);
  H.eq(taken.indexOf(C.RING_COLOR), -1, "⛔ C.RING_COLOR is its own colour — no entity's, no band's");
}
{
  // ⛔ NO MAGIC NUMBER REACHES THE THREE NEW DRAW FUNCTIONS, P1's rule applied
  // to P2's half: every literal has to be structural arithmetic.
  const fnText = n => {
    const at = SCRIPT.indexOf(`\nfunction ${n}(`);
    H.assert(at >= 0, `fixture: ${n}() is in the build`);
    return SCRIPT.slice(at, SCRIPT.indexOf("\n}\n", at)).replace(/\/\/.*$/gm, "");
  };
  const bodies = ["diveDrawDepth", "drawDiveRungs", "drawRing"].map(fnText).join("\n");
  const nums = (bodies.match(/(?<![\w.$])\d+(?:\.\d+)?/g) || []).filter(v => v !== "0" && v !== "1" && v !== "0.5" && v !== "2");
  H.eq(J(nums), J([]), `⛔ the Dive's visual carries no tunable literal (found ${J(nums)})`);
  H.assert(/C\.DIVE_RUNGS/.test(bodies) && /C\.DIVE_RUNG_ALPHA/.test(bodies) &&
           /C\.RING_ARC_SEG/.test(bodies) && /C\.RING_ALPHA/.test(bodies) &&
           /C\.RING_COLOR/.test(bodies) && /C\.RING_ARC_LANES/.test(bodies),
           "⛔ and every value they use is read off C");
  // ⛔ GDD 10.2: drawPoly + glowStroke only — no fill, no sprite, no rectangle,
  // and text nowhere near this (test-cs008-p4.js scans the whole built file).
  H.assert(!/ctx\.fill|fillStyle|Rect\(|fillText|strokeText|Image|drawImage/.test(bodies),
           "⛔ no fill, no rectangle, no sprite and no text in the Dive's visual (GDD 10.2)");
  // ⛔ Game math never reads window size (GDD 10.2, CLAUDE.md).
  H.assert(!/innerWidth|innerHeight|devicePixelRatio|window|canvas\./.test(bodies),
           "⛔ and it never reads window size — C.WORLD_*/C.WELL_* only");
  // ⛔ A DRAW-TIME READER WRITES NO STATE AND SPENDS NO DRAW.
  H.assert(!/\brng\b|Math\s*\.\s*random|state\./.test(bodies),
           "⛔ it draws no random value and names no state (CLAUDE.md, Math and lifecycle)");
  // ⛔ AND 13-render-well.js DID NOT MOVE: drawWell() took every parameter it
  // needed already, which is what makes "the well is the frame" structural.
  const dw = fnText("drawWell");
  H.assert(!/dive|rung|ring/i.test(dw), "⛔ drawWell() knows nothing about the Dive — it takes no new parameter");
}

// ---------------------------------------------------------------------------
// 2. ⛔ diveDrawDepth() — THE ONE IDEA, AND IT IS A PURE FUNCTION OF TWO NUMBERS
// ---------------------------------------------------------------------------
{
  const f = X.diveDrawDepth;
  // ⛔ IDENTITY THROUGH THE GRACE BEAT, BIT FOR BIT (trap 3). dive.depth holds
  // at 1 there, and that is the beat GDD 5 makes the player read the board in.
  for (const d of [0, 0.0833, 0.25, 0.5, 0.9167, 1]) {
    H.eq(f(d, 1), d, `⛔ at dive.depth 1 a thing is drawn at its own depth (${d})`);
  }
  // ⛔ EXACT AT THE RESOLUTION: a thing reaches the rim precisely when the
  // descent reaches its own depth — the step takeRings() resolves a ring on.
  for (const d of [0.0833, 0.25, 0.5, 0.9167]) {
    H.eq(f(d, d), 1, `⛔ it is AT THE RIM (1) when dive.depth equals its depth (${d})`);
  }
  // Ahead of the descent: strictly inside, and monotone — it swells rim-ward.
  const walk = [];
  for (let dc = 1; dc > 0.05; dc -= 0.05) walk.push(f(0.05, dc));
  H.assert(walk.every((v, i) => i === 0 || v >= walk[i - 1]), "⛔ a ring ahead of the descent only ever swells toward the rim");
  H.assert(f(0.25, 0.5) > 0.25 && f(0.25, 0.5) < 1, "⛔ and until then it is strictly inside the well");
  // Behind it, and the descent's own last step, are clamped.
  H.eq(f(0.75, 0.5), 1, "⛔ something already passed is clamped at the rim, never drawn beyond it");
  H.eq(f(0.1, 0), 1, "⛔ and at dive.depth 0 — the descent's last step — everything is there");
  // ⛔ PURE: no well, no state, no draw. Two numbers in, one out.
  H.eq(f(0.4, 0.8), f(0.4, 0.8), "⛔ pure: the same two numbers give the same answer");
  H.eq(X.diveDrawDepth.length, 2, "⛔ and it takes two numbers and nothing else");
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE DESCENT (RF7-A) — C.DIVE_RUNGS CROSS-SECTIONS OF THE WELL
// ---------------------------------------------------------------------------
const RUNG_DEPTHS = [];
for (let i = 0; i < C.DIVE_RUNGS; i++) RUNG_DEPTHS.push((C.DIVE_RUNGS - i - 0.5) / C.DIVE_RUNGS);

function rungs(wellIndex, diveDepth, level, roll) {
  const well = X.WELLS[wellIndex];
  return look(() => X.drawDiveRungs(ctx, well, diveDepth, X.wellBandColor(level, roll)));
}
{
  const well = X.WELLS[RING];
  const grace = rungs(RING, 1, 5, 0);
  H.eq(grace.threw, null, "⛔ the descent spends no draw from the run's stream");
  H.eq(grace.paths.length, C.DIVE_RUNGS, "⛔ C.DIVE_RUNGS cross-sections at the grace beat");
  H.eq(grace.strokes.length, grace.paths.length, "every path is stroked exactly once, through glowStroke");
  H.assert(grace.paths.every(p => p.n === X.wellVertCount(well) && p.closed === well.closed),
           "⛔ each is the WELL's own cross-section: wellVertCount() points, closed as the well is");
  H.assert(grace.strokes.every(s => s.color === X.wellBandColor(5, 0)),
           "⛔ in the well's band colour — the well travelling, not an object in it");
  // ⛔ THE LATTICE IS layRings()' OWN: the midpoints of C.DIVE_RUNGS slices.
  const wantAlpha = d => X.shotAlpha(d) * (1 - d) * C.DIVE_RUNG_ALPHA;
  H.eq(J(grace.strokes.map(s => s.alpha)), J(RUNG_DEPTHS.map(wantAlpha)),
       "⛔ at the midpoints of C.DIVE_RUNGS equal slices — layRings()' own lattice");
  // ⛔ FADED AT BOTH ENDS: nothing pops in at the throat and nothing pops out
  // at the rim, and ⛔ NOTHING IS OPAQUE BELOW C.READABILITY_DEPTH (GDD 10.3).
  H.assert(grace.strokes.every(s => s.alpha > 0 && s.alpha < 1), "⛔ no rung is ever opaque");
  for (let i = 0; i < RUNG_DEPTHS.length; i++) {
    const d = RUNG_DEPTHS[i];
    if (d < C.READABILITY_DEPTH) {
      H.assert(grace.strokes[i].alpha < X.shotAlpha(d) + 1e-12,
               `⛔ a rung at ${d.toFixed(4)} — inside the throat zone — is at or under shotAlpha()'s fade (GDD 10.3)`);
    }
  }
  // ⛔ A RUNG LEAVES AT THE RIM ON THE STEP THE DESCENT REACHES ITS OWN DEPTH,
  // so what is drawn is exactly what is still ahead of the craft.
  for (const dc of [1, 0.9, 0.55, 0.3, 0.05]) {
    const ahead = RUNG_DEPTHS.filter(d => d < dc).length;
    H.eq(rungs(RING, dc, 5, 0).paths.length, ahead,
         `⛔ at dive.depth ${dc} exactly the ${ahead} rungs still ahead are drawn`);
  }
  H.eq(rungs(RING, 0, 5, 0).paths.length, 0, "⛔ and at the throat there is nothing left to pass");
  // ⛔ NO PER-FRAME ALLOCATION: the cross-section is memoized on the well.
  H.assert(X.rungScratch(well) === X.rungScratch(well), "⛔ one scratch array per well, ever (trap 2)");
  H.eq(X.rungScratch(well).length, X.wellVertCount(well), "and it is exactly the well's vertex count");
  const open = X.WELLS[FAN];
  H.assert(X.rungScratch(open) !== X.rungScratch(well), "an open well gets its own, at its own length");
  H.eq(rungs(FAN, 0.6, 5, 0).paths.every(p => p.closed === false), true,
       "⛔ an open well's rungs are open strips (GDD 3.3), never closed loops");
}

// ---------------------------------------------------------------------------
// 4. ⛔ A RING IS THE ARC THE TAKE PASS READS (RF2, RF7-A; GDD 1.1 P2)
// ---------------------------------------------------------------------------
{
  const well = X.WELLS[RING];
  const ring = (lane, depth, dc) => look(() => X.drawRing(ctx, well, lane, depth, dc));
  const r = ring(4, 0.5, 1);
  H.eq(r.threw, null, "⛔ a ring's draw spends no draw from the run's stream");
  H.eq(r.paths.length, 1, "⛔ ONE path per ring — drawPoly + glowStroke, no per-entity pipeline");
  H.eq(r.paths[0].n, C.RING_ARC_SEG + 1, "⛔ a polyline of C.RING_ARC_SEG segments, the token ring's precedent");
  H.eq(r.paths[0].closed, false, "⛔ and an OPEN path: an arc, not a loop");
  H.eq(r.strokes.length, 1, "stroked once");
  H.eq(r.strokes[0].color, C.RING_COLOR, "⛔ in C.RING_COLOR");
  H.eq(r.strokes[0].alpha, X.shotAlpha(0.5) * C.RING_ALPHA, "at shotAlpha() x C.RING_ALPHA");
  // ⛔ THE ARC IS EXACTLY 2 x C.RING_ARC_LANES WIDE — what takeRings() measures
  // with laneDelta, so the player is never asked to guess where the edge was.
  {
    const pts = [];
    X.drawPoly.before = (c, p) => { for (let i = 0; i < p.length; i++) pts.push({ x: p[i].x, y: p[i].y }); };
    X.drawRing(ctx, well, 4, 0.5, 1);
    X.drawPoly.before = null;
    const p = { x: 0, y: 0 };
    const at = l => { X.screenPos(well, l, 0.5, p); return { x: p.x, y: p.y }; };
    const lo = at(4 - C.RING_ARC_LANES), hi = at(4 + C.RING_ARC_LANES);
    H.close(pts[0].x, lo.x, 1e-9, "⛔ the arc starts at lane - C.RING_ARC_LANES");
    H.close(pts[0].y, lo.y, 1e-9, "   (y)");
    H.close(pts[pts.length - 1].x, hi.x, 1e-9, "⛔ and ends at lane + C.RING_ARC_LANES");
    H.close(pts[pts.length - 1].y, hi.y, 1e-9, "   (y)");
  }
  // ⛔ IT IS DRAWN THROUGH diveDrawDepth(), so it arrives at the rim on the
  // step it is resolved — the take is what the player saw happen.
  H.eq(ring(4, 0.5, 0.5).strokes[0].alpha, X.shotAlpha(1) * C.RING_ALPHA,
       "⛔ at the step the descent reaches it, a ring is at the rim and at full C.RING_ALPHA");
  H.assert(ring(4, 0.1, 0.5).strokes[0].alpha > ring(4, 0.1, 1).strokes[0].alpha,
           "⛔ and one still in the throat zone BRIGHTENS as it comes, the token's rule (GDD 10.3)");
  // ⛔ NOTHING OPAQUE BELOW C.READABILITY_DEPTH. The deepest ring of a full set
  // is born at 0.0833 (plan §1.7) and spends most of the flight in the throat.
  const deepest = (C.DIVE_RINGS_MAX - (C.DIVE_RINGS_MAX - 1) - 0.5) / C.DIVE_RINGS_MAX;
  H.close(deepest, 0.0833, 1e-4, "fixture: the deepest ring of a full set sits at 0.0833");
  H.assert(deepest < C.READABILITY_DEPTH, "fixture: which is inside the throat zone");
  H.eq(ring(4, deepest, 1).strokes[0].alpha, X.shotAlpha(deepest) * C.RING_ALPHA,
       "⛔ so it takes shotAlpha()'s fade there, as a token does (GDD 10.3)");
  H.assert(ring(4, deepest, 1).strokes[0].alpha < 1, "⛔ and is never opaque in the throat zone");
  H.eq(ring(4, 0, 1).paths.length, 0, "at the throat (alpha 0) nothing is stroked at all");
  // ⛔ NO PER-FRAME ALLOCATION: one preallocated arc, drawToken()'s rule.
  const a = ring(4, 0.5, 1).paths[0].pts, b = ring(7, 0.4, 1).paths[0].pts;
  H.assert(a === b, "⛔ the same scratch arc is reused call to call (trap 2)");
}

// ---------------------------------------------------------------------------
// 5. ⛔ THE Z-ORDER — ABOVE THE WELL, BELOW THE ENEMIES (GDD 1.1 P2; CS013 T4)
// ---------------------------------------------------------------------------
{
  const well = board("overdrive", 5, RING);
  state.enemies.push(new X.Thorn(3, 0.8));
  X.startDive(state);
  for (let i = 0; i < 40; i++) X.updateDive(state, well, DT);   // into the descent
  H.assert(state.dive.active && state.dive.phase === "descent", "fixture: mid-descent, in Overdrive");
  H.assert(state.dive.rings.some(r => r.taken === null), "fixture: with rings still unresolved");
  const order = [];
  X.drawWell.before = () => order.push("well");
  X.drawDiveRungs.before = () => order.push("rungs");
  X.drawRing.before = () => order.push("ring");
  const thorn = state.enemies[0];
  const realDraw = thorn.draw;
  thorn.draw = function () { order.push("enemy"); return realDraw.apply(this, arguments); };
  G.draw();
  X.drawWell.before = null; X.drawDiveRungs.before = null; X.drawRing.before = null;
  thorn.draw = realDraw;
  H.eq(order[0], "well", "⛔ the well is the backdrop and is drawn first");
  H.eq(order[1], "rungs", "⛔ then the descent — one call, the whole lattice");
  H.eq(order.indexOf("enemy"), order.length - 1, "⛔ and the enemies LAST: a Thorn a diver is threading is never behind a gift");
  H.assert(order.indexOf("ring") > 1 && order.indexOf("ring") < order.indexOf("enemy"),
           "⛔ the rings sit between them, where a token is (CS013 T4)");
  // ⛔ AN UNRESOLVED RING ONLY — a resolved one has already passed the craft.
  const pending = state.dive.rings.filter(r => r.taken === null).length;
  H.assert(pending > 0 && pending < C.DIVE_RINGS_MAX, `fixture: some resolved, some not (${pending})`);
  H.eq(order.filter(o => o === "ring").length, pending,
       "⛔ exactly the rings still pending are drawn — `taken` resolves once, and for good");
}
// ⛔ AND NOTHING IS DRAWN OUTSIDE A DIVE.
{
  board("overdrive", 5, RING);
  let calls = 0;
  X.drawDiveRungs.before = () => calls++;
  X.drawRing.before = () => calls++;
  G.draw();
  X.drawDiveRungs.before = null; X.drawRing.before = null;
  H.eq(calls, 0, "⛔ no dive, no descent and no ring — state.dive.active is the whole gate in draw()");
}

// ---------------------------------------------------------------------------
// 6. ⛔ CLASSIC GETS THE DESCENT TOO (RF7-A), AND NO RING
// ---------------------------------------------------------------------------
{
  const well = board("classic", 5, RING);
  X.startDive(state);
  H.eq(state.dive.rings.length, 0, "fixture: Classic lays no ring (CS014 P1)");
  for (let i = 0; i < 40; i++) X.updateDive(state, well, DT);
  let rung = 0, ring = 0;
  X.drawDiveRungs.before = () => rung++;
  X.drawRing.before = () => ring++;
  G.draw();
  X.drawDiveRungs.before = null; X.drawRing.before = null;
  H.eq(rung, 1, "⛔ RF7-A: the descent IS drawn in Classic — one frame in six of a run was a still board");
  H.eq(ring, 0, "⛔ and no ring is: the set is empty, so the loop is a no-op there");
}

// ---------------------------------------------------------------------------
// 7. ⛔ THE TWO SEATS (RF8-A; GDD 11.8) — ONE LINE, ONE SOUND EACH WAY
// ---------------------------------------------------------------------------
H.assert(typeof C.SFX.ringTake === "object" && typeof C.SFX.ringMiss === "object",
         "⛔ C.SFX carries ringTake and ringMiss (sfx-lab candidate A, ported verbatim)");
H.assert(!("ringTake" in C.SFX_KILL_PITCH) && !("ringMiss" in C.SFX_KILL_PITCH),
         "⛔ neither takes a voice: a ring is not an entity, so C.SFX_KILL_PITCH is unmoved");
H.eq(Object.keys(C.SFX_KILL_PITCH).length, 11, "⛔ eleven voices, as before");
{
  // ⛔ BOTH ARE SEATED IN takeRings(), AND NOWHERE ELSE.
  const seats = SCRIPT.split("\n").filter(l => /sfx\("ring/.test(l) && !/^\s*\/\//.test(l));
  H.eq(seats.length, 2, `⛔ two ring seats in the whole build (${J(seats.map(s => s.trim()))})`);
  const take = SCRIPT.indexOf("function takeRings("), end = SCRIPT.indexOf("\n}\n", take);
  for (const s of seats) H.assert(SCRIPT.indexOf(s, take) > take && SCRIPT.indexOf(s, take) < end,
                                  `⛔ and both are inside takeRings() (11-dive.js): ${s.trim()}`);
  // ⛔ A SEAT WRITES NO state AND DRAWS NOTHING (test-cs009-p5.js's rule).
  H.assert(seats.every(s => /sfx\("ring(Take|Miss)"\)/.test(s)),
           "⛔ each names a literal C.SFX event and takes no argument that could write or draw");
}
{
  const well = board("overdrive", 5, RING);
  const calls = [];
  X.sfx.before = name => calls.push(name);
  X.startDive(state);
  // ⛔ THE CRAFT IS PARKED IN THE FIRST RING'S ARC AND STAYS THERE (trap 1):
  // the beat is driven, never the field.
  state.skimmer.lane = state.dive.rings[0].lane;
  const paid0 = state.score;
  let steps = 0;
  while (state.dive.active && steps < 600) { X.updateDive(state, well, DT); steps++; }
  X.sfx.before = null;
  const takes = calls.filter(n => n === "ringTake").length;
  const misses = calls.filter(n => n === "ringMiss").length;
  H.eq(takes + misses, C.DIVE_RINGS_MAX,
       `⛔ EXACTLY ONE SOUND PER RING, one way or the other (${takes} taken, ${misses} missed)`);
  H.assert(takes > 0 && misses > 0, "fixture: the parked craft takes some and misses the rest — the walk moved on");
  H.eq(state.score - paid0, takes * C.RING_POINTS, "⛔ and ringTake sounds once per C.RING_POINTS paid — no more, no fewer");
  H.eq(calls.indexOf("kill"), -1, "⛔ no kill sound anywhere in a flight — a ring is not a kill (GDD 7)");
  H.eq(calls.filter(n => n === "diveStrike").length, 0, "fixture: and nothing struck, so ringMiss is not diveStrike's neighbour here");
}
{
  // ⛔ A MISS IS A SOUND AND NOT A SCORE — GDD 14.5's "you stop earning".
  const well = board("overdrive", 5, RING);
  const calls = [];
  X.startDive(state);
  const far = X.laneWrap(well, state.dive.rings[0].lane + well.lanes / 2);
  H.assert(Math.abs(X.laneDelta(well, state.dive.rings[0].lane, far)) > C.RING_ARC_LANES,
           "fixture: the craft is parked outside the first ring's arc");
  state.skimmer.lane = far;
  X.sfx.before = name => calls.push(name);
  const before = state.score;
  let n = 0;
  while (state.dive.rings[0].taken === null && n < 600) { X.updateDive(state, well, DT); n++; }
  X.sfx.before = null;
  H.eq(state.dive.rings[0].taken, false, "fixture: the first ring resolved as a MISS");
  H.eq(J(calls), J(["ringMiss"]), "⛔ a miss makes exactly one sound and it is ringMiss");
  H.eq(state.score, before, "⛔ and pays nothing: the absence of a call, with no penalty either");
}
{
  // ⛔ NEITHER SOUNDS IN CLASSIC — no ring is laid, so no line runs.
  const well = board("classic", 5, RING);
  const calls = [];
  X.sfx.before = name => calls.push(name);
  X.startDive(state);
  let n = 0;
  while (state.dive.active && n < 600) { X.updateDive(state, well, DT); n++; }
  X.sfx.before = null;
  H.eq(calls.filter(n2 => n2 === "ringTake" || n2 === "ringMiss").length, 0,
       `⛔ a Classic dive sounds neither seat (${J(calls)})`);
  H.assert(calls.indexOf("dive") >= 0, "fixture: but the dive's own sweep still plays");
}

// ---------------------------------------------------------------------------
// 8. ⛔ THE LAB IS THE PORTING SOURCE (GDD 11.8; CLAUDE.md) — P2's own half
// ---------------------------------------------------------------------------
// test-cs009-p4.js holds BLOCK SFX identical to C's SFX group and every event
// to 2-3 candidates, a brief, an A label and an in-context sequence. What is
// asserted here is what P2 added: the two rows, and that the lab's flight
// cadence is the SHIPPED one rather than a typed-in guess.
{
  const lab = fs.readFileSync(path.join(ROOT, LAB_PATH), "utf8");
  for (const name of ["ringTake", "ringMiss"]) {
    H.assert(new RegExp(`\\n    ${name}:\\s+\\{`).test(lab), `⛔ ${name} is ONE line starting "    ${name}:" in BLOCK SFX`);
    H.assert(new RegExp(`\\n  ${name}:\\s+\\["`).test(lab), `${name} has an in-context sequence`);
  }
  const labObj = src => new Function(src.slice(src.indexOf("const LAB = {"), src.indexOf("};", src.indexOf("const LAB = {")) + 2) + "\nreturn LAB;")();
  const S = labObj(lab.slice(lab.indexOf("// ===== LAB UI")));
  H.eq(J(S.dive), J({ rings: C.DIVE_RINGS_MAX, timeOd: C.DIVE_TIME_OD, grace: C.DIVE_GRACE }),
       "⛔ sfx-lab's flight copy is C's — the in-context rings land on the beats the build resolves them on");
  H.assert(/RING_BEATS/.test(lab) && /LAB\.dive\.rings/.test(lab),
           "⛔ and the cadence is DERIVED from it, never typed (test-cs010-p3.js's rule for a LAB copy)");
}

// ---------------------------------------------------------------------------
// 9. ⛔ THE HASH DOES NOT MOVE — IN EITHER MODE (item 3, RF7-A's Classic half)
// ---------------------------------------------------------------------------
// C.JUMP_LIFT-at-0's proof (test-cs012-p5.js:652): a played session through
// frame(), so draw() really runs, hashed against a build whose two visual
// alphas are 0 — the shipped still board. P2 is draw-time and seat-only, and a
// seat writes no state either, so every frame must agree.

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

const FLAT = [["  DIVE_RUNG_ALPHA:      0.40,", "  DIVE_RUNG_ALPHA:      0,"],
              ["  RING_ALPHA:           0.90,", "  RING_ALPHA:           0,"]];
const VIS_FRAMES = 1800;                   // ⛔ long enough to hold several dives

function visualSession(mode, mutate) {
  installSeed(SEED);
  const Z = H.buildGame({ mutate });
  const ZG = Z.Game, st = Z.state, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { mode: mode, startDepth: 7 });
  st.screen = "play";
  ZG.input.reset();
  ZG.input.keyDown(" ");                   // fire held, so wells actually clear
  const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
  const hashes = [];
  let ms = 0, diveFrames = 0, ringFrames = 0;
  for (let f = 0; f < VIS_FRAMES; f++) {
    if (f % 11 === 0) ZG.input.mouseMove(((f * 37) % 181) - 90);
    ms += ZDT * 1000;
    ZG.frame(ms);                          // ⛔ frame(), so draw() really runs
    if (st.dive.active) {
      diveFrames++;
      if (st.dive.rings.some(r => r.taken === null)) ringFrames++;
    }
    if (st.screen === "gameover") Z.startGame((SEED + f) >>> 0, { mode: mode, startDepth: 7 });
    hashes.push(hash());
  }
  return { hashes, diveFrames, ringFrames };
}

for (const mode of ["overdrive", "classic"]) {
  const real = visualSession(mode, []);
  const flat = visualSession(mode, FLAT);
  let first = -1;
  for (let f = 0; f < VIS_FRAMES; f++) if (real.hashes[f] !== flat.hashes[f]) { first = f; break; }
  H.eq(first, -1, `⛔ ${mode.toUpperCase()}: THE DIVE'S VISUAL IS DRAW-ONLY — with both alphas at 0 the state hash is identical on all ${VIS_FRAMES} frames (first divergence ${first})`);
  H.assert(new Set(real.hashes).size > VIS_FRAMES / 2, `non-vacuity (${mode}): the hash is not constant`);
  H.assert(real.diveFrames > 0, `non-vacuity (${mode}): the session really dived (${real.diveFrames} frames)`);
  H.eq(real.diveFrames, flat.diveFrames, `and both builds dived the same amount (${real.diveFrames})`);
  if (mode === "overdrive") {
    H.assert(real.ringFrames > 0, `non-vacuity: and rings were on screen (${real.ringFrames} frames)`);
  } else {
    H.eq(real.ringFrames, 0, "⛔ and a Classic dive carries no ring at any point");
  }
}

H.report("test-cs014-p2.js");

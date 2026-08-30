// test-cs001-p2.js — CS001 P2, the depth model (GDD 3.2, 3.5; §17 items 2, 3).
//
// Asserts only what P2 owns: the projection, the perspective easing, throat
// derivation, and lane-space topology. It does NOT re-assert P1's well data —
// that is test-cs001-p1.js's job, and global counts live in test-registry.js.
//
// Two traps this file exists to catch:
//   1. Lane addressing. lane === i is the CENTRE of lane i (vertex param
//      i + 0.5). A half-lane offset looks almost right on a Ring and obviously
//      wrong on a Box, so the Box corner is asserted by hand below.
//   2. ⛔ GDD 3.5 — the wall. An open well's ends REVERSE a hopper; they do
//      not wrap and they do not clamp. The soak drives the real laneHop with
//      the same lane/dir write-back an enemy will use. No enemy exists yet;
//      this is arithmetic, not collision.
"use strict";

const H = require("./_harness.js");
const { installSeed, mulberry32 } = require("./_seeded-random.js");

installSeed(20260830);                     // ⛔ above the first buildGame()

const X = H.buildGame();
const WELLS = X.WELLS;
const { screenPos, perspective, wellThroat, wellCentroid, wellVertCount,
        rimPoint, throatPoint,
        laneWrap, laneClamp, laneNormalize, laneDelta, laneHop, laneAtWall } = X;

const SOAK_TICKS = 5000;                   // §17 item 3
const EPS = 1e-9;

// ---- the depth model is present at all --------------------------------------
for (const [name, fn] of Object.entries({
  screenPos, perspective, wellThroat, wellCentroid, wellVertCount,
  rimPoint, throatPoint, laneWrap, laneClamp, laneNormalize, laneDelta,
  laneHop, laneAtWall,
})) {
  H.assert(typeof fn === "function", `${name} is exported by the build`);
}

// ---- perspective easing (GDD 3.2) -------------------------------------------
H.eq(perspective(0), 0, "perspective(0) is 0 — the throat");
H.eq(perspective(1), 1, "perspective(1) is 1 — the rim");
H.close(perspective(0.5), Math.pow(0.5, X.C.PERSPECTIVE_EXP), EPS,
        "perspective uses C.PERSPECTIVE_EXP");
// Exponent below 1 means the curve is ABOVE the diagonal: depth spends its
// range near the throat and the last stretch to the rim is fast.
H.assert(X.C.PERSPECTIVE_EXP < 1, "PERSPECTIVE_EXP is below 1 (rush toward the rim)");
H.assert(perspective(0.5) > 0.5, "perspective eases — 0.5 maps above 0.5");
// Monotonic, and clamped outside [0,1] rather than returning NaN from a
// fractional power of a negative number.
let prev = -Infinity, monotonic = true;
for (let i = 0; i <= 100; i++) {
  const v = perspective(i / 100);
  if (!(v >= prev)) monotonic = false;
  prev = v;
}
H.assert(monotonic, "perspective is monotonic over [0,1]");
H.eq(perspective(-0.5), 0, "perspective clamps below 0 (no NaN from a negative base)");
H.eq(perspective(2), 1, "perspective clamps above 1");

// ---- §17 item 2: geometry, all 16 wells -------------------------------------
const DEPTHS = [0, 0.25, 0.5, 0.75, 1];

for (const w of WELLS) {
  const label = `${w.id} ${w.name}`;

  H.eq(wellVertCount(w), w.rim.length, `${label}: wellVertCount agrees with the rim data`);

  // Throat derivation: same vertex count as the rim, and every throat vertex
  // is throatScale of the way from the centroid to its rim vertex (GDD 3.3).
  const throat = wellThroat(w);
  const cen = wellCentroid(w);
  H.eq(throat.length, w.rim.length, `${label}: throat has one vertex per rim vertex`);
  let throatOk = true, throatFinite = true;
  for (let i = 0; i < throat.length; i++) {
    const wantX = cen.x + (w.rim[i].x - cen.x) * w.throatScale;
    const wantY = cen.y + (w.rim[i].y - cen.y) * w.throatScale;
    if (Math.abs(throat[i].x - wantX) > 1e-12 || Math.abs(throat[i].y - wantY) > 1e-12) throatOk = false;
    if (!Number.isFinite(throat[i].x) || !Number.isFinite(throat[i].y)) throatFinite = false;
  }
  H.assert(throatOk, `${label}: throat is the rim scaled toward the centroid by throatScale`);
  H.assert(throatFinite, `${label}: no NaN in the derived throat`);
  H.assert(wellThroat(w) === throat, `${label}: throat derivation is memoized, not recomputed`);

  // ⛔ No NaN in any derived position, across the whole legal lane range at
  // every sampled depth. Half-lane steps so corners (integer + 0.5) are hit.
  let finite = true, inWorld = true;
  const maxLane = w.closed ? w.lanes : w.lanes - 1;
  for (let l = 0; l <= maxLane; l += 0.5) {
    for (const d of DEPTHS) {
      const p = screenPos(w, l, d);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) finite = false;
      // The rim is normalized to [-1,1], so nothing may land further than one
      // WELL_RADIUS from the well centre. A projection that read the wrong
      // polygon, or indexed past the rim array, breaks this before it NaNs.
      if (Math.abs(p.x - X.C.WELL_CX) > X.C.WELL_RADIUS * 1.0001 ||
          Math.abs(p.y - X.C.WELL_CY) > X.C.WELL_RADIUS * 1.0001) inWorld = false;
    }
  }
  H.assert(finite, `${label}: screenPos is finite for every lane at every sampled depth`);
  H.assert(inWorld, `${label}: every projected point is inside the well's normalized extent`);

  // depth 1 is the rim and depth 0 is the throat, exactly (GDD 3.2).
  const r = rimPoint(w, 1), t0 = throatPoint(w, 1);
  const sRim = screenPos(w, 1, 1), sThr = screenPos(w, 1, 0);
  H.close(sRim.x, X.C.WELL_CX + r.x * X.C.WELL_RADIUS, 1e-9, `${label}: depth 1 lands on the rim`);
  H.close(sThr.y, X.C.WELL_CY + t0.y * X.C.WELL_RADIUS, 1e-9, `${label}: depth 0 lands on the throat`);

  // The throat is strictly inside the rim: every lane is shorter than the
  // well is wide, which is what makes depth a usable 1-D axis at all.
  const dRim = Math.hypot(r.x - cen.x, r.y - cen.y);
  const dThr = Math.hypot(t0.x - cen.x, t0.y - cen.y);
  H.assert(dThr < dRim + EPS, `${label}: the throat lies inside the rim`);

  // ⛔ screenPos writes into a caller-supplied point without allocating — the
  // §17 perf budget forbids per-frame allocation in the hot path.
  const scratch = { x: 0, y: 0 };
  const ret = screenPos(w, 0, 0.5, scratch);
  H.assert(ret === scratch, `${label}: screenPos writes into the supplied out point`);
}

// ---- lane addressing: lane i is the CENTRE of lane i ------------------------
// The Box is the shape that exposes a half-lane offset. Its lane 3 runs from
// (0.5,-1) to (1,-1), so lane 3's centre is (0.75,-1) and lane 3.5 is the
// corner vertex (1,-1). Asserted in normalized rim space, before the world map.
{
  const box = WELLS.find(w => w.name === "Box");
  const c3 = rimPoint(box, 3);
  H.close(c3.x, 0.75, EPS, "Box: lane 3 sits at its own centre, not at a vertex");
  H.close(c3.y, -1, EPS, "Box: lane 3 centre y");
  const c35 = rimPoint(box, 3.5);
  H.close(c35.x, 1, EPS, "Box: lane 3.5 walks the polygon onto the corner vertex");
  H.close(c35.y, -1, EPS, "Box: lane 3.5 corner y");
  // A fractional lane follows the rim, not the chord between lane centres. On
  // the corner the chord would cut inside; the polygon walk lands exactly on it.
  const chordX = (rimPoint(box, 3).x + rimPoint(box, 4).x) / 2;
  H.assert(Math.abs(c35.x - chordX) > 0.05,
           "Box: lane 3.5 walks the rim rather than the chord across the corner");
}

// ---- ⛔ GDD 3.5: closed wells WRAP, open wells do NOT ------------------------
const CLOSED = WELLS.filter(w => w.closed);
const OPEN = WELLS.filter(w => !w.closed);

for (const w of CLOSED) {
  const label = `${w.id} ${w.name}`;
  const n = w.lanes;

  H.close(laneWrap(w, n), 0, EPS, `${label}: lane === lanes wraps to lane 0`);
  H.close(laneWrap(w, -1), n - 1, EPS, `${label}: lane -1 wraps to the last lane`);
  H.close(laneWrap(w, n * 3 + 2), 2, EPS, `${label}: wrap survives many revolutions`);
  H.close(laneNormalize(w, n + 0.25), 0.25, EPS, `${label}: laneNormalize wraps on a closed well`);

  // The seam is not a wall. Both are true only if wrap is real.
  H.assert(!laneAtWall(w, 0), `${label}: lane 0 is not a wall on a closed well`);
  H.assert(!laneAtWall(w, n - 1), `${label}: the last lane is not a wall on a closed well`);

  // laneDelta takes the short way round: lanes-1 -> 0 is +1, not -(lanes-1).
  H.close(laneDelta(w, n - 1, 0), 1, EPS, `${label}: laneDelta crosses the seam the short way`);
  H.close(laneDelta(w, 0, n - 1), -1, EPS, `${label}: laneDelta is signed across the seam`);
  H.assert(Math.abs(laneDelta(w, 0, Math.floor(n / 2))) <= n / 2 + EPS,
           `${label}: laneDelta never exceeds half the well`);

  // A hop across the seam wraps and keeps its heading — there is nothing to
  // turn at.
  const hop = laneHop(w, n - 1, 2, 1);
  H.close(hop.lane, 1, EPS, `${label}: a hop across the seam wraps`);
  H.eq(hop.dir, 1, `${label}: a wrapping hop does not reverse direction`);

  // The projection is continuous across the seam: the same physical point
  // reached from either side. This is what makes the Twist need no special case.
  const a = screenPos(w, n - 0.0001, 0.5, { x: 0, y: 0 });
  const b = screenPos(w, -0.0001, 0.5, { x: 0, y: 0 });
  H.close(a.x, b.x, 1e-3, `${label}: projection is continuous across the seam (x)`);
  H.close(a.y, b.y, 1e-3, `${label}: projection is continuous across the seam (y)`);
}

for (const w of OPEN) {
  const label = `${w.id} ${w.name}`;
  const hi = w.lanes - 1;

  // The Skimmer rule (GDD 3.5): clamp, with no wrap anywhere in sight.
  H.close(laneClamp(w, -5), 0, EPS, `${label}: the Skimmer clamps at lane 0`);
  H.close(laneClamp(w, hi + 5), hi, EPS, `${label}: the Skimmer clamps at the last lane`);
  H.close(laneNormalize(w, -5), 0, EPS, `${label}: laneNormalize clamps on an open well`);
  H.close(laneNormalize(w, hi + 5), hi, EPS, `${label}: laneNormalize does not wrap an open well`);
  H.assert(laneAtWall(w, 0) && laneAtWall(w, hi), `${label}: both ends are walls`);
  H.assert(!laneAtWall(w, hi / 2), `${label}: the middle is not a wall`);

  // ⛔ THE BUG §17 item 3 EXISTS FOR. A hop past the end must REVERSE. Wrapping
  // here is the enemy teleporting across the well; clamping is the enemy
  // parking on the end lane forever. Neither is the spec.
  const over = laneHop(w, hi, 2, 1);
  H.close(over.lane, hi - 2, EPS, `${label}: a hop past the far wall reflects back inward`);
  H.eq(over.dir, -1, `${label}: reflecting at the far wall reverses direction`);
  H.assert(over.lane !== 1, `${label}: a hop past the far wall did NOT wrap to the near end`);
  H.assert(over.lane !== hi, `${label}: a hop past the far wall did NOT clamp and park`);

  const under = laneHop(w, 0, -2, -1);
  H.close(under.lane, 2, EPS, `${label}: a hop past the near wall reflects back inward`);
  H.eq(under.dir, 1, `${label}: reflecting at the near wall reverses direction`);

  // Two reflections restore the heading — the parity has to be right, or a
  // hopper crossing the whole well twice ends up travelling backwards.
  const twice = laneHop(w, hi, w.lanes * 2, 1);
  H.assert(twice.lane >= -EPS && twice.lane <= hi + EPS, `${label}: a multi-well hop stays in bounds`);

  // An interior hop is untouched: reflection must not perturb ordinary movement.
  if (hi >= 2) {
    const mid = laneHop(w, 1, 1, 1);
    H.close(mid.lane, 2, EPS, `${label}: an interior hop is a plain move`);
    H.eq(mid.dir, 1, `${label}: an interior hop keeps its direction`);
  }

  // Idempotence: feeding a reflected lane back in must not move it again.
  const once = laneHop(w, hi, 3, 1);
  const again = laneHop(w, once.lane, 0, once.dir);
  H.close(again.lane, once.lane, EPS, `${label}: laneHop is idempotent on an already-legal lane`);

  // On an open well there is only one way round — laneDelta is the plain
  // difference, never a short-way-round that would cross a wall.
  H.close(laneDelta(w, 0, hi), hi, EPS, `${label}: laneDelta on an open well is the plain difference`);
  H.close(laneDelta(w, hi, 0), -hi, EPS, `${label}: laneDelta on an open well is signed, not wrapped`);
}

// ---- ⛔ §17 item 3: the 5,000-tick lane-bounds soak, every open well ---------
// A synthetic hopper driving the REAL laneHop with the write-back contract an
// enemy will use: it stores the dir the helper returns. Deliberately hostile —
// hop sizes up to and beyond the width of the well, so reflection is exercised
// at every parity rather than only single-lane steps.
for (const w of OPEN) {
  const label = `${w.id} ${w.name}`;
  const hi = w.lanes - 1;
  const rnd = mulberry32(w.id * 7919 + 13);

  let lane = hi / 2;
  let dir = 1;
  let out = 0, nonFinite = 0, stuck = 0, reversals = 0;
  let touchedNear = false, touchedFar = false;

  for (let tick = 0; tick < SOAK_TICKS; tick++) {
    const step = (0.1 + rnd() * (w.lanes * 1.5)) * dir;
    const r = laneHop(w, lane, step, dir);

    if (!Number.isFinite(r.lane)) nonFinite++;
    // ⛔ THE ASSERTION. No entity's lane may leave [0, lanes-1] on an open well.
    if (r.lane < -EPS || r.lane > hi + EPS) out++;
    if (r.dir !== dir) reversals++;
    if (r.dir !== 1 && r.dir !== -1) stuck++;

    if (r.lane < 0.5) touchedNear = true;
    if (r.lane > hi - 0.5) touchedFar = true;

    lane = r.lane;
    dir = r.dir;                            // the write-back an enemy must do
  }

  H.eq(out, 0, `${label}: lane never left [0, lanes-1] over ${SOAK_TICKS} ticks`);
  H.eq(nonFinite, 0, `${label}: no non-finite lane over the soak`);
  H.eq(stuck, 0, `${label}: dir stayed a unit direction over the soak`);
  H.assert(reversals > 0, `${label}: the soak actually hit a wall and reversed`);
  H.assert(touchedNear && touchedFar, `${label}: the soak reached both walls`);
}

// A closed well under the same hostile drive must stay in [0, lanes) — the
// mirror of the above, so a wrap that quietly became a clamp fails too.
for (const w of CLOSED) {
  const label = `${w.id} ${w.name}`;
  const rnd = mulberry32(w.id * 6271 + 5);
  let lane = 0, dir = 1, out = 0, reversals = 0;

  for (let tick = 0; tick < SOAK_TICKS; tick++) {
    const r = laneHop(w, lane, (0.1 + rnd() * (w.lanes * 1.5)) * dir, dir);
    if (!(r.lane >= -EPS && r.lane < w.lanes + EPS)) out++;
    if (r.dir !== dir) reversals++;
    lane = r.lane;
    dir = r.dir;
  }

  H.eq(out, 0, `${label}: lane stayed in [0, lanes) over ${SOAK_TICKS} ticks`);
  H.eq(reversals, 0, `${label}: a closed well never reverses a hopper — it has no walls`);
}

// ---- the Twist needs no special case ----------------------------------------
// The figure-eight's rim self-intersects, so its centroid is the crossing
// point and its throat is a smaller figure-eight. Nothing above branched on it;
// this asserts it came out finite and inside the rim like any other well.
{
  const twist = WELLS.find(w => w.name === "Twist");
  H.assert(twist && twist.closed, "Twist is present and closed");
  let ok = true;
  for (let l = 0; l < twist.lanes; l += 0.25) {
    const p = screenPos(twist, l, 0.5, { x: 0, y: 0 });
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) ok = false;
  }
  H.assert(ok, "Twist: the crossing lanes project finitely with no special case");
}

H.report();

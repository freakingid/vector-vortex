// test-cs005-p1.js — CS005 P1, the boundary lattice (GDD 3.5). Geometry only:
// laneHop's optional fold bounds, laneBoundaryLo/Hi, boundaryFrom. No entity.
//
// Traps this file exists to catch:
//   1. ⛔ The generalisation must be a NO-OP for every shipped caller. The
//      four-argument form is pinned two ways: a golden hash over the whole
//      sweep (absolute behaviour, recorded from the pre-change build), and a
//      per-case comparison against the six-argument form called with the
//      documented defaults (which is what turns red if a default moves).
//      Regenerate the golden with `node scratchpad/test-cs005-p1.js --record`.
//   2. An open well's two OUTERMOST boundaries do not exist. polyAt clamps the
//      vertex parameter to [0.5, n-0.5], so lane -0.5 and lane n-0.5 project to
//      the lane CENTRES 0 and n-1. A 13-lane Vee has twelve ridable boundaries.
//   3. boundaryFrom is NOT laneHop. Folding an off-lattice start about the
//      lattice bounds overshoots by a lane and a half; both are asserted here.
"use strict";

const H = require("./_harness.js");
const { installSeed, mulberry32 } = require("./_seeded-random.js");

installSeed(20260830);                     // ⛔ above the first buildGame()

const X = H.buildGame();
const WELLS = X.WELLS;
const { laneHop, laneWrap, rimPoint, screenPos,
        laneBoundaryLo, laneBoundaryHi, boundaryFrom } = X;

const OPEN = WELLS.filter(w => !w.closed);
const CLOSED = WELLS.filter(w => w.closed);
const EPS = 1e-12;

// ---------------------------------------------------------------------------
// ⛔ THE EQUIVALENCE SWEEP. All sixteen wells x lane values at quarter-lane
// resolution running two lanes past each end of the strip x seven deltas
// including half-lanes x both directions.
// ---------------------------------------------------------------------------
const SWEEP_DELTAS = [-2, -1, -0.5, 0, 0.5, 1, 2];
const SWEEP_DIRS = [-1, 1];
const SWEEP_PAD = 2;                       // lanes past each end of the strip
const SWEEP_RES = 4;                       // quarter-lane

function sweep(visit) {
  let n = 0;
  for (const w of WELLS) {
    const kLo = -SWEEP_PAD * SWEEP_RES;
    const kHi = (w.lanes + SWEEP_PAD) * SWEEP_RES;
    for (let k = kLo; k <= kHi; k++) {
      const lane = k / SWEEP_RES;
      for (const delta of SWEEP_DELTAS) {
        for (const dir of SWEEP_DIRS) { visit(w, lane, delta, dir); n++; }
      }
    }
  }
  return n;
}

// FNV-1a over the RAW float64 bytes of every returned lane and dir, in two
// independent accumulators. Hashing bytes rather than a decimal string is what
// makes this an Object.is-strength check: +0 and -0 have different bit
// patterns and would hash apart.
const _hb = new ArrayBuffer(8);
const _hf = new Float64Array(_hb);
const _hu = new Uint8Array(_hb);
let hA = 0x811c9dc5 >>> 0, hB = 0x01000193 >>> 0;
function hashNum(v) {
  _hf[0] = v;
  for (let i = 0; i < 8; i++) {
    hA = Math.imul(hA ^ _hu[i], 0x01000193) >>> 0;
    hB = Math.imul(hB ^ _hu[7 - i], 0x85ebca6b) >>> 0;
  }
}
const hashHex = () => hA.toString(16).padStart(8, "0") + hB.toString(16).padStart(8, "0");

let nonFinite = 0;
const SWEEP_CASES = sweep((w, lane, delta, dir) => {
  const r = laneHop(w, lane, delta, dir);
  if (!Number.isFinite(r.lane) || !Number.isFinite(r.dir)) nonFinite++;
  hashNum(r.lane);
  hashNum(r.dir);
});

// ⛔ THE GOLDEN. Recorded from the build at 74fb50c — CS004's close, before
// laneHop took fold bounds. Re-record it ONLY when the four-argument form's
// behaviour is deliberately changed, which is a GDD 3.5 change and not a
// refactor. Changing either default bound turns this red.
const GOLDEN_SWEEP = "6ae5b9ddac22bbfb";
const GOLDEN_CASES = 16856;

if (process.argv.includes("--record")) {
  console.log(`cases ${SWEEP_CASES}  hash ${hashHex()}  nonFinite ${nonFinite}`);
  process.exit(0);
}

H.eq(SWEEP_CASES, GOLDEN_CASES, "the sweep visited the recorded number of cases");
H.eq(nonFinite, 0, "no non-finite lane or dir anywhere in the sweep");
H.assert(hashHex() === GOLDEN_SWEEP,
  `⛔ the four-argument laneHop is bit-identical to the pre-change build over ` +
  `${SWEEP_CASES} cases (got ${hashHex()}, want ${GOLDEN_SWEEP})`);

// The same sweep again, per-case, against the six-argument form called with the
// documented defaults. The hash above pins the MATH; this pins the DEFAULTS,
// and unlike the hash it names the case that broke.
{
  let bad = 0, first = "";
  sweep((w, lane, delta, dir) => {
    const a = laneHop(w, lane, delta, dir);
    const b = laneHop(w, lane, delta, dir, 0, w.lanes - 1);
    if (!Object.is(a.lane, b.lane) || a.dir !== b.dir) {
      if (!bad) first = `${w.name} lane ${lane} delta ${delta} dir ${dir}: ` +
                        `${a.lane}/${a.dir} vs ${b.lane}/${b.dir}`;
      bad++;
    }
  });
  H.eq(bad, 0, `⛔ lo defaults to 0 and hi to lanes-1 (${first})`);
}

// ---------------------------------------------------------------------------
// The lattice accessors (all sixteen wells)
// ---------------------------------------------------------------------------
for (const [name, fn] of Object.entries({ laneBoundaryLo, laneBoundaryHi, boundaryFrom })) {
  H.assert(typeof fn === "function", `${name} is exported by the build`);
}

for (const w of WELLS) {
  const label = `${w.id} ${w.name}`;
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);

  // ⛔ Numbers, not an object — a per-frame path may not allocate (§17).
  H.assert(typeof lo === "number" && typeof hi === "number",
           `${label}: the lattice accessors return numbers, not an object`);
  H.eq(lo, 0.5, `${label}: the lowest boundary is 0.5`);
  H.eq(hi, w.closed ? w.lanes - 0.5 : w.lanes - 1.5,
       `${label}: the highest boundary`);

  // Every lattice point is a half-integer, and the count is what GDD 3.5 says:
  // `lanes` on a closed well; on an open one the INTERIOR rim vertices only,
  // which is `lanes - 1` of a strip that has `lanes + 1` vertices — twelve on
  // the 13-lane Vee, not fourteen.
  const ridable = Math.round(hi - lo) + 1;
  H.eq(ridable, w.closed ? w.lanes : w.lanes - 1,
       `${label}: ridable boundary count`);
  H.assert(Number.isInteger(lo - 0.5) && Number.isInteger(hi - 0.5),
           `${label}: both bounds sit on the half-integer lattice`);
}

// ⛔ WHY THE OUTERMOST TWO DO NOT EXIST. polyAt clamps an open well's vertex
// parameter to [0.5, n-0.5] — lane [0, n-1] — so lane -0.5 and lane n-0.5
// project to the same points as the lane CENTRES 0 and n-1. Not a second
// silhouette at the wall: the same one, drawn twice.
const pt = (w, l) => rimPoint(w, l, { x: 0, y: 0 });
for (const w of OPEN) {
  const label = `${w.id} ${w.name}`;
  const n = w.lanes;
  const under = pt(w, -0.5), centre0 = pt(w, 0);
  const over = pt(w, n - 0.5), centreN = pt(w, n - 1);
  H.assert(Math.abs(under.x - centre0.x) < EPS && Math.abs(under.y - centre0.y) < EPS,
           `${label}: boundary -0.5 is not drawable — it lands on lane centre 0`);
  H.assert(Math.abs(over.x - centreN.x) < EPS && Math.abs(over.y - centreN.y) < EPS,
           `${label}: boundary ${n - 0.5} is not drawable — it lands on lane centre ${n - 1}`);

  // The innermost ridable boundary IS distinct, and it is a rim VERTEX: lane
  // k+0.5 has vertex parameter k+1. An open rim's two END vertices are the
  // walls, so the ridable boundaries are its interior vertices, 1 … lanes-1.
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);
  const inner = pt(w, lo);
  H.assert(Math.abs(inner.x - centre0.x) > EPS || Math.abs(inner.y - centre0.y) > EPS,
           `${label}: boundary ${lo} IS distinct from lane centre 0`);
  H.close(inner.x, w.rim[1].x, EPS, `${label}: boundary ${lo} is rim vertex 1 (x)`);
  H.close(inner.y, w.rim[1].y, EPS, `${label}: boundary ${lo} is rim vertex 1 (y)`);
  const outer = pt(w, hi);
  H.close(outer.x, w.rim[n - 1].x, EPS, `${label}: boundary ${hi} is rim vertex ${n - 1} (x)`);
  H.close(outer.y, w.rim[n - 1].y, EPS, `${label}: boundary ${hi} is rim vertex ${n - 1} (y)`);

  // Every lattice point projects finitely at both ends of the well.
  let finite = true;
  for (let l = lo; l <= hi + EPS; l += 1) {
    const a = screenPos(w, l, 0, { x: 0, y: 0 }), b = screenPos(w, l, 1, { x: 0, y: 0 });
    if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) finite = false;
  }
  H.assert(finite, `${label}: every ridable boundary projects finitely, throat to rim`);
}

// On a closed well all n boundaries are legal AND drawable — lane lanes-0.5 is
// vertex 0, reached the long way round.
for (const w of CLOSED) {
  const label = `${w.id} ${w.name}`;
  const top = pt(w, w.lanes - 0.5);
  H.close(top.x, w.rim[0].x, EPS, `${label}: boundary ${w.lanes - 0.5} is rim vertex 0 (x)`);
  H.close(top.y, w.rim[0].y, EPS, `${label}: boundary ${w.lanes - 0.5} is rim vertex 0 (y)`);
}

// ---------------------------------------------------------------------------
// ⛔ boundaryFrom BY EXHAUSTION — every integer lane, every well, both
// directions. One reversal always suffices; this proves it rather than
// asserting it in a comment.
// ---------------------------------------------------------------------------
for (const w of OPEN) {
  const label = `${w.id} ${w.name}`;
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);
  let offLattice = 0, outOfRange = 0, tooFar = 0, disagreed = 0, reversals = 0, badDir = 0;

  for (let lane = 0; lane < w.lanes; lane++) {
    for (const dir of SWEEP_DIRS) {
      const r = boundaryFrom(w, lane, dir);
      if (!Number.isInteger(r.lane - 0.5)) offLattice++;
      if (r.lane < lo - EPS || r.lane > hi + EPS) outOfRange++;
      if (Math.abs(r.lane - lane) > 0.5 + EPS) tooFar++;
      if (r.dir !== 1 && r.dir !== -1) badDir++;
      // The heading and the landing are ONE piece of state: the boundary taken
      // is always the one the RETURNED dir points at.
      if (!Object.is(r.lane, lane + r.dir * 0.5)) disagreed++;
      if (r.dir !== dir) reversals++;
    }
  }

  H.eq(offLattice, 0, `${label}: boundaryFrom always lands on the lattice`);
  H.eq(outOfRange, 0, `${label}: boundaryFrom always lands inside [${lo}, ${hi}]`);
  H.eq(tooFar, 0, `${label}: boundaryFrom never moves more than half a lane`);
  H.eq(badDir, 0, `${label}: boundaryFrom returns a unit direction`);
  H.eq(disagreed, 0, `${label}: the returned lane is the one the returned dir points at`);
  // Exactly two: lane 0 heading down, and lane lanes-1 heading up. Every other
  // integer lane has a legal boundary on both sides.
  H.eq(reversals, 2, `${label}: exactly two of the ${w.lanes * 2} births reverse`);
  H.eq(boundaryFrom(w, 0, -1).dir, 1, `${label}: lane 0 heading down turns around`);
  H.eq(boundaryFrom(w, 0, -1).lane, lo, `${label}: ...and takes boundary ${lo}`);
  H.eq(boundaryFrom(w, w.lanes - 1, 1).dir, -1, `${label}: the last lane heading up turns around`);
  H.eq(boundaryFrom(w, w.lanes - 1, 1).lane, hi, `${label}: ...and takes boundary ${hi}`);
}

// Closed wells have no wall, so nothing ever reverses and lane 0 heading down
// is a legal boundary at the far end of the seam.
for (const w of CLOSED) {
  const label = `${w.id} ${w.name}`;
  let reversals = 0, offLattice = 0, mismatched = 0;
  for (let lane = 0; lane < w.lanes; lane++) {
    for (const dir of SWEEP_DIRS) {
      const r = boundaryFrom(w, lane, dir);
      if (r.dir !== dir) reversals++;
      if (!Number.isInteger(r.lane - 0.5)) offLattice++;
      if (!Object.is(r.lane, laneWrap(w, lane + dir * 0.5))) mismatched++;
    }
  }
  H.eq(reversals, 0, `${label}: a closed well never reverses a birth — it has no wall`);
  H.eq(offLattice, 0, `${label}: boundaryFrom always lands on the lattice`);
  H.eq(mismatched, 0, `${label}: boundaryFrom is the wrapped half-step on a closed well`);
}

{
  const ring = WELLS.find(w => w.name === "Ring");
  const r = boundaryFrom(ring, 0, -1);
  H.eq(r.lane, 15.5, "Ring: lane 0 heading down gives boundary 15.5");
  H.eq(r.dir, -1, "Ring: ...and keeps its heading");
  const p = pt(ring, 15.5);
  H.close(p.x, ring.rim[0].x, EPS, "Ring: boundary 15.5 resolves to vertex 0 (x)");
  H.close(p.y, ring.rim[0].y, EPS, "Ring: boundary 15.5 resolves to vertex 0 (y)");
}

// ---------------------------------------------------------------------------
// ⛔ THE BOUNDARY CROSS — what the whole phase is for.
// ---------------------------------------------------------------------------
{
  const vee = WELLS.find(w => w.name === "Vee");
  const lo = laneBoundaryLo(vee), hi = laneBoundaryHi(vee);   // 0.5, 11.5
  H.eq(lo, 0.5, "Vee: lattice lo");
  H.eq(hi, 11.5, "Vee: lattice hi");

  // The degeneracy the phase exists to remove. Same call, two lattices.
  const centreFold = laneHop(vee, 0.5, -1, -1);
  H.eq(centreFold.lane, 0.5, "Vee: on the CENTRE lattice a cross from 0.5 lands where it started");
  H.eq(centreFold.dir, 1, "Vee: ...and reverses, which is correct for the Vaulter");

  const near = laneHop(vee, 0.5, -1, -1, lo, hi);
  H.eq(near.lane, 1.5, "⛔ Vee: on the BOUNDARY lattice the same cross moves a full lane");
  H.eq(near.dir, 1, "Vee: ...and reverses");

  const far = laneHop(vee, 11.5, 1, 1, lo, hi);
  H.eq(far.lane, 10.5, "Vee: a cross off the far lattice bound moves a full lane");
  H.eq(far.dir, -1, "Vee: ...and reverses");

  const mid = laneHop(vee, 5.5, 1, 1, lo, hi);
  H.eq(mid.lane, 6.5, "Vee: an interior cross is a plain move");
  H.eq(mid.dir, 1, "Vee: ...and keeps its heading");

  // ⛔ WHY boundaryFrom IS NOT laneHop. An off-lattice start folded about the
  // lattice bounds overshoots by a lane and a half — three times a cross.
  const overshoot = laneHop(vee, 0, -0.5, -1, lo, hi);
  H.eq(overshoot.lane, 1.5, "⛔ folding an off-lattice birth about the lattice overshoots to 1.5");
  H.eq(boundaryFrom(vee, 0, -1).lane, 0.5, "⛔ boundaryFrom gives the adjacent boundary instead");
}

// ---------------------------------------------------------------------------
// The lattice soak — the guarantee an entity riding boundaries depends on.
// A synthetic rider driving the REAL laneHop with the lattice bounds and the
// dir write-back. Unit crosses are the real motion; the hostile multi-lane
// steps exercise reflection at every parity.
// ---------------------------------------------------------------------------
const SOAK_TICKS = 5000;
for (const w of OPEN) {
  const label = `${w.id} ${w.name}`;
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);
  const rnd = mulberry32(w.id * 3517 + 29);

  let lane = lo, dir = 1;
  let off = 0, out = 0, teleport = 0, stuck = 0, reversals = 0;
  let touchedLo = false, touchedHi = false;

  for (let t = 0; t < SOAK_TICKS; t++) {
    // Nine crosses in ten are the Drifter's own single lane; the tenth is a
    // hostile jump wider than the well.
    const mag = rnd() < 0.9 ? 1 : 1 + Math.floor(rnd() * (w.lanes * 2));
    const before = lane;
    const r = laneHop(w, lane, mag * dir, dir, lo, hi);

    if (!Number.isInteger(r.lane - 0.5)) off++;
    if (r.lane < lo - EPS || r.lane > hi + EPS) out++;
    if (r.dir !== 1 && r.dir !== -1) stuck++;
    if (r.dir !== dir) reversals++;
    if (mag === 1 && Math.abs(r.lane - before) > 1 + EPS) teleport++;
    if (r.lane === lo) touchedLo = true;
    if (r.lane === hi) touchedHi = true;

    lane = r.lane;
    dir = r.dir;                            // the write-back the helper requires
  }

  H.eq(off, 0, `${label}: a rider never left the boundary lattice over ${SOAK_TICKS} crosses`);
  H.eq(out, 0, `${label}: a rider stayed inside [${lo}, ${hi}] over ${SOAK_TICKS} crosses`);
  H.eq(stuck, 0, `${label}: dir stayed a unit direction over the soak`);
  H.eq(teleport, 0, `${label}: a single-lane cross never moved more than one lane`);
  H.assert(reversals > 0, `${label}: the soak actually hit a lattice bound and reversed`);
  H.assert(touchedLo && touchedHi, `${label}: the soak reached both lattice bounds`);
}

// The closed mirror: the bounds are inert, the rider wraps, and it never
// reverses. A wrap that quietly became a fold fails here.
for (const w of CLOSED) {
  const label = `${w.id} ${w.name}`;
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);
  const rnd = mulberry32(w.id * 4093 + 7);
  let lane = 0.5, dir = 1, off = 0, out = 0, reversals = 0;

  for (let t = 0; t < SOAK_TICKS; t++) {
    const r = laneHop(w, lane, (1 + Math.floor(rnd() * w.lanes)) * dir, dir, lo, hi);
    if (!Number.isInteger(r.lane - 0.5)) off++;
    if (!(r.lane >= 0 && r.lane < w.lanes)) out++;
    if (r.dir !== dir) reversals++;
    lane = r.lane;
    dir = r.dir;
  }

  H.eq(off, 0, `${label}: a rider never left the boundary lattice over ${SOAK_TICKS} crosses`);
  H.eq(out, 0, `${label}: a rider stayed in [0, lanes) over ${SOAK_TICKS} crosses`);
  H.eq(reversals, 0, `${label}: the lattice bounds are inert on a closed well — it wraps`);
}

H.report();

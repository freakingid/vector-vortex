// 03-wells.js — the sixteen well definitions (GDD 3.3, 3.4). DATA ONLY.
//
// Each well: { id, name, closed, lanes, rim: [{x,y}...], throatScale,
// throatOffset? }. `rim` is in a normalized space centred on the origin,
// coordinates within [-1, 1]. A closed well's rim is a loop:
// rim.length === lanes (lane i runs from rim[i] to rim[(i+1) % lanes]). An
// open well's rim is a strip: rim.length === lanes + 1 (lane i runs from
// rim[i] to rim[i+1], no wrap).
//
// ⛔ throatOffset TRANSLATES THE THROAT POLYGON IN NORMALIZED RIM SPACE,
// APPLIED AFTER THE CENTROID SCALE (GDD 3.3). It is the escape hatch for a rim
// whose centroid lies on or near the rim itself. Absent means {x: 0, y: 0}, so
// a well that omits it is not a special case — fourteen of the sixteen do.
//
// ⛔ AN OFFSET IS DATA AND IS NEVER WRITTEN AT RUNTIME. wellThroat() memoizes
// on well._throat under a header that already assumes the rim is IMMUTABLE at
// runtime; an offset in the well DEFINITION is immutable and safe, but one
// written later — a camera effect, a tool poking the live data — would be read
// once and then cached forever, and the throat would silently keep describing
// the old shape. If a future phase ever needs a moving throat, that is a new
// per-frame quantity in the renderer, not a write into here.
//
// ⛔ AND IT MOVES NOTHING IN LANE SPACE. Entity position is (lane, depth) and
// the projection happens at paint time, so an offset moves the VISUAL end of a
// well and no lane, no clamp, no boundary and no hash (GDD 3.2, 3.5;
// scratchpad/test-cs006-p2.js asserts both halves).
//
// The data is above; the DEPTH MODEL (GDD 3.2, 3.5) is below it. Rendering is
// not here — that is 13-render-well.js, which consumes screenPos().

const WELLS = [
  { id: 1, name: "Ring", closed: true, lanes: 16, rim: [{ x: 0, y: -1 }, { x: 0.3827, y: -0.9239 }, { x: 0.7071, y: -0.7071 }, { x: 0.9239, y: -0.3827 }, { x: 1, y: 0 }, { x: 0.9239, y: 0.3827 }, { x: 0.7071, y: 0.7071 }, { x: 0.3827, y: 0.9239 }, { x: 0, y: 1 }, { x: -0.3827, y: 0.9239 }, { x: -0.7071, y: 0.7071 }, { x: -0.9239, y: 0.3827 }, { x: -1, y: 0 }, { x: -0.9239, y: -0.3827 }, { x: -0.7071, y: -0.7071 }, { x: -0.3827, y: -0.9239 }], throatScale: C.THROAT_SCALE },
  { id: 2, name: "Box", closed: true, lanes: 16, rim: [{ x: -1, y: -1 }, { x: -0.5, y: -1 }, { x: 0, y: -1 }, { x: 0.5, y: -1 }, { x: 1, y: -1 }, { x: 1, y: -0.5 }, { x: 1, y: 0 }, { x: 1, y: 0.5 }, { x: 1, y: 1 }, { x: 0.5, y: 1 }, { x: 0, y: 1 }, { x: -0.5, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0.5 }, { x: -1, y: 0 }, { x: -1, y: -0.5 }], throatScale: C.THROAT_SCALE },
  { id: 3, name: "Cross", closed: true, lanes: 16, rim: [{ x: -0.35, y: -1 }, { x: 0, y: -1 }, { x: 0.35, y: -1 }, { x: 0.35, y: -0.35 }, { x: 1, y: -0.35 }, { x: 1, y: 0 }, { x: 1, y: 0.35 }, { x: 0.35, y: 0.35 }, { x: 0.35, y: 1 }, { x: 0, y: 1 }, { x: -0.35, y: 1 }, { x: -0.35, y: 0.35 }, { x: -1, y: 0.35 }, { x: -1, y: 0 }, { x: -1, y: -0.35 }, { x: -0.35, y: -0.35 }], throatScale: C.THROAT_SCALE },
  { id: 4, name: "Bowtie", closed: true, lanes: 14, rim: [{ x: -0.5103, y: 0.6123 }, { x: -0.8184, y: 0.4621 }, { x: -1, y: 0.1714 }, { x: -1, y: -0.1714 }, { x: -0.8184, y: -0.4621 }, { x: -0.5103, y: -0.6123 }, { x: 0, y: -0.0878 }, { x: 0.5103, y: -0.6123 }, { x: 0.8184, y: -0.4621 }, { x: 1, y: -0.1714 }, { x: 1, y: 0.1714 }, { x: 0.8184, y: 0.4621 }, { x: 0.5103, y: 0.6123 }, { x: 0, y: 0.0878 }], throatScale: C.THROAT_SCALE },
  { id: 5, name: "Pinwheel", closed: true, lanes: 16, rim: [{ x: 0, y: -1 }, { x: 0.3277, y: -0.7912 }, { x: 0.4954, y: -0.4954 }, { x: 0.7676, y: -0.3179 }, { x: 0.9978, y: 0 }, { x: 0.8147, y: 0.3374 }, { x: 0.4984, y: 0.4984 }, { x: 0.3084, y: 0.7445 }, { x: 0, y: 0.9913 }, { x: -0.3468, y: 0.8373 }, { x: -0.5045, y: 0.5045 }, { x: -0.7226, y: 0.2993 }, { x: -0.9807, y: 0 }, { x: -0.8583, y: -0.3555 }, { x: -0.5134, y: -0.5134 }, { x: -0.291, y: -0.7025 }], throatScale: C.THROAT_SCALE },
  { id: 6, name: "Delta", closed: true, lanes: 15, rim: [{ x: 0, y: -1 }, { x: 0.1732, y: -0.7 }, { x: 0.3464, y: -0.4 }, { x: 0.5196, y: -0.1 }, { x: 0.6928, y: 0.2 }, { x: 0.866, y: 0.5 }, { x: 0.5196, y: 0.5 }, { x: 0.1732, y: 0.5 }, { x: -0.1732, y: 0.5 }, { x: -0.5196, y: 0.5 }, { x: -0.866, y: 0.5 }, { x: -0.6928, y: 0.2 }, { x: -0.5196, y: -0.1 }, { x: -0.3464, y: -0.4 }, { x: -0.1732, y: -0.7 }], throatScale: C.THROAT_SCALE },
  { id: 7, name: "Clover", closed: true, lanes: 16, rim: [{ x: 0, y: -1 }, { x: 0.3491, y: -0.8427 }, { x: 0.495, y: -0.495 }, { x: 0.8427, y: -0.3491 }, { x: 1, y: 0 }, { x: 0.8427, y: 0.3491 }, { x: 0.495, y: 0.495 }, { x: 0.3491, y: 0.8427 }, { x: 0, y: 1 }, { x: -0.3491, y: 0.8427 }, { x: -0.495, y: 0.495 }, { x: -0.8427, y: 0.3491 }, { x: -1, y: 0 }, { x: -0.8427, y: -0.3491 }, { x: -0.495, y: -0.495 }, { x: -0.3491, y: -0.8427 }], throatScale: C.THROAT_SCALE },
  { id: 8, name: "Vee", closed: false, lanes: 13, rim: [{ x: -1, y: -0.6 }, { x: -0.8571, y: -0.3714 }, { x: -0.7143, y: -0.1429 }, { x: -0.5714, y: 0.0857 }, { x: -0.4286, y: 0.3143 }, { x: -0.2857, y: 0.5429 }, { x: -0.1429, y: 0.7714 }, { x: 0, y: 1 }, { x: 0.1667, y: 0.7333 }, { x: 0.3333, y: 0.4667 }, { x: 0.5, y: 0.2 }, { x: 0.6667, y: -0.0667 }, { x: 0.8333, y: -0.3333 }, { x: 1, y: -0.6 }], throatScale: C.THROAT_SCALE },
  { id: 9, name: "Stair", closed: false, lanes: 12, rim: [{ x: -1, y: -0.7 }, { x: -0.8333, y: -0.7 }, { x: -0.6667, y: -0.7 }, { x: -0.5, y: -0.35 }, { x: -0.3333, y: -0.35 }, { x: -0.1667, y: -0.35 }, { x: 0, y: 0 }, { x: 0.1667, y: 0 }, { x: 0.3333, y: 0 }, { x: 0.5, y: 0.35 }, { x: 0.6667, y: 0.35 }, { x: 0.8333, y: 0.35 }, { x: 1, y: 0.7 }], throatScale: C.THROAT_SCALE, throatOffset: { x: 0, y: -0.35 } },
  { id: 10, name: "Trough", closed: false, lanes: 14, rim: [{ x: -1, y: 1 }, { x: -1, y: 0.4667 }, { x: -1, y: -0.0667 }, { x: -1, y: -0.6 }, { x: -0.75, y: -0.6 }, { x: -0.5, y: -0.6 }, { x: -0.25, y: -0.6 }, { x: 0, y: -0.6 }, { x: 0.25, y: -0.6 }, { x: 0.5, y: -0.6 }, { x: 0.75, y: -0.6 }, { x: 1, y: -0.6 }, { x: 1, y: -0.0667 }, { x: 1, y: 0.4667 }, { x: 1, y: 1 }], throatScale: C.THROAT_SCALE },
  { id: 11, name: "Flat", closed: false, lanes: 12, rim: [{ x: -1, y: 0.3 }, { x: -0.8333, y: 0.3 }, { x: -0.6667, y: 0.3 }, { x: -0.5, y: 0.3 }, { x: -0.3333, y: 0.3 }, { x: -0.1667, y: 0.3 }, { x: 0, y: 0.3 }, { x: 0.1667, y: 0.3 }, { x: 0.3333, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.6667, y: 0.3 }, { x: 0.8333, y: 0.3 }, { x: 1, y: 0.3 }], throatScale: C.THROAT_SCALE, throatOffset: { x: 0, y: -0.50 } },
  { id: 12, name: "Heart", closed: true, lanes: 16, rim: [{ x: 0, y: -0.2941 }, { x: 0.0527, y: -0.4535 }, { x: 0.3328, y: -0.6827 }, { x: 0.7422, y: -0.6093 }, { x: 0.9412, y: -0.2353 }, { x: 0.7422, y: 0.1934 }, { x: 0.3328, y: 0.5651 }, { x: 0.0527, y: 0.8694 }, { x: 0, y: 1 }, { x: -0.0527, y: 0.8694 }, { x: -0.3328, y: 0.5651 }, { x: -0.7422, y: 0.1934 }, { x: -0.9412, y: -0.2353 }, { x: -0.7422, y: -0.6093 }, { x: -0.3328, y: -0.6827 }, { x: -0.0527, y: -0.4535 }], throatScale: C.THROAT_SCALE },
  { id: 13, name: "Star", closed: true, lanes: 16, rim: [{ x: 0, y: -1 }, { x: 0.1913, y: -0.4619 }, { x: 0.7071, y: -0.7071 }, { x: 0.4619, y: -0.1913 }, { x: 1, y: 0 }, { x: 0.4619, y: 0.1913 }, { x: 0.7071, y: 0.7071 }, { x: 0.1913, y: 0.4619 }, { x: 0, y: 1 }, { x: -0.1913, y: 0.4619 }, { x: -0.7071, y: 0.7071 }, { x: -0.4619, y: 0.1913 }, { x: -1, y: 0 }, { x: -0.4619, y: -0.1913 }, { x: -0.7071, y: -0.7071 }, { x: -0.1913, y: -0.4619 }], throatScale: C.THROAT_SCALE },
  { id: 14, name: "Double-Vee", closed: false, lanes: 14, rim: [{ x: -1, y: 1 }, { x: -0.875, y: 0.575 }, { x: -0.75, y: 0.15 }, { x: -0.625, y: -0.275 }, { x: -0.5, y: -0.7 }, { x: -0.3333, y: -0.2667 }, { x: -0.1667, y: 0.1667 }, { x: 0, y: 0.6 }, { x: 0.1667, y: 0.1667 }, { x: 0.3333, y: -0.2667 }, { x: 0.5, y: -0.7 }, { x: 0.625, y: -0.275 }, { x: 0.75, y: 0.15 }, { x: 0.875, y: 0.575 }, { x: 1, y: 1 }], throatScale: C.THROAT_SCALE },
  { id: 15, name: "Fan", closed: false, lanes: 11, rim: [{ x: -0.9728, y: -0.2607 }, { x: -0.884, y: -0.4826 }, { x: -0.7453, y: -0.6775 }, { x: -0.5645, y: -0.834 }, { x: -0.352, y: -0.9436 }, { x: -0.1195, y: -1 }, { x: 0.1195, y: -1 }, { x: 0.352, y: -0.9436 }, { x: 0.5645, y: -0.834 }, { x: 0.7453, y: -0.6775 }, { x: 0.884, y: -0.4826 }, { x: 0.9728, y: -0.2607 }], throatScale: C.THROAT_SCALE },
  { id: 16, name: "Twist", closed: true, lanes: 16, rim: [{ x: 0, y: 0 }, { x: 0.3827, y: 0.3536 }, { x: 0.7071, y: 0.5 }, { x: 0.9239, y: 0.3536 }, { x: 1, y: 0 }, { x: 0.9239, y: -0.3536 }, { x: 0.7071, y: -0.5 }, { x: 0.3827, y: -0.3536 }, { x: 0, y: 0 }, { x: -0.3827, y: 0.3536 }, { x: -0.7071, y: 0.5 }, { x: -0.9239, y: 0.3536 }, { x: -1, y: 0 }, { x: -0.9239, y: -0.3536 }, { x: -0.7071, y: -0.5 }, { x: -0.3827, y: -0.3536 }], throatScale: C.THROAT_SCALE },
];

// ---------------------------------------------------------------------------
// THE DEPTH MODEL (GDD 3.2, 3.5; RATIONALE.md#depth-model)
// ---------------------------------------------------------------------------
//
// ⛔ Every entity position is (lane, depth). Screen coordinates are derived
// HERE and only at render time. Nothing upstream of screenPos may hold an x/y.
//
//   lane   float in LANE-CENTRE units. lane === i is the CENTRE of lane i,
//          i.e. the midpoint of the rim edge rim[i] -> rim[i+1]. That is why
//          the Skimmer clamps to [0, lanes-1] on an open well (GDD 3.5) and
//          why snap assist rounds to an integer (GDD 4.1): the integers ARE
//          the lane centres. Do not re-read lane as a vertex index — vertex
//          param is lane + 0.5, and conflating the two is a half-lane offset
//          that looks almost right on a Ring and obviously wrong on a Box.
//   depth  float in [0,1]. 0 = throat, 1 = rim.
//
// A fractional lane walks the rim POLYGON, not the chord between adjacent lane
// centres. On a sharp corner (Box, Cross, Star) the chord cuts the corner and
// the Skimmer visibly leaves the rim; walking the polygon keeps it on the wire.
//
// The Twist (figure-eight) needs no special case anywhere in here: its throat
// is the same polygon scaled toward its own centroid, so its lanes cross
// correctly and no code notices (GDD 3.3).

// Rim vertex count for a well. Closed rims are loops (lanes verts); open rims
// are strips (lanes + 1 verts). Every index walk below goes through this.
function wellVertCount(well) {
  return well.closed ? well.lanes : well.lanes + 1;
}

// The throat polygon: the rim scaled toward its centroid by throatScale, then
// TRANSLATED by the optional throatOffset (GDD 3.3 — the definition and the
// ⛔ never-write-it-at-runtime rule are in this file's header). Two of the
// sixteen wells carry one: the Flat, whose rim is a straight line so its
// centroid lies ON the rim and every spoke was collinear, and the Stair, whose
// centroid sits a tenth of a lane length from rim vertex 6.
//
// ⛔ Memoized on the well object. This is called for every entity every frame
// once entities exist; recomputing a centroid per call is the per-frame
// allocation the §17 perf budget forbids. Cached under a non-enumerable key so
// the well data still serializes and diffs as pure data.
//
// ⛔ The cache assumes rim data is IMMUTABLE at runtime, which it is: a well is
// a static shape and a Thorn chips a lane's LENGTH (C.THORN_CHIP, a depth
// quantity), never a rim vertex. If a future phase ever mutates well.rim, it
// must delete well._throat and well._centroid in the same breath, or the
// throat silently keeps describing the old shape.
function wellThroat(well) {
  if (well._throat) return well._throat;

  const n = wellVertCount(well);
  let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) { cx += well.rim[i].x; cy += well.rim[i].y; }
  cx /= n; cy /= n;

  const s = well.throatScale;
  const ox = (well.throatOffset && well.throatOffset.x) || 0;
  const oy = (well.throatOffset && well.throatOffset.y) || 0;

  const throat = new Array(n);
  for (let i = 0; i < n; i++) {
    throat[i] = {
      x: cx + (well.rim[i].x - cx) * s + ox,
      y: cy + (well.rim[i].y - cy) * s + oy,
    };
  }
  Object.defineProperty(well, "_throat", { value: throat, enumerable: false });
  Object.defineProperty(well, "_centroid", { value: { x: cx, y: cy }, enumerable: false });
  return throat;
}

// The rim centroid, in normalized rim space. Derived with the throat, so this
// forces that derivation rather than duplicating the loop.
function wellCentroid(well) {
  wellThroat(well);
  return well._centroid;
}

// ---- Lane space -----------------------------------------------------------
//
// ⛔ GDD 3.5: open wells are NOT closed wells with a clamp. Lane space is a
// different topology per well, and every helper below dispatches on it:
//
//   closed  a circle of circumference `lanes`. lane === lanes is lane 0.
//   open    a segment [0, lanes-1]. The ends are WALLS, not seams.

// Wrap a lane into [0, lanes) on a closed well. Handles any magnitude and any
// sign — a negative modulus in JS is negative, hence the double-mod.
function laneWrap(well, lane) {
  const n = well.lanes;
  return ((lane % n) + n) % n;
}

// Clamp a lane into [0, lanes-1] on an open well (GDD 3.5, the Skimmer rule).
function laneClamp(well, lane) {
  const hi = well.lanes - 1;
  return lane < 0 ? 0 : (lane > hi ? hi : lane);
}

// The one route from a raw lane value to a legal one. Dispatches on topology
// so no caller has to remember which well it is holding.
function laneNormalize(well, lane) {
  return well.closed ? laneWrap(well, lane) : laneClamp(well, lane);
}

// Shortest signed lane distance from a to b — the wrap-aware `shortDelta`
// analogue RATIONALE.md#depth-model names. On a closed well this is the short
// way round and is in [-lanes/2, lanes/2]; on an open well there is only one
// way round, so it is the plain difference.
//
// Use this for "which way do I turn", never a bare (b - a): on a Ring, lane 15
// to lane 0 is +1, not -15.
function laneDelta(well, a, b) {
  if (!well.closed) return b - a;
  const n = well.lanes;
  let d = laneWrap(well, b - a);
  if (d > n / 2) d -= n;
  return d;
}

// ⛔ THE WALL HELPER (GDD 3.5, §17 test 3). A lane hop of `delta` from `lane`,
// returning BOTH the resulting lane and the direction the hopper is now
// travelling.
//
// The returned `dir` is the whole point. An enemy that stores its own hop
// direction and only asks this helper for a POSITION keeps a stale direction
// after a bounce and grinds against the wall forever, one hop in and one hop
// back. The wall and the hopper's direction are ONE piece of state: an enemy
// must write back the `dir` it gets here.
//
//   closed  wraps. dir is unchanged — there is no wall to turn at.
//   open    mirror-folds into [lo, hi], reflecting as many times as the hop
//           needs. dir flips once per reflection, so an even number of
//           bounces restores the original heading. This is NOT a clamp: a
//           clamped hopper parks on the end lane, a reflected one turns
//           around and comes back, which is the behaviour GDD 3.5 specifies.
//
// `dir` is passed through rather than inferred from delta's sign so a caller
// hopping by 0 keeps its heading instead of silently resetting it.
//
// ⛔ `lo`/`hi` ARE THE FOLD BOUNDS, AND THEY ARE A PARAMETER BECAUSE TWO
// LATTICES EXIST (GDD 3.5, the boundary lattice). They default to `0` and
// `well.lanes - 1` — the extreme legal positions of a lane-CENTRE entity, so
// every existing caller is untouched and the Vaulter's behaviour is unchanged
// by construction. A boundary-RIDER's extreme legal positions are `0.5` and
// `well.lanes - 1.5` (laneBoundaryLo/Hi below), and folding it about the
// centre bounds makes a cross from `0.5` land back on `0.5` — a whole
// vulnerable crossing window in which the entity announces itself as
// shootable and then does not move.
//
// ⛔ Two entities want different fold BOUNDS, not a second helper. There is
// exactly one mirror-fold in this build and it is here
// (RATIONALE.md#depth-model). If a third lattice ever appears, that is the
// moment to extract a `laneFold` and make this a wrapper — not before.
//
// ⚠ On a closed well `lo`/`hi` are inert: it wraps, and there is nothing to
// fold about. A caller may pass them unconditionally.
function laneHop(well, lane, delta, dir, lo, hi) {
  const d = (dir === undefined) ? (delta < 0 ? -1 : 1) : dir;

  if (well.closed) {
    return { lane: laneWrap(well, lane + delta), dir: d };
  }

  const a = (lo === undefined) ? 0 : lo;
  const b = (hi === undefined) ? well.lanes - 1 : hi;
  const span = b - a;
  if (span <= 0) return { lane: a, dir: d };

  const period = 2 * span;
  let m = ((lane + delta - a) % period + period) % period;   // [0, 2*span)
  let flipped = false;
  if (m > span) { m = period - m; flipped = true; }           // fold the far half back
  return { lane: a + m, dir: flipped ? -d : d };
}

// ---- The boundary lattice (GDD 3.5) ---------------------------------------
//
// A lane BOUNDARY is the half-integer between two lane centres: lane `k + 0.5`
// is the edge shared by lanes k and k+1. Vertex parameter is lane + 0.5, so a
// boundary sits exactly on rim vertex k+1 — it is drawn, not interpolated.
//
// ⛔ AN OPEN WELL'S TWO OUTERMOST BOUNDARIES DO NOT EXIST, and the reason is
// not only that laneClamp would refuse them. `polyAt` clamps an open well's
// vertex parameter to [0.5, n - 0.5], which is lane [0, n-1] — so lane `-0.5`
// and lane `n - 0.5` project to the SAME POINTS as the lane CENTRES `0` and
// `n - 1`. The walls are not drawable, let alone ridable: an entity placed
// there would be a second silhouette exactly on top of a first.
//
// So an open well's ridable boundaries are exactly its INTERIOR rim vertices —
// vertices 1 … lanes-1 of a strip that has lanes+1 of them — which is
// `lanes - 1` of them, at lane 0.5 … lanes-1.5. Count it on the 13-lane Vee
// and it is TWELVE, not the fourteen its rim vertex count suggests.
//
// A closed well has no walls, so all `lanes` boundaries are legal and
// drawable: lane `lanes - 0.5` resolves to rim vertex 0, reached the long way
// round the seam.
//
// ⛔ Numbers, not an object. These are read on a per-frame path and `{lo, hi}`
// would allocate every call, which §17's perf budget forbids. laneBoundaryLo
// takes a `well` it does not read, so the pair has one signature and a caller
// never has to remember which half is topology-dependent.
function laneBoundaryLo(well) {
  return 0.5;
}

function laneBoundaryHi(well) {
  return well.closed ? well.lanes - 0.5 : well.lanes - 1.5;
}

// ⛔ THE BIRTH HELPER (GDD 3.5, 6.1). A boundary-riding entity is spawned at an
// integer lane CENTRE — `spawnEnemy()` is a function of (kind, lane, depth) and
// knows nothing about any entity's lattice — and crosses onto the lattice on
// its first update. This answers where that half-cross lands and which heading
// the entity keeps: { lane, dir }.
//
//   closed  the wrapped half-step. There is no wall, so dir never changes and
//           lane 0 heading down gives `lanes - 0.5`, a legal boundary.
//   open    the half-step, and if it leaves [lo, hi] the heading REVERSES ONCE
//           and the other side is taken.
//
// ⛔ One reversal always suffices. From an integer lane centre only two births
// in a whole well can fail — lane 0 heading down and lane `lanes-1` heading up
// — and a strip of three lanes or more has a legal boundary on the other side
// of both. Every shipped well has at least eleven lanes. Proven by exhaustion
// in scratchpad/test-cs005-p1.js rather than asserted here.
//
// ⛔ THIS DOES NOT GO THROUGH laneHop, and that is not a duplication. laneHop
// folds; folding an OFF-LATTICE start about the lattice bounds overshoots —
// laneHop(Vee, 0, -0.5, -1, 0.5, 11.5) returns lane 1.5, a lane and a half in
// one cross time, which a soak reads as a teleport. A half-step that reverses
// is a different question from a hop that reflects.
//
// ⛔ This helper is where `well.closed` is read, so an entity riding the
// lattice never learns the topology — the same property the Vaulter's header
// claims, and the only reason it behaves on a Ring and on a Fan without a
// branch.
//
// `lane` is expected to be a legal lane centre. It carries a fractional lane
// through unchanged (the debug bench spawns in the Skimmer's continuous lane):
// the result is still legal and still within half a lane, but it is only ON
// the lattice when the input was an integer.
function boundaryFrom(well, lane, dir) {
  const d = dir < 0 ? -1 : 1;

  if (well.closed) return { lane: laneWrap(well, lane + d * 0.5), dir: d };

  const lo = laneBoundaryLo(well);
  const hi = laneBoundaryHi(well);
  const first = lane + d * 0.5;
  if (first >= lo && first <= hi) return { lane: first, dir: d };
  return { lane: lane - d * 0.5, dir: -d };
}

// Is this lane against a wall? Always false on a closed well — a closed well
// has no walls, only a seam, and treating the seam as a wall is the mirror of
// the GDD 3.5 bug.
function laneAtWall(well, lane) {
  if (well.closed) return false;
  return lane <= 0 || lane >= well.lanes - 1;
}

// ⛔ THE SPLIT HELPER (GDD 6.2, 3.5). Where a Carrier's two children go: one
// lane either side of the parent, as a pair of LEGAL, DISTINCT lanes.
//
// It lives here, beside laneHop, because the thing that makes it non-trivial
// is GDD 3.5 and nothing about cargo: `laneNormalize` CLAMPS on an open well,
// so the naive `[lane - 1, lane + 1]` puts BOTH children of a lane-0 Carrier
// in lanes 0 and 1 — two silhouettes stacked in one lane, on the six wells
// where the player has the least room to dodge, at the exact moment they are
// being asked to read a split. That is GDD 1.1 P2 failing, and it fails on the
// six open wells only, which is how it survives a closed-well playtest.
//
//   closed  lane ± 1, wrapped. There is no wall, so nothing else to do.
//   open    lane ± 1, then the PAIR is shifted inward — never squashed —
//           until both ends are inside [0, lanes-1]. The gap between the two
//           children is therefore always exactly two lanes, at the wall as
//           much as in the middle: a parent at lane 0 of the 13-lane Vee
//           yields children at lanes 0 and 2, so one child still occupies the
//           lane the parent died in and the trap stays honest at the wall.
//
// ⛔ Shifting, not clamping, is the whole point, and it is the same distinction
// laneHop draws between a mirror-fold and a clamp. A caller that "simplifies"
// this to laneNormalize(lane ± 1) reintroduces the stack.
//
// `lane` may be fractional — the debug bench spawns in the Skimmer's
// continuous lane — and the arithmetic below carries that through unchanged.
function splitLanes(well, lane) {
  if (well.closed) {
    return [laneWrap(well, lane - 1), laneWrap(well, lane + 1)];
  }

  const max = well.lanes - 1;
  let a = lane - 1;
  let b = lane + 1;

  if (a < 0) { b -= a; a = 0; }               // shift the pair up off the wall
  if (b > max) { a -= (b - max); b = max; }   // and down off the other one

  // Only reachable on a well with fewer than three lanes, which no shipped
  // well is. The pair collapses rather than reading off the end of the strip.
  if (a < 0) a = 0;
  return [a, b];
}

// ---- Projection -----------------------------------------------------------

// depth -> the eased fraction of the way from throat to rim (GDD 3.2).
// C.PERSPECTIVE_EXP is ~0.55: below 1, so depth spends most of its range near
// the throat and the last stretch to the rim is fast. Lower = more rush.
function perspective(depth) {
  return Math.pow(depth < 0 ? 0 : (depth > 1 ? 1 : depth), C.PERSPECTIVE_EXP);
}

// The inverse of perspective(): the depth whose eased position is `p`.
//
// ⛔ This is how an entity gets a drawn extent that behaves. screenPos lerps
// LINEARLY in perspective space, so a fixed step in `p` is a fixed step in
// SCREEN distance — which means a silhouette sized in depth units is the wrong
// size everywhere except where it was tuned. Size the silhouette in perspective
// space (where the eye lives), come back through here, and hand screenPos a
// depth. 14-render-entities.js's entityPoints() is the reader.
//
// Exact inverse on [0,1]: perspective(invPerspective(p)) === p to float
// precision. Clamped at both ends, so a shape reaching past the rim lands ON
// the rim rather than producing a depth > 1 that perspective() would clamp
// anyway — the clamp lives here so the depth handed onward is always legal.
function invPerspective(p) {
  const q = p < 0 ? 0 : (p > 1 ? 1 : p);
  return Math.pow(q, 1 / C.PERSPECTIVE_EXP);
}

// Walk a polygon in LANE units and write the result into `out`.
// Lane L sits at vertex parameter L + 0.5 — see the header note.
function polyAt(poly, well, lane, out) {
  const n = well.lanes;
  const t = lane + 0.5;
  let i = Math.floor(t);
  const f = t - i;

  if (well.closed) {
    i = ((i % n) + n) % n;
    const a = poly[i], b = poly[(i + 1) % n];
    out.x = a.x + (b.x - a.x) * f;
    out.y = a.y + (b.y - a.y) * f;
  } else {
    // A legal lane is in [0, lanes-1], so t is in [0.5, lanes-0.5] and both
    // indices are already in range. An ILLEGAL lane is clamped here rather
    // than indexed: an out-of-range lane must yield a finite edge point, never
    // a read past the end of the array. Callers should have normalized first
    // (laneNormalize), so this is a backstop, not the movement rule.
    const tc = t < 0.5 ? 0.5 : (t > n - 0.5 ? n - 0.5 : t);
    i = Math.floor(tc);
    const a = poly[i], b = poly[i + 1];
    const g = tc - i;
    out.x = a.x + (b.x - a.x) * g;
    out.y = a.y + (b.y - a.y) * g;
  }
  return out;
}

// The rim point for a lane, in normalized rim space.
function rimPoint(well, lane, out) {
  return polyAt(well.rim, well, lane, out || { x: 0, y: 0 });
}

// The throat point for a lane, in normalized rim space.
function throatPoint(well, lane, out) {
  return polyAt(wellThroat(well), well, lane, out || { x: 0, y: 0 });
}

// ⛔ screenPos(well, lane, depth) — THE projection. GDD 3.2:
//
//   screenPos = lerp( throatVertex(lane), rimVertex(lane), perspective(depth) )
//
// Normalized rim space ([-1,1] about the origin) is mapped onto the fixed
// 1280x720 world by C.WELL_CX / C.WELL_CY / C.WELL_RADIUS. ⛔ Game math never
// reads window size; the canvas is letterboxed by CSS.
//
// `out` is an optional scratch point. The render path passes one per call site
// so a full frame allocates nothing — §17's perf budget forbids per-frame
// allocation in the hot path.
//
// The two module-level scratch points below make this NON-REENTRANT: screenPos
// must not be called from inside a callback screenPos itself invoked. It never
// is — this is a leaf function — but do not give it one.
const _rimP = { x: 0, y: 0 };
const _thrP = { x: 0, y: 0 };
function screenPos(well, lane, depth, out) {
  const p = out || { x: 0, y: 0 };
  const t = perspective(depth);

  rimPoint(well, lane, _rimP);
  throatPoint(well, lane, _thrP);

  const nx = _thrP.x + (_rimP.x - _thrP.x) * t;
  const ny = _thrP.y + (_rimP.y - _thrP.y) * t;

  p.x = C.WELL_CX + nx * C.WELL_RADIUS;
  p.y = C.WELL_CY + ny * C.WELL_RADIUS;
  return p;
}

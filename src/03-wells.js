// 03-wells.js — the sixteen well definitions (GDD 3.3, 3.4). DATA ONLY.
//
// Each well: { id, name, closed, lanes, rim: [{x,y}...], throatScale }. `rim`
// is in a normalized space centred on the origin, coordinates within [-1, 1].
// A closed well's rim is a loop: rim.length === lanes (lane i runs from
// rim[i] to rim[(i+1) % lanes]). An open well's rim is a strip:
// rim.length === lanes + 1 (lane i runs from rim[i] to rim[i+1], no wrap).
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
  { id: 9, name: "Stair", closed: false, lanes: 12, rim: [{ x: -1, y: -0.7 }, { x: -0.8333, y: -0.7 }, { x: -0.6667, y: -0.7 }, { x: -0.5, y: -0.35 }, { x: -0.3333, y: -0.35 }, { x: -0.1667, y: -0.35 }, { x: 0, y: 0 }, { x: 0.1667, y: 0 }, { x: 0.3333, y: 0 }, { x: 0.5, y: 0.35 }, { x: 0.6667, y: 0.35 }, { x: 0.8333, y: 0.35 }, { x: 1, y: 0.7 }], throatScale: C.THROAT_SCALE },
  { id: 10, name: "Trough", closed: false, lanes: 14, rim: [{ x: -1, y: 1 }, { x: -1, y: 0.4667 }, { x: -1, y: -0.0667 }, { x: -1, y: -0.6 }, { x: -0.75, y: -0.6 }, { x: -0.5, y: -0.6 }, { x: -0.25, y: -0.6 }, { x: 0, y: -0.6 }, { x: 0.25, y: -0.6 }, { x: 0.5, y: -0.6 }, { x: 0.75, y: -0.6 }, { x: 1, y: -0.6 }, { x: 1, y: -0.0667 }, { x: 1, y: 0.4667 }, { x: 1, y: 1 }], throatScale: C.THROAT_SCALE },
  { id: 11, name: "Flat", closed: false, lanes: 12, rim: [{ x: -1, y: 0.3 }, { x: -0.8333, y: 0.3 }, { x: -0.6667, y: 0.3 }, { x: -0.5, y: 0.3 }, { x: -0.3333, y: 0.3 }, { x: -0.1667, y: 0.3 }, { x: 0, y: 0.3 }, { x: 0.1667, y: 0.3 }, { x: 0.3333, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.6667, y: 0.3 }, { x: 0.8333, y: 0.3 }, { x: 1, y: 0.3 }], throatScale: C.THROAT_SCALE },
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

// The throat polygon: the rim scaled toward its centroid by throatScale, plus
// the optional throatOffset from GDD 3.3 (absent on every shipped well; it
// defaults to zero, so a well that omits it is not a special case).
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
// travelling. Enemies do not exist yet; this is built now and correctly
// because retrofitting it is where the well's two clocks desynchronize.
//
// The returned `dir` is the whole point. An enemy that stores its own hop
// direction and only asks this helper for a POSITION keeps a stale direction
// after a bounce and grinds against the wall forever, one hop in and one hop
// back. The wall and the hopper's direction are ONE piece of state: an enemy
// must write back the `dir` it gets here.
//
//   closed  wraps. dir is unchanged — there is no wall to turn at.
//   open    mirror-folds into [0, lanes-1], reflecting as many times as the
//           hop needs. dir flips once per reflection, so an even number of
//           bounces restores the original heading. This is NOT a clamp: a
//           clamped hopper parks on the end lane, a reflected one turns
//           around and comes back, which is the behaviour GDD 3.5 specifies.
//
// `dir` is passed through rather than inferred from delta's sign so a caller
// hopping by 0 keeps its heading instead of silently resetting it.
function laneHop(well, lane, delta, dir) {
  const d = (dir === undefined) ? (delta < 0 ? -1 : 1) : dir;

  if (well.closed) {
    return { lane: laneWrap(well, lane + delta), dir: d };
  }

  const max = well.lanes - 1;
  if (max <= 0) return { lane: 0, dir: d };

  const period = 2 * max;
  let m = ((lane + delta) % period + period) % period;   // [0, 2*max)
  let flipped = false;
  if (m > max) { m = period - m; flipped = true; }        // fold the far half back
  return { lane: m, dir: flipped ? -d : d };
}

// Is this lane against a wall? Always false on a closed well — a closed well
// has no walls, only a seam, and treating the seam as a wall is the mirror of
// the GDD 3.5 bug.
function laneAtWall(well, lane) {
  if (well.closed) return false;
  return lane <= 0 || lane >= well.lanes - 1;
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

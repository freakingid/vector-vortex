// 14-render-entities.js — entity draw code, kept apart from 06-shots.js so the
// glow/particle primitives here can move into kit-fx wholesale later (CLAUDE.md
// "Modules built here, destined for the kit"). CS002 P3 added the shot streak;
// CS003 P1 adds the shared entity projection helper and the Vaulter.
//
// ⛔ drawPoly + glowStroke only (GDD 10.2). No fill, no sprite, no texture.
//
// ⛔ Readability contract (GDD 10.3): nothing opaque below C.READABILITY_DEPTH.
// A shot's leading edge fades linearly to nothing as it nears the throat,
// rather than snapping to invisible at the boundary or staying legible into
// the zone Tempest 4000 was criticised for cluttering.

// Preallocated projection scratch — one point per end of the streak. Like
// screenPos() and skimmerPoints(), this makes drawShot() non-reentrant; it is
// a leaf call, so that is fine.
const _shotHead = { x: 0, y: 0 };
const _shotTail = { x: 0, y: 0 };

// 1 at/above READABILITY_DEPTH; below it, fades linearly to 0 at the throat.
function shotAlpha(depth) {
  if (depth >= C.READABILITY_DEPTH) return 1;
  return depth <= 0 ? 0 : depth / C.READABILITY_DEPTH;
}

// A short streak from the shot's leading edge (toward the throat) back to its
// trailing edge (toward the rim), C.SHOT_LEN deep. The trailing edge is capped
// at depth 1 — a shot fired this instant must not draw a tail past the rim.
function drawShot(ctx, well, lane, depth) {
  const tail = depth + C.SHOT_LEN > 1 ? 1 : depth + C.SHOT_LEN;
  screenPos(well, lane, depth, _shotHead);
  screenPos(well, lane, tail, _shotTail);
  drawPoly(ctx, [_shotHead, _shotTail], false);
  glowStroke(ctx, C.SKIMMER_COLOR, laneLineWidth(depth), shotAlpha(depth));
}

// ---------------------------------------------------------------------------
// entityPoints — the shared silhouette projection. ALL NINE ENEMIES USE THIS.
// ---------------------------------------------------------------------------
//
// A local-space point array `poly` becomes screen points for an entity sitting
// at (lane, depth). Each point is:
//
//   l   lane offset in HALF-WIDTH units. l = ±1 is ±size/2 lanes, so the
//       silhouette spans exactly `size` lane widths at its extremes.
//   d   depth offset in HALF-EXTENT units, ±1, measured in PERSPECTIVE SPACE
//       and scaled by C.ENEMY_DEPTH_SCALE. Positive is toward the rim.
//
// ⛔ THE TRAP, AND IT IS NOT OBVIOUS. perspective() is depth^0.55, and screenPos
// lerps LINEARLY in perspective space. A silhouette built with a CONSTANT depth
// offset — the way SKIMMER_POLY is, correctly, because the Skimmer never leaves
// depth 1 — therefore covers about 13% of the well's screen length at the
// throat and about 3% at the rim. An enemy drawn that way is huge when it is
// far away and shrinks as it comes at you: the exact inverse of perspective,
// and it reads as a bug in the well, not in the enemy.
//
// So the depth extent is a fraction of the entity's OWN perspective position:
// half-extent = p * C.ENEMY_DEPTH_SCALE, converted back to a depth through
// invPerspective(). Screen size then falls off with distance the same way the
// lane width already does, and one constant tunes every enemy.
//
// The whole shape is pulled inward when it would otherwise reach past the rim,
// rather than letting invPerspective's clamp collapse the outer points onto the
// rim line. A rim-hunting Vaulter is the enemy the player most needs to read at
// a glance (GDD 1.1 P2), and it sits at exactly the depth where the clamp would
// flatten it into a different silhouette.
//
// ⛔ No per-frame allocation (GDD 17, perf budget). Each poly memoizes its own
// scratch array of screen points on first use — the same non-enumerable cache
// pattern wellThroat() uses, and for the same reason. Consequences: the array
// is SHARED, so copy out of it if you need to keep it, and entityPoints is
// non-reentrant PER POLY. Draw calls are sequential leaves, so that is fine.
function entityScratch(poly) {
  if (!poly._pts) {
    const pts = new Array(poly.length);
    for (let i = 0; i < poly.length; i++) pts[i] = { x: 0, y: 0 };
    Object.defineProperty(poly, "_pts", { value: pts, enumerable: false });
  }
  return poly._pts;
}

function entityPoints(well, lane, depth, poly, size) {
  const out = entityScratch(poly);
  const half = size / 2;
  const scale = C.ENEMY_DEPTH_SCALE;

  // The largest outward reach this shape asks for, and the centre position that
  // keeps it inside the rim. At depth 1 the shape sits with its outermost
  // points ON the rim and the rest inside it — the same relationship the
  // Skimmer's prongs have with the rim, arrived at from the other direction.
  let maxD = 0;
  for (let i = 0; i < poly.length; i++) if (poly[i].d > maxD) maxD = poly[i].d;
  const pMax = 1 / (1 + maxD * scale);
  let p = perspective(depth);
  if (p > pMax) p = pMax;

  for (let i = 0; i < poly.length; i++) {
    const q = poly[i];
    // ⛔ The lane offset is NOT normalized. On an open well an end-lane entity
    // reaches past the wall, and polyAt's backstop clamps it to the end vertex
    // — the silhouette flattens against the wall instead of teleporting to the
    // far side of the well. Normalizing here would wrap it (closed) or square
    // it off half a lane early (open), and the first is GDD 3.5's bug wearing
    // a rendering hat.
    screenPos(well, lane + q.l * half, invPerspective(p * (1 + q.d * scale)), out[i]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The Vaulter's silhouette (GDD 6.1, 18).
// ---------------------------------------------------------------------------
//
// GDD 6.1's flattened X, as one CLOSED concave outline: four arms reaching out
// across the lanes, a waist pinched in at each side, and a notch top and
// bottom. Wider across the lanes than it is deep — the flattening — so it reads
// as a wingspan blocking a lane rather than as a diamond.
//
// ⛔ GDD 18 item 3: this has to be OURS. The shape Atari's is remembered for is
// a bowtie — two solid triangles meeting at a point, with nothing pinched and
// no notch. The four notches are the difference, and they are load-bearing, not
// decoration. Do not "simplify" this back to six points.
//
// Shape DATA, the same class of thing as WELLS' rim polygons. The scale is the
// tunable, and it lives in C.VAULTER_SIZE.
const VAULTER_POLY = [
  { l: -1.00, d: -0.55 },   // upper-left arm tip
  { l: -0.30, d:  0.00 },   // left waist
  { l: -1.00, d:  0.55 },   // lower-left arm tip
  { l:  0.00, d:  0.26 },   // near notch
  { l:  1.00, d:  0.55 },   // lower-right arm tip
  { l:  0.30, d:  0.00 },   // right waist
  { l:  1.00, d: -0.55 },   // upper-right arm tip
  { l:  0.00, d: -0.26 },   // far notch
];

// ⛔ drawPoly + glowStroke, one closed path, no fill (GDD 10.2). Line weight
// tracks depth exactly as the well's lanes do (laneLineWidth), so the craft
// belongs to the geometry it is climbing rather than sitting on top of it.
//
// ⛔ FULL ALPHA AT EVERY DEPTH — no shotAlpha()-style fade here. GDD 10.3 is a
// rule about what may be drawn OVER the throat zone (explosions, particles,
// popups); the enemy is the approaching thing that rule protects. Fading a
// Vaulter into the throat is the readability failure, not the fix for it.
function drawVaulter(ctx, well, lane, depth) {
  drawPoly(ctx, entityPoints(well, lane, depth, VAULTER_POLY, C.VAULTER_SIZE), true);
  glowStroke(ctx, C.VAULTER_COLOR, laneLineWidth(depth), 1);
}

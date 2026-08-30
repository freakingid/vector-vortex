// 14-render-entities.js — entity draw code, kept apart from 06-shots.js so the
// glow/particle primitives here can move into kit-fx wholesale later (CLAUDE.md
// "Modules built here, destined for the kit"). CS002 P3 adds the shot streak;
// nothing else lives here yet.
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

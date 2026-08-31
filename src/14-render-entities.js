// 14-render-entities.js — entity draw code, kept apart from 06-shots.js so the
// glow/particle primitives here can move into kit-fx wholesale later (CLAUDE.md
// "Modules built here, destined for the kit"). CS002 P3 added the shot streak;
// CS003 P1 adds the shared entity projection helper and the Vaulter; CS004 P2
// adds the Carrier's hull and its cargo glyphs, P3 the Weaver and its bolt, and
// P4 the Thorn — which is the first entity here that is NOT a silhouette at a
// point and so does not use entityPoints() at all. See drawThorn() at the foot.
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

// ---------------------------------------------------------------------------
// The Carrier's silhouette (GDD 6.1, 6.2, 18) — a hollow diamond hull with a
// cargo glyph inside it.
// ---------------------------------------------------------------------------
//
// ⛔ THE TWO SHAPES READ AS ONE ENTITY AND ARE TWO POLYS. entityPoints()
// memoizes a scratch array PER POLY ARRAY (see its header), so a second poly
// costs one more projection loop and zero allocation. Drawing the glyph as
// extra points on the hull's own path would join them with a stroke and turn
// two shapes into one scribble.
//
// ⛔ GDD 18 item 3: ours, not Atari's. GDD 6.1 names the silhouette — a hollow
// diamond — and a rhombus outline is generic geometry, so the divergence has to
// live somewhere else, and it does: the PROPORTION (this one is deep rather
// than long, which is what makes it read as a container beside the Vaulter's
// wide shallow X), the glyph, and GDD 10.1's depth-varying line weight and
// glow. If a future pass wants more separation, add it here — do not reach for
// a name or a colour from the game this is an homage to.
//
// Shape DATA, the same class of thing as WELLS' rim polygons. The lane extent
// is scaled by C.CARRIER_SIZE; the depth extent is NOT (entityPoints scales `d`
// by C.ENEMY_DEPTH_SCALE alone), so the ±0.85 below is what makes the hull
// deeper than the Vaulter's ±0.55 at the same distance.
const CARRIER_POLY = [
  { l:  0.00, d: -0.85 },   // far tip, toward the throat
  { l:  1.00, d:  0.00 },
  { l:  0.00, d:  0.85 },   // near tip, toward the rim
  { l: -1.00, d:  0.00 },
];

// ⛔ ONE GLYPH PER CARGO, keyed by the CARGO name (07-enemies.js). GDD 6.2 says
// reading the glyph fast is the skill that separates competent from good, so
// the design rule for a new row is legibility at THROAT depth, not detail at
// the rim: two or three points, one unmistakable gesture, and no feature that
// survives only at full size. CS005's rows are drifter and surger.
//
// The Vaulter's is a chevron aimed at the player — an OPEN path, so it never
// reads as a second closed outline nested in the hull, and angled rather than
// flat so it cannot be mistaken for a piece of the diamond it sits in. Its
// extents are ~42% of the hull's on both axes (0.34 / 0.80 across the lanes,
// 0.36 / 0.85 on depth), which is what keeps it visibly INSIDE the hull at
// every depth but one: at the rim, entityPoints clamps every poly so its
// outermost point lands exactly ON the rim, so the chevron's apex and the
// hull's near tip meet there. That is inherent to the clamp, it happens to
// both, and it is the depth at which the Carrier is about to kill you rather
// than the depth at which you are reading its cargo.
const CARGO_GLYPHS = {
  vaulter: [
    { l: -1.00, d: -0.36 },
    { l:  0.00, d:  0.36 },
    { l:  1.00, d: -0.36 },
  ],
};

// ⛔ drawPoly + glowStroke, no fill (GDD 10.2), and FULL ALPHA AT EVERY DEPTH
// for the same reason the Vaulter has it: GDD 10.3 governs what may be drawn
// OVER the throat zone, and the enemy is the approaching thing that rule
// protects.
//
// ⚠ The glyph is stroked in C.CARRIER_COLOR, the hull's own colour, rather than
// in the cargo's. The palette note in 00-config.js is why: hue alone cannot
// separate eight simultaneous things, so silhouette carries the read and the
// palette's job is narrower. A cargo-coloured glyph is a real option for the
// first art pass — it is one lookup — but it is an art decision and it is not
// this phase's to make.
function drawCarrier(ctx, well, lane, depth, cargo) {
  drawPoly(ctx, entityPoints(well, lane, depth, CARRIER_POLY, C.CARRIER_SIZE), true);
  glowStroke(ctx, C.CARRIER_COLOR, laneLineWidth(depth), 1);

  // An unknown cargo draws the hull and nothing else, matching the way an
  // unknown kind spawns nothing and an unknown cargo carries nothing. A
  // Carrier with no glyph is visibly wrong; a thrown exception is a black
  // screen.
  const glyph = CARGO_GLYPHS[cargo];
  if (!glyph) return;
  drawPoly(ctx, entityPoints(well, lane, depth, glyph, C.CARRIER_GLYPH_SIZE), false);
  glowStroke(ctx, C.CARRIER_COLOR, laneLineWidth(depth), 1);
}

// ---------------------------------------------------------------------------
// The Weaver's silhouette (GDD 6.1, 18) — GDD 6.1's OPEN SPIRAL.
// ---------------------------------------------------------------------------
//
// ⛔ AN OPEN PATH. drawPoly's `closed` argument is false for this one, and it is
// not a stylistic choice: a spiral that closes is a set of nested boxes, and the
// unwinding is the whole read. This is the roster's first open silhouette.
//
// ⛔ IT MUST NOT READ AS A THREAT THE WAY THE VAULTER DOES, BECAUSE IT IS NOT
// ONE. Its body never kills (07-enemies.js — killDepth is null); what the
// player is afraid of is what it LEAVES and what it FIRES. So there are no arm
// tips, no points aimed at the rim, and nothing that reads as a wingspan
// blocking a lane. A coil unwinding in place is the opposite gesture: busy,
// occupied, indifferent to you.
//
// ⛔ GDD 18 item 3: ours, not Atari's. The shape that game's equivalent is
// remembered for is a rod with a wave running along it — a straight spine,
// which this deliberately has none of.
//
// A rectangular coil, four turns, wound outward from the centre. `l` reaches
// exactly ±1 at the extremes, so C.WEAVER_SIZE means what it means on every
// other silhouette: the lane widths the shape spans. The inner turns are the
// first thing lost at throat depth and that is correct — the outer sweep is
// what carries the read down there.
//
// Shape DATA, the same class of thing as WELLS' rim polygons.
const WEAVER_POLY = [
  { l:  0.00, d:  0.00 },   // the eye of the coil
  { l:  0.30, d:  0.00 },
  { l:  0.30, d:  0.34 },
  { l: -0.40, d:  0.34 },
  { l: -0.40, d: -0.44 },
  { l:  0.66, d: -0.44 },
  { l:  0.66, d:  0.70 },
  { l: -1.00, d:  0.70 },
  { l: -1.00, d: -0.90 },
  { l:  1.00, d: -0.90 },   // the loose end, trailing toward the throat
];

// ⛔ drawPoly + glowStroke, ONE OPEN path, no fill (GDD 10.2), and FULL ALPHA AT
// EVERY DEPTH for the same reason the Vaulter and the Carrier have it: GDD 10.3
// governs what may be drawn OVER the throat zone, and the enemy is the
// approaching thing that rule protects.
function drawWeaver(ctx, well, lane, depth) {
  drawPoly(ctx, entityPoints(well, lane, depth, WEAVER_POLY, C.WEAVER_SIZE), false);
  glowStroke(ctx, C.WEAVER_COLOR, laneLineWidth(depth), 1);
}

// ---------------------------------------------------------------------------
// The Weaver's bolt (GDD 4.5 item 4, 18) — a small dart, aimed at the rim.
// ---------------------------------------------------------------------------
//
// ⛔ IT HAS TO READ AS AIMED, because dodging it is the only answer the player
// has (it is not shootable — 07-enemies.js). So: a tip toward the RIM, two
// barbs swept back toward the throat, and a notched tail. Closed, small, and
// deliberately unlike both of the other two shapes it will share a lane with —
// the Carrier's cargo chevron is open and has no tip, and the Weaver that fired
// this has no straight edges at all.
//
// The depth extent reaches d = 1, the largest in the roster, so entityPoints'
// rim clamp holds it a fraction further off the rim than a Vaulter at the same
// depth. That is the right way round: the tip is what the player is reading.
const WEAVER_BOLT_POLY = [
  { l:  0.00, d:  1.00 },   // tip, toward the rim
  { l:  1.00, d: -0.40 },
  { l:  0.00, d:  0.00 },   // notched tail
  { l: -1.00, d: -0.40 },
];

// ⛔ Its own colour, a paler relative of its parent's (00-config.js), so a bolt
// is legibly the Weaver's output rather than a second Weaver. ⚠ Both are
// provisional, as the whole enemy palette is.
function drawWeaverBolt(ctx, well, lane, depth) {
  drawPoly(ctx, entityPoints(well, lane, depth, WEAVER_BOLT_POLY, C.WEAVER_BOLT_SIZE), true);
  glowStroke(ctx, C.WEAVER_BOLT_COLOR, laneLineWidth(depth), 1);
}

// ---------------------------------------------------------------------------
// The Thorn (GDD 6.1, 4.2, 10.2, 10.3, 18) — a bright lane segment.
// ---------------------------------------------------------------------------
//
// ⛔ entityPoints() DOES NOT APPLY HERE, AND THAT IS NOT AN OVERSIGHT. Every
// other enemy is a silhouette AT a point: a local-space poly projected around
// one (lane, depth). A Thorn is a SEGMENT ALONG the lane, from the throat to
// its tip, and it has no local-space shape at all — it is the same class of
// drawing as a shot's streak or the well's own spokes. The pattern it reuses is
// drawShot()'s at the top of this file: preallocated scratch points, screenPos
// per end, drawPoly, glowStroke. CS005's Surger telegraph is the other one.
//
// ⛔ NO PER-FRAME ALLOCATION (GDD 17's perf budget). The two point PAIRS are
// preallocated as well as the points, because `drawPoly(ctx, [a, b])` allocates
// an array literal every call — cheap, and still an allocation in a per-frame
// path with up to C.ENEMY_CAP Thorns in it.
const _thornRoot = { x: 0, y: 0 };   // the throat end — always depth 0
const _thornNeck = { x: 0, y: 0 };   // C.THORN_TIP_LEN back from the tip
const _thornTip  = { x: 0, y: 0 };
const _thornBody = [_thornRoot, _thornTip];
const _thornCrown = [_thornNeck, _thornTip];

// ⛔ FULL ALPHA AT EVERY DEPTH, INCLUDING INSIDE THE THROAT ZONE. GDD 10.3 is a
// rule about what may be drawn OVER that zone — explosions, particles, score
// popups, the things that hide an approaching enemy. A Thorn is not drawn over
// the well, it IS lane geometry, and the player has to be able to see which
// lanes are thorned from the moment one starts growing. Fading it would be the
// readability failure, exactly as it would be on a Vaulter.
//
// The tip is brighter because it is drawn TWICE — glowStroke composites with
// `lighter`, so the last C.THORN_TIP_LEN of the segment accumulates both
// strokes. ⛔ That is why there is no second colour and no alpha split: a chip
// landing is a visible step of the bright band down the lane, and one constant
// controls how much band there is.
//
// Line weight follows the well's own spokes (13-render-well.js): a stroke that
// spans a range of depths takes the weight of its MIDPOINT, because a single
// stroke has one width and the lane it lies in is getting narrower. The body's
// midpoint is depth/2; the crown sits at the tip and is therefore the wider of
// the two, which is the right way round for the thing the player is aiming at.
function drawThorn(ctx, well, lane, depth) {
  const tip = depth > 1 ? 1 : (depth < 0 ? 0 : depth);
  if (tip <= 0) return;   // a Thorn with no length yet — the step a Weaver
                          // stands one up. Nothing to draw, and drawing it
                          // would be a zero-length path.

  screenPos(well, lane, 0, _thornRoot);
  screenPos(well, lane, tip, _thornTip);
  drawPoly(ctx, _thornBody, false);
  glowStroke(ctx, C.THORN_COLOR, laneLineWidth(tip / 2), 1);

  const neck = tip - C.THORN_TIP_LEN;
  screenPos(well, lane, neck < 0 ? 0 : neck, _thornNeck);
  drawPoly(ctx, _thornCrown, false);
  glowStroke(ctx, C.THORN_COLOR, laneLineWidth(tip), 1);
}

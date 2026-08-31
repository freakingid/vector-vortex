// 14-render-entities.js — entity draw code, kept apart from 06-shots.js so the
// glow/particle primitives here can move into kit-fx wholesale later (CLAUDE.md
// "Modules built here, destined for the kit"). CS002 P3 added the shot streak;
// CS003 P1 adds the shared entity projection helper and the Vaulter; CS004 P2
// adds the Carrier's hull and its cargo glyphs, P3 the Weaver and its bolt, and
// P4 the Thorn — which is the first entity here that is NOT a silhouette at a
// point and so does not use entityPoints() at all. CS005 P2 adds the Drifter's
// two silhouettes and P3 the Surger, which is BOTH: a silhouette at a point and
// a segment along its lane. See drawThorn() and drawSurgeLane() at the foot.
//
// ⛔ drawPoly + glowStroke only (GDD 10.2). No fill, no sprite, no texture.
//
// ⛔ Readability contract (GDD 10.3): nothing opaque below C.READABILITY_DEPTH.
// A shot's leading edge fades linearly to nothing as it nears the throat,
// rather than snapping to invisible at the boundary or staying legible into
// the throat zone. GDD 10.3 carries the reason that band is a rule at all.
//
// ⛔ GDD 18 item 1 / CLAUDE.md: the title this game is an homage to is not
// written in any file in this repo, comments included — this one used to name
// it and CS004 P5 removed it. `src/` is concatenated into the shipped artifact,
// so a comment here is a string in dist/vector-vortex.html.

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
// survives only at full size.
//
// ⛔ THE DESIGN RULE, WRITTEN DOWN SO THE NINTH ENEMY INHERITS IT: A GLYPH IS A
// MINIATURE OF ITS CARGO'S OWN GESTURE. The Vaulter's is a chevron, which is
// its arm; the Surger's is a zigzag with square corners, which is its bar; the
// Drifter's is a jagged scatter with no dominant axis, which is its cluster.
// That is what makes cargo-reading LEARNABLE rather than memorised — a player
// who has met the enemy has already met its glyph — and learnable is GDD 6.2's
// stated point. A new cargo takes the silhouette its entity already has and
// reduces it to the fewest points that keep the gesture.
//
// ⛔ AND THE STAKES ARE REAL, WHICH IS WHY THE TWO CONSEQUENTIAL ROWS ARE THE
// TWO THAT LOOK LEAST ALIKE. GDD 6.2's correct responses are opposite — Drifter
// cargo: shoot, MOVE AWAY; Surger cargo: shoot, HOLD STILL — so a player who
// reads the glyph wrong does the exact opposite of the right thing. The Surger
// and the Vaulter both span the full width; the Drifter is the compact tangle,
// and compact-versus-wide is the channel that carries the costly half of the
// read at the depth where the glyph is smallest.
//
// ⛔ EVERY GLYPH IS A PLAIN ARRAY OF POINTS AND EVERY GLYPH IS AN OPEN PATH.
// drawCarrier() below calls drawPoly(..., false) for all of them, with no
// per-cargo branch and no {poly, closed} row shape: a closed glyph reads as a
// second outline nested in the hull, and a reshaped table breaks the loops
// CS004 P2 and P5 wrote over it.
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

  // The Drifter's cluster (DRIFTER_POLY_RIDE / _CROSS below): a scatter that
  // doubles back. ⛔ `l` goes right, then LEFT, then right, so there is no
  // dominant axis and no monotonic run — which is the whole difference from the
  // surger row, and the difference the player pays for getting wrong. It
  // crosses itself once, which is what says "cluster" rather than "line", and
  // it spans ~62% of the glyph box's width so it reads COMPACT against the two
  // full-width rows at the depth where all three are smallest.
  drifter: [
    { l: -0.62, d: -0.14 },
    { l:  0.34, d:  0.36 },
    { l: -0.16, d: -0.36 },
    { l:  0.62, d:  0.08 },
  ],

  // The Surger's bar (SURGER_POLY below), reduced to ONE square cycle. ⛔ The
  // corners are square, exactly as the silhouette's are, because that is what
  // stops the bar reading as a lightning bolt and it is the half of the gesture
  // worth keeping at glyph size. Two flat runs across the lanes joined by one
  // step: full width, so it can never be the compact drifter row, and flat,
  // so it can never be the vaulter's angled chevron.
  surger: [
    { l: -1.00, d: -0.36 },
    { l:  0.00, d: -0.36 },
    { l:  0.00, d:  0.36 },
    { l:  1.00, d:  0.36 },
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
// per end, drawPoly, glowStroke. The Surger's telegraph is the other one and it
// landed in CS005 P3 — ⛔ with its OWN scratch points, not these, because both
// can be live in the same lane in the same frame (drawSurgeLane, at the foot).
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

// ---------------------------------------------------------------------------
// The Drifter's TWO silhouettes (GDD 6.1, 6.3, 12, 18) — the armour, made
// visible.
// ---------------------------------------------------------------------------
//
// ⛔ GDD 6.3 CARRIES A ⛔ ON THIS BEING READABLE AT A GLANCE, and it is the one
// place in Classic where a rendering decision is the difference between a hard
// enemy and an unfair one: a player who cannot tell an armoured Drifter from a
// vulnerable one is not playing against a threat, they are being killed at
// random. GDD 12's first-Drifter prompt names the visual language the game
// promises the player: SOLID = ARMOURED · OPEN = VULNERABLE.
//
// So the two states differ on THREE INDEPENDENT CHANNELS, and no one of them
// carries the read alone:
//
//   silhouette   a compact poly drawn CLOSED, against a splayed poly drawn OPEN
//   stroke width laneLineWidth * C.DRIFT_RIDE_WIDTH against * C.DRIFT_CROSS_WIDTH
//   alpha        C.DRIFT_RIDE_ALPHA against 1
//
// ⛔ TWO POLYS, NOT ONE POLY RESTYLED. entityPoints() memoizes a scratch array
// PER POLY ARRAY (see its header), so the second one costs one projection loop
// and zero allocation — the Carrier's shipped hull-and-glyph pattern. One poly
// drawn closed and then open differs by a single edge, which is not a read at a
// glance and is exactly what the ⛔ above forbids.
//
// ⛔ NO GLOBAL GLOW CONSTANT IS TOUCHED. glowStroke's wide pass is
// `width * C.GLOW_WIDE_W`, so a narrower width here is literally a harder edge
// rather than a metaphor for one — but GLOW_WIDE_W, GLOW_WIDE_ALPHA and
// GLOW_THIN_ALPHA are shared with the well and every other entity, and retuning
// one of them is an art pass across the whole build. Both Drifter states are
// per-entity multipliers only.
//
// ⛔ THE FULL-ALPHA RULE THE OTHER FOUR ENEMIES CARRY DOES NOT APPLY HERE, and
// that is not a hole in GDD 10.3. That rule is about what may be drawn OVER the
// throat zone — explosions, particles, popups, the things that hide an
// approaching enemy — and it is why the Vaulter, the Carrier, the Weaver and
// the bolt never fade. The Drifter's alpha is not a distance fade: it is
// constant with depth and it IS the feature. ⚠ Which means C.DRIFT_RIDE_ALPHA
// is the one constant in this file that can make an enemy hard to see at the
// throat, and judging it there is a playtest ask rather than an assertion.

// ⛔ GDD 18 item 3: ours. GDD 6.1's silhouette is a "tumbling spark cluster",
// and the two shapes below are the same cluster clenched and then thrown open.
//
// RIDING is a closed, irregular five-point knot with no axis of symmetry — a
// clenched thing sitting ON the boundary line, not spanning across it. It
// reaches only ~0.66 of the lane extent the crossing shape does, so the compact
// read survives even where the line weight and alpha do not (deep in the
// throat, where every stroke is thin).
//
// ⛔ It must be unmistakable from the Vaulter's flattened X, so there is no
// four-armed radial shape here and no arm tips at all: the Vaulter is a
// symmetric wingspan blocking a lane, and this is a lump riding an edge.
//
// Shape DATA, the same class of thing as WELLS' rim polygons. The lane extent
// is scaled by C.DRIFTER_SIZE; the depth extent is not (entityPoints scales `d`
// by C.ENEMY_DEPTH_SCALE alone).
const DRIFTER_POLY_RIDE = [
  { l:  0.06, d: -0.62 },
  { l:  0.62, d: -0.10 },
  { l:  0.34, d:  0.56 },
  { l: -0.40, d:  0.50 },
  { l: -0.66, d: -0.18 },
];

// CROSSING is the same cluster coming apart: an OPEN path that zigzags out past
// both edges of the shape it was, crossing its own centre three times. Open is
// half of GDD 12's promise, and the reversals are what make it read as a
// scatter rather than as a bigger version of the knot — a closed version of
// these points would be a spiky blob and would read as the same creature.
//
// `l` reaches exactly ±1 at the extremes, so C.DRIFTER_SIZE means on this what
// it means on every other silhouette: the lane widths the shape spans.
const DRIFTER_POLY_CROSS = [
  { l: -1.00, d:  0.06 },
  { l: -0.30, d: -0.34 },
  { l: -0.46, d:  0.88 },
  { l:  0.08, d: -0.06 },
  { l:  0.52, d:  0.92 },
  { l:  0.30, d: -0.42 },
  { l:  1.00, d: -0.04 },
];

// ⛔ drawPoly + glowStroke, one path, no fill (GDD 10.2). `riding` selects all
// three channels at once and is the entity's own phase (07-enemies.js) rather
// than anything this module decides — which is why the two states can never
// drift apart from the two behaviours.
//
// ⛔ Note that `riding` IS the `closed` argument. That is not a coincidence
// being exploited: GDD 12 promises the player SOLID = ARMOURED, and armoured is
// exactly the riding phase, so the two are the same boolean and writing them as
// one is what stops a later edit changing the shape without changing the rule.
function drawDrifter(ctx, well, lane, depth, riding) {
  const poly = riding ? DRIFTER_POLY_RIDE : DRIFTER_POLY_CROSS;
  const width = laneLineWidth(depth) * (riding ? C.DRIFT_RIDE_WIDTH : C.DRIFT_CROSS_WIDTH);
  drawPoly(ctx, entityPoints(well, lane, depth, poly, C.DRIFTER_SIZE), riding);
  glowStroke(ctx, C.DRIFTER_COLOR, width, riding ? C.DRIFT_RIDE_ALPHA : 1);
}

// ---------------------------------------------------------------------------
// The Surger (GDD 6.1, 6.3, 4.5 item 3, 10.2, 10.3, 18) — a zigzag bar, and
// THE FUSE, which is the other thing in this file that is a segment ALONG a
// lane rather than a silhouette AT a point.
// ---------------------------------------------------------------------------
//
// ⛔ THE TELEGRAPH IS AN ENTITY DRAW AND NOT drawWell()'s laneState. Game.draw()
// passes `null` for that parameter and no caller passes one; wiring it is
// CS006's, with the dim band. It could not express this anyway — isLaneLit() is
// a BOOLEAN over spokes, and GDD 6.3 asks for a lane that brightens throat→rim
// across C.SURGE_TELEGRAPH, which is a progressive fill.
//
// ⛔ ITS OWN SCRATCH POINTS, NOT THE THORN'S. A Thorn and a Surger can be live
// in the same lane in the same frame, and sharing module scratch between two
// segment drawers is a trap even though both calls are sequential leaves today
// — the failure would be one of the two segments drawn at the other's length,
// intermittently, and it would read as a bug in the well.
//
// ⛔ NO PER-FRAME ALLOCATION (GDD 17's perf budget). The point PAIR is
// preallocated as well as the points, because `drawPoly(ctx, [a, b])` allocates
// an array literal every call — drawThorn()'s rule, for drawThorn()'s reason.
const _surgeRoot = { x: 0, y: 0 };   // the throat end — always depth 0
const _surgeTip  = { x: 0, y: 0 };   // the fuse's leading edge
const _surgeSeg  = [_surgeRoot, _surgeTip];

// The fuse, and then the live lane — ONE drawer, because they are one gesture.
// `tip` is 0..1 of the lane the charge has covered and `live` is whether the
// lane is discharging.
//
// ⛔ ROOTED AT THE THROAT WITH THE TIP ADVANCING TO THE RIM, never a lane that
// merely gets brighter. What the player has to see is the charge TRAVELLING UP
// THE LANE AT THEM, because the thing they are being asked to decide is whether
// to leave, and a uniform glow says nothing about how long they have.
//
// ⛔ THE WIDTH IS THE STATE CHANGE. The fuse creeps up at plain lane weight —
// it is a warning and the lane is not lethal (07-enemies.js: killDepth is
// untouched for the whole telegraph) — and the discharge slams the whole lane
// to C.SURGE_LIT_WIDTH. The fuse reaching the rim and the lane going live are
// the same instant, so the geometry says exactly when: when it gets to you, it
// is live. ⛔ A per-entity multiplier on laneLineWidth and never a global glow
// constant (00-config.js).
//
// ⛔ FULL ALPHA AT EVERY DEPTH, INCLUDING INSIDE THE THROAT ZONE. GDD 10.3 is a
// rule about what may be drawn OVER that zone — explosions, particles, score
// popups, the things that hide an approaching enemy. A telegraph is not drawn
// over the well, it IS lane geometry, and the player has to see which lane is
// arming from the moment it starts arming. ⛔ Do not apply shotAlpha() to it:
// a fuse that is invisible for its first third is not a fuse, and GDD 6.3's ⛔
// is the whole reason this entity has a warning at all.
//
// Line weight follows the well's own spokes and drawThorn's rule: a stroke that
// spans a range of depths takes the weight of its MIDPOINT, because a single
// stroke has one width and the lane it lies in is getting narrower.
function drawSurgeLane(ctx, well, lane, tip, live) {
  const t = tip > 1 ? 1 : tip;
  if (t <= 0) return;   // no charge, or the first step of a telegraph — nothing
                        // to draw, and drawing it would be a zero-length path.

  screenPos(well, lane, 0, _surgeRoot);
  screenPos(well, lane, t, _surgeTip);
  drawPoly(ctx, _surgeSeg, false);
  glowStroke(ctx, C.SURGER_COLOR, laneLineWidth(t / 2) * (live ? C.SURGE_LIT_WIDTH : 1), 1);
}

// ⛔ GDD 18 item 3: this has to be OURS. GDD 6.1 names the silhouette — a zigzag
// bar — and the shape that game's equivalent is remembered for is a jagged rod
// with a DIAGONAL wave, standing ALONG the lane it electrifies. Two deliberate
// divergences, and both are load-bearing rather than decorative: every corner
// here is SQUARE, so it reads as a crenellation and never as a lightning bolt;
// and the bar lies ACROSS the lanes, so what the player sees coming is a rung
// blocking a lane rather than a rod filling one.
//
// ⛔ It must also be unmistakable from the two silhouettes it will share a well
// with. The Vaulter is a symmetric wingspan with four ARM TIPS reaching out and
// a notch top and bottom; the Weaver is a coil winding inward with no straight
// run in it at all. This is neither: a single unbroken run of right angles,
// open at both ends, with nothing pointed anywhere on it.
//
// Two full square cycles, `l` reaching exactly ±1 at the extremes so
// C.SURGER_SIZE means what it means on every other silhouette: the lane widths
// the shape spans. The end segments are equal and both on the far side, which
// is what makes it read as a BAR with a wave in it rather than as a staircase.
//
// Shape DATA, the same class of thing as WELLS' rim polygons.
const SURGER_POLY = [
  { l: -1.00, d: -0.45 },   // the far end, toward the throat
  { l: -0.60, d: -0.45 },
  { l: -0.60, d:  0.45 },
  { l: -0.20, d:  0.45 },
  { l: -0.20, d: -0.45 },
  { l:  0.20, d: -0.45 },
  { l:  0.20, d:  0.45 },
  { l:  0.60, d:  0.45 },
  { l:  0.60, d: -0.45 },
  { l:  1.00, d: -0.45 },   // …and the near end, mirroring it
];

// ⛔ drawPoly + glowStroke, ONE OPEN path for the bar, no fill (GDD 10.2), and
// FULL ALPHA AT EVERY DEPTH for the same reason the Vaulter, the Carrier, the
// Weaver and the bolt have it: GDD 10.3 governs what may be drawn OVER the
// throat zone, and the enemy is the approaching thing that rule protects.
//
// The lane goes down FIRST so the bar sits on top of its own charge — the
// silhouette is what the player aims at, and a fuse drawn over it at
// C.SURGE_LIT_WIDTH would swallow it at exactly the moment it matters.
//
// `tip` and `live` come from the entity's own phase (07-enemies.js) rather than
// from anything this module decides, which is why the drawing and the lethality
// can never disagree.
function drawSurger(ctx, well, lane, depth, tip, live) {
  drawSurgeLane(ctx, well, lane, tip, live);
  drawPoly(ctx, entityPoints(well, lane, depth, SURGER_POLY, C.SURGER_SIZE), false);
  glowStroke(ctx, C.SURGER_COLOR, laneLineWidth(depth), 1);
}

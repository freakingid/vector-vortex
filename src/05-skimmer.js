// 05-skimmer.js — the Skimmer, the player's craft (GDD 4.1, 3.5, 10.2).
//
// ⛔ `lane` is a CONTINUOUS FLOAT and the simulation never quantizes it. Snap
// assist PULLS it toward a lane centre; it does not round it. The one place a
// lane becomes an integer is fire time (CS002 P3), which picks the nearest
// lane centre for the shot and leaves the Skimmer where it is.
//
// ⛔ Position is (lane, depth) and nothing else. The Skimmer's depth is 1 — it
// rides the rim — and its screen position is derived at draw time through
// screenPos(). No x/y is ever stored on this object.
//
// ⛔ Every lane arithmetic goes through 03-wells.js: laneNormalize() to land a
// move, laneDelta() to ask which way to turn. Two lane floats are NEVER
// subtracted by hand in here. On a 16-lane closed well the distance from 15.7
// to 0 is +0.3, not -15.7, and the naive subtraction is exactly what sends
// snap assist the long way round the well.
//
// ⛔ GDD 3.5 — an open well is not a closed well with a clamp. Closed wells
// wrap at the seam; open wells CLAMP at two walls, and hitting one triggers a
// WALL_SQUASH_MS squash that is ⛔ VISUAL ONLY and never writes `lane`.
//
// ⛔ Entity contract (GDD 6.5): class, update, draw, dead. `dead` is set by
// killSkimmer() (09-collision.js) and by nothing else — that is the ONE death
// route, and CS003 P4 built the sequence hanging off it: a life spent, a
// C.HIT_STOP_DEATH freeze, and a respawn on the first live step afterwards
// (respawnSkimmer, 23-main.js). ⛔ A dead craft is NOT removed the way a shot
// or an enemy is: it stays in state.skimmer through the freeze, because the
// freeze exists so the player can see what killed them. update/draw take their
// well and input explicitly rather than reaching for the game object, the same
// shape 13-render-well.js uses; C is the only global this module reads.

// The silhouette, in LOCAL SPACE, per GDD 10.2 ("new entities define
// local-space point arrays and reuse drawPoly/glowStroke"). This is shape
// DATA, the same class of thing as WELLS' rim polygons — not a tuning surface.
// The scale IS a tunable and lives in C.SKIMMER_WIDTH.
//
//   l  lane offset in HALF-WIDTH units, so l = ±1 is ±SKIMMER_WIDTH/2 lanes
//      and the craft spans exactly SKIMMER_WIDTH lane widths at its prongs.
//   d  depth offset from the rim. ⛔ Never positive: depth is capped at 1 by
//      perspective(), so a point outside the rim would silently collapse onto
//      it and the shape would lose a vertex on every well.
//
// A swept arrowhead: two prongs sitting on the rim, a shallow notched trailing
// edge between them, and a nose reaching down the well. Deliberately not a
// claw — GDD 18, the silhouette is one of the things that has to be ours.
const SKIMMER_POLY = [
  { l: -1.00, d:  0.00 },   // left prong, on the rim
  { l: -0.42, d: -0.13 },   // left shoulder
  { l:  0.00, d: -0.04 },   // the notch, just inside the rim
  { l:  0.42, d: -0.13 },   // right shoulder
  { l:  1.00, d:  0.00 },   // right prong, on the rim
  { l:  0.00, d: -0.30 },   // the nose, deepest into the well
];

// Preallocated projection scratch — one screen point per silhouette vertex.
// ⛔ No per-frame allocation in the hot path (GDD 17, performance budget), and
// like screenPos() this makes skimmerPoints() NON-REENTRANT. It is a leaf
// call; do not give it a callback.
const _skimPts = SKIMMER_POLY.map(function () { return { x: 0, y: 0 }; });

// Project the silhouette into screen space for a given lane and squash.
//
//   squash  0..1, the VISUAL wall-squash amount. It compresses the craft
//           along the rim and stretches it down the well by the same factor —
//           it is applied HERE, at projection time, and never anywhere near
//           `lane`. GDD 3.5's "40 ms visual squash".
//
// Returns the shared scratch array. Copy out of it if you need to keep it.
function skimmerPoints(well, lane, squash) {
  const s = squash > 0 ? (squash > 1 ? 1 : squash) : 0;
  const half = C.SKIMMER_WIDTH / 2 * (1 - C.SKIMMER_SQUASH * s);
  const reach = 1 + C.SKIMMER_SQUASH * s;

  for (let i = 0; i < SKIMMER_POLY.length; i++) {
    const p = SKIMMER_POLY[i];
    // Depth 1 IS the rim (GDD 3.2) — a definition, not a tunable. Every
    // silhouette offset is measured inward from it.
    screenPos(well, lane + p.l * half, 1 + p.d * reach, _skimPts[i]);
  }
  return _skimPts;
}

// Is the craft drawn on this frame? ⛔ VISUAL ONLY, and read by draw code
// alone — the invulnerability itself is state.invulnTime against
// C.RESPAWN_INVULN (02-state.js), and nothing here decides whether the player
// can die. GDD 1.1 P2: the blink is how a player is told the window is still
// open, so it must stop the instant the window closes and not a cycle later.
//
// ⛔ Takes the TIMER, not `state`. The timer lives on the game object because
// it outlives the craft it protects, and this module reads no game global — a
// number crossing the boundary is what keeps that true (CLAUDE.md, kit-fx).
//
// A square wave at C.INVULN_BLINK_HZ full cycles per second, ON for the first
// half of each cycle, so the respawn step itself draws rather than starting on
// an invisible frame.
function skimmerBlinkVisible(invulnTime) {
  if (!(invulnTime < C.RESPAWN_INVULN)) return true;   // not invulnerable: solid
  return Math.floor(invulnTime * C.INVULN_BLINK_HZ * 2) % 2 === 0;
}

class Skimmer {
  // `lane` is the starting lane centre. enterWell() mints at 0 — a legal lane
  // on all sixteen wells — and a respawn mints at the lane the previous craft
  // died in (GDD 4.4). Both go through spawnSkimmer() (23-main.js); ⛔ nothing
  // else in the build calls this constructor, so a field added to a fresh
  // craft is added in exactly one place.
  constructor(well, lane) {
    this.lane = laneNormalize(well, lane || 0);

    // ⛔ Counts UP toward SNAP_IDLE_MS (GDD 16.3 — no countdown timers). Held
    // at the threshold once past it so a long idle cannot grow it without
    // bound. Any rotation input resets it to zero.
    this.idleTime = 0;

    // ⛔ Counts UP toward WALL_SQUASH_MS, and starts EXPIRED. Hitting a wall
    // resets it to zero, which is what starts the squash. Visual only.
    this.squashTime = C.WALL_SQUASH_MS / 1000;

    // True on a step where snap assist actually moved the craft. ⛔ It must be
    // false on every step where input.rotate !== 0 (GDD 4.1); that is the
    // invariant test-cs002-p2.js reads.
    this.snapping = false;

    this.dead = false;
  }

  // 0..1, peaking the instant a wall is hit and decaying to nothing over
  // WALL_SQUASH_MS. ⛔ Read by draw() only.
  squashAmount() {
    const dur = C.WALL_SQUASH_MS / 1000;
    if (!(dur > 0)) return 0;
    const a = 1 - this.squashTime / dur;
    return a > 0 ? a : 0;
  }

  // ⛔ `input.rotate` is a LANE DELTA for this step, not a velocity — the
  // input module has already scaled it by dt where that matters. Do not
  // multiply it by dt again here.
  update(dt, well, input) {
    // A well change (the debug cycler now, the Dive in CS004) can leave the
    // craft on a lane the new well does not have. Normalizing first means the
    // shape swap is never a special case anywhere else.
    this.lane = laneNormalize(well, this.lane);

    // ⛔ The squash AGES FIRST, before movement. dt is 16.7 ms against a 40 ms
    // squash, so advancing the clock after an impact would eat 42% of the
    // effect on the very step that triggered it and the peak would never be
    // seen. Aging first means the impact step renders at full squash.
    const squashFor = C.WALL_SQUASH_MS / 1000;
    if (this.squashTime < squashFor) this.squashTime += dt;

    const rotate = input.rotate;
    this.snapping = false;

    if (rotate !== 0) {
      // ⛔ Snap is never active while there is rotation input (GDD 4.1). The
      // idle clock restarts here, so it cannot fire on this step either.
      this.idleTime = 0;
      this.move(well, rotate);
    } else {
      const idleAt = C.SNAP_IDLE_MS / 1000;
      if (this.idleTime < idleAt) this.idleTime += dt;
      if (this.idleTime >= idleAt) this.snapping = this.snap(well, dt);
    }
  }

  // Apply a lane delta. Closed wells wrap; open wells clamp, and a clamp that
  // actually bit starts the squash.
  move(well, delta) {
    const raw = this.lane + delta;
    this.lane = laneNormalize(well, raw);
    // ⛔ Only an open well has walls. On a closed well laneNormalize changes
    // the number at every seam crossing and that is not an impact — treating
    // the seam as a wall is the mirror image of the GDD 3.5 bug.
    if (!well.closed && raw !== this.lane) this.squashTime = 0;
  }

  // Draw toward the nearest lane centre at SNAP_STRENGTH. Returns whether it
  // moved. GDD 4.1: this is what resolves "am I in that lane?".
  snap(well, dt) {
    // The integers ARE the lane centres (03-wells.js). laneNormalize turns
    // "16" on a 16-lane closed well back into lane 0; on an open well the
    // rounded value is already inside [0, lanes-1] because `lane` is.
    const target = laneNormalize(well, Math.round(this.lane));

    // ⛔ THE SEAM TRAP. laneDelta is the short way round; (target - this.lane)
    // is the long way round three times out of four near the seam.
    const d = laneDelta(well, this.lane, target);
    const dist = d < 0 ? -d : d;
    if (dist <= C.SNAP_EPSILON) return false;   // settled — stop, do not round

    // ⛔ The step is capped at the remaining distance. That is what keeps snap
    // from overshooting a lane centre into an oscillation, and — because
    // `target` is itself a legal lane — what keeps it from ever pulling the
    // craft past the clamp at either end of an open well. Landing exactly on
    // the centre is snap arriving, not the simulation quantizing `lane`.
    const step = C.SNAP_STRENGTH * dt;
    const moved = step >= dist ? d : (d < 0 ? -step : step);
    this.lane = laneNormalize(well, this.lane + moved);
    return true;
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2). No per-entity pipeline, no
  // sprite, no texture, nothing solid. The craft draws at full alpha even in
  // the dim band (GDD 3.7) — the band dims the WELL, and a player who cannot
  // see their own craft is the failure that rule is protecting against.
  draw(ctx, well) {
    drawPoly(ctx, skimmerPoints(well, this.lane, this.squashAmount()), true);
    glowStroke(ctx, C.SKIMMER_COLOR, C.LINE_W_RIM, 1);
  }
}

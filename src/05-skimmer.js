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
// ⛔ THE JUMP IS A PHASE ON state.jump AND NEVER A Skimmer DEPTH (GDD 14.2;
// CS012 P5, R3). updateJump() below is the whole rule, and it is a NO-OP
// outside a mode whose C.MODE_FLAGS carry `jump`. The lift and the drop-shadow
// are DRAW-TIME geometry — skimmerPoints() takes a lift and draw() strokes the
// unlifted outline underneath — so `lane`, `depth` and the collision pass are
// untouched by a jump. What airborne actually buys is one skip in
// collideSkimmer() and one refusal in updateShots().
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

// Project the silhouette into screen space for a given lane, squash and lift.
//
//   squash  0..1, the VISUAL wall-squash amount. It compresses the craft
//           along the rim and stretches it down the well by the same factor —
//           it is applied HERE, at projection time, and never anywhere near
//           `lane`. GDD 3.5's "40 ms visual squash".
//   lift    ⛔ OPTIONAL, and omitted it is 0, which is every caller that
//           predates CS012 P5. In rim radii OUT from the well's centroid
//           (GDD 14.2, O7): the airborne craft is pushed away from the centre
//           along each projected point's own outward direction.
//
// ⛔ THE LIFT IS APPLIED AFTER THE PROJECTION AND NOT AS A DEPTH. perspective()
// caps depth at 1, so a point "outside the rim" would silently collapse back
// onto it; and a depth above 1 is not a thing the depth model has (GDD 3.2).
// Leaving it here, in screen space, is also what keeps the lift draw-only —
// with C.JUMP_LIFT at 0 the build is bit-identical (test-cs012-p5.js).
//
// Returns the shared scratch array. Copy out of it if you need to keep it.
function skimmerPoints(well, lane, squash, lift) {
  const s = squash > 0 ? (squash > 1 ? 1 : squash) : 0;
  const half = C.SKIMMER_WIDTH / 2 * (1 - C.SKIMMER_SQUASH * s);
  const reach = 1 + C.SKIMMER_SQUASH * s;
  const rise = lift > 0 ? lift * C.WELL_RADIUS : 0;
  // The centroid in SCREEN space, on the same mapping screenPos() uses.
  const c = rise > 0 ? wellCentroid(well) : null;
  const ccx = c ? C.WELL_CX + c.x * C.WELL_RADIUS : 0;
  const ccy = c ? C.WELL_CY + c.y * C.WELL_RADIUS : 0;

  for (let i = 0; i < SKIMMER_POLY.length; i++) {
    const p = SKIMMER_POLY[i];
    // Depth 1 IS the rim (GDD 3.2) — a definition, not a tunable. Every
    // silhouette offset is measured inward from it.
    const out = screenPos(well, lane + p.l * half, 1 + p.d * reach, _skimPts[i]);
    if (rise > 0) {
      const dx = out.x - ccx, dy = out.y - ccy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0) { out.x += dx / d * rise; out.y += dy / d * rise; }
    }
  }
  return _skimPts;
}

// ---------------------------------------------------------------------------
// THE JUMP (GDD 14.2; O6, R2-R4) — Overdrive's, and a no-op everywhere else
// ---------------------------------------------------------------------------
//
// ⛔ ONE BAG, state.jump (02-state.js), and ⛔ EVERY TIMER COUNTS UP (GDD 16.3).
// The three phases and the one cooldown:
//
//   ground   `cool` counting up toward C.JUMP_COOLDOWN. Ready is
//            `cool >= C.JUMP_COOLDOWN`, and a ready craft takes off on the
//            RISING EDGE of input.jump.
//   air      C.JUMP_TIME long. ⛔ Immune to every contact killer
//            (09-collision.js skips its whole pass), cannot fire
//            (06-shots.js), rotates at full speed, and MAY Purge — the Purge
//            is a panic button and O6 leaves it alone.
//   recover  C.JUMP_RECOVERY long, on the rim, ⛔ CONTACT-LETHAL, and it can
//            neither fire nor jump. It is the cooldown's first beat, not a
//            fourth timer: `cool` is reset at LANDING and recovery ends when
//            it passes C.JUMP_RECOVERY.
//
// ⛔ THE NO-OP IS TOTAL. Outside a jump mode this function writes NOTHING —
// not `latched`, not `cool` — so a Classic session with the jump button held
// hashes step for step against one that never presses it (test-cs012-p5.js).
// That is why the mode test is the first line and not a branch inside.
//
// ⛔ `mode` IS READ OFF THE STATE THAT WAS PASSED IN. This module reads no game
// global but C, so modeHas() gets the mode explicitly rather than defaulting to
// the `state` global (00-config.js).
function updateJump(state, dt) {
  if (!modeHas("jump", state.mode)) return;
  const j = state.jump;

  // ⛔ THE EDGE IS DETECTED HERE, exactly as updatePurge() detects the Purge's
  // (09-collision.js): the input struct carries LEVELS on every device (GDD
  // 9.5), and `latched` is written as `held` EVERY step rather than only
  // cleared on release — which is what lets killSkimmer()'s forced `true`
  // behave correctly on the way out of a death freeze.
  const held = !!state.input.jump;
  const rising = held && !j.latched;
  j.latched = held;

  if (j.cool < C.JUMP_COOLDOWN) j.cool += dt;

  if (j.phase === "air") {
    j.t += dt;
    if (j.t >= C.JUMP_TIME) {
      // ⛔ LANDING STARTS THE COOLDOWN (O6), so the longest cycle is
      // C.JUMP_TIME + C.JUMP_COOLDOWN and the airborne share is fixed.
      j.phase = "recover";
      j.t = 0;
      j.cool = 0;
    }
    return;
  }

  if (j.phase === "recover") {
    j.t += dt;
    if (j.t >= C.JUMP_RECOVERY) { j.phase = "ground"; j.t = 0; }
    return;
  }

  // Grounded. ⛔ The rising edge AND a spent cooldown; a held button never
  // re-jumps, because `latched` was already true on the step that took off.
  if (rising && j.cool >= C.JUMP_COOLDOWN) { j.phase = "air"; j.t = 0; }
}

// ⛔ READY, GROUNDED, AND `latched` UNTOUCHED — the Purge charge's rule, for
// the Purge charge's reason (09-collision.js, enterWell()). Called by
// enterWell(), by the respawn, and by startDive() so a jump in flight when the
// well clears LANDS on the clear step (R4) and the Dive is never airborne.
function resetJump(state) {
  const j = state.jump;
  j.phase = "ground";
  j.t = 0;
  j.cool = C.JUMP_COOLDOWN;
}

// Is the craft off the rim this step? ⛔ The one predicate the collision pass,
// the shot pass and the audio frame all read, so "airborne" has one definition.
function jumpAirborne(state) { return state.jump.phase === "air"; }

// May the craft fire? ⛔ No while airborne AND no while recovering (O6): the
// rim sweep needs fire, so it cannot save a landing on a parked rim enemy.
function jumpCanFire(state) { return state.jump.phase === "ground"; }

// 0..C.JUMP_LIFT, a parabola over C.JUMP_TIME: nothing at takeoff, the apex at
// half time, nothing at landing. ⛔ DRAW-TIME ONLY, and it takes the BAG rather
// than `state` — a value crossing the boundary, like skimmerBlinkVisible()'s
// timer. Recovering and grounded read 0: the craft is on the rim.
function jumpLift(jump) {
  if (!jump || jump.phase !== "air" || !(C.JUMP_TIME > 0)) return 0;
  const u = jump.t / C.JUMP_TIME;
  const k = u < 0 ? 0 : (u > 1 ? 1 : u);
  return C.JUMP_LIFT * 4 * k * (1 - k);
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
  //
  // ⛔ `lift` IS OPTIONAL AND IS TWO OF GDD 14.2's THREE AIRBORNE CHANNELS
  // (O7). Above 0 the craft is drawn raised off the rim line, and its own
  // outline is stroked FLAT ON THE RIM underneath at C.JUMP_SHADOW_ALPHA —
  // the drop-shadow, and ⛔ a stroke, never a fill. The shadow goes down first
  // so the craft reads over it. Game.draw() is where the value comes from
  // (jumpLift(state.jump)); nothing here reads `state`.
  //
  // ⛔ skimmerPoints() returns the ONE shared scratch array, so the shadow's
  // path must be built and stroked before the lifted points overwrite it —
  // which is exactly what drawPoly + glowStroke do, in that order.
  draw(ctx, well, lift) {
    const squash = this.squashAmount();
    if (lift > 0) {
      drawPoly(ctx, skimmerPoints(well, this.lane, squash), true);
      glowStroke(ctx, C.SKIMMER_COLOR, C.LINE_W_RIM, C.JUMP_SHADOW_ALPHA);
    }
    drawPoly(ctx, skimmerPoints(well, this.lane, squash, lift), true);
    glowStroke(ctx, C.SKIMMER_COLOR, C.LINE_W_RIM, 1);
  }
}

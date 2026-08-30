// 07-enemies.js — THE ENTITY CONTRACT, and the first enemy that implements it
// (GDD 6.1, 6.3, 6.5, 3.5, 4.5).
//
// ⛔ Position is (lane, depth) and nothing else (GDD 3.2). No enemy stores a
// screen coordinate; projection happens at draw time, in 14-render-entities.js.
//
// ⛔ Lifecycle (GDD 6.5): class, constructor / update(dt, well, state) /
// draw(ctx, well) / dead. Kill by setting `dead = true`; removal is an
// end-of-frame .filter() in the caller. Never spliced mid-loop.
//
// ⛔ ONE ARRAY, state.enemies (CS003 P2). Thorns, Carriers and Drifters all
// live in it; the contract FLAGS below decide behaviour, not a second array. A
// second array doubles all six wiring points CLAUDE.md lists.

// ---------------------------------------------------------------------------
// The base. ⛔ FIELDS AND SIGNATURES ONLY — no movement, no AI, no draw code.
// ---------------------------------------------------------------------------
//
// It exists for one reason: so the ninth enemy cannot silently forget a field.
// The value is the field list, not the inheritance.
//
// ⛔ THIS IS A SLOPE. The first time a climb rate or a hop timer lands in here,
// five enemies that do not climb inherit one, and the bug is invisible because
// they never read it — until one of them is given a reason to. If this class
// ever acquires behaviour, that is the signal to flatten it back to independent
// classes, not to add a second field to switch the behaviour off.
class Enemy {
  constructor(lane, depth) {
    // ⛔ (lane, depth), GDD 3.2. `lane` is in lane-CENTRE units — the integers
    // are the lane centres — and `depth` is 0 at the throat, 1 at the rim.
    this.lane = lane || 0;
    this.depth = depth || 0;

    // Set true to kill. The caller's end-of-frame filter does the removal.
    this.dead = false;

    // ⛔ Whether the Purge destroys this (GDD 4.3: "does not remove Thorns").
    // CS004's Thorn is the first `false` in the roster. The Purge reads this
    // flag and never a class name — that is what keeps its two uses one rule
    // instead of a growing list of exceptions.
    this.purgeable = true;

    // Whether this must be gone before the well counts as clear. The Thorn is
    // `false`, and that is exactly WHY a Thorn is still standing in the lane
    // during the Dive (GDD 5) — it is not an oversight in the clear check.
    this.blocksClear = true;

    // ⛔ GDD 4.5's contact rule, as a number. Contact kills the Skimmer when
    // `depth >= killDepth` and the lanes match. `null` means contact NEVER
    // kills — the Weaver is null (its projectile kills, not its body); the
    // Drifter will be 0 (lethal at any depth, GDD 4.5 item 2); the Vaulter
    // sets the rim band below. A number covers three of the five death
    // conditions and null covers the other two, which is why this is a field
    // and not a per-enemy method.
    this.killDepth = null;
  }

  // Movement and AI. dt is C.FIXED_DT; `well` is the current well (topology
  // included — GDD 3.5); `state` is the one game object, read for the level
  // clock and the Skimmer. Overridden by every subclass.
  update(dt, well, state) {}

  // ⛔ drawPoly + glowStroke only (GDD 10.2). Overridden by every subclass.
  draw(ctx, well) {}

  // A shot has hit this entity. The ENEMY decides what a hit does — the
  // collision pass (CS003 P3) only asks. Returns whether the shot is CONSUMED:
  // true retires the shot, false lets it fly on to whatever is behind. The
  // Vaulter dies and consumes; CS004's Thorn chips and consumes (GDD 4.2's
  // chip-away is emergent from that, not a special case in the collision pass);
  // an armoured entity returns false.
  //
  // The base returns false deliberately: a subclass that forgets to override it
  // lets shots through, which is visible, rather than eating them silently.
  onShot(shot) { return false; }
}

// ---------------------------------------------------------------------------
// The Vaulter (GDD 6.1, 6.3) — flattened X, first at L1, 150 points.
// Climbs; vaults lanes from L2; hunts at the rim. Killed by any shot or the
// Purge; kills by contact at the rim.
// ---------------------------------------------------------------------------
//
// ⛔ EVERY LANE HOP GOES THROUGH laneHop() (03-wells.js), AND THE dir IT
// RETURNS IS WRITTEN BACK. Read that helper's header before touching startHop.
// An enemy that keeps its own heading and asks the helper only for a POSITION
// holds a stale direction after a wall bounce and grinds against an open well's
// end forever, one hop out and one hop back — GDD 3.5's named bug and §17's
// third required test. The wall and the hopper's heading are ONE piece of
// state.
//
// ⛔ Nothing here reads well.closed. The topology lives entirely inside
// laneHop/laneDelta/laneNormalize, which is the only reason a Vaulter behaves
// on a Ring and on a Fan without a branch.
class Vaulter extends Enemy {
  // `dir` is the initial heading, +1 or -1, and is the spawner's to choose
  // (CS003 P2 draws it from the run's one stream). Anything non-negative,
  // undefined included, means +1.
  constructor(lane, depth, dir) {
    super(lane, depth);

    // GDD 4.5 item 1: an enemy reaching the rim in your lane kills on contact.
    // ⛔ Expressed as `1 - C.RIM_CONTACT_DEPTH`, not a second constant — the
    // band is measured DOWN from the rim, so retuning the band moves this and
    // every other rim-contact enemy together.
    this.killDepth = 1 - C.RIM_CONTACT_DEPTH;

    // ⛔ The heading, kept in step with laneHop's returned dir and never
    // inferred from a lane comparison afterwards.
    this.dir = dir < 0 ? -1 : 1;

    // ⛔ Counts UP toward the current hop interval and HOLDS there (GDD 16.3 —
    // no countdown timers anywhere in the build). Holding rather than growing
    // is what makes a rim Vaulter that has no legal hop this instant — the
    // player is already in its lane — take one the moment that changes,
    // instead of waiting out a fresh interval.
    this.hopTimer = 0;

    // The hop in flight. `hopping` is the gate; the other three describe the
    // crossing. ⛔ `lane` is CONTINUOUS through a hop (GDD 6.1: the craft is
    // hittable in both lanes it is near), so these exist to interpolate it
    // rather than to teleport at the end.
    this.hopping = false;
    this.hopTime = 0;    // counts up toward C.VAULT_HOP_TIME
    this.hopFrom = this.lane;
    this.hopDelta = 0;   // signed lane distance of this hop, already short-way
  }

  atRim() {
    return this.depth >= 1;
  }

  update(dt, well, state) {
    const wasAtRim = this.atRim();

    // ⛔ Monotonic, and it STOPS at the rim rather than passing it. Depth > 1
    // is not a legal position: perspective() clamps it, so an unclamped climb
    // would leave the craft drawn on the rim while its depth ran away and
    // every depth comparison downstream (killDepth, the readability zone, the
    // respawn push) read a number no other system could produce.
    if (this.depth < 1) {
      this.depth += C.VAULT_CLIMB * dt;
      if (this.depth > 1) this.depth = 1;
    }
    const atRim = this.atRim();

    // Arriving at the rim restarts the cadence, so the first hunt hop lands a
    // full C.VAULT_RIM_INTERVAL after arrival. Without this, whatever phase the
    // climb's 2.2 s timer happened to be in decides whether the Vaulter lunges
    // the instant it surfaces — an arrival that is sometimes fair and sometimes
    // not, for a reason the player cannot see (GDD 1.1 P2).
    if (atRim && !wasAtRim) this.hopTimer = 0;

    const interval = atRim ? C.VAULT_RIM_INTERVAL : C.VAULT_INTERVAL;
    // Advances DURING a hop too, so the period between hop STARTS is the
    // interval itself rather than interval + crossing time.
    if (this.hopTimer < interval) this.hopTimer += dt;

    if (this.hopping) {
      this.advanceHop(dt, well);
      return;
    }
    if (this.hopTimer < interval) return;

    // ⛔ THE LEVEL GATE IS ON VAULTING ONLY (GDD 6.3): level 1 Vaulters climb
    // straight up, which is how the player learns what a lane is. Rim hunting
    // is NOT gated — GDD 6.1 attaches "from L2" to vaulting, and GDD 12
    // promises a passive player dies on level 1, which a Vaulter parked
    // politely at the rim cannot deliver.
    let dir = 0;
    if (atRim) dir = this.huntDir(well, state);
    else if (state.level >= C.VAULT_FIRST_LEVEL) dir = this.dir;

    if (dir !== 0) {
      this.hopTimer = 0;
      this.startHop(well, dir);
    }
  }

  // Which way the Skimmer is, as -1 / 0 / +1. ⛔ laneDelta, never (a - b): on a
  // 16-lane Ring the way from lane 15 to lane 0 is +1, and the bare subtraction
  // sends the Vaulter fifteen lanes the wrong way round.
  //
  // 0 means "no hop this beat" — no Skimmer yet (23-main.js mints it lazily),
  // a dead one, or the Vaulter is already in the player's lane and has nowhere
  // better to be.
  huntDir(well, state) {
    const target = state.skimmer;
    if (!target || target.dead) return 0;
    const d = laneDelta(well, this.lane, target.lane);
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
  }

  // ⛔ THE ONE PLACE A HOP IS RESOLVED. laneHop() answers both halves of the
  // question — where the hop lands, and which way the hopper is travelling
  // afterwards — and BOTH are written back here. On a closed well it wraps and
  // dir is unchanged; on an open well it mirror-folds at the wall and dir
  // flips, so a Vaulter that hops into an end lane turns around and comes back
  // instead of parking on it (GDD 3.5).
  startHop(well, dir) {
    const h = laneHop(well, this.lane, dir, dir);
    this.dir = h.dir;

    this.hopFrom = this.lane;
    // The crossing is interpolated along the SHORT way to the landing lane, so
    // a hop across a closed well's seam (15 -> 0) travels one lane forward and
    // not fifteen backwards. On an open well laneDelta is the plain difference,
    // and both endpoints are inside [0, lanes-1], so every point between them
    // is too — which is what keeps the soak's lane-range invariant true DURING
    // a hop and not merely at its ends. (A hop that begins exactly ON an open
    // well's fold point — a half-lane, which no spawner produces — lands where
    // it started and the Vaulter holds its lane for that beat. Harmless, and
    // the alternative is re-folding every interpolated step.)
    this.hopDelta = laneDelta(well, this.lane, h.lane);
    this.hopTime = 0;
    this.hopping = true;
  }

  // Carry the crossing forward. ⛔ `lane` moves continuously — the Vaulter is
  // hittable in both lanes it is near for the whole C.VAULT_HOP_TIME, which is
  // the window GDD 6.1's "vaults lanes" is really describing.
  advanceHop(dt, well) {
    const dur = C.VAULT_HOP_TIME;
    this.hopTime += dt;

    if (!(dur > 0) || this.hopTime >= dur) {
      // Landing is exact, never the last interpolated step: an accumulated
      // float error would leave the Vaulter a hair off a lane centre, and the
      // next hop would inherit the drift.
      this.lane = laneNormalize(well, this.hopFrom + this.hopDelta);
      this.hopTime = dur;
      this.hopping = false;
      return;
    }
    // laneNormalize keeps the in-flight lane legal on BOTH topologies, and it
    // is also what makes a well change mid-hop (enterWell, CS003 P2) land the
    // craft somewhere the new well actually has, rather than off the end of a
    // shorter one.
    this.lane = laneNormalize(well, this.hopFrom + this.hopDelta * (this.hopTime / dur));
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2); the silhouette and the projection
  // live in 14-render-entities.js, where the eight later enemies reuse them.
  draw(ctx, well) {
    drawVaulter(ctx, well, this.lane, this.depth);
  }

  // Any shot kills it (GDD 6.1), and the shot is spent — one shot, one Vaulter.
  onShot(shot) {
    this.dead = true;
    return true;
  }
}

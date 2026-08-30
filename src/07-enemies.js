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

    // ⛔ WHAT `depth` MEANS ON THIS ENTITY — not whether it moves.
    //
    //   false  `depth` is a POSITION: where the entity is in its lane.
    //   true   `depth` is a LENGTH: the tip of an extent rooted at the throat.
    //
    // A stationary enemy whose `depth` is still a position is `false` — the
    // flag is about the QUANTITY, not the motion. Anything that ever reads
    // `depth` as a length sets it true. CS004's Thorn is the roster's only
    // one: its `depth` is the tip of the segment it has grown, which is also
    // what lets the collision pass hit-test it with the same one line it uses
    // on everything else.
    //
    // ⛔ THE ONE READER IS respawnSkimmer() (23-main.js). GDD 4.4's rim push
    // clamps depth down to C.RESPAWN_PUSH_DEPTH, which is right for a position
    // and silently wrong for a length: it would shorten every Thorn past 0.55
    // on every player death — a free chip nobody earned, in the one place
    // nobody would look. ⚠ This does NOT narrow that clamp's band (SETTLED,
    // GDD 4.4); it says which entities the clamp is meaningful for.
    this.anchored = false;
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

// ---------------------------------------------------------------------------
// ⛔ THE CARGO TABLE (GDD 6.2) — a cargo name -> what a Carrier of it splits
// into.
// ---------------------------------------------------------------------------
//
// ⛔ TWO NAMESPACES THAT HAPPEN TO COINCIDE, WHICH IS WHY THIS LOOKS LIKE AN
// IDENTITY MAP AND IS NOT. The KEY is a cargo name: what the Carrier is
// carrying, what its glyph draws (CARGO_GLYPHS, 14-render-entities.js), and
// what GDD 6.2's variant table calls the row. The VALUE's `kind` is an
// ENEMY_KINDS key (08-spawner.js): what actually gets spawned. They read the
// same for every row GDD 6.2 lists, and they are not the same thing — the
// spawner's table is where a string becomes a class, and this one is where a
// cargo becomes a string.
//
// ⛔ THE SPLIT IS TABLE-DRIVEN AND STAYS THAT WAY. There is no branch on cargo
// anywhere — not in onShot, not in splitLanes, not in the draw path. GDD 6.2
// has three rows and only this one is buildable: the Drifter (L18) and the
// Surger (L23) cannot be cargo before they are enemies, and they are CS005's.
// Adding a row is: an entry here, an ENEMY_KINDS row for the carrier variant,
// and a glyph in CARGO_GLYPHS — the same three-file shape every enemy already
// has (behaviour, spawn string, silhouette). Nothing else.
//
// ⛔ GDD 6.2's "adjacent" (Vaulter cargo) and "flanking" (Surger cargo) are THE
// SAME GEOMETRY. The distinction that section draws is between the correct
// RESPONSES — move away versus hold still — which comes from what the cargo
// does after it lands, not from where it lands. splitLanes() serves all three
// rows; a second placement rule invented to justify the second word would be a
// difference the player cannot see.
const CARGO = {
  vaulter: { kind: "vaulter" },
};

// ---------------------------------------------------------------------------
// The Carrier (GDD 6.1, 6.2) — hollow diamond plus a cargo glyph, first at L3,
// 100 points. Slow, ONE LANE, never hops. Kills by contact at the rim; any
// shot kills it and it SPLITS into two of its cargo.
// ---------------------------------------------------------------------------
//
// ⛔ IT DOES NOT TOUCH laneHop, laneDelta OR laneNormalize, AND THAT IS THE
// POINT. `lane` is written exactly once, by the constructor, and is the lane it
// was spawned into for its whole life — GDD 6.1's "one lane, never hops" is an
// absence of code, not a flag, and CS004 P5's soak asserts the strong form
// (exact lane equality every tick) rather than a range or a speed bound.
class Carrier extends Enemy {
  // `cargo` is a CARGO key, handed in by the ENEMY_KINDS factory — the kind
  // string carries the variant, so the class does not need a branch.
  constructor(lane, depth, cargo) {
    super(lane, depth);

    // GDD 4.5 item 1, the same expression the Vaulter uses. ⛔ Not a second
    // constant: the band is measured DOWN from the rim, so retuning
    // C.RIM_CONTACT_DEPTH moves every rim-contact enemy together.
    this.killDepth = 1 - C.RIM_CONTACT_DEPTH;

    this.cargo = cargo;
  }

  // ⛔ Monotonic, and it STOPS at the rim rather than passing it — the same
  // rule the Vaulter's climb carries and for the same reason: depth > 1 is not
  // a legal position, and every downstream comparison (killDepth, the
  // readability zone, the respawn push) would be reading a number no other
  // system can produce.
  //
  // `well` and `state` are unused: a Carrier has no topology and no AI. The
  // signature is the contract's (GDD 6.5), not this enemy's.
  update(dt, well, state) {
    if (this.depth < 1) {
      this.depth += C.CARRIER_CLIMB * dt;
      if (this.depth > 1) this.depth = 1;
    }
  }

  draw(ctx, well) {
    drawCarrier(ctx, well, this.lane, this.depth, this.cargo);
  }

  // Any shot kills it and the shot is spent (GDD 6.1) — and then it splits.
  //
  // ⛔ BOTH CHILDREN GO THROUGH spawnEnemy(), THE ONE ENTRY POINT (GDD 6.5).
  // Four consequences, every one of them deliberate:
  //
  //   1. GDD 6.3's safe-spawn rule applies. A child landing in the Skimmer's
  //      lane above C.SAFE_SPAWN_DEPTH is LOWERED to that line, never moved
  //      sideways — which is exactly why CS003 P2 wrote that rule as a depth
  //      clamp: relocating a child would break the shape GDD 6.2 is teaching
  //      the player to read, and dropping one deeper only ever gives them more
  //      time.
  //   2. C.ENEMY_CAP applies. A Carrier killed on a full board loses its
  //      children, and that is correct: the cap is a READABILITY ceiling, not a
  //      difficulty knob, and "it is only a split" is precisely the bypass the
  //      single entry point exists to prevent.
  //   3. ⛔ Each call spends ONE RNG DRAW for the heading (08-spawner.js), so a
  //      split spends TWO and shifts every later draw in the run. The run has
  //      one stream and this is deterministic — a replay of the seed splits at
  //      the same moment and draws the same numbers afterwards. Do not "save" a
  //      draw here for a kind that ignores `dir`; that would make the stream
  //      depend on which cargo was in the well.
  //   4. ⚠ SETTLED — THIS PUSHES INTO state.enemies WHILE collideShots() IS
  //      ITERATING IT (09-collision.js). That is safe, and it is safe for three
  //      separate decisions in two files rather than by luck:
  //        - the collision loop is INDEX-BASED and re-reads `.length`, so the
  //          appended children are simply part of the array;
  //        - the `break` after onShot is UNCONDITIONAL, so this shot resolves
  //          against at most one enemy per step and cannot walk forward into
  //          the children it just created;
  //        - removal is still the end-of-frame `.filter()` in Game.update() —
  //          nothing is spliced mid-loop (GDD 6.5).
  //      ⛔ Do not "fix" this into a deferred spawn queue, and do not make that
  //      `break` conditional. Either change turns a correct three-part
  //      arrangement into a bug that only shows up on a busy board.
  //
  // The current well is read the same way spawnEnemy() itself reads it. An
  // enemy has no well reference — `well` is handed to update() and draw() and
  // deliberately not to onShot(), because what a hit DOES is not a question
  // about geometry (GDD 6.5).
  onShot(shot) {
    this.dead = true;

    const row = CARGO[this.cargo];
    if (!row) return true;   // unknown cargo carries nothing, exactly as an
                             // unknown kind spawns nothing. Never a throw.

    const well = WELLS[state.wellIndex];
    const lanes = splitLanes(well, this.lane);
    spawnEnemy(row.kind, lanes[0], this.depth);
    spawnEnemy(row.kind, lanes[1], this.depth);
    return true;
  }
}

// ---------------------------------------------------------------------------
// The Weaver (GDD 6.1, 4.5) — open spiral, first at L5, 50 points. Climbs
// partway laying a Thorn, retreats; fires down-lane. ONE LANE, never hops.
// Killed by any shot or the Purge; ⛔ ITS BODY NEVER KILLS.
// ---------------------------------------------------------------------------
//
// ⛔ killDepth = null, AND IT IS THE FIELD'S FIRST null IN THE ROSTER. GDD 4.5
// item 4 is "a Weaver's PROJECTILE", not a Weaver, so contact is harmless at
// every depth INCLUDING the rim — a Weaver sitting on top of the Skimmer is a
// nuisance and not a death. That is what the base class's null case was written
// for (GDD 6.5), and it is why the collision pass needs no branch for this
// enemy: it already skips a null killDepth.
//
// ⛔ blocksClear STAYS true. A Weaver you never shoot is an enemy you never
// answered — a well that cleared around one would let a player wait out the
// only Classic enemy that cannot hurt them directly, which is the opposite of
// the pressure GDD 2's loop is built on.
//
// ⛔ IT TOUCHES NO LANE HELPER, the same absence of code the Carrier's "never
// hops" is (GDD 6.1). `lane` is written once, by the constructor.
//
// THE CYCLE, and it should be nameable by a player watching it — it comes up,
// it leaves a thorn, it spits, it goes back down:
//
//   climb     depth rises at C.WEAVER_CLIMB toward C.WEAVER_APEX
//   hold      C.WEAVER_APEX_HOLD seconds at the apex; ⛔ EXACTLY ONE bolt
//   retreat   depth falls at C.WEAVER_RETREAT, which is FASTER, back to 0
//   climb     …
//
// ⛔ THE PHASE IS THE STATE, AND THE TIMER COUNTS UP (GDD 16.3 — there are no
// countdown clocks anywhere in this build). `fired` is a per-cycle latch and
// not a cooldown: a cooldown would fire again on a long hold and "one bolt per
// cycle" would quietly become "one bolt per C.WEAVER_APEX_HOLD".
class Weaver extends Enemy {
  // `dir` is ignored — a Weaver never hops. The spawner still spends its draw
  // on one (08-spawner.js), which is what keeps the run's ONE stream aligned
  // regardless of which kind came out of the throat.
  constructor(lane, depth) {
    super(lane, depth);

    // ⛔ Explicit, not inherited-and-forgotten. The base already defaults to
    // null, and writing it here is what makes the ONE enemy that means it
    // visibly mean it rather than looking like an override somebody missed.
    this.killDepth = null;

    // "climb" | "hold" | "retreat". ⛔ The phase is the whole state machine —
    // there is no second flag saying which way depth is moving, because two
    // fields that must agree are a bug waiting for a phase to be added.
    this.phase = "climb";
    this.holdTimer = 0;   // counts UP toward C.WEAVER_APEX_HOLD
    this.fired = false;   // ⛔ per-CYCLE latch, cleared on entering the hold
  }

  // ⛔ P4'S HOOK, AND IT IS DELIBERATELY EMPTY. GDD 6.1's "climbs partway
  // LAYING A THORN" is the other half of this enemy and CS004 P4 owns it: the
  // Thorn class, the chip economy, and this Weaver's lay-and-adopt (a live
  // Thorn in its lane is adopted rather than joined by a second one — two
  // overlapping Thorns are two hit-point pools behind one silhouette). ⛔ Do
  // not write a Thorn here because the cycle mentions one.
  layThorn(well, state) {}

  update(dt, well, state) {
    if (this.phase === "climb") {
      // ⛔ Monotonic on the way up and it STOPS at the apex. The guard is
      // `depth < APEX` rather than an unconditional clamp so a Weaver that
      // ARRIVED above the apex — the debug row stages one as deep as
      // C.SAFE_SPAWN_DEPTH, and CS006's heat curve will move the apex under
      // live entities — turns around from where it is instead of teleporting
      // down to the line. Depth never rises above where it started in that
      // case, so [0, 1] holds either way.
      if (this.depth < C.WEAVER_APEX) {
        this.depth += C.WEAVER_CLIMB * dt;
        if (this.depth > C.WEAVER_APEX) this.depth = C.WEAVER_APEX;
      }

      this.layThorn(well, state);

      if (this.depth >= C.WEAVER_APEX) {
        this.phase = "hold";
        this.holdTimer = 0;
        this.fired = false;
      }
      return;
    }

    if (this.phase === "hold") {
      // ⛔ THE FIRST STEP OF THE HOLD, ONCE. Firing on arrival rather than on
      // departure is what gives the player the whole hold to read a bolt that
      // is already travelling while its parent is still visibly at the apex —
      // GDD 1.1 P2, legible before lethal. The latch is what makes it one bolt
      // and not one per step of the hold.
      if (!this.fired) {
        this.fired = true;
        this.fire();
      }
      this.holdTimer += dt;
      if (this.holdTimer >= C.WEAVER_APEX_HOLD) this.phase = "retreat";
      return;
    }

    // retreat — faster than the climb, and it stops at the throat rather than
    // passing it. Depth < 0 is no more legal than depth > 1.
    this.depth -= C.WEAVER_RETREAT * dt;
    if (this.depth <= 0) {
      this.depth = 0;
      this.phase = "climb";
    }
  }

  // ⛔ THROUGH spawnEnemy(), THE ONE ENTRY POINT (GDD 6.5) — the second
  // non-spawner caller in the build, after the Carrier's split, and it inherits
  // the same three things for free:
  //
  //   1. C.ENEMY_CAP. A bolt refused on a full board is simply not fired, and
  //      the cycle moves on — the latch is set either way, so a blocked shot
  //      is a lost beat and never a bolt held over into the next cycle.
  //   2. ⛔ GDD 6.3's safe-spawn rule, which is reachable here: a Weaver
  //      staged above C.SAFE_SPAWN_DEPTH in the Skimmer's lane fires a bolt
  //      that is LOWERED to that line rather than starting on top of the
  //      craft. Lowering only ever gives the player more time.
  //   3. One RNG draw from the run's ONE stream, spent on a `dir` a bolt has
  //      no use for. ⛔ Deliberate: a kind that skipped the draw would make the
  //      stream depend on what was in the well, and GDD 17.1's replay
  //      guarantee is exactly that dependency not existing.
  //
  // The current well is read the way spawnEnemy() itself reads it; `well` is
  // handed to update() and this is called from inside it.
  fire() {
    spawnEnemy("weaverBolt", this.lane, this.depth);
  }

  draw(ctx, well) {
    drawWeaver(ctx, well, this.lane, this.depth);
  }

  // Any shot kills it and the shot is spent (GDD 6.1) — 50 points, when CS007
  // builds addScore(). It leaves no bolt behind: what is already in the air
  // stays in the air, and nothing new is fired.
  onShot(shot) {
    this.dead = true;
    return true;
  }
}

// ---------------------------------------------------------------------------
// The Weaver's bolt (GDD 4.5 item 4) — the projectile, and GDD 4.5's FOURTH
// DEATH CONDITION, live, with no new collision code.
// ---------------------------------------------------------------------------
//
// ⛔ IT IS CALLED WeaverBolt AND NOT Shot. `Shot` (06-shots.js) is the PLAYER'S
// and travels the other way — rim to throat, on a clock, killed by the throat.
// Confusing the two inside the collision pass is precisely the mistake that is
// invisible in review: both are lane-locked, both have a `depth`, and the two
// arrays they live in are tested against each other every step.
//
// ⛔ IT IS AN ENEMY, IN state.enemies, LIKE EVERYTHING ELSE (GDD 6.5's one
// array). The flags below are what make it behave like a projectile; a second
// array for "hostile projectiles" would double all six wiring points to save
// three field writes.
//
//   killDepth    the rim band — ⛔ `1 - C.RIM_CONTACT_DEPTH`, the same
//                expression the Vaulter and the Carrier use, so retuning the
//                band moves every rim-contact entity together.
//   blocksClear  ⛔ false. A bolt in flight must not hold a cleared well open:
//                the Weaver that fired it is already dead in that scenario, and
//                a well that waited for its last projectile would end on a
//                pause the player cannot shorten (they cannot shoot it).
//   purgeable    true. The panic button saves you from it, which is what a
//                panic button is for (GDD 4.3).
//   anchored     false, inherited. Its depth is a POSITION.
class WeaverBolt extends Enemy {
  constructor(lane, depth) {
    super(lane, depth);
    this.killDepth = 1 - C.RIM_CONTACT_DEPTH;
    this.blocksClear = false;
  }

  // ⛔ IT DIES AT depth 1 WHETHER OR NOT IT HIT ANYTHING, so bolts cannot
  // accumulate: a Weaver left alone fires one per cycle forever, and without
  // this the board fills with spent ordnance and C.ENEMY_CAP starves the
  // spawner.
  //
  // ⛔ THE DEATH IS THE STEP AFTER THE ARRIVAL, NOT THE ARRIVAL ITSELF, and the
  // ordering is why: Game.update() runs the entity pass, then the collision
  // pass, and collideSkimmer() skips anything already `dead`. Killing on the
  // step depth reaches 1 would make the rim step non-lethal. The bolt is lethal
  // from `killDepth` (0.95) upward — about nine steps at C.WEAVER_BOLT_SPEED —
  // so this is belt and braces rather than the only guard, and it is written
  // this way so the belt does not depend on the braces.
  //
  // `well` and `state` are unused: a bolt has no topology and no AI. The
  // signature is the contract's (GDD 6.5), not this entity's.
  update(dt, well, state) {
    if (this.depth >= 1) {
      this.dead = true;
      return;
    }
    this.depth += C.WEAVER_BOLT_SPEED * dt;
    if (this.depth > 1) this.depth = 1;
  }

  draw(ctx, well) {
    drawWeaverBolt(ctx, well, this.lane, this.depth);
  }

  // ⚠ SETTLED — THE BOLT IS NOT SHOOTABLE. Returning false means the shot is
  // NOT consumed and flies on to whatever is behind (GDD 6.5). Two reasons,
  // and the second is the one that matters: a shootable bolt is a free score
  // piñata, and it removes the lesson, which is that a Weaver's OUTPUT is
  // dodged rather than answered. Rotating out of the lane is the answer; there
  // is no second one.
  //
  // ⚠ A DECLINED SHOT STILL COSTS ITS RESOLUTION FOR THE FEW STEPS OF OVERLAP,
  // because collideShots()'s `break` is UNCONDITIONAL (09-collision.js) — one
  // shot resolves against at most one enemy per step, consumed or not. So a
  // bolt briefly shields whatever is behind it. That is the same mechanism
  // CS005's armoured Drifter depends on, it is ~3 steps against eight shots in
  // flight and a 0.055 s cooldown, and it is NOT a bug. Do not make that break
  // conditional to "fix" it.
  onShot(shot) {
    return false;
  }
}

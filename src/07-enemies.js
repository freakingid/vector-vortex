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
    // Vaulter, the Carrier, the bolt, the Drifter and the Surger all set the
    // rim band, `1 - C.RIM_CONTACT_DEPTH`. A number covers four of the five
    // death conditions and null covers the other one, which is why this is a
    // field and not a per-enemy method.
    //
    // ⛔ NO ENEMY'S RESTING VALUE IS ZERO, AND THIS COMMENT USED TO PREDICT THAT
    // THE DRIFTER'S WOULD BE (CS005 P2 corrected it, with collideSkimmer()'s
    // header in 09-collision.js). There is no term here for where the SKIMMER
    // is, because the Skimmer is always at depth 1 — so `killDepth = 0` does
    // not mean "kills on contact at any depth", it means every legal depth is
    // a kill zone, and an enemy spawned at the throat in the player's lane
    // kills them on the spawn step having travelled nowhere. See the Drifter's
    // constructor at the foot of this file for the whole reading of GDD 4.5
    // item 2. ⚠ Zero becomes honest AS A RESTING VALUE the moment the craft can
    // leave the rim (GDD 5's Dive, GDD 14.2's Jump) and this pass has two depths
    // to compare; it is then a one-line change and not this changeset's.
    //
    // ⛔ ONE ENTITY MUTATES THIS FIELD, AND THAT IS THE OTHER HALF OF THE RULE.
    // CS005 P3's Surger holds the rim band while it climbs and through its whole
    // telegraph, drops to 0 for C.SURGE_DISCHARGE, and restores the band on the
    // way out — which is how GDD 4.5 item 3 ("being in a Surger's lane when it
    // discharges") is expressed with NO EIGHTH FIELD and no branch in the
    // collision pass. A transient zero the player was given C.SURGE_TELEGRAPH of
    // visible fuse to walk out of is a discharge; a permanent one is an
    // unaccountable death. ⛔ The RESTORE is as load-bearing as the mutation:
    // one writer, the Surger's setPhase(), so `phase` and `killDepth` can never
    // disagree.
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
// anywhere — not in onShot, not in splitLanes, not in the draw path. Adding a
// row is: an entry here, an ENEMY_KINDS row for the carrier variant, and a
// glyph in CARGO_GLYPHS — the same three-file shape every enemy already has
// (behaviour, spawn string, silhouette). Nothing else.
//
// ⛔ CS005 P4 COMPLETED GDD 6.2's TABLE and added no code path. The Drifter and
// the Surger could not be cargo before they were enemies (CS005 P2 and P3), so
// their rows waited a phase; landing them cost two lines here, two ENEMY_KINDS
// rows and two glyphs, because CS004 P2 wrote onShot() and splitLanes() to
// serve every row of this table rather than the one row it could build. ⚠ It
// is still NOT a weighted draw — GDD 8's "cargo weights shift toward
// Drifter/Surger" is heat, and heat is CS006's.
//
// ⛔ GDD 6.2's "adjacent" (Vaulter cargo) and "flanking" (Surger cargo) are THE
// SAME GEOMETRY. The distinction that section draws is between the correct
// RESPONSES — move away versus hold still — which comes from what the cargo
// does after it lands, not from where it lands. splitLanes() serves all three
// rows; a second placement rule invented to justify the second word would be a
// difference the player cannot see.
const CARGO = {
  vaulter: { kind: "vaulter" },
  drifter: { kind: "drifter" },
  surger: { kind: "surger" },
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

    // The Thorn this Weaver is growing (CS004 P4). ⛔ AN INSTANCE FIELD AND NOT
    // state: nothing outside this Weaver needs to know which segment is its,
    // and a Thorn outlives the Weaver that laid it. It is re-resolved through
    // thornInLane() whenever it is missing or dead, which is also how a SECOND
    // Weaver arriving in this lane adopts the first one's Thorn rather than
    // standing a second one up behind it.
    this.thorn = null;
  }

  // GDD 6.1's "climbs partway LAYING A THORN", filled in by CS004 P4. Called
  // every step of the climb phase and nowhere else, so a retreating Weaver
  // neither grows nor shortens what it left behind.
  //
  // ⛔ IT ONLY EVER GROWS. `if (tip > thorn.depth)` is not defensive
  // programming, it is the rule: the Thorn's depth is a LENGTH (07-enemies.js's
  // `anchored`), the Weaver's is a POSITION, and the cycle sends that position
  // back to the throat every time round. An unconditional `thorn.depth = tip`
  // would saw the Thorn back down to nothing on the second climb, which is not
  // laying — it is the Weaver eating its own work while the player watches.
  // It is also what makes "a Weaver killed mid-climb leaves its Thorn at the
  // length it reached" true by construction rather than by luck.
  //
  // ⛔ IT ADOPTS A LIVE THORN IN ITS LANE RATHER THAN CREATING A SECOND. Two
  // overlapping Thorns are two hit-point pools behind one silhouette: a GDD 1.1
  // P2 failure (the player cannot see how much is left) and a scoring oddity
  // (CS007 pays per chip) at once. The lookup is what makes a second Weaver
  // arriving in this lane extend the first one's segment.
  //
  // ⛔ THROUGH spawnEnemy(), the one entry point (GDD 6.5) — the third
  // non-spawner caller, after the Carrier's split and this class's own fire().
  // GDD 6.3's safe-spawn rule is harmless here, and precisely because a Weaver
  // GROWS a Thorn instead of dropping a finished one: it is created at the
  // Weaver's own depth, one climb step above the throat, where the rule has
  // nothing to do. ⚠ Worth knowing anyway, because it is reachable from the
  // debug bench, which can stage a Weaver deep in the Skimmer's lane: applied
  // to an anchored entity that rule does not lower a position, it SHORTENS a
  // length — the same trap `anchored` fixes in respawnSkimmer(). It is harmless
  // HERE only because the grow below runs on the same step and writes the tip
  // back up to the Weaver's own depth. ⛔ Do not reorder those two.
  //
  // A refusal (C.ENEMY_CAP, ⛔ counted before any RNG draw is spent, so a full
  // board costs the run's one stream nothing) simply means no Thorn this step;
  // the next climb step tries again.
  layThorn(well, state) {
    if (!this.thorn || this.thorn.dead) this.thorn = thornInLane(state, well, this.lane);
    if (!this.thorn) {
      this.thorn = spawnEnemy("thorn", this.lane, this.depth);
      if (!this.thorn) return;
    }
    // GDD 8's "clamp: lane length". The tip tracks the Weaver's own depth,
    // never past C.THORN_MAX.
    const tip = this.depth > C.THORN_MAX ? C.THORN_MAX : this.depth;
    if (tip > this.thorn.depth) this.thorn.depth = tip;
  }

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

// ---------------------------------------------------------------------------
// The Thorn (GDD 6.1, 4.2, 4.3, 5, 8) — a bright lane segment, first at L5,
// 5 points per chip. Static. Laid by a Weaver, killed only by shots, and its
// real consequence is the Dive.
// ---------------------------------------------------------------------------
//
// ⛔ IT IS NOT AN ENEMY IN ANY NORMAL SENSE, AND IT LIVES IN state.enemies
// ANYWAY (GDD 6.5's one array). It does not move, the Purge does not touch it,
// it does not hold a well open, and contact with it is harmless until CS006's
// Dive exists. Every one of those is a FLAG the machinery CS003 already built
// reads off the entity — so the Thorn costs the Purge, the clear check, the
// collision pass and the entity pass exactly nothing. A second array for
// "hazards" would double all six wiring points to save one boolean.
//
// ⛔ ITS `depth` IS THE TIP OF AN EXTENT ROOTED AT THE THROAT, NOT A POSITION.
// That is what `anchored = true` declares (the base class above), and it is
// load-bearing in two places pulling opposite ways:
//
//   respawnSkimmer()  SKIPS it (23-main.js). GDD 4.4's rim push clamps depth
//                     down to 0.55 on every player death; on a length that is
//                     not a push, it is a free chip nobody earned, applied
//                     silently in the one place nobody would look.
//   collideShots()    does NOT skip it (09-collision.js). Its one-line hit test
//                     is `|shotDepth - e.depth| <= HIT_DEPTH_TOL`, and that is
//                     exactly right on a Thorn BECAUSE depth is the tip: a shot
//                     stops where the Thorn starts. Move the extent to a second
//                     field and that pass grows a Thorn branch — which is the
//                     thing the contract exists to prevent.
//
// ⚠ SETTLED — GDD 4.2's RAPID CHIP-AWAY IS EMERGENT AND IS NOT A BUG. onShot
// CONSUMES the shot, and Game.update()'s end-of-frame filter frees that shot's
// slot against C.SHOT_MAX the SAME step — so camping a thorned lane chips it
// down fast. It is in the original, it is deliberate, and ⛔ it must not be
// rate-limited: no cooldown, no per-step chip cap, no invulnerability window.
// There is nothing here to add one to, and that is the point.
class Thorn extends Enemy {
  // `dir` is ignored — a Thorn has no heading and never moves. The spawner
  // still spends its draw on one (08-spawner.js), which is what keeps the
  // run's ONE stream aligned regardless of which kind came out of the throat.
  constructor(lane, depth) {
    super(lane, depth);

    // ⛔ GDD 4.3's "does not remove Thorns", as the flag the Purge already
    // reads. The roster's first false — and the reason the Purge needs no
    // special case for it, in either of its two uses.
    this.purgeable = false;

    // ⛔ GDD 5: a Thorn is still standing during the Dive. That is what this
    // flag MEANS here, not an oversight in wellCleared() — a well full of
    // Thorns and nothing else is a cleared well, and the Thorns are the thing
    // the player then has to thread between.
    this.blocksClear = false;

    // Contact never kills. ⛔ GDD 4.5 item 5 is "a Thorn DURING THE DIVE", and
    // there is no Dive — CS006 owns it, and it will not be a killDepth: the
    // Dive is its own sequence with its own rule, not a rim band.
    this.killDepth = null;

    // ⛔ THE ONLY true IN THE CLASSIC ROSTER. See the header above.
    this.anchored = true;
  }

  // ⛔ NOTHING. It is static, its lane never changes, and its length is written
  // only by the Weaver that is growing it and by onShot below. The signature is
  // the contract's (GDD 6.5), not this entity's.
  update(dt, well, state) {}

  draw(ctx, well) {
    drawThorn(ctx, well, this.lane, this.depth);
  }

  // ⛔ CHIP, THEN CONSUME. The shot stopped at the tip — that is what the
  // collision pass's one-line depth test means on an entity whose depth is its
  // tip — so it does not fly on to whatever is sheltering behind the Thorn.
  //
  // ⛔ Clamped at zero on the way out. depth < 0 is no more legal than depth > 1
  // (GDD 3.2), the entity is dead either way, and leaving a negative length in
  // the array for the rest of the step is a number no other system can produce.
  onShot(shot) {
    this.depth -= C.THORN_CHIP;
    if (this.depth <= 0) {
      this.depth = 0;
      this.dead = true;
    }
    return true;
  }
}

// The live Thorn in `lane`, or null. ⛔ laneDelta, NEVER a bare subtraction: on
// a 16-lane Ring, lane 15 and lane 0 are neighbours and `a - b` says fifteen
// (03-wells.js). C.HIT_LANE_TOL is "the same lane" as the rest of the build
// already defines it — half a lane either side — so a Thorn this finds is
// exactly a Thorn a shot fired down that lane would hit, and there is no second
// idea of sameness to keep in step.
//
// ⚠ `instanceof`, where the Purge and the clear check read a flag. That is not
// an inconsistency: those two ask what an entity DOES, and the answer belongs
// on the entity. This asks which entity a Weaver is growing, which is a question
// about identity — and inventing an eighth contract field to answer it is
// exactly the slope GDD 6.5 warns about at the base class.
function thornInLane(state, well, lane) {
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead || !(e instanceof Thorn)) continue;
    if (Math.abs(laneDelta(well, lane, e.lane)) <= C.HIT_LANE_TOL) return e;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The Drifter (GDD 6.1, 6.3, 4.5 item 2, 3.5) — a tumbling spark cluster, first
// at L9, 250/500/750 points by depth. Rides lane BOUNDARIES, where it is
// armoured; crosses lanes, where it is not; homes near the rim. Killed by a
// shot ONLY while crossing; killed by the Purge in either phase.
// ---------------------------------------------------------------------------
//
// ⛔ ITS FAILURE MODE IS NOT "TOO HARD", IT IS A DEATH THE PLAYER CANNOT
// ACCOUNT FOR, which GDD 6.3 names as the most common complaint about games in
// this genre. Everything below that looks like extra care is that ⛔ being
// obeyed: the killDepth, the birth, the climb in both phases, and the three
// channels the two states differ on.
//
// THE CYCLE, and a player watching one should be able to name it — it settles,
// it is hard to kill, it slides across, it settles again:
//
//   birth   ONE half-cross from the spawned lane CENTRE onto the nearest legal
//           boundary, over C.DRIFT_CROSS_TIME * 0.5.       VULNERABLE
//   ride    on the boundary, C.DRIFT_RIDE_TIME.            INVULNERABLE
//   cross   one lane to the next boundary,
//           over C.DRIFT_CROSS_TIME.                       VULNERABLE
//   ride    …
//
// ⛔ THE PHASE IS THE WHOLE STATE MACHINE and every timer counts UP (GDD 16.3).
// The Weaver's `phase` is the precedent. There is no second flag saying which
// way anything is moving: the heading lives in `dir`, written back from the
// helper that owns the wall, and the crossing lives in `crossFrom`/`crossDelta`
// exactly as the Vaulter's hop does.
//
// ⛔ NOTHING HERE READS well.closed. `boundaryFrom`, `laneHop`, `laneDelta`,
// `laneNormalize` and `laneBoundaryLo/Hi` own the topology (03-wells.js), which
// is the only reason a Drifter behaves on a Ring and on a Fan without a branch
// — the same property the Vaulter's header claims.
//
// ⛔ IT SPAWNS NOTHING, EVER. The Weaver is the only entity in the build that
// creates other entities from inside its update.
class Drifter extends Enemy {
  // `dir` is the initial heading, +1 or -1, and is the spawner's to choose
  // (08-spawner.js draws it from the run's ONE stream). ⛔ THE FIRST ENEMY_KINDS
  // ROW THAT ACTUALLY USES ITS `dir`: the Vaulter takes one, and the Carrier,
  // the Weaver, the bolt and the Thorn all ignore theirs. Anything non-negative,
  // undefined included, means +1.
  constructor(lane, depth, dir) {
    super(lane, depth);

    // ⛔ THE RIM BAND, NOT ZERO — the same expression the Vaulter, the Carrier
    // and the Weaver's bolt use, so retuning C.RIM_CONTACT_DEPTH moves every
    // rim-contact entity together. Two comments in this build predicted `0`
    // here (the base class above, and collideSkimmer's header in
    // 09-collision.js) and CS005 P2 corrected both.
    //
    // ⛔ WHY ZERO WOULD BE WRONG, AND IT IS NOT A TUNING OPINION.
    // collideSkimmer() is `e.depth >= e.killDepth` plus a lane match, and it
    // has NO TERM for where the Skimmer is, because the Skimmer is always at
    // depth 1. So `killDepth = 0` does not read as "kills on contact at any
    // depth" — it reads as "every legal depth is a kill zone". pickSpawnLane()
    // draws a lane with no reference to the player and updateSpawner() releases
    // at depth 0, and spawnEnemy()'s safe-spawn rule only ever LOWERS a depth,
    // which is still lethal at zero. A Drifter released into the player's lane
    // would kill them on the spawn step, from the throat, having travelled
    // nowhere: frequent, free, and exactly the death GDD 6.3's ⛔ exists to
    // prevent.
    //
    // ⛔ AND GDD 4.5 ITEM 2 STILL MEANS SOMETHING UNDER THIS READING. "Contact
    // with a Drifter, any depth" is about there being no safe PHASE, not no
    // safe distance: a Drifter kills you while it is armoured, so you can
    // neither shoot it nor touch it, where the Weaver has no lethal phase at
    // all and the Thorn has none outside the Dive. That is the distinction the
    // condition is listed separately for.
    //
    // ⚠ Zero becomes honest the moment the craft can leave the rim — GDD 5's
    // Dive, GDD 14.2's Jump — because collideSkimmer would then have two depths
    // to compare. It is a ONE-LINE change at that point. ⛔ Do not give the
    // Skimmer a `depth` field now to make it honest early: that is CS006's and
    // CS011's work, and a collision pass with a Skimmer-depth term is a second
    // thing to keep in step for no present benefit.
    this.killDepth = 1 - C.RIM_CONTACT_DEPTH;

    // ⛔ The heading, kept in step with what boundaryFrom() and laneHop() return
    // and never inferred from a lane comparison afterwards. The wall and the
    // crosser's heading are ONE piece of state (GDD 3.5).
    this.dir = dir < 0 ? -1 : 1;

    // "birth" | "cross" | "ride".
    //
    // ⛔ "birth" IS THE STATE OF HAVING BEEN CONSTRUCTED AND NOT YET SEEN A
    // WELL, and it lasts from the constructor to the first update(). It exists
    // because THE CONSTRUCTOR MUST NOT SNAP TO A BOUNDARY AND MUST NOT NEED A
    // `well`, which is verified rather than preferred — three closed
    // changesets' test files depend on it:
    //
    //   test-cs004-p1.js  probes every ENEMY_KINDS row as
    //                     ENEMY_KINDS[kind](0, 0, 1), with no well in scope.
    //   test-cs004-p2.js  both loop over CARGO, split a Carrier and assert the
    //   test-cs004-p5.js  children land in splitLanes()' exact INTEGER lanes at
    //                     the parent's exact depth. A snapping constructor
    //                     turns both red the moment CARGO.drifter lands.
    //
    // It is also the better read on its own merits, and that is the half worth
    // keeping if those tests ever change shape: a Drifter emerges from the
    // throat visibly VULNERABLE — open, bright, wide — and only becomes
    // armoured once it settles on the lattice. The player is shown the
    // shootable state at the depth where they have the most time to act on it,
    // which is GDD 1.1 P2 delivered by the movement model rather than by a rule.
    this.phase = "birth";

    // Counts UP toward C.DRIFT_RIDE_TIME (GDD 16.3 — no countdown clocks
    // anywhere in this build).
    this.rideTimer = 0;

    // The crossing in flight. ⛔ `lane` is CONTINUOUS through one, so these
    // exist to interpolate it rather than to teleport at the end — the Vaulter's
    // hop, with a different lattice. There is deliberately no stored DURATION;
    // see crossDur() below.
    this.crossTime = 0;
    this.crossFrom = this.lane;
    this.crossDelta = 0;
  }

  // The armour, as one question asked in three places (onShot, draw, and the
  // tests). ⛔ It is derived from the phase and is never a second field: two
  // fields that must agree are a bug waiting for a phase to be added.
  riding() {
    return this.phase === "ride";
  }

  // ⛔ THE CROSSING'S DURATION IS DERIVED FROM ITS DISTANCE, NOT STORED. The
  // birth covers half a lane and a cross covers a whole one, so this makes the
  // LANE SPEED a single number for the entity's whole life: every crossing step
  // moves exactly dt / C.DRIFT_CROSS_TIME lane units, birth included. A stored
  // per-crossing duration would be a second thing to keep in step with
  // crossDelta, and CS005 P5's soak bound would have to become a table instead
  // of the one derived number 2 * DT / C.DRIFT_CROSS_TIME.
  crossDur() {
    return C.DRIFT_CROSS_TIME * Math.abs(this.crossDelta);
  }

  update(dt, well, state) {
    // ⛔ THE CLIMB RUNS IN BOTH PHASES, and it is not a flourish — it removes a
    // whole failure mode BY CONSTRUCTION. An unshootable entity that never
    // advances is a permanent concurrency squatter: updateSpawner() blocks on
    // state.enemies.length against C.ENEMY_CONCURRENT, which counts every
    // entity in the one array, so three parked Drifters would hold the spawner
    // shut and the well would never clear. That is the exact shape of the Thorn
    // stall STATUS.md carries — and the Drifter does not have it, because it
    // reaches the rim on a fixed clock and forces a resolution either way.
    //
    // ⛔ Monotonic, and it STOPS at 1 rather than passing it, the Vaulter's rule
    // for the Vaulter's reason: depth > 1 is not a legal position, and letting
    // it run would leave every downstream comparison (killDepth, the
    // readability zone, the respawn push) reading a number no other system can
    // produce. A rim Drifter keeps cycling, so it is a boundary-hopping hunter
    // rather than a parked one.
    if (this.depth < 1) {
      this.depth += C.DRIFT_CLIMB * dt;
      if (this.depth > 1) this.depth = 1;
    }

    if (this.phase === "birth") {
      this.startBirth(well);
      return;
    }

    if (this.riding()) {
      this.rideTimer += dt;
      if (this.rideTimer >= C.DRIFT_RIDE_TIME) this.startCross(well, state);
      return;
    }

    this.advanceCross(dt, well);
  }

  // ⛔ THE ONE HALF-CROSS, and ⛔ IT DOES NOT GO THROUGH laneHop. boundaryFrom()
  // (03-wells.js) answers a different question: laneHop FOLDS, and folding an
  // OFF-LATTICE start about the lattice bounds overshoots —
  // laneHop(Vee, 0, -0.5, -1, 0.5, 11.5) returns lane 1.5, a lane and a half in
  // one cross time, which a soak reads as a teleport. A half-step that reverses
  // once at a wall is not a hop that reflects.
  //
  // boundaryFrom is also where well.closed is read, which is what keeps this
  // class free of the topology.
  startBirth(well) {
    const b = boundaryFrom(well, this.lane, this.dir);
    this.dir = b.dir;
    this.beginCrossTo(well, b.lane);
  }

  // ⛔ EVERY CROSS GOES THROUGH laneHop() AND THE dir IT RETURNS IS WRITTEN
  // BACK. Read that helper's header, and the Vaulter's startHop, before
  // touching this: an enemy that keeps its own heading and asks the helper only
  // for a POSITION holds a stale direction after a wall bounce and grinds
  // against an open well's end forever, one cross out and one cross back. That
  // is GDD 3.5's named bug and GDD 17's third required test.
  //
  // ⛔ THE FOLD BOUNDS ARE THE BOUNDARY LATTICE'S (CS005 P1), not laneHop's
  // defaults. Folded about the lane-CENTRE bounds instead, a cross from lane
  // 0.5 lands back on lane 0.5 — a whole vulnerable crossing window in which
  // the Drifter announces itself as shootable and then does not move, which
  // reads as a bug even to a player who cannot name it. ⚠ On a closed well the
  // bounds are inert (it wraps), so they are passed unconditionally.
  startCross(well, state) {
    const dir = this.crossDir(well, state);
    const h = laneHop(well, this.lane, dir, dir, laneBoundaryLo(well), laneBoundaryHi(well));
    this.dir = h.dir;
    this.beginCrossTo(well, h.lane);
  }

  // Arm a crossing toward a lane the caller has already resolved. ⛔ laneDelta,
  // never a bare subtraction: a cross over a closed well's seam travels one
  // lane forward and not fifteen backwards (03-wells.js).
  beginCrossTo(well, lane) {
    this.crossFrom = this.lane;
    this.crossDelta = laneDelta(well, this.lane, lane);
    this.crossTime = 0;
    this.phase = "cross";
  }

  // Which way the next cross goes. ⛔ GDD 6.1's "homes near rim", as a
  // DIRECTION and nothing else — the cross itself is unconditional.
  //
  // ⚠ A DELIBERATE DIFFERENCE FROM THE VAULTER, and it is the one judgment call
  // in this class. Vaulter.huntDir() returns 0 in three cases — no Skimmer yet
  // (23-main.js mints it lazily), a dead one, and "already in the player's
  // lane" — and the Vaulter answers a 0 by not hopping this beat. A Drifter may
  // not do that: declining a cross leaves it RIDING, which is armoured, and the
  // armour budget is C.DRIFT_RIDE_TIME rather than "until the player moves". So
  // a 0 falls back to the stored heading and the entity keeps its cadence. What
  // homing changes is where it goes, never whether it goes.
  crossDir(well, state) {
    if (this.depth < C.DRIFT_HOME_DEPTH) return this.dir;
    const d = this.huntDir(well, state);
    return d === 0 ? this.dir : d;
  }

  // Which way the Skimmer is, as -1 / 0 / +1 — the shape of Vaulter.huntDir(),
  // reused deliberately. ⛔ laneDelta, never (a - b): on a 16-lane Ring the way
  // from lane 15 to lane 0 is +1, and the bare subtraction sends the Drifter
  // fifteen lanes the wrong way round.
  huntDir(well, state) {
    const target = state.skimmer;
    if (!target || target.dead) return 0;
    const d = laneDelta(well, this.lane, target.lane);
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
  }

  // Carry the crossing forward. ⛔ `lane` moves continuously, so the Drifter is
  // hittable in both lanes it is near for the whole crossing — which is the
  // window GDD 6.1's "crosses lanes (vulnerable)" is really describing.
  advanceCross(dt, well) {
    const dur = this.crossDur();
    this.crossTime += dt;

    if (!(dur > 0) || this.crossTime >= dur) {
      // Landing is EXACT, never the last interpolated step: accumulated float
      // error would leave the Drifter a hair off the lattice, and every later
      // cross would inherit the drift — on this entity that matters more than
      // on the Vaulter, because the lattice point is what the armour is
      // anchored to visually.
      this.lane = laneNormalize(well, this.crossFrom + this.crossDelta);
      this.crossTime = dur;
      this.phase = "ride";
      this.rideTimer = 0;
      return;
    }
    // laneNormalize keeps the in-flight lane legal on BOTH topologies.
    this.lane = laneNormalize(well, this.crossFrom + this.crossDelta * (this.crossTime / dur));
  }

  draw(ctx, well) {
    drawDrifter(ctx, well, this.lane, this.depth, this.riding());
  }

  // ⛔ THE ROSTER'S FIRST PHASE-DEPENDENT onShot, and the first entity to use
  // the base class's documented `return false` path in anger. Riding is
  // armoured: the shot is NOT consumed and flies on to whatever is behind it,
  // exactly as the Weaver's bolt declines every shot. Crossing is not: any shot
  // kills it and is spent.
  //
  // ⚠ A DECLINED SHOT STILL COSTS ITS RESOLUTION FOR THE FEW STEPS OF OVERLAP,
  // because collideShots()'s `break` is UNCONDITIONAL (09-collision.js) — so a
  // riding Drifter briefly shields whatever is behind it, in BOTH lanes it sits
  // between. The bolt's own header predicted this. ⛔ It is not a bug and that
  // `break` must not become conditional to "fix" it: it is load-bearing for the
  // Carrier's split and for GDD 4.2's chip economy as well.
  //
  // ⛔ The Purge kills it in EITHER phase and that needs no code here — GDD
  // 6.1's "Purge anywhere" is `purgeable`, inherited true, and updatePurge()
  // sets `dead` directly without ever asking onShot() (⚠ SETTLED, and it works
  // by omission). A panic button that armour could refuse would not be one.
  onShot(shot) {
    if (this.riding()) return false;
    this.dead = true;
    return true;
  }
}

// ---------------------------------------------------------------------------
// The Surger (GDD 6.1, 6.3, 4.5 item 3) — a zigzag bar, first at L13, 200
// points. Climbs; periodically electrifies its WHOLE LANE. Killed by any shot
// or the Purge; kills by being in its lane when it discharges.
// ---------------------------------------------------------------------------
//
// ⛔ THE ROSTER'S FIRST ENTITY WHOSE LETHALITY IS A PHASE OF ITS OWN CYCLE
// RATHER THAN A DEPTH — and it is expressed in the SEVEN CONTRACT FIELDS THAT
// ALREADY EXIST (GDD 6.5). There is no eighth field, and there is no branch for
// it in the collision pass. That is the return the contract was designed to pay.
//
// ⛔ THE DISCHARGE IS killDepth MUTATED TO 0, AND RESTORED ON THE WAY OUT.
// collideSkimmer() is `e.depth >= e.killDepth` plus a lane match
// (09-collision.js). With killDepth = 0 the depth test is unconditionally true,
// so the only remaining term is laneHit() — which is EXACTLY GDD 4.5 item 3,
// "being in a Surger's lane when it discharges". Game.update() runs the entity
// pass BEFORE the collision pass, so a Surger that enters the discharge on step
// n is lethal on step n; there is no one-step lag to compensate for.
//
// ⚠ NOTE THE ASYMMETRY WITH THE DRIFTER, BECAUSE IT IS THE SAME NUMBER MEANING
// TWO DIFFERENT THINGS. CS005 P2 corrected two shipped comments that predicted
// killDepth = 0 for the Drifter, and this class ships the value they predicted.
// Both are right. On the Drifter zero would be a PERMANENT property of a
// climbing enemy — lethal from the throat on its spawn step, having travelled
// nowhere, which is the unaccountable death GDD 6.3's ⛔ exists to prevent. Here
// it is a C.SURGE_DISCHARGE window the player was given a C.SURGE_TELEGRAPH
// fuse to walk out of. A permanent kill zone is not a discharge.
//
// ⛔ AND THE FUSE IS THE FAIRNESS (GDD 6.3). The lane is NEVER lethal during the
// telegraph — killDepth stays on the rim band for the whole of it. A fuse that
// kills is not a fuse, and that sentence is the whole of that section's rule.
//
// THE CYCLE, and a player watching one should be able to name it — it climbs,
// its lane arms from the throat up, the lane goes live, it climbs again:
//
//   climb      depth rises at C.SURGE_CLIMB. surgeTimer counts UP toward
//              C.SURGE_INTERVAL.  killDepth = the rim band.
//   telegraph  C.SURGE_TELEGRAPH. The fuse grows throat -> rim in the lane
//              (14-render-entities.js).  ⛔ killDepth = STILL the rim band.
//   discharge  C.SURGE_DISCHARGE. ⛔ killDepth = 0; the whole lane is live.
//   climb      …
//
// ⛔ IT STARTS IN climb WITH surgeTimer = 0 AND CAN NEVER DISCHARGE ON ITS FIRST
// STEP, from any spawn depth. A Surger that arrived already discharging is the
// same unaccountable death as a Drifter with a zero killDepth, and it is also
// what keeps test-cs004-p1.js's spawnRow case green — that case drives one
// G.update(DT) over a freshly spawned row with a Surger in it.
//
// ⛔ ONE LANE, NEVER HOPS. It touches no lane helper; `lane` is written once, by
// the constructor. That is the Carrier's and the Weaver's absence of code, and
// it is what lets CS005 P5's soak give this entity the STRONG lane assertion —
// Object.is equality with its spawn lane — rather than a per-step speed bound.
//
// ⛔ THE PHASE IS THE WHOLE STATE MACHINE and the timer counts UP (GDD 16.3).
// There is no second flag saying whether the lane is live: `killDepth` is
// derived from the phase at each transition and nowhere else.
class Surger extends Enemy {
  // `dir` is ignored — a Surger never hops. The spawner still spends its draw
  // on one (08-spawner.js), which is what keeps the run's ONE stream aligned
  // regardless of which kind came out of the throat.
  constructor(lane, depth) {
    super(lane, depth);

    // ⛔ THE RIM BAND, and it is the value this field spends most of its life
    // holding — the same expression the Vaulter, the Carrier, the bolt and the
    // Drifter use, so retuning C.RIM_CONTACT_DEPTH moves every rim-contact
    // entity together. The discharge REPLACES it for C.SURGE_DISCHARGE and puts
    // it back; see setPhase() below, which is the only writer.
    //
    // ⚠ SO THE SURGER KILLS BY TWO OF GDD 4.5's FIVE CONDITIONS, and it is the
    // only entity in the roster that does. Item 3 is the discharge; item 1 —
    // "an enemy reaching the rim in your lane and making contact" — is this
    // resting value, which it carries exactly as the Vaulter does. A Surger
    // that gets to the rim is dangerous for the ordinary reason as well as for
    // its own; there is nothing to add for that, which is the point of a field.
    this.killDepth = 1 - C.RIM_CONTACT_DEPTH;

    // "climb" | "telegraph" | "discharge". ⛔ Born in climb — see the header.
    this.phase = "climb";

    // ⛔ Counts UP, and it is RESET AT EVERY TRANSITION rather than compared
    // against a running total (GDD 16.3 — no countdown clocks in this build).
    // One timer for three phases is what makes "the phase decides what the
    // number means" true; a per-phase timer would be three things to keep in
    // step for no reader's benefit.
    this.surgeTimer = 0;
  }

  // ⛔ THE ONE WRITER OF BOTH `phase` AND `killDepth`, which is the only reason
  // the two can never disagree. A discharge that ended without restoring the
  // band would leave a permanently lane-lethal enemy on the board and nothing
  // downstream could tell it from a bug in the collision pass.
  setPhase(phase) {
    this.phase = phase;
    this.surgeTimer = 0;
    this.killDepth = phase === "discharge" ? 0 : 1 - C.RIM_CONTACT_DEPTH;
  }

  // How far the fuse has grown, as 0..1 of the lane, or 0 when the lane is not
  // arming. The draw path's one input (14-render-entities.js) and a phase read
  // rather than a fourth field.
  chargeTip() {
    if (this.phase === "discharge") return 1;
    if (this.phase !== "telegraph") return 0;
    const t = this.surgeTimer / C.SURGE_TELEGRAPH;
    return t > 1 ? 1 : t;
  }

  // `well` and `state` are unused: a Surger has no topology and no AI. The
  // signature is the contract's (GDD 6.5), not this entity's.
  update(dt, well, state) {
    this.surgeTimer += dt;

    if (this.phase === "climb") {
      // ⛔ Monotonic, and it STOPS at the rim rather than passing it — the
      // Vaulter's rule for the Vaulter's reason: depth > 1 is not a legal
      // position, and every downstream comparison (killDepth, the readability
      // zone, the respawn push) would be reading a number no other system can
      // produce.
      //
      // ⛔ AND IT RISES IN THIS PHASE ONLY. The Drifter is the entity whose
      // climb runs in every phase, and it needs that because riding is
      // unshootable and a parked unshootable entity is a concurrency squatter.
      // A Surger is shootable in all three phases, so nothing forces it, and
      // the pause is worth having: the bar stops moving at the instant its lane
      // starts arming, which is a fourth channel on GDD 6.3's fuse for free.
      if (this.depth < 1) {
        this.depth += C.SURGE_CLIMB * dt;
        if (this.depth > 1) this.depth = 1;
      }
      if (this.surgeTimer >= C.SURGE_INTERVAL) this.setPhase("telegraph");
      return;
    }

    if (this.phase === "telegraph") {
      // ⛔ NOTHING ELSE HAPPENS HERE, AND THAT IS THE FEATURE. killDepth is
      // untouched, so the lane is exactly as lethal as it was a step ago: the
      // rim band, like every other climbing enemy. The fuse is a drawing.
      if (this.surgeTimer >= C.SURGE_TELEGRAPH) this.setPhase("discharge");
      return;
    }

    // discharge — killDepth is 0 for this window and the whole lane is lethal.
    // ⛔ The restore is unconditional and it happens BEFORE the collision pass
    // of the step that ends the window, so the discharge is exactly
    // C.SURGE_DISCHARGE of lethal steps and not one more.
    if (this.surgeTimer >= C.SURGE_DISCHARGE) this.setPhase("climb");
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2). The silhouette AND the lane fuse
  // live in 14-render-entities.js; the entity hands over its phase as a single
  // 0..1 tip plus whether the lane is live, so the two states can never drift
  // apart from the two behaviours.
  draw(ctx, well) {
    drawSurger(ctx, well, this.lane, this.depth, this.chargeTip(), this.phase === "discharge");
  }

  // Any shot kills it and the shot is spent (GDD 6.1) — 200 points, when CS007
  // builds addScore(). ⛔ IN EVERY PHASE, THE DISCHARGE INCLUDED: the lane being
  // live is a threat to the player standing in it, never armour for the thing
  // making it. The answer to a Surger is to shoot it, and the fuse is the
  // window the player is given to decide whether to shoot or to leave.
  onShot(shot) {
    this.dead = true;
    return true;
  }
}

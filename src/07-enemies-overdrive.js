// 07-enemies-overdrive.js — OVERDRIVE'S ROSTER (GDD 6.4, 13, 14.6). CS012 P2
// ships the Reaver; CS013 adds the Warden and the Mimic.
//
// ⛔ THE CONTRACT IS 07-enemies.js's, AND IT IS READ THERE FIRST. The eight
// fields, the four methods, the one array, the one spawn entry point and the
// wiring points (GDD 6.5) are written down in that file's base class and are not
// repeated here. Every class below states its eight answers as plan §9 did.
//
// ⛔ WHY A SECOND FILE (Paul's O15). 07-enemies.js was 71 KB, 65 % comment, at
// CS012's plan, and the seam falls where the roster does: Classic there,
// Overdrive here. Nothing moved out of it. build.js's MANIFEST concatenates this
// module directly after that one, because the classes here extend classes
// there, and before 08-spawner.js, whose ENEMY_KINDS names them.
//
// ⛔ AN OVERDRIVE ENEMY REACHES THE BOARD ONLY THROUGH C.SPAWN_SCHEDULE_OVERDRIVE
// (08-spawner.js's eligibleKinds), so a Classic run never releases one. There
// is no bench key for any of them (O16).

// ---------------------------------------------------------------------------
// The Reaver (GDD 14.6) — "Vaulter at 1.6x that vaults toward the Skimmer".
// Overdrive L6+, 300 points. Killed by any shot or the Purge; kills by contact
// at the rim.
// ---------------------------------------------------------------------------
//
// ⛔ A PARAMETER VARIANT OF THE VAULTER, AND THAT IS WHY IT SUBCLASSES ONE (R9).
// It overrides two readers and a rate and inherits everything else: the climb,
// the park depth, the rim hunt, laneHop()'s fold at an open well's wall, onShot
// and the eight fields. ⛔ This is not the slope 07-enemies.js's base warns
// about: `Enemy` still carries no behaviour; a variant inheriting its parent's
// is what GDD 14.6 describes.
//
// ⛔ WHAT 1.6x SCALES (Paul's O1): THE HOP, NEVER THE CLIMB. The hop duration and
// both hop intervals are divided by C.REAVER_HOP_RATE. The climb is the
// Vaulter's own `C.VAULT_CLIMB * climbMult()`, because a Reaver that CLIMBED at
// 1.6x would breach GDD 4.4's respawn guarantee from level 1 (MEASURED,
// PLANNED-FEATURES-CS012.md §1.1). Heat scales the intervals through the
// Vaulter's accessors and never the hop duration (H2).
//
// ⛔ "VAULTS TOWARD THE SKIMMER" (O1's reading): every MID-CLIMB hop takes
// huntDir(), the rim hunt's direction, from its first update and with no level
// gate. It holds its lane while it is in the Skimmer's. At the rim it hunts
// exactly as a Vaulter does, at its own interval.
//
// The eight fields: (lane, depth) a position; `purgeable` true (GDD 4.3 exempts
// only the Thorn); `blocksClear` true, so it is never on the board at a clear
// and never a Dive survivor; `killDepth` the rim band `1 - C.RIM_CONTACT_DEPTH`;
// `anchored` false, so respawnSkimmer() pushes it to 0.55 and the guarantee
// holds because its climb is a Vaulter's; `sfxVoice` "reaver". It is not cargo
// (R16).
class Reaver extends Vaulter {
  constructor(lane, depth, dir) {
    super(lane, depth, dir);
    this.sfxVoice = "reaver";   // C.SFX_KILL_PITCH.reaver, from tools/sfx-lab.html
    this.hopRate = C.REAVER_HOP_RATE;
  }

  // ⛔ Toward the Skimmer at every mid-climb beat, and 0 (hold) in its lane.
  midClimbDir(well, state) {
    return this.huntDir(well, state);
  }

  // ⛔ The rate, and never heat.
  hopDuration() {
    return C.VAULT_HOP_TIME / this.hopRate;
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2), in 14-render-entities.js.
  draw(ctx, well) {
    drawReaver(ctx, well, this.lane, this.depth);
  }

  // GDD 7. The kill site pays it; the entity never scores itself.
  points() { return C.PTS_REAVER; }
}

// ---------------------------------------------------------------------------
// The Warden (GDD 6.4, 14.6, 4.5, 6.5) — "flies above the well, fires down,
// killable only by Jump". Overdrive L11+, 500 points. Killed by the JUMP and by
// nothing else; kills by discharging the rim of its own lane.
// ---------------------------------------------------------------------------
//
// ⛔ ALOFT IS A PHASE, NOT A DEPTH (W1, and it is CS012 P5's Jump rule pointed
// the other way). Its (lane, depth) is a lane and depth 1 — the rim's own
// depth, the only legal one it has — and the ninth contract field `aloft`
// (07-enemies.js) is what says it is ABOVE that rim rather than on it. The
// LIFT is draw-time only, exactly as the craft's is. ⛔ No site outside
// collideShots()'s skip and jumpStrike() knows any of this: the respawn push,
// the clear check, the danger read and the Dive all read it as an ordinary
// entity at depth 1.
//
// ⛔ THREE THINGS ARE EXPRESSED IN FIELDS THE CONTRACT ALREADY HAD, and that is
// the return GDD 6.5's contract was designed to pay:
//
//   "unshootable"        onShot() declines and never dies (W2, W4). While it
//                        CLIMBS a shot still reaches it — `aloft` is false —
//                        and flies on past it, so it shields its lane on the
//                        way up as a riding Drifter does. Aloft, the skip in
//                        collideShots() means a shot never even asks.
//   "fires down"         the discharge is `killDepth` mutated to the rim band
//                        and restored, the Surger's mechanism (GDD 6.1). Its
//                        depth IS 1, so `depth >= killDepth` is true and the
//                        only remaining term is laneHit() — GDD 4.5 item 1's
//                        comparison, paying out at a moment rather than a
//                        depth. ⛔ NO NEW COLLISION CODE for its kill.
//   "not purgeable"      GDD 4.3 reads the flag; purgeTarget() prefers the
//                        DEEPEST enemy, so a purgeable Warden sitting at depth
//                        1 would absorb every second Purge (MEASURED by
//                        reading, W4). "Only by Jump" means only by Jump.
//
// ⛔ ITS BODY NEVER KILLS ON THE WAY UP. `killDepth` is null for the whole
// climb, so it passes through the rim band harmlessly and the rim sweep never
// sees it either. The one window in which it is lethal is its own discharge,
// and the player is given WARDEN_TELEGRAPH of visible fuse — a beam creeping
// down its lane, and the Surger's charge tone — to leave or to jump.
//
// ⛔ THE FUSE AND THE STRIKE REUSE THE SURGER'S TWO SOUNDS (W6), and the fuse
// does it WITHOUT 19-sfx.js being edited: reconcileSurgeTones() is duck-typed
// on `phase === "telegraph"` plus a chargeTip(), so naming the phase and
// writing that reader IS the wiring. The meaning is the same sentence — "the
// rim of this lane is about to be lethal; leave or jump" — and so is the
// answer. ⚠ SETTLED (CLAUDE.md): the charge tone is a gameplay cue; this is a
// second entity it cues, not a change to it.
//
// The nine fields: (lane, depth) a position, depth 1 while aloft; `purgeable`
// false (W4); `blocksClear` true (W5), so a well with one standing does not
// clear and the player's answer is a jump; `killDepth` null but for the
// discharge; `anchored` false; `aloft` true from lift-off, false while
// climbing and again if pushed; `sfxVoice` "warden". It is not cargo.
class Warden extends Enemy {
  // `dir` is the initial heading, the Vaulter's convention: anything
  // non-negative, undefined included, is +1. It is only ever read through
  // laneHop() below, which writes the folded heading back (⛔ GDD 3.5).
  constructor(lane, depth, dir) {
    super(lane, depth);
    this.sfxVoice = "warden";   // C.SFX_KILL_PITCH.warden, from tools/sfx-lab.html

    // ⛔ "Killable only by Jump" — the Purge is not a Jump (W4).
    this.purgeable = false;
    // ⛔ A Warden you never answered holds the well open (W5). It then counts
    // against the concurrency ladder rather than adding pressure outside it.
    this.blocksClear = true;

    // "climb" | "hover" | "telegraph" | "discharge", written only by setPhase().
    // Born climbing, at the throat, with a zero clock: ⛔ it can never discharge
    // on its first step, from any spawn depth — the Surger's rule, for the
    // Surger's reason (GDD 6.1).
    this.phase = "climb";
    // ⛔ Counts UP and is RESET AT EVERY TRANSITION (GDD 16.3). One timer for
    // four phases is what makes "the phase decides what the number means" true.
    this.strikeTimer = 0;
    // Has it struck since this lift-off? ⛔ Cleared by setPhase("climb"), so
    // the first hover after EVERY lift-off is C.WARDEN_ARM — see hoverTime().
    this.struck = false;

    // The hunt, aloft. ⛔ The heading, kept in step with laneHop's returned dir
    // and never inferred from a lane comparison afterwards.
    this.dir = dir < 0 ? -1 : 1;
    // ⛔ Counts UP toward C.WARDEN_HOP_INTERVAL and HOLDS there, the Vaulter's
    // rule: a Warden already in the craft's lane takes its hop the moment that
    // stops being true, instead of waiting out a fresh interval.
    this.hopTimer = 0;
    this.hopping = false;
    this.hopTime = 0;     // counts up toward C.WARDEN_HOP_TIME
    this.hopFrom = this.lane;
    this.hopDelta = 0;    // signed lane distance of this hop, already short-way
  }

  // ⛔ THE ONE WRITER OF `phase`, `killDepth` AND `aloft`, which is the only
  // reason the three can never disagree — the Surger's setPhase() with the
  // ninth contract field folded into it. An unrestored band would leave a
  // permanently lane-lethal enemy hovering over the rim, and an unrestored
  // `aloft` would leave a climbing one that no shot could reach: two bugs
  // nothing downstream could tell from a bug in the collision pass.
  setPhase(phase) {
    this.phase = phase;
    this.strikeTimer = 0;
    this.aloft = phase !== "climb";
    this.killDepth = phase === "discharge" ? 1 - C.RIM_CONTACT_DEPTH : null;
    if (phase === "climb") this.struck = false;
    if (phase === "discharge") { this.struck = true; sfx("surgeDischarge"); }
  }

  // How long THIS hover lasts. ⛔ The first one after a lift-off is
  // C.WARDEN_ARM and every later one is C.WARDEN_HOVER: a Warden that arrived
  // over the rim an instant ago is not about to fire, and that beat is the one
  // the player gets to SEE it arrive (GDD 1.1 P2). ⛔ "After a LIFT-OFF", not
  // "per Warden" — a pushed one re-climbs and is armed afresh, which is the
  // slack W3's respawn arithmetic counts.
  hoverTime() {
    return this.struck ? C.WARDEN_HOVER : C.WARDEN_ARM;
  }

  // How far the fuse has run, as 0..1 of the lane, or 0 when the rim is not
  // arming. ⛔ THE SURGER'S READER, BY NAME AND BY SHAPE, because that is what
  // reconcileSurgeTones() (19-sfx.js) duck-types on: this method plus the phase
  // name "telegraph" is the whole of W6's shared charge tone. The draw path
  // reads the same number, so the sound and the beam can never disagree.
  chargeTip() {
    if (this.phase === "discharge") return 1;
    if (this.phase !== "telegraph") return 0;
    const t = this.strikeTimer / C.WARDEN_TELEGRAPH;
    return t > 1 ? 1 : t;
  }

  update(dt, well, state) {
    // ⛔ THE RESPAWN PUSH IS WHAT ENDS A LIFT-OFF, AND THE WARDEN LEARNS IT BY
    // READING ITS OWN DEPTH. respawnSkimmer() (23-main.js) clamps every
    // non-anchored entity above C.RESPAWN_PUSH_DEPTH down to it — this one
    // included, because `aloft` is a phase and not an exemption (GDD 4.4's
    // ⚠ SETTLED clamp). So a Warden below 1 is a Warden that is climbing again,
    // whatever it was doing a step ago, and setPhase() puts the whole contract
    // back: shootable-but-declining, contactless, and armed afresh.
    if (this.aloft && this.depth < 1) {
      this.landHop(well);
      this.setPhase("climb");
    }

    if (this.phase === "climb") {
      // ⛔ THROUGH THE ACCESSOR (CS007 P2, R6). climbMult()'s sixth call site,
      // and the only thing heat touches on this entity. ⛔ It does NOT stop at
      // the park depth the way a contact climber does: its killDepth is null,
      // so it passes the rim band harmlessly and keeps going to depth 1, which
      // is where it lifts off.
      this.depth += C.WARDEN_CLIMB * climbMult() * dt;
      if (this.depth >= 1) {
        this.depth = 1;
        this.setPhase("hover");
      }
      return;
    }

    this.strikeTimer += dt;

    // ⛔ IT HOLDS ITS LANE THROUGH THE FUSE AND THE STRIKE. The fuse is a
    // promise about one lane, and a Warden that drifted while it burned would
    // be a fuse for a lane it was leaving.
    if (this.phase === "telegraph") {
      if (this.strikeTimer >= C.WARDEN_TELEGRAPH) this.setPhase("discharge");
      return;
    }
    if (this.phase === "discharge") {
      // ⛔ The restore is unconditional and happens BEFORE the collision pass of
      // the step that ends the window, so the discharge is exactly
      // C.WARDEN_DISCHARGE of lethal steps and not one more.
      if (this.strikeTimer >= C.WARDEN_DISCHARGE) this.setPhase("hover");
      return;
    }

    // Hovering: it hunts along the rim, and its strike clock runs.
    if (this.hopTimer < C.WARDEN_HOP_INTERVAL) this.hopTimer += dt;
    if (this.hopping) {
      this.advanceHop(dt, well);
    } else if (this.hopTimer >= C.WARDEN_HOP_INTERVAL) {
      const dir = this.huntDir(well, state);
      if (dir !== 0) { this.hopTimer = 0; this.startHop(well, dir); }
    }

    // ⛔ A STRIKE NEVER BEGINS MID-HOP. `lane` is continuous through a crossing,
    // and at a half-integer BOTH neighbours are exactly C.HIT_LANE_TOL away —
    // so a discharge started there would cover two lanes, which is not "its own
    // lane". The clock HOLDS rather than restarting, so the strike lands on the
    // step the hop does.
    if (!this.hopping && this.strikeTimer >= this.hoverTime()) this.setPhase("telegraph");
  }

  // Which way the craft is, as -1 / 0 / +1. ⛔ laneDelta, never (a - b): the
  // Vaulter's header (07-enemies.js) carries the whole reason. 0 means no hop
  // this beat — no craft, a dead one, or it is already in the craft's lane.
  huntDir(well, state) {
    const target = state.skimmer;
    if (!target || target.dead) return 0;
    const d = laneDelta(well, this.lane, target.lane);
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
  }

  // ⛔ THROUGH laneHop(), AND THE dir IT RETURNS IS WRITTEN BACK (GDD 3.5).
  // Nothing here reads well.closed: the topology lives inside laneHop /
  // laneDelta / laneNormalize, so a Warden folds at an open well's wall and
  // wraps a Ring's seam without a branch.
  //
  // ⛔ IT RIDES LANE CENTRES, so laneHop's fold bounds are its default range
  // 0 .. lanes-1 — the boundary lattice is the Drifter's and nothing here
  // touches it (CLAUDE.md, RATIONALE.md#boundary-lattice).
  startHop(well, dir) {
    const h = laneHop(well, this.lane, dir, dir);
    this.dir = h.dir;
    this.hopFrom = this.lane;
    // The short way to the landing lane, so a hop across a closed well's seam
    // travels one lane forward and not fifteen backwards.
    this.hopDelta = laneDelta(well, this.lane, h.lane);
    this.hopTime = 0;
    this.hopping = true;
  }

  // Carry the crossing forward. ⛔ `lane` moves continuously over
  // C.WARDEN_HOP_TIME, and landing is EXACT rather than the last interpolated
  // step — an accumulated float error would leave it a hair off a lane centre
  // and the next hop would inherit the drift.
  advanceHop(dt, well) {
    const dur = C.WARDEN_HOP_TIME;
    this.hopTime += dt;
    if (!(dur > 0) || this.hopTime >= dur) { this.landHop(well); return; }
    this.lane = laneNormalize(well, this.hopFrom + this.hopDelta * (this.hopTime / dur));
  }

  // Land whatever crossing is in flight, exactly, and stop. Called at the end
  // of a hop and by the respawn push, which must not leave a Warden parked
  // half-way between two lanes for the reason update() gives.
  landHop(well) {
    if (!this.hopping) return;
    this.lane = laneNormalize(well, this.hopFrom + this.hopDelta);
    this.hopTime = C.WARDEN_HOP_TIME;
    this.hopping = false;
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2), in 14-render-entities.js. The
  // entity hands over its phase as an `aloft` flag, a 0..1 fuse and whether the
  // rim is live, so the drawing and the lethality cannot drift apart.
  draw(ctx, well) {
    drawWarden(ctx, well, this.lane, this.depth, this.aloft, this.chargeTip(),
               this.phase === "discharge");
  }

  // ⛔ IT DECLINES EVERY SHOT AND NEVER DIES (W2, W4). `false` is "the shot is
  // not consumed", so a shot fired into a climbing Warden flies on and meets
  // whatever is behind it on a LATER step — the Weaver bolt's shipped answer,
  // and the base class's default spelled out rather than inherited silently,
  // because "killable only by Jump" is this line.
  //
  // ⛔ It also answers the rim sweep (CS008 P1b passes null), and the answer is
  // the same: a firing craft that touches a discharging Warden dies. Nothing
  // here reads the argument.
  onShot(shot) { return false; }

  // GDD 7. The kill site pays it; the entity never scores itself.
  points() { return C.PTS_WARDEN; }
}

// ---------------------------------------------------------------------------
// The Mimic (GDD 6.4, 14.6, 6.1, 6.3, 6.5, 12) — "reflects shots; vulnerable
// only while firing". Overdrive L16+, 400 points. KEPT (probation closed, CS017).
// ---------------------------------------------------------------------------
//
// ⚠ PROBATION IS A REAL STATE AND THIS CLASS IS BUILT FOR IT (MI3; GDD 14.6,
// 19, 21 #6). "Reflected shots that kill you are a hard sell: players read
// their own bullets as safe." ⛔ ONE SCHEDULE ROW IS THE WHOLE CUT — remove
// `{ level: 16, kind: "mimic" }` from C.SPAWN_SCHEDULE_OVERDRIVE and no Mimic
// and no MimicShot can reach a board, in either mode, at any level. Nothing
// else in the build has to move for that to be true, and test-cs013-p4.js
// proves it by mutating the row out and playing an Overdrive session at L16+.
// The verdict is CS017's; the ask is in SKIPPED-PLAYTESTS.md.
//
// ⛔ REFLECT-THEN-OPEN, AND THE BUDGET IS WHY (MI1). MEASURED (plan §1.6,
// §1.7): held fire meets a Mimic FIFTEEN TIMES A SECOND, and a Mimic that
// reflected every shot would fill C.ENEMY_CAP in about a second. So a
// reflection is a ONE-SHOT answer that spends the guard:
//
//   closed   guarding. A shot is CONSUMED and sent back once, as one
//            MimicShot up its own lane, and the Mimic OPENS.
//   open     "firing", for C.MIMIC_OPEN_TIME. A shot that reaches it here
//            KILLS it and is consumed. Nothing is reflected.
//
// ⛔ AT MOST ONE REFLECTION PER OPENING, and it is structural rather than a
// counter: reflecting is the only thing that opens it, and an open Mimic
// reflects nothing. Under held fire the next shot lands about 0.1 s later
// (PREDICTED: four steps, plus up to two declined by the crossing MimicShot)
// and the window is 0.5 s, so ⛔ A MIMIC COSTS EXACTLY ONE REFLECTION.
//
// ⛔ THE OPEN/CLOSED READ IS GDD 12's PROMPT, `SOLID = ARMOURED · OPEN =
// VULNERABLE`, and it is the Drifter's three channels (GDD 6.3): two polys —
// one drawn CLOSED, one drawn OPEN — at two stroke widths and two alphas.
// ⛔ It has a headless gate for the same reason the Drifter's does: an art rule
// rots silently, so test-cs013-p4.js measures the ratio and the alpha back off
// the real glowStroke calls.
//
// The nine fields: (lane, depth) a position, climbing to C.MIMIC_APEX and
// holding; `purgeable` TRUE (the Drifter's precedent — "shots only while
// crossing; Purge anywhere": the panic button answers what the guard refuses);
// `blocksClear` true; `killDepth` ⛔ NULL AT EVERY DEPTH — its body never kills
// and it never reaches the rim, so GDD 17 item 13 is not owed (R10); `anchored`
// false; `aloft` false — it lives IN the well; `sfxVoice` "mimic". It is not
// cargo.
class Mimic extends Enemy {
  // `dir` is ignored — one lane, never hopping, and `lane` is written once,
  // here. The Carrier's, the Weaver's and the Surger's absence of code: it
  // touches no lane helper, which is why it behaves identically on a Ring and
  // on a Fan with no branch and no read of `well.closed`. ⛔ The spawner still
  // spends its draw on a `dir` (08-spawner.js) — a kind that skipped it would
  // make the run's ONE stream depend on what came out of the throat.
  constructor(lane, depth) {
    super(lane, depth);
    this.sfxVoice = "mimic";   // C.SFX_KILL_PITCH.mimic, from tools/sfx-lab.html

    // ⛔ THE PURGE ANSWERS IT IN EITHER STATE (GDD 4.3, 6.1's Drifter row).
    // `purgeable` is inherited true and that is the explicit decision, not a
    // default taken by accident: the guard refuses a SHOT, and a panic button
    // armour could refuse would not be one. updatePurge() sets `dead` directly
    // and never asks onShot(), so a purged Mimic reflects nothing (⚠ SETTLED).
    // A Mimic must be gone before the well is clear, like every other threat.

    // "closed" | "open", and one up-counting timer (GDD 16.3) — the Weaver's,
    // the Drifter's and the Surger's precedent. ⛔ Born CLOSED: a Mimic that
    // arrived already open would be a free 400 points for the shot that was
    // already in the air.
    this.phase = "closed";
    this.openTimer = 0;        // counts UP toward C.MIMIC_OPEN_TIME while open
  }

  // Is it "firing" — the one window a shot kills it in (GDD 14.6)? The draw
  // path reads this too, so the read and the rule can never drift apart.
  open() { return this.phase === "open"; }

  update(dt, well, state) {
    // ⛔ climbMult()'s SEVENTH call site (R6; GDD 8's "climb speed", singular),
    // and the only thing heat touches on this entity. ⛔ It stops at
    // C.MIMIC_APEX and NOT at the park depth: its killDepth is null, so there
    // is no band for it to park on, and the apex is bounded by MI2's
    // arithmetic (00-config.js) rather than by the rim.
    if (this.depth < C.MIMIC_APEX) {
      this.depth += C.MIMIC_CLIMB * climbMult() * dt;
      if (this.depth > C.MIMIC_APEX) this.depth = C.MIMIC_APEX;
    }

    // The window closes on its own clock. ⛔ It closes back to GUARDING rather
    // than to anything new — the cycle is two states and nothing else, so a
    // Mimic the player failed to finish costs them a second reflection.
    if (this.phase === "open") {
      this.openTimer += dt;
      if (this.openTimer >= C.MIMIC_OPEN_TIME) {
        this.phase = "closed";
        this.openTimer = 0;
      }
    }
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2), in 14-render-entities.js. It hands
  // over its own phase rather than a flag this module decides, the Drifter's
  // rule: the two states can never drift apart from the two behaviours.
  draw(ctx, well) {
    drawMimic(ctx, well, this.lane, this.depth, this.open());
  }

  // ⛔ THE WHOLE OF MI1, AND BOTH BRANCHES CONSUME THE SHOT. The collision pass
  // only asks; the enemy decides (GDD 6.5).
  //
  //   open    it dies and the shot is spent — GDD 14.6's "vulnerable only
  //           while firing", as the one line that says it.
  //   closed  the shot is spent, ONE MimicShot goes back up the lane, and the
  //           Mimic opens.
  //
  // ⛔ THROUGH spawnEnemy(), THE ONE ENTRY POINT (GDD 6.5) — the FOURTH
  // non-spawner caller, after the Carrier's split and the Weaver's two. It is
  // called from inside collideShots()'s own loop over state.enemies, which is
  // the Carrier split's ⚠ SETTLED path and is safe for the Carrier split's
  // three reasons: the loop is index-based and re-reads `.length`, the `break`
  // after onShot is unconditional, and removal is the end-of-frame filter.
  // ⛔ Do not make that break conditional to "fix" a reflection resolving
  // against a shot's own step.
  //
  // ⛔ THE SOUND ONLY FOR A SHOT THAT EXISTS — Weaver.fire()'s rule:
  // spawnEnemy() refuses at C.ENEMY_CAP, and `reflect` for nothing is a lie
  // about the lane, which on a hostile shot coming up at you is the worst
  // possible lie (GDD 1.1 P2). ⛔ THE OPENING IS UNCONDITIONAL, because the
  // shot was consumed either way: a refused reflection is a lost beat for the
  // MIMIC, never a guard the player paid for and did not get.
  onShot(shot) {
    if (this.open()) {
      this.dead = true;
      return true;
    }
    if (spawnEnemy("mimicShot", this.lane, this.depth)) sfx("reflect");
    this.phase = "open";
    this.openTimer = 0;
    return true;
  }

  // GDD 7. The kill site pays it; the entity never scores itself.
  points() { return C.PTS_MIMIC; }
}

// ---------------------------------------------------------------------------
// The MimicShot (GDD 14.6, 4.5 item 4; MI2) — the player's own shot, turned.
// ---------------------------------------------------------------------------
//
// ⛔ A PARAMETER VARIANT OF THE WEAVER'S BOLT, AND THAT IS WHY IT SUBCLASSES
// ONE (GDD 6.5, CS012 P2's rule). It overrides a speed reader and a draw and
// inherits the whole contract: the rim band `killDepth`, `blocksClear` false,
// `purgeable` true, `anchored` false, the self-termination the step after
// depth 1, the declined shot, and the base's 0 points.
//
// ⛔ IT IS AN ENEMY, IN state.enemies (GDD 6.5's one array), and NOT a reversed
// Shot in state.shots. A hostile entry in that array would need a new branch in
// collideSkimmer(), which reads state.enemies only, and would count against the
// PLAYER'S shot cap (06-shots.js). The bolt already answered this question.
//
// ⛔ "60% SPEED" IS A RATIO OF THE PLAYER'S SHOT (GDD 14.6): C.MIMIC_SHOT_RATIO
// / C.SHOT_TIME = 1.1538 depth/s. Never heat-scaled (H2), and C.MIMIC_APEX is
// bounded so every reflection gives at least C.SURGE_TELEGRAPH of flight to the
// kill band (00-config.js has the arithmetic).
//
// ⛔ NOT SHOOTABLE, and that is the bolt's ⚠ SETTLED answer inherited rather
// than re-decided: a reflected shot is DODGED, not answered. Rotating out of
// the lane is the reply, and there is no second one. It briefly shields
// whatever is behind it for the few steps of overlap, because collideShots()'s
// `break` is unconditional — the bolt's shipped behaviour, and not a bug.
//
// ⛔ NOT A DIVE SURVIVOR (GDD 6.5's seventh wiring point): `blocksClear` false
// and not `anchored` makes it the second entity that can be airborne when a
// dive starts, and startDive() filters the board down to `anchored` survivors,
// so the answer is the bolt's — no.
class MimicShot extends WeaverBolt {
  // `dir` is ignored: it travels the lane it was reflected in. The draw is
  // still spent by spawnEnemy(), the bolt's case.
  constructor(lane, depth) {
    super(lane, depth);
    this.sfxVoice = "mimicShot";   // C.SFX_KILL_PITCH.mimicShot, from tools/sfx-lab.html
  }

  // ⛔ The one override that makes it a variant (MI2). The bolt's update() is
  // inherited unedited and reads this.
  speed() { return C.MIMIC_SHOT_RATIO / C.SHOT_TIME; }

  // ⛔ "Colour-shifted, larger" (GDD 14.6): the PLAYER'S STREAK, turned — drawn
  // at C.MIMIC_SHOT_LEN x C.SHOT_LEN and C.MIMIC_SHOT_WIDTH x laneLineWidth, in
  // C.MIMIC_COLOR. That it is the player's own mark is the whole read.
  draw(ctx, well) {
    drawMimicShot(ctx, well, this.lane, this.depth);
  }

  // ⛔ points() is the bolt's 0, by inheritance and on purpose: GDD 7 has no row
  // for a reflected shot, and the only thing that destroys one is the Purge.
}

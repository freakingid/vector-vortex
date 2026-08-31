// 23-main.js — the loop and the state machine (GDD 2, 16.1).
//
// ⛔ FIXED TIMESTEP. The simulation only ever sees C.FIXED_DT. A frame's
// wall-clock dt decides how many steps run and nothing else, so behaviour does
// not change with refresh rate and a recorded input list replays exactly
// (GDD 17.1). Three guards, and each one exists because the naive loop fails
// without it:
//
//   dt clamp (C.DT_CLAMP_MAX)      a tab-switch stall is not a physics event
//   step cap (C.MAX_CATCHUP_STEPS) one slow frame cannot queue thirty updates
//   debt discard                   past the cap the surplus is DROPPED, never
//                                  banked — banking it makes the next frames
//                                  run their cap too, and that is the spiral
//                                  of death. Time dilates instead, which is
//                                  the honest failure mode.
//
// ⛔ update(dt) and draw() are separate, and update NEVER touches the canvas.
// The whole simulation has to run headless — that is what the test suite
// drives, and a single ctx call inside update takes that away.
//
// ⛔ ONE input path (GDD 9.5). Every device event in the build enters through
// 04-input.js. This file is what hands that module its tunables out of C, and
// it is the only file allowed to know both sides.

// ---------------------------------------------------------------------------
// THE WELL LIFECYCLE (GDD 2, 3.4, 4.3, 4.4). Five functions, one path.
// ---------------------------------------------------------------------------
//
// ⛔ EVERY ENTRY INTO A WELL GOES THROUGH enterWell(). A new run, the next
// level, the debug cycler, and the restart action all land here. In CS002 the
// debug cycler simply swapped a backdrop, which was harmless because nothing
// but the Skimmer existed; with enemies alive, cycling a 16-lane well to an
// 11-lane one strands craft on lanes the new well does not have.
//
// ⛔ AND EVERY SKIMMER IS MINTED BY spawnSkimmer(). Well entry and respawn are
// two callers of one line, not two lines that happen to agree today.

// ⛔ THE ONE PLACE A Skimmer IS CONSTRUCTED (GDD 4.1, 4.4). It deliberately
// does NOT touch state.invulnTime: enterWell() mints a craft that is fully
// vulnerable — a fresh run is never born invulnerable (02-state.js) — and only
// respawnSkimmer() arms the window.
function spawnSkimmer(well, lane) {
  state.skimmer = new Skimmer(well, lane);
  return state.skimmer;
}

// Arm the current well: nothing in flight, a fresh Purge charge, a fresh
// spawner, and a Skimmer that belongs to THIS well's lane count.
function enterWell() {
  const well = WELLS[state.wellIndex];

  // ⛔ Cleared, not filtered. Both arrays belong to the well being left, and
  // an enemy's lane is only meaningful against the well it was spawned into.
  state.enemies = [];
  state.shots = [];
  // Starts AT the threshold — already expired — so the first shot in a well
  // never waits out a cooldown that did not elapse (06-shots.js's rule).
  state.shotCooldown = C.SHOT_COOLDOWN;

  // GDD 4.3: one charge per well, recharged on entry, ⛔ never accumulated —
  // the count goes back to zero rather than gaining a use.
  //
  // ⛔ state.purgeLatched is deliberately NOT touched. It is not well state; it
  // is "the button was held last step", and clearing it here would let a player
  // who is still holding the button from the previous well spend the new
  // charge on the entry step without ever releasing (09-collision.js).
  state.purgeUses = 0;

  resetSpawner(state);

  // ⛔ Where CS003 P2's one-line hold reset sat, and for the same reason: a
  // well being armed is by definition not a well being dived out of. It is
  // also how the dive's END puts its own state back — updateDive() calls
  // nextWell(), which lands here — so there is one writer of state.dive outside
  // 11-dive.js's own step, and the `w` debug cycler gets the same treatment
  // without knowing a Dive exists.
  resetDive(state);

  // A craft for this well. ⛔ Minted rather than carried over: lane counts
  // differ between wells, so the outgoing craft's lane may not exist here.
  // ⛔ state.lives is NOT touched — the reserve belongs to the run, not to the
  // well, and re-arming it here would make every level a fresh set of three.
  // startGame() is what restores it, out of newState().
  spawnSkimmer(well, 0);
}

// ---------------------------------------------------------------------------
// THE RESPAWN (GDD 4.4). ⛔ THE FIRST LIVE STEP AFTER THE FREEZE.
// ---------------------------------------------------------------------------
//
// ⛔ NOT A TIMER STARTED AT DEATH. update() does not run during hit-stop, so
// anything killSkimmer() scheduled would sit unadvanced for the whole 1.2 s.
// The trigger is the state itself: the step that finds `skimmer.dead` IS the
// respawn step. That also makes the sequence independent of how long the
// freeze was, and correct for a headless caller that drives update() directly
// and never freezes at all.
//
// ⛔ AND THE RIM PUSH HAPPENS HERE, NOT AT DEATH. Pushing at death teleports
// the killing enemy away during the freeze the player is staring at, and the
// freeze is there to show them what happened.
// ⛔ `lane` IS OPTIONAL AND THE DEFAULT IS GDD 4.4's RULE. Omitted, the craft
// comes back in the lane it died in — read before the craft is replaced, and
// not the well's default lane. The Dive is the one caller that passes it
// (11-dive.js): a dive death respawns in the nearest THORN-FREE lane, because
// the lane it died in still holds the Thorn that killed it and the naive
// respawn burns a life every C.RESPAWN_INVULN until the run ends. That is a
// different LANE, not a different respawn — everything below is shared.
function respawnSkimmer(state, well, lane) {
  if (lane === undefined) lane = state.skimmer.lane;

  // ⚠ SETTLED — Paul, 2026-08-30. This reads broader than GDD 4.4's wording and
  // is meant to. Do not narrow it to a rim band in the session you notice it.
  //
  // ⛔ GDD 4.4: "enemies at the rim are pushed to C.RESPAWN_PUSH_DEPTH on
  // respawn so the player is never killed on re-entry". Written as a CLAMP —
  // everything above the push depth comes down to it, in every lane — and not
  // as a narrow band around the rim. The narrow reading leaves a Vaulter at
  // 0.9 climbing into the kill band well inside the invulnerability window,
  // which is the exact death the rule exists to prevent; 0.55 is chosen so the
  // climb back up outlasts C.RESPAWN_INVULN. A clamp is also monotonic — it
  // can never move an entity TOWARD the rim.
  //
  // ⚠ SETTLED, second half — Paul, CS004 P1. The clamp applies to entities
  // whose `depth` is a POSITION, which is every enemy in the roster but one.
  // ⛔ An `anchored` entity's `depth` is a LENGTH — the tip of an extent rooted
  // at the throat (07-enemies.js) — and clamping a length is not a push, it is
  // a free chip: every player death would permanently shorten every Thorn past
  // 0.55, silently, in the one place nobody would look. The band above is
  // UNCHANGED and is not narrowed by this; the skip is about WHICH ENTITIES
  // the clamp means anything for, not about how far down it reaches.
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.anchored) continue;
    if (e.depth > C.RESPAWN_PUSH_DEPTH) e.depth = C.RESPAWN_PUSH_DEPTH;
  }

  spawnSkimmer(well, lane);

  // ⛔ THE ONE PLACE THE INVULNERABILITY WINDOW IS ARMED. Zero, counting up
  // toward C.RESPAWN_INVULN (GDD 16.3). state.purgeLatched is deliberately NOT
  // cleared — killSkimmer() set it so a button held across the freeze needs a
  // real release before it spends another charge (09-collision.js).
  state.invulnTime = 0;
}

// The next level. ⛔ GDD 3.4's shapeIndex — the well is derived from the level
// clock and is never advanced independently, so there is exactly one clock
// (CLAUDE.md, Config) and level 17 is the Ring again.
//
// ⛔ PAST C.BAND_RNG_LEVEL THE SHAPE AND THE COLOUR COME FROM THE RUN'S STREAM
// (GDD 3.6). The band table has no row above 99 and the modulo walk has nothing
// left to teach after six trips round sixteen shapes, so level 100 onward draws
// both. ⚠ `state.level` itself does NOT hold — see 02-state.js; what holds is
// the derived table.
//
// ⛔ EXACTLY TWO DRAWS, AND ONLY PAST THE BOUNDARY. state.rng is the run's ONE
// stream (01-rng.js), so a draw spent below level 100 would move every spawn
// lane in every run — including test-cs004-p1.js's golden sequence and GDD 17
// item 1's replay hash. The `else` branch spends nothing, exactly as it did
// before this branch existed.
//
// ⛔ HERE, AND NOT IN enterWell(). enterWell() has three callers and one of them
// is the `w` debug key (runAction below); a draw there would let a keypress move
// the run's stream, which is precisely why "w" is on the FORBIDDEN list of three
// closed soaks. A stream that a debug key can shift is a determinism bug whose
// symptom reads as a physics bug.
function nextWell() {
  state.level += 1;
  if (state.level > C.BAND_RNG_LEVEL) {
    state.wellIndex = rngInt(state.rng, WELLS.length);
    state.bandRoll  = state.rng();
  } else {
    state.wellIndex = (state.level - 1) % WELLS.length;
  }
  enterWell();
}

// Begin a run. `seed` is optional: a run without one takes a time-derived seed
// and RECORDS it in state.seed, which is what makes any run replayable after
// the fact (GDD 17.1) — the stream is only ever built from state.seed, never
// from a second source.
//
// ⛔ Run state is reset from newState(), 02-state.js's one field list, so a
// field added there is reset here without this function being touched.
function startGame(seed) {
  Object.assign(state, newState());
  state.seed = (seed === undefined || seed === null) ? (Date.now() >>> 0) : (seed >>> 0);
  state.rng = mulberry32(state.seed);
  state.wellIndex = (state.level - 1) % WELLS.length;
  enterWell();
}

// ---------------------------------------------------------------------------
// THE LANE-LIGHTING PRODUCER (GDD 3.7, 10.2, 17). CS006 P4.
// ---------------------------------------------------------------------------
//
// drawWell()'s `laneState` parameter has existed unwired since CS001 P3; this
// is what fills it. ⛔ THE RENDERER IS UNCHANGED — the consumer already handles
// all three flags, the closed-wrap and open-end spoke neighbours, and a `null`
// argument. This file is the producer and nothing else.
//
// ⛔ AND THE PRODUCER IS GATED TO THE DIM BAND. Read the alpha arithmetic in
// 13-render-well.js before removing the gate: a lit spoke draws at
// `Math.max(baseAlpha, C.LANE_LIT_ALPHA)`, and outside levels 65-80 baseAlpha
// is 1.0 against a LANE_LIT_ALPHA of 0.9 — `max(1.0, 0.9)` is 1.0, which is
// EXACTLY the unlit alpha. Lane lighting is visible in sixteen levels out of
// ninety-nine, GDD 3.7 is ⚠ SETTLED that no tuning time is spent on that band,
// and an unconditional per-frame per-lane pass would spend the perf budget on
// a provable no-op for the other eighty-three. The gate is `wellBaseAlpha(...)
// < 1` — derived from the same function the renderer uses, so the two can
// never disagree about where the band is.
//
// ⛔ NOTHING HERE SPENDS AN RNG DRAW (CLAUDE.md, Math and lifecycle;
// RATIONALE.md#draw-path-rng). It reads state.enemies and state.shots and
// computes; draw() runs on a frame clock and update() does not.
//
// ⛔ NO PER-FRAME ALLOCATION (GDD 17's perf budget). One module-level array of
// C.LANE_LIT_MAX_LANES entry objects, cleared and refilled in place. It is
// returned by reference, so a caller that wants to keep a frame's lighting
// must copy it — drawWell reads it within the call and does not.
const _laneState = (function () {
  const a = new Array(C.LANE_LIT_MAX_LANES);
  for (let i = 0; i < a.length; i++) {
    a[i] = { occupied: false, shotTravel: false, surgeCharge: false };
  }
  return a;
})();

// ⛔ EVERY SLOT IS CLEARED, NOT JUST THE CURRENT WELL'S LANES, and that is a
// correctness rule rather than tidiness. 13-render-well.js's spoke loop indexes
// `laneState[lanes]` on an OPEN well — its last spoke starts no lane — and
// relies on that read being falsy. With a sparse array it read `undefined`; with
// a preallocated one it reads a real entry, so a stale `true` left there by a
// wider well would light an end spoke on a narrower one, intermittently.
function buildLaneState(state, well) {
  for (let i = 0; i < _laneState.length; i++) {
    const s = _laneState[i];
    s.occupied = false;
    s.shotTravel = false;
    s.surgeCharge = false;
  }

  const lanes = well.lanes < _laneState.length ? well.lanes : _laneState.length;
  const enemies = state.enemies;
  const shots = state.shots;

  // ⛔ CONTAINMENT IS `|laneDelta| < 1`, VIA THE WRAP-AWARE HELPER (GDD 3.2,
  // 3.5) — never a bare `lane - i`, which is off by the whole well across the
  // seam of a closed one. Strict `< 1` means an entity sitting on a lane centre
  // lights that lane alone, while one on the boundary LATTICE (a riding
  // Drifter, at lane 0.5) lights both lanes it is between, which is what the
  // player sees.
  for (let i = 0; i < lanes; i++) {
    const s = _laneState[i];

    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (e.dead) continue;
      if (Math.abs(laneDelta(well, i, e.lane)) >= 1) continue;
      s.occupied = true;
      // ⛔ THE TELEGRAPH DOES NOT MOVE HERE — this sets the SPOKES, and
      // drawSurgeLane() (14-render-entities.js) still paints the progressive
      // throat->rim fill inside them. They are two marks, and isLaneLit() is a
      // boolean that could not express the second one. GDD 6.3.
      if (e instanceof Surger && (e.phase === "telegraph" || e.phase === "discharge")) {
        s.surgeCharge = true;
      }
    }

    for (let j = 0; j < shots.length; j++) {
      const sh = shots[j];
      if (sh.dead) continue;
      if (Math.abs(laneDelta(well, i, sh.lane)) >= 1) continue;
      s.shotTravel = true;
      break;
    }
  }

  return _laneState;
}

const Game = (function () {

  let canvas = null;
  let ctx = null;

  let accumulator = 0;   // s of unspent wall-clock time
  let lastMs = 0;        // timestamp of the previous frame
  let running = false;
  let rafHandle = 0;

  // Hit-stop: simulation time is frozen, rendering is not (GDD 10). ⛔ THE ONE
  // FREEZE MECHANISM IN THE BUILD. killSkimmer() (09-collision.js) is its only
  // caller today, for C.HIT_STOP_DEATH; anything else that wants to freeze the
  // simulation calls hitStop() rather than growing a second one.
  let hitStopLeft = 0;

  // ⛔ Counter-based, never wall-clock — frame-budget gates in the suite read
  // these (CLAUDE.md, Test rules).
  const stats = { frames: 0, ticks: 0, lastSteps: 0, accumulator: 0 };

  // ⛔ The kit boundary: 04-input.js reads no game global, so every tunable it
  // needs is handed over here, from C. Verbose on purpose — it is the one
  // thing that makes that module extractable (CLAUDE.md, Kit modules).
  const input = createInput({
    mouseSens:        C.MOUSE_SENS,
    keyTapMs:         C.KEY_TAP_MS,
    keySpeedMin:      C.KEY_SPEED_MIN,
    keySpeedMax:      C.KEY_SPEED_MAX,
    keyRamp:          C.KEY_RAMP,
    pointerLockOffer: C.POINTER_LOCK_OFFER,
    touchSens:        C.TOUCH_SENS,
    touchZoneFrac:    C.TOUCH_ZONE_FRAC,
    touchAutofire:    C.TOUCH_AUTOFIRE,
    touchButtonR:     C.TOUCH_BUTTON_R,
    gamepadDeadzone:  C.GAMEPAD_DEADZONE,
    gamepadSens:      C.GAMEPAD_SENS,
    inputMirror:      C.INPUT_MIRROR,
    worldW:           C.WORLD_W,
    worldH:           C.WORLD_H,
    // ⛔ NAMED ACTIONS, NEVER A SECOND LISTENER (GDD 9.5). See runAction().
    //
    // ⛔ DIGITS, and that is not a style choice. "r" takes a time-derived seed
    // and "w" cycles the well out from under the level clock, so
    // test-cs003-p5.js's recorded input list deliberately presses neither; a
    // new binding that collided with either would move the determinism hash
    // and the failure would read as a physics bug. The digits collide with
    // nothing in INPUT_KEYS_DEFAULT either (04-input.js).
    actionKeys:       {
      cycleWell:    ["w"],
      restart:      ["r"],
      spawnVaulter: ["1"],
      spawnCarrier: ["2"],
      spawnWeaver:  ["3"],
      spawnThorn:   ["4"],
      spawnDrifter: ["5"],
      spawnSurger:  ["6"],
      spawnRow:     ["0"],
    },
    onAction:         runAction,
  });

  // THE DEBUG BENCH. ⛔ NOT ⚠ TEMPORARY, AND CS007 P3 IS WHERE IT STOPPED BEING
  // SO. It used to be paired with CS004's ⚠ TEMPORARY bench list in
  // 00-config.js, and GDD 8.1's introduction schedule was going to delete both.
  // It deleted that list and ⛔ deliberately kept these (Paul's H5 call,
  // PLANNED-FEATURES-CS007.md 4.3), because the two answer different questions
  // and only one of them is a difficulty question:
  //
  //   The deleted list asked "what does the well RELEASE" — which is difficulty,
  //     and C.SPAWN_SCHEDULE now owns it. A bench and a difficulty knob are
  //     never the same constant.
  //   These keys ask "put ONE of these on screen so I can LOOK at it" — which
  //     is a hardware-pass question, and the schedule neither addresses it nor
  //     can. Reaching level 23 to see a Surger Carrier is not a way to judge a
  //     silhouette.
  //
  // ⛔ The six enemy colours are still ⚠ provisional (GDD 6.1), PLAYTEST.md is
  // written around these keys, and `0` is the only way to see the palette
  // together. They ship until CS016 decides whether debug keys ship at all.
  //
  // ⛔ A kind that is not in ENEMY_KINDS yet is a NO-OP, not a throw:
  // spawnEnemy() returns null for an unknown kind, so a later phase lit one up
  // by adding a row to that table and touching nothing here. CS005 P3's `6` /
  // spawnSurger was the last one waiting, and it is live — ⛔ the roster is now
  // complete and no seventh digit is coming.
  //
  // ⛔ ONE KEY PER GDD 6.1 ROSTER ROW, and ⛔ THESE ARE ENEMY_KINDS STRINGS
  // RATHER THAN ROSTER NAMES — the Carrier is where the two stop coinciding.
  // GDD 6.2 gives it three variants and 08-spawner.js carries one row per
  // variant, so the bench key that shows "a Carrier" has to name one of them.
  // It names the only one CS004 built, and ⛔ CS005's two further variant rows
  // (carrierDrifter, carrierSurger) get no keys of their own: pressing 2 to see
  // a hull and a glyph is what this is for. Six roster keys plus the row is
  // where the bench stops; if a later changeset wants more, collapse it to a
  // select-and-spawn pair rather than growing the digits.
  const DEBUG_SPAWN_ACTIONS = {
    spawnVaulter: "vaulter",
    spawnCarrier: "carrierVaulter",
    spawnWeaver:  "weaver",
    spawnThorn:   "thorn",
    spawnDrifter: "drifter",
    spawnSurger:  "surger",
  };

  // The Classic roster in GDD 6.1's order, which is also the order they are
  // introduced. `spawnRow` exists for exactly one job: putting the whole
  // palette on screen at once, so the six ⚠ provisional colours can be judged
  // against each other and against the band in a single look. ⛔ It has listed
  // all six since CS004 P1 and the stagger was always computed on n = 6, so
  // CS005 grew the row from four kinds to six without an edit here.
  const DEBUG_ROW_KINDS = ["vaulter", "carrierVaulter", "weaver", "thorn", "drifter", "surger"];

  // One of every Classic kind, consecutive lanes, staggered depths.
  //
  // ⛔ Through spawnEnemy(), like everything else, so the row inherits the cap
  // and GDD 6.3's safe-spawn rule rather than re-implementing them. The
  // stagger spreads the row from the throat up to C.SAFE_SPAWN_DEPTH — the
  // deepest a spawn is ever allowed to arrive in the player's lane — so the
  // row is legible end to end and never lands on top of the craft. Lanes are
  // laneNormalize()'d inside spawnEnemy, so on an open well a row started near
  // a wall stacks against it; rotate and press it again.
  function spawnRow() {
    if (!state.skimmer) return;
    const base = Math.round(state.skimmer.lane);
    const n = DEBUG_ROW_KINDS.length;
    for (let i = 0; i < n; i++) {
      spawnEnemy(DEBUG_ROW_KINDS[i], base + i, (i / n) * C.SAFE_SPAWN_DEPTH);
    }
  }

  // Named debug actions, delivered by the input module in simulation order.
  //
  // ⛔ Well-cycling used to be a keydown listener of its own inside
  // 13-render-well.js, standing up a preview before there was a loop. Two
  // input paths is exactly the failure GDD 9.5 exists to prevent, and it does
  // not announce itself — it shows up as an input that works everywhere except
  // one screen. The listener is gone; this is the only route in.
  function runAction(name) {
    if (name === "cycleWell") {
      state.wellIndex = (state.wellIndex + 1) % WELLS.length;
      // ⛔ Through the one path. A raw index swap leaves the previous well's
      // enemies on lanes the new well may not have.
      enterWell();
    }
    if (name === "restart") {
      // The game-over stop, undone (GDD 4.4). ⛔ THROUGH THE SAME NAMED-ACTION
      // PATH as cycleWell, and for a sharper reason: a keydown listener of its
      // own would be a second input path (GDD 9.5), and this action has to work
      // on a screen where update() returns early and during a freeze where it
      // does not run at all — precisely the cases a listener gets wrong. Named
      // actions are dispatched from input.sample(), which runs in both.
      //
      // CS008 owns the real restart flow; this is the debug key that makes the
      // stop observable and recoverable while there is no game-over screen.
      startGame();
      // ⛔ The player reaches for restart DURING the death freeze more often
      // than after it. A fresh run must not inherit the remainder of the freeze
      // that ended the previous one — startGame() cannot clear it (hitStopLeft
      // is private to the loop), so it is cleared here, at the one call site.
      hitStopLeft = 0;
    }

    // ⚠ TEMPORARY — the debug bench. ⛔ Through spawnEnemy(), the one entry
    // point (GDD 6.5): the bench inherits the safe-spawn rule and C.ENEMY_CAP
    // exactly as the interval spawner does, and a bench that pushed straight
    // into state.enemies would be the second way in that the one entry point
    // exists to prevent.
    const kind = DEBUG_SPAWN_ACTIONS[name];
    if (kind !== undefined && state.skimmer) spawnEnemy(kind, state.skimmer.lane, 0);
    if (name === "spawnRow") spawnRow();
  }

  function nowMs() {
    if (typeof performance !== "undefined" && performance && performance.now) return performance.now();
    return Date.now();
  }

  // ---- simulation ----------------------------------------------------------

  // ⛔ Never touches the canvas. Runs headless, always.
  function update(dt) {
    // ⛔ ABOVE THE STOP, DELIBERATELY. This is the one input path (GDD 9.5) and
    // it is also where named actions are dispatched, so the `restart` key still
    // reaches runAction() on a screen where everything below returns early.
    input.sample(dt, state.input);

    // ⛔ THE GAME-OVER STOP (GDD 4.4). Lives at zero and the gameplay systems
    // stop stepping: no simulation clock, no entity pass, no spawner, no
    // collision, no level advance. This is a STOP, not a screen — CS008 owns
    // the game-over UI, the score submission and the restart flow, and the
    // build deliberately has nothing to show here yet. draw() is unaffected, so
    // the frozen board and the craft that died on it stay on screen.
    if (state.screen === "gameover") return;

    state.time += dt;

    // reset() writes 02-state.js's shipped defaults, which put `skimmer` back
    // to null — no well has been entered. The first step after one enters the
    // current well, rather than minting a lone craft beside a well that was
    // never armed. ⛔ Still the one path (enterWell); boot goes through
    // startGame().
    if (!state.skimmer) enterWell();

    const well = WELLS[state.wellIndex];

    // ⛔ THE DIVE SHORT-CIRCUITS THE WHOLE GAMEPLAY PASS (GDD 5; 11-dive.js).
    // During a dive there is no spawner, no entity pass, no Purge, no collision
    // pass and no well-clear check — updateDive() runs the respawn aftermath,
    // the craft's rotation, the beat and GDD 4.5 item 5's strike, and nothing
    // else. This replaced CS003 P2's between-wells hold branch, which sat at the
    // FOOT of this function and fell through everything above it; a dive that
    // sat there would still be spawning enemies into a well the player has left.
    //
    // ⛔ BELOW THE GAME-OVER STOP, so a dive death that ends a run stops the
    // dive too and the frozen board stays on screen (GDD 4.4).
    // ⛔ And below `const well`, because the dive reads the OUTGOING well —
    // nextWell() is called at its end, never before it.
    if (state.dive.active) { updateDive(state, well, dt); return; }

    // ⛔ THE DEATH AFTERMATH, BEFORE ANYTHING MOVES. Reaching this line with a
    // dead craft means the freeze killSkimmer() started has ended (or a
    // headless caller never froze at all), so THIS is the first live step and
    // THIS is where the respawn and GDD 4.4's rim push happen — never on a
    // timer started at death, which would not have advanced.
    //
    // ⛔ The invulnerability clock is the ELSE branch, so the respawn step
    // itself is not also aged: state.invulnTime is then exactly the simulation
    // time elapsed since the respawn, and the window is exactly
    // C.RESPAWN_INVULN long rather than one step short of it. It counts UP and
    // HOLDS at the threshold (GDD 16.3).
    if (state.skimmer.dead) respawnSkimmer(state, well);
    else if (state.invulnTime < C.RESPAWN_INVULN) state.invulnTime += dt;

    state.skimmer.update(dt, well, state.input);
    updateShots(state, well, dt);

    // ⛔ The enemy pass, then the Purge, then the ONE collision pass, then the
    // end-of-frame filters — never a splice mid-loop (GDD 6.5). The spawner
    // runs AFTER the filters so the alive count it reads is this step's, not
    // last step's plus the dead.
    for (let i = 0; i < state.enemies.length; i++) state.enemies[i].update(dt, well, state);

    // ⛔ THE PURGE RESOLVES BEFORE COLLISION, and that is the whole point of a
    // panic button (GDD 4.3): a charge spent on the step an enemy arrives in
    // your lane actually saves you, because collision below skips what it just
    // killed. After collision it would be a button that works one step late.
    updatePurge(state);
    updateCollisions(state, well);

    // Both arrays, because the one pass above can kill either side. A shot the
    // collision consumed frees its slot against C.SHOT_MAX THIS step (GDD 4.2's
    // chip-away economy), not next.
    state.enemies = state.enemies.filter(e => !e.dead);
    state.shots = state.shots.filter(s => !s.dead);
    updateSpawner(state, well, dt);

    // ⛔ A CLEARED WELL ENTERS THE DIVE (GDD 5). It does NOT call nextWell():
    // startDive() clears the shots and filters the board down to `anchored`
    // survivors, and nextWell() is reached only from the dive's END, in
    // updateDive() (11-dive.js). One step of the dive runs on the NEXT step —
    // the branch above — never a second pass through this function.
    if (wellCleared(state)) startDive(state);
  }

  // ---- presentation --------------------------------------------------------

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);
    const well = WELLS[state.wellIndex];
    // ⛔ state.bandRoll, NEVER state.rng(). The renderer is handed a value the
    // simulation already drew (02-state.js; CLAUDE.md, Math and lifecycle) —
    // draw() runs once per FRAME while update() runs zero to
    // C.MAX_CATCHUP_STEPS times, and during hit-stop it runs zero, so a draw
    // here would make the run's stream a function of refresh rate.
    // ⛔ GATED TO THE DIM BAND (GDD 3.7). Outside levels 65-80 a lit spoke and
    // an unlit one draw at the same alpha — see buildLaneState() above — so the
    // producer would be a per-frame no-op. drawWell() already handles null.
    const lit = wellBaseAlpha(state.level) < 1 ? buildLaneState(state, well) : null;
    drawWell(ctx, well, state.level, lit, state.bandRoll);
    // Z-order: the well is the backdrop, enemies climb over it, shots travel
    // over them, and the Skimmer — always at depth 1, the rim — rides on top
    // of everything. Shots above enemies so a shot is never lost behind the
    // thing it is about to hit (GDD 1.1 P2). The
    // guards are for a draw that lands before the first update — boot, and the
    // frozen branch of a hit-stop that began on frame one.
    for (let i = 0; i < state.enemies.length; i++) state.enemies[i].draw(ctx, well);
    for (let i = 0; i < state.shots.length; i++) state.shots[i].draw(ctx, well);
    // ⛔ The respawn blink is a DRAW-TIME decision and nothing else (GDD 4.4).
    // The craft is fully simulated on the frames it is not painted; skipping
    // its update instead would be a control dropout, which is pillar P1's one
    // unforgivable failure. A dead craft still draws — the freeze exists to
    // show the player what happened to it.
    if (state.skimmer && skimmerBlinkVisible(state.invulnTime)) {
      state.skimmer.draw(ctx, well);
    }
  }

  // ---- the frame -----------------------------------------------------------

  function frame(tMs) {
    let dt = (tMs - lastMs) / 1000;
    lastMs = tMs;
    if (!(dt > 0)) dt = 0;                       // first frame, or a clock that went back
    if (dt > C.DT_CLAMP_MAX) dt = C.DT_CLAMP_MAX;
    accumulator += dt;

    let steps = 0;
    while (accumulator >= C.FIXED_DT && steps < C.MAX_CATCHUP_STEPS) {
      accumulator -= C.FIXED_DT;
      steps++;
      if (hitStopLeft > 0) {
        // Frozen: the step is SPENT, not simulated. Draining the accumulator
        // here is what makes hit-stop cost nothing when it ends — the
        // alternative banks the whole freeze and pays it back as a lurch.
        hitStopLeft -= C.FIXED_DT;
        if (hitStopLeft < 0) hitStopLeft = 0;
        // Devices are still drained so a freeze does not dump a second of
        // accumulated mouse motion into the first live step after it.
        input.sample(C.FIXED_DT, state.input);
        continue;
      }
      update(C.FIXED_DT);
      stats.ticks++;
    }

    // ⛔ Any debt past one step is dropped. Only reachable via the step cap;
    // after a normal frame the accumulator is already below FIXED_DT.
    if (accumulator > C.FIXED_DT) accumulator = 0;

    stats.frames++;
    stats.lastSteps = steps;
    stats.accumulator = accumulator;

    draw();
  }

  function rafFrame(tMs) {
    if (!running) return;
    frame(typeof tMs === "number" ? tMs : nowMs());
    rafHandle = requestAnimationFrame(rafFrame);
  }

  // ---- lifecycle -----------------------------------------------------------

  function init(env) {
    const e = env || {};
    const doc = e.document || (typeof document !== "undefined" ? document : null);
    const win = e.window || (typeof window !== "undefined" ? window : null);
    canvas = doc && doc.getElementById ? doc.getElementById("c") : null;
    ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    input.attach({ window: win, document: doc, element: canvas });
    return api;
  }

  function start(tMs) {
    if (running) return;
    running = true;
    lastMs = typeof tMs === "number" ? tMs : nowMs();
    accumulator = 0;
    rafHandle = requestAnimationFrame(rafFrame);
  }

  function stop() {
    running = false;
    if (rafHandle && typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafHandle);
    rafHandle = 0;
  }

  // Freeze simulation time for `seconds`. Longest request wins; a shorter one
  // never cuts a freeze already running.
  function hitStop(seconds) {
    if (!(seconds > 0)) return;
    if (seconds > hitStopLeft) hitStopLeft = seconds;
  }

  // Shipped defaults, from 02-state.js's one field list. Used by the suite to
  // start every case from the same place.
  function reset() {
    Object.assign(state, newState());
    input.reset();
    accumulator = 0;
    lastMs = 0;
    hitStopLeft = 0;
    stats.frames = 0; stats.ticks = 0; stats.lastSteps = 0; stats.accumulator = 0;
  }

  const api = {
    init, start, stop, reset,
    frame, update, draw, hitStop,
    input, stats,
    get hitStopLeft() { return hitStopLeft; },
    get running() { return running; },
  };
  return api;
})();

// Boot. Guarded so the headless suite, which evaluates this file's top level
// with stubbed globals, starts a loop that never gets a frame rather than
// throwing for lack of a real canvas.
if (typeof window !== "undefined" && typeof document !== "undefined") {
  Game.init();
  // ⛔ The run begins here, not lazily inside update(). No argument, so the
  // seed is time-derived and recorded in state.seed. CS008's title screen is
  // what will eventually own this call.
  startGame();
  Game.start();
}

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
// ⛔ EVERY ENTRY INTO A WELL GOES THROUGH enterWell(). A new run (the menus'
// PLAY and RESTART rows), the next level and the debug cycler all land here. In CS002 the
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

  // ⛔ GDD 7's "no death" is per WELL, so it is re-armed with the Purge. A dive
  // death set it after the outgoing well's clear edge had already paid, and
  // this is where it stops counting against anything (12-scoring.js).
  state.diedThisWell = false;

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
  sfx("respawn");
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
//
// `opts` is the run's two parameters, `{ mode, startDepth }` (GDD 13, 4.6;
// CS008 P3), and either may be omitted. ⛔ OMITTED, THE RUN IS BIT-IDENTICAL TO
// THE BUILD BEFORE THEM: the defaults are newState()'s own "classic" and 1, and
// level 1 is exactly the level this function always started at. Every closed
// test calls startGame(seed).
//
// ⛔ THE LEVEL IS THE START DEPTH, AND THE WELL IS THE SAME MODULO nextWell()
// USES BELOW THE BOUNDARY. No draw is spent, and `bandRoll` stays newState()'s
// 0. ⚠ A start past C.BAND_RNG_LEVEL would get the modulo well and no colour
// roll — unreachable while C.START_DEPTH_CAP is 81, so this is not a past-99
// branch and must not grow one quietly (plan §1.12; STATUS.md).
//
// ⛔ NOTHING HERE VALIDATES opts. The list a player picks from is
// startDepthOptions() (22-meta.js); this is the mechanism under it.
function startGame(seed, opts) {
  Object.assign(state, newState());
  state.seed = (seed === undefined || seed === null) ? (Date.now() >>> 0) : (seed >>> 0);
  state.rng = mulberry32(state.seed);
  if (opts && opts.mode !== undefined) state.mode = opts.mode;
  if (opts && opts.startDepth !== undefined) state.startDepth = opts.startDepth;
  state.level = state.startDepth;
  state.wellIndex = (state.level - 1) % WELLS.length;
  enterWell();
  // ⛔ THE RUN'S START SEAT (CS011 P3, plan R7), last. It opens the run's meta
  // record outside `state` and drops one still open; it writes no `state`.
  Meta.runStarted();
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

// ---------------------------------------------------------------------------
// THE DANGER READ (GDD 11.4; CS010 P2, R7). The intensity director's ONE reader
// of the board. Top-level so a harness spy reaches it (a function inside Game's
// closure cannot be spied).
// ---------------------------------------------------------------------------
//
// ⛔ IT WRITES `out` AND NOTHING ELSE, and allocates nothing: the caller owns
// `out` and it is refilled in place every frame.
//   count      live non-anchored entities / C.INT_EXPECTED_ENEMIES, capped at 1
//   proximity  the deepest of them, 0 with none (D15)
//   peril      1 on the last life
//   heat       heatT(level), normalised at C.HEAT_FULL_LEVEL (D7). ⛔ Never the
//              curve itself: test-cs007-p2.js holds its call sites exact.
//   combo      0. Classic has no combo, ever (GDD 13; D6); CS012 supplies one.
// ⛔ A THORN IS NOT COUNTED: `anchored` means its depth is a LENGTH, not a
// position (CLAUDE.md). A Weaver bolt is a position, and counts.
function dangerInputs(state, out) {
  const list = state.enemies;
  let n = 0, near = 0;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (e.dead || e.anchored) continue;
    n++;
    if (e.depth > near) near = e.depth;
  }
  out.count = Math.min(n / C.INT_EXPECTED_ENEMIES, 1);
  out.proximity = Math.min(near, 1);
  out.peril = state.lives <= 1 ? 1 : 0;
  out.heat = heatT(state.level);
  out.combo = 0;
  return out;
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

  // ⛔ NAMED ACTIONS, NEVER A SECOND LISTENER (GDD 9.5). See runAction().
  //
  // ⛔ DIGITS, and that is not a style choice. "w" cycles the well out from
  // under the level clock, so the closed soaks' recorded input lists
  // deliberately never press it; a new binding that collided with it would
  // move the determinism hash and the failure would read as a physics bug.
  // The digits collide with nothing in INPUT_KEYS_DEFAULT either (04-input.js).
  // ⛔ "r" IS UNBOUND SINCE CS008 P5 (U2): its debug restart is deleted, and
  // game over's RESTART row is the one way to start a run again.
  const ACTION_KEYS = {
    // ⛔ THE MENUS' SECOND WAY BACK (U1; GDD 10.5). Purge is the first, read
    // off the struct; Escape is a named action because it is not one of the
    // four fields. On a menu it only QUEUES a back — the menu step consumes it,
    // so an Escape during game over's freeze acts on nothing. In play it
    // pauses (CS008 P6, below).
    back:         ["escape"],
    // ⛔ ESCAPE STAYS `back`, AND `back` IN PLAY IS A PAUSE (runAction). A key
    // maps to ONE action, and Escape has to mean pause in play and back in a
    // menu. `pause` and `autoPause` are what must NOT back out of a menu —
    // above all the page going hidden on the START DEPTH screen.
    pause:        ["p"],
    cycleWell:    ["w"],
    spawnVaulter: ["1"],
    spawnCarrier: ["2"],
    spawnWeaver:  ["3"],
    spawnThorn:   ["4"],
    spawnDrifter: ["5"],
    spawnSurger:  ["6"],
    spawnRow:     ["0"],
    // ⛔ THE TELEMETRY BENCH (GDD 15.6; 21-telemetry.js). CS007 P4. Two
    // actions, because there is no HUD and no Options screen until CS008 and
    // the debug bench is the only surface there is.
    //
    // ⛔ AND THESE ARE THE FIRST DEBUG KEYS THAT ARE SAFE INSIDE A HASHED RUN.
    // "w", the seven digits and the "r" CS008 P5 deleted are on three closed
    // soaks' FORBIDDEN list because each moved the run's stream or its clock; neither of these
    // touches the simulation at all — one flips a module-level boolean and one
    // reads the ring and writes to the console. That is the same claim
    // test-cs007-p4.js's headline assertion makes, from the other side, and it
    // is why the soaks' lists are correct WITHOUT these two.
    telemetryToggle: ["t"],
    telemetryExport: ["e"],
  };

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
    // ⛔ TAP-FIRE IS OFF AT CREATION, WHICH IS PLAY'S SETTING. syncScreen()
    // below is what turns it on, with auto-fire off, on every menu screen.
    touchTapFire:     false,
    // ⛔ THE FOUR OTHER WAYS TO PAUSE (U4; CS008 P6). Gamepad Start and the touch
    // target centred on the top edge are the same named action as `p`, which
    // TOGGLES (Paul, 2026-09-13). ⛔ The page going hidden is `autoPause` and
    // only ever pauses: a tab switched away twice must not un-pause. Escape is
    // the fifth, through `back`.
    gamepadActions:   { pause: [C.GAMEPAD_PAUSE_BUTTON] },
    touchTopAction:   "pause",
    hiddenAction:     "autoPause",
    actionKeys:       ACTION_KEYS,
    onAction:         runAction,
    // ⛔ THE AUDIO UNLOCK (CS009 P1). A browser opens audio output only inside
    // a key press, click or lifted touch, and kit-input is the one module that
    // may listen for those. ⚠ A pad-only player is silent until one of them.
    onGesture:        () => AudioSys.unlock(),
  });

  // ⛔ THE MENU MODEL (15-render-hud.js), handed its one tunable here, from C,
  // exactly as the input module is.
  const menu = createMenu({ rotateStep: C.MENU_ROTATE_STEP });

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
  // ⛔ The six enemy colours are still ⚠ provisional (GDD 6.1), SKIPPED-PLAYTESTS.md
  // names these keys, and `0` is the only way to see the palette
  // together. They ship until CS017 decides whether debug keys ship at all.
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
    // ⛔ THE BENCH FLAG (CS011 P3, plan R8; Paul's M6): a bench spawn or a well
    // cycle IN PLAY makes the run ineligible for both boards. `t` and `e` touch
    // no simulation and leave it eligible.
    if (state.screen === "play" &&
        (DEBUG_SPAWN_ACTIONS[name] !== undefined || name === "spawnRow" || name === "cycleWell")) {
      Meta.benchUsed();
    }
    if (name === "cycleWell") {
      state.wellIndex = (state.wellIndex + 1) % WELLS.length;
      // ⛔ Through the one path. A raw index swap leaves the previous well's
      // enemies on lanes the new well may not have.
      enterWell();
    }
    // ⛔ IN PLAY, ESCAPE PAUSES (U4); ON A MENU IT BACKS OUT (U1), and that back
    // is QUEUED, NEVER ACTED ON HERE. Named actions are dispatched from
    // input.sample(), which also runs inside a freeze, and the game-over menu
    // must be inert during the death freeze (GDD 10.5). A pause, by contrast,
    // must land inside a freeze (plan §7).
    if (name === "back") {
      if (state.screen === "play") pauseRun();
      // ⛔ An adjusting row takes Escape as its own exit (CS008 P7), never as a
      // back out of the page. A capture never sees Escape here: it swallows it.
      else if (adjusting !== null) adjusting = null;
      else menu.back();
    }
    // ⛔ `p` AND START TOGGLE, ON THE PAUSE SCREEN ONLY (Paul, 2026-09-13). On
    // OPTIONS or its pages they do nothing, so a press cannot jump out of one.
    if (name === "pause") {
      if (state.screen === "pause") resumeRun();
      else pauseRun();
    }
    // ⛔ The page going hidden is a telemetry seat (CS011 P2, plan R17). After the
    // pause, so a hidden run's step is a pause step, never a play step.
    if (name === "autoPause") { pauseRun(); Meta.saveTelemetry(); }

    // The debug bench. ⚠ THE ⚠ TEMPORARY MARKER THAT USED TO OPEN THIS LINE IS
    // GONE, and CS007 P3 is where it stopped being true — see DEBUG_SPAWN_ACTIONS
    // above for Paul's H5 call. Left here it would have read as covering the two
    // telemetry actions below it, which are not temporary either.
    // ⛔ Through spawnEnemy(), the one entry
    // point (GDD 6.5): the bench inherits the safe-spawn rule and C.ENEMY_CAP
    // exactly as the interval spawner does, and a bench that pushed straight
    // into state.enemies would be the second way in that the one entry point
    // exists to prevent.
    const kind = DEBUG_SPAWN_ACTIONS[name];
    if (kind !== undefined && state.skimmer) spawnEnemy(kind, state.skimmer.lane, 0);
    if (name === "spawnRow") spawnRow();

    if (name === "telemetryToggle") toggleTelemetry();
    if (name === "telemetryExport") exportTelemetry();
  }

  // ⛔ THE ONE TOGGLE AND THE ONE EXPORT, and the `t` / `e` keys and the OPTIONS
  // rows both call these (CS008 P6). CAPTURE IS OFF AT EVERY LAUNCH AND IS NEVER
  // PERSISTED (GDD 15.6): the OPTIONS row is a control surface over the same
  // module-level switch, not a settings store for it.
  // ⛔ THE ROWS ARE PERSISTED (CS011 P2, plan R17): turned on with an empty ring,
  // the profile's stored rows are read back; turned off, they are written. ⛔ NOT
  // FROM A PLAY STEP: `t` in play turns capture off and writes nothing, and the
  // rows are written at the next seat (autoPause, a switch, the run's end).
  function toggleTelemetry() {
    const on = Telemetry.toggle();
    if (on && Telemetry.count === 0) Meta.loadTelemetry();
    if (!on && state.screen !== "play") Meta.saveTelemetry();
    console.log("telemetry capture: " + (on ? "ON" : "off") +
                " (" + Telemetry.count + " rows)");
  }
  // ⛔ console.log, never an <a download> and never a fetch — see
  // 21-telemetry.js. It is the only export path that works on file://.
  // An empty ring exports the profile's stored rows (CS011 P2).
  function exportTelemetry() {
    if (Telemetry.count === 0) Meta.loadTelemetry();
    Telemetry.exportCsv();
  }

  // ⛔ PAUSE APPLIES ON "play" ONLY (plan §7) — a dive and a death freeze are
  // both play. Called from inside input.sample(), which also runs in the
  // freeze; update() notices the change right after the sample, and frame()
  // stops draining the freeze from the next step.
  function pauseRun() {
    if (state.screen === "play") state.screen = "pause";
  }

  // ⛔ THE ONE RESUME — the RESUME row, Purge and Escape (the pause screen's
  // back) and the `p` / Start toggle. INSTANT (U4): the next play step runs.
  // ⛔ AND THE PURGE IS RE-LATCHED, exactly as killSkimmer() re-latches it
  // across a freeze: Purge is how the pause menu backs out, so without this the
  // press that resumed would be a rising edge on the first play step and spend
  // the well's charge. A toggle dispatched inside sample() resumes on that same
  // step; the post-sample syncScreen() in update() sees it.
  function resumeRun() {
    if (state.screen !== "pause") return;
    state.screen = "play";
    state.purgeLatched = true;
  }

  // ---- screens and menus (GDD 10.5; CS008 P5) -------------------------------
  //
  // ⛔ SCREENS ARE DATA, and the menu model never sees `state` (15-render-hud.js).
  // The game owns this table and what each action name does; the model owns
  // the cursor and the edges. `back` is the row Purge and Escape take.
  // The five device actions the KEYBOARD and GAMEPAD pages rebind (plan §8).
  // Above SCREENS, which builds those pages' rows from it.
  const CONTROL_ACTIONS = ["left", "right", "fire", "purge", "jump"];
  const OPTIONS_TELEMETRY = { label: "TELEMETRY", detail: "OFF", enabled: true, action: "toggleTelemetry" };
  // CS011 P4 (plan R16). Its detail, the active profile's name, is written on
  // every title step in update(), so a rename or a switch shows on return.
  const TITLE_PROFILE = { label: "PROFILE", detail: "", enabled: true, action: "toProfiles" };
  const CTL_ROWS = {
    mouse:    { label: "MOUSE SENSITIVITY", detail: "", enabled: true, action: "adjust", adjust: "mouse" },
    touch:    { label: "TOUCH SENSITIVITY", detail: "", enabled: true, action: "adjust", adjust: "touch" },
    mirror:   { label: "LEFT-HANDED TOUCH", detail: "", enabled: true, action: "toggleMirror" },
    autofire: { label: "TOUCH AUTO-FIRE",   detail: "", enabled: true, action: "toggleAutofire" },
  };
  // CS009 P3 (Paul's A1). Row modes like the sensitivity rows; every detail is
  // written by refreshSoundRows(), in update().
  const SOUND_ROWS = {
    master: { label: "MASTER VOLUME", detail: "", enabled: true, action: "adjust", adjust: "master" },
    music:  { label: "MUSIC VOLUME",  detail: "", enabled: true, action: "adjust", adjust: "music" },
    sfx:    { label: "SFX VOLUME",    detail: "", enabled: true, action: "adjust", adjust: "sfx" },
    voice:  { label: "VOICE VOLUME",  detail: "", enabled: true, action: "adjust", adjust: "voice" },
    track:  { label: "MUSIC TRACK",   detail: "", enabled: true, action: "adjust", adjust: "track" },
  };
  const SCREENS = {
    title: { title: "VECTOR VORTEX", lines: [], back: null, items: [
      { label: "PLAY",    detail: "", enabled: true, action: "toMode" },
      { label: "OPTIONS", detail: "", enabled: true, action: "toOptions" },
      // ⛔ CS011's rows go AFTER OPTIONS (plan R16): the closed tests navigate the
      // title by index.
      { label: "SCORES",  detail: "", enabled: true, action: "toScores" },
      TITLE_PROFILE,
    ] },
    // ⛔ M1: OVERDRIVE is shown and cannot be chosen until CS012. GDD 13's
    // "Overdrive is the default highlight" waits for it too — the cursor
    // skips a disabled row, so CLASSIC is highlighted.
    mode: { title: "MODE", lines: [], back: "toTitle", items: [
      { label: "CLASSIC",   detail: "",       enabled: true,  action: "pickClassic" },
      { label: "OVERDRIVE", detail: "LOCKED", enabled: false, action: "pickOverdrive" },
    ] },
    // Rows rebuilt on entry from startDepthOptions(). ⛔ NO COUNTDOWN (GDD 4.6).
    depth: { title: "START DEPTH", lines: [], back: "toMode", items: [] },
    // Over the frozen board (U4). ⛔ RESUME IS INSTANT — no countdown (GDD 16.3).
    pause: { title: "PAUSED", lines: [], back: "resume", items: [
      { label: "RESUME",        detail: "", enabled: true, action: "resume" },
      { label: "OPTIONS",       detail: "", enabled: true, action: "pauseOptions" },
      { label: "QUIT TO TITLE", detail: "", enabled: true, action: "quitToTitle" },
    ] },
    // U5. Opened from the title or from pause, and BACK returns to whichever.
    // TELEMETRY's detail is written from the switch itself on every OPTIONS step
    // (update()), so `t` pressed here shows too — ⛔ never in draw(), which must
    // not name Telemetry (test-cs007-p4.js). \u26D4 The sound rows go AFTER CREDITS
    // (CS009 P3): above TELEMETRY they move the closed tests' row indices.
    options: { title: "OPTIONS", lines: [], back: "optionsBack", items: [
      OPTIONS_TELEMETRY,
      { label: "EXPORT",   detail: "TO CONSOLE", enabled: true, action: "exportTelemetry" },
      { label: "CONTROLS", detail: "\u203A",     enabled: true, action: "toControls" },
      { label: "CREDITS",  detail: "\u203A",     enabled: true, action: "toCredits" },
      SOUND_ROWS.master, SOUND_ROWS.music, SOUND_ROWS.sfx, SOUND_ROWS.voice, SOUND_ROWS.track,
      { label: "BACK",     detail: "",           enabled: true, action: "optionsBack" },
    ] },
    // U7 (CS008 P7). Every detail is written by refreshControlRows(), in update().
    controls: { title: "CONTROLS", lines: [], back: "backToOptions", items: [
      CTL_ROWS.mouse, CTL_ROWS.touch, CTL_ROWS.mirror, CTL_ROWS.autofire,
      { label: "KEYBOARD",          detail: "\u203A", enabled: true, action: "toKeyboard" },
      { label: "GAMEPAD",           detail: "\u203A", enabled: true, action: "toGamepad" },
      { label: "RESET TO DEFAULTS", detail: "",       enabled: true, action: "resetControls" },
      { label: "BACK",              detail: "",       enabled: true, action: "backToOptions" },
    ] },
    // Five device actions, two slots each. The one line is a refusal's reason.
    keyboard: { title: "KEYBOARD", lines: [""], back: "backToControls", items: slotRows() },
    gamepad:  { title: "GAMEPAD",  lines: [""], back: "backToControls", items: slotRows() },
    credits: { title: "CREDITS", lines: C.CREDITS_LINES.concat("VERSION " + C.GAME_VERSION),
               back: "backToOptions", items: [
      { label: "BACK", detail: "", enabled: true, action: "backToOptions" },
    ] },
    // CS011 P3 (plan R15). The local top 10 for CLASSIC, rebuilt on entry by
    // buildScoreRows(), ⛔ never in draw(). A row is enabled so rotate scrolls,
    // and has no action.
    scores: { title: "SCORES", lines: [], back: "toTitle", items: [] },
    // CS011 P4 (plan R12, R13, R16). PROFILE's rows are rebuilt on entry by
    // openProfiles(): one per profile, NEW PROFILE, BACK.
    profile: { title: "PROFILE", lines: [], back: "toTitle", items: [] },
    // One profile's page. Its title is that profile's name, written on entry.
    profilePage: { title: "", lines: [], back: "toProfiles", items: [
      { label: "SELECT", detail: "", enabled: true, action: "selectProfile" },
      { label: "RENAME", detail: "", enabled: true, action: "renameProfile" },
      { label: "DELETE", detail: "", enabled: true, action: "toDeleteProfile" },
      { label: "BACK",   detail: "", enabled: true, action: "toProfiles" },
    ] },
    // ⛔ NO FIRST (R12). The lines are the profile's name and a refusal's reason.
    profileDelete: { title: "DELETE", lines: ["", ""], back: "backToProfilePage", items: [
      { label: "NO",  detail: "", enabled: true, action: "backToProfilePage" },
      { label: "YES", detail: "", enabled: true, action: "deleteProfile" },
    ] },
    // NAME, for NEW PROFILE and RENAME. ⛔ NO ROWS: stepName() drives the wheel,
    // and refreshNameLines() writes the lines. `back` is Escape's cancel.
    profileName: { title: "", lines: [], back: "cancelName", items: [] },
    // Over the frozen board. Its three lines are filled per frame by draw(); the
    // third names the run's placing (CS011 P3), or is empty.
    gameover: { title: "GAME OVER", lines: ["", "", ""], back: "quitToTitle", items: [
      { label: "RESTART",       detail: "", enabled: true, action: "restartRun" },
      { label: "QUIT TO TITLE", detail: "", enabled: true, action: "quitToTitle" },
    ] },
  };

  // The mode the MODE screen chose, carried to the depth screen's startGame().
  // Not in state: no run exists yet, and startGame() rewrites state anyway.
  let pendingMode = "classic";

  // Where OPTIONS was opened from, "title" or "pause" — its BACK goes there.
  // Written by the two rows that open it; its sub-pages come back to OPTIONS.
  let optionsFrom = "title";

  // ⛔ A RUN IS ON SCREEN: play (the dive is play), pause, game over, and the
  // OPTIONS pages opened from pause. H4's HUD reads this, because a run exists
  // there; on the title's OPTIONS none does (Paul, 2026-09-13).
  function runOnScreen() {
    const s = state.screen;
    if (s === "play" || s === "pause" || s === "gameover") return true;
    return optionsFrom === "pause" && (s === "options" || s === "controls" || s === "credits" ||
                                       s === "keyboard" || s === "gamepad");
  }

  // ---- the CONTROLS page (GDD 9, 10.5; CS008 P7) ----------------------------
  //
  // ⛔ SAVED PER PROFILE since CS011 P2 (settingsSnapshot() below), on every
  // change and never from Game.reset(); quitToTitle() keeps it because it lives
  // outside `state`. The kit holds the live values; this
  // holds what the page shows — the sensitivity multipliers as whole steps, the
  // auto-fire SETTING (syncScreen() applies it in play only), and the bindings
  // as two slots per action, a slot being null when empty.
  const SENS_UNIT = Math.round(1 / C.SENS_STEP);             // steps in ×1.0
  const SENS_LO = Math.round(C.SENS_MIN_MULT / C.SENS_STEP);
  const SENS_HI = Math.round(C.SENS_MAX_MULT / C.SENS_STEP);
  const PAD_BUTTON_NAMES = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "BACK", "START",
                            "LS", "RS", "D-UP", "D-DOWN", "D-LEFT", "D-RIGHT", "HOME"];
  const controls = { mouse: SENS_UNIT, touch: SENS_UNIT, autofire: C.TOUCH_AUTOFIRE,
                     keys: toSlots(INPUT_KEYS_DEFAULT), pad: toSlots(GAMEPAD_BUTTONS_DEFAULT) };
  let adjusting = null;       // an ADJUST key while its row takes rotate (CS009 P3 generalised it)
  let adjustAcc = 0;
  let capturing = null;       // { page, bind, slot } while a slot waits for a press
  let pageNote = "";          // a refusal's reason, shown until the next capture
  let prevFire = false, prevPurge = false;   // the struct's levels at the last menu step
  const _neutral = { rotate: 0, fire: false, purge: false, jump: false };

  function slotRows() {
    const rows = [];
    for (let a = 0; a < CONTROL_ACTIONS.length; a++) {
      for (let slot = 0; slot < 2; slot++) {
        rows.push({ label: CONTROL_ACTIONS[a].toUpperCase() + " " + (slot + 1), detail: "", enabled: true,
                    action: "rebind", bind: CONTROL_ACTIONS[a], slot: slot });
      }
    }
    rows.push({ label: "BACK", detail: "", enabled: true, action: "backToControls" });
    return rows;
  }
  function toSlots(map) {
    const out = {};
    for (const a of CONTROL_ACTIONS) {
      const list = map[a] || [];
      out[a] = [list[0] === undefined ? null : list[0], list[1] === undefined ? null : list[1]];
    }
    return out;
  }
  function fromSlots(slots) {
    const out = {};
    for (const a of CONTROL_ACTIONS) out[a] = slots[a].filter(v => v !== null);
    return out;
  }
  function sensFor(base, steps) { return base * (steps / SENS_UNIT); }   // ⛔ ×1.0 is `base` exactly

  // ---- the sound rows on OPTIONS (GDD 10.5, 11.1; CS009 P3) -----------------
  //
  // ⛔ SAVED PER PROFILE since CS011 P2, exactly as `controls` is: outside
  // `state`, so quitToTitle() keeps them, and Game.reset() restores them
  // (resetSound()) and writes nothing. `track` is stored by NAME.
  // A volume is whole steps, 0..C.AUDIO_VOL_STEPS, and its gain is linear,
  // steps / STEPS (plan §0). `track` indexes C.MUSIC_TRACK_CHOICES.
  // ⛔ The VOICE row moves a bus nothing feeds (Paul's A3).
  const VOL_BUSES = ["master", "music", "sfx", "voice"];
  const sound = { master: C.AUDIO_VOL_DEFAULT, music: C.AUDIO_VOL_DEFAULT, sfx: C.AUDIO_VOL_DEFAULT,
                  voice: C.AUDIO_VOL_DEFAULT, track: 0 };
  function resetSound() {
    for (const bus of VOL_BUSES) {
      sound[bus] = C.AUDIO_VOL_DEFAULT;
      AudioSys.setVol(bus, sound[bus] / C.AUDIO_VOL_STEPS);   // held headless; a ramp with a context
    }
    sound.track = 0;
  }

  // ⛔ ONE ROW MODE, WHATEVER THE ROW (CS008 P7's, generalised by CS009 P3). A
  // row's `adjust` names its entry: the clamp range in whole steps, the value,
  // and what a new value does. `set` runs only when the clamped value moved.
  function volAdjust(bus) {
    return { lo: 0, hi: C.AUDIO_VOL_STEPS, get: () => sound[bus],
             set: n => { sound[bus] = n; AudioSys.setVol(bus, n / C.AUDIO_VOL_STEPS); } };
  }
  const ADJUST = {
    mouse:  { lo: SENS_LO, hi: SENS_HI, get: () => controls.mouse,
              set: n => { controls.mouse = n; input.configure({ mouseSens: sensFor(C.MOUSE_SENS, n) }); } },
    touch:  { lo: SENS_LO, hi: SENS_HI, get: () => controls.touch,
              set: n => { controls.touch = n; input.configure({ touchSens: sensFor(C.TOUCH_SENS, n) }); } },
    master: volAdjust("master"),
    music:  volAdjust("music"),
    sfx:    volAdjust("sfx"),
    voice:  volAdjust("voice"),
    // A change in play is heard at once: audioFrame() resolves the setting
    // every frame, and setState() crossfades on a new name.
    track:  { lo: 0, hi: C.MUSIC_TRACK_CHOICES.length - 1, get: () => sound.track,
              set: n => { sound.track = n; } },
  };

  // ⛔ THE ONE RESET: the RESET TO DEFAULTS row, and Game.reset() for the suite.
  function resetControls() {
    controls.mouse = SENS_UNIT;
    controls.touch = SENS_UNIT;
    controls.autofire = C.TOUCH_AUTOFIRE;
    controls.keys = toSlots(INPUT_KEYS_DEFAULT);
    controls.pad = toSlots(GAMEPAD_BUTTONS_DEFAULT);
    input.configure({ mouseSens: C.MOUSE_SENS, touchSens: C.TOUCH_SENS, inputMirror: C.INPUT_MIRROR });
    input.setBindings(fromSlots(controls.keys));
    input.setGamepadButtons(fromSlots(controls.pad));
    endControlModes();
  }
  // ---- what a profile keeps (CS011 P2; plan R10, R11) -----------------------
  //
  // The three callbacks Meta.boot() takes. ⛔ resetSettings() WRITES NOTHING: it is the
  // switch's reset, and Game.reset() is the same two calls.
  function resetSettings() {
    resetControls();
    resetSound();
  }

  function settingsSnapshot() {
    const pairs = slots => { const o = {}; for (const a of CONTROL_ACTIONS) o[a] = slots[a].slice(); return o; };
    return {
      controls: { mouse: controls.mouse, touch: controls.touch, autofire: controls.autofire,
                  mirror: input.setting("inputMirror"), keys: pairs(controls.keys), pad: pairs(controls.pad) },
      sound: { master: sound.master, music: sound.music, sfx: sound.sfx, voice: sound.voice,
               track: C.MUSIC_TRACK_CHOICES[sound.track] },
    };
  }

  // A stored page of two slots per action, or null. ⛔ WHOLE OR NOT AT ALL: every
  // action keeps a binding, no key is reserved (Start on a pad), nothing is
  // bound twice, and a key is lowercase as a capture delivers it.
  function validPage(page, keys) {
    if (page === null || typeof page !== "object" || Array.isArray(page)) return null;
    const out = {}, seen = new Set();
    for (const a of CONTROL_ACTIONS) {
      const pair = page[a];
      if (!Array.isArray(pair) || pair.length !== 2 || (pair[0] === null && pair[1] === null)) return null;
      for (const v of pair) {
        if (v === null) continue;
        const ok = keys ? typeof v === "string" && v !== "" && v === v.toLowerCase() && !reservedKey(v)
                        : Number.isInteger(v) && v >= 0 && v !== C.GAMEPAD_PAUSE_BUTTON;
        if (!ok || seen.has(v)) return null;
        seen.add(v);
      }
      out[a] = pair.slice();
    }
    return out;
  }

  // ⛔ KNOWN-VALUE-ELSE-DEFAULT, PER FIELD (plan R10). A field that is missing or
  // invalid is SKIPPED, so it keeps what the runtime holds: Meta resets to the
  // shipped defaults first, and without that reset a skipped field is the
  // outgoing profile's. Writes nothing.
  function applySettings(data) {
    const obj = v => v !== null && typeof v === "object" ? v : {};
    const c = obj(obj(data).controls), snd = obj(obj(data).sound);
    const whole = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    for (const k of ["mouse", "touch", "master", "music", "sfx", "voice"]) {
      const v = k === "mouse" || k === "touch" ? c[k] : snd[k];
      if (whole(v, ADJUST[k].lo, ADJUST[k].hi)) ADJUST[k].set(v);
    }
    if (typeof snd.track === "string" && C.MUSIC_TRACK_CHOICES.indexOf(snd.track) >= 0) {
      ADJUST.track.set(C.MUSIC_TRACK_CHOICES.indexOf(snd.track));
    }
    if (typeof c.autofire === "boolean") controls.autofire = c.autofire;
    if (typeof c.mirror === "boolean") input.configure({ inputMirror: c.mirror });
    // The kit validates too, and throws before writing: a page it refuses stays
    // at its defaults.
    const keys = validPage(c.keys, true), pad = validPage(c.pad, false);
    if (keys !== null) {
      try { input.setBindings(fromSlots(keys)); controls.keys = keys; } catch (err) { /* defaults */ }
    }
    if (pad !== null) {
      try { input.setGamepadButtons(fromSlots(pad)); controls.pad = pad; } catch (err) { /* defaults */ }
    }
  }

  function endControlModes() {
    if (capturing !== null) input.captureNext(null);
    capturing = null;
    adjusting = null;
    pageNote = "";
  }

  function keyName(k) {
    if (k === null) return "-";
    if (k === " ") return "SPACE";
    if (k.indexOf("arrow") === 0) return "ARROW " + k.slice(5).toUpperCase();
    return k.toUpperCase();
  }
  function buttonName(b) {
    if (b === null) return "-";
    return PAD_BUTTON_NAMES[b] !== undefined ? PAD_BUTTON_NAMES[b] : "BUTTON " + b;
  }

  // ⛔ REFUSED (plan §8, U8): every key that is a named action — Escape, `p`,
  // the debug keys, `t` and `e` — and every digit; on a pad, gamepad Start.
  function reservedKey(k) {
    if (/^[0-9]$/.test(k)) return true;
    for (const name of Object.keys(ACTION_KEYS)) if (ACTION_KEYS[name].indexOf(k) >= 0) return true;
    return false;
  }

  // Delivered by the kit inside input.sample(). ⛔ A refusal ENDS the capture
  // with its reason on the page (Paul, 2026-09-13), so Escape and Start double
  // as cancel. A clash SWAPS (U8); ⛔ a swap that would leave an action with no
  // key or button is refused (Paul, 2026-09-13).
  function onCaptured(result) {
    const c = capturing;
    capturing = null;
    if (c === null) return;
    const keys = c.page === "keyboard";
    const v = keys ? result.key : result.button;
    if (v === undefined) { pageNote = keys ? "PRESS A KEY" : "PRESS A BUTTON"; return; }
    const shown = keys ? keyName(v) : buttonName(v);
    if (keys ? reservedKey(v) : v === C.GAMEPAD_PAUSE_BUTTON) { pageNote = shown + " IS RESERVED"; return; }
    const slots = keys ? controls.keys : controls.pad;
    const next = {};
    for (const a of CONTROL_ACTIONS) next[a] = slots[a].slice();
    const old = next[c.bind][c.slot];
    for (const a of CONTROL_ACTIONS) {
      for (let i = 0; i < 2; i++) if (next[a][i] === v) next[a][i] = old;
    }
    next[c.bind][c.slot] = v;
    for (const a of CONTROL_ACTIONS) {
      if (next[a][0] === null && next[a][1] === null) {
        pageNote = a.toUpperCase() + (keys ? " NEEDS A KEY" : " NEEDS A BUTTON");
        return;
      }
    }
    if (keys) { controls.keys = next; input.setBindings(fromSlots(next)); }
    else { controls.pad = next; input.setGamepadButtons(fromSlots(next)); }
    pageNote = "";
    Meta.saveSettings();
  }

  // A step on a menu page while a row owns the input — CONTROLS' and its pages'
  // since CS008 P7, OPTIONS' sound rows since CS009 P3. ⛔ The menu still
  // steps, on a snapshot with no rotate and the real Fire and Purge levels,
  // and its answer is ignored: that keeps its edges current, so the press that
  // ends a mode is not a second press on the row once the menu has it back.
  function stepControlMode(screen) {
    const inp = state.input;
    const fireEdge = inp.fire && !prevFire, purgeEdge = inp.purge && !prevPurge;
    if (adjusting !== null) {
      adjustAcc += inp.rotate;
      const whole = Math.trunc(adjustAcc / C.MENU_ROTATE_STEP);
      if (whole !== 0) {
        adjustAcc -= whole * C.MENU_ROTATE_STEP;
        const a = ADJUST[adjusting];
        const n = Math.min(a.hi, Math.max(a.lo, a.get() + whole));
        if (n !== a.get()) { a.set(n); sfx("menuMove"); Meta.saveSettings(); }
      }
      if (fireEdge || purgeEdge) adjusting = null;           // ⛔ any exit keeps the value
    } else if (fireEdge || purgeEdge) {
      // Only a mouse button or a touch reaches here: a capture swallows keys
      // and pad buttons. It cancels.
      input.captureNext(null);
      capturing = null;
    }
    _neutral.fire = inp.fire;
    _neutral.purge = inp.purge;
    menu.step(screen, _neutral);
  }

  function refreshControlRows() {
    const mult = n => "\u00D7" + (n / SENS_UNIT).toFixed(1);
    CTL_ROWS.mouse.detail = adjusting === "mouse" ? "\u2039" + mult(controls.mouse) + "\u203A" : mult(controls.mouse);
    CTL_ROWS.touch.detail = adjusting === "touch" ? "\u2039" + mult(controls.touch) + "\u203A" : mult(controls.touch);
    CTL_ROWS.mirror.detail = input.setting("inputMirror") ? "ON" : "OFF";
    CTL_ROWS.autofire.detail = controls.autofire ? "ON" : "OFF";
    for (const page of ["keyboard", "gamepad"]) {
      const keys = page === "keyboard";
      const scr = SCREENS[page];
      scr.lines[0] = pageNote;
      const slots = keys ? controls.keys : controls.pad;
      for (let i = 0; i < scr.items.length; i++) {
        const row = scr.items[i];
        if (row.action !== "rebind") continue;
        if (capturing !== null && capturing.page === page && capturing.bind === row.bind && capturing.slot === row.slot) {
          row.detail = keys ? "PRESS A KEY" : "PRESS A BUTTON";
        } else {
          const v = slots[row.bind][row.slot];
          row.detail = keys ? keyName(v) : buttonName(v);
        }
      }
    }
  }

  function refreshSoundRows() {
    const shown = (k, s) => adjusting === k ? "‹" + s + "›" : s;
    for (const bus of VOL_BUSES) {
      SOUND_ROWS[bus].detail = shown(bus, Math.round(sound[bus] * 100 / C.AUDIO_VOL_STEPS) + "%");
    }
    SOUND_ROWS.track.detail = shown("track", C.MUSIC_TRACK_CHOICES[sound.track].toUpperCase());
  }

  function buildDepthRows() {
    const list = startDepthOptions();
    const rows = SCREENS.depth.items;
    rows.length = 0;
    for (let i = 0; i < list.length; i++) {
      rows.push({ label: "LEVEL " + list[i], detail: "BONUS " + startBonus(list[i]),
                  enabled: true, action: "startRun", value: list[i] });
    }
  }

  // SCORES' rows (CS011 P3, plan R15): `n NAME` and the score in plain digits,
  // then BACK. CLASSIC only until CS012 makes OVERDRIVE choosable.
  function buildScoreRows() {
    const list = Meta.scores("classic");
    const scr = SCREENS.scores;
    scr.lines.length = 0;
    scr.lines.push("CLASSIC \u00B7 LOCAL");
    if (list.length === 0) scr.lines.push("NO SCORES YET");
    scr.items.length = 0;
    for (let i = 0; i < list.length; i++) {
      const name = typeof list[i].profileName === "string" ? list[i].profileName : "";
      scr.items.push({ label: (i + 1) + " " + name, detail: String(list[i].score), enabled: true, action: null });
    }
    scr.items.push({ label: "BACK", detail: "", enabled: true, action: "toTitle" });
  }

  // ---- PROFILE, a profile's page, DELETE and NAME (GDD 10.5, 15.2; CS011 P4) --
  //
  // Reached from the title only, where no run exists (kit-profile: switch from
  // the title). ⛔ EVERY SWITCH IS Profiles.select() OR kit-profile's remove(),
  // so each runs P2's reset-then-load through Meta's handler. ⛔ Every screen
  // change here is a `state.screen` write that syncScreen() notices.
  let pageId = null;          // the profile whose page (and DELETE) is open
  let nameEdit = null;        // NAME's buffer: { rename: id or null, text, wheel, acc, note }
  const _still = { rotate: 0, fire: false, purge: false, jump: false };

  // A kit reason as a line: invalid_name → INVALID NAME, name_taken → NAME TAKEN,
  // roster_full → ROSTER FULL, last_profile → LAST PROFILE.
  function reasonLine(reason) { return String(reason).toUpperCase().replace(/_/g, " "); }

  function nameOfProfile(id) {
    const p = Profiles.list().find(q => q.id === id);
    return p ? p.name : "";
  }

  // Greedy word wrap to lines of at most `width` characters. A "\n" always
  // breaks, and a word longer than a line is cut, so the kit's notice fits
  // however it is reworded upstream (plan K8).
  function wrapLines(text, width) {
    const out = [];
    for (const para of String(text).split("\n")) {
      let line = "";
      for (let word of para.split(" ")) {
        while (word.length > width) {
          if (line !== "") { out.push(line); line = ""; }
          out.push(word.slice(0, width));
          word = word.slice(width);
        }
        if (line === "") line = word;
        else if (line.length + 1 + word.length <= width) line += " " + word;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  }
  // RENAME's notice (R14), wrapped once: the kit's string is a constant.
  const NOTICE_LINES = wrapLines(Profiles.NAME_CHANGE_NOTICE, C.NOTICE_WRAP);

  // PROFILE's rows, rebuilt on every entry, never in draw().
  function openProfiles() {
    const scr = SCREENS.profile, list = Profiles.list(), active = Profiles.current();
    scr.items.length = 0;
    for (const p of list) {
      scr.items.push({ label: p.name, detail: active && p.id === active.id ? "ACTIVE" : "", enabled: true,
                       action: "openProfile", id: p.id });
    }
    scr.items.push({ label: "NEW PROFILE", detail: "", enabled: list.length < C.PROFILE_MAX, action: "newProfile" });
    scr.items.push({ label: "BACK", detail: "", enabled: true, action: "toTitle" });
    state.screen = "profile";
  }

  function openProfilePage(id) {
    pageId = id;
    SCREENS.profilePage.title = nameOfProfile(id);
    state.screen = "profilePage";
  }

  // NAME starts EMPTY on NEW and on RENAME, with the wheel on its first entry.
  function openName(renameId) {
    nameEdit = { rename: renameId, text: "", wheel: 0, acc: 0, note: "" };
    SCREENS.profileName.title = renameId === null ? "NEW PROFILE" : "RENAME";
    refreshNameLines();
    state.screen = "profileName";
  }

  // The name so far and its cursor mark, the wheel, the reason, and on RENAME
  // the notice. Written in update() and on entry, ⛔ never in draw().
  function refreshNameLines() {
    const lines = SCREENS.profileName.lines;
    const entry = C.NAME_WHEEL[nameEdit.wheel];
    lines.length = 0;
    lines.push(nameEdit.text + "|", "‹ " + (entry === " " ? "SPACE" : entry) + " ›", nameEdit.note);
    if (nameEdit.rename !== null) for (const l of NOTICE_LINES) lines.push(l);
  }

  // ⛔ ONE EDIT PATH FOR THE WHEEL AND THE KEYBOARD. Each sounds only when it
  // changed something. The buffer holds at most kit-names' MAX_NAME_LENGTH, so
  // every line fits; what a name may be is still the kit's call at commit.
  function nameAppend(ch) {
    if (nameEdit.text.length >= Profiles.MAX_NAME_LENGTH) return;
    nameEdit.text += ch.toUpperCase();
    sfx("menuConfirm");
  }
  function nameDelete() {
    if (nameEdit.text === "") return;
    nameEdit.text = nameEdit.text.slice(0, -1);
    sfx("menuBack");
  }
  function cancelName() {
    sfx("menuBack");
    if (nameEdit.rename === null) openProfiles(); else openProfilePage(nameEdit.rename);
  }
  // kit-profile's create or rename; a refusal's reason stays on the page until
  // the next commit. ⛔ A new profile is activated through select() (R11).
  function nameCommit() {
    sfx("menuConfirm");
    const id = nameEdit.rename;
    const r = id === null ? Profiles.create(nameEdit.text) : Profiles.rename(id, nameEdit.text);
    if (!r.ok) { nameEdit.note = reasonLine(r.reason); return; }
    if (id === null) { Profiles.select(r.profile.id); openProfiles(); }
    else openProfilePage(id);
  }

  // kit-input 0.8.0's text mode, delivered inside input.sample(). A commit there
  // changes the screen, and update()'s second syncScreen() ends the mode.
  function onNameText(r) {
    if (state.screen !== "profileName" || nameEdit === null) return;
    if (r.ch !== undefined) nameAppend(r.ch);
    else if (r.del) nameDelete();
    else if (r.done) nameCommit();
  }

  // NAME's step, in place of the menu's (R13). Rotate steps the wheel by whole
  // MENU_ROTATE_STEP and wraps; Fire appends, deletes on DEL and commits on END;
  // Purge deletes, or cancels an empty name. ⛔ Escape is the menu's queued
  // back, so the model steps on a still snapshot, which hands over that and
  // nothing else. The entry step acts on nothing, like the menu's.
  function stepName(screen) {
    const inp = state.input;
    const fireEdge = inp.fire && !prevFire, purgeEdge = inp.purge && !prevPurge;
    const entering = menuEntering;
    menuEntering = false;
    const back = menu.step(screen, _still);
    if (entering) { nameEdit.acc = 0; return; }
    if (back) { cancelName(); return; }
    nameEdit.acc += inp.rotate;
    const whole = Math.trunc(nameEdit.acc / C.MENU_ROTATE_STEP);
    if (whole !== 0) {
      const n = C.NAME_WHEEL.length;
      nameEdit.acc -= whole * C.MENU_ROTATE_STEP;
      nameEdit.wheel = ((nameEdit.wheel + whole) % n + n) % n;
      sfx("menuMove");
    }
    if (fireEdge) {
      const entry = C.NAME_WHEEL[nameEdit.wheel];
      if (entry === "DEL") nameDelete();
      else if (entry === "END") nameCommit();
      else nameAppend(entry);
    } else if (purgeEdge) {
      if (nameEdit.text === "") cancelName(); else nameDelete();
    }
  }

  // ⛔ THE ONE WAY OUT OF A RUN TO THE TITLE (GDD 15.4), and P6's pause menu
  // calls it too. It overwrites the run with shipped defaults, so the title
  // shows no stale board, and clears any freeze a quit from pause could land
  // inside.
  //
  // ⛔ THE 'quit' SEAT IS THE TOP OF THIS FUNCTION, AND THE ORDER IS THE RULE
  // (CS011 P3, plan R7). Whether a run was PLAYING must be read BEFORE the
  // overwrite below, because the overwrite destroys the answer. A quit comes
  // from the pause menu, so the check is `screen === "pause"`. This is also game
  // over's QUIT TO TITLE row: that run already ended as 'died' in frame(), so it
  // must never record a 'quit' too — the double submit GDD 15.4 forbids.
  function quitToTitle() {
    if (state.screen === "pause") Meta.runEnded("quit");
    Object.assign(state, newState());
    state.screen = "title";
    hitStopLeft = 0;
  }

  function menuAction(name, screen) {
    if (name === "toTitle")   state.screen = "title";
    if (name === "toOptions") { optionsFrom = "title"; state.screen = "options"; }
    if (name === "pauseOptions") { optionsFrom = "pause"; state.screen = "options"; }
    if (name === "optionsBack") state.screen = optionsFrom;
    if (name === "backToOptions") state.screen = "options";
    if (name === "toControls") state.screen = "controls";
    if (name === "toKeyboard") state.screen = "keyboard";
    if (name === "toGamepad") state.screen = "gamepad";
    if (name === "backToControls") state.screen = "controls";
    if (name === "adjust") { adjusting = screen.items[menu.cursor].adjust; adjustAcc = 0; }
    // ⛔ Each of these three is a settings change, and saves (CS011 P2).
    if (name === "toggleMirror") { input.configure({ inputMirror: !input.setting("inputMirror") }); Meta.saveSettings(); }
    if (name === "toggleAutofire") { controls.autofire = !controls.autofire; Meta.saveSettings(); }
    if (name === "resetControls") { resetControls(); Meta.saveSettings(); }
    if (name === "rebind") {
      const row = screen.items[menu.cursor];
      capturing = { page: state.screen, bind: row.bind, slot: row.slot };
      pageNote = "";
      input.captureNext(onCaptured);
    }
    if (name === "toCredits") state.screen = "credits";
    if (name === "toggleTelemetry") toggleTelemetry();
    if (name === "exportTelemetry") exportTelemetry();
    if (name === "resume") resumeRun();
    if (name === "toMode")    state.screen = "mode";
    if (name === "toScores")  { buildScoreRows(); state.screen = "scores"; }
    // CS011 P4. SELECT goes back to PROFILE, where ACTIVE has moved; a delete
    // does too, and a refused one stays on DELETE with the kit's reason (R12).
    if (name === "toProfiles") openProfiles();
    if (name === "openProfile") openProfilePage(screen.items[menu.cursor].id);
    if (name === "backToProfilePage") openProfilePage(pageId);
    if (name === "newProfile") openName(null);
    if (name === "selectProfile") { Profiles.select(pageId); openProfiles(); }
    if (name === "renameProfile") openName(pageId);
    if (name === "toDeleteProfile") {
      SCREENS.profileDelete.lines[0] = nameOfProfile(pageId);
      SCREENS.profileDelete.lines[1] = "";
      state.screen = "profileDelete";
    }
    if (name === "deleteProfile") {
      const r = Profiles.remove(pageId);
      if (r.ok) openProfiles(); else SCREENS.profileDelete.lines[1] = reasonLine(r.reason);
    }
    if (name === "pickClassic") {
      pendingMode = "classic";
      buildDepthRows();
      state.screen = "depth";
    }
    // ⛔ A TIME SEED, recorded in state.seed by startGame() (GDD 17.1).
    if (name === "startRun") {
      startGame(undefined, { mode: pendingMode, startDepth: screen.items[menu.cursor].value });
    }
    // ⛔ U2: SAME MODE AND START DEPTH, NEW SEED. The run's two parameters are
    // still on state — nothing between the stop and this row rewrites them.
    // ⛔ NO hitStopLeft WRITE, AND NONE IS NEEDED: update() runs only once the
    // freeze has drained (frame()), so this row cannot be reached inside one.
    if (name === "restartRun") {
      startGame(undefined, { mode: state.mode, startDepth: state.startDepth });
    }
    if (name === "quitToTitle") quitToTitle();
  }

  // ⛔ ONE PLACE NOTICES THAT THE SCREEN CHANGED, whoever changed it — a menu
  // row, killSkimmer()'s game over, startGame() from a test. It re-arms the
  // menu's entry step and sets touch for the screen: in play, auto-fire as
  // shipped and no tap-fire (kit-input 0.3.0's behaviour exactly); anywhere
  // else, a drag must only move the cursor, so auto-fire is off and a tap above
  // the rotation zone is the confirm (Paul, 2026-09-13).
  let syncedScreen = null;
  let menuEntering = false;   // the next menu step is an entry step: no sound (CS009 P5)
  function syncScreen() {
    if (state.screen === syncedScreen) return;
    syncedScreen = state.screen;
    menuEntering = true;
    const inPlay = state.screen === "play";
    // ⛔ The top-edge pause target is live in play only; on a menu the upper
    // screen is all confirm taps and a dead spot there would fail silently.
    // ⛔ In play, auto-fire is the CONTROLS page's setting (CS008 P7).
    input.configure({ touchAutofire: inPlay ? controls.autofire : false, touchTapFire: !inPlay,
                      touchTopTarget: inPlay });
    // A row that owned the input does not follow the player off its page.
    endControlModes();
    // ⛔ THE TEXT MODE IS ARMED ON NAME AND ENDED EVERYWHERE ELSE (CS011 P4, R13),
    // after endControlModes(): kit-input 0.8.0 never arms it beside a capture.
    input.captureText(state.screen === "profileName" ? onNameText : null);
    menu.reset();
  }

  function nowMs() {
    if (typeof performance !== "undefined" && performance && performance.now) return performance.now();
    return Date.now();
  }

  // ---- simulation ----------------------------------------------------------

  // ⛔ Never touches the canvas. Runs headless, always.
  function update(dt) {
    syncScreen();
    // ⛔ ABOVE THE STOP, DELIBERATELY. This is the one input path (GDD 9.5), and
    // the menus below read the struct it writes.
    input.sample(dt, state.input);
    // ⛔ AND AGAIN, BECAUSE A PAUSE ARRIVES INSIDE sample() (CS008 P6). This makes
    // the pausing step the pause menu's ENTRY step, so a Fire the player was
    // holding in play does not confirm RESUME on the same step. A no-op on
    // every step whose screen did not change.
    syncScreen();

    // ⛔ THE STOP, ON EVERY SCREEN BUT PLAY (GDD 4.4, 10.5). Exactly where the
    // game-over stop always was: no simulation clock, no entity pass, no
    // spawner, no collision, no level advance. The menu step is the only thing
    // that runs, and game over's menu sits over a board draw() still paints.
    if (state.screen !== "play") {
      const screen = SCREENS[state.screen];
      if (screen) {
        if (adjusting !== null || capturing !== null) stepControlMode(screen);
        else if (state.screen === "profileName") stepName(screen);
        else {
          // ⛔ THE MENU SOUNDS (CS009 P5; plan §7), read off the step's answer:
          // the screen's back action is `menuBack`, any other action
          // `menuConfirm`, and a cursor that moved with no action `menuMove`.
          // An entry step moves the cursor to the first row and is silent.
          const cursor = menu.cursor, entering = menuEntering;
          menuEntering = false;
          const action = menu.step(screen, state.input);
          if (action) sfx(action === screen.back ? "menuBack" : "menuConfirm");
          else if (!entering && menu.cursor !== cursor) sfx("menuMove");
          if (action) menuAction(action, screen);
        }
      }
      prevFire = state.input.fire;
      prevPurge = state.input.purge;
      // After the action, so the step that toggled it already shows it.
      if (state.screen === "options") {
        OPTIONS_TELEMETRY.detail = Telemetry.enabled() ? "ON" : "OFF";
        refreshSoundRows();
      }
      if (state.screen === "controls" || state.screen === "keyboard" || state.screen === "gamepad") refreshControlRows();
      if (state.screen === "title") { const p = Profiles.current(); TITLE_PROFILE.detail = p ? p.name : ""; }
      if (state.screen === "profileName") refreshNameLines();
      return;
    }

    playSteps++;
    state.time += dt;

    // reset() writes 02-state.js's shipped defaults, which put `skimmer` back
    // to null — no well has been entered. The first step after one enters the
    // current well, rather than minting a lone craft beside a well that was
    // never armed. ⛔ Still the one path (enterWell); a run begins through
    // startGame(), from the START DEPTH screen.
    if (!state.skimmer) enterWell();

    // ⛔ THE TELEMETRY SAMPLE, AND THIS IS THE ONE PLACE IT IS TAKEN (GDD 15.6;
    // 21-telemetry.js). ⛔ ON THE SIMULATION CLOCK — inside update(), never in
    // draw(), which runs on a frame clock and would make a capture-on run
    // diverge from a capture-off one. Telemetry.sample() is a no-op unless
    // capture was turned on this session, and it spends no RNG draw either way.
    //
    // ⛔ ABOVE THE DIVE BRANCH, so the ~2.6 s a run spends in a dive is sampled
    // rather than being a hole in the log; below the game-over stop, so a
    // stopped run stops logging. A row is therefore the simulation as this step
    // BEGINS, with state.time already advanced — one call site, and the two
    // returns below cannot silently halve the coverage.
    Telemetry.sample(state);

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
    // ⛔ TELEMETRY (02-state.js's `tally`) AND GDD 7's CLEAR BONUSES, both at the
    // EDGE — the step wellCleared() first says yes — and not inside
    // startDive(), which the suite also drives directly and the dive's repeat
    // path calls again; a well cleared by play is the event both are about.
    // ⛔ The bonuses are paid BEFORE the dive (Paul, P4s), in clearBonuses()'s
    // fixed order (12-scoring.js).
    // ⛔ AND THE SESSION'S HIGHEST LEVEL CLEARED IS WRITTEN AT THE SAME EDGE
    // (GDD 4.6; 22-meta.js). Not in state: it has to outlive startGame().
    if (wellCleared(state)) {
      state.tally.wellsCleared++;
      sfx("wellClear");
      clearBonuses(state);
      levelRecord().noteCleared(state.level);
      startDive(state);
    }
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
    // The rim pulse is audioFrame()'s reading of this frame (CS010 P4), 0 off
    // play and with no audio. A value, never a clock or a draw of its own.
    drawWell(ctx, well, state.level, lit, state.bandRoll, rimGlow);
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
    // unforgivable failure.
    // ⛔ A DEAD CRAFT FRAGMENTS INSTEAD (GDD 4.4; CS008 P4). The freeze exists
    // to show the player what happened, and it is the fragmentation's clock:
    // t is hit-stop progress, so there is no second clock and no draw spent.
    // Every death — the Dive's included — goes through killSkimmer() and its
    // freeze, so every death fragments. Once the freeze is spent (t = 1) the
    // craft is gone until the respawn step, and on a game over it stays gone.
    const sk = state.skimmer;
    if (sk && sk.dead) {
      drawFragments(ctx, skimmerPoints(well, sk.lane, 0), true,
                    fragmentT(hitStopLeft, C.HIT_STOP_DEATH), C.SKIMMER_COLOR);
    } else if (sk && skimmerBlinkVisible(state.invulnTime)) {
      sk.draw(ctx, well);
    }
    // ⛔ THE HUD IS LAST and reads only this view (15-render-hud.js). The view
    // object is filled in place, never allocated per frame.
    // ⛔ H4: WHERE A RUN IS ON SCREEN (runOnScreen) — play, the dive, pause and
    // game over, and OPTIONS opened from pause. Never on title, mode, START
    // DEPTH or the title's OPTIONS: no run exists there, so it would show a
    // stale or default score.
    if (runOnScreen()) {
      _hudView.score = state.score;
      _hudView.lives = state.lives;
      _hudView.level = state.level;
      _hudView.levelColor = wellBandColor(state.level, state.bandRoll);
      _hudView.purgeUses = state.purgeUses;
      _hudView.mirror = input.setting("inputMirror");   // ⛔ the live flag (CS008 P7)
      drawHud(ctx, _hudView);
    }
    // The menu over everything, on every screen but play.
    const screen = state.screen === "play" ? null : SCREENS[state.screen];
    if (screen) {
      if (screen === SCREENS.gameover) {
        screen.lines[0] = "SCORE " + state.score;
        screen.lines[1] = "LEVEL " + state.level;
        // Meta's closure, set at the 'died' seat before this frame's draw.
        screen.lines[2] = Meta.lastPlace() > 0 ? "NEW HIGH SCORE #" + Meta.lastPlace() : "";
      }
      _menuView.title = screen.title;
      _menuView.lines = screen.lines;
      _menuView.items = screen.items;
      _menuView.cursor = menu.cursor;
      drawMenu(ctx, _menuView);
    }
  }

  const _menuView = { title: "", lines: null, items: null, cursor: 0 };

  const _hudView = {
    score: 0, lives: 0, level: 1, levelColor: "", purgeUses: 0,
    mirror: false, icon: SKIMMER_POLY,
  };

  // ---- the frame -----------------------------------------------------------

  // This frame's play steps, for audioFrame(): an update() that got past the
  // stop, so the simulation ran (CS009 P5).
  let playSteps = 0;

  function frame(tMs) {
    playSteps = 0;
    let dt = (tMs - lastMs) / 1000;
    lastMs = tMs;
    if (!(dt > 0)) dt = 0;                       // first frame, or a clock that went back
    if (dt > C.DT_CLAMP_MAX) dt = C.DT_CLAMP_MAX;
    accumulator += dt;

    let steps = 0;
    while (accumulator >= C.FIXED_DT && steps < C.MAX_CATCHUP_STEPS) {
      accumulator -= C.FIXED_DT;
      steps++;
      // ⛔ THE FREEZE DRAINS ONLY ON THE TWO SCREENS A FREEZE BELONGS TO (CS008
      // P6, plan §7). A pause inside a death freeze — or OPTIONS opened from that
      // pause — must hold it, or the freeze and the fragmentation run out under
      // the menu; and the menu's steps have to run, so they fall through to
      // update(). Title, mode and START DEPTH never hold one (quitToTitle()).
      if (hitStopLeft > 0 && (state.screen === "play" || state.screen === "gameover")) {
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

    // ⛔ THE 'died' SEAT (CS011 P3, plan R7): AFTER THE STEPS, BEFORE THE AUDIO FRAME.
    // Never in killSkimmer(): a clear on the step that spends the last life pays
    // its bonuses after that returns (GDD 7), and a Dive death returns from
    // update() early, so the final score is known here and not before. Not a
    // play step, so its storage writes are legal. Once per run: runEnded() closes
    // it.
    if (state.screen === "gameover" && Meta.runOpen()) Meta.runEnded("died");

    audioFrame();
    draw();
  }

  // ⛔ THE MUSIC FOLLOWS THE SCREEN, ONCE PER FRAME (CS009 P3; GDD 11.2). After
  // the steps, so a screen a step changed is heard on this frame, and before
  // draw(). ⛔ It writes no `state` and draws nothing. setState() is idempotent,
  // and update() is the lookahead scheduler. Both return early with no context,
  // so headless and before the first gesture this is two no-ops. ⛔ It runs on
  // EVERY frame, not on a screen change: a setState() before the gesture is
  // dropped, and the next frame's call is what starts the music.
  //
  // ⛔ AND THE SURGER CHARGE TONE (CS009 P5), which needs to know whether the
  // fuse is RUNNING: frame() counts its play steps above. The frame ends frozen
  // or off play — a pause, any menu, game over, the death freeze — and every
  // voice stops (false); no play step ran but the run is live, and the voices
  // hold (null); otherwise they follow the fuse (true). ⛔ Not `hitStopLeft > 0`
  // alone: a pause holds no freeze, and it stops the fuse all the same.
  //
  // ⛔ AND THE INTENSITY DIRECTOR (CS010 P2; Paul's D8, D9). BEFORE setState(),
  // so a track that starts on this frame builds its gates at this frame's level.
  //   play          the director reads dangerInputs(), or ZERO during a Dive
  //                 (GDD 5: the music drops to its foundation), and its level
  //                 drives setIntensity() and setSweep(). ⛔ It runs frozen or not
  //                 (R11). The first play frame of a run, entered from a screen
  //                 with no live run behind it (title side, game over), resets
  //                 it, so a run and a RESTART both start from 0.
  //   pause side    duckFor(): nothing set, so intensity and the sweep HOLD, and
  //                 the director holds too, so a resume skips the paused time
  //                 rather than catching up on it (Paul, 2026-09-16).
  //   title side    the sweep fully open; intensity untouched (title is untiered).
  //   game over     nothing: the music is fading to silence.
  // The duck follows duckFor() on every frame. ⛔ Reads state, writes none.
  //
  // ⛔ AND THE RIM PULSE (CS010 P4; Paul's D10): `rimGlow` off `heart`'s onsets
  // once the audio clock has REACHED one (beatGlow(), 19-sfx.js), in play only;
  // 0 on every other screen and with no context. A closure variable, never state.
  function audioFrame() {
    const screen = state.screen;
    const pauseSide = duckFor(screen, optionsFrom);
    if (screen === "play") {
      if (!audioRunLive) Director.reset();
      const level = Director.frame(state.dive.active ? DANGER_NONE : dangerInputs(state, dangerRead),
                                   AudioSys.now());
      MusicSys.setIntensity(level);
      MusicSys.setSweep(level);
    } else if (pauseSide) {
      Director.hold();
    } else if (screen !== "gameover") {
      MusicSys.setSweep(1);
    }
    audioRunLive = screen === "play" || pauseSide;
    MusicSys.setDuck(pauseSide);
    MusicSys.setState(musicStateFor(state.screen, optionsFrom, state.mode,
                                    C.MUSIC_TRACK_CHOICES[sound.track]));
    MusicSys.update();
    rimGlow = screen === "play" ? beatGlow(AudioSys.now()) : 0;   // after the scheduler: a late onset clamps to now
    const stopped = hitStopLeft > 0 || state.screen !== "play";
    reconcileSurgeTones(state.enemies, stopped ? false : playSteps > 0 ? true : null);
  }

  // audioFrame()'s own memory, never `state`: the director's reading is
  // refilled in place, a Dive reads the zero board, and whether the last frame
  // had a live run behind it (play or pause side) decides a reset.
  const dangerRead = { count: 0, proximity: 0, peril: 0, heat: 0, combo: 0 };
  const DANGER_NONE = Object.freeze({ count: 0, proximity: 0, peril: 0, heat: 0, combo: 0 });
  let audioRunLive = false;
  let rimGlow = 0;

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
  // start every case from the same place. ⛔ It WRITES NOTHING to storage
  // (CS011 P2): the settings it restores stay as the profile stored them.
  function reset() {
    Object.assign(state, newState());
    input.reset();
    accumulator = 0;
    lastMs = 0;
    hitStopLeft = 0;
    syncedScreen = null;
    audioRunLive = false;
    rimGlow = 0;
    resetControls();
    resetSound();
    stats.frames = 0; stats.ticks = 0; stats.lastSteps = 0; stats.accumulator = 0;
  }

  const api = {
    init, start, stop, reset,
    frame, update, draw, hitStop,
    quitToTitle,
    input, menu, stats,
    // CS011 P2: handed to Meta.boot() by the boot block.
    settingsHooks: { resetSettings, applySettings, settingsSnapshot },
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
  // ⛔ THE FRONT DOOR (GDD 10.5; CS008 P5). Boot is the title, and no run exists
  // until the START DEPTH screen calls startGame(). ⛔ newState().screen STAYS
  // "play": every closed test starts a run through reset() and startGame(), and
  // this line is the only place the title is the default.
  state.screen = "title";
  // ⛔ THE STORE AND THE PROFILE BEFORE THE LOOP (CS011 P1, GDD 15.1). This runs
  // in the headless harness too, so a boot-time write lands in every test build.
  Meta.boot(Game.settingsHooks);
  Game.start();
}

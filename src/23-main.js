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
// THE WELL LIFECYCLE (GDD 2, 3.4, 4.3). Three functions, one path.
// ---------------------------------------------------------------------------
//
// ⛔ EVERY ENTRY INTO A WELL GOES THROUGH enterWell(). A new run, the next
// level, the debug cycler, and (CS006) a restart all land here. In CS002 the
// debug cycler simply swapped a backdrop, which was harmless because nothing
// but the Skimmer existed; with enemies alive, cycling a 16-lane well to an
// 11-lane one strands craft on lanes the new well does not have.

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

  // GDD 4.3: one charge per well, recharged on entry, never accumulated.
  state.purgeReady = true;

  resetSpawner(state);
  state.clearHold = 0;

  // A craft for this well. ⛔ Minted rather than carried over: lane counts
  // differ between wells, so the outgoing craft's lane may not exist here.
  // Lives and respawn are CS003 P4's; this is the only place a Skimmer is
  // created today.
  state.skimmer = new Skimmer(well);
}

// The next level. ⛔ GDD 3.4's shapeIndex — the well is derived from the level
// clock and is never advanced independently, so there is exactly one clock
// (CLAUDE.md, Config) and level 17 is the Ring again.
function nextWell() {
  state.level += 1;
  state.wellIndex = (state.level - 1) % WELLS.length;
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

const Game = (function () {

  let canvas = null;
  let ctx = null;

  let accumulator = 0;   // s of unspent wall-clock time
  let lastMs = 0;        // timestamp of the previous frame
  let running = false;
  let rafHandle = 0;

  // Hit-stop: simulation time is frozen, rendering is not (GDD 10). Nothing
  // triggers it in CS002 — the hook exists so the death sequence (CS006) has
  // one place to call, rather than growing a second freeze mechanism later.
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
    actionKeys:       { cycleWell: ["w"] },
    onAction:         runAction,
  });

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
  }

  function nowMs() {
    if (typeof performance !== "undefined" && performance && performance.now) return performance.now();
    return Date.now();
  }

  // ---- simulation ----------------------------------------------------------

  // ⛔ Never touches the canvas. Runs headless, always.
  function update(dt) {
    input.sample(dt, state.input);
    state.time += dt;

    // reset() writes 02-state.js's shipped defaults, which put `skimmer` back
    // to null — no well has been entered. The first step after one enters the
    // current well, rather than minting a lone craft beside a well that was
    // never armed. ⛔ Still the one path (enterWell); boot goes through
    // startGame(). Respawn after a death is CS003 P4's, and is not this.
    if (!state.skimmer) enterWell();

    const well = WELLS[state.wellIndex];
    state.skimmer.update(dt, well, state.input);
    updateShots(state, well, dt);

    // ⛔ The enemy pass, then the end-of-frame filter — never a splice
    // mid-loop (GDD 6.5). The spawner runs AFTER the filter so the alive count
    // it reads is this step's, not last step's plus the dead.
    for (let i = 0; i < state.enemies.length; i++) state.enemies[i].update(dt, well, state);
    state.enemies = state.enemies.filter(e => !e.dead);
    updateSpawner(state, well, dt);

    // ⚠ TEMPORARY (C.WELL_CLEAR_HOLD) — the beat between the last kill and the
    // next well. CS005's Dive (GDD 5) replaces this whole branch. The hold
    // counts UP and resets the moment the well stops being clear, so a spawn
    // or a survivor cannot leave a half-spent pause behind.
    if (wellCleared(state)) {
      state.clearHold += dt;
      if (state.clearHold >= C.WELL_CLEAR_HOLD) nextWell();
    } else {
      state.clearHold = 0;
    }
  }

  // ---- presentation --------------------------------------------------------

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);
    const well = WELLS[state.wellIndex];
    drawWell(ctx, well, state.level, null, 0);
    // Z-order: the well is the backdrop, enemies climb over it, shots travel
    // over them, and the Skimmer — always at depth 1, the rim — rides on top
    // of everything. Shots above enemies so a shot is never lost behind the
    // thing it is about to hit (GDD 1.1 P2). The
    // guards are for a draw that lands before the first update — boot, and the
    // frozen branch of a hit-stop that began on frame one.
    for (let i = 0; i < state.enemies.length; i++) state.enemies[i].draw(ctx, well);
    for (let i = 0; i < state.shots.length; i++) state.shots[i].draw(ctx, well);
    if (state.skimmer) state.skimmer.draw(ctx, well);
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
  // seed is time-derived and recorded in state.seed. CS006's title screen is
  // what will eventually own this call.
  startGame();
  Game.start();
}

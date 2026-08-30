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

    const well = WELLS[state.wellIndex];
    // Lazily minted, in ONE place. reset() writes 02-state.js's shipped
    // defaults, which put `skimmer` back to null, and 02-state.js is
    // concatenated above 05-skimmer.js so newState() cannot mint one itself.
    // Doing it here means reset(), boot and a well change all take the same
    // path instead of three that have to agree. CS006 owns start and respawn.
    if (!state.skimmer) state.skimmer = new Skimmer(well);
    state.skimmer.update(dt, well, state.input);
    // CS002 P3 hangs the shots here, CS003 the enemies.
  }

  // ---- presentation --------------------------------------------------------

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);
    const well = WELLS[state.wellIndex];
    drawWell(ctx, well, state.level, null, 0);
    // Z-order: the well is the backdrop, the Skimmer rides on top of it. The
    // guard is for a draw that lands before the first update — boot, and the
    // frozen branch of a hit-stop that began on frame one.
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
  Game.start();
}

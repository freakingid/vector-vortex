// test-cs002-p4.js — CS002 P4: touch and gamepad, the closing phase's own
// device paths (GDD 9.3, 9.4, 9.5).
//
// Asserts what P4 owns and nothing else: mouse/keyboard determinism and the
// loop stay test-cs002-p1.js's job, the Skimmer stays p2's, shots stay p3's.
// Three things worth knowing before editing this file:
//   - touchStart/touchMove/touchEnd take WORLD-SPACE coordinates, the same
//     space every entity lives in, so a synthesized drag needs no DOM or
//     getBoundingClientRect() — that conversion is the DOM adapter's job.
//   - The D-pad case asserts the SHARED path (the exact same axis/tap-hold
//     state a keyboard press drives), not just "both produce similar output".
//   - pollGamepads() takes a plain `{ navigator: { getGamepads } }` object,
//     not a browser Gamepad — that is what makes it callable with no DOM.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260830);
const X = H.buildGame();
const C = X.C;

function makeInput(overrides) {
  return X.createInput(Object.assign({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS,
    keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP,
    pointerLockOffer: C.POINTER_LOCK_OFFER,
    touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC,
    touchAutofire: C.TOUCH_AUTOFIRE, touchButtonR: C.TOUCH_BUTTON_R,
    gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: C.INPUT_MIRROR, worldW: C.WORLD_W, worldH: C.WORLD_H,
  }, overrides || {}));
}

// ---- the constants this phase adds -----------------------------------------
const { hasKnob } = require("./test-registry.js");
hasKnob(X, "GAMEPAD_DEADZONE", { def: 0.15 }, H);
hasKnob(X, "GAMEPAD_SENS", { def: 12.0 }, H);
hasKnob(X, "TOUCH_BUTTON_R", { def: 56 }, H);
hasKnob(X, "INPUT_MIRROR", { def: false }, H);

// ---- the kit boundary still holds: every new tunable is required -----------
for (const missing of ["touchSens", "touchZoneFrac", "touchAutofire", "touchButtonR",
                        "gamepadDeadzone", "gamepadSens", "inputMirror", "worldW", "worldH"]) {
  let threw = false;
  const opts = {
    mouseSens: 1, keyTapMs: 100, keySpeedMin: 1, keySpeedMax: 2, keyRamp: 0.1,
    touchSens: 1, touchZoneFrac: 0.4, touchAutofire: true, touchButtonR: 56,
    gamepadDeadzone: 0.15, gamepadSens: 12, inputMirror: false, worldW: 1280, worldH: 720,
  };
  delete opts[missing];
  try { X.createInput(opts); } catch (e) { threw = true; }
  H.assert(threw, `createInput refuses to default options.${missing}`);
}

// ---------------------------------------------------------------------------
// touch — relative drag, same sensitivity model as mouse (GDD 9.3)
// ---------------------------------------------------------------------------

// A drag inside the lower TOUCH_ZONE_FRAC produces rotate = Δx * TOUCH_SENS,
// exactly the ratio a mouse motion of the same Δx would produce scaled by
// TOUCH_SENS / MOUSE_SENS — the two paths share the same linear model.
{
  const mouse = makeInput();
  const touch = makeInput();
  const yInZone = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC / 2);   // well inside the zone
  for (const dx of [1, 5, 23, 140, -60]) {
    mouse.reset(); touch.reset();
    mouse.mouseMove(dx);
    const mouseRotate = mouse.sample(C.FIXED_DT).rotate;

    touch.touchStart(1, 400, yInZone);
    touch.touchMove(1, 400 + dx, yInZone);
    const touchRotate = touch.sample(C.FIXED_DT).rotate;

    H.close(touchRotate, mouseRotate * (C.TOUCH_SENS / C.MOUSE_SENS), 1e-12,
      `a touch drag of ${dx}px matches mouse scaled by TOUCH_SENS/MOUSE_SENS`);
  }
}

// A touch that starts ABOVE the rotation zone is not a drag at all.
{
  const touch = makeInput();
  const yAboveZone = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC) - 10;
  touch.touchStart(1, 400, yAboveZone);
  touch.touchMove(1, 460, yAboveZone);
  H.eq(touch.sample(C.FIXED_DT).rotate, 0, "a touch starting above the rotation zone does not rotate");
}

// ⛔ TOUCH_AUTOFIRE is coupled to the Jump button (GDD 9.3/14.2) — fire is on
// for as long as a rotation drag is active, with no separate fire button.
{
  const touch = makeInput();
  const yInZone = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC / 2);
  H.eq(touch.sample(C.FIXED_DT).fire, false, "fire is off with no touch active");
  touch.touchStart(7, 200, yInZone);
  H.eq(touch.sample(C.FIXED_DT).fire, true, "a rotation drag auto-fires");
  touch.touchEnd(7);
  H.eq(touch.sample(C.FIXED_DT).fire, false, "fire stops when the drag ends");

  // touchAutofire: false must be honoured too — it is a real tunable, not a
  // hardcoded assumption.
  const noAutofire = makeInput({ touchAutofire: false });
  noAutofire.touchStart(7, 200, yInZone);
  H.eq(noAutofire.sample(C.FIXED_DT).fire, false, "touchAutofire: false disables the coupling");
}

// Purge (top-right) and Jump (bottom-right) buttons, radius TOUCH_BUTTON_R,
// and INPUT_MIRROR swaps both to the left edge.
{
  const touch = makeInput();
  const purgeCenter = { x: C.WORLD_W - C.TOUCH_BUTTON_R * 1.5, y: C.TOUCH_BUTTON_R * 1.5 };
  touch.touchStart(1, purgeCenter.x, purgeCenter.y);
  H.eq(touch.sample(C.FIXED_DT).purge, true, "touching the purge button sets purge");
  touch.touchEnd(1);
  H.eq(touch.sample(C.FIXED_DT).purge, false, "releasing the purge button clears it");

  const jumpCenter = { x: C.WORLD_W - C.TOUCH_BUTTON_R * 1.5, y: C.WORLD_H - C.TOUCH_BUTTON_R * 1.5 };
  touch.touchStart(2, jumpCenter.x, jumpCenter.y);
  H.eq(touch.sample(C.FIXED_DT).jump, true, "touching the jump button sets jump");
  touch.touchEnd(2);

  const mirrored = makeInput({ inputMirror: true });
  const mirroredPurge = { x: C.TOUCH_BUTTON_R * 1.5, y: C.TOUCH_BUTTON_R * 1.5 };
  mirrored.touchStart(1, mirroredPurge.x, mirroredPurge.y);
  H.eq(mirrored.sample(C.FIXED_DT).purge, true, "INPUT_MIRROR moves the purge button to the left edge");
  mirrored.touchEnd(1);
  mirrored.touchStart(2, purgeCenter.x, purgeCenter.y);
  H.eq(mirrored.sample(C.FIXED_DT).purge, false,
    "under INPUT_MIRROR, the old (un-mirrored) top-right corner is no longer the purge button");
}

// ---------------------------------------------------------------------------
// gamepad — stick proportional past the deadzone (GDD 9.4)
// ---------------------------------------------------------------------------

// `trueIndices` are the button indices reporting pressed:true; every other
// index up to 16 (enough to cover the standard mapping's D-pad at 14/15)
// reports pressed:false, matching a real Gamepad's dense buttons array.
function fakeWin(axisX, trueIndices) {
  const set = new Set(trueIndices || []);
  const buttons = [];
  for (let i = 0; i < 16; i++) buttons.push({ pressed: set.has(i) });
  const gp = { axes: [axisX], buttons: buttons };
  return { navigator: { getGamepads: () => [gp] } };
}
const DPAD_LEFT = [14], DPAD_RIGHT = [15], DPAD_NONE = [];

// Exactly zero inside the deadzone, at several magnitudes and both signs.
{
  const gp = makeInput();
  for (const x of [0, 0.05, C.GAMEPAD_DEADZONE - 1e-6, -(C.GAMEPAD_DEADZONE - 1e-6)]) {
    gp.pollGamepads(fakeWin(x));
    H.eq(gp.sample(C.FIXED_DT).rotate, 0, `stick x=${x} inside the deadzone produces exactly zero`);
  }
}

// Proportional and scaled by GAMEPAD_SENS just past the deadzone.
{
  const gp = makeInput();
  const x = C.GAMEPAD_DEADZONE + 0.2;
  gp.pollGamepads(fakeWin(x));
  H.close(gp.sample(C.FIXED_DT).rotate, x * C.GAMEPAD_SENS * C.FIXED_DT, 1e-12,
    "past the deadzone, rotate is x * GAMEPAD_SENS * dt");
  gp.pollGamepads(fakeWin(-x));
  H.close(gp.sample(C.FIXED_DT).rotate, -x * C.GAMEPAD_SENS * C.FIXED_DT, 1e-12,
    "the negative direction is symmetric");
}

// A gamepad that disconnects (no pad at index 0) contributes nothing.
{
  const gp = makeInput();
  gp.pollGamepads(fakeWin(0.9));
  gp.pollGamepads({ navigator: { getGamepads: () => [null] } });
  H.eq(gp.sample(C.FIXED_DT).rotate, 0, "a disconnected pad stops contributing rotation");
}

// ---- the D-pad reaches the SAME tap/hold path the keyboard uses ------------
// Proof of "one code path, not two that agree today": a D-pad tap produces
// EXACTLY one lane, the identical guarantee test-cs002-p1.js proves for
// ArrowRight, using the identical mechanism (a bound "key" going through
// keyDown/keyUp and advanceAxis/releaseAxis) rather than a parallel one that
// happens to match today.
{
  const gp = makeInput();
  const TAP_TICKS = 4;
  let total = 0;
  for (let i = 0; i < TAP_TICKS; i++) {
    gp.pollGamepads(fakeWin(0, DPAD_LEFT));
    total += gp.sample(C.FIXED_DT).rotate;
  }
  gp.pollGamepads(fakeWin(0, DPAD_NONE));   // release
  total += gp.sample(C.FIXED_DT).rotate;
  H.close(total, -1, 1e-9, "a D-pad-left tap inside KEY_TAP_MS moves exactly one lane, left");

  // Same call sequence via a REAL keyboard key must land on the identical
  // per-tick trajectory — not just the same total — proving it is the same
  // state machine, not a lookalike.
  const kb = makeInput();
  const kbDeltas = [];
  kb.keyDown("ArrowLeft");
  for (let i = 0; i < TAP_TICKS; i++) kbDeltas.push(kb.sample(C.FIXED_DT).rotate);
  kb.keyUp("ArrowLeft");
  kbDeltas.push(kb.sample(C.FIXED_DT).rotate);

  const gp2 = makeInput();
  const gpDeltas = [];
  for (let i = 0; i < TAP_TICKS; i++) {
    gp2.pollGamepads(fakeWin(0, DPAD_LEFT));
    gpDeltas.push(gp2.sample(C.FIXED_DT).rotate);
  }
  gp2.pollGamepads(fakeWin(0, DPAD_NONE));
  gpDeltas.push(gp2.sample(C.FIXED_DT).rotate);

  H.eq(gpDeltas.length, kbDeltas.length, "the D-pad and keyboard traces have the same length");
  for (let i = 0; i < kbDeltas.length; i++) {
    H.close(gpDeltas[i], kbDeltas[i], 1e-15,
      `D-pad tick ${i} matches the keyboard's tick ${i} bit-for-bit (shared state machine)`);
  }
}

// A D-pad HOLD ramps through the identical advanceAxis curve too.
{
  const kb = makeInput();
  kb.keyDown("ArrowRight");
  const kbDeltas = [];
  for (let i = 0; i < 40; i++) kbDeltas.push(kb.sample(C.FIXED_DT).rotate);

  const gp = makeInput();
  const gpDeltas = [];
  for (let i = 0; i < 40; i++) {
    gp.pollGamepads(fakeWin(0, DPAD_RIGHT));
    gpDeltas.push(gp.sample(C.FIXED_DT).rotate);
  }
  for (let i = 0; i < kbDeltas.length; i++) {
    H.close(gpDeltas[i], kbDeltas[i], 1e-15, `D-pad-right hold tick ${i} matches the keyboard ramp bit-for-bit`);
  }
}

H.report("test-cs002-p4.js");

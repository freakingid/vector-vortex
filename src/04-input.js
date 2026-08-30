// 04-input.js — kit-input (draft). Four devices in, ONE struct out.
//
// ⛔ THIS MODULE READS NO GAME GLOBAL. Not the config object, not the mutable
// game object, not a game function — in either direction. Every tunable
// arrives through createInput()'s options and 23-main.js is what passes them
// in. That is CLAUDE.md's boundary contract ("Kit modules and extraction"),
// and it is the whole reason this file can later be copied into coinless-kit
// rather than rewritten. Backport packet: src/04-input.NOTES.md.
//
// ⛔ ONE struct (GDD 9.5):  { rotate, fire, purge, jump }
// The simulation never learns which device produced it, and call sites never
// read a raw key map. `rotate` is a LANE DELTA for this simulation step, not a
// velocity: mouse motion is inherently a delta, and turning it into a velocity
// means dividing by dt, which is how linearity (GDD 9.1) gets quietly lost.
//
// ⛔ NO ACCELERATION CURVE on the mouse (GDD 9.1). A spinner has none, and
// adding one is the single most common way to ruin this game's rim feel.
// The mouse path is one multiply, on purpose. Keep it that way.
//
// CS002 P4 adds touch and gamepad. Both go through the SAME sink and the SAME
// sample() as mouse/keyboard — one code path, not two that agree today:
//   - Touch rotation is a relative drag, accumulated into the same mouseDx-like
//     bucket mouse motion uses, just at a different sensitivity (TOUCH_SENS).
//   - The D-pad is wired as two synthetic key names ("gamepadleft" /
//     "gamepadright") fed through keyDown/keyUp, so it rides the exact
//     tap/hold state machine the keyboard uses. There is no second axis model.
//   - The left stick is genuinely different (a held analog position rather
//     than a digital press), so it gets its own accumulator, scaled by
//     GAMEPAD_SENS and gated by GAMEPAD_DEADZONE.
// The Gamepad API has no events for stick/axis motion — it must be polled —
// so `pollGamepads()` runs once at the top of every sample(), reading through
// whatever `win` attach() was given. That is still "one code path": polling
// only decides how gamepad state ENTERS the sink, same as a DOM listener does
// for mouse/keyboard.
//
// Device events arrive through the small sink API below (mouseMove / keyDown /
// keyUp / setButton). attach() is a thin DOM adapter over that sink and is the
// only place in the entire build that touches a DOM event. That split is what
// lets a headless test replay a recorded event list with no DOM at all, which
// is what makes the determinism guarantee (GDD 17.1) testable.

const INPUT_VERSION = "0.2.0";

// Default bindings, matched case-insensitively. These are NOT tunables — a
// keymap is this module's own default and a host replaces it wholesale through
// options.keys. Values are DOM `key` names, lowercased.
//
// "w" is deliberately unbound here: the game binds it as a named debug action
// (see options.actionKeys), and a key doing two jobs is a bug waiting for a
// player who rebinds.
const INPUT_KEYS_DEFAULT = {
  left:  ["arrowleft", "a"],
  right: ["arrowright", "d"],
  fire:  [" ", "z"],
  purge: ["shift", "x"],
  jump:  ["arrowup", "c"],
};

function inputNormKey(k) {
  return String(k).toLowerCase();
}

// ⛔ Numeric tunables are REQUIRED, never defaulted. A default here would be a
// second tuning surface competing with the host's config object, and the point
// of the boundary is that there is exactly one. Failing loudly at wiring time
// beats a silent 0.02 that nobody can find later.
function inputRequireNum(opts, name) {
  const v = opts[name];
  if (typeof v !== "number" || !isFinite(v)) {
    throw new Error("createInput: options." + name + " must be a finite number");
  }
  return v;
}

// Same requirement, for the two touch tunables that are booleans rather than
// numbers (TOUCH_AUTOFIRE, INPUT_MIRROR). Same reasoning as inputRequireNum.
function inputRequireBool(opts, name) {
  const v = opts[name];
  if (typeof v !== "boolean") {
    throw new Error("createInput: options." + name + " must be a boolean");
  }
  return v;
}

// Turn { action: ["key", ...] } into both directions at once: a key -> action
// lookup for events, and an action -> keys list for "is anything held?".
function inputBuildBindings(src) {
  const byKey = new Map();
  const byAction = {};
  for (const action of Object.keys(src)) {
    const raw = src[action];
    const list = Array.isArray(raw) ? raw : [raw];
    const norm = [];
    for (let i = 0; i < list.length; i++) {
      const k = inputNormKey(list[i]);
      norm.push(k);
      byKey.set(k, action);
    }
    byAction[action] = norm;
  }
  return { byKey, byAction };
}

//   createInput({
//     mouseSens, keyTapMs, keySpeedMin, keySpeedMax, keyRamp,   // required
//     touchSens, touchZoneFrac, touchAutofire, touchButtonR,    // required
//     gamepadDeadzone, gamepadSens,                             // required
//     worldW, worldH,       // required — world-space size touch buttons live in
//     inputMirror,          // required — mirrors touch buttons for left-handed play
//     pointerLockOffer,                                          // optional, default on
//     keys,        // optional binding override, shape of INPUT_KEYS_DEFAULT
//     actionKeys,  // optional { actionName: ["key", ...] } for named actions
//     onAction,    // optional (name) => void, called during sample()
//   })
function createInput(options) {
  const opts = options || {};

  const mouseSens   = inputRequireNum(opts, "mouseSens");
  const keyTapS     = inputRequireNum(opts, "keyTapMs") / 1000;
  const keySpeedMin = inputRequireNum(opts, "keySpeedMin");
  const keySpeedMax = inputRequireNum(opts, "keySpeedMax");
  const keyRamp     = inputRequireNum(opts, "keyRamp");
  const pointerLockOffer = opts.pointerLockOffer !== false;
  const onAction = typeof opts.onAction === "function" ? opts.onAction : null;

  const touchSens      = inputRequireNum(opts, "touchSens");
  const touchZoneFrac  = inputRequireNum(opts, "touchZoneFrac");
  const touchButtonR   = inputRequireNum(opts, "touchButtonR");
  const touchAutofire  = inputRequireBool(opts, "touchAutofire");
  const gamepadDeadzone = inputRequireNum(opts, "gamepadDeadzone");
  const gamepadSens     = inputRequireNum(opts, "gamepadSens");
  const worldW = inputRequireNum(opts, "worldW");
  const worldH = inputRequireNum(opts, "worldH");
  const inputMirror = inputRequireBool(opts, "inputMirror");

  const bindings = inputBuildBindings(opts.keys || INPUT_KEYS_DEFAULT);
  const actions  = inputBuildBindings(opts.actionKeys || {});

  // The D-pad rides the SAME tap/hold state machine the keyboard uses (GDD
  // 9.4) — these are not a second axis model, just two more bound "keys" that
  // happen to be pressed by pollGamepads() instead of a keydown event.
  function bindSynthetic(key, action) {
    bindings.byKey.set(key, action);
    if (!bindings.byAction[action]) bindings.byAction[action] = [];
    bindings.byAction[action].push(key);
  }
  bindSynthetic("gamepadleft", "left");
  bindSynthetic("gamepadright", "right");

  const pressed = new Set();   // normalized key names currently down
  const buttons = new Set();   // non-key sources holding a button: "fire", ...
  const queued  = [];          // named actions triggered since the last sample

  // One record per rotation direction. `emitted` is how much of a lane this
  // press has already delivered, which is what makes the tap exact.
  const axis = {
    left:  { down: false, held: 0, emitted: 0, tap: false },
    right: { down: false, held: 0, emitted: 0, tap: false },
  };

  let mouseDx = 0;         // px accumulated since the last sample
  let impulse = 0;         // signed lane units owed by taps completed since then
  let lastClientX = null;  // fallback when a mousemove carries no relative delta

  // Touch: a relative drag, exactly like mouse but at TOUCH_SENS (GDD 9.3).
  // Not a virtual stick — there is no rest position, only Δx since last move.
  const touches = new Map();   // touch id -> { kind: "drag"|"purge"|"jump", x }
  let touchDx = 0;              // world-space px accumulated since the last sample
  let touchDragCount = 0;       // active drag touches; > 0 drives TOUCH_AUTOFIRE

  // Gamepad: the stick is a held analog position, not a discrete press, so it
  // gets its own accumulator rather than routing through `axis` (GDD 9.4).
  let gamepadWin = null;         // set by attach(); polled once per sample()
  let gamepadAxisX = 0;
  let gpDpadLeftDown = false, gpDpadRightDown = false;

  const out = { rotate: 0, fire: false, purge: false, jump: false };

  const detachers = [];

  // ---- the sink: every device path ends up calling these --------------------

  // Returns whether the key is bound at all, so a DOM adapter knows whether to
  // swallow the browser's default (space scrolling the page, say).
  function keyDown(rawKey) {
    const k = inputNormKey(rawKey);
    const bound = bindings.byKey.has(k) || actions.byKey.has(k);
    // Held keys repeat. A repeat is not a new press — treating it as one would
    // restart the ramp sixty times a second and re-arm the tap forever.
    if (pressed.has(k)) return bound;
    pressed.add(k);

    const dir = axis[bindings.byKey.get(k)];
    if (dir) { dir.down = true; dir.held = 0; dir.emitted = 0; dir.tap = true; }

    const named = actions.byKey.get(k);
    if (named !== undefined) queued.push(named);

    return bound;
  }

  function keyUp(rawKey) {
    const k = inputNormKey(rawKey);
    const bound = bindings.byKey.has(k) || actions.byKey.has(k);
    if (!pressed.delete(k)) return bound;
    const name = bindings.byKey.get(k);
    // Another key bound to the same direction may still be down (arrow + WASD).
    if (axis[name] && !anyKeyHeld(name)) releaseAxis(name);
    return bound;
  }

  function mouseMove(dx) {
    if (typeof dx === "number" && isFinite(dx)) mouseDx += dx;
  }

  // A button held by something that is not a key: a mouse button now, a touch
  // button in P4. Same four action names, same struct.
  function setButton(name, down) {
    if (down) buttons.add(name); else buttons.delete(name);
  }

  // Purge (top-right) and Jump (bottom-right), radius touchButtonR, mirrored
  // to the left side when inputMirror is set (GDD 9.3).
  function touchButtonCenters() {
    const m = touchButtonR * 1.5;
    if (inputMirror) return { purge: { x: m, y: m }, jump: { x: m, y: worldH - m } };
    return { purge: { x: worldW - m, y: m }, jump: { x: worldW - m, y: worldH - m } };
  }

  function inCircle(x, y, c, r) {
    const dx = x - c.x, dy = y - c.y;
    return dx * dx + dy * dy <= r * r;
  }

  // touchStart/touchMove/touchEnd take WORLD-SPACE coordinates (the same
  // 1280x720-ish space every other entity lives in) — the DOM adapter below
  // is what converts a real touch event's client pixels into that space, so
  // this trio stays exercisable with no DOM at all, same as the rest of the
  // sink.
  function touchStart(id, x, y) {
    const c = touchButtonCenters();
    if (inCircle(x, y, c.purge, touchButtonR)) { touches.set(id, { kind: "purge" }); buttons.add("purge"); return; }
    if (inCircle(x, y, c.jump,  touchButtonR)) { touches.set(id, { kind: "jump" });  buttons.add("jump");  return; }
    if (y >= worldH * (1 - touchZoneFrac)) {
      touches.set(id, { kind: "drag", x: x });
      touchDragCount++;
    }
  }

  function touchMove(id, x, y) {
    const t = touches.get(id);
    if (!t || t.kind !== "drag") return;
    touchDx += x - t.x;
    t.x = x;
  }

  function touchEnd(id) {
    const t = touches.get(id);
    if (!t) return;
    touches.delete(id);
    if (t.kind === "purge") buttons.delete("purge");
    else if (t.kind === "jump") buttons.delete("jump");
    else touchDragCount--;
  }

  // Polled once per sample() (the Gamepad API has no motion events — a stick
  // held over at rest produces nothing to listen for). `win` is whatever
  // attach() was given; a headless test can call this directly with a plain
  // `{ navigator: { getGamepads: () => [...] } }` object.
  function pollGamepads(win) {
    if (!win || !win.navigator || typeof win.navigator.getGamepads !== "function") return;
    let pads;
    try { pads = win.navigator.getGamepads(); } catch (err) { return; }
    const gp = pads && pads[0];
    if (!gp) {
      gamepadAxisX = 0;
      if (gpDpadLeftDown)  { keyUp("gamepadleft");  gpDpadLeftDown = false; }
      if (gpDpadRightDown) { keyUp("gamepadright"); gpDpadRightDown = false; }
      return;
    }
    const ax = gp.axes && typeof gp.axes[0] === "number" && isFinite(gp.axes[0]) ? gp.axes[0] : 0;
    gamepadAxisX = ax;

    // ⛔ The D-pad reaches `left`/`right` through keyDown/keyUp — the SAME
    // tap/hold implementation the keyboard uses. This is edge detection only;
    // the state machine that turns a press into a lane delta lives in exactly
    // one place (advanceAxis/releaseAxis above).
    const left  = !!(gp.buttons && gp.buttons[14] && gp.buttons[14].pressed);
    const right = !!(gp.buttons && gp.buttons[15] && gp.buttons[15].pressed);
    if (left !== gpDpadLeftDown)   { if (left) keyDown("gamepadleft"); else keyUp("gamepadleft"); gpDpadLeftDown = left; }
    if (right !== gpDpadRightDown) { if (right) keyDown("gamepadright"); else keyUp("gamepadright"); gpDpadRightDown = right; }
  }

  // Proportional past the deadzone, scaled by gamepadSens (GDD 9.4). Returns
  // a lane delta for this step, same units as the mouse/touch/tap paths.
  function gamepadAxisDelta(x, dt) {
    if (x <= -gamepadDeadzone || x >= gamepadDeadzone) return x * gamepadSens * dt;
    return 0;
  }

  function anyKeyHeld(name) {
    const list = bindings.byAction[name];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) if (pressed.has(list[i])) return true;
    return false;
  }

  function actionHeld(name) {
    return anyKeyHeld(name) || buttons.has(name);
  }

  // GDD 9.2 — a tap is EXACTLY one lane, in total. The ramp below has already
  // delivered part of that lane during the press, so release pays the balance.
  // ⛔ That means the constants must satisfy: the ramp integrated over
  // keyTapMs is at most one lane. At the shipped values it is ~0.76, so the
  // balance is positive; the clamp is there so a future retune that breaks the
  // relation degrades to "no extra nudge" rather than to a backwards jump.
  function releaseAxis(name) {
    const dir = axis[name];
    if (!dir.down) return;
    dir.down = false;
    if (dir.tap) {
      const rest = 1 - dir.emitted;
      if (rest > 0) impulse += (name === "left" ? -rest : rest);
    }
    dir.held = 0; dir.emitted = 0; dir.tap = false;
  }

  // Hold: accelerate keySpeedMin -> keySpeedMax over keyRamp (GDD 9.2). Ramping
  // from the first step rather than after the tap window is deliberate — a
  // 130 ms dead spot at the start of every hold is exactly the latency P1 says
  // must not exist.
  function advanceAxis(dir, dt) {
    if (!dir.down) return 0;
    dir.held += dt;
    if (dir.held >= keyTapS) dir.tap = false;
    const f = keyRamp > 0 ? Math.min(1, dir.held / keyRamp) : 1;
    const step = (keySpeedMin + (keySpeedMax - keySpeedMin) * f) * dt;
    dir.emitted += step;
    return step;
  }

  // ---- the one output ------------------------------------------------------

  // sample(dt, target) — writes the struct into `target` when given (the game
  // passes its own object so the mutable game object owns it) and returns it.
  // Allocates nothing.
  function sample(dt, target) {
    const s = target || out;

    pollGamepads(gamepadWin);

    let rotate = mouseDx * mouseSens;   // ⛔ linear. One multiply. No curve.
    mouseDx = 0;
    rotate += touchDx * touchSens;      // same model, different sensitivity
    touchDx = 0;

    rotate -= advanceAxis(axis.left, dt);
    rotate += advanceAxis(axis.right, dt);
    rotate += impulse;
    impulse = 0;

    rotate += gamepadAxisDelta(gamepadAxisX, dt);

    s.rotate = rotate;
    s.fire   = actionHeld("fire") || (touchAutofire && touchDragCount > 0);
    s.purge  = actionHeld("purge");
    s.jump   = actionHeld("jump");

    // Named actions are dispatched HERE, in simulation order, not at DOM-event
    // time. A recorded event list therefore replays identically (GDD 17.1),
    // and a debug action cannot land halfway through a frame.
    if (queued.length) {
      if (onAction) for (let i = 0; i < queued.length; i++) onAction(queued[i]);
      queued.length = 0;
    }
    return s;
  }

  function reset() {
    pressed.clear();
    buttons.clear();
    queued.length = 0;
    for (const name of Object.keys(axis)) {
      const dir = axis[name];
      dir.down = false; dir.held = 0; dir.emitted = 0; dir.tap = false;
    }
    mouseDx = 0;
    impulse = 0;
    lastClientX = null;
    touches.clear();
    touchDx = 0;
    touchDragCount = 0;
    gamepadAxisX = 0;
    gpDpadLeftDown = false;
    gpDpadRightDown = false;
    out.rotate = 0; out.fire = false; out.purge = false; out.jump = false;
  }

  // ---- DOM adapter ---------------------------------------------------------
  // ⛔ The only DOM-event code in the build. Everything above is reachable
  // without a document, which is what the headless suite drives.

  // Relative motion. Under Pointer Lock a mousemove carries a relative delta
  // directly; unlocked it may not, so fall back to differencing absolute
  // positions. Both are the same quantity — pixels since the last event.
  function relativeX(ev) {
    if (typeof ev.movementX === "number") { lastClientX = null; return ev.movementX; }
    const x = ev.clientX;
    if (typeof x !== "number") return 0;
    const d = lastClientX === null ? 0 : x - lastClientX;
    lastClientX = x;
    return d;
  }

  // GDD 9.1 — Pointer Lock is OFFERED on click and NEVER forced. Refusal, exit
  // by Escape, and a browser that has none are all normal: unlocked relative
  // motion still works, it just stops at the window edge.
  function offerLock(el, doc) {
    if (!pointerLockOffer) return;
    if (!el || typeof el.requestPointerLock !== "function") return;
    if (doc && doc.pointerLockElement === el) return;
    try {
      const p = el.requestPointerLock();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (err) { /* denied — the game plays unlocked */ }
  }

  function on(target, type, fn) {
    if (!target || typeof target.addEventListener !== "function") return;
    target.addEventListener(type, fn, false);
    detachers.push(function () { target.removeEventListener(type, fn, false); });
  }

  // attach({ window, document, element }) — element is what mouse events and
  // Pointer Lock bind to (the canvas). Safe to call with any of them missing.
  // Converts a Touch's client-space pixels into the world-space coordinates
  // touchStart/touchMove expect, accounting for CSS letterboxing (the canvas
  // is fixed WORLD_W x WORLD_H internally but can be scaled on screen).
  function touchWorldPoint(el, t) {
    const rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (!rect || !rect.width || !rect.height) return { x: t.clientX, y: t.clientY };
    return {
      x: (t.clientX - rect.left) / rect.width * worldW,
      y: (t.clientY - rect.top) / rect.height * worldH,
    };
  }

  function attach(env) {
    detach();
    const e = env || {};
    const doc = e.document || null;
    const win = e.window || null;
    const el  = e.element || doc;
    gamepadWin = win;

    on(doc, "keydown", function (ev) {
      if (keyDown(ev.key) && typeof ev.preventDefault === "function") ev.preventDefault();
    });
    on(doc, "keyup", function (ev) {
      if (keyUp(ev.key) && typeof ev.preventDefault === "function") ev.preventDefault();
    });

    on(el, "mousemove", function (ev) { mouseMove(relativeX(ev)); });
    on(el, "mousedown", function (ev) {
      if (ev.button === 2) setButton("purge", true);
      else { setButton("fire", true); offerLock(el, doc); }
    });
    on(el, "contextmenu", function (ev) {
      if (typeof ev.preventDefault === "function") ev.preventDefault();
    });
    // Release on the window: a button let go outside the canvas must not stick.
    on(win || doc, "mouseup", function (ev) {
      if (ev.button === 2) setButton("purge", false); else setButton("fire", false);
    });

    // Losing focus mid-press otherwise leaves the rim spinning forever.
    on(win || doc, "blur", function () { reset(); });

    on(el, "touchstart", function (ev) {
      const list = ev.changedTouches || [];
      for (let i = 0; i < list.length; i++) {
        const p = touchWorldPoint(el, list[i]);
        touchStart(list[i].identifier, p.x, p.y);
      }
      if (typeof ev.preventDefault === "function") ev.preventDefault();
    });
    on(el, "touchmove", function (ev) {
      const list = ev.changedTouches || [];
      for (let i = 0; i < list.length; i++) {
        const p = touchWorldPoint(el, list[i]);
        touchMove(list[i].identifier, p.x, p.y);
      }
      if (typeof ev.preventDefault === "function") ev.preventDefault();
    });
    function touchEndHandler(ev) {
      const list = ev.changedTouches || [];
      for (let i = 0; i < list.length; i++) touchEnd(list[i].identifier);
    }
    on(el, "touchend", touchEndHandler);
    on(el, "touchcancel", touchEndHandler);

    return detachers.length > 0;
  }

  function detach() {
    while (detachers.length) detachers.pop()();
    lastClientX = null;
    gamepadWin = null;
  }

  return {
    VERSION: INPUT_VERSION,
    sample, reset,
    keyDown, keyUp, mouseMove, setButton,
    touchStart, touchMove, touchEnd, pollGamepads,
    attach, detach,
    isBound: function (k) {
      const n = inputNormKey(k);
      return bindings.byKey.has(n) || actions.byKey.has(n);
    },
  };
}

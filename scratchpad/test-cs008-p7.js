// test-cs008-p7.js — CS008 P7: the CONTROLS page (GDD 9, 10.5; plan §8).
// Asserts what P7 owns: kit-input 0.6.0's configure() keys, setting(), the two
// binding setters and captureNext(); ⛔ the mouse path is still one multiply;
// each page setting changes the struct live; rebinding (the old key dead, a
// clash swaps, a reserved key refused, a swap that unbinds refused); a capture
// never reaches state.input; RESET TO DEFAULTS restores everything; the HUD's
// mirror side is the live flag; RESET stores the defaults (CS011 P2).
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. Driven through Game.frame() at half a step per frame (test-cs008-p6.js).
//  2. G.reset() restores the controls, and toTitle() calls it. A claim that a
//     setting SURVIVES a quit uses G.quitToTitle() alone.
//  3. Rebinding Fire off Space changes the confirm key: `conf` tracks it.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

installSeed(20260917);
const X = H.buildGame({ spy: ["drawHud"] });
const { C, state } = X;
const G = X.Game;
const MS = C.FIXED_DT * 1000;
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));

let now = 1759000000000;
Date.now = () => (now += 7919);

// ---------------------------------------------------------------------------
// the surface
// ---------------------------------------------------------------------------

const ver = G.input.VERSION.split(".").map(Number);
H.assert(ver[0] > 0 || ver[1] >= 6, `kit-input is at least 0.6.0 (got ${G.input.VERSION})`);
H.assert(/### 2026-09-13 — runtime settings, rebinding and capture \(`VERSION` 0\.5\.0 → 0\.6\.0\)/
           .test(fs.readFileSync(path.join(ROOT, "src", "04-input.NOTES.md"), "utf8")),
         "src/04-input.NOTES.md carries the 0.6.0 entry");
for (const m of ["setting", "setBindings", "setGamepadButtons", "getBindings", "getGamepadButtons", "captureNext"]) {
  H.eq(typeof G.input[m], "function", `kit-input exposes ${m}()`);
}
hasKnob(X, "SENS_MIN_MULT", { def: 0.5 }, H);
hasKnob(X, "SENS_MAX_MULT", { def: 2.0 }, H);
hasKnob(X, "SENS_STEP", { def: 0.1 }, H);

// ⛔ GDD 9.1: the mouse line in sample() is still one multiply of the live factor.
{
  const a = script.indexOf("function createInput("), b = script.indexOf("function sample(", a);
  const body = script.slice(b, script.indexOf("\n  }\n", b));
  H.assert(/let rotate = mouseDx \* mouseSens;/.test(body), "⛔ sample(): rotate = mouseDx * mouseSens, one multiply");
  H.eq((body.match(/mouseDx/g) || []).length, 2, "⛔ and mouseDx is read nowhere else in sample() (no curve)");
}

// ---------------------------------------------------------------------------
// the kit, headless
// ---------------------------------------------------------------------------

function kit(over) {
  return X.createInput(Object.assign({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS, keySpeedMin: C.KEY_SPEED_MIN,
    keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP, touchSens: C.TOUCH_SENS,
    touchZoneFrac: C.TOUCH_ZONE_FRAC, touchAutofire: true, touchButtonR: C.TOUCH_BUTTON_R,
    gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS, inputMirror: false,
    worldW: C.WORLD_W, worldH: C.WORLD_H,
  }, over || {}));
}
const DT = C.FIXED_DT;
const zoneY = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC);
const M = C.TOUCH_BUTTON_R * 1.5;

// ⛔ The mouse path: exact products at two factors, and linear.
{
  const k = kit();
  for (const sens of [C.MOUSE_SENS, C.MOUSE_SENS * 1.7]) {
    k.configure({ mouseSens: sens });
    H.eq(k.setting("mouseSens"), sens, `setting("mouseSens") reads ${sens}`);
    for (const dx of [1, 7, -13, 250, 1e4]) {
      k.mouseMove(dx);
      H.eq(k.sample(DT).rotate, dx * sens, `⛔ mouse ${dx} px at ${sens} is exactly dx × sens`);
    }
  }
  let threw = [];
  for (const bad of [{ mouseSens: "1" }, { touchSens: NaN }, { mouseSens: Infinity }, { inputMirror: 1 }, { keyTapMs: 5 }]) {
    try { k.configure(bad); threw.push(""); } catch (err) { threw.push(err.message); }
  }
  H.eq(threw[0], "configure: mouseSens must be a finite number", "configure() refuses a string sensitivity");
  H.eq(threw[1], "configure: touchSens must be a finite number", "and NaN");
  H.eq(threw[2], "configure: mouseSens must be a finite number", "and Infinity");
  H.eq(threw[3], "configure: inputMirror must be a boolean", "and a non-boolean mirror");
  H.eq(threw[4], "configure: keyTapMs is not configurable", "and an unlisted key, with 0.4.0's message");
  const before = k.setting("mouseSens");
  try { k.configure({ mouseSens: 1, touchSens: "x" }); } catch (err) { /* refused */ }
  H.eq(k.setting("mouseSens"), before, "⛔ a refused call writes nothing");
  let t = 0; try { k.setting("keyTapMs"); } catch (err) { t++; }
  H.eq(t, 1, "setting() refuses an unlisted key");
}

// Touch: sensitivity, auto-fire and the mirror, live.
{
  const k = kit();
  k.configure({ touchSens: C.TOUCH_SENS * 2 });
  k.touchStart(1, 600, zoneY + 40); k.touchMove(1, 610, zoneY + 40);
  const s = k.sample(DT);
  H.eq(s.rotate, 10 * C.TOUCH_SENS * 2, "a touch drag reads the configured touchSens");
  H.eq(s.fire, true, "auto-fire on: a drag fires");
  k.configure({ touchAutofire: false });
  H.eq(k.sample(DT).fire, false, "auto-fire off: the same drag does not");
  k.touchEnd(1);
  k.configure({ inputMirror: true });
  k.touchStart(2, M, M);
  H.eq(k.sample(DT).purge, true, "mirrored: the top-left corner is Purge");
  k.touchEnd(2); k.touchStart(3, C.WORLD_W - M, M);
  H.eq(k.sample(DT).purge, false, "mirrored: the top-right corner is not");
  k.touchEnd(3); k.configure({ inputMirror: false }); k.touchStart(4, C.WORLD_W - M, M);
  H.eq(k.sample(DT).purge, true, "unmirrored again: top-right is Purge");
}

// setBindings / setGamepadButtons.
{
  const k = kit({ actionKeys: { pause: ["p"] }, gamepadActions: { pause: [9] } });
  k.setBindings({ left: ["a"], right: ["d"], fire: ["q"], purge: ["shift"], jump: ["c"] });
  k.keyDown(" "); H.eq(k.sample(DT).fire, false, "after setBindings, the old fire key is dead"); k.keyUp(" ");
  k.keyDown("q"); H.eq(k.sample(DT).fire, true, "and the new one fires"); k.keyUp("q");
  const refuse = (fn, msg) => { let e = ""; try { fn(); } catch (err) { e = err.message; } H.assert(e !== "", msg + ` (${e})`); };
  refuse(() => k.setBindings({ fire: ["p"] }), "⛔ setBindings refuses a named-action key");
  refuse(() => k.setBindings({ fire: ["q"], purge: ["Q"] }), "setBindings refuses a key bound twice (case-insensitive)");
  refuse(() => k.setBindings({ fire: "q" }), "setBindings refuses a list that is not an array");
  k.keyDown("q"); H.eq(k.sample(DT).fire, true, "a refused setBindings left the map alone"); k.keyUp("q");
  refuse(() => k.setGamepadButtons({ fire: [9] }), "⛔ setGamepadButtons refuses a named-action button");
  refuse(() => k.setGamepadButtons({ fire: [1.5] }), "and a non-integer button");
  refuse(() => k.setGamepadButtons({ shoot: [1] }), "and an action it does not know");
  H.eq(JSON.stringify(k.getBindings().fire), '["q"]', "getBindings() is the map, without the D-pad's synthetic keys");

  const pad = { axes: [0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const win = { navigator: { getGamepads: () => [pad] } };
  H.eq(JSON.stringify(k.getGamepadButtons().left), "[14]", "left defaults to D-pad left");
  k.setGamepadButtons({ fire: [0], jump: [4], purge: [5], left: [2], right: [15] });
  pad.buttons[14].pressed = true; k.pollGamepads(win);
  H.eq(k.sample(DT).rotate, 0, "left rebound: D-pad left no longer rotates");
  pad.buttons[14].pressed = false; pad.buttons[2].pressed = true; k.pollGamepads(win);
  H.assert(k.sample(DT).rotate < 0, "and button 2 does, through the keyboard's tap/hold model");
  pad.buttons[2].pressed = false; k.pollGamepads(win); k.sample(DT);
  k.setGamepadButtons({ fire: [3] });
  H.eq(JSON.stringify(k.getGamepadButtons().right), "[15]", "a map omitting left/right keeps the D-pad");

  // A direction held when its key is rebound away lets go, rather than spinning.
  k.keyDown("d"); k.sample(DT);
  k.setBindings({ left: ["a"], right: ["l"], fire: ["q"], purge: ["shift"], jump: ["c"] });
  H.eq(k.sample(DT).rotate, 0, "⛔ a held direction whose key is rebound away stops (no endless spin)");
  k.keyUp("d"); H.eq(k.sample(DT).rotate, 0, "and its release pays no tap nudge");
}

// captureNext.
{
  const got = [], acted = [];
  const pad = { axes: [0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const win = { navigator: { getGamepads: () => [pad] } };
  const k = kit({ actionKeys: { pause: ["p"] }, onAction: n => acted.push(n) });
  k.keyDown(" "); k.sample(DT);                       // held before the capture arms
  k.captureNext(r => got.push(r));
  k.keyDown(" ");                                     // auto-repeat of a held key
  H.eq(got.length + (k.sample(DT).fire ? 0 : 1), 0, "a key held before arming is not captured and still fires");
  k.keyUp(" ");
  k.keyDown("z");
  H.eq(got.length, 0, "the capture is handed over in sample(), not at event time");
  const s = k.sample(DT);
  H.eq(JSON.stringify(got), '[{"key":"z"}]', "the next key press goes to cb");
  H.eq(s.fire, false, "⛔ and not into the struct (z is a fire key)");
  k.keyDown("z"); H.eq(k.sample(DT).fire, false, "⛔ its auto-repeat is swallowed too");
  k.keyUp("z"); k.keyDown("z"); H.eq(k.sample(DT).fire, true, "released and pressed again, it fires");
  k.keyUp("z"); k.sample(DT);
  k.captureNext(r => got.push(r)); k.keyDown("p"); k.sample(DT); k.keyUp("p");
  H.eq(acted.length, 0, "⛔ a captured named-action key dispatches nothing");
  H.eq(got[1].key, "p", "and reaches cb");

  const poll = () => { k.pollGamepads(win); return k.sample(DT); };   // headless: no attach()
  pad.buttons[0].pressed = true; poll();
  k.captureNext(r => got.push(r));
  let fire = poll().fire;
  H.eq(got.length === 2 && fire === true, true, "a pad button held before arming is not captured");
  pad.buttons[0].pressed = false; poll();
  pad.buttons[0].pressed = true; fire = poll().fire;
  H.eq(got[2] && got[2].button, 0, "a button press edge goes to cb");
  H.eq(fire, false, "⛔ and the held button is not fire");
  H.eq(poll().fire, false, "⛔ nor on the next poll while it stays held");
  pad.buttons[0].pressed = false; poll();
  pad.buttons[0].pressed = true; H.eq(poll().fire, true, "released and pressed again, it fires");
  pad.buttons[0].pressed = false; poll();
  k.captureNext(r => got.push(r)); k.captureNext(null); k.keyDown("z");
  H.eq(k.sample(DT).fire, true, "captureNext(null) disarms"); k.keyUp("z");
}

// ---------------------------------------------------------------------------
// the page
// ---------------------------------------------------------------------------

let clock = 0;
function halfFrame() { clock += MS / 2; G.frame(clock); }
function liveStep() {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
}
function steps(n) { for (let i = 0; i < n; i++) liveStep(); }
const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
function press(b) { b.down(); liveStep(); b.up(); liveStep(); }
function tap(dirKey, n) { for (let i = 0; i < n; i++) { G.input.keyDown(dirKey); steps(2); G.input.keyUp(dirKey); liveStep(); } }
const right = n => tap("ArrowRight", n), left = n => tap("ArrowLeft", n);
const SPACE = key(" "), SHIFT = key("Shift"), ESC = key("Escape");
let conf = SPACE;                                                  // trap 3
function toTitle() { G.reset(); clock = 0; G.frame(0); G.quitToTitle(); steps(2); conf = SPACE; }
function toControls() { toTitle(); right(1); press(conf); right(2); press(conf); }
function toPlay() { toTitle(); press(conf); press(conf); press(conf); }

const ctx2d = X._env.canvas.getContext("2d");
function drawn() {
  const prev = ctx2d.fillText, out = [];
  ctx2d.fillText = (str, x) => out.push({ str: String(str), x, align: ctx2d.textAlign });
  G.draw();
  ctx2d.fillText = prev;
  return out;
}
const detail = label => { const t = drawn(); const i = t.findIndex(x => x.str === label); return i < 0 ? null : t[i + 1].str; };
const lineText = () => drawn().filter(t => t.align === "center").map(t => t.str);
function noOverlap(tag) {
  const t = drawn(), w = s => s.str.length * C.MENU_TEXT_SIZE * C.TEXT_CHAR_W;
  const L = t.filter(x => x.align === "left"), R = t.filter(x => x.align === "right");
  let ok = true;
  for (const l of L) for (const r of R) if (!(l.x + w(l) < r.x - w(r))) ok = false;
  H.assert(ok, `${tag}: no label overlaps a detail`);
}

toControls();
H.eq(state.screen, "controls", "CONTROLS opens from OPTIONS");
const ROWS = ["MOUSE SENSITIVITY", "TOUCH SENSITIVITY", "LEFT-HANDED TOUCH", "TOUCH AUTO-FIRE", "KEYBOARD", "GAMEPAD", "RESET TO DEFAULTS", "BACK"];
const seen = new Set();
for (let i = 0; i < ROWS.length; i++) { for (const t of drawn()) seen.add(t.str); right(1); }
H.assert(ROWS.every(r => seen.has(r)), `CONTROLS rows are plan §8's (got ${[...seen].join(" / ")})`);

// Sensitivity: confirm adjusts, rotate moves by one step, any exit keeps.
toControls();
H.eq(detail("MOUSE SENSITIVITY"), "×1.0", "mouse sensitivity starts at ×1.0");
press(conf);
H.eq(detail("MOUSE SENSITIVITY"), "‹×1.0›", "confirm arms the row");
noOverlap("an adjusting row");
right(2);
H.eq(detail("MOUSE SENSITIVITY"), "‹×1.2›", "two taps: ×1.2");
H.eq(G.input.setting("mouseSens"), C.MOUSE_SENS * (12 / 10), "⛔ and the kit's factor moved live");
SHIFT.down(); steps(6); SHIFT.up(); liveStep();                   // a human-length hold
H.eq(state.screen, "controls", "⛔ Purge, held for several steps, leaves the row, not the page");
H.eq(detail("MOUSE SENSITIVITY"), "×1.2", "and keeps the value");
right(1);
H.eq(detail("TOUCH SENSITIVITY") !== null && state.screen === "controls", true, "the cursor moves again once the row lets go");
left(1);
press(conf); right(30);
H.eq(detail("MOUSE SENSITIVITY"), "‹×2.0›", "clamped at ×2.0 (C.SENS_MAX_MULT)");
left(40);
H.eq(detail("MOUSE SENSITIVITY"), "‹×0.5›", "clamped at ×0.5 (C.SENS_MIN_MULT)");
press(ESC);
H.eq(state.screen, "controls", "⛔ Escape leaves the row, not the page");
press(conf); right(5);                                             // ×1.0 again
H.eq(detail("MOUSE SENSITIVITY"), "‹×1.0›", "back to ×1.0");
H.eq(G.input.setting("mouseSens"), C.MOUSE_SENS, "⛔ ×1.0 is the shipped constant exactly");
right(3); press(conf);
H.eq(detail("MOUSE SENSITIVITY"), "×1.3", "Fire leaves the row and keeps ×1.3");

// Live in play: a mouse delta at two sensitivities, through the page.
{
  const sens13 = G.input.setting("mouseSens");
  G.quitToTitle(); steps(2);                                       // trap 2: no G.reset()
  press(conf); press(conf); press(conf);
  H.eq(state.screen, "play", "fixture: a run, settings kept across the title");
  G.input.mouseMove(40); liveStep();
  H.eq(state.input.rotate, 40 * sens13, "⛔ in play, a mouse delta reads ×1.3");
  toPlay();
  G.input.mouseMove(40); liveStep();
  H.eq(state.input.rotate, 40 * C.MOUSE_SENS, "⛔ after a reset, the same delta reads ×1.0");
}

// Touch sensitivity, LEFT-HANDED TOUCH, TOUCH AUTO-FIRE — live in play.
toControls();
right(1); press(conf); right(5); press(conf);
H.eq(detail("TOUCH SENSITIVITY"), "×1.5", "touch sensitivity ×1.5");
right(1); press(conf);
H.eq(detail("LEFT-HANDED TOUCH"), "ON", "LEFT-HANDED TOUCH toggles on");
H.eq(G.input.setting("inputMirror"), true, "and the kit's mirror flips at once");
right(1); press(conf);
H.eq(detail("TOUCH AUTO-FIRE"), C.TOUCH_AUTOFIRE ? "OFF" : "ON", "TOUCH AUTO-FIRE toggles");
G.input.touchStart(5, 640, zoneY + 40); liveStep();
H.eq(state.input.fire, false, "⛔ on a menu, a drag still never fires, whatever the setting");
G.input.touchEnd(5); liveStep();
{
  G.quitToTitle(); steps(2); press(conf); press(conf); press(conf);
  H.eq(state.screen, "play", "fixture: a run with the touch settings");
  G.input.touchStart(6, 640, zoneY + 40); liveStep();
  H.eq(state.input.fire, !C.TOUCH_AUTOFIRE, "⛔ in play, auto-fire is the page's setting");
  G.input.touchMove(6, 650, zoneY + 40); liveStep();
  H.eq(state.input.rotate, 10 * C.TOUCH_SENS * (15 / 10), "⛔ a touch drag reads ×1.5");
  G.input.touchEnd(6); liveStep();
  G.input.touchStart(7, M, M); liveStep();
  H.eq(state.input.purge, true, "⛔ mirrored: top-left is Purge in play");
  G.input.touchEnd(7); liveStep();
  G.input.touchStart(8, C.WORLD_W - M, M); liveStep();
  H.eq(state.input.purge, false, "and top-right is not");
  G.input.touchEnd(8); liveStep();
  const score = drawn().find(t => t.str === String(state.score) && t.align === "left");
  H.eq(score && score.x, C.HUD_MARGIN + C.TOUCH_BUTTON_R * C.HUD_TOUCH_INSET_R,
       "⛔ the HUD insets on the LEFT: it reads the live mirror flag, not C.INPUT_MIRROR");
  toPlay();
  G.input.touchStart(9, 640, zoneY + 40); liveStep();
  H.eq(state.input.fire, C.TOUCH_AUTOFIRE, "after a reset, auto-fire is shipped again");
  G.input.touchEnd(9); liveStep();
}

// KEYBOARD: rebind, the old key dead, a swap, the refusals, no leak.
toControls();
right(4); press(conf);
H.eq(state.screen, "keyboard", "KEYBOARD opens");
noOverlap("KEYBOARD");
right(4);                                                          // FIRE 1
H.eq(detail("FIRE 1"), "SPACE", "FIRE 1 shows Space");
press(conf);
H.eq(detail("FIRE 1"), "PRESS A KEY", "confirm arms a capture");
key("q").down(); liveStep();
H.eq(state.input.fire, false, "⛔ the captured key is not in state.input");
H.eq(state.screen, "keyboard", "and confirms nothing");
key("q").up(); liveStep();
H.eq(detail("FIRE 1"), "Q", "FIRE 1 is Q");
H.eq(JSON.stringify(G.input.getBindings().fire), '["q","z"]', "the kit has fire = q, z");
conf = key("q");
SPACE.down(); liveStep();
H.eq(state.input.fire, false, "⛔ the old key no longer fires");
SPACE.up(); liveStep();
key("q").down(); liveStep();
H.eq(state.input.fire, true, "the new key does");
key("q").up(); liveStep();
H.eq(detail("FIRE 1"), "PRESS A KEY", "(and here that press re-armed FIRE 1's capture)");
G.input.setButton("fire", true); liveStep(); G.input.setButton("fire", false); liveStep();
H.eq(detail("FIRE 1"), "Q", "a mouse click cancels it");

// Refusals end the capture with a reason; Escape is not a back out of the page.
for (const [k, shown] of [["Escape", "ESCAPE"], ["p", "P"], ["w", "W"], ["7", "7"], ["1", "1"], ["t", "T"]]) {
  press(conf);
  key(k).down(); liveStep();
  H.eq(state.screen, "keyboard", `⛔ ${shown} during a capture neither backs out nor pauses`);
  key(k).up(); liveStep();
  H.assert(lineText().includes(shown + " IS RESERVED"), `⛔ ${shown} is refused with a visible reason`);
  H.eq(detail("FIRE 1"), "Q", `${shown}: FIRE 1 unchanged, and the capture has ended`);
}
H.eq(JSON.stringify(G.input.getBindings().fire), '["q","z"]', "no refusal wrote a binding");
press(conf); SPACE.down(); liveStep();                             // a live Space press after refusals
H.eq(state.input.fire, false, "(capture armed: Space goes to the capture)"); SPACE.up(); liveStep();
H.eq(detail("FIRE 1"), "SPACE", "Space rebinds back cleanly");
conf = SPACE;
press(conf); key("q").down(); liveStep(); key("q").up(); liveStep();
H.eq(detail("FIRE 1"), "Q", "and Q again");
conf = key("q");

// A clash swaps: FIRE 2 ← X, which is PURGE 2.
right(1); press(conf); key("x").down(); liveStep(); key("x").up(); liveStep();
H.eq(detail("FIRE 2"), "X", "FIRE 2 is X");
H.eq(detail("PURGE 2"), "Z", "⛔ PURGE 2 took FIRE 2's old key: a swap");
const kb = G.input.getBindings();
H.eq(JSON.stringify([kb.fire, kb.purge]), '[["q","x"],["shift","z"]]', "⛔ both actions stay bound");

// A mouse click cancels a capture.
press(conf);
G.input.setButton("fire", true); liveStep(); G.input.setButton("fire", false); liveStep();
H.eq(detail("FIRE 2"), "X", "a mouse click cancels the capture");
key("m").down(); liveStep(); key("m").up(); liveStep();
H.eq(detail("FIRE 2"), "X", "and the next key is not captured");
H.eq(state.screen, "keyboard", "(still on KEYBOARD)");

// GAMEPAD: a button capture, swallowed, a swap, Start refused, an unbind refused.
const nav = X._env.win.navigator;
const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
nav.getGamepads = () => [pad];
const btn = i => ({ down: () => { pad.buttons[i].pressed = true; }, up: () => { pad.buttons[i].pressed = false; } });
key("z").down(); liveStep();
H.eq(state.screen, "controls", "⛔ Z is Purge now: it backs out of KEYBOARD to CONTROLS");
key("z").up(); liveStep();
right(5); press(conf);
H.eq(state.screen, "gamepad", "GAMEPAD opens");
noOverlap("GAMEPAD");
right(8);                                                          // JUMP 1
H.eq(detail("JUMP 1"), "LB", "JUMP 1 shows LB");
press(conf);
H.eq(detail("JUMP 1"), "PRESS A BUTTON", "confirm arms a capture");
btn(2).down(); liveStep();
H.eq(state.input.jump || state.input.fire, false, "⛔ the captured button is not in state.input");
steps(3);
H.eq(detail("JUMP 1"), "X", "JUMP 1 is X (button 2)");
btn(2).up(); liveStep();
H.eq(JSON.stringify(G.input.getGamepadButtons().jump), "[2,6]", "the kit has jump = 2, 6");
btn(2).down(); liveStep(); H.eq(state.input.jump, true, "button 2 jumps now"); btn(2).up(); liveStep();

left(8);                                                           // LEFT 1 → FIRE 1 is row 4
right(4); press(conf); btn(6).down(); liveStep(); btn(6).up(); liveStep();
H.eq(detail("FIRE 1"), "LT", "FIRE 1 ← LT (JUMP 2's button)");
H.eq(JSON.stringify(G.input.getGamepadButtons().jump), "[2,0]", "⛔ JUMP 2 took A: a swap (below the row window, so read off the kit)");
press(conf); btn(C.GAMEPAD_PAUSE_BUTTON).down(); liveStep(); btn(C.GAMEPAD_PAUSE_BUTTON).up(); liveStep();
H.assert(lineText().includes("START IS RESERVED"), "⛔ Start is refused with a visible reason");
H.eq(state.screen, "gamepad", "and pauses nothing");
press(conf); key("k").down(); liveStep(); key("k").up(); liveStep();
H.assert(lineText().includes("PRESS A BUTTON"), "a key on the GAMEPAD page is refused");
left(3);                                                           // LEFT 2, empty
H.eq(detail("LEFT 2"), "-", "LEFT 2 is empty");
press(conf); btn(6).down(); liveStep(); btn(6).up(); liveStep();
H.assert(lineText().includes("FIRE NEEDS A BUTTON"), "⛔ a swap that leaves FIRE with no button is refused");
H.eq(detail("FIRE 1"), "LT", "and FIRE keeps its button");

// RESET TO DEFAULTS restores everything, and stores the defaults (CS011 P2).
press(SHIFT);
H.eq(state.screen, "controls", "fixture: back on CONTROLS, cursor on its first row");
{
  // Put both sensitivities and the two toggles off their defaults, then RESET.
  press(conf); right(4); press(conf);
  right(1); press(conf); right(3); press(conf);
  right(1); press(conf);
  right(1); press(conf);
  H.assert(G.input.setting("touchSens") !== C.TOUCH_SENS && G.input.setting("inputMirror") !== C.INPUT_MIRROR,
           "fixture: settings off their defaults");
  right(3); press(conf);                                           // RESET TO DEFAULTS
  const want = {}; for (const a of ["left", "right", "fire", "purge", "jump"]) want[a] = X.INPUT_KEYS_DEFAULT[a];
  const sorted = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  H.eq(sorted(G.input.getBindings()), sorted(want), "⛔ RESET restores INPUT_KEYS_DEFAULT");
  H.eq(sorted(G.input.getGamepadButtons()), sorted({ fire: [0], jump: [4, 6], purge: [5, 7], left: [14], right: [15] }),
       "⛔ RESET restores the gamepad defaults");
  H.eq(G.input.setting("mouseSens"), C.MOUSE_SENS, "⛔ RESET restores C.MOUSE_SENS");
  H.eq(G.input.setting("touchSens"), C.TOUCH_SENS, "⛔ RESET restores C.TOUCH_SENS");
  H.eq(G.input.setting("inputMirror"), C.INPUT_MIRROR, "⛔ RESET restores C.INPUT_MIRROR");
  H.eq(detail("TOUCH AUTO-FIRE"), C.TOUCH_AUTOFIRE ? "ON" : "OFF", "⛔ RESET restores C.TOUCH_AUTOFIRE");
  H.eq(detail("TOUCH SENSITIVITY"), "×1.0", "and the rows show it");
  const slots = m => { const o = {}; for (const a of ["left", "right", "fire", "purge", "jump"]) o[a] = [m[a][0] ?? null, m[a][1] ?? null]; return o; };
  const vol = C.AUDIO_VOL_DEFAULT;
  H.eq(JSON.stringify(X.Profiles.scope().get("settings", null)), JSON.stringify({
    controls: { mouse: 10, touch: 10, autofire: C.TOUCH_AUTOFIRE, mirror: C.INPUT_MIRROR,
                keys: slots(X.INPUT_KEYS_DEFAULT), pad: slots({ fire: [0], jump: [4, 6], purge: [5, 7], left: [14], right: [15] }) },
    sound: { master: vol, music: vol, sfx: vol, voice: vol, track: C.MUSIC_TRACK_CHOICES[0] } }),
       "⛔ RESET TO DEFAULTS stores the shipped defaults in the profile's settings (CS011 P2)");
}

// The HUD draws over the new pages when OPTIONS was opened from pause (H4).
toPlay();
key("p").down(); liveStep(); key("p").up(); liveStep();
right(1); press(conf); right(2); press(conf); right(4); press(conf);
H.eq(state.screen, "keyboard", "fixture: KEYBOARD from pause");
{ const h = X.drawHud.calls; G.draw(); H.eq(X.drawHud.calls - h, 1, "⛔ H4: the HUD draws over KEYBOARD opened from pause"); }
toTitle(); right(1); press(conf); right(2); press(conf); right(4); press(conf);
{ const h = X.drawHud.calls; G.draw(); H.eq(X.drawHud.calls - h, 0, "and not over KEYBOARD opened from the title"); }

H.report();

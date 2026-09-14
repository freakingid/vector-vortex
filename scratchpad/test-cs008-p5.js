// test-cs008-p5.js — CS008 P5: the screens (GDD 10.5, 4.4, 4.6, 13; plan §6).
// Asserts what P5 owns: boot is the title; title → mode → depth → play → death
// → game over → RESTART, and → QUIT TO TITLE, on all four devices through the
// input sink only; OVERDRIVE cannot be chosen; Purge and Escape back out; a
// keyboard tap is one row; the simulation stops on every non-play screen; the
// HUD per H4; kit-input 0.4.0's menu touch; no `restart` action in the build.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The freeze exists only in Game.frame(), so everything is driven at HALF a
//     step per frame and counted in live ticks (test-cs003-p4.js's rule).
//  2. startGame() from a menu takes a TIME seed. Date.now is replaced with a
//     counter so "a new seed" is an exact assertion, not a millisecond race.
//  3. A mouse or touch rotation leaves half a row in the accumulator on
//     purpose, so each screen is rotated at most once per visit.
//  4. Fixtures write state only to stage a death (lives = 1, a rim Vaulter);
//     every screen change is a device press.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260915;
installSeed(SEED);
const X = H.buildGame({ spy: ["drawHud", "drawMenu"] });
const { C, state } = X;
const G = X.Game;
const MS = C.FIXED_DT * 1000;
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));

let now = 1757000000000;
Date.now = () => (now += 7919);                          // trap 2

// ---------------------------------------------------------------------------
// boot, the deleted action, the surface
// ---------------------------------------------------------------------------

H.eq(state.screen, "title", "⛔ boot is the title");
H.eq(state.skimmer, null, "and no run exists at boot");
H.eq(X.newState().screen, "play", "⛔ newState().screen stays \"play\"");

H.assert(!/["']restart["']/.test(script), "⛔ no \"restart\" action name anywhere in the built file");
H.assert(!/\brestart\s*:/.test(script), "⛔ and no restart binding key");
H.eq(G.input.isBound("r"), false, "⛔ \"r\" is bound to nothing");
H.eq(G.input.isBound("escape"), true, "Escape is bound (the named back action)");
// ⛔ REWRITTEN IN PLACE AT CS008 P6: the claim is that 0.4.0's tap source and
// configure() are in, and a later MINOR (P6's 0.5.0, P7's) still carries them.
const kitVer = G.input.VERSION.split(".").map(Number);
H.assert(kitVer[0] > 0 || kitVer[1] >= 4, `kit-input is at least 0.4.0 (MINOR: the tap source and configure()) (got ${G.input.VERSION})`);
H.assert(fs.existsSync(path.join(ROOT, "src", "15-render-hud.NOTES.md")),
         "src/15-render-hud.NOTES.md exists — kit-menu's backport packet");
for (const n of ["createMenu", "drawMenu", "menuWindowStart"]) H.assert(X[n] !== null, `the build defines ${n}`);
H.assert(typeof G.quitToTitle === "function" && G.menu && typeof G.menu.step === "function",
         "Game exposes quitToTitle and its menu");
H.eq(C.MENU_ROTATE_STEP, 1.0, "C.MENU_ROTATE_STEP is one lane");

function fnBody(name) {
  const i = script.indexOf(`function ${name}(`);
  if (i < 0) return "";
  let depth = 0;
  for (let k = script.indexOf("{", i); k < script.length; k++) {
    if (script[k] === "{") depth++;
    else if (script[k] === "}" && --depth === 0) return script.slice(i, k + 1);
  }
  return "";
}
const menuBody = fnBody("createMenu");
H.assert(menuBody.length > 500, "fixture: the createMenu body was found");
H.assert(!/\bC\./.test(menuBody) && !/\bstate\b/.test(menuBody) && !/\bWELLS\b/.test(menuBody),
         "⛔ the menu model reads no C, no state, no WELLS (kit boundary)");

// ---------------------------------------------------------------------------
// the loop and the devices
// ---------------------------------------------------------------------------

let clock = 0;
function halfFrame() { clock += MS / 2; G.frame(clock); }
function liveStep() {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  return G.stats.ticks >= want;
}
function steps(n) { for (let i = 0; i < n; i++) liveStep(); }
function runFreeze() { for (let n = 0; G.hitStopLeft > 0 && n < 600; n++) halfFrame(); }
function toTitle() { G.reset(); clock = 0; G.frame(0); G.quitToTitle(); steps(2); }

const zoneY = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC);
const btnM = C.TOUCH_BUTTON_R * 1.5;
const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
const nav = X._env.win.navigator;

function keyTaps(n) {
  const k = n > 0 ? "ArrowRight" : "ArrowLeft";
  for (let i = 0; i < Math.abs(n); i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); }
}
const half = n => n + (n > 0 ? 0.5 : -0.5);          // trap 3

const DEVICES = [
  { name: "keyboard",
    fire:  d => d ? G.input.keyDown(" ") : G.input.keyUp(" "),
    purge: d => d ? G.input.keyDown("Shift") : G.input.keyUp("Shift"),
    rotate: keyTaps },
  { name: "mouse",
    fire:  d => G.input.setButton("fire", d),
    purge: d => G.input.setButton("purge", d),
    rotate: n => { G.input.mouseMove(half(n) / C.MOUSE_SENS); liveStep(); } },
  { name: "gamepad",
    setup: () => { nav.getGamepads = () => [pad]; },
    teardown: () => { nav.getGamepads = () => []; liveStep(); delete nav.getGamepads; },
    fire:  d => { pad.buttons[0].pressed = d; },
    purge: d => { pad.buttons[5].pressed = d; },
    rotate: n => {
      const b = pad.buttons[n > 0 ? 15 : 14];
      for (let i = 0; i < Math.abs(n); i++) { b.pressed = true; steps(2); b.pressed = false; liveStep(); }
    } },
  { name: "touch",
    fire:  d => d ? G.input.touchStart(1, C.WORLD_W / 2, zoneY / 2) : G.input.touchEnd(1),
    purge: d => d ? G.input.touchStart(2, C.WORLD_W - btnM, btnM) : G.input.touchEnd(2),
    rotate: n => {
      G.input.touchStart(3, 300, zoneY + 100); liveStep();
      G.input.touchMove(3, 300 + half(n) / C.TOUCH_SENS, zoneY + 100); liveStep();
      G.input.touchEnd(3); liveStep();
    } },
];

const ESC = { back: d => d ? G.input.keyDown("Escape") : G.input.keyUp("Escape") };
function press(dev, btn) { dev[btn](true); liveStep(); dev[btn](false); liveStep(); }
function pressFrozen(dev, btn) { dev[btn](true); halfFrame(); halfFrame(); dev[btn](false); halfFrame(); halfFrame(); }

// A death that is the game over, in the Skimmer's lane, right now.
function die(label) {
  state.spawn.remaining = 1;
  state.spawn.timer = 0;
  state.enemies = [];
  state.shots = [];
  state.lives = 1;
  const e = X.spawnEnemy("vaulter", state.skimmer.lane, 0);
  e.depth = e.killDepth;
  state.invulnTime = C.RESPAWN_INVULN;
  liveStep();
  H.eq(state.screen, "gameover", `${label}: fixture — the death is the game over`);
  H.assert(G.hitStopLeft > 0, `${label}: fixture — and the freeze is running`);
}

function drawDeltas() {
  const h = X.drawHud.calls, m = X.drawMenu.calls;
  G.draw();
  return { hud: X.drawHud.calls - h, menu: X.drawMenu.calls - m };
}
function assertH4(label) {
  const d = drawDeltas();
  const run = state.screen === "play" || state.screen === "gameover";
  H.eq(d.hud, run ? 1 : 0, `⛔ H4, ${label} (${state.screen}): the HUD ${run ? "draws" : "does not draw"}`);
  H.eq(d.menu, state.screen === "play" ? 0 : 1, `${label} (${state.screen}): the menu draws off play only`);
}

// ---------------------------------------------------------------------------
// ⛔ THE FLOW, ON ALL FOUR DEVICES
// ---------------------------------------------------------------------------

for (const dev of DEVICES) {
  const L = dev.name;
  if (dev.setup) dev.setup();
  toTitle();
  H.eq(state.screen, "title", `${L}: the title`);
  H.eq(G.menu.cursor, 0, `${L}: PLAY is highlighted`);
  assertH4(L);

  dev.fire(true);
  steps(6);
  H.eq(state.screen, "mode", `${L}: ⛔ PLAY opens MODE, and a Fire held on into MODE confirms nothing there`);
  dev.fire(false);
  liveStep();
  assertH4(L);
  press(dev, "purge");
  H.eq(state.screen, "title", `${L}: Purge backs out of MODE`);
  press(dev, "fire");
  H.eq(state.screen, "mode", `${L}: and PLAY opens it again`);

  dev.rotate(1);
  H.eq(G.menu.cursor, 0, `${L}: ⛔ rotating toward OVERDRIVE leaves CLASSIC highlighted`);
  press(dev, "fire");
  H.eq(state.screen, "depth", `${L}: CLASSIC opens START DEPTH`);
  assertH4(L);
  const list = X.startDepthOptions();
  H.assert(list.length >= 3, `${L}: fixture — the list has a third row`);

  dev.rotate(2);
  H.eq(G.menu.cursor, 2, `${L}: rotate moves the cursor two rows`);
  H.eq(state.screen, "depth", `${L}: ⛔ and moving the cursor confirmed nothing`);
  let seedBefore = now >>> 0;
  press(dev, "fire");
  H.eq(state.screen, "play", `${L}: a START DEPTH row starts the run`);
  H.eq(state.startDepth, list[2], `${L}: at the chosen Start Depth`);
  H.eq(state.level, list[2], `${L}: on that level`);
  H.eq(state.mode, "classic", `${L}: in CLASSIC`);
  H.eq(state.lives, C.START_LIVES, `${L}: with START_LIVES`);
  H.assert(state.skimmer && !state.skimmer.dead, `${L}: with a live craft`);
  H.assert(state.seed !== seedBefore && state.seed === ((now >>> 0)), `${L}: on a time seed`);
  assertH4(L);

  die(L);
  pressFrozen(dev, "fire");
  pressFrozen(dev, "purge");
  if (dev === DEVICES[0]) pressFrozen(ESC, "back");
  H.assert(G.hitStopLeft > 0, `${L}: fixture — the presses landed inside the freeze`);
  H.eq(state.screen, "gameover", `${L}: ⛔ the game-over menu is inert during the freeze`);
  dev.fire(true);                                            // held across its end
  runFreeze();
  steps(3);
  H.eq(state.screen, "gameover", `${L}: ⛔ nothing pressed in the freeze acts after it, held or not`);
  dev.fire(false);
  liveStep();
  H.eq(G.menu.cursor, 0, `${L}: RESTART is highlighted`);
  assertH4(L);

  const firstSeed = state.seed;
  press(dev, "fire");
  H.eq(state.screen, "play", `${L}: RESTART starts a run`);
  H.eq(state.lives, C.START_LIVES, `${L}: RESTART restores START_LIVES`);
  H.eq(state.startDepth, list[2], `${L}: ⛔ RESTART keeps the Start Depth (U2)`);
  H.eq(state.level, list[2], `${L}: and its level`);
  H.eq(state.mode, "classic", `${L}: and the mode`);
  H.assert(state.seed !== firstSeed && state.seed === ((now >>> 0)), `${L}: ⛔ on a new seed`);
  H.assert(state.skimmer && !state.skimmer.dead, `${L}: with a live craft`);
  H.eq(G.hitStopLeft, 0, `${L}: ⛔ the fresh run inherits no freeze`);
  H.eq(state.score, 0, `${L}: and no score`);

  die(L);
  runFreeze();
  steps(2);
  dev.rotate(1);
  H.eq(G.menu.cursor, 1, `${L}: QUIT TO TITLE highlighted`);
  press(dev, "fire");
  H.eq(state.screen, "title", `${L}: QUIT TO TITLE goes to the title`);
  H.eq(state.skimmer, null, `${L}: and no run is left behind`);
  H.eq(state.enemies.length, 0, `${L}: no board`);
  H.eq(state.score, 0, `${L}: no stale score`);
  H.eq(G.hitStopLeft, 0, `${L}: no freeze`);
  assertH4(L);

  if (dev.teardown) dev.teardown();
}

// ---------------------------------------------------------------------------
// ⛔ BACK: Purge and Escape out of every non-title screen (keyboard)
// ---------------------------------------------------------------------------

const KB = DEVICES[0];
const esc = ESC;
for (const [label, backOut] of [["Purge", () => press(KB, "purge")],
                                ["Escape", () => press(esc, "back")]]) {
  toTitle();
  backOut();
  H.eq(state.screen, "title", `${label} on the title does nothing`);
  press(KB, "fire");                                         // mode
  backOut();
  H.eq(state.screen, "title", `⛔ ${label} backs out of MODE to the title`);
  press(KB, "fire"); press(KB, "fire");                      // depth
  backOut();
  H.eq(state.screen, "mode", `⛔ ${label} backs out of START DEPTH to MODE`);
  toTitle();
  keyTaps(1);
  press(KB, "fire");
  H.eq(state.screen, "options", "OPTIONS opens its screen");
  assertH4("options");
  backOut();
  H.eq(state.screen, "title", `⛔ ${label} backs out of OPTIONS to the title`);
  press(KB, "fire"); press(KB, "fire"); press(KB, "fire");   // a run
  H.eq(state.screen, "play", "fixture: a run for the game over");
  die(label);
  runFreeze();
  steps(2);
  backOut();
  H.eq(state.screen, "title", `⛔ ${label} backs out of GAME OVER to the title`);
}

// Escape in play is not banked for the next menu. ⛔ REWRITTEN IN PLACE AT CS008
// P6: Escape in play now PAUSES (U4) and a second Escape resumes; the claim that
// neither press reaches game over is unchanged.
toTitle();
press(KB, "fire"); press(KB, "fire"); press(KB, "fire");
press(esc, "back");
H.eq(state.screen, "pause", "Escape in play pauses (CS008 P6)");
press(esc, "back");
H.eq(state.screen, "play", "and Escape on the pause menu resumes");
die("banked Escape");
runFreeze();
steps(2);
H.eq(state.screen, "gameover", "⛔ an Escape pressed in play is not banked into game over");

// ---------------------------------------------------------------------------
// ⛔ OVERDRIVE IS SHOWN AND CANNOT BE CHOSEN (M1)
// ---------------------------------------------------------------------------

toTitle();
press(KB, "fire");
const ctx2d = X._env.canvas.getContext("2d");
const prevFill = ctx2d.fillText;
const texts = [];
ctx2d.fillText = (str) => texts.push({ str, color: ctx2d.fillStyle });
G.draw();
ctx2d.fillText = prevFill;
const od = texts.find(t => t.str === "OVERDRIVE");
H.assert(od && od.color === C.MENU_LOCKED_COLOR, "OVERDRIVE is drawn, in the locked colour");
keyTaps(3);
H.eq(G.menu.cursor, 0, "⛔ three taps toward OVERDRIVE leave the cursor on CLASSIC");
press(KB, "fire");
press(KB, "fire");
H.eq(state.mode, "classic", "⛔ and the run that follows is CLASSIC");

const m = X.createMenu({ rotateStep: 1 });
const two = { back: null, items: [{ enabled: true, action: "a" }, { enabled: false, action: "b" }] };
const snap = (rotate, fire, purge) => ({ rotate, fire, purge });
m.step(two, snap(0, false, false));                         // the entry step
m.step(two, snap(5, false, false));
H.eq(m.cursor, 0, "the model: a disabled last row is never the cursor");
H.eq(m.step(two, snap(0, true, false)), "a", "and confirm returns the enabled row's action");

// ---------------------------------------------------------------------------
// ⛔ A KEYBOARD TAP IS ONE ROW; a flick is several; the ends clamp
// ---------------------------------------------------------------------------

X.levelRecord().noteCleared(81);
toTitle();
press(KB, "fire"); press(KB, "fire");
const rows = X.startDepthOptions().length;
H.eq(rows, 41, "fixture: the list is 1..81 odd");
for (let n = 1; n * C.FIXED_DT * 1000 < C.KEY_TAP_MS; n++) {
  const c0 = G.menu.cursor;
  G.input.keyDown("ArrowRight"); steps(n); G.input.keyUp("ArrowRight"); liveStep();
  H.eq(G.menu.cursor, c0 + 1, `⛔ a ${n}-step right tap moves exactly one row`);
  G.input.keyDown("ArrowLeft"); steps(n); G.input.keyUp("ArrowLeft"); liveStep();
  H.eq(G.menu.cursor, c0, `⛔ and a ${n}-step left tap moves it back`);
}
G.input.mouseMove(3.5 / C.MOUSE_SENS); liveStep();
H.eq(G.menu.cursor, 3, "a mouse flick of 3.5 lanes moves three rows");
G.input.mouseMove(1000 / C.MOUSE_SENS); liveStep();
H.eq(G.menu.cursor, rows - 1, "a huge flick clamps on the last row");
keyTaps(1);
H.eq(G.menu.cursor, rows - 1, "and does not wrap");
G.input.mouseMove(-1000 / C.MOUSE_SENS); liveStep();
H.eq(G.menu.cursor, 0, "the first row clamps too");
H.eq(X.menuWindowStart(41, 0, C.MENU_VISIBLE_ROWS), 0, "the row window pins to the top");
H.eq(X.menuWindowStart(41, 40, C.MENU_VISIBLE_ROWS), 41 - C.MENU_VISIBLE_ROWS, "and to the bottom");
H.eq(X.menuWindowStart(41, 20, C.MENU_VISIBLE_ROWS), 20 - Math.floor(C.MENU_VISIBLE_ROWS / 2),
     "and centres the cursor between");
assertH4("depth, 41 rows");
H.eq(state.screen, "depth", "⛔ no row was confirmed by any of it");

// ---------------------------------------------------------------------------
// ⛔ THE STOP ON EVERY NON-PLAY SCREEN: no clock, no spawner, no entity pass
// ---------------------------------------------------------------------------

function stagedBoard() {
  G.reset(); clock = 0; G.frame(0);
  X.startGame(SEED);
  state.spawn.remaining = C.SPAWN_QUOTA;
  state.spawn.timer = 1e6;                                   // a spawn is overdue
  state.enemies = [];
  const e = X.spawnEnemy("vaulter", 2, 0);
  e.depth = 0.3;
  return e;
}
for (const scr of ["play", "title", "mode", "depth", "options", "gameover"]) {
  const e = stagedBoard();
  state.screen = scr;
  const t0 = state.time, d0 = e.depth, n0 = state.enemies.length, r0 = state.spawn.remaining, k0 = G.stats.ticks;
  steps(30);
  H.eq(G.stats.ticks - k0, 30, `fixture (${scr}): 30 live steps ran`);
  if (scr === "play") {
    H.assert(state.time > t0 && e.depth !== d0, "positive control: on play the clock and the entity pass run");
    continue;
  }
  H.eq(state.time, t0, `⛔ ${scr}: no simulation clock`);
  H.eq(e.depth, d0, `⛔ ${scr}: no entity pass`);
  H.assert(state.enemies.length === n0 && state.spawn.remaining === r0, `⛔ ${scr}: no spawner`);
}

// ---------------------------------------------------------------------------
// kit-input 0.4.0 — touch off play and in it
// ---------------------------------------------------------------------------

toTitle();
G.input.touchStart(5, 640, zoneY + 50); liveStep();
H.eq(state.input.fire, false, "⛔ off play, a rotation-zone touch does not fire (auto-fire off)");
G.input.touchEnd(5);
G.input.touchStart(6, 640, zoneY / 2); liveStep();
H.eq(state.input.fire, true, "off play, a tap above the rotation zone holds fire");
G.input.touchEnd(6); liveStep();
H.eq(state.screen, "mode", "and that tap confirmed PLAY");
stagedBoard();
state.enemies = [];
liveStep();
G.input.touchStart(7, 640, zoneY / 2); liveStep();
H.eq(state.input.fire, false, "⛔ in play, a tap above the rotation zone fires nothing (0.3.0 behaviour)");
G.input.touchEnd(7);
G.input.touchStart(8, 640, zoneY + 50); liveStep();
H.eq(state.input.fire, C.TOUCH_AUTOFIRE, "⛔ in play, a rotation-zone touch auto-fires as shipped");
G.input.touchEnd(8); liveStep();
let threw = 0;
// CS008 P7 made touchSens configurable (kit-input 0.6.0); keyTapMs stays unlisted.
try { G.input.configure({ keyTapMs: 1 }); } catch (err) { threw++; }
try { G.input.configure({ touchTapFire: true, touchAutofire: 1 }); } catch (err) { threw++; }
H.eq(threw, 2, "configure() refuses an unlisted key and a non-boolean");
G.input.touchStart(9, 640, zoneY / 2); liveStep();
H.eq(state.input.fire, false, "⛔ and a refused call wrote nothing (tap-fire still off in play)");
G.input.touchEnd(9);

H.report();

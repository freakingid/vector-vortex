// test-cs008-p6.js — CS008 P6: pause, Options and Credits (GDD 10.5, 15.6, 18;
// plan §7). Asserts what P6 owns: pause from all five sources (Escape, `p`,
// gamepad Start, the top-edge touch target, the page going hidden), in play
// only; nothing simulates while paused; ⛔ hitStopLeft and the fragmentation
// hold under a pause taken inside a death freeze; resume is instant and spends
// no Purge; OPTIONS from the title and from pause; the telemetry row is the `t`
// key and EXPORT is `e`; the credits carry no forbidden word; the CONTROLS row
// opens its page; kit-input 0.5.0's three action sources.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The freeze lives in Game.frame(), so everything is driven through frame()
//     at HALF a step per frame and counted in ticks (test-cs003-p4.js's rule).
//     A test that drives update() alone cannot see the drain bug.
//  2. Menu runs take a TIME seed; Date.now is a counter (test-cs008-p5.js).
//  3. The paused-run comparison counts PLAY steps by state.time, never ticks:
//     a paused step is a tick that must not be a play step.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260916);
const X = H.buildGame({ spy: ["drawHud", "drawMenu"] });
const { C, state } = X;
const G = X.Game;
const MS = C.FIXED_DT * 1000;
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));

let now = 1758000000000;
Date.now = () => (now += 7919);                                    // trap 2

// ⛔ Off at every launch: read before anything in this file can flip it.
H.eq(X.Telemetry.enabled(), false, "⛔ telemetry capture is OFF at launch");

// ---------------------------------------------------------------------------
// the surface
// ---------------------------------------------------------------------------

const ver = G.input.VERSION.split(".").map(Number);
H.assert(ver[0] > 0 || ver[1] >= 5, `kit-input is at least 0.5.0 (MINOR: three named-action sources) (got ${G.input.VERSION})`);
H.assert(/### 2026-09-13 — three sources of a named action \(`VERSION` 0\.4\.0 → 0\.5\.0\)/
           .test(fs.readFileSync(path.join(ROOT, "src", "04-input.NOTES.md"), "utf8")),
         "src/04-input.NOTES.md carries the 0.5.0 entry");
H.eq(typeof G.input.pageHidden, "function", "kit-input exposes the pageHidden() sink");
for (const k of ["p", "escape", "t", "e"]) H.eq(G.input.isBound(k), true, `"${k}" is bound`);
H.eq(C.GAMEPAD_PAUSE_BUTTON, 9, "C.GAMEPAD_PAUSE_BUTTON is the standard mapping's Start");
H.assert(Array.isArray(C.CREDITS_LINES) && C.CREDITS_LINES.length > 0, "C.CREDITS_LINES is data");

// ---------------------------------------------------------------------------
// the loop, the devices, the fixtures
// ---------------------------------------------------------------------------

let clock = 0;
function halfFrame() { clock += MS / 2; G.frame(clock); }
function liveStep() {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  return G.stats.ticks >= want;
}
function steps(n) { for (let i = 0; i < n; i++) liveStep(); }
function toTitle() { G.reset(); clock = 0; G.frame(0); G.quitToTitle(); steps(2); }

const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
const FIRE = key(" "), PURGE = key("Shift"), ESC = key("Escape"), P = key("p");
function press(b) { b.down(); liveStep(); b.up(); liveStep(); }
function tapRight(n) { for (let i = 0; i < n; i++) { G.input.keyDown("ArrowRight"); steps(2); G.input.keyUp("ArrowRight"); liveStep(); } }
function toRun() { toTitle(); press(FIRE); press(FIRE); press(FIRE); H.eq(state.screen, "play", "fixture: a run from the front door"); }

const nav = X._env.win.navigator;
const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
nav.getGamepads = () => [pad];
const START = { down: () => { pad.buttons[C.GAMEPAD_PAUSE_BUTTON].pressed = true; },
                up:   () => { pad.buttons[C.GAMEPAD_PAUSE_BUTTON].pressed = false; } };
const topY = C.TOUCH_BUTTON_R * 1.5;
const TOP = { down: () => G.input.touchStart(9, C.WORLD_W / 2, topY), up: () => G.input.touchEnd(9) };
const HIDE = { down: () => G.input.pageHidden(), up: () => {} };

const ctx2d = X._env.canvas.getContext("2d");
function drawnTexts() {
  const prev = ctx2d.fillText, out = [];
  ctx2d.fillText = (str, x) => out.push({ str: String(str), x, align: ctx2d.textAlign, font: ctx2d.font });
  G.draw();
  ctx2d.fillText = prev;
  return out;
}
function drawDeltas() {
  const h = X.drawHud.calls, m = X.drawMenu.calls;
  G.draw();
  return { hud: X.drawHud.calls - h, menu: X.drawMenu.calls - m };
}

// ---------------------------------------------------------------------------
// ⛔ PAUSE FROM EACH SOURCE, AND THE PAUSING STEP SIMULATES NOTHING
// ---------------------------------------------------------------------------

const SOURCES = [["Escape", ESC], ["p", P], ["gamepad Start", START], ["the top touch target", TOP], ["the page going hidden", HIDE]];
for (const [label, src] of SOURCES) {
  toRun();
  steps(30);
  const t0 = state.time;
  src.down(); liveStep();
  H.eq(state.screen, "pause", `⛔ ${label} pauses a run`);
  H.eq(state.time, t0, `${label}: the pausing step is not a play step`);
  src.up(); steps(20);
  H.eq(state.screen, "pause", `${label}: the pause holds`);
  H.eq(state.time, t0, `${label}: ⛔ no simulation time passes while paused`);
  const d = drawDeltas();
  H.eq(d.hud, 1, `${label}: ⛔ H4, the HUD draws over pause`);
  H.eq(d.menu, 1, `${label}: the pause menu draws`);
  FIRE.down(); liveStep();                                         // RESUME
  H.eq(state.screen, "play", `${label}: RESUME resumes`);
  H.eq(state.time, t0, `${label}: the confirming step is the menu's`);
  FIRE.up(); liveStep();
  H.close(state.time, t0 + C.FIXED_DT, 1e-12, `${label}: ⛔ resume is instant — the next step is a play step`);
}

// Pause applies on play only. ⛔ The page going hidden must never back out of a
// menu — the reason it is `pause` and not `back`. (Escape backs out there by
// design, and the top touch is a confirm tap — both asserted below.)
for (const [label, src] of SOURCES.filter(s => s[1] !== ESC && s[1] !== TOP)) {
  toTitle(); press(FIRE); press(FIRE);
  H.eq(state.screen, "depth", `fixture: START DEPTH for ${label}`);
  src.down(); liveStep(); src.up(); steps(3);
  H.eq(state.screen, "depth", `⛔ ${label} on START DEPTH neither pauses nor backs out`);
}

// A held Start queues once; a released and re-pressed one queues again.
toRun();
START.down(); liveStep();
H.eq(state.screen, "pause", "fixture: Start paused");
press(ESC);
H.eq(state.screen, "play", "Escape on the pause menu resumes");
steps(30);
H.eq(state.screen, "play", "⛔ a Start held through the resume does not pause again (an edge, not a level)");
START.up(); liveStep(); START.down(); liveStep(); START.up();
H.eq(state.screen, "pause", "a fresh Start press pauses again");

// ⛔ `p` and Start TOGGLE on the pause screen (Paul, 2026-09-13), instantly.
for (const [label, src] of [["p", P], ["gamepad Start", START]]) {
  toRun();
  steps(10);
  src.down(); liveStep(); src.up(); steps(5);
  H.eq(state.screen, "pause", `fixture: ${label} paused`);
  const t0 = state.time;
  src.down(); liveStep(); src.up();
  H.eq(state.screen, "play", `⛔ ${label} on the pause screen resumes`);
  H.close(state.time, t0 + C.FIXED_DT, 1e-12, `${label}: ⛔ instant — the pressing step is already a play step`);
}
// ⛔ The page going hidden never resumes; `p` and Start do nothing on OPTIONS
// opened from pause; the top touch on the pause menu is a confirm tap (RESUME).
toRun();
press(P);
HIDE.down(); steps(5);
H.eq(state.screen, "pause", "⛔ the page going hidden on the pause screen does not resume");
tapRight(1); press(FIRE);
H.eq(state.screen, "options", "fixture: OPTIONS from pause");
press(P); press(START);
H.eq(state.screen, "options", "⛔ `p` and Start do nothing on OPTIONS opened from pause");
press(ESC);
H.eq(state.screen, "pause", "fixture: back to pause");
// ⛔ A Purge landing on the same step as the toggle spends nothing: the toggle
// resumes inside sample(), so that very step simulates with Purge held.
{
  const u = state.purgeUses;
  PURGE.down(); P.down(); liveStep(); P.up(); steps(3); PURGE.up(); liveStep();
  H.eq(state.screen, "play", "fixture: the toggle resumed with Purge down");
  H.eq(state.purgeUses, u, "⛔ a Purge pressed with the toggle spends no charge (the re-latch)");
  press(P);
}
press(TOP);
H.eq(state.screen, "play", "the top-edge touch on the pause menu confirms RESUME");

// A Fire held in play does not confirm RESUME on the pausing step or after.
toRun();
FIRE.down(); steps(10);
P.down(); liveStep(); P.up();
steps(30);
H.eq(state.screen, "pause", "⛔ a Fire held into the pause does not confirm RESUME");
FIRE.up(); liveStep();
press(FIRE);
H.eq(state.screen, "play", "a fresh Fire does");

// ⛔ Resume through Purge spends no charge (the re-latch).
toRun();
steps(10);
const uses0 = state.purgeUses, spent0 = state.tally.purgesSpent;
press(P);
PURGE.down(); liveStep();
H.eq(state.screen, "play", "Purge backs out of pause, which resumes");
steps(5); PURGE.up(); steps(5);
H.eq(state.purgeUses, uses0, "⛔ the Purge that resumed spends no charge");
H.eq(state.tally.purgesSpent, spent0, "and counts no purge");
press(PURGE);
H.eq(state.purgeUses, uses0 + 1, "fixture: a genuine Purge afterwards still spends one");

// The top target is live in play only: on a menu that touch is a confirm tap.
toTitle();
TOP.down(); liveStep(); TOP.up(); liveStep();
H.eq(state.screen, "mode", "⛔ on a menu the top-edge touch is a confirm tap, not a dead spot");

// ---------------------------------------------------------------------------
// ⛔ NOTHING SIMULATES WHILE PAUSED — a paused run equals one that never paused
// ---------------------------------------------------------------------------

function boardHash() {
  const e = state.enemies.map(x => `${x.constructor.name}:${x.lane.toFixed(9)}:${x.depth.toFixed(9)}`).join("|");
  const s = state.shots.map(x => JSON.stringify(x)).join("|");
  return [state.time.toFixed(9), state.level, state.score, state.lives, state.purgeUses,
          state.skimmer.lane.toFixed(9), state.spawn.remaining, state.spawn.timer.toFixed(9),
          state.tally.shotsFired, state.tally.kills, state.rng(), e, s].join("/");
}
function scriptedRun(pauseAt) {
  G.reset(); clock = 0; G.frame(0);
  X.startGame(424242);
  FIRE.down();
  let play = 0, paused = false;
  while (play < 900) {
    if (play === pauseAt && !paused) {
      paused = true;
      P.down(); liveStep(); P.up();
      H.eq(state.screen, "pause", "fixture: the scripted run paused");
      // Paused input must not leak: a flick, a tap, a Purge press, all consumed.
      G.input.mouseMove(3 / C.MOUSE_SENS); liveStep();
      tapRight(2);
      PURGE.down(); liveStep();                                  // backs out = resume
      H.eq(state.screen, "play", "fixture: Purge resumed the scripted run");
      PURGE.up();
      continue;
    }
    const t = state.time;
    if (play % 97 === 50) G.input.keyDown("ArrowLeft");
    if (play % 97 === 53) G.input.keyUp("ArrowLeft");
    liveStep();
    if (state.time > t) play++;
  }
  FIRE.up();
  return boardHash();
}
const unpaused = scriptedRun(-1);
const pausedRun = scriptedRun(400);
H.assert(state.tally.shotsFired > 0 && state.tally.kills > 0, "fixture: the scripted board fired and killed");
H.eq(pausedRun, unpaused, "⛔ a run paused for input-laden steps equals the run that never paused");

// A dive holds too.
toRun();
state.spawn.remaining = 0;
state.enemies = [];
liveStep(); liveStep();
H.eq(state.dive.active, true, "fixture: a dive is running");
steps(40);
const dive0 = state.dive.depth, diveT0 = state.dive.timer, diveTime = state.time;
press(P);
steps(60);
H.eq(state.screen, "pause", "⛔ a dive can be paused (the dive is play)");
H.assert(dive0 < 1 && state.dive.active, "fixture: the dive is descending, not in its grace");
H.eq(state.dive.depth, dive0, "⛔ the dive's depth holds under pause");
H.eq(state.dive.timer, diveT0, "and its timer");
H.eq(state.time, diveTime, "and no time passes");
press(FIRE);
liveStep();
H.assert(state.dive.timer > diveT0, "the dive continues on resume");

// ---------------------------------------------------------------------------
// ⛔ A PAUSE INSIDE A DEATH FREEZE HOLDS THE FREEZE — driven through frame()
// ---------------------------------------------------------------------------

function stageDeath(lives) {
  state.spawn.remaining = 5; state.spawn.timer = 0;
  state.enemies = []; state.shots = [];
  state.lives = lives;
  const e = X.spawnEnemy("vaulter", state.skimmer.lane, 0);
  e.depth = e.killDepth;
  state.invulnTime = C.RESPAWN_INVULN;
  liveStep();
  H.assert(state.skimmer.dead && G.hitStopLeft > 0, `fixture: a death with ${lives} lives froze`);
}

toRun();
stageDeath(3);
for (let i = 0; i < 20; i++) halfFrame();
const ticks0 = G.stats.ticks;
P.down(); halfFrame(); halfFrame(); P.up();
H.eq(state.screen, "pause", "⛔ `p` pauses inside a death freeze");
H.eq(G.stats.ticks, ticks0, "fixture: the pause landed inside the freeze (no live tick)");
const held = G.hitStopLeft, fragT = X.fragmentT(G.hitStopLeft, C.HIT_STOP_DEATH), frozenTime = state.time;
H.assert(held > 0 && held < C.HIT_STOP_DEATH, "fixture: the freeze is part-spent");
for (let i = 0; i < 200; i++) halfFrame();                     // 100 steps > HIT_STOP_DEATH
H.eq(G.hitStopLeft, held, "⛔ hitStopLeft is unchanged across 100 paused steps");
H.eq(X.fragmentT(G.hitStopLeft, C.HIT_STOP_DEATH), fragT, "⛔ the fragmentation progress is frozen under pause");
H.eq(state.skimmer.dead, true, "no respawn under pause");
H.eq(state.time, frozenTime, "no simulation time");
H.assert(G.stats.ticks > ticks0 + 90, "the pause menu's own steps ran");
H.eq(drawDeltas().hud, 1, "the HUD draws over a pause taken in a freeze");

// OPTIONS and CREDITS opened from that pause hold it too.
tapRight(1); press(FIRE);
H.eq(state.screen, "options", "OPTIONS opens from pause");
H.eq(drawDeltas().hud, 1, "⛔ H4: OPTIONS opened from pause shows the run's HUD");
tapRight(3); press(FIRE);
H.eq(state.screen, "credits", "CREDITS opens from OPTIONS");
for (let i = 0; i < 100; i++) halfFrame();
H.eq(G.hitStopLeft, held, "⛔ and the freeze holds under OPTIONS › CREDITS opened from pause");
press(PURGE);
H.eq(state.screen, "options", "Purge backs out of CREDITS to OPTIONS");
press(ESC);
H.eq(state.screen, "pause", "⛔ OPTIONS opened from pause backs out to pause");
press(FIRE);
H.eq(state.screen, "play", "RESUME, still inside the freeze");
halfFrame(); halfFrame();
H.assert(G.hitStopLeft < held, "⛔ the freeze drains again on resume");
for (let n = 0; G.hitStopLeft > 0 && n < 600; n++) halfFrame();
liveStep();
H.eq(state.skimmer.dead, false, "and the respawn follows the freeze");

// The final death is game over, not play: no pause, and its freeze drains.
toRun();
stageDeath(1);
H.eq(state.screen, "gameover", "fixture: the last life");
const goHeld = G.hitStopLeft;
P.down(); halfFrame(); halfFrame(); P.up(); G.input.pageHidden(); halfFrame(); halfFrame();
H.eq(state.screen, "gameover", "⛔ no pause from game over, even inside its freeze");
H.assert(G.hitStopLeft < goHeld, "and game over's freeze still drains");

// ---------------------------------------------------------------------------
// OPTIONS: rows, back, telemetry = `t`, export = `e`, the CONTROLS stub
// ---------------------------------------------------------------------------

toTitle();
tapRight(1); press(FIRE);
H.eq(state.screen, "options", "OPTIONS opens from the title");
H.eq(drawDeltas().hud, 0, "⛔ H4: the title's OPTIONS draws no HUD");
const ROWS = ["TELEMETRY", "EXPORT", "CONTROLS", "CREDITS", "BACK"];
const SOUND_ROWS = ["MASTER VOLUME", "MUSIC VOLUME", "SFX VOLUME", "VOICE VOLUME", "MUSIC TRACK"];
// CS009 P3: ten rows outgrow the C.MENU_VISIBLE_ROWS window, so the list is read
// through a scroll of it, and the cursor comes back to TELEMETRY.
const labels = [];
const rowCount = ROWS.length + SOUND_ROWS.length;
for (let i = 0; i < rowCount; i++) { for (const t of drawnTexts()) if (!labels.includes(t.str)) labels.push(t.str); tapRight(1); }
for (let i = 0; i < rowCount; i++) { G.input.keyDown("ArrowLeft"); steps(2); G.input.keyUp("ArrowLeft"); liveStep(); }
H.assert(ROWS.every(r => labels.includes(r)), `OPTIONS rows are ${ROWS.join(" / ")} (got ${labels.join(" / ")})`);
H.assert(SOUND_ROWS.every(r => labels.includes(r)), `CS009's Sound and Music rows are present: ${SOUND_ROWS.join(" / ")}`);

// ⛔ A label and its detail never overlap (TEXT_CHAR_W is the layout advance).
{
  const texts = drawnTexts();
  const w = t => t.str.length * C.MENU_TEXT_SIZE * C.TEXT_CHAR_W;
  const lefts = texts.filter(t => t.align === "left"), rights = texts.filter(t => t.align === "right");
  for (const l of lefts) for (const r of rights) {
    H.assert(l.x + w(l) < r.x - w(r), `"${l.str}" clears "${r.str}"`);
  }
  H.eq(rights.length, lefts.filter(l => l.str !== "BACK").length, "every drawn row but BACK carries a detail");
}

const logs = [];
const realLog = console.log;
function captureLog(fn) { logs.length = 0; console.log = s => logs.push(String(s)); try { fn(); } finally { console.log = realLog; } return logs.slice(); }

const detailOf = () => { const t = drawnTexts(); const i = t.findIndex(x => x.str === "TELEMETRY"); return t.slice(i + 1).find(x => x.align === "right").str; };
H.eq(detailOf(), "OFF", "the TELEMETRY row reads OFF at launch");
const viaKey = captureLog(() => press(key("t")));
const onByKey = X.Telemetry.enabled();
H.eq(onByKey, true, "`t` turns capture on");
H.eq(detailOf(), "ON", "⛔ and the row shows `t`'s flip");
captureLog(() => press(key("t")));
H.eq(X.Telemetry.enabled(), false, "`t` turns it off again");
const viaRow = captureLog(() => press(FIRE));                  // cursor on TELEMETRY
H.eq(X.Telemetry.enabled(), onByKey, "⛔ the TELEMETRY row flips the same switch as `t`");
H.eq(viaRow.join("\n"), viaKey.join("\n"), "⛔ and says exactly what `t` says");
H.eq(detailOf(), "ON", "the row reads ON");
captureLog(() => press(FIRE));
H.eq(X.Telemetry.enabled(), false, "and flips it back");
H.eq(X._env.store.size, 0, "⛔ never persisted: no storage write");

const realExport = X.Telemetry.exportCsv;
let exportCalls = 0;
X.Telemetry.exportCsv = function () { exportCalls++; return realExport.apply(this, arguments); };
const expKey = captureLog(() => press(key("e")));
H.eq(exportCalls, 1, "`e` calls Telemetry.exportCsv()");
tapRight(1);
const expRow = captureLog(() => press(FIRE));
H.eq(exportCalls, 2, "⛔ EXPORT calls the same export as `e`");
H.eq(expRow.join("\n"), expKey.join("\n"), "and writes the same text");
X.Telemetry.exportCsv = realExport;

// `t` still works in play (plan §0: the bench keys stay).
toRun();
captureLog(() => press(key("t")));
H.eq(X.Telemetry.enabled(), true, "⛔ `t` still works in play");
steps(40);
H.assert(X.Telemetry.count > 0, "and capture samples the run");
captureLog(() => press(key("t")));

// The CONTROLS row opens its page. CS008 P7 replaced the stub with the built
// page (test-cs008-p7.js owns its rows), so its BACK is now the last row.
toTitle();
tapRight(1); press(FIRE); tapRight(2); press(FIRE);
H.eq(state.screen, "controls", "CONTROLS opens its page");
const ctl = drawnTexts().map(t => t.str);
H.assert(ctl.includes("CONTROLS") && !ctl.includes("NOT BUILT YET"), "⛔ the CONTROLS page is built: no stub line on screen");
tapRight(7); press(FIRE);
H.eq(state.screen, "options", "its BACK returns to OPTIONS");
press(PURGE);
H.eq(state.screen, "title", "OPTIONS opened from the title backs out to the title");

// QUIT TO TITLE from pause.
toRun();
press(P); tapRight(2); press(FIRE);
H.eq(state.screen, "title", "QUIT TO TITLE from pause reaches the title");
H.eq(state.skimmer, null, "and no run remains");

// ---------------------------------------------------------------------------
// ⛔ CREDITS, AND NO FORBIDDEN WORD
// ---------------------------------------------------------------------------

toTitle();
tapRight(1); press(FIRE); tapRight(3); press(FIRE);
H.eq(state.screen, "credits", "fixture: CREDITS from the title");
const credits = drawnTexts().map(t => t.str);
for (const line of C.CREDITS_LINES) H.assert(credits.includes(line), `the credits draw "${line}"`);
H.assert(credits.includes("VERSION " + C.GAME_VERSION), "the credits draw C.GAME_VERSION");
const WORDS = ["tempest", "flipper", "fuseball", "pulsar", "tanker", "spiker", "superzapper", "blaster", "web"];
const creditText = credits.join("\n");
for (const w of WORDS.concat("atari")) {
  H.assert(!new RegExp(`\\b${w}\\b`, "i").test(creditText), `⛔ the credits never say "${w}"`);
}
// "atari" too (GDD 18 item 1: no Atari marks in code or comments — Paul, 2026-09-13).
for (const w of WORDS.concat("atari")) {
  H.assert(!new RegExp(`\\b${w}\\b`, "i").test(script), `⛔ the built file never says "${w}" (CLAUDE.md vocabulary; GDD 18)`);
}
H.assert(!/\bT-\d{4}\b/.test(script), "⛔ no T-#### name in the built file");

// ---------------------------------------------------------------------------
// kit-input 0.5.0 — the three sources, on a fresh instance
// ---------------------------------------------------------------------------

function kit(extra) {
  const got = [];
  const inp = X.createInput(Object.assign({
    mouseSens: 1, keyTapMs: 130, keySpeedMin: 4, keySpeedMax: 14, keyRamp: 0.35,
    touchSens: 1, touchZoneFrac: 0.4, touchAutofire: true, touchButtonR: 56,
    gamepadDeadzone: 0.15, gamepadSens: 12, inputMirror: false, worldW: 1280, worldH: 720,
    onAction: n => got.push(n),
  }, extra));
  return { inp, got };
}
{
  const a = kit({});
  a.inp.touchStart(1, 640, 84);
  const s = a.inp.sample(1 / 60);
  H.eq(a.got.length, 0, "⛔ no touchTopAction: the top touch queues nothing (0.4.0)");
  a.inp.touchEnd(1);
  a.inp.pageHidden(); a.inp.sample(1 / 60);
  H.eq(a.got.length, 0, "no hiddenAction: pageHidden() queues nothing");
  H.eq(s.fire, false, "and that touch holds nothing either (0.4.0: tap-fire off)");
}
{
  const b = kit({ touchTopAction: "hold", hiddenAction: "hide", gamepadActions: { menu: [9, 8] }, inputMirror: true });
  b.inp.touchStart(1, 640, 84); b.inp.sample(1 / 60); b.inp.sample(1 / 60);
  H.eq(b.got.join(), "hold", "the top target queues its action once, mirrored or not");
  H.eq(b.inp.sample(1 / 60).fire, false, "and holds nothing");
  b.inp.touchEnd(1);
  b.inp.configure({ touchTopTarget: false, touchTapFire: true });
  b.inp.touchStart(2, 640, 84);
  H.eq(b.inp.sample(1 / 60).fire, true, "⛔ switched off, the top touch falls through to a tap");
  H.eq(b.got.length, 1, "and queues nothing");
  b.inp.touchEnd(2);
  H.eq(b.inp.sample(1 / 60).fire, false, "fixture: the tap released");

  b.got.length = 0;
  const gp = { axes: [0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const w = { navigator: { getGamepads: () => [gp] } };
  gp.buttons[8].pressed = true;
  for (let i = 0; i < 5; i++) { b.inp.pollGamepads(w); b.inp.sample(1 / 60); }
  H.eq(b.got.join(), "menu", "a held gamepad action button queues once");
  gp.buttons[9].pressed = true; b.inp.pollGamepads(w); b.inp.sample(1 / 60);
  H.eq(b.got.length, 1, "a second button of the same action, while one is held, is not a new press");
  gp.buttons[8].pressed = false; gp.buttons[9].pressed = false; b.inp.pollGamepads(w);
  gp.buttons[9].pressed = true; b.inp.pollGamepads(w); b.inp.sample(1 / 60);
  H.eq(b.got.join(), "menu,menu", "release and press again queues again");

  b.got.length = 0;
  b.inp.pageHidden(); b.inp.pageHidden(); b.inp.sample(1 / 60); b.inp.sample(1 / 60);
  H.eq(b.got.join(), "hide", "however many hides arrive, the host hears one");
  b.inp.pageHidden(); b.inp.reset(); b.inp.sample(1 / 60);
  H.eq(b.got.length, 1, "reset() drops a pending hide");

  // Through attach(): visibilitychange, and blur on either side of it.
  const on = new Map();
  const target = () => ({ addEventListener: (t, fn) => on.set(t, fn), removeEventListener: () => {} });
  const doc = Object.assign(target(), { visibilityState: "visible" });
  const win = target();
  b.inp.attach({ document: doc, window: win, element: target() });
  b.got.length = 0;
  on.get("visibilitychange")(); b.inp.sample(1 / 60);
  H.eq(b.got.length, 0, "a page becoming visible queues nothing");
  doc.visibilityState = "hidden";
  on.get("visibilitychange")(); on.get("blur")(); b.inp.sample(1 / 60);
  H.eq(b.got.join(), "hide", "⛔ hidden then blur: the hide survives blur's reset()");
  on.get("blur")(); on.get("visibilitychange")(); b.inp.sample(1 / 60);
  H.eq(b.got.join(), "hide,hide", "blur then hidden: queued too");
  b.inp.detach();
}
{
  let threw = 0;
  for (const bad of [{ touchTopAction: 3 }, { hiddenAction: "" }, { gamepadActions: null }]) {
    try { kit(bad); } catch (err) { threw++; }
  }
  H.eq(threw, 3, "a malformed action source throws at creation");
  let t2 = 0;
  try { kit({}).inp.configure({ touchTopTarget: "no" }); } catch (err) { t2++; }
  H.eq(t2, 1, "configure() refuses a non-boolean touchTopTarget");
}

// The game's own wiring, through attach() on a recording document.
{
  const on = new Map();
  const target = () => ({ addEventListener: (t, fn) => on.set(t, fn), removeEventListener: () => {} });
  const doc = Object.assign(target(), { visibilityState: "hidden" });
  toRun();
  G.input.attach({ document: doc, window: Object.assign(target(), { navigator: nav }), element: target() });
  on.get("visibilitychange")();
  liveStep();
  H.eq(state.screen, "pause", "⛔ the game pauses when its document goes hidden, through attach()");
  G.input.attach({ window: X._env.win, document: X._env.doc, element: X._env.canvas });
}

H.report();

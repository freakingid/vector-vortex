// test-cs002-p1.js — CS002 P1: the loop, the one mutable game object, and the
// input struct (GDD 2, 9.1, 9.2, 9.5, 16.1, 17.1).
//
// Asserts what P1 owns and nothing else. It does NOT re-assert CS001's depth
// model or renderer, and it makes no claim about the Skimmer or shots, which
// do not exist yet.
//
// Two traps worth knowing before editing this file:
//   - The determinism case runs the SAME recorded event list twice in one
//     process and once in a child (`--hash-only`), so a hash that depends on
//     process-local nondeterminism fails loudly rather than passing twice.
//   - The source scan slices dist/ on build.js's module banner comments. It is
//     the only thing enforcing "one input path" (GDD 9.5), so if the banner
//     format ever changes, this scan must be updated with it or it silently
//     stops looking at anything.
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob, stateFields } = require("./test-registry.js");

const ROOT = path.join(__dirname, "..");
const SEED = 20260830;
const TICKS = 10000;
const HASH_ONLY = process.argv.includes("--hash-only");

// ---------------------------------------------------------------------------
// determinism (GDD 17.1) — same seed + same recorded event list = same hash
// ---------------------------------------------------------------------------

// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. Bitwise, never string formatting: toFixed() would round the difference
// away and turn this into a test that cannot fail.
const _f64 = new Float64Array(1);
const _u32 = new Uint32Array(_f64.buffer);
function mix(h, n) {
  _f64[0] = n;
  for (const word of [_u32[0], _u32[1]]) {
    for (let b = 0; b < 4; b++) {
      h ^= (word >>> (b * 8)) & 0xff;
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}

// THE recorded event list: a pure function of the tick index, so both runs and
// both processes replay exactly the same presses. Chosen to cover every branch
// the input module has — a tap (5 ticks, 83 ms, inside KEY_TAP_MS), a hold
// (25 ticks, 417 ms, past it), a held button, and a named debug action.
function replay(input, i) {
  if (i % 97 === 0)  input.mouseMove(((i * 37) % 41) - 20);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 5)  input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 25) input.keyUp("ArrowLeft");
  if (i % 29 === 0)  input.keyDown(" ");
  if (i % 29 === 7)  input.keyUp(" ");
  if (i % 401 === 0) input.keyDown("w");
  if (i % 401 === 3) input.keyUp("w");
}

function hashRun(seed) {
  installSeed(seed);
  const X = H.buildGame();
  const G = X.Game;
  const st = X.state;
  G.reset();
  let h = 2166136261 >>> 0;
  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(X.C.FIXED_DT);
    h = mix(h, st.time);
    h = mix(h, st.input.rotate);
    h = mix(h, st.input.fire ? 1 : 0);
    h = mix(h, st.input.purge ? 1 : 0);
    h = mix(h, st.input.jump ? 1 : 0);
    h = mix(h, st.wellIndex);
    h = mix(h, Math.random());   // the seeded stream, same seed = same draws
  }
  return h >>> 0;
}

if (HASH_ONLY) {
  process.stdout.write(String(hashRun(SEED)));
  process.exit(0);
}

const hashA = hashRun(SEED);
const hashB = hashRun(SEED);
H.eq(hashA, hashB, `${TICKS} ticks of the recorded event list hash identically in one process`);

const child = execFileSync(process.execPath, [__filename, "--hash-only"],
  { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
H.eq(Number(child), hashA, `${TICKS} ticks hash identically across two processes`);

// A different seed must move the hash, or the case above proves nothing.
H.assert(hashRun(SEED + 1) !== hashA, "a different seed produces a different hash");

// ---------------------------------------------------------------------------
// everything below shares one build
// ---------------------------------------------------------------------------

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const input = G.input;

// ---- the constants this phase adds -----------------------------------------
hasKnob(X, "FIXED_DT", { def: 1 / 60 }, H);
hasKnob(X, "DT_CLAMP_MAX", { def: 0.25 }, H);
hasKnob(X, "MAX_CATCHUP_STEPS", { def: 5 }, H);
hasKnob(X, "POINTER_LOCK_OFFER", { def: true }, H);

// ---- the one mutable game object -------------------------------------------
// ⛔ Against the SHIPPED DEFAULTS, so reset() first: since CS003 P2 boot calls
// startGame(), and the live state at load is a run in progress.
G.reset();
// ⛔ P3 added `shotCooldown` alongside `shots` when it built firing — this list
// tracks CS002's total field ownership, not a P1-only snapshot.
const OWNED = ["screen", "wellIndex", "level", "time", "input", "skimmer", "shots", "shotCooldown"];
for (const f of OWNED) H.assert(f in X.state, `state.${f} exists`);
// ⛔ The exhaustive "nothing built ahead" check is a GLOBAL INVENTORY, so the
// list lives in test-registry.js (CLAUDE.md, Test rules). CS003 P1 moved it
// there when it added state.seed and state.rng; this still fails loudly on a
// field that no changeset has claimed.
const INVENTORY = stateFields();
for (const f of OWNED) H.assert(INVENTORY.includes(f), `the registry's inventory claims state.${f}`);
H.eq(Object.keys(X.state).length, INVENTORY.length,
  "state carries exactly the registry's inventory and no field built ahead");
H.assert(Array.isArray(X.state.shots), "state.shots is an array");
H.eq(X.state.skimmer, null, "state.skimmer is null until CS002 P2 builds it");

// ---- the struct is exactly four fields (GDD 9.5) ---------------------------
G.reset();
const struct = input.sample(C.FIXED_DT);
H.eq(Object.keys(struct).sort().join(","), "fire,jump,purge,rotate",
  "the input struct is exactly { rotate, fire, purge, jump }");
H.eq(Object.keys(X.state.input).sort().join(","), "fire,jump,purge,rotate",
  "state.input has the same shape");

// ---- the kit boundary is enforced at wiring time ---------------------------
let threw = false;
try { X.createInput({}); } catch (e) { threw = true; }
H.assert(threw, "createInput refuses to default a tunable — C stays the one tuning surface");
H.assert(typeof X.createInput({
  mouseSens: 1, keyTapMs: 100, keySpeedMin: 1, keySpeedMax: 2, keyRamp: 0.1,
  touchSens: 1, touchZoneFrac: 0.4, touchAutofire: true, touchButtonR: 56,
  gamepadDeadzone: 0.15, gamepadSens: 12, inputMirror: false,
  worldW: 1280, worldH: 720,
}).sample === "function", "createInput wires up from options alone");

// ---------------------------------------------------------------------------
// the loop: dt clamp, bounded catch-up, hit-stop
// ---------------------------------------------------------------------------

// A 2-second stall. dt clamps to DT_CLAMP_MAX (15 steps' worth), the step cap
// admits MAX_CATCHUP_STEPS of them, and the rest is discarded rather than
// banked into the following frames.
G.reset();
G.frame(2000);
H.eq(G.stats.lastSteps, C.MAX_CATCHUP_STEPS, "a 2-second stall runs at most MAX_CATCHUP_STEPS steps");
H.assert(G.stats.accumulator < C.FIXED_DT,
  `a 2-second stall leaves the accumulator bounded (got ${G.stats.accumulator})`);
H.close(X.state.time, C.MAX_CATCHUP_STEPS * C.FIXED_DT, 1e-12,
  "the stall advances simulation time by exactly the steps that ran, not by 2 seconds");

// ...and the frame after the stall is a normal frame, not a second catch-up
// burst. This is the spiral-of-death check: banked debt would show up here.
G.frame(2016);
H.assert(G.stats.lastSteps <= 1, `the frame after a stall runs at most one step (got ${G.stats.lastSteps})`);

// A run of ordinary frames stays at the natural step rate and neither loses
// nor banks time. ⚠ At 60 Hz a frame occasionally runs 0 then 2 steps: the
// timestamps are floats and 1000/60 ms is not exactly FIXED_DT, so the
// accumulator drifts either side of the step boundary. That is the loop
// working, not catch-up — what matters is that ten seconds of frames produce
// ten seconds of simulation.
G.reset();
let worst = 0;
for (let f = 1; f <= 600; f++) { G.frame(f * (1000 / 60)); worst = Math.max(worst, G.stats.lastSteps); }
H.assert(worst <= 2, `600 ordinary 60 Hz frames never trigger a catch-up burst (worst ${worst})`);
H.assert(Math.abs(G.stats.ticks - 600) <= 1,
  `600 frames at 60 Hz produce 600 simulation steps (got ${G.stats.ticks})`);

// At 144 Hz most frames run no step at all and none ever runs two.
G.reset();
worst = 0;
for (let f = 1; f <= 720; f++) { G.frame(f * (1000 / 144)); worst = Math.max(worst, G.stats.lastSteps); }
H.assert(worst <= 1, `144 Hz frames never run more than one step (worst ${worst})`);
H.assert(Math.abs(G.stats.ticks - 300) <= 1,
  `5 seconds of 144 Hz frames still produce 5 seconds of simulation (got ${G.stats.ticks})`);

// At 30 Hz every frame runs exactly two steps — catch-up doing its job.
G.reset();
for (let f = 1; f <= 60; f++) G.frame(f * (1000 / 30));
H.assert(Math.abs(G.stats.ticks - 120) <= 1,
  `30 Hz frames catch up to the same simulation time (got ${G.stats.ticks})`);

// Hit-stop freezes simulation time and nothing else. 0.1 s is exactly six
// steps at FIXED_DT; frames keep arriving and draw keeps running throughout.
G.reset();
G.frame(0);
G.hitStop(0.1);
const frozenAt = X.state.time;
for (let f = 1; f <= 6; f++) G.frame(f * 20);
H.eq(X.state.time, frozenAt, "hit-stop freezes simulation time");
H.eq(G.stats.ticks, 0, "hit-stop runs no simulation steps");
H.eq(G.stats.frames, 7, "hit-stop does not stop the frame loop");
H.assert(G.stats.accumulator < C.FIXED_DT, "hit-stop leaves no accumulator debt to pay back");
G.frame(7 * 20);
H.assert(X.state.time > frozenAt, "simulation time resumes when hit-stop ends");
H.eq(G.stats.ticks, 1, "the first frame after hit-stop runs one step, not a catch-up burst");

// ---------------------------------------------------------------------------
// mouse — ⛔ exactly linear, no acceleration curve (GDD 9.1)
// ---------------------------------------------------------------------------

G.reset();
for (const dx of [1, 2, 3, 7, 25, 100, 250, 1000, -60]) {
  input.mouseMove(dx);
  H.close(input.sample(C.FIXED_DT).rotate, dx * C.MOUSE_SENS, 1e-15,
    `mouse dx=${dx} gives Δlane = Δx * MOUSE_SENS`);
}
// Doubling Δx doubles Δlane exactly — the property an acceleration curve breaks.
for (const dx of [1, 3, 17, 250]) {
  input.mouseMove(dx);
  const single = input.sample(C.FIXED_DT).rotate;
  input.mouseMove(2 * dx);
  const doubled = input.sample(C.FIXED_DT).rotate;
  H.eq(doubled, 2 * single, `doubling Δx exactly doubles Δlane at dx=${dx}`);
}
// Motion between steps accumulates rather than being dropped or re-scaled.
input.mouseMove(10); input.mouseMove(30); input.mouseMove(-5);
H.close(input.sample(C.FIXED_DT).rotate, 35 * C.MOUSE_SENS, 1e-15,
  "motion arriving between steps sums, unscaled");
H.eq(input.sample(C.FIXED_DT).rotate, 0, "a sampled delta is consumed, not repeated");

// ---------------------------------------------------------------------------
// keyboard — tap/hold dual mode (GDD 9.2)
// ---------------------------------------------------------------------------

const TAP_TICKS = 4;   // 66.7 ms
H.assert(TAP_TICKS * C.FIXED_DT * 1000 < C.KEY_TAP_MS, "the tap case is inside KEY_TAP_MS");

for (const [key, sign] of [["ArrowRight", 1], ["ArrowLeft", -1]]) {
  G.reset();
  input.keyDown(key);
  let total = 0;
  for (let i = 0; i < TAP_TICKS; i++) total += input.sample(C.FIXED_DT).rotate;
  input.keyUp(key);
  total += input.sample(C.FIXED_DT).rotate;
  H.close(total, sign, 1e-12, `a ${key} tap inside KEY_TAP_MS moves exactly one lane`);
  H.eq(input.sample(C.FIXED_DT).rotate, 0, `a ${key} tap stops moving once paid`);
}

// A hold: ramps KEY_SPEED_MIN -> KEY_SPEED_MAX over KEY_RAMP, monotonically,
// and its release adds no tap impulse.
G.reset();
input.keyDown("ArrowRight");
const deltas = [];
for (let i = 0; i < 60; i++) deltas.push(input.sample(C.FIXED_DT).rotate);
let monotone = true;
for (let i = 1; i < deltas.length; i++) if (deltas[i] < deltas[i - 1] - 1e-15) monotone = false;
H.assert(monotone, "a hold ramps monotonically");
H.assert(deltas[0] >= C.KEY_SPEED_MIN * C.FIXED_DT,
  "the ramp starts at or above KEY_SPEED_MIN");
H.assert(deltas[0] < C.KEY_SPEED_MAX * C.FIXED_DT, "the ramp actually ramps rather than starting at the top");
H.close(deltas[deltas.length - 1], C.KEY_SPEED_MAX * C.FIXED_DT, 1e-12,
  "the ramp saturates at KEY_SPEED_MAX");
const rampTick = Math.ceil(C.KEY_RAMP / C.FIXED_DT);
H.close(deltas[rampTick], C.KEY_SPEED_MAX * C.FIXED_DT, 1e-12,
  "the ramp reaches KEY_SPEED_MAX after KEY_RAMP seconds");
input.keyUp("ArrowRight");
H.eq(input.sample(C.FIXED_DT).rotate, 0, "releasing after KEY_TAP_MS adds no tap impulse");

// Auto-repeat is not a new press: a held key that repeats must not restart the
// ramp or re-arm the tap.
G.reset();
input.keyDown("ArrowRight");
for (let i = 0; i < 30; i++) { input.keyDown("ArrowRight"); input.sample(C.FIXED_DT); }
input.keyUp("ArrowRight");
H.eq(input.sample(C.FIXED_DT).rotate, 0, "key auto-repeat does not re-arm the tap");

// Opposed keys cancel; nothing held is exactly zero.
G.reset();
H.eq(input.sample(C.FIXED_DT).rotate, 0, "nothing held is exactly zero rotation");
input.keyDown("ArrowLeft"); input.keyDown("ArrowRight");
for (let i = 0; i < 5; i++) input.sample(C.FIXED_DT);
H.close(input.sample(C.FIXED_DT).rotate, 0, 1e-15, "opposed keys cancel");

// ---- the three buttons ------------------------------------------------------
G.reset();
for (const [key, field] of [[" ", "fire"], ["x", "purge"], ["ArrowUp", "jump"]]) {
  input.keyDown(key);
  H.eq(input.sample(C.FIXED_DT)[field], true, `${field} is held while its key is down`);
  input.keyUp(key);
  H.eq(input.sample(C.FIXED_DT)[field], false, `${field} clears on release`);
}
// purge and jump are populated with no consumer — that is intended this phase.
H.assert(X.state.input.purge === false && X.state.input.jump === false,
  "purge and jump are populated fields with no consumer yet");

// ---------------------------------------------------------------------------
// ⛔ one input path (GDD 9.5) — the re-homed debug action
// ---------------------------------------------------------------------------

G.reset();
const wellCount = X.WELLS.length;
const before = X.state.wellIndex;
input.keyDown("w");
H.eq(X.state.wellIndex, before, "a named action does not fire at event time");
G.update(C.FIXED_DT);
H.eq(X.state.wellIndex, (before + 1) % wellCount,
  "the debug well-cycle action fires in simulation order, through the input module");
input.keyUp("w");
for (let i = 0; i < 5; i++) G.update(C.FIXED_DT);
H.eq(X.state.wellIndex, (before + 1) % wellCount, "a named action fires once per press");

// ---------------------------------------------------------------------------
// the DOM adapter — the only DOM-event code in the build
// ---------------------------------------------------------------------------
// The harness's env stubs register listeners into a no-op, which is right for
// booting the game headlessly but proves nothing about attach(). These event
// targets are test data for the module under test, not a second sandbox: the
// input instance is still real code out of dist/.

function fakeTarget() {
  const on = new Map();
  return {
    addEventListener: (t, fn) => { (on.get(t) || on.set(t, []).get(t)).push(fn); },
    removeEventListener: (t, fn) => {
      const l = on.get(t) || [];
      const i = l.indexOf(fn);
      if (i >= 0) l.splice(i, 1);
    },
    fire(t, ev) { for (const fn of (on.get(t) || []).slice()) fn(ev || {}); },
    count(t) { return (on.get(t) || []).length; },
    requestPointerLock() { this.lockRequests++; },
    lockRequests: 0,
  };
}

const doc = fakeTarget();
const el = fakeTarget();
const win = fakeTarget();
const wired = X.createInput({
  mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS,
  keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP,
  pointerLockOffer: C.POINTER_LOCK_OFFER,
  touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC,
  touchAutofire: C.TOUCH_AUTOFIRE, touchButtonR: C.TOUCH_BUTTON_R,
  gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
  inputMirror: C.INPUT_MIRROR, worldW: C.WORLD_W, worldH: C.WORLD_H,
});
H.assert(wired.attach({ window: win, document: doc, element: el }), "attach() registers listeners");
H.assert(doc.count("keydown") === 1 && el.count("mousemove") === 1, "attach() binds keys to the document and the mouse to the element");

// Pointer Lock is OFFERED on click — once per click, never re-forced by the
// module itself (GDD 9.1).
el.fire("mousedown", { button: 0 });
H.eq(el.lockRequests, 1, "a click offers Pointer Lock");
H.eq(wired.sample(C.FIXED_DT).fire, true, "the left mouse button fires");
win.fire("mouseup", { button: 0 });
H.eq(wired.sample(C.FIXED_DT).fire, false, "a mouse release outside the element still registers");

// Relative motion: movementX when Pointer Lock supplies it, differenced
// clientX when it does not. Both are pixels since the last event.
wired.reset();
el.fire("mousemove", { movementX: 40 });
H.close(wired.sample(C.FIXED_DT).rotate, 40 * C.MOUSE_SENS, 1e-15, "movementX drives rotation directly");
el.fire("mousemove", { clientX: 100 });
el.fire("mousemove", { clientX: 130 });
H.close(wired.sample(C.FIXED_DT).rotate, 30 * C.MOUSE_SENS, 1e-15,
  "with no movementX the adapter differences clientX, and the first event seeds rather than jumps");

// A key routed through the DOM reaches the same struct as the sink.
wired.reset();
let prevented = 0;
doc.fire("keydown", { key: "ArrowRight", preventDefault: () => prevented++ });
H.assert(wired.sample(C.FIXED_DT).rotate > 0, "a DOM keydown rotates");
H.eq(prevented, 1, "a bound key swallows the browser default");
doc.fire("keydown", { key: "F5", preventDefault: () => prevented++ });
H.eq(prevented, 1, "an unbound key is left alone");

// Losing focus mid-press must not leave the rim spinning.
win.fire("blur", {});
H.eq(wired.sample(C.FIXED_DT).rotate, 0, "window blur releases every held key");

wired.detach();
H.eq(doc.count("keydown"), 0, "detach() removes what attach() added");

// ---------------------------------------------------------------------------
// source scan — the abstraction, enforced against the shipped file
// ---------------------------------------------------------------------------

const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));

// Slice on build.js's module banners: // ===… / // <file> / // ===…
function sliceModules(src) {
  const re = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;
  const marks = [];
  let m;
  while ((m = re.exec(src)) !== null) marks.push({ name: m[1].trim(), head: m.index, body: m.index + m[0].length });
  const out = {};
  for (let i = 0; i < marks.length; i++) {
    out[marks[i].name] = src.slice(marks[i].body, i + 1 < marks.length ? marks[i + 1].head : src.length);
  }
  return out;
}
const mods = sliceModules(script);

// The scan is worthless if the slicing missed a file, so check it both ways
// against src/ the way build.js checks its own manifest.
const onDisk = fs.readdirSync(path.join(ROOT, "src")).filter(f => f.endsWith(".js")).sort();
for (const f of onDisk) H.assert(mods[f] !== undefined, `the banner scan sees ${f}`);
for (const f of Object.keys(mods)) H.assert(onDisk.includes(f), `the banner scan invented no module (${f})`);
H.assert(mods["13-render-well.js"].includes("function drawWell"),
  "slicing is real — 13-render-well.js's slice holds its own code");

const FORBIDDEN = ["addEventListener", "e.key", ".touches", "getGamepads", "movementX", "clientX"];
for (const name of Object.keys(mods)) {
  if (name === "04-input.js") continue;
  for (const token of FORBIDDEN) {
    H.assert(!mods[name].includes(token),
      `${name} must not contain "${token}" — every device event goes through 04-input.js (GDD 9.5)`);
  }
}
H.assert(mods["04-input.js"].includes("addEventListener"),
  "04-input.js is where the DOM listeners actually live");
H.assert(!/\bC\./.test(mods["04-input.js"]),
  "04-input.js reads no game config — no C. inside its slice");
H.assert(!/\bstate\s*[.[]/.test(mods["04-input.js"]),
  "04-input.js reads no game state");
H.assert(mods["23-main.js"].includes("createInput("),
  "23-main.js is what hands 04-input.js its tunables");

// The debug well-cycler's own listener is gone from the renderer.
H.assert(!mods["13-render-well.js"].includes("keydown"),
  "13-render-well.js no longer owns a second input path");

H.assert(fs.existsSync(path.join(ROOT, "src", "04-input.NOTES.md")),
  "src/04-input.NOTES.md exists — the backport packet ships with the module");

H.report("test-cs002-p1.js");

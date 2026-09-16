// test-cs010-p2.js — CS010 P2: the intensity director (GDD 5, 11.4–11.6; plan §4).
// Asserts what P2 owns: createDirector's weighted, clamped, ASYMMETRIC smoothing
// (63 % in INT_ATTACK up, in INT_RELEASE down); dangerInputs() on staged boards
// (a Thorn moves nothing, a bolt counts, empty reads 0) and that it changes no
// `state`; audioFrame() through frame() on the recording fake: play drives
// setIntensity/setSweep, a Dive reads 0, pause holds, RESTART and a new run
// start from 0, the title opens the sweep; the duck on exactly D9's screens; the
// four dips and not lifeLost; the director slice's kit boundary.
//
// ⛔ TRAPS.
//  1. The fake's clock is the test's: halfFrame() writes ctx.currentTime, and the
//     director smooths on THAT clock, never on frames.
//  2. A level read after the first play frame of a run is 0 only if the reset
//     ran: with no reset the release leaves it well above 0. Mutation-checked
//     by hand, with the others listed in log/CS010.md.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

installSeed(20261002);
const X = H.buildGame({ audio: true, spy: ["dangerInputs"] });
const { C, state } = X;
const G = X.Game, A = X.AudioSys, M = X.MusicSys, D = X.Director, rec = X._audio;
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const EPS = 1e-9;

// ---------------------------------------------------------------------------
// C
// ---------------------------------------------------------------------------
hasKnob(X, "MUSIC_DIP_EVENTS", null, H);
H.eq(JSON.stringify(C.MUSIC_DIP_EVENTS), JSON.stringify(["purge", "purgeWeak", "death", "extraLife"]),
     "C.MUSIC_DIP_EVENTS is D9's four");
H.assert(!("INT_HEAT_MAX" in C), "⛔ C.INT_HEAT_MAX is deleted (D7)");
H.eq(C.MUSIC_DUCK_GAIN, 0.5, "C.MUSIC_DUCK_GAIN is 0.5");
for (const k of ["createDirector", "Director", "dangerInputs", "duckFor"]) H.assert(X[k] !== null, `${k} is exported`);

// ---------------------------------------------------------------------------
// createDirector — the step responses (R1)
// ---------------------------------------------------------------------------
{
  const throws = f => { try { f(); } catch (e) { return true; } return false; };
  const W = { a: 1 };
  H.assert(throws(() => X.createDirector({ release: 1, weights: W })), "attack is required");
  H.assert(throws(() => X.createDirector({ attack: 1, weights: W })), "release is required");
  H.assert(throws(() => X.createDirector({ attack: 1, release: 1 })), "weights are required");
  H.assert(throws(() => X.createDirector({ attack: 1, release: 1, weights: { a: -1 } })), "a negative weight throws");

  // The game's own instance, so the C wiring is what is measured.
  const ALL = { count: 1, proximity: 1, peril: 1, heat: 1, combo: 1 };
  const NONE = { count: 0, proximity: 0, peril: 0, heat: 0, combo: 0 };
  const N = 24;
  D.reset();
  H.eq(D.frame(ALL, 5), 0, "the first frame after reset() only takes the clock");
  let t = 5;
  for (let i = 1; i <= N; i++) D.frame({ count: 1, proximity: 1, peril: 1, heat: 1, combo: 0 }, t + C.INT_ATTACK * i / N);
  t += C.INT_ATTACK;
  const top = 0.85;   // D6: the weights without combo
  H.close(D.level, top * (1 - Math.exp(-1)), EPS, "⛔ a step up reaches 63 % in C.INT_ATTACK");
  D.frame({ count: 1, proximity: 1, peril: 1, heat: 1, combo: 0 }, t + 1000);
  t += 1000;
  H.close(D.level, top, EPS, "and settles at 0.85 with no combo (D6: nothing rescaled)");
  D.frame(ALL, t + 1000); t += 1000;
  H.close(D.level, 1, EPS, "every weight at 1 sums to exactly 1");
  D.frame({ count: 9, proximity: 9, peril: 9, heat: 9, combo: 9 }, t + 1000); t += 1000;
  H.eq(D.level, 1, "inputs above 1 clamp: the level stays 1");
  const upAtRelease = D.level;
  for (let i = 1; i <= N; i++) D.frame(NONE, t + C.INT_ATTACK * i / N);
  H.assert(D.level > 0.8, `⛔ after C.INT_ATTACK a step DOWN has barely moved (${D.level.toFixed(4)}): asymmetric`);
  D.reset(); D.frame(ALL, 0); D.frame(ALL, 1000);
  t = 1000;
  for (let i = 1; i <= N; i++) D.frame(NONE, t + C.INT_RELEASE * i / N);
  t += C.INT_RELEASE;
  H.close(D.level, Math.exp(-1), EPS, "⛔ a step down covers 63 % in C.INT_RELEASE");
  const held = D.level;
  D.frame(ALL, t);
  H.eq(D.level, held, "a clock that did not move moves nothing");
  D.frame(ALL, t - 1);
  H.eq(D.level, held, "nor does a clock that went back");
  D.frame(ALL, NaN);
  H.eq(D.level, held, "nor a non-finite clock");
  D.frame({ count: NaN, proximity: undefined, peril: -3, heat: "x", combo: Infinity }, t + 1000);
  H.close(D.level, 0, EPS, "non-finite and negative inputs read 0");
  H.assert(upAtRelease === 1, "fixture: the release case started from 1");
  D.frame(ALL, t + 2000); t += 2000;
  const kept = D.level;
  D.hold();
  H.eq(D.level, kept, "hold() keeps the level");
  H.eq(D.frame(NONE, t + 500), kept, "⛔ and the next frame only takes the clock: the gap is skipped");
  D.frame(NONE, t + 500 + C.INT_RELEASE);
  H.close(D.level, kept * Math.exp(-1), EPS, "then the release runs from there as normal");
  D.reset();
  H.eq(D.level, 0, "reset() returns the level to 0");
}

// ---------------------------------------------------------------------------
// dangerInputs — staged boards
// ---------------------------------------------------------------------------
function hashState() {
  const seen = new Map();
  let h = 2166136261;
  const mix = s => { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; };
  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  function walk(v) {
    if (typeof v === "function") return;
    if (typeof v === "number") { f64[0] = v; mix("n" + u32[0] + "," + u32[1]); return; }
    if (v === null || typeof v !== "object") { mix(typeof v + String(v)); return; }
    if (seen.has(v)) { mix("@" + seen.get(v)); return; }
    seen.set(v, seen.size);
    mix(Array.isArray(v) ? "[" + v.length : "{" + (v.constructor ? v.constructor.name : ""));
    for (const k of Object.keys(v)) { mix(k); walk(v[k]); }
  }
  walk(state);
  return h;
}
{
  G.reset();
  X.startGame(4242);
  const well = X.WELLS[state.wellIndex];
  const far = (state.skimmer.lane + Math.floor(well.lanes / 2)) % well.lanes;
  const out = {};
  function read(tag) {
    const h0 = hashState();
    let draws = 0;
    const rng = state.rng;
    state.rng = function () { draws++; return rng.apply(this, arguments); };
    const r = X.dangerInputs(state, out);
    state.rng = rng;
    H.eq(hashState(), h0, `⛔ ${tag}: dangerInputs leaves the whole-state hash unchanged`);
    H.eq(draws, 0, `${tag}: and spends no draw`);
    H.assert(r === out, `${tag}: it fills and returns the caller's object`);
    return { count: out.count, proximity: out.proximity, peril: out.peril, heat: out.heat, combo: out.combo };
  }
  function soak(tag) {
    D.reset();
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 1200; i++) {
      const v = D.frame(X.dangerInputs(state, out), i / 120);
      if (v < lo) lo = v; if (v > hi) hi = v;
    }
    H.assert(lo >= 0 && hi <= 1, `⛔ ${tag}: intensity stays in [0, 1] over 10 s (${lo.toFixed(4)}..${hi.toFixed(4)})`);
    return D.level;
  }

  state.enemies = [];
  state.lives = 3;
  let r = read("empty");
  H.eq(JSON.stringify(r), JSON.stringify({ count: 0, proximity: 0, peril: 0, heat: 0, combo: 0 }),
       "⛔ the empty board at level 1 reads all zeros: nearest is 0 with none (D15)");
  H.eq(soak("empty"), 0, "and its intensity is exactly 0");

  const v = new X.Vaulter(far, 0.4, 1);
  state.enemies = [v];
  const base = read("one Vaulter");
  H.close(base.count, 1 / C.INT_EXPECTED_ENEMIES, EPS, "one live entity counts 1 / C.INT_EXPECTED_ENEMIES");
  H.eq(base.proximity, 0.4, "proximity is its depth");

  state.enemies = [v, new X.Thorn(far, 0.95), new X.Thorn((far + 1) % well.lanes, 1)];
  r = read("plus two Thorns");
  H.eq(r.count, base.count, "⛔ a Thorn does not move the count");
  H.eq(r.proximity, base.proximity, "⛔ nor the nearest depth: its depth is a length (anchored)");

  const bolt = new X.WeaverBolt(far, 0.7);
  state.enemies.push(bolt);
  r = read("plus a bolt");
  H.close(r.count, 2 / C.INT_EXPECTED_ENEMIES, EPS, "⛔ a Weaver bolt counts");
  H.eq(r.proximity, 0.7, "and is the nearest");
  bolt.dead = true;
  r = read("the bolt dead");
  H.eq(r.count, base.count, "a dead entity does not count");
  H.eq(r.proximity, base.proximity, "nor set the nearest");

  state.enemies = [];
  for (let i = 0; i < 14; i++) state.enemies.push(new X.Vaulter(i % well.lanes, 1, 1));
  state.lives = 1;
  state.level = 200;
  r = read("the worst board");
  H.eq(r.count, 1, "the count caps at 1 past C.INT_EXPECTED_ENEMIES");
  H.eq(r.proximity, 1, "proximity 1 at the rim");
  H.eq(r.peril, 1, "peril 1 on the last life");
  H.eq(r.heat, X.heatT(200), "heat is heatT(level)");
  H.eq(r.heat, 1, "which saturates at 1");
  H.eq(r.combo, 0, "⛔ combo is 0 (D6)");
  H.close(soak("the worst board"), 0.85, 1e-6, "its intensity settles at 0.85 (D6)");
  for (const L of [1, 13, 23, 99]) {
    state.level = L;
    H.eq(read(`level ${L}`).heat, X.heatT(L), `heat at level ${L} is heatT(${L})`);
  }
  state.lives = 2; state.level = 13;
  state.enemies = [new X.Vaulter(far, 0.2, 1), new X.Thorn(far, 0.9)];
  H.eq(read("two lives").peril, 0, "peril is 0 above one life");
  soak("a mixed board");
  G.reset();
}

// ---------------------------------------------------------------------------
// duckFor — pure, every screen
// ---------------------------------------------------------------------------
{
  const SCREENS = ["title", "mode", "depth", "play", "pause", "gameover", "options", "controls", "keyboard", "gamepad", "credits"];
  const PAGES = ["options", "controls", "keyboard", "gamepad", "credits"];
  let on = 0;
  for (const from of ["title", "pause"]) {
    for (const s of SCREENS) {
      const want = s === "pause" || (from === "pause" && PAGES.includes(s));
      H.eq(X.duckFor(s, from), want, `duckFor(${s}, from ${from})`);
      if (want) on++;
    }
  }
  H.eq(on, 7, "⛔ exactly D9's screens duck: pause twice, and five pages from pause");
}

// ---------------------------------------------------------------------------
// the dips: sfx() on every event
// ---------------------------------------------------------------------------
{
  G.reset();
  A.unlock();
  M.ensureGraph();
  H.assert(M.dipNode !== null, "fixture: the dip node exists");
  const dipped = [];
  let t = 1;
  for (const name of Object.keys(C.SFX)) {
    if (name === "surgeCharge") continue;   // a held voice, never played
    t += 2; rec.ctx.currentTime = t;
    const n0 = rec.automation.filter(a => a.node === M.dipNode).length;
    X.sfx(name);
    const added = rec.automation.filter(a => a.node === M.dipNode).slice(n0);
    if (added.length) {
      dipped.push(name);
      H.assert(added.some(a => a.fn === "linearRampToValueAtTime" && a.v === C.MUSIC_DIP_GAIN),
               `${name}: the dip ramps to C.MUSIC_DIP_GAIN`);
    }
  }
  H.eq(dipped.sort().join(","), C.MUSIC_DIP_EVENTS.slice().sort().join(","), "⛔ exactly the four events dip the music");
  H.assert(!dipped.includes("lifeLost"), "⛔ lifeLost does not dip (D9)");
}

// ---------------------------------------------------------------------------
// audioFrame(), through frame(), on the fake (trap 1)
// ---------------------------------------------------------------------------
const MS = C.FIXED_DT * 1000;
let now = 1758200000000;
Date.now = () => (now += 7919);
let clock = 0;
function halfFrame() { clock += MS / 2; A.ctx.currentTime = clock / 1000; G.frame(clock); }
function liveStep() { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); }
function steps(n) { for (let i = 0; i < n; i++) liveStep(); }
function seconds(s) { for (let i = 0, n = Math.round(s * 1000 / (MS / 2)); i < n; i++) halfFrame(); }
// invulnTime counts UP (GDD 16.3): 0 is freshly respawned, so a fixture on its
// last life is re-armed every frame and cannot die by accident.
function guarded(s) { for (let i = 0, n = Math.round(s * 1000 / (MS / 2)); i < n; i++) { state.invulnTime = 0; halfFrame(); } }
const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
const FIRE = key(" "), ESC = key("Escape");
function press(b) { b.down(); liveStep(); b.up(); liveStep(); }
const sweepLog = () => rec.automation.filter(a => a.node === M.sweep && a.param === "frequency");
const duckRamps = () => rec.automation.filter(a => a.node === M.duck && a.fn === "linearRampToValueAtTime");
const spy = X.dangerInputs;
let resets = 0;
{ const r = D.reset; D.reset = function () { resets++; return r.apply(this, arguments); }; }

// ⛔ every call the game makes: the whole-state hash before and after
let hashCalls = 0, hashMoves = 0, hBefore = 0;
spy.before = () => { hBefore = hashState(); };
spy.after = () => { hashCalls++; if (hashState() !== hBefore) hashMoves++; };

G.reset(); G.frame(0); G.quitToTitle(); steps(2);
halfFrame();
H.eq(M.state, "title", "fixture: the title plays");
H.eq(M.sweepLevel, 1, "the title's sweep is open");
H.eq(M.ducked, false, "the title does not duck");
press(FIRE); press(FIRE);
H.eq(state.screen, "depth", "fixture: START DEPTH");
H.eq(M.ducked, false, "START DEPTH does not duck");

function enterPlay(tag) {
  const r0 = resets;
  FIRE.down();
  for (let n = 0; state.screen !== "play" && n < 16; n++) halfFrame();
  H.eq(state.screen, "play", `fixture: ${tag}`);
  H.eq(resets - r0, 1, `⛔ ${tag}: the first play frame resets the director once`);
  H.eq(D.level, 0, `⛔ ${tag}: the run starts from 0`);
  H.eq(M.intensity, 0, `${tag}: and so does the music's intensity`);
  FIRE.up();
}

// A run from the front door, and play drives both setters every frame.
enterPlay("a run from the front door");
{
  let bad = 0, frames = 0;
  state.lives = 1;                        // peril, so the level climbs
  const c0 = spy.calls;
  for (let i = 0; i < 360; i++) {
    state.invulnTime = 0;                 // and the fixture lives
    halfFrame();
    frames++;
    if (!(M.intensity === D.level && M.sweepLevel === D.level && D.level >= 0 && D.level <= 1)) bad++;
  }
  H.eq(bad, 0, `⛔ in play, setIntensity and setSweep carry the director's level on every frame (${frames})`);
  H.eq(spy.calls - c0, frames, "and dangerInputs is read once per play frame");
  H.assert(D.level > 0.1, `fixture: the level climbed (${D.level.toFixed(4)})`);
  H.assert(sweepLog().some(a => a.fn === "setTargetAtTime" && a.v < C.FILTER_MAX_HZ), "the sweep closed below fully open");
  H.eq(M.ducked, false, "play does not duck");
}

// ⛔ Pause holds; OPTIONS from pause holds and ducks; resume does not reset.
{
  const L = D.level, I = M.intensity, S = M.sweepLevel, sw = sweepLog().length, c0 = spy.calls, r0 = resets;
  press(ESC);
  H.eq(state.screen, "pause", "fixture: paused");
  H.eq(M.ducked, true, "⛔ pause ducks");
  const ramp = duckRamps().pop();
  H.eq(ramp.v, C.MUSIC_DUCK_GAIN, "⛔ to C.MUSIC_DUCK_GAIN, by a ramp");
  seconds(3);
  press({ down: () => G.input.keyDown("ArrowRight"), up: () => G.input.keyUp("ArrowRight") });
  press(FIRE);
  H.eq(state.screen, "options", "fixture: OPTIONS from pause");
  H.eq(M.ducked, true, "⛔ OPTIONS from pause ducks");
  seconds(2);
  H.eq(D.level, L, "⛔ pause and its OPTIONS hold the director's level");
  H.eq(M.intensity, I, "and the music's intensity");
  H.eq(M.sweepLevel, S, "and the sweep");
  H.eq(sweepLog().length, sw, "with no sweep automation while held");
  H.eq(spy.calls, c0, "and no danger read");
  press(ESC);
  H.eq(state.screen, "pause", "fixture: back on pause");
  seconds(2);
  ESC.down();
  for (let n = 0; state.screen !== "play" && n < 16; n++) halfFrame();
  H.eq(state.screen, "play", "fixture: resumed");
  H.eq(D.level, L, "⛔ the first play frame after a resume skips the paused time (Paul): the level is unmoved");
  H.eq(M.intensity, L, "and so is the music's");
  ESC.up(); liveStep();
  H.eq(resets, r0, "⛔ a resume is not a new run: no reset");
  H.eq(M.ducked, false, "resume lifts the duck");
  H.eq(duckRamps().pop().v, 1, "by a ramp back to 1");
}

// ⛔ The Dive reads 0, whatever the board.
{
  guarded(1);
  const L0 = D.level, t0 = A.ctx.currentTime, c0 = spy.calls;
  H.assert(L0 > 0.1, `fixture: a live level before the dive (${L0.toFixed(4)})`);
  X.startDive(state);
  state.level = 99;                                       // a board dangerInputs would read hot
  for (let i = 0; i < 8; i++) state.enemies.push(new X.Vaulter(i, 0.9, 1));
  H.assert(X.dangerInputs(state, {}).count > 0, "fixture: the staged board is not empty");
  const c1 = spy.calls;
  let frames = 0;
  while (state.dive.active && frames < 60) { halfFrame(); frames++; }
  H.eq(frames, 60, "fixture: the dive still running");
  H.eq(spy.calls, c1, "⛔ a Dive makes no danger read");
  H.close(D.level, L0 * Math.exp(-(A.ctx.currentTime - t0) / C.INT_RELEASE), EPS,
          "⛔ a Dive reads 0: the level falls by the release alone");
  H.eq(M.intensity, D.level, "and the music follows it down");
  H.assert(c1 - c0 === 1, "fixture: only the test's own read");
}

// Game over holds; RESTART starts from 0; the death dips.
{
  for (let n = 0; state.dive.active && n < 2000; n++) { state.invulnTime = 0; halfFrame(); }
  guarded(2);
  const dip0 = rec.automation.filter(a => a.node === M.dipNode).length;
  state.spawn.remaining = 5; state.spawn.timer = 0;
  state.enemies = []; state.shots = [];
  state.lives = 1; state.invulnTime = C.RESPAWN_INVULN;
  const e = X.spawnEnemy("vaulter", state.skimmer.lane, 0);
  e.depth = e.killDepth;
  liveStep();
  H.eq(state.screen, "gameover", "fixture: the last life");
  H.assert(rec.automation.filter(a => a.node === M.dipNode).length > dip0, "⛔ a played death dips the music");
  const L = D.level, S = M.sweepLevel, c0 = spy.calls;
  H.assert(L > 0, `fixture: a level to reset (${L.toFixed(4)})`);
  for (let n = 0; G.hitStopLeft > 0 && n < 600; n++) halfFrame();
  steps(10);
  H.eq(D.level, L, "game over holds the level");
  H.eq(M.sweepLevel, S, "and the sweep");
  H.eq(spy.calls, c0, "and reads no danger");
  H.eq(M.ducked, false, "⛔ game over does not duck");
  enterPlay("RESTART");
}

// The title opens the sweep; a run from it starts from 0 again.
{
  state.lives = 1;
  guarded(3);
  H.assert(M.sweepLevel < 1 && D.level > 0, "fixture: a closed sweep in play");
  G.quitToTitle();
  halfFrame();
  H.eq(state.screen, "title", "fixture: the title");
  H.eq(M.sweepLevel, 1, "⛔ the title sets the sweep fully open");
  const last = sweepLog().pop();
  H.assert(last.fn === "setTargetAtTime" && Math.abs(last.v - C.FILTER_MAX_HZ) < 1e-6, "to C.FILTER_MAX_HZ");
  steps(2);
  press({ down: () => G.input.keyDown("ArrowRight"), up: () => G.input.keyUp("ArrowRight") });
  press(FIRE);
  H.eq(state.screen, "options", "fixture: OPTIONS from the title");
  H.eq(M.ducked, false, "⛔ the title's OPTIONS does not duck");
  press(ESC);
  H.eq(state.screen, "title", "fixture: back at the title");
  press(FIRE); press(FIRE);
  enterPlay("a second run from the title");
}

H.assert(hashCalls > 1000, `fixture: the hash checked every played read (${hashCalls})`);
H.eq(hashMoves, 0, "⛔ no played dangerInputs call changed the whole-state hash");

// ---------------------------------------------------------------------------
// the built file
// ---------------------------------------------------------------------------
{
  const at = script.indexOf("// 18-audio-director.js");
  const end = script.indexOf("// 19-sfx.js", at);
  const slice = script.slice(at, end);
  H.assert(at > 0 && slice.includes("function createDirector("), "the director slice is real");
  H.assert(!/\bC\./.test(slice), "⛔ the director slice has no C.");
  H.assert(!/\bstate\b/.test(slice), "⛔ and never says state");
  for (const g of ["AudioSys", "MusicSys", "Game", "heatT", "dangerInputs"]) {
    H.assert(!new RegExp(`\\b${g}\\b`).test(slice), `⛔ and names no game global (${g})`);
  }
  const di = script.slice(script.indexOf("function dangerInputs("), script.indexOf("\n}\n", script.indexOf("function dangerInputs(")));
  H.assert(di.length > 0, "dangerInputs is top-level in the build");
  H.assert(!/[^a-zA-Z0-9_.$]heat\s*\(/.test(di), "⛔ dangerInputs never calls heat( (test-cs007-p2.js)");
  H.assert(/heatT\(state\.level\)/.test(di), "it reads heatT(state.level)");
  H.assert(!/\bnew\b|=>|\[\s*\]|\.(map|filter|slice|concat)\(|\{\s*\w+\s*:/.test(di), "⛔ and allocates nothing");
  H.assert(!/\bstate\.[\w.[\]]+\s*=[^=]/.test(di), "⛔ and assigns nothing on state");
  const af = script.slice(script.indexOf("function audioFrame()"), script.indexOf("\n  }\n", script.indexOf("function audioFrame()")));
  H.assert(/MusicSys\.setDuck\(pauseSide\)/.test(af) && /duckFor\(screen, optionsFrom\)/.test(af),
           "audioFrame() sets the duck from duckFor on every frame");
  H.assert(af.indexOf("setIntensity") < af.indexOf("MusicSys.setState("), "and sets intensity before setState()");
}

H.report("test-cs010-p2.js");

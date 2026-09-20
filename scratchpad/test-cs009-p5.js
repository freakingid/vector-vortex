// test-cs009-p5.js — CS009 P5: the Classic SFX at their seats (GDD 4.3, 4.4, 5,
// 6.3, 6.5, 11.8; plan §7). Asserts what P5 owns: `sfxVoice` on every roster
// class; every plan §7 event fired from a staged board through the real
// Game.update(); `lifeLost` at the cap and never on a stopped run; `purgeWeak`
// on use 2 and nothing on use 3; no kill sound on the Dive's termination kill;
// no seat writes state; the Surger tone — one held voice per telegraphing
// Surger every frame, its pitch following chargeTip(), silent under pause and
// in the death freeze, driven through frame(); and §11.8's headroom gate.
//
// ⛔ TRAPS.
//  1. `update()` samples the devices, so a staged `state.input` is overwritten:
//     fire and purge are key presses. `shotCooldown = 0` holds the fire tick.
//  2. The fake's clock is the test's. Half-step frames alternate a step and no
//     step, so the tone's "no step ran" path is exercised on every other frame.
//  3. The gate sums note peaks OVERLAPPING in time, not starting on one step.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260919;
installSeed(SEED);                          // ⛔ above the first buildGame()

// ⛔ CS014 P2 appended `ringTake` and `ringMiss` in place (GDD 5, 14.5; RF8-A):
// both are seated in takeRings() (11-dive.js), so the claim at the foot of
// PART 1 — every one-shot event in this list HAS a seat, and every seat writes
// no state and draws nothing — is the claim they belong to.
const EVENTS = ["fire", "kill", "split", "chip", "bolt", "cross", "surgeCharge", "surgeDischarge",
  "death", "gameOver", "respawn", "purge", "purgeWeak", "extraLife", "lifeLost", "wellClear",
  "dive", "diveStrike", "menuMove", "menuConfirm", "menuBack", "ringTake", "ringMiss"];
// ⛔ The gate's ratio (GDD 11.8, SETTLED; ⚠ provisional 0 dB): the tone's peak
// at master over the loudest music moment's summed note peaks at master.
const HEADROOM_RATIO = 1.0;

// ===========================================================================
// PART 1 — the seats, headless, through a spy
// ===========================================================================

const X = H.buildGame({ spy: ["sfx"] });
const { C, state } = X;
const G = X.Game;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = 0;

let calls = [];
X.sfx.before = (name, voice) => calls.push({ name, voice });
const names = () => calls.map(c => c.name);
const count = n => calls.filter(c => c.name === n).length;

const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
const FIRE = key(" "), PURGE = key("Shift"), ESC = key("Escape");

function quiet(level) {
  G.reset();
  X.startGame(SEED);
  state.level = level || 23;
  state.wellIndex = RING;
  X.enterWell();
  state.spawn.remaining = 1;
  state.spawn.timer = -1e9;
  state.enemies = [];
  state.shots = [];
  state.shotCooldown = 0;                   // trap 1: no fire tick unless asked
  calls = [];
  return X.WELLS[state.wellIndex];
}
const put = e => { state.enemies.push(e); return e; };
function shotAt(well, lane, depth) {
  const s = new X.Shot(well, lane);
  s.t = (1 - depth) * C.SHOT_TIME;
  state.shots.push(s);
  return s;
}
const skLane = () => Math.round(state.skimmer.lane);
const away = () => (skLane() + 8) % X.WELLS[RING].lanes;
function step() { calls = []; G.update(DT); return names(); }

H.eq(typeof X.sfx, "function", "sfx is a top-level function");
H.assert(EVENTS.every(n => C.SFX[n]), "every plan §7 event has a recipe");

// ---------------------------------------------------------------------------
// ⛔ A9 — the eighth contract field
// ---------------------------------------------------------------------------
{
  H.eq(new X.Enemy(0, 0.5).sfxVoice, null, "⛔ the base sfxVoice is null");
  const ROSTER = { Vaulter: "vaulter", Carrier: "carrier", Weaver: "weaver", WeaverBolt: "weaverBolt",
                   Thorn: "thorn", Drifter: "drifter", Surger: "surger" };
  for (const cls of Object.keys(ROSTER)) {
    const e = new X[cls](0, 0.5, 1);
    H.assert(e.sfxVoice !== null && e.sfxVoice !== undefined, `⛔ ${cls} sets a non-null sfxVoice`);
    H.eq(e.sfxVoice, ROSTER[cls], `${cls}'s voice`);
    H.assert(typeof C.SFX_KILL_PITCH[e.sfxVoice] === "number", `${cls}'s voice has a kill pitch`);
  }
  for (const k of Object.keys(X.ENEMY_KINDS)) {
    const e = X.ENEMY_KINDS[k](0, 0, 1);
    H.assert(e && e.sfxVoice !== null, `⛔ every ENEMY_KINDS row (${k}) builds a voiced entity`);
  }
}

// ---------------------------------------------------------------------------
// fire, and the three kill sites with their voices
// ---------------------------------------------------------------------------
{
  quiet();
  state.shotCooldown = C.SHOT_COOLDOWN;
  FIRE.down();
  H.eq(step().filter(n => n === "fire").length, 1, "⛔ fire: one sound per shot that leaves the rim");
  H.eq(state.shots.length, 1, "fixture: one shot fired");
  H.eq(step().filter(n => n === "fire").length, 0, "no sound on a step the cooldown refuses");
  FIRE.up();
}

function shotKill(make, voice, extra) {
  const well = quiet();
  const lane = away();
  const e = put(make(lane, 0.5));
  shotAt(well, lane, 0.5);
  const got = step();
  H.assert(e.dead, `fixture: the shot killed the ${voice}`);
  const kills = calls.filter(c => c.name === "kill");
  H.eq(kills.length, 1, `⛔ kill (collideShots): one kill sound for the ${voice}`);
  H.eq(kills.length && kills[0].voice, voice, `and it carries sfxVoice "${voice}"`);
  for (const x of extra || []) H.assert(got.includes(x), `${voice}: ${x} fires as well`);
}
shotKill((l, d) => new X.Vaulter(l, d, 1), "vaulter");
shotKill((l, d) => new X.Carrier(l, d, "vaulter"), "carrier", ["split"]);
shotKill((l, d) => { const w = new X.Weaver(l, d); w.phase = "retreat"; return w; }, "weaver");
shotKill((l, d) => { const u = new X.Drifter(l, d, 1); u.phase = "cross"; u.crossFrom = l; u.crossDelta = 0.5;
                     u.crossTime = 0; return u; }, "drifter");
shotKill((l, d) => new X.Surger(l, d), "surger");

{
  // split: only where the split happens
  const well = quiet();
  const lane = away();
  put(new X.Carrier(lane, 0.5, "vaulter"));
  shotAt(well, lane, 0.5);
  step();
  H.eq(count("split"), 1, "⛔ split: one sound where the Carrier splits");
}
{
  // chip, per chip; a killing chip is also a kill with the thorn's voice
  const well = quiet();
  const lane = away();
  const t = put(new X.Thorn(lane, 0.5));
  shotAt(well, lane, 0.5);
  step();
  H.eq(count("chip"), 1, "⛔ chip: one sound per chip");
  H.eq(count("kill"), 0, "a chip that leaves the Thorn standing is no kill");
  H.assert(!t.dead, "fixture: the Thorn stands");
  const u = put(new X.Thorn((lane + 2) % 16, 0.05));
  shotAt(well, u.lane, 0.05);
  step();
  H.assert(u.dead, "fixture: the chip finished it");
  H.eq(count("chip"), 1, "the killing chip chips");
  H.eq(calls.filter(c => c.name === "kill" && c.voice === "thorn").length, 1, "and it is a kill in the thorn's voice");
}
{
  // collideSkimmer: the rim sweep, with fire held and the fire tick withheld
  quiet();
  const e = put(new X.Vaulter(skLane(), PARK, 1));
  FIRE.down();
  step();
  FIRE.up();
  H.assert(e.dead && !state.skimmer.dead, "fixture: the sweep killed it and the craft lives");
  H.eq(state.shots.length, 0, "fixture: no shot flew — this is the sweep's kill site");
  H.eq(calls.filter(c => c.name === "kill" && c.voice === "vaulter").length, 1, "⛔ kill (the rim sweep) with its voice");
}

// ---------------------------------------------------------------------------
// the Purge: use 1, use 2 (feeble), use 3 silent; each victim a kill
// ---------------------------------------------------------------------------
{
  quiet();
  const a = away();
  put(new X.Vaulter(a, 0.3, 1)); put(new X.WeaverBolt((a + 2) % 16, 0.3)); put(new X.Thorn((a + 4) % 16, 0.3));
  PURGE.down(); step(); PURGE.up();
  H.eq(count("purge"), 1, "⛔ purge on use 1");
  H.eq(count("purgeWeak"), 0, "and not the weak one");
  H.eq(JSON.stringify(calls.filter(c => c.name === "kill").map(c => c.voice)), JSON.stringify(["vaulter", "weaverBolt"]),
       "⛔ each Purge victim is a kill in its own voice; the unpurgeable Thorn is not");
  step();
  put(new X.Surger(a, 0.4));
  PURGE.down(); step(); PURGE.up();
  H.eq(state.purgeUses, 2, "fixture: use 2");
  H.eq(count("purgeWeak"), 1, "⛔ purgeWeak on use 2");
  H.eq(count("purge"), 0, "and not the full one");
  H.eq(calls.filter(c => c.name === "kill" && c.voice === "surger").length, 1, "its one victim is a kill");
  step();
  put(new X.Vaulter(a, 0.4, 1));
  PURGE.down(); step(); PURGE.up();
  H.eq(state.purgeUses, 3, "fixture: use 3");
  H.eq(calls.filter(c => /^purge|^kill$/.test(c.name)).length, 0, "⛔ use 3 is silent");
  H.assert(C.SFX.purgeWeak.gain < C.SFX.purge.gain, "purgeWeak is the feebler recipe");
  // an empty second use is still spent, and still sounds
  quiet();
  state.purgeUses = 1;
  PURGE.down(); step(); PURGE.up();
  H.eq(count("purgeWeak"), 1, "a second use into an empty well still sounds feeble");
}

// ---------------------------------------------------------------------------
// bolt, cross, surgeDischarge
// ---------------------------------------------------------------------------
{
  quiet();
  const w = put(new X.Weaver(away(), 0.6));
  w.phase = "hold"; w.fired = false;
  step();
  H.eq(count("bolt"), 1, "⛔ bolt: Weaver.fire() sounds its launch");
  H.eq(state.enemies.filter(e => e instanceof X.WeaverBolt).length, 1, "fixture: the bolt exists");
  step();
  H.eq(count("bolt"), 0, "once per hold");
  // at the cap spawnEnemy refuses, and a refused bolt is silent
  quiet();
  const w2 = put(new X.Weaver(away(), 0.6));
  w2.phase = "hold"; w2.fired = false;
  while (state.enemies.length < C.ENEMY_CAP) put(new X.Thorn((away() + 3) % 16, 0.1));
  step();
  H.eq(count("bolt"), 0, "a bolt the cap refuses makes no launch sound");
}
{
  quiet();
  const d = put(new X.Drifter(away(), 0.3, 1));
  H.eq(d.phase, "birth", "fixture: a Drifter at birth");
  step();
  H.eq(d.phase, "cross", "fixture: its first step opens a cross");
  H.eq(count("cross"), 1, "⛔ cross: the moment it opens (the birth cross included)");
  let n = 0, s = 0;
  while (d.phase === "cross" && s++ < 600) { step(); n += count("cross"); }
  H.eq(n, 0, "no sound while it crosses or rides in");
  H.eq(d.phase, "ride", "fixture: riding");
  d.rideTimer = C.DRIFT_RIDE_TIME;
  step();
  H.eq(d.phase, "cross", "fixture: the next cross opens");
  H.eq(count("cross"), 1, "⛔ and every cross after sounds as it opens");
}
{
  quiet();
  const u = put(new X.Surger(away(), PARK));
  u.setPhase("telegraph");
  u.surgeTimer = C.SURGE_TELEGRAPH - DT / 2;
  step();
  H.eq(u.phase, "discharge", "fixture: the fuse ran out");
  H.eq(count("surgeDischarge"), 1, "⛔ surgeDischarge at setPhase(\"discharge\")");
  let n = 0;
  for (let i = 0; i < 120; i++) { step(); n += count("surgeDischarge"); }
  H.eq(n, 0, "and not on the way back to climb");
}

// ---------------------------------------------------------------------------
// death, gameOver, respawn
// ---------------------------------------------------------------------------
{
  quiet();
  state.lives = 2;
  put(new X.Vaulter(skLane(), PARK, 1));
  step();
  H.assert(state.skimmer.dead && state.screen === "play", "fixture: a death, not the last");
  H.eq(count("death"), 1, "⛔ death at killSkimmer()");
  H.eq(count("gameOver"), 0, "no game over with a life left");
  step();
  H.assert(!state.skimmer.dead, "fixture: respawned");
  H.eq(count("respawn"), 1, "⛔ respawn at respawnSkimmer()");
  H.eq(count("death"), 0, "and the invulnerable craft does not die again");

  quiet();
  state.lives = 1;
  put(new X.Vaulter(skLane(), PARK, 1));
  step();
  H.eq(state.screen, "gameover", "fixture: the last life");
  H.eq(count("death"), 1, "the last death sounds");
  H.eq(count("gameOver"), 1, "⛔ gameOver where killSkimmer() sets it");
}

// ---------------------------------------------------------------------------
// ⛔ extraLife, lifeLost at the cap, and silence on a stopped run
// ---------------------------------------------------------------------------
{
  function milestoneKill(lives) {
    const well = quiet();
    state.lives = lives;
    state.score = state.nextLife - 1;
    const lane = away();
    put(new X.Vaulter(lane, 0.5, 1));
    put(new X.Vaulter((lane + 4) % 16, 0.1, 1));   // the well stays open
    shotAt(well, lane, 0.5);
    step();
  }
  milestoneKill(C.LIVES_MAX - 1);
  H.eq(state.lives, C.LIVES_MAX, "fixture: a life awarded below the cap");
  H.eq(count("extraLife"), 1, "⛔ extraLife in addScore()'s award branch");
  H.eq(count("lifeLost"), 0, "and no lifeLost");

  milestoneKill(C.LIVES_MAX);
  H.eq(state.lives, C.LIVES_MAX, "fixture: at the cap, nothing awarded");
  H.eq(count("lifeLost"), 1, "⛔ lifeLost: an award refused at the cap on a live run");
  H.eq(count("extraLife"), 0, "and no extraLife");

  // two milestones in one award at the cap: two refusals, two sounds
  quiet();
  state.lives = C.LIVES_MAX;
  calls = [];
  X.addScore(state.nextLife + C.EXTRA_LIFE_EVERY);
  H.eq(count("lifeLost"), 2, "one award crossing two milestones at the cap loses two lives aloud");

  // ⛔ THE STOPPED RUN: the last life goes to a bolt on the step a shot clears the
  // well, and the clear bonuses cross a milestone after the stop.
  const well = quiet();
  state.lives = 1;
  state.spawn.remaining = 0;
  const lane = away();
  put(new X.Vaulter(lane, 0.5, 1));
  put(new X.WeaverBolt(skLane(), 0.96));
  shotAt(well, lane, 0.5);
  state.score = state.nextLife - 1 - C.PTS_VAULTER;
  const next = state.nextLife;
  step();
  H.eq(state.screen, "gameover", "fixture: the bolt ended the run");
  H.assert(state.nextLife > next, "fixture: the clear edge crossed a milestone after the stop");
  H.eq(count("wellClear"), 1, "fixture: on the clearing step");
  H.eq(count("lifeLost"), 0, "⛔ no lifeLost on a stopped run");
  H.eq(count("extraLife"), 0, "⛔ and no extraLife either");
}

// ---------------------------------------------------------------------------
// wellClear, dive, diveStrike, a repeated dive, and the silent termination kill
// ---------------------------------------------------------------------------
{
  const well = quiet();
  state.spawn.remaining = 0;
  const lane = away();
  put(new X.Vaulter(lane, 0.5, 1));
  shotAt(well, lane, 0.5);
  const got = step();
  H.eq(count("wellClear"), 1, "⛔ wellClear at the clear edge");
  H.eq(count("dive"), 1, "⛔ dive at startDive()");
  H.assert(got.indexOf("wellClear") < got.indexOf("dive"), "the clear, then the dive");
  H.assert(state.dive.active, "fixture: diving");
  let n = 0;
  for (let i = 0; i < 30; i++) { step(); n += count("wellClear") + count("dive"); }
  H.eq(n, 0, "neither repeats inside the dive");

  // ⛔ every lane thorned: strike, then diveRespawn()'s termination kill
  quiet();
  state.lives = 3;
  for (let l = 0; l < X.WELLS[RING].lanes; l++) put(new X.Thorn(l, 1));
  X.startDive(state);
  state.dive.timer = C.DIVE_GRACE;
  step();
  H.assert(state.skimmer.dead, "fixture: struck");
  H.eq(count("diveStrike"), 1, "⛔ diveStrike when it hits");
  H.eq(count("death"), 1, "and the death");
  const before = state.enemies.length;
  step();
  H.eq(state.enemies.length, before - 1, "fixture: the termination kill removed the struck Thorn");
  H.eq(count("kill"), 0, "⛔ the Dive's termination kill is silent");
  H.eq(count("respawn"), 1, "the dive respawn sounds");
  H.eq(count("dive"), 1, "⛔ and the repeated dive plays its sweep again");
  // an invulnerable diver passing through a Thorn is not a hit
  let s = 0;
  for (let i = 0; i < 20; i++) { step(); s += count("diveStrike"); }
  H.eq(s, 0, "an invulnerable diver passing through makes no strike sound");
}

// ---------------------------------------------------------------------------
// the menu: move, confirm, back; entry steps silent; an adjusting row moves
// ---------------------------------------------------------------------------
{
  G.reset();
  G.quitToTitle();
  const upd = n => { let got = []; for (let i = 0; i < n; i++) got = got.concat(step()); return got; };
  const tap = k => { G.input.keyDown(k); const a = upd(2); G.input.keyUp(k); return a.concat(upd(1)); };
  const press = b => { b.down(); const a = upd(1); b.up(); return a.concat(upd(1)); };
  H.eq(upd(2).length, 0, "the title's entry step is silent");
  const c0 = G.menu.cursor;
  let got = tap("ArrowRight");
  H.assert(G.menu.cursor !== c0, "fixture: the cursor moved");
  H.eq(got.filter(n => n === "menuMove").length, 1, "⛔ menuMove on a cursor move");
  got = tap("ArrowLeft");
  H.eq(got.filter(n => n === "menuMove").length, 1, "and back");
  got = tap("ArrowLeft");
  H.eq(got.length, 0, "a rotate clamped at the top row moves nothing and is silent");
  got = tap("ArrowRight");
  got = press(FIRE);
  H.eq(state.screen, "options", "fixture: OPTIONS from the title's second row");
  H.eq(JSON.stringify(got), JSON.stringify(["menuConfirm"]),
       "⛔ menuConfirm on an action — and OPTIONS' entry step, which moves the cursor to row 0, is silent");
  got = press(PURGE);
  H.eq(state.screen, "title", "fixture: Purge backs out");
  H.eq(JSON.stringify(got), JSON.stringify(["menuBack"]), "⛔ menuBack on the screen's back action");
  got = press(FIRE);
  H.eq(state.screen, "mode", "fixture: MODE");
  got = press(ESC);
  H.eq(state.screen, "title", "fixture: Escape backs out");
  H.eq(JSON.stringify(got), JSON.stringify(["menuBack"]), "⛔ menuBack on a queued Escape");

  // an adjusting row: MASTER VOLUME, one step down
  tap("ArrowRight"); press(FIRE);
  H.eq(state.screen, "options", "fixture: OPTIONS");
  for (let i = 0; i < 4; i++) tap("ArrowRight");
  got = press(FIRE);
  H.eq(JSON.stringify(got), JSON.stringify(["menuConfirm"]), "fixture: a row armed with a confirm");
  const vol = X.AudioSys.vol.master;
  got = tap("ArrowLeft");
  H.assert(X.AudioSys.vol.master < vol, "fixture: MASTER VOLUME stepped down");
  H.eq(JSON.stringify(got), JSON.stringify(["menuMove"]), "⛔ an adjusting row's step plays menuMove");
  G.reset();
}

// ---------------------------------------------------------------------------
// ⛔ no seat writes state: the source of every sfx call, read off the build
// ---------------------------------------------------------------------------
{
  const fs = require("fs"), path = require("path");
  const script = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
  const lines = script.split("\n").filter(l => /\bsfx\(/.test(l) && !/^\s*\/\//.test(l) && !/function sfx\(/.test(l));
  const seen = new Set();
  for (const l of lines) {
    const arg = l.slice(l.search(/\bsfx\(/)).match(/^sfx\(([^)]*)\)/);
    const named = arg ? (arg[1].match(/"(\w+)"/g) || []).map(q => q.slice(1, -1)) : [];
    H.assert(named.length > 0 && named.every(n => C.SFX[n]), `every seat names C.SFX events: ${l.trim()}`);
    named.forEach(n => seen.add(n));
    H.assert(arg && !/[^=!<>]=[^=]|\+\+|--|rng|draw/i.test(arg[1]), `⛔ a seat's arguments write nothing and draw nothing: ${l.trim()}`);
  }
  const fn = script.slice(script.indexOf("function sfx("), script.indexOf("\n}\n", script.indexOf("function sfx(")));
  H.assert(!/state|rng|draw/i.test(fn.replace(/\/\/.*$/gm, "")), "⛔ sfx() reads no state, draws nothing");
  const rt = script.slice(script.indexOf("function reconcileSurgeTones("),
                          script.indexOf("\n}\n", script.indexOf("function reconcileSurgeTones(")));
  H.assert(rt.length > 0 && !/state\.|rng|\.\w+\s*=[^=]/.test(rt.replace(/tone\.frame = surgeToneFrame/, "")),
           "⛔ reconcileSurgeTones writes nothing on an entity or state, and draws nothing");
  H.eq(EVENTS.filter(n => n !== "surgeCharge" && !seen.has(n)).join(","), "", "⛔ every one-shot event has a seat");
}

// ===========================================================================
// PART 2 — the Surger tone and the headroom gate, on the recording fake
// ===========================================================================

const Y = H.buildGame({ audio: true });
const CY = Y.C, SY = Y.state, GY = Y.Game, A = Y.AudioSys, M = Y.MusicSys, rec = Y._audio;
const MS = CY.FIXED_DT * 1000;
let clock = 0;
function halfFrame() { clock += MS / 2; A.ctx.currentTime = clock / 1000; GY.frame(clock); }   // trap 2

const R = CY.SFX.surgeCharge;
function oscsOf(g) {
  const into = rec.connections.filter(c => c.to === g).map(c => c.from);
  const flt = into.filter(n => n.kind === "biquad");
  return rec.connections.filter(c => flt.includes(c.to) && c.from.kind === "oscillator").map(c => c.from);
}
// ⛔ REPAIRED IN PLACE (CS010 P3). A voice was found as a gain ramping to exactly
// R.gain, and pulse's notes at Paul's 0.450 (D3) matched it: nine assertions
// red. A voice is now found by what it is: an envelope whose sources are the
// recipe's oscillators (type and start frequency, at hold()'s pitch 1, through
// its filter), routed into AudioSys.sfx. `recipeEnvelopes` drops the route, so
// the SFX-bus assertion below still has something to catch.
const startF = o => { const a = rec.automation.find(x => x.node === o && x.param === "frequency"); return a ? a.v : null; };
const isRecipeVoice = g => { const o = oscsOf(g);
  return o.length === R.osc.length && R.osc.every((r, i) => o[i].type === r.type && startF(o[i]) === r.f); };
const recipeEnvelopes = () => {
  const fedByFilter = new Set(rec.connections.filter(c => c.from.kind === "biquad" && c.to.kind === "gain").map(c => c.to));
  return rec.nodes.filter(n => n.kind === "gain" && fedByFilter.has(n) && isRecipeVoice(n));
};
const surgeVoices = () => {
  const toSfx = new Set(rec.connections.filter(c => c.to === A.sfx).map(c => c.from));
  return rec.nodes.filter(n => n.kind === "gain" && toSfx.has(n) && isRecipeVoice(n));
};
const stopped = g => oscsOf(g).some(o => rec.stops.some(s => s.node === o));
const liveVoices = () => surgeVoices().filter(g => !stopped(g));
const telegraphing = () => SY.enemies.filter(e => !e.dead && e.phase === "telegraph" && typeof e.chargeTip === "function");
const lastFreq = o => { const a = rec.automation.filter(x => x.node === o && x.param === "frequency"); return a.length ? a[a.length - 1] : null; };

GY.reset();
A.unlock();
GY.frame(0);
Y.startGame(SEED);
SY.wellIndex = RING;
Y.enterWell();
SY.spawn.remaining = 1;
SY.spawn.timer = -1e9;
SY.enemies = [];
const sk = Math.round(SY.skimmer.lane);
const u1 = new Y.Surger((sk + 5) % 16, 0.5), u2 = new Y.Surger((sk + 9) % 16, 0.5);
u1.surgeTimer = Y.surgeInterval() - 0.05;
u2.surgeTimer = Y.surgeInterval() - 0.30;
SY.enemies.push(u1, u2);

// ⛔ the count, every frame, and the pitch following the fuse
{
  let mismatch = 0, frames = 0, peakCount = 0, pitchBad = 0, rises = 0, sets = 0;
  const seenVoices = new Set();
  for (let i = 0; i < 360; i++) {
    halfFrame();
    frames++;
    const live = liveVoices(), tele = telegraphing();
    if (live.length !== tele.length) mismatch++;
    peakCount = Math.max(peakCount, tele.length);
    live.forEach(g => seenVoices.add(g));
    // each telegraphing Surger's tip, against some live voice's last targeted pitch
    for (const e of tele) {
      const want = R.osc[0].f * Math.pow(R.osc[0].to / R.osc[0].f, e.chargeTip());
      const hit = live.some(g => { const f = lastFreq(oscsOf(g).find(o => o.type === R.osc[0].type));
                                   return f && f.fn === "setTargetAtTime" && Math.abs(f.v - want) < 1e-6; });
      if (!hit) pitchBad++; else sets++;
    }
  }
  H.eq(mismatch, 0, `⛔ the live tone count equals the telegraphing count on every one of ${frames} frames`);
  H.eq(peakCount, 2, "fixture: both Surgers telegraphed at once for a while");
  H.assert(seenVoices.size >= 2, "fixture: at least two voices were started");
  H.eq(pitchBad, 0, "⛔ every telegraphing Surger's voice is set() to its chargeTip() pitch (a voice never set() is red)");
  H.assert(sets > 20, `fixture: the pitch was checked on many frames (${sets})`);
  for (const g of seenVoices) {
    const o = oscsOf(g).find(x => x.type === R.osc[0].type);
    const seq = rec.automation.filter(a => a.node === o && a.param === "frequency" && a.fn === "setTargetAtTime").map(a => a.v);
    let mono = seq.length > 5;
    for (let k = 1; k < seq.length; k++) if (seq[k] < seq[k - 1]) mono = false;
    if (mono && seq[seq.length - 1] > seq[0]) rises++;
  }
  for (const g of recipeEnvelopes()) {
    H.assert(rec.connections.some(c => c.from === g && c.to === A.sfx), "⛔ the tone feeds the SFX bus, never around it");
  }
  H.eq(rises, seenVoices.size, "⛔ every voice's frequency rises with chargeTip() over its telegraph");
}

// ⛔ silent under pause, and back when play resumes
{
  let guard = 0;
  while (telegraphing().length === 0 && guard++ < 2000) halfFrame();
  H.assert(telegraphing().length > 0 && liveVoices().length > 0, "fixture: a Surger telegraphing and sounding");
  GY.input.keyDown("Escape"); halfFrame(); halfFrame(); GY.input.keyUp("Escape");
  H.eq(SY.screen, "pause", "fixture: paused mid-fuse");
  let loud = 0;
  for (let i = 0; i < 120; i++) { halfFrame(); loud += liveVoices().length; }
  H.assert(telegraphing().length > 0, "fixture: the fuse is frozen mid-telegraph under the pause");
  H.eq(loud, 0, "⛔ no tone on any frame under pause");
  GY.input.keyDown("Escape"); halfFrame(); halfFrame(); GY.input.keyUp("Escape");
  for (let i = 0; i < 4; i++) halfFrame();
  H.eq(SY.screen, "play", "fixture: resumed");
  if (telegraphing().length) H.assert(liveVoices().length === telegraphing().length, "the tone returns with play");
}

// ⛔ silent inside the death freeze
{
  let guard = 0;
  while (telegraphing().length === 0 && guard++ < 2000) halfFrame();
  H.assert(liveVoices().length > 0, "fixture: sounding before the death");
  SY.invulnTime = CY.RESPAWN_INVULN;
  SY.lives = 3;
  SY.enemies.push(new Y.Vaulter(Math.round(SY.skimmer.lane), 1 - CY.RIM_CONTACT_DEPTH, 1));
  guard = 0;
  while (!SY.skimmer.dead && guard++ < 10) halfFrame();
  H.assert(SY.skimmer.dead && GY.hitStopLeft > 0, "fixture: dead, in the freeze");
  let loud = 0, frozenTele = 0;
  while (GY.hitStopLeft > 0.1) { halfFrame(); loud += liveVoices().length; frozenTele += telegraphing().length; }
  H.assert(frozenTele > 0, "fixture: a Surger stayed mid-telegraph through the freeze");
  H.eq(loud, 0, "⛔ no tone on any frame inside the death freeze");
}

// ---------------------------------------------------------------------------
// ⛔ THE HEADROOM GATE (GDD 11.8, SETTLED). At the default volumes: the tone's
// peak at master ≥ HEADROOM_RATIO × the loudest music moment at master.
// ⛔ CS010 P1 rewrote the two headroom assertions in place to Paul's D16: the
// music passes a limiter, so the loudest overlap of note peaks is the limiter's
// INPUT. It goes through the Web Audio spec's hard-knee static curve and its
// makeup gain, then the duck, the dip and the buses. The model is exact only at
// knee 0, which is asserted first. It is not a bound on the rendered transient
// (plan §1.7); the settings are pinned to the rendered ones instead.
// ---------------------------------------------------------------------------
{
  const vols = ["master", "music", "sfx"].map(b => A.vol[b]);
  H.assert(vols.every(v => v === CY.AUDIO_VOL_DEFAULT / CY.AUDIO_VOL_STEPS), "fixture: every bus at its default");
  const voice = surgeVoices()[0];
  H.assert(voice !== undefined, "fixture: a Surger voice was found on the SFX bus");
  const attack = rec.automation.find(a => a.node === voice && a.fn === "exponentialRampToValueAtTime");
  const tonePeak = (attack ? attack.v : 0) * A.vol.sfx;
  H.eq(tonePeak, R.gain * A.vol.sfx, "the tone peaks at its recipe gain through the SFX bus");
  for (const name of ["pulse", "title"]) {
    GY.reset();
    const track = Y.MUSIC_TRACKS[name];
    const loop = track.steps * track.stepDur;
    M.setState(name);
    const gates = M.layerGates.map(g => g.node);
    const t0 = A.ctx.currentTime, n0 = rec.nodes.length;
    for (let t = t0; t < t0 + loop + 1; t += 1 / 60) { A.ctx.currentTime = t; M.update(); }
    const notes = rec.nodes.slice(n0).filter(n => n.kind === "gain" && rec.connections.some(c => c.from === n && gates.includes(c.to)));
    const ev = [];
    for (const g of notes) {
      const a = rec.automation.filter(x => x.node === g && x.param === "gain");
      const start = a[0].t, peak = a[1].v, end = a[a.length - 1].t;
      if (start >= t0 + loop) continue;
      ev.push([start, peak], [end, -peak]);
    }
    ev.sort((p, q) => p[0] - q[0] || p[1] - q[1]);      // an end before a start at the same instant
    let sum = 0, loudest = 0;
    for (const e of ev) { sum += e[1]; loudest = Math.max(loudest, sum); }
    const trackPeak = Math.max(...rec.automation.filter(x => x.node === M.trackGain && x.param === "gain").map(x => x.v));
    const L = M.limiter;
    H.assert(L && L.kind === "compressor", `fixture: ${name} plays through the limiter`);
    H.eq(L.knee.value, 0, `⛔ ${name}: the limiter's knee is 0, so the curve model is exact (D16)`);
    const T = L.threshold.value, Rt = L.ratio.value;
    const xdB = 20 * Math.log10(loudest * trackPeak);
    const ydB = (xdB > T ? T + (xdB - T) / Rt : xdB) - 0.6 * (T - T / Rt);   // curve, then makeup
    const musicPeak = Math.pow(10, ydB / 20) * M.duck.gain.value * M.dipNode.gain.value * A.vol.music * A.vol.master;
    H.assert(notes.length > 50, `fixture: ${name}'s loop scheduled its notes (${notes.length})`);
    H.assert(tonePeak * A.vol.master >= HEADROOM_RATIO * musicPeak,
             `⛔ headroom on ${name}: surgeCharge ${(tonePeak * A.vol.master).toFixed(3)} ≥ ${HEADROOM_RATIO} × the limited loudest moment ${musicPeak.toFixed(4)} (in ${(loudest * trackPeak).toFixed(4)})`);
    M.setState(Y.MUSIC_SILENCE);
  }
}

H.report("test-cs009-p5.js");

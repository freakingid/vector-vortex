// test-cs012-p2.js — CS012 P2: the mode flags, the Reaver and Overdrive's
// schedule (GDD 4.4, 6.4, 6.5, 8.1, 14.6, 17 items 3 and 13; plan §4, §9).
// Asserts what P2 owns: modeHas(), eligibleKinds(level, mode), the no-draw rule
// in Overdrive, the Reaver's contract, hunt, hop, respawn guarantee, wall soak
// and rim arrival, the Purge, and that a Classic run never releases one.
//
// ⛔ TRAPS.
//  1. Every expected set is WRITTEN OUT. A table derived from C passes on any
//     schedule at all.
//  2. startGame() rebuilds state.rng, so a counting proxy goes on AFTER it.
//  3. The rim sweep (09-collision.js) kills a touching rim enemy under held fire,
//     which masks CS008 P1's ε mutation on its own; §7's mutation removes the
//     sweep AND ε together, and the record is in log/CS012.md.
//  4. A Reaver hunts mid-climb, so no LEGAL Skimmer ever sends one at an open
//     well's wall; §4's fold case stages the Skimmer off the well on purpose.
//  5. The soaks top up quota and lives: the LEVEL is the fixture, and a game
//     over would meet a live menu.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

const SEED = 20260916;
const SOAK_SEED = SEED + 4;                 // §8's wall soak (CS013 P1, in place)

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame({ spy: ["drawReaver", "drawVaulter", "glowStroke", "drawPoly"] });
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = X.WELLS[0];
const VEE = X.WELLS[7];
H.assert(RING.closed && RING.lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(!VEE.closed && VEE.lanes === 13, "fixture: WELLS[7] is the open 13-lane Vee");

function board(mode, level, wellIndex, seed) {
  G.reset();
  X.startGame(seed === undefined ? SEED : seed, { mode });
  state.level = level;
  state.wellIndex = wellIndex === undefined ? (level - 1) % X.WELLS.length : wellIndex;
  X.enterWell();
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// ---------------------------------------------------------------------------
// 1. THE MODE FLAGS (R1)
// ---------------------------------------------------------------------------
// ⛔ CS013 P1 (R3) added `tokens` to both rows, in place: a field in the rows,
// never a new mode key. The claim — Classic has none, Overdrive has all — holds.
H.eq(JSON.stringify(C.MODE_FLAGS),
     JSON.stringify({ classic: { jump: false, combo: false, tokens: false }, overdrive: { jump: true, combo: true, tokens: true } }),
     "⛔ C.MODE_FLAGS is R1's table: Classic has none, Overdrive has all");
for (const name of ["jump", "combo"]) {
  H.eq(X.modeHas(name, "classic"), false, `modeHas("${name}", "classic") is false`);
  H.eq(X.modeHas(name, "overdrive"), true, `modeHas("${name}", "overdrive") is true`);
}
board("overdrive", 1);
H.eq(X.modeHas("jump"), true, "⛔ the mode argument defaults to state.mode (an Overdrive run)");
board("classic", 1);
H.eq(X.modeHas("jump"), false, "and on a Classic run it reads false");
H.eq(X.modeHas("reaver", "overdrive"), false, "an undeclared flag reads as absent — the Reaver is a schedule row, not a flag");
H.eq(X.modeHas("jump", "arcade"), false, "and an unknown mode reads as absent rather than throwing");

// ---------------------------------------------------------------------------
// 2. ⛔ THE SCHEDULE, PER MODE (O2) — trap 1
// ---------------------------------------------------------------------------
const CLASSIC = [
  { from:  1, to:  2, kinds: ["vaulter"] },
  { from:  3, to:  4, kinds: ["vaulter", "carrierVaulter"] },
  { from:  5, to:  8, kinds: ["vaulter", "carrierVaulter", "weaver"] },
  { from:  9, to: 12, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter"] },
  { from: 13, to: 17, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter", "surger"] },
  { from: 18, to: 22, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter", "surger", "carrierDrifter"] },
  { from: 23, to: 40, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter", "surger", "carrierDrifter",
                              "carrierSurger"] },
];
// ⛔ CS013 P3 rewrote the bands from L11 in place: the Warden's row joined this
// table, so the sets from 11 on are one longer and the 9–12 band split at 11.
// The claim is the one this table always made — the answer at every level is
// the WRITTEN-OUT set, not a set derived from C.
const OVERDRIVE = [
  { from:  1, to:  2, kinds: ["vaulter"] },
  { from:  3, to:  4, kinds: ["vaulter", "carrierVaulter"] },
  { from:  5, to:  5, kinds: ["vaulter", "carrierVaulter", "weaver"] },
  { from:  6, to:  8, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver"] },
  { from:  9, to: 10, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter"] },
  { from: 11, to: 12, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden"] },
  { from: 13, to: 17, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden",
                              "surger"] },
  { from: 18, to: 22, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden",
                              "surger", "carrierDrifter"] },
  { from: 23, to: 40, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden",
                              "surger", "carrierDrifter", "carrierSurger"] },
];
const bandAt = (table, L) => table.find(b => L >= b.from && L <= b.to).kinds;

H.eq(JSON.stringify(C.SPAWN_SCHEDULE_OVERDRIVE),
     JSON.stringify([{ level: 6, kind: "reaver" }, { level: 11, kind: "warden" }]),
     "⛔ C.SPAWN_SCHEDULE_OVERDRIVE is the Reaver at 6 and — CS013 P3 — the Warden at 11 (GDD 14.6)");
let odWrong = null, clWrong = null, clArg = null;
for (let L = 1; L <= 40; L++) {
  const od = JSON.stringify(X.eligibleKinds(L, "overdrive"));
  if (od !== JSON.stringify(bandAt(OVERDRIVE, L))) odWrong = odWrong || `L${L}: ${od}`;
  const cl = JSON.stringify(X.eligibleKinds(L));
  if (cl !== JSON.stringify(bandAt(CLASSIC, L))) clWrong = clWrong || `L${L}: ${cl}`;
  if (JSON.stringify(X.eligibleKinds(L, "classic")) !== cl) clArg = clArg || `L${L}`;
}
H.eq(odWrong, null, `⛔ eligibleKinds(L, "overdrive") equals the written-out Overdrive table at every level 1..40 (${odWrong})`);
H.eq(clWrong, null, `⛔ eligibleKinds(L) is Classic's table, unchanged, at every level 1..40 (${clWrong})`);
H.eq(clArg, null, `⛔ and eligibleKinds(L, "classic") is the same answer (${clArg})`);
H.eq(X.eligibleKinds(200, "classic").indexOf("reaver"), -1, "⛔ no Classic level releases a Reaver, 200 included");

// ⛔ A CLASSIC ROW FIRST AT AN EQUAL LEVEL (O2). No shipped Overdrive row shares
// a Classic level, so the tie is STAGED on the data (restored at once): rows at
// 5 and 9, both Classic levels, and one at 7, which is not.
{
  const shipped = C.SPAWN_SCHEDULE_OVERDRIVE;
  C.SPAWN_SCHEDULE_OVERDRIVE = [{ level: 5, kind: "odA" }, { level: 7, kind: "odB" }, { level: 9, kind: "odC" }];
  const got = JSON.stringify(X.eligibleKinds(40, "overdrive"));
  C.SPAWN_SCHEDULE_OVERDRIVE = shipped;
  H.eq(got, JSON.stringify(["vaulter", "carrierVaulter", "weaver", "odA", "odB", "drifter", "odC", "surger",
                            "carrierDrifter", "carrierSurger"]),
       "⛔ merged in level order with the Classic row FIRST at an equal level (staged rows at 5, 7, 9)");
}

// ⛔ The function reads the level and the mode and nothing else.
board("classic", 13);
for (let i = 0; i < 12; i++) X.spawnEnemy("vaulter", i % 5, 0.3);
state.rng = X.mulberry32(SEED + 7);
H.eq(JSON.stringify(X.eligibleKinds(13, "overdrive")), JSON.stringify(bandAt(OVERDRIVE, 13)),
     "⛔ a full board, a different stream and a Classic run do not move an Overdrive answer");

// pickSpawnKind passes state.mode: Overdrive L6 releases Reavers, uniformly.
{
  board("overdrive", 6);
  state.rng = X.mulberry32(SEED);
  const tally = {};
  const N = 40000;
  for (let i = 0; i < N; i++) { const k = X.pickSpawnKind(state); tally[k] = (tally[k] || 0) + 1; }
  H.eq(JSON.stringify(Object.keys(tally).sort()), JSON.stringify(bandAt(OVERDRIVE, 6).slice().sort()),
       "⛔ pickSpawnKind(state) on an Overdrive L6 run releases exactly its four kinds");
  H.assert(Math.abs(tally.reaver / N - 0.25) < 0.015,
           `and the Reaver is 1/4 of them — the uniform pick, no weight (${(tally.reaver / N).toFixed(4)})`);
  board("classic", 6);
  let reaver = 0;
  for (let i = 0; i < 4000; i++) if (X.pickSpawnKind(state) === "reaver") reaver++;
  H.eq(reaver, 0, "⛔ and on a Classic L6 run it never does");
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE NO-DRAW RULE AT OVERDRIVE L1–2, COUNTED (test-cs006-p5.js's form)
// ---------------------------------------------------------------------------
function replay(input, i) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (i % 13 === 0)  input.keyDown(" ");
  if (i % 13 === 9)  input.keyUp(" ");
}

function countingRun(mode, level, bandTop, ticks) {
  board(mode, level);
  const real = state.rng;                   // trap 2
  let draws = 0;
  state.rng = () => { draws++; return real(); };
  const seen = new Set(state.enemies);
  const out = { perSpawn: [], idle: 0, extra: 0, rolls: 0, maxLevel: state.level };
  for (let i = 0; i < ticks && state.screen === "play" && state.level <= bandTop; i++) {
    if (state.level > out.maxLevel) out.maxLevel = state.level;
    state.lives = C.START_LIVES;
    replay(G.input, i);
    const before = draws, k0 = state.tally.kills;
    G.update(DT);
    // ⛔ CS013 P1 (T2): an Overdrive kill spends ONE token roll, and that draw is
    // not the spawner's. It is excluded here so the count is still the claim —
    // no kind draw on a one-entry set; test-cs013-p1.js counts the rolls.
    const rolls = state.tally.kills - k0;
    out.rolls += rolls;
    const spent = draws - before - rolls;
    let added = 0;
    for (const e of state.enemies) if (!seen.has(e)) { seen.add(e); added++; }
    if (added === 1) out.perSpawn.push(spent);
    else if (added === 0) out.idle += spent;
    else out.extra++;
  }
  state.rng = real;
  return out;
}
{
  const one = countingRun("overdrive", 1, 2, 6000);
  H.eq(X.eligibleKinds(one.maxLevel, "overdrive").length, 1,
       `every counted tick ran on a ONE-entry Overdrive set (reached L${one.maxLevel})`);
  H.assert(one.perSpawn.length >= 8, `the Overdrive L1–2 run spawned (${one.perSpawn.length})`);
  H.eq(one.extra, 0, "and no tick added two entities");
  const lo = Math.min(...one.perSpawn), hi = Math.max(...one.perSpawn);
  H.assert(lo >= 2 && hi <= 1 + C.SPAWN_LANE_TRIES,
           `⛔ every Overdrive L1–2 spawn spends a lane draw and a heading, and no kind draw (${lo}..${hi})`);
  H.eq(one.idle, 0, "⛔ and a tick that spawned nothing spends nothing but its kills' token rolls");
  H.assert(one.rolls > 0, `fixture: the run killed, so the exclusion above is exercised (${one.rolls} rolls)`);

  const two = countingRun("overdrive", 3, 4, 6000);
  H.eq(X.eligibleKinds(two.maxLevel, "overdrive").length, 2, `the control ran on a TWO-entry set (L${two.maxLevel})`);
  H.assert(two.perSpawn.length >= 8, `the control spawned (${two.perSpawn.length})`);
  H.eq(Math.min(...two.perSpawn), lo + 1,
       "⛔ a two-entry Overdrive set spends exactly ONE draw more per spawn — the absence above is measured");

  board("overdrive", 1);
  const real = state.rng;
  let n = 0;
  state.rng = () => { n++; return real(); };
  X.pickSpawnKind(state);
  H.eq(n, 0, "⛔ pickSpawnKind spends ZERO draws at Overdrive L1");
  state.level = 6;
  n = 0;
  X.pickSpawnKind(state);
  H.eq(n, 1, "⛔ and exactly ONE at Overdrive L6");
  state.rng = real;
}

// ---------------------------------------------------------------------------
// 4. ⛔ THE CONTRACT (plan §9), read off a Reaver from ENEMY_KINDS
// ---------------------------------------------------------------------------
{
  const r = X.ENEMY_KINDS.reaver(3, 0.4, -1);
  H.assert(r instanceof X.Reaver && r instanceof X.Vaulter && r instanceof X.Enemy,
           "⛔ ENEMY_KINDS.reaver builds a Reaver, a Vaulter subclass (R9)");
  H.eq(r.lane, 3, "lane is a position, in lane-centre units");
  H.eq(r.depth, 0.4, "depth is a position");
  H.eq(r.dir, -1, "⛔ the row passes `dir`");
  H.eq(r.dead, false, "dead starts false");
  H.eq(r.purgeable, true, "⛔ purgeable: true (GDD 4.3 exempts only the Thorn)");
  H.eq(r.blocksClear, true, "⛔ blocksClear: true");
  H.eq(r.killDepth, 1 - C.RIM_CONTACT_DEPTH, "⛔ killDepth: the shared rim band");
  H.eq(r.anchored, false, "⛔ anchored: false — depth is a position, so the respawn push reaches it");
  H.eq(r.sfxVoice, "reaver", "⛔ sfxVoice: \"reaver\"");
  H.eq(C.SFX_KILL_PITCH.reaver, 1.15, "⛔ its kill pitch is sfx-lab's candidate A, 1.15 (O16)");
  H.eq(r.points(), C.PTS_REAVER, "⛔ points(): C.PTS_REAVER");
  H.eq(C.PTS_REAVER, 300, "and that is GDD 7's 300");
  H.eq(r.hopRate, C.REAVER_HOP_RATE, "⛔ hopRate is C.REAVER_HOP_RATE");
  H.eq(C.REAVER_HOP_RATE, 1.6, "and that is GDD 14.6's 1.6 (O1)");
  H.eq(r.onShot(null), true, "⛔ onShot consumes");
  H.eq(r.dead, true, "and kills it");
  H.eq(X.ENEMY_KINDS.reaver(0, 0, 1).dir, 1, "and a positive dir is +1");

  const v = new X.Vaulter(3, 0.4, 1);
  H.eq(v.hopRate, 1, "⛔ a Vaulter's hopRate is exactly 1");
  H.eq(v.hopDuration(), C.VAULT_HOP_TIME, "⛔ and its hopDuration() is C.VAULT_HOP_TIME, unscaled");
  H.eq(Object.getOwnPropertyNames(X.Enemy.prototype).sort().join(","), "constructor,draw,onShot,points,update",
       "⛔ Enemy stays fields and signatures: no reader landed on the base");
  const base = new X.Enemy(0, 0);
  H.assert(!("hopRate" in base) && !("dir" in base), "⛔ and no hop field landed on the base");
  H.assert(Object.prototype.hasOwnProperty.call(X.Reaver.prototype, "midClimbDir") &&
           Object.prototype.hasOwnProperty.call(X.Reaver.prototype, "hopDuration") &&
           !Object.prototype.hasOwnProperty.call(X.Reaver.prototype, "update") &&
           !Object.prototype.hasOwnProperty.call(X.Reaver.prototype, "onShot"),
           "⛔ the Reaver overrides the two readers and inherits update() and onShot()");

  // Draw: drawReaver, through drawPoly + glowStroke, the Vaulter's colour (O16).
  const ctx = new Proxy({}, { get: () => () => {} });
  let stroke = null, closed = null;
  X.glowStroke.before = (c, color) => { stroke = color; };
  X.drawPoly.before = (c, pts, cl) => { closed = cl; };
  const dr = X.drawReaver.calls, dv = X.drawVaulter.calls;
  X.ENEMY_KINDS.reaver(2, 0.6, 1).draw(ctx, RING);
  X.glowStroke.before = null; X.drawPoly.before = null;
  H.eq(X.drawReaver.calls - dr, 1, "⛔ Reaver.draw() calls drawReaver()");
  H.eq(X.drawVaulter.calls - dv, 0, "and not drawVaulter()");
  H.eq(closed, true, "one closed path through drawPoly");
  H.eq(stroke, C.REAVER_COLOR, "stroked through glowStroke in C.REAVER_COLOR");
  H.eq(C.REAVER_COLOR, C.VAULTER_COLOR, "⛔ which is the Vaulter's colour, shared (O16)");
  H.eq(X.REAVER_POLY.length, 12, "REAVER_POLY is the Vaulter's eight points plus two two-point barbs");
  H.assert(X.VAULTER_POLY.every(p => X.REAVER_POLY.indexOf(p) !== -1),
           "⛔ and every Vaulter point is IN it, by reference — derived, not copied");
  H.assert(X.REAVER_POLY.filter(p => X.VAULTER_POLY.indexOf(p) === -1).every(p => p.d > 0),
           "⛔ and both barbs sit on the rim-side arms (d > 0)");

  // The one way in.
  board("overdrive", 6);
  state.enemies = [];
  const e = X.spawnEnemy("reaver", 5, 0.1);
  H.assert(e instanceof X.Reaver && state.enemies.indexOf(e) !== -1, "spawnEnemy(\"reaver\") puts one on the board");
}

// ---------------------------------------------------------------------------
// 5. THE HUNT (O1): every mid-climb hop toward the Skimmer, holding in its lane
// ---------------------------------------------------------------------------
// One mid-climb hop's signed delta, or 0 if none starts within `max` steps. The
// depth is held low so the climb never reaches the rim (the climb is §6's).
function firstHop(well, e, max) {
  for (let i = 0; i < max; i++) {
    e.depth = 0.2;
    e.update(DT, well, state);
    if (e.hopping) return e.hopDelta;
  }
  return 0;
}
{
  board("overdrive", 1, 0);
  const steps = Math.ceil(X.vaultInterval(1) / C.REAVER_HOP_RATE / DT) + 2;
  state.skimmer.lane = 10;
  H.assert(firstHop(RING, new X.Reaver(4, 0.2, -1), steps) > 0,
           "⛔ a Reaver whose heading is -1 hops +1, toward the Skimmer (lane 4 → 10)");
  state.skimmer.lane = 1;
  H.assert(firstHop(RING, new X.Reaver(14, 0.2, -1), steps) > 0,
           "⛔ and the short way round the Ring's seam (lane 14 → 1 is +1), laneDelta and never a subtraction");
  state.skimmer.lane = 0;
  H.assert(firstHop(RING, new X.Reaver(4, 0.2, 1), steps) < 0, "and -1 toward a Skimmer below it");
  H.eq(firstHop(RING, new X.Vaulter(4, 0.2, 1), steps), 0,
       "⛔ at level 1, where a Vaulter never vaults — the Reaver's hunt has no level gate (O1)");

  // Hold in its lane, then hop the step the Skimmer leaves (the timer held).
  state.skimmer.lane = 6;
  const r = new X.Reaver(6, 0.2, 1);
  H.eq(firstHop(RING, r, 3 * steps), 0, "⛔ in the Skimmer's lane it HOLDS for three intervals");
  state.skimmer.lane = 9;
  H.assert(firstHop(RING, r, 1) > 0, "⛔ and hops toward it on the very next step once it moves");

  // Every beat, not only the first: follow a Skimmer across the Ring.
  state.skimmer.lane = 8;
  const f = new X.Reaver(2, 0.2, -1);
  let wrong = 0, hops = 0;
  for (let i = 0; i < 40 * steps && f.lane !== 8; i++) {
    const was = f.hopping;
    f.depth = 0.2;
    f.update(DT, RING, state);
    if (f.hopping && !was) { hops++; if (f.hopDelta <= 0) wrong++; }
  }
  H.assert(hops === 6 && wrong === 0 && f.lane === 8,
           `⛔ every mid-climb hop took the Skimmer's direction until it arrived (${hops} hops, ${wrong} wrong, lane ${f.lane})`);

  // The open well's wall (trap 4).
  board("overdrive", 6, 7);
  state.skimmer.lane = 0;
  H.eq(firstHop(VEE, new X.Reaver(0, 0.2, -1), 3 * steps), 0, "on the Vee, a wall Reaver in the Skimmer's wall lane holds");
  state.skimmer.lane = 12;
  H.assert(firstHop(VEE, new X.Reaver(0, 0.2, -1), steps) > 0, "and hops inward toward a Skimmer at the far wall");
  H.eq(firstHop(VEE, new X.Reaver(12, 0.2, 1), 3 * steps), 0, "and holds at the other wall with the Skimmer there");
  state.skimmer.lane = -1;                  // ⚠ STAGED off the well: no legal Skimmer is here
  const w = new X.Reaver(0, 0.2, 1);
  firstHop(VEE, w, steps);
  let out = null;
  for (let i = 0; i < 60; i++) {
    w.depth = 0.2;
    w.update(DT, VEE, state);
    if (w.lane < 0 || w.lane > 12) out = out || w.lane;
  }
  H.eq(out, null, "⛔ a hop aimed past the wall never leaves [0, lanes-1]");
  H.eq(w.lane, 1, "⛔ it FOLDS through laneHop(): lane 0 heading -1 lands on lane 1");
  H.eq(w.dir, 1, "⛔ and the folded heading is written back (+1)");
}

// ---------------------------------------------------------------------------
// 6. THE HOP (O1): duration and both intervals at the rate, at L6, L23, L99
// ---------------------------------------------------------------------------
{
  for (const L of [6, 23, 99]) {
    board("overdrive", L, 0);
    state.skimmer.lane = 8;
    const r = new X.Reaver(0, 0.2, 1);
    H.eq(r.hopDuration(), C.VAULT_HOP_TIME / C.REAVER_HOP_RATE, `L${L}: ⛔ hopDuration() is VAULT_HOP_TIME / REAVER_HOP_RATE`);
    H.close(r.hopDuration(), 0.175, 1e-12, `L${L}: ⛔ 0.175 s at every level — heat never scales it (H2)`);

    // Mid-climb: the gap between hop starts, and each hop's length.
    const starts = [], lens = [];
    let run = 0;
    for (let i = 0; i < 2000 && starts.length < 4; i++) {
      const was = r.hopping;
      r.depth = 0.2;
      r.update(DT, RING, state);
      if (r.hopping && !was) starts.push(i);
      if (r.hopping) run++;
      else if (was) { lens.push(run); run = 0; }
      if (r.lane === 8) { r.lane = 0; }       // keep it hunting from far away
    }
    const mid = X.vaultInterval(L) / C.REAVER_HOP_RATE;
    H.assert(starts.length === 4, `L${L}: four mid-climb hops started`);
    H.assert(starts.slice(1).every((s, k) => Math.abs((s - starts[k]) * DT - mid) <= DT + 1e-9),
             `L${L}: ⛔ mid-climb hops start vaultInterval(L) / 1.6 = ${mid.toFixed(4)} s apart ` +
             `(${starts.slice(1).map((s, k) => ((s - starts[k]) * DT).toFixed(4))})`);
    H.assert(lens.length >= 2 && lens.every(n => Math.abs(n * DT - C.VAULT_HOP_TIME / C.REAVER_HOP_RATE) <= DT + 1e-9),
             `L${L}: ⛔ each hop lasts 0.175 s to a step (${lens})`);

    // At the rim: the hunt at vaultRimInterval(L) / 1.6.
    const rim = new X.Reaver(0, PARK, 1);
    const rs = [];
    for (let i = 0; i < 2000 && rs.length < 4; i++) {
      const was = rim.hopping;
      rim.update(DT, RING, state);
      if (rim.hopping && !was) rs.push(i);
      if (rim.lane === 8) rim.lane = 0;
    }
    const rimI = X.vaultRimInterval(L) / C.REAVER_HOP_RATE;
    H.assert(rs.length === 4 && rs.slice(1).every((s, k) => Math.abs((s - rs[k]) * DT - rimI) <= DT + 1e-9),
             `L${L}: ⛔ rim hunt hops start vaultRimInterval(L) / 1.6 = ${rimI.toFixed(4)} s apart ` +
             `(${rs.slice(1).map((s, k) => ((s - rs[k]) * DT).toFixed(4))})`);
    H.assert(rimI > r.hopDuration(), `L${L}: and the rim interval stays above the hop, so the knob is live`);

    // ⛔ The climb is the Vaulter's, bit for bit (O1).
    const a = new X.Reaver(4, 0, 1), b = new X.Vaulter(4, 0, 1);
    let same = true;
    for (let i = 0; i < 400; i++) {
      a.update(DT, RING, state); b.update(DT, RING, state);
      if (!Object.is(a.depth, b.depth)) same = false;
    }
    H.assert(same, `L${L}: ⛔ a Reaver's depth equals a Vaulter's on every step — 1.6x scales the hop, never the climb`);
  }
}

// ---------------------------------------------------------------------------
// 7. ⛔ THE RESPAWN GUARANTEE WITH REAVERS (GDD 4.4), through respawnSkimmer()
// ---------------------------------------------------------------------------
{
  const WINDOW = Math.round(C.RESPAWN_INVULN / DT);
  for (const L of [6, 23, 99]) {
    board("overdrive", L);
    state.spawn.remaining = 0;
    state.enemies = [];
    state.shots = [];
    state.lives = C.START_LIVES;
    const r = X.spawnEnemy("reaver", state.skimmer.lane, 1);
    const before = state.lives;
    let guard = 0;
    while (state.lives === before && guard++ < 900) G.update(DT);
    H.assert(state.lives === before - 1, `L${L}: the craft died to a rim Reaver (setup)`);
    G.update(DT);                           // the respawn step
    H.assert(r.depth <= C.RESPAWN_PUSH_DEPTH + C.VAULT_CLIMB * C.CLIMB_MULT_MAX * DT + 1e-12,
             `L${L}: ⛔ the real respawnSkimmer() pushed the Reaver to RESPAWN_PUSH_DEPTH (${r.depth.toFixed(4)})`);
    const lives = state.lives, d0 = r.depth;
    let died = null;
    for (let i = 0; i < WINDOW; i++) {
      G.update(DT);
      if (state.lives < lives) died = died || `step ${i}`;
    }
    H.eq(died, null, `L${L}: ⛔ NO contact death inside C.RESPAWN_INVULN with a live Reaver in the craft's lane`);
    H.assert(!r.dead && r.depth > d0 && r.depth < r.killDepth,
             `L${L}: ⛔ and it was alive, climbing, and still short of its kill band at the window's end ` +
             `(${r.depth.toFixed(4)} < ${r.killDepth})`);
  }
}

// ---------------------------------------------------------------------------
// 8. ⛔ GDD 17 ITEM 3 WITH REAVERS: the six open wells, 5,000 steps each (R15)
// ---------------------------------------------------------------------------
// ⛔ THE DRIVER, NEVER THE BUILD (STATUS: three classes park). Half of every
// 600 steps is the sweeping, firing replay, which clears parked Weavers and
// Carriers so the release budget frees; the other half pins the Skimmer to one
// wall with fire released, which is what walks a hunting Reaver into an end lane.
// A wall-pinned mouse alone parks the board with no Reaver ever released.
function pinWall(input, i) {
  const c = i % 600;
  if (c < 300) { replay(input, i); return; }
  if (c === 300) { input.keyUp(" "); input.keyUp("ArrowRight"); input.keyUp("ArrowLeft"); }
  input.mouseMove((Math.floor(i / 600) % 2) ? 4000 : -4000);
}
{
  const BOUND = 2 * DT / (C.VAULT_HOP_TIME / C.REAVER_HOP_RATE);
  H.close(BOUND, 0.1905, 1e-4, "⛔ R15's bound is 2 * DT / (VAULT_HOP_TIME / REAVER_HOP_RATE) = 0.1905 lanes per step");
  const OPEN = X.WELLS.map((w, i) => i).filter(i => !X.WELLS[i].closed);
  H.eq(OPEN.length, COUNTS.openWells, "the soak covers every open well");
  for (const idx of OPEN) {
    // ⛔ CS013 P1: the token roll (one draw per Overdrive kill, T2) moved every
    // board after its first kill, and at SEED the Trough and the Double-Vee lost
    // their wall Reaver (0 wall-steps). The precondition is restored by the
    // SEED, never relaxed: at SOAK_SEED every open well has Reavers at its wall.
    const well = board("overdrive", 7, idx, SOAK_SEED);
    const last = new Map();
    let reavers = 0, wall = 0, out = null, fast = null;
    for (let i = 0; i < 5000; i++) {
      state.spawn.remaining = C.SPAWN_QUOTA;   // trap 5
      state.lives = C.START_LIVES;
      pinWall(G.input, i);
      G.update(DT);
      for (const e of state.enemies) {
        if (!(e instanceof X.Reaver)) continue;
        if (!last.has(e)) reavers++;
        if (e.lane < 0 || e.lane > well.lanes - 1) out = out || `step ${i}: lane ${e.lane}`;
        if (e.lane === 0 || e.lane === well.lanes - 1) wall++;
        if (last.has(e) && Math.abs(e.lane - last.get(e)) > BOUND) {
          fast = fast || `step ${i}: ${last.get(e)} -> ${e.lane}`;
        }
        last.set(e, e.lane);
      }
      if (state.screen !== "play") break;
    }
    H.assert(state.level === 7 && reavers >= 4 && wall > 0,
             `${well.name}: the soak ran at L7 with Reavers live and at the wall (${reavers} Reavers, ${wall} wall-steps)`);
    H.eq(out, null, `${well.name}: ⛔ no Reaver lane leaves [0, ${well.lanes - 1}] in 5,000 steps`);
    H.eq(fast, null, `${well.name}: ⛔ and no step moves one more than R15's bound`);
  }
}

// ---------------------------------------------------------------------------
// 9. ⛔ GDD 17 ITEM 13 FOR THE REAVER: 24/24 over 0..23 ticks of pre-fire
// ---------------------------------------------------------------------------
function arrivalTable(Y, level, wellIndex, lane, place) {
  const S = Y.state, GG = Y.Game;
  const tally = { killed: 0, died: 0, dived: 0, neither: 0 };
  for (let p = 0; p < 24; p++) {
    GG.reset();
    Y.startGame(SEED, { mode: "overdrive" });
    S.level = level;
    S.wellIndex = wellIndex;
    Y.enterWell();
    S.spawn.remaining = 5;
    S.spawn.timer = -1e9;
    S.skimmer.lane = lane;
    GG.input.reset();
    GG.input.keyDown(" ");
    for (let i = 0; i < p; i++) GG.update(DT);
    S.enemies.push(place(Y));
    let res = "neither";
    for (let t = 0; t < 600; t++) {
      GG.update(DT);
      if (S.skimmer.dead || S.lives < C.START_LIVES) { res = "died"; break; }
      if (S.dive.active) { res = "dived"; break; }
      if (S.enemies.filter(e => e.blocksClear && !e.dead).length === 0) { res = "killed"; break; }
    }
    tally[res]++;
  }
  GG.input.keyUp(" ");
  return tally;
}
const HOP_IN = base => Y => new Y.Reaver(base + 1, PARK, 1);
const CLIMB_IN = base => Y => new Y.Reaver(base, 0.5, 1);
const MID_HOP_IN = base => Y => new Y.Reaver(base + 2, 0.5, 1);
for (const [idx, base] of [[0, 0], [7, 5]]) {
  for (const L of [6, 99]) {
    const tag = `${X.WELLS[idx].name} L${L}`;
    for (const [name, place] of [["a rim Reaver hopping in", HOP_IN], ["a Reaver climbing the lane", CLIMB_IN],
                                 ["a Reaver hunting in mid-climb", MID_HOP_IN]]) {
      const t = arrivalTable(X, L, idx, base, place(base));
      H.eq(t.killed, 24, `⛔ ${tag}: ${name} is killed on every cooldown phase (${JSON.stringify(t)})`);
    }
  }
}
// ⛔ Mutation-checked (trap 3): the rim sweep and ε removed together.
{
  const Z = H.buildGame({ mutate: [
    ["    if (state.input.fire && e.depth >= 1 - C.RIM_CONTACT_DEPTH) {", "    if (false) {"],
    ["if (Math.abs(sd - e.depth) > C.HIT_DEPTH_TOL + C.HIT_DEPTH_EPS) continue;",
     "if (Math.abs(sd - e.depth) > C.HIT_DEPTH_TOL) continue;"],
  ] });
  for (const [idx, base] of [[0, 0], [7, 5]]) {
    const t = arrivalTable(Z, 6, idx, base, HOP_IN(base));
    H.assert(t.killed < 24 && t.died > 0,
             `⛔ ${X.WELLS[idx].name}: with the sweep and ε both removed, a Reaver hopping in escapes some ` +
             `phases — the table above is not vacuous (${JSON.stringify(t)})`);
  }
}

// ---------------------------------------------------------------------------
// 10. THE PURGE'S FIRST USE KILLS IT; THE DIVE NEVER HOLDS ONE
// ---------------------------------------------------------------------------
{
  board("overdrive", 6);
  state.spawn.remaining = 5;
  state.spawn.timer = -1e9;
  state.enemies = [];
  const r = X.spawnEnemy("reaver", (state.skimmer.lane + 5) % RING.lanes, 0.5);
  const score = state.score, kills = state.tally.kills;
  H.eq(state.purgeUses, 0, "fixture: the Purge is unspent");
  G.input.keyDown("x");
  G.update(DT);
  G.input.keyUp("x");
  H.eq(state.purgeUses, 1, "the Purge fired");
  H.eq(r.dead || state.enemies.indexOf(r) === -1, true, "⛔ the Purge's FIRST use kills a Reaver");
  H.eq(state.score - score, C.PTS_REAVER, "and pays its 300 at the kill site");
  H.eq(state.tally.kills - kills, 1, "and counts one kill");

  board("overdrive", 6);
  state.enemies = [];
  const d = X.spawnEnemy("reaver", 3, 0.3);
  H.eq(X.wellCleared(state), false, "⛔ a live Reaver blocks the clear (blocksClear)");
  X.startDive(state);
  H.eq(state.enemies.indexOf(d), -1, "⛔ and startDive() keeps no Reaver — it is not anchored");
}

// ---------------------------------------------------------------------------
// 11. ⛔ CLASSIC NEVER SEES A REAVER: Start Depth 7, 5,000 steps, one hash each
// ---------------------------------------------------------------------------
const ROW = '    { level:  6, kind: "reaver" },\n';
function hashes(Y, mode, steps, stopAt) {
  const S = Y.state, GG = Y.Game;
  GG.reset();
  Y.startGame(SEED, { mode, startDepth: 7 });
  GG.input.reset();
  const out = [];
  let reaver = false, spawned = 0;
  for (let i = 0; i < steps; i++) {
    S.lives = C.START_LIVES;
    replay(GG.input, i);
    GG.update(DT);
    let h = 2166136261 >>> 0;
    const mix = v => { h = Math.imul(h ^ ((v * 1e6) | 0), 16777619) >>> 0; };
    mix(S.level); mix(S.wellIndex); mix(S.score); mix(S.spawn.timer); mix(S.spawn.remaining);
    mix(S.skimmer ? S.skimmer.lane : -1); mix(S.shots.length); mix(S.enemies.length);
    for (const e of S.enemies) {
      mix(e.lane); mix(e.depth); mix(e.dead ? 1 : 0);
      for (const ch of e.constructor.name) mix(ch.charCodeAt(0));
      if (e instanceof Y.Reaver) reaver = true;
    }
    spawned = Math.max(spawned, S.tally.kills + S.enemies.length);
    out.push(h);
    if (stopAt !== undefined && stopAt(out)) break;
  }
  return { out, reaver, level: S.level, spawned };
}
{
  const Z = H.buildGame({ mutate: [[ROW, ""]] });
  // ⛔ CS013 P3 repaired this fixture in place: ROW is the REAVER's row, so the
  // mutant now keeps the Warden's. The precondition the claim below needs is
  // "a build whose Overdrive table differs", which is what it still is.
  H.eq(JSON.stringify(Z.C.SPAWN_SCHEDULE_OVERDRIVE), JSON.stringify([{ level: 11, kind: "warden" }]),
       "fixture: the mutated build has lost the Reaver's row and kept the Warden's");
  const a = hashes(X, "classic", 5000), b = hashes(Z, "classic", 5000);
  let diff = -1;
  for (let i = 0; i < 5000 && diff < 0; i++) if (a.out[i] !== b.out[i]) diff = i;
  H.eq(a.out.length, 5000, "the Classic run lasted 5,000 steps");
  H.eq(diff, -1, `⛔ a Classic run at Start Depth 7 hashes IDENTICALLY, every step for 5,000 steps, to a build ` +
       `with the Overdrive row mutated out (first difference at ${diff})`);
  H.assert(!a.reaver && a.level >= 7 && a.spawned >= 20,
           `⛔ and no Reaver was ever on its board, at L${a.level} with ${a.spawned} enemies through it`);

  // Non-vacuity: the same mutation DOES move an Overdrive run.
  const od = hashes(X, "overdrive", 5000);
  const oz = hashes(Z, "overdrive", 5000);
  let odDiff = -1;
  for (let i = 0; i < 5000 && odDiff < 0; i++) if (od.out[i] !== oz.out[i]) odDiff = i;
  H.assert(od.reaver && odDiff >= 0,
           `⛔ while the same mutation moves an Overdrive run at Start Depth 7, which does release Reavers ` +
           `(first difference at step ${odDiff})`);
}

H.report("test-cs012-p2.js");

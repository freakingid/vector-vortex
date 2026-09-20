// test-cs013-p4.js — CS013 P4: the Mimic and its reflected shot (GDD 4.4, 4.5,
// 6.1, 6.3, 6.4, 6.5, 7, 8.1, 10.2, 12, 14.6, 17 items 3 and 8, 19, 21 #6;
// PLANNED-FEATURES-CS013.md MI1–MI3, T7, R6, R8, R10). Asserts what P4 owns:
// the bolt's overridable speed reader with a bit-identical Classic bolt, both
// contracts, the row at Overdrive 16, the reflect-then-open cycle and its
// one-reflection budget, the reflected shot's speed and the apex bound that
// makes it fair, the two-state read, item 3 on both entities — and ⚠ MI3, THE
// CUT: one row out and the Mimic is gone.
//
// ⛔ TRAPS.
//  1. Every expected set is WRITTEN OUT (test-cs012-p2.js's trap 1).
//  2. startGame() rebuilds state.rng, so a counting proxy goes on AFTER it.
//  3. `instanceof` is per build — every helper takes the build.
//  4. A step COUNT is never asserted: 1/60 is not binary, so the open window is
//     asserted as a property (STATUS).
//  5. A staged death in Overdrive must clear state.powers.ward, or the first
//     hit is absorbed and nothing dies (CS013 P2, T9).
//  6. mutantRed() proves its string is in the build exactly once BEFORE it
//     asserts red; a mutant that throws reads as a pass otherwise.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

const SEED = 20260920;
installSeed(SEED);                          // ⛔ above the first buildGame()
const SPIES = ["addScore", "sfx", "spawnEnemy", "glowStroke", "drawPoly", "drawMimic", "drawMimicShot"];
const X = H.buildGame({ spy: SPIES });
const C = X.C, G = X.Game, state = X.state, DT = C.FIXED_DT;
const J = JSON.stringify;
const SCRIPT = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = X.WELLS[0], VEE = X.WELLS[7];
const SHOT_SPEED = C.MIMIC_SHOT_RATIO / C.SHOT_TIME;
const EPS = 1e-12;
H.assert(RING.closed && RING.lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(!VEE.closed && VEE.lanes === 13, "fixture: WELLS[7] is the open 13-lane Vee");

// A board in `mode` at `level`, spawner held and empty unless a case fills it.
function board(mode, level, wellIndex, seed) {
  G.reset();
  X.startGame(seed === undefined ? SEED : seed, { mode });
  state.level = level;
  state.wellIndex = wellIndex === undefined ? (level - 1) % X.WELLS.length : wellIndex;
  X.enterWell();
  G.input.reset();
  return X.WELLS[state.wellIndex];
}
function quiet(mode, level, wellIndex, seed) {
  const well = board(mode, level, wellIndex, seed);
  state.spawn.remaining = 1;
  state.spawn.timer = -1e9;
  state.enemies = [];
  state.shots = [];
  state.tokens = [];
  state.powers.lance = state.powers.spread = state.powers.ward = false;   // trap 5
  return well;
}
// A Mimic at its apex, driven there through its own update() rather than placed.
function atApex(Z, well, lane) {
  const m = Z.spawnEnemy("mimic", lane, 0);
  for (let i = 0; i < 2000 && m.depth < Z.C.MIMIC_APEX; i++) m.update(Z.C.FIXED_DT, well, Z.state);
  return m;
}
// A shot in flight at `depth`, as the fire path would have made it.
function shotAt(Z, well, lane, depth, pierce) {
  const s = new Z.Shot(well, lane, pierce);
  s.t = (1 - depth) * Z.C.SHOT_TIME;
  Z.state.shots.push(s);
  return s;
}
const reflections = Z => Z.state.enemies.filter(e => e instanceof Z.MimicShot && !e.dead);

// ---------------------------------------------------------------------------
// 1. ⛔ THE BOLT'S SPEED IS AN OVERRIDABLE READER (MI2; the Reaver's precedent)
// ---------------------------------------------------------------------------
{
  const b = new X.WeaverBolt(3, 0.4);
  H.assert(typeof b.speed === "function", "⛔ WeaverBolt carries a speed() reader");
  H.eq(b.speed(), C.WEAVER_BOLT_SPEED, "⛔ and a Classic bolt's is C.WEAVER_BOLT_SPEED, unchanged");
  const before = b.depth;
  b.update(DT, RING, state);
  H.close(b.depth, before + C.WEAVER_BOLT_SPEED * DT, 1e-15,
          "⛔ the inherited update() moves it by exactly that — the arithmetic is the shipped line");

  // ⛔ ONE READ OF THE CONSTANT IN THE BUILD, and it is inside the reader — so
  // a variant cannot be given a speed by editing the bolt's update().
  const boltSrc = SCRIPT.slice(SCRIPT.indexOf("class WeaverBolt extends Enemy"),
                               SCRIPT.indexOf("class Thorn extends Enemy"));
  const boltCode = boltSrc.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  H.eq((boltCode.match(/C\.WEAVER_BOLT_SPEED/g) || []).length, 1,
       "⛔ the class names C.WEAVER_BOLT_SPEED exactly once — in speed()");
  H.assert(/this\.speed\(\)\s*\*\s*dt/.test(boltCode),
           "⛔ and update() reads the method, never the constant");
  // ⛔ R6/H2 stands: test-cs007-p2.js owns "never scaled by climbMult()", and
  // this is the other half — the reader did not become a heat accessor.
  H.assert(!/climbMult/.test(boltCode), "⛔ nothing in the bolt reads climbMult()");
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE TWO CONTRACTS (plan §9), read off ENEMY_KINDS
// ---------------------------------------------------------------------------
{
  const kinds = Object.keys(X.ENEMY_KINDS);
  H.eq(kinds.length, COUNTS.enemyKinds, `ENEMY_KINDS has ${COUNTS.enemyKinds} rows (the registry's count)`);
  H.assert(kinds.indexOf("mimic") >= 0 && kinds.indexOf("mimicShot") >= 0,
           "⛔ both rows exist — TWO kinds behind ONE roster row, the Weaver bolt's case");

  const m = X.ENEMY_KINDS.mimic(3, 0.2, -1);
  H.assert(m instanceof X.Mimic && m instanceof X.Enemy, "⛔ ENEMY_KINDS.mimic builds a Mimic, an Enemy subclass");
  H.assert(!(m instanceof X.Vaulter), "⛔ and NOT a Vaulter subclass — it is not a parameter variant of one");
  H.eq(m.lane, 3, "lane is a position, in lane-centre units");
  H.eq(m.depth, 0.2, "depth is a position");
  H.eq(m.dead, false, "dead starts false");
  H.eq(m.purgeable, true, "⛔ purgeable: TRUE (MI1, the Drifter's precedent) — the Purge answers what the guard refuses");
  H.eq(m.blocksClear, true, "⛔ blocksClear: true");
  H.eq(m.killDepth, null, "⛔ killDepth: NULL at every depth — its body never kills (R10)");
  H.eq(m.anchored, false, "⛔ anchored: false — depth is a POSITION");
  H.eq(m.aloft, false, "⛔ aloft: false — it lives IN the well");
  H.eq(m.sfxVoice, "mimic", '⛔ sfxVoice: "mimic"');
  H.eq(C.SFX_KILL_PITCH.mimic, 1.4, "⛔ its kill pitch is sfx-lab's candidate A, 1.4 (R8)");
  H.eq(m.points(), C.PTS_MIMIC, "⛔ points(): C.PTS_MIMIC");
  H.eq(C.PTS_MIMIC, 400, "and that is GDD 7's 400");
  H.eq(m.phase, "closed", "⛔ born CLOSED — a Mimic that arrived open is free points");
  H.eq(m.open(), false, "and open() agrees");
  H.eq(m.openTimer, 0, "⛔ one up-counting timer, at 0 (GDD 16.3)");

  const s = X.ENEMY_KINDS.mimicShot(5, 0.4, 1);
  H.assert(s instanceof X.MimicShot && s instanceof X.WeaverBolt && s instanceof X.Enemy,
           "⛔ ENEMY_KINDS.mimicShot builds a MimicShot, a WeaverBolt subclass — a parameter variant");
  H.eq(s.lane, 5, "lane is a position");
  H.eq(s.depth, 0.4, "depth is a position");
  H.eq(s.purgeable, true, "⛔ purgeable: true, the bolt's — the panic button saves you from it");
  H.eq(s.blocksClear, false, "⛔ blocksClear: FALSE, the bolt's — ordnance never holds a cleared well open");
  H.eq(s.killDepth, 1 - C.RIM_CONTACT_DEPTH, "⛔ killDepth: the shared rim band expression");
  H.eq(s.anchored, false, "⛔ anchored: false");
  H.eq(s.aloft, false, "⛔ aloft: false");
  H.eq(s.sfxVoice, "mimicShot", '⛔ sfxVoice: "mimicShot"');
  H.eq(C.SFX_KILL_PITCH.mimicShot, 1.8, "⛔ its kill pitch is sfx-lab's candidate A, 1.8 (R8)");
  H.eq(s.points(), 0, "⛔ points(): 0, the bolt's — GDD 7 has no row for a reflected shot");
  H.eq(s.onShot(null), false, "⛔ onShot() DECLINES — dodged, not answered (the bolt's ⚠ SETTLED)");
  H.eq(s.dead, false, "and it never dies to one");

  // The way in, and the factory shapes.
  H.eq(X.ENEMY_KINDS.mimic.length, 2, "the Mimic's factory is (lane, depth) — `dir` is not named");
  H.eq(X.ENEMY_KINDS.mimicShot.length, 2, "and the MimicShot's is too");
  quiet("overdrive", 16, 0);
  const e = X.spawnEnemy("mimic", 5, 0.1);
  H.assert(e instanceof X.Mimic && state.enemies.indexOf(e) !== -1, 'spawnEnemy("mimic") puts one on the board');
  const r = X.spawnEnemy("mimicShot", 5, 0.1);
  H.assert(r instanceof X.MimicShot && state.enemies.indexOf(r) !== -1, 'spawnEnemy("mimicShot") does too');

  // ⛔ Every kind still carries the nine contract fields and a voice.
  let missing = null;
  for (const k of kinds) {
    const q = X.ENEMY_KINDS[k](2, 0.4, 1);
    for (const f of ["lane", "depth", "dead", "purgeable", "blocksClear", "killDepth", "anchored", "sfxVoice", "aloft"]) {
      if (!(f in q)) missing = missing || `${k}.${f}`;
    }
    if (q.sfxVoice === null || typeof C.SFX_KILL_PITCH[q.sfxVoice] !== "number") missing = missing || `${k}: voice`;
  }
  H.eq(missing, null, `⛔ every ENEMY_KINDS row builds a nine-field, voiced entity (${missing})`);
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE SCHEDULE (GDD 8.1) — trap 1
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
const OVERDRIVE = [
  { from:  1, to:  2, kinds: ["vaulter"] },
  { from:  3, to:  4, kinds: ["vaulter", "carrierVaulter"] },
  { from:  5, to:  5, kinds: ["vaulter", "carrierVaulter", "weaver"] },
  { from:  6, to:  8, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver"] },
  { from:  9, to: 10, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter"] },
  { from: 11, to: 12, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden"] },
  { from: 13, to: 15, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger"] },
  { from: 16, to: 17, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger",
                              "mimic"] },
  { from: 18, to: 22, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger",
                              "mimic", "carrierDrifter"] },
  { from: 23, to: 40, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger",
                              "mimic", "carrierDrifter", "carrierSurger"] },
];
const bandAt = (table, L) => table.find(b => L >= b.from && L <= b.to).kinds;
{
  H.eq(J(C.SPAWN_SCHEDULE_OVERDRIVE),
       J([{ level: 6, kind: "reaver" }, { level: 11, kind: "warden" }, { level: 16, kind: "mimic" }]),
       "⛔ C.SPAWN_SCHEDULE_OVERDRIVE is three rows: the Reaver at 6, the Warden at 11 and the Mimic at 16");
  H.eq(J(C.SPAWN_SCHEDULE.map(r => r.level + ":" + r.kind)),
       J(["1:vaulter", "3:carrierVaulter", "5:weaver", "9:drifter", "13:surger", "18:carrierDrifter",
          "23:carrierSurger"]),
       "⛔ and C.SPAWN_SCHEDULE is untouched — seven Classic rows, no `mimic` among them");
  H.eq(C.SPAWN_SCHEDULE_OVERDRIVE.filter(r => r.kind === "mimicShot").length, 0,
       "⛔ `mimicShot` is NOT a schedule row — `weaverBolt`'s rule: it has no parent in the throat");
  H.eq(C.SPAWN_SCHEDULE.filter(r => r.kind === "mimicShot" || r.kind === "thorn" || r.kind === "weaverBolt").length, 0,
       "⛔ nor is it a Classic one, with `thorn` and `weaverBolt`");

  let odWrong = null, clWrong = null;
  for (let L = 1; L <= 40; L++) {
    const od = J(X.eligibleKinds(L, "overdrive"));
    if (od !== J(bandAt(OVERDRIVE, L))) odWrong = odWrong || `L${L}: ${od}`;
    const cl = J(X.eligibleKinds(L));
    if (cl !== J(bandAt(CLASSIC, L))) clWrong = clWrong || `L${L}: ${cl}`;
  }
  H.eq(odWrong, null, `⛔ eligibleKinds(L, "overdrive") equals the written-out table at every level 1..40 (${odWrong})`);
  H.eq(clWrong, null, `⛔ and Classic's is unchanged at every level 1..40 (${clWrong})`);
  H.eq(X.eligibleKinds(200, "classic").indexOf("mimic"), -1, "⛔ no Classic level releases a Mimic, 200 included");
  H.eq(X.eligibleKinds(15, "overdrive").indexOf("mimic"), -1, "⛔ nor does Overdrive L15 — the row is at 16");
  H.eq(X.eligibleKinds(200, "overdrive").indexOf("mimicShot"), -1, "⛔ and no level of either releases a mimicShot");

  // The share the uniform pick gives it, measured off pickSpawnKind (R8: no weights).
  board("overdrive", 16);
  state.rng = X.mulberry32(SEED);
  const tally = {};
  const N = 40000;
  for (let i = 0; i < N; i++) { const k = X.pickSpawnKind(state); tally[k] = (tally[k] || 0) + 1; }
  H.eq(J(Object.keys(tally).sort()), J(bandAt(OVERDRIVE, 16).slice().sort()),
       "⛔ pickSpawnKind(state) on an Overdrive L16 run releases exactly its eight kinds");
  H.assert(Math.abs(tally.mimic / N - 1 / 8) < 0.015,
           `and the Mimic is 1/8 of them — the uniform pick, no weight table (${(tally.mimic / N).toFixed(4)})`);
  board("classic", 16);
  let seen = 0;
  for (let i = 0; i < 4000; i++) if (X.pickSpawnKind(state) === "mimic") seen++;
  H.eq(seen, 0, "⛔ and on a Classic L16 run it never does");
}

// ⛔ THE NO-DRAW RULE AT OVERDRIVE L1–2 IS UNMOVED BY P4'S ROW (GDD 8.1), counted.
{
  board("overdrive", 1);
  const real = state.rng;                   // trap 2
  let n = 0;
  state.rng = () => { n++; return real(); };
  X.pickSpawnKind(state);
  H.eq(n, 0, "⛔ pickSpawnKind spends ZERO draws at Overdrive L1 — a one-entry set, unmoved by P4's row");
  state.level = 2;
  n = 0; X.pickSpawnKind(state);
  H.eq(n, 0, "⛔ and zero at Overdrive L2");
  state.level = 16;
  n = 0; X.pickSpawnKind(state);
  H.eq(n, 1, "⛔ and exactly ONE at Overdrive L16");
  state.rng = real;
}

// ---------------------------------------------------------------------------
// 4. ⛔ MI1 — THE CYCLE: reflect-then-open, and the one-reflection budget
// ---------------------------------------------------------------------------
{
  // ⛔ THE CLIMB: climbMult()'s SEVENTH call site, stopping at the apex and NOT
  // at the park depth (R6, R7).
  const well = quiet("overdrive", 16, 0);
  const m = X.spawnEnemy("mimic", 6, 0);
  H.eq(m.depth, 0, "fixture: released at the throat like everything else");
  const one = m.depth;
  m.update(DT, well, state);
  H.close(m.depth, one + C.MIMIC_CLIMB * X.climbMult() * DT, 1e-15,
          "⛔ it climbs at C.MIMIC_CLIMB * climbMult() — GDD 8's one multiplier");
  for (let i = 0; i < 4000 && m.depth < C.MIMIC_APEX; i++) m.update(DT, well, state);
  H.eq(m.depth, C.MIMIC_APEX, "⛔ and it lands EXACTLY on C.MIMIC_APEX — the clamp, not the last step");
  for (let i = 0; i < 600; i++) m.update(DT, well, state);
  H.eq(m.depth, C.MIMIC_APEX, "⛔ and HOLDS there — it never reaches the park depth or the rim");
  H.assert(C.MIMIC_APEX < PARK, "⛔ the apex is below the kill band, so it never arrives at the rim (R10)");
  H.eq(m.killDepth, null, "⛔ and its killDepth is null at every depth — its body never kills");
}
{
  // ⛔ CLOSED: the shot is consumed, ONE MimicShot goes back, and it opens.
  const well = quiet("overdrive", 16, 0);
  state.skimmer.lane = 4;
  const m = atApex(X, well, 4);
  const s = shotAt(X, well, 4, C.MIMIC_APEX);
  const sfx0 = X.sfx.calls;
  let reflect = 0;
  X.sfx.before = n => { if (n === "reflect") reflect++; };
  X.collideShots(state, well);
  X.sfx.before = null;
  H.eq(s.dead, true, "⛔ closed: the shot is CONSUMED");
  H.eq(m.dead, false, "⛔ and the Mimic does NOT die — the guard refused it");
  H.eq(m.open(), true, '⛔ it OPENS — GDD 14.6\'s "firing"');
  H.eq(m.openTimer, 0, "and its window timer restarts at 0");
  const back = reflections(X);
  H.eq(back.length, 1, "⛔ EXACTLY ONE MimicShot was sent back");
  H.assert(Object.is(back[0].lane, m.lane), "⛔ in the MIMIC's own lane, not the craft's");
  H.eq(back[0].depth, m.depth, "⛔ and born at the Mimic's own depth");
  H.eq(reflect, 1, '⛔ and `reflect` sounded exactly once (R8)');
  H.assert(X.sfx.calls > sfx0, "fixture: the sfx spy saw the call");

  // ⛔ AT MOST ONE REFLECTION PER OPENING: the next shot kills it instead.
  const s2 = shotAt(X, well, 4, C.MIMIC_APEX);
  const n0 = reflections(X).length;
  X.collideShots(state, well);
  H.eq(m.dead, true, "⛔ OPEN: the next shot KILLS it — vulnerable only while firing");
  H.eq(s2.dead, true, "⛔ and is consumed");
  H.eq(reflections(X).length, n0, "⛔ AND NOTHING NEW WAS REFLECTED — one reflection per opening");
}
{
  // ⛔ THE WINDOW CLOSES, and it is asserted as a PROPERTY (trap 4).
  const well = quiet("overdrive", 16, 0);
  const m = atApex(X, well, 2);
  m.onShot(new X.Shot(well, 2, false));
  H.eq(m.open(), true, "fixture: open");
  let t = 0, closedAt = -1;
  for (let i = 0; i < 400 && closedAt < 0; i++) {
    m.update(DT, well, state);
    t += DT;
    if (!m.open()) closedAt = t;
  }
  H.assert(closedAt > 0, `⛔ the window CLOSES on its own clock (${closedAt})`);
  H.assert(closedAt >= C.MIMIC_OPEN_TIME && closedAt < C.MIMIC_OPEN_TIME + DT * 2,
           `⛔ after C.MIMIC_OPEN_TIME and within one step of it (${closedAt} vs ${C.MIMIC_OPEN_TIME})`);
  H.eq(m.phase, "closed", "⛔ and it closes back to GUARDING — the cycle is two states");
  H.eq(m.openTimer, 0, "with the timer reset");
  // ⛔ And it guards again: a shot now reflects rather than killing.
  state.enemies = [m];
  const s = shotAt(X, well, m.lane, m.depth);
  X.collideShots(state, well);
  H.eq(m.dead, false, "⛔ a shot after the window closed does NOT kill it");
  H.eq(m.open(), true, "⛔ it reflects and opens again — a Mimic left alone costs a second reflection");
  H.eq(s.dead, true, "and that shot is consumed too");
}
{
  // ⛔ THE PURGE KILLS IT IN EITHER STATE (MI1, the Drifter's "Purge anywhere").
  for (const openIt of [false, true]) {
    const well = quiet("overdrive", 16, 0);
    state.purgeUses = 0;
    state.purgeLatched = false;
    state.input.purge = false;
    const m = atApex(X, well, 7);
    if (openIt) m.onShot(new X.Shot(well, 7, false));
    state.enemies = state.enemies.filter(e => !(e instanceof X.MimicShot));
    H.eq(m.open(), openIt, `fixture: the Mimic is ${openIt ? "open" : "closed"}`);
    G.input.keyDown("x"); G.update(DT); G.input.keyUp("x"); G.update(DT);
    H.eq(state.purgeUses, 1, "the Purge fired");
    H.eq(m.dead, true, `⛔ and it kills a ${openIt ? "FIRING" : "GUARDING"} Mimic — a panic button armour could refuse is not one`);
  }
  // ⛔ AND IT NEVER ASKS onShot() — a purged Mimic reflects nothing (⚠ SETTLED).
  const well = quiet("overdrive", 16, 0);
  state.purgeUses = 0; state.purgeLatched = false; state.input.purge = false;
  const m = atApex(X, well, 7);
  state.enemies = [m];
  G.input.keyDown("x"); G.update(DT); G.input.keyUp("x"); G.update(DT);
  H.eq(m.dead, true, "fixture: purged");
  H.eq(reflections(X).length, 0, "⛔ the Purge reflected NOTHING — it sets `dead` and never asks onShot()");
}
{
  // ⛔ T7 — A LANCE SHOT IS REFLECTED AND CONSUMED. A chip, a refusal and a
  // reflection are not KILLS, so pierce changes nothing about them.
  const well = quiet("overdrive", 16, 0);
  state.powers.lance = true;
  const m = atApex(X, well, 9);
  const s = shotAt(X, well, 9, C.MIMIC_APEX, true);
  H.eq(s.pierce, true, "fixture: the shot carries pierce (captured at fire time)");
  X.collideShots(state, well);
  H.eq(m.dead, false, "⛔ a Lance shot does not kill a guarding Mimic");
  H.eq(s.dead, true, "⛔ AND IT IS CONSUMED — a reflection is not a kill, so Lance's one term does not apply (T7)");
  H.eq(reflections(X).length, 1, "⛔ and it is reflected like any other shot");

  // ⛔ The other half of T7, and it is the SAME line: a pierced shot that KILLS
  // an open Mimic is not consumed and flies on.
  const s2 = shotAt(X, well, 9, C.MIMIC_APEX, true);
  state.enemies = state.enemies.filter(e => !(e instanceof X.MimicShot));
  H.eq(m.open(), true, "fixture: the Mimic is open");
  X.collideShots(state, well);
  H.eq(m.dead, true, "⛔ a Lance shot kills an OPEN Mimic");
  H.eq(s2.dead, false, "⛔ and is NOT consumed — a KILL does not spend a pierced shot (T7)");
}
{
  // ⛔ T8 — A SPREAD SIDE SHOT REFLECTS INTO THE MIMIC'S OWN LANE, not the
  // craft's. The reflection is a property of the thing that reflected it.
  const well = quiet("overdrive", 16, 0);
  state.powers.spread = true;
  state.skimmer.lane = 3;
  const m = atApex(X, well, 4);
  const lanes = X.fireLanes(state, well, 3).slice();
  H.eq(J(lanes), J([3, 2, 4]), "fixture: Spread fires the facing lane first, then both neighbours");
  for (const l of lanes) shotAt(X, well, l, C.MIMIC_APEX);
  X.collideShots(state, well);
  const back = reflections(X);
  H.eq(back.length, 1, "⛔ only the side shot in the Mimic's lane reached it");
  H.assert(Object.is(back[0].lane, m.lane), `⛔ and the reflection is in the MIMIC's lane ${m.lane}, not the craft's 3`);
  H.assert(back[0].lane !== state.skimmer.lane, "⛔ which is a different lane — the craft fired from 3");
}
{
  // ⛔ PLAYED, THROUGH THE REAL FIRE PATH: under held fire a Mimic costs
  // EXACTLY ONE reflection (MI1's budget, MEASURED rather than predicted).
  const well = quiet("overdrive", 16, 0);
  state.skimmer.lane = 8;
  const m = atApex(X, well, 8);
  state.enemies = [m];
  state.shots = [];
  let reflect = 0, steps = 0;
  X.sfx.before = n => { if (n === "reflect") reflect++; };
  G.input.keyDown(" ");
  for (let i = 0; i < 600 && !m.dead; i++) {
    state.lives = C.START_LIVES;
    state.invulnTime = 0;                  // the reflection is not what is under test here
    G.update(DT);
    steps++;
  }
  G.input.keyUp(" ");
  X.sfx.before = null;
  if (process.env.P4_MEASURE) console.log("heldFire steps", steps, (steps * DT).toFixed(4));
  H.eq(m.dead, true, `⛔ held fire in its lane KILLS a Mimic (${steps} steps)`);
  H.eq(reflect, 1, `⛔ AND IT COSTS EXACTLY ONE REFLECTION — the next shot lands well inside the 0.5 s window (${reflect})`);
  H.assert(steps * DT < C.MIMIC_OPEN_TIME,
           `⛔ and it dies INSIDE that window, so the guard never re-arms (${(steps * DT).toFixed(3)} s)`);
}

// ---------------------------------------------------------------------------
// 5. ⛔ MI2 — THE REFLECTED SHOT: the speed, and the APEX BOUND that is the
//    whole fairness argument
// ---------------------------------------------------------------------------
{
  H.eq(C.MIMIC_SHOT_RATIO, 0.6, '⛔ C.MIMIC_SHOT_RATIO is GDD 14.6\'s "60% speed"');
  const s = new X.MimicShot(4, 0.4);
  H.close(s.speed(), SHOT_SPEED, EPS, "⛔ its speed is C.MIMIC_SHOT_RATIO / C.SHOT_TIME");
  H.close(SHOT_SPEED, 0.6 / C.SHOT_TIME, EPS, "which is 60 % of a player shot's 1/SHOT_TIME");
  H.assert(SHOT_SPEED < 1 / C.SHOT_TIME,
           "⛔ and it is SLOWER than the shot it came from — the player can out-run their own bullet");
  H.assert(SHOT_SPEED > C.WEAVER_BOLT_SPEED,
           `⚠ but FASTER than a Weaver's bolt (${SHOT_SPEED.toFixed(4)} vs ${C.WEAVER_BOLT_SPEED}) — which is `
           + "why MI2's apex bound, and not the bolt's, is what gives the player their fuse");
  const before = s.depth;
  s.update(DT, RING, state);
  H.close(s.depth, before + SHOT_SPEED * DT, 1e-15, "⛔ and the inherited update() moves it RIM-WARD at exactly that");

  // ⛔ THE BOUND, FROM THE CONSTANTS (MI2). A reflection must give the player at
  // least the Surger's C.SURGE_TELEGRAPH of visible fuse before it is lethal.
  const deepest = PARK - C.SURGE_TELEGRAPH * SHOT_SPEED;
  H.assert(C.MIMIC_APEX <= deepest,
           `⛔ C.MIMIC_APEX (${C.MIMIC_APEX}) <= (1 - RIM_CONTACT_DEPTH) - SURGE_TELEGRAPH * ` +
           `(MIMIC_SHOT_RATIO / SHOT_TIME) = ${deepest.toFixed(4)} — every reflection gives ` +
           `>= ${C.SURGE_TELEGRAPH} s of flight`);
  H.assert((PARK - C.MIMIC_APEX) / SHOT_SPEED >= C.SURGE_TELEGRAPH,
           `⛔ read the other way: a reflection AT the apex flies ` +
           `${((PARK - C.MIMIC_APEX) / SHOT_SPEED).toFixed(4)} s to the band`);
  // ⛔ AND THE BOUND IS TIGHT, so it is a real constraint rather than slack: a
  // Mimic that held one lane-depth deeper would breach it.
  H.assert(deepest < C.MIMIC_APEX + 0.1,
           `⛔ and the bound BINDS — 0.1 deeper would breach it (headroom ${(deepest - C.MIMIC_APEX).toFixed(4)})`);
  // ⛔ THE OTHER END (MI2): a reflection slower than 0.30 depth/s would breach
  // GDD 4.4 — pushed to RESPAWN_PUSH_DEPTH it must self-terminate inside the
  // invulnerability window.
  const pushed = C.RESPAWN_PUSH_DEPTH;
  H.assert((1 - pushed) / SHOT_SPEED + DT < C.RESPAWN_INVULN,
           `⛔ pushed to ${pushed} a reflection self-terminates at ` +
           `${((1 - pushed) / SHOT_SPEED + DT).toFixed(4)} s, inside RESPAWN_INVULN ${C.RESPAWN_INVULN}`);
  // And heat never touches either number (H2, R7).
  H.assert(!("MIMIC_SHOT_RATIO_MIN" in C) && !("MIMIC_SHOT_RATIO_MAX" in C) &&
           !("MIMIC_APEX_MIN" in C) && !("MIMIC_APEX_MAX" in C) &&
           !("MIMIC_OPEN_TIME_MIN" in C) && !("MIMIC_OPEN_TIME_MAX" in C),
           "⛔ no cycle constant grew a heat endpoint — the seven accessors stay seven (R7)");
}
{
  // ⛔ A SHOT DECLINES AT A MimicShot AND FLIES ON (the bolt's ⚠ SETTLED).
  const well = quiet("overdrive", 16, 0);
  const ms = X.spawnEnemy("mimicShot", 5, 0.5);
  const s = shotAt(X, well, 5, 0.5);
  X.collideShots(state, well);
  H.eq(ms.dead, false, "⛔ a shot does not destroy a reflected shot");
  H.eq(s.dead, false, "⛔ and is NOT consumed — it flies on to whatever is behind, on a LATER step");
  // ⚠ And it still costs its resolution for that step, because the `break` is
  // unconditional: a Vaulter behind it survives this step.
  const v = X.spawnEnemy("vaulter", 5, 0.5);
  const s2 = shotAt(X, well, 5, 0.5);
  X.collideShots(state, well);
  H.eq(v.dead, false, "⚠ and it briefly SHIELDS what is behind it — the bolt's shipped mechanism, not a bug");
  H.eq(s2.dead, false, "the shielded shot is still in flight");
}
{
  // ⛔ THE PURGE KILLS ONE FOR 0 (GDD 7 has no row for it).
  const well = quiet("overdrive", 16, 0);
  state.purgeUses = 0; state.purgeLatched = false; state.input.purge = false;
  const ms = X.spawnEnemy("mimicShot", 5, 0.5);
  state.enemies = [ms];
  const paid = [];
  X.addScore.before = n => paid.push(n);
  G.input.keyDown("x"); G.update(DT); G.input.keyUp("x"); G.update(DT);
  X.addScore.before = null;
  H.eq(ms.dead, true, "⛔ the Purge destroys a reflected shot (purgeable, the bolt's)");
  H.eq(J(paid.filter(n => n !== 0)), "[]", `⛔ and it pays NOTHING — points() is the bolt's 0 (${J(paid)})`);
}
{
  // ⛔ IT SELF-TERMINATES THE STEP AFTER DEPTH 1 (the bolt's ordering rule).
  const well = quiet("overdrive", 16, 0);
  const ms = X.spawnEnemy("mimicShot", 5, 0.90);
  let atOne = -1, died = -1;
  for (let i = 0; i < 400 && died < 0; i++) {
    ms.update(DT, well, state);
    if (atOne < 0 && ms.depth >= 1) atOne = i;
    if (ms.dead) died = i;
  }
  H.assert(atOne >= 0, "fixture: it reached depth 1");
  H.eq(died, atOne + 1, "⛔ it dies on the step AFTER the arrival, never on it — the rim step stays lethal");
  H.eq(ms.depth, 1, "⛔ and depth 1 is where it stops: depth > 1 is not a position");
}
{
  // ⛔ IT IS NOT A DIVE SURVIVOR (GDD 6.5's seventh wiring point, the bolt's).
  const well = quiet("overdrive", 16, 0);
  const ms = X.spawnEnemy("mimicShot", 5, 0.5);
  const m = X.spawnEnemy("mimic", 7, 0.3);
  const t = X.spawnEnemy("thorn", 9, 0.4);
  H.eq(state.enemies.length, 3, "fixture: a reflection, a Mimic and a Thorn on the board");
  X.startDive(state);
  H.assert(state.enemies.indexOf(ms) === -1, "⛔ a reflected shot does NOT survive into a dive");
  H.assert(state.enemies.indexOf(m) === -1, "⛔ nor does a Mimic — blocksClear true, never anchored");
  H.assert(state.enemies.indexOf(t) !== -1, "⛔ and the Thorn does, as it always has (GDD 5)");
}
{
  // ⛔ NO CONTACT DEATH INSIDE RESPAWN_INVULN AFTER A RESPAWN AMONG THEM (GDD
  // 4.4). §4.4's push only ever LOWERS a depth; a pushed reflection is safe by
  // SELF-TERMINATION, exactly as the bolt is.
  const well = quiet("overdrive", 16, 0);
  state.powers.ward = false;                       // trap 5
  state.skimmer.lane = 0;
  for (let l = 0; l < 4; l++) X.spawnEnemy("mimicShot", l, 0.98);
  const shots = state.enemies.slice();
  state.lives = C.START_LIVES;
  X.killSkimmer(state);
  H.eq(state.skimmer.dead, true, "fixture: the craft died among four reflections at the rim");
  X.respawnSkimmer(state, well);
  H.assert(shots.every(s => s.depth <= C.RESPAWN_PUSH_DEPTH + 1e-12),
           `⛔ every reflection was pushed down to ${C.RESPAWN_PUSH_DEPTH} — GDD 4.4's clamp reaches a reflection like any other position`);
  H.close(state.invulnTime, 0, EPS, "fixture: the invulnerability window has just started");
  let deaths = 0, t = 0;
  const lives0 = state.lives;
  while (t < C.RESPAWN_INVULN + DT) {
    G.update(DT);
    if (state.skimmer.dead) deaths++;
    state.lives = lives0;
    t += DT;
  }
  H.eq(deaths, 0, `⛔ and the craft survives the whole ${C.RESPAWN_INVULN} s window (${deaths} deaths)`);
  H.assert(state.enemies.every(e => !(e instanceof X.MimicShot)),
           "⛔ because every one of them SELF-TERMINATED inside it, the bolt's argument");
}

// ---------------------------------------------------------------------------
// 6. ⛔ THE TWO-STATE READ (GDD 6.3, 12; test-cs005-p2.js's gate form)
// ---------------------------------------------------------------------------
{
  H.eq(C.MIMIC_CLOSED_WIDTH, 0.70, "C.MIMIC_CLOSED_WIDTH");
  H.eq(C.MIMIC_OPEN_WIDTH, 1.60, "C.MIMIC_OPEN_WIDTH");
  H.eq(C.MIMIC_CLOSED_ALPHA, 0.55, "C.MIMIC_CLOSED_ALPHA");
  H.assert(typeof C.MIMIC_COLOR === "string" && C.MIMIC_COLOR === "#D447FF",
           "⚠ C.MIMIC_COLOR is MI3's violet, hue 286° — provisional, like the palette");
  // ⛔ AND IT IS NOBODY ELSE'S COLOUR (MI3; STATUS): not the eight enemies', not
  // the Warden's blue, not the token gold, not a band's.
  {
    const others = Object.keys(C).filter(k => /_COLOR$/.test(k) && k !== "MIMIC_COLOR").map(k => C[k]);
    const bands = (C.BAND_COLORS || []).map(b => b.color).concat(C.BAND_RNG_COLORS || []);
    H.assert(others.concat(bands).every(c => typeof c !== "string" || c.toUpperCase() !== C.MIMIC_COLOR.toUpperCase()),
             "⛔ C.MIMIC_COLOR is no other entity's, HUD's or band's colour");
  }

  // ⛔ THE GATE, from the constants (test-cs005-p2.js's): an art rule rots
  // silently, and a retune that narrows the open bloom or brightens the guard
  // collapses GDD 12's two reads into one.
  H.assert(C.MIMIC_OPEN_WIDTH / C.MIMIC_CLOSED_WIDTH >= 2.0,
           `⛔ the OPEN stroke is at least 2x the CLOSED one (${C.MIMIC_OPEN_WIDTH / C.MIMIC_CLOSED_WIDTH})`);
  H.assert(C.MIMIC_CLOSED_ALPHA <= 0.7,
           `⛔ and the closed alpha is at most 0.7 against the open 1 (${C.MIMIC_CLOSED_ALPHA})`);

  // ⛔ TWO POLYS, NOT ONE POLY RESTYLED.
  const CLOSED = X.MIMIC_POLY_CLOSED, OPEN = X.MIMIC_POLY_OPEN;
  H.assert(Array.isArray(CLOSED) && Array.isArray(OPEN), "both are local-space point arrays");
  H.assert(CLOSED !== OPEN, "⛔ TWO POLYS, the Drifter's rule");
  H.assert(CLOSED.length >= 3 && OPEN.length >= 3, "each has enough points to be a shape");
  H.assert(CLOSED.concat(OPEN).every(q => isFinite(q.l) && isFinite(q.d)),
           "⛔ in (l, d) — lane offset and depth offset, never a screen coordinate");
  const reach = p => p.reduce((mx, q) => Math.max(mx, Math.abs(q.l)), 0);
  H.eq(reach(OPEN), 1, "the OPEN shape reaches ±1, so C.MIMIC_SIZE is the lane widths it spans");
  H.assert(reach(CLOSED) < reach(OPEN) * 0.8,
           `⛔ and the CLOSED shape is COMPACT — a third channel that survives where line weight ` +
           `and alpha do not (${reach(CLOSED)} vs ${reach(OPEN)})`);
  const a = X.entityPoints(RING, 4, 0.4, CLOSED, C.MIMIC_SIZE);
  const b = X.entityPoints(RING, 6, 0.6, CLOSED, C.MIMIC_SIZE);
  const c = X.entityPoints(RING, 4, 0.4, OPEN, C.MIMIC_SIZE);
  H.assert(a === b, "the same poly reuses one scratch array — zero allocation");
  H.assert(a !== c, "and the second poly has its own");

  // The real draw path, recorded off the canvas context (test-cs005-p2.js's).
  function record(fn) {
    const ctx = X._env.canvas.getContext("2d");
    const prev = { close: ctx.closePath, stroke: ctx.stroke, move: ctx.moveTo, line: ctx.lineTo };
    const log = { closes: 0, moves: 0, lines: 0, strokes: [] };
    ctx.closePath = () => { log.closes++; };
    ctx.moveTo = () => { log.moves++; };
    ctx.lineTo = () => { log.lines++; };
    ctx.stroke = () => { log.strokes.push({ w: ctx.lineWidth, a: ctx.globalAlpha, c: ctx.strokeStyle }); };
    try { fn(ctx); } finally {
      ctx.closePath = prev.close; ctx.stroke = prev.stroke;
      ctx.moveTo = prev.move; ctx.lineTo = prev.line;
    }
    return log;
  }
  // ⛔ Driven off the ENTITY's own phase, never by passing a flag.
  const well = quiet("overdrive", 16, 0);
  const DEPTH = C.MIMIC_APEX;
  const shut = atApex(X, well, 5);
  const shutLog = record(ctx => shut.draw(ctx, well));
  const opened = atApex(X, well, 11);
  opened.onShot(new X.Shot(well, 11, false));
  H.eq(opened.open(), true, "fixture: the second Mimic is open");
  const openLog = record(ctx => opened.draw(ctx, well));

  H.eq(shutLog.closes, 1, "⛔ SOLID = ARMOURED — the closed poly is drawn CLOSED (GDD 12)");
  H.eq(openLog.closes, 0, "⛔ OPEN = VULNERABLE — the open poly is drawn OPEN");
  H.eq(shutLog.lines, CLOSED.length - 1, "the closed path is the closed poly");
  H.eq(openLog.lines, OPEN.length - 1, "and the open path is the open one");
  H.eq(shutLog.strokes.length, 2, "glowStroke's two passes, wide-and-dim then thin-and-bright");
  H.eq(openLog.strokes.length, 2, "the same two");
  H.assert(shutLog.strokes.concat(openLog.strokes).every(k => k.c === C.MIMIC_COLOR), "both in C.MIMIC_COLOR");

  const shutThin = shutLog.strokes[1], openThin = openLog.strokes[1];
  H.close(shutThin.w, X.laneLineWidth(DEPTH) * C.MIMIC_CLOSED_WIDTH, EPS,
          "the closed stroke is laneLineWidth x C.MIMIC_CLOSED_WIDTH");
  H.close(openThin.w, X.laneLineWidth(DEPTH) * C.MIMIC_OPEN_WIDTH, EPS,
          "and the open stroke is laneLineWidth x C.MIMIC_OPEN_WIDTH");
  H.assert(openThin.w / shutThin.w >= 2.0,
           "⛔ measured through the real draw path, the open stroke is at least 2x the closed one");
  H.close(shutThin.a, C.GLOW_THIN_ALPHA * C.MIMIC_CLOSED_ALPHA, EPS, "the closed alpha is dimmed");
  H.close(openThin.a, C.GLOW_THIN_ALPHA, EPS, "and the open alpha is full");
  H.assert(shutThin.a / openThin.a <= 0.7, "⛔ measured, the closed read is at most 0.7 as bright");
  H.eq(C.GLOW_WIDE_W, 6.0, "⛔ and no global glow constant moved: GLOW_WIDE_W");
  H.eq(C.GLOW_WIDE_ALPHA, 0.20, "GLOW_WIDE_ALPHA");
  H.eq(C.GLOW_THIN_ALPHA, 0.95, "GLOW_THIN_ALPHA");

  // ⛔ THE REFLECTED STREAK: the player's shot, turned. Its own scratch points,
  // not drawShot()'s, because both are live in the same frame by construction.
  const ms = new X.MimicShot(5, 0.5);
  const msLog = record(ctx => ms.draw(ctx, well));
  H.eq(msLog.closes, 0, "⛔ a streak is drawn OPEN — two points, the shot's drawing");
  H.eq(msLog.lines, 1, "⛔ and it is TWO POINTS (one lineTo), never a silhouette");
  H.assert(msLog.strokes.every(k => k.c === C.MIMIC_COLOR), '⛔ "colour-shifted": in C.MIMIC_COLOR');
  H.close(msLog.strokes[1].w, X.laneLineWidth(0.5) * C.MIMIC_SHOT_WIDTH, EPS,
          '⛔ "larger": C.MIMIC_SHOT_WIDTH x laneLineWidth');
  H.eq(C.MIMIC_SHOT_WIDTH, 2, "⚠ C.MIMIC_SHOT_WIDTH is MI2's provisional 2");
  H.eq(C.MIMIC_SHOT_LEN, 2, "⚠ and C.MIMIC_SHOT_LEN its provisional 2 x C.SHOT_LEN");
  {
    const src = SCRIPT.slice(SCRIPT.indexOf("function drawMimicShot"), SCRIPT.indexOf("function drawMimicShot") + 600);
    H.eq((src.match(/_shotHead|_shotTail/g) || []).length, 0,
         "⛔ it does NOT share drawShot()'s scratch points — both streaks are live in the same frame");
  }
  // Both states and the streak run headless at every depth, on a closed and an
  // open well, with no NaN reaching the context.
  let drew = 0, bad = 0;
  const ctx = X._env.canvas.getContext("2d");
  const realLine = ctx.lineTo;
  ctx.lineTo = function (x, y) { if (!isFinite(x) || !isFinite(y)) bad++; return realLine.apply(this, arguments); };
  for (const w of [RING, VEE]) {
    for (const openIt of [true, false]) {
      for (const depth of [0, 0.2, C.MIMIC_APEX, 0.9, 1]) {
        X.drawMimic(ctx, w, w.lanes - 1, depth, openIt);
        X.drawMimicShot(ctx, w, 0, depth);
        drew += 2;
      }
    }
  }
  ctx.lineTo = realLine;
  H.eq(drew, 40, "fixture: 40 headless draws, both wells, both states, the throat and the rim");
  H.eq(bad, 0, "⛔ and not one non-finite point reached the context");
}

// ---------------------------------------------------------------------------
// 7. ⛔ GDD 17 ITEM 3 — NEITHER ENTITY EVER LEAVES ITS SPAWN LANE
// ---------------------------------------------------------------------------
//
// ⛔ Object.is EQUALITY, not a range check, because that is what an entity with
// no lane arithmetic in it makes available (the Carrier's, the Weaver's and the
// Surger's form, test-cs005-p5.js). A range check does not catch GDD 3.5's
// wrapping bug: a hop that wraps a 13-lane strip lands inside [0, 12].
{
  const OPEN_WELLS = X.WELLS.filter(w => !w.closed);
  H.eq(OPEN_WELLS.length, 6, "fixture: six open wells");
  let moved = null, ticks = 0;
  for (const w of X.WELLS) {
    quiet("overdrive", 16, X.WELLS.indexOf(w));
    state.skimmer.lane = Math.floor(w.lanes / 2);
    const born = new Map();
    for (const lane of [0, 1, Math.floor(w.lanes / 2), w.lanes - 1]) {
      born.set(X.spawnEnemy("mimic", lane, 0), lane);
      born.set(X.spawnEnemy("mimicShot", lane, 0.3), lane);
    }
    for (let i = 0; i < 700; i++) {
      for (const [e, lane] of born) {
        if (e.dead) continue;
        e.update(DT, w, state);
        ticks++;
        if (!Object.is(e.lane, lane)) moved = moved || `${e.constructor.name} on ${w.name}: ${lane} -> ${e.lane}`;
      }
    }
  }
  H.assert(ticks > 20000, `fixture: ${ticks} entity-steps over all sixteen wells`);
  H.eq(moved, null, `⛔ a Mimic's and a MimicShot's lane is Object.is its spawn lane on EVERY step (${moved})`);
  // ⛔ And that is an ABSENCE OF CODE rather than a flag: neither class touches
  // a lane helper or reads a well's topology.
  const src = SCRIPT.slice(SCRIPT.indexOf("class Mimic extends Enemy"), SCRIPT.indexOf("\n// 08-spawner.js"));
  const code = src.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  H.assert(code.indexOf("spawnEnemy") > 0, "the stripped slice is still the code");
  H.assert(!/laneHop|laneNormalize|boundaryFrom|laneDelta/.test(code),
           "⛔ neither class touches a lane helper — one lane, never hopping, is an ABSENCE of code");
  H.assert(!/\.closed\b/.test(code), "⛔ and neither reads a well's topology");
  H.assert(!/this\.lane\s*=/.test(code.slice(code.indexOf("update("))),
           "⛔ `lane` is written once, by the constructor, and never again");
}

// ---------------------------------------------------------------------------
// 8. ⛔ PLAYED — every reflection's flight, and item 3 under the real spawner
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
// A played Overdrive session from Start Depth 16, hashed per step. ⛔ It jumps
// at anything aloft in reach: a Warden is killable only by the Jump and blocks
// the clear, so a non-jumping driver stalls every board past L11 (STATUS).
function session(Z, steps, startDepth) {
  const st = Z.state, ZG = Z.Game, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive", startDepth: startDepth === undefined ? 16 : startDepth });
  ZG.input.reset();
  const out = { hashes: [], mimics: 0, mimicKills: 0, reflections: 0, minFlight: Infinity,
                laneMoved: null, level: 0 };
  const born = new Map();
  const seen = new Set();
  const k0 = () => st.tally.kills;
  for (let i = 0; i < steps; i++) {
    st.lives = Z.C.START_LIVES;
    replay(ZG.input, i);
    const sk = st.skimmer;
    const well = Z.WELLS[st.wellIndex];
    const near = sk && !sk.dead && st.enemies.some(e => !e.dead && e.aloft &&
      Math.abs(Z.laneDelta(well, e.lane, sk.lane)) <= Z.C.HIT_LANE_TOL);
    if (near) ZG.input.keyDown("arrowup"); else ZG.input.keyUp("arrowup");
    const before = k0();
    const wasMimic = st.enemies.filter(e => !e.dead && Z.Mimic && e instanceof Z.Mimic);
    ZG.update(ZDT);
    for (const m of wasMimic) if (m.dead) out.mimicKills++;
    let h = 2166136261 >>> 0;
    const mix = v => { h = Math.imul(h ^ ((v * 1e6) | 0), 16777619) >>> 0; };
    mix(st.level); mix(st.wellIndex); mix(st.score); mix(st.spawn.timer); mix(st.spawn.remaining);
    mix(sk ? sk.lane : -1); mix(st.shots.length); mix(st.enemies.length); mix(st.tokens.length);
    for (const e of st.enemies) {
      mix(e.lane); mix(e.depth); mix(e.dead ? 1 : 0);
      for (const ch of e.constructor.name) mix(ch.charCodeAt(0));
      if (!Z.Mimic) continue;
      if (e instanceof Z.MimicShot) {
        if (!seen.has(e)) {
          seen.add(e); out.reflections++; born.set(e, e.lane);
          // ⛔ THE FLIGHT: from where it was born to the kill band, at its own
          // speed. It is first seen the step AFTER its birth, so the depth read
          // here is one step's travel past the reflection depth — which only
          // makes this bound tighter than the arithmetic.
          const flight = ((1 - Z.C.RIM_CONTACT_DEPTH) - e.depth) / (Z.C.MIMIC_SHOT_RATIO / Z.C.SHOT_TIME);
          if (flight < out.minFlight) out.minFlight = flight;
        }
      } else if (e instanceof Z.Mimic) {
        if (!seen.has(e)) { seen.add(e); out.mimics++; born.set(e, e.lane); }
      }
      if (born.has(e) && !Object.is(e.lane, born.get(e))) {
        out.laneMoved = out.laneMoved || `${e.constructor.name}: ${born.get(e)} -> ${e.lane}`;
      }
    }
    out.hashes.push(h);
    out.level = Math.max(out.level, st.level);
  }
  return out;
}
const SESSION_STEPS = 12000;
const real = session(X, SESSION_STEPS);
{
  // P4_MEASURE=1 prints what the played board actually did (test-cs013-p1.js's
  // form), so log/CS013.md quotes a measurement rather than a guess.
  if (process.env.P4_MEASURE) console.log("session", SESSION_STEPS, "steps:",
    J({ mimics: real.mimics, mimicKills: real.mimicKills, reflections: real.reflections,
        minFlight: real.minFlight, level: real.level }));
  H.assert(real.mimics >= 4, `non-vacuity: the played session released ${real.mimics} Mimics past L16`);
  H.assert(real.reflections >= 4, `non-vacuity: it reflected ${real.reflections} shots`);
  H.assert(real.mimicKills > 0, `non-vacuity: it killed ${real.mimicKills} of them`);
  H.eq(real.laneMoved, null, `⛔ GDD 17 item 3 on the PLAYED board: neither ever left its spawn lane (${real.laneMoved})`);
  H.assert(real.minFlight >= C.SURGE_TELEGRAPH,
           `⛔ EVERY reflection's flight to the kill band is at least C.SURGE_TELEGRAPH ` +
           `(${real.minFlight.toFixed(4)} s against ${C.SURGE_TELEGRAPH}) — MI2's bound, measured on a played board`);
}

// ---------------------------------------------------------------------------
// 9. ⚠ MI3 — THE CUT: one row out, and the Mimic is gone
// ---------------------------------------------------------------------------
const ROW = '    { level: 16, kind: "mimic" },\n';
{
  H.eq(SCRIPT.split(ROW).length - 1, 1, "fixture: the Mimic's schedule row is in the build exactly once");
  installSeed(SEED);
  const Z = H.buildGame({ mutate: [[ROW, ""]] });
  H.eq(J(Z.C.SPAWN_SCHEDULE_OVERDRIVE), J([{ level: 6, kind: "reaver" }, { level: 11, kind: "warden" }]),
       "fixture: the mutated build has the Reaver's and the Warden's rows and no Mimic row");
  H.assert(typeof Z.Mimic === "function" && typeof Z.MimicShot === "function",
           "fixture: both CLASSES are still in that build — the row is the only thing removed");

  const cut = session(Z, SESSION_STEPS);
  H.eq(cut.mimics, 0,
       `⛔ MI3: with ONE ROW mutated out, a played Overdrive session from Start Depth 16 to L${cut.level} ` +
       `releases ZERO Mimics (${cut.mimics})`);
  H.eq(cut.reflections, 0, "⛔ and therefore zero reflections — nothing else in the build makes one");
  H.assert(cut.level >= 17, `and it really played past the row's level (L${cut.level})`);
  H.assert(real.mimics > 0 && cut.hashes.some((h, i) => h !== real.hashes[i]),
           "⛔ non-vacuity: the same session on the shipped build DOES release them, and the two diverge");

  // ⛔ AND CLASSIC NEVER SEES ONE — the hash against that same build, step by
  // step (test-cs013-p3.js's form).
  function classicHashes(Y, steps) {
    const st = Y.state, YG = Y.Game, YDT = Y.C.FIXED_DT;
    YG.reset();
    Y.startGame(SEED, { mode: "classic", startDepth: 16 });
    YG.input.reset();
    const out = [];
    let mimic = false, through = 0;
    for (let i = 0; i < steps; i++) {
      st.lives = Y.C.START_LIVES;
      replay(YG.input, i);
      YG.update(YDT);
      let h = 2166136261 >>> 0;
      const mix = v => { h = Math.imul(h ^ ((v * 1e6) | 0), 16777619) >>> 0; };
      mix(st.level); mix(st.wellIndex); mix(st.score); mix(st.spawn.timer); mix(st.spawn.remaining);
      mix(st.skimmer ? st.skimmer.lane : -1); mix(st.shots.length); mix(st.enemies.length);
      for (const e of st.enemies) {
        mix(e.lane); mix(e.depth); mix(e.dead ? 1 : 0);
        for (const ch of e.constructor.name) mix(ch.charCodeAt(0));
        if (e instanceof Y.Mimic || e instanceof Y.MimicShot) mimic = true;
      }
      through = Math.max(through, st.tally.kills + st.enemies.length);
      out.push(h);
    }
    return { out, mimic, level: st.level, through };
  }
  const STEPS = 5000;
  const a = classicHashes(X, STEPS), b = classicHashes(Z, STEPS);
  let diff = -1;
  for (let i = 0; i < STEPS && diff < 0; i++) if (a.out[i] !== b.out[i]) diff = i;
  H.eq(a.out.length, STEPS, "the Classic run lasted 5,000 steps");
  H.eq(diff, -1, `⛔ a CLASSIC run at Start Depth 16 hashes IDENTICALLY, step by step for ${STEPS} steps, to a ` +
       `build with the Mimic's row mutated out (first difference at ${diff})`);
  H.assert(!a.mimic && a.level >= 16 && a.through >= 20,
           `⛔ and no Mimic and no reflection was ever on its board, at L${a.level} with ${a.through} enemies through it`);
}

// ---------------------------------------------------------------------------
// 10. ⛔ A CLASSIC BOLT IS BIT-IDENTICAL ACROSS THE SPEED READER
// ---------------------------------------------------------------------------
//
// The reader is refactoring, and the proof is a hash rather than a reading: the
// mutant puts the pre-P4 line back, and a Classic session — where Weavers and
// their bolts are the only users of it — hashes the same on every step.
{
  const FROM = "    this.depth += this.speed() * dt;\n";
  const TO   = "    this.depth += C.WEAVER_BOLT_SPEED * dt;\n";
  H.eq(SCRIPT.split(FROM).length - 1, 1, "fixture: the bolt's travel line is in the build exactly once");
  installSeed(SEED);
  const Z = H.buildGame({ mutate: [[FROM, TO]] });
  function boltSession(Y, steps) {
    const st = Y.state, YG = Y.Game, YDT = Y.C.FIXED_DT;
    YG.reset();
    Y.startGame(SEED + 3, { mode: "classic", startDepth: 9 });
    YG.input.reset();
    const out = [];
    let bolts = 0;
    const seen = new Set();
    for (let i = 0; i < steps; i++) {
      st.lives = Y.C.START_LIVES;
      replay(YG.input, i);
      YG.update(YDT);
      let h = 2166136261 >>> 0;
      const mix = v => { h = Math.imul(h ^ ((v * 1e6) | 0), 16777619) >>> 0; };
      mix(st.level); mix(st.score); mix(st.enemies.length);
      for (const e of st.enemies) {
        mix(e.lane); mix(e.depth); mix(e.dead ? 1 : 0);
        for (const ch of e.constructor.name) mix(ch.charCodeAt(0));
        if (e instanceof Y.WeaverBolt && !seen.has(e)) { seen.add(e); bolts++; }
      }
      out.push(h);
    }
    return { out, bolts };
  }
  const STEPS = 5000;
  const p = boltSession(X, STEPS), q = boltSession(Z, STEPS);
  let diff = -1;
  for (let i = 0; i < STEPS && diff < 0; i++) if (p.out[i] !== q.out[i]) diff = i;
  if (process.env.P4_MEASURE) console.log("boltSession bolts", p.bolts);
  H.assert(p.bolts >= 5, `non-vacuity: the Classic session fired ${p.bolts} bolts`);
  H.eq(diff, -1, `⛔ a CLASSIC run hashes IDENTICALLY on all ${STEPS} steps against the pre-P4 line — the ` +
       `reader is refactoring, not a retune (first difference at ${diff})`);
}

// ---------------------------------------------------------------------------
// 11. ⛔ MUTATION-CHECKED (trap 6)
// ---------------------------------------------------------------------------
function mutantRed(mutate, what, probe) {
  for (const [from] of mutate) {
    H.eq(SCRIPT.split(from).length - 1, 1, `fixture: ${what} — the mutation string is in the build exactly once`);
  }
  installSeed(SEED);
  let threw = null, got = null;
  try { got = probe(H.buildGame({ mutate })); } catch (e) { threw = e.message; }
  H.eq(threw, null, `fixture: ${what} — the mutant ran without a throw (${threw})`);
  return got;
}
// A staged Mimic under held fire, in one build.
function fireCase(Z) {
  const st = Z.state, ZG = Z.Game, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.level = 16; st.wellIndex = 0;
  Z.enterWell();
  st.spawn.remaining = 1; st.spawn.timer = -1e9; st.enemies = []; st.shots = []; st.tokens = [];
  st.powers.lance = st.powers.spread = st.powers.ward = false;
  ZG.input.reset();
  st.skimmer.lane = 8;
  const m = Z.spawnEnemy("mimic", 8, 0);
  for (let i = 0; i < 2000 && m.depth < Z.C.MIMIC_APEX; i++) m.update(ZDT, Z.WELLS[0], st);
  st.enemies = [m];
  ZG.input.keyDown(" ");
  let reflections = 0;
  const seen = new Set();
  for (let i = 0; i < 400 && !m.dead; i++) {
    st.lives = Z.C.START_LIVES;
    st.invulnTime = 0;
    ZG.update(ZDT);
    for (const e of st.enemies) if (e instanceof Z.MimicShot && !seen.has(e)) { seen.add(e); reflections++; }
  }
  ZG.input.keyUp(" ");
  return { dead: m.dead, reflections };
}
{
  const base = fireCase(X);
  if (process.env.P4_MEASURE) console.log("fireCase", J(base));
  H.eq(J(base), J({ dead: true, reflections: 1 }),
       "fixture: on the shipped build, held fire costs one reflection and kills the Mimic");

  // (a) the reflection spawn removed: the guard costs nothing.
  const noBack = mutantRed([['    if (spawnEnemy("mimicShot", this.lane, this.depth)) sfx("reflect");\n', ""]],
    "removing the reflection spawn", Z => fireCase(Z));
  H.eq(noBack && noBack.reflections, 0,
       "⛔ MUTATION: with the spawn removed a Mimic sends NOTHING back — the reflection is this one line");
  H.eq(noBack && noBack.dead, true, "and it still dies, so the case really was about the reflection");

  // (b) the open branch removed: it reflects forever and nothing kills it.
  const never = mutantRed([["    if (this.open()) {\n      this.dead = true;\n      return true;\n    }\n", ""]],
    "removing the open-kill branch", Z => fireCase(Z));
  H.eq(never && never.dead, false,
       '⛔ MUTATION: with the open branch removed a Mimic NEVER dies to a shot — "vulnerable only while firing" is that branch');
  H.assert(never && never.reflections > 1,
           `⛔ and it reflects again and again instead (${never && never.reflections})`);

  // (c) the window made permanent: the guard never re-arms, so a slow player is
  //     never asked for a second reflection. The claim §4 makes is red.
  const stuck = mutantRed([["      if (this.openTimer >= C.MIMIC_OPEN_TIME) {\n", "      if (false) {\n"]],
    "removing the window's close", Z => {
      const well = Z.WELLS[0], st = Z.state;
      Z.Game.reset(); Z.startGame(SEED, { mode: "overdrive" });
      st.level = 16; st.wellIndex = 0; Z.enterWell();
      st.spawn.remaining = 1; st.spawn.timer = -1e9; st.enemies = []; st.shots = [];
      const m = Z.spawnEnemy("mimic", 3, Z.C.MIMIC_APEX);
      m.onShot(new Z.Shot(well, 3, false));
      for (let i = 0; i < 400; i++) m.update(Z.C.FIXED_DT, well, st);
      return m.open();
    });
  H.eq(stuck, true, "⛔ MUTATION: with the close removed the window never shuts — C.MIMIC_OPEN_TIME is that comparison");

  // (d) the reflected shot given the player's own speed: MI2's bound breaks.
  const fast = mutantRed([["  speed() { return C.MIMIC_SHOT_RATIO / C.SHOT_TIME; }\n",
                           "  speed() { return 1 / C.SHOT_TIME; }\n"]],
    "giving a reflection the player's full speed", Z => {
      const ms = new Z.MimicShot(3, Z.C.MIMIC_APEX);
      return ((1 - Z.C.RIM_CONTACT_DEPTH) - Z.C.MIMIC_APEX) / ms.speed();
    });
  H.assert(fast !== null && fast < C.SURGE_TELEGRAPH,
           `⛔ MUTATION: at full speed a reflection reaches the band in ${fast && fast.toFixed(4)} s, ` +
           `inside C.SURGE_TELEGRAPH ${C.SURGE_TELEGRAPH} — the 60 % is the fuse`);
}

// ⛔ THE BUILD'S OWN COUNTED TEXTS ARE WHERE P4 PUT THEM.
H.eq(SCRIPT.split('    if (spawnEnemy("mimicShot", this.lane, this.depth)) sfx("reflect");\n').length - 1, 1,
     "⛔ ONE reflection site in the build, and it sounds only for a shot that exists (Weaver.fire()'s rule)");
H.eq((SCRIPT.match(/sfx\("reflect"\)/g) || []).length, 1, '⛔ and `reflect` has exactly ONE seat');
H.eq((SCRIPT.match(/new MimicShot\(/g) || []).length, 1,
     "⛔ a MimicShot is built in exactly one place — ENEMY_KINDS, the one table where a string becomes a class");
H.eq((SCRIPT.match(/new Mimic\(/g) || []).length, 1, "⛔ and so is a Mimic");

H.report("test-cs013-p4.js");

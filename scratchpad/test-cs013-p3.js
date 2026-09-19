// test-cs013-p3.js — CS013 P3: the Warden (GDD 4.4, 4.5, 6.4, 6.5, 7, 8.1,
// 10.2, 14.2, 14.6, 17 items 3 and 8; PLANNED-FEATURES-CS013.md W1–W6, R6, R7).
// Asserts what P3 owns: the ninth contract field `aloft`, the Warden's contract
// and its row at Overdrive 11, the climb and the lift-off, the hunt and its
// fold at a wall, the strike as a mutated killDepth with a never-lethal fuse,
// the jump strike as a FOURTH kill site, the clear, the draw-only lift and the
// shared charge tone — mutation-checked, and with a Classic run that never sees
// one.
//
// ⛔ TRAPS.
//  1. Every expected set is WRITTEN OUT (test-cs012-p2.js's trap 1).
//  2. startGame() rebuilds state.rng, so a counting proxy goes on AFTER it.
//  3. §5's soak keeps the craft INVULNERABLE on purpose: a death pushes every
//     Warden to 0.55 and ends its lift-off, and this soak is about aloft lanes.
//     The push has its own section (§6).
//  4. An airborne craft kills an aloft Warden, so §9's immunity cases call
//     collideSkimmer() directly rather than updateCollisions().
//  5. `instanceof` is per build — every helper takes the build.
//  6. mutantRed() proves its string is in the build exactly once BEFORE it
//     asserts red; a mutant that throws reads as a pass otherwise.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

const SEED = 20260919;
const SOAK_SEED = SEED + 11;
installSeed(SEED);                          // ⛔ above the first buildGame()
const SPIES = ["addScore", "comboKill", "sfx", "dropToken", "drawWarden", "glowStroke", "drawPoly"];
const X = H.buildGame({ spy: SPIES });
const C = X.C, G = X.Game, state = X.state, DT = C.FIXED_DT;
const J = JSON.stringify;
const SCRIPT = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = X.WELLS[0], VEE = X.WELLS[7];
H.assert(RING.closed && RING.lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(!VEE.closed && VEE.lanes === 13, "fixture: WELLS[7] is the open 13-lane Vee");

// A board in `mode` at `level`, spawner held and empty unless a test fills it.
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
  return well;
}
// A Warden driven up its lane until it lifts off, through its own update().
function aloft(Z, well, lane, depth) {
  const w = new Z.Warden(lane, depth === undefined ? 0.9 : depth, 1);
  Z.state.enemies.push(w);
  for (let i = 0; i < 2000 && !w.aloft; i++) w.update(Z.C.FIXED_DT, well, Z.state);
  return w;
}
// A shot in flight at `depth`, as the fire path would have made it.
function shotAt(Z, well, lane, depth) {
  const s = new Z.Shot(well, lane, false);
  s.t = (1 - depth) * Z.C.SHOT_TIME;
  Z.state.shots.push(s);
  return s;
}

// ---------------------------------------------------------------------------
// 1. ⛔ THE NINTH CONTRACT FIELD (W1; GDD 6.5)
// ---------------------------------------------------------------------------
{
  const base = new X.Enemy(0, 0);
  H.eq(base.aloft, false, "⛔ the base Enemy carries `aloft`, false");
  H.eq(Object.keys(base).join(","), "lane,depth,dead,purgeable,blocksClear,killDepth,anchored,sfxVoice,aloft",
       "⛔ and it is the NINTH field, appended — the eight before it are unmoved");
  H.eq(Object.getOwnPropertyNames(X.Enemy.prototype).sort().join(","), "constructor,draw,onShot,points,update",
       "⛔ Enemy stays FIELDS AND SIGNATURES ONLY — no reader landed on the base");

  // ⛔ False on every other kind, read off ENEMY_KINDS rather than a list here.
  const kinds = Object.keys(X.ENEMY_KINDS);
  H.eq(kinds.length, COUNTS.enemyKinds, `ENEMY_KINDS has ${COUNTS.enemyKinds} rows (the registry's count)`);
  let wrong = null, aloftKinds = [];
  for (const k of kinds) {
    const e = X.ENEMY_KINDS[k](2, 0.4, 1);
    if (typeof e.aloft !== "boolean") wrong = wrong || `${k}: ${typeof e.aloft}`;
    if (e.aloft) aloftKinds.push(k);
  }
  H.eq(wrong, null, `⛔ every kind carries a boolean 'aloft' (${wrong})`);
  H.eq(J(aloftKinds), "[]", `⛔ and NOT ONE of them is born aloft — a Warden lifts off, it does not arrive there (${aloftKinds})`);

  // ⛔ Its two readers, and nothing else in the build reads it.
  const reads = (SCRIPT.match(/\.aloft\b/g) || []).length;
  const writes = (SCRIPT.match(/this\.aloft\s*=/g) || []).length;
  H.eq(writes, 2, "⛔ `aloft` is written in exactly two places — the base's default and setPhase()");
  H.assert(reads >= 4, `it is read (${reads} sites, declarations included)`);
  const shots = SCRIPT.slice(SCRIPT.indexOf("function collideShots"), SCRIPT.indexOf("function collideSkimmer"));
  const strike = SCRIPT.slice(SCRIPT.indexOf("function jumpStrike"), SCRIPT.indexOf("function updateCollisions"));
  const skimmer = SCRIPT.slice(SCRIPT.indexOf("function collideSkimmer"), SCRIPT.indexOf("⛔ THE ONE PLACE THE PLAYER DIES"));
  H.eq((shots.match(/e\.aloft/g) || []).length, 1, "⛔ collideShots() reads it once — the skip (W1)");
  H.eq((strike.match(/e\.aloft/g) || []).length, 1, "⛔ jumpStrike() reads it once — the requirement (W4)");
  H.eq((skimmer.match(/aloft/g) || []).length, 0,
       "⛔ and collideSkimmer() does NOT: a discharging Warden kills through the one killDepth comparison");
  H.eq((X.respawnSkimmer.toString().match(/aloft/g) || []).length, 0,
       "⛔ nor does respawnSkimmer() — GDD 4.4's push reaches an aloft Warden like any other position");
  H.eq((X.dangerInputs.toString().match(/aloft/g) || []).length, 0,
       "⛔ nor does dangerInputs() — an aloft Warden is a threat at depth 1");
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE CONTRACT (plan §9), read off ENEMY_KINDS.warden
// ---------------------------------------------------------------------------
{
  const w = X.ENEMY_KINDS.warden(3, 0.4, -1);
  H.assert(w instanceof X.Warden && w instanceof X.Enemy, "⛔ ENEMY_KINDS.warden builds a Warden, an Enemy subclass");
  H.assert(!(w instanceof X.Vaulter), "⛔ and NOT a Vaulter subclass — it is not a parameter variant of one");
  H.eq(w.lane, 3, "lane is a position, in lane-centre units");
  H.eq(w.depth, 0.4, "depth is a position");
  H.eq(w.dir, -1, "⛔ the row passes `dir`");
  H.eq(X.ENEMY_KINDS.warden(0, 0, 1).dir, 1, "and a positive dir is +1");
  H.eq(w.dead, false, "dead starts false");
  H.eq(w.purgeable, false, "⛔ purgeable: FALSE (W4) — the Purge is not a Jump");
  H.eq(w.blocksClear, true, "⛔ blocksClear: true (W5)");
  H.eq(w.killDepth, null, "⛔ killDepth: null at rest — its body never kills");
  H.eq(w.anchored, false, "⛔ anchored: false — depth is a POSITION, so the respawn push reaches it");
  H.eq(w.aloft, false, "⛔ aloft: false while it climbs");
  H.eq(w.sfxVoice, "warden", '⛔ sfxVoice: "warden"');
  H.eq(C.SFX_KILL_PITCH.warden, 0.5, "⛔ its kill pitch is sfx-lab's candidate A, 0.5");
  H.eq(w.points(), C.PTS_WARDEN, "⛔ points(): C.PTS_WARDEN");
  H.eq(C.PTS_WARDEN, 500, "and that is GDD 7's 500");
  H.eq(w.onShot(null), false, "⛔ onShot() DECLINES — the shot is not consumed");
  H.eq(w.dead, false, "⛔ and it never dies to one");
  const s = new X.Shot(RING, 3, false);
  H.eq(w.onShot(s), false, "a real shot is declined too");
  H.eq(w.dead, false, "and still no death");

  // The discharge is the one window it carries a band, and setPhase is its one writer.
  w.setPhase("discharge");
  H.eq(w.killDepth, 1 - C.RIM_CONTACT_DEPTH, "⛔ discharging, killDepth is the shared rim band expression");
  H.eq(w.aloft, true, "and it is aloft");
  w.setPhase("hover");
  H.eq(w.killDepth, null, "⛔ and the restore is unconditional — hovering it is null again");
  w.setPhase("climb");
  H.eq(w.aloft, false, "⛔ setPhase(\"climb\") is what ENDS a lift-off, and it writes `aloft` too");
  const wardenSrc = SCRIPT.slice(SCRIPT.indexOf("class Warden extends Enemy"),
                                 SCRIPT.indexOf("\n// 08-spawner.js"));
  H.eq((wardenSrc.match(/this\.killDepth\s*=/g) || []).length, 1,
       "⛔ ONE writer of the band on this entity, and it is setPhase() — the Surger's rule");
  H.eq((wardenSrc.match(/this\.aloft\s*=/g) || []).length, 1,
       "⛔ and setPhase() is also the one writer of `aloft`, so the three can never disagree");
  H.assert(/this\.aloft\s*=/.test(X.Warden.prototype.setPhase.toString()),
           "⛔ and that writer IS setPhase()");

  // The seven wiring points, as flags rather than code.
  H.eq(X.ENEMY_KINDS.warden.length, 3, "the factory is (lane, depth, dir)");
  quiet("overdrive", 11);
  const e = X.spawnEnemy("warden", 5, 0.1);
  H.assert(e instanceof X.Warden && state.enemies.indexOf(e) !== -1, "spawnEnemy(\"warden\") puts one on the board");
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
  { from: 13, to: 17, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger"] },
  { from: 18, to: 22, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger",
                              "carrierDrifter"] },
  { from: 23, to: 40, kinds: ["vaulter", "carrierVaulter", "weaver", "reaver", "drifter", "warden", "surger",
                              "carrierDrifter", "carrierSurger"] },
];
const bandAt = (table, L) => table.find(b => L >= b.from && L <= b.to).kinds;
{
  H.eq(J(C.SPAWN_SCHEDULE_OVERDRIVE), J([{ level: 6, kind: "reaver" }, { level: 11, kind: "warden" }]),
       "⛔ C.SPAWN_SCHEDULE_OVERDRIVE is two rows: the Reaver at 6 and the Warden at 11 (GDD 14.6)");
  H.eq(J(C.SPAWN_SCHEDULE.map(r => r.level + ":" + r.kind)),
       J(["1:vaulter", "3:carrierVaulter", "5:weaver", "9:drifter", "13:surger", "18:carrierDrifter",
          "23:carrierSurger"]),
       "⛔ and C.SPAWN_SCHEDULE is untouched — seven Classic rows, no `warden` among them");
  let odWrong = null, clWrong = null;
  for (let L = 1; L <= 40; L++) {
    const od = J(X.eligibleKinds(L, "overdrive"));
    if (od !== J(bandAt(OVERDRIVE, L))) odWrong = odWrong || `L${L}: ${od}`;
    const cl = J(X.eligibleKinds(L));
    if (cl !== J(bandAt(CLASSIC, L))) clWrong = clWrong || `L${L}: ${cl}`;
  }
  H.eq(odWrong, null, `⛔ eligibleKinds(L, "overdrive") equals the written-out table at every level 1..40 (${odWrong})`);
  H.eq(clWrong, null, `⛔ and Classic's is unchanged at every level 1..40 (${clWrong})`);
  H.eq(X.eligibleKinds(200, "classic").indexOf("warden"), -1, "⛔ no Classic level releases a Warden, 200 included");
  H.eq(X.eligibleKinds(10, "overdrive").indexOf("warden"), -1, "⛔ nor does Overdrive L10 — the row is at 11");

  // The share the uniform pick gives it, measured off pickSpawnKind.
  board("overdrive", 11);
  state.rng = X.mulberry32(SEED);
  const tally = {};
  const N = 40000;
  for (let i = 0; i < N; i++) { const k = X.pickSpawnKind(state); tally[k] = (tally[k] || 0) + 1; }
  H.eq(J(Object.keys(tally).sort()), J(bandAt(OVERDRIVE, 11).slice().sort()),
       "⛔ pickSpawnKind(state) on an Overdrive L11 run releases exactly its six kinds");
  H.assert(Math.abs(tally.warden / N - 1 / 6) < 0.015,
           `and the Warden is 1/6 of them — the uniform pick, no weight (${(tally.warden / N).toFixed(4)})`);
  board("classic", 11);
  let seen = 0;
  for (let i = 0; i < 4000; i++) if (X.pickSpawnKind(state) === "warden") seen++;
  H.eq(seen, 0, "⛔ and on a Classic L11 run it never does");
}

// ⛔ THE NO-DRAW RULE AT OVERDRIVE L1–2 STILL HOLDS (GDD 8.1), counted.
{
  board("overdrive", 1);
  const real = state.rng;                   // trap 2
  let n = 0;
  state.rng = () => { n++; return real(); };
  X.pickSpawnKind(state);
  H.eq(n, 0, "⛔ pickSpawnKind spends ZERO draws at Overdrive L1 — a one-entry set, unmoved by P3's row");
  state.level = 2;
  n = 0; X.pickSpawnKind(state);
  H.eq(n, 0, "⛔ and zero at Overdrive L2");
  state.level = 11;
  n = 0; X.pickSpawnKind(state);
  H.eq(n, 1, "⛔ and exactly ONE at Overdrive L11");
  state.rng = real;
}

// ---------------------------------------------------------------------------
// 4. ⛔ W2 — THE ARRIVAL: the climb, unshootable, harmless at the band, aloft at 1
// ---------------------------------------------------------------------------
{
  // ⛔ C.WARDEN_CLIMB * climbMult(), and nothing else heat touches (R6, R7).
  for (const L of [11, 16, 99]) {
    quiet("overdrive", L, 0);
    const w = new X.Warden(4, 0.2, 1);
    const want = C.WARDEN_CLIMB * X.climbMult(L) * DT;
    let worst = 0;
    let d0 = w.depth;
    for (let i = 0; i < 60; i++) { w.update(DT, RING, state); worst = Math.max(worst, Math.abs((w.depth - d0) - want)); d0 = w.depth; }
    H.assert(worst < 1e-12, `L${L}: ⛔ the climb is C.WARDEN_CLIMB * climbMult(${L}) per step (worst ${worst})`);
    H.assert(!w.aloft && w.killDepth === null, `L${L}: still climbing, and contactless the whole way`);
  }
  H.close(1 / (C.WARDEN_CLIMB * X.climbMult(11)), 4.887, 1e-3, "⛔ throat -> rim is W2's MEASURED 4.89 s at L11");
  H.close(1 / (C.WARDEN_CLIMB * X.climbMult(16)), 4.770, 1e-3, "and 4.77 s at L16");

  // ⛔ It lifts off AT DEPTH 1, exactly, and never above it (GDD 3.2, 6.1).
  quiet("overdrive", 11, 0);
  const w = new X.Warden(4, 0.9, 1);
  let over = null, liftStep = -1, bandSteps = 0;
  for (let i = 0; i < 2000; i++) {
    w.update(DT, RING, state);
    if (w.depth > 1) over = over || `step ${i}: ${w.depth}`;
    if (!w.aloft && w.depth >= PARK) bandSteps++;
    if (w.aloft && liftStep < 0) liftStep = i;
  }
  H.eq(over, null, `⛔ its depth never exceeds 1 — depth > 1 is not a position (${over})`);
  H.assert(liftStep >= 0, "it lifted off");
  H.eq(w.depth, 1, "⛔ and it is at EXACTLY depth 1 aloft — the rim's own depth, the only legal one it has");
  H.eq(w.aloft, true, "⛔ with `aloft` true");
  H.eq(w.phase, "hover", "⛔ and it lifts off into `hover`, never into a strike (the Surger's born-safe rule)");
  H.assert(bandSteps > 0, `⛔ and it CLIMBED THROUGH the rim band on the way (${bandSteps} steps past ${PARK})`);

  // ⛔ UNSHOOTABLE, AND THE SHOT FLIES ON PAST IT (W2). While it climbs `aloft`
  // is false, so collideShots() really does ask — and it declines.
  const well = quiet("overdrive", 11, 0);
  state.skimmer.lane = 8;
  const climber = new X.Warden(0, 0.60, 1);
  state.enemies.push(climber);
  const behind = new X.Vaulter(0, 0.30, 1);   // deeper in the same lane
  state.enemies.push(behind);
  let asked = 0;
  const real = climber.onShot.bind(climber);
  climber.onShot = function (s) { asked++; return real(s); };
  const shot = shotAt(X, well, 0, 0.60 + C.HIT_DEPTH_TOL / 2);
  X.collideShots(state, well);
  H.eq(asked, 1, "⛔ a climbing Warden IS asked — `aloft` is false, so the shot pass reaches it");
  H.eq(shot.dead, false, "⛔ and the shot is NOT consumed: it flies on (07-enemies.js's base-class answer)");
  H.eq(climber.dead, false, "⛔ and the Warden does not die");
  let killed = -1;
  for (let i = 0; i < 200 && killed < 0; i++) {
    X.updateShots(state, well, DT);
    X.collideShots(state, well);
    if (behind.dead) killed = i;
  }
  H.assert(killed >= 0, `⛔ and it reached the Vaulter BEHIND it, at a depth it actually travelled to (step ${killed})`);
  H.assert(!climber.dead, "with the Warden still standing between them");

  // ⛔ ITS BODY NEVER KILLS ON THE WAY UP: the whole climb through the band,
  // with the craft parked in its lane and not firing.
  const w2well = quiet("overdrive", 11, 0);
  state.skimmer.lane = 0;
  const pass = new X.Warden(0, 0.80, 1);
  state.enemies.push(pass);
  let deaths = 0, sweeps = 0;
  const askedSweep = pass.onShot.bind(pass);
  pass.onShot = function (s) { sweeps++; return askedSweep(s); };
  for (let i = 0; i < 900 && !pass.aloft; i++) {
    state.invulnTime = C.RESPAWN_INVULN;    // vulnerable every step
    state.input.fire = false;
    pass.update(DT, w2well, state);
    const was = state.skimmer.dead;
    X.collideSkimmer(state, w2well);
    if (!was && state.skimmer.dead) deaths++;
    state.skimmer.dead = false;
  }
  H.eq(deaths, 0, "⛔ a CLIMBING Warden passes the rim band without killing — killDepth is null the whole way");
  H.eq(sweeps, 0, "⛔ and the rim sweep never even asks it: collideSkimmer() skips a null killDepth outright");
}

// ---------------------------------------------------------------------------
// 5. ⛔ W3 — THE HUNT, AND GDD 17 ITEM 3 ON THE SIX OPEN WELLS
// ---------------------------------------------------------------------------
{
  // It hunts the craft, once per C.WARDEN_HOP_INTERVAL, holding in its lane.
  const steps = Math.ceil(C.WARDEN_HOP_INTERVAL / DT) + 4;
  function firstHop(well, w, max) {
    for (let i = 0; i < max; i++) {
      w.strikeTimer = 0;                    // hold it in hover: the strike is §6's
      w.update(DT, well, state);
      if (w.hopping) return w.hopDelta;
    }
    return 0;
  }
  quiet("overdrive", 11, 0);
  state.skimmer.lane = 10;
  H.assert(firstHop(RING, aloft(X, RING, 4), steps) > 0,
           "⛔ an aloft Warden hops +1 toward a Skimmer above it (lane 4 -> 10)");
  state.skimmer.lane = 1;
  H.assert(firstHop(RING, aloft(X, RING, 14), steps) > 0,
           "⛔ and the SHORT way round the Ring's seam (14 -> 1 is +1) — laneDelta, never a subtraction");
  state.skimmer.lane = 0;
  H.assert(firstHop(RING, aloft(X, RING, 4), steps) < 0, "and -1 toward a Skimmer below it");
  state.skimmer.lane = 6;
  const held = aloft(X, RING, 6);
  H.eq(firstHop(RING, held, 3 * steps), 0, "⛔ in the Skimmer's lane it HOLDS for three intervals");
  state.skimmer.lane = 9;
  H.assert(firstHop(RING, held, 1) > 0, "⛔ and hops toward it on the very next step — the timer held, it did not restart");

  // ⛔ The fold at an open well's wall (GDD 3.5): laneHop's answer, both halves.
  quiet("overdrive", 11, 7);
  state.skimmer.lane = 0;
  H.eq(firstHop(VEE, aloft(X, VEE, 0), 3 * steps), 0, "on the Vee, a wall Warden in the Skimmer's wall lane holds");
  state.skimmer.lane = 12;
  H.assert(firstHop(VEE, aloft(X, VEE, 0), steps) > 0, "and hops inward toward a Skimmer at the far wall");
  state.skimmer.lane = -1;                  // ⚠ STAGED off the well: no legal Skimmer is here
  const wall = aloft(X, VEE, 0);
  H.assert(firstHop(VEE, wall, steps) !== 0, "the wall Warden started a hop aimed past the wall");
  let out = null;
  for (let i = 0; i < 400 && wall.hopping; i++) {
    wall.strikeTimer = 0;
    wall.update(DT, VEE, state);
    if (wall.lane < 0 || wall.lane > VEE.lanes - 1) out = out || `step ${i}: ${wall.lane}`;
  }
  H.eq(out, null, `⛔ the crossing never leaves [0, ${VEE.lanes - 1}] at any interpolated step (${out})`);
  H.eq(wall.lane, 1, "⛔ it FOLDS through laneHop(): lane 0 heading -1 lands on lane 1");
  H.eq(wall.dir, 1, "⛔ and the folded heading is WRITTEN BACK (+1)");
  // ⛔ …and it stays inside the well for a long run of hops afterwards.
  for (let i = 0; i < 900; i++) {
    wall.strikeTimer = 0;
    wall.update(DT, VEE, state);
    if (wall.lane < 0 || wall.lane > VEE.lanes - 1) out = out || `step ${i}: ${wall.lane}`;
  }
  H.eq(out, null, `⛔ and 900 steps of hopping at the wall never leave it either (${out})`);

  // ⛔ The hop's duration is flat at every level (H2) — heat scales no hop.
  for (const L of [11, 23, 99]) {
    quiet("overdrive", L, 0);
    state.skimmer.lane = 8;
    const w = aloft(X, RING, 0);
    const starts = [], lens = [];
    let run = 0;
    for (let i = 0; i < 3000 && starts.length < 4; i++) {
      const was = w.hopping;
      w.strikeTimer = 0;
      w.update(DT, RING, state);
      if (w.hopping && !was) starts.push(i);
      if (w.hopping) run++;
      else if (was) { lens.push(run); run = 0; }
      if (w.lane === 8) w.lane = 0;
    }
    H.assert(starts.length === 4 && starts.slice(1).every((s, k) => Math.abs((s - starts[k]) * DT - C.WARDEN_HOP_INTERVAL) <= DT + 1e-9),
             `L${L}: ⛔ hunt hops start C.WARDEN_HOP_INTERVAL apart at every level (${starts.slice(1).map((s, k) => ((s - starts[k]) * DT).toFixed(4))})`);
    H.assert(lens.length >= 2 && lens.every(n => Math.abs(n * DT - C.WARDEN_HOP_TIME) <= DT + 1e-9),
             `L${L}: ⛔ and each crossing lasts C.WARDEN_HOP_TIME to a step (${lens})`);
  }
}

// ⛔ GDD 17 ITEM 3 WITH WARDENS ALOFT: the six open wells, 5,000 steps each.
// ⛔ THE DRIVER, NEVER THE BUILD: half of every 600 steps is the sweeping,
// firing replay, which clears parked Weavers and Carriers so the release budget
// frees; the other half pins the craft to a wall with fire released, which is
// what walks an aloft Warden into an end lane.
function replay(input, i) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (i % 13 === 0)  input.keyDown(" ");
  if (i % 13 === 9)  input.keyUp(" ");
}
function pinWall(input, i) {
  const c = i % 600;
  if (c < 300) { replay(input, i); return; }
  if (c === 300) { input.keyUp(" "); input.keyUp("ArrowRight"); input.keyUp("ArrowLeft"); }
  input.mouseMove((Math.floor(i / 600) % 2) ? 4000 : -4000);
}
{
  const BOUND = 2 * DT / C.WARDEN_HOP_TIME;
  H.close(BOUND, 0.0952, 1e-4, "⛔ W3's bound is 2 * DT / C.WARDEN_HOP_TIME = 0.0952 lanes per step");
  const OPEN = X.WELLS.map((w, i) => i).filter(i => !X.WELLS[i].closed);
  H.eq(OPEN.length, COUNTS.openWells, "the soak covers every open well");
  for (const idx of OPEN) {
    const well = board("overdrive", 13, idx, SOAK_SEED);
    const last = new Map();
    let wardens = 0, aloftSteps = 0, wall = 0, outOf = null, fast = null, lethal = 0;
    for (let i = 0; i < 5000; i++) {
      state.spawn.remaining = C.SPAWN_QUOTA;
      state.lives = C.START_LIVES;
      state.invulnTime = 0;                 // trap 3: no death, so no push
      pinWall(G.input, i);
      G.update(DT);
      for (const e of state.enemies) {
        if (!(e instanceof X.Warden)) continue;
        if (!last.has(e)) wardens++;
        if (e.aloft) aloftSteps++;
        if (e.phase === "telegraph" && e.killDepth !== null) lethal++;
        if (e.lane < 0 || e.lane > well.lanes - 1) outOf = outOf || `step ${i}: lane ${e.lane}`;
        if (e.lane === 0 || e.lane === well.lanes - 1) wall++;
        if (last.has(e) && Math.abs(e.lane - last.get(e)) > BOUND) {
          fast = fast || `step ${i}: ${last.get(e)} -> ${e.lane}`;
        }
        last.set(e, e.lane);
      }
      if (state.screen !== "play") break;
    }
    // ⚠ A Warden is unkillable by this driver and blocksClear, so it HOLDS a
    // release slot: MEASURED 1–3 per well over 5,000 steps at L13. The soak is
    // about aloft LANES, so the coverage that matters is the aloft and wall
    // step counts, not how many were released.
    H.assert(state.level === 13 && wardens >= 1 && aloftSteps > 500 && wall > 50,
             `${well.name}: the soak ran at L13 with Wardens aloft and at the wall ` +
             `(${wardens} Wardens, ${aloftSteps} aloft steps, ${wall} wall-steps)`);
    H.eq(outOf, null, `${well.name}: ⛔ no Warden lane leaves [0, ${well.lanes - 1}] in 5,000 steps`);
    H.eq(fast, null, `${well.name}: ⛔ and no step moves one more than W3's bound`);
    H.eq(lethal, 0, `${well.name}: ⛔ and the fuse was never lethal on any step of it`);
  }
}

// ---------------------------------------------------------------------------
// 6. ⛔ W3 — THE STRIKE: the fuse is never lethal, the discharge is, and the
//    respawn guarantee holds
// ---------------------------------------------------------------------------
H.assert(C.WARDEN_DISCHARGE < C.RESPAWN_INVULN,
         `⛔ C.WARDEN_DISCHARGE (${C.WARDEN_DISCHARGE}) must stay STRICTLY below C.RESPAWN_INVULN ` +
         `(${C.RESPAWN_INVULN}) — the Surger's invariant for the Surger's reason: a strike already ` +
         `running when the player respawns is survived by the invulnerability window and nothing else`);
{
  // The cycle: hover -> telegraph -> discharge -> hover, forever, and the
  // FIRST hover after a lift-off is C.WARDEN_ARM.
  const well = quiet("overdrive", 11, 0);
  state.skimmer.lane = 8;                   // away, so it neither hunts nor kills
  const w = aloft(X, RING, 0);
  const phases = [], runs = {};
  let cur = w.phase, n = 0;
  for (let i = 0; i < 1200; i++) {
    w.update(DT, RING, state);
    if (w.phase !== cur) { (runs[cur] = runs[cur] || []).push(n); phases.push(cur); cur = w.phase; n = 0; }
    n++;
  }
  H.assert(phases.slice(0, 6).every((p, i) => p === ["hover", "telegraph", "discharge"][i % 3]),
           `⛔ the cycle is hover -> telegraph -> discharge, forever (${phases.slice(0, 6)})`);
  H.close(runs.hover[0] * DT, C.WARDEN_ARM, 2 * DT, "⛔ the FIRST hover is C.WARDEN_ARM — the beat it gets to be seen");
  H.close(runs.hover[1] * DT, C.WARDEN_HOVER, 2 * DT, "⛔ and every later one is C.WARDEN_HOVER");
  H.close(runs.telegraph[1] * DT, C.WARDEN_TELEGRAPH, 2 * DT, "a telegraph lasts C.WARDEN_TELEGRAPH");
  H.close(runs.discharge[1] * DT, C.WARDEN_DISCHARGE, 2 * DT, "and a discharge lasts C.WARDEN_DISCHARGE");
  H.close(C.WARDEN_HOVER + C.WARDEN_TELEGRAPH + C.WARDEN_DISCHARGE, 2.35, 1e-9,
          "⛔ the cycle is 2.35 s against the Jump's 2.30 s — one strike per jump (W3)");
  H.close(C.JUMP_TIME + C.JUMP_COOLDOWN, 2.30, 1e-9, "and that is the Jump's cycle, read from C");

  // ⛔ THE FUSE IS NEVER LETHAL, and the discharge is — counted per phase
  // through the real G.update() and the real killSkimmer() (cs005-p3's form).
  const live = quiet("overdrive", 11, 0);
  state.skimmer.lane = 0;
  const f = aloft(X, live, 0);
  const seen = { hover: 0, telegraph: 0, discharge: 0 }, kills = { hover: 0, telegraph: 0, discharge: 0 };
  let spent = 0;
  for (let i = 0; i < 700; i++) {
    state.skimmer.lane = 0;                 // stay in its lane; it holds through the strike
    state.lives = C.START_LIVES;
    state.input.fire = false;
    const was = state.skimmer.dead;
    f.update(DT, live, state);
    X.collideSkimmer(state, live);
    // ⛔ The phase the step ENDED in, cs005-p3's form: the entity pass runs
    // before the collision pass, so a step that enters the discharge IS lethal
    // on that step, and reading the pre-step phase would blame the fuse for it.
    seen[f.phase]++;
    if (!was && state.skimmer.dead) { kills[f.phase]++; spent++; state.skimmer.dead = false; }
    state.invulnTime = C.RESPAWN_INVULN;    // vulnerable again next step
  }
  H.assert(seen.hover > 0 && seen.telegraph > 0 && seen.discharge > 0, "the craft stood in the lane for whole cycles");
  H.eq(kills.hover, 0, "⛔ a HOVERING Warden is harmless — killDepth is null and there is no band to meet");
  H.eq(kills.telegraph, 0,
       "⛔ THE RIM IS NEVER LETHAL DURING THE TELEGRAPH. A fuse that kills is not a fuse (GDD 6.3's rule, W3's shape)");
  H.assert(kills.discharge > 0, `⛔ and the DISCHARGE kills a grounded craft in its lane (${kills.discharge} lethal steps)`);
  H.assert(spent > 0, "through the real killSkimmer()");
  H.eq(f.killDepth, f.phase === "discharge" ? 1 - C.RIM_CONTACT_DEPTH : null,
       "⛔ and the band is RESTORED — phase and killDepth cannot disagree");

  // ⛔ ONE LANE AWAY DOES NOT DIE: the strike is a lane, not a blast radius.
  let neighbours = 0;
  for (const lane of [1, 15, 2, 14]) {
    const nw = quiet("overdrive", 11, 0);
    state.skimmer.lane = lane;
    const s = aloft(X, nw, 0);
    s.setPhase("discharge");
    state.invulnTime = C.RESPAWN_INVULN;
    X.collideSkimmer(state, nw);
    if (state.skimmer.dead) neighbours++;
  }
  H.eq(neighbours, 0, "⛔ a craft one or two lanes from a discharging Warden does not die");
}

// ⛔ THE RESPAWN GUARANTEE (GDD 4.4) through the real respawnSkimmer().
{
  const WINDOW = Math.round(C.RESPAWN_INVULN / DT);
  for (const L of [11, 23, 99]) {
    const well = quiet("overdrive", L, 0);
    state.lives = C.START_LIVES;
    state.invulnTime = C.RESPAWN_INVULN;
    const w = aloft(X, well, state.skimmer.lane);
    H.eq(w.depth, 1, `L${L}: fixture: an aloft Warden over the craft's lane`);
    const before = state.lives;
    let guard = 0;
    while (state.lives === before && guard++ < 1200) { state.skimmer.lane = w.lane; G.update(DT); }
    H.assert(state.lives === before - 1, `L${L}: the craft died to its discharge (setup, ${guard} steps)`);
    G.update(DT);                           // the respawn step
    H.close(w.depth, C.RESPAWN_PUSH_DEPTH, C.WARDEN_CLIMB * C.CLIMB_MULT_MAX * DT + 1e-12,
            `L${L}: ⛔ the real respawnSkimmer() pushed it to C.RESPAWN_PUSH_DEPTH (${w.depth.toFixed(4)})`);
    H.eq(w.aloft, false, `L${L}: ⛔ and the push ENDED the lift-off — it is climbing again`);
    H.eq(w.killDepth, null, `L${L}: ⛔ with its band gone, because setPhase() wrote all three`);
    const lives = state.lives, d0 = w.depth;
    let died = null;
    for (let i = 0; i < WINDOW; i++) {
      state.skimmer.lane = w.lane;
      G.update(DT);
      if (state.lives < lives) died = died || `step ${i}`;
    }
    H.eq(died, null, `L${L}: ⛔ NO death inside C.RESPAWN_INVULN with a live Warden in the craft's lane`);
    H.assert(!w.dead && w.depth > d0, `L${L}: ⛔ and it was alive and CLIMBING BACK at the window's end (${w.depth.toFixed(4)})`);
  }
  // ⛔ W3's arithmetic, from the constants: a pushed Warden cannot strike
  // inside the window even if the invariant above were removed.
  const reclimb = (1 - C.RESPAWN_PUSH_DEPTH) / (C.WARDEN_CLIMB * C.CLIMB_MULT_MAX);
  H.close(reclimb, 1.786, 1e-3, "⛔ a pushed Warden re-climbs in >= 1.79 s even at C.CLIMB_MULT_MAX");
  H.assert(reclimb + C.WARDEN_ARM + C.WARDEN_TELEGRAPH > C.RESPAWN_INVULN,
           `⛔ so its first discharge lands ${(reclimb + C.WARDEN_ARM + C.WARDEN_TELEGRAPH).toFixed(3)} s after a ` +
           `respawn — past the window on its own (W3, MEASURED)`);
}

// ---------------------------------------------------------------------------
// 7. ⛔ W4 — THE JUMP STRIKE: the FOURTH kill site
// ---------------------------------------------------------------------------
// Stage an airborne craft `off` lanes from an aloft Warden and run the real
// updateCollisions(). Returns everything the kill line owes.
function strikeCase(Z, off, phase, opts) {
  const ZC = Z.C, st = Z.state, ZG = Z.Game;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.level = 11;
  st.wellIndex = 0;
  Z.enterWell();
  ZG.input.reset();
  st.spawn.remaining = 0;
  st.spawn.timer = -1e9;
  st.enemies = [];
  st.shots = [];
  const well = Z.WELLS[0];
  st.skimmer.lane = 0;
  const w = aloft(Z, well, ZC.HIT_LANE_TOL === undefined ? off : off);
  st.jump.phase = phase;
  st.jump.t = phase === "ground" ? 0 : 0.10;
  if (opts && opts.mult) st.combo.mult = opts.mult;
  const score0 = st.score, kills0 = st.tally.kills;
  const real = st.rng;                      // trap 2
  let draws = 0;
  st.rng = function () { draws++; return real(); };
  Z.updateCollisions(st, well);
  st.rng = real;
  return { w, draws, paid: st.score - score0, kills: st.tally.kills - kills0 };
}
{
  const spySfx = [];
  X.sfx.before = (name, voice) => spySfx.push(name + ":" + voice);
  const builds0 = X.comboKill.calls, drops0 = X.dropToken.calls;
  const r = strikeCase(X, 0, "air", { mult: 2.5 });
  X.sfx.before = null;
  H.eq(r.w.dead, true, "⛔ AN AIRBORNE CRAFT IN AN ALOFT WARDEN'S LANE KILLS IT (W4) — the fourth kill site");
  H.eq(r.kills, 1, "⛔ it counts one kill, like every other site");
  H.eq(r.paid, C.PTS_WARDEN * 2.5, "⛔ and pays e.points() AT THE MULTIPLIER IN FORCE (GDD 7, O4)");
  H.eq(X.comboKill.calls - builds0, 1, "⛔ and then BUILDS the combo — what is multiplied is exactly what builds");
  H.eq(X.dropToken.calls - drops0, 1, "⛔ and rolls T2's drop, once");
  H.eq(r.draws, 1, "⛔ spending EXACTLY ONE draw from the run's one stream, drop or no drop");
  H.assert(spySfx.indexOf("kill:warden") >= 0, `⛔ and sounds the kill in its own voice (${spySfx})`);

  H.eq(strikeCase(X, 1, "air").w.dead, false, "⛔ ONE LANE AWAY DOES NOT — the strike is a lane match, nothing wider");
  H.eq(strikeCase(X, 0, "ground").w.dead, false, "⛔ A GROUNDED CRAFT NEVER DOES, in its lane or not");
  H.eq(strikeCase(X, 0, "recover").w.dead, false, "⛔ nor a RECOVERING one — recovery is on the rim");

  // ⛔ ROTATING AIRBORNE SWEEPS THROUGH LANES, so one jump may take two: the
  // loop `continue`s rather than returning (the rim sweep's rule).
  {
    const well = quiet("overdrive", 11, 0);
    state.skimmer.lane = 0;
    const a = aloft(X, well, 0), b = aloft(X, well, 0);
    state.jump.phase = "air"; state.jump.t = 0.1;
    X.updateCollisions(state, well);
    H.assert(a.dead && b.dead, "⛔ two aloft Wardens in the craft's lane BOTH die in one pass");
  }

  // ⛔ SHOTS NEVER (W1): 600 steps of held fire at an aloft Warden.
  {
    const well = quiet("overdrive", 11, 0);
    state.skimmer.lane = 0;
    const w = aloft(X, well, 0);
    // ⛔ SHOTS only: the rim sweep also calls onShot(), with `null`, and that
    // call is W3's own rule — a firing craft is not saved from the discharge.
    let asked = 0, swept = 0;
    const real = w.onShot.bind(w);
    w.onShot = function (s) { if (s) asked++; else swept++; return real(s); };
    G.input.keyDown(" ");
    let fired = 0;
    for (let i = 0; i < 600 && !w.dead; i++) { G.update(DT); fired = Math.max(fired, state.tally.shotsFired); state.lives = C.START_LIVES; state.invulnTime = 0; }
    G.input.keyUp(" ");
    H.eq(w.dead, false, "⛔ 600 steps of held fire into an aloft Warden's lane do not kill it");
    H.eq(asked, 0, "⛔ and no SHOT ever asked it — collideShots() skips an aloft entity outright");
    H.assert(swept > 0, `⛔ while the rim sweep did ask, and was declined (${swept} times) — W3's rule`);
    H.assert(fired > 20, `non-vacuity: the craft really was firing (${fired} shots)`);
  }

  // ⛔ THE PURGE NEVER (W4): both uses, back to back.
  {
    const well = quiet("overdrive", 11, 0);
    state.skimmer.lane = 4;
    const w = aloft(X, well, 0);
    const v = X.spawnEnemy("vaulter", 8, 0.5);
    H.eq(w.purgeable, false, "fixture: the Warden is not purgeable");
    for (const use of [1, 2]) {
      G.input.keyDown("x"); G.update(DT); G.input.keyUp("x"); G.update(DT);
      H.eq(state.purgeUses, use, `the Purge fired, use ${use}`);
      H.eq(w.dead, false, `⛔ and use ${use} LEAVES THE WARDEN — "only by Jump" (GDD 4.3 reads the flag)`);
    }
    H.assert(v.dead || state.enemies.indexOf(v) === -1, "non-vacuity: the first use did clear the purgeable Vaulter");
  }
}

// ⛔ MUTATION-CHECKED (trap 6): each string is in the build exactly once.
function mutantRed(mutate, what, probe) {
  installSeed(SEED);
  let threw = null, got = null;
  try { got = probe(H.buildGame({ mutate })); } catch (e) { threw = e.message; }
  H.eq(threw, null, `fixture: ${what} — the mutation string is in the build exactly once (${threw})`);
  return got;
}
{
  // (a) the `aloft` skip removed from collideShots(): a shot asks it again, and
  //     an unshootable Warden starts SHIELDING the rim band of its lane.
  const asked = mutantRed([["      if (e.aloft) continue;\n", ""]],
    "removing collideShots()' aloft skip", Z => {
      const zw = Z.WELLS[0], st = Z.state;
      Z.Game.reset(); Z.startGame(SEED, { mode: "overdrive" });
      st.level = 11; st.wellIndex = 0; Z.enterWell();
      st.spawn.remaining = 0; st.spawn.timer = -1e9; st.enemies = []; st.shots = [];
      st.skimmer.lane = 0;
      const w = aloft(Z, zw, 0);
      let n = 0;
      const real = w.onShot.bind(w);
      w.onShot = function (s) { n++; return real(s); };
      Z.Game.input.keyDown(" ");
      for (let i = 0; i < 200; i++) { Z.Game.update(Z.C.FIXED_DT); st.lives = Z.C.START_LIVES; st.invulnTime = 0; }
      return { asked: n, dead: w.dead };
    });
  H.assert(asked && asked.asked > 0,
           `⛔ MUTATION: with the aloft skip removed, shots ASK an aloft Warden and it shields its lane (${asked && asked.asked})`);
  H.eq(asked && asked.dead, false, "⛔ and it still does not die to one — the skip is about reach, not armour");

  // (b) the jumpStrike() call removed from updateCollisions().
  const nostrike = mutantRed([["  jumpStrike(state, well);\n", ""]],
    "removing the jumpStrike() call", Z => strikeCase(Z, 0, "air"));
  H.eq(nostrike && nostrike.w.dead, false,
       "⛔ MUTATION: with jumpStrike() taken out of updateCollisions(), an airborne craft kills nothing");

  // (c) the strike made to need a GROUNDED craft.
  const flipped = mutantRed([["  if (!jumpAirborne(state)) return;", "  if (jumpAirborne(state)) return;"]],
    "requiring a grounded craft", Z => ({ air: strikeCase(Z, 0, "air").w.dead, ground: strikeCase(Z, 0, "ground").w.dead }));
  H.assert(flipped && flipped.air === false && flipped.ground === true,
           `⛔ MUTATION: inverted, the jump kill happens GROUNDED and never airborne (${J(flipped)})`);
}

// ⛔ THE BUILD'S THREE COUNTED TEXTS ARE UNMOVED (test-cs012-p5.js's pins).
H.eq(SCRIPT.split("  if (jumpAirborne(state)) return;\n").length - 1, 1,
     "⛔ `  if (jumpAirborne(state)) return;` is STILL in the build exactly once — jumpStrike() uses the negation");
H.eq(SCRIPT.split("  if (!jumpAirborne(state)) return;\n").length - 1, 1,
     "⛔ and its negation exactly once, in jumpStrike()");
{
  // ⛔ EXACTLY ONE TWO-DEPTH COMPARISON IN THE BUILD, and it is the dive
  // strike's (GDD 4.5 item 5). The jump strike is a lane match on two flags.
  const strike = SCRIPT.slice(SCRIPT.indexOf("function jumpStrike"), SCRIPT.indexOf("function updateCollisions"));
  H.eq((strike.match(/depth/g) || []).length, 0,
       "⛔ jumpStrike() names no depth at all — airborne is a phase and aloft is a phase");
  H.assert(/dive\.depth\s*<=\s*\w+\.depth/.test(SCRIPT),
           "⛔ and the dive strike's two-depth comparison is still the build's one");
}

// ---------------------------------------------------------------------------
// 8. ⛔ W5 — A LIVE WARDEN HOLDS THE WELL OPEN
// ---------------------------------------------------------------------------
{
  const well = quiet("overdrive", 11, 0);
  state.spawn.remaining = 0;
  state.skimmer.lane = 0;
  const w = aloft(X, well, 0);
  H.eq(w.blocksClear, true, "⛔ blocksClear: true (W5)");
  H.eq(X.wellCleared(state), false, "⛔ a well with a live Warden in it does NOT clear, quota spent or not");
  H.eq(X.threatCount(state), 1, "⛔ and it counts against the release budget, rather than adding pressure outside it");
  state.jump.phase = "air"; state.jump.t = 0.1;
  X.updateCollisions(state, well);
  state.enemies = state.enemies.filter(e => !e.dead);
  H.eq(w.dead, true, "the jump took it");
  H.eq(X.wellCleared(state), true, "⛔ and the well clears on the jump kill — the player's answer is the Jump");

  // ⛔ It is not a Dive survivor: startDive() keeps `anchored` entities only.
  const dw = quiet("overdrive", 11, 0);
  const d = aloft(X, dw, 3);
  X.startDive(state);
  H.eq(state.enemies.indexOf(d), -1, "⛔ and startDive() keeps no Warden — it is not anchored");
}

// ---------------------------------------------------------------------------
// 9. ⛔ AIRBORNE IMMUNITY HOLDS AGAINST ITS DISCHARGE (test-cs012-p5.js's form)
// ---------------------------------------------------------------------------
// trap 4: collideSkimmer() alone, so the jump strike does not remove the Warden
// before the pass that is under test gets to decline.
function contact(Z, phase) {
  const st = Z.state, ZG = Z.Game;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.level = 11; st.wellIndex = 0;
  Z.enterWell();
  ZG.input.reset();
  st.spawn.remaining = 0; st.spawn.timer = -1e9; st.enemies = []; st.shots = [];
  const well = Z.WELLS[0];
  st.skimmer.lane = 0;
  st.input.fire = false;                    // no rim sweep
  const w = aloft(Z, well, 0);
  w.setPhase("discharge");
  st.jump.phase = phase;
  st.jump.t = phase === "ground" ? 0 : 0.10;
  st.invulnTime = Z.C.RESPAWN_INVULN;
  Z.collideSkimmer(st, well);
  return st.skimmer.dead === true;
}
{
  H.eq(contact(X, "ground"), true, "fixture: grounded, a discharging Warden kills");
  H.eq(contact(X, "recover"), true, "⛔ RECOVERING IS LETHAL (O6): it still kills");
  H.eq(contact(X, "air"), false, "⛔ AIRBORNE: it does not — the whole-pass skip covers a killDepth it never knew about");
  const died = mutantRed([["  if (jumpAirborne(state)) return;\n", ""]],
    "removing collideSkimmer()'s airborne skip", Z => contact(Z, "air"));
  H.eq(died, true, "⛔ MUTATION: with the skip removed, the discharge kills an airborne craft again");

  // ⛔ AND THE RIM SWEEP CANNOT SAVE A FIRING CRAFT: its onShot() declines.
  const well = quiet("overdrive", 11, 0);
  state.skimmer.lane = 0;
  const w = aloft(X, well, 0);
  w.setPhase("discharge");
  state.input.fire = true;
  state.invulnTime = C.RESPAWN_INVULN;
  X.collideSkimmer(state, well);
  H.eq(state.skimmer.dead, true, "⛔ a FIRING grounded craft dies to the discharge — the sweep asks and is declined");
  H.eq(w.dead, false, "⛔ and the Warden is untouched by the sweep");
}

// ---------------------------------------------------------------------------
// 10. ⛔ W6 — THE DRAW: drawWarden(), the lift, and the beam
// ---------------------------------------------------------------------------
{
  const ctx = new Proxy({}, { get: () => () => {} });
  const well = quiet("overdrive", 11, 0);
  let stroke = null, closed = null, widths = [];
  X.glowStroke.before = (c, color, width) => { stroke = color; widths.push(width); };
  X.drawPoly.before = (c, pts, cl) => { closed = cl; };

  const dw = X.drawWarden.calls;
  const climbing = new X.Warden(2, 0.6, 1);
  climbing.draw(ctx, RING);
  H.eq(X.drawWarden.calls - dw, 1, "⛔ Warden.draw() calls drawWarden()");
  H.eq(closed, true, "one CLOSED path through drawPoly");
  H.eq(stroke, C.WARDEN_COLOR, "stroked through glowStroke in C.WARDEN_COLOR");
  H.assert(C.WARDEN_COLOR !== C.VAULTER_COLOR && C.WARDEN_COLOR !== C.TOKEN_COLOR &&
           C.WARDEN_COLOR !== C.SURGER_COLOR && C.WARDEN_COLOR !== C.DRIFTER_COLOR,
           `⛔ and it is its OWN colour — no enemy or token colour is reached for (${C.WARDEN_COLOR})`);
  H.eq(C.WARDEN_COLOR, "#477EFF", "⚠ W6's provisional blue, hue 222°");
  H.eq(X.WARDEN_POLY.length, 8, "WARDEN_POLY is eight points");
  H.assert(X.WARDEN_POLY.every(p => Math.abs(p.l) <= 1 && Math.abs(p.d) <= 1),
           "⛔ inside the ±1 local box every silhouette uses, so C.WARDEN_SIZE means lane widths");
  H.assert(X.VAULTER_POLY.every(p => X.WARDEN_POLY.indexOf(p) === -1),
           "⛔ and it shares no point with the Vaulter's X — a different outline at a glance (GDD 18)");

  // ⛔ NO FILL AND NO ALLOCATION IN THE DRAW PATH (GDD 10.2, 17's budget).
  const strip = t => t.replace(/\/\/[^\n]*/g, "");
  const drawn = strip(X.drawWarden.toString() + X.drawWardenBeam.toString());
  H.eq((drawn.match(/\.fill|Rect\(|\.arc\(|drawImage/g) || []).length, 0, "⛔ no fill, no rect, no arc anywhere in it");
  H.eq((drawn.match(/\[[^\]]*,[^\]]*\]/g) || []).length, 0, "⛔ and no array literal — the beam's pair is preallocated");

  // ⛔ THE BEAM: absent while climbing, grows with the fuse, and the WIDTH is
  // the state change (drawSurgeLane's rule).
  const beamPolys = [];
  X.drawPoly.before = (c, pts) => beamPolys.push(pts);
  widths = [];
  climbing.draw(ctx, RING);
  H.eq(beamPolys.length, 1, "⛔ a CLIMBING Warden draws its silhouette and no beam");

  const w = aloft(X, well, 0);
  beamPolys.length = 0; widths = [];
  w.setPhase("hover");
  w.draw(ctx, RING);
  H.eq(beamPolys.length, 1, "⛔ and a HOVERING one draws no beam either — the fuse is the warning");

  w.setPhase("telegraph");
  w.strikeTimer = C.WARDEN_TELEGRAPH / 2;
  beamPolys.length = 0; widths = [];
  w.draw(ctx, RING);
  H.eq(beamPolys.length, 2, "⛔ a TELEGRAPHING one draws the beam and then the silhouette over it");
  const half = beamPolys[0];
  const lenHalf = Math.hypot(half[1].x - half[0].x, half[1].y - half[0].y);
  const fuseWidth = widths[0];
  w.strikeTimer = C.WARDEN_TELEGRAPH;
  beamPolys.length = 0; widths = [];
  w.draw(ctx, RING);
  const full = beamPolys[0];
  const lenFull = Math.hypot(full[1].x - full[0].x, full[1].y - full[0].y);
  H.assert(lenFull > lenHalf && lenHalf > 0, `⛔ the beam GROWS as the fuse runs (${lenHalf.toFixed(2)} -> ${lenFull.toFixed(2)})`);
  H.close(lenHalf / lenFull, 0.5, 1e-9, "⛔ and it grows linearly with chargeTip()");
  H.close(lenFull, C.WARDEN_LIFT * C.WELL_RADIUS, 1e-9,
          "⛔ a full fuse spans exactly C.WARDEN_LIFT rim radii — from the Warden down to the rim of its lane");
  w.setPhase("discharge");
  beamPolys.length = 0; widths = [];
  w.draw(ctx, RING);
  H.eq(widths[0] / fuseWidth, C.WARDEN_BEAM_WIDTH,
       "⛔ and the DISCHARGE slams it to C.WARDEN_BEAM_WIDTH — the width jump says which instant it is");

  X.glowStroke.before = null; X.drawPoly.before = null;

  // ⛔ THE LIFT IS ONE COPY OF THE CRAFT'S OWN MATH (CLAUDE.md), and it MOVES
  // an aloft silhouette outward.
  const code = SCRIPT.replace(/\/\/[^\n]*/g, "");
  H.eq(code.split("function liftPoints").length - 1, 1, "⛔ liftPoints() is defined once in the build");
  H.eq((code.match(/liftPoints\(/g) || []).length, 4,
       "⛔ and it has exactly THREE call sites: craftPoints(), drawWardenBeam() and drawWarden() — " +
       "ONE copy of the lift math, shared by the airborne craft and the aloft Warden");
  const flat = X.entityPoints(RING, 0, 1, X.WARDEN_POLY, C.WARDEN_SIZE).map(p => ({ x: p.x, y: p.y }));
  const lifted = X.entityPoints(RING, 0, 1, X.WARDEN_POLY, C.WARDEN_SIZE);
  X.liftPoints(RING, lifted, X.WARDEN_POLY.length, C.WARDEN_LIFT);
  const moved = lifted.map((p, i) => Math.hypot(p.x - flat[i].x, p.y - flat[i].y));
  H.assert(moved.every(d => Math.abs(d - C.WARDEN_LIFT * C.WELL_RADIUS) < 1e-9),
           `⛔ every point moves exactly C.WARDEN_LIFT rim radii outward (${moved.map(d => d.toFixed(3))})`);
  H.eq(C.WARDEN_LIFT, 0.06, "⚠ W6's provisional 0.06 — MEASURED: nothing leaves the world at it");
  H.assert(C.WARDEN_LIFT < C.JUMP_LIFT, "⛔ and below the Jump's apex, so the craft rises PAST a hovering Warden");
}

// ---------------------------------------------------------------------------
// 11. ⛔ W6 — THE LIFT IS DRAW-ONLY, AND THE CHARGE TONE IS THE SURGER'S
// ---------------------------------------------------------------------------
// A played Overdrive session, hashed per step. `jump` presses at Wardens so the
// board really turns over (the non-jumping driver cannot clear a Warden's well).
function session(Z, steps, mutate) {
  const st = Z.state, ZG = Z.Game, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive", startDepth: 13 });
  ZG.input.reset();
  const out = [];
  let wardens = 0, jumpKills = 0, aloftSteps = 0;
  const seen = new Set();
  for (let i = 0; i < steps; i++) {
    st.lives = Z.C.START_LIVES;
    replay(ZG.input, i);
    // Jump whenever something is aloft in reach — the repair a Warden's well needs.
    const sk = st.skimmer;
    const near = sk && !sk.dead && st.enemies.some(e => !e.dead && e.aloft &&
      Math.abs(Z.laneDelta(Z.WELLS[st.wellIndex], e.lane, sk.lane)) <= Z.C.HIT_LANE_TOL);
    if (near) ZG.input.keyDown("arrowup"); else ZG.input.keyUp("arrowup");
    const k0 = st.tally.kills;
    ZG.update(ZDT);
    for (const e of st.enemies) {
      if (!(e instanceof Z.Warden)) continue;
      if (!seen.has(e)) { seen.add(e); wardens++; }
      if (e.aloft) aloftSteps++;
    }
    if (near && st.tally.kills > k0) jumpKills++;
    let h = 2166136261 >>> 0;
    const mix = v => { h = Math.imul(h ^ ((v * 1e6) | 0), 16777619) >>> 0; };
    mix(st.level); mix(st.wellIndex); mix(st.score); mix(st.spawn.timer); mix(st.spawn.remaining);
    mix(sk ? sk.lane : -1); mix(st.shots.length); mix(st.enemies.length); mix(st.tokens.length);
    for (const e of st.enemies) {
      mix(e.lane); mix(e.depth); mix(e.dead ? 1 : 0); mix(e.aloft ? 1 : 0);
      for (const ch of e.constructor.name) mix(ch.charCodeAt(0));
    }
    out.push(h);
  }
  return { out, wardens, jumpKills, aloftSteps, level: st.level };
}
const SESSION_STEPS = 6000;
{
  const real = session(X, SESSION_STEPS);
  H.assert(real.wardens >= 3 && real.aloftSteps > 0,
           `non-vacuity: the played session released ${real.wardens} Wardens and held them aloft ${real.aloftSteps} steps`);
  H.assert(real.jumpKills > 0, `non-vacuity: the driver jump-killed (${real.jumpKills})`);

  installSeed(SEED);
  const Z = H.buildGame({ mutate: [["  WARDEN_LIFT:          0.06,", "  WARDEN_LIFT:          0,   "]] });
  H.eq(Z.C.WARDEN_LIFT, 0, "fixture: the mutated build draws no lift at all");
  const flat = session(Z, SESSION_STEPS);
  let diff = -1;
  for (let i = 0; i < SESSION_STEPS && diff < 0; i++) if (real.out[i] !== flat.out[i]) diff = i;
  H.eq(diff, -1, `⛔ THE LIFT IS DRAW-TIME ONLY: with C.WARDEN_LIFT mutated to 0 the state hash is identical on ` +
       `all ${SESSION_STEPS} steps (first difference at ${diff})`);
  H.eq(flat.wardens, real.wardens, "and the same Wardens were released");
}

// ⛔ THE FUSE BORROWS THE SURGER'S HELD VOICE, and 19-sfx.js was not edited.
{
  const sfxSrc = SCRIPT.slice(SCRIPT.indexOf("function reconcileSurgeTones"),
                              SCRIPT.indexOf("function reconcileSurgeTones") + 900);
  H.eq((sfxSrc.match(/Warden|warden/g) || []).length, 0,
       "⛔ reconcileSurgeTones() names no Warden — it is DUCK-TYPED on phase + chargeTip() (K8)");
  H.eq((X.Warden.prototype.chargeTip ? 1 : 0), 1, "⛔ and the Warden supplies chargeTip()");

  installSeed(SEED);
  const A = H.buildGame({ audio: true });
  const AC = A.C, AS = A.state, AG = A.Game;
  const holds = new Map();
  const hold0 = A.Sfx.hold;
  A.Sfx.hold = function (recipe) {
    const v = hold0.call(this, recipe);
    if (recipe === AC.SFX.surgeCharge) {
      const rec = { live: true };
      holds.set(rec, rec);
      const stop0 = v.stop;
      v.stop = function () { rec.live = false; return stop0.apply(this, arguments); };
    }
    return v;
  };
  const liveVoices = () => [...holds.values()].filter(r => r.live).length;

  // A real gesture unlocks the context (STATUS: G.input.keyDown() is not one).
  const target = { l: {}, visibilityState: "visible",
    addEventListener(t, f) { (this.l[t] = this.l[t] || []).push(f); },
    removeEventListener(t, f) { if (this.l[t]) this.l[t] = this.l[t].filter(g => g !== f); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    fire(t, ev) { for (const f of (this.l[t] || []).slice()) f(Object.assign({ preventDefault() {} }, ev)); } };
  A._env.win.addEventListener = target.addEventListener.bind(target);
  A._env.doc.addEventListener = target.addEventListener.bind(target);
  AG.init(A._env.doc.createElement("canvas"));
  target.fire("keydown", { key: "z", code: "KeyZ" });
  H.assert(A.AudioSys.ctx !== null, "fixture: a DOM gesture opened the audio context");

  AG.reset();
  A.startGame(SEED, { mode: "overdrive" });
  AS.level = 11; AS.wellIndex = 0;
  A.enterWell();
  AS.spawn.remaining = 0; AS.spawn.timer = -1e9; AS.enemies = []; AS.shots = [];
  AS.skimmer.lane = 8;
  const w = aloft(A, A.WELLS[0], 0);
  let over = 0, tele = 0, maxLive = 0, ms = 0;
  for (let i = 0; i < 700; i++) {
    AS.lives = AC.START_LIVES;
    AS.invulnTime = 0;
    ms += 1000 * AC.FIXED_DT;
    if (A.AudioSys.ctx) A.AudioSys.ctx.currentTime = ms / 1000;
    AG.frame(ms);
    const want = (!w.dead && w.phase === "telegraph") ? 1 : 0;
    if (want) tele++;
    maxLive = Math.max(maxLive, liveVoices());
    if (liveVoices() !== want) over++;
  }
  H.assert(tele > 0, `non-vacuity: the Warden telegraphed on ${tele} frames`);
  H.eq(over, 0, "⛔ EXACTLY ONE held Surger voice per telegraphing Warden, on every frame — and NONE otherwise");
  H.eq(maxLive, 1, "⛔ and never more than one at a time for one Warden");
  H.eq(liveVoices(), 0, "⛔ and no voice outlives its fuse");
}

// ---------------------------------------------------------------------------
// 12. ⛔ CLASSIC NEVER SEES A WARDEN: Start Depth 13, 5,000 steps, hash by hash
// ---------------------------------------------------------------------------
const ROW = '    { level: 11, kind: "warden" },\n';
function classicHashes(Z, steps) {
  const st = Z.state, ZG = Z.Game, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { mode: "classic", startDepth: 13 });
  ZG.input.reset();
  const out = [];
  let warden = false, through = 0;
  for (let i = 0; i < steps; i++) {
    st.lives = Z.C.START_LIVES;
    replay(ZG.input, i);
    ZG.update(ZDT);
    let h = 2166136261 >>> 0;
    const mix = v => { h = Math.imul(h ^ ((v * 1e6) | 0), 16777619) >>> 0; };
    mix(st.level); mix(st.wellIndex); mix(st.score); mix(st.spawn.timer); mix(st.spawn.remaining);
    mix(st.skimmer ? st.skimmer.lane : -1); mix(st.shots.length); mix(st.enemies.length);
    for (const e of st.enemies) {
      mix(e.lane); mix(e.depth); mix(e.dead ? 1 : 0); mix(e.aloft ? 1 : 0);
      for (const ch of e.constructor.name) mix(ch.charCodeAt(0));
      if (e instanceof Z.Warden) warden = true;
    }
    through = Math.max(through, st.tally.kills + st.enemies.length);
    out.push(h);
  }
  return { out, warden, level: st.level, through };
}
{
  installSeed(SEED);
  const Z = H.buildGame({ mutate: [[ROW, ""]] });
  H.eq(J(Z.C.SPAWN_SCHEDULE_OVERDRIVE), J([{ level: 6, kind: "reaver" }]),
       "fixture: the mutated build has no Warden row");
  const STEPS = 5000;
  const a = classicHashes(X, STEPS), b = classicHashes(Z, STEPS);
  let diff = -1;
  for (let i = 0; i < STEPS && diff < 0; i++) if (a.out[i] !== b.out[i]) diff = i;
  H.eq(a.out.length, STEPS, "the Classic run lasted 5,000 steps");
  H.eq(diff, -1, `⛔ a CLASSIC run at Start Depth 13 hashes IDENTICALLY, step by step for ${STEPS} steps, to a ` +
       `build with the Warden's row mutated out (first difference at ${diff})`);
  H.assert(!a.warden && a.level >= 13 && a.through >= 20,
           `⛔ and no Warden was ever on its board, at L${a.level} with ${a.through} enemies through it`);

  // Non-vacuity: the same mutation DOES move an Overdrive run at the same depth.
  const od = session(X, 3000), oz = session(Z, 3000);
  let odDiff = -1;
  for (let i = 0; i < 3000 && odDiff < 0; i++) if (od.out[i] !== oz.out[i]) odDiff = i;
  H.assert(od.wardens > 0 && odDiff >= 0,
           `⛔ while the same mutation moves an Overdrive run at Start Depth 13, which does release Wardens ` +
           `(first difference at step ${odDiff})`);
}

H.report("test-cs013-p3.js");

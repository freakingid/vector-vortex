// test-cs007-p5.js — CS007's closing phase: GDD §17 items 1 and 12 against THE
// ESCALATING RUN — a board that starts at level 1 and climbs through GDD §8.1's
// introduction boundaries by being played, with the heat clock live under it.
//
// ⛔ WHY THIS IS A FIFTH FILE AND NOT AN EDIT TO THE OTHER FOUR. `STATUS.md`:
// "Four soaks, and they prove different things on different boards… A future
// changeset extends the pattern with a fifth file rather than widening a closed
// one." test-cs003-p5.js is the Vaulter soak (level 2), test-cs004-p5.js the
// three-kind band (level 7), test-cs005-p5.js the full six-kind board (23), and
// test-cs006-p5.js owns the Dive (23). ⛔ Every one of them PINS a level and
// runs one band. This file is the only one that does not: it owns the run that
// MOVES between bands, which is the thing CS007 built.
//
// It extends test-cs006-p5.js rather than restating it — the same hash mixer,
// the same recorded input list, the same NaN walker, the same wall-to-wall pin,
// the same fixture shapes — so a reader who knows one knows all five. ⛔ It does
// NOT restate the other four's lane bounds, their lattice cases, CS005's
// per-well §17 item 3 soak or CS006's Dive coverage; those are their
// changesets' claims about their own boards.
//
// ⛔ SEVEN TRAPS IN THE FIXTURES.
//  1. ⛔ THIS FILE ARMS NO `C` FIXTURE AT ALL, AND THE ABSENCE IS THE FIXTURE.
//     The other four raise C.ENEMY_CONCURRENT to C.ENEMY_CAP to keep a board
//     busy. Doing that here would flatten the concurrency ladder (3 at 1-5, 4
//     from 6 …, GDD §8) — which is one of the things under test. So the shipped
//     curve runs untouched, and the whole of `C` is serialized before the first
//     case and compared after the last one to say so.
//  2. ⛔ THE HASHED RUN MUST CROSS AN INTRODUCTION BOUNDARY. Ten thousand ticks
//     of a run that never left level 1 would be a determinism claim about a
//     schedule that never fired and a clock that is exactly 0. It is asserted to
//     have reached level 5 or better — past the Carrier (3) and the Weaver (5).
//  3. ⛔ HEAT IS IN THE HASH. heat() and all seven accessors of GDD §8 are
//     folded in every tick, so a retuned clamp moves this hash and a `state`
//     comparison alone could not. ⚠ It therefore records NO baseline number:
//     the claim is self-consistency (one process, two processes, a different
//     seed), which needs no recording and cannot be laundered. CS007's
//     re-record budget is spent at three and this file does not spend a fourth.
//  4. ⛔ THE ESCALATION CLAIM IS ABOUT A LEVEL THE RUN REACHED BY PLAYING.
//     test-cs007-p3.js owns the pinned-band form — it tops up `spawn.remaining`
//     so the level cannot move and asserts each band's set. That is the
//     schedule's arithmetic. This file asserts the same schedule as a property
//     of a run that clears wells: the minimum level at which each of the seven
//     kinds was ever SEEN ON THE BOARD is at or above its scheduled level.
//  5. ⛔ EACH LADDER RUN STARTS ONE LEVEL BELOW ITS ROW, so both halves of the
//     boundary — absent below it, present at or after it — come out of ONE
//     continuous run rather than two pinned ones. The run below the line is what
//     gives "never before it" its teeth; without it a run started AT the row's
//     level satisfies the claim by construction.
//  6. ⛔ A PASSIVE RUN AT LEVEL 1 MEETS ONLY VAULTERS. GDD §8.1 releases nothing
//     else there, and a passive player never clears a well (measured again
//     below: every passive run dies at the level it started on), so the level
//     never moves. The passive runs are therefore armed at each band start —
//     the level-9 one meets Weavers, Thorns, bolts and Drifters, which is what
//     makes "a run that never presses fire still terminates" a stronger claim
//     than CS006 could make it.
//  7. ⛔ A RUN'S LAST WELL ENDS IN A DEATH, NOT A CLEAR. The quota claim is
//     therefore about wells the run LEFT BY CLEARING; the tick cap covers every
//     well entered, the unfinished last one included, because a stall is a well
//     that neither clears nor kills you.
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const ROOT = path.join(__dirname, "..");
const SEED = 20260831;
const TICKS = 10000;        // GDD §17 item 1
const RUNS = 20;            // GDD §17 item 12, at a closing phase's budget
const RUN_CAP = 30000;      // ticks before a run is declared stuck
const PIN_TICKS = 300;      // test-cs005-p5.js's wall-to-wall pin period
const LADDER_CAP = 20000;   // ticks one boundary run may spend looking
const HASH_ONLY = process.argv.includes("--hash-only");

// ⛔ A WELL THAT TAKES LONGER THAN THIS IS STALLED, and 6,000 ticks is 100 s of
// simulation. PLANNED-FEATURES-CS007.md §4.2's measured stall was the level
// never leaving 1 across 18,000 ticks; the worst well in this file's own soak is
// 2,435 (seed 22041224, level 5). The bound separates the two by roughly 2.5x in
// both directions, which is what a stall GATE wants — it is not a tuning target,
// and ⚠ unlike test-cs006-p5.js's dive-lives bound it is deliberately slack.
const WELL_TICK_CAP = 6000;

// GDD §8.1's schedule, WRITTEN OUT rather than read from C.SPAWN_SCHEDULE — a
// test that derived its expectations from the data under test would pass on any
// schedule at all (test-cs007-p3.js's rule, and this file keeps it).
// ⛔ `thorn` and `weaverBolt` are deliberately absent: they are not rows and
// cannot be — a Thorn is laid by its parent and a bolt is fired by one — so the
// level a Thorn may first appear at is the WEAVER's, not its own.
const SCHEDULE = [
  { kind: "vaulter",        level:  1 },
  { kind: "carrierVaulter", level:  3 },
  { kind: "weaver",         level:  5 },
  { kind: "drifter",        level:  9 },
  { kind: "surger",         level: 13 },
  { kind: "carrierDrifter", level: 18 },
  { kind: "carrierSurger",  level: 23 },
];

// ---------------------------------------------------------------------------
// GDD §17 item 1 — determinism, with the clock and the schedule inside it
// ---------------------------------------------------------------------------

// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. A local copy, as all four earlier soaks' are: a shared mixer would make
// one function five phases' to keep stable.
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

function num(v) { return typeof v === "number" ? v : -1; }

// THE recorded input list, character for character the other four soaks'.
// ⛔ NO "r", NO "w", NO DIGITS — asserted below against this very function.
function replay(input, i) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (i % 13 === 0)  input.keyDown(" ");
  if (i % 13 === 9)  input.keyUp(" ");
  if (i % 311 === 0) input.keyDown("x");
  if (i % 311 === 4) input.keyUp("x");
}

// test-cs005-p5.js's driver: the recorded list plus a wall-to-wall pin, so the
// rim is swept end to end and a parked enemy is eventually met. ⛔ Three of the
// six roster classes park rather than hunt (`STATUS.md`, Known issues), and the
// repair is the DRIVER and never the build. Still a pure function of the tick
// index, so a failing seed is still replayable.
function replayWide(input, i) {
  replay(input, i);
  if (i % PIN_TICKS === 0) input.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
}

// ⛔ ROTATION ONLY, AND NEVER FIRE — test-cs006-p5.js's, unchanged.
function replayPassive(input, i) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (i % PIN_TICKS === 0) input.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
}

const PHASES = ["climb", "hold", "retreat", "birth", "ride", "cross",
                "telegraph", "discharge"];
const DIVE_PHASES = ["grace", "descent"];

// The seven accessors of GDD §8, in C's order, each with the base it leaves at
// level 1 and the endpoint it walks to at C.HEAT_FULL_LEVEL. ⛔ The pair is what
// the clamp assertion reads; `climbMult`'s base is the identity 1 and is the one
// row with no base constant in C, which is itself the rule that every entity
// climb is `C.X * climbMult()`.
function accessorRows(C) {
  return [
    { name: "spawnInterval",    base: C.SPAWN_INTERVAL,     clamp: C.SPAWN_INTERVAL_MIN },
    { name: "enemyConcurrent",  base: C.ENEMY_CONCURRENT,   clamp: C.ENEMY_CONCURRENT_MAX },
    { name: "climbMult",        base: 1,                    clamp: C.CLIMB_MULT_MAX },
    { name: "vaultInterval",    base: C.VAULT_INTERVAL,     clamp: C.VAULT_INTERVAL_MIN },
    { name: "vaultRimInterval", base: C.VAULT_RIM_INTERVAL, clamp: C.VAULT_RIM_INTERVAL_MIN },
    { name: "surgeInterval",    base: C.SURGE_INTERVAL,     clamp: C.SURGE_INTERVAL_MIN },
    { name: "weaverApex",       base: C.WEAVER_APEX,        clamp: C.WEAVER_APEX_MAX },
  ];
}

// What the last hashRun() actually did, so the parent can assert the hashed run
// was not a quiet one — and, trap 2, that it crossed a boundary.
const lastRun = {
  maxEnemies: 0, restarts: 0, level: 0, heatMax: 0,
  kinds: null,
};

function hashRun(gameSeed) {
  installSeed(gameSeed);
  const X = H.buildGame();
  const C = X.C, G = X.Game, st = X.state;
  const DT = C.FIXED_DT;
  const ACC = accessorRows(C);

  const cargoNames = Object.keys(X.CARGO);

  // ⛔ NO ARMING. The run starts where a player starts — level 1, the Vaulter
  // band, heat exactly 0 — and everything it meets it reached by clearing a
  // well. That is the difference between this file and the four before it.
  G.reset();
  X.startGame(gameSeed);

  let h = 2166136261 >>> 0;
  let restarts = 0;
  lastRun.maxEnemies = 0;
  lastRun.level = 0;
  lastRun.heatMax = 0;
  lastRun.kinds = new Set();

  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(DT);

    // The stop, restarted deterministically so the rest of the ticks are live
    // ones. ⛔ NOT re-armed — startGame() puts the level back to 1, and starting
    // over at 1 is exactly what this file is about.
    if (st.screen === "gameover") {
      restarts++;
      X.startGame((gameSeed + restarts * 7919) >>> 0);
    }

    h = mix(h, st.time);
    h = mix(h, st.level);
    h = mix(h, st.wellIndex);
    h = mix(h, st.seed);
    h = mix(h, st.lives);
    h = mix(h, st.invulnTime);
    h = mix(h, st.purgeUses);
    h = mix(h, st.spawn.timer);
    h = mix(h, st.spawn.remaining);

    // ⛔ THE CLOCK ITSELF, AND EVERY VALUE DERIVED FROM IT — trap 3. `st.level`
    // above says which level the run is on; these say what the level MEANT.
    // Read through the shipped zero-argument form, which is state.level, so a
    // second clock would show up here as a divergence between the two.
    h = mix(h, X.heat(st.level));
    for (let a = 0; a < ACC.length; a++) h = mix(h, X[ACC[a].name]());
    if (X.heat(st.level) > lastRun.heatMax) lastRun.heatMax = X.heat(st.level);

    h = mix(h, st.dive.active ? 1 : 0);
    h = mix(h, DIVE_PHASES.indexOf(st.dive.phase));
    h = mix(h, st.dive.timer);
    h = mix(h, st.dive.depth);
    h = mix(h, st.skimmer ? st.skimmer.lane : -1);
    h = mix(h, st.skimmer && st.skimmer.dead ? 1 : 0);

    h = mix(h, st.shots.length);
    for (let k = 0; k < st.shots.length; k++) {
      h = mix(h, st.shots[k].lane);
      h = mix(h, st.shots[k].t);
    }

    if (st.enemies.length > lastRun.maxEnemies) lastRun.maxEnemies = st.enemies.length;
    if (st.level > lastRun.level) lastRun.level = st.level;
    h = mix(h, st.enemies.length);
    for (let k = 0; k < st.enemies.length; k++) {
      const e = st.enemies[k];
      const kind = kindOf(X, e);
      if (kind) lastRun.kinds.add(kind);

      h = mix(h, e.lane);
      h = mix(h, e.depth);
      h = mix(h, e.dead ? 1 : 0);
      h = mix(h, e.hopping ? 1 : 0);
      h = mix(h, num(e.hopTime));
      h = mix(h, num(e.hopTimer));
      h = mix(h, num(e.dir));
      h = mix(h, cargoNames.indexOf(e.cargo));
      h = mix(h, PHASES.indexOf(e.phase));
      h = mix(h, num(e.holdTimer));
      h = mix(h, e.fired ? 1 : 0);
      h = mix(h, e.thorn ? 1 : 0);
      h = mix(h, e.anchored ? 1 : 0);
      h = mix(h, num(e.rideTimer));
      h = mix(h, num(e.crossTime));
      h = mix(h, num(e.crossFrom));
      h = mix(h, num(e.crossDelta));
      h = mix(h, num(e.surgeTimer));
      h = mix(h, num(e.killDepth));
    }
  }
  lastRun.restarts = restarts;
  return h >>> 0;
}

// Which SCHEDULE row an entity on the board came from, or null for the two kinds
// that are not rows. ⛔ THE THREE CARRIER VARIANTS ARE TOLD APART BY `cargo` and
// never by class: GDD §6.2's three rows are one class with three cargoes, so a
// classifier that stopped at `instanceof Carrier` could not say which row put it
// there — and rows 2, 6 and 7 of the schedule are exactly that distinction.
function kindOf(X, e) {
  if (e instanceof X.Carrier) {
    if (e.cargo === "vaulter") return "carrierVaulter";
    if (e.cargo === "drifter") return "carrierDrifter";
    if (e.cargo === "surger") return "carrierSurger";
    return "carrier:" + e.cargo;             // an unknown cargo fails loudly below
  }
  if (e instanceof X.WeaverBolt) return null;  // fired, never scheduled
  if (e instanceof X.Weaver) return "weaver";
  if (e instanceof X.Thorn) return null;       // laid, never scheduled
  if (e instanceof X.Drifter) return "drifter";
  if (e instanceof X.Surger) return "surger";
  if (e instanceof X.Vaulter) return "vaulter";
  return "?" + (e && e.constructor && e.constructor.name);
}

if (HASH_ONLY) {
  process.stdout.write(String(hashRun(SEED)));
  process.exit(0);
}

// ⛔ THE FORBIDDEN-KEY LIST, CHECKED AGAINST THE FUNCTIONS rather than trusted.
// "r" restarts on a time-derived seed, "w" cycles the well out from under the
// level clock, and a digit is a debug spawn — which would put a kind on a board
// GDD §8.1 does not release it to, and the escalation section below is exactly
// the assertion that would go quietly green on it.
// ⚠ "t" and "e" are NOT here and must not be: CS007 P4's two telemetry keys are
// the first bench keys that touch nothing in the simulation, which is why the
// four closed soaks' lists are right without them.
const FORBIDDEN = ["r", "w", "0", "1", "2", "3", "4", "5", "6"];
const pressed = new Set();
const recorder = {
  keyDown: k => pressed.add(k),
  keyUp: k => pressed.add(k),
  mouseMove: () => {},
};
for (let i = 0; i < TICKS; i++) { replay(recorder, i); replayWide(recorder, i); replayPassive(recorder, i); }
H.assert(pressed.size > 0, "the recorded input lists press something at all");
for (const k of FORBIDDEN) {
  H.assert(!pressed.has(k),
           `⛔ no driver in this file ever presses "${k}" — a digit is a debug spawn, and a ` +
           `debug spawn is a kind on a board GDD §8.1 did not release it to`);
}
H.assert(pressed.has(" "),
         "and the two firing drivers really do press fire — the passive driver's claim " +
         "below is a contrast, not the only thing measured");

const hashA = hashRun(SEED);
const hashB = hashRun(SEED);
H.eq(hashA, hashB,
     `${TICKS} ticks of the recorded input list hash identically in one process, with ` +
     `heat() and all seven accessors folded in`);

const child = execFileSync(process.execPath, [__filename, "--hash-only"],
  { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
H.eq(Number(child), hashA, `${TICKS} ticks hash identically across two processes`);

// ⛔ SNAPSHOT THE HASHED RUN'S BOOKKEEPING BEFORE THE DIFFERENT-SEED CASE.
// test-cs007-p1.js's repair, adopted from the start here: `lastRun` is
// overwritten by every hashRun(), and the line below runs SEED + 1.
const hashed = { maxEnemies: lastRun.maxEnemies, restarts: lastRun.restarts,
                 level: lastRun.level, heatMax: lastRun.heatMax,
                 kinds: new Set(lastRun.kinds) };

H.assert(hashRun(SEED + 1) !== hashA, "a different seed produces a different hash");

// ⛔ AND THE HASHED RUN ESCALATED — trap 2. Without these, ten thousand ticks of
// determinism is a claim about a clock that is exactly 0 and a schedule that
// never fired.
H.assert(hashed.maxEnemies > 0, "the hashed run had enemies on the board");
H.assert(hashed.restarts > 0, "and reached the game-over stop at least once");
H.assert(hashed.level >= 5,
         `⛔ AND IT CROSSED AN INTRODUCTION BOUNDARY — reached level ${hashed.level}, past ` +
         `the Carrier at 3 and the Weaver at 5. A run pinned at level 1 would hash a ` +
         `heat of exactly 0 and a one-entry eligible set for all ${TICKS} ticks`);
H.assert(hashed.heatMax > 0,
         `⛔ and heat left 0 inside the window (max ${hashed.heatMax.toFixed(4)}) — the ` +
         `seven accessors folded into the hash therefore moved off their level-1 bases`);
H.assert(hashed.kinds.has("vaulter") && hashed.kinds.has("carrierVaulter") &&
         hashed.kinds.has("weaver"),
         `and the kinds the boundary released actually reached the board ` +
         `(saw ${[...hashed.kinds].sort().join(", ")})`);

// ---------------------------------------------------------------------------
// everything below shares one build
// ---------------------------------------------------------------------------

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const ACC = accessorRows(C);

// ⛔ TRAP 1 — THE WHOLE OF `C`, BEFORE ANY CASE RUNS. This file arms no config
// fixture, and this is the assertion that says so rather than the comment.
const C_BEFORE = JSON.stringify(C);

// First NaN anywhere reachable from `state`, as a path, or null. Functions are
// skipped (state.rng is a live closure, and calling it would consume a draw).
function firstNaN(v, label, depth) {
  if (depth > 6) return null;
  if (typeof v === "number") return Number.isNaN(v) ? label : null;
  if (v === null || typeof v !== "object") return null;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const hit = firstNaN(v[i], `${label}[${i}]`, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  for (const k of Object.keys(v)) {
    if (typeof v[k] === "function") continue;
    const hit = firstNaN(v[k], `${label}.${k}`, depth + 1);
    if (hit) return hit;
  }
  return null;
}

// ⛔ THE TWO GLOBAL LEDGERS, FILLED BY EVERY LIVE RUN IN THIS FILE and asserted
// once at the end. `firstSeen` is the escalation claim (trap 4); `range` is the
// clamp claim, sampled from the real accessors on a live board rather than
// evaluated as arithmetic — test-cs007-p2.js owns the arithmetic form.
const firstSeen = {};                 // kind -> lowest level it was ever seen at
const range = {};                     // accessor -> { min, max } observed live
for (const a of ACC) range[a.name] = { min: Infinity, max: -Infinity };
let strangeKind = null;               // a class the classifier could not name

function observe() {
  for (let k = 0; k < state.enemies.length; k++) {
    const kind = kindOf(X, state.enemies[k]);
    if (kind === null) continue;
    if (kind[0] === "?" || kind.indexOf("carrier:") === 0) {
      strangeKind = strangeKind || `${kind} at level ${state.level}`;
      continue;
    }
    if (firstSeen[kind] === undefined || state.level < firstSeen[kind]) {
      firstSeen[kind] = state.level;
    }
  }
  for (let a = 0; a < ACC.length; a++) {
    const v = X[ACC[a].name]();
    const r = range[ACC[a].name];
    if (v < r.min) r.min = v;
    if (v > r.max) r.max = v;
  }
}

// ---------------------------------------------------------------------------
// GDD §17 item 12 — RUNS seeded runs to the stop, every one from level 1
// ---------------------------------------------------------------------------
//
// ⛔ NO ARMING AND NO CONFIG FIXTURE (trap 1). These are twenty played runs of
// the shipped game: level 1, heat 0, a one-entry eligible set, three concurrent
// enemies, climbing until the player runs out of lives.

let threw = null, stuck = null;
let soakMaxEnemies = 0, soakMaxShots = 0, soakNaN = null, soakTopLevel = 0;
let wellsEntered = 0, wellsCleared = 0;
let quotaUnspent = null, wellStall = null, worstWellTicks = 0, worstWellWhere = "";
let blockedBeats = 0, blockedByNonThreat = null, blockedWithThorn = 0;

for (let r = 0; r < RUNS && !threw && !stuck; r++) {
  const seed = (SEED + r * 104729) >>> 0;
  try {
    G.reset();
    X.startGame(seed);

    let ticks = 0, wellTicks = 0, levelNow = state.level, sawQuotaSpent = false;
    wellsEntered++;

    while (state.screen !== "gameover" && ticks < RUN_CAP) {
      const blockedBefore = state.tally.spawnBlockedTicks;
      replayWide(G.input, ticks);
      G.update(DT);
      ticks++;
      wellTicks++;
      observe();

      // ⛔ P1'S CLAIM, END TO END ON A BOARD P1 COULD NOT REACH. The release
      // budget counts THREATS, so a standing Thorn no longer holds a slot; the
      // observable consequence is that the quota always finishes spending.
      if (state.spawn.remaining === 0) sawQuotaSpent = true;

      // ⛔ AND THE SHARP FORM OF P1'S CLAIM, ON EVERY BLOCKED BEAT THE SOAK
      // PRODUCES. `spawnBlockedTicks` is CS007 P4's column and it rises at both
      // of the spawner's refusals; a beat that got there is one the spawner
      // WANTED. The threat count is recomputed here off GDD §6.5's contract
      // field — the same field `wellCleared()` reads, and NOT the build's own
      // threatCount(), which would agree with itself under any definition.
      // ⛔ A refusal is legal only if THREATS are at the release budget or
      // ENTITIES are at the readability ceiling. Before the split a Thorn on the
      // board could refuse a beat with neither true, which is the stall.
      // ⚠ Safe to read after update(): the spawner runs after the end-of-frame
      // filters, and the only thing below it — startDive() — cannot fire on a
      // blocked beat, because a blocked beat leaves quota unspent.
      if (state.tally.spawnBlockedTicks > blockedBefore) {
        blockedBeats++;
        let threats = 0, thorns = 0;
        for (let k = 0; k < state.enemies.length; k++) {
          const e = state.enemies[k];
          if (e.dead) continue;
          if (e.blocksClear) threats++; else thorns++;
        }
        if (thorns > 0) blockedWithThorn++;
        if (!(threats >= X.spawnLimit() || state.enemies.length >= C.ENEMY_CAP)) {
          blockedByNonThreat = blockedByNonThreat ||
            `seed ${seed} tick ${ticks}: ${threats} threats and ${thorns} non-threats ` +
            `refused a beat at a budget of ${X.spawnLimit()}`;
        }
      }

      if (state.level !== levelNow) {
        wellsCleared++;
        if (!sawQuotaSpent) {
          quotaUnspent = quotaUnspent ||
            `seed ${seed}: level ${levelNow} advanced with quota unspent`;
        }
        if (wellTicks > worstWellTicks) {
          worstWellTicks = wellTicks;
          worstWellWhere = `seed ${seed}, level ${levelNow}`;
        }
        if (wellTicks > WELL_TICK_CAP) {
          wellStall = wellStall || `seed ${seed}: level ${levelNow} took ${wellTicks} ticks`;
        }
        levelNow = state.level;
        wellTicks = 0;
        sawQuotaSpent = false;
        wellsEntered++;
      }

      if (state.enemies.length > soakMaxEnemies) soakMaxEnemies = state.enemies.length;
      if (state.shots.length > soakMaxShots) soakMaxShots = state.shots.length;
      if (!soakNaN) soakNaN = firstNaN(state, "state", 0);
    }

    // Trap 7: the last well ended in a death rather than a clear, so it makes no
    // quota claim — but it still may not have STALLED, and a stall is precisely
    // a well that neither clears nor kills.
    if (wellTicks > worstWellTicks) {
      worstWellTicks = wellTicks;
      worstWellWhere = `seed ${seed}, level ${levelNow} (the well it died in)`;
    }
    if (wellTicks > WELL_TICK_CAP) {
      wellStall = wellStall ||
        `seed ${seed}: level ${levelNow} took ${wellTicks} ticks and never ended`;
    }
    if (state.screen !== "gameover") stuck = `seed ${seed} after ${ticks} ticks`;
    if (state.level > soakTopLevel) soakTopLevel = state.level;
  } catch (err) {
    threw = `seed ${seed}: ${err && err.message}`;
  }
}

H.assert(!threw, `⛔ ${RUNS} seeded runs to game over throw nothing (${threw})`);
H.assert(!stuck, `every run reached the stop inside ${RUN_CAP} ticks (${stuck})`);
H.assert(!soakNaN, `no NaN in state across the whole soak (${soakNaN})`);
H.assert(soakMaxEnemies <= C.ENEMY_CAP,
         `the enemy array stays under ENEMY_CAP across the soak (peak ${soakMaxEnemies})`);
H.assert(soakMaxShots <= C.SHOT_MAX,
         `the shot array stays under SHOT_MAX across the soak (peak ${soakMaxShots})`);
H.eq(strangeKind, null,
     `⛔ every entity on every board is one of GDD §8.1's seven kinds, a Thorn or a bolt — ` +
     `an unclassifiable one would silently drop out of the escalation ledger (${strangeKind})`);

// ⛔ AND THE RUNS ESCALATED. A soak of twenty level-1 deaths would satisfy
// everything above and prove nothing about a schedule or a clock.
H.assert(soakTopLevel > 1,
         `⛔ the soak climbed out of level 1 by clearing wells (top level ${soakTopLevel})`);
H.assert(wellsCleared >= RUNS,
         `⛔ and cleared at least one well per run on average (${wellsCleared} cleared of ` +
         `${wellsEntered} entered) — the escalation is played, not armed`);

// ⛔ NO WELL STALLS — P1's claim, verified end to end. Before the threats split a
// well whose only survivors were standing Thorns never released another enemy,
// never spent its quota and never cleared.
H.assert(!wellStall,
         `⛔ no well in the soak ran past ${WELL_TICK_CAP} ticks without clearing or ` +
         `killing the player (${wellStall})`);
H.assert(!quotaUnspent,
         `⛔ and every well the run LEFT BY CLEARING had spent its whole quota first — ` +
         `spawn.remaining reached 0 (${quotaUnspent})`);
H.assert(worstWellTicks > 0 && worstWellTicks <= WELL_TICK_CAP,
         `⛔ the worst well measured ${worstWellTicks} ticks (${worstWellWhere}), inside the ` +
         `${WELL_TICK_CAP} gate — and greater than zero, so the gate saw wells at all`);
H.assert(!blockedByNonThreat,
         `⛔ EVERY blocked beat in the soak was blocked by THREATS at the release budget or ` +
         `ENTITIES at C.ENEMY_CAP — never by something that blocks neither, which is what a ` +
         `standing Thorn used to do (${blockedByNonThreat})`);
H.assert(blockedBeats > 0 && blockedWithThorn > 0,
         `⛔ and the soak produced blocked beats WITH a non-threat standing (${blockedWithThorn} ` +
         `of ${blockedBeats}) — without those the assertion above is a claim about a board ` +
         `that never had a Thorn on it`);

// ---------------------------------------------------------------------------
// ⛔ THE ESCALATION IS OBSERVABLE — GDD §1.1 P3, ONE BOUNDARY PER RUN
// ---------------------------------------------------------------------------
//
// One run per schedule row, started ONE LEVEL BELOW the row (trap 5) and driven
// until an entity of that row's kind reaches the board. The run therefore spends
// real ticks on a board where the kind must NOT appear and then crosses the line
// by clearing a well — which is the player's experience of §8.1 rather than the
// schedule's arithmetic.
//
// ⛔ Row 1 is the Vaulter at level 1, which has no level below it; its "below"
// half is the twenty runs above, every one of which began at level 1.
function ladderRun(row) {
  const start = Math.max(1, row.level - 1);
  const seed = (SEED + row.level * 7919) >>> 0;
  G.reset();
  X.startGame(seed);
  const arm = () => {
    state.level = start;
    state.wellIndex = (start - 1) % X.WELLS.length;
    X.enterWell();
  };
  if (start > 1) arm();

  const out = { firstAt: null, ticks: 0, belowTicks: 0, belowArrivals: 0,
                topLevel: state.level, restarts: 0 };
  const seen = new Set(state.enemies);
  for (let i = 0; i < LADDER_CAP && out.firstAt === null; i++) {
    replayWide(G.input, i);
    G.update(DT);
    out.ticks = i + 1;
    observe();
    if (state.level > out.topLevel) out.topLevel = state.level;

    const below = state.level < row.level;
    if (below) out.belowTicks++;
    for (let k = 0; k < state.enemies.length; k++) {
      const e = state.enemies[k];
      if (!seen.has(e)) { seen.add(e); if (below) out.belowArrivals++; }
      if (out.firstAt === null && kindOf(X, e) === row.kind) out.firstAt = state.level;
    }

    // ⛔ A death restarts AND RE-ARMS: startGame() puts the level back to 1, and
    // a boundary run that finished its budget at level 1 would report an absence
    // that means nothing.
    if (state.screen === "gameover") {
      out.restarts++;
      X.startGame((seed + out.restarts * 7919) >>> 0);
      if (start > 1) arm();
    }
  }
  return out;
}

for (const row of SCHEDULE) {
  const L = ladderRun(row);
  H.assert(L.firstAt !== null,
           `⛔ ${row.kind} reached the board at all inside ${LADDER_CAP} ticks — an absent ` +
           `kind would make its schedule assertion vacuous (started at ${Math.max(1, row.level - 1)})`);
  H.assert(L.firstAt !== null && L.firstAt >= row.level,
           `⛔ and the FIRST ${row.kind} appeared at level ${L.firstAt}, at or after GDD §8.1's ` +
           `level ${row.level} — never before it`);
  if (row.level > 1) {
    H.assert(L.belowArrivals >= 5,
             `⛔ and the run spent ${L.belowTicks} ticks and ${L.belowArrivals} arrivals BELOW ` +
             `level ${row.level} first, so "never before it" is a measured absence rather than ` +
             `a board that never existed. ⚠ The floor is 5 and the measured worst is 10 ` +
             `(carrierVaulter): a non-vacuity guard pinned to its own measurement goes red on ` +
             `any innocuous retune, which is the opposite of what it is for`);
  }
}

// ⛔ AND THE LEDGER OVER EVERY LIVE BOARD IN THIS FILE. Twenty played runs from
// level 1 plus seven boundary runs; the minimum level each kind was ever seen at
// is the strong form, because a kind released early anywhere in the file lands
// here even if the run that did it was looking for something else.
for (const row of SCHEDULE) {
  H.assert(firstSeen[row.kind] !== undefined,
           `⛔ ${row.kind} was seen on a live board somewhere in this file`);
  H.assert(firstSeen[row.kind] >= row.level,
           `⛔ and the LOWEST level it was ever seen at across every run in this file is ` +
           `${firstSeen[row.kind]}, at or above GDD §8.1's ${row.level} (GDD §1.1 P3 — ` +
           `"escalation you can name", as an assertion)`);
}
H.eq(Object.keys(firstSeen).length, SCHEDULE.length,
     "⛔ and exactly the seven scheduled kinds were ever seen — `thorn` and `weaverBolt` " +
     "are classified as not-rows, because they are laid and fired rather than released");
H.eq(firstSeen.vaulter, 1,
     "⛔ and the Vaulter's own level is 1 — the run starts inside the schedule, not before it");

// ---------------------------------------------------------------------------
// ⛔ EVERY DERIVED VALUE STAYS INSIDE ITS CLAMP ON A LIVE BOARD
// ---------------------------------------------------------------------------
//
// test-cs007-p2.js asserts this as an ARITHMETIC property over levels 1..200,
// evaluated on the accessors directly. This is the other half: the values the
// twenty-seven live runs above actually produced, read through the shipped
// zero-argument call — which goes through `state.level`, the one clock.
for (const a of ACC) {
  const lo = Math.min(a.base, a.clamp);
  const hi = Math.max(a.base, a.clamp);
  const r = range[a.name];
  H.assert(r.min >= lo && r.max <= hi,
           `⛔ ${a.name}() stayed inside [${lo}, ${hi}] across every live run ` +
           `(observed ${r.min} … ${r.max})`);
  H.assert(r.min !== Infinity, `and ${a.name}() was sampled at all`);
}

// ⛔ AND THE SAMPLES ARE NOT ALL THE LEVEL-1 BASE. A run that never left level 1
// would satisfy every clamp above with one value each, which is the vacuous
// pass this assertion exists to deny.
let moved = 0;
for (const a of ACC) if (range[a.name].min !== range[a.name].max) moved++;
H.assert(moved >= 6,
         `⛔ at least six of the seven derived values were observed to MOVE off their ` +
         `level-1 base during play (${moved} of ${ACC.length} did)`);
H.assert(range.enemyConcurrent.max > C.ENEMY_CONCURRENT,
         `⛔ and the concurrency ladder took its first nameable step — GDD §8's "3 at ` +
         `levels 1-5, 4 from 6" (observed up to ${range.enemyConcurrent.max})`);

// ---------------------------------------------------------------------------
// ⛔ A RUN THAT NEVER PRESSES FIRE STILL TERMINATES — AND IT MEETS THE SCHEDULE
// ---------------------------------------------------------------------------
//
// ⚠ It terminates by DYING, not by diving: a well clears on quota-spent AND
// nothing that blocks the clear alive, and a player who never fires kills
// nothing, so the level is unmoved at the stop on every seed. That was measured
// at CS006's close and is measured again here on seven different boards.
//
// ⛔ TRAP 6 — ONE PASSIVE RUN PER BAND START. A passive run at level 1 meets
// Vaulters and nothing else, so CS006's single passive run had to be armed at 23
// to mean anything. Armed across the whole schedule instead, the level-5 run
// meets Weavers, Thorns and bolts and the level-9 run meets Drifters — hazards
// that kill a player who is not shooting, on the boards §8.1 releases them to.
const BAND_STARTS = SCHEDULE.map(r => r.level);
let passiveStuck = null, passiveMoved = null, passiveWorst = 0;
const passiveSaw = { weaver: false, thorn: false, bolt: false, drifter: false, surger: false };

for (const L of BAND_STARTS) {
  const seed = (SEED + L * 31337) >>> 0;
  G.reset();
  X.startGame(seed);
  if (L > 1) {
    state.level = L;
    state.wellIndex = (L - 1) % X.WELLS.length;
    X.enterWell();
  }
  let ticks = 0;
  while (state.screen !== "gameover" && ticks < RUN_CAP) {
    replayPassive(G.input, ticks);
    G.update(DT);
    ticks++;
    observe();
    for (let k = 0; k < state.enemies.length; k++) {
      const e = state.enemies[k];
      if (e instanceof X.WeaverBolt) passiveSaw.bolt = true;
      else if (e instanceof X.Weaver) passiveSaw.weaver = true;
      else if (e instanceof X.Thorn) passiveSaw.thorn = true;
      else if (e instanceof X.Drifter) passiveSaw.drifter = true;
      else if (e instanceof X.Surger) passiveSaw.surger = true;
    }
  }
  if (state.screen !== "gameover") passiveStuck = passiveStuck || `level ${L}, seed ${seed}`;
  if (state.level !== L) passiveMoved = passiveMoved || `level ${L} -> ${state.level}`;
  if (ticks > passiveWorst) passiveWorst = ticks;
}

H.assert(!passiveStuck,
         `⛔ a run that never presses fire reaches the stop inside ${RUN_CAP} ticks at EVERY ` +
         `band start — a passive stall is the shape of every stall this project has found ` +
         `(${passiveStuck})`);
H.assert(passiveWorst > 0 && passiveWorst < RUN_CAP,
         `and the slowest of them got there in ${passiveWorst} ticks, not on the cap`);
H.assert(!passiveMoved,
         `⚠ and none of them cleared a well — a passive player kills nothing, so the Dive ` +
         `cannot rescue the run and the stop is what ends it (${passiveMoved})`);
H.assert(passiveSaw.weaver && passiveSaw.thorn && passiveSaw.bolt && passiveSaw.drifter,
         `⛔ and the passive runs met Weavers, Thorns, bolts and Drifters — the claim is ` +
         `stronger than CS006's because the schedule puts them on the board ` +
         `(${JSON.stringify(passiveSaw)})`);

// ---------------------------------------------------------------------------
// ⛔ THE FIXTURES GO BACK, AND THEY ARE ASSERTED BACK
// ---------------------------------------------------------------------------
//
// Trap 1 again, from the other end. Every arming in this file is a write to
// `state.level` / `state.wellIndex`, which the next `startGame()` resets on its
// own — so the assertion that matters is that nothing was written into `C`.
H.eq(JSON.stringify(C), C_BEFORE,
     "⛔ THE WHOLE OF C IS BYTE-IDENTICAL to what this file loaded — it arms no config " +
     "fixture at all, because raising C.ENEMY_CONCURRENT the way the other four soaks do " +
     "would flatten the concurrency ladder this file is here to watch");
H.assert(JSON.stringify(X.eligibleKinds(1)) === JSON.stringify(["vaulter"]),
         "⛔ the shipped schedule still answers one entry at level 1 — this file arms boards " +
         "by setting the level and has written nothing into C.SPAWN_SCHEDULE");
H.eq(C.SPAWN_SCHEDULE.length, 7,
     "⛔ and the schedule is the seven spawner-eligible kinds — `thorn` and `weaverBolt` " +
     "are not in it, and never were");
H.eq(C.ENEMY_CONCURRENT, 3, "⛔ and the release budget's level-1 endpoint is the shipped 3");
H.eq(C.ENEMY_CONCURRENT_MAX, 8, "⛔ and its HEAT_FULL_LEVEL endpoint the shipped 8");
H.eq(C.ENEMY_CAP, 16, "⛔ and C.ENEMY_CAP was never touched — it is a readability ceiling");

H.report("test-cs007-p5.js");

// test-cs007-p4.js — CS007 P4: telemetry, the tuning instrument (GDD §15.6,
// §17 item 11).
//
// Asserts what P4 owns: the column contract, the session switch, the ring's
// wrap latch, the CSV's shape, and — the headline — that an instrument which
// perturbs the run it measures is worse than no instrument.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  2. ⛔ CAPTURE IS A SESSION SWITCH ON A MODULE-LEVEL BOOLEAN, so it survives
//     G.reset() and startGame(). Every case that cares sets it explicitly, and
//     the "defaults OFF" case is the one that must read a FRESH BUILD.
//  3. ⛔ THE MONOTONICITY RUN MUST NOT RESTART. A cumulative column resets when
//     a RUN does, so a soak that restarts on game over would make the check
//     fail on the instrument working correctly. §7's run stops itself: update()
//     returns early on "gameover", so state.time freezes and no more rows land.
//  4. The hash runs are two builds, not two passes over one — capture is
//     module state and the point is that a whole run differs in nothing else.
//  5. ⛔ The ring cases push directly with a hand-written state.time. push() is
//     deliberately UNGATED by the switch (21-telemetry.js) so the row builder
//     can be driven without also testing the switch.
//  6. ⛔ §6 reads the BUILT file — the behaviour oracle (GDD §16.2) — WITH THE
//     COMMENTS STRIPPED, and that is the opposite of test-cs007-p3.js §6, which
//     scans it raw. The two want different things: P3 hunted a DELETED CONSTANT,
//     which survives in a comment as a stale pointer; every claim here is about
//     CODE, and this module's header explains at length why it calls no storage
//     API. A raw scan would read the explanation as the violation.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260831;
const TICKS = 10000;        // GDD §17 item 1's window
const CAPTURE_TICKS = 6000; // §7's no-restart capture

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const T = X.Telemetry;
const FIELDS = X.TELEMETRY_FIELDS;
const KINDS = X.TELEMETRY_KINDS;

H.assert(Array.isArray(FIELDS), "TELEMETRY_FIELDS is in the built file");
H.assert(T && typeof T.push === "function", "Telemetry is in the built file");

// THE recorded input list, character for character the four closed soaks'.
// ⛔ NO "r", NO "w", NO DIGITS. ⚠ AND NO "t" AND NO "e" EITHER, which is the
// weaker claim it looks like: the two telemetry keys are the first debug keys
// that CANNOT move a hash, and §5 is what proves it rather than this list.
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

// ---------------------------------------------------------------------------
// §1 — ⛔ GDD §17 ITEM 11: TELEMETRY_FIELDS AND push() AGREE IN LENGTH AND ORDER
// ---------------------------------------------------------------------------
//
// ⛔ DRIVEN, NOT READ. The row comes out of the real push(), so the assertion is
// about what the instrument actually writes and not about a list that happens
// to sit above it. Key ORDER is the half a length check cannot see, and it is
// the half that silently corrupts a CSV: a reordered pair of columns produces a
// file that parses cleanly and means something else.
G.reset();
X.startGame(SEED);
for (let i = 0; i < 600; i++) { replay(G.input, i); G.update(DT); }

T.setEnabled(false);
T.clear();
const row = T.push(state);
const rowKeys = Object.keys(row);

H.eq(rowKeys.length, FIELDS.length,
     `⛔ push() writes exactly ${FIELDS.length} columns — TELEMETRY_FIELDS' length`);
H.eq(rowKeys.join(","), FIELDS.join(","),
     "⛔ GDD §17 item 11 — push()'s row and TELEMETRY_FIELDS agree in LENGTH AND ORDER, " +
     "so the list drives the header and push() drives the data with no drift between them");
for (const f of FIELDS) {
  H.assert(row[f] !== undefined, `the row carries a value for the ${f} column`);
}
H.eq(new Set(FIELDS).size, FIELDS.length, "⛔ no column name appears twice");

// ⛔ THREE COLUMN KINDS, AND THE TABLE IS DATA rather than a comment — that is
// what lets §7 exclude the sawtooth columns BY NAME. A column added without a
// kind is the easy half of the edit, and this is what makes it red.
H.eq(Object.keys(KINDS).sort().join(","), FIELDS.slice().sort().join(","),
     "⛔ TELEMETRY_KINDS names exactly the columns TELEMETRY_FIELDS does — no column " +
     "without a kind, no kind without a column");
const KIND_NAMES = ["instantaneous", "cumulative", "sawtooth"];
for (const f of FIELDS) {
  H.assert(KIND_NAMES.indexOf(KINDS[f]) !== -1, `the ${f} column's kind is one of the three`);
}
for (const k of KIND_NAMES) {
  H.assert(FIELDS.some(f => KINDS[f] === k), `⛔ at least one ${k} column exists`);
}

// ⛔ EVERY HEAT-DERIVED VALUE IS A COLUMN — that is what makes the log a tuning
// instrument rather than a score log, and it is ALL EIGHT: CLAUDE.md names seven
// accessors plus heat() itself. A log missing a row of the curve cannot be
// replotted against a retune of it.
const HEAT_COLUMNS = ["heat", "spawnInterval", "enemyConcurrent", "climbMult",
                      "vaultInterval", "vaultRimInterval", "surgeInterval", "weaverApex"];
for (const f of HEAT_COLUMNS) {
  H.assert(FIELDS.indexOf(f) !== -1, `⛔ the ${f} column exists — every heat-derived value is sampled`);
  H.eq(KINDS[f], "instantaneous", `the ${f} column is instantaneous`);
}
const lvl = state.level;
H.eq(row.heat, X.heat(lvl), "the heat column is heat(level), off the shipped accessor");
H.eq(row.spawnInterval, X.spawnInterval(lvl), "the spawnInterval column is the shipped accessor's");
H.eq(row.enemyConcurrent, X.enemyConcurrent(lvl), "the enemyConcurrent column is the shipped accessor's");
H.eq(row.climbMult, X.climbMult(lvl), "the climbMult column is the shipped accessor's");
H.eq(row.vaultInterval, X.vaultInterval(lvl), "the vaultInterval column is the shipped accessor's");
H.eq(row.vaultRimInterval, X.vaultRimInterval(lvl), "the vaultRimInterval column is the shipped accessor's");
H.eq(row.surgeInterval, X.surgeInterval(lvl), "the surgeInterval column is the shipped accessor's");
H.eq(row.weaverApex, X.weaverApex(lvl), "the weaverApex column is the shipped accessor's");
H.eq(row.level, state.level, "the level column is THE ONE CLOCK");
H.eq(row.t, state.time, "the t column is state.time — simulation seconds, never wall clock");

// ⛔ CS007 P1'S SPLIT, VISIBLE IN THE FIELD. Three separate columns, and
// threatsAlive comes off the spawner's own threatCount() rather than a copy.
H.eq(row.threatsAlive, X.threatCount(state),
     "⛔ the threatsAlive column IS the release budget's own count (08-spawner.js), not a copy");
H.assert(row.enemiesAlive >= row.threatsAlive,
     "enemiesAlive counts every entity and threatsAlive only what blocksClear, so it is never smaller");
H.eq(row.enemiesAlive - row.threatsAlive >= row.thornsStanding, true,
     "thornsStanding is inside the gap between the two — `anchored`, read off the entity");

// ⛔ THE FOUR KNOWN-CONSTANT COLUMNS SHIP NOW (GDD §15.6). A column added in
// CS008 invalidates every CS007 log, so the ones whose SOURCE is scheduled get
// their place in the order now and their source later.
H.eq(row.score, 0, "⚠ the score column is 0 until addScore() lands in CS008");
H.eq(row.maxCombo, 0, "⚠ the maxCombo column is 0 until GDD §14.4's combo");
H.eq(row.mode, "classic", "⚠ the mode column is \"classic\" until CS008's mode select");
H.eq(row.startDepth, 1, "⚠ the startDepth column is 1 until GDD §4.6's Start Depth");
H.eq(row.score, C.TELEMETRY_PLACEHOLDER.score, "and all four read C.TELEMETRY_PLACEHOLDER");
H.eq(row.maxCombo, C.TELEMETRY_PLACEHOLDER.maxCombo, "... maxCombo");
H.eq(row.mode, C.TELEMETRY_PLACEHOLDER.mode, "... mode");
H.eq(row.startDepth, C.TELEMETRY_PLACEHOLDER.startDepth, "... startDepth");

// ⚠ CROSS-CHECKED AGAINST THE WORKER'S SEVEN REGISTERED statsFields for
// `vector-vortex` (coinless-kit services/leaderboard/src/registry.js, measured
// at 79206f3). ⛔ The mapping is snake_case -> camelCase and it is TOTAL: every
// registered key has a column, so the two instruments never disagree about what
// a run was.
const WORKER_STATS = {
  level_reached: "level",
  mode:          "mode",
  start_depth:   "startDepth",
  wells_cleared: "wellsCleared",
  purges_spent:  "purgesSpent",
  max_combo:     "maxCombo",
  deaths:        "deaths",
};
for (const key of Object.keys(WORKER_STATS)) {
  H.assert(FIELDS.indexOf(WORKER_STATS[key]) !== -1,
           `⚠ the Worker's registered "${key}" has the column "${WORKER_STATS[key]}"`);
}

// ---------------------------------------------------------------------------
// §2 — ⛔ CAPTURE IS A SESSION SWITCH: OPT-IN, OFF AT EVERY LAUNCH, NEVER
//      PERSISTED (GDD §15.6)
// ---------------------------------------------------------------------------
//
// ⛔ THE SECOND HALF IS THE ONE THAT MATTERS, and it needs a SECOND BUILD. A
// boolean that reads false right now proves nothing about a launch; the claim
// is that a launch cannot revive a stale "was ON last session" state, so the
// case is: turn it on, boot the whole game again, and find it off.
T.setEnabled(true);
H.assert(T.enabled(), "the switch turns on when asked");

installSeed(SEED);
const X2 = H.buildGame();
H.eq(X2.Telemetry.enabled(), false,
     "⛔ CAPTURE IS OFF AT A FRESH LAUNCH even though the previous session left it ON — " +
     "there is no load path, so there is nothing for a launch to revive it from");
H.eq(X2.Telemetry.count, 0, "and a fresh launch's ring is empty");

T.setEnabled(false);
H.eq(T.enabled(), false, "the switch turns off when asked");
H.eq(T.sample(state), null, "⛔ sample() takes NO row while capture is off");
G.reset();
X.startGame(SEED);
H.eq(T.enabled(), false,
     "⛔ and neither Game.reset() nor startGame() can turn it on — a run is not a session");
H.assert(T.toggle(), "toggle() turns it on");
H.assert(!T.toggle(), "toggle() turns it off again");

// ---------------------------------------------------------------------------
// §3 — ⛔ THE RING IS BOUNDED AND `wrapped` LATCHES ON THE FIRST DROPPED ROW
// ---------------------------------------------------------------------------
//
// Orbital Overhaul's v4 lesson: a total read off a silently wrapped buffer is
// wrong and nothing says so. ⛔ The flag is what says so, and the export reports
// it (§4).
const CAP = C.TELEMETRY_CAP;
H.assert(CAP > 0 && CAP === Math.floor(CAP), "C.TELEMETRY_CAP is a positive whole number of rows");

T.setEnabled(false);
T.clear();
H.eq(T.count, 0, "clear() empties the ring");
H.eq(T.wrapped, false, "⛔ clear() puts the wrap latch back — a fresh buffer has dropped nothing");

const savedTime = state.time;
for (let i = 0; i < CAP; i++) { state.time = i; T.push(state); }
H.eq(T.count, CAP, `the ring holds exactly C.TELEMETRY_CAP (${CAP}) rows`);
H.eq(T.wrapped, false, "⛔ a FULL ring has still dropped nothing — the latch is about the drop");
let all = T.rows();
H.eq(all.length, CAP, "rows() returns every held row");
H.eq(all[0].t, 0, "rows() is oldest-first");
H.eq(all[CAP - 1].t, CAP - 1, "... and newest-last");

state.time = CAP;
T.push(state);
H.eq(T.count, CAP, "⛔ the ring stays BOUNDED — one row in, one row out");
H.eq(T.wrapped, true, "⛔ `wrapped` latches on the FIRST row actually dropped");
all = T.rows();
H.eq(all[0].t, 1, "and it is the OLDEST row that was dropped");
H.eq(all[CAP - 1].t, CAP, "... with the newest still at the end");

state.time = CAP + 1;
T.push(state);
H.eq(T.wrapped, true, "⛔ the latch stays set — it is a latch, not a per-push flag");
H.eq(T.count, CAP, "and the ring is still bounded");
state.time = savedTime;

// ---------------------------------------------------------------------------
// §4 — THE CSV
// ---------------------------------------------------------------------------
//
// ⛔ THE HEADER LINE IS TELEMETRY_FIELDS.join(","), EXACTLY. That is what makes
// the list the one source of truth for the column order rather than merely the
// intended one. A `#` block sits above it, so the header is the first line that
// does not start with `#`.
function csvParts(text) {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].charAt(0) === "#") i++;
  return { block: lines.slice(0, i), header: lines[i], data: lines.slice(i + 1) };
}

let parts = csvParts(T.csv());
H.eq(parts.header, FIELDS.join(","),
     "⛔ the CSV's header line is exactly TELEMETRY_FIELDS.join(\",\")");
H.eq(parts.data.length, T.count, "one data row per held row");
let arityOk = true;
for (const line of parts.data) {
  if (line.split(",").length !== FIELDS.length) { arityOk = false; break; }
}
H.assert(arityOk, `⛔ every data row has exactly ${FIELDS.length} cells — the header's arity`);
H.assert(parts.block.join("\n").indexOf("wrapped=true") !== -1,
     "⛔ THE EXPORT REPORTS THE WRAP IN ITS HEADER BLOCK — a total read off row 1 of a " +
     "wrapped file is wrong, and this is the only thing that says so");
H.assert(parts.block.some(l => l.indexOf("WARNING") !== -1),
     "... and it says so in words, not only as a flag");

T.clear();
state.time = 3.5;
T.push(state);
T.push(state);
parts = csvParts(T.csv());
H.eq(parts.header, FIELDS.join(","), "the header is the same on an unwrapped file");
H.eq(parts.data.length, 2, "two rows in, two rows out");
H.assert(parts.block.join("\n").indexOf("wrapped=false") !== -1,
     "an unwrapped file says so too — the flag is always reported, never only on failure");
H.assert(parts.block.join("\n").indexOf("rows=2") !== -1, "the block reports the row count");
H.eq(parts.data[0].split(",")[FIELDS.indexOf("mode")], "classic",
     "a cell is written bare — no quoting is needed because no column can hold a comma");
state.time = savedTime;

// exportCsv() returns what it logged, and it must not throw with no clipboard.
// ⛔ file:// is not a secure context, so the absent-clipboard path IS the normal
// one (EXTERNAL-FILES.md rule 1).
const _log = console.log;
let logged = null;
console.log = (s) => { logged = s; };
let exported = null;
try { exported = T.exportCsv(); } finally { console.log = _log; }
H.eq(exported, T.csv(), "exportCsv() returns the CSV it wrote");
H.eq(logged, exported, "⛔ and it WRITES IT TO console.log — the only export path file:// has");

// ---------------------------------------------------------------------------
// §5 — ⛔ THE HEADLINE: THE 10,000-TICK HASH IS IDENTICAL WITH CAPTURE ON AND OFF
// ---------------------------------------------------------------------------
//
// An instrument that perturbs the run it measures is worse than no instrument.
// Telemetry spends no RNG draw, writes nothing the simulation reads back, and is
// sampled from update() on the SIMULATION clock — so a capture-on run and a
// capture-off run of the same seed are the same run, tick for tick.
//
// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. Deliberately a local copy, as all four soaks' are.
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

const lastRun = { rows: 0, restarts: 0, level: 0, maxEnemies: 0 };

// ⛔ A FRESH BUILD PER RUN, because capture is module state and the claim is
// about a whole run differing in nothing else.
function hashRun(gameSeed, capture) {
  installSeed(gameSeed);
  const Y = H.buildGame();
  const st = Y.state;
  const dt = Y.C.FIXED_DT;

  Y.Telemetry.setEnabled(!!capture);

  Y.Game.reset();
  Y.startGame(gameSeed);

  let h = 2166136261 >>> 0;
  let restarts = 0;
  lastRun.maxEnemies = 0;
  lastRun.level = 0;

  for (let i = 0; i < TICKS; i++) {
    replay(Y.Game.input, i);
    Y.Game.update(dt);

    if (st.screen === "gameover") {
      restarts++;
      Y.startGame((gameSeed + restarts * 7919) >>> 0);
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
      h = mix(h, e.lane);
      h = mix(h, e.depth);
      h = mix(h, e.dead ? 1 : 0);
      h = mix(h, num(e.hopTimer));
      h = mix(h, num(e.dir));
      h = mix(h, num(e.holdTimer));
      h = mix(h, num(e.rideTimer));
      h = mix(h, num(e.crossTime));
      h = mix(h, num(e.surgeTimer));
      h = mix(h, num(e.killDepth));
    }
  }
  lastRun.restarts = restarts;
  lastRun.rows = Y.Telemetry.count;
  return h >>> 0;
}

const hashOff = hashRun(SEED, false);
H.eq(lastRun.rows, 0, "⛔ capture OFF takes no rows at all — the switch is the gate");
const offLevel = lastRun.level;
const offEnemies = lastRun.maxEnemies;
const offRestarts = lastRun.restarts;

const hashOn = hashRun(SEED, true);
H.eq(hashOn, hashOff,
     `⛔ ${TICKS} TICKS HASH IDENTICALLY WITH CAPTURE ON AND OFF — the instrument does not ` +
     "perturb the run it measures (GDD §17 item 1, §15.6)");
H.eq(lastRun.level, offLevel, "... the same levels were reached");
H.eq(lastRun.maxEnemies, offEnemies, "... the same board was built");
H.eq(lastRun.restarts, offRestarts, "... and the run died the same number of times");

// ⛔ AND THE CAPTURE-ON RUN ACTUALLY CAPTURED. A hash comparison between two
// runs that both logged nothing is a case that cannot fail.
H.assert(lastRun.rows > 100,
     `⛔ the capture-on run took ${lastRun.rows} rows — the comparison above is not vacuous`);
H.assert(lastRun.level > 1, "and the hashed run left level 1, so the heat columns moved");

// A different seed must move the hash, or neither case above proves anything.
H.assert(hashRun(SEED + 1, true) !== hashOn, "a different seed produces a different hash");

// ---------------------------------------------------------------------------
// §6 — ⛔ THE SOURCE CONTRACT: NO STORAGE, NO RNG, NEVER THE DRAW PATH
// ---------------------------------------------------------------------------
//
// Read off the BUILT file (GDD §16.2). ⛔ THE MODULE IS SLICED OUT OF THE RAW
// TEXT — its boundaries are the concat's own header comments — AND THE COMMENTS
// ARE THEN STRIPPED, because every claim below is about CODE. This module's
// header explains at length why it names no storage API, and a raw scan would
// read that explanation as the violation it forbids.
//
// ⚠ A CHARACTER SCANNER, NOT A REGEX, and it is test-cs007-p2.js's, copied
// deliberately: a line comment containing "/*" plus a block-comment regex run
// first will silently delete live code and still parse (_harness.js's header).
function stripComments(src) {
  let out = "", i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c; i++;
      while (i < n) {
        if (src[i] === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c; i++;
  }
  return out;
}

const raw = H.extractScript(require("fs").readFileSync(
  require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const start = raw.indexOf("// 21-telemetry.js");
const end = raw.indexOf("// 22-meta.js");
H.assert(start > 0 && end > start, "the telemetry module is in the built file, between its neighbours");
const mod = stripComments(raw.slice(start, end));
const code = stripComments(raw);

// ⛔ THE SCANNER IS CHECKED BEFORE IT IS TRUSTED — it removed a lot, and it left
// the two landmarks the module cannot work without.
H.assert(mod.length < (end - start) * 0.6,
     `the scanner actually stripped this module's comments (${end - start} -> ${mod.length})`);
H.assert(mod.indexOf("TELEMETRY_FIELDS") !== -1, "... and left the field list standing");

// ⛔ NO PERSISTENCE THIS CHANGESET, and it is a shipped rule rather than a
// preference: kit-storage owns the keyspace and Profiles.keyFor(base) is the one
// route to a key (CLAUDE.md, Save data). 22-meta.js is a placeholder, so there
// is neither. Writing rows today would mean the game choosing a raw
// localStorage key name. ⛔ CS011 owns persistence and read()'s envelope check.
for (const banned of ["localStorage", "sessionStorage", "indexedDB", "document.cookie"]) {
  H.eq(mod.indexOf(banned), -1,
       `⛔ the telemetry module never names ${banned} — kit-storage owns the keyspace, and ` +
       "CS011 is the changeset that lands persistence");
}
// ⛔ NEVER AN <a download> AND NEVER A fetch (CLAUDE.md, Build rules). Both fail
// on file://, which the built game must open and play from by double-click.
for (const banned of ["fetch(", "download", "XMLHttpRequest", "Blob(", "createObjectURL"]) {
  H.eq(mod.indexOf(banned), -1,
       `⛔ the telemetry module never names ${banned} — console.log is the only export path ` +
       "that works on file://");
}
H.assert(mod.indexOf("console.log") !== -1, "... and console.log IS the export path");
H.assert(mod.indexOf("clipboard") !== -1, "the clipboard attempt is present");
H.assert(mod.indexOf("catch") !== -1,
     "⛔ ... inside a try/catch, because file:// is not a secure context and failure is the " +
     "normal path (EXTERNAL-FILES.md rule 1)");

// ⛔ IT SPENDS NO RNG. state.rng is the run's one stream and a draw here would
// move every spawn lane in every run.
for (const banned of ["state.rng", "Math.random", "mulberry32", "rngInt", "rngPick"]) {
  H.eq(mod.indexOf(banned), -1, `⛔ the telemetry module never names ${banned} — it spends no draw`);
}

// ⛔ SAMPLED FROM update(), NEVER FROM draw(). draw() runs on a frame clock and
// update() does not (RATIONALE.md#draw-path-rng), so a sample taken there would
// make a capture-on run diverge from a capture-off one.
const updateSrc = String(G.update);
const drawSrc = String(G.draw);
H.assert(updateSrc.indexOf("Telemetry.sample") !== -1,
     "⛔ Game.update() takes the sample — the simulation clock");
H.eq(drawSrc.indexOf("Telemetry"), -1,
     "⛔ AND Game.draw() NEVER NAMES Telemetry — the frame clock is not the simulation clock");
H.eq((code.match(/Telemetry\.sample\(/g) || []).length, 1,
     "⛔ there is exactly ONE sample site in the whole build");

// ---------------------------------------------------------------------------
// §7 — THE COUNTERS ARE REAL, AND THE SAWTOOTHS ARE EXCLUDED BY NAME
// ---------------------------------------------------------------------------
//
// ⛔ TRAP 3: NO RESTART. A cumulative column resets when a RUN does, so this run
// stops itself — update() returns early on "gameover" and state.time freezes,
// which stops the rows as well.
installSeed(SEED);
const Z = H.buildGame();
const zs = Z.state;
Z.Telemetry.setEnabled(true);
Z.Game.reset();
Z.startGame(SEED);
for (let i = 0; i < CAPTURE_TICKS; i++) { replay(Z.Game.input, i); Z.Game.update(Z.C.FIXED_DT); }
const series = Z.Telemetry.rows();

H.assert(series.length > 50, `the capture run took ${series.length} rows`);
H.assert(Z.Telemetry.wrapped === false,
     "⛔ and it did not wrap, so the totals below are the run's own and not a mid-run slice");

// ⛔ THE CUMULATIVE COLUMNS ARE NON-DECREASING, selected BY NAME out of
// TELEMETRY_KINDS rather than by guessing from the column name — which is the
// whole reason the kinds are a table.
const CUMULATIVE = FIELDS.filter(f => KINDS[f] === "cumulative");
const SAWTOOTH = FIELDS.filter(f => KINDS[f] === "sawtooth");
H.assert(SAWTOOTH.length > 0, "⛔ there are sawtooth columns to exclude");

for (const f of CUMULATIVE) {
  let ok = true;
  for (let i = 1; i < series.length; i++) {
    if (series[i][f] < series[i - 1][f]) { ok = false; break; }
  }
  H.assert(ok, `⛔ the cumulative column ${f} never falls across a run`);
}

// ⛔ AND THE EXCLUSION IS LOAD-BEARING RATHER THAN DECORATIVE: every sawtooth
// column is OBSERVED TO FALL in this run. A monotonicity check that did not know
// which columns they were would flag the two most useful stall columns in the
// file as corruption.
for (const f of SAWTOOTH) {
  let fell = false;
  for (let i = 1; i < series.length; i++) {
    if (series[i][f] < series[i - 1][f]) { fell = true; break; }
  }
  H.assert(fell,
     `⛔ the sawtooth column ${f} FALLS inside a run — it is reset by an event, which is ` +
     "why it is excluded by name from any monotonicity check");
}

// ⛔ THE COUNTERS ARE NOT ALL PROVABLY ZERO. A column that never moves is a
// column whose increment site could be missing and nothing would say so.
const last = series[series.length - 1];
H.assert(last.shotsFired > 0, "the shotsFired column moved — the recorded list fires");
H.assert(last.kills > 0, "the kills column moved — the player destroyed something");
H.assert(last.deaths > 0, "the deaths column moved — the recorded list dies");
H.assert(last.wellsCleared > 0, "the wellsCleared column moved — the run cleared a well");
H.assert(last.divesCompleted > 0, "the divesCompleted column moved — a cleared well dives");
H.eq(last.deaths, zs.tally.deaths, "and a column IS the counter, sampled — not a second tally");

// ⛔ deaths IS NOT START_LIVES - lives. Today they agree; the column is counted
// at killSkimmer() so CS008's extra-life awards cannot quietly falsify it.
H.assert(Z.C.START_LIVES - zs.lives <= zs.tally.deaths,
     "⛔ deaths counts kills of the craft, not the reserve's shortfall");

// ⛔ THE STALL'S OWN SIGNATURE, driven directly rather than waited for: the
// spawner with quota left, its timer at the interval, and the release budget
// already full. PLANNED-FEATURES-CS007.md §4.2's metric.
Z.Game.reset();
Z.startGame(SEED);
const zWell = Z.WELLS[zs.wellIndex];
zs.spawn.remaining = 10;
for (let i = 0; i < Z.spawnLimit() + 1; i++) Z.spawnEnemy("vaulter", i, 0.3);
H.assert(Z.threatCount(zs) >= Z.spawnLimit(), "the release budget is full");
zs.spawn.timer = 99;
const before = zs.tally.spawnBlockedTicks;
Z.updateSpawner(zs, zWell, Z.C.FIXED_DT);
H.eq(zs.tally.spawnBlockedTicks, before + 1,
     "⛔ a step the spawner wanted to release on and could not is ONE blocked beat — the " +
     "stall's own signature, counted where the refusal is");
H.eq(zs.spawn.remaining, 10, "and a blocked beat spends no quota");

H.report("test-cs007-p4.js");

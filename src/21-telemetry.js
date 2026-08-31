// 21-telemetry.js — the tuning instrument (GDD 15.6, 17 item 11). CS007 P4.
//
// A ring buffer of rows sampled off the simulation clock, exported as CSV to
// the console. It exists to answer GDD 8.2's tuning question — where does a
// first-time player actually die, where does a competent one — against CS007's
// heat curve, which is why every heat-derived value is a column of its own. A
// log that carried only score and level would be a score log; the curve is what
// makes it an instrument.
//
// ⛔ NOTHING IS POSTED ANYWHERE. Strictly local CSV export (GDD 15.6, ⚠ SETTLED
// 2026-08-30; GDD 21 item 5). It is explicitly NOT an anti-cheat mechanism.
//
// ⛔ IT MOVES NO BASELINE, AND THAT IS THE HEADLINE CLAIM (test-cs007-p4.js).
// It spends no RNG draw, reads no state.rng, writes nothing the simulation
// reads back, and is sampled from update() on the SIMULATION clock — never from
// draw(). draw() runs on a frame clock and update() does not (CLAUDE.md, Math
// and lifecycle; RATIONALE.md#draw-path-rng), so a sample taken there would
// make a capture-on run diverge from a capture-off one — GDD 17.1's replay
// guarantee failing inside the one system built to observe it.
//
// ⛔ NO PERSISTENCE THIS CHANGESET, and the reason is a shipped rule rather than
// a preference. kit-storage owns the keyspace and Profiles.keyFor(base) is the
// one route from a store's base name to the key it reads (CLAUDE.md, Save
// data); 22-meta.js is a placeholder, so there is no keyspace and no Profiles
// in this build. Writing rows anywhere today would mean the game choosing a raw
// localStorage key name, which is forbidden outright. ⛔ CS011 owns persistence,
// the profile scope and GDD 15.6's read() envelope-version rejection — and it
// is wiring rather than a rewrite, because the row shape and the export exist.
// ⛔ THERE IS NO STORAGE CALL IN THIS FILE AND THERE MUST NOT BE ONE.
//
// ⛔ NOT ON CLAUDE.md's EXTRACTION LIST. Six modules are built kit-shaped from
// v1 and this is not one of them, so it reads `state` and `C` directly like
// every other game module. A future kit-telemetry would take a snapshot
// callback instead; do not half-shape it here in anticipation.

// ---------------------------------------------------------------------------
// ⛔ THE COLUMNS — TELEMETRY_FIELDS IS THE ONE SOURCE OF TRUTH (GDD 15.6)
// ---------------------------------------------------------------------------
//
// ⛔ It drives the CSV header AND the row shape. telemetryRow() below writes the
// same names in the same order, and GDD 17 item 11 asserts they agree in LENGTH
// AND ORDER off the built file — so adding or reordering a column means editing
// this list and that function TOGETHER, in one commit, or the suite goes red.
//
// ⛔ THREE COLUMN KINDS AND THE NAMES DO NOT TELL YOU WHICH — TELEMETRY_KINDS
// below is the table, and it is DATA rather than a comment so the exclusion
// below can be made by name:
//
//   instantaneous  the state at the sample instant. May go up or down.
//   cumulative     a run total. Rises, and resets only when a run does.
//   sawtooth       reset by an EVENT mid-run. ⛔ EXCLUDED BY NAME from any
//                  monotonicity check — a sawtooth column falling is the column
//                  working, and a check that did not know which ones they were
//                  would flag the two most useful stall columns in the file.
//
// ⛔ FOUR COLUMNS SHIP WITH KNOWN-CONSTANT VALUES rather than being added when
// their source lands: `score` and `maxCombo` (0), `mode` ("classic") and
// `startDepth` (1), out of C.TELEMETRY_PLACEHOLDER. A column added in CS008
// invalidates every log recorded before it, which is the whole reason GDD 15.6
// makes the column list a thing you edit deliberately.
//
// ⚠ CROSS-CHECKED AGAINST THE WORKER, which already registers seven statsFields
// for `vector-vortex` in coinless-kit's services/leaderboard/src/registry.js
// (measured at 79206f3). The two instruments name the same quantities; the
// Worker's keys are snake_case and these are camelCase, and the mapping is
// exact and total:
//
//   level_reached -> level      mode -> mode            start_depth -> startDepth
//   wells_cleared -> wellsCleared               purges_spent -> purgesSpent
//   max_combo -> maxCombo       deaths -> deaths
//
// ⛔ ALL EIGHT HEAT-DERIVED VALUES ARE SAMPLED, not the six the phase prompt
// enumerated: CLAUDE.md names SEVEN accessors and heat() itself, and
// vaultInterval() / vaultRimInterval() are two of the seven. "Sample every
// heat-derived value" is the rule; the six-name list under-named it. A log
// missing two rows of the curve cannot be replotted against a retune of them,
// which is the one job this file has.
//
// ⛔ THERE IS NO PER-KIND KILL COLUMN, and that is a decision. The roster grows
// (GDD 6.4's three Overdrive enemies), so a column per kind guarantees the
// column list churns — exactly what GDD 15.6's rule exists to prevent. `kills`
// is one number: enemies the player destroyed, by shot or by Purge.
const TELEMETRY_FIELDS = [
  // ---- the run, and where it is -------------------------------------------
  "t",                  // instantaneous — simulation seconds (state.time)
  "level",              // instantaneous — ⛔ THE ONE CLOCK (GDD 8)
  "seed",               // instantaneous — constant within a run; a restart moves it
  "mode",               // instantaneous — ⚠ "classic" until CS008 (GDD 13)
  "startDepth",         // instantaneous — ⚠ 1 until GDD 4.6's Start Depth
  // ---- the heat curve, sampled (GDD 8; 00-config.js) ----------------------
  "heat",               // instantaneous
  "spawnInterval",      // instantaneous
  "enemyConcurrent",    // instantaneous
  "climbMult",          // instantaneous
  "vaultInterval",      // instantaneous
  "vaultRimInterval",   // instantaneous
  "surgeInterval",      // instantaneous
  "weaverApex",         // instantaneous
  // ---- the board, with CS007 P1's split visible in the field ---------------
  "enemiesAlive",       // instantaneous — every entity, what C.ENEMY_CAP counts
  "threatsAlive",       // instantaneous — blocksClear, what the release budget counts
  "thornsStanding",     // instantaneous — `anchored`; the difference between the two above
  "livesLeft",          // instantaneous — GDD 8.2's targets are about where a player dies
  // ---- the two sawtooths ---------------------------------------------------
  "spawnRemaining",     // ⛔ SAWTOOTH — the well's quota, re-armed by enterWell()
  "purgeUses",          // ⛔ SAWTOOTH — one charge per well, re-armed by enterWell()
  // ---- the run's totals ----------------------------------------------------
  "score",              // cumulative — ⚠ 0 until addScore() lands in CS008
  "maxCombo",           // cumulative — ⚠ 0 until GDD 14.4's combo (Overdrive)
  "deaths",             // cumulative
  "wellsCleared",       // cumulative
  "purgesSpent",        // cumulative
  "divesCompleted",     // cumulative — ⚠ completed, NOT survived (02-state.js)
  "thornDeaths",        // cumulative — GDD 4.5 item 5, a subset of `deaths`
  "shotsFired",         // cumulative
  "kills",              // cumulative — by shot or by Purge
  "spawnBlockedTicks",  // cumulative — ⛔ the stall's own signature (08-spawner.js)
];

// ⛔ EVERY NAME ABOVE HAS A ROW HERE AND NOTHING ELSE DOES. test-cs007-p4.js
// asserts the two key sets are equal, so a column added without a kind — the
// easy half of the edit — turns the suite red rather than shipping a column
// nobody can classify.
const TELEMETRY_KINDS = {
  t: "instantaneous",
  level: "instantaneous",
  seed: "instantaneous",
  mode: "instantaneous",
  startDepth: "instantaneous",
  heat: "instantaneous",
  spawnInterval: "instantaneous",
  enemyConcurrent: "instantaneous",
  climbMult: "instantaneous",
  vaultInterval: "instantaneous",
  vaultRimInterval: "instantaneous",
  surgeInterval: "instantaneous",
  weaverApex: "instantaneous",
  enemiesAlive: "instantaneous",
  threatsAlive: "instantaneous",
  thornsStanding: "instantaneous",
  livesLeft: "instantaneous",
  spawnRemaining: "sawtooth",
  purgeUses: "sawtooth",
  score: "cumulative",
  maxCombo: "cumulative",
  deaths: "cumulative",
  wellsCleared: "cumulative",
  purgesSpent: "cumulative",
  divesCompleted: "cumulative",
  thornDeaths: "cumulative",
  shotsFired: "cumulative",
  kills: "cumulative",
  spawnBlockedTicks: "cumulative",
};

// ⛔ THE OTHER HALF OF TELEMETRY_FIELDS. The names, in the list's order, and
// nothing else — a reader comparing this function to the list above is doing
// exactly what GDD 17 item 11 asserts mechanically.
//
// ⛔ EVERY HEAT ACCESSOR IS PASSED THE LEVEL EXPLICITLY rather than left to
// default to state.level (00-config.js). Identical today; it says in the code
// that a row is a function of the level it records, which is what makes a
// re-plot against a retune honest.
//
// ⛔ threatCount() IS THE REAL ONE (08-spawner.js), not a copy: the whole point
// of the column is to show what the release budget saw, and a second count here
// could disagree with the spawner's the first time `blocksClear` moved.
function telemetryRow(state) {
  const lvl = state.level;
  const P = C.TELEMETRY_PLACEHOLDER;
  const T = state.tally;

  // One pass for both board counts. ⛔ `anchored` is read off the entity, never
  // a class name (GDD 6.5) — it is the Thorn and nothing else, and it is what
  // makes enemiesAlive and threatsAlive differ.
  let alive = 0;
  let thorns = 0;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead) continue;
    alive++;
    if (e.anchored) thorns++;
  }

  return {
    t:                 state.time,
    level:             lvl,
    seed:              state.seed,
    mode:              P.mode,
    startDepth:        P.startDepth,
    heat:              heat(lvl),
    spawnInterval:     spawnInterval(lvl),
    enemyConcurrent:   enemyConcurrent(lvl),
    climbMult:         climbMult(lvl),
    vaultInterval:     vaultInterval(lvl),
    vaultRimInterval:  vaultRimInterval(lvl),
    surgeInterval:     surgeInterval(lvl),
    weaverApex:        weaverApex(lvl),
    enemiesAlive:      alive,
    threatsAlive:      threatCount(state),
    thornsStanding:    thorns,
    livesLeft:         state.lives,
    spawnRemaining:    state.spawn.remaining,
    purgeUses:         state.purgeUses,
    score:             P.score,
    maxCombo:          P.maxCombo,
    deaths:            T.deaths,
    wellsCleared:      T.wellsCleared,
    purgesSpent:       T.purgesSpent,
    divesCompleted:    T.divesCompleted,
    thornDeaths:       T.thornDeaths,
    shotsFired:        T.shotsFired,
    kills:             T.kills,
    spawnBlockedTicks: T.spawnBlockedTicks,
  };
}

// One CSV cell. Integers plain, everything else to six decimals — enough to
// replot the curve and short enough that a row is readable. ⛔ No quoting and no
// escaping, because no column can contain a comma: every one is a number except
// `mode`, which comes from C.TELEMETRY_PLACEHOLDER.
function telemetryCell(v) {
  if (typeof v === "number") {
    if (!isFinite(v)) return String(v);
    return v === Math.floor(v) ? String(v) : v.toFixed(6);
  }
  return String(v);
}

const Telemetry = (function () {

  // ⛔ CAPTURE IS A SESSION SWITCH: OPT-IN, OFF AT EVERY LAUNCH, NEVER
  // PERSISTED (GDD 15.6). A plain module-level boolean is the whole mechanism,
  // and the absence of a load path is the guarantee — there is no storage read
  // anywhere in this file, so a launch has nothing to revive a stale "was ON
  // last session" state from. CS008's Options screen is a control surface over
  // this switch and must not become a settings store for it.
  let capturing = false;

  // The ring. ⛔ FIXED LENGTH, oldest dropped, and `wrapped` LATCHES the first
  // time a row is actually dropped — Orbital Overhaul's v4 lesson: a total read
  // off a silently wrapped buffer is wrong and nothing said so. The export
  // reports it in the header block, every time.
  let ring = new Array(C.TELEMETRY_CAP);
  let head = 0;      // where the next row goes
  let count = 0;     // rows held, <= C.TELEMETRY_CAP
  let wrapped = false;

  // The sample clock, in SIMULATION seconds. -Infinity means "due now", which
  // is the state a fresh buffer and a freshly enabled capture are both in.
  let lastAt = -Infinity;

  // ⛔ ONE ROW IN, THE RING'S ONLY WRITER. Returns the row so a caller — and
  // GDD 17 item 11's assertion — can read its key ORDER, which is the half of
  // the contract a length check cannot see.
  //
  // ⛔ UNGATED BY `capturing` ON PURPOSE. sample() is the gate; this is the
  // mechanism, and a test that had to flip a session switch to drive the row
  // builder would be testing the switch twice and the shape not at all.
  function push(state) {
    const row = telemetryRow(state);
    // The write that is about to overwrite a live row is the drop.
    if (count === C.TELEMETRY_CAP) wrapped = true;
    ring[head] = row;
    head = (head + 1) % C.TELEMETRY_CAP;
    if (count < C.TELEMETRY_CAP) count++;
    return row;
  }

  // ⛔ CALLED FROM update(), ON THE SIMULATION CLOCK, AND FROM NOWHERE ELSE
  // (23-main.js). Returns the row it took, or null.
  //
  // ⛔ THE INTERVAL IS SIMULATION SECONDS, so a slow frame, a hit-stop freeze
  // and a headless soak driving update() directly all sample identically. At
  // C.TELEMETRY_INTERVAL 0.50 s a 60 Hz run spends one row every 30 ticks.
  //
  // ⚠ A CLOCK THAT WENT BACKWARDS IS A NEW RUN. startGame() puts state.time
  // back to 0, and a `lastAt` left at the old run's time would silence the
  // instrument for as many minutes as the previous run lasted. The rows carry
  // `seed`, so the restart is legible in the file rather than hidden.
  function sample(state) {
    if (!capturing) return null;
    const t = state.time;
    if (t < lastAt) lastAt = -Infinity;
    if (t - lastAt < C.TELEMETRY_INTERVAL) return null;
    lastAt = t;
    return push(state);
  }

  // Rows oldest-first. Allocates; the export and the suite are the callers and
  // neither is in the hot path.
  function rows() {
    const out = new Array(count);
    const start = count === C.TELEMETRY_CAP ? head : 0;
    for (let i = 0; i < count; i++) out[i] = ring[(start + i) % C.TELEMETRY_CAP];
    return out;
  }

  // Drops every row and re-arms the sample clock. ⛔ It does NOT touch the
  // capture switch — clearing the buffer and turning the instrument off are two
  // different intentions and a player who means one rarely means the other.
  function clear() {
    ring = new Array(C.TELEMETRY_CAP);
    head = 0;
    count = 0;
    wrapped = false;
    lastAt = -Infinity;
    return true;
  }

  // ⛔ ENABLING DOES NOT CLEAR. A player toggling capture off across a menu and
  // back on wants one log, not two; the sample clock is re-armed so the first
  // step after the flip takes a row rather than waiting out an interval that
  // elapsed while the instrument was off. Use clear() to start a fresh file.
  function setEnabled(on) {
    const next = !!on;
    if (next !== capturing) {
      capturing = next;
      if (capturing) lastAt = -Infinity;
    }
    return capturing;
  }

  function toggle() { return setEnabled(!capturing); }
  function enabled() { return capturing; }

  // The file. ⛔ A `#` HEADER BLOCK, THEN TELEMETRY_FIELDS.join(","), THEN THE
  // ROWS — the header line is the first line that does not start with `#`, and
  // it is exactly the field list, which is what makes the list the one source
  // of truth for the column order rather than merely the intended one.
  //
  // ⛔ THE WRAP IS REPORTED, LOUDLY. `wrapped=true` means the oldest rows are
  // gone, so a total read off the first row of this file is wrong — the
  // cumulative columns start mid-run. That is the whole reason the flag latches.
  function csv() {
    const all = rows();
    const last = count > 0 ? all[count - 1] : null;
    const lines = [];
    lines.push("# vector-vortex telemetry (GDD 15.6) v" + C.GAME_VERSION);
    lines.push("# rows=" + count +
               " capacity=" + C.TELEMETRY_CAP +
               " interval=" + C.TELEMETRY_INTERVAL +
               " wrapped=" + wrapped +
               " seed=" + (last ? last.seed : "none"));
    if (wrapped) {
      lines.push("# WARNING: the ring dropped its oldest rows. The cumulative " +
                 "columns start mid-run, so a total read off row 1 is wrong.");
    }
    lines.push(TELEMETRY_FIELDS.join(","));
    for (let i = 0; i < all.length; i++) {
      const r = all[i];
      const cells = new Array(TELEMETRY_FIELDS.length);
      for (let k = 0; k < TELEMETRY_FIELDS.length; k++) {
        cells[k] = telemetryCell(r[TELEMETRY_FIELDS[k]]);
      }
      lines.push(cells.join(","));
    }
    return lines.join("\n");
  }

  // ⛔ THE EXPORT WRITES TO console.log, AND THAT IS THE WHOLE MECHANISM. It is
  // the only path that works on file://, which the built game must open and
  // play from by double-click (CLAUDE.md, Build rules). ⛔ NEVER AN <a download>
  // AND NEVER A fetch — both are the same failure, a capability the shipped
  // artifact does not have.
  //
  // ⛔ THE CLIPBOARD ATTEMPT IS AN OPTIONAL ENHANCEMENT AND ITS FAILURE IS THE
  // NORMAL PATH (EXTERNAL-FILES.md rule 1). file:// is not a secure context, so
  // navigator.clipboard is usually absent there — and writeText() REJECTS
  // asynchronously rather than throwing, so the promise is caught too. Neither
  // failure is surfaced and neither changes what the console already has.
  function exportCsv() {
    const text = csv();
    console.log(text);
    try {
      if (typeof navigator !== "undefined" && navigator &&
          navigator.clipboard && navigator.clipboard.writeText) {
        const p = navigator.clipboard.writeText(text);
        if (p && typeof p.catch === "function") p.catch(function () {});
      }
    } catch (e) { /* absence is the normal fallback path */ }
    return text;
  }

  return {
    fields: TELEMETRY_FIELDS,
    kinds: TELEMETRY_KINDS,
    enabled, setEnabled, toggle,
    sample, push, rows, clear, csv, exportCsv,
    get count() { return count; },
    get wrapped() { return wrapped; },
  };
})();

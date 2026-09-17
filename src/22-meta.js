// 22-meta.js — profiles, scores, leaderboard wiring (GDD 15). CS008 P3 landed
// the record Start Depth's list is built from (GDD 4.6); CS011 P1 lands the
// store and the profile.
//
// ⛔ THIS FILE IS THE GAME'S ONLY ROUTE TO STORAGE. kit-storage (inlined at
// build from lib/) owns the keyspace, and the game never builds a key string:
// `Store` declares every key, and `Profiles.scope()` is the active profile's
// store (CLAUDE.md, Save data). ⛔ The game never enumerates storage — no call to
// a store's keys(), scopes(), clear() or usage().
//
// WHAT A PROFILE KEEPS (CS011 P2): `settings` (23-main.js's CONTROLS, KEYBOARD,
// GAMEPAD and sound rows), `progress` (the Start Depth record) and `telemetry`
// (the ring's rows). ⛔ The telemetry capture switch is never stored.
//
// THE RUN AND THE LOCAL TOP 10 (CS011 P3): `scores` (root), written through
// createScores() below, the future kit-scores (src/22-meta.NOTES.md).

// ---------------------------------------------------------------------------
// THE STORE AND THE PROFILE (GDD 15.1, 15.2). CS011 P1.
// ---------------------------------------------------------------------------
//
// ⛔ BOTH ARE MADE IN Meta.boot(), never at evaluation, so evaluating the script
// touches no storage. Before boot `Store` is null.
//
// ⛔ `achievements` IS NOT DECLARED until CS015 (plan R5). kit-profile declares
// its own root `profiles` key.
let Store = null;

// The local top 10 (GDD 15.3), made in Meta.boot() over the ROOT store: one
// table on the machine, every row stamped with the profile that set it.
let Scores = null;

// The game's wrapper over kit-profile. P1 needs the active profile and its store;
// the roster operations arrive with the PROFILE screen (CS011 P4).
const Profiles = (function () {
  let kit = null;
  return {
    attach(instance) { kit = instance; },
    // The active profile's store. ⛔ Profile `p0`'s is the ROOT store, beside
    // `scores` and `profiles` (kit-profile's scope rule).
    scope() { return kit.scope(); },
    // ⛔ THE ONE SWITCH (plan R11). kit-profile fires `beforeChange` and `change`
    // around it, and Meta's handler resets to shipped defaults BEFORE it loads.
    // The roster operations that also switch arrive with CS011 P4.
    select(id) { return kit.select(id); },
    // { id, name, playerId } — mints the playerId if it is absent (kit-profile).
    current() { return kit.current(); },
    list() { return kit.list(); },
  };
})();

const Meta = (function () {
  let booted = false;

  // 23-main.js's three settings callbacks, handed over at boot (plan R11):
  // resetSettings() (the shipped defaults, ⛔ writing nothing), applySettings(data)
  // (each VALID field of a stored `settings`, leaving the rest as they are) and
  // settingsSnapshot() (what `settings` stores).
  let hooks = null;

  // ⛔ RESET, THEN LOAD (CLAUDE.md, Save data). applySettings() skips a missing or
  // invalid field, so a field the incoming profile never stored keeps whatever
  // the runtime holds: the reset is what makes that the shipped default rather
  // than the outgoing profile's value (test-cs011-p2.js's mutation).
  function activateSettings() {
    hooks.resetSettings();
    hooks.applySettings(Profiles.scope().get("settings", null));
  }

  // ⛔ ON EVERY CHANGE (plan R10): an adjust step that moved a value, a toggle, a
  // capture that bound, RESET TO DEFAULTS. Never from Game.reset().
  function saveSettings() {
    if (!booted) return;
    Profiles.scope().set("settings", hooks.settingsSnapshot());
  }

  // ⛔ TELEMETRY IS WRITTEN ONLY WHILE CAPTURE IS ON OR ROWS EXIST (plan R17), and
  // only at its seats: capture turned off, autoPause, before a profile switch,
  // and a run's end. ⛔ NEVER ON A TIMER AND NEVER INSIDE A PLAY STEP: a full
  // ring costs a frame to stringify (plan §1.6). The callers own that second
  // rule; this function cannot see the step.
  function saveTelemetry() {
    if (!booted) return;
    if (!Telemetry.enabled() && Telemetry.count === 0) return;
    Profiles.scope().set("telemetry", Telemetry.snapshot());
  }

  // Read when capture turns on with an empty ring, and when EXPORT finds the ring
  // empty. A stored envelope of another version, or a row of the wrong length,
  // restores empty (GDD 15.6).
  function loadTelemetry() {
    if (!booted) return;
    Telemetry.restore(Profiles.scope().get("telemetry", null));
  }

  // ---- the run (plan R6, R7, R8; CS011 P3) ----
  //
  // ⛔ NOT IN `state` (R6): startGame() rewrites it, and the record of a run has
  // to outlive exactly that. ⛔ META WRITES NO `state`, SPENDS NO DRAW AND DRAWS
  // NOTHING; it reads `state` at the run's end and nowhere else.
  //
  // `run` is null when no run is open, else { bench } — whether a debug bench
  // action reached it in play. `placed` is the rank the last ended run took in
  // the local table, 0 for none, kept for game over's line.
  let run = null;
  let placed = 0;

  // startGame()'s last line. ⛔ A run still open is DROPPED, unrecorded: a
  // second startGame() over a live run (the soaks' restarts) ends nothing.
  function runStarted() {
    run = { bench: false };
    placed = 0;
  }

  // runAction(), for a bench digit, `spawnRow` or `cycleWell` in play (R8).
  function benchUsed() {
    if (run !== null) run.bench = true;
  }

  // ⛔ THE ONE GATE (CLAUDE.md, Leaderboard): the local table's check, and from
  // P5 every submit. Extend both together or neither.
  function eligible() {
    return run !== null && !run.bench;
  }

  function runOpen() { return run !== null; }

  // R9's local row. The profile's name is the one it has NOW, stamped, so a
  // later rename or delete leaves the row as it was set.
  function scoreRow(outcome) {
    const p = Profiles.current();
    return {
      score: state.score, level: state.level, startDepth: state.startDepth,
      wells: state.tally.wellsCleared, deaths: state.tally.deaths,
      durationS: Math.round(state.time), outcome, ts: Date.now(),
      profileId: p ? p.id : null, profileName: p ? p.name : null, build: C.GAME_VERSION,
    };
  }

  // ⛔ THE RUN'S END, FROM TWO SEATS AND NO THIRD (plan R7): 'quit' at the top of
  // quitToTitle() when the screen is pause, and 'died' in frame() after the
  // steps. ⛔ NEVER FROM killSkimmer(): a clear on the step that spends the last
  // life pays after it returns (GDD 7), and a Dive death returns from update()
  // early, so only the frame knows the final score. It closes the run first, so
  // a second call records nothing; then the row, if eligible and placed; then
  // the telemetry write (P2's).
  function runEnded(outcome) {
    if (run === null) return;
    const ok = eligible();
    run = null;
    if (booted && ok && Scores.qualifies(state.mode, state.score)) {
      placed = Scores.add(state.mode, scoreRow(outcome));
    }
    saveTelemetry();
  }

  // What the SCORES screen lists; [] before boot.
  function scores(mode) { return booted ? Scores.list(mode) : []; }
  function lastPlace() { return placed; }

  // kit-profile's events. `beforeChange` still names the OUTGOING profile, so its
  // rows go to that profile's store. `change` names the INCOMING one: the reset,
  // then its settings. The ring belongs to the profile that recorded it, so it
  // is emptied too, and refilled from the incoming profile while capture is on
  // (the same read a capture turned on with an empty ring makes).
  function onProfileEvent(name, detail) {
    if (name === "beforeChange") saveTelemetry();
    if (name === "change") {
      activateSettings();
      Telemetry.clear();
      if (Telemetry.enabled()) loadTelemetry();
    }
  }

  function boot(settingsHooks) {
    if (booted) return;
    booted = true;
    hooks = settingsHooks;
    Store = KitStorage.create({
      gameId: C.GAME_ID,
      keys: {
        settings:  { version: 1 },
        progress:  { version: 1 },
        // ⛔ BUMP THIS WITH TELEMETRY_FIELDS (21-telemetry.js): the stored rows are
        // arrays in that order, and an envelope of another version reads empty.
        telemetry: { version: 1 },
        scores:    { version: 1 },
      },
    });
    // ⛔ `modes` are state.mode's two values; OVERDRIVE's list waits for CS012.
    Scores = createScores({ store: Store, key: "scores", perMode: C.SCORES_PER_MODE,
                            modes: ["classic", "overdrive"] });
    // ⛔ legacyRosterKey is `null`, NEVER '': kit-profile reads an empty string
    // as "use the default" and imports Orbital Overhaul's roster (plan R4).
    const kit = KitProfile.create({
      storage: Store,
      maxProfiles: C.PROFILE_MAX,
      legacyRosterKey: null,
      legacyProbeKeys: [],
      onEvent: onProfileEvent,
    });
    Profiles.attach(kit);
    // THE SILENT FIRST LAUNCH (Paul's M2): one ANONYMOUS profile, and the title as
    // before. ⛔ createAnonymous() does not select, so select() follows it.
    // ⚠ select() of the id boot already points at is kit-profile's no-op, so the
    // playerId is minted by current() (log/CS011.md, P1).
    if (kit.firstBoot) {
      const made = kit.createAnonymous();
      if (made.ok) kit.select(made.profile.id);
      kit.current();
    }
    // The selected profile's settings, over the evaluation-time defaults.
    activateSettings();
  }

  return {
    boot, saveSettings, saveTelemetry, loadTelemetry,
    runStarted, benchUsed, eligible, runOpen, runEnded, scores, lastPlace,
  };
})();

// ---------------------------------------------------------------------------
// THE LOCAL TOP 10 — createScores() (GDD 15.3; plan R20). CS011 P3.
// ---------------------------------------------------------------------------
//
// ⛔ KIT-SHAPED FROM ITS FIRST COMMIT: the future kit-scores
// (src/22-meta.NOTES.md). It reads no `C`, no `state` and no game global.
// Everything crosses as an option: `store` (anything with get(key, fallback)
// and set(key, value), a kit-storage store here), `key` (declared by the
// caller), `perMode` (rows kept per mode) and `modes` (the mode names).
//
// One stored value, { <mode>: [row, …] }, each list best first. A row is the
// caller's object, copied; the table reads only its `score`. ⛔ A ROW PLACES
// WITH score > 0 AND A PLACE IN ITS MODE'S TOP perMode, AND A TIE GOES BELOW
// the rows already there. The stored value is read on every call and loads
// known-value-else-default: a mode that is not an array reads empty, and a row
// without a finite score > 0 is dropped. An undeclared mode throws, as an
// undeclared kit-storage key does.
function createScores(options) {
  const opts = options || {};
  const { store, key, perMode, modes } = opts;
  if (!store || typeof store.get !== "function" || typeof store.set !== "function") {
    throw new Error("createScores: options.store needs get() and set()");
  }
  if (typeof key !== "string" || key === "") throw new Error("createScores: options.key must be a non-empty string");
  if (!Number.isInteger(perMode) || perMode < 1) throw new Error("createScores: options.perMode must be a whole number >= 1");
  if (!Array.isArray(modes) || modes.length === 0) throw new Error("createScores: options.modes must be a non-empty array");

  function known(mode) {
    if (modes.indexOf(mode) < 0) throw new Error("createScores: undeclared mode " + JSON.stringify(mode));
  }
  const counts = r => r !== null && typeof r === "object" && Number.isFinite(r.score) && r.score > 0;

  function readAll() {
    const d = store.get(key, null);
    const out = {};
    for (const m of modes) {
      const rows = d !== null && typeof d === "object" && Array.isArray(d[m]) ? d[m].filter(counts) : [];
      rows.sort((a, b) => b.score - a.score);   // stable: equal scores keep their order
      out[m] = rows.slice(0, perMode);
    }
    return out;
  }

  // The rank `score` would take, 1-based, below every row it ties; 0 for none.
  function placeOf(rows, score) {
    if (!(Number.isFinite(score) && score > 0)) return 0;
    let i = 0;
    while (i < rows.length && rows[i].score >= score) i++;
    return i < perMode ? i + 1 : 0;
  }

  return {
    qualifies(mode, score) {
      known(mode);
      return placeOf(readAll()[mode], score) > 0;
    },
    // The row's rank, or 0 and nothing written when it does not place.
    add(mode, row) {
      known(mode);
      const all = readAll();
      const rank = placeOf(all[mode], row ? row.score : undefined);
      if (rank === 0) return 0;
      all[mode].splice(rank - 1, 0, Object.assign({}, row));
      all[mode].length = Math.min(all[mode].length, perMode);
      store.set(key, all);
      return rank;
    },
    list(mode) {
      known(mode);
      return readAll()[mode];
    },
  };
}

// ---------------------------------------------------------------------------
// THE HIGHEST LEVEL CLEARED (GDD 4.6). CS008 P3.
// ---------------------------------------------------------------------------
//
// ⛔ NOT IN `state`. startGame() rewrites `state` from newState(), and a record
// of what earlier runs reached has to survive exactly that. A field there would
// reset on every restart and the list would never grow.
//
// ⛔ levelRecord() IS THE ONE ROUTE TO IT. Its one writer is the clear edge in
// Game.update() (23-main.js) and its one reader is startDepthOptions() below.
// Since CS011 P2 it is the ACTIVE PROFILE's `progress` { highestCleared } (Paul's
// M8): "the highest level ever cleared by that profile", so a change of profile
// changes the list. Read on every call, never cached, so a switch needs no hook.
// A stored value that is not a whole number >= 0 reads as 0.
const _profileLevelRecord = {
  highestCleared() {
    const d = Profiles.scope().get("progress", null);
    const n = d !== null && typeof d === "object" ? d.highestCleared : undefined;
    return Number.isInteger(n) && n >= 0 ? n : 0;
  },
  noteCleared(level) {
    if (level > this.highestCleared()) Profiles.scope().set("progress", { highestCleared: level });
  },
};

function levelRecord() {
  return _profileLevelRecord;
}

// The Start Depth list, ascending (GDD 4.6). C.START_DEPTH_FIRST on a first
// session; thereafter every odd depth up to the highest level cleared, snapped
// DOWN to odd, and never past C.START_DEPTH_CAP. Clearing 14 offers 13;
// clearing 90 offers 81. ⛔ The first list is never shrunk — a record below 9
// still offers 1–9.
function startDepthOptions() {
  const out = C.START_DEPTH_FIRST.slice();
  const cleared = levelRecord().highestCleared();
  const snapped = cleared % 2 === 1 ? cleared : cleared - 1;
  const top = Math.min(C.START_DEPTH_CAP, snapped);
  for (let d = out[out.length - 1] + 2; d <= top; d += 2) out.push(d);
  return out;
}

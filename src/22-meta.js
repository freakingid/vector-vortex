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

  // ⛔ THE RUN'S END — A STUB UNTIL CS011 P3, which calls it from the two seats
  // (plan R7: the top of quitToTitle() from pause, and frame() at game over)
  // and adds the score record. Its telemetry write is P2's.
  function runEnded(outcome) {
    saveTelemetry();
  }

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

  return { boot, saveSettings, saveTelemetry, loadTelemetry, runEnded };
})();

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

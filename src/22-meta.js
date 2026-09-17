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
// ⚠ NO SETTING OR RECORD IS SAVED YET. levelRecord() below is still the
// in-memory SESSION record (Paul, S1) until CS011 P2 re-points it at `progress`.

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
    // { id, name, playerId } — mints the playerId if it is absent (kit-profile).
    current() { return kit.current(); },
    list() { return kit.list(); },
  };
})();

const Meta = (function () {
  let booted = false;

  // kit-profile's events. ⚠ `beforeChange` and `change` must be handled before a
  // second profile can be selected; CS011 P2 wires them (reset, THEN load).
  function onProfileEvent(name, detail) {}

  function boot() {
    if (booted) return;
    booted = true;
    Store = KitStorage.create({
      gameId: C.GAME_ID,
      keys: {
        settings:  { version: 1 },
        progress:  { version: 1 },
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
  }

  return { boot };
})();

// ---------------------------------------------------------------------------
// THE HIGHEST LEVEL CLEARED (GDD 4.6). CS008 P3.
// ---------------------------------------------------------------------------
//
// ⛔ NOT IN `state`. startGame() rewrites `state` from newState(), and a record
// of what earlier runs reached has to survive exactly that. A field there would
// reset on every restart and the list would never grow.
//
// ⛔ levelRecord() IS THE ONE FUNCTION CS011 RE-POINTS. Its one writer is the
// clear edge in Game.update() (23-main.js) and its one reader is
// startDepthOptions() below; both go through it, so swapping the session record
// for the profile store ("highest level ever cleared by that profile") is this
// function's body and nothing else.
const _sessionLevelRecord = (function () {
  let highest = 0;
  return {
    highestCleared() { return highest; },
    noteCleared(level) { if (level > highest) highest = level; },
  };
})();

function levelRecord() {
  return _sessionLevelRecord;
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

// 22-meta.js — profiles, scores, leaderboard wiring (GDD 15). CS008 P3 lands
// the first piece: the record Start Depth's list is built from (GDD 4.6).
//
// ⛔ NOTHING HERE TOUCHES STORAGE YET. kit-storage owns the keyspace and
// Profiles.keyFor(base) is the one route to a key (CLAUDE.md, Save data); CS011
// builds both. Until then the record is an in-memory SESSION record (Paul, S1):
// it lives as long as the page does, and a reload starts the list over at 1–9.

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

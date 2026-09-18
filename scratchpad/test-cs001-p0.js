// test-cs001-p0.js — CS001 P0 smoke test. The suite is green from commit one.
//
// Asserts only what P0 owns: the build concatenates, the result parses, C
// exists and is the single tuning surface. ⛔ No global counts here — those
// live in test-registry.js.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260830);        // ⛔ before buildGame()

H.syntaxCheck();
H.assert(true, "built script parses under node --check");

const X = H.buildGame();

H.assert(typeof X.C === "object" && X.C !== null, "C is an object");
// ⛔ REWRITTEN IN PLACE AT CS012 P6 (the review): GAME_ID is kit-storage's SAVE
// KEYSPACE, and since CS012 P3 the Worker's names are C.LEADERBOARD_GAME_IDS.
// The value did not move — renaming it would orphan every stored key.
H.eq(X.C.GAME_ID, "vector-vortex", "GAME_ID is the save keyspace, and it never moves");
H.eq(X.C.SHOT_MAX, 8, "shot cap");
H.assert(X.C.LAYER_THRESHOLD && Object.keys(X.C.LAYER_THRESHOLD).every(k => +k >= 2 && +k <= 4),
  "every music layer tier key is in 2..4 (a tier >=5 gate never opens)");
H.assert(X.C.INT_ATTACK < X.C.INT_RELEASE,
  "intensity smoothing is asymmetric: attack faster than release");
H.assert(X.C.FILTER_MIN_HZ < X.C.FILTER_MAX_HZ, "filter sweep range is ordered");
H.assert(X.C.RESPAWN_PUSH_DEPTH > 0 && X.C.RESPAWN_PUSH_DEPTH < 1, "respawn push depth normalized");

H.report();

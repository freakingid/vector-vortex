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
H.eq(X.C.GAME_ID, "vector-vortex", "GAME_ID matches the Worker registry name");
H.eq(X.C.SHOT_MAX, 8, "shot cap");
H.assert(X.C.LAYER_THRESHOLD && Object.keys(X.C.LAYER_THRESHOLD).every(k => +k >= 2 && +k <= 4),
  "every music layer tier key is in 2..4 (a tier >=5 gate never opens)");
H.assert(X.C.INT_ATTACK < X.C.INT_RELEASE,
  "intensity smoothing is asymmetric: attack faster than release");
H.assert(X.C.FILTER_MIN_HZ < X.C.FILTER_MAX_HZ, "filter sweep range is ordered");
H.assert(X.C.RESPAWN_PUSH_DEPTH > 0 && X.C.RESPAWN_PUSH_DEPTH < 1, "respawn push depth normalized");

H.report();

// scratchpad/test-registry.js — ⛔ THE ONLY FILE IN THE SUITE THAT MAY NAME A
// GLOBAL COUNT. Config key count, well count, track count, lever count live
// here and nowhere else, so adding one is a one-file edit.
//
// Everywhere else: a phase asserts THE THING IT BUILT, never a total.
//   Wrong: eq(Object.keys(X.C).length, 84, "config size")   <- in a phase test
//   Right: assert("JUMP_COOLDOWN" in X.C, "jump cooldown exists")
"use strict";

// ⛔ THE NUMBERS. Nothing else in scratchpad/ may repeat them.
const COUNTS = {
  wells: 16,        // GDD 3.4 — the sixteen well shapes
  openWells: 6,     // of those, open topology
  tracks: 0,        // GDD 11.7 — raise as tracks land
  enemies: 0,       // GDD 6.1 — raise as enemies land
};

function hasKnob(X, name, spec, A) {
  const out = { ok: true, failures: [] };
  const has = name in X.C;
  if (A) A.assert(has, `C.${name} exists`); else if (!has) { out.ok = false; out.failures.push(name); }
  if (has && spec && spec.def !== undefined) {
    const good = Object.is(X.C[name], spec.def);
    if (A) A.assert(good, `C.${name} default`); else if (!good) { out.ok = false; out.failures.push(`${name} default`); }
  }
  return A ? undefined : out;
}

module.exports = { COUNTS, hasKnob };

if (require.main === module) {
  const H = require("./_harness.js");
  const { installSeed } = require("./_seeded-random.js");
  installSeed(1);
  const X = H.buildGame();
  H.assert(typeof X.C === "object", "C exists");
  H.report("test-registry.js");
}

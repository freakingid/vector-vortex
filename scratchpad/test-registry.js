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
  enemies: 4,       // GDD 6.1 — raise as enemies land. CS004 P4: the Thorn
  // ⛔ NOT THE SAME NUMBER AS `enemies`, AND FROM CS004 P3 ON IT IS LARGER.
  // `enemies` counts GDD 6.1's ROSTER ROWS; this counts ENEMY_KINDS rows
  // (08-spawner.js), and the two stopped coinciding twice over:
  //   - one row per CARRIER VARIANT, so GDD 6.2's three cargoes are three rows
  //     behind one roster entry (CS005 adds carrierDrifter and carrierSurger);
  //   - the Weaver's BOLT is a kind and is not an enemy on the roster.
  // Keeping them as two numbers is what lets a phase say which one it moved.
  enemyKinds: 5,    // vaulter, carrierVaulter, weaver, weaverBolt, thorn
};

// ⛔ THE state FIELD INVENTORY (02-state.js). An exhaustive list is a global
// count, so it lives here rather than in the phase test that happens to check
// it — test-cs002-p1.js asserted a bare 8 until CS003 P1 legitimately added two
// fields and turned a build-ahead guard into a false alarm.
//
// A changeset adds its fields under its own key, in the phase that lands them.
// The guard is the SUM: a field in state with no entry here is a field built
// ahead of the changeset that can explain it (02-state.js's own header rule).
const STATE_FIELDS = {
  CS002: ["screen", "wellIndex", "level", "time", "input", "skimmer", "shots", "shotCooldown"],
  CS003: ["seed", "rng", "enemies", "spawn", "clearHold", "purgeUses", "purgeLatched",
          "lives", "invulnTime"],
};

function stateFields() {
  const out = [];
  for (const k of Object.keys(STATE_FIELDS)) out.push(...STATE_FIELDS[k]);
  return out;
}

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

module.exports = { COUNTS, STATE_FIELDS, stateFields, hasKnob };

if (require.main === module) {
  const H = require("./_harness.js");
  const { installSeed } = require("./_seeded-random.js");
  installSeed(1);
  const X = H.buildGame();
  H.assert(typeof X.C === "object", "C exists");
  H.report("test-registry.js");
}

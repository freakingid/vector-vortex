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
  tracks: 3,        // GDD 11.7 — raise as tracks land. CS009 P2: title, pulse.
                    // CS012 P1: drive
  enemies: 9,       // GDD 6.1, 6.4 — raise as enemies land. CS005 P3: the
                    // Surger, which completes the Classic roster. CS012 P2: the
                    // Reaver, Overdrive's first. CS013 P3: the Warden,
                    // Overdrive's second. CS013 P4: the Mimic, its third and
                    // ⚠ the one ON PROBATION — GDD 21 #6's verdict is CS017's,
                    // and cutting it moves this number back to 8
  // ⛔ NOT THE SAME NUMBER AS `enemies`, AND FROM CS004 P3 ON IT IS LARGER.
  // `enemies` counts GDD 6.1's ROSTER ROWS; this counts ENEMY_KINDS rows
  // (08-spawner.js), and the two stopped coinciding twice over:
  //   - one row per CARRIER VARIANT, so GDD 6.2's three cargoes are three rows
  //     behind one roster entry (CS005 P4 landed carrierDrifter and
  //     carrierSurger, and moved this number alone);
  //   - the Weaver's BOLT is a kind and is not an enemy on the roster.
  // Keeping them as two numbers is what lets a phase say which one it moved.
  enemyKinds: 13,   // vaulter, carrierVaulter, carrierDrifter, carrierSurger,
                    // weaver, weaverBolt, thorn, drifter, surger; CS012 P2's
                    // reaver, CS013 P3's warden and P4's mimic and mimicShot.
                    // ⛔ GDD 6.2's variant table is complete (no Overdrive enemy
                    // is cargo, R16). ⛔ P4 moved this by TWO against `enemies`'
                    // ONE: a mimicShot is a kind with no roster row, the Weaver
                    // bolt's case, which is what keeps the two numbers apart.
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
  // ⛔ `clearHold` IS GONE, NOT MOVED. CS003 P2 landed it as the Dive's
  // placeholder and CS006 P3 deleted the field, its constant and its branch
  // together (GDD 5). Leaving the entry here would make the SUM guard read a
  // deleted field as an orphan.
  CS003: ["seed", "rng", "enemies", "spawn", "purgeUses", "purgeLatched",
          "lives", "invulnTime"],
  CS006: ["bandRoll", "dive"],
  // ⛔ ONE FIELD, NOT EIGHT. CS007 P4's telemetry counters are a BAG
  // (state.tally) rather than eight fields on state, so the sum guard above
  // moves by one and a ninth counter costs this file nothing — the inventory
  // is about fields built ahead of their changeset, and a counter inside a bag
  // one changeset owns is not a second answer to that question.
  CS007: ["tally"],
  // GDD 7 and 4.4 — addScore()'s total and its next milestone, and the
  // per-well flag behind the "no death" clear bonus (12-scoring.js).
  CS008: ["score", "nextLife", "diedThisWell", "mode", "startDepth"],
  // ⛔ TWO BAGS, ONE PER FEATURE (CS012 R2): `jump` is P5's (GDD 14.2) and
  // `combo` is P4's (GDD 14.4). ⚠ P5 SHIPPED FIRST, which is why the order here
  // is P5's then P4's rather than R2's — the sum is what the guard reads. Both
  // are Overdrive's, both are reset by newState(), and neither is read at all
  // in Classic.
  CS012: ["jump", "combo"],
  // ⛔ A SECOND ARRAY AND ONE BAG (CS013 P1, R2): `tokens` is Overdrive's second
  // entity array (a token is not an enemy, T1) and `powers` the three lasting
  // effects' flags, which CS013 P2 gives their readers. Both reset by newState().
  CS013: ["tokens", "powers"],
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

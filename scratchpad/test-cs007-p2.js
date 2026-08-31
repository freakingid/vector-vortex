// test-cs007-p2.js — CS007 P2: the heat clock, the seven derived accessors, and
// the respawn guarantee under heat (GDD §4.4, §8, §17 item 7).
//
// Asserts what P2 owns. It makes no claim about GDD §8.1's introduction
// schedule (P3), telemetry (P4), or scoring — none of those exist yet.
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. THE GUARANTEE IS ASSERTED TWICE AND THE SECOND ONE IS THE REAL ONE. §1's
//     arithmetic is a property over constants; §2 drives the shipped
//     respawnSkimmer() and Game.update(). A property over constants is not a
//     proof that the code reads them.
//  2. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  3. §3's endpoint cases use Object.is, not a tolerance. Form A evaluates to
//     its base and its clamp EXACTLY at levels 1 and 99 — measured — and a
//     tolerance would hide the day that stops being true.
//  4. §6 reads the BUILT file with comments stripped by a character scanner.
//     _harness.js's header says why a regex is the wrong tool; the scanner is
//     checked for soundness before anything is asserted off it.
"use strict";

const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

const LEVELS = 200;                       // GDD §17 item 7's range
const WINDOW = Math.round(C.RESPAWN_INVULN / DT);   // steps of invulnerability

// ---------------------------------------------------------------------------
// 1. ⛔ THE RESPAWN GUARANTEE, AS ARITHMETIC, OVER LEVELS 1..200
// ---------------------------------------------------------------------------
//
// GDD §4.4: enemies above C.RESPAWN_PUSH_DEPTH are clamped down to it on
// respawn so the player is never killed on re-entry. Heat raises every climb
// rate, so the guarantee stops being a fact about one number and becomes a
// property of the whole curve:
//
//   (1 - RIM_CONTACT_DEPTH - RESPAWN_PUSH_DEPTH)
//       / (CLIMB_MAX_BASE * climbMult(level))  >  RESPAWN_INVULN
//
// ⛔ NOT A SPOT CHECK. The margin at the ceiling is +0.087 s, and 1.4815 is the
// multiplier that spends it: a retune that walked past it would pass any test
// that sampled a handful of levels.

H.eq(C.RESPAWN_PUSH_DEPTH, 0.55,
     "⛔ RESPAWN_PUSH_DEPTH is unchanged at 0.55 — H1's answer holds the guarantee " +
     "with a hard cap on the climb, not with a derived push");
H.eq(C.CLIMB_MULT_MAX, 1.40, "⛔ and the hard cap is 1.40 (1.4815 is the breach)");
H.eq(C.CLIMB_MAX_BASE, C.VAULT_CLIMB,
     "⛔ CLIMB_MAX_BASE equals VAULT_CLIMB today — it is a SEPARATE constant so a " +
     "future entity faster than a Vaulter has one line to change, not a silent escape");

// ⛔ And it really is the roster's fastest CONTACT-KILLING climb. The Weaver is
// excluded on its shipped field and not on a comment: killDepth === null means
// its body never kills, at any depth, so its 0.22 cannot bind the guarantee.
const CONTACT_CLIMBS = ["VAULT_CLIMB", "CARRIER_CLIMB", "DRIFT_CLIMB", "SURGE_CLIMB"];
for (const k of CONTACT_CLIMBS) {
  H.assert(C[k] <= C.CLIMB_MAX_BASE,
           `⛔ ${k} (${C[k]}) is at or under CLIMB_MAX_BASE — the guarantee names the fastest`);
}
H.eq(new X.Weaver(0, 0).killDepth, null,
     "⛔ and the Weaver's body is excluded on its SHIPPED killDepth, not on a comment");

const reach = base => (1 - C.RIM_CONTACT_DEPTH - C.RESPAWN_PUSH_DEPTH) / base;

let breach = null, worstMargin = Infinity, worstLevel = 0;
for (let l = 1; l <= LEVELS; l++) {
  const t = reach(C.CLIMB_MAX_BASE * X.climbMult(l));
  if (!(t > C.RESPAWN_INVULN)) breach = breach || `level ${l}: ${t.toFixed(4)}s`;
  if (t - C.RESPAWN_INVULN < worstMargin) { worstMargin = t - C.RESPAWN_INVULN; worstLevel = l; }
}
H.assert(!breach,
         `⛔ the push-to-kill climb outlasts RESPAWN_INVULN at EVERY level 1..${LEVELS} ` +
         `(${breach})`);
H.close(worstMargin, 0.0873, 1e-4,
        `⛔ and the worst margin is the MEASURED +0.087 s, at level ${worstLevel} — a ` +
        `margin that grew is a cap that was lowered, and one that shrank is a breach coming`);

// The rest of the roster, at the ceiling. ⚠ These are not slack: they are what
// says the Vaulter is the entity the guarantee is about.
const MARGINS = { VAULT_CLIMB: 0.0873, SURGE_CLIMB: 0.4048, DRIFT_CLIMB: 0.6978, CARRIER_CLIMB: 1.0974 };
for (const [k, want] of Object.entries(MARGINS)) {
  H.close(reach(C[k] * C.CLIMB_MULT_MAX) - C.RESPAWN_INVULN, want, 1e-4,
          `⛔ ${k} clears the window by ${want.toFixed(4)}s at CLIMB_MULT_MAX`);
}

// ⛔ THE BOLT, AND IT IS THE ONE THING HERE THAT IS NOT SAFE BY ARITHMETIC.
// C.WEAVER_BOLT_SPEED 0.32 is faster than CLIMB_MAX_BASE and DOES carry a rim
// killDepth. Pushed to 0.55 it reaches that band at 1.250 s — INSIDE the 1.5 s
// window. It is safe by SELF-TERMINATION instead: WeaverBolt.update() sets
// `dead` on the step after depth >= 1, at 1.406 s plus one step, still inside.
// ⛔ Written down here so the next session does not have to rediscover it, and
// so the reason the bolt is NOT heat-scaled is on the record: a faster bolt is
// safer and a SLOWER one would breach.
H.assert(reach(C.WEAVER_BOLT_SPEED) < C.RESPAWN_INVULN,
         `⛔ a pushed bolt reaches its killDepth INSIDE the window ` +
         `(${reach(C.WEAVER_BOLT_SPEED).toFixed(4)}s of ${C.RESPAWN_INVULN}s) — the ` +
         `arithmetic does NOT save it, and this assertion is here to say so`);
const boltEnd = (1 - C.RESPAWN_PUSH_DEPTH) / C.WEAVER_BOLT_SPEED + DT;
H.assert(boltEnd < C.RESPAWN_INVULN,
         `⛔ and it self-terminates first, at ${boltEnd.toFixed(4)}s — depth 1 plus the ` +
         `one step WeaverBolt.update() spends noticing`);

// ---------------------------------------------------------------------------
// 2. ⛔ THE SAME GUARANTEE, DRIVEN THROUGH THE SHIPPED CODE
// ---------------------------------------------------------------------------
//
// Trap 1. §1 proves the constants are consistent; this proves the build reads
// them. Real startGame / respawnSkimmer / Game.update, a real Vaulter parked at
// the rim in the craft's own lane, and the whole invulnerability window stepped.
//
// ⛔ Game.update() is the raw simulation step — hit-stop lives in the frame
// loop, not here — so a headless driver never freezes and the respawn lands on
// the first step that finds `skimmer.dead` (23-main.js).

// A board with exactly one threat on it: quota spent, arrays cleared, no input.
function riggedRim(level) {
  G.reset();
  X.startGame(SEED);
  state.level = level;
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  G.input.reset();
  state.lives = C.START_LIVES;
  return X.WELLS[state.wellIndex];
}

// Kill the craft with `kind` parked at the rim in its lane, then hand back the
// board on the step AFTER the respawn — which is the step the push has happened
// on and the invulnerability window has been armed on.
function killAndRespawn(kind) {
  const e = X.spawnEnemy(kind, state.skimmer.lane, 1);
  const before = state.lives;
  let guard = 0;
  while (state.lives === before && guard++ < 600) G.update(DT);
  H.assert(state.lives === before - 1, `${kind}: the craft died at the rim (setup)`);
  G.update(DT);                       // the respawn step
  return e;
}

for (const level of [1, 50, 99, 200]) {
  riggedRim(level);
  const v = killAndRespawn("vaulter");
  const tag = `L${level}`;

  H.assert(v.depth <= C.RESPAWN_PUSH_DEPTH + C.VAULT_CLIMB * C.CLIMB_MULT_MAX * DT + 1e-12,
           `${tag}: ⛔ the rim Vaulter was clamped to RESPAWN_PUSH_DEPTH by the real ` +
           `respawnSkimmer() (at ${v.depth.toFixed(4)}, one entity-pass step above it)`);
  // ⛔ ZERO, not one step. state.invulnTime counts UP and the aging is the ELSE
  // branch of the respawn check (23-main.js), so the step that respawns does not
  // also age — the window is exactly RESPAWN_INVULN rather than one step short.
  H.eq(state.invulnTime, 0, `${tag}: and the window is armed at exactly zero`);

  const lives = state.lives;
  const depth0 = v.depth;
  let died = null, leftWindow = null;
  for (let i = 0; i < WINDOW && !leftWindow; i++) {
    if (state.invulnTime >= C.RESPAWN_INVULN) { leftWindow = i; break; }
    G.update(DT);
    if (state.lives < lives) died = died || `at step ${i}, invulnTime ${state.invulnTime}`;
  }
  H.assert(!died,
           `${tag}: ⛔ NO DEATH anywhere in the invulnerability window, on a live board ` +
           `with a real rim Vaulter pushed down in front of the craft (${died})`);
  H.assert(!leftWindow, `${tag}: and the window really lasted ${WINDOW} steps (${leftWindow})`);

  // ⛔ NON-VACUITY, AND IT IS THE GUARANTEE'S ACTUAL CONTENT. The enemy was a
  // live threat throughout — climbing, not parked — and the reason it did not
  // kill is that it is still SHORT of its kill band when the window ends.
  H.assert(!v.dead && v.depth > depth0,
           `${tag}: and the Vaulter was alive and climbing the whole time — a dead or ` +
           `stalled one would make the case above vacuous`);
  H.assert(v.depth < v.killDepth,
           `${tag}: ⛔ and it is STILL short of its killDepth when the window ends ` +
           `(${v.depth.toFixed(4)} < ${v.killDepth}) — that gap IS the guarantee`);
}

// ⛔ AND THE BOLT, ON THE SAME RIG. It reaches its killDepth inside the window
// and the craft survives anyway, because it is gone before the window is.
//
// ⚠ A VAULTER IS ON THE BOARD TOO, AND IT IS A FIXTURE RATHER THAN NOISE. A
// bolt is `blocksClear: false`, so a board holding nothing else CLEARS on the
// step it is released — the well dives out from under the case and the craft
// dies twenty seconds later to a different well's spawner. The Vaulter holds
// the well open, and the respawn clamps both of them to 0.55 together.
{
  riggedRim(99);
  X.spawnEnemy("vaulter", state.skimmer.lane, 1);
  const b = X.spawnEnemy("weaverBolt", state.skimmer.lane, 1);
  const before = state.lives;
  let guard = 0;
  while (state.lives === before && guard++ < 900) G.update(DT);
  H.assert(state.lives === before - 1, "bolt: the craft died at the rim (setup)");
  H.assert(!b.dead && state.enemies.indexOf(b) !== -1,
           "bolt: and the bolt is still on the board when it does — it dies at depth 1, " +
           "which is later than killDepth 0.95 (setup)");
  G.update(DT);                                   // the respawn step
  H.close(b.depth, C.RESPAWN_PUSH_DEPTH + C.WEAVER_BOLT_SPEED * DT, 1e-9,
          "⛔ the bolt was clamped to RESPAWN_PUSH_DEPTH too — it is a POSITION, so the " +
          "⚠ SETTLED band reaches it exactly as it reaches a Vaulter");

  const lives = state.lives;
  let armed = false, gone = null, died = null;
  for (let i = 0; i < WINDOW; i++) {
    if (!b.dead && b.depth >= b.killDepth) armed = true;
    if (b.dead && gone === null) gone = state.invulnTime;
    G.update(DT);
    if (state.lives < lives) died = died || `at step ${i}`;
  }
  H.assert(armed,
           "⛔ the pushed bolt DID reach its killDepth inside the window — the live form " +
           "of §1's warning, and what makes the survival below a real claim");
  H.assert(gone !== null && gone < C.RESPAWN_INVULN,
           `⛔ and it was dead again before the window ended (at invulnTime ${gone}) — ` +
           `self-termination, not arithmetic`);
  H.assert(!died, `⛔ and the craft never died to it, or to the Vaulter beside it (${died})`);
}

// ⛔ AND THE `anchored` SKIP IS UNTOUCHED — ⚠ SETTLED, GDD §4.4. A Thorn's depth
// is a LENGTH; clamping a length is a free chip, not a push. This phase raised
// every climb rate in the build and narrowed nothing about the band.
{
  riggedRim(99);
  const thorn = new X.Thorn(1, 0.9);
  state.enemies.push(thorn);
  const vault = X.spawnEnemy("vaulter", 2, 0.9);
  X.respawnSkimmer(state, X.WELLS[state.wellIndex], state.skimmer.lane);
  H.eq(thorn.anchored, true, "the Thorn is the one anchored entity in the roster");
  H.eq(thorn.depth, 0.9, "⛔ and its LENGTH is untouched by the respawn push — free chips");
  H.eq(vault.depth, C.RESPAWN_PUSH_DEPTH, "while a Vaulter's POSITION is clamped to 0.55");
}

// ---------------------------------------------------------------------------
// 3. heat(), AND GDD §17 ITEM 7 AS A PROPERTY
// ---------------------------------------------------------------------------

H.assert(Object.is(X.heat(1), 0),
         `⛔ heat(1) is EXACTLY 0 — this is what makes every level-1 test in the suite ` +
         `provably unreachable by the clock, and what left GOLDEN_LANES unmoved ` +
         `(got ${X.heat(1)})`);

let notMono = null;
for (let l = 1; l < LEVELS; l++) {
  if (!(X.heat(l + 1) > X.heat(l))) notMono = notMono || `heat(${l + 1}) <= heat(${l})`;
}
H.assert(!notMono,
         `⛔ GDD §17 item 7 — heat(n+1) > heat(n) for n in 1..${LEVELS}, STRICTLY. ` +
         `heat() itself never plateaus; the plateau lives in the seven clamps (${notMono})`);
H.assert(X.heat(LEVELS) > X.heat(C.HEAT_FULL_LEVEL),
         "⛔ and it is still rising past HEAT_FULL_LEVEL — a hold inside heat() would " +
         "fail item 7 at n = 99, which is why the clamps are downstream");

H.assert(!("HEAT_HOLD_LEVEL" in C),
         "⛔ C.HEAT_HOLD_LEVEL was NOT built — every derived row is clamped, so a hold is " +
         "inert by construction (PLANNED-FEATURES-CS007.md §2.3)");

// ---------------------------------------------------------------------------
// 4. THE SEVEN ACCESSORS — endpoints, direction, and the clamp
// ---------------------------------------------------------------------------
//
// ⛔ Form A: v(level) = base + (clamp - base) * min(heat(level) / heat(99), 1).
// Trap 3 — the endpoints are EXACT, at both ends, on every row.

const ROWS = [
  // name,              fn,                   base,                    clamp,                     rises
  ["spawnInterval",     X.spawnInterval,      C.SPAWN_INTERVAL,        C.SPAWN_INTERVAL_MIN,      false],
  ["enemyConcurrent",   X.enemyConcurrent,    C.ENEMY_CONCURRENT,      C.ENEMY_CONCURRENT_MAX,    true],
  ["climbMult",         X.climbMult,          1,                       C.CLIMB_MULT_MAX,          true],
  ["vaultInterval",     X.vaultInterval,      C.VAULT_INTERVAL,        C.VAULT_INTERVAL_MIN,      false],
  ["vaultRimInterval",  X.vaultRimInterval,   C.VAULT_RIM_INTERVAL,    C.VAULT_RIM_INTERVAL_MIN,  false],
  ["surgeInterval",     X.surgeInterval,      C.SURGE_INTERVAL,        C.SURGE_INTERVAL_MIN,      false],
  ["weaverApex",        X.weaverApex,         C.WEAVER_APEX,           C.WEAVER_APEX_MAX,         true],
];

H.eq(ROWS.length, 7, "seven derived values, seven accessors");
H.eq(C.HEAT_FULL_LEVEL, 99, "⛔ HEAT_FULL_LEVEL is 99 — GDD §8.2's legend level");

for (const [name, fn, base, clamp, rises] of ROWS) {
  H.assert(typeof fn === "function", `${name} is exported by the build`);
  H.assert(Object.is(fn(1), base),
           `⛔ ${name}(1) is EXACTLY its shipped base ${base} — heat(1) = 0 (got ${fn(1)})`);
  H.assert(Object.is(fn(C.HEAT_FULL_LEVEL), clamp),
           `⛔ ${name}(${C.HEAT_FULL_LEVEL}) is EXACTLY its clamp ${clamp} (got ${fn(C.HEAT_FULL_LEVEL)})`);

  let outside = null, wrongWay = null, moved = null, past = null;
  const lo = Math.min(base, clamp), hi = Math.max(base, clamp);
  for (let l = 1; l <= LEVELS; l++) {
    const v = fn(l);
    if (!(v >= lo - 1e-12 && v <= hi + 1e-12)) outside = outside || `${name}(${l}) = ${v}`;
    if (l > 1) {
      const p = fn(l - 1);
      if (rises ? v < p : v > p) wrongWay = wrongWay || `${name}(${l}) = ${v} after ${p}`;
      if (l <= C.HEAT_FULL_LEVEL && name !== "enemyConcurrent" && !(rises ? v > p : v < p)) {
        moved = moved || `${name}(${l}) did not move off ${p}`;
      }
      if (l > C.HEAT_FULL_LEVEL && !Object.is(v, clamp)) past = past || `${name}(${l}) = ${v}`;
    }
  }
  H.assert(!outside,
           `⛔ ${name} stays inside [${lo}, ${hi}] at every level 1..${LEVELS} — GDD §17 ` +
           `item 7's second half (${outside})`);
  H.assert(!wrongWay,
           `${name} is monotone ${rises ? "UP" : "DOWN"}, the direction DIFFICULTY-NOTES.md ` +
           `names (${wrongWay})`);
  H.assert(!moved,
           `⛔ and STRICTLY so below the clamp — a row that flattened early would be a ` +
           `knob that quietly stopped working (${moved})`);
  H.assert(!past,
           `⛔ and it HOLDS at its clamp past level ${C.HEAT_FULL_LEVEL}, which is what makes ` +
           `C.HEAT_HOLD_LEVEL unnecessary rather than merely unbuilt (${past})`);
}

// ⛔ THE CONCURRENCY LADDER, WHICH IS WHAT A PLAYER IS MEANT TO BE ABLE TO NAME
// (GDD §1.1 P3). MEASURED, and asserted as the STEP LEVELS rather than as a
// handful of samples: enemyConcurrent() floors a continuous interpolation, so
// one innocent retune slides a step by a level and nothing else notices.
// ⚠ Level 15 sits at 4.998 — the tightest step in the ladder by far.
const LADDER = [[1, 5, 3], [6, 15, 4], [16, 39, 5], [40, 69, 6], [70, 98, 7], [99, LEVELS, 8]];
let ladderBad = null;
for (const [from, to, want] of LADDER) {
  for (let l = from; l <= to; l++) {
    if (X.enemyConcurrent(l) !== want) {
      ladderBad = ladderBad || `enemyConcurrent(${l}) = ${X.enemyConcurrent(l)}, want ${want}`;
    }
  }
}
H.assert(!ladderBad,
         `⛔ the ladder is 3 at levels 1-5 · 4 from 6 · 5 from 16 · 6 from 40 · 7 from 70 · ` +
         `8 at 99, at EVERY level in each band (${ladderBad})`);

// And the release budget still reads it under the readability ceiling.
H.eq(C.ENEMY_CAP, 16, "⛔ C.ENEMY_CAP is untouched — a readability ceiling, never a knob");
H.eq(X.enemyConcurrent(LEVELS) < C.ENEMY_CAP, true,
     "⛔ and the curve never approaches it — the min() in spawnLimit() is belt and braces");
{
  G.reset();
  X.startGame(SEED);
  state.level = 1;
  H.eq(X.spawnLimit(), Math.min(X.enemyConcurrent(), C.ENEMY_CAP),
       "spawnLimit() is min(enemyConcurrent(), ENEMY_CAP) — read off the shipped function");
  state.level = C.HEAT_FULL_LEVEL;
  H.eq(X.spawnLimit(), C.ENEMY_CONCURRENT_MAX, "and at level 99 the budget is the ceiling, 8");
}

// ---------------------------------------------------------------------------
// 5. ⛔ H2 — WHAT HEAT DOES NOT SCALE, AND IT IS A LIST RATHER THAN AN OVERSIGHT
// ---------------------------------------------------------------------------
//
// Heat scales intervals, climb rates and the Weaver's apex. It never scales a
// hop or crossing duration, so three closed soaks' per-tick lane bounds
// (2 * DT / VAULT_HOP_TIME, and DT / DRIFT_CROSS_TIME) stayed valid at every
// level without being re-derived — and test-cs005-p3.js's SURGE_DISCHARGE pair
// is green and UNEDITED.
const UNSCALED = ["VAULT_HOP_TIME", "DRIFT_CROSS_TIME", "DRIFT_RIDE_TIME",
                  "SURGE_DISCHARGE", "WEAVER_BOLT_SPEED", "WEAVER_RETREAT", "ENEMY_CAP",
                  "RESPAWN_PUSH_DEPTH", "THORN_MAX", "SPAWN_QUOTA"];
for (const k of UNSCALED) {
  H.assert(k in C, `${k} still ships`);
  H.assert(!(`${k}_MIN` in C) && !(`${k}_MAX` in C),
           `⛔ ${k} has no heat endpoint — it is not on GDD §8's list and did not grow one`);
}
H.assert(C.SURGE_DISCHARGE < C.RESPAWN_INVULN,
         "⛔ SURGE_DISCHARGE is still strictly below RESPAWN_INVULN — 00-config.js's ⛔, " +
         "and the pair test-cs005-p3.js owns");

// ---------------------------------------------------------------------------
// 6. ⛔ THE BASELINE-FREE FORM: NO CALL SITE READS A HEAT-DERIVED BASE DIRECTLY
// ---------------------------------------------------------------------------
//
// The form test-cs006-p2.js §8 uses for throatOffset, and it pays for itself the
// same way: a hash says "nothing moved on one seed", this says "nothing CAN
// move". It needs no baseline and survives every retune. A future session that
// writes `C.VAULT_CLIMB` into an entity turns the suite red instead of quietly
// escaping the clamp.
//
// Trap 4 — a CHARACTER SCANNER, not a regex. A line comment containing "/*"
// plus a block-comment regex run first will silently delete live code and still
// parse (_harness.js's header). The scanner tracks the three string forms; the
// build carries no regex literal and no string containing "//", and the
// stripped text is re-parsed below to prove the scan did not eat any code.
function stripComments(src) {
  let out = "", i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c; i++;
      while (i < n) {
        if (src[i] === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c; i++;
  }
  return out;
}

const buildSrc = H.extractScript(
  require("fs").readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const code = stripComments(buildSrc);

// ⛔ THE SCANNER IS CHECKED BEFORE IT IS TRUSTED. Three ways: it removed a lot,
// it left the code parseable, and it left a landmark the build cannot run
// without.
H.assert(code.length < buildSrc.length * 0.75,
         `the scanner actually stripped this file's comments (${buildSrc.length} -> ${code.length})`);
H.assert(code.indexOf("function heat(level)") !== -1,
         "and left the code — heat()'s declaration survives the strip");
let parsed = true;
try { new Function(code); } catch (e) { parsed = false; }
H.assert(parsed, "⛔ and the stripped text still PARSES — nothing live was eaten");

// ⛔ A FUNCTION'S SOURCE IS STRIPPED THE SAME WAY BEFORE IT IS SUBTRACTED.
// Function.prototype.toString() returns the ORIGINAL slice, comments included,
// and respawnSkimmer() carries two ⚠ SETTLED paragraphs INSIDE its body — so an
// unstripped body is not a substring of the stripped build and the subtraction
// silently finds nothing.
const bodyOf = fn => stripComments(fn.toString());

// A word-boundary count of `C.NAME`, refusing longer names that start with it:
// C.WEAVER_APEX must not be found inside C.WEAVER_APEX_HOLD.
function refs(src, name) {
  return (src.match(new RegExp(`C\\.${name}(?![A-Z0-9_])`, "g")) || []).length;
}

// ⛔ Six bases, six accessors, and each base is named ONLY inside its own.
const OWNED = [
  ["SPAWN_INTERVAL",     X.spawnInterval],
  ["ENEMY_CONCURRENT",   X.enemyConcurrent],
  ["VAULT_INTERVAL",     X.vaultInterval],
  ["VAULT_RIM_INTERVAL", X.vaultRimInterval],
  ["SURGE_INTERVAL",     X.surgeInterval],
  ["WEAVER_APEX",        X.weaverApex],
  // and the curve's own two, for the same reason
  ["HEAT_FULL_LEVEL",    X.heatT],
  ["CLIMB_MULT_MAX",     X.climbMult],
];
for (const [name, fn] of OWNED) {
  const body = bodyOf(fn);
  H.assert(code.indexOf(body) !== -1,
           `${fn.name}()'s source is found verbatim in the stripped build (the subtraction is real)`);
  H.assert(refs(body, name) >= 1, `⛔ ${fn.name}() reads C.${name} — the one function that may`);
  H.eq(refs(code.split(body).join(""), name), 0,
       `⛔ AND NOTHING ELSE IN THE BUILD READS C.${name}. Every reader goes through ` +
       `${fn.name}(), so the clamp cannot be escaped by any path, on any seed, at any level`);
}

// ⛔ The five climb rates are the one shape that differs — they keep their own
// constants and are MULTIPLIED by climbMult(), because GDD §8 says "climb
// speed", singular. So the claim is not "named in one place" but "never named
// without the multiplier".
const CLIMBS = ["VAULT_CLIMB", "CARRIER_CLIMB", "WEAVER_CLIMB", "DRIFT_CLIMB", "SURGE_CLIMB"];
const climbBody = bodyOf(X.climbMult);
const entities = code.split(climbBody).join("");   // climbMult() itself names none of them
for (const k of CLIMBS) {
  const total = refs(entities, k);
  const scaled = (entities.match(new RegExp(`C\\.${k}\\s*\\*\\s*climbMult\\(\\)`, "g")) || []).length;
  H.assert(total >= 1, `⛔ ${k} is actually read by an entity (${total}) — not a dead constant`);
  H.eq(scaled, total,
       `⛔ and EVERY read of C.${k} in the build is \`* climbMult()\` — one multiplier on ` +
       `every entity climb, which is what keeps the respawn guarantee a single statement`);
}

// ⛔ AND THE MULTIPLIER TOUCHES NOTHING ELSE. §5 says these constants grew no
// heat endpoint; this says no call site smuggled one in through climbMult()
// instead. ⛔ WEAVER_BOLT_SPEED is the one that matters most: §1 and §2 show a
// pushed bolt is safe only because it self-terminates first, so a SLOWER bolt
// would breach the respawn guarantee — and climbMult() is a multiplier the
// wrong way round for it.
for (const k of ["WEAVER_BOLT_SPEED", "WEAVER_RETREAT", "VAULT_HOP_TIME",
                 "DRIFT_CROSS_TIME", "DRIFT_RIDE_TIME", "SURGE_DISCHARGE"]) {
  H.eq((code.match(new RegExp(`C\\.${k}\\s*[*/]\\s*climbMult\\(\\)`, "g")) || []).length, 0,
       `⛔ C.${k} is never scaled by climbMult() — H2, and for WEAVER_BOLT_SPEED it is the ` +
       `respawn guarantee itself`);
}
H.eq((code.match(/climbMult\(\)/g) || []).length, CLIMBS.length,
     `⛔ climbMult() has exactly ${CLIMBS.length} call sites in the build — one per entity ` +
     `climb, and not one more`);

// ⛔ CLIMB_MAX_BASE is a NAME, not a reader: nothing in the simulation uses it,
// and that is correct — it exists so an assertion can name the fastest
// contact-killer. Its one obligation is to equal that rate, asserted in §1.
H.eq(refs(code, "CLIMB_MAX_BASE"), 0,
     "⛔ C.CLIMB_MAX_BASE is read by NO simulation code — it is the guarantee's name for " +
     "the binding rate, and test-cs007-p2.js is its only reader");

// ⛔ AND THE DERIVED PUSH WAS NOT BUILT. PLANNED-FEATURES-CS007.md §3.2 sketches
// respawnPush() and C.RESPAWN_PUSH_MARGIN; §3.4 marks them ⛔ not chosen, because
// at a ceiling of 1.40 the derived push evaluates to exactly 0.55 at every level
// and would be dead code from the day it shipped.
H.assert(!("RESPAWN_PUSH_MARGIN" in C), "⛔ C.RESPAWN_PUSH_MARGIN was not built");
H.eq(code.indexOf("respawnPush"), -1, "⛔ and there is no respawnPush() anywhere in the build");
const respawnBody = bodyOf(X.respawnSkimmer);
H.assert(code.indexOf(respawnBody) !== -1, "respawnSkimmer()'s source is in the stripped build");
H.eq(refs(respawnBody, "RESPAWN_PUSH_DEPTH"), 2,
     "⛔ respawnSkimmer() names RESPAWN_PUSH_DEPTH twice — the clamp's test and its write");
H.eq(refs(code.split(respawnBody).join(""), "RESPAWN_PUSH_DEPTH"), 0,
     "⛔ and NOTHING ELSE IN THE BUILD READS IT — the push is one constant, applied in one " +
     "function, at every level, which is exactly what H1's answer decided");

// ⛔ No call site computes heat inline: heat() is named only by heatT(), and
// heatT() only by heatLerp(). One route from the clock to a derived value.
const HEAT_CALL = /[^a-zA-Z0-9_.$]heat\s*\(/g;
const heatTBody = bodyOf(X.heatT);
H.eq((heatTBody.match(HEAT_CALL) || []).length, 2,
     "⛔ heatT() is where the clock meets the curve — it calls heat() twice, once for the " +
     "level and once for HEAT_FULL_LEVEL");
H.eq((code.split(heatTBody).join("").match(HEAT_CALL) || []).length, 1,
     "⛔ and heat() is named NOWHERE ELSE in the build but its own declaration — no call " +
     "site computes heat inline, so there is exactly one route from the clock to a value");

H.report("test-cs007-p2.js");

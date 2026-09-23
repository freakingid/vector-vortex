// test-cs015-p1.js — CS015 P1: the achievements module, the store, the week
// (GDD 15.1, 15.5, 15.7; plan §3, A5-A7, A11, A12, R1, R10). The key is declared
// and an undeclared sibling still throws; a profile delete removes it by name
// and never a root key; a reload brings it back; each stored field falls back
// alone; tiers only rise; the ISO week key is UTC on six boundaries; the
// rotation is a function of the week alone and spends no draw; and the module
// names no game object, no game global and no config entry.
//
// ⛔ TRAPS.
//  1. The boot block runs inside buildGame(), so every build has booted and
//     `profiles` is already stored.
//  2. ⛔ 20-achievements.js's BANNER SLICE HOLDS THE THREE INLINED KIT BODIES —
//     the kit banner is a rule of dashes, not equals signs — so the text scan
//     cuts the slice at the first kit banner before reading a line of it.
//  3. Profile p0's scope IS the root store, so p0's `achievements` is a ROOT
//     key sitting beside `scores` and `profiles`.
//  4. P1 seats no evaluation: nothing in the shipped build calls evaluate(), so
//     every store write here is the test's own, through the game's one route.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260920);                      // ⛔ above the first buildGame()

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist", "vector-vortex.html");
const NS = "coinless.vector-vortex.";
const J = JSON.stringify;

// ---------------------------------------------------------------------------
// a table of the test's own, and a Map-backed store: the module is driven the
// way a kit module must be drivable — over nothing of the game's (GDD 15.7)
// ---------------------------------------------------------------------------

const DEFS = {
  perWeek: 5,
  lifetime: [
    { id: "climbed",  mode: null,        fact: "climbs", tiers: [10, 50, 200] },
    { id: "once",     mode: null,        fact: "climbs", at: 1 },
    { id: "od_only",  mode: "overdrive", fact: "climbs", at: 1 },
  ],
  weekly: Array.from({ length: 20 }, (_, i) => ({ id: "w" + i, mode: null, fact: "climbs", at: 1 })),
};

function bench(X, opts = {}) {
  const held = { value: opts.value === undefined ? null : opts.value };
  const clock = { ms: opts.ms === undefined ? Date.UTC(2026, 8, 20, 12, 0, 0) : opts.ms };
  const writes = [];
  const ach = X.createAchievements({
    defs: opts.defs || DEFS,
    load: () => held.value,
    save: v => { held.value = JSON.parse(J(v)); writes.push(held.value); },
    now: () => clock.ms,
  });
  return { ach, held, clock, writes };
}

const store = new Map();
const X = H.buildGame({ store });
H.assert(typeof X.createAchievements === "function", "createAchievements is in the build");
H.assert(X.Achievements !== null && typeof X.Achievements === "object", "Meta.boot() made the game's instance");

// ---------------------------------------------------------------------------
// 1. ⛔ the key is declared, and an undeclared sibling still throws
// ---------------------------------------------------------------------------

{
  const scope = X.Profiles.scope();
  let ok = true, why = "";
  try { scope.get("achievements", null); scope.set("achievements", { weekKey: "2026-W38" }); scope.remove("achievements"); }
  catch (err) { ok = false; why = err.message; }
  H.assert(ok, `⛔ \`achievements\` is a declared key on the profile's scope (${why})`);

  for (const name of ["achievement", "achievements2", "unlocks"]) {
    let threw = false;
    try { scope.get(name, null); } catch (err) { threw = true; }
    H.assert(threw, `⛔ non-vacuity: get("${name}") still throws — only the declared name is declared`);
  }
  let setThrew = false;
  try { scope.set("unlocks", 1); } catch (err) { setThrew = true; }
  H.assert(setThrew, "⛔ set() on an undeclared sibling still throws");

  // ⛔ NO migrate (A6): a new key has no origin version to read.
  H.eq(X.Store.available, true, "fixture: the store is available");
}

// ---------------------------------------------------------------------------
// 2. a reload brings it back, through the game's one route to storage
// ---------------------------------------------------------------------------

{
  const route = X.createAchievements({
    defs: DEFS,
    load: () => X.Profiles.scope().get("achievements", null),
    save: v => X.Profiles.scope().set("achievements", v),
    now: () => Date.UTC(2026, 8, 20, 12, 0, 0),
  });
  const got = route.evaluate({ climbs: 60, mode: "classic" });
  H.assert(got.length > 0, "fixture: the first evaluation unlocked something");
  H.assert(store.has(NS + "achievements"), "⛔ the unlock is stored under the declared key, at p0's ROOT scope (trap 3)");
  const env = JSON.parse(store.get(NS + "achievements"));
  H.eq(env.v, 1, "⛔ stored at version 1, kit-storage's envelope");
  H.eq(env.d.lifetimeTiers.climbed, 2, "fixture: tier 2 of three was stored");

  const X2 = H.buildGame({ store });
  const back = X2.createAchievements({
    defs: DEFS,
    load: () => X2.Profiles.scope().get("achievements", null),
    save: () => {},
    now: () => Date.UTC(2026, 8, 20, 12, 0, 0),
  }).snapshot();
  H.eq(back.lifetimeTiers.climbed, 2, "⛔ a reload brings the tier back");
  H.eq(J(back.lifetimeUnlocked), J(["once"]), "⛔ and the untiered unlock");
  H.eq(back.weekKey, "2026-W38", "⛔ and the week it was stored in");
}

// ---------------------------------------------------------------------------
// 3. ⛔ a profile delete removes it BY NAME, and never a root key
// ---------------------------------------------------------------------------

function deleted(opts) {
  const map = new Map();
  const Y = H.buildGame(Object.assign({ store: map }, opts || {}));
  const made = Y.Profiles.create("SECOND");
  if (!made.ok) return { fixture: false };
  Y.Profiles.select(made.profile.id);
  const id = made.profile.id;
  // Everything the deleted profile owns, plus the two ROOT keys it must leave.
  Y.Profiles.scope().set("achievements", { lifetimeUnlocked: ["once"], lifetimeTiers: {}, weeklyUnlocked: [], weekKey: "2026-W38" });
  Y.Profiles.scope().set("settings", { master: 1 });
  Y.Scores.add("classic", { score: 1234 });
  const before = [...map.keys()];
  const r = Y.Profiles.remove(id);
  return { fixture: true, id, ok: r.ok, before, after: [...map.keys()], map };
}

{
  const d = deleted();
  H.assert(d.fixture && d.ok, "fixture: a second profile was made, written to and deleted");
  H.assert(d.before.includes(`${NS}${d.id}.achievements`), `fixture: ${d.id}.achievements was stored (${J(d.before)})`);
  H.assert(!d.after.includes(`${NS}${d.id}.achievements`), "⛔ deleting a profile removes its `achievements`");
  H.assert(!d.after.includes(`${NS}${d.id}.settings`), "and its `settings`, as before");
  H.assert(d.after.includes(NS + "scores"), "⛔ and leaves the ROOT `scores`");
  H.assert(d.after.includes(NS + "profiles"), "⛔ and the ROOT `profiles`");
}

// ⛔ p0's scope IS the root store (trap 3): deleting p0 must take the root
// `achievements` and still leave `scores` and `profiles` standing.
{
  const map = new Map();
  const Y = H.buildGame({ store: map });
  const made = Y.Profiles.create("SECOND");
  H.assert(made.ok, "fixture: a second profile exists so p0 is deletable");
  Y.Profiles.scope().set("achievements", { lifetimeUnlocked: ["once"], lifetimeTiers: {}, weeklyUnlocked: [], weekKey: "2026-W38" });
  Y.Scores.add("classic", { score: 99 });
  H.assert(map.has(NS + "achievements"), "fixture: p0's achievements sit at the root, beside scores");
  const p0 = Y.Profiles.current().id;
  H.assert(Y.Profiles.remove(p0).ok, "fixture: p0 was deleted");
  H.assert(!map.has(NS + "achievements"), "⛔ deleting p0 removes the root `achievements`");
  H.eq(J([map.has(NS + "scores"), map.has(NS + "profiles")]), "[true,true]",
       "⛔ and leaves `scores` and `profiles`, which OWN_KEYS never names");
}

// ---------------------------------------------------------------------------
// 4. ⛔ each stored field falls back alone (A6's known-value-else-default)
// ---------------------------------------------------------------------------

const WEEK = "2026-W38";
function loaded(value) { return bench(X, { value }).ach.snapshot(); }

{
  const good = { lifetimeUnlocked: ["once"], lifetimeTiers: { climbed: 2 }, weeklyUnlocked: [], weekKey: WEEK };
  H.eq(J(loaded(good)), J(good), "fixture: a whole, valid value loads unchanged");

  H.eq(J(loaded(Object.assign({}, good, { lifetimeUnlocked: "nope" })).lifetimeTiers), J({ climbed: 2 }),
       "⛔ a broken `lifetimeUnlocked` empties alone — the tiers survive");
  H.eq(J(loaded(Object.assign({}, good, { lifetimeTiers: 7 })).lifetimeUnlocked), J(["once"]),
       "⛔ a broken `lifetimeTiers` empties alone — the unlocks survive");
  H.eq(J(loaded(Object.assign({}, good, { lifetimeUnlocked: ["once", "gone", "climbed"] })).lifetimeUnlocked), J(["once"]),
       "⛔ an unknown id is dropped on read, and a TIERED id is not an untiered unlock");
  H.eq(loaded(Object.assign({}, good, { lifetimeTiers: { climbed: 99 } })).lifetimeTiers.climbed, 3,
       "⛔ a tier past the row's tier count clamps to it");
  for (const bad of [0, -1, 1.5, "2", null]) {
    H.eq(loaded(Object.assign({}, good, { lifetimeTiers: { climbed: bad } })).lifetimeTiers.climbed, undefined,
         `⛔ a tier of ${J(bad)} is dropped, not coerced`);
  }
  H.eq(loaded(Object.assign({}, good, { lifetimeTiers: { gone: 2 } })).lifetimeTiers.gone, undefined,
       "⛔ a tier under an unknown id is dropped");
  H.eq(J(loaded(null)), J({ lifetimeUnlocked: [], lifetimeTiers: {}, weeklyUnlocked: [], weekKey: WEEK }),
       "⛔ nothing stored reads as the defaults, at this week");
  H.eq(J(loaded(42)), J({ lifetimeUnlocked: [], lifetimeTiers: {}, weeklyUnlocked: [], weekKey: WEEK }),
       "⛔ a stored value of the wrong type reads as the defaults");
}

// ⛔ A WEEK ROLL EMPTIES `weeklyUnlocked` ALONE.
{
  const live = bench(X).ach.weekly();
  const stale = { lifetimeUnlocked: ["once"], lifetimeTiers: { climbed: 2 },
                  weeklyUnlocked: live.slice(0, 2), weekKey: "2026-W01" };
  const now = loaded(stale);
  H.eq(J(now.weeklyUnlocked), "[]", "⛔ a stored weekKey that is not this week empties `weeklyUnlocked`");
  H.eq(J([now.lifetimeUnlocked, now.lifetimeTiers]), J([["once"], { climbed: 2 }]),
       "⛔ and touches neither lifetime store — they are not week-scoped");
  const fresh = loaded(Object.assign({}, stale, { weekKey: WEEK }));
  H.eq(J(fresh.weeklyUnlocked), J(live.slice(0, 2)), "non-vacuity: the same rows load in their own week");
  const foreign = loaded({ lifetimeUnlocked: [], lifetimeTiers: {}, weeklyUnlocked: ["w" + 0, "once", "nope"], weekKey: WEEK });
  H.assert(foreign.weeklyUnlocked.every(id => live.indexOf(id) >= 0),
           `⛔ a weekly id outside this week's rotation is dropped on read (${J(foreign.weeklyUnlocked)})`);
}

// ---------------------------------------------------------------------------
// 5. ⛔ TIERS ONLY RISE — and the mutation that lowers one
// ---------------------------------------------------------------------------

{
  const B = bench(X);
  const first60 = B.ach.evaluate({ climbs: 60, mode: "classic" });
  H.eq(J(first60.filter(u => u.weekKey === null).map(u => [u.id, u.tier])),
       J([["climbed", 2], ["once", 0]]), "a run at 60 reaches tier 2 and the untiered lifetime row");
  H.eq(first60.filter(u => u.weekKey !== null).length, DEFS.perWeek, "and this week's five weekly rows");
  H.eq(B.ach.snapshot().lifetimeTiers.climbed, 2, "fixture: tier 2 is held");
  H.eq(J(B.ach.evaluate({ climbs: 5, mode: "classic" })), "[]", "⛔ a weaker run unlocks nothing");
  H.eq(B.ach.snapshot().lifetimeTiers.climbed, 2, "⛔ and does not lower the held tier");
  H.eq(B.writes.length, 1, "⛔ and writes nothing — a save happens only when something unlocked");
  H.eq(J(B.ach.evaluate({ climbs: 60, mode: "classic" })), "[]", "⛔ the same run again unlocks nothing twice");
  H.eq(J(B.ach.evaluate({ climbs: 500, mode: "classic" }).map(u => [u.id, u.tier])), J([["climbed", 3]]),
       "⛔ a stronger run raises to tier 3, and the untiered row does not re-fire");

  // A5: a row naming a mode is evaluated only in that mode.
  const M = bench(X);
  H.eq(J(M.ach.evaluate({ climbs: 1, mode: "classic" }).map(u => u.id).indexOf("od_only")), "-1",
       "⛔ an overdrive-tagged row does not unlock on a Classic run");
  H.assert(M.ach.evaluate({ climbs: 1, mode: "overdrive" }).some(u => u.id === "od_only"),
           "⛔ and does unlock on an Overdrive one");

  // A fact that is not a finite number is a SKIP, never a comparison.
  const S = bench(X);
  H.eq(J(S.ach.evaluate({ mode: "classic" })), "[]", "⛔ a missing fact unlocks nothing");
  H.eq(J(S.ach.evaluate({ climbs: NaN, mode: "classic" })), "[]", "⛔ nor a NaN one");
  H.eq(J(S.ach.evaluate({ climbs: "500", mode: "classic" })), "[]", "⛔ nor a string one");

  // A11's payload shape.
  const P = bench(X).ach.evaluate({ climbs: 1, mode: "classic" });
  const one = P.find(u => u.id === "once");
  H.eq(J(Object.keys(one).sort()), J(["at", "id", "tier", "weekKey"]), "⛔ A11's payload: { id, tier, weekKey, at }");
  H.eq(J([one.tier, one.weekKey]), J([0, null]), "⛔ an untiered lifetime unlock is tier 0 with a null weekKey");
  const wk = P.find(u => u.weekKey !== null);
  H.assert(wk !== undefined && wk.weekKey === WEEK && wk.tier === 0, "⛔ a weekly unlock names its week and is tier 0");
  H.eq(one.at, Date.UTC(2026, 8, 20, 12, 0, 0), "⛔ `at` is the INJECTED clock's reading, not the platform's");
  H.assert(P.every(u => u.at === one.at), "⛔ one clock reading per call — the week and the stamp are the same instant");
}

// ⛔ THE MUTATION. The string is asserted in the build exactly once BEFORE the
// mutant runs, and every read of the mutant is guarded: a mutation run that
// throws is a defect in the test, not a red.
const script = H.extractScript(fs.readFileSync(DIST, "utf8"));
function occurrences(needle) {
  let n = 0, at = script.indexOf(needle);
  while (at >= 0) { n++; at = script.indexOf(needle, at + 1); }
  return n;
}
function mutant(from, to, label, read) {
  const count = occurrences(from);
  H.eq(count, 1, `⛔ fixture: ${label} — the mutated string is in the build exactly once (count ${count})`);
  if (count !== 1) return null;
  let out = null, why = "";
  try { out = read(H.buildGame({ store: new Map(), mutate: [[from, to]] })); }
  catch (err) { why = err.message; }
  H.assert(out !== null, `⛔ fixture: ${label} — the mutant ran (${why})`);
  return out;
}

{
  const RISE = "if (reached > (held.lifetimeTiers[row.id] || 0)) {";
  const got = mutant(RISE, "if (reached !== (held.lifetimeTiers[row.id] || 0)) {", "tiers only rise", Y => {
    const B = bench(Y);
    B.ach.evaluate({ climbs: 500, mode: "classic" });
    const high = B.ach.snapshot().lifetimeTiers.climbed;
    B.ach.evaluate({ climbs: 15, mode: "classic" });
    return { high, low: B.ach.snapshot().lifetimeTiers.climbed };
  });
  if (got !== null) {
    H.eq(got.high, 3, "fixture: the mutant reached tier 3 first");
    H.eq(got.low, 1, "⛔ mutation: `reached !==` LOWERS the held tier to 1 (the monotonic assertions above are red)");
  }
}

// ⛔ The delete mutation builds through deleted(), which owns its own Map, so it
// is run directly rather than through mutant()'s single-read shape.
{
  // ⛔ REPAIRED IN PLACE AT CS016 P1: `onboarding` joined OWN_KEYS. The claim —
  // a delete without `achievements` leaves it behind — is unchanged.
  const KEYS = 'const OWN_KEYS = ["settings", "progress", "telemetry", "achievements", "onboarding"];';
  const count = occurrences(KEYS);
  H.eq(count, 1, `⛔ fixture: OWN_KEYS' literal is in the build exactly once (count ${count})`);
  if (count === 1) {
    let d = null, why = "";
    try { d = deleted({ mutate: [[KEYS, 'const OWN_KEYS = ["settings", "progress", "telemetry", "onboarding"];']] }); }
    catch (err) { why = err.message; }
    H.assert(d !== null && d.fixture && d.ok, `⛔ fixture: the mutant deleted a profile (${why})`);
    if (d !== null && d.fixture) {
      H.assert(d.after.includes(`${NS}${d.id}.achievements`),
               "⛔ mutation: OWN_KEYS without `achievements` leaves the deleted profile's unlocks behind (the assertion above is red)");
      H.assert(!d.after.includes(`${NS}${d.id}.settings`), "fixture: the mutant still removed `settings`");
    }
  }
}

// ---------------------------------------------------------------------------
// 6. ⛔ THE WEEK KEY IS AN ISO YEAR-WEEK COMPUTED IN UTC
// ---------------------------------------------------------------------------

function keyAt(iso) { return bench(X, { ms: Date.parse(iso) }).ach.weekKey(); }

{
  const BOUNDARIES = [
    ["2020-01-01T00:00:00Z", "2020-W01", "Wednesday — week 1 straddles the year"],
    ["2021-01-01T00:00:00Z", "2020-W53", "⛔ the 53-week year"],
    ["2025-12-29T00:00:00Z", "2026-W01", "a December Monday in the NEXT ISO year"],
    ["2026-01-01T00:00:00Z", "2026-W01", "Thursday — the year-deciding day"],
    ["2027-01-03T00:00:00Z", "2026-W53", "⛔ Sunday — the last day of the previous ISO year"],
    ["2027-01-04T00:00:00Z", "2027-W01", "the Monday after it"],
  ];
  for (const [iso, want, why] of BOUNDARIES) H.eq(keyAt(iso), want, `⛔ ${iso} is ${want} — ${why}`);

  // ⛔ UTC, not local: read at Sunday 23:30 UTC the EARLIER week stands. Any
  // zone east of UTC has already rolled at that instant, which is the bug the
  // rule exists to prevent.
  H.eq(keyAt("2026-09-20T23:30:00Z"), "2026-W38", "⛔ Sunday 23:30 UTC reads as the EARLIER week");
  H.eq(keyAt("2026-09-21T00:00:00Z"), "2026-W39", "⛔ and 30 minutes later it has rolled");
  H.eq(keyAt("2026-09-20T23:59:59Z").slice(-2), "38", "non-vacuity: the last second of the week is still W38");
  H.assert(/^\d{4}-W\d{2}$/.test(keyAt("2026-03-02T00:00:00Z")), "the key is YYYY-Www, the week two-digit");
}

// ---------------------------------------------------------------------------
// 7. ⛔ THE ROTATION IS A FUNCTION OF THE WEEK AND OF NOTHING ELSE
// ---------------------------------------------------------------------------

{
  const B = bench(X);
  const keys = [];
  for (let y = 2026; y < 2028; y++) for (let w = 1; w <= 52; w++) keys.push(y + "-W" + String(w).padStart(2, "0"));

  const sets = new Set();
  const touched = {};
  for (const key of keys) {
    const five = B.ach.weeklyFor(key);
    H.assert(five.length === DEFS.perWeek && new Set(five).size === DEFS.perWeek, `${key}: perWeek distinct ids`);
    sets.add(five.join(","));
    for (const id of five) touched[id] = (touched[id] || 0) + 1;
  }
  H.eq(Object.keys(touched).length, DEFS.weekly.length, "⛔ over 104 weeks every pool entry is reached");
  H.assert(sets.size > keys.length / 4, `⛔ and the set is not one set repeated (${sets.size} distinct over ${keys.length} weeks)`);

  // ⛔ PURE: the same key answers the same, whatever else happened.
  const first = B.ach.weeklyFor(WEEK).join(",");
  B.ach.evaluate({ climbs: 500, mode: "overdrive" });
  X.startGame(1, { startDepth: 1 });
  for (let i = 0; i < 120; i++) X.Game.update(X.C.FIXED_DT);
  H.eq(B.ach.weeklyFor(WEEK).join(","), first, "⛔ the same week answers the same across a played board and an evaluation");
  H.eq(bench(X).ach.weeklyFor(WEEK).join(","), first, "⛔ and a second instance with its own store agrees");

  // ⛔ NO DRAW — not across an evaluation, and not across a week ROLL.
  const R = bench(X, { ms: Date.parse("2026-09-20T12:00:00Z") });
  let draws = 0;
  const realRng = X.state.rng;
  X.state.rng = function () { draws++; return realRng.apply(this, arguments); };
  R.ach.evaluate({ climbs: 500, mode: "overdrive" });
  R.ach.weekly();
  R.clock.ms = Date.parse("2026-09-28T12:00:00Z");
  H.eq(R.ach.weekKey(), "2026-W40", "fixture: the clock rolled the week");
  R.ach.evaluate({ climbs: 500, mode: "overdrive" });
  R.ach.weekly();
  R.ach.snapshot();
  H.eq(draws, 0, "⛔ the evaluator and the rotation spend NO draw, across a week roll");
  X.state.rng();
  H.eq(draws, 1, "non-vacuity: the counter counts a draw");
  X.state.rng = realRng;
}

// ---------------------------------------------------------------------------
// 8. ⛔ THE BOUNDARY CONTRACT, SCANNED OFF THE BUILT FILE (GDD 15.7)
// ---------------------------------------------------------------------------

// The module's own slice, ⛔ CUT AT THE FIRST KIT BANNER (trap 2): the kit's
// banner is a rule of dashes, so the equals-signs module scan runs 20's slice
// straight through the three inlined bodies.
const BANNER = "// " + "=".repeat(74) + "\n// 20-achievements.js\n// " + "=".repeat(74) + "\n";
const KIT_RULE = "// " + "-".repeat(74) + "\n// lib/kit-names/kit-names.js\n";
const head = script.indexOf(BANNER);
H.assert(head >= 0, "fixture: 20-achievements.js's banner is in the build");
const kitAt = script.indexOf(KIT_RULE, head);
H.assert(kitAt > head, "fixture: the inlined kit follows it (trap 2)");
const slice = script.slice(head + BANNER.length, kitAt);
H.assert(slice.includes("function createAchievements"), "fixture: the slice holds the module's own code");
H.assert(!slice.includes("KitStorage"), "⛔ fixture: and the cut kept the inlined kit OUT of it");
H.assert(script.slice(head, script.indexOf("// 21-telemetry.js\n")).includes("KitStorage"),
         "non-vacuity: the uncut slice really would have held the kit bodies");

// A character scanner, never a regular expression (_harness.js's header).
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
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { i += 2; while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}
const code = stripComments(slice);
H.assert(code.includes("createAchievements"), "fixture: comment stripping left the code");
H.assert(!code.includes("//"), "fixture: and took the comments");

// ⛔ No game object, no game global, no config entry — in either direction.
const GLOBALS = ["Store", "Profiles", "Meta", "Scores", "Leaderboard", "Telemetry", "Game",
                 "WELLS", "AudioSys", "MusicSys", "Director", "Sfx", "ENEMY_KINDS",
                 "addScore", "modeHas", "heat(", "sfx(", "levelRecord"];
H.assert(!/\bstate\s*[.[]/.test(code), "⛔ 20-achievements.js reads no game object");
H.assert(!/\bstate\b/.test(code), "⛔ and does not name one");
H.assert(!/\bC\s*\./.test(code), "⛔ and reads no config entry");
for (const name of GLOBALS) H.assert(!code.includes(name), `⛔ and names no game global (${name})`);
H.assert(!/\bDate\s*\.\s*now\b/.test(code), "⛔ and never reads the platform clock — `now` is injected (A7)");
H.assert(code.includes("options.defs") || code.includes("opts.defs") || code.includes("{ defs"),
         "non-vacuity: the definition table crosses as an option");

// ⛔ The trap the plan measured: the slice is inside test-cs002-p1.js's reach,
// so a device token here reddens that file. Asserted where it is understood.
for (const token of ["e.key", ".touches", "getGamepads", "movementX", "clientX", "addEventListener"]) {
  H.assert(!slice.includes(token), `⛔ 20-achievements.js contains no "${token}" (test-cs002-p1.js's scan reaches it)`);
}

// ⛔ R10: the draft kit documentation lands in the module's first commit.
const notes = path.join(ROOT, "src", "20-achievements.NOTES.md");
H.assert(fs.existsSync(notes), "⛔ src/20-achievements.NOTES.md exists (R10)");
{
  const text = fs.readFileSync(notes, "utf8");
  for (const want of ["kit-achievements", "Backport status", "Game-agnostic", "createAchievements("]) {
    H.assert(text.includes(want), `the notes carry the packet's form: ${want}`);
  }
}

// ---------------------------------------------------------------------------
// 9. the factory refuses what it cannot evaluate
// ---------------------------------------------------------------------------

function refuses(defs, want, msg) {
  let err = null;
  try { X.createAchievements({ defs, load: () => null, save: () => {}, now: () => 0 }); } catch (e2) { err = e2; }
  H.assert(err !== null && err.message.includes(want), `${msg} (got ${err ? err.message : "no throw"})`);
}
const okWeekly = [{ id: "a", mode: null, fact: "f", at: 1 }];
refuses({ perWeek: 1, lifetime: [{ id: "x", mode: null, fact: "f", at: 1, tiers: [1] }], weekly: okWeekly },
        "exactly one of tiers and at", "a row with both tiers and at is refused");
refuses({ perWeek: 1, lifetime: [{ id: "x", mode: null, fact: "f" }], weekly: okWeekly },
        "exactly one of tiers and at", "a row with neither is refused");
refuses({ perWeek: 1, lifetime: [{ id: "a", mode: null, fact: "f", at: 1 }], weekly: okWeekly },
        "duplicate id", "⛔ a duplicate id across the two tables is refused");
refuses({ perWeek: 1, lifetime: [], weekly: [{ id: "a", mode: null, fact: "f", tiers: [1] }] },
        "may not be tiered", "a tiered weekly row is refused");
refuses({ perWeek: 1, lifetime: [{ id: "x", mode: null, fact: "f", tiers: [5, 2] }], weekly: okWeekly },
        "must ascend", "a descending tier list is refused");
refuses({ perWeek: 2, lifetime: [], weekly: okWeekly },
        "larger than the weekly pool", "⛔ perWeek past the pool's length is refused");
for (const name of ["load", "save", "now"]) {
  let err = null;
  const opts = { defs: DEFS, load: () => null, save: () => {}, now: () => 0 };
  opts[name] = null;
  try { X.createAchievements(opts); } catch (e2) { err = e2; }
  H.assert(err !== null && err.message.includes("options." + name), `⛔ a missing ${name} callback is refused`);
}

// ---------------------------------------------------------------------------
// 10. the shipped table's shape — ⛔ REWRITTEN IN PLACE AT CS015 P3
// ---------------------------------------------------------------------------
//
// ⛔ P1 shipped PLACEHOLDER rows, every id prefixed "_", and said in its own
// header that P3 replaces them whole. P3 did, so the one assertion that read
// "every id starts _" is rewritten to the claim it was always making: ⛔ NO
// SHIPPED ID CAN BECOME SAVE DATA BY ACCIDENT. Under P1 that meant a marker
// prefix no real row would use; under P3 it means the opposite marker — no id
// carries it, because every id here IS save data now. The other four
// assertions are untouched: they are about the table's SHAPE, which did not
// move. ⛔ Nothing is weakened and no new coverage is added here; the id
// table's own coverage is test-cs015-p3.js's.

{
  const defs = X.C.ACHIEVEMENTS;
  H.assert(defs && Array.isArray(defs.lifetime) && Array.isArray(defs.weekly), "⛔ C.ACHIEVEMENTS is two tables plus perWeek");
  H.assert(Number.isInteger(defs.perWeek) && defs.perWeek >= 1, "⛔ perWeek is a whole number");
  const ids = defs.lifetime.concat(defs.weekly).map(r => r.id);
  H.assert(ids.length > 0 && ids.every(id => id.charAt(0) !== "_"),
           `⛔ every shipped id is a real one (CS015 P3) — none carries P1's placeholder "_" (${J(ids)})`);
  H.eq(new Set(ids).size, ids.length, "the ids are distinct");
  // ⛔ Every threshold is in the config and none is inlined in the module.
  H.assert(defs.lifetime.concat(defs.weekly).every(r => Array.isArray(r.tiers) || Number.isFinite(r.at)),
           "⛔ every row carries its threshold, in C (A12)");
  H.eq(J(X.Achievements.weekly().slice().sort()), J(X.Achievements.weeklyFor(X.Achievements.weekKey()).slice().sort()),
       "the game's instance rotates its own pool");
}

H.report();

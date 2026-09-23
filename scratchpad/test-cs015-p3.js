// test-cs015-p3.js — CS015 P3: the id table and the surface (GDD 10.5, 15.5,
// 17 item 10, 18; plan §5, A1-A, A5-A, A8, A10-A, R9).
//  1. The table's shape: 23 lifetime + 19 weekly, ids unique and non-empty, one
//     of tiers/at, no tiered weekly row, every mode a real mode or null, and
//     every name and note inside the MEASURED draw budget.
//  2. ⛔ THE VOCABULARY, AS AN ASSERTION OVER THE TABLE, and by SUBSTRING —
//     test-cs008-p6.js's old `\b` form is shown MISSING the underscore spelling
//     an id table is exactly the artefact to ship.
//  3. ⛔ GDD 17 item 10, PER ROW and never in aggregate: every predicate
//     reachable (the row's top threshold against a MEASURED front-door
//     maximum, plus the module returning that row at it), none throws on empty
//     state, tiers monotonic with a mutation that lowers one.
//  4. Every row's `fact` is a field the game BUILDS, and every field it builds
//     has a row — read off both seats of a played session.
//  5. The surface: rebuilt on entry and never in draw(), the window, BACK last,
//     both doors, the note line, and ⛔ NO HUD RECTANGLE.
//  6. The sound: one event, no kill-pitch voice, one call per unlocking seat.
// ⛔ TRAPS. 1. `facts()` lives in Meta's closure, so both seats are MUTATED to
//     publish their object — the real one, never a copy.
//  2. A Store.set spy sees only p0's writes (p0's scope IS the root store).
//  3. The clear edge's window facts are absent at the run's end and the run's
//     closing facts are absent at the clear edge: that split is the point.
//  4. A menu press is an EDGE — release every key before the next one.
"use strict";

const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260921;
installSeed(SEED);                          // ⛔ above the first buildGame()

const J = JSON.stringify;

// The two seats, each in the build exactly once, publishing the object they
// hand the module. ⛔ The mutation adds a reader and changes nothing else.
const SEAT_CLEAR = ["    return sounded(Achievements.evaluate(facts(win)));",
  "    { const _f = facts(win); globalThis.__seat(\"clear\", _f); return sounded(Achievements.evaluate(_f)); }"];
const SEAT_END = ["    if (booted && ok) sounded(Achievements.evaluate(facts(runEndFacts())));",
  "    if (booted && ok) { const _f = facts(runEndFacts()); globalThis.__seat(\"end\", _f); sounded(Achievements.evaluate(_f)); }"];
// 20-achievements.js's monotonic guard, for §3's mutation.
const MONOTONIC = ["          if (reached > (held.lifetimeTiers[row.id] || 0)) {",
  "          if (reached !== (held.lifetimeTiers[row.id] || 0)) {"];

// ---------------------------------------------------------------------------
// ⛔ MEASURED — the front door's reach, per FACT (plan §1.3's method, re-run at
// this phase's own build). Four passes of the closed soaks' four-clause hunter,
// 40,000 steps each, over Classic Start Depth 1 / 9 / 81 and Overdrive 1 / 9 /
// 17 / 81, driven through Game.frame() from startGame() — since CS016,
// `node tools/reach-probe.js` (it prints this table and the unreached rows):
//   pass A  the soaks' driver as it stands — fire held, the Purge spent
//   pass B  the same, re-run against the shipped thresholds
//   pass C  AIMED: fire only with a target in lane, and the Purge never spent
//   pass D  fire held, the Purge never spent
// Each number below is the LARGEST reading any of the four passes saw at
// either seat. ⛔ The reachability assertion is `the row's top threshold <=
// this`, PER ROW — plan §1.3 found one row (`purge_wide`) no board reached and
// it was CUT, and an aggregate assertion would have hidden it.
// ⚠ Passes C and D exist because the soaks' driver holds the trigger and
// spends the Purge on every well, which is the WORST case for two rows:
// `purgeHeldRun` and `purgeSavedClears` both read 0 under it.
// ⛔ RE-MEASURED WHOLE AT CS016 P3 (N12), by the same four passes rebuilt from
// this header (CS015's probe was a throwaway): +`cleanDives`, +`wellTokens`,
// +`wellThornsCleared`; `leanClear` and `divesCompleted` left with their rows.
// Every fact the two builds share read identically before and after P3's edit.
const REACH = {
  carrierSplits: 258, cleanDives: 44, cleanStreak: 55, clearOnLastLife: 1,
  comboPeak: 8, deathlessWells: 59, deepFirstClear: 81, extraLives: 8,
  jumpKills: 21, kills: 1153, level: 141, lives: 6, lowStartLevel: 42,
  mimicKills: 24, noThornDeathRun: 1, openCleanClear: 1, openWellsCleared: 25,
  purgeHeldRun: 1, purgeSavedClears: 59, quietClear: 1, rimSweepKills: 8,
  ringSetsTaken: 18, ringsTaken: 162, score: 1824715, startDepth: 81,
  thornChips: 186, tokenKinds: 5, wardenCleanWell: 1, wellCarrierSplits: 9,
  wellRings: 11, wellThornsCleared: 7, wellTokens: 4, wellsCleared: 61,
  wellsSeen: 16,
};

// ---------------------------------------------------------------------------
// the build and a menu session
// ---------------------------------------------------------------------------

function build(opts) {
  installSeed(SEED);
  let now = Date.UTC(2026, 8, 21);
  Date.now = () => (now += 7919);
  const o = Object.assign({ store: new Map(), spy: ["drawMenu", "drawHud", "drawText", "sfx"] }, opts || {});
  const X = H.buildGame(o);
  X.view = null;
  X.texts = [];
  X.drawMenu.before = (ctx, view) => {
    X.view = { title: view.title, lines: view.lines.slice(),
               items: view.items.map(r => ({ label: r.label, detail: r.detail, enabled: r.enabled, action: r.action })),
               cursor: view.cursor };
  };
  X.drawText.before = (ctx, str) => { X.texts.push(String(str)); };
  X.sounds = [];
  X.sfx.before = name => { X.sounds.push(name); };
  return X;
}

function session(X) {
  const G = X.Game, C = X.C, MS = C.FIXED_DT * 1000;
  let clock = 0;
  const halfFrame = () => { clock += MS / 2; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const steps = n => { for (let i = 0; i < n; i++) liveStep(); };
  // ⛔ TRAP 4: press and release, every time.
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const tap = (k, n) => { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } };
  const S = {
    X, G, C, steps, press, liveStep,
    right: n => tap("ArrowRight", n),
    down: n => tap("ArrowRight", n),
    ok: () => press(" "),
    back: () => press("Escape"),
    boot: () => { G.frame(0); steps(2); },
    draw: () => { X.view = null; X.texts = []; G.draw(); return X.view; },
    // The title's rows are PLAY, OPTIONS, SCORES, PROFILE, ACHIEVEMENTS.
    toAchievements: () => { S.right(4); S.ok(); },
  };
  return S;
}

const LIFE = () => X0.C.ACHIEVEMENTS.lifetime;
const POOL = () => X0.C.ACHIEVEMENTS.weekly;
const ROWS = () => LIFE().concat(POOL());
const top = row => (Array.isArray(row.tiers) ? row.tiers[row.tiers.length - 1] : row.at);

const X0 = build();

// ===========================================================================
// 1. the table's shape, and the ids
// ===========================================================================

{
  const defs = X0.C.ACHIEVEMENTS;
  H.eq(LIFE().length, 23, "⛔ 23 LIFETIME ROWS (A8's answer: `purge_wide` dropped, `mimic_kill` kept)");
  H.eq(LIFE().filter(r => Array.isArray(r.tiers)).length, 9, "nine of them are tiered");
  H.eq(defs.perWeek, 5, "⛔ five weekly rows live in any one week (GDD 15.5)");
  H.assert(POOL().length >= defs.perWeek, `the pool is at least perWeek long (${POOL().length})`);
  // ⛔ REWRITTEN IN PLACE AT CS016 P3: the one row with a free parameter,
  // `week_lean_well`, was CUT with its par (N12) — so no parameter remains.
  H.assert(!("wellShotPar" in defs) && !POOL().some(r => r.id === "week_lean_well"),
           "⛔ no weekly row carries a free parameter: the shot par left with its row (CS016 P3, N12)");

  const ids = ROWS().map(r => r.id);
  H.eq(new Set(ids).size, ids.length, "⛔ every id is unique ACROSS BOTH TABLES: one id is one achievement");
  H.assert(ids.every(id => /^[a-z][a-z0-9_]*$/.test(id)), `⛔ every id is a stable lower-case slug (${J(ids.filter(i => !/^[a-z][a-z0-9_]*$/.test(i)))})`);
  H.assert(ids.every(id => id.charAt(0) !== "_"), "⛔ none carries CS015 P1's placeholder prefix");

  const modes = Object.keys(X0.C.MODE_FLAGS);
  for (const r of ROWS()) {
    H.assert(r.mode === null || modes.indexOf(r.mode) >= 0, `⛔ ${r.id}'s mode tag is a real mode or null (${J(r.mode)})`);
    H.assert(Array.isArray(r.tiers) !== (r.at !== undefined), `${r.id} carries exactly one of tiers and at`);
    H.assert(typeof r.fact === "string" && r.fact !== "", `${r.id} names a fact`);
  }
  H.assert(POOL().every(r => !Array.isArray(r.tiers)), "⛔ NO WEEKLY ROW IS TIERED (20-achievements.js refuses one)");
  for (const r of LIFE().filter(x => Array.isArray(x.tiers))) {
    H.assert(r.tiers.every((t, i) => i === 0 || t > r.tiers[i - 1]), `${r.id}'s tiers ascend`);
  }
  // ⛔ A5-A: the tag belongs to the achievement, so MODE_FLAGS gains no field.
  H.eq(J(Object.keys(X0.C.MODE_FLAGS.overdrive)), J(["jump", "combo", "tokens", "rings"]),
       "⛔ MODE_FLAGS gained no field for the mode tag (A5-A)");
  H.assert(ROWS().some(r => r.mode === "overdrive") && ROWS().some(r => r.mode === null),
           "non-vacuity: the table uses both an Overdrive tag and the either tag");
  H.eq(ROWS().filter(r => r.mode === "classic").length, 0,
       "⚠ nothing is Classic-only: every Classic row is playable in Overdrive too");

  // ⛔ THE DRAW BUDGET, MEASURED off the build rather than guessed: a row's
  // label starts at WORLD_W/2 - MENU_COL_W/2 and its detail is right-aligned at
  // WORLD_W/2 + MENU_COL_W/2, at TEXT_CHAR_W x MENU_TEXT_SIZE a character. A
  // four-character detail ("DONE", "3/3") leaves this many for the name.
  const C = X0.C;
  const charW = C.TEXT_CHAR_W * C.MENU_TEXT_SIZE;
  const nameMax = Math.floor((C.MENU_COL_W - 4 * charW) / charW);
  const noteMax = Math.floor(C.WORLD_W / charW);
  H.assert(nameMax >= 15 && nameMax <= 24, `fixture: the measured name budget is ${nameMax} characters`);
  for (const r of ROWS()) {
    H.assert(typeof r.name === "string" && r.name.length > 0 && r.name.length <= nameMax,
             `⛔ ${r.id}'s name fits the row beside its detail (${r.name.length} of ${nameMax}: ${J(r.name)})`);
    H.assert(typeof r.note === "string" && r.note.length > 0 && r.note.length <= noteMax,
             `⛔ ${r.id}'s note fits one info line (${r.note.length} of ${noteMax})`);
  }
  H.assert(new Set(ROWS().map(r => r.name)).size === ROWS().length, "every displayed name is distinct");
}

// ===========================================================================
// 2. ⛔ THE VOCABULARY (CLAUDE.md; GDD 18), OVER THE TABLE, BY SUBSTRING
// ===========================================================================
//
// ⛔ test-cs008-p6.js scans the whole BUILT file and since 2026-09-20 does it by
// SUBSTRING. This file makes the same claim about the id table alone, because
// the table is the one artefact the old `\b` form would have let through: an id
// is written in snake_case, and `_` is a word character, so there is no
// boundary to match. ⛔ Both forms are run below so the blind spot cannot reach
// a future row either — the substring form is the ASSERTION, the `\b` form is
// the NON-VACUITY that shows why.
{
  const WORDS = ["tempest", "flipper", "fuseball", "pulsar", "tanker", "spiker", "superzapper", "blaster", "web"];
  const sub = w => new RegExp(w === "web" ? "web(?!kit)" : w, "i");
  const bounded = w => new RegExp("\\b" + w + "\\b", "i");

  // Probes are built from the list, so this file names no banned word beyond it.
  const W = WORDS[1];
  H.assert(sub(W).test(W + "_kill") && !bounded(W).test(W + "_kill"),
           "⛔ non-vacuity: the underscore spelling is caught by the SUBSTRING form and MISSED by `\\b`");
  H.assert(sub(W).test(W + "Kill") && !bounded(W).test(W + "Kill"),
           "⛔ non-vacuity: camelCase, the same way");
  H.assert(sub(W).test("THE " + W.toUpperCase()) && bounded(W).test("THE " + W.toUpperCase()),
           "non-vacuity: the spaced spelling is caught by both");

  const fields = [];
  for (const r of ROWS()) fields.push([r.id, "id"], [r.name, "name"], [r.note, "note"]);
  fields.push([X0.C.ACHIEVEMENTS.lifetime.length + "", "count"]);
  for (const w of WORDS.concat("atari")) {
    const hit = fields.filter(([text]) => new RegExp(w === "web" ? "web(?!kit)" : w, "i").test(text));
    H.eq(hit.length, 0, `⛔ no id, name or note contains "${w.charAt(0)}…" as a SUBSTRING (${J(hit)})`);
  }
  // And the table's own vocabulary is GDD 3.1's.
  const OURS = ["WELL", "RIM", "THROAT", "LANE", "DEPTH", "SKIMMER", "PURGE", "THORN",
                "VAULTER", "CARRIER", "WEAVER", "DRIFTER", "SURGER", "REAVER", "WARDEN", "MIMIC"];
  const usedOurs = OURS.filter(t => ROWS().some(r => (r.name + " " + r.note).includes(t)));
  H.assert(usedOurs.length >= 6, `non-vacuity: the table speaks GDD 3.1's vocabulary (${J(usedOurs)})`);
}

// ===========================================================================
// 3. ⛔ GDD 17 ITEM 10, PER ROW
// ===========================================================================

// A run of the real module over the real table, on a store of the test's own.
function ach(X, held) {
  const box = { value: held === undefined ? null : held, writes: 0 };
  return {
    box,
    api: X.createAchievements({
      defs: X.C.ACHIEVEMENTS,
      load: () => box.value,
      save: v => { box.value = JSON.parse(J(v)); box.writes++; },
      now: () => Date.UTC(2026, 8, 21, 12),
    }),
  };
}

// -- (a) every predicate reachable -------------------------------------------
{
  const missing = ROWS().filter(r => !(r.fact in REACH));
  H.eq(J(missing.map(r => r.id)), "[]", "⛔ every row names a fact the MEASURED probe recorded");
  for (const r of ROWS()) {
    const want = top(r), got = REACH[r.fact];
    H.assert(got >= want, `⛔ REACHABLE: ${r.id} asks ${want} of \`${r.fact}\` and the front door MEASURED ${got}`);
  }
  // ⚠ Two rows were MEASURED borderline on a played board (plan A8), so each
  // gets a STAGED board below rather than being taken on the number alone.
  H.assert(REACH.purgeSavedClears >= top(LIFE().find(r => r.id === "purge_saver")),
           "⚠ purge_saver's top tier is inside what a never-purging front-door pass reached");
  H.assert(REACH.rimSweepKills >= 1, "⚠ rim_sweep is inside what a played board reached");

  // And the module actually RETURNS each row at its threshold — the predicate,
  // not the number. ⛔ Per row, one evaluation each, against a fresh store.
  const weekNow = X0.Achievements.weeklyFor(X0.Achievements.weekKey());
  for (const r of LIFE()) {
    const A = ach(X0);
    const out = A.api.evaluate({ mode: r.mode === null ? "classic" : r.mode, [r.fact]: top(r) });
    H.assert(out.some(u => u.id === r.id && u.weekKey === null),
             `⛔ REACHABLE: evaluate() returns ${r.id} at ${top(r)} (${J(out.map(u => u.id))})`);
    if (Array.isArray(r.tiers)) {
      H.eq(out.find(u => u.id === r.id).tier, r.tiers.length, `and at its TOP tier (${r.id})`);
    }
  }
  for (const r of POOL()) {
    // ⛔ Only the week's own five are live, so each pool row is evaluated in a
    // week that holds it — weeklyFor() is pure and callable for any week.
    let key = null;
    for (let n = 0; n < POOL().length * 4 && key === null; n++) {
      const k = "2026-W" + String((n % 52) + 1).padStart(2, "0");
      if (X0.Achievements.weeklyFor(k).indexOf(r.id) >= 0) key = k;
    }
    H.assert(key !== null, `⛔ ${r.id} is in the rotation of some week (the walk reaches every entry)`);
    if (key === null) continue;
    const A = ach(X0, { lifetimeUnlocked: [], lifetimeTiers: {}, weeklyUnlocked: [], weekKey: key });
    const api = X0.createAchievements({
      defs: X0.C.ACHIEVEMENTS, load: () => A.box.value, save: v => { A.box.value = JSON.parse(J(v)); },
      now: () => Date.UTC(2026, 0, 1),
    });
    // The week the store names is the one the ids came from; evaluate() reads
    // the clock's week, so drive weeklyFor directly for the membership claim
    // and evaluate for the predicate, in that week's own store.
    const out = api.evaluate({ mode: r.mode === null ? "classic" : r.mode, [r.fact]: top(r) });
    const live = X0.Achievements.weeklyFor("2026-W01");
    if (live.indexOf(r.id) >= 0) {
      H.assert(out.some(u => u.id === r.id), `⛔ REACHABLE: evaluate() returns ${r.id} at ${top(r)} in its week`);
    } else {
      H.assert(!out.some(u => u.id === r.id), `⛔ ${r.id} is not evaluated outside its week`);
    }
  }
  H.assert(weekNow.length === X0.C.ACHIEVEMENTS.perWeek, "the live week holds exactly perWeek rows");
}

// -- a STAGED board for each borderline row ----------------------------------
function quiet(X, level, mode) {
  const st = X.state;
  X.Game.reset();
  X.startGame(SEED, { mode: mode || "classic", startDepth: level });
  st.spawn.remaining = 0; st.spawn.timer = -1e9;
  st.enemies = []; st.shots = [];
  return { st, well: X.WELLS[st.wellIndex] };
}
{
  // rim_sweep: a parked Vaulter in the craft's lane, fire held — the sweep kills
  // it, the counter moves, and the clear edge unlocks the row off the REAL seat.
  const X = build({ mutate: [SEAT_CLEAR, SEAT_END] });
  const seen = [];
  globalThis.__seat = (which, f) => seen.push({ which, f: Object.assign({}, f) });
  const S = session(X); S.boot();
  const { st, well } = quiet(X, 5);
  const v = new X.Vaulter(st.skimmer.lane, 1 - X.C.RIM_CONTACT_DEPTH, 1);
  st.enemies.push(v);
  st.input.fire = true; st.invulnTime = X.C.RESPAWN_INVULN;
  X.collideSkimmer(st, well);
  H.eq(v.dead, true, "fixture: the staged sweep killed it");
  H.eq(st.tally.rimSweepKills, 1, "fixture: rimSweepKills moved");
  st.enemies = [];
  const out = X.Meta.clearEdge();
  H.assert(out !== null && out.some(u => u.id === "rim_sweep"),
           `⛔ STAGED: rim_sweep unlocks from a played board's rim sweep (${J((out || []).map(u => u.id))})`);
  H.assert(seen.some(s => s.which === "clear" && s.f.rimSweepKills === 1), "and the seat read the counter");

  // purge_saver: the same board cleared with purgeUses 0 — its TIER 1. Tiers 2
  // and 3 are held by REACH above, MEASURED 59 on a never-purging pass.
  H.eq(st.purgeUses, 0, "fixture: the staged board never spent the Purge");
  H.assert(st.tally.purgeSavedClears >= 0, "fixture: the clear-edge counter exists");
}

// -- (b) none throws on empty state -------------------------------------------
{
  const A = ach(X0);
  for (const facts of [undefined, null, {}, { mode: "classic" }, { mode: null }, { mode: "overdrive" },
                       { mode: "classic", wellsCleared: NaN, kills: Infinity, score: "9" }]) {
    let err = null, out = null;
    try { out = A.api.evaluate(facts); } catch (e) { err = e; }
    H.assert(err === null, `⛔ EMPTY STATE: evaluate(${J(facts)}) does not throw (${err && err.message})`);
    H.eq(J(out), "[]", "and unlocks nothing from a fact that is not a finite number");
  }
  H.eq(A.box.writes, 0, "⛔ and writes nothing: the store is untouched by a run that earned nothing");

  // A fresh build, a fresh profile, an empty store: both seats, no run.
  const Y = build();
  session(Y).boot();
  let err = null;
  try { Y.Meta.clearEdge(); Y.Meta.runEnded("quit"); } catch (e) { err = e; }
  H.assert(err === null, `⛔ EMPTY STATE: both seats are safe with no run open (${err && err.message})`);
  H.assert(Y.Meta.achievements() !== null, "and the screen's reader answers on a booted store");

  // ⛔ A BLOCKED STORE (a sandboxed embed): kit-storage falls back, so the
  // reader still answers — the claim is that neither it nor the SCREEN throws,
  // and that the screen is navigable whatever it answers.
  const Z = build({ storage: "blocked" });
  const ZS = session(Z); ZS.boot();
  let zerr = null, zsnap;
  try { zsnap = Z.Meta.achievements(); } catch (e) { zerr = e; }
  H.assert(zerr === null, `⛔ EMPTY STATE: the screen's reader is safe over a BLOCKED store (${zerr && zerr.message})`);
  ZS.toAchievements();
  H.eq(Z.state.screen, "achievements", "⛔ and the screen opens over it");
  const zv = ZS.draw();
  H.assert(zv !== null && zv.items.length > 0 && zv.items[zv.items.length - 1].label === "BACK",
           `⛔ with BACK last, whether the store answered or not (${J(zsnap === null)})`);
}

// -- (c) tiers monotonic, with a mutation that lowers one ---------------------
{
  const row = LIFE().find(r => Array.isArray(r.tiers) && r.tiers.length === 3);
  H.assert(row !== undefined, "fixture: a three-tier row exists");
  const A = ach(X0);
  A.api.evaluate({ mode: "classic", [row.fact]: row.tiers[2] });
  H.eq(A.box.value.lifetimeTiers[row.id], 3, `fixture: ${row.id} reached tier 3`);
  const writes = A.box.writes;
  const out = A.api.evaluate({ mode: "classic", [row.fact]: row.tiers[0] });
  H.assert(!out.some(u => u.id === row.id), "⛔ MONOTONIC: a weaker run reaches a lower tier and unlocks nothing");
  H.eq(A.box.value.lifetimeTiers[row.id], 3, "⛔ and the stored tier does not fall");
  H.eq(A.box.writes, writes, "⛔ and nothing is written");

  const M = build({ mutate: [MONOTONIC] });
  const B = ach(M);
  B.api.evaluate({ mode: "classic", [row.fact]: row.tiers[2] });
  const lowered = B.api.evaluate({ mode: "classic", [row.fact]: row.tiers[0] });
  H.assert(lowered.some(u => u.id === row.id) && B.box.value.lifetimeTiers[row.id] === 1,
           "⛔ mutation: `reached !== held` in place of `reached >` lets a tier FALL (red)");
}

// ===========================================================================
// 4. every row's fact is BUILT, and every fact built has a row
// ===========================================================================
{
  const X = build({ mutate: [SEAT_CLEAR, SEAT_END] });
  const seen = [];
  globalThis.__seat = (which, f) => seen.push({ which, f: Object.assign({}, f) });
  const S = session(X); S.boot();
  // Two wells cleared, then the run ended — both seats, both shapes.
  const { st } = quiet(X, 3);
  // ⛔ The dive follows each clear, so the board has to be emptied again on the
  // far side of it: keep the well quiet and step until two edges have fired.
  for (let n = 0; n < 4000 && st.tally.wellsCleared < 2; n++) {
    st.spawn.remaining = 0; st.spawn.timer = -1e9; st.enemies = [];
    S.liveStep();
  }
  H.assert(st.tally.wellsCleared >= 2, `fixture: the staged run cleared (${st.tally.wellsCleared})`);
  X.Meta.runEnded("quit");

  const clear = seen.filter(s => s.which === "clear");
  const end = seen.filter(s => s.which === "end");
  H.assert(clear.length >= 2 && end.length === 1, `fixture: both seats fired (${clear.length}, ${end.length})`);

  const union = new Set();
  for (const s of seen) for (const k of Object.keys(s.f)) union.add(k);
  const named = new Set(ROWS().map(r => r.fact));
  const unbuilt = [...named].filter(f => !union.has(f));
  H.eq(J(unbuilt), "[]", "⛔ EVERY ROW'S FACT IS A FIELD THE GAME BUILDS — a row naming one nobody builds unlocks nothing, silently");
  // ⛔ AND THE OTHER DIRECTION, PINNED RATHER THAN EMPTY: CS015 P2 handed over
  // every `tally` counter, and four of CS007's own are not read by any row in
  // A8's table. They stay — P2's facts object is its shipping shape, not P3's
  // to trim — and the SET is pinned here so a phase that adds a FACT without a
  // row, or a row without a fact, moves this line and says why.
  // ⛔ MOVED AT CS016 P3: `dives_done` was re-aimed at `cleanDives` (N12), so
  // `divesCompleted` is a fifth unread counter — handed over, not trimmed.
  const unused = [...union].filter(k => k !== "mode" && !named.has(k)).sort();
  H.eq(J(unused), J(["deaths", "divesCompleted", "purgesSpent", "shotsFired", "thornDeaths"]),
       "⛔ exactly CS007's five unread counters are handed over without a row");

  // ⛔ TRAP 3: the split between the seats is the point.
  const perWell = ["wellRings", "wellCarrierSplits", "wellTokens", "wellThornsCleared", "openCleanClear",
                   "quietClear", "wardenCleanWell", "clearOnLastLife", "cleanStreak", "deepFirstClear"];
  const perRun = ["purgeHeldRun", "noThornDeathRun"];
  for (const k of perWell) {
    H.assert(k in clear[0].f, `the clear edge carries ${k}`);
    H.assert(!(k in end[0].f), `⛔ and the run's END does not — a stale window cannot unlock (${k})`);
  }
  for (const k of perRun) {
    H.assert(k in end[0].f, `the run's end carries ${k}`);
    H.assert(!(k in clear[0].f), `⛔ and the clear edge does not — a run that is still going has not ended (${k})`);
  }
  H.assert(Object.keys(clear[0].f).every(k => k === "mode" || Number.isFinite(clear[0].f[k])),
           "⛔ every fact but `mode` is a finite number at the clear edge");
  H.assert(Object.keys(end[0].f).every(k => k === "mode" || Number.isFinite(end[0].f[k])),
           "and at the run's end");
  // The 0/1 facts really are 0/1.
  for (const k of perWell.concat(perRun).filter(n => /^(open|quiet|warden|clearOn|purgeHeld|noThorn)/.test(n))) {
    const vals = seen.filter(s => k in s.f).map(s => s.f[k]);
    H.assert(vals.every(v => v === 0 || v === 1), `⛔ ${k} is a 0/1 fact, because "fewer than" has no >= form (${J(vals)})`);
  }
  // The window is a DELTA, not the run's total.
  H.assert(clear.every(s => s.f.deepFirstClear === 0 || s.f.deepFirstClear === st.startDepth),
           "deepFirstClear is the Start Depth on the run's FIRST clear and 0 after");
  H.eq(clear[1].f.deepFirstClear, 0, "⛔ and the second clear reads 0, so the table's 33 means the FIRST well");
}

// ===========================================================================
// 5. the surface (A1-A, R9)
// ===========================================================================
{
  const X = build();
  const S = session(X); S.boot();
  H.eq(X.state.screen, "title", "fixture: booted on the title");
  let v = S.draw();
  H.eq(J(v.items.map(r => r.label)), J(["PLAY", "OPTIONS", "SCORES", "PROFILE", "ACHIEVEMENTS"]),
       "⛔ the title's row goes AFTER PROFILE (plan §1.2, V1: two closed repairs, no navigation moved)");
  S.toAchievements();
  H.eq(X.state.screen, "achievements", "⛔ the title's row opens the screen");

  v = S.draw();
  H.eq(v.title, "ACHIEVEMENTS", "its title");
  H.eq(v.items[v.items.length - 1].label, "BACK", "⛔ BACK last");
  H.eq(v.items[0].label, "LIFETIME", "a LIFETIME header first");
  H.assert(v.items.some(r => r.label === "THIS WEEK"), "and a THIS WEEK header");
  H.assert(v.items.filter(r => !r.enabled).length === 2, "⛔ the two headers are the only disabled rows");
  H.eq(v.items.length, LIFE().length + X0.C.ACHIEVEMENTS.perWeek + 3,
       "⛔ every lifetime row, the week's five, two headers and BACK");
  H.assert(v.lines.length === 2, `⛔ TWO info lines and no third (${J(v.lines)})`);
  H.assert(/^0 OF 23 · WEEK \d{4}-W\d\d$/.test(v.lines[0]), `the count and the week (${J(v.lines[0])})`);

  // ⛔ THE WINDOW: more rows than MENU_VISIBLE_ROWS, and the draw shows that many.
  H.assert(v.items.length > X.C.MENU_VISIBLE_ROWS, "fixture: the screen is longer than its window");
  const labels = v.items.map(r => r.label);
  const drawn = labels.filter(l => X.texts.includes(l));
  H.eq(drawn.length, X.C.MENU_VISIBLE_ROWS, `⛔ exactly MENU_VISIBLE_ROWS rows are drawn (${drawn.length})`);
  H.assert(X.texts.includes(v.title) && v.lines.every(l => l === "" || X.texts.includes(l)),
           "⛔ the title and the info lines go through drawText() too");

  // ⛔ REBUILT ON ENTRY AND NEVER IN draw().
  const before = J(X.Game === null ? null : v.items);
  for (let n = 0; n < 5; n++) S.draw();
  H.eq(J(S.draw().items), before, "⛔ draw() rebuilds nothing — the rows are the ones entry built");
  // Unlock something behind the screen's back, then re-enter.
  S.back();
  H.eq(X.state.screen, "title", "⛔ BACK from the title's door returns to the title");
  {
    const st = X.state;
    quiet(X, 3);
    st.enemies = [];
    for (let n = 0; n < 600 && st.tally.wellsCleared === 0; n++) S.liveStep();
    H.assert(st.tally.wellsCleared > 0, "fixture: a well was cleared, so first_well unlocked");
    X.Meta.runEnded("quit");
    st.screen = "title";
  }
  S.steps(2);
  S.toAchievements();
  const after = S.draw();
  H.assert(/^[1-9]\d* OF 23 /.test(after.lines[0]), `⛔ REBUILT ON ENTRY: the count moved (${J(after.lines[0])})`);
  H.assert(after.items.some(r => r.detail === "DONE" || /^\d+\/\d+$/.test(r.detail)),
           `⛔ and a row now reads its standing (${J(after.items.map(r => r.detail).filter(Boolean))})`);
  H.assert(after.items.every(r => r.detail === "" || r.detail.length <= 4),
           "⛔ every detail is at most four characters — the measured column budget");

  // ⛔ THE NOTE LINE FOLLOWS THE CURSOR, and is written in update(), never draw().
  const note0 = after.lines[1];
  H.assert(note0 === X0.C.ACHIEVEMENTS.lifetime[0].note || note0 === "",
           `the note line reads the cursor row's note (${J(note0)})`);
  S.right(1);
  const moved = S.draw();
  H.assert(moved.lines[1] !== note0 || note0 === "", "⛔ a cursor move moves the note");
  const held = moved.lines[1];
  for (let n = 0; n < 3; n++) X.Game.draw();
  H.eq(S.draw().lines[1], held, "⛔ and draw() never writes it");

  // ⛔ NO HUD RECTANGLE (A1): H4 says the HUD draws where a run is on screen.
  const h0 = X.drawHud.calls;
  X.Game.draw();
  H.eq(X.drawHud.calls - h0, 0, "⛔ NO TOAST AND NO HUD on the title's ACHIEVEMENTS — no run is on screen");
}

// -- the OPTIONS door, and the HUD that comes with it -------------------------
{
  const X = build();
  const S = session(X); S.boot();
  const opts = X.state.screen;
  H.eq(opts, "title", "fixture: the title");
  // Title → PLAY → CLASSIC → the first Start Depth → play → pause → OPTIONS.
  S.ok(); S.right(1); S.ok(); S.ok();
  H.eq(X.state.screen, "play", "fixture: a Classic run is live");
  S.press("p");
  H.eq(X.state.screen, "pause", "fixture: paused");
  S.right(1); S.ok();
  H.eq(X.state.screen, "options", "fixture: OPTIONS from pause");
  const rows = S.draw().items.map(r => r.label);
  H.assert(rows.indexOf("ACHIEVEMENTS") === rows.length - 2,
           `⛔ OPTIONS' row goes BEFORE BACK and never above TELEMETRY (${J(rows)})`);
  H.assert(rows.indexOf("TELEMETRY") === 0, "⛔ TELEMETRY is still OPTIONS' first row");
  // Walk the cursor to it and confirm.
  S.right(rows.length);
  S.right(0);
  {
    const v = S.draw();
    // The cursor clamps at the last row (BACK); step back one to ACHIEVEMENTS.
    H.eq(v.items[v.cursor].label, "BACK", "fixture: the cursor clamped on BACK");
  }
  S.press("ArrowLeft");
  H.eq(S.draw().items[S.draw().cursor].label, "ACHIEVEMENTS", "fixture: the cursor is on the row");
  S.ok();
  H.eq(X.state.screen, "achievements", "⛔ OPTIONS' row opens the same screen");
  const h0 = X.drawHud.calls;
  X.Game.draw();
  H.eq(X.drawHud.calls - h0, 1, "⛔ H4: opened through OPTIONS-from-pause a run IS on screen, so the HUD draws");
  S.back();
  H.eq(X.state.screen, "options", "⛔ and BACK returns to the door it came through");
}

// ===========================================================================
// 6. the sound (A10-A)
// ===========================================================================
{
  H.assert(X0.C.SFX.unlock !== undefined, "⛔ one new event, `unlock` (A10-A)");
  let err = null;
  try { X0.sfxCheckRecipe(X0.C.SFX.unlock); } catch (e) { err = e; }
  H.assert(err === null, `C.SFX.unlock is a valid recipe${err ? ": " + err.message : ""}`);
  H.assert(!("unlock" in X0.C.SFX_KILL_PITCH), "⛔ and NO SFX_KILL_PITCH voice: an unlock is not a kill");
  H.assert(!Object.prototype.hasOwnProperty.call(X0.C.MUSIC_DIP_EVENTS || {}, "unlock"),
           "⛔ and no C.MUSIC_DIP_EVENTS row");

  const X = build();
  const S = session(X); S.boot();
  const st = X.state;
  quiet(X, 3);
  st.enemies = [];
  X.sounds.length = 0;
  for (let n = 0; n < 600 && st.tally.wellsCleared === 0; n++) S.liveStep();
  H.assert(st.tally.wellsCleared > 0, "fixture: a clear edge fired");
  H.eq(X.sounds.filter(n => n === "unlock").length, 1,
       `⛔ ONE sfx("unlock") per unlocking seat, however many rows unlocked (${J(X.sounds)})`);

  // A second clear that unlocks nothing is silent.
  const before = X.sounds.filter(n => n === "unlock").length;
  X.sounds.length = 0;
  const out = X.Meta.clearEdge();
  H.eq(J(out), "[]", "fixture: the next evaluation unlocked nothing");
  H.eq(X.sounds.filter(n => n === "unlock").length, 0, "⛔ and nothing sounded");
  H.assert(before === 1, "fixture: the first clear did sound");
}

H.report();

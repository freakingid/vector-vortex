// 20-achievements.js — the unlock store and its evaluator (GDD 15.5, 15.7).
// CS015 P1.
//
// ⛔ KIT-SHAPED FROM THIS COMMIT: the future kit-achievements
// (src/20-achievements.NOTES.md, which doubles as its draft documentation).
// ⛔ IT NAMES NO GAME OBJECT, NO GAME GLOBAL AND NO ENTRY IN THE GAME'S CONFIG,
// in either direction. Everything crosses as an option: `defs` (the definition
// table, which the caller keeps wherever its own rules put it), `load` / `save`
// (a stored value in, a stored value out) and `now` (the clock, in ms).
// createScores() below it in the build is the shipped precedent for the seam.
//
// ⛔ THE CLOCK IS INJECTED AND THIS FILE NEVER READS THE PLATFORM'S. A module
// that reads the platform clock cannot be driven by a test at all, and a week
// key read on a hot path would roll the ISO week inside one session
// (PLANNED-FEATURES-CS015.md §1.5: 9.2 faked days over 100,008 steps).
//
// ⛔ TWO SEATS CALL evaluate(), BOTH IN THE CALLER: the clear edge and the run's
// end (22-meta.js, since CS015 P2). The store is written only when something
// unlocked.
//
// THE STORED VALUE (GDD 15.5, A6), one object under one declared key:
//   { lifetimeUnlocked: [id, …],        untiered lifetime rows
//     lifetimeTiers:    { id: index },  ⛔ MONOTONIC — only ever raised
//     weeklyUnlocked:   [id, …],        emptied when the week rolls
//     weekKey:          "YYYY-Www" }    ⛔ an ISO year-week computed in UTC
// Arrays rather than Sets: a Set does not survive JSON, and the caller's store
// stringifies. Loading is known-value-else-default PER FIELD — an unknown id is
// dropped, a tier index past its row's tier count clamps, and a `weekKey` that
// is not the current week empties the weekly list alone.

// ---------------------------------------------------------------------------
// THE ISO YEAR-WEEK, IN UTC
// ---------------------------------------------------------------------------
//
// ⛔ THESE FIVE NUMBERS ARE ISO-8601's DEFINITION, NOT TUNABLES, so they are
// local rather than options: nothing tunes what a week is. (The caller's own
// "every tunable in the config" rule is about knobs a tuning pass turns; a
// module that may not read that config could not take them from there anyway.)
const MS_PER_DAY = 86400000;
const DAYS_PER_WEEK = 7;
const THURSDAY_INDEX = 3;      // Monday is 0, so Thursday — the year-deciding day
const ANCHOR_DAY_OF_JANUARY = 4;   // ISO week 1 is the week holding 4 January
const WEEKS_PER_YEAR_ORDINAL = 53; // the widest ISO year, for a monotone ordinal

// Monday is 0, Sunday is 6 — ISO's numbering, not the platform's.
function isoDayIndex(ms) {
  return (new Date(ms).getUTCDay() + 6) % DAYS_PER_WEEK;
}

// ⛔ "YYYY-Www", UTC. A LOCAL reading rolls mid-session and differs across
// devices: read at Sunday 23:30 UTC this gives the EARLIER week, where any zone
// east of UTC would already have rolled. The ISO YEAR is the year of the week's
// Thursday, which is why 2027-01-03 is 2026-W53 and 2021-01-01 is 2020-W53.
function isoWeekKey(ms) {
  const at = new Date(ms);
  const day = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  const thursday = day + (THURSDAY_INDEX - isoDayIndex(day)) * MS_PER_DAY;
  const year = new Date(thursday).getUTCFullYear();
  const anchor = Date.UTC(year, 0, ANCHOR_DAY_OF_JANUARY);
  const firstMonday = anchor - isoDayIndex(anchor) * MS_PER_DAY;
  const week = Math.round((thursday - firstMonday) / (DAYS_PER_WEEK * MS_PER_DAY)) + 1;
  return year + "-W" + (week < 10 ? "0" + week : String(week));
}

// A monotone whole number per week, so the rotation is arithmetic on the KEY and
// never on a clock. An unparseable key reads 0, which is a week like any other.
function weekOrdinal(key) {
  const m = /^(\d+)-W(\d+)$/.exec(typeof key === "string" ? key : "");
  return m === null ? 0 : Number(m[1]) * WEEKS_PER_YEAR_ORDINAL + Number(m[2]);
}

// ---------------------------------------------------------------------------
// THE FACTORY
// ---------------------------------------------------------------------------
//
// createAchievements({ defs, load, save, now }) returns the unlock store over
// one definition table. Every option is validated here and throws with a named
// message, so a malformed table fails at boot rather than mid-evaluation.
//
// ⛔ TWO TABLES, KEPT APART. `defs.lifetime` is what exists and what each row
// reads; `defs.weekly` is the POOL that rotates, `defs.perWeek` of it live in
// any one week. Neither names the other's numbers, and ⛔ nothing derives a pool
// index from a lifetime row's tier.
//
// A ROW is { id, mode, fact } plus EXACTLY ONE OF:
//   tiers: [t1, t2, …]  ascending thresholds; the unlock's `tier` is the 1-based
//                       index reached, and ⛔ it only ever rises
//   at: n               one threshold; the unlock's `tier` is 0
// `id` is SAVE DATA and is never renamed. `mode` is a mode name, or null for
// either — the tag belongs to the achievement, not to the store. `fact` names
// the field the caller's facts object carries.
//
// ⛔ NOTHING IS CACHED. load() runs on every call, so a caller that switches
// which store it hands back needs no hook here — createScores' rule, for the
// same reason.
function createAchievements(options) {
  const opts = options || {};
  const { defs, load, save, now } = opts;

  for (const name of ["load", "save", "now"]) {
    if (typeof opts[name] !== "function") throw new Error("createAchievements: options." + name + " must be a function");
  }
  if (!defs || typeof defs !== "object") throw new Error("createAchievements: options.defs must be the definition table");
  if (!Array.isArray(defs.lifetime)) throw new Error("createAchievements: options.defs.lifetime must be an array");
  if (!Array.isArray(defs.weekly)) throw new Error("createAchievements: options.defs.weekly must be an array");
  const pool = defs.weekly;
  const perWeek = defs.perWeek;
  if (!Number.isInteger(perWeek) || perWeek < 1) throw new Error("createAchievements: options.defs.perWeek must be a whole number >= 1");
  if (perWeek > pool.length) throw new Error("createAchievements: options.defs.perWeek is larger than the weekly pool");

  // The rows, indexed by id, with every id unique across BOTH tables: one id is
  // one achievement, whichever table it sits in.
  const rows = {};
  function admit(row, weekly) {
    if (!row || typeof row !== "object") throw new Error("createAchievements: every row must be an object");
    if (typeof row.id !== "string" || row.id === "") throw new Error("createAchievements: every row needs a non-empty id");
    if (Object.prototype.hasOwnProperty.call(rows, row.id)) throw new Error("createAchievements: duplicate id " + JSON.stringify(row.id));
    if (typeof row.fact !== "string" || row.fact === "") throw new Error("createAchievements: row " + JSON.stringify(row.id) + " needs a non-empty fact");
    if (!(row.mode === null || (typeof row.mode === "string" && row.mode !== ""))) {
      throw new Error("createAchievements: row " + JSON.stringify(row.id) + "'s mode must be a mode name or null");
    }
    const tiered = Array.isArray(row.tiers);
    const flat = row.at !== undefined;
    if (tiered === flat) throw new Error("createAchievements: row " + JSON.stringify(row.id) + " needs exactly one of tiers and at");
    if (tiered) {
      if (weekly) throw new Error("createAchievements: weekly row " + JSON.stringify(row.id) + " may not be tiered");
      if (row.tiers.length < 1) throw new Error("createAchievements: row " + JSON.stringify(row.id) + " has an empty tiers list");
      for (let i = 0; i < row.tiers.length; i++) {
        if (!Number.isFinite(row.tiers[i])) throw new Error("createAchievements: row " + JSON.stringify(row.id) + " has a non-finite threshold");
        if (i > 0 && row.tiers[i] <= row.tiers[i - 1]) throw new Error("createAchievements: row " + JSON.stringify(row.id) + "'s tiers must ascend");
      }
    } else if (!Number.isFinite(row.at)) {
      throw new Error("createAchievements: row " + JSON.stringify(row.id) + " has a non-finite threshold");
    }
    rows[row.id] = row;
  }
  for (const row of defs.lifetime) admit(row, false);
  for (const row of pool) admit(row, true);

  const poolIds = {};
  for (const row of pool) poolIds[row.id] = true;
  const known = id => typeof id === "string" && Object.prototype.hasOwnProperty.call(rows, id);
  const tieredRow = id => known(id) && Array.isArray(rows[id].tiers);
  // An untiered LIFETIME row: the weekly pool has its own list.
  const flatRow = id => known(id) && !Array.isArray(rows[id].tiers) && poolIds[id] !== true;

  // ⛔ THE ROTATION IS A FUNCTION OF THE WEEK AND OF NOTHING ELSE. A stride walk
  // over the pool: the start moves every week, the stride every pool-length
  // weeks, and a collision steps to the next free index — so the picks are
  // always distinct and, over time, every entry is reached. ⛔ Integer
  // arithmetic on the key: no draw, no clock, no board.
  function weeklyFor(key) {
    const n = pool.length;
    const ord = weekOrdinal(key);
    const stride = n === 1 ? 1 : 1 + Math.floor(ord / n) % (n - 1);
    const taken = {};
    const out = [];
    let i = ord % n;
    while (out.length < perWeek) {
      if (taken[i] === true) { i = (i + 1) % n; continue; }
      taken[i] = true;
      out.push(pool[i].id);
      i = (i + stride) % n;
    }
    return out;
  }

  // The stored value, validated field by field against the table, for `key`'s
  // week. ⛔ A weekKey that is not this week empties the weekly list ALONE: the
  // lifetime stores are not week-scoped and a roll must not touch them.
  function read(key) {
    const d = load();
    const held = d !== null && typeof d === "object" ? d : {};
    const out = { lifetimeUnlocked: [], lifetimeTiers: {}, weeklyUnlocked: [], weekKey: key };
    if (Array.isArray(held.lifetimeUnlocked)) {
      for (const id of held.lifetimeUnlocked) {
        if (flatRow(id) && out.lifetimeUnlocked.indexOf(id) < 0) out.lifetimeUnlocked.push(id);
      }
    }
    if (held.lifetimeTiers !== null && typeof held.lifetimeTiers === "object") {
      for (const id of Object.keys(held.lifetimeTiers)) {
        if (!tieredRow(id)) continue;
        const n = held.lifetimeTiers[id];
        if (!Number.isInteger(n) || n < 1) continue;
        out.lifetimeTiers[id] = Math.min(n, rows[id].tiers.length);
      }
    }
    if (held.weekKey === key && Array.isArray(held.weeklyUnlocked)) {
      const live = weeklyFor(key);
      for (const id of held.weeklyUnlocked) {
        if (live.indexOf(id) >= 0 && out.weeklyUnlocked.indexOf(id) < 0) out.weeklyUnlocked.push(id);
      }
    }
    return out;
  }

  // The unlock payload (A11), shaped so server-backing later is wiring: `tier`
  // is 0 for an untiered row, `weekKey` is null for a lifetime one, and `at` is
  // the injected clock's reading.
  function unlock(out, id, tier, key, at) {
    out.push({ id, tier, weekKey: key, at });
  }

  return {
    // The current ISO year-week, from the injected clock.
    weekKey() { return isoWeekKey(now()); },
    // The ids live in one named week — pure, and callable for any week.
    weeklyFor,
    // The ids live in THIS week.
    weekly() { return weeklyFor(isoWeekKey(now())); },
    // The stored value as this build reads it, for a caller that shows it.
    snapshot() {
      const held = read(isoWeekKey(now()));
      return { lifetimeUnlocked: held.lifetimeUnlocked.slice(),
               lifetimeTiers: Object.assign({}, held.lifetimeTiers),
               weeklyUnlocked: held.weeklyUnlocked.slice(),
               weekKey: held.weekKey };
    },
    // Every row the facts satisfy that is not held already, as an array of
    // payloads, newest state written once. ⛔ A row whose mode the facts do not
    // match is skipped, and ⛔ a fact that is not a finite number is a SKIP
    // rather than a comparison against undefined.
    evaluate(facts) {
      const f = facts !== null && typeof facts === "object" ? facts : {};
      const mode = typeof f.mode === "string" ? f.mode : null;
      // ⛔ ONE CLOCK READING PER CALL: the week and the stamp are the same
      // instant, and a faked clock that advances per call cannot split them.
      const at = now();
      const key = isoWeekKey(at);
      const held = read(key);
      const out = [];
      const matches = row => row.mode === null || row.mode === mode;
      for (const row of defs.lifetime) {
        const v = f[row.fact];
        if (!matches(row) || !Number.isFinite(v)) continue;
        if (Array.isArray(row.tiers)) {
          let reached = 0;
          for (let i = 0; i < row.tiers.length; i++) if (v >= row.tiers[i]) reached = i + 1;
          // ⛔ MONOTONIC: a weaker run reaches a lower tier and writes nothing.
          if (reached > (held.lifetimeTiers[row.id] || 0)) {
            held.lifetimeTiers[row.id] = reached;
            unlock(out, row.id, reached, null, at);
          }
        } else if (v >= row.at && held.lifetimeUnlocked.indexOf(row.id) < 0) {
          held.lifetimeUnlocked.push(row.id);
          unlock(out, row.id, 0, null, at);
        }
      }
      // ⛔ Only the week's own five are live. A pool row outside the rotation is
      // not evaluated, so it cannot be banked against a week it was never in.
      for (const id of weeklyFor(key)) {
        const row = rows[id];
        const v = f[row.fact];
        if (!matches(row) || !Number.isFinite(v)) continue;
        if (v >= row.at && held.weeklyUnlocked.indexOf(id) < 0) {
          held.weeklyUnlocked.push(id);
          unlock(out, id, 0, key, at);
        }
      }
      if (out.length > 0) save(held);
      return out;
    },
  };
}

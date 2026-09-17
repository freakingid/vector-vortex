# kit-scores — change notes

The backport packet for kit-scores. Someone merging this module into
coinless-kit reads only this file, not Vector Vortex's decision history.

**Module:** `createScores()` in `src/22-meta.js` (the local high scores portion only)
**Vendored from:** *originated here, destined for kit-scores*
**Current version:** none yet. It gets a `VERSION` when it is extracted.

⛔ The rest of `22-meta.js` is game glue: `Store`, `Profiles`, `Meta` (the
run's lifecycle and the eligibility gate) and the Start Depth record. None of
that goes to the kit. The game builds each row and decides when a run ends;
this module keeps the table.

---

## Contract summary

`createScores({ store, key, perMode, modes })` returns a best-first table of
rows per mode, kept under one storage key. It reads no game state and no config,
and it touches no global.

- **`store`**: anything with `get(key, fallback)` and `set(key, value)`. A
  kit-storage store fits as is, and the caller declares `key` on it. The module
  never enumerates the store.
- **`key`**: a non-empty string. The stored value is `{ <mode>: [row, …] }`.
- **`perMode`**: a whole number ≥ 1, the most rows kept per mode.
- **`modes`**: a non-empty array of mode names. Any other mode throws, the same
  way kit-storage throws on an undeclared key.

The methods:

- **`qualifies(mode, score)`**: true when `score` is finite, `> 0`, and would take
  a place in the mode's top `perMode`.
- **`add(mode, row)`**: inserts a shallow copy of `row` and returns its 1-based
  rank. If the row does not qualify, it returns `0` and writes nothing. Only
  `row.score` is read; every other field belongs to the caller.
- **`list(mode)`**: the mode's rows, best first, as a new array.

Rules:

- **A tie goes below.** An equal score ranks after every row already holding
  that score, so a full table's 10th place is not taken by a tie.
- **The table is read on every call, and nothing is cached.** A mode whose value
  is not an array reads as empty. A row without a finite `score > 0` is dropped.
  The rest are sorted best first with a stable sort, then cut to `perMode`.
- A caller that has its own eligibility rule (Vector Vortex: no debug bench in
  the run) checks it before `qualifies`. The module has no opinion on that.

```js
const scores = createScores({ store, key: "scores", perMode: 10, modes: ["classic", "overdrive"] });
if (runEligible && scores.qualifies("classic", finalScore)) {
  const rank = scores.add("classic", { score: finalScore, profileName, ts: Date.now() });
  showLine("NEW HIGH SCORE #" + rank);
}
scores.list("classic");   // [{ score, profileName, ts }, …] best first
```

---

## Changes

Newest last. One entry per change.

### 2026-09-16 — first draft (CS011 P3)

**What changed.** `createScores` was written kit-shaped from its first commit,
as `CLAUDE.md` requires for `22-meta.js`'s local high scores. The game creates
one instance in `Meta.boot()` over the root store, keyed `scores` v1, with
`perMode` from `C.SCORES_PER_MODE` (10) and modes `classic` and `overdrive`.

**Why.** GDD §15.3 sets a local top 10 per mode, shared across the machine's
profiles. The tie rule and `score > 0` come from Orbital Overhaul's `qualifies`
(plan R9).

**Game-agnostic?** Yes. Every input is an option. It does not use `C`, `state`,
the game's profile or its row shape. `test-cs011-p3.js` runs it over a plain
`Map`-backed store, separate from the game's instance.

**Backport status.** `not yet`. No kit-scores module exists in coinless-kit.

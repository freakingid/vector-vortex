# kit-achievements — change notes

The backport packet for kit-achievements. Someone merging this module into
coinless-kit reads only this file, not Vector Vortex's decision history.

**Module:** `createAchievements()` in `src/20-achievements.js` (the whole file)
**Vendored from:** *originated here, destined for kit-achievements*
**Current version:** none yet. It gets a `VERSION` when it is extracted.

⛔ The coinless kit forbids achievement-shaped code in every existing module,
deliberately, pending this one. Nothing else in `src/` belongs here: the game
builds the facts an evaluation reads, decides when to evaluate, and owns the
definition table's contents. This module keeps the store, the tiers and the week.

---

## Contract summary

`createAchievements({ defs, load, save, now })` returns an unlock store over one
definition table. It reads no game config, no game object and no global, and it
never reads the platform clock.

- **`defs`**: the definition table, `{ perWeek, lifetime, weekly }`.
  - **`lifetime`**: the rows that never reset.
  - **`weekly`**: the POOL that rotates. ⛔ Two tables, kept apart: neither names
    the other's numbers, and nothing derives a pool index from a lifetime row's
    tier.
  - **`perWeek`**: a whole number ≥ 1 and ≤ `weekly.length` — how many of the
    pool are live in any one week.
- **`load`**: `() => storedValueOrNull`. Called on every read; nothing is cached,
  so a caller that switches which store it hands back needs no hook here.
- **`save`**: `value => void`. Called only when something was unlocked.
- **`now`**: `() => milliseconds`. ⛔ The module's only clock. Injected so a
  caller can drive a week roll, and so a host that reads the clock on a hot path
  cannot make an unlock non-deterministic.

Every option is validated at construction and throws with a named message, so a
malformed table fails at boot rather than mid-evaluation.

### A row

```js
{ id: "wells_cleared", mode: null, fact: "wellsCleared", tiers: [10, 50, 200] }
{ id: "first_well",    mode: null, fact: "wellsCleared", at: 1 }
```

- **`id`**: ⛔ **save data.** It is never renamed: renaming one drops that unlock
  for every existing player, and deleting one orphans it.
- **`mode`**: a mode name, or `null` for either. A row is evaluated only when the
  facts' `mode` matches. The tag belongs to the achievement rather than to the
  store, so a host adding a third mode edits the table and nothing else.
- **`fact`**: the field the facts object carries. A fact that is not a finite
  number is a **skip**, never a comparison against `undefined`.
- ⛔ **Exactly one of `tiers` and `at`.** `tiers` is an ascending list and the
  unlock's `tier` is the 1-based index reached; `at` is one threshold and the
  unlock's `tier` is `0`. A weekly row may not be tiered.

### The stored value

```js
{ lifetimeUnlocked: ["first_well"],     // untiered lifetime rows
  lifetimeTiers:    { wells_cleared: 2 },  // ⛔ monotonic — only ever raised
  weeklyUnlocked:   ["week_five_wells"],   // emptied when the week rolls
  weekKey:          "2026-W38" }           // ⛔ ISO year-week, UTC
```

Arrays rather than Sets: a Set does not survive `JSON.stringify`, and a host's
store stringifies. Loading is known-value-else-default **per field** — an unknown
id is dropped, a tier index past its row's tier count clamps, a non-integer or
non-positive tier is dropped, and a `weekKey` that is not the current week empties
the weekly list **alone**. A roll never touches the lifetime stores, which are
not week-scoped.

### The methods

- **`weekKey()`**: the current ISO year-week, `"YYYY-Www"`, ⛔ computed in UTC.
  Local boundaries roll mid-session and differ across devices; read at Sunday
  23:30 UTC this gives the earlier week, where any zone east of UTC has rolled.
  The ISO year is the year of the week's Thursday, so 2027-01-03 is `2026-W53`
  and 2021-01-01 is `2020-W53`.
- **`weeklyFor(key)`**: the `perWeek` pool ids live in that week. ⛔ A function of
  the week and of nothing else — a stride walk in integer arithmetic on the key,
  with no draw, no board and no clock beyond the key it is given. Pure, so a host
  can show next week's set or a test can walk a century.
- **`weekly()`**: `weeklyFor(weekKey())`.
- **`snapshot()`**: the stored value as this build reads it, copied, for a host
  that shows it.
- **`evaluate(facts)`**: every row the facts satisfy that is not held already, as
  an array of payloads, with one write if anything unlocked. Only the week's own
  rotation is evaluated, so a pool row outside it cannot be banked against a week
  it was never in.

### The payload

```js
{ id: "wells_cleared", tier: 2, weekKey: null, at: 1789900000000 }
```

Payload-shaped from day one, so server-backing later is wiring rather than a
rewrite: `tier` is `0` for an untiered row, `weekKey` names the week for a weekly
unlock and is `null` for a lifetime one, and `at` is the injected clock's reading
— one reading per call, so the week and the stamp are the same instant.

```js
const ach = createAchievements({
  defs: ACHIEVEMENTS,                      // the host's table, handed over as data
  load: () => profileStore().get("achievements", null),
  save: v => profileStore().set("achievements", v),
  now:  () => Date.now(),
});
for (const got of ach.evaluate(facts)) showUnlock(got.id, got.tier);
```

---

## Changes

Newest last. One entry per change.

### 2026-09-20 — first draft (CS015 P1)

**What changed.** `createAchievements` was written kit-shaped from its first
commit, as `CLAUDE.md` requires for `20-achievements.js`. The game creates one
instance in `Meta.boot()` over the active profile's scope, keyed `achievements`
v1, with the definition table from its own config.

**Why.** GDD §15.5 sets Orbital Overhaul's proven v2 store shape — four stores,
monotonic tiers, an ISO year-week in UTC, and ids that are never renamed — and
asks for a payload-shaped object from day one. The kit forbids
achievement-shaped code everywhere else pending exactly this module.

**The one design call worth a backporter's attention.** The definition table has
tier thresholds in it, which are tunables, and Vector Vortex's highest
architectural rule puts every tunable in one config file — while the kit boundary
forbids this module from reading that file. Resolved the way `createScores`
already resolves it: the numbers stay in the host's config and cross as an
option. A kit module taking its whole table as data is the general form, and it
is why `defs` is an option rather than a constant here.

**Game-agnostic?** Yes. Every input is an option, including the clock. It names
no game object, no game global and no config entry — asserted by a text scan of
the module's slice of the built file (`test-cs015-p1.js`), which is run over the
built oracle rather than over `src/`. The same test drives the module over a
plain `Map`-backed store, separate from the game's instance.

**Backport status.** `not yet`. No kit-achievements module exists in
coinless-kit, and the definition table's contents are still placeholders here —
Vector Vortex lands its real ids at CS015 P3. The module's contract is not
expected to move with them.

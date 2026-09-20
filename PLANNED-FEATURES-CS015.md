# PLANNED-FEATURES-CS015 — achievements: the id table, written once

**The `achievements` key declared, `20-achievements.js` built kit-shaped as
`kit-achievements`' draft, ~24 lifetime ids plus five weekly rotated
deterministically by UTC ISO week, monotonic tiers, and somewhere a player can
see them. The thirteenth soak closes it (GDD §15.1, §15.5, §17 item 10, §19's
Meta row, §21 #4).**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes) and was run at commit `b92da55`.
A PREDICTED one says so.

⛔ **§0 IS NOT ANSWERED.** Twelve calls, each priced with a measurement and
carrying one recommendation. ⛔ **A build phase that reaches a call with no
answer stops** (`CLAUDE.md` rule 3).

**Baseline for every measurement: commit `b92da55`** (the `DECISIONS.md` index
rule, after the CS014 close).
- `node build.js` → 25 modules + 3 inlined kit, `dist/vector-vortex.html`
  **781,198 bytes** (762.9 KB).
- `node scratchpad/run-all.js` → **74 files passed, ZERO skips, exit 0, 191.5 s
  wall** (MEASURED this session; `run-all.js`'s per-file timeout is 120 s).
- `../coinless-kit` is present: `test-cs011-p5.js` and `test-cs012-p3.js` did
  not skip. The Worker was not contacted.
- `CLAUDE.md` **47,919 bytes**; `STATUS.md` **342 lines** (MEASURED, `wc`).

**How the probes ran.** Everything lived in this session's own scratchpad
directory and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`,
`tools/` or `lib/` was touched** (`CLAUDE.md` rule 3a); the one file this
session edits outside its two documents is `STATUS.md`, for the §0 defect §0.1
records.
- **Four stand-in variants** (§1.2) were `git clone --shared` copies of
  `b92da55`, each with one edit, and **the whole suite was run in each**. ⚠ In a
  clone there is no sibling `../coinless-kit`, so `test-cs011-p5.js` and
  `test-cs012-p3.js` SKIP there; that is the clone's location, not the edit.
- **A reach probe** (§1.3) played front-door runs in both modes at Start Depths
  1, 9, 17, 33 and 81, driving `Game.frame()` with a copy of
  `test-cs014-p3.js`'s four-clause hunter, and counted everything a candidate
  predicate could read — per class, per token kind, per kill site.
- **A storage probe** (§1.4) wrapped the harness's `localStorage` and recorded
  every `getItem` / `setItem` with the screen and the tick it happened on.
- **A clock probe** (§1.5) installed the twelfth soak's faked `Date.now` and
  counted the build's calls of it across a boot and a played run.
- **A week probe** (§1.6) checked an ISO-year-week-in-UTC function against six
  known boundaries and walked a rotation over 104 weeks.
- **Greps** (§1.7) for `mutate:`, `in <OBJECT>`, the kit `VERSION` literals and
  the menu-by-index navigation.

**Read for this plan, beyond the prompt's list:** `src/23-main.js`'s `SCREENS`,
`runAction`, `syncScreen`, the clear edge and the boot block; `src/15-render-hud.js`'s
`hudLayout`; `src/07-enemies.js`'s Thorn; `build.js`'s `MANIFEST` and
`KIT_INLINE`; `scratchpad/test-cs002-p1.js` (the module-banner scan),
`test-cs008-p4.js` and `test-cs008-p6.js` (the whole-file scans),
`test-cs009-p4.js` (`EVENTS`), `test-cs011-p3.js`–`-p6.js`, `test-cs012-p4.js`'s
`COMBO_OUT`, `test-cs014-p1.js`'s kill-line count; `src/22-meta.NOTES.md` for
the draft-kit-doc form. From `archive/`, only `PLANNED-FEATURES-CS013.md` (§0,
§2, §10–§15) and `PLANNED-FEATURES-CS011.md` (§0), for their FORM and for M4's
reasoning. From `log/`, only `log/CS011.md`'s P1 and P2 store sections and
`log/CS014.md`'s "Hazards parked out of `STATUS.md`" and "What moved out of
`STATUS.md` at the close" — **read because `STATUS.md` says the reasoning behind
"What CS015 must act on" is there and points at P1's parked block by name.**

---

## ⛔ 0. PAUL'S CALLS — NONE IS ANSWERED

Each is a design call the GDD does not settle, with its measurement and one
recommendation. ⛔ **A build phase builds the answer written in the right-hand
column and does not invent one.** ⚠ Every number marked ⚠ is provisional in the
sense CS012's O16 used: owned by a tuning pass, like the Classic palette.

⚠ **CS015 IS THE FIRST CHANGESET SINCE CS008 WHOSE MAIN RISK IS A DECISION THAT
CANNOT BE REVISED, RATHER THAN A MECHANISM THAT CAN.** Every changeset from
CS009 to CS014 shipped mechanism: a sound, an enemy, a token, a ring — each one
a thing a later changeset can retune, re-voice or cut, and CS013 shipped the
Mimic with an explicit cut written into the plan. ⛔ **An achievement `id` is
save data and is never renamed** (GDD §15.5; `CLAUDE.md`), so A8's table is the
one thing here that a later changeset cannot take back: renaming an id drops
that unlock for every player who had it, and deleting one orphans it. That is
why Paul moved achievements out of CS011 (his M4) and why they were planned only
once the game was finished — both modes, sixteen wells, nine enemies, five
tokens, the Jump, the combo and CS014's ring flight. §1.3 measures the whole of
that surface so the table is written against what the game actually does.

| # | The call | Recommendation | Answer |
|---|---|---|---|
| A1 | Where an achievement is SEEN — the GDD specs no surface at all | **A screen, reached from the title, and no toast.** One row appended AFTER PROFILE; §1.2 V1 MEASURED the cost at two closed assertions, and a toast has nowhere to go in Overdrive (§1.8) | |
| A2 | What the evaluator READS | **One flat `facts` object the game builds at the seat**, from `state` plus new `tally` fields. §1.2 V3 MEASURED a `tally` field free; §1.7 MEASURED an event stream at six pinned kill-line strings plus two count assertions | |
| A3 | WHEN it evaluates | **Two seats: the clear edge and `Meta.runEnded()`.** Never per step — §1.4 MEASURED that the clear edge already reads and writes storage on a play step, and §1.5 that a per-step clock read moves the soaks' faked week by 9.2 days | |
| A4 | Whether a BENCH run earns anything | **No.** `Meta.eligible()` is the ONE gate, extended, not duplicated. ⚠ Its body is pinned by a closed `mutate` (§1.7) | |
| A5 | Per mode, shared, or mode-TAGGED | **One shared store, rows MODE-TAGGED**: each id names the mode it reads, or `null` for either. Not a `C.MODE_FLAGS` field — that table is about what a RUN has | |
| A6 | The `achievements` key's declared SHAPE and version | **v1, §15.5's four stores, arrays rather than Sets**, no `migrate`. §1.2 V2 MEASURED the cost at one closed assertion | |
| A7 | The five WEEKLY, and the rotation | **A stride walk over a weekly-only pool of 20**, `weekKey` an ISO year-week in UTC from an injected `now()`. §1.6 MEASURED the function against six boundaries and the walk over 104 weeks | |
| A8 | **THE ID TABLE ITSELF** — the call with no second chance | **The 24 + 20 in §9**, each row measured reachable or flagged. ⚠ Two rows are flagged: `purge_wide` is MEASURED UNREACHABLE and `mimic_kill` rides on a probation the plan cannot close | |
| A9 | What an unlock is WORTH | **Nothing.** No points, no life, no `addScore()` call — so `addScore()` stays the one writer and GDD §7's table does not grow | |
| A10 | Whether an unlock has a SOUND | **Yes, one new event, `unlock`**, sfx-lab candidate A, no `SFX_KILL_PITCH` voice. `C.SFX` 27 → 28 | |
| A11 | The payload-shaped object's SHAPE (GDD §21 #4 names it and does not define it) | **`{ id, tier, weekKey, at }`**, returned from `evaluate()` as an array | |
| A12 | Where the DEFINITION TABLE lives — ⛔ two invariants collide here | **`C.ACHIEVEMENTS` as data, handed to the module as an option**, which is `createScores`' shipped precedent (§1.9) | |

### A1 — where an achievement is SEEN, and the GDD specs nothing

⛔ **GDD §15.5 is entirely storage and evaluation.** It names four stores, the
monotonic-tier rule, the UTC week and the never-rename rule, and it says nothing
about a surface. GDD §10.5's screen table has **no ACHIEVEMENTS row** (MEASURED,
read), and §0's §10.5 row enumerates every screen by name — title, mode, Start
Depth, scores, profiles and name entry, options, credits, controls and
rebinding, game over, pause — and names none. ⛔ **By `CLAUDE.md`'s own rule
that is a defect in §0, and §0.1 below records it in `STATUS.md`.**

**MEASURED (§1.2, V1): a row on the TITLE costs exactly two closed
assertions, and a row on OPTIONS costs nothing.** The variant added
`{ label: "AWARDS", … }` after `TITLE_PROFILE` **and** a row on OPTIONS before
BACK, and ran the whole suite:
- `test-cs011-p3.js:384` — `⛔ the title's rows: SCORES after OPTIONS`, an
  exhaustive four-label list.
- `test-cs011-p5.js:375` — the queued-line assertion, which reads the same four
  labels beside `"3 SCORES QUEUED"`.
- ⛔ **Nothing else moved**, the OPTIONS row included: the row went in before
  BACK, which is `CLAUDE.md`'s rule, and no closed test navigates OPTIONS past
  the sound rows by index.

**MEASURED (§1.8): a toast has nowhere to go.** `hudLayout()` returns six
rectangles — score (top-left), level (top-right), lives (bottom-left), purge
(bottom-right), jump (beside purge) and, in Overdrive only, the combo readout
CENTRE-TOP at `HUD_COMBO_Y` 6, `HUD_COMBO_SIZE` 56. The centre-top band is
76.29 px on the widest well and the readout clears it by 6.29 px (CS014's
parked note, re-read). A toast is a seventh rectangle, and the one place a
transient line belongs — centre-top — is taken in the mode that drops the most
achievements.

- **A — a screen, no toast (recommended).** SCORES' shape is the model: rows
  rebuilt on entry, never in `draw()`, a window of `MENU_VISIBLE_ROWS` 7 over
  however many rows there are, BACK last. **Two rows, both cheap:** one on the
  TITLE after PROFILE (two repairs) and one on OPTIONS before BACK (none). ⚠ The
  title would then have **five** rows against `MENU_VISIBLE_ROWS` 7, so it still
  does not scroll. Cost: one screen, two closed repairs, ⛔ one `SCREENS` entry
  and one `syncScreen` case.
- **B — a toast at the moment of unlock, no screen.** It is the only option that
  tells a player *when* they earned something. Cost: a seventh HUD rectangle in
  the one band Overdrive already uses, a new draw-time timer, and
  ⛔ `test-cs012-p4.js` and `-p5.js` both assert the four CS008 corners are
  bit-identical whether or not the Overdrive readouts are there — a seventh
  rectangle must be placed absolutely, off no other rectangle, or both go red
  (PREDICTED from reading; not variant-tested).
- **C — both.** The full CS016 shape, and the right end state. Cost: A plus B in
  one changeset, and B's HUD question is an *onboarding* question — what the
  player is told, and when — which ROADMAP already assigns to CS016.
- **D — neither: unlocks are recorded and never shown in v1.** Honest about
  scope and the cheapest thing that satisfies GDD §19's Meta row, which asks for
  "achievements with monotonic tiers and UTC ISO weeks" and names no surface.
  ⚠ It also ships a system no player can see, which is the shape of a feature
  that never gets finished.

⚠ **Whatever the answer, GDD §10.5 and §15.5 owe an edit**: §15.5 gains the
surface, §10.5 gains its row, and §0's §10.5 row gains the word.

### A2 — what the evaluator READS, and `state.tally` is not enough

**MEASURED, `newState()` at `b92da55`:** `state` has **28** keys and `tally`
exactly **8** — `deaths`, `wellsCleared`, `purgesSpent`, `divesCompleted`,
`thornDeaths`, `shotsFired`, `kills`, `spawnBlockedTicks`. ⛔ **None of them
names a token, a ring, the combo, the Jump or which enemy died.** The run's
other readable facts at its end are `score`, `level`, `startDepth`, `mode`,
`lives`, `time`, `wellIndex`, `seed`, `combo.peak`, `purgeUses`, `powers`,
`diedThisWell` and the three live arrays.

**MEASURED, `TELEMETRY_FIELDS`: 29 columns, `telemetry` at v1**, and
`21-telemetry.js`'s own header makes the list, `TELEMETRY_KINDS`,
`telemetryRow()` and the declared version move together. ⛔ **Telemetry is not
the source**: capture is OFF at every launch and never persisted (GDD §15.6), so
an evaluator reading it would be silent for every player who never turned it on.

- **A — new `tally` fields, read into one flat `facts` object at the seat
  (recommended).** **MEASURED (§1.2, V3): a ninth `tally` field, written at the
  ring take, left the whole suite GREEN** — `P1_DETERMINISM_HASH`,
  `GOLDEN_LANES` and all twelve soaks' paired hashes unmoved. `test-registry.js`
  moves not at all: `STATE_FIELDS.CS007` is the single entry `["tally"]`, and
  `02-state.js`'s own header says a counter inside that bag costs the inventory
  nothing. ⛔ The rule the bag carries comes with it: **write-only as far as the
  simulation is concerned, and nothing branches on one.**
- **B — an event stream the game pushes.** It is the only option that can say
  "three kills inside one second" or "a Purge that took six". **MEASURED (§1.7):
  it costs six closed `COMBO_OUT` strings in `test-cs012-p4.js` plus
  `test-cs014-p1.js:332`, which counts the shared kill-line text exactly FOUR
  times, and `:335`, which pins the fifth line.** Every kill-site edit is one of
  those. It also puts an allocation in the hot path against GDD §17's "no
  per-frame allocation".
- **C — predicates that read the board at the seat.** No new field at all: a
  predicate reads `state` directly. **It fails the boundary contract**
  (`CLAUDE.md`, Kit modules): `20-achievements.js` is `kit-achievements`' draft
  and may not name `state`. It would have to live in `22-meta.js` instead, which
  gives up the extraction the module exists for.

⛔ **Under A or C the module is the same shape**: it takes a `facts` object and
a definition table and returns a payload (A11). A only decides where the numbers
come from. ⛔ **Whichever it is, `20-achievements.js` takes explicit params and
callbacks and reaches into no game state, and owes `src/20-achievements.NOTES.md`
from its first commit** — MEASURED (§1.2, V4): a factory of exactly that shape
built and ran with the **suite green**.

### A3 — WHEN it evaluates

**MEASURED (§1.4): the clear edge already reads AND writes storage on a play
step.** A front-door Overdrive session's only storage traffic after the run
started was `levelRecord().noteCleared()` at ticks 1,897 and 3,833, both with
`state.screen === "play"`: one `getItem` and one `setItem` of **39 bytes** each.
⛔ So the rule that holds today is telemetry's — "no telemetry write from a play
step", because a full ring is **890,000 characters** (CS011's plan §1.6) — and
not "no storage write on a play step". A fully-unlocked achievements envelope is
**681 bytes** (MEASURED, computed over a 24-id table), seventeen times
`progress` and 1/1300th of the ring.

**MEASURED (§1.5): the build calls `Date.now()` exactly TWICE** across a boot
and a played run to game over — once in kit-profile's `created` at boot, once in
`scoreRow`'s `ts`. Under `test-cs014-p3.js`'s faked clock (7,919 ms per call)
that is 15.8 s of faked time. ⛔ **A weekKey read once per PLAY STEP would
advance that clock 9.2 days over one 100,008-step session** — enough to roll the
ISO week inside a soak, twice, and make a weekly unlock non-deterministic in a
suite built on determinism.

**MEASURED (§1.3), predicate calls at each cadence, over a 29-entry table:**

| Cadence | Classic, Start Depth 81 | Overdrive, Start Depth 9 |
|---|---|---|
| per play step | 1,740,000 | 1,028,224 |
| per clear edge | 2,639 (91 clears) | 899 (31 clears) |
| per run end | 29 (1 call) | 29 (1 call) |

- **A — the clear edge and `Meta.runEnded()`, and nothing else (recommended).**
  The clear edge is where a well-scoped fact becomes true and is already a
  storage seat; the run's end is where a run-scoped one does, and is already the
  gate's one reader. ⛔ **Ordering at the run's end matters**: `runEnded()` sets
  `run = null` BEFORE it does anything, so `eligible()` reads false afterwards —
  an evaluator seated there reads `ok`, the local variable, exactly as the
  submit does.
- **B — `Meta.runEnded()` alone.** One seat, one gate, the simplest thing. It
  cannot see a per-well fact that a later well undoes, and it never fires for a
  player who quits from the title without ending a run.
- **C — per step.** The only cadence that can time anything. 1.74 M predicate
  calls per session, a clock read that moves the week, and a write seat that
  `CLAUDE.md` forbids. Not recommended at any price.

### A4 — whether a BENCH run earns anything

**MEASURED, `22-meta.js:301`:** `eligible()` is
`return run !== null && !run.bench;`, and **that exact string is pinned by a
closed `mutate` in `test-cs011-p3.js:26`**, which requires it in the build
exactly once. The flag is set by `runAction()` for any of the **six**
`DEBUG_SPAWN_ACTIONS`, `spawnRow` or `cycleWell` in play — eight triggers; `t`
and `e` are not among them (MEASURED, `23-main.js:565`).

⚠ **The precedent cuts both ways.** A stopped run scores but gains no life
(`addScore()`, Paul 2026-09-13): the project already separates what a run's
score IS from what the run EARNS. A bench run is the same separation one step
further out — it scores, it just does not count.

- **A — extend the one gate (recommended).** `Meta.eligible()` gates the local
  top 10, both boards and now achievements: three things, one answer, and
  `CLAUDE.md`'s "extend both together or neither" becomes "extend all three".
  Cost: the `GATE` pin is untouched if the gate's body does not change, and it
  does not — only a third caller appears.
- **B — a second gate.** A bench run could unlock "clear a well" honestly, since
  the debug keys spawn enemies rather than clear wells. ⚠ It is also how a
  player unlocks everything in ten minutes with the `w` key. Cost: a second
  answer to "does this run count", and the first time they disagree nobody will
  remember why.
- **C — no gate: every run unlocks.** Cheapest, and it makes the id table a
  record of what the debug keys can reach rather than what the player did.

### A5 — per mode, shared, or mode-tagged

**MEASURED: the precedent points both ways.** `progress` went **v2 and per
mode** at CS012 P3 because a Classic clear must not extend Overdrive's Start
Depth list, and `scores` keeps `classic` and `overdrive` apart because they are
separate boards. But `settings` is shared, and so is the profile's `playerId`.
⛔ **`C.MODE_FLAGS` is not the mechanism here**: it has exactly four fields —
`jump`, `combo`, `tokens`, `rings` — and every one of them answers "what does a
RUN have". An achievement is not a run feature, so ⛔ **no field is added to
those rows and no top-level mode key is created.**

- **A — one shared store, rows MODE-TAGGED (recommended).** Each definition row
  carries `mode: "classic" | "overdrive" | null`, and a run only evaluates the
  rows its mode matches. "Clear 50 wells" counts both modes; "take all six
  rings" can only be true in Overdrive and says so in the row. Cost: one field
  per row, no store shape question, and ⛔ **the tag is a property of the
  ACHIEVEMENT rather than of the store**, which is what makes a future third
  mode a table edit.
- **B — per mode, like `progress`**: `{ classic: {…}, overdrive: {…} }`.
  Honest — a Classic player's 50 wells and an Overdrive player's are different
  achievements. It doubles the store, doubles the weekly rotation's bookkeeping,
  and makes "clear 200 wells lifetime" unreachable for a player who splits their
  time.
- **C — shared and untagged.** Simplest. It also means an Overdrive-only id sits
  permanently locked in a Classic player's list with no explanation, which is
  the surface problem A1 has to solve either way.

### A6 — the `achievements` key's declared shape and version

⛔ **It is not declared yet** (MEASURED, `22-meta.js:361–374`: the `Store` names
`settings` v1, `progress` v2 + `migrateProgress`, `telemetry` v1 and `scores`
v1). CS015 adds it there **and** to `Profiles.remove()`'s `OWN_KEYS`, today
`["settings", "progress", "telemetry"]` — ⛔ never `scores`, never `profiles`,
which are ROOT and which profile `p0`'s scope shares.

**MEASURED (§1.2, V2): declaring the key, adding it to `OWN_KEYS` and writing
it at the run's end reddens exactly ONE closed assertion** —
`test-cs011-p6.js:330`, whose `declared` regular expression lists the keys the
ninth soak expects to find in storage and which the repair extends by one name.
⛔ `OWN_KEYS` itself needs no repair: `test-cs011-p4.js:33` pins the LOOP
(`for (const key of OWN_KEYS) scope.remove(key);`), not the list.

- **A — v1, §15.5's four stores, arrays rather than Sets, no `migrate`
  (recommended).** `{ lifetimeUnlocked: [ids], lifetimeTiers: { id: index },
  weeklyUnlocked: [ids], weekKey: "YYYY-Www" }`. A Set does not survive
  `JSON.stringify`, which is what kit-storage does, so the store holds arrays
  and the module holds whatever it likes. ⛔ **A new key needs no `migrate`** —
  there is no origin version to read — and known-value-else-default loading is
  `CLAUDE.md`'s additive rule: an unknown id in `lifetimeUnlocked` is dropped on
  read, a tier index past the row's tier count clamps, and a `weekKey` that is
  not this week empties `weeklyUnlocked`.
- **B — v1 with the tiers folded into `lifetimeUnlocked`** as `id@2`. One store
  instead of two. It makes the monotonic rule a string parse, and GDD §15.5's
  shape is named as Orbital Overhaul's *proven* v2 shape — deviating buys
  nothing.
- **C — split into two declared keys**, one lifetime and one weekly, so a week
  roll writes 80 bytes rather than 681. Two keys for one feature, two rows in
  `OWN_KEYS`, and the write is not on a hot path.

⛔ **Whichever it is, the rule stands: a row-shape change later bumps THIS key's
version and supplies a `migrate` — pure, never calling back into the store,
returning `undefined` for an origin version it cannot read.** `migrateProgress`
is the worked example, twelve lines.

### A7 — the five weekly, and which five

GDD §15.5: "~24 lifetime plus 5 weekly, rotated deterministically by week number
so every player sees the same five", with ⛔ **`weekKey` an ISO year-week
computed in UTC** — local boundaries roll mid-session and differ across devices.

**MEASURED (§1.6): a 21-line ISO-year-week-in-UTC function agrees with six known
boundaries**, including the two that catch naive implementations: 2027-01-03 is
**2026-W53** and 2021-01-01 is **2020-W53**. Read at Sunday 23:30 UTC it gives
`2026-W38`; a local-time reading in any zone east of UTC would already say W39.

**MEASURED (§1.6): a stride walk is a function of the week and of nothing
else.** Over a pool of 29 and 104 weeks it produced **98 distinct sets**, touched
**all 29** entries, 15–20 appearances each, and returned the same five for
`2026-W38` on every call. ⛔ **It spends no RNG draw** — it is integer
arithmetic on the year and the week, so it cannot move `GOLDEN_LANES` or any
soak's hash, and a probe can assert `state.rng` was not called across a week
roll.

- **A — a weekly-only pool of 20, stride-walked (recommended).** §9's second
  table: session-scoped challenges a player can finish in one sitting ("clear
  five wells in one run", "take four rings in one dive"), which is what a
  *weekly* is for. Cost: 20 more ids that are also save data and also never
  renamed — the table grows from 24 to 44.
- **B — draw the five from the 24 lifetime ids.** No second table, no second set
  of ids to get right. It makes a weekly "do the thing you already did", and the
  four tiered lifetime rows make poor weeklies (a player at tier 3 of
  `wells_cleared` cannot re-earn it).
- **C — a pool of exactly 5, rotated not at all.** The same five every week. It
  satisfies the letter of the store shape and nothing else.

⛔ **The clock is an injected `now()`, never `Date.now()` inside the module** —
the boundary contract, and the reason §1.5's measurement matters: a module that
reads the platform clock cannot be driven by a test at all.

### A8 — ⛔ THE ID TABLE ITSELF, and it has no second chance

§9 is the proposal: **24 lifetime** (8 tiered, 16 untiered) and **20 weekly**,
each row with its id, its predicate in words, the mode it reads, the shipped
system it reads, and ⛔ **whether the suite's existing front-door drivers can
reach it**, MEASURED in §1.3.

**MEASURED headline: 22 of the 24 lifetime rows are reachable by the front-door
hunter**, and the two that are not are flagged in the table rather than quietly
kept:
- ⛔ **`purge_wide` is UNREACHABLE.** The biggest single Purge measured across
  three sessions and 289 Purge uses took **4** enemies (Classic Start Depth 81);
  Classic Start Depth 1 and Overdrive Start Depth 9 both peaked at **2**. A row
  asking for six is a test that passes on zero, which is exactly what GDD §17
  item 10 exists to stop. ⚠ Either the threshold comes down to what a board
  actually offers, or the row goes.
- ⚠ **`purge_saver` is BORDERLINE.** Clears with `purgeUses === 0` measured
  **0, 0 and 1** across three sessions — the hunter spends its charge on every
  well. It is reachable by a player and all but unreachable by the driver, so
  its test needs a staged board rather than a played one.
- ⚠ **`mimic_kill` rides on a probation this plan cannot close.** The Mimic is
  ⚠ on probation and CS017 may cut it in one schedule row (GDD §21 #6). ⛔ An id
  is never renamed and a cut one orphans: the row is here because the Mimic
  ships today, and the honest alternatives are to drop the row now or to accept
  that a cut leaves one id permanently unearnable for new players.

Everything else the table needs, the drivers reach (§1.3): every Classic kind
and every Overdrive kind killed, all five token kinds collected in one session,
195 ring takes with a **full six-ring set**, 40 jump-strike kills, the combo at
**×8 = `C.COMBO_MAX`**, 24 shots = `C.SPREAD_SHOT_MAX`, 2 tokens =
`C.MAX_TOKENS`, `C.LIVES_MAX` 6 held, level 171, all sixteen wells, 88
deathless wells and 92 Thorn chips.

⚠ **`C.LIVES_MAX` IS REACHABLE, and `STATUS.md` says it is not.** Its "Unowned,
none reachable by the suite's drivers" list carries "no played board reaches
`C.LIVES_MAX`". MEASURED: the hunter held **6** lives in five of seven probe
sessions, from `START_LIVES` 3 and up to **15** extra-life awards. ⛔ The
difference is length — the probes ran 40,000–60,000 steps where the closed soaks
run a few thousand — so the claim is true of the soaks as they stand and false of
the driver. §0.1 records it.

### A9 — what an unlock is WORTH

⛔ **`addScore()` is the ONE writer of `state.score` and the ONE life-awarder**
(GDD §7; `12-scoring.js`), and CS012 P4's rule is that the combo multiplies
exactly what builds it: kill points at the four kill sites, and nothing else.
CS013's Bounty and CS014's ring each went through `addScore()`, unmultiplied,
building nothing — and each is on GDD §7's table because each is a thing that
happens **inside a run**.

- **A — nothing (recommended).** An unlock pays no points and no life. GDD §7's
  table does not grow, `09-collision.js` is not edited, no kill site or line
  moves, and ⛔ **item 8's per-step price decoders in five closed files
  (`-cs012-p4`, `-p6`, `-cs013-p2`, `-p5`, `-cs014-p3`) need no new term** — each
  prices every step's score delta off the board, and a payout they cannot see
  turns all five red.
- **B — an unlock pays points.** It would make the screen matter to a scoring
  player. It costs all five decoders a term, and it makes the local top 10 and
  both online boards a function of how many achievements a player already had —
  ⛔ which is a score the Worker's bounds check was not written against.
- **C — an unlock pays a life.** Same cost as B plus GDD §4.4, and a panic
  button that hands out lives is the Purge's problem in a new place.

### A10 — whether an unlock has a SOUND

**MEASURED: `C.SFX` is 27 events and `C.SFX_KILL_PITCH` 11 voices**, and
`test-cs009-p4.js:39` pins the event list exhaustively, in order. A new event is
ONE line starting `    name:` in `00-config.js`'s SFX group, one line in the
`EVENTS` list, and ⛔ **a brief, an A label, 1–2 alternates and an in-context
sequence in `tools/sfx-lab.html`'s BLOCK SFX** — which `test-cs009-p4.js` pins
to the build by text identity, so it is a two-file edit and a lab edit.

- **A — one new event, `unlock`, candidate A (recommended).** No
  `SFX_KILL_PITCH` voice: a ring took neither (`test-cs014-p2.js:309`), and an
  unlock is not a kill. ⛔ Not a `C.MUSIC_DIP_EVENTS` row either. Cost: `C.SFX`
  27 → 28, one `EVENTS` repair, one lab brief.
- **B — no sound.** Zero cost, and an unlock the player never notices is A1's
  problem made worse.
- **C — reuse `extraLife`.** Free, and it tells the player they got a life.

### A11 — the payload-shaped object's SHAPE

GDD §21 #4 and §15.5 both say the evaluator emits **"a payload-shaped object
from day one so server-backing later is wiring, not a rewrite"**, and neither
says what shape. ⛔ **That is a design call the GDD names and does not answer.**

**MEASURED: the one payload this project already posts** is
`{ metric, durationS, outcome, stats: {…seven registered keys} }`
(`22-meta.js:156`), and ⛔ **an unregistered stats key flags every row it posts**
— coinless-kit's `services/leaderboard/src/registry.js` is the source, read at
`e2efed5`, and **this plan does not read it again and asks for no registry
change.**

- **A — `{ id, tier, weekKey, at }` per unlock, returned as an array
  (recommended).** `id` is the save-data id; `tier` is the index reached, `0`
  for an untiered row; `weekKey` names the week for a weekly and is `null` for a
  lifetime row; `at` is the injected `now()`'s value. Everything a server would
  need to accept the unlock, and nothing a server would have to invent.
- **B — `{ id, tier }` and nothing else.** Smallest. A server backing it later
  would have to date the unlock itself, which is exactly the "wiring, not a
  rewrite" the rule is trying to buy.
- **C — the whole `facts` object beside the unlock.** Everything a server could
  want. It ships the run's telemetry to a server this project has ⚠ SETTLED
  never to post to (GDD §15.6).

### A12 — where the DEFINITION TABLE lives, and two invariants collide

⛔ **`CLAUDE.md`, Config: "Every tunable lives in `C`, in `src/00-config.js`,
grouped by system. Never inline a magic number anywhere else. This outranks code
elegance and is the highest architectural priority in the project."**
⛔ **`CLAUDE.md`, Kit modules: "A kit module never reaches into game state. No
`state`, no `C`, no game object, no game global — in either direction."**

The definition table has tier thresholds in it, which are tunables. It also
belongs to a module that may not read `C`. ⛔ **Both rules are invariants and
they point in opposite directions here**, so the plan names it rather than
picking.

**MEASURED: `createScores` is the shipped precedent for exactly this.** The
numbers live in `C` — `C.SCORES_PER_MODE` 10 — and `Meta.boot()` hands them over
as options (`22-meta.js:378`): `createScores({ store, key, perMode, modes })`.
The module reads no `C` and the tunable is still in `C`. **MEASURED: the project
holds data tables in both places** — `C.SPAWN_SCHEDULE`, `C.SPAWN_SCHEDULE_OVERDRIVE`
and `C.TOKEN_WEIGHTS` are data in `C`; `ENEMY_KINDS` (`08-spawner.js`) and
`MUSIC_TRACKS` (`17-audio-tracks.js`) are data in their own modules.

- **A — `C.ACHIEVEMENTS` as data, handed over as an option (recommended).**
  `createAchievements({ defs: C.ACHIEVEMENTS, load, save, now })`. Both rules
  hold with no exception written anywhere: every threshold is in `C` where a
  tuning pass finds it, and the module reads no `C`. ⚠ It puts 44 rows of ids
  and prose into `00-config.js`, which is already 300 keys.
- **B — the table in `20-achievements.js`, thresholds in `C`.** The rows live
  with the code that reads them, like `MUSIC_TRACKS`; each row names a `C` key
  rather than a number, and the module takes a thresholds bag. Two places to
  look, and a row whose threshold key is missing fails at evaluation rather than
  at build.
- **C — the whole table in `20-achievements.js`, numbers included.** One file,
  readable, and ⛔ **a direct breach of the config invariant**, which this
  project treats as its highest architectural priority. Not recommended at any
  price, and named only so the call is complete.

### §0.1 — ⛔ THE §0 DEFECT, RECORDED RATHER THAN WORKED AROUND

⛔ `CLAUDE.md`: "If §0 has no row for what you are editing, that is a defect in
§0: record it in `STATUS.md` rather than working around it silently."

**MEASURED, GDD §0 and §10.5 at `b92da55`:** §0's §10.5 row enumerates the
screens by name and names no achievements screen; §10.5's own screen table has
no ACHIEVEMENTS row; and §15.5 — the section §0 *does* point at for
achievements — is entirely storage and evaluation and specs no surface at all.
So a CS015 phase that builds a screen has **no §0 row telling it what to read**.
⛔ **This session records that in `STATUS.md`, and does not invent the row.**

⚠ **A second `STATUS.md` correction goes with it:** `C.LIVES_MAX` is on the
"Unowned, none reachable by the suite's drivers" list and §1.3 MEASURED it
reached in five of seven probe sessions.

### Findings for Paul — not calls

- ⛔ **The vocabulary scan cannot see through an underscore.**
  `test-cs008-p6.js:432` tests `\bword\b`, case-insensitive, over the whole built
  file. **MEASURED, four mutants of V4's stand-in table**, each planting ONE of
  the ten banned words — ⛔ **written here as `<B>` because `CLAUDE.md`'s
  vocabulary rule covers this document too, not only the build**: an id of
  `<b>-walker`, a name of `<B> WALKER` and a name of `THE <B>` are each RED;
  ⛔ **an id of `<b>_walker` is GREEN**, because `_` is a word character so
  there is no boundary to match. ⛔ An id table
  written once, in snake_case, is exactly the artefact this blind spot would let
  through — so the ids in §9 are checked by eye and the phase that lands them
  says so. ⚠ Whether the scan should also test `[_\b]` is Paul's; it is not
  CS015's to change.
- ⚠ **`DECISIONS.md` still has no row for CS012's sixteen calls (O1–O16) or
  CS014's nine (RF1–RF9).** `STATUS.md` carries this and says a CLOSE phase may
  not write that file, "so it is Paul's or a planning session's". ⛔ **This
  session did not write it**: `CLAUDE.md`'s session table gives a planning
  session exactly two output documents, and widening that on my own reading is
  the failure this shape exists to prevent. It is named here so the gap is not
  found a fourth time.

### ⚠ Readings this plan takes and flags

Each follows from the GDD, a shipped rule or a measurement. ⛔ **If Paul objects
to one, the phase that builds it stops.**

- **R1 — `20-achievements.js` becomes the module.** `MANIFEST` already lists it
  (MEASURED, `build.js:69`) and `KIT_INLINE_AFTER` is that filename, pinned by
  `test-cs011-p1.js:41`. ⛔ **Nothing is added to `MANIFEST`** and the kit block
  still follows the module. ⚠ **MEASURED: the banner scan's slice for
  `20-achievements.js` is 55,197 bytes and HOLDS the three inlined kit bodies**,
  because the kit banner is a dash rule — so `test-cs002-p1.js`'s six forbidden
  tokens apply to achievements code, and ⛔ **`e.key` in this module turns that
  file red** (MEASURED, a V4 mutant).
- **R2 — no `state` field.** The evaluator's record lives in `22-meta.js`'s
  closure and in the store, like CS011's run record, because `startGame()`
  rewrites `state`. ⛔ `test-registry.js`'s `STATE_FIELDS` does not move, and
  `state` stays at **28** keys. Under A2-A a `tally` field is a counter inside
  the bag `STATE_FIELDS.CS007` already names — MEASURED free (§1.2, V3).
- **R3 — no telemetry column and no stats key.** `TELEMETRY_FIELDS` stays **29**
  and `telemetry` at **v1**; the leaderboard's seven registered keys do not move,
  so coinless-kit's registry is not read anew and ⛔ **no Worker change is
  asked for.**
- **R4 — no kit module is edited, bumped or backported.** kit-names 0.1.0,
  kit-storage 0.1.0, kit-profile 0.1.1, kit-leaderboard 0.2.1, kit-input 0.8.0,
  kit-audio 0.4.0, kit-menu 0.1.0 all stand (MEASURED, grep). ⛔ **A bump is a
  closed-file edit in up to four files** (CS014's parked note), and CS015 owes
  none.
- **R5 — no heat accessor, no `heat()` call, no spawn row, no kill site, no kill
  line, no new two-depth comparison, no `ENEMY_KINDS` row, no contract field.**
  Achievements read what a run already did; they do not change what it does.
  ⛔ `climbMult()` stays at **7** call sites and the heat accessors at **7**.
- **R6 — the ring flight, the tokens, the Jump and the combo are SHIPPED and are
  not re-opened.** CS015 reads them and changes none of them. ⛔ `C.MODE_FLAGS`
  keeps its four fields and gains none.
- **R7 — Classic and Overdrive both unlock.** Under A5-A a Classic run evaluates
  the rows tagged `classic` or `null` and an Overdrive run the rows tagged
  `overdrive` or `null`. ⛔ **Nothing new is gated by `modeHas()`**, because
  achievements are not a run feature.
- **R8 — the evaluator spends NO RNG draw and calls no `heat()`.** The rotation
  is arithmetic on the week (§1.6); the predicates read counters. ⛔ A probe
  asserts `state.rng` is not called across an evaluation and a week roll.
- **R9 — a screen, if A1 says so, follows SCORES' shape**: rows rebuilt on entry
  and on a row action, ⛔ **never in `draw()`**; every string through
  `drawText()`; the window is `MENU_VISIBLE_ROWS` 7; BACK last.
- **R10 — `src/20-achievements.NOTES.md` lands in the module's FIRST commit**,
  as `src/22-meta.NOTES.md` did — it doubles as `kit-achievements`' draft
  documentation, so pushing it later is a copy rather than a write.

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the baseline, at `b92da55`

| | |
|---|---|
| `node build.js` | 25 modules + 3 inlined kit, **781,198 bytes** |
| `node scratchpad/run-all.js` | **74 files, zero skips, exit 0, 191.5 s** |
| `CLAUDE.md` / `STATUS.md` | **47,919 bytes** / **342 lines** |
| `state` keys / `tally` fields | **28** / **8** |
| `C` keys / `_harness.js` `EXPORTS` | **300** / **210** |
| `COUNTS` | wells 16, openWells 6, tracks 3, enemies 9, enemyKinds 13 |
| `C.MODE_FLAGS` | `{ jump, combo, tokens, rings }`, two modes |
| Spawn tables | `C.SPAWN_SCHEDULE` **7**, `C.SPAWN_SCHEDULE_OVERDRIVE` **3** |
| `C.SFX` / `C.SFX_KILL_PITCH` | **27** events / **11** voices |
| Kill sites / lines | **4** / **5** (`09-collision.js:159, 284, 495, 508, 560`) |
| `climbMult()` call sites / heat accessors | **7** / **7** |
| Declared keys | `settings` v1, `progress` v2 + `migrate`, `telemetry` v1, `scores` v1; ⛔ `achievements` NOT DECLARED |
| `OWN_KEYS` | `["settings", "progress", "telemetry"]` |
| Kit versions | names 0.1.0, storage 0.1.0, profile 0.1.1, leaderboard 0.2.1; input 0.8.0, audio 0.4.0, menu 0.1.0 |
| Menus | title **4** rows, OPTIONS **10** with `MENU_VISIBLE_ROWS` **7**, game over **3** lines |

### 1.2 MEASURED — four stand-in variants, the whole suite in each

Each is a `git clone --shared` of `b92da55` with one edit. ⚠ In a clone
`../coinless-kit` is absent, so `test-cs011-p5.js` and `test-cs012-p3.js` SKIP
there; that is the clone's location, not the edit.

| Variant | The edit | Result |
|---|---|---|
| **V1** | an `AWARDS` row on the TITLE after PROFILE, **and** one on OPTIONS before BACK | **2 files RED**: `test-cs011-p3.js:384` (the four-label title list) and `test-cs011-p5.js:375` (the queued line, same four labels). ⛔ **The OPTIONS row reddened NOTHING** |
| **V2** | `achievements` declared in `Store`, added to `OWN_KEYS`, and written at the run's end | **1 file RED**: `test-cs011-p6.js:330`, the ninth soak's "every stored key is declared" list |
| **V3** | a ninth `tally` field, `ringsTaken`, bumped at the ring-take line | ⛔ **GREEN, 74/74.** No hash, no baseline, no registry count moved |
| **V4** | a real boundary-shaped `20-achievements.js`: `createAchievements(options)` with `defs` / `load` / `save` / `now`, an ISO-week key and a monotonic tier walk, reading no `C`, no `state`, no game global | ⛔ **GREEN, 74/74** |

**Three mutants of V4, each restored:**

| Mutant | Red |
|---|---|
| `probe.key` on an identifier ending in `e`, inside the module | `test-cs002-p1.js` — *"20-achievements.js must not contain `e.key`"* |
| an id of `<b>-walker`, a name of `<B> WALKER`, a name of `THE <B>` — ⛔ `<B>` stands for one of the ten banned words, which this document may not write either | `test-cs008-p6.js` in all three cases |
| an id of `<b>_walker` | ⛔ **GREEN — the scan does not see it** |

### 1.3 MEASURED — what the front door reaches, per mode

A copy of `test-cs014-p3.js`'s four-clause hunter, driven through
`Game.frame()`, `startGame()` at the named Start Depth, `START_LIVES` 3, no
artificial lives.

| | Classic, SD 1 | Classic, SD 9 | Classic, SD 81 | OD, SD 1 | OD, SD 9 | OD, SD 17 | OD, SD 81 |
|---|---|---|---|---|---|---|---|
| steps | 60,000 | 60,000 | 60,000 | 8,157 | 35,456 | 9,922 | 6,169 |
| max level | 68 | 80 | **171** | 6 | 39 | 24 | 86 |
| wells cleared | 67 | 71 | **91** | 6 | 31 | 8 | 6 |
| deathless wells | 67 | 71 | 88 | 6 | 25 | 5 | 4 |
| Purge-unspent clears | **0** | **0** | **0** | **0** | **0** | 1 | 1 |
| kills | 1,178 | 1,280 | **1,658** | 104 | 462 | 136 | 92 |
| deaths / Thorn deaths | 5 / 5 | 2 / 2 | 12 / 9 | 5 / 5 | 14 / 6 | 8 / 5 | 7 / 5 |
| dives completed | 67 | 71 | 90 | 5 | 30 | 7 | 5 |
| ring takes / best in one dive | — | — | — | 54 / **6** | 195 / **6** | 66 / **6** | 50 / **6** |
| tokens collected / kinds | — | — | — | 7 / 2 | 14 / **5** | 10 / 4 | 4 / 4 |
| jump-strike kills / takeoffs | — | — | — | 0 / 0 | **40** / 39 | 4 / 4 | 5 / 4 |
| combo peak | — | — | — | **8** | **8** | **8** | 6.5 |
| max shots / max tokens | 8 / — | 8 / — | 8 / — | **24** / **2** | **24** / **2** | **24** / **2** | 8 / 1 |
| lives held / extra lives | **6** / 7 | **6** / 5 | **6** / 15 | 5 / 2 | **6** / 11 | 5 / 5 | **6** / 4 |
| wells seen | **16** | **16** | **16** | 6 | **16** | 8 | 6 |
| score | 480,460 | 600,055 | **2,393,335** | 94,130 | 595,905 | 203,410 | 1,011,035 |

**Kills by class, Overdrive Start Depth 9** (the session that reaches everything):
Vaulter 107, Carrier 79, Drifter 78, Warden **80**, Surger 64, Reaver 35, Weaver 22,
Mimic **19**, MimicShot 17, Thorn 13, WeaverBolt 2. ⛔ **Every kind on the roster
dies**, the two projectiles included.

**A second pass counted what the first could not** (40,000 steps each):

| | Classic SD 1 | Classic SD 81 | OD SD 9 |
|---|---|---|---|
| shot kills / rim-sweep kills | 684 / **0** | 997 / **0** | 371 / **6** |
| Purge uses / biggest single Purge | 108 / **2** | 97 / **4** | 84 / **2** |
| Thorn chips | 70 | 92 | 36 |
| open / closed wells cleared | 15 / 27 | 16 / 44 | 11 / 20 |

⛔ **The two findings that change §9:** a Purge that takes six is **unreachable**
(best of 289 uses: four), and a rim-sweep kill happens **0, 0 and 6** times —
reachable, but only in one of three sessions and only six times in 40,000 steps.

### 1.4 MEASURED — what a play step costs in storage today

The harness's `localStorage` was wrapped and every call recorded with the screen
and the tick. A front-door Overdrive run from the title, held fire, to 100,008
ticks:

```
get  …progress   screen=mode  tick=4
get  …progress   screen=play  tick=1897    <- the clear edge
set  …progress   screen=play  tick=1897    39 bytes
get  …progress   screen=play  tick=3833    <- the clear edge
set  …progress   screen=play  tick=3833    39 bytes
```

⛔ **Two reads and two writes, both on PLAY steps, both `levelRecord().noteCleared()`
at the clear edge** (`23-main.js:1628`). Nothing else touched storage during the
run. ⛔ So the shipped rule is telemetry's — **no TELEMETRY write from a play
step**, because a full ring is 890,000 characters — and not a blanket ban.
A fully-unlocked achievements envelope is **681 bytes** (computed over a 24-id
table with 12 tiered): 17× `progress`, 1/1300th of the ring.

### 1.5 MEASURED — the clock, and why a per-step read is a hazard

With `test-cs014-p3.js`'s faked `Date.now` installed (7,919 ms per call), across
a boot and a played run to game over:

| | |
|---|---|
| `Date.now()` calls at boot | **1** (kit-profile's `created`) |
| `Date.now()` calls, boot + whole run | **2** (the second is `scoreRow`'s `ts`) |
| faked time elapsed | **15.8 s** |
| play steps in that run | 100,008 |
| faked days if read once per play step | ⛔ **9.2** |
| faked days if read once per run | 0.0001 |

⛔ **A weekKey read per step rolls the ISO week inside a single soak, twice.**

### 1.6 MEASURED — ISO year-week in UTC, and a rotation

A 21-line function against six known boundaries: **6/6**, including 2027-01-03 →
`2026-W53`, 2021-01-01 → `2020-W53`, 2020-01-01 → `2020-W01`. Read at Sunday
2026-09-20 **23:30 UTC** it gives `2026-W38`; any local reading east of UTC gives
W39, which is the bug the UTC rule exists to prevent.

A stride walk over a pool of 29, 104 weeks: **98 distinct sets**, all **29**
entries touched, **15–20** appearances each, and `2026-W38` returned `0,7,9,18,27`
on every call. ⛔ **Integer arithmetic on the year and the week — no draw, no
state, no clock beyond the key.**

### 1.7 MEASURED — the grep disciplines, run before §11 was written

- **`mutate:` across `scratchpad/`** — **22 occurrences in 20 call sites.** The
  ones that pin text in a file CS015 may touch: `test-cs011-p3.js:26`'s `GATE`
  (`return run !== null && !run.bench;`), `:25`'s `SEAT`
  (`if (state.screen === "gameover" && Meta.runOpen()) Meta.runEnded("died");`),
  `test-cs011-p2.js:298`'s `hooks.resetSettings();` and `:341`'s telemetry-toggle
  line, `test-cs011-p4.js:32–41`'s `ARM` / `REMOVE_KEYS` / `KIT_FIRST` /
  `KEYS_FIRST`, and `test-cs011-p5.js:31`'s `TOKEN`. ⛔ **`REMOVE_KEYS` pins the
  LOOP, not the list**, so `OWN_KEYS` gaining a name needs no repair.
- **The store's field-list and version pins** — `test-cs011-p2.js:119` pins
  `settings` v1's whole shape, `:130` `progress` v2's, `:352–353` the telemetry
  rows' length; `test-cs011-p6.js:326` lists the declared key names as a regular
  expression. ⛔ **No closed file pins the `Store` literal itself.**
- **`in <OBJECT>`** — **17** negative `!("X" in …)` assertions across the suite,
  and ⛔ **none names a CS015 key**. CS015 deletes no config object, so the grep
  is clear.
- **The kit `VERSION` literals** — **20** mentions across the suite. ⛔ CS015
  bumps none (R4).
- **The kill-line pins** — `test-cs012-p4.js:701`'s `COMBO_OUT` is **six**
  strings, four of them whole kill lines; `test-cs014-p1.js:332` asserts the
  shared kill-line text appears **exactly four** times and `:335` pins the fifth.
  ⛔ This is what prices A2-B.
- **Menu navigation by index** — `test-cs011-p2.js:54–55`, `-p3.js:106`,
  `-p4.js:621`, `-p5.js:106–107`, `test-cs012-p3.js:160–161` all reach OPTIONS,
  SCORES or PROFILE by counting rotate steps from the title's first row. ⛔ **A
  row appended after PROFILE moves none of them** (MEASURED, V1: the only two
  reds are label-list assertions, not navigation).

### 1.8 MEASURED — the HUD, for A1's toast

`hudLayout()` returns six rectangles: `score` (top-left), `level` (top-right),
`lives` (bottom-left), `purge` (bottom-right), `jump` (beside purge, Overdrive),
`combo` (centre-top, Overdrive: `HUD_COMBO_Y` 6, `HUD_COMBO_SIZE` 56,
`HUD_COMBO_CHARS` wide). `WORLD_W` 1280 × `WORLD_H` 720, `HUD_MARGIN` 24.
⛔ **The jump glyph and the combo readout are both placed ABSOLUTELY, off no
other rectangle**, so the four CS008 corners are bit-identical with or without
them — asserted in `test-cs012-p4.js` and `-p5.js`. A seventh rectangle must do
the same, and the band it would want is the one the combo readout holds.

### 1.9 MEASURED — the shipped precedent for A12

`22-meta.js:378`: `createScores({ store, key, perMode: C.SCORES_PER_MODE,
modes: ["classic", "overdrive"] })`. ⛔ The tunable is in `C`; the module reads
no `C`; `Meta.boot()` is the seam. `createScores` also validates every option and
throws with a named message — the shape a draft kit module ships in.
Data tables live in both places today: `C.SPAWN_SCHEDULE`, `C.SPAWN_SCHEDULE_OVERDRIVE`
and `C.TOKEN_WEIGHTS` in `C`; `ENEMY_KINDS` and `MUSIC_TRACKS` in their modules.

### 1.10 MEASURED — the closed pins read for §11

`test-cs011-p3.js:384`, `test-cs011-p5.js:375`, `test-cs011-p6.js:326–330`,
`test-cs011-p4.js:33`, `test-cs011-p2.js:119`, `test-cs009-p4.js:39–42`,
`test-cs002-p1.js:405–432`, `test-cs008-p4.js:40–43`, `test-cs008-p6.js:426–434`,
`test-cs011-p1.js:41`, `:114`, `test-cs014-p1.js:332`, `test-cs012-p4.js:701`.

---

## 2. THE SHAPE

**Four phases, one session each.** ROADMAP's guideline is 3–5; CS009, CS011 and
CS012 each held six, CS013 five and CS014 three.

| Phase | Builds | Depends on |
|---|---|---|
| **P1** | The module and the store: `20-achievements.js` + its `.NOTES.md`, `C.ACHIEVEMENTS`, the `achievements` key declared and in `OWN_KEYS`, the load/save path in `22-meta.js`, the ISO week key and the rotation. ⛔ **No evaluation seat and no surface** | A2, A5, A6, A7, A11, A12; R1, R2, R10 |
| **P2** | The facts and the seats: the new `tally` fields, `facts` built at the clear edge and at `Meta.runEnded()`, the gate, the payload | A2, A3, A4, A9 |
| **P3** | The id table landed whole, and the surface A1 names (with `unlock` if A10 says so) | A1, A8, A10 |
| **P4** | The thirteenth soak, the review, the close | all |

**Why four, and why these seams.**
- **P1 is everything that can be proved without a run.** The store, the week key
  and the rotation are pure functions and a declared key; all three are testable
  off `buildGame()` with no board at all, and MEASURED (§1.2, V2 and V4) they
  cost exactly two closed repairs between them. Landing them first means P2's
  seats have somewhere to write on their first commit.
- **P2 is the one phase that touches the simulation**, and it touches it in the
  one way MEASURED free: `tally` fields (V3, green) written where their events
  already happen. ⛔ It adds no kill line, no draw and no RNG call, so the
  determinism hash and all twelve soaks are expected unmoved — which is the claim
  P2's own test makes before P3 puts anything on screen.
- **P3 is the irreversible phase and it is alone in its session.** ⛔ The id
  table is save data; putting it in the same session as the store or the seats
  would mean writing it under time pressure from something else. It lands whole,
  with its reachability assertions, and it is the phase that owes every id an
  eye-check against the vocabulary scan's underscore blind spot (§0's findings).
- **P4 is the thirteenth soak**, a NEW file (⛔ never a widened closed one), plus
  the review and the close.

**What a different split would cost.**
- **Three phases** (store+facts / table+surface / close) puts the store's two
  closed repairs in the same session as the seats, and P2's "no baseline moved"
  claim would then have to be made about a commit that also changed `Store` —
  two causes for one hash.
- **Five phases** (splitting P3's table from its surface) is defensible and was
  considered. It is rejected because the surface is what proves the table is
  complete: a screen that cannot render a row is how a missing field is found,
  and finding it one session later means editing save data.
- ⚠ **If A1 answers C (both a screen and a toast), P3 becomes two phases** and
  the changeset is five. The prompt for P3 says so.

---

## 3. P1 — the module, the store, the week

⛔ **Builds:** `20-achievements.js` as `createAchievements(options)` —
`{ defs, load, save, now }`, reading no `C`, no `state`, no game global;
`src/20-achievements.NOTES.md` beside it; `C.ACHIEVEMENTS` (A12) as data;
`achievements` declared in `22-meta.js`'s one `Store` **and** added to
`Profiles.remove()`'s `OWN_KEYS`; the load-on-boot / save-on-unlock path through
`Profiles.scope()`; the ISO year-week key and A7's rotation.

⛔ **Does not build:** an evaluation seat, a `tally` field, the id table's
contents (the defs table lands with placeholder rows P3 replaces — ⚠ **and P3
replaces them BEFORE anything is stored under them**), any screen, any sound.

**Closed-file edits predicted:** `test-cs011-p6.js:326` (§11).

**What its test asserts:** the key is declared and an undeclared sibling still
throws; `OWN_KEYS` removes it on a profile delete and never a root key; the
store round-trips through a reload; a stored value of the wrong shape loads the
defaults per field; the week key matches §1.6's six boundaries and is UTC; the
rotation is pure, is a function of the week alone and spends no draw; tiers only
rise; the module names no `state`, no `C` and no game global (a text scan of its
slice, ⛔ which holds the inlined kit bodies — §1.2 R1).

---

## 4. P2 — the facts, the seats and the gate

⛔ **Builds:** the new `tally` fields A8's table needs; the `facts` object built
at the clear edge and at `Meta.runEnded()`; the gate (A4); the payload (A11).

⛔ **Does not build:** the id table's contents, any surface, any sound, any kill
line, any draw call.

**Its headline claim, and it is the same one CS013 P1 and CS014 P1 made:**
⛔ **no baseline moves.** `P1_DETERMINISM_HASH` **1229033515**, `GOLDEN_LANES`,
and all twelve soaks' paired hashes are unmoved, because a `tally` field is
write-only and nothing branches on one (MEASURED, V3).

**What its test asserts:** each new counter counts the event it is named for,
at the one place that event happens; the seats fire once each; ⛔ **a bench run
reaches neither seat's write** (A4); ⛔ **no storage write happens on a play step
that is not the clear edge** (§1.4's shape, asserted with a `Store.set` spy that
records the screen); the payload's shape; and a mutation per seat.

---

## 5. P3 — the table, and the surface

⛔ **Builds:** §9's table, whole, into `C.ACHIEVEMENTS`; the surface A1 names;
`unlock` if A10 says so.

⛔ **This is the irreversible phase.** Its prompt says so, twice.

**Closed-file edits predicted:** `test-cs011-p3.js:384` and
`test-cs011-p5.js:375` if A1 puts a row on the title; `test-cs009-p4.js:39` if
A10 adds the event (§11).

**What its test asserts:** GDD §17 item 10, exactly — ⛔ **every predicate
reachable, none throws on empty state, tiers monotonic**; every id unique and
stable; ⛔ **every id and every displayed name checked against
`test-cs008-p6.js`'s ten banned words BY EYE, because the scan does not see
through an underscore** (§0's findings); the rows' mode tags; the screen's rows
rebuilt on entry and never in `draw()`.

---

## 6. P4 — the thirteenth soak, the review, the close

⛔ **A THIRTEENTH FILE, never a widened closed one.** The twelve are
`-cs003-p5` … `-cs007-p5`, then the front-door pairs `-cs008-p8`, `-cs009-p6`,
`-cs010-p5`, `-cs011-p6`, `-cs012-p6`, `-cs013-p5`, `-cs014-p3`.

**What it proves:** a front-door session in each mode over a working store and a
reload, with every unlock the session earned still there; ⛔ **the same session
with the evaluator's seats stubbed out hashes identically, step by step** — the
CS014 form; a week roll (the injected clock moved forward eight days) empties
`weeklyUnlocked` and keeps `lifetimeUnlocked` and `lifetimeTiers`; ⛔ **no
enumeration read** across the whole session (`_env.storageReads` 0); and zero
skips.

⛔ **Its driver is `STATUS.md`'s four-clause L11+ driver**, unchanged: jump at
anything `aloft`; never target a `MimicShot`; go to a hovering token; steer to a
ring in reach. ⛔ **A repair is the driver or the fixture, never the build, a
lowered level or a relaxed assertion.**

**The close:** compresses `log/CS015.md`, resets `STATUS.md`, updates
`ROADMAP.md` and `SKIPPED-PLAYTESTS.md`, and ⛔ **indexes CS015's twelve calls in
`DECISIONS.md`, one line each** (the rule `b92da55` added).

---

## 7. ⛔ THE TWO TABLES, KEPT APART

GDD §14.1's lesson, applied here: ⛔ **`C.ACHIEVEMENTS` (which achievements
exist, what each reads, its tiers) and the weekly POOL (which of them rotate)
are two tables, and neither names the other's numbers.** A weekly row names its
own id; the rotation names the pool's length and the week; ⛔ **nothing computes
a pool index from a lifetime row's tier.**

---

## 8. ⛔ THE BOUNDARY CONTRACT, FROM THE FIRST COMMIT

```js
// right — the shape V4 MEASURED green
const ach = createAchievements({
  defs: C.ACHIEVEMENTS,          // data, handed over (A12)
  load: () => Profiles.scope().get("achievements", null),
  save: v => Profiles.scope().set("achievements", v),
  now:  () => Date.now(),        // injected (A7): the module never reads a clock
});
// wrong — the module now knows what a Skimmer is
const ach = createAchievements({ game: state });
```

⛔ **`20-achievements.js` names no `state`, no `C` and no game global**, and
⛔ **`22-meta.js` stays the only file that calls storage.**

---

## 9. ⛔ THE PROPOSED ID TABLE (A8) — 24 LIFETIME

⛔ **Reachability is MEASURED against §1.3's front-door sessions.** "✅" means a
probe session reached it; "⚠" means borderline, with the number; "❌" means
MEASURED unreachable.

| # | `id` | Predicate, in words | Mode | Reads | Reach |
|---|---|---|---|---|---|
| 1 | `wells_cleared` | wells cleared, lifetime. Tiers ⚠ 10 / 50 / 200 | both | `tally.wellsCleared` | ✅ 91 in one session |
| 2 | `kills_total` | enemies destroyed, lifetime. Tiers ⚠ 100 / 1000 / 5000 | both | `tally.kills` | ✅ 1,658 |
| 3 | `depth_reached` | highest level reached. Tiers ⚠ 10 / 25 / 65 | both | `state.level` | ✅ 171 |
| 4 | `score_run` | best single-run score. Tiers ⚠ 50k / 250k / 1M | both | `state.score` | ✅ 2,393,335 |
| 5 | `thorn_chips` | Thorn segments chipped, lifetime. Tiers ⚠ 50 / 250 / 1000 | both | **new `tally` field** | ✅ 92 per session |
| 6 | `deathless_wells` | wells cleared without dying, lifetime. Tiers ⚠ 10 / 50 / 200 | both | **new `tally` field** (`!diedThisWell` at the clear edge) | ✅ 88 |
| 7 | `dives_done` | dives completed, lifetime. Tiers ⚠ 10 / 50 / 200 | both | `tally.divesCompleted` | ✅ 90 |
| 8 | `rings_taken` | rings taken, lifetime. Tiers ⚠ 25 / 200 / 1000 | overdrive | **new `tally` field** | ✅ 195 in one session |
| 9 | `first_well` | clear your first well | both | `tally.wellsCleared` | ✅ |
| 10 | `open_well` | clear an open well | both | `WELLS[i].closed` at the clear edge | ✅ 16 |
| 11 | `all_wells` | see all sixteen wells in one run | both | **new `tally` field** (distinct `wellIndex`) | ✅ 16 |
| 12 | `start_deep` | start a run at Start Depth 81 | both | `state.startDepth` | ✅ `START_DEPTH_CAP` |
| 13 | `dim_band` | reach level 65 | both | `state.level` | ✅ 171 |
| 14 | `extra_life` | earn an extra life | both | **new `tally` field** | ✅ 15 |
| 15 | `lives_full` | hold `C.LIVES_MAX` lives | both | `state.lives` | ✅ 6 — ⚠ and `STATUS.md` says this is unreachable (§0.1) |
| 16 | `carrier_split` | destroy a Carrier and both its children in one well | both | **new `tally` field** | ⚠ PREDICTED reachable; not counted |
| 17 | `rim_sweep` | kill an enemy with the rim sweep | both | **new `tally` field** | ⚠ **0, 0, 6** across three sessions |
| 18 | `purge_saver` | clear a well with the Purge unspent. Tiers ⚠ 5 / 25 / 100 | both | `purgeUses === 0` at the clear edge | ⚠ **0, 0, 1** — a player reaches it, the driver does not |
| 19 | `purge_wide` | one Purge that destroys six enemies | both | **new `tally` field** | ❌ **MEASURED UNREACHABLE: best of 289 uses is 4** |
| 20 | `combo_max` | reach the ×8 multiplier | overdrive | `combo.peak` | ✅ 8 = `COMBO_MAX` |
| 21 | `token_set` | collect all five token kinds, lifetime | overdrive | **new `tally` field** | ✅ all five in ONE session |
| 22 | `ring_full` | take all six rings in one dive | overdrive | **new `tally` field** | ✅ a full set |
| 23 | `jump_kill` | kill a Warden with a jump strike | overdrive | **new `tally` field** | ✅ 40 |
| 24 | `mimic_kill` | destroy a Mimic | overdrive | **new `tally` field** | ✅ 19 — ⚠ **rides on the probation (GDD §21 #6)** |

**Eight tiered rows, 24 ids, ⚠ every threshold provisional.** The tiered rows
are 1–8; 9–24 are untiered. ⛔ **Ten of the rows need a new `tally` field** (5,
6, 8, 11, 14, 16, 17, 19, 21, 22, 23, 24 — twelve if `purge_wide` and
`mimic_kill` survive §0's answers), which is why A2-A's measurement matters more
than any other in this plan.

### The weekly pool (A7-A) — 20 session-scoped rows

⚠ **Sketched, not settled: §0 A7 and A8 own it together.** Each is scoped to ONE
run, so a week's five are all finishable in a sitting: clear five wells in one
run; clear a well without firing more than N shots; reach level 20 from Start
Depth 1; clear three wells in a row without dying; take four rings in one dive;
collect three tokens in one well; reach ×4 in one run; destroy a Carrier and both
children in one well; clear an open well without dying; end a run with the Purge
unspent; kill a Warden without dying that well; take every ring in two dives in
one run; clear a well with one life left; score 50,000 in one run; destroy 40
enemies in one run; finish a dive with no ring missed; chip a Thorn to nothing in
one pass; clear the starting well of a Start Depth 33+ run; survive a well with
no Purge and no death; and end a run without a Thorn death. ⛔ **Every one of
these is save data too**, and each owes the same reachability measurement §1.3
gave the twenty-four.

---

## 10. ⛔ THE BASELINE LEDGER

| Baseline | At `b92da55` (MEASURED) | CS015 (PREDICTED) |
|---|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` | **1229033515** | ⛔ **Unmoved P1–P4.** V3 and V4 both left it green (MEASURED). A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | the `9ebd27b` sixteen + `2, 5` | ⛔ **Unmoved** — CS015 spends no draw (R8); green in V1–V4 |
| The twelve closed soaks' paired hashes | green | ⛔ **Unmoved** — green in V1–V4 |
| `COUNTS` enemies / enemyKinds | 9 / 13 | unmoved (R5) |
| `COUNTS` wells / openWells / tracks | 16 / 6 / 3 | unmoved |
| `STATE_FIELDS` and `state`'s keys | through CS013; **28** | ⛔ **unmoved** (R2) — a `tally` field is inside `STATE_FIELDS.CS007`'s one entry |
| `tally` fields | **8** | **up to 20**, P2 — the exact count is A8's |
| `C.MODE_FLAGS` | `{ jump, combo, tokens, rings }` | unmoved (R6) |
| `C.SPAWN_SCHEDULE` / `_OVERDRIVE` | 7 / 3 | unmoved (R5) |
| `C.SFX` / `C.SFX_KILL_PITCH` | 27 / 11 | **28** / 11 at P3 if A10 says so; else unmoved |
| Enemy contract fields | 9 | unmoved (R5) |
| Kill sites / kill lines | **4 / 5** | ⛔ **unmoved** (R5, A9) |
| `climbMult()` sites / heat accessors | 7 / 7 | unmoved (R5) |
| `TELEMETRY_FIELDS` / `telemetry` | 29 / v1 | ⛔ unmoved (R3) |
| `settings` / `progress` / `scores` | v1 / v2 / v1 | unmoved |
| `achievements` | ⛔ **not declared** | **declared, v1**, P1 (A6) |
| `OWN_KEYS` | 3 names | **4**, P1 |
| kit-names / storage / profile / leaderboard | 0.1.0 / 0.1.0 / 0.1.1 / 0.2.1 | unmoved (R4) |
| kit-input / kit-audio / kit-menu | 0.8.0 / 0.4.0 / 0.1.0 | unmoved (R4) |
| `MANIFEST` | 25 + 3 | unmoved (R1) |
| `_harness.js` `EXPORTS` | **210** | **+2 or +3**, P1 (§11) |
| Title rows / OPTIONS rows | 4 / 10 | **5 / 11** at P3 if A1 says so |
| The suite | **74 files, 0 skips, 191.5 s** | **78 files**, 0 skips at the close |
| `dist` bytes | **781,198** | ⛔ larger; no ceiling exists |
| `CLAUDE.md` | **47,919 bytes** | ⛔ **< 50 KB at every phase** (K1) |
| `STATUS.md` | **342 lines** | ⛔ under ~400 at every phase's end |

---

## 11. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

Every edit rewrites an assertion or restores a fixture's PRECONDITION in place
(⛔ `CLAUDE.md`, Test rules). None deletes or weakens one. "MEASURED" means the
file went red under §1.2's stand-in; the real repair is still PREDICTED.

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs011-p6.js:326` | the `declared` regular expression gains `achievements`; `:330`'s message is unchanged | **MEASURED** (V2) |
| P1 | `_harness.js` `EXPORTS` | ⛔ **+`createAchievements`, +`Achievements`** (and +`achievementWeekKey` if the week key is a second top-level function) — ⚠ **CS014 added ten `EXPORTS` rows across two phases and predicted neither**; this is that line | PREDICTED (read) |
| P1 | `test-cs011-p4.js:33` `REMOVE_KEYS` | **none**: it pins the loop, not `OWN_KEYS`' contents | **MEASURED** (V2: green) |
| P1 | `test-cs011-p2.js:119`, `:130` | **none**: they pin `settings` v1's and `progress` v2's shapes, neither of which moves | **MEASURED** (V2: green) |
| P2 | `test-registry.js` | **none**: `STATE_FIELDS.CS007` is the single entry `["tally"]` | **MEASURED** (V3: green) |
| P2 | `test-cs012-p4.js:701` `COMBO_OUT`, `test-cs014-p1.js:332`, `:335` | **none** under A2-A and A9 — no kill line is edited. ⛔ **Under A2-B all six strings and both counts move** | **MEASURED** (V3: green) + PREDICTED |
| P2 | `test-cs011-p3.js:26` `GATE` | **none** under A4-A: the gate gains a caller, not a body | PREDICTED (read) |
| P2 | the five item-8 price decoders (`-cs012-p4`, `-p6`, `-cs013-p2`, `-p5`, `-cs014-p3`) | **none** under A9-A: an unlock pays nothing. ⛔ **Under A9-B or A9-C all five owe a term and a non-vacuity line** | PREDICTED (read) |
| P3 | `test-cs011-p3.js:384` | the title's label list gains the new row, in place | **MEASURED** (V1) |
| P3 | `test-cs011-p5.js:375` | the queued-line assertion's second array, the same list | **MEASURED** (V1) |
| P3 | OPTIONS' rows | **none** — a row before BACK moved nothing | **MEASURED** (V1) |
| P3 | `test-cs009-p4.js:39–42` | `EVENTS` + `unlock` (it drives `:119`, `:120`, `:140`, `:152`); `VOICES` unchanged | PREDICTED (read), only if A10 says so |
| P3 | `test-cs014-p2.js:309`'s form | **none**: `unlock` is not a `SFX_KILL_PITCH` voice, as `ringTake` is not | PREDICTED (read) |
| — | `test-cs002-p1.js:405–432` | **none**, and ⛔ **it is a trap rather than an edit**: `20-achievements.js`'s slice is 55,197 bytes and holds the inlined kit bodies, and `e.key` inside it is RED | **MEASURED** (a V4 mutant) |
| — | `test-cs008-p4.js:40–43`, `test-cs008-p6.js:426–434` | **none**: no `fillRect`, one `fillText` site, no banned word. ⛔ **The underscore blind spot is a finding, not an edit** | **MEASURED** (four V4 mutants) |
| — | `test-cs011-p1.js:41`, `:114` | **none**: `KIT_INLINE_AFTER` is unchanged and the kit block still follows the module's banner | **MEASURED** (V4: green) |
| — | **kit `VERSION` pins** | **none**: no kit bumps (R4). ⛔ A bump would owe four files | **MEASURED** (grep) |
| — | **deleted config objects** | **none.** The `in <OBJECT>` grep: 17 closed `!("X" in …)` assertions, none naming a CS015 key | **MEASURED** (grep) |

⛔ **An edit not in this table is a finding.** The phase stops, records it in
`STATUS.md` with its cause, and makes the edit only if it restores the claim the
closed test was always making.

---

## 12. ⛔ ACCEPTANCE CRITERIA

**GDD §19's Meta row** — "achievements with monotonic tiers and UTC ISO weeks
(CS015's, Paul's M4)" — is the row's ⛔ **last ✗**, and closing it closes the
row. Its CS011 verdict reads "✗ **CS015's — achievements** (Paul's M4)".

- **Met when:** the `achievements` key is declared and versioned, per profile,
  removed with the profile and never enumerated (P1); `lifetimeTiers` only rises,
  proved by a mutation that lowers one (P1); `weekKey` is an ISO year-week in
  UTC, proved against §1.6's six boundaries including `2026-W53`, and a week roll
  empties `weeklyUnlocked` alone (P1, P4); the five weekly are a function of the
  week and of nothing else, spending no draw (P1); and every id in the shipped
  table unlocks from a played or staged board (P3, P4).
- **GDD §17 item 10 — "every predicate reachable; none throws on empty state;
  tiers monotonic"** — closed when P3 asserts all three, and ⛔ **reachability is
  asserted per row, not in aggregate**: §1.3 already found one row (`purge_wide`)
  that no board reaches, and an aggregate assertion would have hidden it.
- **§17 item 12 (the soak)** — the thirteenth file, both modes, working store
  and reload, ⛔ **a stubbed twin hashing identically step by step**.
- **Quality:** no banned vocabulary — ⛔ **by the closed scan AND by eye, because
  the scan does not see through an underscore**; plays from `file://`; the concat
  build is the oracle; nothing opaque below depth 0.25 (a screen is a menu, drawn
  over the board); ⛔ **zero skips at the close**, which needs `../coinless-kit`
  present.

---

## 13. ⛔ WHAT CS015 DOES NOT DO

- **Onboarding** (CS016) — including ⚠ **telling a player what an achievement
  is, or that an Overdrive dive is something you steer**; **ship** (CS017),
  including the Mimic's verdict, the performance budget and `drawShot()`'s
  per-call allocation.
- **A telemetry column, a stats key or a registry change** (R3). ⛔ **The Worker
  is not contacted and `registry.js` is not read again.**
- **Edit, bump or backport a kit module** (R4).
- **Touch the ring flight, the tokens, the Jump, the combo, heat, the spawn
  schedules, `ENEMY_CAP` or any Classic constant** (R5, R6).
- **Add a kill site, a kill line, a two-depth comparison, an `ENEMY_KINDS` row or
  a contract field** (R5).
- **Pay points or a life for an unlock** (A9-A's recommendation; A9 is Paul's).
- **Post an achievement anywhere.** ⚠ SETTLED 2026-08-30: local-only (GDD §15.5,
  §21 #4).
- **Write `DECISIONS.md`** — ⛔ a planning session's two documents are its
  output; the CS012/CS014 gap is named in §0's findings and left to Paul.
- **Fix the vocabulary scan's underscore blind spot**, **`drive`'s lab session**,
  the pad-only silence, the VOICE bus, the Surger tone's 1.106 peak, the palette
  or the HUD sizes. All still unowned.

---

## 14. RISKS

- **K1 — ⛔ `CLAUDE.md` is at 47,919 bytes, ~2.0 KB under its 50 KB ceiling**
  (MEASURED). CS015 owes it at least a Save-data row edit (`achievements`
  declared) and probably an Achievements rule block. ⛔ **A phase that cannot fit
  its rule fires the valve on the section it is editing FIRST**, moving that
  section's reasoning to a `RATIONALE.md#anchor` and keeping its rule.
  ⚠ **`### Math and lifecycle` is already rule-only at 5.4 KB and cannot shrink
  further** — the CS014 close says the next reduction there is Paul deciding a
  rule has expired — and ⚠ **`## Code map` is 4.5 KB with no reasoning to move**,
  so it is the wrong target too. ⛔ The likely valve targets are **Save data**
  and **Leaderboard**, both of which carry reasoning.
- **K2 — `STATUS.md` is at 342 lines against ~400** (MEASURED). Four phases plus
  a §0 defect entry. ⛔ P1 compresses before it adds; reasoning goes to
  `log/CS015.md` **as it goes**, never at the close.
- **K3 — ⛔ the id table cannot be revised.** §0's headline. A phase that finds a
  row wrong after it has shipped is looking at save data, not at code.
- **K4 — ⛔ an unreachable predicate is a test that passes on zero.**
  `purge_wide` is MEASURED unreachable and `purge_saver` and `rim_sweep` are
  borderline. ⛔ **Reachability is asserted per row.**
- **K5 — the vocabulary scan's underscore blind spot** (MEASURED, §0's
  findings). ⛔ Every id and every displayed name is checked by eye in P3.
- **K6 — `e.key` inside `20-achievements.js` is red** (MEASURED), because its
  banner slice holds the inlined kit bodies and `test-cs002-p1.js` bans six
  device tokens in every slice but `04-input.js`'s. ⚠ An evaluator looping
  `for (const e of entries)` and reading `e.key` is the natural way to write it.
- **K7 — a weekKey read from the platform clock inside the module cannot be
  driven by a test**, and read per step it moves the soaks' faked week by 9.2
  days (MEASURED, §1.5). ⛔ The clock is injected.
- **K8 — the three seed-fragile Overdrive fixtures** (`-cs012-p2`'s `SOAK_SEED`,
  `-cs012-p4`'s seed 59, `-cs012-p6`'s `OD_CLOCK` 7927) move on anything that
  changes how long an Overdrive beat lasts. ⛔ CS015 spends no draw and changes
  no beat, so they are PREDICTED unmoved — ⚠ and which one moves is not
  predictable from a stand-in.
- **K9 — `Meta.runEnded()` sets `run = null` before it does anything**, so
  `eligible()` reads false inside it. ⛔ An evaluator seated there reads `ok`,
  the local, exactly as the submit does. Getting this backwards silently makes
  every run ineligible.
- **K10 — profile `p0`'s scope IS the root store** (MEASURED,
  `test-cs011-p1.js:205`), so ⛔ **a per-profile `remove("achievements")` on `p0`
  must never name a root key** — and a `Store.set` spy in a test sees only `p0`'s
  writes.
- **K11 — the boot block runs inside the harness**: `Meta.boot()` writes
  `profiles` in every build, so an achievements storage test starts from a booted
  store.
- **K12 — a mutation run that throws is a defect in the test**: guard the reads,
  report a COUNT and one index, ⛔ assert the string is in the build exactly once
  BEFORE asserting red, and run one probe over the real build and the mutant.
- **K13 — ⛔ zero skips at the close**, so `../coinless-kit` must be present:
  `test-cs011-p5.js` reads its registry at `f0b0eb2` and `test-cs012-p3.js` at
  `e2efed5` (⛔ never `f8d34f3`), and each SKIPS LOUDLY without it. ⚠ MEASURED
  this session: present at HEAD, absent in a clone.
- **K14 — ⚠ `run-all.js` has a 120 s PER-FILE timeout and machine load can trip
  it.** ⛔ A timeout is not a red — re-run the file alone before treating it as
  one. The thirteenth soak must fit; the twelfth ran well inside it.
- **K15 — a closed test may pin the literal text of a line a later phase
  changes.** ⛔ Pin only the ARGUMENT the claim is about, which is CS014 P2's
  lesson taken on CS014 P1's own file.

## 15. ASSUMPTIONS

- **A1 — Paul answers §0's twelve calls before P1.** ⛔ A build phase that
  reaches an unanswered call stops (`CLAUDE.md` rule 3).
- **A2 — `../coinless-kit` is present for the close** (K13). ⚠ MEASURED present
  at HEAD this session.
- **A3 — the Mimic still ships at the CS015 close.** ⚠ Its probation verdict is
  CS017's (GDD §21 #6), and `mimic_kill` depends on it (§9 row 24).
- **A4 — Classic and Overdrive share every constant CS015 reads.** Achievements
  read counters, and a counter counts the same event in both modes.
- **A5 — the thirteenth soak fits `run-all.js`'s per-file timeout.** The twelfth
  is the closest comparable; PREDICTED.

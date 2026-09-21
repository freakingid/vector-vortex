# NEXT-STEPS — Vector Vortex

Work that is **specified but not yet scheduled**: a defect found or a decision
taken outside the phase flow, written up in enough detail that a fresh session
can act on it without the conversation that produced it.

⛔ **Not session context.** A build or planning phase does not read this file
unless its prompt names it. It is picked up deliberately — *"read
`NEXT-STEPS.md` and plan the rim fix"* — and never loaded by default.

**How this file is maintained**

- ⛔ **An entry is DELETED by the session that acts on it**, in the same commit
  that lands the plan or the fix. This file is a queue, not a record; the record
  is `log/CS0##.md` and `DECISIONS.md`. An entry left here after its work landed
  is a stale pointer, which is the one failure mode this file has.
- ⛔ **Every figure names the commit it was measured at**, and an entry that
  reproduces measurements from a conversation says so, because ⛔ a session that
  acts on it **re-measures before planning against it** (`CLAUDE.md` rule 3b).
- An entry names the design calls that are **Paul's**, and leaves them open. ⛔ A
  handover is not authority to decide what the game does.

---

## Achievement thresholds: two collisions and one bot-derived par

**Raised by Paul, 2026-09-20, after CS015 P3 landed** (`af0ab9f`). ⛔ **No `id`
moves — an id is save data. Every change below is a THRESHOLD or a `name`,
neither of which is**, so this is a one-commit tuning pass whenever it suits.
⛔ **It happens BEFORE ship**, with the two weekly rows `STATUS.md` already
carries, or not at all: after a player has a save the ids are frozen and only
the numbers can move, which is a worse position to fix a collision from.

⛔ **MEASURED at `af0ab9f`** by `test-cs015-p3.js`'s `REACH` and the four probe
passes behind it. ⛔ **Re-measure before planning against these** (`CLAUDE.md`
rule 3b): the probe is four front-door passes of the closed soaks' hunter,
40,000 steps each, over Classic Start Depth 1 / 9 / 81 and Overdrive 1 / 9 /
17 / 81.

### 1. ⛔ `depth_reached`'s top tier and `dim_band` are the SAME PREDICATE

Both read `level`; `depth_reached`'s tiers are `[10, 25, 65]` and `dim_band`'s
`at` is `65`. ⛔ **They unlock in the same `evaluate()` call, on the same frame**,
one into `lifetimeTiers` and one into `lifetimeUnlocked`, so the screen shows two
rows complete at once for one act. MEASURED reach: level **140**.

⚠ **Paul's call which one moves.** The cheap read is that `dim_band` keeps 65 —
it is named for the band and a landmark reads better than an arithmetic number —
and `depth_reached`'s top tier goes somewhere with room under 140. ⛔ Nothing
here decides that.

### 2. ⛔ `dives_done` IS `wells_cleared` MINUS ONE, AND THEY CARRY THE SAME TIERS

MEASURED, all seven probe sessions, with no exception: at the clear edge
`divesCompleted` reads exactly `wellsCleared - 1` (41/42, 43/44, 59/60, 16/17,
15/16, 16/17, 15/16). ⛔ **A dive follows every clear**, so the two facts are
pinned to each other by the loop itself — this is not a bot artifact. Both rows
carry tiers `[5, 20, 50]`, so ⛔ **each tier of `dives_done` fires exactly ONE
WELL after the same tier of `wells_cleared`.**

⚠ **Paul's call.** Either the tiers diverge so the rows stop shadowing each
other, or `dives_done` is re-aimed at something a dive alone can say — ⛔ **but
the only per-dive facts that exist are `ringsTaken` and `ringSetsTaken`, both
Overdrive**, and `dives_done` is tagged `null`. A Classic-reachable per-dive
quantity would need a new `tally` counter, which puts it with the two weekly
rows in the same pre-ship pass.

### 3. ⚠ `C.ACHIEVEMENTS.wellShotPar` 120 came from the worst possible reference

`week_lean_well` ("clear a well without wasting shots") is `wellShots <= par`.
The par was MEASURED over 579 cleared wells — fewest **106**, p10 ~**121**,
median ~**185** — but ⛔ **every one of those wells was cleared by a driver that
HOLDS THE TRIGGER DOWN.** A bot that never releases fire is the most wasteful
possible shooter, so 120 is "the leanest tenth of maximally wasteful", not "lean".
⚠ **PREDICTED: a human who taps fire clears a well on far fewer than 120, which
would make this row free on the first well it is offered.**

⛔ **The probe cannot settle it** — a second AIMED pass exists (fire only with a
target in lane) and it died too fast to clear enough wells to be a sample: 23
wells across seven sessions, min 110. ⚠ **What would settle it is a human
number**, and ⛔ **Paul does no playtests**, so the honest options are: lower the
par on judgement, build an aimed-fire lab driver in `tools/` whose results port
in as data, or ⛔ **cut `week_lean_well` and leave the pool at 17.** ⚠ Paul's.

### What a session acting on this owes

- ⛔ **`test-cs015-p3.js`'s `REACH` is re-measured, not edited to fit** — it is
  the per-row reachability gate, and a threshold that moves below a measured
  maximum needs no change there, while one that moves above it is red.
- ⛔ **No `id` is renamed and no row is deleted from `lifetime`** — a dropped
  weekly row is a pool-length change and reshuffles the rotation, which is free
  only while no player has a save.
- A `name` or `note` change owes the ≤ 20 / ≤ 60 character budgets
  (`test-cs015-p3.js` §1) and the vocabulary assertion (§2).
- ⛔ **`DECISIONS.md` gets a line at the close**, a pointer and never the writeup.

---

*Nothing else queued.*

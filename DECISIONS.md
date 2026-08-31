# DECISIONS — Vector Vortex

Judgment calls made **outside** the phase flow, where no plan doc covered the
question. In-phase reasoning belongs in `log/CS0##.md`; rules belong in
`CLAUDE.md`; the *why* behind a rule belongs in `RATIONALE.md`.

Newest last. One entry per date, with the question, the call, and what would
change it.

---

## 2026-08-30 — repo scaffolding

**Multi-file `src/` with a concat build, not Orbital Overhaul's single-script
invariant.** Paul's direction. The single-file artifact is retained as the
behaviour oracle, so the guarantee that made the old rule valuable survives.

**`build.js` checks its `MANIFEST` in both directions.** A file on disk but
unlisted, or listed but absent, fails the build. A directory sort would have
been shorter, but a numeric prefix that sorts correctly today sorts wrongly the
moment a file is renamed, and a silent reorder of the config block relative to
its readers is expensive to diagnose.

**The harness rebuilds when `src/` is newer than `dist/`.** The alternative —
requiring a manual build before every test run — produces green runs against
stale artifacts, which is worse than a slightly slower harness.

---

## 2026-08-30 — two GDD open questions resolved

**GDD §21 #2 — Start Depth bonus counts toward the submitted score, and
`start_depth` ships as a stats field.** The board can therefore offer a
"from level 1" filtered view later without a schema change. Rejected: excluding
the bonus (loses the arcade feel) and including it with no record (makes the
board a depth-farming contest with no way back).

**GDD §21 #3 — kit modules are vendored into `lib/` and used directly**, pinned
by the `VERSION` string in each file. Not reimplemented locally.

## 2026-08-30 — the kit boundary and the backport packet

**A kit module never reaches into game state, in either direction.** Explicit
params and callbacks only. Mirrors the kit's own "no game code lives here"
constraint. Full rules in `CLAUDE.md`, "Kit modules and extraction".

**Kit modules are fixed HERE, in `lib/`, then backported manually.** The change
gets exercised by a real game before it lands in the shared repo. Backporting is
never implied by an edit.

**Every kit module carries a sibling `.NOTES.md`** — the backport packet, so a
coinless-kit reviewer reads one file rather than this game's decision history.
Template at `lib/MODULE-NOTES-TEMPLATE.md`. This entry is the pointer;
per-module writeups live in those files, not here.

**Six systems are built kit-shaped from v1** — input, menu/screen-state, audio,
fx primitives, achievements, local scores. Paul's call. The per-phase overhead
is accepted deliberately; see `CLAUDE.md` for the table and the ⚠ note.

## 2026-08-30 — the last five GDD open questions

**GDD §21 #1 — the dim band stays exactly as specced.** Levels 65–80 render at
`DIM_BAND_ALPHA` 0.18, with lanes lighting on occupancy, shot travel and Surger
charge. It is content almost nobody will see at a ~35–40 ceiling, but the
renderer already tracks lane occupancy for everything else, so the band is a few
lines on top of work that is required anyway. ⛔ No tuning time is spent on it.
Revisit only if telemetry ever shows a player past level 65. Rejected: cutting
it, which saves nothing real; and moving it earlier, which would break the
16-level band structure in §3.6 for one effect.

**GDD §21 #4 — achievements are local-only.** The evaluator returns a
payload-shaped object from its first commit, so server-backing later is wiring
rather than a rewrite.

**GDD §21 #5 — telemetry is strictly local CSV export.** Nothing is posted
anywhere. It is a tuning and debugging instrument and explicitly not anti-cheat;
a destination adds a privacy surface and buys no tuning benefit.

**GDD §21 #6 — the Mimic gets built.** ~100 lines against a shot path that
already exists. The probation verdict in §14.6 needs a playtest, not an
argument. ⚠ It stays flagged: cut it in CS016 without ceremony if reflected
shots read as cheap.

**GDD §21 #7 — three tracks at launch:** `title`, `pulse`, `drive`. `deep` and
`rush` are new entries in a data table with no code change, so they are
post-ship content rather than a scope cut. ⚠ Dropping to two is the third lever
in the roadmap's cut order.

**A changeset roadmap now exists as `ROADMAP.md`**, its own file rather than a
section here — it is edited every time a changeset is renumbered, and this file
is append-only.

## 2026-08-30 — the Drifter's `killDepth`, decided against two shipped comments

**The question.** `PLANNED-FEATURES-CS005.md` and `STATUS.md`'s carried-task
list both said the Drifter's `killDepth` is **`0`**, on the reading of GDD
§6.1's "Kills by contact, **any depth**, instant". CS005 P2 had to write the
number, and no plan doc covered the conflict, so the call was made in-phase and
is recorded here rather than in the log alone.

**The call: `killDepth = 1 - C.RIM_CONTACT_DEPTH`, the same value every other
contact-killing enemy carries.** `collideSkimmer()` is `depth >= killDepth` plus
a lane match and it has **no term for where the Skimmer is** — the Skimmer is
always at the rim, so the depth test is entirely about the enemy. A `killDepth`
of `0` therefore does not mean "kills at any depth on contact"; it means "is
lethal from the throat, on its spawn step, before it has been seen". §6.1's
phrase is about the *absence of a state gate* — a Drifter kills whether it is
riding or crossing, where a Weaver's body never kills at all — and not about the
depth comparison.

**Why it needed a decision entry.** It was made **against two shipped comments**
that predicted the opposite: `07-enemies.js`'s base class said "NOTHING IN THE
ROSTER IS ZERO" and `09-collision.js`'s `collideSkimmer` header said a zero here
is an unaccountable death. Both were true when written. P2 corrected five
passages that carried the wrong value; P3 then shipped a Surger whose discharge
mutates the field **to `0` transiently**, which makes both of the old comments
half-true rather than simply wrong, and both now say which kind of zero they
mean. ⛔ A future session that finds §6.1's "any depth" and "corrects" the
Drifter back to `0` re-introduces a death from the throat on the spawn step.

**What would change it.** A `collideSkimmer()` that took the Skimmer's position
as a term. Nothing else.

---

## 2026-08-30 — CS006 P2 edited a closed test its own prompt ⛔ forbade editing

**The question.** CS006 P2's prompt carries two instructions that cannot both
hold once the phase does its job: ⛔ *give the Flat and the Stair a
`throatOffset`, defined as the translation `wellThroat()` already applies*, and
⛔ *every closed test file must still be green and none may be edited*.
`test-cs001-p2.js` derives the throat as
`centroid + (rim − centroid) × throatScale`, with **no offset term**. That line
was exact on all sixteen wells for as long as no well carried an offset, and it
is unsatisfiable by *any* implementation of the field the moment one does. The
only way to leave the file untouched was to ship no offsets, which is the phase.

**The call: extend the assertion by the offset term, and nothing else.** Added
`+ offX` / `+ offY`, read defensively off `well.throatOffset`. Same sixteen
wells, same `1e-12`, same message, no narrowing of the claim and no case
dropped — this is not the `test-cs005-p3.js` situation, where a closed test had
over-pinned a line and the fix was to pin less. `PLANNED-FEATURES-CS006.md`
assumption #15 already licenses it in general terms ("a closed phase's test is
rewritten in place when a later changeset replaces the behaviour it asserts");
it was written for P3's four edits, and P2 hit it first.

**Why it needed an entry rather than a `STATUS.md` line.** The prompt's ⛔ was
explicit and this went against it, so the record has to outlive the changeset —
`STATUS.md` resets at the close. ⛔ **Paul's to confirm or reverse.**

**What would change it.** A `throatOffset` semantic that was not a translation
of the throat polygon, which would make CS001 P2's line wrong rather than
incomplete. It is a translation, so the line was only ever incomplete.

---

## 2026-08-31 — CS006 P3: the permitted red landed on the other baseline, and three closed fixtures were repaired

**The question.** P3's prompt authorised ⛔ *exactly one* red — `GOLDEN_LANES`
in `test-cs004-p1.js` — and ⛔ scoped *four* closed test files. Both predictions
were wrong in the same direction: the Dive moved a different baseline and broke
three more fixtures than the prompt anticipated.

**`GOLDEN_LANES` is green and owes no re-record.** Measured, not assumed: its
3,000-tick window does cross one well clear (level reaches 2), but the extra
1.6 s of beat costs it no spawn, so the lane sequence is bit-identical. What went
red is `test-cs006-p2.js`'s `P1_DETERMINISM_HASH`, unreachable by any post-P3
build for two independent reasons — the between-wells beat is 2.6 s rather than
1.0 s, and the soak's hash now mixes `dive.timer`/`dive.depth` where it mixed the
deleted field.

**The call: leave it red, and P5 owns the single re-record. Paul's, 2026-08-31.**
That assertion's CLAIM is *"CS006 P2's `throatOffset` moved no simulation"*, and a
constant taken from a later build asserts nothing about P2 — re-recording it here
would retire the claim while looking like a fix. ⛔ The cause is **proven**, not
inferred: driven tick by tick against the build at `40044ee` over the fields both
builds share, the two are bit-identical for **1,112 ticks** and diverge on
**exactly the tick `wellCleared()` first returns true**, in one field —
`shots.length`, which is `startDive()` clearing the player's in-flight shots
(GDD §5, ⚠ SETTLED). Nothing else moved. A re-record is the one moment a stray
RNG draw can be laundered into a new baseline, so it happens once, deliberately,
with that cause named.

**And three closed fixtures were repaired, beyond the four the prompt scoped.
Paul's, 2026-08-31.** `test-cs003-p3.js`, `test-cs003-p4.js`, `test-cs004-p3.js`
and `test-cs004-p4.js` all built quiet boards by draining the quota to zero — and
a drained quota with no `blocksClear` survivor is now a **cleared well**, so the
Dive filtered the case's own board away on the next step before it could assert
on it. ⛔ These are **fixtures, not assertions**: every repair is the same line,
`spawn.remaining = 1` instead of `0`, which is half of `wellCleared()`'s two
conditions, holds the well open by itself, and adds no entity for a length
assertion to count. It is the trap `test-cs003-p2.js`'s own header already
documents. `test-cs003-p5.js` needed one more — its soak's first game-over moved
from inside 10,000 ticks to tick **10,091**, because the Dive is ~1,100 safe
ticks per 10,000 — so its `TICKS` is 12,000, which strengthens GDD §17 item 1
rather than relaxing it. ⛔ **No assertion was weakened or deleted.**
`CLAUDE.md`'s test rules gained the fixture half of the closed-test rule in the
same commit.

**Why it needed an entry rather than a `STATUS.md` line.** Both went against an
explicit ⛔ in the phase prompt, and `STATUS.md` resets at the changeset close.

**What would change it.** For the red: a way to isolate P2's `throatOffset` claim
that does not depend on a whole-run hash — then the pinned constant could retire
honestly instead of being re-recorded. For the fixtures: nothing; a cleared well
entering a dive is the feature.

---

## 2026-08-31 — the spawner-stall call, and where the work happens

**The concurrency budget counts THREATS; the readability ceiling keeps counting
ENTITIES. Paul's call, 2026-08-31.** `updateSpawner()` and `spawnEnemy()` read
the same `state.enemies.length` for two different questions, and `00-config.js`
already claims they are different numbers. Split them:

- `spawnEnemy()`'s `C.ENEMY_CAP` check: **unchanged**, raw `state.enemies.length`.
  A Thorn is drawn, so a readability ceiling counts it.
- `updateSpawner()`'s block: counts entities where `blocksClear && !dead`. A
  Thorn does not block the clear, so it does not hold a release slot.

⛔ **Three follow-ons resolve to "no change" and are settled with it:** no Thorn
expires (GDD §5's lesson — *clear thorns before the last enemy* — depends on it
persisting), `wellCleared()` is untouched, and `C.ENEMY_CAP` is not raised.

**Why it needed an entry.** The stall was found by CS004 P5's soak, measured, and
deliberately left unfixed by CS004, CS005 and CS006 because the answer is a design
call rather than a bug fix — and it blocked CS007's spec, which cannot scope GDD
§8.1's introduction schedule without it. Three closing soaks work around it today
with the same documented fixture (`C.ENEMY_CONCURRENT` raised to `C.ENEMY_CAP`,
put back and asserted back).

**What would change it.** Evidence that a Thorn-free release budget makes a well
with standing Thorns *too* busy to read — which is a playtest answer, not an
argument, and `PLAYTEST.md`'s six-kind ask is where it would surface.

⚠ **And the previous entry's "what would change it" condition was met.** It asked
for *a way to isolate P2's `throatOffset` claim that does not depend on a
whole-run hash*. CS006 P5 found one: every `.throatOffset` in the built file lies
inside `wellThroat()`'s own source, so the offset cannot reach a simulation value
by any path, on any seed, for any number of ticks. The whole-run hash was
re-recorded and the claim it used to carry is now carried by something stronger.

---

## 2026-08-31 — planning moves into Claude Code, and what stays in claude.ai

**All Vector Vortex work happens in Claude Code, including
`PLANNED-FEATURES-CS0##.md` and `IMPLEMENTATION-PHASES-CS0##.md`. Paul's call,
2026-08-31.** The previous split — design in claude.ai, implementation here — was
adopted on general advice rather than on evidence from this repo. The evidence
now says otherwise.

**The real dividing line is not planning versus implementation. It is CHECKABLE
CLAIMS versus JUDGMENT**, and this project's planning docs are overwhelmingly the
first. `PLANNED-FEATURES-CS006.md` made three claims that a session with the repo
could have checked in seconds and a session without it could only predict:

| Predicted | Actual | Cost |
|---|---|---|
| the Dive moves `test-cs004-p1.js`'s `GOLDEN_LANES` | it does not — the extra 1.6 s costs the golden's window no spawn | P3 shipped on an inverted prompt; P5 spent a step correcting it |
| a renumber touches ~12 in-repo pointers | CS004 found 41, CS006 P0 found 73 | scoping, twice |
| P2 can land `throatOffset` editing no closed test | unsatisfiable — `test-cs001-p2.js` derived the throat with no offset term | an explicit ⛔ had to be broken; see the 2026-08-30 entry |

Two of the three produced `DECISIONS.md` entries of their own.

⛔ **What is kept, because it was the real benefit and it is not about venue.**
Planning elsewhere meant the planner could not cheat and the builder came to the
plan as a stranger. That gap is preserved by three rules, now in `CLAUDE.md`
under Session rules: a planning session writes no code, every claim in a plan is
marked **measured** or **predicted**, and a build phase is a fresh session that
reads the document rather than the conversation that produced it.

**What stays in claude.ai.** Greenfield concept work before an artifact exists
(a new game's GDD, its pillars, an Overdrive-scale feature argument);
outside-world research (the Atari/TxK legal reading, itch.io packaging, browser
audio behaviour across devices); and long exploratory conversation that should
not end in a commit. Plus anywhere Paul is not at this machine.

⚠ **Cross-project work is NOT in that list, and that is the part that changed.**
`ADD-Orbital-Overhaul`, `coinless-kit` and five other games are siblings of this
repo on disk. "What did Orbital Overhaul's layering failure actually look like"
and "will this kit module backport cleanly" are **better** here, against both
repos, than in a chat working from a summary of them.

**What would change it.** A planning session that starts inventing design because
it can see the code — the failure mode this trades for. `CLAUDE.md`'s "stop and
surface it" rule now applies to planning sessions as well as build phases, and
this entry is the reason.

---

## 2026-08-31 — CS007's three difficulty calls, answered

**Answered in the CS007 planning session, against measured options, after
`PLANNED-FEATURES-CS007.md` was committed at `578c21b`.** The measured option
tables are left in that document — they are the reasoning behind these answers,
not a menu still open.

### H1 — the respawn guarantee under heat: **a hard cap, not a derived push**

⛔ **`C.CLIMB_MULT_MAX` is 1.40 and `C.RESPAWN_PUSH_DEPTH` stays 0.55.** A
Vaulter's terminal throat→rim becomes **3.97 s** against 5.56 s at level 1, and
the guarantee holds with a margin of **+0.087 s** (1.587 s against
`RESPAWN_INVULN` 1.5).

⛔ **No `respawnPush()`, no `C.RESPAWN_PUSH_MARGIN`, no derived-push code
anywhere.** Measured: at a ceiling of 1.40 the derived push evaluates to exactly
0.55 at every level, so it would be dead code from the day it shipped. `H1`'s own
recommendation was the derived push; it is declined because the ceiling it was
protecting is not being raised.

⛔ **`C.CLIMB_MAX_BASE` 0.18 ships anyway**, because the §17 property has to name
the fastest contact-killer, and naming it `VAULT_CLIMB` inside a respawn assertion
is how a future entity faster than a Vaulter escapes the guarantee silently.
⚠ It is **not** `WEAVER_BOLT_SPEED`'s 0.32: the bolt reaches `killDepth` at
1.250 s, inside the window, and is safe by **self-termination** at 1.406 s + one
step rather than by the arithmetic. That is also why heat does not scale it.

**What would change it.** Playtest evidence that levels 40–99 do not escalate
enough on speed. Raising the cap past **1.4815** breaks the guarantee outright and
is the point at which the derived push has to come back — with a second ceiling of
its own near **2.4**, below which the push lands enemies under
`C.READABILITY_DEPTH` and stops being legible.

### H3 — the mapping shape and the five clamps: **Form A, endpoint 99, "Mid"**

⛔ **Form A — endpoint interpolation**, one shared endpoint:
`v(level) = base + (clamp - base) * min(heat(level) / heat(C.HEAT_FULL_LEVEL), 1)`,
with `C.HEAT_FULL_LEVEL` **99**. The base already ships and the clamp is the
number being chosen, so **the clamps ARE the curve** and no row needs a rate
constant of its own. Form B (a per-row rate `k`) was the alternative and adds five
difficulty numbers for expressiveness nothing has yet asked for.

| Constant | Value |
|---|---|
| `C.HEAT_FULL_LEVEL` | 99 |
| `C.SPAWN_INTERVAL_MIN` | 0.70 |
| `C.ENEMY_CONCURRENT_MAX` | 8 |
| `C.CLIMB_MULT_MAX` | 1.40 |
| `C.VAULT_INTERVAL_MIN` | 1.00 |
| `C.VAULT_RIM_INTERVAL_MIN` | 0.35 |
| `C.SURGE_INTERVAL_MIN` | 1.40 |
| `C.WEAVER_APEX_MAX` | 0.75 |

⛔ **All seven heat-derived rows are clamped, which is what makes
`C.HEAT_HOLD_LEVEL` unnecessary** — heat past a row's saturation changes nothing,
so a hold is inert and GDD §17 item 7 (`heat(n+1) > heat(n)` over 1..200) stays
literally true on the shipped formula. `src/02-state.js`'s note anticipating that
constant is superseded; the rule that a hold, if ever needed, lives in the
**caller** is not.

**Three measured consequences, recorded because they are counter-intuitive:**

1. **The Surger gets faster to the rim, not slower.** The floor alone would
   lengthen its approach — its climb pauses during telegraph and discharge — but
   at floor 1.40 with climb ×1.40 the climb more than compensates: throat→rim goes
   8.59 s → 7.31 s while lethal duty rises 9.0 % → 14.0 %.
2. **The rim hunt interval never goes inert.** It ends at 0.350, above the
   `VAULT_HOP_TIME` 0.28 line at which the hop rate saturates, so the knob is live
   at every level. ⚠ H3's stated reason for that clamp — *"or hops overlap"* — is
   **wrong**: `Vaulter.update()` gates on `if (this.hopping) … return`, so hops
   cannot overlap. The real consequence of approaching 0.28 is a rim Vaulter that
   never pauses, which is a §1.1 P2 legibility question.
3. **The Weaver's bolt keeps a real warning.** At the 0.75 apex ceiling the flight
   is 0.781 s, still 1.7× `SURGE_TELEGRAPH`'s 0.45 s — the build's own "fair
   difficulty is a visible fuse" benchmark. Apex **is** the Thorn's length, so one
   number also sets 10 shots to clear, 0.25 of lane left, and a dive struck at
   0.91 s of 2.6.

⛔ **`DIFFICULTY-NOTES.md` is corrected IN PLACE, not rewritten** — its curve
already matches `00-config.js` and `heat(1) = 0`; it survives in shape and fails
in detail. ⛔ `SPAWN_MIN`, a constant that never existed, becomes
`SPAWN_INTERVAL_MIN`.

**What would change it.** GDD §8.2's tuning targets missed in a real playtest —
first-time 4–6, competent 15–20, strong 30–40. `C.HEAT_FULL_LEVEL` is the single
knob that moves the whole curve's saturation without touching a clamp.

### C3 — Carrier cargo weights: **emergent from the schedule, no weight table**

⛔ **The kind pick stays a uniform `rngPick` over the eligible set.** The three
Carrier variants are three separate `ENEMY_KINDS` rows and three separate
introduction-schedule entries, so GDD §8's *"cargo weights shift toward
Drifter/Surger"* is delivered by arithmetic alone: 100 % Vaulter cargo at L3–17,
50/50 at L18–22, 33/33/33 from L23. Zero code, zero constants, and the ⛔ "one
draw when there is a choice, none when there is not" rule stays true without a
second mechanism.

⛔ **The schedule's definition and GDD §6.2 must both SAY the absence of a weight
table is a decision**, or a future session reads it as an oversight and adds one.

**What would change it.** A playtest where the cargo mix reads as arbitrary rather
than as escalating. Option B — a weight table in `C` interpolated by heat — still
costs exactly one RNG draw, so it remains available without disturbing the count
guard.

### ⚠ And this answer re-scoped the plan

`IMPLEMENTATION-PHASES-CS007.md` carried **six** phases when it was committed; H1's
answer removed `respawnPush()`, `RESPAWN_PUSH_MARGIN` and the monotonicity
argument — the whole of the phase written to build them. What remained was one
constant that has to land with the other clamps anyway and one property test, and
a phase whose entire content is a test that a previous phase's constant satisfies
an inequality is that phase's acceptance criterion, not a phase. ⛔ **Five phases,
and P2 proves the guarantee before it wires a single accessor.**

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

**Shipped, CS007 P1** — and the two inputs CS005 gave this call are recorded here
rather than in `STATUS.md`, whose known-issue entry retired with the fix:

1. A **riding Drifter** is temporarily neither a threat the player can remove nor
   a slot they can free, but it is **self-resolving where a Thorn is not**: it
   crosses on a fixed cadence bounded by `C.DRIFT_RIDE_TIME` and climbs in
   **both** phases, so it reaches the rim and forces a resolution. "Threats or
   entities?" had a case where the honest answer was "neither, for 0.85 s". It
   is `blocksClear: true`, so the split leaves it holding a slot — correctly.
2. ⛔ A **rim-parked Carrier is NOT self-resolving**, and it stalled a seeded run
   at the CS005 close. ⚠ **It is a separate reading and NOT the same bug**: a
   player cannot shoot it without entering its lane, and entering its lane is
   contact death, so it looks like a life tax and is not. **The player's answer
   is the Purge** — unspent on a well that did not need it, recharged on entry,
   and specified as *"the enemy nearest the rim, deterministically"* (GDD §4.3).
   It stalls a soak that never presses Purge; it does not stall a played build.
   ⛔ No code change — the reading is the record, and the soak repair is the
   driver (`replayWide`'s pin), never the build.

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

---

## 2026-09-13 — CS008's calls: the rim fix, and front of house

**Paul answered every design call CS008's planning session surfaced, in that
session.** The full table — 27 answers and 7 flagged readings — is
`PLANNED-FEATURES-CS008.md` §0, and ⛔ that table is the record. This entry
carries only the calls that change something a later session would otherwise
"fix".

**The rim: (A) + (B), 100 % killable, as CS008 P1, and no renumber.** The session
then measured that (A) + (B) is **75 %, not 100 %**: an enemy parked at `0.95`
is `0.050000000000000044` from a shot at `1.0`, past `C.HIT_DEPTH_TOL`. So the
fix ships with a third part, `C.HIT_DEPTH_EPS` 1e-9 in one comparison. ⛔ **That
constant is representation error, not a tuning margin**; removing it drops the
headline case from 24/24 to 18/24.

**Rotating ONTO a rim-parked enemy is deferred to playtest, deliberately.** It
stays a 1-in-4 save under every fix. Re-arming the cooldown on a lane change was
measured (17/24) and not taken, because it lets mouse jitter fire every tick.

**Scope grew by Paul's choice**: the Options screen (with a Controls sub-page and
key/gamepad rebinding), pause, and the death fragmentation are all CS008's.
Eight phases against `ROADMAP.md` assumption #1's 3–5; a split at P5/P6 would
cost a 62-pointer renumber.

**Four answers a future session could mistake for oversights.**
- GDD §4.6's Start Depth **formula is canonical** and its table was wrong at 7,
  17 and 33.
- The **Start Depth bonus is paid on clearing the starting well**, not at run
  start, so a deep start does not buy lives up front.
- **Purge kills score.**
- **Text goes through one sanctioned `fillText` path**, Orbital Overhaul's
  precedent, with two-pass glow rather than `shadowBlur`.

**What would change it.** A playtest that finds parked enemies 2–9 px inside the
rim read as "not at the rim" (the fix would become draw-at-1, collide-at-0.95,
its own call); or rotating onto rim enemies reading as unfair (R4 re-opens with
the measurement already in hand).

---

## 2026-09-13 — R4 re-opened and answered: crossing a rim enemy with fire held always kills it

**Paul, after playing the CS008 P1 build.** He could not survive ten seconds on
level 1: once a Vaulter reaches the rim, moving across its lane kills him. Asked
*"if you are holding fire and move across a lane with an enemy at the rim, should
that enemy always die?"* — **yes**: *"To do otherwise would put the player in a
situation where they have no way to control their fate, and that is not fun."*

⛔ **This supersedes `PLANNED-FEATURES-CS008.md` §0 R4** ("defer to playtest").
The playtest happened, and the deferral is what made level 1 unplayable.

**MEASURED at `22c75b5`** (a throwaway probe, not the suite): Skimmer rotating
right across a Vaulter parked at the park depth, 24 fire phases — fire held,
**18/24 deaths**; no fire, 24/24. Re-arming the cooldown on a fire-lane change,
in a copy: **17/24 kills**, not 24. ⛔ The obvious fix is not the whole fix.

**The reading taken with it, and flagged:** a player **not** holding fire still
dies on contact. The call is about a firing player having a way through, not
about removing contact death.

**What it changes.** CS008 P2 does not start until this is planned and built;
the write-up is `NEXT-STEPS.md`. P8's R4 playtest ask is moot.

---

## 2026-09-13 — the crossing fix, planned as P1b: the rim sweep

**Paul answered four calls in the planning session.** The record is
`PLANNED-FEATURES-CS008.md` §0 K1–K4; the measurement is §1.16.

- **K1 — the rim sweep.** In `collideSkimmer()`, a Skimmer holding fire asks a
  touching rim enemy `onShot()` before contact can kill.
  - ⛔ **A future session will want to move this into `updateShots()`. It was
    measured.** The best shot-based build (re-arm on a lane change, plus that
    shot ignoring `SHOT_MAX`, plus contact on the fire lane) still loses 24/24
    to two stacked Vaulters and 18/24 to a Vaulter hopping into a slow mover.
  - The handover's 17/24 for the re-arm was a short-pre-fire artefact. With the
    8-shot rack full — the steady state for anyone holding fire — it is 6/24.
- **K2 — accepted.** A fire-holding player has no death path on levels 1–4.
  MEASURED 0 deaths in 20 × 60 s against 15 on the shipped build. P8 writes a
  `PLAYTEST.md` ask; the answer is §8.2 tuning, not this rule.
- **K3 — "always dies" means an enemy a shot could kill that step.** A riding
  Drifter, a Weaver bolt and a Surger discharging below the rim still kill a
  crossing player.
- **K4 — P1b**, no renumber.

**What would change it.** The K2 playtest saying levels 1–4 lost their tension
belongs to tuning. Only a finding that the sweep itself reads wrong would
re-open K1.


---

## 2026-09-13 — CS008 P2: a clear on the step that spends the last life

**The question.** The clear edge runs after `killSkimmer()`. A Weaver bolt can
kill on the step a shot takes the well's last enemy, so the clear bonuses were
paid after the run had stopped. If they crossed a milestone, `lives` went back
to 1 on the game-over stop. MEASURED 0 times in 268 game overs; reachable.

**The call — Paul: score, no life.** The bonuses count toward the final score.
`addScore()` awards no life while `screen === "gameover"`, and the milestone is
spent, not banked. An award earlier in that step, before the death, still pays:
the run had not stopped yet.

**What would change it.** Nothing expected. A later rule that the dead player
did not clear the well ("pay nothing") would move the guard to the clear edge.


---

## 2026-09-13 — CS008 P3: a life lost in the starting well keeps the Start Depth bonus

**The question.** S2 pays the bonus "only if you survive the well you chose".
Plan §4's mechanism pays on the starting well's clear with no death test, so a
player who loses a life there and then clears it is paid. Was "survive" meant
as any death?

**The call — Paul, on Claude's recommendation: still paid.** Only a run that
ends in its starting well forfeits the bonus. The death already costs a life
and the no-death 1,000; voiding 22,300+ on one slip would make a deep start a
gamble, against GDD §4.6's "trade safety for score legibly". No code change;
`test-cs008-p3.js` stages the case.

**What would change it.** A playtest finding that deep starts are farmed by
dying freely in the starting well.


---

## 2026-09-13 — CS008 H4: the HUD shows during a run, not before one

**The question.** P4 shipped `drawHud()` into `Game.draw()` unconditionally.
Plan §6 does not say whether it draws behind P5's screens.

**The call — Paul, on Claude's recommendation.** Draw it in play, pause, the
dive and game over, where the game-over screen needs the final score and
level. Don't draw it on title, mode or Start Depth: no run exists there, and the
HUD would show the last run's stale numbers. Written into plan §0 as H4 and
into P5's prompt.

**What would change it.** An attract mode (GDD §12) that plays a demo run
behind the title.


---

## 2026-09-13 — CS008 P5: touch in menus is drag to move, tap above to confirm

**The question.** Measured at `d02f8fa`: a tap above the rotation zone gave no
`fire`, and a touch inside it gave `fire` on touch-down (auto-fire). Under U1's
rising-edge Fire, every drag meant to move the cursor confirmed the highlighted
row first. The prompt's pre-authorized fix, an upper tap that confirms, would
still have left touch able to pick only default rows.

**The call — Paul, on Claude's recommendation.** Outside play, auto-fire is off,
a drag in the rotation zone moves the cursor, a tap above it confirms, and the
Purge button backs out. In play both switches stay as shipped. This is kit-input
0.4.0 (MINOR), and `src/04-input.NOTES.md` has the writeup. Rejected: tapping a
row directly (more new surface than U1 describes), and deferring (touch would
reach default rows only).

**What would change it.** A phone sitting where taps land in the drag zone and
do nothing (`PLAYTEST.md`, screens).


---

## 2026-09-13 — CS008 P6: pause toggles, the HUD over OPTIONS from pause, and no "Atari" in the build

**The questions.** P6 built three readings and flagged them:
- whether the HUD draws over OPTIONS opened from pause, a case H4's list does
  not name;
- whether `p`, gamepad Start and the touch target resume, where plan §7 applies
  `pause` on play only;
- whether the three "Atari" comments in `14-render-entities.js` stay, given GDD
  §18.1's "no Atari marks anywhere — code, comments".

**The calls — Paul, on Claude's recommendation.**
- **The HUD draws.** A run exists there, and the board is still drawn behind the
  menu.
- **`p` and Start toggle, on the pause screen only.** Pressing Start to unpause
  is the universal convention. On OPTIONS and its pages they do nothing. The
  page going hidden only ever pauses, because a tab switched away twice must not
  un-pause. The touch target stays off on menus.
- **"Atari" is reworded out of the source**, and `test-cs008-p6.js` bans it in
  the built file. `CLAUDE.md`'s word list is not extended.

**What would change it.** A playtest where a toggle press un-pauses by accident,
say a double-tapped Start.

---

## 2026-09-13 — CS008 P7: the sensitivity range, the slider mode, a refusal ends a capture, no unbinding swap

**The questions.** P7 was told to confirm one number, the plan's flagged
×0.5–×2.0 sensitivity range. Three more surfaced that plan §8 does not answer:
- how a slider takes rotate, when rotate moves the cursor;
- what a refused key does to an armed capture;
- whether a swap may leave a gamepad action with no button.

**The calls — Paul, on Claude's recommendation.**
- **×0.5 to ×2.0 in ×0.1 steps.**
- **Fire arms a slider.** Rotate adjusts it, and Fire, Purge or Escape leaves
  and keeps the value.
- **A refused key ends the capture** with its reason shown, so Escape and Start
  double as cancel.
- **A swap that would leave an action unbound is refused**, so a pad-only player
  cannot lose Fire.

Detail is in `log/CS008.md`, P7, and GDD §10.5.

**What would change it.** A hardware pass where ×2.0 still feels slow on a
high-DPI mouse, or where players expect Purge on a slider to revert.


---

## 2026-09-16 — no more playtests

**The question.** `PLAYTEST.md` had grown to about 400 lines of asks for Paul,
and nearly every phase added more.

**The call — Paul.** No more playtests. Orbital Overhaul reached a finished
game quickly with almost none. `PLAYTEST.md` is renamed `SKIPPED-PLAYTESTS.md`
and rewritten as a record: each entry names the changeset and phase, what Paul
would have done, what we were trying to learn, and the knobs. Nothing waits on
it, and the shipped values stand. Older entries in this file that say "a
playtest would change it" now mean that nothing will, unless Paul raises it
himself.

**Open, for CS009 planning to raise.** `CLAUDE.md`'s music solo-audition gate
is a listening test. CS009's plan asks Paul how it is judged.

**What would change it.** Paul choosing to play something.

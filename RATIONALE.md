# RATIONALE — Vector Vortex

Why the rules in `CLAUDE.md` exist. **Not read by default** — pull one section
when a rule's scope is genuinely ambiguous. `CLAUDE.md` states rules; this file
states reasons, keyed by anchor.

---

## #music-layers

`CLAUDE.md` requires the melody in the always-on foundation tier, and requires
every gated layer to pass a solo audition. Both rules are paid for.

Orbital Overhaul built intensity layering (v3.4 P7) and froze it (v3.5). Two
findings from that game's own GDD:

1. **The trigger was wrong.** Layers gated on `musicIntensity(wave) =
   1 − e^-(w−1)/8`, a smooth curve over wave number that moved once per wave and
   was unaffected by anything the player did. Its tier-4 threshold (0.70) first
   crossed at **wave 11** — with the lead voice gated at tier 4, no gameplay
   track had an audible melody for most of a typical run. That was the actual
   cause of the "no melody" complaint, not a synthesis problem.

2. **Re-tiering was tried and rejected on audition.** The composed tiers were
   built, loaded, and played back at every intensity step. On every track the
   preferred mix was the foundation alone: the thickening read as clutter, not
   intensification.

Vector Vortex re-opens that decision deliberately (Paul, 2026-08-30) on the
diagnosis that finding 2 was **compositional, not architectural** — the layers
were, in his words, undefined and muddy. A layer written as *more texture on
top* has no identity and thickens the spectrum without adding information. A
layer written as a part — a beat you could nod to, a line you could hum —
announces itself.

Hence three changes: the trigger is live danger rather than wave number; the
melody is never gated; and the solo test is a hard audition gate rather than a
matter of taste.

**Scope is deliberately narrow** — a filter sweep plus two or three earned
layers, not five tiers. Five tiers is where the clutter came from. The sweep
does much of the work on its own and is structurally incapable of sounding
cluttered, because it adds no notes.

**The retreat is data-only.** If the audition fails again, dropping the `tier`
fields makes every gate build always-on with no code change — the same freeze
Orbital Overhaul took. Build it so that stays true.

---

## #depth-model

Entity position is `(lane, depth)` because it collapses all entity math to one
dimension: collision is a 1-D overlap plus a lane match, with no trigonometry in
the hot path. It also means all sixteen well shapes share one code path, adding
a shape is adding data, and the whole simulation runs headless with no canvas —
which is what makes the test harness possible at all.

This is the analogue of Orbital Overhaul's wrap-aware `dist2`/`angleTo`/
`shortDelta` rule: the one piece of math that, done naively, produces subtle
bugs everywhere downstream.

---

## #oracle

Tests load `dist/`, never `src/`, because the concatenated file is what ships. A
suite that tests `src/` directly passes green while a build-order bug — a module
reading `C` before `00-config.js` is evaluated, say — ships broken. The cost is
a rebuild inside the harness; the benefit is that green means shippable.

---

## #thorn-depth

`CLAUDE.md`'s entity-lifecycle invariant carries a seventh contract field,
`anchored`, whose only job is to say that **a Thorn's `depth` is its LENGTH and
not its position**. That looks like an inconsistency in the depth model, and to
a fresh reader it looks like the sort of thing a tidy-up should remove. It is
paid for three times over.

**Why `depth` is the tip rather than a second `len` field.** The collision
pass's hit test is one line — `Math.abs(shotDepth - e.depth) <= HIT_DEPTH_TOL` —
and it is exactly right on a Thorn *because* `depth` is the tip: a shot stops
where the Thorn starts, which is the behaviour GDD §4.2 describes and the reason
a thorned lane shelters whatever is climbing below it. Move the extent to a
second field and the one collision pass grows a Thorn branch. That pass is the
single place the entity contract is paying for itself, and a branch in it is the
first of nine.

**Why that bought a contract field instead of a class check.** Exactly one
system in the build writes an entity's `depth` from outside that entity:
`respawnSkimmer()`'s rim push (GDD §4.4). Clamping a *length* is not a push, it
is a free chip — every player death would permanently shorten every Thorn past
0.55, silently, in the one place nobody would look. The alternative was
`if (e instanceof Thorn) continue;` in the respawn, which is a class name in a
rule that is not about that class, and the first of nine again. The field says
something true about the QUANTITY that a future entity may also need; if nothing
else ever sets it, it stays one boolean and one line.

**Why it is orthogonal to §4.4's ⚠ SETTLED clamp.** That marker is about the
DEPTH BAND: everything above `RESPAWN_PUSH_DEPTH` comes down to it, in every
lane, rather than only what sits inside the rim contact band — the narrow
reading leaves a Vaulter at 0.9 climbing back into the kill band well inside the
invulnerability window, which is the exact death the rule exists to prevent.
`anchored` does not touch that. It answers a different question — *which
entities is a depth clamp meaningful for* — and the answer is "the ones whose
depth is a position", which is every enemy in the roster but one. ⛔ A session
that reads the skip as a narrowing and removes it re-introduces the bug the
field was added for, and the suite goes red on the real death path
(`test-cs004-p4.js`).

**The shape of the mistake it prevents.** A quantity that means two things
depending on the entity holding it is a smell. The answer is not to forbid it —
one line of collision code is worth a great deal — but to make the difference
*declared*, on the entity, where every system that writes `depth` can ask. The
declaration is the field.

---

## #boundary-lattice

`CLAUDE.md`'s math-and-lifecycle section says the fold bounds are a parameter,
that `boundaryFrom()` is a separate helper, and that an open well's two
outermost boundaries are not addressable. Three rules, three reasons.

**Why the fold bounds are a parameter rather than a second helper.** There is
exactly **one mirror-fold in this build**, and `#depth-model` names duplicating
that class of math as the thing that produces subtle bugs everywhere
downstream. Two entities want different **bounds**, not different arithmetic: a
lane-centre entity's extreme legal positions are `0` and `lanes-1`, a boundary
rider's are `0.5` and `lanes-1.5`. Folded about the *centre* bounds, a cross
from `0.5` lands back on `0.5` — the entity announces itself as shootable, and
then does not move for a whole crossing window, which is the invulnerability
read in GDD §6.3 failing in the direction the player cannot see. A second
helper would have made that a copy of eight lines with two constants changed,
and the copy is what rots. The parameter has a default, so the Vaulter's call
site is unchanged and is pinned bit-identical to the pre-change build by a
16,856-case sweep (`scratchpad/test-cs005-p1.js`).

**Why a rider is born at a lane centre and crosses onto the lattice.** Not a
feel decision — a *seam* decision. `spawnEnemy(kind, lane, depth)` is the one
entry point (GDD §6.5) and it is a function of three scalars; teaching it which
entities have a lattice would put entity knowledge inside the spawner and would
have to be repeated in `splitLanes()`, in the debug bench, and in every future
caller. So the entity does it, on its first `update()`, where it already has the
`well` it needs. That the result is also the better *read* — a Drifter emerges
from the throat visibly vulnerable and only arms once it settles, at the depth
where the player has the most time — is a dividend, not the reason.

⛔ **`boundaryFrom()` does not go through `laneHop`, and that is not the
duplication the first rule forbids.** They answer different questions. `laneHop`
reflects a whole step about a bound; `boundaryFrom` takes a **half** step from
an **off-lattice** start, and folding an off-lattice start about the lattice
bounds overshoots — `laneHop(Vee, 0, -0.5, -1, 0.5, 11.5)` returns lane `1.5`, a
lane and a half in one cross time, which a soak reads as a teleport. One
reversal always suffices, proven by exhaustion rather than argued: from an
integer centre only two births in a whole well can fail, and every shipped well
is at least eleven lanes wide.

**Why the outermost boundaries are undrawable, which is what makes them
illegal.** The tempting reading is that `laneClamp` would simply refuse them, so
the rule is a restatement of the clamp. It is not. `polyAt()` clamps an open
well's vertex parameter to `[0.5, n - 0.5]`, which is lane `[0, n-1]` — so lane
`-0.5` and lane `n - 0.5` **project to the same points as the lane centres `0`
and `n - 1`**. An entity placed on a wall would be drawn exactly on top of
whatever is standing in the end lane: one silhouette carrying two threats, which
is GDD §1.1 P2 failing at the position where the player has the least room. The
ridable boundaries are therefore the strip's interior rim vertices — `lanes - 1`
of the `lanes + 1` it has. ⚠ A closed well has no walls, so all `lanes`
boundaries are legal and `laneBoundaryHi` is `lanes - 0.5`, which `polyAt`
resolves to vertex 0 the long way round the seam. That asymmetry looks like an
oversight and is forced by the same geometry.

**What this bought, measured.** CS005 P5 mutated a rider's cross to wrap instead
of fold. A range check stayed green (`laneNormalize` clamps the in-flight lane
back into `[0, lanes-1]`) and so did a per-tick lane **speed** bound, because
the cross duration scales with the cross distance — a wrapped cross is not
faster, only longer. The lattice assertion is what went red. ⛔ On a boundary
rider the lattice is not a nicety on top of §17 item 3; it is where item 3
actually stands.

---

## #draw-path-rng

`CLAUDE.md` forbids the draw path from calling `state.rng()`. The rule exists
because the obvious wiring of GDD §3.6's past-99 palette is the bug.

**The two clocks are not the same clock.** `Game.frame()` (23-main.js) runs zero
to `C.MAX_CATCHUP_STEPS` updates and then exactly **one** `draw()`. How many
updates a frame runs is a function of the machine: a 144 Hz display usually runs
zero or one, a stalled tab runs the cap and drops the surplus, and during
hit-stop the loop runs **zero** updates and still draws — `C.HIT_STOP_DEATH` is
1.20 s, which at `C.FIXED_DT` is about seventy-two draws against no simulation
at all. So a `state.rng()` inside `draw()` is a draw count nobody controls.

**And the run has ONE stream** (01-rng.js). The next two things that read it are
`spawnEnemy()`'s heading and `pickSpawnLane()`'s lane, so a draw spent in the
renderer does not corrupt the renderer — it moves every spawn in the run. GDD
§17 item 1's replay guarantee dies, and it dies *silently*: two runs of the same
seed on the same machine at the same refresh rate still agree, so the hash
comparisons stay green and the only visible symptom is that a recorded run
diverges when the frame rate changes. ⛔ **That symptom reads as a physics bug**
— enemies arriving in the wrong lanes after a stutter — and a session hunting it
will look at the spawner, the accumulator and the fixed timestep before it looks
at the renderer.

⛔ **It is also invisible headless, which is why the rule is written down rather
than tested for once.** The suite drives `update()` directly and calls `draw()`
rarely or never, so the ratio that causes the bug is one the tests do not
reproduce by accident. `scratchpad/test-cs006-p1.js` reproduces it deliberately
— 600 `draw()` calls against zero `update()` calls, counted through a proxy over
`state.rng` — and that assertion is the rule's only mechanical guard.

**What the rule costs, and why it is cheap.** One field. `state.bandRoll`
(02-state.js) is drawn in `nextWell()`, which runs inside a simulation step, and
`Game.draw()` hands the value to `drawWell()`. `wellBandColor` takes a **number**
rather than a function precisely so the renderer cannot spend a draw even if a
later session wants one.

**Why the draw is in `nextWell()` and not in `enterWell()`.** `enterWell()` has
three callers — a new run, the next level, and the `w` debug key — and the third
is not simulation. A draw there would let a keypress move the run's stream,
which is the same class of bug seen from the other side; it is why `"w"` is on
the FORBIDDEN key list of three closed soaks. ⚠ `startGame()` is the third
caller and deliberately spends nothing either: GDD §4.6's Start Depth is not
built, and when it is, the changeset that lands it owns the question of what a
run *starting* past level 99 rolls.

---

## #ring-flight

`CLAUDE.md`'s **The Dive** section states the ring flight's rules. This is why
each one is what it is. Landed CS014 P1; every number marked MEASURED was
measured by `PLANNED-FEATURES-CS014.md` at commit `144825e`.

**Why a ring lives on `state.dive` rather than in `state.enemies` or in a third
array.** CS013's token faced the same question and answered it differently on
purpose. A token lives through the *play* pass, so the argument for its own
array was the count of live readers it would have to answer: `state.enemies`
had eight, three of them wrong by default. A ring lives only inside a dive, and
**the Dive short-circuits the gameplay pass** — MEASURED over 133,376 played
steps and 132 completed dives, only **5 of `state.enemies`' 20 reader
functions** run inside one. So T1's central argument does not carry over, and
the case had to be made on the two readers that do run, both of which are wrong
by default and both of which were measured:

- **GDD §4.4's respawn push collapses 3 of 6 rings onto 0.55.** MEASURED by
  calling the shipped `respawnSkimmer()` on a board of six rings at the shipped
  lattice: `0.083, 0.250, 0.417, 0.583, 0.750, 0.917` became
  `0.083, 0.250, 0.417, 0.550, 0.550, 0.550`. The clamp skips only `anchored`
  entities, and a ring's `depth` is a **position** — so `anchored: true` would
  be a lie about what `depth` *means* (`#thorn-depth`), and the only alternative
  is a third exemption in a ⚠ SETTLED rule.
- **`startDive()`'s `anchored` filter drops every ring on the repeat**, which is
  precisely the job that function has: it filters the board down to what belongs
  to the hazard set.

A *third top-level array* was priced too and loses to a field on a bag that
already exists: `test-cs002-p1.js` asserts `state` carries exactly
`test-registry.js`'s inventory, so `state.rings` buys a `STATE_FIELDS` row and a
second reset caller for a lifetime `state.dive` already brackets. MEASURED with
a stand-in build: a field on `state.dive` moved neither the registry nor the
inventory, and a minimal `DiveRing extends Enemy` cost one extra red assertion
(`test-cs012-p2.js`'s "no tick added two entities") **before** it had an
`update`, a `draw`, an `onShot` or an `sfxVoice`.

**Why the rings are lane-bound.** GDD §14.5 calls them "objects at decreasing
depth in a lane-less tube" and names its own concern — "different control model
mid-run". A *literally* lane-less ring is taken by every diver on every dive, so
"you stop earning" has nothing to attach to and the flight becomes a four-second
cutscene that pays. The reading that survives §1.1 P1 is that **the corridor has
no lanes to climb**, which is what the Dive already is, rather than that the
craft has no lane — it plainly has one, and the Thorn strike reads it.

The skill test is then the rim axis, unchanged, and it is a real one. MEASURED:
rotation is already live through the whole dive (`updateDive()` calls
`state.skimmer.update()`), and the craft rotated in **90 of 132 dives**;
a half-well traverse takes **0.571 s**, which does **not** fit inside
`C.DIVE_GRACE` 0.35 s — so a ring the player must cross for is a ring they can
miss, and one in reach is a ring they can take.

**Why the arc walk is a fraction of the well and goes through `laneHop()`.**
Two constraints fix it. The lattice may spend no draw (a dive spends **zero**,
`test-cs006-p3.js`) and may not read the level or heat (CS014 R6) — so it is a
function of the well and of constants, and of nothing else. It may not read the
craft's lane either: a set measured from where the player happens to be standing
makes its first ring free on every dive, which is the lane-less ring again under
another name.

`C.RING_LANE_STEP` is a **fraction of the well** rather than a lane count so the
walk asks for the same *share* of the rim on a 5-lane well and a 16-lane one; an
absolute step degenerates on a narrow closed well, where `laneDelta` makes four
lanes the short way round into one. At the shipped 0.25 the widest well walks
4.0 lanes per ring, and a ring's near edge is 2.5 lanes away across the
**0.6083 s** between crossings — 4.1 lane/s against `C.KEY_SPEED_MAX` 14, which
an attentive diver clears and an ill-placed one does not.

The walk uses **`laneHop()`** because it is the build's one mirror-fold and the
one place a wall is understood (GDD §3.5). `laneNormalize()` would *clamp*, and
a clamp piles the tail of the walk onto one wall — MEASURED on the 7-lane Fan at
0.25, rings 4 and 5 both land on lane 6. A fold turns the walk around instead,
so two rings near a wall can sit close together; that is the fold behaving, and
it is the same behaviour every hopper in the roster has.

**Why the take pass sits above the strike test and above the completion check.**
The strike's own reason, verbatim: the last step of a descent is at depth 0,
which is at or past every ring. A take pass below the completion check would
never resolve the deepest ring, and one below the strike would silently unpay a
diver who crossed a ring on the step a Thorn killed them.

**Why a ring pays an unmultiplied literal.** GDD §7's rule is that *what is
multiplied is exactly what builds it* — kill points at the four kill sites. A
ring is not a kill and a Dive is not a kill site, so this is that rule working
rather than an exception to it, and it is the Bounty's answer (CS013 T6) and the
Thorn chip's. Multiplying it would matter: MEASURED over 108 scored wells, the
multiplier in force **at the clear edge** averages ×2.57 and reaches ×8, and it
HOLDS through a Dive (CS012 O5) — so a multiplied set would be worth up to
eight times its face value on the very dive that follows the well that earned
it. At the shipped 100 a ring, six rings are **8.3 %** of a median well (7,200,
MEASURED); at ×8 they would be 67 %.

**Why "you stop earning" is an absence rather than a penalty.** A missed ring
pays nothing and costs nothing: no miss counter, no streak, no bonus for a full
set. A set is six calls or fewer and that is the whole mechanic — which is what
keeps GDD §14.5's "no failure state beyond 'you stop earning'" literally true
while §4.5's item 5 stays live in both modes. Those two are not in conflict:
"no failure state" is read as *the ring flight adds no new one*. Removing item 5
in Overdrive would break a shipped guarantee (GDD §4.5, §19), make §19's Core
row mode-conditional, and leave the Overdrive dive with no hazard at all —
MEASURED, item 5 fires on 5.3 % of dives against a driver that does not steer,
and 0 % against one that does, so it is cheap to keep and it is the only thing
that makes the beat a skill test rather than a pause.

---

## #entity-phases

`CLAUDE.md`'s **Math and lifecycle** section carries four rules that all say the
same thing from different sides: **a phase is not a depth, and a variant is not
a new class.** ⚠ **The valve fired on that section at Paul's direction, in its
own commit after the CS014 close** (2026-09-20) — it stood at **7.0 KB** against
the ~4 KB line, which made it the largest single tax on every session in the
project, and these are its reasons. ⛔ **Nothing here was deleted from `CLAUDE.md`; the rules stayed and
the reasoning moved.** Landed CS012 P5, CS013 P3 and CS013 P4.

### Why the Jump is a phase and the Skimmer has no `depth`

The obvious build of a vertical escape axis is a `skimmer.depth` that is 1
except while airborne, compared against each enemy's `killDepth` in the one
collision pass. ⛔ **It was not built that way, and the reason is that the
collision pass would have grown a second kind of comparison.**

`collideSkimmer()`'s header has said since CS003 that *there is no term here for
where the Skimmer is* — the pass is `e.depth >= e.killDepth` plus a lane match,
and the craft's position is the LANE alone. A craft depth would have made it
two depths, and the build's ONE two-depth comparison is the dive strike's
(`11-dive.js`), where a position is compared against a LENGTH. That singularity
is what `anchored` exists to record (`#thorn-depth`), and it is asserted by
`test-cs013-p3.js`.

⛔ **What `collideSkimmer()` does instead is return at once while `phase` is
`"air"`**, which covers **all seven contact killers and the rim sweep in one
line** rather than seven `killDepth` comparisons that each had to be got right.
⚠ **Four shipped comments in `src/` and two GDD sections had predicted the
opposite for three changesets** and were corrected in the commit that landed it
— which is why the rule now says, in the imperative, ⛔ *do not give the Skimmer
a `depth` to make a resting `killDepth = 0` "honest"*: there is nothing left in
the build that would be made honest by it.

**Why `updateJump()` is a TOTAL no-op outside `modeHas("jump")`**, writing
nothing at all — `latched` included. The weaker version (run the state machine,
suppress the effect) leaves a Classic run whose hash depends on whether the
player was holding the jump button, which is a silent determinism break of
exactly the kind `#draw-path-rng` describes. The total no-op is what lets
`test-cs012-p5.js` assert a Classic run is bit-identical with the button held.

**Why the lift and the shadow are draw-time only.** `skimmerPoints()` takes a
lift; `lane` and the depth model are untouched. The proof is `C.JUMP_LIFT` at 0
leaving the state hash unmoved, which makes the whole airborne silhouette a
free tuning knob — the same proof CS014 P2's `C.DIVE_RUNG_ALPHA` and
`C.RING_ALPHA` reuse.

### Why `aloft` is a ninth contract field and not a depth above 1

The Warden lives ABOVE the well. The tempting encoding is `depth > 1`, and
⛔ **it breaks the depth model rather than extending it**: `depth` is normalized
0 = throat, 1 = rim, and every reader in the build — `screenPos()`, the
perspective curve, `shotAlpha()`, the readability contract — is written against
that range. One entity outside it makes every one of those a special case.

So the Warden's `depth` stays **1**, a POSITION, and a separate boolean says
where it is relative to the well. ⛔ **It has exactly two readers**:
`collideShots()` SKIPS an aloft entity — a shot never meets one, so an
unshootable entity does not shield the rim band behind it — and `jumpStrike()`
REQUIRES one, which is what makes the fourth kill site a lane match on two
flags rather than a third depth comparison.

⛔ **And it exempts nothing else, deliberately.** `anchored` stays `false`, so
GDD §4.4's respawn push reaches a Warden and ends its lift-off; a discharging
Warden still kills through the one `killDepth` comparison; `purgeTarget()`,
`respawnSkimmer()`, `dangerInputs()`, `threatCount()` and `wellCleared()` all
read it as an ordinary entity at depth 1, and the array is still one. ⛔ **A new
reader that wants to exclude an aloft entity must say so itself** — a field that
starts exempting things by default is a second entity array with extra steps.

### Why the Mimic's budget is its two states and not a counter

"At most one reflection per opening" could be a `reflected` latch, a cooldown,
or a per-well quota. ⛔ **It is none of them, because the two states already
bound it structurally**: a closed Mimic consumes a shot and sends it back once,
that reflection is the only thing that OPENS it, and an open Mimic reflects
nothing. There is no state in which a second reflection is reachable, so there
is nothing for a latch to guard.

⚠ **The number that makes this matter is the fire rate.** Held fire meets a
Mimic about fifteen times a second, so any guard written as a *duration* is a
guess about how many shots arrive inside it, and any guard written as a *count*
is a second source of truth for something the phase already answers.

⛔ **The opening is UNCONDITIONAL and `sfx("reflect")` is not**, and the
asymmetry is deliberate. The shot was consumed either way, so the Mimic opens
whether or not the reflected bolt could be spawned; but a spawn refused at
`C.ENEMY_CAP` is a **lost beat for the Mimic**, never a guard the player paid
for and did not get, so it makes no sound. That is `Weaver.fire()`'s own rule
for its bolt, reused rather than re-argued.

⛔ **`C.MIMIC_APEX` is BOUNDED, not tuned.** A reflection must give the player
at least the Surger's fuse before it can kill, so the apex the bolt is born at
is capped by
`(1 − RIM_CONTACT_DEPTH) − SURGE_TELEGRAPH × (MIMIC_SHOT_RATIO / SHOT_TIME)` =
**0.4308**, against the shipped 0.40. It is asserted from the constants and on
played boards, so raising either it or the ratio turns the suite red rather than
quietly making a reflection unfair — which is GDD §14.6's "hard sell" answered
in arithmetic rather than by playtest.

### Why a projectile may be a parameter variant

`MimicShot extends WeaverBolt`, and the whole of the difference is one
overridable reader plus a draw. ⛔ **The refactor that made it possible was
turning `C.WEAVER_BOLT_SPEED` from an inline constant into `speed()`**, named
ONCE in the build inside that reader — and it is still never scaled by
`climbMult()`, because a slower bolt breaches GDD §4.4's respawn guarantee
(`CLAUDE.md`, Config).

The variant inherits the rim band, `blocksClear: false`, the self-termination at
depth 1, the declined shot and 0 points, which is the Reaver's relationship to
the Vaulter one layer down the hierarchy.

⛔ **A speed refactor is proved by a HASH, never by reading.** Moving a constant
into a method is exactly the class of change that looks obviously equivalent and
is not — an evaluation-order or a rounding difference does not show up in a
diff. The proof is a Classic run bit-identical against a build carrying the old
line, and it is cheap; reading the two forms is not a proof at all.

---

## #compaction

**`CLAUDE.md` was compacted at Paul's direction on 2026-09-20**, after CS015 P1,
from **47,919 to ~34.6 KB**. He asked whether it made sense that the file kept
growing, and directed it made as efficient as possible without losing quality or
consistency. ⛔ **No rule was deleted.** What left it was of three kinds, and all
of it is below, verbatim or near it, under the anchor each `CLAUDE.md` section
now names:

1. **Reasons** — why a rule exists. They moved here.
2. **History** — plan-letter codes (O2, T7, RF4, W4, MI1 …), "used to", the
   phase that landed a rule, measurements that justified it. Those point into
   `archive/` and `log/`, which are not session context, so they cost every
   session and served none. The phase is recoverable from `git log -S`.
3. **Repetition** — the same fact in two sections (`C.GAME_ID` is not a board id;
   the one two-depth comparison; the Dive's termination kill pays nothing). Each
   is now stated once.

Why the file had grown: every changeset since CS009 added invariants, which is
legitimate, but each arrived wrapped in its provenance and its argument, because
the phase that wrote it had just made that argument. The ceiling rule only moved
reasons out of sections over ~4 KB, and only on an edit, so a 2 KB section that
was half reasoning never qualified. The new ceiling rule states the FORM a rule
takes — shortest complete statement, reasons here, history in `log/`, a fact
once — so the file grows by rules, not by their arguments. ⚠ The valve and the
ban on standing sweeps are unchanged; this was one directed pass, like the
2026-09-20 valve on `### Math and lifecycle`.

Reasons with no better home, by the `CLAUDE.md` section they came from:

- **Math and lifecycle.** Writing 2-D geometry into entity logic is the single
  most common source of subtle bugs here (`#depth-model`). Clamping the player
  but leaving enemy AI wrapping produces enemies that teleport across the well.
  Breaking the draw-path RNG rule reads as a physics bug. The Skimmer gets no
  `depth` even to make a resting `killDepth = 0` "honest". The Purge does not
  route through `onShot`: a panic button that doubles the enemy count is not a
  panic button.
- **Scoring.** GDD §7 once said "three kill sites, and no fourth"; the jump
  strike corrected it rather than stretched it. A ring is the Bounty's row, not
  an entity price, so `09-collision.js` was not edited for it, and its crossing
  an extra-life milestone is `addScore()` being the one writer and the one
  life-awarder, unchanged. The combo is not unified into `addScore()` because it
  would silently multiply all four unmultiplied payouts.
- **The Dive.** A world zoom was MEASURED unavailable (×1.10 on the widest well),
  which is why the visual adds no camera. The take pass sits above the strike
  test for the strike's own ordering reason (`#ring-flight`).
- **Shape.** `fetch()` and `import` both fail on `file://`; the module-bridge
  exception fails there by design; no leaderboard module means the game plays
  with no leaderboard. Without `noopener` an opened page gets a live handle back
  into the game.
- **Test rules.** `_harness.js` owns building, loading `dist/`, the env stubs and
  the assertion counters. When an assertion is rewritten in place, the closed
  phase still owns the *claim*; only the mechanism moved. The seed goes above
  everything because some nondeterminism is spent at module-evaluation time.

---

## #vocabulary

Atari owns the original's trade dress and terminology, and has enforced it — it
blocked Jeff Minter, co-creator of the 1994 sequel, from shipping *TxK* ports.
The mechanic is not protectable; the words and the look are the exposure. A
variable named after a banned word is a legal exposure, not a style problem.

The scan became a substring scan on 2026-09-20 (Paul's call, before CS015 P3's
43 save-data ids): a whole-word `\b` test missed a banned word joined by `_` or
camelCase. "web" alone excepts `webkit`, the browser's `webkitAudioContext`.

---

## #session-rules

- **All three session kinds happen in Claude Code, planning included** —
  `DECISIONS.md`, 2026-08-31.
- **MEASURED vs PREDICTED (3b).** Mixing them silently is what made
  `PLANNED-FEATURES-CS006.md`'s three false predictions expensive —
  `DECISIONS.md`, 2026-08-31. "How many pointers does this renumber touch",
  "does this move that baseline", "does that closed test already assert the
  opposite" are each one command.
- **Recommendations are taken (3)** — Paul, 2026-09-23 (`DECISIONS.md`): he
  had agreed with almost every recommendation, and stopping for each one was
  the slowest part of a phase. What stays is the recording: a taken call is
  written where he reads it, so reversing one is an edit, never an archaeology.
- **The doc, not the conversation (3c).** The plan and the build are separate
  sessions, and the gap between them is a check, not an inconvenience.
- **Reasoning goes to `log/` as the phase goes.** `CLAUDE.md` once sent a phase's
  reasoning to `log/` and simultaneously denied a build phase the file; CS007's
  three `STATUS.md` entries came to 1,551 words against a 600 budget because of
  it.
- **The close's review is the point**: it is the one pass that reads every phase
  together and catches what two phases said differently.

---

## #config

- **`climbMult()` is the one multiplier on all five climbs** because that is what
  keeps GDD §4.4's respawn guarantee a single arithmetic statement;
  `test-cs007-p2.js` asserts it and the accessor rule off the built file, so a
  direct read turns the suite red.
- **`heat(1)` is exactly 0** so every derived value is its own level-1 base at
  level 1, which makes every level-1 test in the suite provably unreachable by
  the clock.
- **A slower bolt breaches the respawn guarantee**: a pushed bolt reaches its kill
  band inside the invulnerability window and is safe only because it
  self-terminates at depth 1 first.
- **`C.CLIMB_MAX_BASE`** is named once so a future faster entity cannot escape the
  guarantee's assertion silently.
- **A row for `thorn` or `weaverBolt`** would put a parentless entity in the
  throat.
- **The draw rule.** `rngPick()` on a single-element array still advances the
  run's one stream, which is shared with every spawn lane — so a draw spent at
  levels 1–2 moves `GOLDEN_LANES`, whose whole window lives there.
- **No cargo weight table (SETTLED).** GDD §8's "cargo weights shift toward
  Drifter/Surger" is delivered by arithmetic: the three Carrier variants are three
  schedule rows, so cargo is 100 % Vaulter at L3–17, 50/50 at L18–22, 33/33/33
  from L23. The missing table is a decision, not a gap.

---

## #readability

Nothing opaque below `C.READABILITY_DEPTH` because that is what a well-known
successor of the original was criticised for violating, and it is the difference
between a game that feels tense and one that feels unfair.

---

## #tokens

A token is not an enemy on `state.shots`' precedent: a second array none of
`state.enemies`' readers sees. The jump strike inherited the token roll with the
rest of its kill line (CS013 P5's review). The Classic no-op is what keeps
`P1_DETERMINISM_HASH` and every Classic soak unmoved. `pierce` is copied at fire
time so a lapsed Lance cannot reach a shot in flight; the Thorn's per-chip
payment keeps both closed chip decoders reading a 3× chip unedited.

---

## #audio

- **`scheduleStep` never consults intensity**: that is what makes note timing
  provably fixed regardless of what the director does.
- **The solo test**: a layer that only makes sense inside the stack is texture,
  and texture is what produced the mud last time (`#music-layers`).
- **Tier 1..4**: `f >= undefined` is always false, so a tier-5 layer would be
  permanently silent.
- **The `AudioSys.ctx` guard**: nothing starts before the first user gesture, and
  the headless suite is safe.
- **The high-pass before the limiter**: sweep and high-pass are both tone
  controls on the programme, so the limiter sees the sound the game asked for.
  A fixed Butterworth `Q` has a flat response at or under unity, which keeps
  `test-cs009-p5.js`'s headroom model (D16) standing unedited.
- **Struck, never swelled**: a pad that fades in is the sound Paul rejected. It
  applies to `drive` and CS010's layers as to every other.

---

## #save-data

- Renaming a key silently wipes player data; a `migrate` returning `undefined`
  leaves the stored bytes standing.
- `legacyRosterKey: null` keeps kit-profile's `afd_*` import path from running;
  an empty string imports `afd_profiles_v1`.
- A switch resets before it loads because the load path is written for a cold
  boot: loading alone bleeds the outgoing profile's settings onto the incoming
  one.
- The `getRandomValues` fallback exists because an opaque origin (sandboxed
  embed) is never a secure context, and `randomUUID` is secure-context-only.
- An achievement id is save data however dated its spelling looks: renaming one
  drops that unlock for every player.

---

## #kit

- The boundary contract mirrors the kit's own hard constraint in reverse ("no game
  code lives here, ever"). A module that violates it is not extractable, and
  extraction is the whole point.
- A kit fix is made in `lib/` deliberately, so the change is exercised by a real
  game before it lands in the shared repo.
- The `.NOTES.md` is the backport packet: a reviewer merging into coinless-kit
  reads one file, not this game's decision history. A producing module's notes
  double as its draft kit documentation, so extraction is copying code and notes,
  not writing a doc from scratch — which is why these modules are kit-shaped from
  v1: extraction is a copy, not a rewrite.

---

## #tools

Each lab duplicates whatever slice of game logic it needs; drift there can only
produce a bad preview, never a bad build.

- **music-lab**: SOLO, MUTE, the PASS/FAIL mark, the TEMPO ladder, INTENSITY (the
  real bar-latched setter and the sweep), TIER per PASS layer, and COPY TABLE,
  which writes `tier`. It plays through the game's limiter.
- **sfx-lab**: 2–3 candidates per event, ▶ alone, ▶ in context, a picked mark and
  COPY OUT. Its BLOCK A, B and SFX are `16-audio-engine.js`, `17-audio-tracks.js`
  and `00-config.js`'s SFX group.
- **feel-lab** measures rather than demonstrates: traverse-and-stop time,
  overshoot and settle time across `MOUSE_SENS`, `KEY_TAP_MS`, `KEY_RAMP` and
  `GAMEPAD_SENS`; reachable over LAN via `npm run serve` (`tools/serve-lan.js`)
  for the on-hardware phone pass.

# PLANNED-FEATURES-CS006 — The well ends

**Changeset:** CS006 · **Baseline:** CS005 closed at `de9643a`
**Covers:** GDD §3.3, §3.4, §3.6–3.7, §5, §4.5 item 5, §16.3
**Does NOT cover:** GDD §8, §8.1, §15.6 — see "Two changesets, not one" below.

---

## Why this changeset exists

Five wells have shipped a spawner, a roster and a collision pass. None of them
has ever *ended* properly. `C.WELL_CLEAR_HOLD` is a one-second pause standing in
for GDD §5's Dive; well progression walks `(level-1) mod 16` forever with no
past-99 branch; the band renderer is wired end to end and has never been handed
a lit lane; and one of the sixteen wells does not draw.

CS006 is the changeset that makes a *level* a thing with a beginning and an end.

---

## ⛔ Two changesets, not one

`ROADMAP.md` scopes CS006 as five systems: the Dive, well progression and colour
bands, the heat clock, the introduction schedule, and telemetry. **That is two
changesets and the seam is obvious once the files are counted.**

| System | Files it touches |
|---|---|
| Well progression, bands, `laneState` | `02`, `13`, `23` |
| `throatOffset` / the Flat well | `00`, `03` |
| The Dive | `00`, `02`, `11`, `23` |
| **The heat clock** | **`00`, `07`, `08`, `23`** |
| **The introduction schedule** | **`00`, `08`** |
| **Telemetry** | **`00`, `02`, `21`, `23`** |

The two halves share exactly one file, `23-main.js`, and they share it in two
different functions. **CS006 is the well; CS007 is the run.**

Four reasons, in the order they bite:

1. **CS004 and CS005 each carried one system plus its machinery. This carries
   five, and three of them are individually the size of a CS005 phase.** The
   spawner-stall call alone is a design decision, a deleted constant, two closed
   test files' fixtures, an RNG-spend rule and a re-recorded golden. That is a
   session, not a phase item.
2. ⛔ **Both halves move `test-cs004-p1.js`'s `GOLDEN_LANES`.** The Dive changes
   when level 2 starts inside the golden's 3,000-tick window; heat changes the
   spawn interval; the schedule changes the draw count per spawn. Splitting means
   two re-records instead of one — which is the split's real cost, and it is
   worth paying, because a re-record is the one moment a stray RNG draw can be
   laundered into a new baseline. Two *small, separately-reasoned* re-records are
   safer than one large one that absorbs three unrelated causes at once.
3. ⛔ **CS006 already has to edit four closed test files** (see Hazard 1).
   Adding heat and the schedule adds two more, in the same commit, with the same
   `run-all.js` output to read. That is how a real regression gets waved through
   as "expected churn."
4. **The heat clock's guard is written in `respawnSkimmer()`, which the Dive
   changes.** Heat has to land *after* the Dive, not beside it.

**The seam:**

| CS | What ships | GDD §§ |
|---|---|---|
| **CS006** | The well ends: past-99 progression, the band roll, `laneState` and the dim band, `throatOffset` and the Flat well, the Dive and GDD §4.5 item 5 | §3.3, §3.6–3.7, §5, §4.5 |
| **CS007** | The run escalates: `heat()`, every derived value, the introduction schedule, the spawner-stall call, telemetry as the instrument | §8, §8.1, §15.6 |

CS007 onward renumbers +1. `ROADMAP.md` says this is cheap and it has been done
twice; **P0 below is the sweep.**

⛔ **Telemetry stays with heat and does not move to CS006.** `ROADMAP.md`
assumption #3 puts it here because it is a difficulty-tuning instrument. An
instrument built one changeset before the thing it measures ships with a column
list that has to be edited the moment heat lands — and `TELEMETRY_FIELDS` and
`push()` must be edited *together* (GDD §15.6), so that is exactly the edit worth
not making twice.

---

## Scope check against what CS005 actually shipped

Seven findings. Five change what CS006 builds; two change what CS007 builds and
are recorded here because this is the changeset that found them.

### 1. GDD §3.6–3.7 is ~90% built. The work is a producer, and it should be gated

`src/13-render-well.js` ships `drawWell(ctx, well, level, laneState, rng)` wired
end to end. `wellBandColor()` handles all seven bands **and** the past-99 palette;
`wellBaseAlpha()` handles the dim band at `C.DIM_BAND_ALPHA`; `isLaneLit()` reads
`occupied` / `shotTravel` / `surgeCharge` off a sparse per-lane array, and the
spoke loop already resolves the closed-wrap and open-end neighbour cases.
`Game.draw()` passes `null` and `0`.

So the roadmap line for §3.6–3.7 is **spent except for two producers**, and one
of them is three lines.

⛔ **And the `laneState` producer must be gated off outside the dim band.** Read
the alpha arithmetic: a lit spoke draws at `Math.max(baseAlpha, C.LANE_LIT_ALPHA)`
= `max(1.0, 0.9)` = `1.0` at every level outside 65–80 — **identical to unlit.**
Lane lighting is visible in exactly sixteen levels, and `DECISIONS.md` carries
⛔ *no tuning time is spent on the dim band*. Building an unconditional per-frame
per-lane pass for an effect that is a no-op at 83 levels out of 99 spends the §17
perf budget on nothing.

The gate is one branch in `Game.draw()`:

```js
const lit = wellBaseAlpha(state.level) < 1 ? buildLaneState(state, well) : null;
drawWell(ctx, well, state.level, lit, state.bandRoll);
```

`drawWell` already handles `null`. No renderer change at all.

### 2. ⛔ The `rng` argument to `drawWell` is a determinism trap. Confirmed

I checked it rather than taking it on trust, and the mechanism is worse than the
brief says.

`Game.frame()` runs **0 to `C.MAX_CATCHUP_STEPS` (5)** updates and then **exactly
one** `draw()`. Three separate ways the ratio is not 1:1:

- a slow frame runs up to five updates and one draw;
- a fast frame runs zero updates and one draw;
- ⛔ **hit-stop spends the step without simulating** and `draw()` still runs — so
  `C.HIT_STOP_DEATH` 1.20 s is ~72 draws against **zero** updates.

`state.rng` is the run's ONE stream (`02-state.js`). A `state.rng()` call inside
the draw path advances it on a *frame* clock, and the two things that read it
next are the spawn lane and the spawn heading. GDD §17 item 1's 10,000-tick hash
would go non-deterministic **as a function of frame rate**, and the symptom is
enemies appearing in different lanes — which reads as a physics bug, not a
rendering one. Worse, it would be *reproducible headless* (where `draw()` is
never called) and *irreproducible in a browser*, which is the most expensive
shape a bug can have.

⛔ **The rule, and it is general, not about `drawWell`:**

> **Nothing in the draw path may call `state.rng()`.** A random value the
> renderer needs is drawn in the simulation, stored on `state`, and read by
> `draw()`.

⛔ **And the draw belongs in `nextWell()`, not `enterWell()`.** `enterWell()` has
three callers and one of them is the `w` debug key. A draw there would let a
debug keypress move the run's stream — which is precisely why `"w"` is on the
`FORBIDDEN` list in three closed soaks. `nextWell()` has one caller and it is the
level clock.

⛔ **Two more things CS006 adds to the draw path, checked against the same rule:**

- `buildLaneState()` reads `state.enemies` and `state.shots` and draws nothing.
  Safe. ⛔ It must write into a **preallocated** array (§17: no per-frame
  allocation in the hot path), sized to `max(well.lanes)` = 16 and cleared, never
  `new Array(well.lanes)` per frame.
- The Dive's camera widen and doppler are presentation. ⛔ The Dive's *descent*
  is simulation and is stepped in `update()`. If the widen is ever given a random
  jitter, it takes a value stored at dive start, not a draw at paint time.

### 3. ⛔ The Flat well does not draw, and the Stair is the second case

`STATUS.md` has this as one open call. It is two, and I measured both.

The Flat well's rim is thirteen vertices all at `y = 0.3`. Its centroid is
therefore `(0, 0.3)`, and `wellThroat()` scales the rim *toward the centroid*, so
every throat vertex is also at `y = 0.3`. **Rim, throat and all thirteen spokes
are collinear.** The well renders as a single horizontal line and an enemy at
depth 0.5 draws on top of the rim.

Then I swept the other fifteen. Minimum lane-centre spoke length, at
`C.WELL_RADIUS` 300:

| Well | min lane spoke | max | ratio |
|---|---|---|---|
| **11 Flat** | **23.6 px** | 283 px | **12.0** |
| **9 Stair** | **30.4 px** | 364 px | **12.0** |
| 14 Double-Vee | 76.5 px | 376 px | 4.9 |
| 16 Twist | 73.9 px | 283 px | 3.8 |
| 15 Fan | 85.1 px | 302 px | 3.6 |
| 12 Heart | 106 px | 283 px | 2.7 |
| *(all others)* | ≥ 121 px | — | ≤ 3.5 |

The Stair has the same disease for the same reason: its rim vertex 6 is `(0, 0)`
and its centroid is `(0, -0.108)`, so lane 5's spoke is a tenth of the length of
lane 11's. **An enemy climbing Stair lane 5 covers 30 px of screen in the same
5.5 seconds a lane-11 enemy uses to cover 364 px.** It is stationary and then it
kills you. That is pillar P2 failing, and it is the same failure the Flat has,
just not total.

⛔ **`throatOffset` is what fixes both, and `wellThroat()` already implements it**
— `03-wells.js` reads `well.throatOffset.{x,y}` and defaults it to zero. What is
missing is a *definition*: GDD §3.3 lists the field and never says what it
offsets. CS006 defines it, in one sentence, as what the code already does:

> ⛔ **`throatOffset` translates the throat polygon in normalized rim space,
> applied after the centroid scale.** It is the escape hatch for a rim whose
> centroid lies on or near the rim itself. Absent means `{x: 0, y: 0}`, so a well
> that omits it is not a special case.

Measured candidates (P2 lands the final numbers against `well-lab`):

| Well | offset | new min | new max | ratio |
|---|---|---|---|---|
| Flat | `{x: 0, y: -0.50}` | 152 px | 300 px | 1.98 |
| Stair | `{x: 0, y: -0.35}` | 80 px | 385 px | 4.84 |

Both land inside the family the fifteen working wells already occupy, and the
Stair's 4.84 is below the Double-Vee's shipped 4.9.

⛔ **This is a rendering change and it cannot move the determinism hash.** Entity
position is `(lane, depth)`; screen position is derived at paint time
(`RATIONALE.md#depth-model`). Nothing in the simulation reads a spoke length. P2's
test asserts that, rather than assuming it.

⛔ **And the fix gets a headless gate**, in the shape CS005 P2 used for the
Drifter's three-channel read: an art rule that rots silently becomes an
assertion. `C.MIN_LANE_SPOKE_PX` (60) with the §17 item 2 geometry test walking
all sixteen wells × every lane centre. 60 px passes the Twist at 74 and fails the
two broken wells at 24 and 30, with no well sitting inside 20 % of the line.

### 4. The Dive replaces `WELL_CLEAR_HOLD`. Confirmed, and it moves in the loop

`C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch at the foot of
`Game.update()` are the Dive's placeholder and they go. Confirmed by reading the
branch: it is *literally* "a beat between the last kill and the next well," it
counts up, and it resets when the well stops being clear. That is the Dive's job
description.

⛔ **But the Dive does not sit where the hold sat.** The hold is a branch at the
*bottom* of `update()` that falls through the whole gameplay pass every step. The
Dive **short-circuits**: during a dive there is no spawner, no enemy pass, no
Purge, no `collideSkimmer`, no well-clear check. So it is two edits, not one:

```js
// near the top, after the game-over stop and state.time
if (state.dive.active) { updateDive(state, well, dt); return; }
...
// at the foot, where the hold branch was
if (wellCleared(state)) startDive(state);
```

The hold's field, its constant and its branch are all deleted. Nothing is left
beside anything.

### 5. ⛔ The Dive is NOT Thorns-only. A Weaver bolt survives the clear

Paul's reading — *"a well is cleared before a Dive, so the only thing in it is
Thorns"* — is right about Thorns and **wrong about the bolt**, and this is exactly
the kind of thing worth checking rather than assuming.

`WeaverBolt` ships `blocksClear = false` (`07-enemies.js:656`), deliberately and
with a comment: *"a bolt in flight must not hold a cleared well open."* So
`wellCleared()` returns true with a bolt travelling, and the bolt carries
`killDepth = 1 - C.RIM_CONTACT_DEPTH` and is climbing toward the rim the player
is about to leave. GDD §5 clears *the player's* in-flight shots and says nothing
about enemy projectiles.

⛔ **Resolution: dive start clears `state.shots` and filters `state.enemies` down
to `anchored` entities.** Read off the contract field, never a class name. Today
`anchored` is exactly `Thorn`, and the rule generalises correctly, because
`anchored` means "`depth` is a length" and the Dive's hazard is *the lane extent*.
GDD §5's ⚠ SETTLED "in-flight shots are cleared at dive start" is unchanged and
now has a stated companion.

⛔ A future entity that is `blocksClear: false` and not `anchored` must decide
explicitly whether it survives a dive. That joins GDD §6.5's wiring list as a
seventh point.

### 6. The Dive gives the *dive* a depth, not the Skimmer — so nothing reopens

`DECISIONS.md` carries the CS005 P2 call that the Drifter's `killDepth` is the rim
band, with the note that `0` becomes honest *"the moment the craft can leave the
rim."* Both `07-enemies.js` and `09-collision.js` name GDD §5's Dive as one of
the two candidate moments.

**It is not that moment**, and for a sharper reason than "only Thorns are left":

⛔ **`collideSkimmer()` does not run during a dive at all.** Finding 4 short-
circuits the whole gameplay pass. So the pass whose header says *"there is no
term here for where the Skimmer is"* never sees a Skimmer that has one, and the
sentence stays literally true.

⛔ **And the descent depth lives on `state.dive`, not on the Skimmer.** A
`skimmer.depth` field that is `1` except for 2.6 seconds is a field two systems
can disagree about; a `state.dive.depth` that only exists while `state.dive.active`
is one that cannot. `05-skimmer.js` is untouched by this changeset.

⛔ **The prediction is therefore deferred to GDD §14.2's Jump, and both comments
must say so.** Jump *is* the moment: the craft leaves the rim while the collision
pass is running, and `collideSkimmer` gains a second depth term. That is CS012's
(post-renumber) and it is not this changeset's.

### 7. GDD §4.5 item 5 needs a dive-phase strike test, not a `killDepth`

The last unwired death condition. It is **not** a `killDepth` and the Thorn's
`killDepth` stays `null`:

- a Thorn's `depth` is a **length** — the extent `[0, thorn.depth]` rooted at the
  throat (`anchored`);
- the dive's `depth` is a **position**, running 1 → 0;
- so the strike is `dive.depth <= thorn.depth && laneHit(well, thorn.lane, dive.lane)`
  — **the only two-depth comparison in the build**, which is why it lives in
  `11-dive.js` and not in the one collision pass.

A long Thorn is struck early in the descent and a short one late. That is the
right read: thorn length *is* the hazard, exactly as GDD §8 intends when it makes
Weaver thorn length a difficulty axis.

---

## ⛔ Handover to CS007 — findings this changeset does not act on

Recorded here because CS006 is the changeset that found them, and CS007's spec
will be written from this section.

### H1. ⛔ Heat breaks the respawn guarantee, and the guard is a derived push

`RESPAWN_PUSH_DEPTH` 0.55 is chosen so a pushed enemy cannot climb back into
contact before `RESPAWN_INVULN` expires. The arithmetic:

```
(1 - RIM_CONTACT_DEPTH - RESPAWN_PUSH_DEPTH) / climb  >  RESPAWN_INVULN
(1 - 0.05 - 0.55) / 0.18 = 2.22 s  >  1.5 s          ✓ at VAULT_CLIMB
```

The margin is 0.72 s and it is spent by a climb multiplier of **1.48×**. The
binding entity is the Vaulter at 0.18 (Carrier 0.11 → 2.42×, Drifter 0.13 →
2.05×, Surger 0.15 → 1.78×).

⛔ **The guard is not a clamp on the multiplier — it is a derived push:**

```js
function respawnPush() {
  const worst = C.CLIMB_MAX_BASE * climbMult();        // the fastest contact-killer
  const need  = (1 - C.RIM_CONTACT_DEPTH) - worst * C.RESPAWN_INVULN * C.RESPAWN_PUSH_MARGIN;
  return Math.min(C.RESPAWN_PUSH_DEPTH, need);
}
```

The guarantee is the spec and the number is derived from it. Monotone-safe — the
push can only ever move an enemy *away* from the rim, which is the property GDD
§4.4's ⚠ SETTLED clamp rests on. At a `CLIMB_MULT_MAX` of 1.40 it evaluates to
0.55 unchanged until level ~90 and to 0.534 at 99, so it is inert across the whole
tuning band and engages only in the marathon.

⛔ **And the §17 assertion becomes a property over the range, not a constant
pair:** `for level in 1..200, (1 - RIM_CONTACT_DEPTH - respawnPush()) / (CLIMB_MAX_BASE * climbMult()) > RESPAWN_INVULN`.
Strictly stronger than CS005's two-constant form, and it never needs retuning.

### H2. `SURGE_DISCHARGE < RESPAWN_INVULN` survives untouched, if heat is disciplined

GDD §8 lists **surge frequency**, which is `SURGE_INTERVAL`. It does not list
discharge duration. ⛔ So heat scales `SURGE_INTERVAL` and never `SURGE_DISCHARGE`,
and `test-cs005-p3.js`'s constant-pair assertion **stays green and is not
edited.** CS007 adds the general form in its own file.

⛔ **And the same discipline protects three closed soaks for free.** Their
per-entity lane-speed bounds are derived from `C.DRIFT_CROSS_TIME`,
`C.VAULT_HOP_TIME` and friends. If heat scaled a *crossing duration* every bound
would have to be re-derived through the multiplier, in files CS005 deliberately
did not edit. It does not need to:

> ⛔ **Heat scales intervals, climb rates and the Weaver's apex. It never scales a
> crossing or hop duration.** `VAULT_HOP_TIME`, `DRIFT_CROSS_TIME` and
> `DRIFT_RIDE_TIME` are untouched by the clock.

`DRIFT_RIDE_TIME` in particular is the armour budget and `00-config.js` carries a
⛔ on raising it.

### H3. `DIFFICULTY-NOTES.md` survives in shape and fails in detail

The one document in the repo never exercised. Its curve matches
`00-config.js`'s four constants exactly and `heat(1) = 0`, so every derived value
is its base at level 1 — that part is right and is worth keeping. **Four of its
seven rows are missing a clamp they need, and the one it explicitly marks "—" is
the one that breaks a shipped guarantee:**

| Row | Doc says | Actually needs |
|---|---|---|
| Spawn interval | floor `SPAWN_MIN` | ⚠ constant does not exist; name it `SPAWN_INTERVAL_MIN` |
| Concurrent enemies | ⛔ `ENEMY_CAP` | ✓ correct |
| Enemy climb speed | **—** | ⛔ **`CLIMB_MULT_MAX` — H1** |
| Vault interval | **—** | floor, and ⛔ `VAULT_RIM_INTERVAL` must stay ≥ `VAULT_HOP_TIME` or hops overlap |
| Surge frequency | **—** | floor; interval → 0 is a permanently live lane |
| Weaver thorn length | lane length | ⛔ apex ceiling **below** the rim — GDD §6.1 says a Weaver climbs *partway* |
| Carrier cargo weights | — | ✓ correct |

⛔ **And two of its rows are one knob.** `Weaver.layThorn()` writes the Thorn's tip
to the Weaver's own depth, so *thorn length is apex*. `WEAVER_APEX` carries a
⚠ "CS006 makes this heat-derived" note and the DIFFICULTY-NOTES row asks for a
second, separate one. There is only one.

### H4. The spawner stall — a recommended default, not a decision

CS007's to take. My reading, for what it is worth:

⛔ **The concurrency budget should count *threats*; the readability ceiling should
keep counting *entities*.** `updateSpawner()` and `spawnEnemy()` read the same
array length for two different questions, and `00-config.js` already claims they
are different numbers. Split them:

- `spawnEnemy()`'s `C.ENEMY_CAP` check: **unchanged**, raw `state.enemies.length`.
  A Thorn is drawn, so a readability ceiling counts it.
- `updateSpawner()`'s block: counts entities where `blocksClear && !dead`, against
  `enemyConcurrent()`. A Thorn does not block the clear, so it does not hold a
  release slot.

Three standing Thorns stop shutting the spawner. No Thorn expires (which would
break GDD §5's lesson), the clear condition does not change, and `ENEMY_CAP` is
untouched.

⛔ **And the rim-parked Carrier is not the same bug.** `STATUS.md` records a
seeded run stalled by one Carrier at depth 1.00 with the quota spent. Traced: a
player cannot shoot it without entering its lane, and entering its lane is contact
death — so it looks like a life tax. It is not. **The player's answer is the
Purge**, which is unspent on a well the player did not need it for, recharges on
entry, and whose weak second use is specified as *"the enemy nearest the rim,
deterministically"* (GDD §4.3). A rim-parked survivor is the panic button's
textbook case. It stalls a soak that never presses Purge, and the soak fixture is
correct; it does not stall a played build. **Recommend: no code change, record the
reading.**

### H5. The debug bench keys survive the constant

⛔ `C.DEBUG_SPAWN_KINDS` and `pickSpawnKind()`'s read of it are deleted by the
introduction schedule. ⛔ **The seven keys in `runAction()` are not, and they are
a different thing.**

`DEBUG_SPAWN_KINDS` answers *"what does the well release"* — a difficulty
question, which is why it shipped ⚠ TEMPORARY with a ⛔ *never a difficulty knob*
beside it. The keys answer *"put one of these on screen so I can look at it"* —
a hardware-pass question the schedule does not address and cannot. `PLAYTEST.md`
is written around them (*"press `3`, let a Weaver lay one, then press `6` in the
same lane"*), the six enemy colours are still ⚠ provisional and `0` is the only
way to see them together, and CS007's HUD and the art pass will both want them.

⛔ **They also stop being TEMPORARY.** They ship until CS016's legal-and-ship
sweep decides whether debug keys ship at all, and that is that changeset's
question, not CS007's.

### H6. The golden's guard role should be replaced, not just re-recorded

`test-cs004-p1.js`'s `GOLDEN_LANES` is the only end-to-end guard on the ⛔ "a
one-entry list spends no draw" rule, because the determinism hashes compare two
runs of the *same* build and a stream shift is self-consistent there.

Both CS006 and CS007 legitimately move it. ⛔ **A re-record is the one moment a
stray draw can be laundered into a new baseline**, so the guard should stop being
a recorded sequence and become a direct count: wrap `state.rng` in a counting
proxy and assert draws-per-spawn is `1` (the heading, in `spawnEnemy`) plus
`pickSpawnLane`'s bounded `[1, C.SPAWN_LANE_TRIES]`, with **no third draw** at a
level whose eligible roster has one entry. That form is absolute and survives
every future retune. CS007 owns it; CS006 P5 re-records the golden once, alone,
with the cause named in `log/CS006.md`.

---

## What ships

### 1. Well progression past 99

`nextWell()` gains the GDD §3.6 branch. Below 100 it is unchanged, bit for bit.

```js
function nextWell() {
  state.level += 1;
  if (state.level > C.BAND_RNG_LEVEL) {
    state.wellIndex = rngInt(state.rng, WELLS.length);
    state.bandRoll  = state.rng();
  } else {
    state.wellIndex = (state.level - 1) % WELLS.length;
  }
  enterWell();
}
```

⛔ Two draws, spent **only** past 99, so the stream below 100 is untouched and the
golden's early behaviour is unaffected by this change alone.
⛔ `state.bandRoll` is initialised by `newState()` and written **only** in
`nextWell()`. Never in `enterWell()` — the `w` debug key routes through there.

⚠ **`state.level` keeps counting past 99.** GDD §3.6's *"the counter holds"* is
about the derived band table and the heat curve, not the clock — `state.level` is
the one clock, telemetry samples it and `PTS_WELL_PER_LEVEL` multiplies by it. What
holds is `wellBandColor`'s palette (already built) and, in CS007,
`heat(min(level, C.HEAT_HOLD_LEVEL))`. **⛔ Putting the hold in the caller rather
than inside `heat()` is what keeps GDD §17 item 7 (`heat(n+1) > heat(n)` for
n in 1..200) literally true** — a `heat()` that plateaued would turn that item red.

### 2. `laneState` and the dim band

`buildLaneState(state, well)` → the preallocated 16-slot array, cleared and
refilled. Flags per GDD §3.7:

- `occupied` — any live enemy in that lane (`|laneDelta| < 1`)
- `shotTravel` — any live shot in that lane
- `surgeCharge` — a Surger in `telegraph` or `discharge` in that lane

⛔ **The Surger's telegraph stays an entity draw.** `STATUS.md` carries this:
`drawSurgeLane` paints a progressive throat→rim fill and `isLaneLit()` is a
boolean over spokes that cannot express one. They are two different marks — the
spokes light, the fill creeps inside them — and `surgeCharge` sets the first
without touching the second.

⛔ Gated per finding 1: built only when `wellBaseAlpha(state.level) < 1`.

### 3. `throatOffset` and the two degenerate wells

GDD §3.3 gains the field's definition. `WELLS[10]` (Flat) and `WELLS[8]` (Stair)
gain a `throatOffset`. `C.MIN_LANE_SPOKE_PX` lands and §17 item 2 grows a lane-
legibility walk.

### 4. The Dive

`src/11-dive.js`, currently a placeholder.

```
  wellCleared()  ──►  startDive()  ──►  [ GRACE ]  ──►  [ DESCENT ]  ──►  nextWell()
                                            │              │
                                       rotate only     rotate; Thorn strike live
```

| Beat | Length | Behaviour |
|---|---|---|
| Grace | `C.DIVE_GRACE` 0.35 s | `dive.depth` holds at 1. Rotation live. ⛔ No strike test. |
| Descent | `C.DIVE_TIME - C.DIVE_GRACE` | `dive.depth` falls 1 → 0 linearly. Rotation live. Strike test live. |

⛔ **The grace beat is a P2 requirement, not polish.** `C.THORN_MAX` is 1.00 and
`00-config.js` says a full-length Thorn's tip sits *at the rim*. Without a grace
beat, a dive that begins in a full-length Thorn's lane is a death on step one with
no input opportunity — a threat that is lethal before it is legible. 0.35 s is
enough to see the board and start moving; the worst-case traverse is 8 lanes on a
Ring at `C.KEY_SPEED_MAX` 14 lane/s = 0.57 s, comfortably inside the 2.25 s
descent.

⛔ **Snap assist stays on during the dive.** `laneHit`'s `C.HIT_LANE_TOL` is 0.5,
so "thread between the Thorns" means "be in a lane that has none" — and snapping
to a lane centre is exactly what makes that unambiguous. This is pillar P1 and it
does not get suspended for a set piece.

**Dive death (GDD §4.5 item 5):**

⛔ **A dive death must not be able to loop, and the naive version does.** Strike →
`killSkimmer()` → hit-stop → respawn *in the lane it died in* → the same Thorn is
still there (⛔ correctly — `respawnSkimmer`'s clamp skips `anchored` entities) →
strike again the moment `C.RESPAWN_INVULN` expires. A full-length Thorn burns a
life every 1.5 s until the run ends.

⛔ **The guard: a dive respawn lands in the nearest Thorn-free lane**, chosen
deterministically — lowest `|laneDelta|` from the lane it died in, ties toward
increasing lane. ⛔ **No RNG**, so it costs the run's one stream nothing. ⛔ **And
if every lane holds a Thorn, the struck Thorn dies instead** — the termination
guarantee, and it is the only path in the build by which a Thorn is destroyed by
something other than a shot.

The dive then repeats from the grace beat, per GDD §5: *"repeats the dive, not the
well."* `state.level` does not advance and the outgoing well's Thorns are
unchanged.

### 5. What is deleted

| Deleted | Where |
|---|---|
| `C.WELL_CLEAR_HOLD` | `00-config.js` |
| `state.clearHold` | `02-state.js`, and its `STATE_FIELDS.CS003` entry |
| the hold branch | `23-main.js` `Game.update()` |
| `state.clearHold = 0` | `23-main.js` `enterWell()` |

### Constants this changeset adds to `C`

| Constant | Value | Group | Note |
|---|---|---|---|
| `BAND_RNG_LEVEL` | 99 | Well rendering | ⛔ above this, shape and colour come from the stream |
| `MIN_LANE_SPOKE_PX` | 60 | Well geometry | ⛔ §17 legibility floor, not a tunable to relax |
| `DIVE_GRACE` | 0.35 | Dive | s at depth 1 before descent. ⛔ counts UP |
| `LANE_LIT_MAX_LANES` | 16 | Well rendering | preallocation size for `laneState` |

`C.DIVE_TIME` 2.6, `C.DIVE_TIME_OD` 4.0 and `C.DIVE_RINGS_MAX` 6 already exist and
have never been read. This changeset is `DIVE_TIME`'s first reader; the other two
stay unread (CS014, post-renumber).

### Fields `state` gains

```js
// ⛔ The Dive owns its own depth (GDD 5). Deliberately NOT a field on the
// Skimmer: a skimmer.depth that is 1 except for 2.6 s is a field two systems
// can disagree about, and 09-collision.js's "there is no term here for where
// the Skimmer is" stays literally true because collideSkimmer() does not run
// while this is active.
dive: { active: false, phase: "grace", timer: 0, depth: 1 },

// ⛔ GDD 3.6's past-99 band draw. Written ONLY by nextWell(); enterWell() has
// three callers and one of them is a debug key.
bandRoll: 0,
```

`STATE_FIELDS` gains `CS006: ["dive", "bandRoll"]` and ⛔ **loses `clearHold` from
its `CS003` entry** — the sum guard in `test-registry.js` is what would otherwise
read a deleted field as an orphan.

⛔ **`scratchpad/test-registry.js`'s `COUNTS` are untouched.** `wells: 16`,
`openWells: 6`, `tracks: 0`, `enemies: 6`, `enemyKinds: 9`. This changeset adds no
enemy and no `ENEMY_KINDS` row; the Dive's Thorn strike is a *new pass* over an
entity that already exists.

---

## Acceptance criteria

**Well progression**
- `nextWell()` at level < 100 produces the same `wellIndex` sequence as
  `de9643a`, asserted against a recorded walk of levels 1..99.
- ⛔ At level ≤ 99, `nextWell()` spends **zero** additional draws versus `de9643a`
  — asserted with a counting proxy over `state.rng`, not inferred.
- At level > 99, `wellIndex` and `bandRoll` both come from `state.rng`, and two
  runs of the same seed produce the same 200-level shape sequence.
- `state.bandRoll` is never written by `enterWell()`; the `w` debug key does not
  move the stream, asserted by draw count across 100 presses.
- `state.level` continues past 99 and `wellBandColor` returns a `BAND_RNG_COLORS`
  member for every level in 100..300.

**Geometry**
- ⛔ Every lane centre of all sixteen wells has a spoke ≥ `C.MIN_LANE_SPOKE_PX`.
- No NaN in any derived position on any well, at lane centres and at boundaries
  (§17 item 2, extended).
- ⛔ `screenPos` changes for the Flat and Stair wells and for no others, and no
  simulation value changes on any well — the 10,000-tick hash at seed 20260830 is
  identical before and after P2.
- `wellThroat()`'s memo is still correct with an offset present: two calls return
  the same array reference and the same values.

**The Dive**
- A cleared well enters the dive rather than calling `nextWell()` directly, and
  `nextWell()` is reached only from the dive's end.
- `C.WELL_CLEAR_HOLD` and `state.clearHold` do not appear anywhere in `src/`.
- ⛔ Dive start leaves `state.shots` empty and `state.enemies` containing only
  `anchored` entities — asserted with a live `WeaverBolt` on the board at clear.
- During a dive: `updateSpawner`, the enemy pass, `updatePurge` and
  `collideSkimmer` do not run. Asserted by instrumenting, not by reading.
- `dive.depth` is 1 for exactly `C.DIVE_GRACE` and then falls monotonically to 0
  over `C.DIVE_TIME - C.DIVE_GRACE`; it never leaves `[0, 1]`.
- No strike is possible during the grace beat, with a `C.THORN_MAX` Thorn in the
  dive lane.
- A dive strike costs one life, repeats the dive, and does **not** advance
  `state.level`.
- ⛔ A dive respawn lands in a Thorn-free lane when one exists, deterministically
  — same seed, same lane, 100 runs.
- ⛔ A dive with every lane thorned terminates: the struck Thorn dies and the dive
  completes. Asserted on the Fan (11 lanes, the cheapest board to fill).
- ⛔ A dive spends **zero** RNG draws. Counting proxy.

**Rendering**
- `laneState` is built only when `wellBaseAlpha(state.level) < 1`, asserted at
  levels 1, 64, 65, 80, 81.
- `buildLaneState` allocates nothing per frame — the array identity is stable
  across 600 draws.
- `drawWell` still accepts `null` and behaves as it does today.
- ⛔ Nothing in the draw path calls `state.rng`. Asserted by driving 600 `draw()`
  calls with zero `update()` calls and checking the stream has not advanced.

**Suite**
- `node build.js` green, 24 modules, `MANIFEST` checked both ways.
- `node scratchpad/run-all.js` green, zero skips.
- ⛔ `test-cs003-p2.js`, `test-cs003-p5.js`, `test-cs004-p5.js` and
  `test-cs005-p5.js` are edited and each edit is named in `log/CS006.md` with its
  cause. See Hazard 1.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is re-recorded **once**, in P5, with the
  cause named.
- `test-registry.js`'s `COUNTS` block is unchanged.

---

## ⛔ Scope boundaries — what this changeset does NOT touch

- ⛔ **No heat.** `heat()` does not land. `C.HEAT_BASE`, `HEAT_RISE`, `HEAT_KNEE`
  and `HEAT_LINEAR` stay unread. Every constant carrying a ⚠ "CS006 makes this
  heat-derived" note (`WEAVER_APEX`, `SURGE_INTERVAL`) keeps its current value and
  its note is re-pointed to CS007.
- ⛔ **No introduction schedule.** `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]`
  and `pickSpawnKind()` is untouched. The spawner stall stays unreachable, and
  stays CS007's.
- ⛔ **No telemetry.** `src/21-telemetry.js` stays a placeholder.
- ⛔ **No scoring.** `addScore()` is CS008's (post-renumber) single entry point.
  Every `PTS_*` constant stays unread — including `PTS_WELL_PER_LEVEL` and
  `PTS_NO_DEATH_WELL`, which look like they belong to level flow and do not, and
  `PURGE_SAVED_BONUS`, which the Dive will look like a home for and is not.
- ⛔ **No new enemy, no new `ENEMY_KINDS` row, no cargo.** GDD §6.2's variant table
  is complete at three.
- ⛔ **No Overdrive.** `C.DIVE_TIME_OD` and `C.DIVE_RINGS_MAX` stay unread; the
  ring-flight is CS014's (post-renumber).
- ⛔ **`src/07-enemies.js` is not split.** `ROADMAP.md` names CS011 (CS012
  post-renumber) and the seam. Not this changeset, and not a reason to touch that
  file at all — CS006 has no business in it.
- ⛔ **`05-skimmer.js` is not touched.** The dive's depth is not a Skimmer field.
- ⛔ **The Drifter's `killDepth` stays the rim band.** `DECISIONS.md` 2026-08-30.
  The Dive is not the moment that reopens it — finding 6.
- ⛔ **`C.ENEMY_CAP` is a readability ceiling.** Nothing in this changeset reads it
  as a difficulty number, and nothing raises it.
- ⚠ **GDD §12's four-second promise is onboarding and is CS015's** (post-renumber).
  `ROADMAP.md` assumption #6 records which document won.
- **No art pass.** The six ⚠ provisional enemy colours stay provisional and
  `tools/glow-lab.html` stays unbuilt and unowned.
- **`tools/well-lab.html` is used, not rebuilt.** P2 reads a spoke length off it;
  if it cannot show one, add the readout and say so in `STATUS.md`.

---

## Known hazards

### ⛔ Hazard 1 — this changeset edits four closed test files, and one of them is assertions

CS005's close carries ⛔ *"CS005 edited neither closed soak, and a future changeset
should extend the pattern the same way."* CS006 cannot. Deleting `state.clearHold`
reaches into:

| File | What | Kind |
|---|---|---|
| `test-cs003-p2.js` | `hasKnob(WELL_CLEAR_HOLD, def 1.00)`, the hold-ticks case, two `clearHold === 0` cases | ⛔ **assertions** |
| `test-cs003-p5.js` | `h = mix(h, st.clearHold)` | hash field |
| `test-cs004-p5.js` | `h = mix(h, st.clearHold)`, `state.clearHold = 0` | hash field + fixture |
| `test-cs005-p5.js` | `h = mix(h, st.clearHold)` | hash field |

⛔ **The rule, and it should go into `CLAUDE.md`'s test rules:**

> When a later changeset **replaces** behaviour a closed phase's test asserts, it
> **rewrites those assertions in place to the replacement behaviour**. It does not
> delete them, does not weaken them, and does not add coverage of its own there.
> New coverage goes in the new changeset's own file.

CS003 P2 owns *"a cleared well advances on its own after a beat."* The beat's
mechanism changed; the ownership did not. So `test-cs003-p2.js` keeps that case
and asserts it against `C.DIVE_TIME`.

⛔ **And the three hash fields are replaced, not dropped.** `mix(h, st.clearHold)`
becomes `mix(h, st.dive.timer)` and `mix(h, st.dive.depth)` — dropping it would
silently remove the between-wells beat from three determinism hashes.

### ⛔ Hazard 2 — the golden moves, and P5 is the only place it may be re-recorded

`GOLDEN_LANES` is 16 spawn lanes over 3,000 ticks with fire held. The window
covers roughly 1.6 wells, so it crosses `nextWell()` — and `WELL_CLEAR_HOLD` 1.00 s
becoming `DIVE_TIME` 2.6 s moves every spawn after the first well clears.

⛔ **No phase before P5 re-records it.** A phase that finds it red re-runs it,
confirms the *only* cause is the dive's length, and says so in `STATUS.md`. P5
re-records once, states the cause in `log/CS006.md`, and asserts the count-based
form (H6) in CS006's own file alongside it — so the re-record is not the only
thing standing between the build and a stray draw.

### Hazard 3 — the dive's Thorn set is the *outgoing* well's

`enterWell()` clears `state.enemies` and mints a Skimmer for the new well's lane
count. So the Dive must run **before** `enterWell()`, reading the outgoing well's
Thorns and the outgoing well's lane count. `nextWell()` is called at the dive's
*end*. A dive that ran after `enterWell()` would thread through an empty new well
and be a 2.6-second pause with a doppler on it.

### Hazard 4 — the Stair's offset changes an open well's lane clamp visually, not mechanically

`laneClamp` and `polyAt`'s open-well backstop are functions of `well.lanes`, not
of geometry. An offset throat cannot move them. But the *visual* end of the Stair
moves, and CS005's boundary lattice (`laneBoundaryLo/Hi` = 0.5, `lanes - 1.5`) is
a lane-space fact, not a screen one. ⛔ P2 asserts that no lane-space helper's
output changes on any well, so the two cannot be confused later.

### Hazard 5 — `wellThroat()`'s memo and a runtime offset

`wellThroat()` caches on `well._throat` under a non-enumerable key and its header
carries ⛔ *"the cache assumes rim data is IMMUTABLE at runtime."* An offset added
to the **data** is immutable and safe. ⛔ An offset written at runtime — by a
future camera effect, or by `well-lab` — would be read once and then cached
forever. P2 states that at the field's definition.

### Hazard 6 — `state.dive` and the game-over stop

`killSkimmer()` sets `screen = "gameover"` at zero lives, and `Game.update()`
returns early on it. ⛔ The dive branch sits **below** the game-over stop, so a
dive death that ends a run stops the dive too. The frozen board on screen is then
the outgoing well plus a craft mid-descent, which is correct — the freeze exists
to show the player what happened.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | ⛔ **CS006 splits in two: the well (CS006) and the run (CS007).** Tail renumbers +1 | A measurement showing the heat half is under two phases. It is not — it carries two shipped invariants, two closed test files and a design call |
| 2 | ⛔ **Telemetry stays with heat in CS007**, not with the Dive | If CS007's heat pass tunes entirely off `feel-lab` and the harness, telemetry moves to CS011 (post-renumber) with the other meta systems, per `ROADMAP.md` assumption #3's escape hatch |
| 3 | ⛔ **Nothing in the draw path calls `state.rng`**; the past-99 draw lives in `nextWell()` and is stored on `state.bandRoll` | Nothing. `Game.draw()` runs on a frame clock and `update()` does not |
| 4 | ⛔ **`state.level` counts past 99; the band table and (later) heat are what hold** | A GDD §3.6 rewrite. As written, a frozen clock would make `level_reached` and `PTS_WELL_PER_LEVEL` meaningless in the marathon band and would break §17 item 7 |
| 5 | ⛔ **`throatOffset` is a translation of the throat polygon in normalized rim space, applied after the centroid scale** | Nothing — this is what `wellThroat()` already implements. CS006 writes the definition down, it does not choose one |
| 6 | **Flat gets `{x: 0, y: -0.50}`; Stair gets `{x: 0, y: -0.35}`** | An audition in `well-lab`. These are computed to land both wells inside the ratio family the other fourteen occupy; they are starting points, not felt numbers |
| 7 | ⛔ **`C.MIN_LANE_SPOKE_PX` 60 is a §17 gate, not a tunable** | A sixteenth well shape. The number separates the two broken wells (24, 30) from the tightest working one (Twist, 74) with no well inside 20 % of it |
| 8 | ⛔ **The Dive clears everything not `anchored`**, so a Weaver bolt does not survive into it | A GDD §5 decision that an enemy projectile is part of the Dive's hazard set. That would need a §4.5 amendment, since item 4 has no depth qualification |
| 9 | ⛔ **The dive's depth lives on `state.dive`, not on the Skimmer** | GDD §14.2's Jump, which puts a craft off the rim *while the collision pass runs*. That is the moment `collideSkimmer` gains a second depth term, and it is CS012's |
| 10 | ⛔ **`C.DIVE_GRACE` 0.35 s exists and is a P2 requirement** | Lowering `C.THORN_MAX` below 1.00, which would stop a Thorn's tip reaching the rim. `00-config.js` says the seal is intended, so the grace is the cheaper fix |
| 11 | ⛔ **A dive respawn lands in the nearest Thorn-free lane, deterministically; if there is none, the struck Thorn dies** | A different termination guarantee. Any version is acceptable except none — the naive respawn loops one life every `RESPAWN_INVULN` |
| 12 | **Snap assist stays live through the dive** | A playtest finding that snapping fights threading. `HIT_LANE_TOL` 0.5 means safety is lane-granular anyway, so snapping is aligned with the hazard, not against it |
| 13 | ⛔ **`laneState` is built only inside the dim band** | Any second reader of lane occupancy — a CS008 HUD element, an audio cue. Then it becomes unconditional and this note is what says why it wasn't |
| 14 | ⛔ **The Surger telegraph stays an entity draw and also sets `surgeCharge`** | Nothing. They are two marks: `isLaneLit` lights the spokes, `drawSurgeLane` fills the lane. `STATUS.md` carries the ⛔ against merging them |
| 15 | ⛔ **A closed phase's test is rewritten in place when a later changeset replaces the behaviour it asserts** | Nothing. The alternative — deleting the case — silently drops CS003 P2's coverage of the between-wells beat |
| 16 | **The rim-parked Carrier is answered by the Purge and needs no code change** | A playtest finding that players do not reach for it. Then it is a Carrier rim behaviour question and belongs wherever the roster is next opened |
| 17 | ⛔ **P0 is a renumber sweep with its own commit** | Nothing. CS004's split did exactly this and found 41 stale pointers where the plan predicted twelve |
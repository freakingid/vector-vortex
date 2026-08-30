# PLANNED-FEATURES-CS004 — The cargo and the lane

**Changeset:** CS004 · **Status:** not started · **Depends on:** CS003 closed at
`f322ba9`
**GDD sections in scope:** §4.2 (the Thorn chip), §4.3 (what the Purge does not
remove), §4.4 (the rim push — read the ⚠ before P1), §4.5 items 4 and 5, §6.1
(roster — the Carrier, Weaver and Thorn rows), §6.2 (Carrier variants), §6.3
(behaviour notes), §6.5 (entity contract), §17 items 1, 3, 5 and 6

---

## Why this changeset exists

CS003 built one enemy and the whole spine around it. The spine has four hooks —
`purgeable`, `blocksClear`, `killDepth`, `onShot` — and every one of them was
written for an enemy that did not exist yet. This changeset is the first time
any of them is asked to do the job it was designed for, and the first time
anything other than the interval spawner puts an enemy in the well.

Three of the six Classic enemies land here. The other two land in CS005, for
reasons set out below — the roster does not divide evenly, and pretending it
does would put the two hardest entities in the game at the tail of a changeset
that is already full.

---

## Scope check against what CS003 actually shipped

⛔ **Read this before assuming `ROADMAP.md`'s CS004 line is still exact.** It is
not. Eight findings; four of them change the shape of the work and two of them
change how a phase has to be *worded*.

Checked against the pushed tree at `f322ba9`, including the remedial `1ce0011`
and P5's close.

### 1. ⛔ The contract has a seventh field it does not have yet

`respawnSkimmer()` (`src/23-main.js`) implements GDD §4.4's rim push as an
unconditional clamp over `state.enemies`:

```js
if (e.depth > C.RESPAWN_PUSH_DEPTH) e.depth = C.RESPAWN_PUSH_DEPTH;
```

It is the only writer of an entity's `depth` outside that entity's own
`update()` anywhere in the build. For every entity that has existed so far,
`depth` is a **position** and the clamp is exactly right.

For the Thorn, `depth` is not a position. It is the **tip of an extent** rooted
at the throat. So every player death would permanently shorten every Thorn
longer than `RESPAWN_PUSH_DEPTH` — a free chip the player did not earn,
delivered silently, in the one place nobody would look.

⛔ **The fix is a seventh contract field, `anchored`, and one line in the
respawn.** It is CS004's first phase, not a footnote in the Thorn's.

Rejected alternative: give the Thorn a separate `len` field and leave `depth` at
zero. `collideShots()`'s hit test is one line —
`Math.abs(sd - e.depth) > C.HIT_DEPTH_TOL` — and it works on the Thorn *only*
because `depth` is the tip. Moving the extent to a second field means the
collision pass grows a Thorn special case, which is the thing the contract
exists to prevent. Keeping `depth` as the tip and teaching the respawn to skip
anchored entities costs one boolean.

### 2. ⚠ That line is now marked SETTLED, and P1 has to be worded around it

Commit `1ce0011` (a remedial CS003 P4 pass, Paul's call, 2026-08-30) marks the
clamp ⚠ SETTLED in GDD §4.4 and at `respawnSkimmer()` itself, with the words
**"Do not narrow it back."** `CLAUDE.md`'s ⚠ rule is unambiguous about what a
session does when it finds one: *do not fix it, do not re-litigate it, stop and
say so to Paul.* A P1 prompt that simply says "edit the respawn" therefore
stalls, and stalling would be the **correct** behaviour.

⛔ **`anchored` is not a narrowing, and the phase prompt must say so in Paul's
voice.** The marker is about the **depth band**: everything above
`RESPAWN_PUSH_DEPTH` comes down to it, in every lane, rather than only what sits
inside the rim contact band. That is untouched. `anchored` changes *which
entities the clamp is meaningful for*, not how far down it reaches — and for the
one entity it excludes, `depth` was never a position, so the clamp was never
doing the thing the settled decision protects. Every enemy whose `depth` is a
position keeps the broad clamp, unchanged, forever.

This is the second time a marker has had this effect (CS003 P1 corrected three
stale changeset pointers for the same reason: a note in the source reads as
shipped truth). Recorded here so the ⚠ is respected rather than worked around.

### 3. `spawnEnemy()` is genuinely the one entry point, with four qualifications

It is, GDD §6.5's shipped paragraph now says so explicitly, and the Carrier's
split inherits `SAFE_SPAWN_DEPTH` and `C.ENEMY_CAP` through it. Four things
about it are load-bearing for the split and none is obvious from the signature:

- ⛔ **It spends one RNG draw per call**, for the heading, whether or not the
  spawned kind reads one. A two-child split therefore spends two draws and
  shifts every later draw in the run. Correct and deterministic; also the kind of
  thing that gets "cleaned up" by a session that does not know the stream is
  shared. Assert it.
- ⛔ **It refuses at `C.ENEMY_CAP` and returns `null`.** A Carrier killed while
  the board is full loses its children. That is correct — the cap is a
  readability ceiling, never a difficulty knob — and the tempting bypass ("it's
  only a split") is the exact failure the single entry point prevents.
- ⛔ **`laneNormalize()` clamps on an open well.** A Carrier in lane 0 splitting
  to `lane ± 1` puts one child at lane 0 and one at lane 1: two silhouettes, one
  lane, on the well where the player has the least room. The split needs its own
  lane helper, not a bare `±1`.
- ⛔ **The split pushes into `state.enemies` while `collideShots()` is iterating
  it.** Safe as written — the loop is index-based and re-reads `.length`, the
  `break` after `onShot` is unconditional, and removal is still the end-of-frame
  `.filter()` — but "safe" here is a property of three separate decisions in two
  files, not an accident. It becomes a ⚠ SETTLED note with a test behind it.

### 4. `entityPoints()` covers four of the six new silhouettes, and that is fine

Verified against the built file, not inferred.

| New shape | `entityPoints()`? |
|---|---|
| Carrier hull (hollow diamond) | Yes |
| Carrier cargo glyph (a second, smaller poly) | Yes — each poly memoizes its own `_pts`, so two polys per entity is free |
| Weaver (open spiral — `drawPoly`'s `closed = false`) | Yes |
| Weaver bolt | Yes |
| **Thorn** | **No** — a segment along the lane, not a shape at a point |
| **Surger telegraph** (CS005) | **No** — same reason |

Neither exception needs a new helper. `drawShot()` in the same file is already
that pattern: two `screenPos` calls into module-level scratch points, one
`drawPoly`, one `glowStroke`. The Thorn reuses the *shape* of `drawShot`, not
`entityPoints`. No change to `entityPoints` is in scope.

### 5. ⛔ The Drifter breaks `laneHop()` on open wells

Not a rendering problem — a geometry one, and it is why the Drifter is not in
this changeset. Verified against the build:

```
laneHop(Vee, 0.5, -1, -1)   →  { lane: 0.5,  dir: +1 }
laneHop(Vee, 11.5, +1, +1)  →  { lane: 11.5, dir: -1 }
```

The mirror fold reflects `-0.5` back onto `+0.5`, so the hop lands where it
started. `07-enemies.js` documents this exact case and dismisses it:

> A hop that begins exactly ON an open well's fold point — a half-lane, which no
> spawner produces — lands where it started and the Vaulter holds its lane for
> that beat. Harmless.

The Drifter rides lane *boundaries*, which are half-lanes, permanently. It
invalidates the premise that no entity sits on a fold point, and both outermost
interior boundaries become stall points. Separately: `laneClamp` forbids
`lane < 0` and `lane > lanes-1`, so an open well's two **outer** boundaries — the
walls themselves — are not addressable at all. A 13-lane Vee has twelve ridable
boundaries, not fourteen.

That is a `03-wells.js` change plus a soak, and it does not belong bolted onto
the end of a full changeset.

### 6. The Surger's telegraph does not need `laneState`, and should not use it

`drawWell()` already takes `laneState` and wires it end to end
(`13-render-well.js`); "unwired" in `STATUS.md` means no caller passes one, not
that the parameter is missing. But `isLaneLit()` is a boolean over three flags,
and it lights **spokes**, not lane interiors. GDD §6.3 asks for a lane that
brightens throat→rim across `SURGE_TELEGRAPH` (0.45 s) — a progressive fill,
which a boolean spoke cannot express. Reshaping `isLaneLit` into an alpha ramp is
a renderer change that belongs with the dim-band occupancy producer that will
define the whole `laneState` contract.

⛔ **The Surger owns its telegraph as an entity draw**, the same way the Thorn
owns its segment. It works at any band alpha, needs no renderer change, and gives
the progressive sweep the boolean cannot. `laneState` stays unwired and stays
CS006's. Recorded here because the question was asked against CS004's scope; the
work is CS005's.

### 7. ⛔ P5's soak found that a range check does not catch §3.5's bug

Worth knowing before writing any lane assertion. From `log/CS003.md` and
`test-cs003-p5.js`: a hop that *wraps* on a 13-lane strip sends lane 12 to lane 0,
and lane 0 is inside `[0, 12]` — the enemy teleports across the well without ever
leaving the legal range. The tell is the per-tick lane **speed**:

```js
const MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME;
```

Mutating `laneHop()` to wrap leaves the range assertion green and turns the speed
assertion red. My earlier draft of CS004's soak asserted the range, which is the
weaker of the two.

For CS004 the correct assertion is **stronger and simpler than a bound**, because
none of the four entities landing here hops at all: ⛔ **a Carrier, Weaver, Thorn
or bolt's `lane` never changes, ever, on any well.** Exact equality against the
lane it entered with. `MAX_LANE_STEP` stays the Vaulter's, and CS005 is where it
has to become per-entity, because the Drifter is the first thing that moves
continuously in lane space.

### 8. The renumber leaves twelve stale pointers, and two of them need rewording

Splitting CS004 makes the level-flow changeset CS006. `CS005` currently appears
in twelve places meaning *level flow*, and left alone every one of them points at
the Drifter/Surger changeset instead:

| File | Count | Means |
|---|---|---|
| `STATUS.md` | 5 | dim band / `laneState`, the Dive and `WELL_CLEAR_HOLD`, the heat curve, the rim-Vaulter jitter, ROADMAP assumption #6 |
| `VECTOR-VORTEX-GDD.md` | 3 | §4.4 heat curve, §6.3 jitter, and §4.4's death-condition sentence |
| `src/00-config.js` | 2 | `ENEMY_CONCURRENT`'s heat note, `WELL_CLEAR_HOLD`'s temporary note |
| `src/02-state.js`, `src/08-spawner.js`, `src/23-main.js`, `src/09-collision.js` | 1 each | the Dive, the heat curve, the Dive, the death conditions |

⛔ **Not a `sed`.** Two of them — GDD §4.4 line 253 and `09-collision.js` line 123,
both reading *"the four death conditions CS004 and CS005 add"* — are now wrong
about the split as well as the number: CS004 adds condition 4, CS005 adds 2 and
3, and CS006 adds 5 with the Dive. Those two need rewriting, not renumbering.

CS003 P1 did exactly this job once already, for three stale pointers, and
`PLANNED-FEATURES-CS003.md` recorded why: a comment naming a changeset reads as
shipped truth to a session that finds it, and it should be wrong for the shortest
possible time. P1 owns the sweep.

**Verdict: `ROADMAP.md`'s CS004 line does not hold. It splits.**

---

## ⛔ The split, and where the seam goes

Five enemies plus three Carrier variants plus a projectile is six new classes,
six new silhouettes, a contract change, a debug spawn path, a split helper, a
lane-boundary movement model and a telegraph renderer. CS003 shipped **one**
enemy in five phases, ~110 KB of tests and 14 suite files.

The seam is forced regardless of appetite: ⛔ **the Drifter Carrier (L18) and the
Surger Carrier (L23) cannot be built before their cargo exists.** GDD §6.2's
cargo table has three rows and exactly one of them is buildable today.

| | Ships |
|---|---|
| **CS004** | Carrier + `splitLanes()` + the Vaulter-cargo row · Weaver · Weaver bolt · Thorn · the seventh contract field · the debug bench · the pointer sweep |
| **CS005** | Drifter · Surger · the remaining two cargo rows · the `laneHop` fold-point fix · a per-entity `MAX_LANE_STEP` · the telegraph |

The line is: **CS004 is the entities that pour into CS003's contract as it
shipped. CS005 is the two whose readability *is* the feature.** Both CS005
entities carry a ⛔ in §6.3 ("Drifter invulnerability must be visible", "Surgers
telegraph"), both need geometry or rendering work the spine did not anticipate,
and both are the enemies whose failure mode is a death the player cannot account
for — which §6.3 names as the most common complaint about clones.

Everything after shifts by one: level flow becomes CS006, ship becomes CS015.
`ROADMAP.md` is renumbered in the same drop as this document; the twelve
in-repo pointers are P1's.

---

## What ships

- **P1 — the contract gap, the bench, and the sweep.** `anchored` on the `Enemy`
  base and the skip in `respawnSkimmer()`; the named debug spawn actions;
  `C.DEBUG_SPAWN_KINDS`; the Classic enemy palette; the twelve stale pointers;
  the duplicate harness.
- **P2 — the Carrier and the split.** `class Carrier`, the `CARGO` table,
  `splitLanes()`, the `carrierVaulter` kind, the hull and glyph silhouettes.
- **P3 — the Weaver and its bolt.** `class Weaver`, `class WeaverBolt`, the
  climb/lay/fire/retreat cycle, GDD §4.5's fourth death condition.
- **P4 — the Thorn.** `class Thorn`, `drawThorn()`, the chip economy, and the
  Weaver's lay-and-adopt.
- **P5 — the soak, the docs, the close.** GDD §17 items 1, 3, 5 and 6 across the
  new roster; the registry count; GDD and `CLAUDE.md` updates; `log/CS004.md`;
  archive. Closing phase.

### The contract, after this changeset

⛔ Seven fields, three signatures, still no behaviour in the base. GDD §6.5's
"Shipped, CS003" paragraph lists six; this adds the seventh.

| Member | Change | Why |
|---|---|---|
| `lane`, `depth`, `dead` | unchanged | |
| `purgeable` | unchanged | The Thorn is the first `false`, as §6.5 predicted |
| `blocksClear` | unchanged | The Thorn and the bolt are both `false` |
| `killDepth` | unchanged | The bolt is the rim band; the Weaver's body is `null` — the field's first `null` in the roster |
| **`anchored`** | **new, default `false`** | ⛔ "`depth` is an extent, not a position." `respawnSkimmer()` skips these. The Thorn is the only `true` in the Classic roster |
| `update` / `draw` / `onShot` | unchanged | |

⛔ **`anchored` is a statement about what `depth` MEANS, not a movement flag.** A
Carrier that happened to be stationary would still be `anchored = false`, because
its `depth` is where it is. Anything that ever reads `depth` as a length sets it.

⚠ It is also **not** a narrowing of §4.4's settled rim push. See finding 2.

### The debug bench — how these are exercised without CS006

⛔ **Named actions on the existing input path.** `createInput()` already takes
`actionKeys` and an `onAction` callback, and `04-input.js` dispatches queued
actions inside `sample()` in simulation order, so a debug spawn is replay-safe and
cannot land halfway through a frame. ⛔ **No second listener** — that failure
already happened once in this repo, to the well-cycler, and `23-main.js` carries
the note.

| Key | Action | Does |
|---|---|---|
| `1` | `spawnVaulter` | One of that kind, in the Skimmer's lane, at `depth 0` |
| `2` | `spawnCarrier` | " |
| `3` | `spawnWeaver` | " |
| `4` | `spawnThorn` | " |
| `0` | `spawnRow` | One of every Classic kind, in consecutive lanes, at staggered depths |

⛔ **`"r"` and `"w"` are taken and their behaviour is load-bearing to the suite.**
`test-cs003-p5.js`'s recorded input list deliberately presses neither — `r` takes
a time-derived seed and `w` cycles the well — so the five new keys must not
collide with them, and the digits were chosen for that.

`spawnRow` is ten lines and it is the instrument that makes the palette judgeable
on hardware in a single look. That is the whole reason it exists.

⚠ **`C.DEBUG_SPAWN_KINDS` is TEMPORARY**, in the shape of `C.WELL_CLEAR_HOLD`. It
is the list the interval spawner picks a kind from, and it ships as
`["vaulter"]`, so the game plays exactly as it does today. Editing it to
`["vaulter", "carrier", "weaver"]` gives a mixed well with no code change. GDD
§8.1's introduction schedule deletes the constant and its reader.

⛔ **A one-entry list spends no RNG draw.** `rngPick` on a single-element array
still advances the stream, which would move every spawn lane in every run —
including the one `test-cs003-p5.js` hashes over 10,000 ticks — and turn the
determinism test red for a reason that would take an afternoon to find.
`pickSpawnKind()` returns element zero without drawing when there is no genuine
choice. This is deliberate and it is tested.

### Constants this changeset adds to `C`

⛔ All in `src/00-config.js`, grouped, before first use. Values are level-1
starting points; CS006 owns retuning every one of them through `heat(level)`.

| Group | Constant | Proposed | Note |
|---|---|---|---|
| Enemy palette | `CARRIER_COLOR` | `"#FFB84A"` | ⚠ provisional |
| Enemy palette | `WEAVER_COLOR` | `"#B6FF4A"` | ⚠ provisional |
| Enemy palette | `WEAVER_BOLT_COLOR` | `"#E8FF9A"` | ⚠ provisional — a paler relative of its parent |
| Enemy palette | `THORN_COLOR` | `"#A98CFF"` | ⚠ provisional — cool and inert; it is not a creature |
| Enemy palette | `DRIFTER_COLOR` | `"#FF5AC8"` | ⚠ provisional, **unread until CS005** |
| Enemy palette | `SURGER_COLOR` | `"#9AF0FF"` | ⚠ provisional, **unread until CS005** |
| Carrier | `CARRIER_SIZE` | `0.80` | Lane widths spanned by the hull |
| Carrier | `CARRIER_GLYPH_SIZE` | `0.34` | The cargo glyph, inside the hull |
| Carrier | `CARRIER_CLIMB` | `0.11` | depth/s — throat→rim ≈ 9 s. §6.1's "slow" |
| Weaver | `WEAVER_SIZE` | `0.62` | |
| Weaver | `WEAVER_CLIMB` | `0.22` | depth/s on the way up |
| Weaver | `WEAVER_RETREAT` | `0.34` | depth/s down — leaving is faster than arriving |
| Weaver | `WEAVER_APEX` | `0.55` | Depth it climbs to before turning. CS006 makes this heat-derived |
| Weaver | `WEAVER_APEX_HOLD` | `0.35` | s held at the apex, which is when it fires |
| Weaver | `WEAVER_BOLT_SPEED` | `0.32` | depth/s toward the rim. ~1.4 s from apex to rim |
| Weaver | `WEAVER_BOLT_SIZE` | `0.30` | |
| Thorn | `THORN_MAX` | `1.00` | ⛔ GDD §8's "clamp: lane length" |
| Thorn | `THORN_TIP_LEN` | `0.05` | depth units of brighter tip, so a chip is visible |
| Debug | `DEBUG_SPAWN_KINDS` | `["vaulter"]` | ⚠ TEMPORARY. Deleted with the introduction schedule |

`THORN_CHIP` (0.08), `SAFE_SPAWN_DEPTH`, `ENEMY_CAP`, `ENEMY_DEPTH_SCALE`,
`RIM_CONTACT_DEPTH`, `HIT_LANE_TOL`, `HIT_DEPTH_TOL`, `PTS_CARRIER`,
`PTS_WEAVER`, `PTS_THORN` and `SURGE_TELEGRAPH` already exist and are **not**
re-declared. Every `SURGE_*` and Drifter constant beyond the two colours stays
unwritten — CS005's.

**On the palette.** `STATUS.md` already names this: *"CS004 adds five more
enemies and will need five more colours — the palette decision should be made
once, deliberately, rather than five times by inference."* ⛔ **The six Classic
colours land together, in P1, as one considered set**, including the two CS005
reads. `C` already carries forward-looking constants (`JUMP_TIME`, `COMBO_MAX`,
the whole audio block), so this breaks no rule.

The constraint they are chosen against, which is the part worth writing down:
⛔ **an enemy colour must read against all seven band colours** (§3.6), because
the well cycles and the enemy palette does not. Hue alone cannot separate eight
simultaneous things; silhouette and line weight carry the load, and the palette's
job is to stay out of the two bands players actually reach — cyan (1–16) and
magenta (17–32) — and to keep the Thorn visibly not-a-creature. All six are ⚠
and every one is a candidate for the first art pass, which still wants
`tools/glow-lab.html` and does not have it.

### Fields `state` gains

**None.** The Weaver holds a reference to the Thorn it is growing; that is an
instance field. `C.DEBUG_SPAWN_KINDS` is a tunable. Nothing here needs run state
that does not already exist — a good sign about CS003's spine, and it means
`test-registry.js`'s `STATE_FIELDS` gets no `CS004` key.

---

## Acceptance criteria

**The contract**

- [ ] ⛔ `Enemy` carries `anchored`, default `false`, documented as a statement
      about what `depth` means rather than about movement.
- [ ] ⛔ `respawnSkimmer()` skips anchored entities, and the ⚠ SETTLED comment
      above it is **extended, not replaced** — the clamp is still broad, still
      every lane, still not narrowed. **Mutation-checked:** removing the skip
      turns the suite red; so does narrowing the clamp to a rim band.
- [ ] A Thorn at `depth 0.9` still measures `0.9` after a player death and
      respawn, driven through real `update(1/60)`.
- [ ] The base class still holds no movement, no AI and no draw code.
- [ ] GDD §6.5's field table goes from six fields to seven.

**The bench and the sweep**

- [ ] Five named actions reach `runAction()` through `input.sample()`. ⛔ No
      second `keydown` listener exists anywhere in the build, and none of the new
      keys collides with `r` or `w`.
- [ ] Each spawn action produces exactly one entity of the named kind, through
      `spawnEnemy()`, and inherits the safe-spawn rule.
- [ ] ⛔ `pickSpawnKind()` spends **no** RNG draw when `DEBUG_SPAWN_KINDS` has one
      entry: `test-cs003-p5.js`'s determinism hash is unchanged.
      **Mutation-checked:** an unconditional `rngPick` turns the suite red.
- [ ] With a multi-entry list, kinds are drawn from `state.rng` and two runs on
      one seed produce the same kind sequence.
- [ ] All twelve `CS005` pointers are correct for the renumber, and the two that
      say "the four death conditions CS004 and CS005 add" are rewritten rather
      than renumbered.
- [ ] The stale root `_harness.js` is gone; the suite is green without it.

**The Carrier**

- [ ] Climbs one lane at `CARRIER_CLIMB`, never hops, stops at the rim.
      `killDepth` is `1 - C.RIM_CONTACT_DEPTH`.
- [ ] `onShot` kills it, consumes the shot, and spawns exactly two children of its
      cargo kind at the parent's depth.
- [ ] ⛔ Both children go through `spawnEnemy()`. A child placed in the Skimmer's
      lane above `SAFE_SPAWN_DEPTH` is **lowered**, never relocated.
- [ ] ⛔ `splitLanes()` returns two **distinct legal** lanes on all sixteen wells,
      including from lane 0 and lane `lanes-1` of every open well.
- [ ] ⛔ A split at `C.ENEMY_CAP` adds no children and the cap is never exceeded.
      **Mutation-checked:** a split that bypasses `spawnEnemy()` turns the suite
      red.
- [ ] ⚠ The Purge kills a Carrier **without splitting it**: `updatePurge()` sets
      `dead` and never calls `onShot()`. One Purge on a well of Carriers leaves
      the well empty.
- [ ] A split during the shot loop leaves `state.enemies` consistent: nothing
      lost, nothing double-visited by the same shot, the cap respected, the
      children present after the end-of-frame filter.
- [ ] Hull and cargo glyph are two polys through `entityPoints()`,
      `drawPoly` + `glowStroke`, no fill.

**The Weaver and its bolt**

- [ ] The cycle runs — climb to `WEAVER_APEX`, hold `WEAVER_APEX_HOLD`, fire
      exactly one bolt, retreat at `WEAVER_RETREAT`, repeat — with `depth` never
      leaving `[0, 1]`.
- [ ] ⛔ `killDepth` is `null` — the body never kills, at any depth, including at
      the rim. §4.5 lists the projectile, not the Weaver.
- [ ] The Weaver `blocksClear`; a well cannot clear with one alive.
- [ ] The bolt travels rim-ward at `WEAVER_BOLT_SPEED` in the lane it was fired
      in, never changes lane, and kills at `1 - C.RIM_CONTACT_DEPTH` — §4.5's
      fourth death condition, live, through the real `killSkimmer()`.
- [ ] ⚠ The bolt is **not shootable**: `onShot` returns `false` and the shot flies
      on. It does not block the clear. It **is** purgeable.
- [ ] A bolt reaching the rim with no Skimmer in its lane dies at `depth 1`
      rather than accumulating.

**The Thorn**

- [ ] ⛔ Not purgeable. Survives the Purge's first use and is never the second
      use's victim, on a board where it is the entity nearest the rim.
- [ ] ⛔ Does not block the clear. A well with a full-length Thorn and nothing
      else alive, quota spent, clears.
- [ ] `killDepth` is `null`. It kills only during the Dive, which does not exist.
- [ ] A shot stops at the tip, chips `THORN_CHIP`, is consumed, and frees its
      `SHOT_MAX` slot the same step. ⚠ The rapid chip-away under held fire is
      §4.2's settled emergent behaviour and is asserted, not smoothed.
- [ ] A Thorn chipped to zero or below dies.
- [ ] ⛔ It is `anchored`, and a death and respawn does not shorten it.
- [ ] The Weaver grows the Thorn in its lane as it climbs, clamped to
      `THORN_MAX`, and **adopts a live Thorn already in that lane** rather than
      creating a second.
- [ ] A Weaver killed mid-climb leaves its Thorn at the length it had reached.
- [ ] Drawn as a lane segment through `drawPoly` + `glowStroke` with preallocated
      scratch. ⛔ No per-frame allocation.

**Cross-cutting (P5)**

- [ ] ⛔ §17 item 3, extended: 5,000 ticks on each of the six open wells with all
      four kinds live, splitting, laying, chipping and firing, plus adversarial
      rotation input. No `lane` outside `[0, lanes-1]`, no `depth` outside
      `[0,1]`, no NaN in state or in any projected point, no array growing without
      bound.
- [ ] ⛔ **And the range check is not enough** (finding 7). None of CS004's four
      entities hops, so assert the strong form: a Carrier, Weaver, Thorn or bolt's
      `lane` is **exactly** the lane it entered with, on every tick, on every
      well. `MAX_LANE_STEP` stays the Vaulter's.
- [ ] §17 item 1 re-verified with the new draws: same seed and recorded input ⇒
      identical state hash after 10,000 ticks, twice in one process and once
      across two.
- [ ] §17 item 5 re-verified: the Purge's two uses with a non-purgeable entity on
      the board, which was untestable until now.
- [ ] §17 item 6 (Carrier splits) passes for the one shipped cargo row, written as
      a loop over `CARGO` so CS005 adds rows rather than a test.
- [ ] 20 seeded runs to game over on a mixed `DEBUG_SPAWN_KINDS`, no exception.
- [ ] ⛔ `scratchpad/test-registry.js` `enemies` goes 1 → 4. That count lives there
      and nowhere else. The bolt is not a §6.1 roster row and is not counted.
- [ ] `node build.js` and `node scratchpad/run-all.js` green, zero skips.

---

## ⛔ Scope boundaries — what this changeset does NOT touch

**No Drifter and no Surger.** Not their classes, not their constants beyond the
two palette entries, not their cargo rows. CS005. ⛔ Do not write a Surger
"because the telegraph constant is already in `C`."

**No `laneHop` change and no per-entity `MAX_LANE_STEP`.** The fold-point
degeneracy in finding 5 is real and it is CS005's, because the Drifter is the
entity that makes it matter. ⛔ Do not "fix" it here — the Vaulter's behaviour on
that path is documented and correct, and changing the helper without the entity
that exercises it means changing it blind.

**No `laneState`.** `drawWell()`'s parameter stays unwired. CS006.

**No scoring.** A Carrier kill, a Weaver kill and a Thorn chip all award nothing.
⛔ `addScore()` is CS007's single entry point and the way to protect that is to
not build a second one now. `PTS_CARRIER`, `PTS_WEAVER` and `PTS_THORN` stay
unread.

**No heat and no introduction schedule.** Every constant here is a flat level-1
value. The Carrier does not wait for L3 and the Weaver does not wait for L5. ⛔ No
second clock, no per-well counter, no "difficulty" field. CS006.

**No cargo weights.** §8's "Carrier cargo weights shift toward Drifter/Surger" is
heat, and it needs two cargo kinds that do not exist. ⛔ The `CARGO` table is a
shape with one row; it is not a weighted draw yet.

**No Dive.** The Thorn's real consequence — §4.5's fifth death condition — is the
Dive, and there isn't one. `WELL_CLEAR_HOLD` still runs. CS006 inserts the Dive
and wires condition 5.

**No HUD, no audio, no fragmentation, no Overdrive.** Unchanged from CS003.

**No grab.** §6.1's "contact / grab" is presentation. Contact kills.

**No `tools/glow-lab.html`.** The palette ships ⚠ provisional and `spawnRow` is
the bench that makes it judgeable. The lab is a real tool and wants its own phase,
in whichever changeset owns the art pass.

**No answer to `throatOffset` or the degenerate Flat well.** Both are open design
calls for Paul and neither is an enemy question. ⚠ `STATUS.md` currently names
CS004 as the Flat well's "natural landing spot, per `ROADMAP.md`" — that is
stale; `ROADMAP.md` never put well progression in CS004, and after the renumber it
is CS006. P1's sweep corrects that line.

---

## Known hazards

**⛔ The respawn shortens Thorns, and the line is marked ⚠ SETTLED.** Findings 1
and 2. This is the only *bug* in the current build CS004 is obliged to fix, it
does not announce itself, and the fix lands two lines under a marker that tells a
session to stop. Both halves have to be in the prompt.

**⛔ A range check does not catch a wrapping hop.** Finding 7. `STATUS.md` puts
this under "Working / verified" as the thing to know before touching lane code,
and it is why CS004's soak asserts exact lane equality rather than a bound.

**⛔ The split runs inside the collision pass's loop.** Finding 3. Safe, for three
reasons in two files. Write the reasoning at the call site, not in the test.

**⛔ `splitLanes()` at an open well's wall.** Finding 3. `laneNormalize` clamps, so
a naive `±1` stacks two children in one lane. The rule: on an open well, shift the
pair inward until both are legal and distinct. A parent at lane 0 of a 13-lane Vee
yields children at lanes 0 and 2 — the pair still straddles a lane, and the lane
it straddles is the parent's.

**§6.2's "adjacent" and "flanking" are the same geometry.** Vaulter cargo is "2
Vaulters, adjacent"; Surger cargo is "2 Surgers, flanking". Both are `±1`. The
distinction §6.2 draws is between the *correct responses* — move away versus hold
still — which comes from what the cargo does, not from where it lands. One
`splitLanes()` serves all three rows; do not invent a second placement rule to
justify the second word.

**⛔ A grown Thorn does not block spawns behind it.** `laneCrowded()` only counts
entities *below* `READABILITY_DEPTH` as crowding a lane. A Thorn with a tip above
0.25 is invisible to the spawn-lane picker, so enemies will spawn at the throat in
thorned lanes — and a shot stops at the tip, so anything below the tip cannot be
hit. It becomes hittable as soon as it climbs above the tip, so the protection is
temporary and self-resolving, and it is inherited from the original. ⚠ Not a bug.
A playtest ask: does a lane you failed to keep clean read as a consequence, or as
the game cheating?

**A full-length Thorn seals its lane.** At `THORN_MAX` 1.00 the tip sits at the
rim, so a shot is consumed the instant it is fired. That is the intended lane
denial and `THORN_MAX` is the knob if it reads as unfair. The Thorn still does not
kill — standing in a sealed lane is safe and useless, which is a strange
combination worth looking at on hardware.

**The bolt briefly shields.** `collideShots()` breaks unconditionally after
`onShot`, so a bolt that declines a shot still costs that shot its resolution for
the ~3 steps of overlap. With eight shots in flight and a 0.055 s cooldown this is
negligible, and it is the same mechanism CS005's armoured Drifter depends on.
Named so it is not rediscovered as a bug.

**Two entities within `HIT_DEPTH_TOL` of each other resolve in array order, not
depth order.** Already ⚠ SETTLED in CS003 for the replay guarantee. Reachable here
for the first time — a Thorn tip and a climbing enemy within 0.05 of each other.
No change; do not add a depth sort to the hot path.

**The `Enemy` base is still a slope.** CS004 adds one field. ⛔ It adds no
behaviour. GDD §6.5 now carries that warning in the shipped paragraph.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | CS004 splits in two; the Drifter and Surger become CS005 and everything after shifts +1 | Six classes, a contract change and two entities with ⛔ readability rules is more than five sessions. If P2–P4 each finish in half a session, merge CS005 back and renumber again — `ROADMAP.md` says renumbering is cheap and means it |
| 2 | The seam is "pours into the shipped contract" vs "readability is the feature" | It is also forced: the L18 and L23 cargo rows cannot exist before their cargo does. If the Drifter turns out to need no `laneHop` change after all, the seam is only a size argument and could move |
| 3 | The renumber's twelve in-repo pointers are P1's, not P5's | A comment naming a changeset reads as shipped truth. CS003 P1 corrected three for exactly this reason and `PLANNED-FEATURES-CS003.md` wrote down why: it should be wrong for the shortest possible time |
| 4 | ⚠ The `anchored` skip is pre-authorised against §4.4's SETTLED marker, in the phase prompt | The marker protects the *depth band*, not the *entity set*. If a session still thinks it is a narrowing, it should stop and say so — that is the rule working, not failing |
| 5 | `anchored` as a seventh contract field, rather than a Thorn special case in `respawnSkimmer()` | A class-name check in the respawn is the first of nine, and the field says something true about `depth` that a future entity may also need. If nothing else ever sets it, it stays one boolean and one line |
| 6 | The Thorn keeps `depth` as its tip rather than gaining a `len` field | A separate extent means `collideShots()` grows a Thorn branch, and that pass is the one place the contract is paying for itself |
| 7 | The Thorn stays in `state.enemies` | Everything it shares with an enemy is exactly the machinery CS003 built for it, and GDD §6.5 now states the one-array rule as shipped. A second array doubles all six wiring points to save one boolean. If CS006's Dive needs Thorns separately, that is a `filter()` at the Dive's entry |
| 8 | CS004's lane assertion is exact equality, not `MAX_LANE_STEP` | None of its four entities hops, so the exact form is both stronger and simpler. `MAX_LANE_STEP` has to become per-entity in CS005 anyway, when the Drifter moves continuously in lane space |
| 9 | Debug spawning is five named actions on the existing `actionKeys` path, on digits | Digits avoid `r` and `w`, which `test-cs003-p5.js`'s recorded list deliberately never presses. If five keys becomes ten in CS005, collapse to a select-and-spawn pair — but not before, because a direct key is faster to use and this is a bench, not a UI |
| 10 | ⚠ `C.DEBUG_SPAWN_KINDS` is a temporary spawner knob, shipping as `["vaulter"]` | It is how Paul plays a mixed well before the schedule exists, at the cost of one constant. CS006 deletes it. If it survives into CS008, that is a smell |
| 11 | ⛔ A one-entry kind list spends no RNG draw | The run's stream is shared, and `test-cs003-p5.js` hashes 10,000 ticks of it. If the list is ever *always* multi-entry, drop the special case with the constant |
| 12 | The bolt is not shootable | It would be a free score piñata and it would remove the lesson, which is that the Weaver's output is dodged, not answered. Reconsider if the Weaver reads as unfair on an open well where dodging costs a wall |
| 13 | The Weaver cycles — climb, lay, hold, fire once, retreat — rather than leaving after one pass | A Weaver that leaves on its own is an enemy the player never has to answer, and `blocksClear` would be meaningless on it. One bolt per cycle keeps the loop nameable |
| 14 | The Weaver adopts a live Thorn in its lane instead of creating a second | Two overlapping Thorns are two hit-point pools behind one silhouette — a §1.1 P2 failure and a scoring oddity at once |
| 15 | ⚠ The Purge does not split Carriers | It already works this way for free: `updatePurge()` sets `dead` and never calls `onShot()`. Recorded so nobody "fixes" the Purge to route through `onShot` for consistency. A panic button that doubles the enemy count is not a panic button |
| 16 | One `splitLanes()` for all three cargo rows | §6.2's two words describe the correct response, not the placement. If CS005 finds a genuine reason for a second geometry, it is a second helper and a line in §6.2 |
| 17 | The six Classic enemy colours land together in P1, including the two CS005 reads | `STATUS.md` asks for exactly this: made once, deliberately, rather than five times by inference. All six are ⚠ and the first art pass owns them |
| 18 | The duplicate root `_harness.js` is deleted by P1 | It has been carried in `STATUS.md` since CS003 P1 with no owner, and CS004 P2's `splitLanes` test walks all sixteen wells through helpers the stale copy does not export. It is a live trap for this changeset, which is what finally gives it an owner |
| 19 | GDD §12's four-second promise is onboarding, and belongs to CS014 | P5 flagged that `STATUS.md` (CS013) and `ROADMAP.md` assumption #6 (level flow) disagreed. Settled toward `STATUS.md`: it needs spawn lanes weighted toward the player, which is a teaching decision, not a difficulty one. `ROADMAP.md` is corrected in the same drop |
| 20 | No `state` fields are added, so `STATE_FIELDS` gets no `CS004` key | If P3 finds the Weaver needs one, that is a finding about the cycle, not about the contract |
| 21 | Five phases, with the cross-cutting soak in its own closing phase | Matches CS003. P1 is a contract change and P4 proves it through the real death path, so neither folds into a neighbour |
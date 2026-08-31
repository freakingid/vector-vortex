# IMPLEMENTATION-PHASES-CS006

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, not a session setting, so it has to be in the pasted message.

**Baseline:** CS005 closed at `de9643a`. `node build.js` green (24 modules),
`node scratchpad/run-all.js` green — 24 files, zero skips, ~7 s.
`test-registry.js` has `wells: 16`, `openWells: 6`, `tracks: 0`, `enemies: 6`,
`enemyKinds: 9`. `C.DIVE_TIME` (2.6), `C.DIVE_TIME_OD`, `C.DIVE_RINGS_MAX`,
`C.HEAT_*` and every `C.PTS_*` exist and are all unread. `src/11-dive.js`,
`src/21-telemetry.js` and `src/22-meta.js` are placeholders.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P0 | The +1 renumber from CS007 onward | Opus 5 | medium |
| P1 | Well progression past 99, `state.bandRoll`, ⛔ no RNG in the draw path | Opus 5 | **high** |
| P2 | `throatOffset`, the Flat and Stair wells, the lane-legibility gate | Opus 5 | **high** |
| P3 | The Dive — the phase, the strike, the death loop guard | Opus 5 | **high** |
| P4 | `laneState` and the dim band producer | Opus 5 | medium |
| P5 | The soak, the golden, the docs, the close | Opus 5 | **high** |

High effort where a wrong first guess costs a later changeset. P1 writes the rule
that keeps every future determinism hash honest, and a draw spent in the wrong
function is invisible headless and only fails in a browser. P2 defines a GDD field
that has been listed and undefined since v0.1.0, and it is the last chance to
catch a broken well before a player sees it in sequence. P3 lands a new phase in
the state machine, GDD §4.5's last unwired death condition, and a loop that costs
a life every 1.5 s if it is got wrong. P5 owns the only sanctioned re-record of
a baseline and four closed-file edits. ⛔ **CORRECTED 2026-08-31, AFTER P3 AND
P4 MEASURED IT: the baseline P5 re-records is `test-cs006-p2.js`'s
`P1_DETERMINISM_HASH`, NOT `test-cs004-p1.js`'s `GOLDEN_LANES`.** The prediction
this document was written on was inverted — `GOLDEN_LANES` is **green and owes
nothing**. See P5's step 2 and `STATUS.md`'s P3 entry.

P0 is medium and small — it is a sweep with a known shape. P4 is medium because
the renderer is already built and the phase is a producer plus a gate; it is also
the natural place to absorb overflow from P3.

---

## P0 — the renumber

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, `ROADMAP.md`, then `PLANNED-FEATURES-CS006.md`
> — the section "⛔ Two changesets, not one" in full.
>
> No code this phase. CS006's scope has been split and the tail renumbers by one.
> This is the sweep, and it gets its own commit so the diff that renumbers is
> never mixed with a diff that builds.
>
> **1. The new sequence.** CS006 becomes *the well ends* — well progression and
> colour bands, `throatOffset` and the two degenerate wells, the Dive. A new
> CS007 becomes *the run escalates* — the heat clock, GDD §8.1's introduction
> schedule, the spawner-stall call, and telemetry. Everything from the old CS007
> onward shifts +1: front of house is CS008, audio CS009, the intensity director
> CS010, meta CS011, Overdrive core CS012, tokens CS013, ring-flight CS014,
> onboarding CS015, ship CS016.
>
> ⛔ Edit `ROADMAP.md`'s sequence table, add the two rows, and add a paragraph
> under "Why this order" saying **why** the split happened — the two halves share
> one file in two different functions, and both halves move `GOLDEN_LANES`, so
> splitting buys two small separately-reasoned re-records instead of one large one
> that absorbs three unrelated causes. Update assumption #3 (telemetry) to say it
> now rides with heat in the *new* CS007, which is the same pairing it always had.
>
> **2. ⛔ Sweep the repo for stale pointers, both ways.** `ROADMAP.md` records
> that the last +1 renumber landed with CS004's split and that the plan predicted
> twelve stale pointers while the sweep found forty-one. Expect the same shape.
> Grep `src/`, `scratchpad/`, `tools/`, `lib/`, `log/` and every root `.md` for
> `CS00[6-9]`, `CS01[0-9]` and for prose naming a changeset by its job
> ("CS006's", "the level-flow changeset", "CS011's split"). For each hit: read it,
> decide what it *meant*, and correct it.
>
> ⛔ **Two hits you will find and must handle differently.** `C.WEAVER_APEX` and
> `C.SURGE_INTERVAL` in `src/00-config.js` carry ⚠ "CS006 makes this heat-derived"
> notes. Those now say CS007. So do the comments in `src/07-enemies.js` that
> predict heat moving the apex under a live Weaver, and `src/09-collision.js`'s
> note that CS006 adds GDD §4.5 item 5 — that one is **still CS006**, because the
> Dive stays here. Read each before you edit it; the changeset number moved for
> some of them and not for others.
>
> ⛔ **`log/` is history and is NOT swept.** A closed log says what a closed
> session believed and correcting it is falsifying a record. If a `log/` entry
> names a changeset by a number that has moved, leave it. Say in `STATUS.md` that
> you left them and why.
>
> **3. Count what you found** and put the number in `STATUS.md`'s ledger line, the
> way CS004 P1 did. If it is far from forty, say so — a low count means the sweep
> missed a pattern.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. A
> comment-only change must leave both green and must not move any hash; if a hash
> moved, you edited code.
>
> ⛔ Edit docs in place. Do not print a document for copy-paste.

---

## P1 — well progression past 99, and the rule about the draw path

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §2, §3.4,
> §3.6, §16.1, §17. Then read `src/23-main.js` end to end — all of it, including
> the header — and `src/13-render-well.js` end to end, and `src/01-rng.js`.
> ultrathink.
>
> **1. The problem, and check it rather than taking my word.**
>
> `drawWell(ctx, well, level, laneState, rng)` takes an `rng` argument for GDD
> §3.6's past-99 palette. `Game.draw()` passes the literal `0` today. The obvious
> way to wire it is `state.rng()` at the call site. **That would be a determinism
> bug and it would be invisible headless.**
>
> Work it out from `Game.frame()`: it runs zero to `C.MAX_CATCHUP_STEPS` updates
> and then exactly one `draw()`, and during hit-stop it runs **zero** updates and
> still draws — so `C.HIT_STOP_DEATH` 1.20 s is about seventy-two draws against no
> simulation. `state.rng` is the run's ONE stream and the next two things that read
> it are the spawn lane and the spawn heading. Prove this to yourself before you
> build anything: drive `G.draw()` N times with no `G.update()`, with a
> `state.rng` you have wrapped in a counting proxy, and confirm the count is zero
> today.
>
> **2. ⛔ The rule, and write it into `CLAUDE.md`.**
>
> > **Nothing in the draw path may call `state.rng()`.** A random value the
> > renderer needs is drawn in the simulation, stored on `state`, and read by
> > `draw()`.
>
> Put it under "Math and lifecycle" beside the depth-model invariant, with one
> sentence of reason — `draw()` runs on a frame clock and `update()` does not, so
> a draw there makes the run's stream a function of frame rate and the symptom
> reads as a physics bug. Add the reasoning to `RATIONALE.md` under a new
> `#draw-path-rng` anchor and name that anchor from `CLAUDE.md`.
>
> **3. ⛔ The past-99 branch, in `nextWell()` and nowhere else.**
>
> ```js
> function nextWell() {
>   state.level += 1;
>   if (state.level > C.BAND_RNG_LEVEL) {
>     state.wellIndex = rngInt(state.rng, WELLS.length);
>     state.bandRoll  = state.rng();
>   } else {
>     state.wellIndex = (state.level - 1) % WELLS.length;
>   }
>   enterWell();
> }
> ```
>
> ⛔ **NOT in `enterWell()`.** That function has three callers and one of them is
> the `w` debug key. A draw there would let a keypress move the run's stream —
> which is exactly why `"w"` is on the `FORBIDDEN` list in three closed soaks.
> Assert this: press `w` a hundred times through `G.input` and confirm the draw
> count is unchanged.
>
> ⛔ **Two draws, spent only past 99**, so the stream below 100 is bit-identical to
> `de9643a`. `state.bandRoll` gets a shipped default in `newState()` and
> `Game.draw()` passes it instead of the literal `0`.
>
> **4. ⚠ `state.level` keeps counting past 99, and say so at the field.**
>
> GDD §3.6's "the counter holds" is about the derived band table and (in CS007) the
> heat curve, not about the clock. `state.level` is the one clock; telemetry
> samples it and `C.PTS_WELL_PER_LEVEL` multiplies by it. Write a ⚠ SETTLED note on
> `state.level` in `src/02-state.js` saying the hold belongs in the *caller* — and
> name the consequence, which is that GDD §17 item 7 (`heat(n+1) > heat(n)` for n
> in 1..200) stays literally true only if `heat()` itself never plateaus. That note
> is for CS007 and it is cheaper to write now, next to the field, than to
> rediscover.
>
> **5. Constants.** `C.BAND_RNG_LEVEL` (99), in the "Well rendering" group beside
> `BAND_RNG_COLORS`, with a comment saying it is GDD §3.6's boundary and is not a
> tuning target.
>
> **6. The test.** `scratchpad/test-cs006-p1.js`, through `_harness.js`, driving
> the real `nextWell` / `startGame` / `Game.draw` out of `dist/`. `installSeed(n)`
> above everything. Cover:
>
> - the level 1..99 `wellIndex` walk is identical to `(level-1) % 16`;
> - ⛔ a counting proxy over `state.rng` shows **zero** extra draws per
>   `nextWell()` below level 100, and exactly two at and above it;
> - two runs of one seed produce the same shape sequence for levels 100..300;
> - `wellBandColor` returns a `C.BAND_RNG_COLORS` member at every level 100..300;
> - ⛔ 600 `G.draw()` calls with zero `G.update()` calls advance the stream by
>   zero;
> - ⛔ 100 `w` presses advance the stream by zero.
>
> ⛔ Assert only what this phase owns. No entity counts, no global inventories.
> `scratchpad/test-registry.js` gains `STATE_FIELDS.CS006 = ["bandRoll"]` and
> nothing else — ⛔ **do not add `dive` yet**, P3 lands it and the sum guard is
> what catches a field built ahead.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> Nonzero exit means not done. Every closed test file must still be green and none
> may be edited this phase.
>
> **7. Docs.** GDD §3.6 gains a paragraph: where the past-99 draw happens, why it
> is not in `enterWell()`, and that the level counter itself does not hold. Update
> `STATUS.md`'s phase ledger — one line. ⛔ Edit in place.

---

## P2 — `throatOffset`, the two degenerate wells, and the legibility gate

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.2, §3.3,
> §3.4, §3.5, §10.1, §17. Then read `src/03-wells.js` end to end — all of it,
> including the header and `wellThroat()`'s memo comment. ultrathink.
>
> No entity and no simulation change this phase. Geometry and data only.
>
> **1. What is broken, and measure it yourself before you fix it.**
>
> `STATUS.md` carries two open calls that are the same call: GDD §3.3 lists
> `throatOffset`, no well uses it, the GDD never says what it offsets, and well 11
> (Flat) renders with zero depth.
>
> The Flat's rim is thirteen vertices all at `y = 0.3`, so its centroid is
> `(0, 0.3)` and every throat vertex is *also* at `y = 0.3`. Rim, throat and all
> thirteen spokes are collinear — the well is a line.
>
> ⛔ **And it is not the only one.** Sweep all sixteen wells for the minimum
> lane-**centre** spoke length (not vertex spoke — `polyAt` puts lane L at vertex
> parameter L + 0.5, so a lane centre is the midpoint of two vertices). I make it:
> Flat 23.6 px, Stair 30.4 px, then a gap to Double-Vee at 76.5 px and Twist at
> 73.9 px, with everything else above 85. Run the sweep and confirm the numbers
> before you accept them. The Stair's cause is the same as the Flat's: its rim
> vertex 6 is `(0, 0)` and its centroid is `(0, -0.108)`, so lane 5's spoke is a
> tenth of lane 11's — an enemy climbing it covers thirty pixels of screen in the
> five and a half seconds a lane-11 enemy uses to cover three hundred and
> sixty-four. That is pillar P2 failing.
>
> **2. ⛔ Define `throatOffset` as what the code already implements.**
>
> `wellThroat()` reads `well.throatOffset.{x,y}` and defaults both to zero. You
> are not choosing a semantic, you are writing down the one that shipped:
>
> > ⛔ **`throatOffset` translates the throat polygon in normalized rim space,
> > applied after the centroid scale.** It is the escape hatch for a rim whose
> > centroid lies on or near the rim itself. Absent means `{x: 0, y: 0}`, so a well
> > that omits it is not a special case.
>
> That sentence goes in GDD §3.3 and at the field in `src/03-wells.js`.
>
> ⛔ **And say at the field that an offset is DATA and must never be written at
> runtime.** `wellThroat()`'s memo caches on `well._throat` and its header already
> carries ⛔ "the cache assumes rim data is IMMUTABLE at runtime." An offset added
> to the well definition is immutable and safe; one written by a future camera
> effect would be read once and cached forever.
>
> **3. The two wells.** Start from `throatOffset: {x: 0, y: -0.50}` for the Flat
> and `{x: 0, y: -0.35}` for the Stair. Those are computed, not felt — they put
> both wells' max/min lane-spoke ratio inside the family the other fourteen occupy
> (Flat 1.98, Stair 4.84, against a shipped Double-Vee at 4.9). ⛔ **Audition them
> in `tools/well-lab.html` before you commit them.** If `well-lab` cannot show a
> spoke length, add the readout, and say in `STATUS.md` that you did. Move the
> numbers if the audition says so and record the final values with one sentence
> each.
>
> **4. ⛔ The legibility gate, because an art rule that rots silently is worth an
> assertion.** This is the shape CS005 P2 used for the Drifter's three-channel
> read. `C.MIN_LANE_SPOKE_PX` (60) in the "Well geometry" group, and GDD §17 item
> 2's geometry test grows a walk: every lane centre of all sixteen wells has a
> spoke of at least that length. ⛔ It is a gate, not a tunable to relax — say so
> at the constant. Sixty separates the two broken wells from the tightest working
> one with no well inside twenty per cent of the line.
>
> **5. ⛔ Prove this changes nothing in the simulation.** Entity position is
> `(lane, depth)` and screen position is derived at paint time
> (`RATIONALE.md#depth-model`), so a moved throat cannot move a hash. Assert it
> rather than asserting it in a comment:
>
> - the 10,000-tick determinism hash at seed 20260830 is identical before and
>   after this phase — take it from the build at P1's commit with
>   `test-cs005-p5.js --hash-only` and compare;
> - `screenPos` output changes for the Flat and the Stair and for **no other
>   well**, at a sweep of lanes and depths;
> - ⛔ no lane-space helper's output changes on any well — `laneNormalize`,
>   `laneDelta`, `laneClamp`, `laneWrap`, `laneHop`, `laneBoundaryLo/Hi`,
>   `boundaryFrom`. An offset throat moves the *visual* end of an open well and
>   moves nothing in lane space, and the two must not be confusable later;
> - `wellThroat()`'s memo still returns the same array reference on a second call,
>   with an offset present.
>
> **6. The test.** `scratchpad/test-cs006-p2.js`, through `_harness.js`, driving
> the real helpers out of `dist/`. `installSeed(n)` above everything. Everything in
> point 5, plus the `MIN_LANE_SPOKE_PX` walk, plus no NaN in any derived position
> at lane centres and at boundaries on all sixteen wells.
>
> ⛔ Assert only what this phase owns. Do not touch `test-registry.js` — the well
> counts are unchanged and this phase adds no `state` field.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. Every
> closed test file must still be green and none may be edited.
>
> **7. Docs.** GDD §3.3 gains the definition. GDD §3.4's table gains a note on the
> two wells that carry an offset and why. GDD §17 item 2 gains the spoke-length
> clause. `STATUS.md` loses both open design calls — ⛔ delete them, do not mark
> them resolved in place, they were listed as open questions. Update the ledger.
> ⛔ Edit in place.

---

## P3 — the Dive

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §2, §4.3,
> §4.4, §4.5, §5, §6.1, §6.5, §16.3, §17. Then read `src/23-main.js` end to end,
> `src/09-collision.js` end to end, and the `Thorn` and `WeaverBolt` classes in
> `src/07-enemies.js` including their headers. ultrathink.
>
> This is the biggest phase in the changeset. It lands a new phase in the state
> machine, GDD §4.5's last unwired death condition, and it deletes a temporary that
> four closed test files read.
>
> **1. ⛔ The Dive replaces `C.WELL_CLEAR_HOLD`. It does not sit beside it.**
>
> `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch at the foot of
> `Game.update()` all go. But read where they sit before you assume the Dive
> inherits the position: the hold is a bottom-of-update branch that the whole
> gameplay pass falls through every step, and the Dive **short-circuits** — during
> a dive there is no spawner, no enemy pass, no Purge and no `collideSkimmer`. So
> it is two edits:
>
> ```js
> // near the top, after the game-over stop and after state.time += dt
> if (state.dive.active) { updateDive(state, well, dt); return; }
> ...
> // at the foot, where the hold branch was
> if (wellCleared(state)) startDive(state);
> ```
>
> ⛔ The dive branch goes **below** the game-over stop, so a dive death that ends a
> run stops the dive too and the frozen board stays on screen.
>
> **2. ⛔ The Dive is NOT Thorns-only, and this is the trap in the phase.**
>
> It is tempting to reason that a well is cleared before a dive, so the only thing
> left is Thorns. Check `WeaverBolt`. It ships `blocksClear = false`, deliberately
> and with a comment — *"a bolt in flight must not hold a cleared well open"* — so
> `wellCleared()` returns true with a bolt travelling, and that bolt carries
> `killDepth = 1 - C.RIM_CONTACT_DEPTH` and is climbing toward the rim the player
> is about to leave.
>
> ⛔ **`startDive()` clears `state.shots` and filters `state.enemies` down to
> `anchored` entities.** Read off the contract field, never a class name. GDD §5
> already ⚠ SETTLES that the player's in-flight shots are cleared; this is its
> companion, and `anchored` is the honest read because it means "`depth` is a
> length" and the Dive's hazard *is* the lane extent.
>
> ⛔ Add a seventh point to GDD §6.5's wiring list: a new entity that is
> `blocksClear: false` and not `anchored` must decide explicitly whether it
> survives a dive.
>
> **3. ⛔ The dive's depth lives on `state.dive`, not on the Skimmer.**
>
> `src/05-skimmer.js` is not touched this phase. A `skimmer.depth` that is `1`
> except for 2.6 seconds is a field two systems can disagree about.
>
> ```js
> // ⛔ The Dive owns its own depth (GDD 5). Deliberately NOT a Skimmer field:
> // 09-collision.js's "there is no term here for where the Skimmer is" stays
> // literally true because collideSkimmer() does not run while this is active.
> dive: { active: false, phase: "grace", timer: 0, depth: 1 },
> ```
>
> ⛔ **And correct the two comments that predicted otherwise.**
> `src/09-collision.js`'s `collideSkimmer` header and `src/07-enemies.js`'s base
> class both say a resting `killDepth` of `0` "becomes honest the moment the craft
> can leave the rim (GDD 5's Dive, GDD 14.2's Jump)". The Dive is **not** that
> moment, because `collideSkimmer` does not run during one. Both comments now name
> Jump alone. ⚠ The Drifter's `killDepth` stays the rim band — `DECISIONS.md`,
> 2026-08-30 — and this phase does not reopen it.
>
> **4. The two beats.**
>
> | Beat | Length | Behaviour |
> |---|---|---|
> | grace | `C.DIVE_GRACE` 0.35 s | `dive.depth` holds at 1. Rotation live. ⛔ no strike test |
> | descent | `C.DIVE_TIME - C.DIVE_GRACE` | `dive.depth` falls 1 → 0 linearly. Rotation live. Strike live |
>
> ⛔ **The grace beat is a P2 requirement and not polish.** `C.THORN_MAX` is 1.00
> and `00-config.js` says a full-length Thorn's tip sits at the rim, deliberately.
> Without a grace beat a dive that begins in that lane is a death on step one with
> no input opportunity. Say that at the constant.
>
> ⛔ `dive.timer` counts **UP** (GDD §16.3). No countdown anywhere.
> ⛔ Snap assist stays live. `C.HIT_LANE_TOL` is 0.5, so safety is lane-granular
> and snapping is aligned with the hazard rather than against it. This is pillar P1
> and it does not get suspended for a set piece.
>
> **5. ⛔ GDD §4.5 item 5 — and it is not a `killDepth`.**
>
> The Thorn's `killDepth` stays `null`. A Thorn's `depth` is a **length** — the
> extent `[0, thorn.depth]` rooted at the throat — and the dive's `depth` is a
> **position**. So the strike is
>
> ```js
> dive.depth <= thorn.depth && laneHit(well, thorn.lane, dive.lane)
> ```
>
> the only two-depth comparison in the build, which is why it lives in
> `src/11-dive.js` and not in the one collision pass. A long Thorn is struck early
> in the descent and a short one late, which is the right read — thorn length *is*
> the hazard.
>
> **6. ⛔ A dive death must not be able to loop, and the naive version does.**
>
> Work it through: strike → `killSkimmer()` → hit-stop → `respawnSkimmer()` puts
> the craft back in the lane it died in → the Thorn is still there, correctly,
> because the rim-push clamp skips `anchored` entities → the dive repeats → the
> strike is true again the instant `C.RESPAWN_INVULN` expires. A full-length Thorn
> burns a life every 1.5 s until the run ends.
>
> ⛔ **The guard: a dive respawn lands in the nearest Thorn-free lane**, chosen
> deterministically — lowest `|laneDelta(well, candidate, diedLane)|`, ties toward
> increasing lane. ⛔ **No RNG**, so it costs the run's one stream nothing; assert
> that with a counting proxy. ⛔ **And if every lane holds a Thorn, the struck
> Thorn dies instead** — that is the termination guarantee and it is the only path
> in the build by which a Thorn is destroyed by something other than a shot. Say so
> at the `Thorn` class, which currently reads as shot-only.
>
> The dive then repeats from the grace beat. ⛔ `state.level` does **not** advance
> — GDD §5: *"repeats the dive, not the well."*
>
> **7. Hazard: the dive reads the OUTGOING well.** `enterWell()` clears
> `state.enemies` and mints a Skimmer for the new well's lane count, so the Dive
> must run before it. `nextWell()` is called at the dive's **end**. A dive that ran
> after `enterWell()` would thread an empty new well and be a 2.6-second pause with
> a doppler on it.
>
> **8. Constants and fields.** `C.DIVE_GRACE` (0.35) in a "Dive" group beside the
> existing `DIVE_TIME`. ⛔ `C.DIVE_TIME_OD` and `C.DIVE_RINGS_MAX` stay unread —
> the ring-flight is CS014's. `state` gains `dive`; `scratchpad/test-registry.js`
> gains it to `STATE_FIELDS.CS006` and ⛔ **loses `clearHold` from
> `STATE_FIELDS.CS003`**, or the sum guard reads a deleted field as an orphan.
>
> **9. ⛔ Four closed test files are edited, and here is the rule you are working
> under.** `test-cs003-p2.js` **asserts** `WELL_CLEAR_HOLD`'s existence and default
> and three `clearHold` cases; `test-cs003-p5.js`, `test-cs004-p5.js` and
> `test-cs005-p5.js` each mix `st.clearHold` into a determinism hash, and
> `test-cs004-p5.js` also sets it as a fixture.
>
> > ⛔ When a later changeset **replaces** behaviour a closed phase's test asserts,
> > it **rewrites those assertions in place to the replacement behaviour**. It does
> > not delete them, does not weaken them, and does not add coverage of its own
> > there. New coverage goes in the new changeset's own file.
>
> CS003 P2 owns *"a cleared well advances on its own after a beat."* The beat's
> mechanism changed; the ownership did not. So that file keeps the case and
> asserts it against `C.DIVE_TIME`. ⛔ **And the three hash fields are replaced,
> not dropped** — `mix(h, st.clearHold)` becomes `mix(h, st.dive.timer)` and
> `mix(h, st.dive.depth)`, or three determinism hashes silently stop covering the
> between-wells beat. Put that rule into `CLAUDE.md`'s test rules.
>
> ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` will go red and you do NOT re-record
> it.** The golden's 3,000-tick window crosses a well clear, so a 1.00 s hold
> becoming a 2.6 s dive moves every spawn after the first. Confirm that is the only
> cause — re-run with `C.DIVE_TIME` temporarily set to `1.00 - C.DIVE_GRACE` and
> check it goes green — then leave it red, and record in `STATUS.md` that P5 owns
> the single re-record. A re-record is the one moment a stray draw can be laundered
> into a new baseline, so it happens once, deliberately, with the cause named.
>
> **10. The test.** `scratchpad/test-cs006-p3.js`, through `_harness.js`, driving
> real `startGame` / `update(1/60)` / `wellCleared` / `nextWell` out of `dist/`.
> `installSeed(n)` above everything. Cover: a cleared well enters the dive and
> `nextWell` is reached only from its end; `WELL_CLEAR_HOLD` and `clearHold` appear
> nowhere in the built file; dive start leaves `shots` empty and `enemies`
> containing only `anchored` entities **with a live bolt on the board at clear**;
> the four passes that must not run during a dive do not run; `dive.depth` holds
> for exactly `DIVE_GRACE` then falls monotonically to 0 and never leaves `[0,1]`;
> no strike during grace with a `THORN_MAX` Thorn in the lane; a strike costs one
> life, repeats the dive and does not advance `level`; a dive respawn lands in a
> Thorn-free lane, same lane on 100 runs of one seed; ⛔ a fully-thorned Fan
> terminates; ⛔ a dive spends zero RNG draws.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> `GOLDEN_LANES` is the **only** permitted red, and `STATUS.md` says so.
>
> **11. Docs.** GDD §5 gains the two beats, the `anchored` filter, the dive-respawn
> rule and the termination guarantee. GDD §4.5 item 5 gains a sentence saying it is
> a dive-phase strike test and not a `killDepth`. GDD §6.5 gains the seventh wiring
> point. Update `STATUS.md` — the carried task about `WELL_CLEAR_HOLD` is
> ⛔ deleted, not marked done. ⛔ Edit in place.

---

## P4 — `laneState` and the dim band

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.6, §3.7,
> §10.2, §10.3, §17. Then read `src/13-render-well.js` end to end and the
> `drawSurgeLane` path in `src/14-render-entities.js`. ultrathink.
>
> **1. Almost all of this is already built, and check that before you write
> anything.** `drawWell(ctx, well, level, laneState, rng)` is wired end to end:
> `wellBandColor` handles all seven bands and the past-99 palette, `wellBaseAlpha`
> handles the dim band at `C.DIM_BAND_ALPHA`, `isLaneLit` reads
> `occupied`/`shotTravel`/`surgeCharge`, and the spoke loop already resolves the
> closed-wrap and open-end neighbour cases. ⛔ **Do not change the renderer.** This
> phase is a producer.
>
> **2. ⛔ And the producer is gated to the dim band. Read the alpha arithmetic
> first.**
>
> A lit spoke draws at `Math.max(baseAlpha, C.LANE_LIT_ALPHA)`. Outside levels
> 65–80 that is `max(1.0, 0.9)` = `1.0` — **identical to unlit**. Lane lighting is
> visible in exactly sixteen levels, and `DECISIONS.md` carries ⛔ *no tuning time
> is spent on the dim band*. An unconditional per-frame per-lane pass would spend
> the §17 perf budget on a no-op at eighty-three levels out of ninety-nine.
>
> ```js
> const lit = wellBaseAlpha(state.level) < 1 ? buildLaneState(state, well) : null;
> drawWell(ctx, well, state.level, lit, state.bandRoll);
> ```
>
> `drawWell` already handles `null`. Confirm the arithmetic yourself; if I have it
> wrong, build the unconditional version and say so.
>
> **3. `buildLaneState(state, well)`.** Flags per GDD §3.7:
>
> - `occupied` — a live enemy in that lane, `|laneDelta| < 1`
> - `shotTravel` — a live shot in that lane
> - `surgeCharge` — a Surger in `telegraph` or `discharge` in that lane
>
> ⛔ **Preallocated, cleared and refilled — never `new Array(well.lanes)` per
> frame.** §17's perf budget forbids per-frame allocation in the hot path. Size it
> to `C.LANE_LIT_MAX_LANES` (16), a module-level constant array, and assert the
> array identity is stable across 600 draws.
>
> ⛔ **The Surger's telegraph stays an entity draw.** `STATUS.md` carries this:
> `drawSurgeLane` paints a progressive throat→rim fill and `isLaneLit()` is a
> boolean over spokes that cannot express one. They are two different marks — the
> spokes light, the fill creeps inside them — and `surgeCharge` sets the first
> without touching the second. Do not move the telegraph onto `laneState`.
>
> **4. ⛔ Nothing here calls `state.rng`.** P1 wrote that rule into `CLAUDE.md`;
> this phase is its first test. `buildLaneState` reads `state.enemies` and
> `state.shots` and draws nothing random.
>
> **5. The test.** `scratchpad/test-cs006-p4.js`, through `_harness.js`.
> `installSeed(n)` above everything. Cover: `buildLaneState` is called at levels
> 65 and 80 and not at 1, 64 or 81; the returned array identity is stable across
> 600 draws; each of the three flags is set by the right thing and by nothing else;
> `drawWell` still accepts `null`; ⛔ 600 draws with zero updates advance the stream
> by zero.
>
> ⛔ Assert only what this phase owns. `test-registry.js` is not touched — this
> phase adds no `state` field and no count.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js`. `GOLDEN_LANES` is still
> the only permitted red.
>
> **6. Docs.** GDD §3.7 gains a sentence saying the producer is gated to the band
> and why, so a future session does not read the gate as an oversight. Update
> `STATUS.md`'s ledger and delete the carried task about `laneState` being unwired.
> Add one ⛔ playtest ask to `PLAYTEST.md`: *"at level 65, does an occupied lane
> read as lit, or does the band just look broken?"* ⛔ It goes in `PLAYTEST.md`,
> not `STATUS.md`. ⛔ Edit in place.

---

## P5 — the soak, the baseline, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, `ROADMAP.md`, then `VECTOR-VORTEX-GDD.md` §0,
> §1, §3.6, §5, §17, §19. Then read `scratchpad/test-cs005-p5.js` end to end
> including its seven-trap header, `scratchpad/test-cs006-p2.js`'s
> `P1_DETERMINISM_HASH` block, and `scratchpad/test-cs004-p1.js`'s golden block.
> ultrathink.
>
> The closing phase. Three jobs: the §17 soak against a build that now has a Dive
> in it, the single sanctioned baseline re-record, and the close.
>
> ⛔ **READ STEP 2 BEFORE ANYTHING ELSE. THIS DOCUMENT WAS WRITTEN ON AN INVERTED
> PREDICTION, AND P3's AND P4's PROMPTS ABOVE STILL CARRY IT.** Those two prompts
> are spent and are deliberately left as they were written; step 2 and the
> overview are corrected, and `STATUS.md` is the authority. Do not act on the
> word `GOLDEN_LANES` anywhere above this line.
>
> **1. `scratchpad/test-cs006-p5.js` — a fourth soak file, not an edit to the
> other three.** CS005's close established the pattern and the reason: a soak
> asserts its own changeset's board. This one owns the Dive.
>
> It extends `test-cs005-p5.js` rather than restating it — same hash mixer, same
> recorded input list shape, same NaN walker, same fixtures — so a reader who knows
> one knows all four. Cover, at minimum:
>
> - **§17 item 1**, with the dive in the hash: 10,000 ticks, same seed, identical
>   hash in one process and across two processes, and a different seed moves it.
>   ⛔ The hashed run must actually *complete a dive* — assert it, or the claim is
>   about a beat that never ran.
> - **§17 item 12**, twenty seeded runs to game over, no exception, no NaN, no
>   unbounded array. ⛔ **`state.enemies` must be checked for unbounded growth
>   across a dive** specifically — the dive filters that array and a filter that
>   dropped the wrong side would show up as a board that empties, not one that
>   grows, so assert both directions.
> - ⛔ **A run that never presses fire still terminates.** The dive is the first
>   thing in the build that can advance a level without a kill, and a passive run
>   that stalls is the shape of every stall this project has found so far.
> - ⛔ **Dive deaths do not loop.** Across the twenty runs, assert no run loses
>   more than two lives inside one dive sequence.
>
> ⛔ Use the same fixture shapes the other soaks use, including
> `C.DEBUG_SPAWN_KINDS = MIXED` and `C.ENEMY_CONCURRENT = C.ENEMY_CAP`, and
> ⛔ **put both back and assert they went back**, as CS004 and CS005 do. The
> standing-Thorn spawner stall is still live and still CS007's; you are working
> around it exactly as they did, not fixing it.
>
> **2. ⛔ The baseline, once — and it is NOT the one this document predicted.**
>
> ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` IS GREEN AND YOU DO NOT TOUCH IT.**
> Measured at the P3 close, not assumed: its 3,000-tick window does now cross a
> well clear, but the extra 1.6 s of dive costs it no spawn, so the recorded lane
> sequence is identical and no re-record is owed. ⛔ **Re-recording a green
> baseline is exactly the laundering the once-only rule exists to prevent.** If
> you find it red, that is a NEW cause, it is not this step, and it gets its own
> line in `STATUS.md` before you do anything to it.
>
> **The one red is `test-cs006-p2.js`'s `P1_DETERMINISM_HASH`** — the 10,000-tick
> state hash at seed 20260830, `1743051713` recorded at `8e0fb7c`, reading
> `2063617640` since P3. Re-record **that**, and only that.
>
> ⛔ **The cause is already proven and you re-verify it rather than re-deriving
> it.** P3 drove the post-Dive build tick by tick against the build at `40044ee`
> over the fields both share: they are **bit-identical for 1,112 ticks and diverge
> on exactly the tick `wellCleared()` first returns true**, in one field —
> `shots.length`, which is `startDive()` clearing the player's shots. Nothing else
> moved. ⛔ **P4 added no second cause, measured:** the hash reads `2063617640`
> both with and without P4's changes.
>
> ⛔ **DO NOT BISECT `C.DIVE_TIME` LOOKING FOR THE OLD NUMBER — IT CANNOT COME
> BACK, AND THE ATTEMPT WILL READ AS A SECOND UNEXPLAINED CAUSE.** Two independent
> reasons, either alone sufficient: the between-wells beat is 2.6 s where CS003
> P2's hold was 1.0 s, **and** the soak's mixer now folds in `dive.timer` /
> `dive.depth` where it folded the deleted `clearHold`. The hashed field set
> changed, so no value of `DIVE_TIME` restores the recorded number. What you
> confirm instead is that the *cause list is complete*: re-run P3's tick-by-tick
> comparison against `40044ee` and assert the first divergence is still that one
> tick and that one field.
>
> Then:
>
> - record the new hash, the commit it came from, and the named cause **at the
>   assertion itself** and in `log/CS006.md`.
> - ⛔ **P2's claim must survive the re-record.** `P1_DETERMINISM_HASH` exists to
>   prove `throatOffset` moved no simulation, and a hash re-recorded on a build
>   that also contains the Dive proves that for the *new* build only. Add the
>   claim back in a form the Dive cannot touch — the lane-space helpers P2 already
>   asserts are unmoved, and `screenPos` moving on exactly the two offset wells —
>   or say in `log/CS006.md` which part of P2's claim the re-record retires.
> - ⛔ **Add the count-based form to your own file**, because a baseline's value as
>   a guard is weakest at the moment it is re-recorded — and here that argument
>   applies to `GOLDEN_LANES` too, which this changeset never re-recorded and
>   therefore never re-examined. Wrap `state.rng` in a counting proxy and assert
>   draws-per-interval-spawn is exactly `1` (the heading, in `spawnEnemy`) plus
>   `pickSpawnLane`'s bounded `[1, C.SPAWN_LANE_TRIES]`, with **no third draw**
>   while `C.DEBUG_SPAWN_KINDS` has one entry. That form is absolute and survives
>   every future retune, and CS007 will need it when the introduction schedule
>   moves the golden.
>
> **3. ⛔ Check the acceptance criteria in `PLANNED-FEATURES-CS006.md` one by one**
> and say which are met, in `log/CS006.md`. Not "all green" — the list, with a
> verdict each. Anything unmet is a ⛔ line in `STATUS.md` with an owner.
>
> **4. The close.**
>
> - `log/CS006.md`: the narrative, the shipped constants and their values, every
>   judgment call, the four closed-file edits with their causes, the golden
>   re-record with its cause, and the version-history entry. ⛔ There is no central
>   changelog.
> - `STATUS.md`: ⛔ move the whole thing to `log/CS006.md` and reset it for CS007.
>   Target under 250 lines so the ~400 ceiling covers a whole changeset's life.
>   Carry forward, unchanged in substance: the standing-Thorn stall and its two
>   CS005 inputs, the rim-parked Carrier reading, the ⚠ provisional palette,
>   `glow-lab` unbuilt and unowned, the `07-enemies.js` split at CS012
>   post-renumber, and the four things CS007 inherits.
> - ⛔ **`PLANNED-FEATURES-CS006.md`'s "Handover to CS007" section is what CS007's
>   spec gets written from.** Do not archive it silently — move both CS006 planning
>   docs to `archive/` and put a one-line pointer to that section in `STATUS.md`'s
>   "Next up" so it is findable.
> - `ROADMAP.md`: mark CS006 closed, with what actually shipped against the row and
>   ⚠ what it deliberately left.
> - `scratchpad/test-registry.js`: ⛔ confirm `COUNTS` reads `wells: 16`,
>   `openWells: 6`, `tracks: 0`, `enemies: 6`, `enemyKinds: 9` — **unchanged.**
>   This changeset added no enemy and no kind. `STATE_FIELDS` has `CS006:
>   ["bandRoll", "dive"]` and `CS003` no longer lists `clearHold`.
> - `PLAYTEST.md`: add the dive's asks — ⛔ one only, the ask the changeset exists
>   for. Mine would be *"does the Dive read as a breath, or as more work?"*, which
>   is GDD pillar P4 and the one thing the suite cannot check.
>
> **5. Version.** Bump `C.GAME_VERSION` and `STATUS.md`'s header line.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. ⛔
> **Zero skips and zero failures — including `P1_DETERMINISM_HASH`, and with
> `GOLDEN_LANES` still green and still on its original recording.** A closing
> phase leaves nothing red. ⛔ Edit docs in place; never print one for copy-paste. ⛔ Do
> not push.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Six phases, one of them (P0) trivial | If P3 overruns, P4 absorbs the overflow — it is a producer against a renderer that already exists, and it is the only phase here with slack |
| 2 | ⛔ **P0 is its own commit** | Nothing. CS004's split renumbered this way and found forty-one stale pointers where the plan predicted twelve; mixing that diff with a build diff makes both unreviewable |
| 3 | **P1 before P2 before P3** | P1 establishes the no-RNG-in-draw rule that P4 is the first real test of, and it must exist before anything else touches the draw path. P2 is pure geometry and pins the build bit-identically, which is what lets P3 be one system against settled screen math rather than a system *and* an argument about the Flat well |
| 4 | ⛔ **P3 leaves one baseline red and P5 re-records it once.** ⚠ **FALSIFIED IN ITS DETAIL, 2026-08-31, and left standing in its principle.** This row predicted the red would be `GOLDEN_LANES`; measured, `GOLDEN_LANES` is **green** and the red is `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` — a hash comparing two runs of the same build, which is the guard the prediction assumed could not be the one to move | Nothing about the once-only rule. A re-record is the one moment a stray draw can be laundered into a new baseline, so it happens once, at the end, with a named cause and a stronger replacement guard beside it. ⛔ What this row's inversion changes is that the *cause* must be re-verified rather than assumed from the plan — P5 step 2 |
| 5 | **P5 writes a fourth soak file rather than editing the other three** | Nothing. CS005's close established the pattern and the reason — a soak asserts its own changeset's board |
| 6 | ⛔ **P3 edits four closed test files, under a rule written into `CLAUDE.md` in the same phase** | Nothing. The alternative is deleting CS003 P2's coverage of the between-wells beat, and dropping `clearHold` from three hashes without a replacement |
| 7 | **Every phase is Opus 5** | Nothing here is mechanical. P0 is the closest and it is a judgment sweep — deciding what a stale pointer *meant* is not a find-and-replace |
# PLANNED-FEATURES-CS014 — the ring-flight Dive, hard-scoped

**Overdrive's Dive becomes a short ring corridor: max 4 seconds, max 6 rings, no
failure state beyond "you stop earning," reusing the depth model (GDD §14.5,
§5, §7, §13, §19, §20 #12). ⛔ It is ROADMAP's FIRST CUT under scope pressure,
so it is shaped the way CS013 shaped the Mimic: the cut is ONE LINE, not a
phase.**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes) and was run at commit `144825e`.
A PREDICTED one says so.

✅ **§0 IS ANSWERED: Paul took every recommendation (2026-09-20)**, RF1–RF9.
A phase prompt that names a call builds the recommendation written beside it and
does not re-open it. ⛔ §2's phase shape, §9's wiring table, §10's ledger and
§11's closed-file table each say which rows depended on which call; every one now
reads its RF-A branch, and the RF-B / RF-C branches are kept only as the record
of what was priced.

**Baseline for every measurement: commit `144825e`** (CS013 P5, the close).
- `node build.js` → 25 modules + 3 inlined kit, `dist/vector-vortex.html`
  **754,849 bytes** (737.2 KB).
- `node scratchpad/run-all.js` → **71 files passed, zero skips, exit 0, 161.6 s
  wall** (MEASURED this session).
- coinless-kit is present beside the repo at **`e2efed5`** (MEASURED,
  `git log -1`). The Worker was not contacted.
- `CLAUDE.md` **45,797 bytes**; `STATUS.md` **401 lines** (MEASURED, `wc`).

**How the probes ran.** Everything lived in this session's scratchpad directory
and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`, `tools/` or
`lib/` was touched** (`CLAUDE.md` rule 3a). Two *variant builds* were shared
`git clone`s of `144825e` in the scratchpad, each carrying one stand-in edit,
with the whole suite run inside the clone (§1.2). A *dive census* and three
smaller probes drove the real `dist/` through `scratchpad/_harness.js` (§1.3–§1.8).

**Read for this plan, beyond the prompt's list:** GDD §4.4, §4.5, §6.5, §10.1–10.2,
§20; `src/09-collision.js` (`killSkimmer`, the kill lines), `src/12-scoring.js`
(`updateCombo`), `src/10-powerups.js`, `src/19-sfx.js` (`musicStateFor`),
`src/13-render-well.js` (`drawWell`, `drawText`), `src/21-telemetry.js`;
`scratchpad/_harness.js`, `test-registry.js`, and the closed assertions §11
names. From `archive/`, only `PLANNED-FEATURES-CS013.md` §0, §8–§12 and
`IMPLEMENTATION-PHASES-CS013.md`, for their form. From `log/`, nothing.

---

## ⛔ 0. PAUL'S CALLS — ✅ ALL ANSWERED 2026-09-20: EVERY RECOMMENDATION

Each is a design call the GDD does not settle, with the measurement that prices
it, the alternatives, and one recommendation. ✅ **Paul took every
recommendation**, as he did in CS012 and CS013 — the third changeset running.
RF2, RF4, RF5, RF7, RF3 and RF8 were put to him as questions; RF1, RF6 and RF9
he took as recommended, each being forced by a measurement or an existing rule
rather than open. ⚠ Every number marked ⚠ is provisional in the sense CS012 O16
used: owned by an art, audio or tuning pass, like the Classic palette.

| # | The call | Recommendation | Answer |
|---|---|---|---|
| RF1 | Where a ring LIVES | A field on `state.dive` — `state.dive.rings` — laid by `startDive()` and reset by `resetDive()`. Not `state.enemies`, not a third array | ✅ As recommended |
| RF2 | Is a ring lane-bound, and what makes taking one a skill | **Lane-bound**: each ring is an ARC covering a contiguous run of lanes, taken by being inside it at its depth. The rim axis stays the only control (§1.1 P1) and GDD §14.5's "lane-less tube" is read as *the corridor has no lanes to climb*, not *the craft has no lane* | ✅ As recommended |
| RF3 | The ring set: how many, at what depths, and what a repeat does | Six, evenly spaced at `(i + 0.5) / 6` in `dive.depth`; laid once per `startDive()`, so ⛔ **a repeated dive re-lays the set and can be earned again** | ✅ As recommended |
| RF4 | What a ring PAYS | `C.RING_POINTS` ⚠ through `addScore()`, ⛔ **unmultiplied, building nothing and rolling nothing** — the Bounty's rule (GDD §7, CS013 T6). A ring is not a kill and the Dive is not a kill site | ✅ As recommended |
| RF5 | Death condition 5 in Overdrive | ⛔ **It stays live.** "No failure state" is read as *no new one*: the Thorn strike, the respawn and the termination guarantee are unchanged in both modes. All five conditions live is a shipped guarantee (GDD §4.5, §19) | ✅ As recommended |
| RF6 | How it is gated, and the cut | A `rings` field in each `C.MODE_FLAGS` row, read by `modeHas("rings")`. ⛔ **The cut is `rings: true` → `false` in the Overdrive row** — one line, MI3's shape | ✅ As recommended |
| RF7 | Scope: does the Dive's VISUAL belong here | **Both modes.** P2 draws the descent — the well travelling — in Classic and Overdrive, and the rings on top of it in Overdrive. CS014 is the only changeset that touches the Dive | ✅ As recommended |
| RF8 | Audio | Two new seats, `ringTake` and `ringMiss` ⚠, in `tools/sfx-lab.html` first. ⛔ **No new track and no director change** — GDD §5's release stands and the combo clock still HOLDS (O5) | ✅ As recommended |
| RF9 | The flight's length and its grace beat | `C.DIVE_TIME_OD` 4.0 read exactly as `C.DIVE_TIME` is — ⛔ **the WHOLE dive, grace included** — with `C.DIVE_GRACE` 0.35 unchanged, giving a 3.65 s descent | ✅ As recommended |

### RF1 — where a ring LIVES

GDD §14.5: rings "are objects at decreasing depth in a lane-less tube, not a
second renderer." CS013 T1 is the precedent both ways, and the prompt asks for
T1's own pricing against `state.enemies`' reader sites.

**MEASURED (§1.4): `state.enemies` has 20 reader functions at `144825e`** — CS013
measured 19; `jumpStrike()` is the twentieth. ⛔ **But the Dive short-circuits the
gameplay pass, so only FIVE of the twenty run inside one.** Over 133,376 played
steps and 132 completed dives, with every reader spied:

| Runs inside a dive | Calls | Runs zero times inside a dive |
|---|---|---|
| `diveHazard()` | 18,794 | `collideShots`, `collideSkimmer`, `updatePurge`, `purgeTarget`, `jumpStrike`, `spawnEnemy`, `threatCount`, `laneCrowded`, `wellCleared`, `thornInLane`, `dangerInputs`, `telemetryRow`, `reconcileSurgeTones`, `updateTokens`, `buildLaneState` |
| `startDive()` (the repeat) | 6 | |
| `respawnSkimmer()` (a dive death) | 6 | |
| `enterWell()` / `nextWell()` (the end) | 131 | |

⛔ **T1's central argument therefore does NOT carry over.** A token had to answer
eight live readers; a ring has to answer two — and both are wrong by default,
and both were measured:

- ⛔ **GDD §4.4's respawn push collapses 3 of 6 rings onto 0.55.** MEASURED in
  variant V2, calling the shipped `respawnSkimmer()` on a board of six rings:
  depths `0.083, 0.250, 0.417, 0.583, 0.750, 0.917` became
  `0.083, 0.250, 0.417, 0.550, 0.550, 0.550`. The clamp skips only `anchored`
  entities, and ⛔ **a ring's depth is a POSITION, so `anchored: true` would be a
  lie about what `depth` means** (GDD §6.5, `RATIONALE.md#thorn-depth`). The
  alternative is a third exemption in a ⚠ SETTLED rule.
- ⛔ **`startDive()`'s `anchored` filter drops every ring on the repeat**
  (MEASURED by reading `11-dive.js:84` and confirmed in V2, where the count is
  right only because the repeat re-lays the set).

**MEASURED (§1.2), the whole-suite cost of each reading:**

| Variant | Files red | Assertions red | The extra one |
|---|---|---|---|
| **V1** — `state.dive.rings`, a `rings` mode flag, `DIVE_TIME_OD` read, six rings paying | 7 | 10 | — |
| **V2** — the same, with a minimal `DiveRing extends Enemy` in `state.enemies` | 7 | **11** | `test-cs012-p2.js:204` "and no tick added two entities" |

⛔ Neither variant moved `P1_DETERMINISM_HASH`, `GOLDEN_LANES`, `test-registry.js`
or any Classic soak (MEASURED, both runs). V2's one extra red is a floor, not a
ceiling: its ring has no `update`, no `draw`, no `onShot` and no `sfxVoice`, and a
real one would also meet the enemy draw loop and `ENEMY_KINDS`.

**MEASURED (§1.4): a THIRD TOP-LEVEL ARRAY is the only reading with a registry
cost.** `test-cs002-p1.js:134` asserts `state` carries exactly
`test-registry.js`'s inventory, so `state.rings` owes a `STATE_FIELDS.CS014` row;
a field on `state.dive` owes none, and V1 measured both green.

- **A — a field on `state.dive` (recommended).** `state.dive` is already a bag
  that only means anything while `active` (`02-state.js`), and CS006 P3's reason
  for it — "a field two systems can disagree about" — is this one. `resetDive()`
  is already the one writer outside `updateDive()`, and `enterWell()` already
  calls it, so the ring set inherits the whole lifecycle with no second reset
  caller. Costs no contract field, no `ENEMY_KINDS` row, no `STATE_FIELDS` row
  and no exemption in either ⚠ SETTLED rule above.
- **B — a third array, `state.tokens`' shape.** A token lives through the *play*
  pass and a ring does not: MEASURED, a ring is alive for 15.7 % of a run
  (§1.3) and inside exactly one function. It buys a registry row and a second
  reset caller for a lifetime `state.dive` already brackets.
- **C — an entity in `state.enemies`.** One extra red assertion MEASURED, plus
  the push and the filter as new exemptions. ⛔ GDD §6.5's "ONE array" rule is
  about **enemies**, and a ring is not one — the sentence it already uses about
  a token.

### RF2 — is a ring lane-bound, and what makes taking one a skill

⛔ **This is GDD §14.5's own named concern** — "different control model mid-run"
— against ⛔ **§1.1 P1, which outranks it.** A lane-less ring is taken by every
diver on every dive, so "you stop earning" has nothing to attach to and the
flight is a 4 s cutscene that pays.

**MEASURED (§1.3, §1.7):**
- Rotation is already live through the whole dive today, grace and descent
  (`updateDive()` calls `state.skimmer.update()`), and snap assist with it.
  The craft **rotated in 90 of 132 dives**, mean span 1.12 lanes, max 16.
- The rim axis is not short of reach: a 3.65 s descent at `C.KEY_SPEED_MAX` 14
  is **51.1 lanes**, and the widest well is 16.
- ⛔ **A half-well traverse is 0.571 s, which does NOT fit inside
  `C.DIVE_GRACE` 0.35 s** — so a ring the player must cross the well for is a
  ring they can miss, and one in reach is a ring they can take. That is the skill
  test, and it is the same axis §1.1 P1 is about.
- ⛔ **A dive spends ZERO RNG draws** (`test-cs006-p3.js:431`, `:444`), so the
  arc positions cannot be drawn. They must be a function of the level, the well
  or a fixed table.

- **A — lane-bound arcs (recommended).** A ring is an arc over a contiguous run
  of lanes, taken when the craft's lane is inside it as `dive.depth` crosses it.
  ⛔ **No new control model**: the one axis, the one snap assist, the one
  `laneDelta`. GDD §14.5's "lane-less tube" is read as *the corridor has no lanes
  to climb* — which is exactly what the Dive already is — rather than *the craft
  has no lane*, which it plainly has (`state.skimmer.lane` is live and the Thorn
  strike reads it).
- **B — full rings, taken by everyone.** Literally "lane-less". It honours the
  words and deletes the mechanic: there is no "stop earning", so the cap becomes
  a fixed payout per dive, which is RF4 with a different name. ⛔ It also makes
  the ring flight indistinguishable from a longer dive with a bonus.
- **C — a second control model** (a throttle, a two-axis nudge, a timed press).
  ⛔ **Loses to P1 by the pillar's own wording** and is the cost §14.5 flagged.
  Not recommended, and if taken it needs its own call about every input device
  (GDD §9).

### RF3 — the ring set: how many, at what depths, and what a repeat does

⛔ `C.DIVE_RINGS_MAX` 6 is a hard cap (GDD §14.5, §20 #12), and it is **unread**
(MEASURED, grep: its only occurrence in `src/` is its own declaration).

**MEASURED (§1.7), off `C`:** at `C.DIVE_TIME_OD` 4.0 and `C.DIVE_GRACE` 0.35 the
descent is **3.65 s**; six evenly spaced rings are one every **0.6083 s**, or
**0.1667** of `dive.depth`. At midpoints `(i + 0.5) / 6` the depths are
**0.9167, 0.7500, 0.5833, 0.4167, 0.2500, 0.0833** — and ⛔ **one of the six sits
below `C.READABILITY_DEPTH` 0.25** (GDD §10.3), which RF7's draw must answer.

**MEASURED (§1.3): 98 of 134 dives began with an EMPTY board** (zero survivors;
mean 0.31, max 2), so in three dives out of four the rings are the only thing in
the well and the flight is the whole of what is on screen.

- **A — six, evenly spaced, re-laid on a repeat (recommended).** ⛔ **A repeated
  dive re-lays the set**, matching GDD §5's "it repeats the dive, not the well"
  and `sfx("dive")`'s own rule (`11-dive.js:98` — a repeated dive plays it
  again). MEASURED: a dive death is rare (7 over 132,956 steps, §1.3), so
  re-earning is worth ~one ring set per 19,000 steps rather than an exploit.
- **B — six, laid once, `taken` carried across a repeat.** Punishes the death
  twice; needs the set to survive `startDive()`, which is the one function whose
  job is clearing what belongs to the outgoing well.
- **C — fewer than six.** Inside the cap either way; `C.DIVE_RINGS_MAX` is a
  ceiling, not a target. ⛔ The value is ⚠ provisional under RF3 whichever way
  this goes.

### RF4 — what a ring PAYS

⛔ **"You stop earning" is a SCORING path, and today a Dive scores nothing.**
MEASURED (§1.9), the claim is asserted **per step in four closed files**:
`test-cs012-p4.js:515`, `test-cs012-p6.js:341`/`:706`, `test-cs013-p2.js:436`
and `test-cs013-p5.js:438`, and CS013 P5 added `:440`, "and rolls nothing". ⛔ A
ring that pays REPLACES that behaviour in Overdrive, and §11 owes every one of
those files a row.

**MEASURED (§1.2): both variants reddened exactly those assertions and no
others on the scoring side** — four files, one assertion each, plus
`test-cs012-p4.js`'s two seed-fragile fixtures.

**MEASURED (§1.6), so the payout can be sized rather than guessed.** Over 108
scored wells on played boards at Start Depths 1 / 7 / 13 in both modes:

| | value |
|---|---|
| Score per well | min 3,100 · median **7,200** · mean 10,133 · max 38,325 |
| Clear bonuses per well | mean 2,951 |
| Combo multiplier in force at the clear edge | 1 … 8, **mean 2.57** |
| `C.EXTRA_LIFE_EVERY` | 40,000 |

⛔ **The multiplier HOLDS through a Dive (O5) and is in force at the clear
edge**, so a multiplied ring set is worth up to 8× on the very dive that follows
the well that earned it. At a hypothetical 100 a ring: 600 unmultiplied is
**8.3 % of a median well**; ×8 it is 4,800, **67 %**.

- **A — `addScore(C.RING_POINTS)`, unmultiplied, building nothing, rolling
  nothing (recommended).** ⛔ This is GDD §7's own rule, not an exception to it:
  *what is multiplied is exactly what builds it*, and that is **kill points at
  the four kill sites**. A ring is not a kill and a Dive is not a kill site. It
  is the Bounty's answer (CS013 T6) and the Thorn chip's, and it keeps the
  four-kill-sites / five-kill-lines invariant literally true. ⛔ It can still
  cross an extra-life milestone, because `addScore()` is unchanged and remains
  the one writer.
- **B — multiplied at the ring line, building the combo.** Makes the Dive a
  fifth scoring site and the combo a thing you farm in a beat GDD §1.1 P4 calls
  a breath. ⛔ It would also need `comboKill()` at a place with no `points()` and
  no `dead` edge.
- **C — rolls a token too.** ⛔ Directly contradicts CS013 T5: `startDive()`
  clears the tokens and the powers, so a token dropped inside a dive is a token
  the next `resetTokens()` deletes, or a token that crosses the throat.

### RF5 — death condition 5 in Overdrive

⛔ **All five of GDD §4.5's death conditions being live is a SHIPPED GUARANTEE**
(GDD §4.5's closing ⛔, §19 Core, `STATUS.md`). GDD §14.5's "no failure state
beyond 'you stop earning'" would remove item 5 in Overdrive if read literally.
⛔ **This plan names that and stops.**

**MEASURED (§1.3):** with a driver that steers for a Thorn-free lane, item 5 fires
**0 times in 133,376 steps**; with one that does not, **7 times in 132,956 steps
across 131 dives** — 5.3 % of dives. **MEASURED (§1.3):** 98 of 134 dives begin
with no survivor at all, so in three dives out of four item 5 has nothing to fire
on. ⛔ The condition is cheap to keep and it is the only thing that makes the
existing dive a skill test rather than a pause.

- **A — item 5 stays live in both modes (recommended).** "No failure state" is
  read as *the ring flight adds no new one*: a missed ring costs points and
  nothing else. The Thorn strike, `diveRespawn()`, the nearest-Thorn-free-lane
  walk and the termination guarantee are unchanged, and `test-cs006-p5.js`'s
  worst-two-lives bound stands. ⛔ It also keeps the build's ONE two-depth
  comparison the dive strike's (`test-cs013-p3.js:737`).
- **B — item 5 off in Overdrive.** ⛔ Breaks the shipped guarantee, makes GDD §19
  Core mode-conditional, and leaves the Overdrive dive with no hazard at all.
  ⚠ If Paul wants this, it is a GDD §4.5 edit and a §19 row, not a CS014 phase
  detail.

### RF6 — how it is gated, and the cut

⛔ **CS013 R3's rule applies: a field in the rows of `C.MODE_FLAGS`, never a new
top-level key** — `22-meta.js` derives `progress`'s modes from
`Object.keys(C.MODE_FLAGS)`, and `test-cs013-p1.js:60` pins that.

**MEASURED (§1.2):** adding `rings` to both rows reddens exactly three
assertions — `test-cs012-p2.js:54` and `test-cs013-p1.js:58`, `:59` — each a
literal of the table, each repaired in place. **MEASURED:** `modeHas()` has eight
call sites today; the ring flight adds two or three.

- **A — `rings` in `C.MODE_FLAGS`, and the cut is `true` → `false`
  (recommended).** ⛔ MI3's shape: one line removes every ring from every board
  in both modes and Overdrive falls back to the Classic thorn-dodge, with
  `C.DIVE_TIME_OD` unread again. ⛔ **A phase must prove the cut**, as
  `test-cs013-p4.js` proves the Mimic's: mutate the flag and play an Overdrive
  session that lays zero rings and hashes against Classic's dive.
- **B — keyed off `state.mode` directly.** One fewer field and no one-line cut:
  the cut becomes an edit in `11-dive.js`. ⛔ Not recommended for that reason
  alone.

### RF7 — scope: does the Dive's VISUAL belong here

⚠ **The Dive has NO visual in either mode, no changeset owns it, and CS014 is
the only changeset that touches the Dive** (ROADMAP; GDD §5's closing ⚠).

**MEASURED (§1.8):** `state.dive.depth` has **exactly one reader in the whole
build**, `diveStrike()` (`11-dive.js:158`), and ⛔ **not one render file mentions
the Dive at all** (`13-render-well.js`, `14-render-entities.js`,
`15-render-hud.js`: zero hits). **MEASURED (§1.3):** a run spends **15.71 % of
its played steps in a dive** — 20,951 of 133,376 — and at `C.DIVE_TIME_OD` 4.0
that rises to **19.80 %** (from 13.82 %) against a mean well of 16.2 s. ⛔ **One
frame in six shows a still board.**

- **A — both modes (recommended).** P2 draws the descent — the well travelling
  through `dive.depth`, GDD §5's camera widen — in **both** modes, and the rings
  on top of it in Overdrive. The argument is the measurement above: a ring drawn
  against a static well does not read as a flight, so Overdrive's half cannot be
  built honestly without Classic's, and a fifth of Overdrive's frames are this
  beat. Cost: the descent is one value already on `state`, and `drawWell()`
  already takes every parameter it needs.
- **B — Overdrive's rings only.** ⛔ Smaller, and it leaves the Classic dive a
  still board forever, because no later changeset owns the Dive. It also makes
  the ring flight harder to read, not easier: the rings would be the only moving
  thing in a frame whose whole subject is motion.
- **C — neither; presentation is CS016's or CS017's.** ⚠ Honest about scope and
  it is what every changeset since CS006 has chosen. ⛔ But CS016 is onboarding
  and CS017 is ship, and neither has a Dive row.

⛔ **Whichever is chosen, GDD §10.2's rules are not relaxed**: `drawPoly` +
`glowStroke`, no fill, no sprite, text only through `drawText()`, and ⛔ **nothing
opaque below `C.READABILITY_DEPTH` 0.25** (GDD §10.3) — which the deepest ring at
0.0833 sits under (§1.7).

### RF8 — audio

`sfx("dive")` exists and is seated in `startDive()`, so a repeated dive plays it
again (`test-cs009-p5.js:334`). **MEASURED:** `C.SFX` carries **25 events** and
`C.SFX_KILL_PITCH` **11 voices**; `test-cs009-p4.js:37–40` pins the event list by
name. **MEASURED (§1.8):** `musicStateFor()` does not know a Dive exists — the
track continues and the *release* is the director reading `DANGER_NONE`
(`23-main.js:1852`), asserted by `test-cs010-p2.js:346–361`, "a Dive reads 0" and
"a Dive makes no danger read".

- **A — two seats, `ringTake` and `ringMiss` (recommended).** Auditioned in
  `tools/sfx-lab.html` first (⛔ the porting source; 2–3 candidates, a brief, an
  in-context sequence), ported verbatim, candidate A until Paul picks. ⛔ **No
  new track, no director change and no new weight**: GDD §5's release is the
  Dive's music and O5's combo hold is unchanged. A miss needs a sound because
  "you stop earning" is otherwise invisible (§1.1 P2).
- **B — `ringTake` only.** A miss is silence, which is what a miss sounds like.
  Cheaper by one lab brief and one `C.SFX` row.
- **C — no new seat.** The flight is silent except for `dive`. ⛔ Not
  recommended: a scoring event the player cannot hear is the thing §1.1 P2 exists
  to prevent.

### RF9 — the flight's length and its grace beat

⛔ **`C.DIVE_TIME` is the WHOLE dive, grace included** (`00-config.js:94`;
`STATUS.md`). `C.DIVE_TIME_OD` 4.0 is ⛔ a hard cap (GDD §14.5) and is
**unread**.

**MEASURED (§1.7):** read the same way, 4.0 gives a **3.65 s descent** at the
shipped `C.DIVE_GRACE` 0.35 — 62 % longer than Classic's 2.25 s. **MEASURED
(§1.3):** the dive's share of a run rises from **13.82 % to 19.80 %**.
⛔ `C.DIVE_GRACE` is a §1.1 P2 requirement and its argument (a full-length Thorn
at `THORN_MAX` 1.00 whose tip sits at the rim) is unchanged in Overdrive under
RF5-A.

- **A — `DIVE_TIME_OD` is the whole dive, `DIVE_GRACE` unchanged (recommended).**
  One rule for both modes and one place the beats are derived. ⛔ **Assert the
  property, never the step count** (`STATUS.md`: `1/60` is not binary).
- **B — a separate `DIVE_GRACE_OD`.** A second grace to keep in step with the
  first, for no measured need.
- **C — shorten `DIVE_TIME_OD` below 4.0.** Inside the cap; ⚠ the value is
  provisional either way.

### Findings for Paul — not calls

- ⚠ **MEASURED: `test-cs012-p4.js`'s combo fixtures are seed-fragile and BOTH
  variants moved them** — `:1114` "the Overdrive run reached ×N" and `:628` "the
  mutation window is green unmutated" went red in V1 and V2 alike.
  `STATUS.md` already names this file's seed 17 as one of three fragile
  Overdrive fixtures. ⛔ The repair is the FIXTURE, never a lowered claim.
- ⚠ **MEASURED: `CLAUDE.md` is 45,797 bytes, 91.6 % of its 50 KB ceiling.**
  CS014 edits its Dive and scoring rules. The valve (`CLAUDE.md`, "This file's
  own ceiling") fires when an over-size section is next edited.
- ⚠ **MEASURED: a run spends 15.71 % of its steps in a dive and 73 % of dives
  begin with an empty board** (§1.3). Whether the Classic dive is *too long for
  what happens in it* is a tuning question nobody owns; this plan changes no
  Classic constant.

### ⚠ Readings this plan takes and flags

| # | Reading |
|---|---|
| R1 | ⛔ `C.DIVE_TIME` stays 2.6 and `C.DIVE_GRACE` 0.35 in Classic; no Classic constant moves |
| R2 | ⛔ The gate is a field in `C.MODE_FLAGS`' ROWS, never a new top-level key (CS013 R3) |
| R3 | ⛔ The Dive still spends **ZERO** RNG draws, in both modes (`test-cs006-p3.js:431`, `:444`) — the ring lattice is a function of constants, never a draw |
| R4 | ⛔ No telemetry column, no `tally` field, no stats key, no registry change, no Worker contact. `TELEMETRY_FIELDS` stays 29 and `telemetry` v1 |
| R5 | ⛔ No kit module edited, bumped or backported |
| R6 | ⛔ No heat accessor and no `heat()` call — the ring flight reads the level nowhere |
| R7 | ⛔ `C.SPAWN_SCHEDULE_OVERDRIVE` stays at three rows. A ring is not a spawn row and has no `ENEMY_KINDS` entry |
| R8 | ⛔ No HUD item for the ring flight — CS013 T10's rule: each effect shows where it acts |
| R9 | ⛔ GDD §17 items 13 and 14 (rim arrival, rim crossing) are not owed: nothing in a dive arrives at the rim |
| R10 | ⛔ `state.skimmer` gains no `depth`. The Dive's descent stays `state.dive.depth`, and the build's ONE two-depth comparison stays the dive strike's |
| R11 | ⛔ Every new value lives in `C`, grouped under the Dive heading, and no magic number reaches `11-dive.js` |

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the baseline (`144825e`)

`node build.js` → 25 modules + 3 inlined kit, **754,849 bytes**.
`node scratchpad/run-all.js` → **71 files, zero skips, exit 0, 161.6 s**.
`wc`: `CLAUDE.md` **45,797 bytes**, `STATUS.md` **401 lines**.
`git -C ../coinless-kit log -1` → **`e2efed5`**, present beside the repo.
Off the built `C`: `MODE_FLAGS` **3 fields per row**; `SPAWN_SCHEDULE` **7 rows**,
`SPAWN_SCHEDULE_OVERDRIVE` **3**; `C.SFX` **25 events**, `SFX_KILL_PITCH` **11
voices**; `TELEMETRY_FIELDS` **29**; `state` **28 top-level keys**; `tally`
**8 fields**; `COUNTS` **enemies 9 / enemyKinds 13**.

### 1.2 MEASURED — two stand-in variant builds, the whole suite in each

Shared `git clone`s of `144825e` in the scratchpad, each patched, built and run
with `node scratchpad/run-all.js`. ⚠ Both clones report **2 SKIPs**
(`test-cs011-p5.js`, `test-cs012-p3.js`) because `../coinless-kit` does not
resolve from the scratchpad — a clone artefact, not a repo state; the real
baseline has zero skips (§1.1).

**V1 — the recommended shape.** `rings` in both `C.MODE_FLAGS` rows;
`state.dive` gains `rings: []` and `taken: 0`; `startDive()` lays
`C.DIVE_RINGS_MAX` rings at `(i + 0.5) / 6`; the descent reads
`modeHas("rings") ? C.DIVE_TIME_OD : C.DIVE_TIME`; a crossed ring pays through
`addScore()`.

**V2 — the same, with the rings as entities.** A minimal `DiveRing extends
Enemy` (`purgeable: false`, `blocksClear: false`, `anchored: false`, no
`update`, no `draw`, no `onShot`) pushed into `state.enemies` by `startDive()`.

| File | V1 | V2 | The assertion |
|---|---|---|---|
| `test-cs006-p3.js:95`, `:97` | 2 | 2 | `C.DIVE_TIME_OD` / `C.DIVE_RINGS_MAX` "still unread" |
| `test-cs012-p2.js:54` | 1 | 1 | the `C.MODE_FLAGS` literal |
| `test-cs012-p2.js:204` | — | **1** | "and no tick added two entities" |
| `test-cs012-p4.js:515`, `:628`, `:1114` | 3 | 3 | item 8's dive skip; two seed-fragile fixtures |
| `test-cs012-p6.js:706` | 1 | 1 | "a Dive scores nothing and builds nothing" |
| `test-cs013-p1.js:58`, `:59` | 2 | 2 | Classic's and Overdrive's `MODE_FLAGS` rows |
| `test-cs013-p2.js:436` | 1 | 1 | item 8 with Lance live, the dive skip |
| `test-cs013-p5.js:438` | 1 | 1 | item 8 in Overdrive, call by call |
| **Total** | **7 files, 10** | **7 files, 11** | |

⛔ **Green in both, and named because a move would be a defect:**
`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` **1229033515**;
`test-cs004-p1.js`'s `GOLDEN_LANES`; `test-registry.js` and
`test-cs002-p1.js:134`'s state inventory; every one of the eleven soaks'
Classic pairs; `test-cs006-p5.js`'s dive section entire (it is a Classic soak);
`test-cs010-p2.js`'s "a Dive reads 0"; `test-cs007-p2.js`, `test-cs008-p1.js`,
`test-cs008-p1b.js`, `test-cs008-p2.js`, `test-cs008-p8.js`, `test-cs012-p5.js`,
`test-cs013-p3.js`, `test-cs013-p4.js`.

### 1.3 MEASURED — the Dive as played

Eight sessions (both modes × Start Depths 1 / 7 / 13 / 17), a board-reading
driver in `test-cs013-p5.js`'s shape — held fire, hunt the deepest live
non-projectile, dodge a `MimicShot`, go to a hovering token, jump at anything
aloft — with a **dive clause** that steers toward the nearest Thorn-free lane,
and a second pass with that clause removed.

| | steering | not steering |
|---|---|---|
| Played steps | 133,376 | 132,956 |
| Dives ended | 132 | 131 |
| Dive steps | 20,951 = **15.71 %** | 21,543 = **16.20 %** |
| Dives beginning with **zero** survivors | **98 / 134** | 97 / 132 |
| Survivors on the board at a dive's start | min 0, max 2, mean **0.31**; all `anchored` | same |
| ⛔ Thorn deaths (GDD §4.5 item 5) | **0** | **7** |
| Dives in which the craft rotated | 90 / 132 | 89 / 131 |
| Lane span travelled in a dive | max 16, mean **1.12** | max 16, mean 0.98 |
| Steps between dives (a well's own length) | min 771, max 1,333, mean **972 = 16.2 s** | mean 980 = 16.3 s |

⛔ **Dive share of a run: 13.82 % at `DIVE_TIME` 2.6, 19.80 % at `DIVE_TIME_OD`
4.0**, against the measured mean well.

### 1.4 MEASURED — which of `state.enemies`' readers run during a dive

Every reader the harness exports was spied with a `.before` hook that bucketed
each call by `state.dive.active`, over the sessions in §1.3. The table is in
RF1. **20 reader functions; 5 run inside a dive; 15 run zero times.** Counted on
comment-stripped `src/`, `state.enemies` appears on **34 code lines across 20
enclosing definitions** (CS013 §1.4 measured 19; `jumpStrike()` is the new one).
`state.tokens`: **9 lines, 5 definitions**. `state.dive`: **7 lines, 6
definitions**.

### 1.5 MEASURED — the respawn push against rings

In V2, the shipped `respawnSkimmer(state, well, 0)` called once on a dive board
holding six rings: `0.083, 0.250, 0.417, 0.583, 0.750, 0.917` →
`0.083, 0.250, 0.417, 0.550, 0.550, 0.550`. ⛔ **3 of 6 moved**, onto
`C.RESPAWN_PUSH_DEPTH` 0.55.

### 1.6 MEASURED — what a well pays, and the multiplier at the clear edge

Six sessions (both modes × Start Depths 1 / 7 / 13), `addScore` spied, the
delta banked at every clear edge. **108 wells**: min 3,100, median **7,200**,
mean 10,133, max 38,325; clear bonuses mean 2,951. The multiplier in force at
the clear edge took **13 distinct values, ×1 … ×8, mean 2.57**.

### 1.7 MEASURED — the Dive's arithmetic and the ring lattice

Off the built `C`: `DIVE_TIME` 2.6, `DIVE_GRACE` 0.35, descent 2.25 s;
`DIVE_TIME_OD` 4.0 → descent **3.65 s**; `DIVE_RINGS_MAX` 6 → one ring every
**0.6083 s** or **0.1667** of depth; midpoints **0.9167, 0.7500, 0.5833,
0.4167, 0.2500, 0.0833**, of which **one is below `READABILITY_DEPTH` 0.25**.
`KEY_SPEED_MAX` 14 → 3.65 s is **51.1 lanes**; the widest well is 16 lanes and a
half-well traverse is **0.571 s**, which does **not** fit inside `DIVE_GRACE`.
Through `screenPos()`, the Ring well's rim polygon spans 577 × 577 px at depth 1
and 286 × 286 px at depth 0.25.

### 1.8 MEASURED — the Dive has no visual

`grep` over `src/`, comments excluded: `state.dive.depth` has **exactly one
reader in the build**, `diveStrike()` (`11-dive.js:158`). `state.dive.active` has
four (`11-dive.js:82`, `12-scoring.js:191`, `23-main.js:1547`, `:1852`).
⛔ **None of `13-render-well.js`, `14-render-entities.js` or `15-render-hud.js`
mentions the Dive at all.** `musicStateFor()` (`19-sfx.js:163`) does not read it
either — the Dive's music is GDD §5's release, through `DANGER_NONE`.

### 1.9 MEASURED — the closed pins read for §11

Read, with line numbers, at `144825e`: `test-cs006-p3.js:95–98`;
`test-cs006-p5.js:555–580`; `test-cs002-p1.js:132–135`;
`test-cs009-p4.js:37–43`; `test-cs009-p5.js:26`, `:324–355`;
`test-cs010-p2.js:346–364`; `test-cs012-p2.js:54–56`, `:204`;
`test-cs012-p4.js:253–272`, `:350–358`, `:457`, `:515`, `:628`, `:1114`;
`test-cs012-p6.js:183`, `:339–342`, `:706`; `test-cs013-p1.js:58–60`, `:221–222`;
`test-cs013-p2.js:380`, `:436`, `:596–606`; `test-cs013-p3.js:725–738`,
`:758–762`; `test-cs013-p4.js:514–515`; `test-cs013-p5.js:233`, `:384–392`,
`:436–441`, `:724–726`; `test-cs011-p3.js:176–196`; `test-registry.js:11–75`.

---

## 2. THE SHAPE

**Three phases, one session each.** ROADMAP's guideline is 3–5; GDD §14.5 prices
the whole feature at "a few hundred lines".

| Phase | Builds | Depends on |
|---|---|---|
| **P1** | The flight: the gate, `C.DIVE_TIME_OD`'s and `C.DIVE_RINGS_MAX`'s first readers, the ring set as data on `state.dive`, the take pass, and the score path — "you stop earning" | RF1–RF6, RF9 |
| **P2** | The Dive's visual (RF7's answer) and the two audio seats (RF8) | RF7, RF8 |
| **P3** | The twelfth soak, the review, the close | all |

**Why three, and why these seams.**
- **P1 is one seam wide: simulation.** Everything that moves a hash or reddens a
  closed assertion is in it — the mode flag, the two unread constants, the ring
  lattice and ⛔ the scoring path, which is what §11's four soak files are
  about. Splitting it would put half the score claim in one commit and half in
  the next, and the closed files assert it per step.
- **P2 is presentation and nothing else.** ⛔ Under RF7-A it draws in both
  modes; under RF7-B only Overdrive's rings; under RF7-C the phase is the audio
  seats alone. In every reading it moves no state and no hash — the Jump's lift
  is the precedent (`C.JUMP_LIFT` at 0 leaves the hash identical), and P2 owes
  the same proof.
- ⛔ **The cut stays one line across the seam.** Under RF6-A, `rings: false` in
  the Overdrive row takes P1 *and* P2 out together: no ring is laid, so none is
  drawn and neither seat fires. P3's soak proves it (§6).
- **Four was considered** — the ring set apart from the score path, or the soak
  apart from the close. The first splits one claim across two commits; the
  second is what CS012 P6 and CS013 P5 both held in one session.

---

## 3. P1 — the flight

⛔ **Builds §0's answers to RF1–RF6 and RF9, and invents nothing.**

- `00-config.js`: the Dive group gains the ring constants under RF3's and RF4's
  answers — a ring's points, the arc width under RF2, and whatever RF3's lattice
  needs — each ⚠ provisional and named as such. `C.DIVE_TIME_OD` and
  `C.DIVE_RINGS_MAX` get their **first readers**. `C.MODE_FLAGS`' two rows gain
  RF6's field. ⛔ Every value in `C`, grouped under the Dive heading; ⛔ no magic
  number in `11-dive.js`.
- `02-state.js`: under RF1-A, `state.dive` gains the ring set and its comment
  block says what a ring is and why it is not an enemy (RF1's measured reasons).
  ⛔ Under RF1-B it is a new top-level field and `test-registry.js` gains a
  `STATE_FIELDS.CS014` row; under RF1-C it is neither and §9's contract table
  applies.
- `11-dive.js`: `resetDive()` clears the set; `startDive()` lays it under
  `modeHas(...)`; `updateDive()` gains the take pass. ⛔ **The take pass runs
  BEFORE the strike test and the completion check** — the strike's ordering rule
  (`11-dive.js:266`) is the precedent and its reason is the same: the last step
  of a descent is at depth 0.
- `12-scoring.js` / the take pass: RF4's answer. ⛔ Under RF4-A the call is
  `addScore(C.RING_POINTS)` and nothing else — no `comboKill()`, no
  `dropToken()`, no `tally.kills`.
- ⛔ **A total no-op outside the gate**: in Classic nothing is laid, nothing is
  taken, no draw is spent and the dive is `C.DIVE_TIME` long — asserted as a
  step-by-step hash, the Jump's and the token's proof (`test-cs012-p5.js`,
  `test-cs013-p5.js`).
- ⛔ **The cut is proved in this phase** (RF6-A): with the flag mutated to
  `false`, an Overdrive session lays zero rings, pays nothing in a dive, and its
  dive lasts `C.DIVE_TIME`.
- `scratchpad/test-cs014-p1.js`, and the §11 repairs P1 owns.

## 4. P2 — the visual and the sound

⛔ **Builds §0's answers to RF7 and RF8.**

- `13-render-well.js` / `14-render-entities.js`: under RF7-A or RF7-B, the
  descent and/or the rings. ⛔ `drawPoly` + `glowStroke` only; no fill, no
  sprite; text only through `drawText()`; ⛔ nothing opaque below
  `C.READABILITY_DEPTH` 0.25 (the deepest ring sits at 0.0833, §1.7);
  ⛔ no per-frame allocation in the draw path (GDD §6.5's last ⛔).
- `23-main.js`'s `draw()`: the z-order. ⛔ A ring is drawn where a token is —
  above the well, below the enemies — or the Thorn a diver is threading is
  behind a gift.
- `tools/sfx-lab.html` and `C.SFX`: RF8's seats. ⛔ Each new event is **ONE line
  starting `    name:`** in `00-config.js`'s SFX group, which is sfx-lab's BLOCK
  SFX, and owes the lab a brief, an A label, 1–2 alternates and an in-context
  sequence. ⛔ Candidate A ships until Paul picks.
- ⛔ **The hash does not move.** P2 is draw-time and seat-only: a seat writes no
  `state` and draws nothing, and the visual reads values the simulation already
  holds. The phase asserts it the way `C.JUMP_LIFT` at 0 is asserted.
- `scratchpad/test-cs014-p2.js`.

## 5. P3 — the twelfth soak, the review, the close

`scratchpad/test-cs014-p3.js`, ⛔ **a new file, never a closed one widened**, in
`test-cs013-p5.js`'s form: one front-door driver from the boot title.
- **Classic untouched:** one Classic session played as is and against a build
  with the ring calls stubbed out and the mode flag mutated. ⛔ Same hash every
  frame.
- **The cut:** one Overdrive session against a build with RF6's flag `false`.
  ⛔ Zero rings laid, zero ring score, and the dive is `C.DIVE_TIME` long.
- **The sounds cannot steer Overdrive:** one Overdrive session on the recording
  fake and with no audio API. ⛔ Same hash every frame.
- **Overdrive's invariants on every step:** at most `C.DIVE_RINGS_MAX` rings;
  rings only inside a dive and only in Overdrive; every ring depth in `[0, 1]`;
  ⛔ a dive still spends **zero** draws; ⛔ every `addScore` call inside a dive is
  a ring at RF4's unmultiplied literal and nothing else; the combo unchanged
  across a dive (O5); ⛔ item 5 still fires (RF5); no token and no power inside a
  dive (CS013 T5); `state.enemies` never grows during a dive; no NaN; bounded
  arrays.
- ⛔ **Non-vacuity:** rings were taken AND missed; a dive was repeated after a
  strike; a full set was cleared; an extra life crossed on a ring is staged if no
  played board reaches one.
- **The review:** ⛔ the one pass that reads every phase together. Then
  `log/CS014.md` compressed, `STATUS.md` reset, `ROADMAP.md` and GDD §19
  updated, and `SKIPPED-PLAYTESTS.md` given CS014's entries.

---

## 6. ⛔ THE ONE-LINE CUT (GDD §14.5, ROADMAP)

⛔ **ROADMAP names CS014 as the first cut under schedule pressure**, falling
back to the Classic thorn-dodge. Under RF6-A the whole cut is:

```
    overdrive: { jump: true,  combo: true,  tokens: true,  rings: false },
```

⛔ **What that must be true of, and what P1 and P3 must prove:**
1. No ring is laid, so none is taken, drawn or sounded — P2 needs no edit.
2. An Overdrive dive is `C.DIVE_TIME` long and scores nothing, which is exactly
   the behaviour `test-cs012-p6.js` and `test-cs013-p5.js` assert today.
3. `C.DIVE_TIME_OD` and `C.DIVE_RINGS_MAX` go back to being unread — ⛔ so
   `test-cs006-p3.js:95–98`'s repair must be written to say *what is read*, not
   *that something is*, or the cut turns it red again.
4. ⛔ **No other changeset's code is touched**, ROADMAP's condition on all three
   cuts.

---

## 7. ⛔ THE TWO THINGS A RING IS NOT (GDD §7, §14.1)

Kept apart the way CS013 §8 kept the token's two tables apart.

| | What it is | What it is not |
|---|---|---|
| A ring's points | RF4's `C.RING_POINTS` ⚠ — an unmultiplied literal through `addScore()`, the Bounty's row | ⛔ Not a kill price. It is not on GDD §7's entity table, it has no `points()`, and it is not paid at a kill site |
| A ring's take | RF2's arc test — a lane match inside a depth crossing, in `11-dive.js` | ⛔ Not a collision. `09-collision.js` does not run during a dive, and the build's ONE two-depth comparison stays the dive strike's |

⛔ **Neither names the other's numbers**, and ⛔ **the four kill sites and five
kill lines are unmoved.** CS014 adds no kill site, no kill line and no
`sfxVoice`.

---

## 8. ⛔ "YOU STOP EARNING" AS A RULE

⛔ **Today a Dive scores nothing, builds nothing and rolls nothing**, asserted
per step in FOUR closed files (§1.9). A ring that pays replaces that in
Overdrive, and the replacement has to be as short a sentence as the thing it
replaces or §11's four repairs have nothing to restore. Under RF4-A it is:

> ⛔ **Every `addScore` call inside a Dive is one ring at `C.RING_POINTS`,
> unmultiplied. Nothing else in a Dive scores, and nothing in a Dive builds the
> combo or rolls a token.**

- ⛔ **"You stop earning" is the ABSENCE of a call**, not a penalty: a missed
  ring pays nothing and costs nothing. There is no miss counter, no streak and
  no bonus for a full set — a set is six calls or fewer, and that is the whole
  mechanic.
- ⛔ **The Dive's termination kill still pays nothing** (GDD §5, §7) and is still
  not a kill site.
- ⛔ **`addScore()` stays the ONE writer and the ONE life-awarder.** A ring can
  cross an extra-life milestone, and that is `addScore()` working.
- ⚠ **MEASURED (§1.6), so the number can be set rather than guessed:** a median
  well pays 7,200 and the multiplier at the clear edge averages ×2.57. Six rings
  at `C.RING_POINTS` should be read against that; ⚠ the value is provisional and
  owned by a tuning pass, like `C.COMBO_KILLS_PER_STEP`.

---

## 9. ⛔ CONTRACTS AND WIRING

**Under RF1-A (recommended) a ring is NOT on GDD §6.5's contract**, exactly as a
token is not (CS013 T1): no contract field, no `ENEMY_KINDS` row, no `sfxVoice`,
no `aloft`, no `points()`, and none of `state.enemies`' twenty readers sees one.
Its wiring is its own and it is shorter than a token's:

| Point | A ring under RF1-A |
|---|---|
| `newState()` | inside `state.dive`'s literal — no new top-level field |
| `resetDive()` | cleared; ⛔ `enterWell()` already calls it, so the `w` cycler and a restart are covered without knowing rings exist |
| `startDive()` | laid, under `modeHas(...)` — ⛔ its ONE way in |
| `updateDive()` | the take pass, above the strike test |
| `draw()` | P2's, under RF7 |
| the Dive's repeat | RF3's answer |
| Classic | ⛔ nothing: not laid, not taken, not drawn, not sounded, no draw spent |

⛔ **Under RF1-C** a ring IS on GDD §6.5's contract and owes all nine fields, an
`ENEMY_KINDS` row, an `aloft`, a `sfxVoice`, a `points()`, an `onShot()`, the
seven wiring points and ⛔ **explicit exemptions in `respawnSkimmer()`'s ⚠ SETTLED
push and `startDive()`'s `anchored` filter** (§1.5). The phase table above is
then wrong and P1 grows a section; that is the cost RF1 prices.

---

## 10. ⛔ THE BASELINE LEDGER

| Baseline | At `144825e` (MEASURED) | CS014 (PREDICTED) |
|---|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` | **1229033515** | ⛔ **Unmoved P1–P3.** Every change is Overdrive-gated; V1 and V2 both left it green (MEASURED). A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | the `9ebd27b` sixteen + `2, 5` | ⛔ **Unmoved** (Classic, levels 1–2; green in V1 and V2) |
| The eleven closed soaks' paired hashes | green | ⛔ **Unmoved** — the Classic pairs cannot see Overdrive, and the Overdrive pairs are relational |
| `COUNTS.enemies` / `enemyKinds` | 9 / 13 | **unmoved** under RF1-A or RF1-B; **10 / 14** under RF1-C |
| `COUNTS.wells` / `openWells` / `tracks` | 16 / 6 / 3 | unmoved (R5, RF8) |
| `STATE_FIELDS` | through CS013 | **unmoved** under RF1-A (MEASURED, V1); **+ `CS014: ["rings"]`** under RF1-B |
| `state` top-level keys | 28 | 28 under RF1-A; 29 under RF1-B |
| `C.MODE_FLAGS` | `{ jump, combo, tokens }` per row | **+ RF6's field**, P1 |
| `C.SPAWN_SCHEDULE` / `_OVERDRIVE` | 7 rows / 3 rows | unmoved (R7) |
| `C.SFX` events | 25 | **26** or **27** at P2, under RF8 |
| `C.SFX_KILL_PITCH` voices | 11 | unmoved — a ring is not killed |
| Enemy contract fields | 9 | unmoved under RF1-A/B |
| Kill sites / kill lines | 4 / 5 | ⛔ **unmoved** (§7, §8) |
| `climbMult()` call sites / heat accessors | 7 / 7 | unmoved (R6) |
| `TELEMETRY_FIELDS` / `telemetry` | 29 / v1 | unmoved (R4) |
| `tally` fields | 8 | unmoved (R4) |
| `progress` / `settings` / `scores` / `achievements` | v2 / v1 / v1 / undeclared | unmoved |
| kit-audio / kit-input / kit-menu / kit-leaderboard | 0.4.0 / 0.8.0 / 0.1.0 / 0.2.1 | unmoved (R5) |
| `MANIFEST` | 25 + 3 | ⛔ **unmoved** — the Dive is `11-dive.js` and stays there |
| The suite | 71 files, 0 skips, 161.6 s | **74 files**, 0 skips at the close |
| `dist/vector-vortex.html` | 754,849 bytes | grows; no ceiling |
| `CLAUDE.md` | 45,797 bytes | ⛔ **< 50 KB at every phase's end** (K2) |
| `STATUS.md` | 401 lines | ⛔ **under ~400 at every phase's end** (K1) |

---

## 11. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

Every edit rewrites an assertion or restores a fixture's precondition **in
place** (⛔ `CLAUDE.md`, Test rules). None deletes or weakens one. "MEASURED"
means the file went red under §1.2's stand-in; the real repair is still
PREDICTED.

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs006-p3.js:95–98` | ⛔ **The two "still unread" assertions are REPLACED by their replacement behaviour**: `C.DIVE_TIME_OD` and `C.DIVE_RINGS_MAX` each have exactly one reader, in `11-dive.js`, and the Classic dive is still `C.DIVE_TIME` long. ⛔ Write it so RF6's cut does not redden it (§6 item 3) | **MEASURED** (V1, V2) |
| P1 | `test-cs012-p2.js:54–56` | the `C.MODE_FLAGS` literal gains RF6's field | **MEASURED** (V1, V2) |
| P1 | `test-cs013-p1.js:58`, `:59` | Classic's and Overdrive's row literals gain it; ⛔ `:60`'s "a field in the rows, never a new top-level mode key" is unchanged and is the claim | **MEASURED** (V1, V2) |
| P1 | `test-cs012-p4.js:457`, `:515`, `:584` | item 8's `diveScored` becomes "every `addScore` call inside a dive is a ring at RF4's literal" — ⛔ the claim it was always making, that a dive's score is exactly its events | **MEASURED** (V1, V2) |
| P1 | `test-cs012-p6.js:183`, `:341`, `:706` | the same, and its message | **MEASURED** (V1, V2) |
| P1 | `test-cs013-p2.js:380`, `:436` | the same, with Lance live | **MEASURED** (V1, V2) |
| P1 | `test-cs013-p5.js:438`, `:440`, `:724–726` | the same, plus ⛔ "and rolls nothing", which is **unchanged** under RF4-A and rewritten under RF4-C | **MEASURED** (V1, V2) |
| P1 | `test-cs012-p4.js:628`, `:1114` | ⛔ **FIXTURES, not claims**: restore "the mutation window is green unmutated" and "the Overdrive run reached ×N". ⚠ `STATUS.md` already names this file's seed 17 as seed-fragile. ⛔ Repair the fixture, never the claim | **MEASURED** (V1, V2) |
| P1 | `test-registry.js` | **none** under RF1-A (MEASURED green in V1); `STATE_FIELDS.CS014` under RF1-B; `COUNTS` under RF1-C | **MEASURED** / PREDICTED |
| P1 | `test-cs012-p2.js:204` | **none** under RF1-A; "no tick added two entities" under RF1-C | **MEASURED** (V2 only) |
| P2 | `test-cs009-p4.js:37–40` | `EVENTS` + RF8's seats (it drives `:111`, `:112`, `:132`, `:144`, `:155`, `:166`, `:191`) | PREDICTED (read) |
| P2 | `test-cs009-p5.js:26` | its own `EVENTS` list + RF8's seats | PREDICTED (read) |
| P2 | `test-cs008-p4.js` | **none** predicted — ⛔ but a visual that reaches for `fillRect`, `strokeRect` or a second `fillText` site turns it red, which is the rule working | PREDICTED (read) |
| — | `test-cs010-p2.js:346–364` | **none**: "a Dive reads 0" and "a Dive makes no danger read" are unchanged under RF8-A, and its two loop bounds (60 frames, 2,000) are Classic | **MEASURED** green (V1, V2) |
| — | `test-cs006-p5.js:555–580` | **none**: a Classic soak, and ⛔ its worst-two-lives dive bound is RF5-A's guarantee unchanged | **MEASURED** green (V1, V2) |
| — | `test-cs013-p3.js:737` | **none** under R10: the build's ONE two-depth comparison stays the dive strike's. ⛔ A ring take written as `dive.depth <= ring.depth` on a second object would match the same regex and is **not** a second comparison of that kind — read it before writing the pass | PREDICTED (read) |
| — | `test-cs011-p3.js:176–196` | **none**: a Dive death records one score row, unchanged under RF5-A | PREDICTED (read) |
| — | **kit `VERSION` pins** | **none**: no kit bump (R5). ⛔ A bump would owe four `AUDIO_VERSION` files and one row per signal-path pin | MEASURED (grep) |
| — | **deleted config objects** | **none planned.** ⛔ The `in <OBJECT>` grep: no closed `!("X" in C)` assertion names a CS014 key | MEASURED (grep) |
| — | `test-cs008-p2.js`, `-p8.js` | **none**: both are CLASSIC item-8 decoders and both skip a dive step already (`:489`, `:221`) | **MEASURED** green (V1, V2) |

⛔ **An edit not in this table is a finding.** The phase stops, records it in
`STATUS.md` with its cause, and makes the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed to let a broken one pass.** ⚠ `STATUS.md`'s lesson
from CS013's seven unpredicted edits is a **grep discipline**: a field-list pin
and a prototype pin are two greps, a price table and a mutation string two more.

---

## 12. ⛔ ACCEPTANCE CRITERIA

GDD §19's Overdrive row, after the CS013 close, has **one remaining ✗**:

> ✗ **Still CS014's — the ring-flight Dive.** Overdrive dives with the Classic
> thorn-dodge; `C.DIVE_TIME_OD` and `DIVE_RINGS_MAX` are unread.

and the row's criterion is **"ring-flight inside its 4 s / 6 ring cap"**.

- **Closed when:** an Overdrive dive lasts `C.DIVE_TIME_OD` and no longer;
  at most `C.DIVE_RINGS_MAX` rings exist at any point in it; every ring is taken
  or missed by RF2's rule; RF4's payout is asserted per `addScore` call, staged
  and played; ⛔ **a Classic run is bit-identical**, frame by frame, to one with
  the ring calls stubbed out; ⛔ **the one-line cut is proved** (§6); and
  ⛔ **all five of GDD §4.5's death conditions are still live** (RF5).
- **§17 items:** 1 (the paired hashes), 8 (the ring as a priced event in all
  four item-8 files), 12 (the twelfth soak). ⛔ Items 3, 4, 13 and 14 are **not
  owed** (R9): nothing hops, nothing fires and nothing arrives at the rim in a
  dive.
- **§19 Core stays met:** "Thorns block the Dive" and "in-flight shots clear at
  dive start" are unchanged in both modes.
- **Quality:** no banned vocabulary (the closed scan reads the whole built file,
  comments included, and also bans "atari"); plays from `file://`; ⛔ nothing
  opaque below depth 0.25 (§1.7's deepest ring); the concat build is the oracle;
  ⛔ **zero skips at the close** — the `../coinless-kit` clone is present
  (MEASURED, §1.1).

---

## 13. ⛔ WHAT CS014 DOES NOT DO

- **Achievements** (CS015); **onboarding** (CS016); **the Mimic's probation
  verdict, the performance budget and the device matrix** (CS017).
- **A telemetry column, a `tally` field or a stats key** (R4); **a bench key**;
  **a heat accessor** (R6); **a spawn row** (R7); **a HUD item** (R8).
- **Change any Classic constant** — `DIVE_TIME` 2.6 and `DIVE_GRACE` 0.35 stand
  (R1) — or touch heat, the concurrency ladder or `ENEMY_CAP`.
- **Add a kill site, a kill line or an `sfxVoice`** (§7, §8).
- **Edit, bump or backport a kit module** (R5).
- **Give the Skimmer a `depth`** (R10), or add a second two-depth comparison.
- **Retune the combo, the tokens, the drop rate or the palette.** All ⚠
  provisional and all measured on bots.
- **Draw the touch buttons, feed the VOICE bus, fix the pad-only silence, the
  Surger tone's 1.106 peak, F1 or F4.** All still unowned.
- ⛔ **Under RF7-B or RF7-C, the Classic Dive's visual stays unbuilt and unowned**
  — and this plan says so rather than assuming a later changeset picks it up.

---

## 14. RISKS

- **K1 — `STATUS.md` starts at 401 lines**, at its ~400 ceiling (MEASURED). P1
  compresses before it adds; reasoning goes to `log/CS014.md`, which P1 creates.
- **K2 — `CLAUDE.md` is 45,797 bytes, 91.6 % of its ceiling** (MEASURED). CS014
  edits its Dive, Config and Scoring rules. ⛔ If an edited section is over
  ~4 KB, the valve fires: its **reasoning** moves to `RATIONALE.md` under an
  `#anchor` and its **rule** stays, naming the anchor.
- **K3 — the scoring path is asserted per step in four closed soak files**
  (MEASURED, §1.2). All four are P1's, all four are repairs in place, and ⛔ a
  fifth going red is a finding.
- **K4 — `test-cs012-p4.js`'s combo fixtures are seed-fragile and both variants
  moved them** (MEASURED). ⛔ The repair is the fixture — a re-seed or a longer
  play — never a lowered claim.
- **K5 — RF7-A makes P2 a rendering phase with no oracle a test can read.**
  ⛔ The suite can assert that the descent is drawn, where, and through which
  primitives; it cannot assert that it reads as a flight. That is a **skipped
  playtest** and P2 owes `SKIPPED-PLAYTESTS.md` an entry.
- **K6 — the deepest evenly-spaced ring sits at 0.0833, under
  `C.READABILITY_DEPTH` 0.25** (MEASURED, §1.7). ⛔ GDD §10.3 is a contract, not
  a preference: the ring fades there like a token, or the lattice does not reach
  that deep.
- **K7 — a 4.0 s dive is 62 % longer than a 2.6 s one and takes the dive's share
  of a run from 13.8 % to 19.8 %** (MEASURED, §1.3). ⛔ GDD §14.5's own concern
  is that the ring flight "can break P4 by turning the breath into more work",
  and the cap is what bounds it. ⚠ Whether 4.0 still feels like a breath is a
  skipped playtest.
- **K8 — a closed test may pin the literal text of a line P1 changes.** ⛔ Before
  editing `11-dive.js`, grep `mutate:` across `scratchpad/` for any string in
  that file; `test-cs013-p3.js:737`'s regex is one already found (§11).
- **K9 — the vocabulary scan bans nine whole words, case-insensitive, anywhere
  in the built file, comments included** — and also "atari". A ring is a ring;
  ⛔ the corridor is never named after the game this is an homage to.
- **K10 — a mutation run that throws, or answers unreadably, is a defect in the
  test** (`STATUS.md`): guard the reads, report a COUNT and one index, and
  ⛔ assert the string is in the build exactly once BEFORE asserting red.
- **K11 — `instanceof` is per build** (`STATUS.md`): a helper takes the build as
  an argument, or every non-vacuity check passes on zero.
- **K12 — a phase length is not `Math.ceil(limit / C.FIXED_DT)`** (`STATUS.md`).
  ⛔ Assert the property, never the step count — the ring lattice included.
- **K13 — three Overdrive fixtures are seed-fragile** (`STATUS.md`):
  `test-cs012-p2.js`'s `SOAK_SEED`, `test-cs012-p4.js`'s seed 17,
  `test-cs012-p6.js`'s `OD_CLOCK` 7927. ⛔ Under RF4-A a ring spends **no** RNG
  draw, so none of them should move; ⚠ a move is a finding, not a re-seed.
- **K14 — `sfx()`'s seat scan** (`test-cs009-p5.js:410–430`): a new seat names its
  event as a string literal and passes nothing that writes or draws.

---

## 15. ASSUMPTIONS

- **A1 — ✅ Met: Paul answered §0 on 2026-09-20**, taking every recommendation
  (RF1–RF9), in this document's answer column, as CS012's and CS013's were.
- **A2 — ✅ MEASURED: `../coinless-kit` is present beside this repo at
  `e2efed5`** (§1.1), which the close needs — two closed files read its registry
  and SKIP without it, and ⛔ no closing phase can close with a skip.
- **A3 — Overdrive and Classic still share heat, the ladder, the band roll, the
  Purge and the scoring constants** (GDD §13; CS012 A1, CS013 A3). ⛔ **CS014 is
  what stops them sharing the Dive.**
- **A4 — the twelfth soak fits `run-all.js`'s 120 s per-file timeout** (the
  eleventh took 23.4–27.9 s in §1.2; PREDICTED).
- **A5 — no registry change and no Worker contact** (R4).
- **A6 — Paul does NO playtests** (`CLAUDE.md`, 2026-09-16). Every ask in this
  plan — RF2's feel, RF7's readability, RF9's length — goes to
  `SKIPPED-PLAYTESTS.md` and the shipped values stand.

# PLANNED-FEATURES-CS016 — onboarding: the prompts, attract mode, and the four-second promise measured

**GDD §12 built against the shipped game: the seven first-run prompts (plus
the rows later changesets owe) drawn once per profile in the well's line style,
an attract mode that plays the game unattended after `C.ATTRACT_IDLE` and earns
nothing, the four-second promise MEASURED against level 1 in both modes and
restated to what ships, and — if Paul lands it here — the pre-ship achievement
pass `NEXT-STEPS.md` carries. The fourteenth soak closes it (GDD §12, §10.2,
§10.4, §15.1, §16.4, §17 item 12, §19).**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes) and was run at commit
**`bea33c8`**, the CS015 close. A PREDICTED one says so.

⛔ **§0 IS NOT YET ANSWERED.** Each call carries one recommendation. A phase
prompt that names a call builds the answer Paul writes beside it and does not
re-open it; the B and C branches are the record of what was priced.

**Baseline for every measurement: commit `bea33c8`.**
- `node build.js` → 25 modules + 3 inlined kit, `dist/vector-vortex.html`
  **827,351 bytes** (808.0 KB).
- `node scratchpad/run-all.js` → **78 files passed, ZERO skips, exit 0, 235.3 s
  wall** (3 m 55 s; MEASURED this session; `run-all.js`'s per-file timeout is
  120 s and nothing tripped it).
- `../coinless-kit` is present: `test-cs011-p5.js` and `test-cs012-p3.js` did
  not skip. The Worker was not contacted.
- `CLAUDE.md` **36,926 bytes** (72 % of its 50 KB ceiling); `STATUS.md`
  **277 lines** (MEASURED, `wc`).
- `_harness.js`'s `EXPORTS` has **211** quoted names (MEASURED by regex over
  the array; `STATUS.md`'s "212 at the CS015 close" counts one more — the
  difference is a bookkeeping line, not a missing export, and P1 records the
  count it finds).

**How the probes ran.** Everything lived in this session's own scratchpad
directory and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`,
`tools/` or `lib/` was touched** (`CLAUDE.md` rule 3a); the files this session
writes are its two documents and `STATUS.md`, for the findings §0.1 records.
- **A level-1 probe** (§1.3): the front door (title → PLAY → MODE → START
  DEPTH → play) in both modes at Start Depth 1, under three drivers — *idle*
  (no input), *fire* (fire held, no rotation), *mover* (fire held, a held key to
  the deepest enemy's lane, released inside `HIT_LANE_TOL`) — over **32 time
  seeds each**, 14 s of play, recording every spawn, the first rim arrival, the
  first kill and the first death.
- **A band probe** (§1.4): `test-cs008-p4.js`'s own throat-zone method (every
  lane at quarter-lane steps, every depth below 0.25, all sixteen wells), plus
  the rim's and the craft's extents, plus every HUD rectangle at its widest in
  both modes and both mirrors, against a centred line of the longest §12 prompt
  at three sizes over every top edge from 0 to 720.
- **An attract probe** (§1.5): the closed soaks' four-clause hunter played from
  the front door at a FIXED seed for 45 s in five mode/depth cases, recording
  what it showed and **every storage write** the shipped game made.
- **A lift probe** (§1.6): the airborne craft's lowest drawn point over every
  lane of every well.
- **Seven stand-in variants** (§1.2): `git clone --shared` copies of `bea33c8`,
  each with ONE edit, **the whole suite run in each**, sequentially so the
  per-file timeout could not trip. ⚠ In a clone there is no sibling
  `../coinless-kit`, so `test-cs011-p5.js` and `test-cs012-p3.js` SKIP there;
  that is the clone's location, not the edit.
- **Greps** (§1.7) for `"play"` readers, `mutate:` pins, `in <OBJECT>`
  assertions, `Date.now` readers and the kit `VERSION` literals.

**Read for this plan, beyond the prompt's list:** `src/23-main.js`'s
`enterWell`, `startGame`, `runAction`, `SCREENS`, `runOnScreen`, `syncScreen`,
`update`, `draw`, `frame`, `audioFrame`, `reset` and the boot block;
`src/22-meta.js`'s `Profiles`, `runStarted`/`eligible`/`clearEdge`/`runEnded`,
`facts`, `wellWindow`, `activateSettings` and `boot`; `src/08-spawner.js`
whole; `src/15-render-hud.js`'s `hudLayout` and `drawMenu`;
`src/13-render-well.js`'s `drawText`; `src/02-state.js`'s `newState`;
`src/10-powerups.js`'s `updateTokens`; `src/07-enemies.js`'s Thorn and the
Vaulter's hunt; `src/19-sfx.js`'s `musicStateFor`; `src/04-input.js`'s
`sample`; `build.js`'s `MANIFEST`; `scratchpad/_harness.js`,
`test-registry.js`, `test-cs004-p1.js` (`GOLDEN_LANES`), `test-cs006-p5.js`'s
header, `test-cs008-p4.js`'s method, `test-cs011-p2.js`'s telemetry pin,
`test-cs011-p6.js` and `test-cs015-p4.js`'s declared-keys regexes,
`test-cs014-p3.js`'s and `test-cs015-p4.js`'s front-door drivers,
`test-cs015-p1.js`'s `OWN_KEYS` literal, `test-cs015-p3.js`'s `REACH`. From
`archive/`, only `PLANNED-FEATURES-CS015.md` §0–§2 and §10–§15 and
`IMPLEMENTATION-PHASES-CS015.md`'s head and P1, for their FORM. Nothing from
`log/`.

---

## ⛔ 0. PAUL'S CALLS — thirteen, each with one recommendation

Each is a design call the GDD does not settle, with its measurement and one
recommendation. ⛔ **A build phase builds the answer in the right-hand column
and does not re-open it.** ⚠ Every number marked ⚠ is provisional in the sense
CS012's O16 used: owned by a tuning pass, like the palette.

⚠ **CS016 IS THE FIRST CHANGESET WHOSE HEADLINE PROMISE IS MEASURED FALSE
BEFORE PLANNING BEGINS.** GDD §12's "within four seconds, a player who does
nothing sees a death" cannot be true of the shipped level 1: the first enemy is
released at **1.600 s** and needs **5.283 s** more to reach the rim, so the
earliest death anywhere is **6.883 s** (§1.3, MEASURED over 64 front-door runs,
never once under 6.883). Both numbers are level-1 bases of the one heat clock
(`SPAWN_INTERVAL`, `VAULT_CLIMB`), and `VAULT_CLIMB` is `CLIMB_MAX_BASE`, the
respawn guarantee's binding rate. ⛔ **The other half of the promise is MET**: a
player who moves and fires kills something at **2.38 s** median, **2.68 s**
worst, 64 of 64 runs. N1 is the call that decides which sentence the GDD keeps.

| # | The call | Recommendation |
|---|---|---|
| N1 | **The four-second promise against level 1** — MEASURED unreachable in one half, met in the other | **A — restate §12 to what ships** and teach with the first prompt; touch no spawn lane and no base. §1.3 |
| N2 | **Which prompts ship** — §12's seven, and the rows CS013–CS015 left owing | **§12's seven as written**, plus ⚠ **five candidate rows surfaced for Paul, one recommendation each** (a token, the ring flight, the Warden, the Mimic, the first unlock). Each is a design call; none is answered here |
| N3 | **Where a prompt draws** | **Centre-bottom, under every rim, in BOTH modes**: `C.PROMPT_Y` 636, `C.PROMPT_SIZE` 28, through `drawText()`, drawn after the well and before everything that moves. §1.4 MEASURED it is the one band both modes share |
| N4 | **How long, and how two prompts share the band** | `C.PROMPT_TIME` 4.0 s ⚠, a draw-time fade over its last `C.PROMPT_FADE` 0.5 s ⚠, a FIFO of one line at a time, the clock counting UP on play steps only |
| N5 | **Where "once per profile" lives** | **A new declared key, `onboarding` v1, `{ seen: [ids] }`**, per profile, in `OWN_KEYS`; loaded at activation, MARKED at the trigger and WRITTEN at `saveTelemetry()`'s four seats — never on a bare play step. §1.2 V2/V3 MEASURED the two shapes' costs and the pin that rules out a trigger-step write |
| N6 | **What drives attract mode** | **A board-reading driver in the build**, the soaks' four-clause hunter ported as `attractDrive()`, writing the four-field struct AFTER `input.sample()` |
| N7 | **Its seed, mode, Start Depth and length** | `C.ATTRACT_SEED` fixed, **Overdrive**, `C.ATTRACT_DEPTH` 5 ⚠, `C.ATTRACT_LENGTH` 45 s ⚠. It spends `state.rng` as any run does — the stream is its own and dies with it. §1.5 |
| N8 | **How it is kept out of `Meta.eligible()` and out of storage** | **`run` stays null** (no `Meta.runStarted()`), so the ONE gate reads false for every seat; plus THREE explicit skips — `noteCleared()`, `Telemetry.sample()`, `Meta.clearEdge()` — and the demo's game over goes straight to the title. §1.5 MEASURED which writes a demo-length run makes today |
| N9 | **What ends it, and what the player sees** | **Any device input or named action ends it and does nothing else**; so does its game over and `C.ATTRACT_LENGTH`. It draws the board, the HUD and one line, `C.ATTRACT_LINE` ⚠, in the prompt band. Music is the mode's track through the unchanged `musicStateFor()` |
| N10 | **The idle timer and the title's live menu** | **Title only**, `C.ATTRACT_IDLE` 20 (MEASURED: already in `C`, read by nothing), counting simulation `dt` on title steps with the struct at rest and no named action. §1.2 V1 MEASURED: no closed test idles 20 s on the title |
| N11 | **Where the code lives** | **One new module, `src/22-onboarding.js`, after `22-meta.js`** — top-level functions a soak can stub; `23-main.js` wires them. `22-meta.js` stays the only file that calls storage |
| N12 | **The pre-ship achievement pass: CS016 or CS017** | **CS016, as its own phase (P3)** — the pool-length change is free only before ship and CS017 IS ship. Three threshold calls surfaced; ⛔ **every number is Paul's** |
| N13 | **GDD §19 has no onboarding row** | **P1 adds one** under Core, from §12 of this plan, so the close has something to close |

### N1 — the four-second promise, measured

⛔ **MEASURED (§1.3), both modes, Start Depth 1, the Ring, 32 time seeds per
driver.** The spawner is deterministic in TIME at level 1: the first Vaulter
leaves the throat at **1.600 s** on every seed (`SPAWN_INTERVAL` 1.6 counted UP
from a fresh well), the second at **3.217 s**, the third at **4.833 s**. Its
lane is uniform over the sixteen (`pickSpawnLane()`), so its distance from the
craft's lane 0 is **0 to 8 lanes, median 3**. It climbs at `VAULT_CLIMB` 0.18
(`climbMult(1)` is exactly 1 — `heat(1)` is 0) and reaches the kill band at
**6.883 s**, on every seed.

| Driver | First kill (s) | Kills by 4 s | First death (s) | Deaths by 4 s |
|---|---|---|---|---|
| idle, Classic | — | 0/32 | min 6.883 · p50 8.667 · max 10.867 | **0/32** |
| idle, Overdrive | — | 0/32 | min 6.883 · p50 8.500 · max 11.417 | **0/32** |
| fire held, no rotation, Classic | min 1.65 · p50 8.667 · max 10.867 | 2/32 | — | 0/32 |
| fire held, no rotation, Overdrive | min 1.65 · p50 8.117 · max 11.417 | 6/32 | — | 0/32 |
| mover, Classic | min 1.65 · **p50 2.383 · max 2.683** | **32/32** | — | 0/32 |
| mover, Overdrive | min 1.65 · **p50 2.383 · max 2.683** | **32/32** | — | 0/32 |

At 4 s an idle board holds **two Vaulters, the deeper at depth 0.432**; the
mover's board holds at most one, at 0.141. A non-rotating player kills by 4 s
only when the first spawn lands within half a lane of lane 0 — one lane in
sixteen. ⚠ "Half speed" in §12 names nothing in the build: no constant halves
anything at level 1, and `VAULT_CLIMB` 0.18 IS the level-1 rate (§0.1 records
it).

**The three shapes priced.**
- **A — restate §12 to the measured shape, touch nothing** (recommended).
  "Within three seconds a player who moves and fires kills something; a player
  who does nothing loses a craft between seven and twelve seconds. Both teach."
  The active half is already true (64/64), the passive half teaches the same
  lesson three seconds later than the sentence promised, and the first prompt
  (`ROTATE — FIRE DOWN THE LANE`) is what turns the passive player into the
  active one. Cost: one GDD paragraph, no baseline moves.
- **B — weight level-1 spawn lanes toward the craft** (ROADMAP row 6's
  reading). MEASURED (§1.2 V4, V4b) — with one extra draw, **8 files red** — `test-cs002-p1.js`, `-cs003-p5`, `-cs004-p1` (`GOLDEN_LANES` and its `9ebd27b` prefix), `-cs006-p5` (the count-based no-draw rule: 2 draws, want 1), `-cs007-p5` (a level-6 well ran 12,629 ticks without ending), `-cs011-p6`, `-cs014-p1`, `-cs015-p2`; with no draw, **7 files red** — the same set less `-cs006-p5` and `-cs014-p1`, plus `-cs007-p4` ("the deaths column moved"): `GOLDEN_LANES` moves in every entry, the ninth soak's record moves 23 → 25, and a level-8 well ran 9,850 ticks.
  no draw. ⛔ **It cannot move the passive death under 6.883 s** — the climb is
  the floor — and what it buys is the non-rotating player, whose first kill
  comes at ~2.1 s when the spawn is in reach. ⛔ Either form moves
  `GOLDEN_LANES`' original sixteen, which `STATUS.md` names a defect and not a
  baseline, and moves `P1_DETERMINISM_HASH` and every soak whose fixture lives
  at level 1. Rejected for the price and because the lesson it buys (fire
  without looking) is the wrong one.
- **C — lower `SPAWN_INTERVAL` or raise `VAULT_CLIMB` at level 1.** Rejected
  without a variant: both are heat-clock bases (⛔ one clock), `VAULT_CLIMB` is
  `CLIMB_MAX_BASE` and the respawn guarantee reads it, and a first-well-only
  rate is a second clock.

### N2 — which prompts ship

⛔ **§12's seven, as written, each a board read** (PREDICTED from the code, all
seven facts exist on `state` today; P1 asserts each fires):

| # | Trigger | What the scan reads | Level it first fires, Start Depth 1 |
|---|---|---|---|
| 1 | First frame | the first play step of the profile's first run | 1, step 1 |
| 2 | First Carrier | a live `Carrier` in `state.enemies` | 3 |
| 3 | First Thorn | a live `Thorn` | 5 |
| 4 | First Drifter | a live `Drifter` | 9 |
| 5 | First Surger | a live `Surger` | 13 |
| 6 | First open well | `!well.closed` on a play step | 8 (Vee) |
| 7 | First Purge | `state.purgeUses >= 1` | whenever |

⚠ **Five candidate rows §12 does not list and GDD §12's promise now owes**
(`STATUS.md`, "What CS016 must act on"). ⛔ **Adding a row is a design call:
each is SURFACED with a recommended text and trigger, and none is built until
Paul writes an answer.** Every text below is ≤ 36 characters, the band's proven
width (§1.4), and clears the vocabulary scan by eye.

| # | Trigger | Recommended text | Recommendation |
|---|---|---|---|
| 8 | First token on the board (Overdrive) | `A TOKEN — TOUCH IT TO TAKE IT` | **Yes** — nothing else says a token is collectable by touch (T4) |
| 9 | First Overdrive dive (`state.dive.active` with rings laid) | `STEER — FLY THROUGH THE RINGS` | **Yes** — CS014 left "nothing on screen says a ring is worth going to" |
| 10 | First Warden (Overdrive L11) | `IT FLIES — JUMP AT IT` | **Yes** — a non-jumping player cannot clear its well (W5), and this is the Jump's teaching moment. Row 1 stays the same text in both modes |
| 11 | First Mimic (Overdrive L16, ⚠ on probation) | `IT SENDS SHOTS BACK — LEAVE THE LANE` | **Yes, riding the probation**: a cut Mimic leaves an unfireable row, which costs nothing |
| 12 | First unlock on this profile | `UNLOCKED — SEE ACHIEVEMENTS` | **Yes, once per profile** — an unlock is heard and never seen (A1). ⚠ **Not a toast**: A1's "no toast" is SETTLED and this fires once per profile, never per unlock. Its trigger is Meta's `sounded()` seat, read by the scan as a counter Meta exposes, not a board read |

Not recommended: a Reaver row (a Vaulter that vaults faster; the silhouette
carries it) and a Jump-availability row on Overdrive's first frame (row 10 is
where the Jump matters).

### N3 — where a prompt draws

⛔ **MEASURED (§1.4).** A centred line of the longest §12 prompt (36
characters) at `HUD_TEXT_SIZE` 28 is **625 px wide**. Over every top edge from
0 to 692, the bands that clear the throat zone on all sixteen wells AND every
HUD rectangle at its widest, both mirrors:

| Mode | Size | Bands clear of throat + HUD | Of those, clear of every rim and every craft position |
|---|---|---|---|
| Classic | 28 | y 0–48 and y 498–650 | **y 0–48** (centre-top) and **y 631–650** (centre-bottom) |
| Overdrive | 28 | y 498–650 only | **y 631–650** |
| Both | 24 | Classic adds y 0–52; both y 498–696 | y 631–696 |

Centre-top is Classic-only: the combo readout's rectangle (x 566.6–713.4,
y 6–70) takes it in Overdrive, and the Fan's throat zone starts at y 76.29, so
nothing fits between the two. Inside the well (y 498–630) the line crosses the
rim and the craft on eleven of sixteen wells. The bottom band's lower edge is
the **mirrored** lives rectangle (x 164–354, y 678–696), which a 625 px centred
line touches at y 651.

**Recommendation: `C.PROMPT_Y` 636, `C.PROMPT_SIZE` 28, `C.PROMPT_COLOR`
`HUD_COLOR`'s white ⚠, centred, in BOTH modes.** 6 px under the lowest rim
point (630), 14 px above the lowest HUD row it can meet. ⛔ **Drawn after the
well and the Dive's rungs and before the tokens, enemies, shots and craft**:
§1.6 MEASURED that an airborne craft at a bottom lane reaches **y 666** (the
Cross, lane 8) and an aloft Warden 18 px past the rim, so both cross the band —
and GDD §1.1 P2 says the prompt goes under them, never over. Text through
`drawText()`, the build's one text path (§10.2); no rectangle, no fill. The
alternative, a per-mode position (top in Classic, bottom in Overdrive), was
priced and rejected: two seats for one line, and the same player plays both
modes.

### N4 — how long, and the queue

GDD §12 gives no duration. **Recommendation:** `C.PROMPT_TIME` 4.0 s ⚠ (the
promise's own number), a draw-time alpha fade over the last `C.PROMPT_FADE`
0.5 s ⚠, a FIFO queue showing one line at a time in trigger order, each for
the full time. The clock is a count-UP (GDD §16.3) advanced in `update()` on
play steps only — so a pause holds a prompt and a dive continues it — kept in
the module's own state, **never on `state`** (§8). `startGame()` empties the
queue: a run's prompts belong to the run. A death keeps the queue. ⚠ A deep
Start Depth can queue four rows in a first well (Carrier, Thorn, Drifter, open
well at Start Depth 9); PREDICTED sixteen seconds of prompts, accepted, because
each is still true when it shows. No sound: a prompt is not an event.

### N5 — where "once per profile" lives

| Shape | Cost, MEASURED (§1.2) | Verdict |
|---|---|---|
| **A — a new declared key `onboarding` v1, `{ seen: [ids] }`** | **4 files red, 5 assertions**: the two declared-keys regexes (`test-cs011-p6.js:329`, `test-cs015-p4.js:432` ×2), `test-cs015-p1.js:294`'s `OWN_KEYS` literal (count 0), and ⛔ **`test-cs015-p2.js:431` — "no storage write on a play step that is not the clear edge"**, because the stand-in wrote at `startGame()`. The fourth is the finding N5 acts on | **Recommended** |
| B — a `prompts` field in `settings`, bumped to v2 with a `migrate` | **2 files red, 21 assertions**: `test-cs008-p7.js` (RESET TO DEFAULTS' stored shape) and `test-cs011-p2.js` (twenty whole-snapshot comparisons of `settings` v1). The `migrate` itself was never exercised — nothing in the suite stores a v1 envelope | Rejected: `settings` is options, bindings and the track choice; and a pinned-shape key's bump is dearer than a new key |
| C — a field in `progress` v3 | not built; PREDICTED the same shape as B (`test-cs011-p2.js:130` pins `progress` v2's bytes) | Rejected: `progress` is the Start Depth record per mode |

⛔ **The rule is not breached by A**: "a row-shape change bumps that key's
version and supplies a `migrate`, never a new key name" is about an EXISTING
key's shape; new data under a new key is what CS015 did with `achievements`.
A's shape: declared in `Meta.boot()` beside `achievements`, **v1, no
`migrate`** (a new key has no origin version), in `Profiles.remove()`'s
`OWN_KEYS`, loaded known-value-else-default. `Profiles.select()`'s
reset-then-load (§15.2) covers it for free if the seen set is loaded from
`activateSettings()`'s seat: emptied, then the incoming profile's read. Written
at the trigger step through one Meta method, `Meta.promptSeen(id)` — a
play-step write of one short array, legal: the shipped ban is on a TELEMETRY
write from a play step, and `test-cs011-p2.js:314` counts the `telemetry` key
alone (MEASURED, read). ⛔ **BUT A SECOND PIN EXISTS AND V3 FOUND IT**:
`test-cs015-p2.js:431` asserts NO storage write of ANY key on a play step that
is not the clear edge (MEASURED red under V3, whose stand-in wrote at
`startGame()`). So the trigger step MARKS a prompt seen in Meta's closure and
the WRITE happens at seats that already write: the clear edge (a play step the
pin exempts), `runEnded()`, the `autoPause` seat and kit-profile's
`beforeChange` — `saveTelemetry()`'s four seats exactly. ⚠ A tab closed
mid-well loses that well's marks and repeats those prompts once; accepted.
No new play-step write, and the pin is untouched. A blocked store plays the
same game and shows every prompt every session. ⛔ **The simulation never
reads the seen set**: the scan runs outside `state` and writes none, so the
determinism hash is untouched (§8).

### N6 — what drives attract mode

| Shape | Price | Verdict |
|---|---|---|
| **A — a board-reading driver in the build** | ~60 lines ported from `test-cs014-p3.js`'s hunter: fire held, steer to the deepest live threat, leave a `MimicShot`'s lane, take a hovering token, jump at anything aloft in lane, steer to a ring in reach; a Purge every N seconds ⚠. PREDICTED | **Recommended** |
| B — a recorded input list replayed under a fixed seed | exact by GDD §17.1, but a recording is a fixture that re-records on every constant move (CS007's lesson at `GOLDEN_LANES`) and needs a tool to make it | Rejected |
| C — no attract mode | §12 names it and `C.ATTRACT_IDLE` already ships | Rejected |

⛔ **The driver writes the four-field struct AFTER `input.sample()`**, on the
same step, so the devices' own reading of that step is what ends the demo
(N9). GDD §9.5's one input path is the rule that the simulation reads the
struct and never a device; the driver is not a device and adds no listener. It
reads `state` and the well and writes the struct's four fields, nothing else.

### N7 — seed, mode, Start Depth, length

⛔ **MEASURED (§1.5), 45 s of the hunter from the front door at one fixed
seed:**

| Case | Kinds shown | Kills | Deaths | Clears | Tokens | Ended |
|---|---|---|---|---|---|---|
| Overdrive, depth 1 | Vaulter | 20 | 0 | 2 | 0 | — |
| Overdrive, depth 5 | Weaver, Thorn, Carrier, Vaulter, bolt, Reaver | 28 | 0 | 1 | 1 | — |
| Overdrive, depth 9 | seven kinds, Drifter included | 14 | 1 | 0 | 0 | — |
| Classic, depth 1 | Vaulter | 20 | 0 | 2 | 0 | — |
| Classic, depth 9 | six kinds | 16 | 3 | 0 | 0 | game over at 24.1 s |

**Recommendation:** `C.ATTRACT_SEED` a fixed integer ⚠, `C.ATTRACT_MODE`
`"overdrive"` (the default highlight, and the mode with something to show),
`C.ATTRACT_DEPTH` 5 ⚠ (six kinds, a token, a dive and no death in 45 s),
`C.ATTRACT_LENGTH` 45 s ⚠. The demo calls `startGame(C.ATTRACT_SEED, { mode,
startDepth, attract: true })` — no `progress` record is needed, the mechanism
validates nothing — and spends `state.rng` exactly as a run does: the stream is
rebuilt from the seed, and the next real run rebuilds it from a time seed, so
nothing of the demo's stream survives it. A fixed seed means the demo is the
same run on every load of this build, which is what lets P2 hash it whole.

### N8 — out of the gate and out of storage

⛔ **MEASURED (§1.5): a 45 s played run today writes storage three ways** —
`achievements` at the first clear edge (`first_well` unlocks at 15–22 s),
`progress` at the second clear (42–43 s), and `scores` + `achievements` at a
game over (Classic depth 9, 24 s). An attract run must make none of them.

- **`run` stays null.** `startGame()` under `attract: true` skips
  `Meta.runStarted()`, so `eligible()` reads false at every seat it guards — the
  local top 10, both boards, both achievement seats and the `unlock` sound —
  and `runOpen()` is false, so `frame()`'s `'died'` seat is inert. ⛔ **This is
  the one gate gaining nothing**: no new predicate, no `attract` term in
  `eligible()`.
- **Three explicit skips**, each a one-line guard on a flag `23-main.js` holds:
  `levelRecord().noteCleared()` at the clear edge (the ONE writer outside the
  gate, MEASURED), `Telemetry.sample()` (a demo must not fill the profile's
  ring), and `Meta.clearEdge()` (the window and the streak are re-minted by the
  next `runStarted()` anyway, but a demo has no business moving them).
- **`lastRunMode` is not written** by an attract start, so SCORES' entry mode
  stays the last REAL run's.
- **The bench is inert**: `runAction()` in attract ends the demo on any named
  action and dispatches nothing else — no spawn, no well cycle, no telemetry
  toggle.
- P2 asserts the whole: the store's bytes identical before and after a demo
  that clears a well and dies; spies on `runStarted`, `runEnded`, `clearEdge`,
  `noteCleared` and `Telemetry.sample` at zero.

### N9 — what ends it, and what the player sees

**Ends on** (all recommended, PREDICTED from the code): any device input — the
struct read off `input.sample()` before the driver overwrites it shows
`rotate !== 0` or a held button; any named action arriving through `onAction`
(Escape, `p`, the digits, `t`, `e`, gamepad Start, the top-edge touch target,
the page going hidden) — each ends the demo and does nothing else; the demo's
own game over, at once, with no game-over screen; and `C.ATTRACT_LENGTH`. The
ending is `quitToTitle()` — the screen is never `pause`, so the `'quit'` seat
cannot fire — and the title's entry step latches whatever is held as already
held (GDD §10.5's menu rule), so the ending press confirms no row. ⚠ A mouse
that moves while the demo starts ends it at once; that is correct.

**Shows:** the board, the HUD (a run is on screen — H4's `runOnScreen()` holds
without an edit, and the demo's score is the demo's), and one line in the
prompt band, `C.ATTRACT_LINE` `DEMO — PRESS ANY KEY` ⚠ (Paul's text), through
the prompt's own draw seat and never a prompt row. No `state.screen` change:
the demo is `"play"` with a closure flag (N11's reason). ⛔ **The prompt scan is
skipped in attract** — a demo teaches nothing and marks nothing seen.

**Music:** `musicStateFor("play", …)` gives the mode's track, `drive`, with no
edit; the director runs on the demo board. ⚠ **On a fresh page load the demo is
SILENT**: `AudioSys.ctx` is null until a key, click or lifted touch (the
browser's rule, `STATUS.md`), and the first gesture ends the demo. A demo
entered after a played session has music. Nothing here adds a sound.

### N10 — the idle timer

`C.ATTRACT_IDLE` is **already in `C`** (`00-config.js:939`, 20, MEASURED read
by nothing). The timer counts simulation `dt` on title steps whose sampled
struct is at rest (`rotate` 0, no button held) and on which no named action
arrived; anything else zeroes it. ⛔ **Not a clock read**: `Date.now` and
`performance.now` stay at their three shipped readers (§1.7), so no closed soak
plays differently. **Title only** (recommended): a player reading the KEYBOARD
page for twenty seconds must not be pulled into a demo; the alternative (every
screen with no run) was priced at the same code and rejected on that ground.
MEASURED (§1.2 V1): with the timer THROWING at 20 s the whole suite is green —
no closed test idles that long on the title, so P2 owes no fixture repair
there. The title's five rows, its info line and PROFILE's detail are untouched.

### N11 — the module

**`src/22-onboarding.js`, after `22-meta.js` in `MANIFEST`** (recommended),
holding `promptScan()`, `promptStep()`, `drawPrompt()`, `attractDrive()` and
the two small state bags, with `23-main.js` calling them at the seats. The
alternative — everything inside `Game`'s closure — was rejected on one MEASURED
fact: ⛔ **a function inside `Game`'s closure cannot be stubbed or spied**
(`_harness.js`, `STATUS.md`), and the fourteenth soak's headline claim is "a
session with the module stubbed out hashes identically", which needs top-level
functions. `23-main.js` is also 2,107 lines. ⛔ The module calls no storage:
`22-meta.js` gains `promptsSeen()` / `promptSeen(id)` and stays the one route.
It is game glue, not kit-shaped — it reads `state` by design and is on no
extraction list. Cost: `MANIFEST` +1 (26 modules), the `CLAUDE.md` code map,
GDD §16.4, `STATUS.md`, `_harness.js` `EXPORTS` +~7, and a new banner slice
`test-cs002-p1.js` scans (no device token may appear in it).

### N12 — the pre-ship achievement pass: CS016

**CS016, as its own phase (P3)**, because ⛔ adding a pool row reshuffles which
five a week shows and is free only while no player has a save — CS017 is ship.
MEASURED (§1.2 V6) the two counters, the two per-well facts and the two rows
cost **1 file red, 3 assertions**, all in `test-cs015-p3.js`: the two new facts are absent from `REACH` and each new row is therefore unreachable until measured — exactly the per-row gate working. ⛔ **No `id` moves.** The rows land as
`week_token_trio` (`wellTokens >= 3`, Overdrive) and `week_thorn_gone`
(`wellThornsCleared >= 1`), on two new write-only `tally` counters,
`tokensCollected` (in `updateTokens()`, beside the kind mask) and
`thornsDestroyed` (in `Thorn.chip()`, on its own `dead` edge — ⛔ **not at a
kill line**: a Thorn dies inside its own `onShot`, so `tallyKill()` is not its
seat and the five pinned kill-line strings do not move). ⚠ Names and notes are
Paul's within the ≤ 20 / ≤ 60 budgets.

**The three threshold calls — ⛔ every number is Paul's; this plan names the
shape only:**
- **`depth_reached`'s top tier collides with `dim_band`** (both read `level`,
  both at 65; MEASURED reach 140). Recommend `dim_band` keeps 65 (a landmark)
  and `depth_reached`'s top tier moves, to a number Paul picks under 140.
- **`dives_done` is `wells_cleared` minus one with the same tiers.** Recommend
  re-aiming the id's FACT rather than diverging tiers: `cleanDives` =
  `divesCompleted` on a run with no Thorn death, else 0 — a conjunction gated to
  0 by its other half, `lowStartLevel`'s shipped shape, costing no counter; the
  name becomes `CLEAN DIVES` (not save data). Tiers Paul's. The alternative
  (diverge the tiers) keeps the shadowing one well apart at every tier.
- **`wellShotPar` 120 came from a trigger-holding driver.** Recommend
  **cutting `week_lean_well`** (the pool goes 18 − 1 + 2 = 19): no honest number
  exists, Paul does no playtests, and a free row is worse than no row. The
  alternatives are a par Paul picks on judgement, or an aimed-fire lab driver
  in `tools/` (CS017's, if wanted).

`test-cs015-p3.js`'s `REACH` is re-measured, never edited to fit; the two new
facts join it. ⚠ **If Paul answers CS017, P3 is dropped and CS016 is three
phases** (§2).

### N13 — GDD §19 has no onboarding row

§19's rows are Core, Overdrive, Audio, Meta and Quality; Core's last item is
"playable title → mode → depth → play → death → game over → restart" and
nothing names a prompt or a demo. ⛔ Not a §0 defect (§0's row 12 covers §12),
so nothing goes to `STATUS.md` for it. **Recommendation:** P1 appends an
**Onboarding** row to §19 with §12 of this plan's criteria, so the close has a
row to close.

### §0.1 — findings recorded in `STATUS.md`, not worked around

- ⚠ **GDD §12's "non-vaulting Vaulters at half speed" names nothing in the
  build.** `VAULT_CLIMB` 0.18 is the level-1 rate and `climbMult(1)` is 1;
  nothing halves anything (MEASURED, §1.3). A §12 wording defect, recorded; N1
  decides the sentence.
- ⚠ **`C.GAME_VERSION` is `"0.0.10"` while `STATUS.md`'s header says 0.0.11**
  (MEASURED, grep). Whether the close bumps the constant is Paul's; a planning
  session writes no code.
- ⚠ **`_harness.js`'s `EXPORTS` counts 211 quoted names against `STATUS.md`'s
  212.** P1 records what it finds.

### ⚠ Readings this plan takes and flags

- **"First frame" is the profile's first PLAY step**, not every run's — once
  per profile makes the two the same thing.
- **"First Purge" is the first USE** (`purgeUses` 0 → 1), so `ONE PER WELL` is
  read after the charge is spent, which is when it means something.
- **"First open well" fires on a play step in an open well**, so a Start Depth
  9 run sees it in its first well.
- **A prompt fires in a bench run too** (a Carrier from key `2` teaches what a
  Carrier is); eligibility gates rewards, not lessons. ⛔ It never fires in
  attract.
- **"Never pausing"** is read as: a prompt is drawn over live play and stops
  nothing; it is also drawn on pause, where the HUD draws, and nowhere else.
- **"In the well's line style"** is read as `drawText()`'s two-pass glow (the
  well's own), in the HUD's colour ⚠, not the band colour, because a prompt has
  to read at every level of the dim band.

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the baseline, at `bea33c8`

The header's numbers: 25 + 3 modules, 827,351 bytes; 78 files, zero skips,
235.3 s; `CLAUDE.md` 36,926 bytes; `STATUS.md` 277 lines; `EXPORTS` 211;
`C.ATTRACT_IDLE` 20, present and unread; `GAME_VERSION` `"0.0.10"`.

### 1.2 MEASURED — seven stand-in variants, the whole suite in each

| Variant | The one edit | Result |
|---|---|---|
| **V1** | a title idle timer that THROWS when 20 s of at-rest title steps accumulate | **GREEN, 78/78** (two skips: the clone's missing `../coinless-kit`). No closed test idles 20 s on the title |
| **V2** | `settings` v1 → v2 with a `prompts: []` field and a pure `migrate` | **2 files red, 21 assertions**: `test-cs008-p7.js` (RESET TO DEFAULTS' stored shape) and `test-cs011-p2.js` (twenty whole-snapshot comparisons of `settings` v1). The `migrate` itself was never exercised — nothing in the suite stores a v1 envelope |
| **V3** | a new declared key `onboarding` v1, in `OWN_KEYS`, written once at every run start | **4 files red, 5 assertions**: the two declared-keys regexes (`test-cs011-p6.js:329`, `test-cs015-p4.js:432` ×2), `test-cs015-p1.js:294`'s `OWN_KEYS` literal (count 0), and ⛔ **`test-cs015-p2.js:431` — "no storage write on a play step that is not the clear edge"**, because the stand-in wrote at `startGame()`. The fourth is the finding N5 acts on |
| **V4** | `pickSpawnLane()` folds toward the craft at level 1 with ONE extra draw | **8 files red** — `test-cs002-p1.js`, `-cs003-p5`, `-cs004-p1` (`GOLDEN_LANES` and its `9ebd27b` prefix), `-cs006-p5` (the count-based no-draw rule: 2 draws, want 1), `-cs007-p5` (a level-6 well ran 12,629 ticks without ending), `-cs011-p6`, `-cs014-p1`, `-cs015-p2` |
| **V4b** (clone 5) | the same fold with NO extra draw | **7 files red** — the same set less `-cs006-p5` and `-cs014-p1`, plus `-cs007-p4` ("the deaths column moved"): `GOLDEN_LANES` moves in every entry, the ninth soak's record moves 23 → 25, and a level-8 well ran 9,850 ticks |
| **V6** | two `tally` counters, two per-well facts, two weekly pool rows | **1 file red, 3 assertions**, all in `test-cs015-p3.js`: the two new facts are absent from `REACH` and each new row is therefore unreachable until measured — exactly the per-row gate working |
| **V7** | one `drawText()` line drawn in play, under the HUD (the draw path alone) | **GREEN, 78/78** — a draw-path line costs no closed test |

### 1.3 MEASURED — level 1, front door, both modes

N1's table. The probe drove `Game.frame()` from the boot title through PLAY →
MODE → START DEPTH 1 under a wall-clock `Date.now` fake (the thirteenth soak's
form), so each seed is a genuine time seed. Constants read off the build:
`SPAWN_INTERVAL` 1.6, `ENEMY_CONCURRENT` 3, `VAULT_CLIMB` 0.18,
`VAULT_RIM_INTERVAL` 0.55, `VAULT_HOP_TIME` 0.28, `RIM_CONTACT_DEPTH` 0.05,
`SHOT_TIME` 0.52, `KEY_SPEED_MIN/MAX` 4/14, `SAFE_SPAWN_DEPTH` 0.75. Only
Vaulters were ever seen (the level-1 set is one entry in both modes). The idle
death's spread (6.883–11.417 s) is the rim hunt: a Vaulter arriving in the
craft's lane kills at 6.883 s, one arriving eight lanes away hops there at
0.55 s a lane.

### 1.4 MEASURED — the prompt band

N3's table. The throat zone's union over sixteen wells spans **y 76.3–497.8,
x 494.2–785.8** (the Fan's is the highest, the Vee's the lowest); the rim's
union spans y 30–630 and the craft's the same. HUD rectangles at their widest:
score x 24–163 (mirror 164–303), y 24–52; level x 960–1116 (mirror 1100–1256),
y 24–52; lives x 24–214 (mirror 164–354), y 678–696; Purge x 1086–1116 (mirror
1226–1256), y 666–696; Overdrive's jump glyph x 1040–1070 (mirror 1180–1210),
y 666–696; the combo x 566.6–713.4, y 6–70. `MENU_TOP_Y` 240 and `MENU_ROW_H`
46 are the menus' and are not touched.

### 1.5 MEASURED — a demo-length run, and what it writes

N7's and N8's tables. The probe played the shipped front door at a fixed seed
(`installSeed` + a fixed `Date.now` base) and wrapped the harness store's
`set`. Every write is stamped with the screen and the second: `achievements`
at 15–22 s on a play step (the clear edge's `first_well`), `progress` at 42–43 s
on a play step, `scores` and `achievements` at 24 s on game over. Overdrive
depth 9 wrote nothing in 45 s because the hunter cleared no well there.

### 1.6 MEASURED — the lifted craft

Over every lane of every well, the airborne craft's lowest drawn point at
`JUMP_LIFT` 0.12 is **y 666.0** (the Cross, lane 8); unlifted it is 630, the
rim's own lowest point. `JUMP_LIFT` is 36 px at `WELL_RADIUS` 300 and
`WARDEN_LIFT` 18 px.

### 1.7 MEASURED — the greps, run before §11 was written

- **`state.screen === "play"` / `!== "play"` readers: 16 lines** (one in
  `19-sfx.js`, fifteen in `23-main.js`) — the price of a new screen value,
  which N8 declines.
- **`Date.now` / `performance.now` readers in the build: four sites** —
  `startGame()`'s seed, `scoreRow()`'s `ts`, the injected achievements clock,
  and `nowMs()`. CS016 adds none.
- **Closed `mutate:` pins in `test-cs011-*.js`: fourteen strings** — none in a
  line CS016 edits (`startGame()`'s seed line, `runStarted()`'s body,
  `noteCleared()` and `update()`'s clear edge are not among them). PREDICTED
  from the list; P1 greps again.
- **`!("X" in …)` assertions: 14 config names**, none a CS016 key.
- **`OWN_KEYS`' literal** is pinned in the build exactly once by
  `test-cs015-p1.js:294` — MEASURED, and it is N5's one certain closed edit
  beyond the two regexes.
- **`test-cs013-p1.js:63`** pins `Object.keys(C.MODE_FLAGS)` — CS016 adds no
  mode key.
- **kit `VERSION` literals**: no kit is edited (R4).

### 1.8 MEASURED — the closed pins read for §11

`test-cs011-p6.js:329` and `test-cs015-p4.js:432` (the declared-keys regexes);
`test-cs015-p1.js:294` (`OWN_KEYS`); `test-cs011-p2.js:119` (`settings` v1's
bytes) and `:314` (the telemetry-key write counter); `test-cs011-p3.js:387`,
`test-cs011-p5.js:377` and `test-cs015-p3.js:454` (the title's five labels);
`test-cs008-p5.js:41` (boot is the title) and `:43` (`newState().screen` stays
`"play"`); `test-cs015-p3.js:131` (23 lifetime), `:133` (`perWeek` 5) and
`:238–257` (`REACH` per row, and a row whose fact is not in `REACH` is red);
`test-cs014-p1.js`'s kill-line count and `test-cs012-p4.js`'s `COMBO_OUT`
(untouched: N12's counters sit on no kill line).

---

## 2. THE SHAPE

**Four phases, one session each** (three if N12 answers CS017). ROADMAP's
guideline is 3–5.

| Phase | Builds | Depends on |
|---|---|---|
| **P1** | The prompts: `src/22-onboarding.js` (scan, queue, draw), `C.PROMPTS` and its constants, the `onboarding` key and Meta's two methods, the closed edits, GDD §12 restated and §19's row | N1, N2, N3, N4, N5, N11, N13 |
| **P2** | Attract mode: the idle timer, `attractDrive()`, the gates, the ending, the demo line | N6, N7, N8, N9, N10 |
| **P3** | The pre-ship achievement pass: two counters, two facts, two rows, Paul's three thresholds, `REACH` re-measured | N12 and its three numbers |
| **P4** | The fourteenth soak, the review, the close | all |

**Why these seams.**
- **P1 is the module and everything provable on a staged board.** Every
  trigger is a board read; a test stages each and asserts one prompt, once,
  then reloads and asserts none. Its closed edits are N5's three and the
  `EXPORTS` rows, all MEASURED or read.
- **P2 is the only phase that starts a run the player did not ask for**, and
  it is alone so its claim — the store's bytes never move and no seat fires —
  is about a commit that changed nothing else. It reuses P1's band for its one
  line.
- **P3 is the one phase that touches `tally` and `C.ACHIEVEMENTS`**, and it is
  Paul's numbers landed whole, as CS015 P3 was: a threshold that lands wrong
  after ship is fixed against live saves.
- **P4 is the fourteenth soak** — ⛔ **a NEW file, never a widened closed one.**

**What a different split would cost.** Two phases (prompts + attract, then the
soak) puts N5's storage edits and N8's gates in one commit, so "no storage
byte moves in a demo" would be asserted over a commit that also added a
storage key. Five (splitting the key from the scan) was considered and
rejected: the scan is what proves the key's shape holds the ids it needs.

---

## 3. P1 — the prompts

⛔ **Builds:** `src/22-onboarding.js` (N11), listed in `MANIFEST` after
`22-meta.js`; `C.PROMPTS` — an array of `{ id, text }` in §12's order, ids
`rotate`, `carrier`, `thorn`, `drifter`, `surger`, `openWell`, `purge`, plus
whichever of N2's rows 8–12 Paul answers — and `C.PROMPT_Y`, `C.PROMPT_SIZE`,
`C.PROMPT_COLOR`, `C.PROMPT_TIME`, `C.PROMPT_FADE`, grouped under Presentation
beside `ATTRACT_IDLE`; the `onboarding` key declared v1 in `Meta.boot()`, in
`OWN_KEYS`, loaded at `activateSettings()`'s seat, marked by
`Meta.promptSeen(id)` and flushed by `Meta.savePrompts()` at the four seats N5 names; `promptScan(state, well, seen, queue)` called from
`update()` after the two end-of-frame filters and before `updateSpawner()` (so
a Carrier that split this step is seen this step), `promptStep(dt)` beside it,
`drawPrompt(ctx)` from `draw()` after the Dive's rungs and before the tokens.

⛔ **A prompt id is not save data in CS015's sense** — it is stored, but a
renamed id costs one repeat of one line — so the ids are chosen for
readability, not permanence, and P1 says so in the module header.

⛔ **The scan spends no draw, reads no clock, writes no `state`.** It reads
`state.enemies` by `instanceof`, `state.purgeUses`, `well.closed`,
`state.dive`, `state.tokens` and Meta's unlock counter (rows 9, 8 and 12, if
answered), and it stops reading the board once every row is seen.

**GDD edits:** §12 rewritten to shipped behaviour under N1's answer (the
measured sentence, the prompt table with ids, the band, the key); §10.4 gains
one line for the band; §15.1's key table gains `onboarding`; §16.4's tree and
the `CLAUDE.md` code map gain the module; §19 gains the Onboarding row (N13).

**The test, `scratchpad/test-cs016-p1.js`:** each of the seven rows fires
exactly once from a staged board (a spawned Carrier, a laid Thorn, an open
well entered, a Purge pressed, …) and never again in the same run, a RESTART
or a reload over the same store; a new profile sees them all again and a switch
back sees none; the key is declared, per profile, in `OWN_KEYS` and removed
with the profile; a blocked store shows every prompt every session; the queue
shows one line at a time for `PROMPT_TIME` and a pause holds it; the line's
rectangle clears the throat zone on all sixteen wells and every HUD rectangle
at its widest, both mirrors, by `test-cs008-p4.js`'s arithmetic; the draw
order puts the craft over it; ⛔ a played Classic session hashes identically
step for step against `promptScan` and `promptStep` stubbed out; the vocabulary
scan over every text, by eye too. ⛔ Seed above the first `buildGame()`.

## 4. P2 — attract mode

⛔ **Builds:** `attractDrive(state, well, out)` in the module (N6), the title
idle timer in `update()`'s menu branch (N10), `startGame()`'s `attract` option
(skips `Meta.runStarted()` and `lastRunMode`), the three skips (N8), the ending
(N9) with `runAction()`'s attract branch, the demo line through
`drawPrompt()`'s seat, and the constants `ATTRACT_SEED`, `ATTRACT_MODE`,
`ATTRACT_DEPTH`, `ATTRACT_LENGTH`, `ATTRACT_LINE` beside `ATTRACT_IDLE`.

⛔ **Does not build:** a screen value, a pause path, a game-over screen for the
demo, a sound, a storage write, a `tally` field, a telemetry column.

**The test, `scratchpad/test-cs016-p2.js`:** twenty seconds at rest on the boot
title enter the demo and nineteen do not; a rotate, a held fire, an Escape, a
`p`, a digit, `t`, a hidden page and Start each end it on that step and do
nothing else (no pause, no spawn, no toggle — spied); the ending press confirms
no row; the demo's game over and `ATTRACT_LENGTH` each return to the title;
the store's bytes are identical before and after a demo that clears a well and
dies; `runStarted`, `runEnded`, `clearEdge`, `noteCleared`, `Telemetry.sample`
and `sfx("unlock")` are at zero across it; `eligible()` is false on every demo
step; no prompt fires in it; `lastRunMode` is unchanged; the whole demo's hash
is the same on two loads of the build (the fixed seed); and ⛔ a played session
that never idles hashes identically with `attractDrive` stubbed out.

## 5. P3 — the pre-ship achievement pass

⛔ **Builds exactly N12's answer**: `tokensCollected` and `thornsDestroyed` on
`state.tally` (write-only, where their events happen), `wellTokens` and
`wellThornsCleared` in `wellWindow()`, the two pool rows with Paul's names and
notes, `depth_reached`'s tier and `dives_done`'s fact as Paul answers,
`week_lean_well` cut or re-parred as Paul answers, and `NEXT-STEPS.md`'s entry
DELETED in the same commit (its own rule). ⛔ **No `id` renamed, no `lifetime`
row deleted, no kill line edited.** `test-cs015-p3.js`'s `REACH` is
re-measured by its own four passes and the two new facts join it; a row whose
top threshold the front door does not reach is reported, never lowered.

**The test, `scratchpad/test-cs016-p3.js`:** both counters count on a staged
board (a token taken, a Thorn chipped to nothing by shots and by a Lance) and
nowhere else; both per-well facts reset at the clear edge; the two rows unlock
from a staged clear; the pool's length and `perWeek` as shipped; the rotation
over 104 weeks still spends no draw; and a Classic session hashes identically
against the two counters mutated out.

## 6. P4 — the fourteenth soak, the review, the close

`scratchpad/test-cs016-p4.js`, ⛔ **a new file**: both modes through the front
door over a working store, a wall-clock `Date.now` fake (the thirteenth soak's
form), Start Depths that reach every §12 row and every answered N2 row;
each prompt seen exactly once per profile across a RESTART, a reload and a
profile switch and back; a title idled into the demo, ended by a gesture with
zero storage bytes changed, then a real run started and eligible; a stubbed
twin (`promptScan`, `promptStep`, `attractDrive` out) hashing identically on
every frame of a session that never idles. Then the review of every phase's
`log/CS016.md`, the `STATUS.md` reset, `ROADMAP.md`'s CS016 row, `DECISIONS.md`'s
index line, `SKIPPED-PLAYTESTS.md`'s entries, GDD §19's Onboarding verdicts.

---

## 7. ⛔ THE PROMPT TABLE IS DATA, AND ITS TRIGGERS ARE CODE

`C.PROMPTS` carries `{ id, text }` and nothing else — no trigger name, no
predicate, no level. The scan is one function with one branch per id, because
a trigger is a board read that names a class, and a class name has no business
in `C`. Two tables kept apart, as `TOKEN_WEIGHTS` and the effect constants are.

## 8. ⛔ NOTHING OF THIS CHANGESET IS ON `state`

The prompt queue, its clock, the seen set, the idle timer and the attract flag
live in the module's bags and in `Game`'s closure — never on `state`, which the
determinism hash walks. ⛔ **The simulation branches on none of them** except
the attract flag's five seats (N8), and every one of those is a skip of a seat
that already writes no `state`. That is what makes the stubbed twins in P1, P2
and P4 hash identically, and it is what keeps `STATE_FIELDS` and `state`'s 28
keys unmoved.

## 9. ⛔ THE ONE INPUT PATH, AND WHERE THE DRIVER SITS

`input.sample(dt, state.input)` stays the struct's one writer on every real
step. On an attract step the driver overwrites the four fields AFTER it, on the
same line of `update()`, and the values sample() wrote are read first to
detect the player. No listener is added, no device is read outside
`04-input.js`, and `test-cs002-p1.js`'s six banned tokens do not appear in the
module.

---

## 10. ⛔ THE BASELINE LEDGER

| Baseline | At `bea33c8` (MEASURED) | CS016 (PREDICTED) |
|---|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` | **1229033515** | ⛔ **Unmoved P1–P4** under N1-A. A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | the `9ebd27b` sixteen + `2, 5` | ⛔ **Unmoved** — CS016 spends no draw (N1-A, §8) |
| The thirteen closed soaks' paired hashes | green | ⛔ **Unmoved** — V1 and V7 green; V3 and V6 as §1.2 records |
| `COUNTS` enemies / enemyKinds / wells / openWells / tracks | 9 / 13 / 16 / 6 / 3 | unmoved |
| `STATE_FIELDS` and `state`'s keys | through CS013; **28** | ⛔ **unmoved** (§8) |
| `tally` fields | **21** | **23** at P3 (N12) |
| `C.MODE_FLAGS` | `{ jump, combo, tokens, rings }` | unmoved |
| `C.SPAWN_SCHEDULE` / `_OVERDRIVE` | 7 / 3 | unmoved |
| `C.SFX` / `C.SFX_KILL_PITCH` | 28 / 11 | ⛔ unmoved — no new sound |
| Kill sites / kill lines | 4 / 5 | ⛔ unmoved |
| `climbMult()` sites / heat accessors | 7 / 7 | unmoved |
| `TELEMETRY_FIELDS` / `telemetry` | 29 / v1 | ⛔ unmoved |
| `settings` / `progress` / `scores` / `achievements` | v1 / v2 / v1 / v1 | unmoved (N5-A) |
| `onboarding` | ⛔ **not declared** | **declared, v1**, P1 |
| `OWN_KEYS` | 4 names | **5**, P1 |
| `C.ACHIEVEMENTS` lifetime / weekly pool | 23 / 18 | 23 / **19 or 20**, P3 (N12: two added, `week_lean_well` cut or kept) |
| `C.ATTRACT_IDLE` | 20, unread | 20, **read**, P2 |
| `state.screen` values | 16 | ⛔ unmoved (N8) |
| kit-names / storage / profile / leaderboard | 0.1.0 / 0.1.0 / 0.1.1 / 0.2.1 | unmoved |
| kit-input / kit-audio / kit-menu | 0.8.0 / 0.4.0 / 0.1.0 | unmoved |
| `MANIFEST` | 25 + 3 | **26 + 3**, P1 |
| `_harness.js` `EXPORTS` | **211** | **+5 to +7**, P1 and P2 (§11) |
| Title rows / OPTIONS rows | 5 / 11 | unmoved |
| The suite | **78 files, 0 skips, 235.3 s** | **82 files**, 0 skips at the close |
| `dist` bytes | **827,351** | larger; no ceiling exists |
| `CLAUDE.md` | **36,926 bytes** | ⛔ **< 50 KB at every phase**; ~13 KB of headroom |
| `STATUS.md` | **277 lines** | ⛔ under ~400 at every phase's end |

---

## 11. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

Every edit rewrites an assertion or restores a fixture's PRECONDITION in place
(⛔ `CLAUDE.md`, Test rules). None deletes or weakens one. "MEASURED" means the
file went red under §1.2's stand-in; the real repair is still PREDICTED.

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs011-p6.js:329` | the `declared` regular expression gains `onboarding`; `:332`'s message is unchanged | **MEASURED** (V3) |
| P1 | `test-cs015-p4.js:432` | the same regex, the same way | **MEASURED** (V3) |
| P1 | `test-cs015-p1.js:294` `KEYS` | the `OWN_KEYS` literal gains `onboarding` in both strings of the mutation pair; the claim (a delete without a key leaves that key behind) is unchanged | **MEASURED** (read: the literal is pinned exactly once) |
| P1 | `_harness.js` `EXPORTS` | ⛔ **+`promptScan`, +`promptStep`, +`drawPrompt`**, plus the module's bag accessors if they are top-level | PREDICTED (read) |
| P1 | `test-cs002-p1.js` | **none** — a new banner slice is scanned like the rest; ⛔ the module must carry no device token | PREDICTED (read) |
| P1 | `test-cs008-p4.js:40–43` | **none** — `drawText()` is still the one `fillText` site; no rectangle is drawn | **MEASURED** (V7 green) |
| P1 | `test-cs011-p2.js:119`, `:130` | **none** under N5-A: `settings` v1's and `progress` v2's bytes do not move. ⛔ **Under N5-B `:119` moves** | **MEASURED** (V2: 2 files, 21 assertions) |
| P1 | `test-cs011-p4.js:33` `REMOVE_KEYS` | **none** — it pins the loop, not `OWN_KEYS`' contents | PREDICTED (read) |
| P2 | `_harness.js` `EXPORTS` | +`attractDrive` | PREDICTED |
| P2 | every closed front-door soak | **none** — no closed test idles 20 s on the title | **MEASURED** (V1 green) |
| P2 | `test-cs008-p5.js:41`, `:43` | **none** — boot is still the title and `newState().screen` stays `"play"` | PREDICTED (read) |
| P3 | `test-cs015-p3.js` `REACH` | **+`wellTokens`, +`wellThornsCleared`** (and `cleanDives` if N12's re-aim is taken), each MEASURED by its four passes; the pool-length line reads the new length | **MEASURED** (V6: 3 assertions, one file) |
| P3 | `test-cs015-p1.js`, `test-cs015-p4.js` | the week's ids under the new pool length, if a fixture pins a specific week's five | **MEASURED** (V6: 3 assertions, one file) |
| P3 | `test-registry.js` | **none** — a `tally` field is inside `STATE_FIELDS.CS007`'s one entry (CS015 V3's measurement) | PREDICTED |
| P3 | `test-cs012-p4.js` `COMBO_OUT`, `test-cs014-p1.js` | **none** — neither counter is on a kill line | PREDICTED (read) |
| — | `test-cs004-p1.js` `GOLDEN_LANES`, `test-cs006-p2.js` | **none** under N1-A. ⛔ **Under N1-B both move**, with every level-1 soak | **MEASURED** (V4: 8 files; V4b: 7 files) |
| — | kit `VERSION` pins, `in <OBJECT>` assertions, `test-cs013-p1.js:63` | **none** | **MEASURED** (grep) |

⛔ **An edit not in this table is a finding.** The phase stops, records it in
`STATUS.md` with its cause, and makes the edit only if it restores the claim
the closed test was always making.

---

## 12. ⛔ ACCEPTANCE CRITERIA

GDD §19 has no onboarding row (N13); P1 adds one, and it reads:

**Onboarding** — the seven §12 prompts (and every row Paul answered) each fire
once per profile from the shipped trigger, in the well's line style, never
pausing, never covering `depth < 0.25` on any well; a new profile sees them
again; attract mode starts after `ATTRACT_IDLE` at rest on the title, plays
the shipped game unattended, ends on any input, and writes no storage byte,
earns no score, submits nothing, evaluates nothing; level 1's first-seconds
promise restated to what ships and MEASURED; a Classic session with the module
stubbed out hashes identically.

- **Met when:** P1's and P2's tests assert each clause, and P4's soak asserts
  them through the front door with the stubbed twin.
- **§17 item 12 (the soak):** the fourteenth file, both modes, working store,
  reload and a profile switch, ⛔ a stubbed twin hashing identically step by
  step on a session that never idles.
- **§17 item 10**, if P3 lands: every row still MEASURED reachable per row.
- **Quality:** no banned vocabulary — by the closed scan and by eye over every
  prompt text; plays from `file://`; the concat build is the oracle; nothing
  opaque below depth 0.25 (the band is under every rim); ⛔ zero skips at the
  close, which needs `../coinless-kit` present.

---

## 13. ⛔ WHAT CS016 DOES NOT DO

- **Change any level-1 base, `pickSpawnLane()`, the spawn schedules, heat, or
  any Classic constant** (N1-A). ⛔ `GOLDEN_LANES` and the hash do not move.
- **Add a screen value, a HUD rectangle, a toast, a sound, a kill line, a
  `tally` field outside P3, a telemetry column, a stats key or a registry
  change.** The Worker is not contacted.
- **Edit, bump or backport a kit module.**
- **Touch the ring flight, the tokens, the Jump, the combo, the Mimic's
  probation or `C.RING_POINTS`.**
- **Rename an achievement id or delete a `lifetime` row.**
- **Post a prompt, a demo or anything else anywhere.**
- **Build the aimed-fire lab driver** (N12's third alternative); CS017's if
  Paul wants it.
- **Write `DECISIONS.md`** — the close indexes CS016's calls there.
- **Ship** (CS017): the Mimic's verdict, the performance budget, `drawShot()`'s
  allocation, the seven debug spawn actions, the legal sweep.

---

## 14. RISKS

- **K1 — ⛔ N1 is a sentence the GDD has carried since v0.1 and the plan
  measures it false.** A build phase that reads "four seconds" in §12 and
  tries to make it true touches the heat clock. P1's prompt says so in its
  first line.
- **K2 — the prompt band is 20 px tall between the lowest rim and the mirrored
  lives** (§1.4). A palette or HUD-size pass that moves `HUD_MARGIN`,
  `HUD_ICON_SIZE` or `WELL_RADIUS` re-derives `PROMPT_Y`; P1 asserts the
  clearance arithmetically so the day it stops holding the suite says so.
- **K3 — an airborne craft and an aloft Warden cross the band** (§1.6). The
  draw order (N3) is the answer; a phase that draws the prompt after the
  entities is red on P1's z-order assertion.
- **K4 — the demo must never reach a Meta seat.** Four seats exist and three
  are gated by `run === null` for free; `noteCleared()` is the one that is
  not (§1.5 MEASURED). A gate forgotten is a `progress` write from a run
  nobody played. P2's byte-identity assertion is the catch.
- **K5 — the attract driver is a port of a test driver into the build.** It
  reads classes by `instanceof` and constants from `C`; a later roster change
  that the soaks' driver learns must be taught here too. P2 says so in the
  module header.
- **K6 — the first gesture on a fresh load both creates the audio context and
  ends the demo.** Correct, and it means no one ever hears a demo on first
  load; N9 records it so nobody files it as a bug.
- **K7 — ⛔ three Overdrive fixtures are seed-fragile** (`-cs012-p2`, `-p4`,
  `-p6`). CS016 spends no draw and changes no beat, so they are PREDICTED
  unmoved; V3 and V6 are the variants that would have said otherwise.
- **K8 — the pool-length change reshuffles the weekly rotation** (N12). Free
  now, not after ship; P3 lands before CS017 or not at all.
- **K9 — a mutation run that throws is a defect in the test**: guard the
  reads, report a COUNT and one index, assert the string is in the build
  exactly once BEFORE asserting red.
- **K10 — a closed test may pin the literal text of a line a later phase
  changes.** ⛔ Pin only the ARGUMENT the claim is about.
- **K11 — ⛔ zero skips at the close** needs `../coinless-kit` present
  (MEASURED present at HEAD, absent in every clone).
- **K12 — `run-all.js`'s 120 s per-file timeout.** The fourteenth soak must
  fit; the thirteenth ran well inside it. ⛔ A timeout is not a red.
- **K13 — the prompt texts carry `—` and `·`.** `TEXT_FONT_FAMILY` is a
  monospace stack and `TEXT_CHAR_W` sizes the rectangle, so a glyph missing
  from a platform font renders as a box, not a layout break. A skipped
  playtest, recorded at P1.

## 15. ASSUMPTIONS

- **A1 — Paul answers §0's thirteen calls before P1.** ⛔ A build phase that
  reaches an unanswered call stops (`CLAUDE.md` rule 3).
- **A2 — `../coinless-kit` is present for the close** (K11).
- **A3 — the Mimic still ships at the CS016 close**; N2's row 11 rides on it.
- **A4 — the palette and the HUD sizes do not move before CS016 closes**; K2's
  arithmetic is asserted, not assumed.
- **A5 — the fourteenth soak fits the per-file timeout** (K12).
- **A6 — `STATUS.md` and `CLAUDE.md` have room**: 277 lines and 36,926 bytes,
  the most headroom any changeset since CS012 has started with.

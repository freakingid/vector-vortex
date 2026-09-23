# CLAUDE.md — Vector Vortex

Auto-loaded every session. Read this, then `STATUS.md`, then your phase prompt.
Nothing else unless the prompt names it.

**This file states rules, not reasons.** Reasons live in `RATIONALE.md`, keyed by
`#anchor` — pull one section when a rule's scope is genuinely ambiguous, never by
default.

- **⛔ INVARIANT** — violating it breaks the build, player save data, or a shipped
  guarantee. Never violate. Never "clean up."
- **⚠ SETTLED** — looks wrong, was decided deliberately. **Do not fix it or
  re-litigate it.** If you believe it is wrong, stop and tell Paul; change nothing
  in the session you noticed it.

---

## What this is

A standalone browser tube shooter — an original-IP homage to Atari's *Tempest*
(1981), with a switchable Overdrive mode in the spirit of *Tempest 2000*. Canvas
2D + vanilla JS + Web Audio, zero runtime dependencies. Solo developer (Paul);
you are the implementer only. **The canonical name is `Vector Vortex`.** Repo:
`github.com/freakingid/vector-vortex`.

---

## ⛔ Vocabulary — legal, not stylistic

| Our term | What it is |
|---|---|
| **Well** | The tube the player defends |
| **Rim** | The near edge, where the player sits |
| **Throat** | The distant vanishing aperture |
| **Lane** | One segment running rim→throat |
| **Depth** | Normalized position, 0 = throat, 1 = rim |
| **Skimmer** | The player's craft |
| **Purge** | The once-per-well panic clear |
| **Thorn** | Static lane hazard |
| **Start Depth** | Selectable starting level |
| **Vaulter / Carrier / Weaver / Drifter / Surger** | The five Classic enemies |
| **Reaver / Warden / Mimic** | The three Overdrive enemies |

⛔ **These are the ONLY terms — in prose, docs, player-facing strings and code
identifiers.** Never write Flipper, Fuseball, Pulsar, Tanker, Spiker,
Superzapper, Blaster, or Web anywhere in this repo, a comment or a local variable
included, nor "Tempest" or a `T-####` name in any file. `test-cs008-p6.js` scans
the build by SUBSTRING, so a banned word joined by `_` or camelCase is red.
`RATIONALE.md#vocabulary`.

---

## Session rules

⛔ **Three kinds of session, and a session is exactly one of them**, all in Claude
Code.

| Kind | Writes | Ends in |
|---|---|---|
| **Planning** | `PLANNED-FEATURES-CS0##.md`, `IMPLEMENTATION-PHASES-CS0##.md` | those two docs, committed |
| **Build phase** | `src/`, `scratchpad/`, `log/CS0##.md`, the docs its phase names | one phase, committed |
| **Close** | `log/CS0##.md`, `STATUS.md`, `ROADMAP.md`, `SKIPPED-PLAYTESTS.md`, `DECISIONS.md` | the changeset closed |

1. **Read `STATUS.md` first**; update it at the end of the session.
2. **One phase per session.** Build only what the prompt scopes. A small choice
   that would ease a later phase is noted, not taken.
3. ⛔ **A build phase executes a reviewed plan and invents no design.** A design
   call `PLANNED-FEATURES-CS0##.md` doesn't cover is **surfaced, not answered** and
   not quietly read one way. ⛔ **A planning session too**: reading the code is not
   authority to decide what the game does; a plan names the call and stops.
3a. ⛔ **A planning session writes NO code** — no `src/`, test or fixture. It may
   and should *run* anything.
3b. ⛔ **Every planning-doc claim is marked MEASURED** (naming the command and
   commit) **or PREDICTED.** ⛔ **Measure anything measurable** — a pointer count,
   a baseline, a closed assertion is one command.
3c. **A build phase reads the DOC, not the conversation that produced it.**
4. **Commit per phase, on `main`**, code and docs together. **Never push.**
5. **Edit docs in place**, in the commit. Never print one for copy-paste.
6. **Prefer `str_replace` over full-file rewrites.** Re-read the region first.
7. **Don't refactor unprompted.** Propose it.
8. **A hazard the prompt didn't name goes in `STATUS.md`.**

`RATIONALE.md#session-rules`.

---

## Document map

| File | What it is | Read it? |
|---|---|---|
| `CLAUDE.md` | Rules, invariants, code map | Always |
| `STATUS.md` | Build reality, current changeset only | Always |
| `PLANNED-FEATURES-CS0##.md` | Spec for what's being built now | When in-flight |
| `IMPLEMENTATION-PHASES-CS0##.md` | Build order + phase prompts | When in-flight |
| `VECTOR-VORTEX-GDD.md` | Design intent + shipped behaviour | §0 + §1, then named sections |
| `DIFFICULTY-NOTES.md` | The heat curve | Touching difficulty |
| `EXTERNAL-FILES.md` | Runtime files the shipped game loads | Adding one |
| `RATIONALE.md` | Why the rules here exist | On demand |
| `DECISIONS.md` | Judgment calls outside the phase flow | On demand |
| `ROADMAP.md` | Changeset sequence to ship | On demand |
| `NEXT-STEPS.md` | Specified, unscheduled work | ⛔ **Only when a prompt names it** |
| `SKIPPED-PLAYTESTS.md` | Playtests skipped by policy, and what each was for | **Never by default** |
| `log/CS0##.md` | Per-changeset narrative + version history | **Never by default** |
| `archive/` | Spent planning docs | **Never by default** |

⛔ **The GDD is read by named subsection**: §0 + §1 always (§0's third column says
what you might be editing), then the sections your phase names. No §0 row for
what you are editing is a defect in §0 — record it in `STATUS.md`, do not work
around it.

⛔ **`log/` and `archive/` are not session context.** Pull one file only when a
question genuinely needs history, and say that you did.

⛔ **Version history is per changeset, in `log/CS0##.md`**; no central changelog.
A close appends its entry there.

⛔ **A build phase appends its reasoning to `log/CS0##.md` AS IT GOES.** ⛔ **Split
by KIND, not volume:** hazards, moved baselines, fixture preconditions and
anything the NEXT phase acts on go in `STATUS.md`; how a call was reasoned,
measured-against-predicted and mutation records go in `log/`. ⛔ **A hazard
buried in `log/` is a hazard nobody loads.**

---

## STATUS.md format

⛔ **Current changeset only, under ~400 lines.** The close REVIEWS every phase's
`log/CS0##.md` together, compresses it, moves what is left here into it, and
resets this file.

⛔ **A phase entry is one ledger line and ≤ ~200 words of body.**

⛔ **Every entry starts its own paragraph (`\n\n`)** — verify after a shell append.

⛔ **Paul does NO playtests (2026-09-16).** Nothing asks him to play, listen or
look, and nothing waits on it. Something only a person could judge gets one
`SKIPPED-PLAYTESTS.md` entry (changeset, phase, what he would have done, what it
was for, knobs) — never an entry here — and the shipped values stand.
⛔ **A lab in `tools/` is NOT a playtest**: building one for Paul is allowed, and
its results port in as data.

---

## This file's own ceiling

⛔ **`CLAUDE.md` stays under 50 KB**, and as far under as it can: it loads every
session, so every byte taxes every phase.

⛔ **It carries RULES in their shortest complete form.** A rule says what must
hold, where, and which test pins it. Reasons go to `RATIONALE.md` under an anchor
the rule names; history ("used to", "measured at", which phase or plan letter
landed it) goes to `log/`. ⛔ **A fact is stated once**; another section points at
it rather than restating it.

⚠ **The valve:** past the ceiling, a section over ~4 KB moves its reasoning to
`RATIONALE.md` when it is next edited; nothing is deleted. It fires on an edit,
never as a standing sweep — the one directed pass was Paul's, 2026-09-20
(`RATIONALE.md#compaction`).

---

## Build rules

### Shape

⛔ **Source is multi-file in `src/`; `node build.js` concatenates it in `MANIFEST`
order into one file, `dist/vector-vortex.html`,** which ⛔ **opens and plays from
`file://` by double-click.**

⛔ **The concatenated build is the BEHAVIOUR ORACLE.** Tests load `dist/`, never
`src/`; a `src/` refactor that changes built behaviour is a bug in the refactor.

⛔ **`MANIFEST` is checked both ways against `src/`** — unlisted or absent both
fail the build. A new module is a `MANIFEST` edit.

⛔ **External runtime files are optional, never required**: classic `<script
src>`, never `fetch()` or `import`, every load wrapped so **absence is the normal
path**, each logged in `EXTERNAL-FILES.md` before it ships. ⛔ **One exception:** a
third-party ES module may ship as `<script type="module">` whose only job is
handing exports to a `window.*` global, with no game logic (kit-leaderboard).

⛔ **kit-names, kit-storage and kit-profile are INLINED from `lib/`, unedited**, by
`build.js`'s `KIT_INLINE`, as `KitNames` / `KitStorage` / `KitProfile`, after
`20-achievements.js` — ⛔ never between `21-telemetry.js` and `22-meta.js`
(`test-cs007-p4.js`). ⛔ An import or export form the wrapper does not rewrite
fails the build.

⛔ **Outbound links go through `openExternal(url)`** — always
`window.open(url, "_blank", "noopener")`.

### Config

⛔ **Every tunable lives in `C`, in `src/00-config.js`, grouped by system.** No
magic number anywhere else. This is the highest architectural priority.

⛔ **One clock: `game.level`** (`DIFFICULTY-NOTES.md`). ⛔ **Every heat-derived
value is ONE accessor in `00-config.js`** — `spawnInterval()`, `enemyConcurrent()`,
`climbMult()`, `vaultInterval()`, `vaultRimInterval()`, `surgeInterval()`,
`weaverApex()` — of Form A, `base + (clamp - base) * min(heat(level)/heat(99), 1)`.
⛔ **No entity reads a base constant, no call site computes heat inline, and
`climbMult()` is the ONE multiplier on all five entity climbs** (`test-cs007-p2.js`).

⛔ **`heat(1)` is exactly 0.**

⛔ **Heat never scales** `VAULT_HOP_TIME`, `DRIFT_CROSS_TIME`, `DRIFT_RIDE_TIME`,
`WEAVER_BOLT_SPEED`, `WEAVER_RETREAT` or `SURGE_DISCHARGE`. ⚠ A **slower** bolt
breaches the respawn guarantee.

⛔ **`C.RESPAWN_PUSH_DEPTH` is 0.55 at every level, held by `C.CLIMB_MULT_MAX`
1.40** (margin +0.087 s; 1.4815 breaches); there is no derived push. ⛔ **Raising
`CLIMB_MULT_MAX` means re-deriving the guarantee**, which reads `C.CLIMB_MAX_BASE`,
the fastest contact-killing climb.

⛔ **Which KINDS a well may release is `C.SPAWN_SCHEDULE`** — seven cumulative,
sorted `{ level, kind }` rows — **plus `C.SPAWN_SCHEDULE_OVERDRIVE` on an
Overdrive run**, a second table and never a `mode` field on the first
(`test-cs007-p3.js`). `eligibleKinds(level, mode)` (`08-spawner.js`; `mode`
defaults to `"classic"`) merges the rows at or below the level, Classic first at a
tie, and ⛔ **is a function of level and mode alone** — no board, no heat, no
draw. ⛔ **`thorn` and `weaverBolt` are NEVER rows**; they enter through
`Weaver.layThorn()` and `Weaver.fire()`.

⛔ **A one-entry eligible set spends NO draw; two or more spend exactly ONE**, in
both modes (`test-cs004-p1.js`'s `GOLDEN_LANES`). ⛔ **Never rename
`pickSpawnKind(state)`** — `_harness.js`'s `EXPORTS` and four closed tests call it.

⚠ **SETTLED — the kind pick is UNIFORM, with NO cargo weight table and no second
draw** (Paul, 2026-08-31; GDD §6.2, §8.1).

`RATIONALE.md#config`.

### Math and lifecycle

⛔ **Every entity position is `(lane, depth)`, never a screen coordinate.** Screen
position is render-time only; collision is a 1-D overlap on `depth` plus a lane
match.

⛔ **Open wells are not closed wells with a clamp.** The Skimmer clamps at the
ends **and enemy lane-hopping reverses at the wall, never wraps.**

⛔ **A lane BOUNDARY is the half-integer between two lane centres, and the lattice
is a second set of legal positions.** `laneHop`'s fold bounds are a **parameter**,
defaulting to `0 … lanes-1`; a boundary rider passes `laneBoundaryLo(well)` /
`laneBoundaryHi(well)`. ⛔ **An open well's two outermost boundaries are not
addressable.** A rider is born at a lane centre and crosses onto the lattice
through `boundaryFrom()`, which does **not** go through `laneHop`.
`RATIONALE.md#boundary-lattice`.

⛔ **Nothing in the draw path may call `state.rng()`.** A random value the renderer
needs is drawn in the simulation, stored on `state`, read by `draw()`.
`RATIONALE.md#draw-path-rng`.

⛔ **Entity lifecycle: class with `constructor` / `update(dt)` / `draw()` /
`dead`.** Kill by `dead = true`; remove with an end-of-frame `.filter()`; never
splice mid-loop.

⛔ **A new enemy wires into seven places:** `startGame` reset, `update()` entity
pass, collision pass and cleanup filter, `draw()` z-order, the well-clear
condition, and **the Dive**. ⛔ **Four things are decided EXPLICITLY** (GDD §6.5):
whether the **Purge** destroys it; whether it **survives a dive** if
`blocksClear: false` and not `anchored` (`startDive()` keeps `anchored` survivors
only, so today's answer is *no*); its **`sfxVoice`** (eighth contract field); and
its **`aloft`** (ninth), `false` for anything in the well. ⛔ **Classic enemies
live in `07-enemies.js`, Overdrive ones in `07-enemies-overdrive.js`** against the
first's contract, reaching the board only through `C.SPAWN_SCHEDULE_OVERDRIVE`,
with a kill pitch from `tools/sfx-lab.html`'s KILL PITCH table.

⛔ **AIRBORNE IS A PHASE, NOT A DEPTH, AND THE SKIMMER HAS NO `depth` FIELD**
(GDD §14.2). One bag, `state.jump`, one top-level `updateJump(state, dt)`
(`05-skimmer.js`); `collideSkimmer()` SKIPS ITS WHOLE PASS while `phase` is
`"air"`. ⛔ **The build has exactly ONE two-depth comparison, the dive strike**, and
⛔ **the Skimmer gets no `depth`.** ⛔ **`updateJump()` is a TOTAL no-op outside
`modeHas("jump")`**, `latched` included. ⛔ **The lift and the shadow are
DRAW-TIME ONLY.** `RATIONALE.md#entity-phases`.

⛔ **ALOFT IS A PHASE TOO — the ninth contract field** (GDD §6.4, §6.5): the
entity is ABOVE the well, the Warden and nothing else. Its `depth` is a POSITION
and it is **1**; ⛔ **nothing gets a depth above 1.** ⛔ **Two readers:**
`collideShots()` SKIPS one, `jumpStrike()` REQUIRES one. ⛔ **It exempts nothing
else** — `anchored` stays false, the array is one — and ⛔ **a new reader that wants
to exclude one says so itself.** `RATIONALE.md#entity-phases`.

⛔ **THE MIMIC'S BUDGET IS ITS TWO STATES, NOT A COUNTER** (GDD §6.4, §14.6).
Closed, it consumes a shot and sends it back ONCE; that reflection alone OPENS it;
open, it reflects nothing. ⛔ **No `reflected` latch, no cooldown.** ⛔ **The
opening is UNCONDITIONAL and `sfx("reflect")` is not.** ⛔ **`C.MIMIC_APEX` is
BOUNDED, not tuned** — ≤ 0.4308 from the constants, shipped 0.40; raising it or
`MIMIC_SHOT_RATIO` is red. ⚠ **The Mimic is ON PROBATION and cuts in ONE ROW**
(GDD §21 #6), `{ level: 16, kind: "mimic" }` in `C.SPAWN_SCHEDULE_OVERDRIVE`; keep
it that way. `RATIONALE.md#entity-phases`.

⛔ **A PROJECTILE MAY BE A PARAMETER VARIANT.** `MimicShot extends WeaverBolt`
over one overridable reader, `speed()`. ⛔ **`C.WEAVER_BOLT_SPEED` is named ONCE in
the build, inside that reader**, never scaled by `climbMult()`. ⛔ **A speed
refactor is proved by a HASH, never by reading.** `RATIONALE.md#entity-phases`.

⛔ **`anchored` says what `depth` MEANS, not whether the entity moves**: `false` is
a position; `true` is a length rooted at the throat — the Thorn and nothing else.
Its one reader is `respawnSkimmer()`, which skips anchored entities. ⚠ **Not** a
narrowing of GDD §4.4's SETTLED band. `RATIONALE.md#thorn-depth`.

⚠ **SETTLED — the Purge kills Carriers WITHOUT splitting them, by omission.**
`updatePurge()` sets `dead` directly and never calls `onShot()`. Do not route it
through `onShot` "for consistency".

### Rendering

⛔ **Render through `drawPoly` + `glowStroke`**: local-space point arrays, no
per-entity pipelines, no fills, sprites or textures. ⛔ **The HUD too** — no
`fillRect`, no `strokeRect`.

⛔ **Text goes through `drawText()` (`13-render-well.js`) and nothing else** — the
build's one `fillText`/`strokeText` site (`test-cs008-p4.js`).

⛔ **Nothing opaque below `C.READABILITY_DEPTH` (0.25).** Explosions, particles and
score popups are clipped or faded in the throat zone. `RATIONALE.md#readability`.

⛔ **Game math never reads window size.** Fixed 1280×720, letterboxed by CSS.

### Scoring

⛔ **All scoring routes through `addScore()`**, which also owns extra-life
milestones. A bypass is recorded here or does not exist.

⛔ **FOUR KILL SITES AND FIVE KILL LINES, ALL IN `09-collision.js`** (GDD §7):
`collideShots()`, the rim sweep, BOTH Purge uses, and `jumpStrike()` — an airborne
craft kills every aloft entity in its lane, a LANE MATCH ON TWO FLAGS, not a depth
comparison. ⛔ **A phase that edits a kill line repairs `test-cs012-p4.js`'s six
`COMBO_OUT` strings and `-p6.js`'s**, and no kill line may match one.

⛔ **OVERDRIVE'S COMBO MULTIPLIER IS APPLIED AT THE KILL SITES, NOT IN
`addScore()`** (GDD §7, §14.4): each kill line reads
`addScore(e.points() * comboMult()); comboKill(state);` — scored at the multiplier
in force, then raising it. ⛔ **Not a bypass, not a second writer.** ⛔ **Exactly what builds it is multiplied** — kill points at the
kill sites; the Thorn's per-chip 5, the three clear bonuses and the Start Depth
bonus are not, and build nothing. ⛔ **Do not "unify" it into `addScore()`.**

⛔ **A RING PAYS `C.RING_POINTS` THROUGH `addScore()`, UNMULTIPLIED, BUILDING AND
ROLLING NOTHING** (GDD §7, §14.5). ⛔ **A Dive is not a kill site** and its
termination kill pays nothing. A ring may cross an extra-life milestone.
⚠ `C.RING_POINTS` is **provisional**.

⛔ **`comboMult()`, `comboKill()`, `comboDeath()` and `updateCombo()` live in
`12-scoring.js`, each a no-op — or exactly 1 — outside `modeHas("combo")`**, so a
Classic run is bit-identical (`test-cs012-p4.js`). ⛔ **`comboDrop()` is the ONE
place the multiplier falls and the ONE `sfx("comboLost")` seat.** ⛔ **The combo
spends no draw and calls no `heat()`.**

### Tokens

⛔ **A TOKEN IS NOT AN ENEMY.** It lives in a SECOND ARRAY, `state.tokens`, and
⛔ **`dropToken(state, e)` (`10-powerups.js`) is its ONE way in** (GDD §6.5,
§14.1) — no contract field, no `ENEMY_KINDS` row, invisible to `state.enemies`'
readers. ⛔ **`dropToken()` follows `comboKill()` on all five kill lines, and each
OVERDRIVE kill spends exactly ONE draw**, drop or no drop, at `MAX_TOKENS` too.
⛔ **A total no-op in Classic** (`modeHas("tokens")`, no draw), and ⛔ the Dive's
termination kill rolls nothing. ⛔ **GDD §14.1's two
tables stay two**: `C.TOKEN_WEIGHTS` (which token) and the effect constants
(`BOUNTY_POINTS`, `LANCE_CHIP_MULT`, `SPREAD_SHOT_MAX` — what one does); neither
names the other's numbers. ⛔ **The well owns them**: `enterWell()` and
`startDive()` call `resetTokens()` (tokens emptied, `state.powers` off); a death
keeps both. ⛔ A Bounty is `addScore()`,
unmultiplied, building nothing. `RATIONALE.md#tokens`.

⛔ **LANCE IS ONE TERM ON THE LINE THAT RETIRES A SHOT, AND THE `break` STAYS
UNCONDITIONAL**: `if (e.onShot(shot) && !(shot.pierce && e.dead))` — a KILL does
not consume the shot; a chip, a refusal and a decline do. ⛔ `pierce` is the
SHOT's field, copied at fire time from `state.powers.lance`. ⛔ **`Thorn.onShot()` is the ONE `onShot` that
reads its argument** — `null` (the rim sweep) is one chip — and pays `PTS_THORN`
**per chip of LENGTH**, clamped, so `    addScore(C.PTS_THORN);` stays in the
build exactly once (`test-cs012-p4.js`). ⛔ **The shot cap is the CAP IN FORCE**:
`C.SHOT_MAX`, or `C.SPREAD_SHOT_MAX` while Spread is on (GDD §17 item 4).

⛔ **THE WARD IS ONE EARLY RETURN IN `killSkimmer()`, BELOW THE INVULNERABILITY
GUARD AND ABOVE EVERYTHING A DEATH DOES**, and the ONE `sfx("wardBreak")` seat.
⛔ **Not a death**: no life, `diedThisWell`, `tally.deaths`, combo loss, freeze or
stop. It clears the flag and sets `state.invulnTime = 0`, ⛔ **with no rim push**.
⛔ A Dive is safe because `startDive()` spends every power, never because this
function knows what a dive is.

### The Dive

`RATIONALE.md#ring-flight` for everything below.

⛔ **OVERDRIVE'S DIVE IS A RING FLIGHT AND IT IS THE SAME DIVE** (GDD §5, §14.5):
one module, `11-dive.js`; one beat, one strike, one termination guarantee.
⛔ **`modeHas("rings")` is the whole gate; `rings: false` in `C.MODE_FLAGS`'
Overdrive row is the whole cut.**

⛔ **`C.DIVE_TIME_OD` is read exactly as `C.DIVE_TIME` is — the WHOLE dive, grace
included** — through one accessor, `diveTime()`, which reads the FLAG, never
`state.mode`. `C.DIVE_GRACE` is a slice off the front of whichever is in force.

⛔ **A RING IS NEITHER ENEMY NOR TOKEN: a FIELD ON `state.dive`, and `layRings()` is
its ONE way in.** No contract field, `ENEMY_KINDS` row or `STATE_FIELDS` row, and
⛔ **no `anchored`** — its `depth` is a POSITION. `resetDive()` empties the set;
⛔ **a repeated dive RE-LAYS it.**

⛔ **THE LATTICE IS A FUNCTION OF THE WELL AND CONSTANTS ALONE** — no draw (a dive
spends **zero** RNG in both modes), no `heat()`, no `state.level`, not the craft's
lane. Depths are the midpoints of `C.DIVE_RINGS_MAX` equal slices, laid rim-first,
⛔ **all strictly below 1**; arc centres walk through **`laneHop()`**.

⛔ **THE TAKE PASS IS A LANE MATCH INSIDE A DEPTH CROSSING, ABOVE THE STRIKE TEST
AND THE COMPLETION CHECK.** The lane test is `laneDelta` against
`C.RING_ARC_LANES`, as `laneHit` reads `C.HIT_LANE_TOL`: ⛔ **no second idea of
lane-sameness, no second control model.** ⛔ **Not** a second two-depth comparison
(two POSITIONS; the strike compares a position with a LENGTH). ⛔ **Each ring
resolves ONCE** (`taken`: `null` → `true`/`false`); "you stop earning" is that
`false` — no counter, streak or full-set bonus.

⛔ **THE DIVE'S VISUAL IS DRAW-TIME ONLY, AND `diveDrawDepth()` IS THE RENDERER'S
WHOLE KNOWLEDGE OF THE DIVE.** `C.DIVE_RUNGS` cross-sections on `layRings()`'
lattice, drawn in **BOTH** modes; a ring is the ARC the take pass reads,
unresolved only; a token's z-order. ⛔ **No camera, canvas transform, new
projection or new `drawWell()` parameter** — `13-render-well.js` is UNTOUCHED.
⛔ **It moves no state and no hash in either mode.**

⛔ **CLASSIC IS A TOTAL NO-OP** — nothing laid or taken, no draw, `C.DIVE_TIME`
long — proved by a step-by-step hash against `layRings()` and `takeRings()`
stubbed (`test-cs014-p1.js`, `-p3.js`).

⛔ **ALL FIVE OF GDD §4.5's DEATH CONDITIONS STAY LIVE IN BOTH MODES.**

### Audio

⛔ **`MusicSys` lives alongside `AudioSys`, never inside it**; `AudioSys` is a flat
bag of one-shot voices and grows no sequencer.

⛔ **Per-frame lookahead scheduling; never `setTimeout` or `setInterval` for
notes.** Each frame schedules anything starting within `C.MUSIC_LOOKAHEAD` on
absolute `AudioContext.currentTime`.

⛔ **Tracks are DATA**: a new track is a table entry built by its own
`buildXTrack()`. **Do not modify the scheduler or the layer gain gating**;
`playNote()`'s voice branch is the one extension point.

⛔ **Compose in `tools/music-lab.html` and port verbatim.** Never hand-tune a gain
in the build.

⛔ **`scheduleStep` never consults intensity**: every layer is always scheduled,
and gating is entirely a downstream gain node.

⛔ **The melody lives in the always-on foundation tier and is never gated.**

⛔ **Every gated layer passes the solo test** — recognizable played alone, the rest
muted (`music-lab`'s per-layer solo). A layer that fails does not ship.

⛔ **A layer's `tier` is in `1..4`** — `C.LAYER_THRESHOLD` has no key for 5+.

⛔ **Every audio entry point is `if (!AudioSys.ctx) return;`-guarded.**

⛔ **KIT-AUDIO IS 0.4.0, AND ITS GROUPS ARE ALL OPTIONAL.** Signal path: track gain
→ sweep → **high-pass** → limiter → duck → dip → `music`. ⛔ **The high-pass
(`highpass: { hz, tc }`) sits BEFORE the limiter, with the sweep.**
`setHighpass(on)` is idempotent, called every frame from `audioFrame()`, ⛔ **moves
by `setTargetAtTime`, never a bare `.value`**, and its "off" is a resting 0 Hz
pass-through, not a bypass. ⛔ **Its `Q` is a fixed Butterworth, not a tunable**
(`test-cs009-p5.js`'s headroom model depends on it).

⚠ **SETTLED — the Surger charge tone is a gameplay cue**, audible over music at
every intensity tier: the one sound whose absence costs a life.

⚠ **SETTLED — music is struck, never swelled** (Paul, 2026-09-16; GDD §11.3). On
every layer of every track: `atk` ≤ 0.005 s; decay starts within 0.05 s of the
onset (`rel` ≥ the note's sounding length); a note sounds for at most its layer's
`GATE` in steps; a filter sweep closes, never opens.

`RATIONALE.md#music-layers`, `#audio`.

### Save data

⛔ **`kit-storage` owns the keyspace**: every key is `coinless.<C.GAME_ID>.<key>`,
declared up front in `22-meta.js`'s one `Store`; `get`/`set` on an undeclared key
throws. ⛔ **`22-meta.js` is the only file that calls storage**, and ⛔ **the game
never enumerates it** — no store `keys()`, `scopes()`, `clear()` or `usage()`, no
`key(i)`, `.length` or `Object.keys` over storage.

| Declared key | Scope |
|---|---|
| `settings` | Per-profile |
| `progress` | Per-profile — **v2**, `{ classic, overdrive }`, the Start Depth record per mode; migrated from v1's `{ highestCleared }` into `classic` |
| `achievements` | Per-profile — **v1**, `{ lifetimeUnlocked, lifetimeTiers, weeklyUnlocked, weekKey }`, arrays not Sets, ⛔ **no `migrate`** |
| `scores` | Root, shared across profiles |
| `telemetry` | Per-profile, lazy |
| `onboarding` | Per-profile — **v1**, `{ seen: [ids] }`, ⛔ **no `migrate`**; MARKED on a trigger step, ⛔ **WRITTEN only at the clear edge, `runEnded()`, `autoPause` and `beforeChange`** (`test-cs015-p2.js`) |

⛔ **A row-shape change bumps that key's version and supplies a `migrate`, never a
new key name.** ⛔ **A `migrate` is pure, never calls back into the store**, and
returns `undefined` for an origin version it cannot read.

⛔ **`C.GAME_ID` IS THE SAVE KEYSPACE AND NOTHING ELSE** — never a board id (those
are `C.LEADERBOARD_GAME_IDS`).

⛔ **New state is additive, under known-value-else-default loading.** Removing a
field needs no migration.

⛔ **No legacy stores**: `kit-profile` is wired with `legacyRosterKey: null` —
⛔ **`null`, never `''`** — and `legacyProbeKeys: []`.

⛔ **Achievement `id` values are save data and are never renamed.**

⛔ **ACHIEVEMENTS EVALUATE AT TWO SEATS AND NO THIRD** (GDD §15.5): the clear
edge (`Meta.clearEdge()`) and `Meta.runEnded()`, which reads `ok`, its local —
`run` is already null there. ⛔ **Never per step**, and ⛔ **the facts are one
flat object the game builds at the seat** from `state` and `state.tally`;
`20-achievements.js` reads neither. ⛔ **An unlock pays nothing.**

⛔ **AN ACHIEVEMENT `id` IS SAVE DATA; ITS THRESHOLD, `name` AND `note` ARE NOT**
(GDD §15.5). The table is `C.ACHIEVEMENTS` — 23 lifetime rows, a 19-row weekly
POOL, `perWeek` 5 — and ⛔ **a row is ONE fact `>=` ONE threshold**, so a
CONJUNCTION is a quantity gated to 0 by its other half and an AT-MOST or a
WITHOUT is a 0/1 fact with `at: 1`, both built in `facts()`. ⛔ **A per-well
window is the DELTA SINCE THE LAST CLEAR EDGE**, in Meta's closure, and costs no
`tally` field. ⛔ **The two seats see different facts** — the run's end omits the
per-well block, the clear edge omits the run's closing facts — and the module's
skip of a non-finite fact is what makes that safe. ⛔ **Every row is MEASURED
reachable, PER ROW** (`test-cs015-p3.js`'s `REACH`); a row no board reaches is
reported to Paul, never shipped and never quietly lowered.

⛔ **THE ACHIEVEMENTS SCREEN IS SCORES' SHAPE AND THERE IS NO TOAST** (GDD
§10.5): rows rebuilt on entry, never in `draw()`; a row on the TITLE after
PROFILE and one on OPTIONS before BACK; BACK returns to whichever door;
⛔ **no seventh HUD rectangle.** ⛔ **A name is ≤ 20 characters and a note ≤ 60**,
and ⛔ **TWO info lines and no third** — MEASURED, a third pushes the seventh row
off the canvas.

⛔ **A `tally` COUNTER IS WRITE-ONLY AND NOTHING IN THE SIMULATION BRANCHES ON
ONE** (`02-state.js`), which is what keeps a counter free of the determinism
hash. ⛔ **It is written where its event happens**, and ⛔ **a counter that needs
what DIED goes in `tallyKill()`, on its own line beside a kill line, never in
one** (`test-cs012-p4.js`, `test-cs014-p1.js` pin all five).

⛔ **`Profiles.scope()` is the active profile's store; the game never builds a key
string.** ⛔ **Profile `p0`'s scope is the ROOT store**, so a per-profile
`remove(key)` never names a root key.

⛔ **A switch (`Profiles.select(id)`) resets the runtime to shipped defaults
BEFORE loading the incoming profile.**

⛔ **`playerId` is minted once, on first activation** — never at creation, never
regenerated — via `crypto.randomUUID` with a `crypto.getRandomValues` fallback.

`RATIONALE.md#save-data`.

### Leaderboard

⛔ **One `Leaderboard` object is the only call surface for
`window.KitLeaderboard`**, every entry point safe with the module absent.

⛔ **TWO BOARDS, ONE PER MODE, ONE KIT CLIENT EACH**: `C.LEADERBOARD_GAME_IDS` is
`{ classic: "vector-vortex", overdrive: "vector-vortex-overdrive" }`, both
registered in coinless-kit. Clients are made by the first call that finds the
module, Classic first; a throwing `create()` is not retried, per client.
`beginRun()` and `submit()` route by `state.mode`; `load(mode, done)` answers under
one stale-answer token; `queueLength()` **sums both**.

⛔ **`Meta.eligible()` is the ONE gate** — every `submit()`, both boards, the
local top-10 check and every achievement evaluation. Extend them together or not
at all.

⚠ **SETTLED — `'completed'` has no call site.** Only `'died'` and `'quit'` are
submitted; do not invent a trigger to fill the enum.

⛔ **Read the registered `statsFields` in coinless-kit's
`services/leaderboard/src/registry.js` before sending a stats key.** An
unregistered key flags every row it posts.

### Attract mode

⛔ **THE DEMO IS A RUN WITH NO START SEAT, NOT A SCREEN** (GDD §12):
`state.screen` stays `"play"` and a `Game`-closure flag marks it, never `state`.
`run` stays null, so `Meta.eligible()` reads false with no new term; the
telemetry sample, the prompt scan and the clear edge's `noteCleared()` /
`clearEdge()` / `savePrompts()` skip on the flag, and ⛔ **the store's bytes do
not move** (`test-cs016-p2.js`). ⛔ **`attractDrive()` writes the struct AFTER
`input.sample()`, once the devices' reading is read, and writes nothing else.**
⛔ **Any named action ends it and does nothing else**; an ending inside a step
keeps the step's struct.

---

## Kit modules and extraction

⛔ **The boundary contract: a kit module never reaches into game state** — no
`state`, no `C`, no game object, no game global, in either direction. Everything
crosses as an explicit parameter or a callback the game supplies:

```js
const board = KitLeaderboard.create({ getPlayer: () => profiles.player() }); // right
const board = KitLeaderboard.create({ game: state });   // wrong: it knows what a Skimmer is
```

**Consuming.** Kit modules are vendored into `lib/` at a pinned version.
⛔ **Fix a kit module HERE, in `lib/`**, never in the coinless-kit repo — the three
inlined ones included. ⛔ **The edit stays game-agnostic**; a Vector-Vortex-only
change belongs in the game's wrapper. ⛔ **Bump its `VERSION`** (PATCH fix, MINOR
additive, MAJOR breaking). ⛔ **Backporting is a separate, manual step**, never
implied by the edit. ⛔ **Every `lib/` module has a sibling `.NOTES.md`**, the
backport packet — per entry: version, what changed, why, game-agnostic
confirmation, backport status (`not yet` / `backported YYYY-MM-DD` / `rejected —
reason`). `DECISIONS.md` gets a one-line pointer, never the writeup.

**Producing.** These are built **kit-shaped from v1**:

| `src/` module | Future kit module |
|---|---|
| `04-input.js` | `kit-input` |
| `15-render-hud.js` (menu/screen-state portion) | `kit-menu` |
| `16-audio-engine.js` + `18-audio-director.js` | `kit-audio` |
| `14-render-entities.js` (glow/particle primitives) | `kit-fx` |
| `20-achievements.js` | `kit-achievements` |
| `22-meta.js` (local high scores portion) | `kit-scores` |

⛔ **They obey the boundary contract from their first commit** and carry a
`.NOTES.md` beside them in `src/` from the start, which doubles as draft kit
documentation.

⚠ **SETTLED — kit-shaping costs overhead per phase and is worth it** (Paul,
2026-08-30). Never let a module read game state because the boundary was
inconvenient.

`RATIONALE.md#kit`.

---

## Test rules

⛔ **New tests use `scratchpad/_harness.js`**; never hand-roll a sandbox.

⛔ **Drive the real code.** Never inline a copy of the logic under test.

⛔ **A test asserts only what its own phase owns** — never a global count or an
inventory of something it did not build. ⛔ **Global counts live only in
`scratchpad/test-registry.js`.**

⛔ **When a later changeset REPLACES behaviour a closed test asserts, it rewrites
those assertions IN PLACE** — never deleted, never weakened, no new coverage there
(that goes in the new changeset's own file). ⚠ **A closed fixture** invalidated by
the replacement is repaired to restore the precondition its assertion was about,
never relaxed.

⛔ **Seed before the first build**: `installSeed(n)` above everything.

⛔ **Run `node scratchpad/run-all.js` before committing.** Nonzero exit = not done;
never leave the suite redder than you found it.

⛔ **Frame-budget gates are counter-based, never wall-clock.**

⛔ **Skip loudly** — a skip is a visible non-answer, never a vacuous pass; a close
asserts zero skips.

**Test header budget: ~15 lines** — what's under test, and traps not obvious from
the code.

---

## Code map

Read-order skeleton; GDD §16 is authoritative.

```
src/00-config.js       C — every tunable; THE HEAT CLOCK (heat, 7 accessors);
                       modeHas(), C.MODE_FLAGS' one reader
    01-rng.js          mulberry32 — the run's ONE seeded stream
    02-state.js        the one mutable game object
    03-wells.js        the 16 wells (DATA) + the depth model
    04-input.js        four devices -> one input struct
    05-skimmer.js      movement, snap assist, wall squash, blink; the Jump
                       (state.jump, updateJump(), resetJump()) and liftPoints(),
                       the ONE copy of the draw-only lift math
    06-shots.js        firing, lane-locked travel
    07-enemies.js      the entity contract + the Classic roster
    07-enemies-overdrive.js  Reaver, Warden, Mimic + MimicShot (the ONE
                       sfx("reflect") seat)
    08-spawner.js      spawnEnemy() — the ONE way in — cadence, quota, clear,
                       eligibleKinds()
    09-collision.js    the ONE 1-D pass, killSkimmer(), the Purge, jumpStrike();
                       tallyKill() — what DIED, beside the kill lines
    10-powerups.js     tokens: dropToken() (the ONE way in), updateTokens(), the
                       pickup, resetTokens()
    11-dive.js         the Dive and the ring flight: diveTime(), layRings() (the
                       ONE way in), takeRings()
    12-scoring.js      addScore() — the ONE writer — clear bonuses; the combo
                       (comboMult/Kill/Death, updateCombo, comboDrop)
    13-render-well.js  14-render-entities.js  15-render-hud.js
    16-audio-engine.js kit-audio 0.4.0: context, four buses, lookahead
                       scheduler, SFX player, five optional groups
    17-audio-tracks.js track tables (DATA, from music-lab)
    18-audio-director.js createDirector; its one board reader is dangerInputs()
                       (23), which writes no state (test-cs010-p5.js)
    19-sfx.js          AudioSys / MusicSys / Sfx; sfx(), the ONE seat call; the
                       Surger tone; musicStateFor()
    20-achievements.js createAchievements({ defs, load, save, now }) —
                       kit-achievements' draft; defs is C.ACHIEVEMENTS
  lib/kit-names, kit-storage, kit-profile — INLINED here (KIT_INLINE) under a
                       dash-rule banner, never a module banner; kit-leaderboard
                       is NOT inlined (module bridge)
    21-telemetry.js    TELEMETRY_FIELDS + the ring. Capture is a SESSION switch,
                       OFF at launch; sampled from update(), never draw()
    22-meta.js         THE ONE ROUTE TO STORAGE: Store, Profiles, Leaderboard,
                       Meta (eligible() — the ONE gate; the achievement facts,
                       the per-well window, both seats, the ONE sfx("unlock")
                       seat and achievements(), the screen's reader),
                       createScores, levelRecord(), startDepthOptions(); the
                       prompts' seen set (promptSeen() marks, savePrompts())
    22-onboarding.js   the first-run prompts (GDD 12): promptScan() (every
                       trigger; no draw, clock or `state` write), promptStep(),
                       drawPrompt(), the queue bag; attractDrive(), the
                       demo's struct. ⛔ Calls no storage
    23-main.js         loop, state machine, well lifecycle, respawn
```

A new or renamed module updates `MANIFEST`, this map, GDD §16 and `STATUS.md`.

---

## Design instruments (`tools/`)

Standalone HTML, **not shipped code**; drift in one can only produce a bad preview.

- **`tools/music-lab.html`** — ⛔ the porting source for every track table and the
  home of the per-layer solo audition. Its BLOCK A and B are `16-audio-engine.js`
  and `17-audio-tracks.js` verbatim (`test-cs009-p2.js`); its `LAB` copies of `C`
  are pinned (`test-cs010-p3.js`).
- **`tools/sfx-lab.html`** — ⛔ the porting source for every `C.SFX` recipe;
  ⛔ **the build ships the picked candidate, verbatim** (candidate A until Paul
  picks). Its BLOCK A, B and SFX are pinned (`test-cs009-p4.js`).
- **`tools/well-lab.html`** (wells, perspective), **`glow-lab.html`** (line
  weight, glow, readability), **`feel-lab.html`** (input feel; LAN via
  `npm run serve`).
- **`tools/reach-probe.js`** — Node; ⛔ the measurement behind
  `test-cs015-p3.js`'s `REACH`, which is replaced whole from its output.
- **`tools/perf-probe.js`** — Node + headless Chromium over `file://`; ⛔ GDD
  §17's bytes and frame cost, as data never a gate; no Chromium exits nonzero.

`RATIONALE.md#tools`.

---

## Model guidance

Per phase, in `IMPLEMENTATION-PHASES-CS0##.md`. `ultrathink` must appear in the
message text itself — a per-turn lever, not a session setting.

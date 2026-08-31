# CLAUDE.md — Vector Vortex

Auto-loaded every session. Read this, then `STATUS.md`, then your phase prompt.
Nothing else unless the prompt names it.

**This file states rules, not reasons.** Reasons live in `RATIONALE.md`, keyed by
`#anchor`. Do not read `RATIONALE.md` by default — pull one section when a rule's
scope is genuinely ambiguous.

**Two markers, and they mean different things:**

- **⛔ INVARIANT** — violating this breaks the build, player save data, or a
  shipped guarantee. Never violate. Never "clean up."
- **⚠ SETTLED** — this looks wrong and is not. It was decided deliberately. **Do
  not fix it. Do not re-litigate it.** If you believe it is actually wrong, stop
  and say so to Paul; do not change it in the session you noticed it.

---

## What this is

A standalone browser tube shooter — an original-IP homage to Atari's *Tempest*
(1981), with a switchable Overdrive mode in the spirit of *Tempest 2000*. Canvas
2D + vanilla JS + Web Audio, zero runtime dependencies. Solo developer (Paul);
you are the implementer only.

**The canonical name is `Vector Vortex`.** Repo: `github.com/freakingid/vector-vortex`.

---

## ⛔ Vocabulary — legal, not stylistic

Atari owns the *Tempest* trade dress and terminology, and has enforced it — it
blocked Jeff Minter, co-creator of *Tempest 2000*, from shipping *TxK* ports.
The mechanic is not protectable; the words and the look are the exposure.

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

⛔ **These are the ONLY terms used — in prose, docs, player-facing strings, and
code identifiers.** Never write Flipper, Fuseball, Pulsar, Tanker, Spiker,
Superzapper, Blaster, or Web anywhere in this repo, including a comment or a
local variable. A variable named `flipper` is a legal exposure, not a style
problem. Never use "Tempest" or a `T-####` naming pattern in any file.

---

## Session rules

1. **Read `STATUS.md` first.** Update it at the end of the session.
2. **One phase per session.** Build only what the phase prompt scopes. Do not
   build ahead. If a later phase would be easier because of a small choice now,
   note it — don't take it.
3. **Implementation only.** You execute an already-reviewed plan. If a genuine
   design decision surfaces that `PLANNED-FEATURES-CS0##.md` doesn't cover,
   **stop and surface it.** Do not invent design; do not quietly pick a reading.
4. **Commit per phase, on `main`.** Code and doc updates in the same commit.
   **Never push** — pushing is Paul's.
5. **Edit docs in place.** "Update the GDD" means edit the file on disk, as part
   of the commit. Never print a doc for copy-paste.
6. **Prefer `str_replace` over full-file rewrites.** Re-read the region first.
7. **Don't refactor unprompted.** Propose it; don't do it.
8. **Phases flag their own risks.** Hit a hazard the prompt didn't name, record
   it in `STATUS.md` so the next prompt can account for it.

---

## Document map

| File | What it is | Read it? |
|---|---|---|
| `CLAUDE.md` | This. Rules + invariants + code map. | Always |
| `STATUS.md` | Build reality, current changeset only. | Always |
| `PLANNED-FEATURES-CS0##.md` | Spec for what's being built now. | When in-flight |
| `IMPLEMENTATION-PHASES-CS0##.md` | Build order + phase prompts. | When in-flight |
| `VECTOR-VORTEX-GDD.md` | Design intent + shipped behaviour. | §0 + §1 always; then the sections your phase names |
| `DIFFICULTY-NOTES.md` | The heat curve, documented. | Touching difficulty |
| `EXTERNAL-FILES.md` | Runtime files the shipped game loads. | Adding one |
| `RATIONALE.md` | Why the rules here exist. | On demand only |
| `DECISIONS.md` | Judgment calls made outside the phase flow. | On demand only |
| `ROADMAP.md` | Changeset sequence to ship. | On demand only |
| `PLAYTEST.md` | Open questions only the eye can answer. | **Never by default** |
| `log/CS0##.md` | Per-changeset narrative log + version history. | **Never by default** |
| `archive/` | Spent planning docs. | **Never by default** |

⛔ **The GDD is read by named subsection, not in bulk.** Read **§0 + §1 always**
— §0 is an index whose third column says *what you might be editing* — then the
sections your phase names. If §0 has no row for what you are editing, that is a
defect in §0: record it in `STATUS.md` rather than working around it silently.

⛔ **`log/` and `archive/` are not session context.** Pull one file in only when
a question genuinely needs project history, and say that you did.

⛔ **Version history is per-changeset, in `log/`.** There is no central
changelog. A closing phase appends its entry to `log/CS0##.md`.

---

## STATUS.md format

⛔ **Current changeset only, under ~400 lines.** The closing phase moves the
whole thing to `log/CS0##.md` and resets it.

⛔ **A phase entry is one line in the ledger, ~200 words maximum in the body.**
Reasoning goes in `log/CS0##.md`.

⛔ **Every entry starts on its own paragraph (`\n\n`).** If you append with a
shell redirect, verify the entry actually begins a new paragraph — a missing
trailing newline fuses entries into one unreadable line.

⛔ **Playtest asks live in `PLAYTEST.md`, not here.** A question only a player
at a screen can answer is a tax on every build session that loads it.

---

## This file's own ceiling

⛔ **`CLAUDE.md` stays under 50 KB.** It auto-loads every session with no
opt-out, so every byte is a tax on every phase. Past the ceiling, a section over
~4 KB moves its **reasoning** to `RATIONALE.md` under an `#anchor` and keeps its
**rule** here, naming that anchor. Nothing is deleted; it relocates to a
document already on an on-demand contract.

⚠ The valve fires when an over-size section is next edited, never as a standing
cleanup sweep.

---

## Build rules

### Shape

⛔ **Source is multi-file in `src/`; the shipped artifact is one HTML file.**
`node build.js` concatenates `src/` in `MANIFEST` order into
`dist/vector-vortex.html`.

⛔ **The concatenated single-file build is the BEHAVIOUR ORACLE.** Tests load
`dist/`, never `src/`. A refactor of `src/` that changes built behaviour is a
bug in the refactor.

⛔ **`build.js`'s `MANIFEST` is checked both ways against `src/`** — a file on
disk but unlisted fails the build, and so does a file listed but absent. Adding
a module means editing `MANIFEST`.

⛔ **The built file must open and play from `file://` by double-click.**

⛔ **External runtime files are optional enhancements, never required.** Load as
classic `<script src>` — never `fetch()` or `import`, both fail on `file://`.
**One exception:** a third-party ES module this repo doesn't author may ship as
`<script type="module">` whose only job is handing exports to a `window.*`
global; it carries no game logic and fails on `file://` by design. Wrap every
load so failure is caught — **absence is the normal fallback path.** No
leaderboard module means the game plays with no leaderboard. **Log every one in
`EXTERNAL-FILES.md` before it ships.**

⛔ **Outbound links go through `openExternal(url)`** — always
`window.open(url, "_blank", "noopener")`. Without `noopener` the opened page
gets a live handle back into the game.

### Config

⛔ **Every tunable lives in `C`, in `src/00-config.js`, grouped by system.**
Never inline a magic number anywhere else. This outranks code elegance and is
the highest architectural priority in the project.

⛔ **One clock: `game.level`.** All difficulty scaling derives from it. No
parallel clocks. See `DIFFICULTY-NOTES.md`.

### Math and lifecycle

⛔ **Every entity position is `(lane, depth)`, never a screen coordinate.**
Screen position is derived at render time only. Collision is a 1-D overlap on
`depth` plus a lane match. Writing 2-D geometry into entity logic is the single
most common source of subtle bugs here.

⛔ **Open wells are not closed wells with a clamp.** The `closed` flag is a
tactical system: the Skimmer clamps at the ends, **and enemy lane-hopping must
reverse at the wall rather than wrap.** Clamping the player but leaving enemy AI
wrapping produces enemies that teleport across the well.

⛔ **A lane BOUNDARY is the half-integer between two lane centres, and the
boundary lattice is a second set of legal positions.** `laneHop`'s fold bounds
are a **parameter**, defaulting to the lane-centre range `0 … lanes-1`; a
boundary rider passes `laneBoundaryLo(well)` / `laneBoundaryHi(well)` instead.
⛔ **An open well's two outermost boundaries are not addressable** — `polyAt`
clamps them onto the lane centres `0` and `lanes-1`, so an entity there is a
second silhouette on top of a first. A rider is born at a lane centre and
crosses onto the lattice through `boundaryFrom()`, which does **not** go through
`laneHop`. See `RATIONALE.md#boundary-lattice`.

⛔ **Nothing in the draw path may call `state.rng()`.** A random value the
renderer needs is drawn in the simulation, stored on `state`, and read by
`draw()`. `draw()` runs on a frame clock and `update()` does not — a draw there
makes the run's stream a function of frame rate, and the symptom reads as a
physics bug. See `RATIONALE.md#draw-path-rng`.

⛔ **Entity lifecycle: class with `constructor` / `update(dt)` / `draw()` /
`dead`.** Kill by setting `dead = true`; remove with an end-of-frame `.filter()`.
Never splice mid-loop.

⛔ **New enemies wire into seven places:** `startGame` reset, `update()` entity
pass, `update()` collision pass, `update()` cleanup filter, `draw()` z-order,
the well-clear condition, and **the Dive**. **Decide explicitly whether the
Purge destroys it**, and — seventh point, GDD §6.5 — an entity that is
`blocksClear: false` and **not** `anchored` must decide explicitly whether it
survives a dive. `startDive()` filters the board down to `anchored` survivors,
so today the answer for the one entity in that position is *no*.

⛔ **`anchored` says what `depth` MEANS on an entity, not whether it moves.**
`false` is a position; `true` is a length — the tip of an extent rooted at the
throat, which is the Thorn and nothing else. A stationary enemy whose `depth` is
still a position is `false`. Its one reader is `respawnSkimmer()`, which skips
anchored entities: clamping a length is not GDD §4.4's push but a free chip.
⚠ That is **not** a narrowing of §4.4's SETTLED band. See
`RATIONALE.md#thorn-depth`.

⚠ **SETTLED — the Purge kills Carriers WITHOUT splitting them, and it does that
by omission.** `updatePurge()` sets `dead` directly and never calls `onShot()`;
splitting lives in `Carrier.onShot`. Do not route the Purge through `onShot`
"for consistency" — a panic button that doubles the enemy count is not a panic
button. An omission is exactly what a later session unifies away.

### Rendering

⛔ **Render through `drawPoly` + `glowStroke`.** New entities define local-space
point arrays and reuse these. No per-entity draw pipelines, no fills, no
sprites, no textures.

⛔ **The HUD uses `glowStroke`** — no `fillRect`, no `strokeRect`.

⛔ **Nothing opaque is drawn below `C.READABILITY_DEPTH` (0.25).** Explosions,
particles and score popups are clipped or faded in the throat zone. This is what
*Tempest 4000* was criticised for violating, and it is the difference between a
game that feels tense and one that feels unfair.

⛔ **Game math never reads window size.** Fixed 1280×720 internal resolution,
letterboxed by CSS.

### Scoring

⛔ **All scoring routes through `addScore()`** — it also owns extra-life
milestones. Do not add a bypass without recording it here.

### Audio

⛔ **`MusicSys` lives alongside `AudioSys`, never inside it.** `AudioSys` is a
flat bag of one-shot voices and must not grow a sequencer.

⛔ **Per-frame lookahead scheduling. Never `setTimeout` or `setInterval` for
notes.** Each frame, schedule anything starting within `C.MUSIC_LOOKAHEAD` using
absolute `AudioContext.currentTime`.

⛔ **Tracks are DATA.** New tracks are new table entries built by their own
`buildXTrack()`. **Do not modify the scheduler or the layer gain gating.**
`playNote()`'s voice branch is the one extension point.

⛔ **Compose in `tools/music-lab.html` and port verbatim.** Never hand-tune a
gain in the build; the lab is the source of truth for note data.

⛔ **`scheduleStep` never consults intensity.** Every layer is always scheduled;
gating is entirely a downstream gain node. That is what makes note timing
provably fixed regardless of what the director does.

⛔ **The melody lives in the always-on foundation tier and is never gated.**
Orbital Overhaul gated its lead at tier 4 and no track had an audible tune
before wave 11. See `RATIONALE.md#music-layers`.

⛔ **Every gated layer must pass the solo test: recognizable played alone, with
the rest of the track muted.** A layer that only makes sense inside the stack is
texture, and texture is what produced the mud last time. `music-lab` has a
per-layer solo button. A layer that fails the audition does not ship.

⛔ **A layer's `tier` must be in `1..4`.** `C.LAYER_THRESHOLD` has no key for 5+,
and `f >= undefined` is always false — a tier-5 layer would be permanently
silent.

⛔ **Every audio entry point is `if (!AudioSys.ctx) return;`-guarded**, so
nothing starts before the first user gesture and the headless suite is safe.

⚠ **SETTLED — the Surger charge tone is a gameplay cue, not decoration.** It
must stay audible over music at every intensity tier. It is the one sound whose
absence costs a life.

### Save data

⛔ **`kit-storage` owns the keyspace.** The game never chooses a raw
`localStorage` key name and never enumerates storage — no `key(i)`, no `.length`,
no `Object.keys` over storage, anywhere in the build. All keys are
`coinless.<gameId>.<key>`, declared up front; `get`/`set` on an undeclared key
throws.

| Declared key | Scope |
|---|---|
| `settings` | Per-profile |
| `achievements` | Per-profile |
| `scores` | Root, shared across profiles |
| `telemetry` | Per-profile, lazy |

⛔ **A row-shape change bumps that key's declared version and supplies a
`migrate`, never a new key name.** Renaming a key silently wipes player data.

⛔ **New state is additive, under known-value-else-default loading.** Removing a
field needs no migration — a saved value for a deleted field orphans harmlessly.

⛔ **Vector Vortex has no legacy stores.** `kit-profile` is wired with empty
`legacyRosterKey`/`legacyProbeKeys` so its `afd_*` import path never runs.

⛔ **Achievement `id` values are save data and are never renamed**, however
dated the spelling looks. Renaming one drops that unlock for every player.

⛔ **`Profiles.keyFor(base)` is the one route from a store's base name to the key
it reads.** `localStorage` is never enumerated — no `key(i)`, no `.length`, no
`Object.keys` over storage, anywhere in the build.

⛔ **`Profiles.activate(id)` resets the runtime to shipped defaults BEFORE
loading the incoming profile.** The load path is written for a cold boot; loading
alone bleeds the outgoing profile's settings onto the incoming one.

⛔ **`playerId` is minted once, on first activation, never at creation, never
regenerated.** Mint via `crypto.randomUUID` with a `crypto.getRandomValues`
fallback: an opaque origin (sandboxed embed) is never a secure context, and
`randomUUID` is secure-context-only.

### Leaderboard

⛔ **One `Leaderboard` object is the only call surface for
`window.KitLeaderboard`.** Every entry point is safe to call with the module
absent.

⛔ **`Leaderboard.eligible()` gates every `submit()`**, and it is the same gate
the local top-10 check uses. Extend both together or neither.

⚠ **SETTLED — `'completed'` has no call site.** Escalating levels forever, no win
condition. Only `'died'` and `'quit'` are ever submitted. Do not invent a
trigger to fill the enum.

⛔ **Read the Worker's registered `statsFields` from
`github.com/freakingid/coinless-kit`'s `services/leaderboard/src/registry.js`
before sending a stats key.** An unregistered key flags every row it posts.

---

## Kit modules and extraction

This game both **consumes** Coinless Kit modules and **produces** new ones. Both
directions obey the same boundary.

### ⛔ The boundary contract

**A kit module never reaches into game state.** No `state`, no `C`, no game
object, no game global — in either direction. Everything crosses the boundary as
an explicit parameter or a callback the game supplies:

```js
// right
const board = KitLeaderboard.create({ getPlayer: () => profiles.player() });
// wrong — the module now knows what a Skimmer is
const board = KitLeaderboard.create({ game: state });
```

This mirrors the kit's own hard constraint in reverse ("no game code lives
here, ever"). A module that violates it is not extractable, and extraction is
the whole point.

### Vendored modules — editing a copy in `lib/`

Kit modules are vendored into `lib/` at a pinned version and used directly.

⛔ **Fix a kit module HERE, in `lib/`, not in the coinless-kit repo.** That is
deliberate — the change gets exercised by a real game before it lands in the
shared repo.

⛔ **The edit must stay game-agnostic.** If a change can only work for Vector
Vortex, it does not belong in a kit module; put it in the game's own wrapper.

⛔ **Bump the module's `VERSION` string** per the kit's semver rule: PATCH for a
fix with no contract change, MINOR for additive, MAJOR for breaking.

⛔ **Backporting to coinless-kit is a separate, manual step**, done later,
verified against that repo's own suite. Editing a file here never implies it.

### ⛔ Every `lib/` module carries a sibling `.NOTES.md`

`lib/kit-leaderboard.js` → `lib/kit-leaderboard.NOTES.md`. This is the backport
packet: a reviewer merging into coinless-kit reads one file, not this game's
whole decision history.

Each entry records: version bumped, what changed, why, confirmation it is
game-agnostic, and backport status (`not yet` / `backported YYYY-MM-DD` /
`rejected — reason`). `DECISIONS.md` gets a one-line pointer, never the writeup.

### Modules built here, destined for the kit

Several systems in `src/` do not exist in the kit yet and are being built
**kit-shaped from v1** so extraction is a copy, not a rewrite:

| `src/` module | Future kit module |
|---|---|
| `04-input.js` | `kit-input` — four devices → one struct |
| `15-render-hud.js` (menu/screen-state portion) | `kit-menu` |
| `16-audio-engine.js` + `18-audio-director.js` | `kit-audio` — scheduler, buses, intensity |
| `14-render-entities.js` (glow/particle primitives) | `kit-fx` |
| `20-achievements.js` | `kit-achievements` |
| `22-meta.js` (local high scores portion) | `kit-scores` |

⛔ **These obey the boundary contract from their first commit** — explicit
params and callbacks, no game reach. They also carry a `.NOTES.md` from the
start, in `src/`, alongside the module; that file doubles as the module's draft
kit documentation, so pushing it to coinless-kit is copying the code and its
notes, not writing a doc from scratch.

⚠ **SETTLED — kit-shaping these costs real overhead per phase and is worth it.**
Paul's call, 2026-08-30. Do not "simplify" a module by letting it read game
state because the boundary felt inconvenient in one phase.

---

## Test rules

⛔ **New tests use `scratchpad/_harness.js`.** It owns building, loading
`dist/`, the env stubs, and the assertion counters. Do not hand-roll a sandbox.

⛔ **Drive the real code.** Never inline a copy of the logic under test.

⛔ **A test asserts only what its own phase owns** — never a global count or
inventory of something it did not build.

⛔ **When a later changeset REPLACES behaviour a closed phase's test asserts, it
rewrites those assertions IN PLACE to the replacement behaviour.** It does not
delete them, does not weaken them, and does not add coverage of its own there —
new coverage goes in the new changeset's own file. The closed phase still owns
the *claim*; only the mechanism moved. ⚠ A closed test's **fixtures** get the
same treatment: a fixture invalidated by the replacement is repaired to restore
the precondition the assertion was always about, never relaxed to let a broken
one pass.

⛔ **Global counts live in exactly one place: `scratchpad/test-registry.js`.**

⛔ **Seed before the first build.** `installSeed(n)` goes above everything — some
nondeterminism is spent at module-evaluation time, so a seed installed after the
script is evaluated fixes nothing.

⛔ **Run `node scratchpad/run-all.js` before committing.** Nonzero exit = not
done. A phase may not leave the suite redder than it found it.

⛔ **Frame-budget gates are counter-based, never wall-clock.**

⛔ **Skip loudly.** A skip is a visible non-answer, never a vacuous pass. A
closing phase asserts zero skips.

**Test comment budget: ~15 lines of header.** What's under test, and any trap
not obvious from the code.

---

## Code map

Read-order skeleton. GDD §16 is authoritative for what actually exists.

```
src/00-config.js       C — every tunable, nothing else
    01-rng.js          mulberry32 — the run's ONE seeded stream
    02-state.js        the one mutable game object
    03-wells.js        the 16 well definitions (DATA) + the depth model
    04-input.js        four devices -> one input struct
    05-skimmer.js      movement, snap assist, the wall squash, the blink
    06-shots.js        firing, lane-locked travel
    07-enemies.js      the entity contract + the Vaulter
    08-spawner.js      spawnEnemy() — the ONE way in — cadence, quota, clear
    09-collision.js    the ONE 1-D pass, killSkimmer(), the Purge
    10-powerups.js     Overdrive tokens
    11-dive.js         the Dive: the beat, the Thorn strike, the loop guard
    12-scoring.js
    13-render-well.js  14-render-entities.js  15-render-hud.js
    16-audio-engine.js AudioSys + MusicSys: transport, voices, buses
    17-audio-tracks.js track tables (DATA, ported from music-lab)
    18-audio-director.js intensity -> tier + filter sweep
    19-sfx.js          20-achievements.js  21-telemetry.js
    22-meta.js         profiles, scores, leaderboard wiring
    23-main.js         loop, state machine, well lifecycle, respawn
```

When you add or rename a module, update `build.js`'s `MANIFEST`, this map, GDD
§16, and `STATUS.md`.

---

## Design instruments (`tools/`)

Standalone HTML, **not shipped code** — instruments for picking numbers or
composing data before porting the result in. Each duplicates whatever slice of
game logic it needs; drift here can only produce a bad *preview*, never a bad
*build*.

- **`tools/music-lab.html`** — ⛔ the porting source for every track table, and
  the home of the **per-layer solo button** that enforces the audition gate.
- **`tools/well-lab.html`** — the sixteen well polygons and the perspective
  curve.
- **`tools/glow-lab.html`** — line weight, glow falloff, and the readability
  contract measured against a busy frame.
- **`tools/feel-lab.html`** — measures, not demonstrates: traverse-and-stop
  time, overshoot, and settle time across a range of `MOUSE_SENS`,
  `KEY_TAP_MS`, `KEY_RAMP`, and `GAMEPAD_SENS`. Reachable over LAN via
  `npm run serve` (`tools/serve-lan.js`), for the on-hardware phone pass.

---

## Model guidance

Per-phase, in `IMPLEMENTATION-PHASES-CS0##.md`. `ultrathink` must appear inside
the message text itself — it is a per-turn lever, not a session setting.

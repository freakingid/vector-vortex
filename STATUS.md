# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS004 (not started) · Wells: 16/16 · Enemies: 1/6 Classic · Tracks: 0/5

## Phase ledger — CS004

- No phases yet. `PLANNED-FEATURES-CS004.md` and
  `IMPLEMENTATION-PHASES-CS004.md` have not been written.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js` passes: 14 test files, zero skips.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer. Full
  narrative in `log/CS001.md`.
- CS002 closed 2026-08-30 — the loop, the Skimmer, shots, and all four input
  devices (mouse/keyboard/touch/gamepad), verified on real hardware. Full
  narrative in `log/CS002.md`.
- CS003 closed 2026-08-30 — the seeded RNG, the entity contract, the Vaulter,
  the spawner and well lifecycle, the one collision pass, the Purge, death,
  lives, respawn and the game-over stop. Shipped constants, every judgment call
  and the mutation-check record are in `log/CS003.md`.
- ⛔ GDD §17 item 1 (determinism) and item 3 (enemy wall behaviour) are both
  covered by `scratchpad/test-cs003-p5.js`, driven through the real
  `startGame` / `nextWell` / `update`. **Item 3's finding is worth knowing
  before touching lane code:** a range check alone does not catch §3.5's bug —
  a wrapped hop on a 13-lane strip lands inside `[0, 12]`. The tell is the
  per-tick lane SPEED, and that is what the soak asserts.
- ⛔ CS004 reads GDD §6.5 before adding an enemy. It now spells out the six
  contract fields, the one enemy array, the one spawn entry point, the one
  well entry and the one collision pass.
- `tools/well-lab.html` — well polygons and the perspective curve.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- **`tools/glow-lab.html` does not exist.** `CLAUDE.md`'s design-instruments
  section lists it as the home of the line-weight and glow-falloff decisions
  measured against a busy frame. It is also the instrument the two ⚠ colour
  placeholders below are waiting on.
- **`SKIMMER_COLOR` (`#FFFFFF`) and `VAULTER_COLOR` (`#FF4A4A`) are ⚠
  placeholders**, recorded with a ⚠ in GDD §4.1, GDD §6.1 and in `C`. No enemy
  palette is specified anywhere in the GDD. CS004 adds five more enemies and
  will need five more colours — the palette decision should be made once,
  deliberately, rather than five times by inference.
- **`drawWell()`'s `laneState` parameter is still unwired.** Lane occupancy
  lighting (GDD §3.7 — lanes light when occupied, when a shot travels them, and
  when a Surger charges) belongs with the dim band, in CS005.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. That is onboarding tuning and is CS013's.
  ⚠ `ROADMAP.md`'s assumption #6 reads the same behaviour as a CS005 spawner
  tuning question; the two docs disagree about who owns it, and whoever gets
  there first should settle it rather than assume.
- **`_harness.js` exists twice** — the repo root holds a tracked, stale copy of
  `scratchpad/_harness.js` (older, exports only `C` and `state`). Nothing loads
  it today; a test that reaches one directory too far gets a silently smaller
  surface. Delete or de-duplicate.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way (contact tolerance is half a lane), and GDD §6.1 says only
  "direction from `laneDelta`". Flagged for CS005's tuning pass in case the
  jitter reads as indecision rather than menace.
- **GDD §3.3's `throatOffset` is undefined** — no well uses it and the GDD never
  says what it offsets. `wellThroat` defaults it to zero. Design call for Paul.
- **The Flat well (11) is geometrically degenerate**: its rim is a straight
  line, so it renders with zero depth. Same underlying question as
  `throatOffset` (an offset throat is what would fix it). Natural landing spot
  is CS004 (well progression, per `ROADMAP.md`).

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- ⚠ `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch in `Game.update()`
  that reads them are TEMPORARY and are CS005's to delete when the Dive lands.
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board and the craft that died on it. `r` restarts. CS006 owns the screen, the
  submission and the real restart flow, and the `restart` debug action should be
  folded into it rather than left as a second way in.
- `scratchpad/test-registry.js`'s `enemies` count is 1. CS004 raises it as the
  rest of the Classic roster lands; that count lives there and in no other file.

## Next up

- CS004 — the rest of the Classic roster: Carrier and its three variants,
  Weaver, Thorn, Drifter, Surger (GDD §6.1–6.3). Not yet specced;
  `PLANNED-FEATURES-CS004.md` comes first.
- ⛔ Before writing that spec: GDD §6.5's "Shipped, CS003" paragraph is the
  contract every one of the five inherits, and each of them decides
  `purgeable`, `blocksClear` and `killDepth` explicitly. The Thorn is the
  roster's first `false` on the first two and the first entity whose `onShot`
  chips rather than kills.

## Playtest asks (open only)

- Does the flattened X read as a *threat* at throat depth, and is
  `VAULTER_SIZE` 0.70 enough silhouette to see it coming?
- Does `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3 produce level-1 pressure
  that feels fair? Both halves are fully observable now — a death costs a life
  and freezes the board.
- Does the death sequence read? 1.2 s of hit-stop with no fragmentation and no
  sound is a long time to look at a frozen board — CS006 adds both, but the
  freeze LENGTH is settled now and worth judging bare.
- Is `RESPAWN_PUSH_DEPTH` 0.55 far enough? The clamp plus `RESPAWN_INVULN` 1.5 s
  is meant to guarantee a Vaulter cannot climb back into contact before the
  blink stops. It is provable at `VAULT_CLIMB` 0.18; it stops being provable the
  moment CS005's heat curve raises the climb rate.
- Is `HIT_DEPTH_TOL` 0.05 generous enough that a shot fired at a climbing
  Vaulter connects when it looks like it should? The band is ~3x the distance a
  shot covers in one step, so misses should read as aim, never as luck.

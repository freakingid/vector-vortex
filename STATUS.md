# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS003 not yet planned · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS003

- None yet. `PLANNED-FEATURES-CS003.md` / `IMPLEMENTATION-PHASES-CS003.md`
  don't exist — per `ROADMAP.md`, CS003 is the entity spine (class contract,
  spawner, collision, the Vaulter, well-clear, death and respawn, the Purge;
  GDD §4.3–4.5, §6.1, §6.3, §6.5), but writing that plan is not an
  implementation-phase job.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); manifest is
  checked both directions against `src/`.
- `node scratchpad/run-all.js` passes, 9 files, zero skips.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer. Full
  narrative in `log/CS001.md`.
- CS002 closed 2026-08-30 — the loop, the Skimmer, shots, and all four input
  devices (mouse/keyboard/touch/gamepad), verified on real hardware. Full
  narrative, shipped constants, and the on-hardware pass results in
  `log/CS002.md`.
- `tools/well-lab.html` — well polygons and the perspective curve.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four
  device sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- GDD §3.3's `throatOffset` is undefined — no well uses it and the GDD never
  says what it offsets. `wellThroat` defaults it to zero. Design call for
  Paul, not an inference to make silently.
- The Flat well (11) is geometrically degenerate: its rim is a straight line,
  so it renders with zero depth. Same underlying question as `throatOffset`
  above (an offset throat is what would fix it). Natural landing spot: CS004
  (well progression, per `ROADMAP.md`).
- `SKIMMER_COLOR` (`#FFFFFF`) is a placeholder, recorded with a ⚠ in GDD §4.1
  — not a final art decision.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — separate manual step, verified against that repo's own suite.
- CS006 (death sequence) should confirm the P1 judgment call that devices are
  still drained during hit-stop (`input.sample()` runs, `update()` doesn't).
- The Skimmer exposes `dead`; nothing sets it yet. Shots exist with no
  collision pass. Both are CS003's (entity spine + collision).

## Next up

- CS003 — the entity spine. See `ROADMAP.md`'s table for scope; planning docs
  (`PLANNED-FEATURES-CS003.md`, `IMPLEMENTATION-PHASES-CS003.md`) don't exist
  yet.

## Playtest asks (open only)

- None yet.

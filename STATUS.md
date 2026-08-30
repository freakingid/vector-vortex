# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS002 · Phase: not started · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS002

- None yet.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html`; manifest is checked both
  directions against `src/`.
- `node scratchpad/run-all.js` passes, failure-only output.
- Harness loads `dist/`, not `src/` — the oracle rule holds from commit one.
- CS001 closed 2026-08-30 — 16 wells (`src/03-wells.js`), the depth model
  (`screenPos`, perspective, wrap/clamp/hop lane helpers), and the well
  renderer (`src/13-render-well.js`, `drawPoly`/`glowStroke`, band colour, the
  dim band, depth-varying line weight) all shipped and tested. Full narrative
  in `log/CS001.md`.
- `tools/well-lab.html` exists for tuning `PERSPECTIVE_EXP`, `THROAT_SCALE`,
  and the glow constants against a real canvas before porting values into
  `src/00-config.js`.

## Known issues

- GDD §3.3 lists `throatOffset` in the well shape, but no well defines one and
  the GDD never says what it offsets. `wellThroat` accepts it and defaults it
  to zero (applied after the scale, shifting the whole throat), so the sixteen
  shipped wells are unaffected. ⛔ Its semantics are UNDEFINED, not decided —
  if a later phase wants an offset throat, that is a design call for Paul, not
  an inference from this implementation.
- `13-render-well.js`'s debug well-cycler ("W" key) is a self-contained
  bootstrap that owns a local well index and calls `drawWell` directly,
  because `02-state.js`/`23-main.js` don't exist yet. CS002 P1 (the loop and
  state) should either remove this block or fold it into the real loop's own
  debug key — it was never meant to coexist with a real game loop.

## Open questions (blocking)

- None.

## Carried tasks (not blocking CS002)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- ~~Vendor kit modules~~ — done. All four (`kit-names` 0.1.0, `kit-storage`
  0.1.0, `kit-profile` 0.1.1, `kit-leaderboard` 0.2.0) are in `lib/`, unmodified,
  each with a `.NOTES.md`.

## Next up

- CS002 P1 — the fixed-timestep loop (`src/23-main.js`), the one mutable game
  object (`src/02-state.js`), and mouse/keyboard input (`src/04-input.js`).
  See `IMPLEMENTATION-PHASES-CS002.md`.
- CS002 P1 should resolve the debug well-cycler note above as part of standing
  up the real loop.

## Playtest asks (open only)

- None yet.

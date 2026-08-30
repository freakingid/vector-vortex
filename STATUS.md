# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS001 · Phase: P0 · Wells: 0/16 · Tracks: 0/5

## Phase ledger — CS001

- P0 — Repo skeleton. `build.js` (manifest-checked concat), `src/shell.html`,
  `src/00-config.js` (C, grouped, populated from GDD defaults), 23 module
  placeholders, `scratchpad/` harness + runner + registry, smoke test. Build and
  suite green: 24 modules, 2 test files passing.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html`; manifest is checked both
  directions against `src/`.
- `node scratchpad/run-all.js` passes, failure-only output.
- Harness loads `dist/`, not `src/` — the oracle rule holds from commit one.

## Known issues

- None.

## Open questions (blocking)

- GDD §21 #3 — kit consumption vs local implementation. Blocks `22-meta.js`.
- GDD §21 #2 — Start Depth bonus treatment. Blocks the Worker registry entry.

## Next up

- CS001 P1 — well geometry: the 16 definitions + the depth model + `well-lab`.

## Playtest asks (open only)

- None yet.

# Vector Vortex

A browser tube shooter. Rotate the rim of a glowing geometric well, fire down
lanes, and decide what deserves your attention next.

Original IP. Canvas 2D + Web Audio + vanilla JavaScript, zero runtime
dependencies. Part of the [coinlessgames.com](https://coinlessgames.com) series.

## Build

```
node build.js          # -> dist/vector-vortex.html
node build.js --watch  # rebuild on src/ change
```

The built file opens and plays from `file://` by double-click.

## Test

```
node scratchpad/run-all.js              # whole suite, failure-only output
node scratchpad/run-all.js --only cs003 # one changeset
```

Tests load `dist/`, never `src/` — the concatenated build is the behaviour
oracle.

## Package for itch.io

```
./package-for-itch.sh
```

## Layout

```
src/          numbered modules, concatenated in build.js MANIFEST order
tools/        design instruments (music-lab, well-lab) — not shipped
scratchpad/   Node test harness and suite
lib/          vendored kit modules, each with a .NOTES.md backport packet
log/          per-changeset narrative logs
archive/      spent planning docs
dist/         generated — do not edit
```

Start with `CLAUDE.md`, then `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0.

## Licence

GPL-3.0

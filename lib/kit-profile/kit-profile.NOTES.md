# kit-profile — change notes

**Module:** `lib/kit-profile/kit-profile.js`
**Vendored from:** coinless-kit `main` @ VERSION `0.1.1` (untagged in kit)
**Current version:** `0.1.1` — unmodified
**Depends on:** `kit-storage` (instance injected, never created here), `kit-names`

## Contract summary

Local profile roster. `create`/`createAnonymous`/`rename`/`remove`/`select`/
`list`/`current`/`player`/`scope`. Fires `beforeChange` then `change` on a switch.

⛔ `playerId` is minted once on first activation, never at creation, never
regenerated. Minting falls back to `crypto.getRandomValues` when
`crypto.randomUUID` is absent — an opaque origin is never a secure context.

⛔ **Vector Vortex is a new game with no legacy stores.** It passes
`legacyRosterKey: null` and `legacyProbeKeys: []` so the `afd_*` import path
(Orbital Overhaul's) never runs here. ⛔ **`null`, never `''`**: `create()` reads
an empty string as "use the default" and imports `afd_profiles_v1`
(`test-cs011-p1.js` carries that mutation).

**Inlined at build (CS011 P1).** Vector Vortex's `build.js` wraps this file,
unedited, into a `KitProfile` namespace in the single HTML; only its `import`
and `export` lines are rewritten, one line for one. That is a consumer's build
step, not a module change, so there is no version bump.

⚠ **For a kit reviewer (measured, not a change):** on a first boot,
`createAnonymous()` makes `p0`, which is already the boot's `activeId`, so a
following `select(p0)` is the documented no-op and the roster's `lastUsed`
stays `''` until another select. The next boot still activates `roster[0]`.
The game calls `current()` to mint the `playerId` at first boot.

## Changes

*None. Vendored unmodified.*

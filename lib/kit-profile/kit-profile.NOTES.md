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

⛔ **Vector Vortex is a new game with no legacy stores.** Pass empty
`legacyRosterKey`/`legacyProbeKeys` so the `afd_*` import path (Orbital
Overhaul's) never runs here. Verify this at wire-up.

## Changes

*None. Vendored unmodified.*

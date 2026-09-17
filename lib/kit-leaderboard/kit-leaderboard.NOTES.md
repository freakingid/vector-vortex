# kit-leaderboard — change notes

**Module:** `lib/kit-leaderboard/kit-leaderboard.js`
**Vendored from:** coinless-kit `main` @ `f0b0eb2`, VERSION `0.2.0` (untagged in kit: the repo has only `v0.1.0`)
**Current version:** `0.2.1` — one PATCH, below
**Depends on:** `kit-names` (re-exports `validateName`, `NAME_CHANGE_NOTICE`)

## Contract summary

Client for the Worker at `scores.coinlessgames.com`. No DOM access, no game
reach. Exports `create`, `validateName`, `NAME_CHANGE_NOTICE`. Instance:
`beginRun`, `submit`, `fetchBoard`, `queueLength`, `flushQueue`. Handles the
offline queue and backoff itself; `submit()` never throws.

```js
const board = KitLeaderboard.create({
  endpoint: C.LEADERBOARD_ENDPOINT,     // ⛔ no default: an absent endpoint posts to "undefined/v1/..."
  gameId: C.GAME_ID, gameVersion: C.GAME_VERSION,
  getPlayer: () => profiles.player(),   // ⛔ a callback, never game state
});
```

⛔ `vector-vortex` must be registered in the Worker's `src/registry.js` before
any submission — an unregistered stats key flags every row it posts.

Stats keys for this game: `level_reached`, `mode`, `start_depth`,
`wells_cleared`, `purges_spent`, `max_combo`, `deaths`.

## Changes

### 2026-09-16 — `beginRun()` mints without `crypto.randomUUID` (`VERSION` 0.2.0 → 0.2.1)

**What changed.** `beginRun()` calls a new module-private `mintRunId()`:
`crypto.randomUUID()` when it is a function, else a UUID v4 built from
`crypto.getRandomValues` (version nibble 4, variant bits 10). The body is
kit-profile 0.1.1's `mintPlayerId`, line for line. Nothing else moved.

**Why.** `randomUUID` is secure-context-only, and an opaque origin (a sandboxed
embed) is never a secure context, so 0.2.0's `beginRun()` threw there and no run
could be submitted (Vector Vortex CS011 plan §1.4, R18). The Worker rejects a
`run_id` that is not v4, so the fallback must be v4 too.
`scratchpad/test-cs011-p5.js` loads this file in Node with `randomUUID` hidden,
asserts a v4 id and the posted body's shape, and turns red on 0.2.0's body.

**Game-agnostic?** Yes. It reads only the `crypto` global, names no game, and
changes no contract: `beginRun()` still returns a UUID v4 string.

**Backport status.** `not yet`

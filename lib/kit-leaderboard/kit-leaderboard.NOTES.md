# kit-leaderboard — change notes

**Module:** `lib/kit-leaderboard/kit-leaderboard.js`
**Vendored from:** coinless-kit tag `v0.2.0`
**Current version:** `0.2.0` — unmodified
**Depends on:** `kit-names` (re-exports `validateName`, `NAME_CHANGE_NOTICE`)

## Contract summary

Client for the Worker at `scores.coinlessgames.com`. No DOM access, no game
reach. Exports `create`, `validateName`, `NAME_CHANGE_NOTICE`. Instance:
`beginRun`, `submit`, `fetchBoard`, `queueLength`, `flushQueue`. Handles the
offline queue and backoff itself; `submit()` never throws.

```js
const board = KitLeaderboard.create({
  gameId: C.GAME_ID, gameVersion: C.GAME_VERSION,
  getPlayer: () => profiles.player(),   // ⛔ a callback, never game state
});
```

⛔ `vector-vortex` must be registered in the Worker's `src/registry.js` before
any submission — an unregistered stats key flags every row it posts.

Stats keys for this game: `level_reached`, `mode`, `start_depth`,
`wells_cleared`, `purges_spent`, `max_combo`, `deaths`.

## Changes

*None. Vendored unmodified.*

# EXTERNAL-FILES — Vector Vortex

Every runtime file the shipped game loads from outside `dist/vector-vortex.html`.
⛔ **Log a file here before it ships.**

## Rule 1 — optional enhancements, never required

Every external load is wrapped so failure is caught, and **absence is the normal
fallback path**. No leaderboard module means the game plays with no leaderboard,
silently, with no error surfaced to the player.

## Rule 2 — classic scripts, with one deliberate exception

External files load as classic `<script src>`. Never `fetch()`, never `import` —
both fail on `file://`, and the built game must play from a double-click.

**The exception:** a third-party shared ES module this repo doesn't author and
was told not to fork may ship as its own `<script type="module">` tag whose only
job is handing its exports to a `window.*` global. That tag carries no game
logic. It fails outright on `file://`, and that is by design — the classic
script, and so the game itself, is untouched either way.

---

## Inventory

| File | What | Load style | Absent behaviour |
|---|---|---|---|
| `lib/kit-leaderboard.js` | Coinless Kit online leaderboard client | `<script type="module">` bridge → `window.KitLeaderboard` | No online board; local scores unaffected |

**Pinning:** record the kit version this game is built against here whenever
`lib/kit-leaderboard.js` is updated. Games pin a version deliberately rather
than tracking the kit's `main`.

- Current: *(not yet vendored — see GDD §21 #3)*

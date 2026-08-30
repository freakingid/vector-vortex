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

Vendored from coinless-kit, mirroring its `modules/` layout so relative imports
between them stay byte-identical to upstream. Each carries a `.NOTES.md`
backport packet.

| File | Version | Load style | Absent behaviour |
|---|---|---|---|
| `lib/kit-names/kit-names.js` | 0.1.0 | imported by the others | — |
| `lib/kit-storage/kit-storage.js` | 0.1.0 | imported by kit-profile | No persistence; in-memory shim |
| `lib/kit-profile/kit-profile.js` | 0.1.1 | module bridge | Single anonymous session |
| `lib/kit-leaderboard/kit-leaderboard.js` | 0.2.0 | module bridge → `window.KitLeaderboard` | No online board; local scores unaffected |

⛔ **Vendored copies are pinned by the `VERSION` string inside each file**, not
by a git tag on this repo. Update the table whenever a copy is refreshed or
edited, and record the edit in that module's `.NOTES.md`.

⛔ The whole `lib/` tree fails on `file://` by design (rule 2) — the game plays
without it.

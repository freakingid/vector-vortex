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

### Runtime files

| File | Version | Load style | Absent behaviour |
|---|---|---|---|
| `lib/kit-leaderboard/kit-leaderboard.js` | 0.2.1 | module bridge → `window.KitLeaderboard` | No online board; local scores unaffected |
| `lib/kit-names/kit-names.js` | 0.1.0 | imported by kit-leaderboard, beside it | The bridge's import fails; as above |

### Inlined at build — not runtime files (CS011 P1, Paul's M1)

`build.js`'s `KIT_INLINE` wraps these into the single HTML, **unedited in `lib/`**,
so a double-clicked build saves (an `import` fails on `file://`). They are
listed here because they are vendored, not because the page loads them.

| File | Version | Namespace in the build |
|---|---|---|
| `lib/kit-names/kit-names.js` | 0.1.0 | `KitNames` (also shipped beside the page, above) |
| `lib/kit-storage/kit-storage.js` | 0.1.0 | `KitStorage`. Blocked storage falls back to its in-memory shim |
| `lib/kit-profile/kit-profile.js` | 0.1.1 | `KitProfile` |

⛔ **Vendored copies are pinned by the `VERSION` string inside each file**, not
by a git tag on this repo. Update the table whenever a copy is refreshed or
edited, and record the edit in that module's `.NOTES.md`.

⛔ The runtime `lib/` files fail on `file://` by design (rule 2) — the game plays
without them. The inlined three are inside the page and do not.

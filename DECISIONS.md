# DECISIONS — Vector Vortex

Judgment calls made **outside** the phase flow, where no plan doc covered the
question. In-phase reasoning belongs in `log/CS0##.md`; rules belong in
`CLAUDE.md`; the *why* behind a rule belongs in `RATIONALE.md`.

Newest last. One entry per date, with the question, the call, and what would
change it.

---

## 2026-08-30 — repo scaffolding

**Multi-file `src/` with a concat build, not Orbital Overhaul's single-script
invariant.** Paul's direction. The single-file artifact is retained as the
behaviour oracle, so the guarantee that made the old rule valuable survives.

**`build.js` checks its `MANIFEST` in both directions.** A file on disk but
unlisted, or listed but absent, fails the build. A directory sort would have
been shorter, but a numeric prefix that sorts correctly today sorts wrongly the
moment a file is renamed, and a silent reorder of the config block relative to
its readers is expensive to diagnose.

**The harness rebuilds when `src/` is newer than `dist/`.** The alternative —
requiring a manual build before every test run — produces green runs against
stale artifacts, which is worse than a slightly slower harness.

---

## 2026-08-30 — two GDD open questions resolved

**GDD §21 #2 — Start Depth bonus counts toward the submitted score, and
`start_depth` ships as a stats field.** The board can therefore offer a
"from level 1" filtered view later without a schema change. Rejected: excluding
the bonus (loses the arcade feel) and including it with no record (makes the
board a depth-farming contest with no way back).

**GDD §21 #3 — kit modules are vendored into `lib/` and used directly**, pinned
by the `VERSION` string in each file. Not reimplemented locally.

## 2026-08-30 — the kit boundary and the backport packet

**A kit module never reaches into game state, in either direction.** Explicit
params and callbacks only. Mirrors the kit's own "no game code lives here"
constraint. Full rules in `CLAUDE.md`, "Kit modules and extraction".

**Kit modules are fixed HERE, in `lib/`, then backported manually.** The change
gets exercised by a real game before it lands in the shared repo. Backporting is
never implied by an edit.

**Every kit module carries a sibling `.NOTES.md`** — the backport packet, so a
coinless-kit reviewer reads one file rather than this game's decision history.
Template at `lib/MODULE-NOTES-TEMPLATE.md`. This entry is the pointer;
per-module writeups live in those files, not here.

**Six systems are built kit-shaped from v1** — input, menu/screen-state, audio,
fx primitives, achievements, local scores. Paul's call. The per-phase overhead
is accepted deliberately; see `CLAUDE.md` for the table and the ⚠ note.

## 2026-08-30 — the last five GDD open questions

**GDD §21 #1 — the dim band stays exactly as specced.** Levels 65–80 render at
`DIM_BAND_ALPHA` 0.18, with lanes lighting on occupancy, shot travel and Surger
charge. It is content almost nobody will see at a ~35–40 ceiling, but the
renderer already tracks lane occupancy for everything else, so the band is a few
lines on top of work that is required anyway. ⛔ No tuning time is spent on it.
Revisit only if telemetry ever shows a player past level 65. Rejected: cutting
it, which saves nothing real; and moving it earlier, which would break the
16-level band structure in §3.6 for one effect.

**GDD §21 #4 — achievements are local-only.** The evaluator returns a
payload-shaped object from its first commit, so server-backing later is wiring
rather than a rewrite.

**GDD §21 #5 — telemetry is strictly local CSV export.** Nothing is posted
anywhere. It is a tuning and debugging instrument and explicitly not anti-cheat;
a destination adds a privacy surface and buys no tuning benefit.

**GDD §21 #6 — the Mimic gets built.** ~100 lines against a shot path that
already exists. The probation verdict in §14.6 needs a playtest, not an
argument. ⚠ It stays flagged: cut it in CS014 without ceremony if reflected
shots read as cheap.

**GDD §21 #7 — three tracks at launch:** `title`, `pulse`, `drive`. `deep` and
`rush` are new entries in a data table with no code change, so they are
post-ship content rather than a scope cut. ⚠ Dropping to two is the third lever
in the roadmap's cut order.

**A changeset roadmap now exists as `ROADMAP.md`**, its own file rather than a
section here — it is edited every time a changeset is renumbered, and this file
is append-only.

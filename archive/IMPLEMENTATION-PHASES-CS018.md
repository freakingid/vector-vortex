# IMPLEMENTATION-PHASES-CS018

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

⛔ **§0 STANDS AS RECOMMENDED UNLESS PAUL ANSWERS** (`CLAUDE.md` rule 3).
`PLANNED-FEATURES-CS018.md` §0 carries Q1–Q10, each with one recommendation
and an answer column. A prompt below that says "Q4's answer" means that column
— the recommendation while it reads "—". ⛔ **A phase re-opens none of it** and
names in its last message every call it took, so Paul can reverse one.

**Baseline:** CS017 closed at `43e07f2`; CS018 is planned on top of it
(MEASURED, plan header).
- `node build.js` → 26 modules + 3 inlined kit, **856,874 bytes**, sha256
  `702d98989a56b57c…`.
- `node scratchpad/run-all.js` → **85 files, zero skips, exit 0** (308.8 s).
- `P1_DETERMINISM_HASH` **1229033515**; `GOLDEN_LANES` the `9ebd27b` sixteen
  plus `2, 5`.
- `_harness.js`'s `EXPORTS` **218**; `build.js` exports **6**.
- OPTIONS **11** rows; `C.GAME_VERSION` **`"1.0.0"`**, pinned at
  `test-cs016-p1.js:121`.
- `CLAUDE.md` **38,741 bytes**; `../coinless-kit` present.
- ⚠ Paul's uncommitted `vector-vortex-human-notes.txt` and the untracked
  `dist/vector-vortex-itch.zip` are in the tree: ⛔ **stage by path, never
  `git add -A`**.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The ten gaps: `test-cs018-p1.js`, `build.js`'s `injectScript()`, §19's at-1.0.1 lines, §11.7, `CLAUDE.md`'s `glow-lab` line | Opus 5.5 | **high** |
| P2 | The VOICE row and its five repairs, `test-cs018-p2.js`, 1.0.1, the package, the review and the close | Opus 5.5 | **high** |

---

## ⛔ Why the seams fall here

Plan §2. **P1 moves no `dist/` byte and no closed file** — a red in it is a red
in the new file. **P2 is the only phase a player can see and the only one that
edits closed files** (V1: five, MEASURED), so a red there is about the row. The
close rides P2, as every changeset's since CS008 has.

### ⛔ Preconditions

| Before | What | Status |
|---|---|---|
| P1 | Q1, Q4–Q9 stand or are answered | ✅ standing as recommended unless Paul writes otherwise |
| P2 | Q2, Q3, Q10 stand or are answered; P1 committed; `../coinless-kit` present (⛔ a close cannot skip) | ✅ / MEASURED present 2026-09-23 |

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P2 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No** (V1, V2 MEASURED green) |
| P1–P2 | `GOLDEN_LANES` | ⛔ **No** |
| P1–P2 | the fifteen soaks | ⛔ **No** — unedited, green |
| P1–P2 | `state` 28 keys, `tally` 23, save-key versions, achievement ids | ⛔ **No** |
| P1 | `dist/vector-vortex.html` | ⛔ **No** — byte-identical across `injectScript()` (sha logged) |

### ⛔ Closed-file edits — in place (plan §8)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | every closed test | ⛔ **none** | PREDICTED |
| P2 | `test-cs008-p6.js` | the sound-row label list without VOICE | **MEASURED red** (V1) |
| P2 | `test-cs008-p7.js` | RESET TO DEFAULTS' stored shape without `voice` | **MEASURED red** (V1) |
| P2 | `test-cs011-p2.js` | `DEF` / `GOOD` without `voice`; VOICE's step out; two `sound.voice` rows rewritten | **MEASURED red** (V1, 45) |
| P2 | `test-cs012-p1.js` | `toTrack()`'s `right(8)` → `right(7)` | **MEASURED red** (V1, 6) |
| P2 | `test-cs009-p3.js` | `:194`'s step to MUSIC TRACK; the VOICE block rewritten to 1.0.1's behaviour; `:324` / `:338` re-read | **MEASURED** (throws at `:227`); past it PREDICTED |
| P2 | `test-cs016-p1.js:121` | the version literal → `"1.0.1"` | **MEASURED** (V2) |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed.**

---

## P1 — the ten gaps

**Model: Opus 5.5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS018.md` whole.
> Then `VECTOR-VORTEX-GDD.md` §0, §1, §11.7's `pulse` row, §12's first
> paragraph, §17 (items 7 and the head) and §19 whole. Then `build.js` whole;
> `scratchpad/_harness.js` (`buildGame`, `mutate`, `extractScript`,
> `fakeAudio`) and `run-all.js`'s head; and at their lines the closed tests
> each gap cites — `test-cs007-p2.js:245`–`:265`, `test-cs012-p1.js:55`–`:80`,
> `test-cs002-p4.js:130`–`:170`, `test-cs002-p3.js:150`–`:170`,
> `test-cs005-p2.js:610`–`:625`, `test-cs015-p1.js:40`–`:60` and `:310`–`:335`,
> `test-cs008-p6.js:415`–`:447`, `test-cs017-p4.js:1`–`:140` (the wall-clock
> front door) and `test-cs006-p2.js`'s child-process run of
> `test-cs005-p5.js`. Create `log/CS018.md`. ultrathink.
>
> ⛔ **§0: build Q1 and Q4–Q9 exactly as they stand** and re-open none.
>
> **1. `build.js` (Q6).** Add `injectScript(shell, script)` — the one
> `shell.replace(MARKER, () => script)` — and use it in `build()`; export it
> and `kitBlock`. ⛔ Record `dist/vector-vortex.html`'s sha256 before and after
> `node build.js`: they must be identical (a move is a finding). Log the
> string form's `$&` demonstration.
>
> **2. `scratchpad/test-cs018-p1.js`** — plan §3, G1–G10, one section each,
> header ≤ ~15 lines naming the traps (the wall clock, the demo's 20 s, the
> zone-data precondition, `dist/` read only after `buildGame()`, the list read
> from `test-cs008-p6.js`). ⛔ Seed above the first `buildGame()`. ⛔ Every
> `mutate` string asserted in the build exactly once before its red is
> asserted. ⛔ The file writes NO banned word, and no second copy of the
> list. ⛔ Never a re-assembly of `build()`: G5's claims are slice properties.
> ⛔ Time it alone (PREDICTED < 6 s) and put the number in the log.
>
> **3. Documents.** GDD §19: one "⛔ at 1.0.1 (CS018 P1)" line per moved clause,
> ◐ → ✅ with its `test-cs018-p1.js` line — the at-ship blocks stay as history.
> §11.7's `pulse` row per Q8. `CLAUDE.md`'s `tools/` line per Q9 (⛔ stays
> under 50 KB). `STATUS.md`: ledger line + ≤ 200 words; the carried gap list
> goes; §0.1's four findings marked fixed (`build.js`, the count, §11.7, the
> `glow-lab` line).
>
> ⛔ **Expect NO closed-file edit** (plan §8); anything else is a finding.
> ⛔ **Run `node scratchpad/run-all.js` before committing.** Stage by path.
> Commit "CS018 P1: the ten coverage gaps, each with a carrier". Your last
> message names every §0 call you took.

---

## P2 — the VOICE row, 1.0.1, the close

**Model: Opus 5.5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS018.md` §0 (Q2,
> Q3, Q10), §0.1, §0.2, §1.3, §1.4, §4–§12. Then `VECTOR-VORTEX-GDD.md` §0,
> §1, §10.5's Options and "Sound and music" paragraphs, §11.1's bus sentence
> and §19 whole. Then `src/23-main.js`'s `SOUND_ROWS`, the OPTIONS items,
> `VOL_BUSES` through `ADJUST`, `settingsSnapshot()` and `applySettings()`;
> `src/19-sfx.js`'s bus volumes; `src/22-meta.js`'s `saveSettings()`; and
> the five closed files of plan §8 whole — ⛔ `test-cs009-p3.js` past `:227`
> first, which V1 never ran. Then `log/CS018.md` whole — ⛔ this is the one
> session that reads `log/`, because the close reviews it. Append to
> `log/CS018.md`. ultrathink.
>
> ⛔ **§0: build Q2, Q3 and Q10 exactly as they stand.**
>
> **1. The cut (Q2-A)** — plan §4: V1's seven lines in `src/23-main.js`, and
> the A3 comment restated (the bus is kit-audio's, built at unity, fed and
> moved by nothing, with no row). ⛔ kit-audio, `19-sfx.js`'s bus volumes and
> both labs are NOT edited; ⛔ `settings` stays v1 with no `migrate`.
> ⚠ `SEAT_EDGE` matches by indentation luck — re-indent nothing in `update()`.
>
> **2. The five repairs**, in place, per plan §8. ⛔ `test-cs009-p3.js`'s VOICE
> block is REPLACED behaviour: rewrite each assertion to what 1.0.1 does, never
> delete one. ⛔ **Then grep every closed file that opens OPTIONS and steps
> `right(n)`** — a file can go vacuous without going red (`STATUS.md`).
>
> **3. `scratchpad/test-cs018-p2.js`** — plan §4: the ten rows by label and a
> traversal; a planted 1.0.0 `settings` row (with `voice: 2`) loads every other
> field and the next save stores no `voice` at `v: 1`; on a recording audio
> context nothing ever reaches the voice bus across a traversal, RESET TO
> DEFAULTS and `Game.reset()`, while MASTER still moves (non-vacuity); a
> mutant restoring `SOUND_ROWS.voice` to the items is red.
>
> **4. The version (Q3).** `C.GAME_VERSION` `"1.0.1"`, `package.json`, and
> `test-cs016-p1.js:121` rewritten in place with the cause. Run
> `bash package-for-itch.sh` and list the zip (⚠ it replaces the untracked
> 1.0.0 zip; it stays untracked).
>
> **5. Documents.** GDD §10.5 and §11.1 per plan §4; §19 Audio's "volume
> sliders persist" gets its at-1.0.1 line.
>
> **6. The review and the close.** Read every `log/CS018.md` entry together
> and compress; the close entry carries the version line. `STATUS.md` reset to
> the post-ship form (1.0.1; OPTIONS ten rows; 87 files; the VOICE row off the
> unowned list; carried tasks and the headroom question kept). `ROADMAP.md`'s
> CS018 row to shipped, with "What CS018 deliberately left". `DECISIONS.md`
> one index line per §0 call — a pointer, never the writeup. The two planning
> documents to `archive/`. ⛔ **Zero skips.** ⛔ **Run
> `node scratchpad/run-all.js` before committing.** Stage by path. Commit
> "CS018 P2: the VOICE row, 1.0.1, and the close". Your last message names
> every §0 call you took and says the 1.0.1 zip is Paul's to upload.

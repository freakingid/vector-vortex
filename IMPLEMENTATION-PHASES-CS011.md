# IMPLEMENTATION-PHASES-CS011

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

**Baseline:** CS010 closed; CS011 planned at `52ba439`. `node build.js` → 24
modules, 490.2 KB. `node scratchpad/run-all.js` → **54 files, zero skips**
(69.3 s).
- `test-registry.js`: `tracks: 2`, `enemies: 6`, `enemyKinds: 9`; `STATE_FIELDS`
  through CS008.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- kit-input (`src/04-input.js`) is **0.7.0**. The vendored kit in `lib/` is
  kit-names 0.1.0, kit-storage 0.1.0, kit-profile 0.1.1 and kit-leaderboard 0.2.0,
  all byte-identical to coinless-kit `f0b0eb2`.
- `src/20-achievements.js` and `src/22-meta.js` are a placeholder and CS008's
  session record.

✅ **Every design call is answered — Paul, 2026-09-16,
`PLANNED-FEATURES-CS011.md` §0 (M1–M9).** Twenty-two readings (R1–R22) are
flagged there. ⛔ If Paul objects to a reading, the phase that builds it stops.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The kit inlined at build, the store, the silent profile, the harness's storage options; the renumber and the rule rewording | Opus 5 | **high** |
| P2 | What a profile keeps: settings, the Start Depth record, telemetry rows; reset-before-load on a switch | Opus 5 | **high** |
| P3 | The local top 10 per mode, the run's three seats, the bench flag, SCORES, game over's line | Opus 5 | **high** |
| P4 | kit-input 0.8.0's text mode, PROFILE, a profile's page, DELETE, the NAME wheel | Opus 5 | **high** |
| P5 | kit-leaderboard 0.2.1, `Leaderboard`, the submits, SCORES' ONLINE view, the queued line | Opus 5 | **high** |
| P6 | The ninth soak (working vs blocked storage, one hash; a reload), the docs, the close | Opus 5 | **high** |

---

## ⛔ Why the seams fall here

**P1 changes what the build is, and saves nothing a player chose.** The inline is
a `build.js` change with a byte-for-byte proof. The boot writes one key, and that
turns exactly the two closed assertions §1.2 B measured red. The docs that describe
storage (`CLAUDE.md`'s Save data, GDD §15.1–15.2, `EXTERNAL-FILES.md`) are wrong
the moment the inline lands, so they land with it, along with the renumber, which
has to precede any phase that writes "CS015".

**P2 before P3, because a score row carries the profile's name** and a switch
must already reset and load. P2 has no screen. Its proofs are a reload and a
switch.

**P3 before P4 and P5, because the run's end is one seat for three consumers.**
The local table, telemetry's run-end write (a stub P2 leaves for P3 to fill) and
P5's submit all hang off `Meta.runEnded()`. Building the seats
with the local table, the consumer that needs no network, lets P3 prove the
last-step clear and the double-submit rule without a fake module.

**P4 is the only kit-input change and the only text input.** It is kept away
from P5 so a text-mode regression cannot be confused with a leaderboard one.

**P5 needs P3's seats and P4's names** (the rename notice and the ANONYMOUS
hint).

**P6 is the close.** A frame-by-frame hash of blocked against working storage
needs every writer in place.

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P6 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** A move is a defect (plan §9) |
| P1–P6 | `GOLDEN_LANES` | ⛔ **No** |
| P1–P6 | `STATE_FIELDS` | ⛔ **No** (R6) |
| P4 | kit-input `04-input.js` | 0.7.0 → 0.8.0 |
| P5 | kit-leaderboard `lib/` | 0.2.0 → 0.2.1 |

### ⛔ Closed-file edits — in place, MEASURED (plan §1.2, §1.8)

| Phase | File | What |
|---|---|---|
| P1 | `test-cs008-p6.js:375` | "never persisted: no storage write" → the telemetry toggles write nothing (the stored keys match before and after) |
| P1 | `test-cs008-p7.js:436` | "session-only: no storage write" → RESET TO DEFAULTS stores no `settings` key |
| P1 | `test-cs007-p3.js:382` | the message string's `CS016` → `CS017` (the renumber) |
| P2 | `test-cs008-p7.js:436` | → RESET TO DEFAULTS stores the defaults in the profile's `settings` |

---

## P1 — the kit inline, the store, the silent profile

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS011.md` §0, §1.1–1.3,
> §1.7, §1.8, §2, §3, §9 and §10. Then `VECTOR-VORTEX-GDD.md` §0, §1, §15.1,
> §15.2, §15.7, §16.2 and §16.4. Then `build.js`, `src/shell.html`,
> `src/22-meta.js`, the boot block at the foot of `src/23-main.js`,
> `scratchpad/_harness.js`, `EXTERNAL-FILES.md`, `package-for-itch.sh`, and all
> of `lib/`: the three modules you inline, `lib/kit-profile/kit-profile.NOTES.md`,
> `lib/docs/kit-storage-client-api.md` and `lib/docs/kit-profile-client-api.md`.
> Then `ROADMAP.md`. ultrathink.
>
> ⛔ **Answered (§0).**
> - Inline kit-names, kit-storage and kit-profile at build; kit-leaderboard stays
>   bridged (M1).
> - A silent anonymous profile on first boot, landing on the title (M2).
> - Achievements move to a new CS015, onboarding becomes CS016 and ship CS017 (M4).
> - `progress` is a new per-profile key (M8).
>
> **1. `build.js` — the inline (R2).**
> - Add `KIT_INLINE = ["lib/kit-names/kit-names.js",
>   "lib/kit-storage/kit-storage.js", "lib/kit-profile/kit-profile.js"]`,
>   inserted after `20-achievements.js` and before `21-telemetry.js`.
>   ⛔ **Never between `21-telemetry.js` and `22-meta.js`**: `test-cs007-p4.js:467`
>   slices up to `// 22-meta.js` and bans `localStorage` in the slice.
> - Each file becomes `const KitX = (function () { … return { …exports }; })();`
>   under a banner `// lib/<name>/<name>.js`. Rewrite only these forms:
>   - `export const|function NAME` becomes `const|function NAME` plus an entry in the return;
>   - `export { A, B } from '../kit-names/kit-names.js';` becomes an entry read off `KitNames`;
>   - `import { A, B } from '../kit-names/kit-names.js';` becomes
>     `const { A, B } = KitNames;`.
> - ⛔ **Any other `import` or `export` form fails the build** with the file and
>   the line.
> - A listed file that is missing fails the build.
> - ⛔ **`lib/` is not edited.**
>
> **2. `src/22-meta.js`.**
> - `Store = KitStorage.create({ gameId: C.GAME_ID, keys: { settings, progress,
>   telemetry, scores } })`, each `{ version: 1 }` (R5). ⛔ Do not declare
>   `achievements`.
> - `Profiles`, the game's wrapper over `KitProfile.create({ storage: Store,
>   maxProfiles: C.PROFILE_MAX, legacyRosterKey: null, legacyProbeKeys: [],
>   onEvent })`. ⛔ **`null`, never `''`** (R4: `''` imports `afd_profiles_v1`).
>   `Profiles.scope()` is the active profile's store (R3).
> - `Meta.boot()`: on `firstBoot`, `createAnonymous()` **and then `select()` its
>   id**. MEASURED: `createAnonymous()` alone leaves `lastUsed` empty and no
>   `playerId`.
> - The header comment's "nothing here touches storage yet" and its `keyFor`
>   mention are rewritten. `levelRecord()` stays the session record until P2.
>
> **3. `src/23-main.js`:** the boot block calls `Meta.boot()` before
> `Game.start()`. ⛔ It runs in the harness too (plan §1.7).
>
> **4. `C`, a Meta group:** `PROFILE_MAX` 8. The phases that read the rest add
> them.
>
> **5. `_harness.js`.**
> - `buildGame({ store })` evaluates over a caller's `Map`, so a second build is a
>   reload.
> - `buildGame({ storage: "blocked" })` makes the `localStorage` getter throw.
> - `_env.storageReads` counts reads of `length` and calls of `key(i)`.
> - `EXPORTS` gains `KitNames`, `KitStorage`, `KitProfile`, `Store`, `Profiles`
>   and `Meta`.
>
> **6. Closed files, in place** (plan §1.2 B; ⛔ nothing else).
> - `test-cs008-p6.js:375` → the telemetry toggles write nothing: the stored
>   key set and values match before and after.
> - `test-cs008-p7.js:436` → RESET TO DEFAULTS stores no `settings` key.
> - `test-cs007-p3.js:382` → the message string's `CS016` becomes `CS017`.
>
> **7. Your test, `scratchpad/test-cs011-p1.js`.**
> - ⛔ Each inlined body, read out of `dist/` between banners, equals its `lib/`
>   file with only the rewritten lines differing. **Mutation: the same comparison
>   against the `lib/` text with one character changed is red.**
> - `build.js`'s wrapper is requirable (it builds only when run as a script), and
>   fed a source with `export default` it throws, naming the line.
> - A first boot stores exactly `coinless.vector-vortex.profiles`: one profile,
>   ANONYMOUS, selected (`lastUsed` its id), `playerId` UUID v4. **Mutation:
>   `legacyRosterKey: ''` with a planted `afd_profiles_v1` roster imports it
>   (red).**
> - A second build over the same `Map` selects the same id and creates nothing.
> - `storage: "blocked"`: boots to the title, plays a run to game over, and
>   `Store.available` is false.
> - With `crypto.randomUUID` hidden, the minted id is still v4.
> - `_env.storageReads` is 0 across boot and a played run.
> - The built code outside the three inlined bodies names no `localStorage`,
>   `sessionStorage` or `indexedDB` (comments stripped with a character scanner,
>   never a regex; see `_harness.js`'s header).
>
> **8. ⛔ Traps.**
> - Never write the vocabulary scan's banned word, even in a comment.
> - Never start a comment line with `// 21-telemetry.js` or `// 22-meta.js`.
> - Never `.key` after an identifier ending in `e`.
> - The time-seed counters some tests install see one more `Date.now()` at boot.
>   MEASURED harmless (plan §1.2), but a new fixture that counts them must boot
>   first.
>
> **9. ⛔ No baseline moves.** Run `node scratchpad/test-cs006-p2.js` and confirm
> **1229033515**.
>
> **10. Docs.**
> - **`CLAUDE.md`:**
>   - *Build rules, Shape*: the vendored kit is inlined at build from `lib/`,
>     unedited, beside the one bridge exception.
>   - *Save data*: R3's `Profiles.scope()` rule replaces `keyFor`; the
>     enumeration rule reads "the game never enumerates storage: no call to a
>     store's `keys()`, `scopes()`, `clear()` or `usage()`, and no `key(i)`,
>     `.length` or `Object.keys` over storage in game code"; R4's `null`; the
>     declared-key table gains `progress` and marks `achievements` CS015.
>   - *Kit modules, Vendored*: an edit to an inlined module is still made in
>     `lib/`, and the build picks it up.
>   - *The code map*: the inline block.
> - **`EXTERNAL-FILES.md`** and **`package-for-itch.sh`** (R21).
> - **`lib/kit-profile/kit-profile.NOTES.md`:** `null`, and "inlined at build".
>   No version bump; the module is unchanged.
> - **GDD:** §15.1's table and legacy line; §15.2 (R3; kit-profile's `scope()`,
>   `p0` is the root store); §16.2's external-files paragraph; §16.4's tree
>   (`build.js` inlines `lib/`).
> - **The renumber (R1, plan §1.8):**
>   - `ROADMAP.md` gains a **CS015 Achievements** row (§15.5, §17 item 10),
>     CS015 becomes CS016 onboarding and CS016 becomes CS017 ship, and every
>     listed pointer moves;
>   - §21 #4's "Lands in" becomes CS015;
>   - GDD §17 item 10 and §19's Meta paragraph say achievements are CS015's.
>   - ⛔ `log/` and `archive/` are not swept.
> - **`DECISIONS.md`:** one entry, "CS011's meta calls (M1–M9), Paul,
>   2026-09-16". It points at the plan's §0 and names the three a future session
>   could mistake for oversights: kit-storage and kit-profile inlined rather than
>   bridged, achievements moved to CS015, and bench-touched runs ineligible.
> - **`git mv`** `PLANNED-FEATURES-CS010.md` and `IMPLEMENTATION-PHASES-CS010.md`
>   into `archive/` (R22).
> - **`STATUS.md`:** the ledger line; carried tasks gain Paul's registry raise
>   (M7) and Overdrive's board (plan §1.4, CS012).
> - **`log/CS011.md`:** created, with the phase's reasoning.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P2 — what a profile keeps

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS011.md` §0, R5, R10,
> R11, R17, §1.3, §1.6, §2, §4, §9 and §10. Then `VECTOR-VORTEX-GDD.md` §0, §1,
> §4.6, §10.5 (Controls, and Sound and music), §15.1, §15.2 and §15.6. Then
> `src/22-meta.js`, `src/21-telemetry.js`, the CONTROLS and sound sections of
> `src/23-main.js` (`controls`, `sound`, `ADJUST`, `resetControls()`,
> `resetSound()`, `onCaptured()`, `menuAction()`, `reset()`),
> `src/04-input.js`'s `configure`, `setting`, `setBindings` and
> `setGamepadButtons`, `scratchpad/test-cs008-p7.js` and
> `scratchpad/test-cs007-p4.js`. ultrathink.
>
> ⛔ **Answered (§0).** `progress` holds the Start Depth record (M8).
>
> **1. Settings (`settings` v1, R10).**
> - **Shape:** `{ controls: { mouse, touch, autofire, mirror, keys, pad },
>   sound: { master, music, sfx, voice, track } }`. `track` is the choice's name.
> - **Save on every change:** an `ADJUST.set` that moved a value, the two touch
>   toggles, a capture that bound, and RESET TO DEFAULTS.
> - **Load per field, known-value-else-default:**
>   - sensitivities: integers in `SENS_LO..SENS_HI`;
>   - volumes: integers in `0..C.AUDIO_VOL_STEPS`;
>   - `track`: a name in `C.MUSIC_TRACK_CHOICES`;
>   - `autofire` and `mirror`: booleans;
>   - a KEYBOARD or GAMEPAD page: loaded whole only if every action keeps a
>     binding, no key is reserved (`reservedKey`, Start on a pad) and nothing is
>     bound twice; else that page's defaults.
> - `23-main.js` gives `22-meta.js` three callbacks at boot: `resetSettings()`
>   (the shipped defaults, **writing nothing**), `applySettings(data)` and
>   `settingsSnapshot()`. ⛔ `Game.reset()` writes nothing.
> - ⛔ The telemetry capture switch is not a setting and is never stored.
>
> **2. Activation (R11).** kit-profile's `change` event runs `resetSettings()`,
> **then** loads the incoming profile's settings. Boot loads the selected
> profile's settings after `Meta.boot()`'s selection.
>
> **3. The Start Depth record.** `levelRecord()` reads and writes
> `Profiles.scope()`'s `progress` `{ highestCleared }`. Its writer (the clear edge)
> and its reader (`startDepthOptions()`) are untouched. A change of profile
> changes the list.
>
> **4. Telemetry (R17).**
> - `21-telemetry.js` gains `snapshot()` (`{ rows: arrays in TELEMETRY_FIELDS
>   order, wrapped }`) and `restore(data)` (empty on any row whose length is not
>   `TELEMETRY_FIELDS.length`). ⛔ It still names no storage (`test-cs007-p4.js`).
> - `22-meta.js` writes `telemetry` only while capture is on or rows exist: when
>   capture turns off, on `autoPause`, before a profile switch, and at a run end.
>   P3 builds the run-end seats; leave `Meta.runEnded` a documented stub that P3
>   fills.
> - ⛔ **Never on a timer, and never inside a play step.**
> - It reads when capture turns on with an empty ring, and when EXPORT finds the
>   ring empty.
> - The declared version is the envelope `v`. A comment at `TELEMETRY_FIELDS`
>   says to bump it with the column list.
>
> **5. Closed file, in place.** `test-cs008-p7.js:436` → RESET TO DEFAULTS stores
> the shipped defaults in the profile's `settings`. ⛔ Nothing else.
>
> **6. Your test, `scratchpad/test-cs011-p2.js`.**
> - Change every CONTROLS, KEYBOARD, GAMEPAD and sound row through the menus, and
>   clear a level to 14.
> - A second build over the same `Map` shows every row and a Start Depth list to 13.
> - Each field, planted invalid (out of range, wrong type, missing, a reserved
>   key, a duplicate), loads its default alone.
> - Two profiles keep separate settings and records: `p0`'s under
>   `coinless.vector-vortex.`, `p1`'s under `coinless.vector-vortex.p1.`.
> - ⛔ **Mutation: load without the reset first** bleeds `p0`'s MUSIC VOLUME onto
>   a `p1` that never set one (red).
> - `Game.reset()` changes no stored byte.
> - Capture on, then a reload: capture is off.
> - A ring round-trips through a reload. A stored `v` of 2, or a row one column
>   short, restores empty.
> - `Store.set` spied across a capture-on played run: no `telemetry` write from
>   inside `update()`.
> - `_env.storageReads` stays 0.
>
> **7. ⛔ Traps.** P1's list. A settings save inside an adjust step runs inside
> `update()`: it writes no `state`, and `test-cs009-p3.js`'s `audioFrame()` pins
> are untouched.
>
> **8. ⛔ No baseline moves.** Confirm **1229033515**.
>
> **9. Docs.**
> - GDD §4.6: "ever cleared by that profile", no longer a session record.
> - §10.5: its two "session-only until CS011" paragraphs become "saved per
>   profile".
> - §15.6: persistence, "shipped".
> - `21-telemetry.js`'s and `22-meta.js`'s "no persistence" comments.
> - `STATUS.md`: the ledger line, and its "session-only" hazards rewritten.
> - `log/CS011.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P3 — the local top 10 and the run's end

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS011.md` §0, R6–R9,
> R15, R16, R20, §1.2 D–E, §1.7, §2, §5, §9 and §10. Then `VECTOR-VORTEX-GDD.md`
> §0, §1, §4.4, §7, §10.5, §15.3, §15.4 and §15.7. Then `src/22-meta.js`,
> `startGame()`, `runAction()`, `quitToTitle()`, `frame()`, `draw()`'s game-over
> lines and `SCREENS` in `src/23-main.js`, `killSkimmer()` in
> `src/09-collision.js`, `clearBonuses()` in `src/12-scoring.js`,
> `lib/MODULE-NOTES-TEMPLATE.md`, and `scratchpad/test-cs008-p2.js`'s staged
> last-life clear. ultrathink.
>
> ⛔ **Answered (§0).**
> - Bench-touched runs are ineligible for both boards (M6).
> - `'died'` and `'quit'` are both recorded (M6).
> - SCORES is on the title, and game over names a placing (M5).
>
> **1. `createScores` (R20), kit-shaped.** ⛔ No `C`, no `state`, no game global.
> - `createScores({ store, key, perMode, modes })` returns `{ qualifies(mode,
>   score), add(mode, row) → rank | 0, list(mode) }`.
> - A row qualifies with `score > 0` and a place, and a tie goes below.
> - Write `src/22-meta.NOTES.md` from the template: the contract summary, and
>   "originated here, destined for kit-scores".
>
> **2. The lifecycle (R6, R7, R8).**
> - `Meta.runStarted()` at the end of `startGame()`. A run still open is dropped.
> - `Meta.benchUsed()` from `runAction()` when a `DEBUG_SPAWN_ACTIONS` digit,
>   `spawnRow` or `cycleWell` arrives while the screen is `"play"`.
> - `Meta.eligible()` is the one gate.
> - `Meta.runEnded(outcome)`:
>   - `'quit'` at the top of `quitToTitle()` when `state.screen === "pause"`,
>     read before the overwrite;
>   - `'died'` in `frame()`, **after the step loop and before `audioFrame()`**,
>     when the screen is `"gameover"` and the run is open.
>   - ⛔ **Not in `killSkimmer()`**: a clear on the step that spends the last life
>     pays after it (GDD §7), and a Dive death returns from `update()` early.
>   - It closes the run, records R9's row if eligible and placed, keeps the rank
>     for game over, and calls P2's telemetry run-end write.
> - ⛔ **Meta writes no `state`** (R6).
>
> **3. `C`, Meta group:** `SCORES_PER_MODE` 10.
>
> **4. Screens (R15, R16).**
> - The title gains SCORES after OPTIONS.
> - `SCREENS.scores`:
>   - title "SCORES", and one info line "CLASSIC · LOCAL";
>   - one enabled row per entry: `n NAME` as the label, the score in plain
>     digits as the detail;
>   - "NO SCORES YET" as a second line when empty;
>   - BACK, and back to the title.
> - Rows are rebuilt on entry, never in `draw()`.
> - Game over gains a third line: "NEW HIGH SCORE #n", or empty.
>
> **5. Your test, `scratchpad/test-cs011-p3.js`.**
> - ⛔ **A staged clear on the step that spends the last life:** the recorded row's
>   score includes the clear bonuses. **Mutation: `runEnded("died")` called from
>   `killSkimmer()` is red.**
> - A Dive death (a staged Thorn strike) records once.
> - Quit from pause: one `'quit'` row with the pre-quit score. Game over's QUIT
>   TO TITLE adds nothing. RESTART opens a new run.
> - A bench digit in play makes the run ineligible, with no row. **Mutation: the
>   flag ignored is red.** `t` and `e` leave the run eligible.
> - The table: order, the tie rule, `score > 0`, the cap of 10, per-mode
>   separation, and R9's fields with the profile's name at the time.
> - SCORES' rows equal `list("classic")`. The game-over line appears only for a
>   placed run.
> - `state` hashed before and after every `Meta` call: never moved.
> - `_env.storageReads` 0.
>
> **6. ⛔ Traps.** P1's list. Two live steps before a driver's first press from
> the title. Stop pressing at the stop. ⛔ Rows added to the title go **after**
> OPTIONS.
>
> **7. ⛔ No baseline moves.** Confirm **1229033515**.
>
> **8. Docs.** GDD §15.3 ("Shipped, CS011": the shape, the seats, the gate) and
> §10.5 (the title's rows, the SCORES row, game over's lines). `STATUS.md`,
> `log/CS011.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P4 — the profile screen and name entry

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS011.md` §0, R12–R14,
> R16, §1.3, §1.7, §2, §6, §9, §10 and §12 (K7). Then `VECTOR-VORTEX-GDD.md` §0,
> §1, §9.5, §10.2, §10.5 and §15.2. Then `src/04-input.js` and
> `src/04-input.NOTES.md` (the capture path, `ACTION_KEYS`' dispatch, `onGesture`),
> `src/22-meta.js`, `SCREENS`, `stepControlMode()`, `onCaptured()` and
> `menuAction()` in `src/23-main.js`, `drawMenu()` in `src/15-render-hud.js`,
> `lib/kit-names/kit-names.js`, `lib/docs/kit-profile-client-api.md`, and
> `scratchpad/test-cs002-p1.js`'s key scans and `scratchpad/test-cs008-p4.js`'s
> width arithmetic. ultrathink.
>
> ⛔ **Answered (§0).** A picker on every device plus typing, with kit-input
> 0.8.0 (M3). The PROFILE row on the title: switch, new, rename, delete (M2).
>
> **1. kit-input 0.8.0 (MINOR), `src/04-input.js` and its `.NOTES.md`.**
> `captureText(cb)` arms a text mode, and `captureText(null)` ends it.
> - **While it is armed**, a keydown whose normalised key is one character of
>   `[a-z0-9 _-]` calls `cb({ ch })`, Backspace calls `cb({ del: true })`, and
>   Enter calls `cb({ done: true })`.
> - **Those keys and Shift reach no binding, no struct field and no named
>   action.**
> - Arrows, Escape, the mouse, touch and pad buttons behave as on any menu.
> - ⛔ No `C.` and no `state.` in the module. ⛔ No key is read outside it
>   (`test-cs002-p1.js`).
>
> **2. Screens (R12, R13, R14, R16).**
> - **PROFILE**, the title's fourth row, with the active name as its detail:
>   - one row per profile, the active one with detail ACTIVE;
>   - NEW PROFILE, disabled at `C.PROFILE_MAX`;
>   - BACK.
> - **A profile's page:** SELECT, RENAME, DELETE, BACK.
> - **DELETE:** NO first, then YES.
> - **NAME**, used by NEW and RENAME. No rows.
>   - **Lines:** the name so far plus a cursor mark; `‹ X ›` for the wheel;
>     the reason; and on RENAME, `NAME_CHANGE_NOTICE` wrapped at
>     `C.NOTICE_WRAP` 60.
>   - **The wheel:** rotate steps it by whole `MENU_ROTATE_STEP` over
>     `C.NAME_WHEEL` (`A–Z`, `0–9`, space, `_`, `-`, then DEL and END marks).
>   - **Fire** appends, deletes on DEL, and commits on END.
>   - **Purge** deletes, or cancels when the name is empty. Escape cancels.
>   - **Text mode** is armed on entry and ended on leaving.
>   - **Commit** is kit-profile's `create` or `rename`, and its `reason` becomes
>     INVALID NAME, NAME TAKEN or ROSTER FULL.
> - **SELECT and a new profile** activate it (P2's reset-then-load).
> - **Delete (R12):** remove `settings`, `progress` and `telemetry` from that
>   profile's scope with `remove(key)`, then kit-profile's `remove(id)`.
>   - `last_profile` shows as a reason line.
>   - ⛔ **Never `clear()`.** ⛔ **`p0`'s scope is the root store**: never touch
>     `scores` or `profiles`.
>
> **3. `C`, Meta group:** `NAME_WHEEL`, `NOTICE_WRAP` 60.
>
> **4. Your test, `scratchpad/test-cs011-p4.js`.**
> - A name spelled by rotate and fire alone, on keys and on a pad; one typed.
> - ⛔ **Typing `adzxc 1wtep` on NAME** changes no struct field, spawns nothing,
>   cycles no well, toggles no telemetry and pauses nothing. **Mutation: the same
>   keys with text mode never armed do (red).**
> - INVALID NAME, NAME TAKEN and ROSTER FULL from the kit's reasons.
> - RENAME keeps `playerId`. SELECT runs P2's activation.
> - Deleting the active profile activates `roster[0]`. The last profile cannot
>   be deleted.
> - ⛔ **Deleting `p0` leaves `scores` and `profiles`**. **Mutation: `clear()` in
>   its place is red**, by the kept keys and by `_env.storageReads`.
> - Every drawn line of every new screen fits `C.WORLD_W` by `TEXT_CHAR_W`
>   arithmetic, the wrapped notice included.
> - The closed `test-cs008-p7.js` capture path still works: a capture and a
>   text mode never arm together.
>
> **5. ⛔ Traps.** P1's list. ⛔ `e.key` is banned outside `04-input.js`; so is a
> `.key` after any identifier ending in `e`. A screen change must go through
> `syncScreen()` (STATUS: a menu step's sound is read off its answer). If P4
> overruns, split the text mode and NAME (P4) from PROFILE, a profile's page
> and DELETE (P4b), with no renumber (plan K7).
>
> **6. ⛔ No baseline moves.** Confirm **1229033515**.
>
> **7. Docs.**
> - GDD §9.5 (the text mode).
> - GDD §10.5 (the four screens, the flow diagram and the table).
> - GDD §15.2 ("Shipped, CS011").
> - `STATUS.md` and `log/CS011.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P5 — the online leaderboard

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS011.md` §0, R9, R15,
> R16, R18, R19, §1.4, §1.5, §2, §7, §9 and §10. Then `VECTOR-VORTEX-GDD.md` §0,
> §1, §13, §15.4 and §16.2. Then `lib/kit-leaderboard/kit-leaderboard.js`, its
> `.NOTES.md`, `lib/docs/kit-leaderboard-client-api.md`,
> `lib/kit-profile/kit-profile.js`'s `mintPlayerId`, `src/shell.html`,
> `src/22-meta.js`, `SCREENS.scores` and the title in `src/23-main.js`, and
> `EXTERNAL-FILES.md`. The registry is
> `../coinless-kit/services/leaderboard/src/registry.js` at `f0b0eb2`; read it,
> never guess a stats key. ultrathink.
>
> ⛔ **Answered (§0).**
> - Every eligible run end submits, `'died'` and `'quit'` (M6).
> - An unnamed profile submits as ANONYMOUS, with a hint (M9).
> - SCORES has LOCAL / ONLINE when the module loaded, and the title shows the
>   queue (M5).
> - The rate bound is Paul's to raise, outside this repo (M7).
>
> **1. `lib/kit-leaderboard/kit-leaderboard.js` 0.2.1 (PATCH, R18).**
> - `beginRun()` uses `crypto.randomUUID` when present, else a
>   `getRandomValues` UUID v4, as kit-profile's `mintPlayerId` does.
> - `VERSION` "0.2.1".
> - `.NOTES.md`: the entry (game-agnostic, backport `not yet`), `endpoint` in the
>   wiring example, and the "tag v0.2.0" line corrected to `f0b0eb2` (that tag
>   does not exist).
> - `EXTERNAL-FILES.md`'s version.
>
> **2. `Leaderboard` in `src/22-meta.js` (R19).** It is the only reader of
> `window.KitLeaderboard`, and every method is a no-op without it.
> - `instance()`: lazy, `create({ endpoint: C.LEADERBOARD_ENDPOINT, gameId:
>   C.GAME_ID, gameVersion: C.GAME_VERSION, getPlayer: () => Profiles.player() })`.
> - `beginRun()` from `Meta.runStarted()`.
> - `submit(outcome)` from `Meta.runEnded()` when `Meta.eligible()`. The
>   payload is R9's:
>   - `metric` is the integer score, and `durationS` is `Math.round(state.time)`;
>   - `stats` holds exactly the seven registered keys, with `max_combo` from
>     `C.TELEMETRY_PLACEHOLDER.maxCombo`.
> - `queueLength()`.
> - `load()` for ONLINE: `fetchBoard({ window: "all", limit:
>   C.LEADERBOARD_BOARD_LIMIT })`, with a token so a late response is dropped.
>
> **3. `C`, Meta group:** `LEADERBOARD_ENDPOINT` "https://scores.coinlessgames.com",
> `LEADERBOARD_BOARD_LIMIT` 10.
>
> **4. Screens.**
> - **SCORES** gains a VIEW row, LOCAL / ONLINE, only when the module is present.
> - **ONLINE** has LOADING…, COULD NOT REACH THE BOARD and NO SCORES YET states.
>   Its rows are `rank NAME` / score, a flagged row ends in `*`, and the M9 hint
>   line shows while the active profile's name is ANONYMOUS.
> - **The title's info line** reads "n SCORE(S) QUEUED" while `queueLength() > 0`,
>   refreshed in `update()`, never in `draw()`.
>
> **5. Your test, `scratchpad/test-cs011-p5.js`.** A recording fake
> `KitLeaderboard` is set on `X._env.win`.
> - **With no module:** no call, no VIEW row, no queued line, and a run plays to
>   game over.
> - **Submits:**
>   - one `beginRun` per `startGame()`;
>   - ⛔ one `submit` per eligible run end and **never two** (game over's QUIT
>     TO TITLE, a RESTART);
>   - a bench run submits nothing;
>   - payload types: integers, `outcome` in `died` / `quit`, and `stats` keys
>     equal to the registry's seven, read from `registry.js`, never a copied list;
>   - an ANONYMOUS profile submits and shows the hint.
> - **ONLINE:** loading, reached, rejected and empty, with a stale response
>   ignored.
> - **The queued line** at 0 and at 3.
> - ⛔ **The real module:** `require` `lib/kit-leaderboard/kit-leaderboard.js`
>   (Node 24 loads ES modules), with `globalThis.window` a stub, `fetch` recording
>   and `crypto.randomUUID` hidden. `beginRun()` returns a v4, and the posted body
>   has the Worker's shape. **Mutation: 0.2.0's `beginRun` throws (red).**
>
> **6. ⛔ Traps.** P1's list. The fake's promises resolve on microtasks, so drain
> them before asserting a screen. The bridge stays in `src/shell.html`, and
> `_harness.js` never runs it (`type="module"`).
>
> **7. ⛔ No baseline moves.** Confirm **1229033515**.
>
> **8. Docs.**
> - GDD §15.4, "Shipped, CS011": the payload, the seats, M9 and 0.2.1.
> - GDD §13's Leaderboard row: Overdrive's board is CS012's (plan §1.4).
> - `STATUS.md`: the ledger line; the carried registry raise (M7, with plan
>   §1.5's numbers) and Overdrive's board for CS012.
> - `log/CS011.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P6 — the ninth soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS011.md` §0, §8, §9, §10
> and §11. Then `VECTOR-VORTEX-GDD.md` §0, §1, §15, §17 and §19. Then
> `scratchpad/test-cs009-p6.js` and `scratchpad/test-cs010-p5.js` (the driver
> shape and the traps), `scratchpad/test-registry.js`, `src/22-meta.js`, and
> `log/CS011.md`. ultrathink.
>
> **1. `scratchpad/test-cs011-p6.js` — the ninth soak.** ⛔ A new file; never
> widen `test-cs010-p5.js`. It uses the front-door driver.
> - **The script:**
>   - Start Depths 1, 13 and 23, with RESTART and QUIT TO TITLE;
>   - one run quit from pause;
>   - one run touched by a bench digit;
>   - OPTIONS to move MUSIC VOLUME and MOUSE SENSITIVITY;
>   - PROFILE to create "SOAK" and select it;
>   - a recording fake leaderboard present.
> - ⛔ **Played twice, once over a working store and once with `storage:
>   "blocked"`, and the whole-board hash matches on every frame.**
> - **Over the working session:**
>   - `_env.storageReads` 0;
>   - every stored key is declared (`profiles`, `scores`, and `settings`,
>     `progress`, `telemetry` at the root or under `p1.`), and no game code
>     writes `coinless.lb.*`;
>   - one local row per eligible run that placed;
>   - one submit per eligible run end, and none for the bench run;
>   - `state` hashed around every `Meta` call and never moved.
> - **A reload** (a second build over the working `Map`): SOAK selected, both
>   settings as set, the Start Depth list reaching the highest level the session
>   cleared, and the table intact.
> - **Obey the traps:** two live steps before the first press, stop pressing at
>   the stop, and restart through the menu.
>
> **2. The review:** read `log/CS011.md`'s phase entries together, and record
> anything two phases said differently.
>
> **3. Docs.**
> - **GDD:** §15.1–15.4 and §15.6's "Shipped, CS011" notes checked against the
>   build; §19's Meta verdicts (each met, half-met or CS015's, with its test);
>   §19 Audio's "volume sliders persist per profile" verdict.
> - **`CLAUDE.md`:** the code map (`22-meta.js`, the inline block).
> - **`ROADMAP.md`:** CS011's row, and a "what CS011 shipped / left" paragraph.
> - **`SKIPPED-PLAYTESTS.md`:** one entry for the storage and screen checks in
>   Firefox and Safari over `file://` and itch.io (plan K4), and one for the NAME
>   wheel's feel on a pad.
> - **`STATUS.md`** reset for CS012, `log/CS011.md` closed, and
>   `C.GAME_VERSION` 0.0.8.
>
> **4. ⛔** Zero skips. `P1_DETERMINISM_HASH` **1229033515** and `GOLDEN_LANES`
> unmoved.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

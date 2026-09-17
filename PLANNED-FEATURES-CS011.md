# PLANNED-FEATURES-CS011 — meta: profiles, persistence, local scores, the leaderboard

**The kit's storage and profile modules inlined into the build, one silent
profile on first launch, every setting and the Start Depth record saved per
profile, telemetry rows kept across a reload, a local top 10 per mode, the
online leaderboard wired through its bridge, a PROFILE screen with name entry,
and the ninth soak (GDD §4.6, §10.5, §15.1–15.4, §15.6). Achievements leave
CS011 for their own changeset.**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run. A PREDICTED one says so.

**Baseline for every measurement: commit `52ba439`.** `node build.js` → 24
modules, 490.2 KB. `node scratchpad/run-all.js` → **54 files passed, zero skips,
exit 0** (69.3 s wall). Orbital Overhaul is read at `ADD-Orbital-Overhaul`
**`5abd37a`**, coinless-kit at **`f0b0eb2`**.

**How the probes ran.** Everything lived in the session's temporary directory
and is gone.
- **The browser** is Chrome for Testing 153.0.8010.47 (`chrome-headless-shell`,
  run with `--dump-dom`; its three missing system libraries were extracted from
  Ubuntu packages without installing them). One page was loaded both from
  `file://` and from a local `http://127.0.0.1` server (§1.1). A second page
  measured the storage quota and write cost (§1.6).
- **The variants** (§1.2) were built in a detached worktree of `52ba439`. The
  whole suite was run on each.
- **The rate probe** (§1.5) drove `startGame(seed, { startDepth })` with
  `test-cs008-p8.js`'s `drive()` (fire held 9,000 steps, then passive) at Start
  Depths 1, 5, 9, 17, 33, 49 and 81, three seeds each, to game over.
- **The telemetry probe** (§1.6) filled a 4,096-row ring from Start Depth 23
  runs with fire held.
- The Worker was read with two GETs (`/v1/health`, `/v1/scores`), both on
  2026-09-16. **Nothing was posted.**
- ⛔ **Nothing in this repository's `src/`, `scratchpad/`, `tools/` or `lib/`
  was touched** (`CLAUDE.md` rule 3a).

**Read for this plan, beyond the session's defaults:** GDD §4.6, §7, §10.4–10.5,
§13, §15, §16, §17, §19–21; `ROADMAP.md`; `DECISIONS.md` (the entries on kit
consumption, planning in Claude Code and the no-playtests call);
`src/22-meta.js`, `src/21-telemetry.js`, `src/12-scoring.js`,
`src/15-render-hud.js` (the menu model), `src/23-main.js` (menus, settings,
`quitToTitle()`, `update()`, `frame()`, the boot block); `scratchpad/_harness.js`
and the closed assertions named in §1.2; all four `lib/` modules and their
`.NOTES.md`; `EXTERNAL-FILES.md`; `package-for-itch.sh`. Nothing from `log/`
or `archive/`. Orbital Overhaul's meta systems and
coinless-kit's registry, Worker and module docs were read by two research
passes, and their load-bearing facts were then checked directly (§1.3, §1.4).

---

## ⛔ 0. PAUL'S CALLS — ✅ ALL ANSWERED 2026-09-16, IN THIS SESSION

⛔ A build phase builds these and does not re-open them. P1 writes the
`DECISIONS.md` entry. Each call was put to Paul with its measurement and a
recommendation, and **he took every recommendation.**

| # | The call | ✅ Answer |
|---|---|---|
| M1 | How kit-storage, kit-profile and kit-names reach the game | **Inlined at build.** `build.js` wraps the vendored files, unchanged in `lib/`, into the single HTML. Saves work from `file://` (§1.1). ⛔ The no-enumeration rule is reworded: the game never calls a store's `keys()`, `scopes()`, `clear()` or `usage()`. **kit-leaderboard stays on the module bridge** (§1.2: two closed scans ban its code, and the Worker refuses a `file://` origin) |
| M2 | First launch and the profile surface | **Silent.** The first boot creates an anonymous profile (kit-profile's `createAnonymous()`, named ANONYMOUS) and lands on the title as today. **A PROFILE row on the title** opens the roster: switch, new, rename, delete, with name entry |
| M3 | Name entry input | **A letter picker driven by rotate and fire, on every device, plus typing on a keyboard.** kit-input **0.8.0** (MINOR) passes typed characters through |
| M4 | Achievements | **Their own changeset after CS014**, planned once Overdrive exists, so the id table (save data, never renamed) is written once against the whole game. **The new CS015 is achievements; onboarding becomes CS016 and ship CS017** (R1) |
| M5 | Where scores show | **A SCORES row on the title**: the mode's top 10, with a **LOCAL / ONLINE** switch that exists only when kit-leaderboard loaded. **Game over adds one line** when the run placed ("NEW HIGH SCORE #3"). **The title shows "N SCORES QUEUED"** when the offline queue is not empty |
| M6 | Which runs count | **A run in which any debug bench action fired is ineligible for both boards.** Every other run counts, Start Depth starts included. **`'died'` and `'quit'` runs are both recorded locally and both submitted online** |
| M7 | The Worker's rate bound flags deep Start Depth runs | **Paul raises the registry bound** in coinless-kit and redeploys, **to about 100,000 points per second** (§1.5). Outside this repo; CS011 asserts nothing about the deploy |
| M8 | Where the Start Depth record lives | **A new per-profile declared key, `progress`**, versioned like the others |
| M9 | An eligible run ending on an unnamed profile | **It submits as ANONYMOUS.** No prompt, no block. The ONLINE view shows one hint line: "NAME YOUR PROFILE TO POST UNDER YOUR NAME" |

### ⚠ Readings this plan takes and flags — none is a call Paul left open

Each follows from an answer, a shipped rule, a kit contract or a measurement. ⛔
**If Paul objects to one, the phase that builds it stops.**

- **R1 — The renumber.** "After CS014" is read as a new CS015 immediately
  after it: CS015 achievements, CS016 onboarding, CS017 ship. ROADMAP's cut order
  is unchanged. P1 sweeps the **thirteen live pointers** (§1.8). `log/` and
  `archive/` are not swept (ROADMAP's own rule).
- **R2 — The inline block sits after `20-achievements.js` and before
  `21-telemetry.js`**, one IIFE namespace per file: `KitNames`, `KitStorage`,
  `KitProfile`. ⛔ Never between `21-telemetry.js` and `22-meta.js`:
  `test-cs007-p4.js:467` slices the telemetry module up to the text
  `// 22-meta.js` and bans the word `localStorage` inside the slice, and
  kit-storage names it. `build.js` rewrites only the `import` / `export` lines,
  and ⛔ **fails the build on an import or export form it does not handle**, so a
  kit update cannot be half-wrapped silently. `lib/` stays byte-identical to
  coinless-kit (§1.3).
- **R3 — `Profiles.scope()` replaces `Profiles.keyFor(base)`** in `CLAUDE.md` and
  GDD §15.2. `keyFor` is Orbital Overhaul's and does not exist in kit-profile
  (§1.3). The rule keeps its point: the game never builds a key string; kit-storage
  owns the names, and the active profile's store comes from `scope()`.
- **R4 — `legacyRosterKey: null`, `legacyProbeKeys: []`.** ⛔ Not `''`: an empty
  string falls back to `afd_profiles_v1` (MEASURED, `kit-profile.js:607–611`).
  `CLAUDE.md`, GDD §15.1 and `kit-profile.NOTES.md` all say "empty" today and
  are corrected in P1.
- **R5 — The declared keys in CS011** are `settings`, `progress`, `telemetry`
  (per profile) and `scores` (root), plus kit-profile's own `profiles` (root).
  **`achievements` is not declared until CS015**; its row in `CLAUDE.md`'s table
  stays, marked CS015. `progress` holds `{ highestCleared }` and nothing else in
  CS011.
- **R6 — No `state` field is added.** The run's meta record (its eligibility,
  whether it has ended) lives in `22-meta.js`'s closure, like CS008's session
  record, because `startGame()` rewrites `state`. `test-registry.js`'s
  `STATE_FIELDS` does not move. ⛔ **Meta writes no `state` and spends no draw.**
- **R7 — The run lifecycle has three seats.**
  - **Run start: `startGame()`**, which calls `Meta.runStarted()`. That clears
    the bench flag and, from P5, calls the leaderboard's `beginRun()`. A run left
    open by a second `startGame()` (tests do this) is dropped unrecorded.
  - **`'quit'`: the top of `quitToTitle()`, when `state.screen === "pause"`**,
    read before the overwrite, as its comment already says.
  - **`'died'`: once per frame, after `frame()`'s step loop and before
    `audioFrame()`**, when the screen is `"gameover"` and the run is still open.
    ⛔ **Never inside `killSkimmer()`.** A clear edge on the step that spends the
    last life still pays its bonuses after `killSkimmer()` returns (GDD §7,
    `DECISIONS.md` 2026-09-13), and a Dive death returns from `update()` early.
    So only the frame knows the final score.
- **R8 — The bench flag.** Any of `DEBUG_SPAWN_ACTIONS`' six digits, `spawnRow`
  (`0`) or `cycleWell` (`w`) reaching `runAction()` while the screen is `"play"`
  marks the open run ineligible. The telemetry keys `t` and `e` do not; they touch no simulation
  (`23-main.js`'s own comment).
- **R9 — What a record and a submission carry.**
  - **Local row:** `{ score, level, startDepth, wells, deaths, durationS,
    outcome, ts, profileId, profileName, build }`.
  - **Online:** `metric: state.score`; `durationS: Math.round(state.time)` (simulation seconds, pause
    excluded, integer as the Worker demands); `outcome`; `stats` with all seven
    registered keys: `level_reached` `state.level`, `mode`, `start_depth`,
    `wells_cleared`, `purges_spent`, `deaths` off `state.tally`, and `max_combo`
    read from `C.TELEMETRY_PLACEHOLDER.maxCombo`, so CS012 changes one source.
  - **A local row needs `score > 0`** and a place in the mode's top 10, where a
    tie goes below the existing row (Orbital Overhaul's `qualifies`). **Every
    eligible run end submits online**, as Orbital Overhaul's does.
- **R10 — Settings are saved on every change**: an adjust step that moved a
  value, a toggle, a capture that bound a key, RESET TO DEFAULTS. They load by
  **known-value-else-default, per field**. MUSIC TRACK is stored by name, not
  index. A page of bindings that fails validation (an action with no binding, a
  reserved key, a duplicate) loads that page's defaults. `Game.reset()` restores
  defaults and **writes nothing**. ⛔ The telemetry capture switch is never stored.
- **R11 — A profile switch** (select, a new profile, deleting the active one)
  runs **reset to shipped defaults, then load the incoming profile**, off
  kit-profile's `change` event (⛔ `CLAUDE.md`, Save data). `23-main.js` owns
  `controls` and `sound`, so it hands `22-meta.js` three callbacks at boot:
  reset, apply and snapshot. The kit boundary is not in play here; both files
  are game.
- **R12 — Deleting a profile** removes that profile's declared per-profile keys
  (`settings`, `progress`, `telemetry`) through its scope's `remove(key)`, then
  calls kit-profile's `remove(id)`. ⛔ **Never `clear()`**, which enumerates.
  ⛔ **Profile `p0` is the root store** (§1.3), so deleting it removes those three
  root keys and never `scores` or `profiles`. Deleting the last profile is
  refused (the kit's `last_profile`) and the reason shows on the page. Local
  score rows keep their stamped name.
- **R13 — The NAME page is an arcade wheel, with no rows.**
  - **The wheel:** rotate cycles one wheel of kit-names' charset (`A–Z`,
    `0–9`, space, `_`, `-`) plus two marks, `DEL` and `END`.
  - **Fire** appends the shown character, deletes on `DEL`, and commits on `END`.
  - **Purge** deletes the last character, or cancels when the name is empty.
    Escape cancels.
  - **The keyboard (kit-input 0.8.0's text mode):** a letter, digit, space,
    `_` or `-` appends, Backspace deletes, and Enter commits. While the page
    is open, a typed key reaches **no binding and no named action** (`a`, `d`,
    `z`, `x`, `c`, space and the digits are all bound today, §1.7), and Shift is
    swallowed. Arrows, Escape and pad buttons behave as on any menu.
  - **The page's lines:** the name so far with a cursor mark, the wheel's
    current character, and a reason line: INVALID NAME, NAME TAKEN or ROSTER
    FULL, from kit-profile's `reason`.
  - **Validation** is kit-names' `validateName`, through kit-profile, and
    nothing else.
- **R14 — RENAME shows `NAME_CHANGE_NOTICE`** on the NAME page, word-wrapped to
  lines of ≤ 60 characters. MEASURED: its first sentence is 70 characters, and
  at `MENU_TEXT_SIZE` × `TEXT_CHAR_W` (18.6 px per character) that is 1,302 px,
  wider than the 1,280 px world. It is shown whether or not the leaderboard
  loaded, because local rows keep their stamped name too.
- **R15 — The SCORES screen is a menu screen**, drawn by `drawMenu()`, with no
  new renderer.
  - **A row** is `n NAME` as the label and the score as the detail, in plain
    digits like the HUD, enabled so rotate scrolls the list.
  - **No level column.** MEASURED: `10 ABCDEFGHIJKL` (279 px) plus `1002815` (130 px)
    fits inside `MENU_COL_W` 460 with 51 px spare; `L90 1002815` as the detail
    (205 px) does not.
  - **The info line** names the mode and the view.
  - **CLASSIC only** until CS012 makes OVERDRIVE choosable.
  - **The ONLINE view:** `fetchBoard({ window: "all", limit: 10 })`, with LOADING…,
    COULD NOT REACH THE BOARD and NO SCORES YET states, a stale response dropped by a
    token, a flagged row marked with a trailing `*`, and the M9 hint. There is
    no time-window switch.
- **R16 — The title's rows become PLAY, OPTIONS, SCORES, PROFILE**, appended
  after OPTIONS (MEASURED green, §1.2 C), with PROFILE's detail showing the active
  name. The queued line is the title's one info line, present only when
  `queueLength() > 0`.
- **R17 — Telemetry persistence**, per profile, lazy.
  - **Stored as arrays in `TELEMETRY_FIELDS` order**, not as row objects
    (§1.6: 0.89 M characters against 2.41 M).
  - **The envelope version is kit-storage's declared version for
    `telemetry`, with no `migrate`.** MEASURED by reading kit-storage §7.3: a
    stored version newer or older than the declaration reads back as the
    fallback, and the bytes are left alone. That is GDD §15.6's `read()`
    rejection, so bump the version whenever the column list moves. A stored
    row whose length is not `TELEMETRY_FIELDS.length` also restores as empty.
  - **Written** only while capture is on or has rows: at a run end (R7's two
    seats), when capture turns off, on `autoPause` (the page going hidden) and
    before a profile switch. **Never on a timer or mid-play.**
  - **Read** when capture turns on with an empty ring, and when EXPORT finds the
    ring empty, which is Orbital Overhaul's fallback.
  - ⛔ `21-telemetry.js` still names no storage (`test-cs007-p4.js`). It gains
    a snapshot and a restore, and `22-meta.js` owns the `get` and `set`.
- **R18 — kit-leaderboard 0.2.1 (PATCH).** `beginRun()` falls back to a
  `getRandomValues` UUID v4 when `crypto.randomUUID` is absent. That is the
  secure-context rule kit-profile 0.1.1 already follows, and today `beginRun()`
  would throw in a sandboxed embed (§1.4). Its `.NOTES.md` also gains the
  missing `endpoint` in its example and loses the "tag v0.2.0" claim (§1.4).
  **`C.LEADERBOARD_ENDPOINT`** is `"https://scores.coinlessgames.com"`.
- **R19 — `Leaderboard` is one object in `22-meta.js`**, the only reader of
  `window.KitLeaderboard`, created lazily the first time it is needed and only
  if the global exists, **every method a no-op when it does not.**
  `eligible()` is the same function the local check calls (⛔ `CLAUDE.md`).
- **R20 — The local scores table is kit-shaped from its first commit**
  (`CLAUDE.md`: `22-meta.js`'s local scores portion is the future kit-scores):
  - **`createScores({ store, key, perMode, modes })`**, reading no `C`, no
    `state` and no game global.
  - **It carries `src/22-meta.NOTES.md`** from P3.
  - The profile glue and the `Leaderboard` object beside it are game code.
- **R21 — The inline changes what `EXTERNAL-FILES.md` and
  `package-for-itch.sh` list.** kit-storage and kit-profile stop being runtime
  files. kit-names stays one, because the bridged kit-leaderboard imports it.
  The script's `LIB_FILES` becomes those two.
- **R22 — CS010's spent planning docs move to `archive/` in P1.** CS009's close
  archived its own; CS010's close did not (MEASURED: `702d5ba` touches neither
  file).

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the kit under `file://` and over `http://`.

One page, a classic script then a module script, in Chromium 153:

| | `file://` | `http://127.0.0.1` |
|---|---|---|
| `isSecureContext` | **true** | true |
| `crypto.randomUUID` / `getRandomValues` | both present | both present |
| `localStorage` write and read back | **works** | works |
| `import("./lib/kit-storage/kit-storage.js")` | ⛔ **fails**: "Failed to fetch dynamically imported module" | loads 0.1.0; kit-profile 0.1.1 loads, `firstBoot` true, `current()` null |

So under the module bridge a double-clicked build would have storage and no
module to use it (M1).

- **`dist/` holds only `vector-vortex.html`** (`ls`). The shell's
  `./lib/kit-leaderboard/…` import resolves to `dist/lib/`, which does not
  exist. Only `package-for-itch.sh`'s zip puts `lib/` beside the page, so the
  bridged leaderboard is reachable only from a packaged build served over http
  from an allowed origin.
- ⚠ **PREDICTED, not measured:** in a sandboxed iframe without
  `allow-same-origin`, `isSecureContext` is false, so `randomUUID` is
  undefined and `localStorage` throws. That is coinless-kit's recorded itch.io
  finding (its `STATUS.md`), and it is why kit-profile 0.1.1 falls back. The
  suite covers the fallback headless (P1, P5).

### 1.2 MEASURED — what inlining and wiring turn red.

Cumulative variants in a worktree of `52ba439`, whole suite each time:

| Variant | Build | Red |
|---|---|---|
| **A.** kit-names, kit-storage, kit-profile wrapped in IIFE namespaces after `20-achievements.js`, uncalled | 25 modules, **544.0 KB (+53.8)** | **none: 54/54** |
| **B.** A + at boot: a store, a roster (`null`, `[]`), `createAnonymous()` | 544.4 KB | **`test-cs008-p6.js:375`** "never persisted: no storage write (got 1)"; **`test-cs008-p7.js:436`** "session-only: no storage write (got 1)". Nothing else |
| **C.** B + SCORES and PROFILE rows after OPTIONS on the title | 544.6 KB | the same two |
| **D.** C + a third game-over info line | 544.6 KB | the same two (`test-cs008-p5.js`, `-p8.js`, `test-cs009-p6.js` green) |
| **E.** D + a `scores` write at both run-end seats (R7) + a store write at every clear edge | 545.4 KB | the same two; **suite 69.7 s** against 69.3 s |

- **Variant B wrote one key**, `coinless.vector-vortex.profiles`:
  `{"v":1,"d":{"lastUsed":"","seq":1,"profiles":[{"id":"p0","name":"ANONYMOUS",…,"playerId":null}]}}`.
  ⚠ **`createAnonymous()` does not select**: `lastUsed` is empty and no
  `playerId` is minted until `select()`, `current()` or `player()` runs.
- **`P1_DETERMINISM_HASH` and `GOLDEN_LANES` stayed green in every variant**
  (both files are in the suite). Variant B's boot calls `Date.now()` once through
  kit-profile, which shifts the time-seed counters some tests install. Nothing
  went red.
- **Why kit-leaderboard is not inlined.** It holds two `setTimeout` calls and
  one `addEventListener` (grep). `test-cs009-p1.js:508` bans the first anywhere in
  the built code, and `test-cs002-p1.js` bans the second outside `04-input.js`.
  Its `fetch` is fine: no closed test bans it outside the telemetry module.
  kit-storage, kit-profile and kit-names hold none of those, no `fillText`, and
  none of `test-cs008-p6.js`'s banned words (grep, and variant A green).

### 1.3 MEASURED — the kit contracts the game builds on.

All four vendored modules are **byte-identical** to coinless-kit `f0b0eb2`
(`cmp`), as are the four client docs in `lib/docs/`.

- **kit-profile 0.1.1:**
  - `create({ storage, maxProfiles = 8, legacyRosterKey, legacyProbeKeys,
    anonymousName = "ANONYMOUS", onEvent })`.
  - ⛔ Only `legacyRosterKey === null` skips the legacy import (`:607–608`);
    `''` becomes `afd_profiles_v1`.
  - Events go through `onEvent(name, detail)`: `ready`, `beforeChange`,
    `change`, `created`, `renamed`, `removed`, `minted`, `error`.
  - `create` and `createAnonymous` return `{ ok, profile, reason }`, with
    `reason` one of `invalid_name`, `name_taken` or `roster_full`.
  - `remove(id)` refuses `last_profile`, **does not clear the profile's data**,
    and selects `roster[0]` when the active profile goes (`:511–526`).
  - ⛔ **`scope(id)` returns the ROOT store for `p0`** and `store.scope(id)`
    for any other id (`:448–451`). Ids are `'p' + seq` and never reused.
  - `playerId` is minted by `ensurePlayerId` on `select`, `current` and
    `player`, via `randomUUID`, else `getRandomValues`.
  - It declares `profiles` v1 on the root store itself.
- **kit-storage 0.1.0:**
  - `get` and `set` on an undeclared key throw.
  - A blocked or throwing `localStorage` falls back to an in-memory shim
    (`available` false).
  - A stored `v` newer than the declaration returns the fallback and writes
    nothing; an older one with no `migrate` does the same (§7.3 steps 5–6).
  - ⛔ `keys()`, `scopes()`, `clear()` and `usage()` walk `localStorage.key(i)`
    (`:252–262`). kit-profile calls none of them.
- **`keyFor(base)` exists in neither module.** It is Orbital Overhaul's
  (`Profiles.keyFor` at its L7123), and GDD §15.2, `CLAUDE.md`,
  `src/21-telemetry.js:22` and `src/22-meta.js:5` still name it (R3).
- **kit-names 0.1.0:** `validateName` allows 1–12 characters of
  `[A-Za-z0-9 _-]`, checked before uppercasing. `NAME_CHANGE_NOTICE` is two
  sentences, of 70 and 40 characters.

### 1.4 MEASURED — kit-leaderboard and the Worker.

- **kit-leaderboard 0.2.0:**
  - `create({ endpoint, gameId, gameVersion, getPlayer, storageKey, timeoutMs,
    turnstileToken, onEvent })`. ⛔ **`endpoint` has no default**, and
    `kit-leaderboard.NOTES.md`'s example omits it.
  - `beginRun()` is `crypto.randomUUID()` with **no fallback** (`:249`).
  - `submit({ metric, durationS, outcome, stats })` never throws and resolves
    `submitted`, `queued` or `rejected`.
  - `fetchBoard({ window, limit })` rejects on failure.
  - `queueLength()` and `flushQueue()`.
  - It writes its queue straight to `localStorage` under
    `coinless.lb.vector-vortex.v1`, outside kit-storage, as designed.
  - Its NOTES say "Vendored from: coinless-kit tag `v0.2.0`". **That tag does
    not exist** (`git ls-remote`: only `v0.1.0`).
- **The Worker, live 2026-09-16:**
  - `GET /v1/health` → `{"ok":true,"games":["orbital-overhaul","vector-vortex"]}`.
  - `GET /v1/scores?game=vector-vortex` → 200, no entries.
  - ⚠ Health lists ids only, so the deployed `statsFields` cannot be confirmed
    remotely. The repo's registry (`f0b0eb2`, `registry.js:23–42`) has all seven.
- **The registry entry:** `maxMetricPerSecond 1200`, `maxMetric 10,000,000`,
  `minDurationS 5`, `maxDurationS 86,400`, and `statsFields` `level_reached`,
  `mode`, `start_depth`, `wells_cleared`, `purges_spent`, `max_combo`,
  `deaths`. Unknown stats keys flag the row; missing keys do not.
- **Rejected with 400:** a non-integer `metric` or `duration_s`, an `outcome`
  outside `died` / `completed` / `quit`, a `run_id` or `player_id` that is not
  UUID v4, or a name that fails kit-names. **Refused with 403:** `Origin: null`
  (a `file://` page).
- **Flagged but stored:** `duration_too_short`, `duration_too_long`,
  `metric_out_of_range`, `rate_implausible` and `unknown_stats_keys`.
- ⛔ **There are no per-mode boards.** `GET /v1/scores` filters by game, window
  and limit only, and the board keeps **each player's single best row per game
  id** (`board.js`, `ROW_NUMBER() … PARTITION BY player_id`). One shared id for
  both modes would hide a player's second mode entirely. **Overdrive's board is
  CS012's call**; a second registry id is the obvious form (PREDICTED).

### 1.5 MEASURED — score per second against `maxMetricPerSecond` 1200.

Simulation seconds. The scripted player dies faster than a good human
(PREDICTED), so the end-of-run rates are, if anything, high.

| Start Depth | Rate at game over | Worst rate over the run (a quit at that moment) | First clear |
|---|---|---|---|
| 1 | 142–160 | 168–182 | 17.4–22.0 s |
| 5 | 232–324 | 539–717 | 15.5–18.6 s |
| 9 | 111–339 | 995–1,080 | 25.4–26.2 s |
| 17 | 710–790 | 2,940–4,903 | 14.7–24.4 s |
| 33 | 766–1,780 | 9,209–15,794 | 13.5–23.2 s |
| 49 | 2,717–3,509 | 13,772–24,562 | 16.3–29.2 s |
| 81 | 1,887–6,297 | **57,780–86,616** | **10.4–15.6 s** |

⛔ At 1,200 **every Start Depth 49 and 81 run, and two of three from 33, are
flagged at game over**, and a quit soon after the first clear is flagged from
Start Depth 17 up. The worst reading is SD81's bonus (887,200) collected
10.4 s in. With `durationS` rounded down to 10 s that reads about 90,000 (M7).

### 1.6 MEASURED — telemetry's size in storage.

| | Characters | UTF-16 |
|---|---|---|
| A full ring (4,096 rows), row objects | **2,413,402** (589 per row) | 4,714 KB |
| The same rows as arrays in field order | **885,594** | 1,730 KB |
| The CSV export | 554,264 | — |

- **Chromium 153's quota:** the largest single value it would store is about
  **5,242,308 characters**, so a full ring of row objects is **46 %** of the
  origin's quota. ⚠ Every `file://` page shares one origin in Chromium
  (PREDICTED from its origin model, not measured).
- **The write cost**, on a synthetic 4,096 × 29 ring of random floats, larger
  than the game's rows: **arrays 1.6 M characters, `JSON.stringify` 6.5 ms and
  `setItem` 5.2 ms. Row objects 2.9 M characters, stringify 16.5 ms.** A frame
  at 60 Hz is 16.7 ms. Hence R17: arrays, and no write mid-play.

### 1.7 MEASURED — the surfaces CS011 touches.

- **`killSkimmer()` (`09-collision.js:282–284`)** is the only writer of
  `screen = "gameover"` (grep). Its own comment names CS011 as the owner of the
  submission. `HIT_STOP_DEATH` is 1.20 s. The game-over menu is inert through the
  freeze (GDD §10.5), so a RESTART cannot land before R7's frame seat has run.
- **`startGame()` (`23-main.js:206–215`)** is the one way a run begins, and
  every closed soak calls it.
- **Bound device keys** (`INPUT_KEYS_DEFAULT`): `arrowleft a`, `arrowright d`,
  space `z`, `shift x`, `arrowup c`. **Named actions:** `escape`, `p`, `w`, `1`–`6`, `0`, `t`, `e` (`ACTION_KEYS`). ⛔ So typing a name through
  the ordinary key path would rotate, fire, purge, pause, cycle the well and
  toggle telemetry (R13).
- **The menu model** (`15-render-hud.js`): Fire returns the cursor row's
  action, the cursor skips disabled rows, and the window shows
  `MENU_VISIBLE_ROWS` 7. `drawMenu` draws the info lines centred at 30 px and
  labels and details `MENU_COL_W` 460 apart. An empty `items` list draws
  nothing below the lines.
- **Closed tests that pin a text CS011 might move** (grep): `test-cs007-p4.js:467`
  (`// 22-meta.js` as the slice's end), `test-cs001-p0.js:19` (`GAME_ID`),
  `test-cs008-p3.js:120` (a first session offers 1–9; still true on an empty
  store, PREDICTED), and the `levelRecord().noteCleared` fixtures in
  `test-cs008-p5.js:326`, `test-cs009-p6.js:233` and `test-cs010-p5.js:349`
  (PREDICTED green: the function's contract is unchanged).
- **`_harness.js`'s `localStorage` stub** is a fresh `Map` per `buildGame()`, and
  it implements `length` and `key(i)`. So a counter on those two is a
  no-enumeration proof that needs no text scan (P1).
- **The boot block runs in the harness too.** `buildGame()` passes `window` and
  `document` as parameters, so `typeof window !== "undefined"` holds, and variant
  B's boot wrote its key in every test build.

### 1.8 MEASURED — the renumber's pointers (R1).

Live files only (`log/`, `archive/`, `dist/` excluded), grep for `CS015` /
`CS016`, at `52ba439`. **Thirteen hits.** The `STATUS.md` line numbers moved
with the planning commit, so re-grep there:

- **CS015 → CS016 (onboarding):** `STATUS.md`'s "four-second promise" known
  issue, `ROADMAP.md:30` (the row), `:128` and `:407`.
- **CS016 → CS017 (ship):** `STATUS.md`'s "seven debug spawn actions" carried
  task, `ROADMAP.md:31` (the row) and
  `:335`, `DECISIONS.md:81`, `VECTOR-VORTEX-GDD.md:1383` and `:1634`,
  `src/23-main.js:462`, and the message string at `scratchpad/test-cs007-p3.js:382`.
- **Achievements that say CS011:** `ROADMAP.md:26` (the row) and `:333` (§21 #4
  "Lands in"). GDD §17 item 10 and §19's Meta paragraph name no changeset.

---

## 2. THE SHAPE

| Where | Side | Owns in CS011 |
|---|---|---|
| `build.js` | build | `KIT_INLINE`: `lib/kit-names`, `lib/kit-storage`, `lib/kit-profile`, each wrapped into a namespace (R2), with its own both-ways existence check beside `MANIFEST`'s |
| `lib/kit-leaderboard/` | ⛔ vendored kit, bridged | 0.2.1: `beginRun()`'s fallback (R18) |
| `src/04-input.js` | ⛔ kit-input **0.8.0** | a text mode: `captureText(cb)` / `captureText(null)` (R13) |
| `src/21-telemetry.js` | game | `snapshot()` and `restore(data)` (R17). ⛔ Still names no storage |
| `src/22-meta.js` | game glue + ⛔ kit-shaped scores | `Store`, `Profiles` (boot, `scope()`, activation per R11, delete per R12), `levelRecord()` on `progress`, settings save/load through `23-main.js`'s callbacks, telemetry persistence, `createScores` (R20), the run lifecycle (R7, R8), `Leaderboard` (R19) |
| `src/22-meta.NOTES.md` | kit-scores draft | new in P3 |
| `src/23-main.js` | game | the three seats (R7), the bench flag (R8), settings callbacks (R11), SCORES, PROFILE, the per-profile page, DELETE confirm and NAME screens, the title's two rows and queued line, game over's third line, `Meta.boot()` in the boot block |
| `src/00-config.js` | `C` | a Meta group: `SCORES_PER_MODE` 10, `PROFILE_MAX` 8, `NAME_WHEEL`, `LEADERBOARD_ENDPOINT`, `LEADERBOARD_BOARD_LIMIT` 10, `NOTICE_WRAP` 60 |

PREDICTED names; a phase may rename inside this shape, not across the kit line.

- ⛔ **Meta writes no `state`, spends no RNG draw and draws nothing.** Its
  screens are `23-main.js`'s data, drawn by `drawMenu`.
- ⛔ **No storage call outside `22-meta.js`.** kit-leaderboard's own queue is
  kit code, not the game's.
- ⛔ **The game never enumerates storage**: no call to a store's `keys()`,
  `scopes()`, `clear()` or `usage()`, and no `localStorage` name anywhere outside
  the inline block and the bridge's module.

---

## 3. P1 — THE KIT INLINE, THE STORE, THE SILENT PROFILE

- **`build.js`**:
  - `KIT_INLINE` per R2, each file under a banner `// lib/<name>/<name>.js`;
  - ⛔ a form it cannot rewrite fails the build;
  - a listed file that is missing fails the build.
- **`src/22-meta.js`**:
  - `Store = KitStorage.create({ gameId: C.GAME_ID, keys })` with R5's keys;
  - `Profiles` over `KitProfile.create({ storage: Store, maxProfiles:
    C.PROFILE_MAX, legacyRosterKey: null, legacyProbeKeys: [], onEvent })`;
  - `Meta.boot()`: on `firstBoot`, `createAnonymous()` then `select()`.
    Otherwise the kit's own boot selection stands;
  - `Profiles.scope()` returns the active profile's store (R3).
  - No setting or record moves yet.
- **`src/23-main.js`**: the boot block calls `Meta.boot()` before `Game.start()`.
- **`_harness.js`**:
  - `buildGame({ store })` reuses a `Map`, so a second build is a reload;
  - `buildGame({ storage: "blocked" })` makes the `localStorage` getter throw;
  - `_env.storageReads` counts `length` and `key(i)`;
  - `EXPORTS` gains `KitNames`, `KitStorage`, `KitProfile`, `Store`,
    `Profiles` and `Meta`.
- **Closed-file rewrites, in place** (MEASURED, §1.2 B):
  - **`test-cs008-p6.js:375`:** "the telemetry toggles write nothing: the
    stored keys are the same before and after".
  - **`test-cs008-p7.js:436`:** "RESET TO DEFAULTS stores no settings key". P2
    rewrites it again, to its persisted form.
- **`scratchpad/test-cs011-p1.js`:**
  - ⛔ each inlined body equals its `lib/` file with only the import and export
    lines rewritten. **Mutation: the comparison against the `lib/` text with one
    character changed is red**, and the wrapper throws on `export default`;
  - a first boot stores exactly `profiles`, holding one selected ANONYMOUS
    profile with a UUID v4 `playerId`. **Mutation: `legacyRosterKey: ''`** plus a
    planted `afd_profiles_v1` imports it (red);
  - a second build over the same store selects the same profile and creates none;
  - a blocked store boots, plays a run and writes nothing;
  - with `crypto.randomUUID` hidden, the mint is still v4;
  - `_env.storageReads` stays 0 across boot and a played run;
  - no `localStorage`, `sessionStorage` or `indexedDB` in the built code
    outside the inline block;
  - `P1_DETERMINISM_HASH` unmoved.
- **Docs:**
  - `CLAUDE.md`, Save data: R3's rule, M1's enumeration wording and R4's `null`;
    in Build rules, a line on the inlined vendored kit (the exception beside
    the bridge); the code map.
  - `EXTERNAL-FILES.md` and `package-for-itch.sh` (R21).
  - `kit-profile.NOTES.md` (R4, and "inlined at build").
  - GDD §15.1–15.2 (R3, R4, R5, M1) and §16.2's external-files paragraph.
  - The renumber (R1, §1.8): `ROADMAP.md` gains **CS015 Achievements**, with
    §15.5 and §17 item 10, and GDD §17 item 10 and §19 Meta point there.
  - `DECISIONS.md`: one entry for M1–M9, the move of achievements and the
    rate-bound ask.
  - `git mv` CS010's two plan docs into `archive/` (R22).
  - `STATUS.md` and `log/CS011.md`.

## 4. P2 — WHAT A PROFILE KEEPS

- **Settings** (`settings` v1):
  - **Stored:** `{ controls: { mouse, touch, autofire, mirror, keys, pad },
    sound: { master, music, sfx, voice, track } }`.
  - **Saved** on every change (R10).
  - **Loaded** at boot and on activation, per field, known-value-else-default:
    sensitivities in `SENS_LO..SENS_HI` steps, volumes in `0..AUDIO_VOL_STEPS`,
    `track` a name in `C.MUSIC_TRACK_CHOICES`, and binding pages validated whole.
  - `23-main.js` hands `22-meta.js` `resetSettings()` (which writes nothing),
    `applySettings(data)` and `settingsSnapshot()` at boot.
- **Activation** (R11): kit-profile's `change` → reset, then load. ⛔ The reset
  comes first. **Mutation: load without the reset** bleeds the outgoing
  profile's volume onto an incoming profile that never set one (red).
- **The Start Depth record:** `levelRecord()` reads and writes the active
  profile's `progress.highestCleared`. Its one writer (the clear edge) and one
  reader (`startDepthOptions()`) are unchanged.
- **Telemetry** per R17: `snapshot()` / `restore()` in `21-telemetry.js`, and
  the writes and reads in `22-meta.js`.
- **Closed-file rewrite, in place:** `test-cs008-p7.js:436` becomes "RESET TO
  DEFAULTS stores the defaults in the profile's settings".
- **`scratchpad/test-cs011-p2.js`:**
  - a reload restores every row of CONTROLS, KEYBOARD, GAMEPAD and OPTIONS'
    sound rows, and the Start Depth list;
  - every field falls back alone when invalid or missing;
  - two profiles keep separate settings and records, `p0`'s at the root and
    `p1`'s under `p1.`;
  - the reset-before-load mutation;
  - `Game.reset()` writes nothing;
  - the capture switch is never stored (a reload boots with capture off even
    after it was on);
  - a ring round-trips through a reload as arrays, and a declared-version bump
    or a row-length mismatch restores empty;
  - no telemetry write during play steps (the store's `set` is spied across a
    capture-on run: only R17's seats write);
  - `_env.storageReads` 0.
- **Docs:**
  - GDD §4.6 ("ever cleared by that profile", no longer a session record),
    §10.5's two "session-only until CS011" paragraphs, and §15.6's persistence.
  - The "no persistence" comments in `21-telemetry.js` and `22-meta.js`.
  - `SKIPPED-PLAYTESTS.md`: none (nothing to hear or see).

## 5. P3 — THE LOCAL TOP 10 AND THE RUN'S END

- **`createScores`** (R20), with `src/22-meta.NOTES.md`. `scores` v1 is
  `{ classic: [...], overdrive: [...] }`, each at most `C.SCORES_PER_MODE`.
- **The lifecycle** (R7, R8, R6):
  - `Meta.runStarted()` in `startGame()`, `Meta.benchUsed()` in `runAction()`'s
    bench branch, and `Meta.runEnded(outcome)` at the `'quit'` and `'died'`
    seats;
  - **`Meta.eligible()`**, the one gate;
  - a row per R9. Its rank is kept for game over.
- **The SCORES screen** (R15, R16): the title's third row, the CLASSIC LOCAL
  list, NO SCORES YET when empty, and BACK.
- **Game over's third line**, "NEW HIGH SCORE #n", only for a run that placed
  (M5).
- **`scratchpad/test-cs011-p3.js`:**
  - ⛔ **a clear on the step that spends the last life is in the recorded score**
    (a staged board). **Mutation: recording inside `killSkimmer()` is red**;
  - a Dive death records once;
  - quit from pause records `'quit'` once with the pre-overwrite score, and game
    over's QUIT records nothing more;
  - RESTART opens a new run;
  - a bench action makes both `Meta.eligible()` and the local check false.
    **Mutation: a bench-touched run recorded is red**;
  - `t` and `e` leave a run eligible;
  - the top 10 per mode: order, the tie rule, `score > 0`, and the cap;
  - rows carry R9's fields, and the profile's name at the time;
  - the SCORES rows match the table, and game over's line appears only when
    placed;
  - `state` is hashed before and after every `Meta` call and never moves.
- **Docs:** GDD §15.3 and §10.5 (the title and game-over rows).

## 6. P4 — THE PROFILE SCREEN AND NAME ENTRY

- **kit-input 0.8.0** (`04-input.js`, `.NOTES.md`, MINOR):
  - `captureText(cb)` delivers `{ ch }`, `{ del: true }` or
    `{ done: true }` for R13's keys, and swallows them and Shift from bindings
    and named actions until `captureText(null)`;
  - every other key behaves as usual;
  - ⛔ nothing outside `04-input.js` reads a key (`test-cs002-p1.js`).
- **Screens** (R12, R13, R14, R16):
  - **PROFILE**: one row per profile (detail ACTIVE on the current one), NEW
    PROFILE (disabled at `PROFILE_MAX`), and BACK;
  - **a profile's page**: SELECT, RENAME, DELETE and BACK;
  - **DELETE**: NO, then YES;
  - **NAME**: the wheel.
  - The title's fourth row shows the active name.
- **`scratchpad/test-cs011-p4.js`:**
  - a name spelled by the wheel alone (rotate and fire), and one typed;
  - typing `adzxc 1wtep` changes no binding state, spawns nothing, cycles no
    well, toggles no telemetry and pauses nothing. **Mutation: text mode off, and
    the same keys fire actions (red)**;
  - INVALID NAME, NAME TAKEN and ROSTER FULL shown from the kit's reasons;
  - rename keeps `playerId`;
  - switching runs R11;
  - deleting the active profile activates `roster[0]`;
  - ⛔ deleting `p0` leaves `scores` and `profiles`. **Mutation: `clear()` is
    red**, both by the kept keys and by `_env.storageReads`;
  - the last profile cannot be deleted;
  - the notice wraps within `NOTICE_WRAP`, and every drawn line of every new
    screen fits in `WORLD_W` (arithmetic on `TEXT_CHAR_W`, as
    `test-cs008-p4.js` does).
- **Docs:** GDD §9.5 (text mode), §10.5 (the screens and the flow diagram) and
  §15.2.

## 7. P5 — THE ONLINE LEADERBOARD

- **`lib/kit-leaderboard` 0.2.1** (R18), its `.NOTES.md`, and
  `EXTERNAL-FILES.md`'s version. The shell's bridge is unchanged.
- **`Leaderboard`** (R19):
  - `instance()` creates the kit client with `endpoint:
    C.LEADERBOARD_ENDPOINT`, `gameId`, `gameVersion` and `getPlayer: () =>
    Profiles.player()`;
  - `beginRun()` from `Meta.runStarted()`;
  - `submit(outcome)` from `Meta.runEnded()` when `Meta.eligible()`, with R9's
    payload;
  - `queueLength()`;
  - `load()` for the ONLINE view, with a stale-token drop.
- **SCORES** gains the LOCAL / ONLINE row when the module is present (R15), and
  the title gains its queued line (R16).
- **`scratchpad/test-cs011-p5.js`**, with a recording fake
  `window.KitLeaderboard` set on `_env.win`:
  - module absent: no call, no row, no line, and the game plays;
  - one `beginRun` per run, one `submit` per eligible run end, and **never
    two**, including game over's QUIT;
  - payload types as the Worker demands (integers, the seven keys and no
    other, the outcome in `died` / `quit`);
  - a bench run submits nothing;
  - an ANONYMOUS profile submits and the hint shows;
  - ONLINE's LOADING…, reached, failed and empty states, with a late response
    for an old token ignored;
  - the queued line at 0 and 3;
  - ⛔ **the real `lib/kit-leaderboard.js`** loaded in Node (`require`), with
    `fetch` stubbed and `crypto.randomUUID` hidden: `beginRun()` returns a v4,
    and the body it posts parses as the Worker's shape.
    **Mutation: 0.2.0's `beginRun` throws (red).**
- **Docs:** GDD §15.4 (Shipped, CS011: the payload, the seats, M9, R18);
  `STATUS.md` carried tasks (Paul's registry raise, M7; Overdrive's board, §1.4,
  CS012).

## 8. P6 — THE NINTH SOAK, THE DOCS, THE CLOSE

- **`scratchpad/test-cs011-p6.js` — the ninth soak.** ⛔ A new file; never
  widen `test-cs010-p5.js`. It uses `test-cs009-p6.js`'s front-door driver:
  - Start Depths 1, 13 and 23, RESTART and QUIT TO TITLE;
  - one run quit from pause, one run touched by the bench;
  - a trip to OPTIONS to change a volume and a sensitivity;
  - PROFILE to create and switch to a second profile;
  - a fake leaderboard present.
- **The session played twice:**
  - once over a working store;
  - once with storage blocked;
  - ⛔ **the whole-board hash matches on every frame**, so persistence cannot
    steer a run.
- **Over the working session:**
  - `_env.storageReads` 0;
  - every stored key is a declared one, and `coinless.lb.*` is never written
    by game code;
  - one local row per eligible run that scored and placed, and one submit per
    eligible run end, the bench run excluded;
  - `state` never moved by a `Meta` call.
- **Then a reload** (a second build over the same store): the settings, the
  record, both profiles and the table come back.
- **Obey the replay traps:** two live steps before the first press, stop
  pressing at the stop, and restart through the menu.
- **The review:** `log/CS011.md`'s phase entries read together.
- **Docs:**
  - GDD §15.1–15.4 and §15.6 "Shipped, CS011" notes, §19 Meta's verdicts and
    Audio's "volume sliders persist per profile" verdict;
  - `CLAUDE.md`'s code map;
  - `ROADMAP.md`'s row and a "what CS011 shipped / left" paragraph;
  - `STATUS.md` reset, `log/CS011.md` closed, and `C.GAME_VERSION` 0.0.8.
- ⛔ Zero skips. `P1_DETERMINISM_HASH` 1229033515 and `GOLDEN_LANES` unmoved.

---

## 9. ⛔ THE BASELINE LEDGER

| Baseline | Moves in CS011? |
|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` **1229033515** | ⛔ **No, in any phase.** MEASURED green in variants A–E. A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | ⛔ **No** (MEASURED green in A–E) |
| `test-registry.js` `STATE_FIELDS`, `tracks` 2, `enemies` 6, `enemyKinds` 9 | ⛔ **No** (R6) |
| kit-input `04-input.js` | 0.7.0 → **0.8.0 in P4** |
| kit-leaderboard `lib/` | 0.2.0 → **0.2.1 in P5** |
| kit-storage, kit-profile, kit-names | ⛔ **unmodified** |

**Closed-file edits, all in place** (MEASURED unless marked):
- **P1:** `test-cs008-p6.js:375`; `test-cs008-p7.js:436`; the message string at
  `test-cs007-p3.js:382` (the renumber, §1.8).
- **P2:** `test-cs008-p7.js:436` again, to its persisted form.
- **P3–P5:** none (PREDICTED, §1.2 C–E).
- ⛔ **Any other closed assertion going red is a finding to stop on**, not a
  repair.

## 10. ⛔ ACCEPTANCE CRITERIA

1. The built file carries kit-names, kit-storage and kit-profile byte-for-byte
   (import and export lines aside), and a build fails on a form it cannot wrap.
2. A first launch lands on the title with one selected ANONYMOUS profile. A
   reload selects it again. Blocked storage plays.
3. ⛔ The game never enumerates storage: `localStorage.length` and `key(i)` are
   never read across a played front-door session.
4. Every CONTROLS, KEYBOARD, GAMEPAD and sound setting and the Start Depth record
   survive a reload, per profile, known-value-else-default. The telemetry switch
   never does.
5. ⛔ A profile switch resets to shipped defaults before loading.
6. A top 10 per mode, `'died'` and `'quit'`, final scores including a
   last-step clear, and nothing from a bench-touched run.
7. ⛔ One gate, `Meta.eligible()`, for the local table and every submit, and
   never two submits for one run.
8. SCORES shows LOCAL, and ONLINE when the module is present. Game over names a
   placing, and the title names a queue.
9. PROFILE creates, selects, renames and deletes, and names can be entered by
   wheel on every device and by typing. Typing fires no action.
10. kit-leaderboard 0.2.1 mints a v4 run id without `randomUUID`, and the game
    plays with the module absent.
11. Telemetry rows survive a reload as arrays, and are rejected on a version or
    shape mismatch.
12. ⛔ Meta writes no `state`, and a blocked-storage session matches a working one
    frame by frame.
13. Achievements are CS015's in `ROADMAP.md`, the GDD and `STATUS.md`, and nothing
    achievement-shaped is built.

## 11. ⛔ WHAT CS011 DOES NOT DO

- **Achievements** (M4): no key, no evaluator, no table, no toast, no viewer.
- **An OVERDRIVE board**, local tab or registry id: CS012's (§1.4).
- **The registry change** (M7): Paul's, outside this repo.
- **A time-window switch** on ONLINE, a filter by profile on LOCAL, or an erase
  of scores (R15).
- **Save and resume** of a run. Vector Vortex has none.
- **R2's pad-only silence, the VOICE bus, the Dive's visual, the Surger tone's
  1.106 peak**: unowned, as before.
- **Any change to kit-storage, kit-profile or kit-names.**

## 12. RISKS

| # | Risk | Mitigation |
|---|---|---|
| K1 | A kit update changes an import or export form and the wrap breaks quietly | The build fails on an unhandled form (R2), and P1's test compares bodies to `lib/` |
| K2 | The inlined kit's enumeration code is in the build, so a later session calls `clear()` "to tidy a profile" | ⛔ `CLAUDE.md`'s reworded rule, P4's `clear()` mutation, and `storageReads` in P1, P2, P4 and P6 |
| K3 | A full telemetry ring is 0.89 M characters, and `file://` pages share one origin's ~5.24 M quota (§1.6) | kit-storage's quota path falls back to memory and `set` returns false. Telemetry is off at every launch, and capture is a developer act |
| K4 | Chromium was the only browser measured (§1.1, §1.6). Firefox and Safari treat `file://` storage differently (PREDICTED) | The shim covers failure. Recorded in `SKIPPED-PLAYTESTS.md` at P6 as a device check, not a playtest ask |
| K5 | The deployed Worker's `statsFields` cannot be seen from outside (§1.4) | P5 asserts the payload against the repo's registry. A flag is a flag, never a rejection |
| K6 | Until Paul raises the bound, deep starts are flagged (§1.5) | Carried in `STATUS.md` from P1 |
| K7 | P4 is the largest phase: a kit-input MINOR, four screens and a text mode | If it overruns, split the wheel and text mode (P4) from the roster screens (P4b), with no renumber |
| K8 | `NAME_CHANGE_NOTICE`'s wording changes upstream and no longer wraps in two lines | The wrap is computed, and P4's width arithmetic reads the kit's string |

## 13. ASSUMPTIONS

- coinless-kit `f0b0eb2` is the source of truth for the kit contracts and the
  registry. The vendored copies match it byte for byte (MEASURED).
- Orbital Overhaul `5abd37a` is the precedent for settings loading, `quitToTitle`'s
  submit order, `qualifies`, telemetry persistence and the rename notice. It is
  not the source for scores (one table of 25, no modes), for name entry (its
  grid), or for `keyFor` (the kit replaced it).
- The scripted driver's boards are the only measured boards.
- Paul does no playtests. The screens' look is the menu's ⚠ provisional palette
  and sizes, unchanged.

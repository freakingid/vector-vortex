// test-cs016-p1.js — CS016 P1: the first-run prompts, the band and the
// `onboarding` key (GDD 12, 10.4, 15.1; plan §3). Each of C.PROMPTS' twelve
// rows fires ONCE from a staged board, never again in a run, a RESTART or a
// reload; a new profile sees them again; the key is per profile and written at
// the four seats only; the queue, the band, the z-order; the scan spends no
// draw, reads no clock or board once all is seen, writes no `state`; and a
// played Classic session hashes identically with the module stubbed.
//
// ⛔ TRAPS.
//  1. The boot block leaves the screen on the title; Game.reset() puts it on
//     play, where every staging starts. A profile switch is staged off play.
//  2. Fires are recorded off the queue's own `rows.push` (the array is never
//     replaced), so a fire that already left the queue still counts.
//  3. Each mutation is guarded and its string asserted in the build once.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260923;
installSeed(SEED);                          // ⛔ above the first buildGame()

const NS = "coinless.vector-vortex.";
const J = JSON.stringify;
const script = () => H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

// A build with the fire recorder attached (trap 2).
function open(o = {}) {
  const X = H.buildGame(Object.assign({ store: o.store || new Map() }, o.build || {}));
  const fires = [];
  if (X.promptQueue) {
    const rows = X.promptQueue.rows, push = rows.push;
    rows.push = function (r) { fires.push(r.id); return push.call(this, r); };
  }
  X.Game.reset();                           // trap 1
  return { X, C: X.C, G: X.Game, state: X.state, fires };
}
const step = (T, n = 1) => { for (let i = 0; i < n; i++) T.G.update(T.C.FIXED_DT); };
const ids = C => C.PROMPTS.map(r => r.id);

// Every trigger, staged; each leaves its fact on the board.
const OPEN_LEVEL = W => W.findIndex(w => !w.closed) + 1;
const STAGE = {
  rotate:   T => { T.X.startGame(SEED); },
  carrier:  T => { T.X.spawnEnemy("carrierVaulter", 4, 0.1); },
  thorn:    T => { T.X.spawnEnemy("thorn", 5, 0.1); },
  drifter:  T => { T.X.spawnEnemy("drifter", 6, 0.1); },
  surger:   T => { T.X.spawnEnemy("surger", 7, 0.1); },
  openWell: T => { T.X.startGame(SEED, { startDepth: OPEN_LEVEL(T.X.WELLS) }); },
  purge:    T => { T.G.input.keyDown("x"); step(T); T.G.input.keyUp("x"); },
  token:    T => {
    T.X.startGame(SEED, { mode: "overdrive" });
    for (let i = 0; i < 500 && T.state.tokens.length === 0; i++) T.X.dropToken(T.state, { lane: 3, depth: 0.5 });
  },
  rings:    T => { T.X.startDive(T.state); },
  warden:   T => { T.X.startGame(SEED, { mode: "overdrive" }); T.X.spawnEnemy("warden", 3, 0.1); },
  mimic:    T => { T.X.spawnEnemy("mimic", 9, 0.1); },
  unlock:   T => { T.X.startGame(SEED, { mode: "overdrive" }); T.state.tally.wellsCleared = 5; T.X.Meta.clearEdge(); },
};
// The fact each staging must leave, so a staging that failed is a fixture red.
const FACT = {
  rotate: T => T.state.screen === "play",
  carrier: T => T.state.enemies.some(e => e instanceof T.X.Carrier),
  thorn: T => T.state.enemies.some(e => e instanceof T.X.Thorn),
  drifter: T => T.state.enemies.some(e => e instanceof T.X.Drifter),
  surger: T => T.state.enemies.some(e => e instanceof T.X.Surger),
  openWell: T => !T.X.WELLS[T.state.wellIndex].closed,
  purge: T => T.state.purgeUses >= 1,
  token: T => T.state.tokens.length > 0,
  rings: T => T.state.dive.active && T.state.dive.rings.length > 0,
  warden: T => T.state.enemies.some(e => e instanceof T.X.Warden),
  mimic: T => T.state.enemies.some(e => e instanceof T.X.Mimic),
  unlock: T => T.X.Meta.unlocks() > 0,
};

// Stages every row in table order on one profile; returns the per-row verdicts.
function stageAll(T) {
  const out = {};
  for (const id of ids(T.C)) {
    const before = T.fires.length;
    STAGE[id](T);
    const staged = FACT[id](T);
    step(T, 2);
    out[id] = { staged, fired: T.fires.slice(before) };
  }
  return out;
}

// ===========================================================================
// 1. THE TABLE — data only, ≤ 36 characters, no banned word (by eye too)
// ===========================================================================

const A = open();
{
  const { C } = A;
  for (const n of ["promptScan", "promptStep", "drawPrompt", "promptQueue", "promptReset"]) {
    H.assert(A.X[n] !== null, `the build defines ${n}`);
  }
  H.eq(J(ids(C)), J(["rotate", "carrier", "thorn", "drifter", "surger", "openWell", "purge",
                     "token", "rings", "warden", "mimic", "unlock"]),
       "⛔ C.PROMPTS is GDD 12's seven in order, then N2's rows 8–12 (Paul, 2026-09-23)");
  H.assert(C.PROMPTS.every(r => J(Object.keys(r)) === J(["id", "text"])),
           "⛔ a row is { id, text } and nothing else — no trigger, class or level in C (plan §7)");
  H.eq(C.PROMPTS[0].text, "ROTATE — FIRE DOWN THE LANE", "GDD 12's first line, verbatim");
  H.eq(C.PROMPTS[3].text, "SOLID = ARMOURED · OPEN = VULNERABLE", "GDD 12's Drifter line, verbatim");
  const long = C.PROMPTS.filter(r => r.text.length > 36);
  H.eq(J(long.map(r => r.id)), "[]", "⛔ every text is ≤ 36 characters (the band's MEASURED width)");
  // test-cs008-p6.js's list, rebuilt so this file names no banned word.
  const WORDS = ["temp" + "est", "flip" + "per", "fuse" + "ball", "pul" + "sar", "tan" + "ker",
                 "spi" + "ker", "superz" + "apper", "blas" + "ter", "w" + "eb", "ata" + "ri"];
  const hits = C.PROMPTS.filter(r => WORDS.some(w => r.text.toLowerCase().includes(w)));
  H.eq(J(hits.map(r => r.id)), "[]", "⛔ no prompt text carries a banned word, by substring");
  for (const k of ["PROMPT_Y", "PROMPT_SIZE", "PROMPT_TIME", "PROMPT_FADE"]) {
    H.assert(Number.isFinite(C[k]) && C[k] > 0, `C.${k} is a positive number`);
  }
  H.assert(/^#[0-9A-Fa-f]{6}$/.test(C.PROMPT_COLOR), "C.PROMPT_COLOR is #RRGGBB (the fade parses it)");
  H.eq(C.GAME_VERSION, "0.0.12", "⛔ C.GAME_VERSION is 0.0.12 (Paul, 2026-09-23; plan §0.1)");
}

// ===========================================================================
// 2. ⛔ EACH ROW FIRES ONCE, FROM ITS OWN TRIGGER, AND NEVER AGAIN
// ===========================================================================

const staged = stageAll(A);
for (const id of ids(A.C)) {
  const r = staged[id];
  H.assert(r.staged, `fixture: the ${id} staging left its fact on the board`);
  H.eq(J(r.fired), J([id]), `⛔ "${id}" fires exactly once, on its own trigger`);
  H.assert(A.X.Meta.promptsSeen().has(id), `⛔ and Meta marked "${id}" seen`);
}
{
  // Every trigger at once, held for 600 steps, then a RESTART with them again.
  const T = A, n = T.fires.length;
  T.X.startGame(SEED, { mode: "overdrive", startDepth: OPEN_LEVEL(T.X.WELLS) });
  for (const k of ["carrierVaulter", "thorn", "drifter", "surger", "warden", "mimic"]) T.X.spawnEnemy(k, 2, 0.05);
  step(T, 600);
  H.eq(T.fires.length, n, `⛔ no row fires twice — a restart and 600 steps of every trigger fire nothing (${J(T.fires.slice(n))})`);
  H.eq(T.X.Meta.promptsSeen().size, T.C.PROMPTS.length, "the seen set holds all twelve");
}

// ===========================================================================
// 3. THE KEY — declared, per profile, written at the four seats and no other
// ===========================================================================

{
  const store = new Map();
  const T = open({ store });
  const scope = T.X.Profiles.scope();
  let ok = true, why = "";
  try { scope.get("onboarding", null); } catch (e) { ok = false; why = e.message; }
  H.assert(ok, `⛔ \`onboarding\` is a declared key (${why})`);

  // Store.set spy (p0's scope IS the root store): every write, with the screen.
  const sets = [];
  const realSet = T.X.Store.set.bind(T.X.Store);
  T.X.Store.set = (k, v) => { sets.push({ key: k, screen: T.state.screen }); return realSet(k, v); };
  const onb = () => sets.filter(s => s.key === "onboarding");

  T.X.startGame(SEED);
  step(T, 3);
  T.X.spawnEnemy("carrierVaulter", 4, 0.1);
  step(T, 3);
  H.eq(J(T.fires), J(["rotate", "carrier"]), "fixture: two rows fired on play steps");
  H.eq(onb().length, 0, "⛔ a trigger step MARKS and writes nothing — no storage write on a bare play step");
  H.eq(store.has(NS + "onboarding"), false, "and nothing is stored yet");

  // Seat: autoPause (the page going hidden).
  T.G.input.pageHidden();
  step(T);
  H.eq(T.state.screen, "pause", "fixture: the hidden page paused the run");
  H.eq(onb().length, 1, "⛔ autoPause writes the marks");
  H.eq(J(JSON.parse(store.get(NS + "onboarding")).d), J({ seen: ["rotate", "carrier"] }), "⛔ stored as { seen: [ids] }");
  H.eq(JSON.parse(store.get(NS + "onboarding")).v, 1, "⛔ at version 1");
  T.G.input.pageHidden();
  step(T);
  H.eq(onb().length, 1, "⛔ a seat with no unsaved mark writes nothing");

  // Seat: the run's end ('quit' from pause).
  T.G.input.keyDown("p"); step(T); T.G.input.keyUp("p"); step(T);
  H.eq(T.state.screen, "play", "fixture: resumed");
  T.X.spawnEnemy("thorn", 5, 0.1);
  step(T, 2);
  T.G.input.keyDown("p"); step(T); T.G.input.keyUp("p");
  H.eq(T.state.screen, "pause", "fixture: paused again");
  T.G.quitToTitle();
  H.eq(onb().length, 2, "⛔ the run's end writes the marks");
  H.assert(JSON.parse(store.get(NS + "onboarding")).d.seen.includes("thorn"), "and they include the new one");

  // Seat: the clear edge — a play step that already writes.
  T.G.reset();
  T.X.startGame(SEED);
  T.X.spawnEnemy("drifter", 6, 0.1);
  step(T, 2);
  const before = onb().length;
  // A staged clear: the quota spent and the board empty, so the next step is
  // the edge (wellCleared(): `spawn.remaining` 0 and nothing blocking).
  T.state.enemies.length = 0;
  T.state.spawn.remaining = 0;
  step(T);
  const edge = T.state.dive.active;
  H.assert(edge, "fixture: the staged board reached the clear edge");
  H.eq(onb().length, before + 1, "⛔ the clear edge writes the marks");
  H.eq(onb().length && onb()[onb().length - 1].screen, "play", "on a play step (the one the pin exempts)");

  // Seat: kit-profile's `beforeChange`, then the incoming profile's load.
  step(T);
  T.X.spawnEnemy("surger", 7, 0.1);
  step(T, 2);
  H.assert(T.X.Meta.promptsSeen().has("surger"), "fixture: surger marked");
  const made = T.X.Profiles.create("SECOND");
  H.assert(made.ok, "fixture: a second profile");
  const b4 = onb().length;
  T.state.screen = "profilePage";           // a switch is a menu action, never a play step
  T.X.Profiles.select(made.profile.id);
  H.eq(onb().length, b4 + 1, "⛔ beforeChange writes the outgoing profile's marks");
  H.assert(JSON.parse(store.get(NS + "onboarding")).d.seen.includes("surger"), "to the OUTGOING profile's key (p0's is the root)");
  H.eq(T.X.Meta.promptsSeen().size, 0, "⛔ a new profile starts with nothing seen");

  // A new profile sees them again; a switch back sees none.
  const n = T.fires.length;
  T.G.reset();
  T.X.startGame(SEED);
  step(T, 2);
  H.eq(J(T.fires.slice(n)), J(["rotate"]), "⛔ the new profile sees the first line again");
  step(T, 3);
  T.G.input.pageHidden(); step(T);          // a seat: autoPause writes the second profile's marks
  const pid = made.profile.id;
  H.assert(store.has(`${NS}${pid}.onboarding`), "⛔ per profile: the second profile's marks under its own scope");
  T.X.Profiles.select("p0");
  H.assert(T.X.Meta.promptsSeen().has("surger") && T.X.Meta.promptsSeen().has("rotate"),
           "⛔ a switch back loads p0's marks");
  const m = T.fires.length;
  T.G.reset();
  T.X.startGame(SEED);
  T.X.spawnEnemy("carrierVaulter", 4, 0.1);
  step(T, 3);
  H.eq(J(T.fires.slice(m)), "[]", "⛔ and p0 sees none of what it saw");

  // No write anywhere else: every onboarding write was at one of the four seats.
  H.eq(J(sets.filter(s => s.key === "onboarding" && s.screen === "play").length), J(edge ? 1 : 0),
       "⛔ the only play-step write is the clear edge's");

  // ⛔ Removed with its profile, and never a root key.
  const r = T.X.Profiles.remove(pid);
  H.assert(r.ok, "fixture: the second profile deleted");
  H.eq(store.has(`${NS}${pid}.onboarding`), false, "⛔ a delete removes the profile's `onboarding` BY NAME");
  H.assert(store.has(NS + "onboarding") && store.has(NS + "profiles"), "and leaves p0's root key and the roster alone");

  // A reload over the same store: nothing fires that was seen.
  installSeed(SEED);
  const R = open({ store });
  H.eq(R.X.Meta.promptsSeen().size, JSON.parse(store.get(NS + "onboarding")).d.seen.length, "⛔ a reload loads the seen set");
  R.X.startGame(SEED);
  R.X.spawnEnemy("carrierVaulter", 4, 0.1);
  R.X.spawnEnemy("drifter", 6, 0.1);
  step(R, 3);
  H.eq(J(R.fires), "[]", "⛔ and fires none of it again");

  // Known-value-else-default: an unknown id and a junk value load as nothing.
  R.X.Profiles.scope().set("onboarding", { seen: ["rotate", "noSuchRow", 7] });
  const Y = open({ store });
  H.eq(J([...Y.X.Meta.promptsSeen()]), J(["rotate"]), "⛔ an unknown id or a non-string is dropped on load");
  Y.X.Profiles.scope().set("onboarding", "junk");
  const Z = open({ store });
  H.eq(Z.X.Meta.promptsSeen().size, 0, "⛔ a value of the wrong shape loads as nothing seen");
}

// The unlock counter is the profile's: a switch never hands it on.
{
  const T = open();
  STAGE.unlock(T);
  H.assert(T.X.Meta.unlocks() > 0, "fixture: something unlocked");
  const made = T.X.Profiles.create("THIRD");
  T.X.Profiles.select(made.profile.id);
  H.eq(T.X.Meta.unlocks(), 0, "⛔ the unlock count is reset with the seen set at a switch");
}

// A blocked store shows every prompt every session.
{
  const got = [];
  for (let s = 0; s < 2; s++) {
    const T = open({ build: { storage: "blocked" } });
    T.X.startGame(SEED);
    step(T, 2);
    T.G.input.pageHidden(); step(T);
    got.push(J(T.fires));
  }
  H.eq(J(got), J([J(["rotate"]), J(["rotate"])]), "⛔ a blocked store plays and shows the first line in every session");
}

// ===========================================================================
// 4. THE QUEUE — one line, PROMPT_TIME each, a pause holds it, a dive runs it
// ===========================================================================

{
  const T = open();
  const q = T.X.promptQueue, dt = T.C.FIXED_DT;
  T.X.startGame(SEED);
  T.X.spawnEnemy("carrierVaulter", 4, 0.1);
  T.X.spawnEnemy("thorn", 5, 0.1);
  step(T);
  H.eq(J(T.fires), J(["rotate"]), "⛔ ONE fire per step, in table order");
  step(T);
  H.eq(J(T.fires), J(["rotate", "carrier"]), "the next row on the next step");
  step(T);
  H.eq(J(q.rows.map(r => r.id)), J(["rotate", "carrier", "thorn"]), "FIFO, in trigger order");
  // The head holds for PROMPT_TIME, counted UP on play steps.
  // The head joined on step 1, AFTER that step's clock; it is aged on every
  // step from the second. ⛔ A property, never a step count (1/60 is not binary).
  let n = 3;
  while (q.rows[0] && q.rows[0].id === "rotate" && n < 1000) { step(T); n++; }
  const aged = n - 1;
  H.assert(aged * dt >= T.C.PROMPT_TIME - 1e-9 && (aged - 2) * dt < T.C.PROMPT_TIME,
           `⛔ the head leaves on the step its clock reaches PROMPT_TIME (${aged} steps of ${dt})`);
  H.eq(q.rows[0] && q.rows[0].id, "carrier", "and the next one shows");
  H.eq(q.t, 0, "from a clock of 0");
  // A pause holds it.
  step(T, 30);
  const t0 = q.t;
  T.G.input.keyDown("p"); step(T); T.G.input.keyUp("p");
  H.eq(T.state.screen, "pause", "fixture: paused");
  step(T, 120);
  H.eq(q.t, t0, "⛔ a pause holds the line's clock");
  T.G.input.keyDown("p"); step(T); T.G.input.keyUp("p");
  H.eq(T.state.screen, "play", "fixture: resumed");
  // A dive runs it on.
  T.X.startDive(T.state);
  const t1 = q.t;
  step(T, 10);
  H.assert(T.state.dive.active && q.t > t1, `⛔ a dive runs the clock on (${t1} → ${q.t})`);
  // startGame() empties the queue; a death keeps it.
  T.X.resetDive(T.state);
  T.state.invulnTime = T.C.RESPAWN_INVULN;
  const kept = q.rows.length;
  T.X.killSkimmer(T.state);
  step(T, 3);
  H.assert(T.state.skimmer.dead || T.state.lives >= 1, "fixture: a death was staged");
  H.eq(q.rows.length > 0 && q.rows.length <= kept, true, "⛔ a death keeps the queue");
  T.X.startGame(SEED);
  H.eq(q.rows.length + q.t, 0, "⛔ startGame() empties the queue");
}

// ===========================================================================
// 5. THE LINE — drawText() only, the head only, the fade, play and pause only
// ===========================================================================

{
  const T = open({ build: { spy: ["drawText"] } });
  const q = T.X.promptQueue;
  const drawn = [];
  T.X.drawText.before = (ctx, str, x, y, size, color, align) => drawn.push({ str, x, y, size, color, align });
  T.X.startGame(SEED);
  T.X.spawnEnemy("carrierVaulter", 4, 0.1);
  step(T, 2);
  const head = () => drawn.filter(d => d.y === T.C.PROMPT_Y);
  drawn.length = 0; T.G.draw();
  const h = head();
  H.eq(h.length, 1, "⛔ one line in the band — the head only");
  H.eq(h[0] && h[0].str, T.C.PROMPTS[0].text, "the head's text");
  H.assert(h[0] && h[0].x === T.C.WORLD_W / 2 && h[0].align === "center" && h[0].size === T.C.PROMPT_SIZE &&
           h[0].color === T.C.PROMPT_COLOR, "centred, at PROMPT_SIZE, in PROMPT_COLOR");
  // The fade: the last PROMPT_FADE only.
  q.t = T.C.PROMPT_TIME - T.C.PROMPT_FADE / 2;
  drawn.length = 0; T.G.draw();
  const f = head()[0];
  const a = f ? Number(/,([\d.]+)\)$/.exec(f.color)[1]) : NaN;
  H.assert(f && /^rgba\(255,255,255,/.test(f.color) && Math.abs(a - 0.5) < 0.01, `⛔ the last PROMPT_FADE fades (${f && f.color})`);
  q.t = 0;
  for (const scr of ["gameover", "title", "options", "achievements"]) {
    T.state.screen = scr;
    drawn.length = 0; T.G.draw();
    H.eq(head().length, 0, `⛔ never drawn on ${scr}`);
  }
  T.state.screen = "pause";
  drawn.length = 0; T.G.draw();
  H.eq(head().length, 1, "⛔ drawn on pause, where the board is");
  T.state.screen = "play";
}

// ⛔ The z-order: after the Dive's rungs, before the tokens, enemies and craft.
{
  const T = open({ build: { spy: ["drawPrompt", "drawDiveRungs", "drawToken", "drawVaulter", "skimmerPoints", "drawHud"] } });
  const log = [];
  for (const n of ["drawPrompt", "drawDiveRungs", "drawToken", "drawVaulter", "skimmerPoints", "drawHud"]) {
    T.X[n].before = () => log.push(n);
  }
  T.X.startGame(SEED, { mode: "overdrive" });
  step(T, 2);
  for (let i = 0; i < 500 && T.state.tokens.length === 0; i++) T.X.dropToken(T.state, { lane: 3, depth: 0.5 });
  T.X.spawnEnemy("vaulter", 6, 0.5);
  T.state.invulnTime = T.C.RESPAWN_INVULN;
  log.length = 0; T.G.draw();
  const at = n => log.indexOf(n);
  H.assert(at("drawPrompt") >= 0 && at("drawToken") > at("drawPrompt") && at("drawVaulter") > at("drawPrompt") &&
           at("skimmerPoints") > at("drawPrompt") && at("drawHud") > at("drawPrompt"),
           `⛔ the line is under the tokens, the enemies and the craft (${J(log)})`);
  T.X.startDive(T.state);
  log.length = 0; T.G.draw();
  H.assert(at("drawDiveRungs") >= 0 && at("drawPrompt") > at("drawDiveRungs"), `⛔ and over the Dive's rungs (${J(log)})`);
}

// ===========================================================================
// 6. ⛔ THE BAND — clear of the throat zone, every rim, the craft and the HUD
// ===========================================================================

{
  const X = A.X, { C, WELLS } = X;
  const w = Math.max(...C.PROMPTS.map(r => r.text.length)) * C.PROMPT_SIZE * C.TEXT_CHAR_W;
  const band = { x: C.WORLD_W / 2 - w / 2, y: C.PROMPT_Y, w, h: C.PROMPT_SIZE };
  const overlap = (r, b) => r.x < b.x1 && r.x + r.w > b.x0 && r.y < b.y1 && r.y + r.h > b.y0;
  let throat = 0, rimLow = -Infinity, craftLow = -Infinity;
  const p = { x: 0, y: 0 };
  for (const well of WELLS) {
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const hi = X.wellVertCount(well) - 1;
    for (let lane = 0; lane <= hi; lane += 0.25) {
      for (let d = 0; d < C.READABILITY_DEPTH; d += 0.01) {
        X.screenPos(well, lane, d, p);
        b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x);
        b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y);
      }
      X.screenPos(well, lane, 1, p);
      rimLow = Math.max(rimLow, p.y);
    }
    if (overlap(band, b)) throat++;
    for (let lane = 0; lane < well.lanes; lane++) {
      for (const q of X.skimmerPoints(well, lane, 0)) craftLow = Math.max(craftLow, q.y);
    }
  }
  H.eq(throat, 0, "⛔ the band clears the throat zone (depth < 0.25) on all sixteen wells");
  H.assert(rimLow < band.y, `⛔ the band is under every rim (lowest rim y ${rimLow.toFixed(2)} < ${band.y})`);
  H.assert(craftLow < band.y, `⛔ and under the grounded craft on every lane (${craftLow.toFixed(2)})`);
  // Every HUD rectangle at its widest, both mirrors, both modes' items.
  let hud = 0;
  for (const mirror of [false, true]) {
    const L = X.hudLayout({ score: 99999999, lives: C.LIVES_MAX, level: 999, levelColor: "#FFFFFF", purgeUses: 0,
                            mirror, icon: X.SKIMMER_POLY, jump: { airborne: false, ready: true, ring: 1 },
                            combo: 8, comboFill: 1, mode: "overdrive" });
    for (const k of ["score", "level", "lives", "purge", "jump", "combo"]) {
      const r = L[k];
      H.assert(r && r.w > 0 && r.h > 0, `fixture: ${k} is a real rectangle (mirror ${mirror})`);
      if (r && overlap(band, { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h })) { hud++; console.error(`band meets ${k} (mirror ${mirror})`); }
    }
  }
  H.eq(hud, 0, "⛔ the band clears every HUD rectangle at its widest, both mirrors");
}

// ===========================================================================
// 7. ⛔ THE SCAN — no draw, no clock, no `state` write, no read once all seen
// ===========================================================================

{
  const T = open();
  const { X, state } = T;
  X.startGame(SEED, { mode: "overdrive" });
  for (const k of ["carrierVaulter", "thorn", "drifter", "surger", "warden", "mimic"]) X.spawnEnemy(k, 3, 0.1);
  const well = X.WELLS[state.wellIndex];
  const snap = () => J(state, (k, v) => (typeof v === "function" ? undefined : v));
  let draws = 0, clocks = 0;
  const rng = state.rng;
  state.rng = function () { draws++; return rng.apply(this, arguments); };
  const now = Date.now, pnow = X._env.win.performance.now;
  Date.now = () => { clocks++; return now(); };
  X._env.win.performance.now = () => { clocks++; return pnow(); };
  const before = snap();
  const q = { rows: [], t: 0 };
  let fired = 0;
  for (let i = 0; i < 20; i++) { const seen = new Set(X.C.PROMPTS.slice(0, i % 12).map(r => r.id)); if (X.promptScan(state, well, seen, q)) fired++; }
  state.rng = rng;
  Date.now = now;
  X._env.win.performance.now = pnow;
  H.assert(fired > 5, `fixture: the scan fired on a busy board (${fired})`);
  H.eq(draws, 0, "⛔ the scan spends no draw");
  H.eq(clocks, 0, "⛔ the scan reads no clock");
  H.eq(snap() === before, true, "⛔ the scan writes no `state`");

  // Once every row is seen it reads nothing at all.
  let reads = 0;
  const spyOn = o => new Proxy(o, { get(t, k) { reads++; return t[k]; } });
  const all = new Set(X.C.PROMPTS.map(r => r.id));
  H.eq(X.promptScan(spyOn(state), spyOn(well), all, q), null, "all seen: nothing fires");
  H.eq(reads, 0, "⛔ and it reads no board once every row is seen");
  reads = 0;
  X.promptScan(spyOn(state), spyOn(well), new Set(["rotate"]), q);
  H.assert(reads > 0, "non-vacuity: the proxy counts a scan that has something to look for");
}

// The module's slice: no storage, no draw, no clock, no device token.
{
  const src = script();
  const i = src.indexOf("// 22-onboarding.js\n"), j = src.indexOf("// 23-main.js\n");
  H.assert(i > 0 && j > i, "fixture: the module's banner slice is found");
  const code = src.slice(i, j).split("\n").map(l => l.replace(/\/\/.*$/, "")).join("\n");
  for (const bad of ["Store", "Profiles", "scope(", "localStorage", "rng(", "Date.now", "performance", "state.time"]) {
    H.assert(!code.includes(bad), `⛔ 22-onboarding.js's code never names ${bad}`);
  }
  H.assert(/function promptScan\(/.test(code) && /state\.enemies/.test(code), "non-vacuity: the slice holds the scan");
}

// ===========================================================================
// 8. ⛔ MUTATIONS — each claim above is the code's, not the fixture's
// ===========================================================================

function mutant(from, to, run) {
  const n = script().split(from).length - 1;
  H.eq(n, 1, `⛔ fixture: the mutated string is in the build exactly once (count ${n})`);
  if (n !== 1) return null;
  try { installSeed(SEED); return run(open({ build: { mutate: [[from, to]] } })); }
  catch (e) { H.assert(false, `⛔ the mutation run threw (${e.message})`); return null; }
}
{
  const r = mutant("    if (seen.has(row.id)) continue;\n", "\n", T => {
    T.X.startGame(SEED); step(T, 4); return T.fires.filter(id => id === "rotate").length;
  });
  H.assert(r !== null && r > 1, `⛔ mutation: with the seen test out, the first line fires again (${r} fires)`);
}
{
  const r = mutant("    hooks.applySettings(Profiles.scope().get(\"settings\", null));\n    loadPrompts();\n",
                   "    hooks.applySettings(Profiles.scope().get(\"settings\", null));\n", T => {
    T.X.startGame(SEED); step(T, 2);
    const m = T.X.Profiles.create("MUT"); T.X.Profiles.select(m.profile.id);
    return T.X.Meta.promptsSeen().size;
  });
  H.assert(r !== null && r > 0, `⛔ mutation: without the load at activation, a new profile inherits the old one's marks (${r})`);
}
{
  const r = mutant('    if (typeof id === "string") Meta.promptSeen(id);',
                   '    if (typeof id === "string") { Meta.promptSeen(id); Meta.savePrompts(); }', T => {
    const sets = []; const s = T.X.Store.set.bind(T.X.Store);
    T.X.Store.set = (k, v) => { sets.push({ k, screen: T.state.screen }); return s(k, v); };
    T.X.startGame(SEED); step(T, 2);
    return sets.filter(x => x.k === "onboarding" && x.screen === "play").length;
  });
  H.assert(r !== null && r > 0, `⛔ mutation: a trigger-step write IS a play-step write, which §3's assertion rejects (${r})`);
}

// ===========================================================================
// 9. ⛔ A PLAYED CLASSIC SESSION HASHES IDENTICALLY WITH THE MODULE STUBBED
// ===========================================================================

function makeHasher(X) {
  const wells = new Map(X.WELLS.map((w, i) => [w, i]));
  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  let h = 0, seen = null;
  const mixU = v => { h = Math.imul(h ^ v, 16777619) >>> 0; };
  const num = v => { f64[0] = v; mixU(u32[0]); mixU(u32[1]); };
  const str = s => { for (let i = 0; i < s.length; i++) mixU(s.charCodeAt(i)); mixU(0x1f); };
  function walk(v) {
    switch (typeof v) {
      case "number": mixU(1); num(v); return;
      case "string": mixU(2); str(v); return;
      case "boolean": mixU(v ? 3 : 4); return;
      case "undefined": mixU(5); return;
      case "function": return;
    }
    if (v === null) { mixU(6); return; }
    if (wells.has(v)) { mixU(7); num(wells.get(v)); return; }
    if (seen.has(v)) { mixU(8); num(seen.get(v)); return; }
    seen.set(v, seen.size);
    if (Array.isArray(v)) { mixU(9); num(v.length); for (let i = 0; i < v.length; i++) walk(v[i]); return; }
    str(v.constructor ? v.constructor.name : "");
    for (const k of Object.keys(v)) { str(k); walk(v[k]); }
  }
  return () => { h = 2166136261; seen = new Map(); walk(X.state); walk([X.Game.hitStopLeft]); return h; };
}

// A mover: fire held, steer to the rim-most enemy's lane. It reads only
// `state`, so two builds with the same board press the same keys.
function session(stub) {
  installSeed(SEED);
  const store = new Map();
  const T = open({ store, build: { stub, spy: ["clearBonuses"] } });
  const { X, C, G, state } = T;
  const hash = makeHasher(X);
  const sets = [];
  let edgeFrame = false;
  X.clearBonuses.before = () => { edgeFrame = true; };
  const realSet = X.Store.set.bind(X.Store);
  X.Store.set = (k, v) => { sets.push({ k, screen: state.screen, edge: edgeFrame }); return realSet(k, v); };
  X.startGame(SEED + 1, { mode: "classic", startDepth: 9 });
  const inp = G.input, MS = C.FIXED_DT * 1000;
  inp.keyDown("z");
  let clock = 0, held = null;
  const hashes = [];
  for (let f = 0; f < 2 * 4800 && state.screen === "play"; f++) {
    edgeFrame = false;
    const well = X.WELLS[state.wellIndex], sk = state.skimmer;
    let want = null;
    if (sk && !sk.dead) {
      let best = null;
      for (const e of state.enemies) if (!e.anchored && (best === null || e.depth > best.depth)) best = e;
      if (best) { const d = X.laneDelta(well, sk.lane, best.lane); want = d > 0.4 ? "arrowright" : d < -0.4 ? "arrowleft" : null; }
    }
    if (want !== held) { if (held) inp.keyUp(held); if (want) inp.keyDown(want); held = want; }
    clock += MS / 2;
    G.frame(clock);
    hashes.push(hash());
  }
  return { T, hashes, sets, fires: T.fires, store, level: state.level };
}
{
  const work = session([]);
  const stub = session(["promptScan", "promptStep"]);
  const a = work.hashes, b = stub.hashes;
  let first = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { first = i; break; }
  H.eq(first, -1, `⛔ the whole-board hash is identical on every frame with promptScan and promptStep stubbed (${a.length} frames)`);
  H.assert(new Set(a).size > a.length / 4, "non-vacuity: the hash moves with the board");
  H.assert(work.fires.length >= 4, `non-vacuity: the working session fired prompts (${J(work.fires)})`);
  H.eq(stub.fires.length, 0, "fixture: the stubbed twin fired none");
  const stray = work.sets.filter(s => s.screen === "play" && !s.edge);
  H.eq(J(stray.map(s => s.k)), "[]", "⛔ no storage write on a played step that is not the clear edge");
  console.log(J({ frames: a.length, level: work.level, fires: work.fires,
                  onboardingWrites: work.sets.filter(s => s.k === "onboarding").map(s => s.screen + (s.edge ? "@edge" : "")) }));
}

H.report();

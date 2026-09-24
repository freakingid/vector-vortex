// test-cs018-p2.js — CS018 P2: 1.0.1 cuts OPTIONS' VOICE VOLUME row (plan §4,
// Q2-A; GDD 10.5, 11.1). A — OPTIONS is ten rows by label, no VOICE, ACHIEVEMENTS
// then BACK last, and a traversal draws every one. B — a planted 1.0.0 `settings`
// row carrying `voice: 2` loads every other field; the next save stores no
// `voice` and stays v1 (no migrate). C — on the recording audio context the
// voice bus is never moved across a traversal of every sound row, RESET TO
// DEFAULTS and Game.reset(), while MASTER is (non-vacuity). D — the 1.0.0 build,
// rebuilt as a mutant of the seven cut lines, is red on A, B and C.
// ⛔ TRAPS. 1. The cursor is moved BY LABEL (the drawMenu spy's view), never by
//     a row index: this file must not be the next one a cut re-indexes.
//  2. The fake's clock is the test's: halfFrame() writes ctx.currentTime.
//  3. The voice bus IS built — one bare `.value = 1` at unlock(), a level and
//     not a change — so "never moved" is no automation and no second set.
//  4. A title idled 20 s enters the demo; every session here is far shorter.
//  5. B's planted row binds FIRE to Q, Z, so Q is its confirm key.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20261219;
installSeed(SEED);                          // ⛔ above the first buildGame()

const NS = "coinless.vector-vortex.";
const J = JSON.stringify;
const WANT_ROWS = ["TELEMETRY", "EXPORT", "CONTROLS", "CREDITS", "MASTER VOLUME", "MUSIC VOLUME",
                   "SFX VOLUME", "MUSIC TRACK", "ACHIEVEMENTS", "BACK"];

// The 1.0.0 build: the seven lines Q2-A cut, put back (plan §1.3 V1, reversed).
const V100 = [
  ['    sfx:    { label: "SFX VOLUME",    detail: "", enabled: true, action: "adjust", adjust: "sfx" },\n',
   '    sfx:    { label: "SFX VOLUME",    detail: "", enabled: true, action: "adjust", adjust: "sfx" },\n' +
   '    voice:  { label: "VOICE VOLUME",  detail: "", enabled: true, action: "adjust", adjust: "voice" },\n'],
  ["SOUND_ROWS.master, SOUND_ROWS.music, SOUND_ROWS.sfx, SOUND_ROWS.track,",
   "SOUND_ROWS.master, SOUND_ROWS.music, SOUND_ROWS.sfx, SOUND_ROWS.voice, SOUND_ROWS.track,"],
  ['const VOL_BUSES = ["master", "music", "sfx"];', 'const VOL_BUSES = ["master", "music", "sfx", "voice"];'],
  ["sfx: C.AUDIO_VOL_DEFAULT,\n                  track: 0 };", "sfx: C.AUDIO_VOL_DEFAULT,\n                  voice: C.AUDIO_VOL_DEFAULT, track: 0 };"],
  ['    sfx:    volAdjust("sfx"),\n', '    sfx:    volAdjust("sfx"),\n    voice:  volAdjust("voice"),\n'],
  ["sound: { master: sound.master, music: sound.music, sfx: sound.sfx,",
   "sound: { master: sound.master, music: sound.music, sfx: sound.sfx, voice: sound.voice,"],
  ['for (const k of ["mouse", "touch", "master", "music", "sfx"]) {', 'for (const k of ["mouse", "touch", "master", "music", "sfx", "voice"]) {'],
];

function build(opts) {
  installSeed(SEED);
  let now = Date.UTC(2026, 8, 23);
  Date.now = () => (now += 7919);
  const X = H.buildGame(Object.assign({ store: new Map(), spy: ["drawMenu", "drawText"] }, opts || {}));
  X.view = null;
  X.texts = [];
  X.drawMenu.before = (ctx, view) => { X.view = { items: view.items.map(r => r.label), cursor: view.cursor }; };
  X.drawText.before = (ctx, str) => { X.texts.push(String(str)); };
  return X;
}

function session(X, conf) {
  const G = X.Game, A = X.AudioSys, MS = X.C.FIXED_DT * 1000;
  let clock = 0;
  const halfFrame = () => { clock += MS / 2; if (A.ctx) A.ctx.currentTime = clock / 1000; G.frame(clock); };   // trap 2
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const steps = n => { for (let i = 0; i < n; i++) liveStep(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const tap = (k, n) => { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } };
  const S = {
    steps, press,
    right: n => tap("ArrowRight", n), left: n => tap("ArrowLeft", n),
    ok: () => press(conf || " "),                      // trap 5
    boot: () => { G.frame(0); steps(2); },
    draw: () => { X.view = null; X.texts = []; G.draw(); return X.view; },
    // Trap 1: to a row by its label.
    to: label => {
      const v = S.draw(), i = v.items.indexOf(label);
      if (i < 0) throw new Error(`no row ${label} on ${X.state.screen}`);
      if (i > v.cursor) S.right(i - v.cursor); else S.left(v.cursor - i);
      const w = S.draw();
      if (w.items[w.cursor] !== label) throw new Error(`the cursor missed ${label}`);
    },
    toOptions: () => { G.quitToTitle(); steps(2); S.to("OPTIONS"); S.ok(); },
    adjust: (label, n) => { S.to(label); S.ok(); if (n > 0) S.right(n); else S.left(-n); S.ok(); },
  };
  return S;
}

// ---------------------------------------------------------------------------
// A. the ten rows
// ---------------------------------------------------------------------------

function rowsOf(X) {
  const S = session(X);
  S.boot(); S.toOptions();
  const items = S.draw().items;
  const drawn = new Set();
  for (let i = 0; i < items.length; i++) { S.draw(); X.texts.forEach(t => drawn.add(t)); S.right(1); }
  const last = S.draw();
  return { screen: X.state.screen, items, drawn, cursorEnd: last.items[last.cursor] };
}
{
  const r = rowsOf(build());
  H.eq(r.screen, "options", "A: fixture: OPTIONS from the title");
  H.eq(J(r.items), J(WANT_ROWS), "⛔ A: OPTIONS is exactly these ten rows, by label (1.0.1)");
  H.eq(r.items.length, 10, "⛔ A: ten rows, down from eleven");
  H.assert(!r.items.includes("VOICE VOLUME"), "⛔ A: no VOICE VOLUME row");
  H.eq(J(r.items.slice(-2)), J(["ACHIEVEMENTS", "BACK"]), "A: ACHIEVEMENTS, then BACK last");
  H.eq(r.items[0], "TELEMETRY", "A: TELEMETRY still first");
  const missed = WANT_ROWS.filter(l => !r.drawn.has(l));
  H.eq(J(missed), "[]", "⛔ A: a traversal of the seven-row window draws all ten rows");
  H.assert(!r.drawn.has("VOICE VOLUME"), "⛔ A: and never draws VOICE VOLUME");
  H.eq(r.cursorEnd, "BACK", "A: the traversal ends clamped on BACK");
}

// ---------------------------------------------------------------------------
// B. a 1.0.0 `settings` row loads, and the next save drops `voice`
// ---------------------------------------------------------------------------

const C0 = build().C;
const PLANT = {
  controls: { mouse: 13, touch: 7, autofire: !C0.TOUCH_AUTOFIRE, mirror: !C0.INPUT_MIRROR,
              keys: { left: ["arrowleft", "a"], right: ["arrowright", "d"], fire: ["q", "z"], purge: ["shift", "x"], jump: ["arrowup", "c"] },
              pad: { left: [14, null], right: [15, null], fire: [0, null], purge: [5, 7], jump: [2, 6] } },
  sound: { master: 7, music: 4, sfx: 9, voice: 2, track: "pulse" },
};
const LOADED = JSON.parse(J(PLANT));
delete LOADED.sound.voice;
const SAVED = JSON.parse(J(LOADED));
SAVED.sound.master = 6;

function plantedOf(X, store) {
  const held = J(X.Game.settingsHooks.settingsSnapshot());
  const S = session(X, "q");                                   // trap 5: the planted FIRE is Q, Z
  S.boot();
  S.toOptions();
  S.adjust("MASTER VOLUME", -1);
  const row = JSON.parse(store.get(NS + "settings"));
  return { held, row };
}
{
  const store = new Map([[NS + "settings", J({ v: 1, d: PLANT })]]);
  const r = plantedOf(build({ store }), store);
  H.eq(r.held, J(LOADED), "⛔ B: a 1.0.0 row with `voice: 2` loads every other field, and no `voice`");
  H.eq(r.row.v, 1, "⛔ B: the next save is still `settings` v1 (no migrate)");
  H.assert(!("voice" in r.row.d.sound), "⛔ B: and stores no `voice`");
  H.eq(J(r.row.d), J(SAVED), "B: it stores exactly the loaded row with MASTER one step down");
}

// ---------------------------------------------------------------------------
// C. the voice bus is never moved; MASTER is
// ---------------------------------------------------------------------------

function voiceOf(X) {
  const A = X.AudioSys, rec = X._audio, G = X.Game;
  const S = session(X);
  S.boot();
  A.unlock();
  S.steps(2);
  const gains = node => rec.automation.filter(a => a.node === node && a.param === "gain");
  const sets = node => rec.valueSets.filter(v => v.node === node && v.param === "gain");
  const seen = { built: J(sets(A.voice).map(v => v.v)), after: [] };
  const look = tag => seen.after.push([tag, gains(A.voice).length, sets(A.voice).length, A.vol.voice]);
  S.toOptions();
  for (const label of ["MASTER VOLUME", "MUSIC VOLUME", "SFX VOLUME", "MUSIC TRACK"]) { S.adjust(label, -2); look(label); }
  S.to("BACK"); look("BACK");
  S.to("CONTROLS"); S.ok(); S.to("RESET TO DEFAULTS"); S.ok(); look("RESET TO DEFAULTS");
  const controls = X.state.screen;
  const m0 = gains(A.master).length;
  G.reset(); look("Game.reset()");
  return { seen, controls, master: gains(A.master), masterReset: gains(A.master).slice(m0), feeds: rec.connections.filter(c => c.to === A.voice).length };
}
{
  const r = voiceOf(build({ audio: true }));
  H.eq(r.controls, "controls", "C: fixture: RESET TO DEFAULTS pressed on CONTROLS");
  H.eq(r.seen.built, "[1]", "C: the voice bus is built once, at unity (trap 3)");
  H.eq(J(r.seen.after.filter(([, g, s, v]) => g !== 0 || s !== 1 || v !== 1).map(x => x[0])), "[]",
       `⛔ C: no ramp, no second set and no level change ever reaches the voice bus (${J(r.seen.after.map(x => x[0]))})`);
  H.eq(r.seen.after.length, 7, "C: read after each of four sound rows, BACK, RESET TO DEFAULTS and Game.reset()");
  H.eq(r.feeds, 0, "C: and nothing feeds it (A3)");
  H.assert(r.master.some(a => a.fn === "linearRampToValueAtTime" && Math.abs(a.v - 0.8) < 1e-12),
           "⛔ C: non-vacuous — MASTER VOLUME two steps down ramps the master bus to 0.8");
  H.assert(r.masterReset.some(a => a.fn === "linearRampToValueAtTime" && a.v === 1),
           "⛔ C: and Game.reset() ramps the master bus back to unity");
}

// ---------------------------------------------------------------------------
// D. ⛔ the 1.0.0 build is red on A, B and C
// ---------------------------------------------------------------------------

{
  const script = H.extractScript(require("fs").readFileSync(require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
  for (const [from] of V100) H.eq(script.split(from).length - 1, 1, `D: the mutated text is in the build exactly once: ${J(from.trim().slice(0, 50))}`);
  const a = rowsOf(build({ mutate: V100 }));
  H.assert(J(a.items) !== J(WANT_ROWS) && a.items.includes("VOICE VOLUME"), "⛔ D: the 1.0.0 build is red on A (VOICE VOLUME is a row)");
  const store = new Map([[NS + "settings", J({ v: 1, d: PLANT })]]);
  const b = plantedOf(build({ store, mutate: V100 }), store);
  H.assert(b.held !== J(LOADED) && "voice" in b.row.d.sound, "⛔ D: the 1.0.0 build is red on B (it loads and stores `voice`)");
  const c = voiceOf(build({ audio: true, mutate: V100 }));
  H.assert(c.seen.after.some(([, g]) => g !== 0), "⛔ D: the 1.0.0 build is red on C (Game.reset() ramps the voice bus)");
}

H.report("test-cs018-p2.js");

// test-cs011-p2.js — CS011 P2: what a profile keeps (GDD 4.6, 10.5, 15.6; plan §4,
// R10, R11, R17). Every CONTROLS, KEYBOARD, GAMEPAD and sound row changed through
// the menus and a level cleared survive a reload; each stored field falls back
// alone; two profiles keep separate settings and records, reset before load
// (with the mutation); Game.reset() writes nothing; the capture switch is never
// stored; the ring round-trips and is rejected on a version or row-length
// mismatch; no telemetry write from a play step; nothing enumerates storage.
//
// ⛔ TRAPS.
//  1. A fresh build boots to the title: two live steps before the first press.
//  2. Rebinding FIRE 1 to Q moves the confirm key, in the reload too (`conf`).
//  3. ⛔ Never G.reset() before reading a reload: it restores the defaults.
//  4. Profile p0's scope IS X.Store, so wrapping X.Store.set sees its writes.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260918);                      // ⛔ above the first buildGame()

const NS = "coinless.vector-vortex.";
const builds = [];
function build(opts) { const X = H.buildGame(opts); builds.push(X); return X; }

// ---------------------------------------------------------------------------
// the front door
// ---------------------------------------------------------------------------

function session(X) {
  const G = X.Game, C = X.C, MS = C.FIXED_DT * 1000;
  let clock = 0;
  const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  X._env.win.navigator.getGamepads = () => [pad];
  const halfFrame = () => { clock += MS / 2; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const steps = n => { for (let i = 0; i < n; i++) liveStep(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const tap = (k, n) => { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } };
  const ctx2d = X._env.canvas.getContext("2d");
  const drawn = () => {
    const prev = ctx2d.fillText, out = [];
    ctx2d.fillText = str => out.push(String(str));
    G.draw();
    ctx2d.fillText = prev;
    return out;
  };
  const S = {
    conf: " ", steps, press, liveStep, pad, drawn,
    right: n => tap("ArrowRight", n), left: n => tap("ArrowLeft", n),
    back: () => press("Shift"),
    ok: () => press(S.conf),
    detail: label => { const t = drawn(), i = t.indexOf(label); return i < 0 ? null : t[i + 1]; },
    boot: () => { G.frame(0); steps(2); },                     // trap 1
    toOptions: () => { G.quitToTitle(); steps(2); S.right(1); S.ok(); },
    toControls: () => { S.toOptions(); S.right(2); S.ok(); },
    // Arm the row under the cursor, move it n steps (negative: left), let go.
    adjust: n => { S.ok(); if (n > 0) S.right(n); else S.left(-n); S.ok(); },
    button: i => { pad.buttons[i].pressed = true; liveStep(); steps(3); pad.buttons[i].pressed = false; liveStep(); },
  };
  return S;
}

// What the runtime holds, read through the snapshot callback Meta stores.
const held = X => X.Game.settingsHooks.settingsSnapshot();
const J = JSON.stringify;

// ---------------------------------------------------------------------------
// 1. every row through the menus, a level cleared, and a reload
// ---------------------------------------------------------------------------

const store = new Map();
const X1 = build({ store });
const { C } = X1;
const slots = m => { const o = {}; for (const a of ["left", "right", "fire", "purge", "jump"]) o[a] = [m[a][0] ?? null, m[a][1] ?? null]; return o; };
const VOL = C.AUDIO_VOL_DEFAULT;
const DEF = {
  controls: { mouse: 10, touch: 10, autofire: C.TOUCH_AUTOFIRE, mirror: C.INPUT_MIRROR,
              keys: slots(X1.INPUT_KEYS_DEFAULT), pad: slots({ fire: [0], jump: [4, 6], purge: [5, 7], left: [14], right: [15] }) },
  sound: { master: VOL, music: VOL, sfx: VOL, voice: VOL, track: "auto" },
};
const GOOD = {
  controls: { mouse: 13, touch: 7, autofire: !C.TOUCH_AUTOFIRE, mirror: !C.INPUT_MIRROR,
              keys: { left: ["arrowleft", "a"], right: ["arrowright", "d"], fire: ["q", "z"], purge: ["shift", "x"], jump: ["arrowup", "c"] },
              pad: { left: [14, null], right: [15, null], fire: [0, null], purge: [5, 7], jump: [2, 6] } },
  sound: { master: 7, music: 4, sfx: 9, voice: 2, track: "pulse" },
};
H.eq(J(held(X1)), J(DEF), "fixture: a first boot holds the shipped defaults");
H.eq(store.has(NS + "settings"), false, "⛔ and a boot stores no settings");

const S1 = session(X1);
const storedNow = () => X1.Profiles.scope().get("settings", null).controls;
S1.boot();
S1.toControls();
H.eq(X1.state.screen, "controls", "fixture: CONTROLS");
S1.adjust(3);                                   // MOUSE ×1.3
H.eq(J(X1.Profiles.scope().get("settings", null).controls.mouse), "13", "⛔ an adjust step that moved a value saves");
S1.right(1); S1.adjust(-3);                     // TOUCH ×0.7
S1.right(1); S1.ok();                           // LEFT-HANDED TOUCH
H.eq(storedNow().mirror, !C.INPUT_MIRROR, "⛔ LEFT-HANDED TOUCH saves at once");
S1.right(1); S1.ok();                           // TOUCH AUTO-FIRE
H.eq(storedNow().autofire, !C.TOUCH_AUTOFIRE, "⛔ TOUCH AUTO-FIRE saves at once");
S1.right(1); S1.ok();                           // KEYBOARD
S1.right(4); S1.ok(); S1.press("q");            // FIRE 1 ← Q
S1.conf = "q";                                  // trap 2
H.eq(J(storedNow().keys.fire), '["q","z"]', "⛔ a capture that bound saves at once");
S1.back();
S1.right(5); S1.ok();                           // GAMEPAD
H.eq(X1.state.screen, "gamepad", "fixture: GAMEPAD, confirmed with Q");
S1.right(8); S1.ok(); S1.button(2);             // JUMP 1 ← X
H.eq(J(storedNow().pad.jump), "[2,6]", "⛔ a pad capture that bound saves at once");
S1.back(); S1.back();
H.eq(X1.state.screen, "options", "fixture: back on OPTIONS");
S1.right(4); S1.adjust(-3);                     // MASTER 70%
S1.right(1); S1.adjust(-6);                     // MUSIC 40%
S1.right(1); S1.adjust(-1);                     // SFX 90%
S1.right(1); S1.adjust(-8);                     // VOICE 20%
S1.right(1); S1.adjust(1);                      // MUSIC TRACK PULSE
H.eq(J(held(X1)), J(GOOD), "fixture: every row moved off its default through the menus");
H.eq(J(store.has(NS + "settings") && JSON.parse(store.get(NS + "settings"))), J({ v: 1, d: GOOD }),
     "⛔ `settings` v1 stores the plan's shape, track by name, and no capture switch");

// The clear edge, at level 14.
X1.startGame(1, { startDepth: 14 });
X1.state.spawn.remaining = 0;
X1.state.enemies.length = 0;
X1.Game.update(C.FIXED_DT);
// ⛔ REWRITTEN IN PLACE AT CS012 P3 (O12): `progress` is v2 and PER MODE, so the
// clear edge writes the run's mode's field and carries the other through. The
// claim — that the clear edge is what writes the record — is unchanged.
H.eq(J(JSON.parse(store.get(NS + "progress") || "null")), J({ v: 2, d: { classic: 14, overdrive: 0 } }),
     "⛔ the clear edge writes `progress` v2 { classic: 14, overdrive: 0 }");

// ⛔ Game.reset() writes nothing.
{
  const before = J([...store]);
  X1.Game.reset();
  H.eq(J(held(X1)), J(DEF), "fixture: Game.reset() restored the runtime defaults");
  H.eq(J([...store]), before, "⛔ Game.reset() changes no stored byte");
}

// The reload.
const X2 = build({ store });
const S2 = session(X2);
S2.conf = "q";                                  // trap 2: the binding is loaded
S2.boot();
H.eq(J(held(X2)), J(GOOD), "⛔ a reload holds every setting");
H.eq(X2.Game.input.setting("mouseSens"), C.MOUSE_SENS * (13 / 10), "⛔ the kit's mouse factor is ×1.3");
H.eq(J(X2.Game.input.getBindings().fire), '["q","z"]', "⛔ the kit's fire keys are Q, Z");
H.eq(J(X2.Game.input.getGamepadButtons().jump), "[2,6]", "⛔ the kit's jump buttons are X, LT");
S2.toControls();
H.eq(X2.state.screen, "controls", "⛔ Q confirms in the reload");
H.eq(S2.detail("MOUSE SENSITIVITY"), "×1.3", "row: MOUSE SENSITIVITY ×1.3");
H.eq(S2.detail("TOUCH SENSITIVITY"), "×0.7", "row: TOUCH SENSITIVITY ×0.7");
H.eq(S2.detail("LEFT-HANDED TOUCH"), C.INPUT_MIRROR ? "OFF" : "ON", "row: LEFT-HANDED TOUCH");
H.eq(S2.detail("TOUCH AUTO-FIRE"), C.TOUCH_AUTOFIRE ? "OFF" : "ON", "row: TOUCH AUTO-FIRE");
S2.right(4); S2.ok();
H.eq(S2.detail("FIRE 1"), "Q", "row: KEYBOARD FIRE 1 is Q");
S2.back(); S2.right(5); S2.ok(); S2.right(8);
H.eq(S2.detail("JUMP 1"), "X", "row: GAMEPAD JUMP 1 is X");
S2.back(); S2.back(); S2.right(8);
for (const [label, want] of [["MASTER VOLUME", "70%"], ["MUSIC VOLUME", "40%"], ["SFX VOLUME", "90%"],
                             ["VOICE VOLUME", "20%"], ["MUSIC TRACK", "PULSE"]]) {
  H.eq(S2.detail(label), want, `row: ${label} ${want}`);
}
H.eq(J(X2.startDepthOptions("classic")), J([1, 3, 5, 7, 9, 11, 13]), "⛔ a reload's Start Depth list reaches 13");
// ⛔ REPAIRED IN PLACE AT CS012 P3 (O9): OVERDRIVE is MODE's first row, and the
// record above is CLASSIC's, so the one step down is what restores the screen
// this assertion was always about.
S2.back(); S2.back(); S2.ok(); S2.right(1); S2.ok();
H.eq(X2.state.screen, "depth", "fixture: START DEPTH in the reload, through CLASSIC");
S2.right(10);
H.assert(S2.drawn().includes("LEVEL 13") && !S2.drawn().includes("LEVEL 15"), "⛔ and the screen shows LEVEL 13 last");

// ---------------------------------------------------------------------------
// 2. each field, planted invalid, loads its default alone
// ---------------------------------------------------------------------------

const DEL = Symbol("delete");
const clone = o => JSON.parse(J(o));
function at(obj, path, value) {
  const keys = path.split("."), last = keys.pop();
  let o = obj;
  for (const k of keys) o = o[k];
  if (value === DEL) delete o[last]; else o[last] = value;
}
function plantAndLoad(d) {
  const m = new Map([[NS + "settings", J({ v: 1, d })]]);
  return build({ store: m });
}
const CASES = [
  ["controls.mouse", 21, "above SENS_HI"], ["controls.mouse", 4, "below SENS_LO"], ["controls.mouse", 13.5, "not whole"],
  ["controls.mouse", "13", "a string"], ["controls.mouse", DEL, "missing"],
  ["controls.touch", 21, "above SENS_HI"], ["controls.touch", null, "null"],
  ["controls.autofire", "true", "a string"], ["controls.autofire", DEL, "missing"], ["controls.mirror", 1, "a number"],
  ["sound.master", 11, "above AUDIO_VOL_STEPS"], ["sound.music", -1, "negative"], ["sound.sfx", "9", "a string"],
  ["sound.voice", 2.5, "not whole"], ["sound.voice", DEL, "missing"],
  // ⛔ REPAIRED IN PLACE (CS012 P1): this planted "drive", which CS012 R10 made a
  // choice. "title" names a track and is never a MUSIC TRACK choice.
  ["sound.track", "title", "not a choice"], ["sound.track", 1, "an index"], ["sound.track", DEL, "missing"],
  ["controls.keys", DEL, "missing"], ["controls.keys", "wasd", "a string"],
  ["controls.keys.fire", ["p", "z"], "a reserved key (pause)"], ["controls.keys.fire", ["7", "z"], "a digit"],
  ["controls.keys.fire", ["a", "z"], "a duplicate (LEFT's A)"], ["controls.keys.jump", [null, null], "an unbound action"],
  ["controls.keys.fire", ["Q", "z"], "an uppercase key"], ["controls.keys.fire", ["q", "z", "x"], "three slots"],
  ["controls.keys.fire", [5, "z"], "a number"], ["controls.keys.fire", ["gamepadleft", "z"], "a key the kit refuses"],
  ["controls.pad", DEL, "missing"], ["controls.pad.fire", [C.GAMEPAD_PAUSE_BUTTON, null], "Start"],
  ["controls.pad.fire", [2, null], "a duplicate (JUMP's X)"], ["controls.pad.left", [null, null], "an unbound action"],
  ["controls.pad.fire", [-1, null], "negative"], ["controls.pad.fire", [0.5, null], "not whole"],
  ["controls.pad.fire", ["0", null], "a string"],
];
for (const [path, value, why] of CASES) {
  const d = clone(GOOD);
  at(d, path, value);
  const field = path.split(".").slice(0, 2).join(".");
  const want = clone(GOOD);
  at(want, field, field.split(".").reduce((o, k) => o[k], DEF));
  const X = plantAndLoad(d);
  H.eq(J(held(X)), J(want), `⛔ ${path} ${why}: ${field} loads its default, every other field its stored value`);
  if (field === "controls.keys") {
    H.eq(J(X.Game.input.getBindings().fire), J(X.INPUT_KEYS_DEFAULT.fire), `  and the kit's keyboard map is the default`);
  }
  if (field === "controls.pad") {
    H.eq(J(X.Game.input.getGamepadButtons().jump), "[4,6]", `  and the kit's pad map is the default`);
  }
}
H.eq(J(held(plantAndLoad("garbage"))), J(DEF), "a stored value that is not an object loads every default");
{
  const d = clone(GOOD); delete d.controls;
  H.eq(J(held(plantAndLoad(d))), J({ controls: DEF.controls, sound: GOOD.sound }), "no `controls`: the controls default, the sound loads");
}
H.eq(J(held(plantAndLoad(GOOD))), J(GOOD), "non-vacuous: the unplanted value loads whole");
{
  // ⛔ REPAIRED IN PLACE AT CS012 P3 (O12): planted at the DECLARED version, so
  // this stays the read path's claim and not the new migrate's.
  const m = new Map([[NS + "progress", J({ v: 2, d: { classic: "14", overdrive: 3.5 } })]]);
  H.eq(build({ store: m }).levelRecord("classic").highestCleared(), 0, "⛔ a `progress` record that is not a whole number reads 0");
}

// ---------------------------------------------------------------------------
// 3. two profiles, and ⛔ reset before load
// ---------------------------------------------------------------------------

const ROSTER = J({ v: 1, d: { lastUsed: "p0", seq: 2, profiles: [
  { id: "p0", name: "ANONYMOUS", created: 1, playerId: null }, { id: "p1", name: "SECOND", created: 2, playerId: null }] } });

// p0 sets MUSIC VOLUME 40% through OPTIONS, then the switch to p1.
function musicThenSwitch(X) {
  const S = session(X);
  S.boot(); S.toOptions(); S.right(5); S.adjust(-6);
  X.Profiles.select("p1");
  return S;
}

const P = new Map([[NS + "profiles", ROSTER]]);
const XP = build({ store: P });
const SP = musicThenSwitch(XP);
XP.levelRecord("classic").noteCleared(14);
H.eq(XP.Profiles.current().id, "p1", "fixture: p1 selected");
H.eq(held(XP).sound.music, VOL, "⛔ reset before load: p1, which never set MUSIC VOLUME, hears the default");
H.eq(XP.Profiles.scope().has("settings"), false, "⛔ and the switch stored nothing for p1");
SP.toControls(); SP.adjust(3);                               // p1: MOUSE ×1.3
XP.levelRecord("classic").noteCleared(30);
const read = k => { const s = P.get(k); return s === undefined ? null : JSON.parse(s).d; };
H.eq(J([read(NS + "settings").sound.music, read(NS + "settings").controls.mouse]), "[4,10]",
     "⛔ p0's settings are at coinless.vector-vortex.settings (music 40%, mouse ×1.0)");
H.eq(J([read(NS + "p1.settings").sound.music, read(NS + "p1.settings").controls.mouse]), "[10,13]",
     "⛔ p1's are at coinless.vector-vortex.p1.settings (music 100%, mouse ×1.3)");
H.eq(read(NS + "progress"), null, "p0 cleared nothing");
H.eq(read(NS + "p1.progress").classic, 30, "⛔ p1's record is at coinless.vector-vortex.p1.progress");
H.eq(XP.startDepthOptions("classic").pop(), 29, "p1's Start Depth list reaches 29");
XP.Profiles.select("p0");
H.eq(J([held(XP).sound.music, held(XP).controls.mouse]), "[4,10]", "⛔ back to p0: its music, and the default mouse");
H.eq(XP.startDepthOptions("classic").pop(), 9, "⛔ a change of profile changes the Start Depth list");
XP.Profiles.select("p1");
H.eq(J([held(XP).sound.music, held(XP).controls.mouse]), "[10,13]", "⛔ and to p1 again: its own");
{
  const before = J([...P]);
  XP.Game.reset();
  H.eq(held(XP).controls.mouse, 10, "fixture: Game.reset() on p1 restored the defaults");
  H.eq(J([...P]), before, "⛔ Game.reset() changes no stored byte on p1 either");
}

// Telemetry across a switch: the outgoing rows are written first, and the ring is
// the incoming profile's.
{
  const TP = new Map([[NS + "profiles", ROSTER]]);
  const X = build({ store: TP });
  X.Telemetry.setEnabled(true);
  X.Telemetry.push(X.state);
  X.Profiles.select("p1");
  H.eq(TP.has(NS + "telemetry") && JSON.parse(TP.get(NS + "telemetry")).d.rows.length, 1,
       "⛔ a switch writes the outgoing profile's rows first (beforeChange)");
  H.eq(X.Telemetry.count, 0, "and the incoming profile starts from its own (empty) rows");
  X.Profiles.select("p0");
  H.eq(X.Telemetry.count, 1, "back to p0 with capture on: its rows are read back");
}

// ⛔ MUTATION: load without the reset first.
const XM = build({ store: new Map([[NS + "profiles", ROSTER]]), mutate: [["hooks.resetSettings();", ""]] });
musicThenSwitch(XM);
H.eq(XM.Profiles.current().id, "p1", "fixture (mutant): p1 selected");
H.eq(held(XM).sound.music, 4, "⛔ mutation: no reset before load bleeds p0's MUSIC VOLUME onto p1 (the assertion above is red)");

// ---------------------------------------------------------------------------
// 4. telemetry: the switch, the seats, the round trip, the rejections
// ---------------------------------------------------------------------------

const quiet = f => { const log = console.log; console.log = () => {}; try { return f(); } finally { console.log = log; } };

// Capture on through OPTIONS, a played run, `t` off in play, then the page hidden.
function capturedRun(X) {
  const S = session(X);
  const sets = [];
  const realSet = X.Store.set;                                // trap 4
  X.Store.set = (k, v) => { if (k === "telemetry") sets.push(X.state.screen); return realSet(k, v); };
  quiet(() => {
    S.boot(); S.toOptions(); S.ok();
    H.eq(X.Telemetry.enabled(), true, "fixture: TELEMETRY on through OPTIONS");
    S.back(); S.ok(); S.ok(); S.ok();
    H.eq(X.state.screen, "play", "fixture: a run from the front door");
    X.state.lives = 9;
    S.steps(1200);
    H.eq(X.state.screen, "play", "fixture: still playing after the passive stretch");
    S.press("t");
    X.Game.input.pageHidden(); S.liveStep();
  });
  return { sets, S };
}

const TS = new Map();
const X3 = build({ store: TS });
const run3 = capturedRun(X3);
const rows3 = J(X3.Telemetry.rows());
H.assert(X3.Telemetry.count > 30, `fixture: the run recorded rows (${X3.Telemetry.count})`);
H.eq(X3.Telemetry.enabled(), false, "fixture: `t` turned capture off in play");
H.eq(X3.state.screen, "pause", "fixture: the hidden page paused the run");
H.eq(run3.sets.filter(s => s === "play").length, 0, "⛔ no telemetry write from a play step, `t` off included");
H.eq(J(run3.sets), '["pause"]', "⛔ exactly one telemetry write: the autoPause seat, on the pause step");
H.assert(TS.has(NS + "telemetry"), "and it is stored under the profile");

// ⛔ MUTATION: a capture turned off in play writes at once.
const XT = build({ mutate: [['if (!on && state.screen !== "play") Meta.saveTelemetry();', "if (!on) Meta.saveTelemetry();"]] });
H.assert(capturedRun(XT).sets.includes("play"), "⛔ mutation: `t` off writing at once is a write from a play step (the assertion above is red)");

// The round trip, read by EXPORT on an empty ring.
const X4 = build({ store: TS });
H.eq(X4.Telemetry.enabled(), false, "a reload boots with capture off");
H.eq(X4.Telemetry.count, 0, "⛔ and reads no rows at boot (lazy)");
const S4 = session(X4);
S4.boot(); S4.toOptions(); S4.right(1);
quiet(() => S4.ok());
H.eq(J(X4.Telemetry.rows()), rows3, "⛔ EXPORT on an empty ring reads the stored rows back, exactly");
H.eq(Array.isArray(JSON.parse(TS.get(NS + "telemetry")).d.rows[0]), true, "⛔ stored as arrays");
H.eq(JSON.parse(TS.get(NS + "telemetry")).d.rows[0].length, X4.TELEMETRY_FIELDS.length, "in TELEMETRY_FIELDS' length");

// Capture on with an empty ring reads too, and a reload turns it off again.
const X5 = build({ store: TS });
const S5 = session(X5);
S5.boot(); S5.toOptions();
quiet(() => S5.ok());
H.eq(X5.Telemetry.enabled(), true, "fixture: capture on in X5");
H.eq(J(X5.Telemetry.rows()), rows3, "⛔ capture turned on with an empty ring reads the stored rows");
quiet(() => S5.ok());                                         // off, on OPTIONS: a write
H.eq(JSON.parse(TS.get(NS + "telemetry")).d.rows.length, X3.Telemetry.count, "capture turned off on OPTIONS writes the ring");
quiet(() => S5.ok());                                         // on again, and left on
H.eq(X5.Telemetry.enabled(), true, "fixture: X5 left capture ON");
const X6 = build({ store: TS });
H.eq(X6.Telemetry.enabled(), false, "⛔ capture on, then a reload: capture is off");

// The rejections, each against the same stored rows.
function exportFrom(envelope) {
  const X = build({ store: new Map([[NS + "telemetry", J(envelope)]]) });
  const S = session(X);
  S.boot(); S.toOptions(); S.right(1);
  quiet(() => S.ok());
  return X.Telemetry.count;
}
const stored = JSON.parse(TS.get(NS + "telemetry"));
H.eq(exportFrom(stored), X3.Telemetry.count, "non-vacuous: the stored envelope restores in a fresh store");
H.eq(exportFrom(Object.assign(clone(stored), { v: 2 })), 0, "⛔ a stored `v` of 2 restores empty");
{
  const short = clone(stored);
  short.d.rows[5].pop();
  H.eq(exportFrom(short), 0, "⛔ one row a column short restores empty");
}

// ---------------------------------------------------------------------------
// 5. ⛔ nothing enumerated storage
// ---------------------------------------------------------------------------

H.eq(builds.map(X => X._env.storageReads).reduce((a, b) => a + b, 0), 0,
     `⛔ _env.storageReads is 0 across all ${builds.length} builds`);

H.report("test-cs011-p2.js");

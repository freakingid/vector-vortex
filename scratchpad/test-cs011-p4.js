// test-cs011-p4.js — CS011 P4: kit-input 0.8.0's text mode, PROFILE, a profile's
// page, DELETE and NAME (GDD 9.5, 10.5, 15.2; plan §6, R12–R14, R16). The text
// mode's keys reach no binding, struct field or named action (with the
// never-armed mutation, in the kit and in the game); a capture and a text mode
// never arm together; a name spelled by the wheel on keys and on a pad, and one
// typed; the kit's reasons; RENAME keeps playerId; SELECT runs P2's activation;
// deleting the active profile, the last one and `p0` (with the clear() and
// R12-order mutations); every drawn line of the new screens fits WORLD_W.
//
// ⛔ TRAPS.
//  1. A fresh build boots to the title: two live steps before the first press.
//  2. The text mode arms at the first step ON NAME, so every driver presses
//     after the step that opened it (press() already spends two).
//  3. Space and Z are text keys on NAME, so the keyboard wheel needs a Fire key
//     outside [a-z0-9 _-]: the fixture rebinds one to ArrowDown.
//  4. The mutants' `from` texts must each be in the build exactly once.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

installSeed(20260920);                      // ⛔ above the first buildGame()

const ROOT = path.join(__dirname, "..");
const NS = "coinless.vector-vortex.";
const J = JSON.stringify;
const DT = 1 / 60;
const TYPED = "adzxc 1wtep";
const ARM = 'input.captureText(state.screen === "profileName" ? onNameText : null);';
const REMOVE_KEYS = "for (const key of OWN_KEYS) scope.remove(key);";
const KIT_FIRST = `      const r = kit.remove(id);
      if (r.ok) {
        const scope = kit.scope(id);
        for (const key of OWN_KEYS) scope.remove(key);
      }
      return r;`;
const KEYS_FIRST = `      for (const key of OWN_KEYS) kit.scope(id).remove(key);
      return kit.remove(id);`;

// ---------------------------------------------------------------------------
// the builds and a driver
// ---------------------------------------------------------------------------

const builds = [];
function build(opts) {
  const X = H.buildGame(Object.assign({ spy: ["drawMenu", "spawnEnemy"] }, opts || {}));
  if (!(opts && opts.enumerates)) builds.push(X);
  X.view = null;
  X.drawMenu.before = (ctx, v) => {
    X.view = { title: v.title, lines: v.lines.slice(), cursor: v.cursor,
               items: v.items.map(r => ({ label: r.label, detail: r.detail, enabled: r.enabled })) };
  };
  return X;
}

function session(X) {
  const G = X.Game, C = X.C, MS = C.FIXED_DT * 1000;
  let clock = 0;
  const halfFrame = () => { clock += MS / 2; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const steps = n => { for (let i = 0; i < n; i++) liveStep(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const tap = (k, n) => { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } };
  const S = {
    X, G, C, st: X.state, steps, press, liveStep,
    right: n => tap("ArrowRight", n),
    left: n => tap("ArrowLeft", n),
    ok: () => press(" "),
    boot: () => { G.frame(0); steps(2); },                           // trap 1
    draw: () => { X.view = null; G.draw(); return X.view; },
    type: str => { for (const ch of str) press(ch); },
    toProfile: () => { S.right(3); S.ok(); },                        // title → PROFILE
    toNew: () => { S.right(X.Profiles.list().length); S.ok(); },     // → NAME, as NEW
    toPage: i => { S.right(i); S.ok(); },                            // → roster row i's page
    // The wheel's shown entry, read off NAME's second line.
    // -1 off NAME, so a driver that lost the page stops instead of throwing.
    wheel: () => {
      const v = S.draw(), line = v && X.state.screen === "profileName" ? v.lines[1] : null;
      if (typeof line !== "string") return -1;
      const s = line.slice(2, -2);
      return C.NAME_WHEEL.indexOf(s === "SPACE" ? " " : s);
    },
    // The shortest way round to entry `i`, one step per call of r() or l().
    wheelTo: (i, r, l) => {
      const at = S.wheel();
      if (at < 0) return;
      const n = C.NAME_WHEEL.length, d = ((i - at) % n + n) % n;
      for (let k = 0; k < (d <= n / 2 ? d : n - d); k++) (d <= n / 2 ? r : l)();
    },
  };
  return S;
}

function quiet(fn) {
  const log = console.log, lines = [];
  console.log = s => lines.push(String(s));
  try { fn(); } finally { console.log = log; }
  return lines;
}

// ---------------------------------------------------------------------------
// 0. the surface
// ---------------------------------------------------------------------------

{
  const X = build(), C = X.C;
  H.eq(X.Game.input.VERSION, "0.8.0", "kit-input is 0.8.0");
  H.eq(typeof X.Game.input.captureText, "function", "kit-input exposes captureText()");
  H.assert(/### 2026-09-16 — a text mode \(`VERSION` 0\.7\.0 → 0\.8\.0\)/
             .test(fs.readFileSync(path.join(ROOT, "src", "04-input.NOTES.md"), "utf8")),
           "src/04-input.NOTES.md carries the 0.8.0 entry");
  hasKnob(X, "NOTICE_WRAP", { def: 60 }, H);
  H.eq(J(C.NAME_WHEEL), J("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-".split("").concat(["DEL", "END"])),
       "C.NAME_WHEEL: A–Z, 0–9, space, _, -, then DEL and END");
  H.assert(C.NAME_WHEEL.filter(e => e.length === 1).every(e => X.KitNames.validateName("A" + e + "A").ok),
           "every character on the wheel is in kit-names' charset");
  H.eq(J(X.Profiles.NAME_CHANGE_NOTICE), J(X.KitProfile.NAME_CHANGE_NOTICE), "NAME's notice is kit-profile's");
}

// ---------------------------------------------------------------------------
// 1. the text mode, in the kit
// ---------------------------------------------------------------------------

const ACTIONS = { back: ["escape"], pause: ["p"], cycleWell: ["w"], spawnVaulter: ["1"],
                  telemetryToggle: ["t"], telemetryExport: ["e"] };
function kit(X, extra) {
  const C = X.C;
  return X.createInput(Object.assign({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS, keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX,
    keyRamp: C.KEY_RAMP, touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC, touchAutofire: C.TOUCH_AUTOFIRE,
    touchButtonR: C.TOUCH_BUTTON_R, gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: C.INPUT_MIRROR, worldW: C.WORLD_W, worldH: C.WORLD_H,
  }, extra));
}

// Each key pressed and released, sampled after both; what reached cb, the named
// actions and the struct.
function typeKit(X, armed) {
  const got = [], acted = [], fields = new Set();
  const k = kit(X, { actionKeys: ACTIONS, onAction: n => acted.push(n) });
  if (armed) k.captureText(r => got.push(r));
  const look = s => { if (s.rotate !== 0) fields.add("rotate"); for (const f of ["fire", "purge", "jump"]) if (s[f]) fields.add(f); };
  for (const key of [...TYPED, "Shift", "Backspace", "Enter"]) {
    k.keyDown(key); look(k.sample(DT));
    k.keyUp(key); look(k.sample(DT));
  }
  return { got, acted, fields: [...fields].sort() };
}

{
  const X = builds[0];
  const r = typeKit(X, true);
  H.eq(J(r.got), J([...TYPED].map(ch => ({ ch })).concat([{ del: true }, { done: true }])),
       "⛔ armed: each character is { ch }, Backspace { del }, Enter { done }, in press order");
  H.eq(J(r.acted), "[]", "⛔ armed: `adzxc 1wtep`, Shift, Backspace and Enter dispatch no named action");
  H.eq(J(r.fields), "[]", "⛔ armed: and move no struct field");
  const m = typeKit(X, false);
  H.eq(J(m.acted), J(["spawnVaulter", "cycleWell", "telemetryToggle", "telemetryExport", "pause"]),
       "⛔ MUTATION: never armed, the same keys dispatch the bench, the well, telemetry and pause");
  H.eq(J(m.fields), J(["fire", "jump", "purge", "rotate"]), "⛔ MUTATION: never armed, they move all four fields");

  const got = [], acted = [], cap = [];
  const k = kit(X, { actionKeys: ACTIONS, onAction: n => acted.push(n) });
  k.keyDown("z"); k.sample(DT);                                      // held before the mode arms
  k.captureText(r => got.push(r));
  k.keyDown("z");                                                    // its auto-repeat
  H.eq(J([k.sample(DT).fire, got.length]), "[true,0]", "a key held before arming is not typed and still fires");
  k.keyUp("z"); k.sample(DT);
  k.keyDown("Shift"); k.keyDown("A");
  H.eq(got.length, 0, "the text is handed over in sample(), not at event time");
  const s = k.sample(DT);
  H.eq(J([got, s.purge]), J([[{ ch: "a" }], false]), "⛔ Shift+A is { ch: \"a\" }, and Shift holds no purge");
  k.keyDown("A"); k.sample(DT);
  H.eq(got.length, 1, "a typed key's auto-repeat is swallowed");
  k.keyUp("A"); k.keyUp("Shift");
  k.keyDown("ArrowRight"); k.sample(DT); k.keyUp("ArrowRight");
  H.assert(k.sample(DT).rotate > 0 && got.length === 1, "arrows still rotate, and type nothing");
  k.keyDown("gamepadright"); k.sample(DT); k.keyUp("gamepadright");
  H.assert(k.sample(DT).rotate > 0 && got.length === 1, "the D-pad's synthetic keys still rotate");
  k.keyDown("Escape"); k.sample(DT); k.keyUp("Escape");
  H.eq(J(acted), J(["back"]), "Escape is still its named action");
  k.reset(); k.keyDown("s"); k.sample(DT); k.keyUp("s");
  H.eq(got.length, 2, "the mode survives reset()");
  k.keyDown("r"); k.captureText(r => got.push(r)); k.sample(DT); k.keyUp("r");
  H.eq(got.length, 2, "re-arming drops a key not yet dispatched");
  k.keyDown("r"); k.captureText(null); k.sample(DT); k.keyUp("r");
  H.eq(got.length, 2, "captureText(null) drops one too");
  k.keyDown("z"); H.eq(k.sample(DT).fire, true, "and ends the mode: z fires again"); k.keyUp("z"); k.sample(DT);

  // ⛔ a capture and a text mode never arm together
  k.captureNext(r => cap.push(r)); k.captureText(r => got.push(r));
  k.keyDown("q"); k.sample(DT); k.keyUp("q");
  H.eq(J([cap.length, got[got.length - 1]]), J([0, { ch: "q" }]), "⛔ arming the text mode disarms a capture");
  k.captureNext(r => cap.push(r));
  k.keyDown("m"); k.sample(DT); k.keyUp("m");
  H.eq(J([cap, got.length]), J([[{ key: "m" }], 3]), "⛔ arming a capture ends the text mode");
  k.keyDown("z"); H.eq(k.sample(DT).fire, true, "and z fires after it"); k.keyUp("z"); k.sample(DT);
  k.captureNext(r => cap.push(r)); k.keyDown("k"); k.captureText(r => got.push(r)); k.sample(DT); k.keyUp("k");
  H.eq(J([cap.length, got.length]), "[1,3]", "arming the text mode drops a capture's undispatched result");
  let threw = false;
  try { k.captureText("x"); } catch (err) { threw = true; }
  H.assert(threw, "captureText() throws on a cb that is not a function or null");
}

// ---------------------------------------------------------------------------
// 2. ⛔ typing `adzxc 1wtep` on NAME, in the game
// ---------------------------------------------------------------------------

function typeOnName(X) {
  const S = session(X), st = X.state;
  S.boot();
  S.toProfile();
  S.toNew();
  X.enterWell();                                                     // fixture: a craft, so a bench digit could spawn
  const well0 = st.wellIndex, spawns0 = X.spawnEnemy.calls, fields = new Set();
  const look = () => { const i = st.input; if (i.rotate !== 0) fields.add("rotate"); for (const f of ["fire", "purge", "jump"]) if (i[f]) fields.add(f); };
  const logs = quiet(() => {
    for (const key of TYPED) {
      X.Game.input.keyDown(key); S.liveStep(); look(); S.liveStep(); look();
      X.Game.input.keyUp(key); S.liveStep(); look();
    }
  });
  return { S, fields: [...fields].sort(), spawns: X.spawnEnemy.calls - spawns0, cycled: st.wellIndex !== well0,
           telemetry: X.Telemetry.enabled(), logs: logs.length, screen: st.screen, line: S.draw().lines[0] };
}

{
  const X = build();
  const r = typeOnName(X);
  H.eq(r.screen, "profileName", "fixture: NAME is open, and stays open");
  H.eq(r.line, "ADZXC 1WTEP|", "⛔ the keys are typed");
  H.eq(J(r.fields), "[]", "⛔ and change no struct field");
  H.eq(J([r.spawns, r.cycled, r.telemetry, r.logs]), J([0, false, false, 0]),
       "⛔ spawn nothing, cycle no well, toggle no telemetry, export nothing");
  r.S.press("Enter");
  H.eq(J([X.state.screen, X.Profiles.current().name]), J(["profile", "ADZXC 1WTEP"]), "and Enter commits them");
}
{
  const X = build({ mutate: [[ARM, "input.captureText(null);"]] });
  const r = typeOnName(X);
  H.eq(J(r.fields), J(["fire", "jump", "purge", "rotate"]), "⛔ MUTATION: text mode never armed, the keys move the struct");
  H.assert(r.spawns > 0 && r.cycled && r.telemetry && r.logs > 0,
           `⛔ MUTATION: and spawn (${r.spawns}), cycle the well (${r.cycled}), toggle and export telemetry (${r.telemetry}, ${r.logs})`);
}

// ---------------------------------------------------------------------------
// 3. a name by the wheel alone — keys, then a pad — and one typed
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), C = X.C;
  S.boot();
  S.toProfile();
  S.toNew();
  let v = S.draw();
  H.eq(J([v.title, v.lines, v.items]), J(["NEW PROFILE", ["|", "‹ A ›", ""], []]),
       "⛔ NAME: no rows; an empty name with its cursor mark, the wheel on A, an empty reason");
  X.Game.input.setBindings({ left: ["arrowleft", "a"], right: ["arrowright", "d"], fire: [" ", "arrowdown"],
                             purge: ["shift", "x"], jump: ["arrowup", "c"] });   // trap 3
  const fire = () => S.press("ArrowDown");
  const r = () => S.right(1), l = () => S.left(1);
  S.left(1);
  H.eq(S.draw().lines[1], "‹ END ›", "the wheel wraps: left of A is END");
  S.right(1);
  for (const ch of "B2X") { S.wheelTo(C.NAME_WHEEL.indexOf(ch), r, l); fire(); }
  H.eq(S.draw().lines[0], "B2X|", "⛔ keys: rotate and fire spell B2X");
  S.wheelTo(C.NAME_WHEEL.indexOf("DEL"), r, l); fire();
  H.eq(S.draw().lines[0], "B2|", "Fire on DEL deletes");
  S.wheelTo(C.NAME_WHEEL.indexOf("-"), r, l); fire();
  S.wheelTo(C.NAME_WHEEL.indexOf("END"), r, l); fire();
  H.eq(J([X.state.screen, X.Profiles.current().name]), J(["profile", "B2-"]),
       "⛔ Fire on END commits: B2- is created, activated, and PROFILE shows");
  H.eq(J(S.draw().items.map(i => [i.label, i.detail])),
       J([["ANONYMOUS", ""], ["B2-", "ACTIVE"], ["NEW PROFILE", ""], ["BACK", ""]]), "PROFILE's rows, ACTIVE on the new one");
}
{
  const X = build(), S = session(X), C = X.C;
  const pad = { axes: [0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  X._env.win.navigator.getGamepads = () => [pad];
  const button = i => { pad.buttons[i].pressed = true; S.steps(2); pad.buttons[i].pressed = false; S.liveStep(); };
  const r = () => button(15), l = () => button(14), fire = () => button(0), purge = () => button(5);
  S.boot();
  S.toProfile();
  S.toNew();
  purge();
  H.eq(X.state.screen, "profile", "⛔ pad: Purge on an empty name cancels to PROFILE");
  // A Purge that lands on NAME's entry step is latched, as a menu's entry step latches it.
  S.right(1);
  X.Game.input.keyDown(" "); S.liveStep(); X.Game.input.keyUp(" ");
  H.eq(X.state.screen, "profileName", "fixture: NEW PROFILE opened NAME on that step");
  pad.buttons[5].pressed = true; S.liveStep();
  H.eq(X.state.screen, "profileName", "⛔ a Purge pressed on NAME's entry step does not cancel it");
  pad.buttons[5].pressed = false; S.liveStep();
  purge();
  H.eq(X.state.screen, "profile", "and a fresh Purge does");
  S.toNew();
  S.wheelTo(C.NAME_WHEEL.indexOf("9"), r, l); fire();
  S.wheelTo(C.NAME_WHEEL.indexOf(" "), r, l);
  H.eq(S.draw().lines[1], "‹ SPACE ›", "the wheel shows space as SPACE");
  fire();
  S.wheelTo(C.NAME_WHEEL.indexOf("Z"), r, l); fire();
  H.eq(S.draw().lines[0], "9 Z|", "⛔ pad: the D-pad and A spell 9 Z");
  purge();
  H.eq(S.draw().lines[0], "9 |", "⛔ Purge deletes");
  fire();
  S.wheelTo(C.NAME_WHEEL.indexOf("END"), r, l); fire();
  H.eq(J([X.state.screen, X.Profiles.current().name]), J(["profile", "9 Z"]), "⛔ pad: END commits 9 Z");
}
{
  const X = build(), S = session(X);
  S.boot();
  S.toProfile();
  S.toNew();
  S.type("ghostx");
  S.press("Backspace");
  H.eq(S.draw().lines[0], "GHOST|", "typed, uppercased, and Backspace deletes");
  S.type(" 7");
  S.press("Enter");
  H.eq(J([X.state.screen, X.Profiles.current().name]), J(["profile", "GHOST 7"]), "⛔ typed: Enter commits GHOST 7");
}

// ---------------------------------------------------------------------------
// 4. the kit's reasons; NEW PROFILE at PROFILE_MAX; Escape
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), C = X.C, st = X.state;
  S.boot();
  S.toProfile();
  S.toNew();
  S.press("Enter");
  H.eq(J([S.draw().lines[2], X.Profiles.create("").reason]), J(["INVALID NAME", "invalid_name"]),
       "⛔ an empty name: the kit's invalid_name, as INVALID NAME");
  S.type("   ");
  S.press("Enter");
  H.eq(J([st.screen, S.draw().lines[2]]), J(["profileName", "INVALID NAME"]), "spaces alone too, and NAME stays open");
  for (let i = 0; i < 3; i++) S.press("Backspace");
  S.type("anonymous");
  S.press("Enter");
  H.eq(J([S.draw().lines[2], X.Profiles.create("ANONYMOUS").reason]), J(["NAME TAKEN", "name_taken"]),
       "⛔ a taken name: the kit's name_taken, as NAME TAKEN");
  for (let i = 0; i < 9; i++) S.press("Backspace");
  for (let i = 1; X.Profiles.list().length < C.PROFILE_MAX; i++) X.Profiles.create("FILL" + i);   // behind the open page
  S.type("late");
  S.press("Enter");
  H.eq(J([S.draw().lines[2], X.Profiles.create("LATE").reason, X.Profiles.list().length]),
       J(["ROSTER FULL", "roster_full", C.PROFILE_MAX]), "⛔ a full roster: the kit's roster_full, as ROSTER FULL, and nothing added");
  S.press("Escape");
  H.eq(st.screen, "profile", "⛔ Escape cancels NEW to PROFILE");
  const v = S.draw();
  const row = v.items.find(i => i.label === "NEW PROFILE");
  H.eq(row && row.enabled, false, "⛔ NEW PROFILE is disabled at C.PROFILE_MAX");
  S.right(20);
  H.eq(S.draw().cursor, v.items.length - 1, "and the cursor passes it to BACK");
}

// ---------------------------------------------------------------------------
// 5. RENAME: the notice, NAME TAKEN, playerId kept, the stamped row kept
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), C = X.C, st = X.state;
  S.boot();
  X.Profiles.create("OTHER");
  const before = X.Profiles.current();
  X.Scores.add("classic", { score: 50, profileId: before.id, profileName: before.name });
  S.toProfile();
  S.toPage(0);
  let v = S.draw();
  H.eq(J([v.title, v.items.map(i => i.label)]), J(["ANONYMOUS", ["SELECT", "RENAME", "DELETE", "BACK"]]),
       "⛔ a profile's page: its name, then SELECT, RENAME, DELETE, BACK");
  S.right(1);
  S.ok();
  v = S.draw();
  const notice = v.lines.slice(3);
  H.eq(J([v.title, v.lines.slice(0, 3)]), J(["RENAME", ["|", "‹ A ›", ""]]), "RENAME opens NAME, empty");
  H.eq(notice.join(" "), X.Profiles.NAME_CHANGE_NOTICE.replace(/\n/g, " "), "⛔ and shows the kit's NAME_CHANGE_NOTICE");
  H.assert(notice.length >= 2 && notice.every(l => l.length <= C.NOTICE_WRAP),
           `⛔ wrapped at C.NOTICE_WRAP (${notice.map(l => l.length).join(", ")})`);
  H.eq(X.Profiles.NAME_CHANGE_NOTICE.split("\n")[0].length > C.NOTICE_WRAP, true, "fixture: unwrapped, a sentence would not fit");
  S.type("other");
  S.press("Enter");
  H.eq(J([st.screen, S.draw().lines[2]]), J(["profileName", "NAME TAKEN"]), "⛔ RENAME to a taken name: NAME TAKEN");
  for (let i = 0; i < 5; i++) S.press("Backspace");
  S.type("ace");
  S.press("Enter");
  const after = X.Profiles.current();
  H.eq(J([st.screen, S.draw().title]), J(["profilePage", "ACE"]), "a commit returns to the page, under the new name");
  H.eq(J([after.id, after.name]), J([before.id, "ACE"]), "⛔ RENAME renames the profile in place");
  H.assert(typeof before.playerId === "string" && after.playerId === before.playerId, "⛔ RENAME keeps playerId");
  H.eq(X.Scores.list("classic")[0].profileName, "ANONYMOUS", "⛔ a score row keeps the name it was stamped with");
  S.right(1);
  S.ok();
  X.Game.input.setButton("purge", true); S.steps(2); X.Game.input.setButton("purge", false); S.liveStep();
  H.eq(st.screen, "profilePage", "⛔ Purge on an empty RENAME cancels to the page");
  S.press("Escape");
  S.press("Escape");
  H.eq(J(S.draw().items[3]), J({ label: "PROFILE", detail: "ACE", enabled: true }), "⛔ the title's PROFILE row names the active profile");
}

// ---------------------------------------------------------------------------
// 6. SELECT runs P2's activation
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), C = X.C, st = X.state, hooks = X.Game.settingsHooks;
  S.boot();
  hooks.applySettings({ controls: { mouse: 15 }, sound: { master: 3 } });
  X.Meta.saveSettings();                                             // p0: master 3, mouse ×1.5
  const id = X.Profiles.create("SECOND").profile.id;
  X.Store.scope(id).set("settings", { sound: { master: 7 } });       // p1: master 7, no mouse
  S.toProfile();
  S.toPage(1);
  S.ok();                                                            // SELECT
  let snap = hooks.settingsSnapshot();
  H.eq(X.Profiles.current().id, id, "⛔ SELECT activates the page's profile");
  H.eq(J([snap.sound.master, snap.controls.mouse]), J([7, Math.round(1 / C.SENS_STEP)]),
       "⛔ through P2's activation: the incoming master, and a mouse the incoming profile never stored RESET to ×1.0");
  H.eq(J([st.screen, S.draw().items.map(i => i.detail)]), J(["profile", ["", "ACTIVE", "", ""]]),
       "and PROFILE shows ACTIVE moved");
  S.toPage(0);
  S.ok();
  snap = hooks.settingsSnapshot();
  H.eq(J([X.Profiles.current().id, snap.sound.master, snap.controls.mouse]), J(["p0", 3, 15]), "SELECT back loads p0's own");
}

// ---------------------------------------------------------------------------
// 7. DELETE
// ---------------------------------------------------------------------------

const toYes = S => { S.right(2); S.ok(); S.right(1); S.ok(); };     // the page → DELETE → YES

{
  const store = new Map();
  const X = build({ store }), S = session(X), st = X.state, hooks = X.Game.settingsHooks;
  S.boot();
  hooks.applySettings({ sound: { master: 4 } });
  X.Meta.saveSettings();
  const mid = X.Profiles.create("MID").profile.id, last = X.Profiles.create("LAST").profile.id;
  X.Profiles.select(mid);
  hooks.applySettings({ sound: { master: 9 } });
  X.Meta.saveSettings();
  X.levelRecord("classic").noteCleared(12);
  // ⛔ REPAIRED IN PLACE AT CS012 P3 (O12): `progress` is v2 { classic, overdrive },
  // so the planted key takes that shape and the precondition — LAST has a stored
  // record for the delete to remove — stands as it always did.
  X.Store.scope(last).set("progress", { classic: 5, overdrive: 0 });
  H.assert(store.has(NS + mid + ".settings") && store.has(NS + mid + ".progress"), "fixture: MID stores settings and progress");
  S.toProfile();
  S.toPage(1);
  S.right(2);
  S.ok();
  let v = S.draw();
  H.eq(J([v.title, v.lines, v.items.map(i => i.label), v.cursor]), J(["DELETE", ["MID", ""], ["NO", "YES"], 0]),
       "⛔ DELETE names the profile, and NO comes first, under the cursor");
  S.ok();
  H.eq(J([st.screen, X.Profiles.list().length]), J(["profilePage", 3]), "NO returns to the page and deletes nothing");
  toYes(S);
  H.eq(st.screen, "profile", "YES deletes and returns to PROFILE");
  H.eq(J(X.Profiles.list().map(p => p.id)), J(["p0", last]), "the profile is gone from the roster");
  H.eq(X.Profiles.current().id, X.Profiles.list()[0].id, "⛔ deleting the active profile activates roster[0]");
  H.eq(hooks.settingsSnapshot().sound.master, 4, "⛔ through P2's activation (roster[0]'s master)");
  H.assert(!store.has(NS + mid + ".settings") && !store.has(NS + mid + ".progress"), "⛔ R12: the deleted profile's keys are removed");

  S.toPage(1);                                                       // LAST, not active
  toYes(S);
  H.eq(J([X.Profiles.current().id, X.Profiles.list().map(p => p.id)]), J(["p0", ["p0"]]),
       "deleting a profile that is not active leaves the active one");
  H.assert(!store.has(NS + last + ".progress") && store.has(NS + "settings"), "and removes its keys, not the active one's");
}

// The last profile, with and without R12's written order (keys first).
function deleteLast(opts) {
  const store = new Map();
  const X = build(Object.assign({ store }, opts)), S = session(X);
  S.boot();
  X.Game.settingsHooks.applySettings({ sound: { master: 6 } });
  X.Meta.saveSettings();
  X.levelRecord("classic").noteCleared(9);
  S.toProfile();
  S.toPage(0);
  toYes(S);
  return { screen: X.state.screen, line: S.draw().lines[1], roster: X.Profiles.list().length,
           kept: [store.has(NS + "settings"), store.has(NS + "progress")] };
}
{
  const r = deleteLast();
  H.eq(J([r.screen, r.line, r.roster]), J(["profileDelete", "LAST PROFILE", 1]),
       "⛔ the last profile cannot be deleted: the kit's last_profile shows as a reason line on DELETE");
  H.eq(J(r.kept), "[true,true]", "⛔ and the refusal leaves its settings and progress");
  const m = deleteLast({ mutate: [[KIT_FIRST, KEYS_FIRST]] });
  H.eq(J([m.line, m.kept]), J(["LAST PROFILE", [false, false]]),
       "⛔ MUTATION: R12's written order (keys, then the kit) wipes the data of a delete the kit refuses");
}

// ⛔ `p0`, whose scope is the root store, deleted while capture is on.
function deleteP0(opts) {
  const store = new Map();
  const X = build(Object.assign({ store }, opts)), S = session(X);
  S.boot();
  X.Game.settingsHooks.applySettings({ sound: { master: 2 } });
  X.Meta.saveSettings();
  X.levelRecord("classic").noteCleared(5);
  X.Scores.add("classic", { score: 77, profileId: "p0", profileName: "ANONYMOUS" });
  const keep = X.Profiles.create("KEEP").profile.id;
  X.Store.scope(keep).set("progress", { classic: 3, overdrive: 0 });   // v2's shape (CS012 P3)
  X.Telemetry.setEnabled(true);                                      // beforeChange writes p0's rows on the way out (P2)
  const reads0 = X._env.storageReads;
  S.toProfile();
  S.toPage(0);
  toYes(S);
  X.Telemetry.setEnabled(false);
  const has = k => store.has(NS + k);
  return { X, reads: X._env.storageReads - reads0, active: X.Profiles.current().id,
           root: { settings: has("settings"), progress: has("progress"), telemetry: has("telemetry"),
                   scores: has("scores"), profiles: has("profiles") },
           keep: has(keep + ".progress"), row: (X.Scores.list("classic")[0] || {}).profileName };
}
{
  const r = deleteP0();
  H.eq(J(r.root), J({ settings: false, progress: false, telemetry: false, scores: true, profiles: true }),
       "⛔ deleting p0 removes the root settings, progress and telemetry, and leaves scores and profiles");
  H.eq(J([r.active, r.keep, r.row]), J(["p1", true, "ANONYMOUS"]),
       "the other profile is active with its own keys, and the score row keeps p0's name");
  H.eq(r.reads, 0, "⛔ and nothing enumerated storage");
  const c = deleteP0({ mutate: [[REMOVE_KEYS, "scope.clear();"]], enumerates: true });
  H.assert(!c.root.scores && !c.root.profiles, `⛔ MUTATION: clear() in its place takes scores and profiles (${J(c.root)})`);
  H.assert(c.reads > 0, `⛔ MUTATION: and _env.storageReads sees it enumerate (${c.reads})`);
  const o = deleteP0({ mutate: [[KIT_FIRST, KEYS_FIRST]] });
  H.eq(o.root.telemetry, true, "⛔ MUTATION: keys first, the outgoing telemetry write lands after the removal and stays");
}

// ---------------------------------------------------------------------------
// 8. every drawn line of every new screen fits C.WORLD_W (TEXT_CHAR_W arithmetic)
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), C = X.C, st = X.state;
  const ctx = X._env.canvas.getContext("2d");
  const texts = [], bad = [], seen = new Set();
  ctx.fillText = (str, x, y) => texts.push({ str: String(str), x, y, align: ctx.textAlign, size: parseFloat(ctx.font) });
  let draws = 0;
  function measure(tag) {
    texts.length = 0;
    X.Game.draw();
    draws++;
    const rows = new Map();
    for (const t of texts) {
      const w = t.str.length * t.size * C.TEXT_CHAR_W;
      const x0 = t.align === "center" ? t.x - w / 2 : t.align === "right" ? t.x - w : t.x;
      if (x0 < 0 || x0 + w > C.WORLD_W) bad.push(`${tag}: "${t.str}" spans ${x0.toFixed(1)}..${(x0 + w).toFixed(1)}`);
      seen.add(t.str);
      if (t.align !== "center") { const r = rows.get(t.y) || {}; r[t.align] = { x0, x1: x0 + w, str: t.str }; rows.set(t.y, r); }
    }
    for (const r of rows.values()) if (r.left && r.right && r.left.x1 > r.right.x0) bad.push(`${tag}: "${r.left.str}" meets "${r.right.str}"`);
  }
  const TWELVE = "WWWWWWWWWWW";                                      // + one more: 12 characters
  S.boot();
  X.Profiles.rename("p0", TWELVE + "0");
  S.steps(2);
  measure("title");
  S.toProfile();
  measure("profile");
  S.toPage(0);
  measure("page");
  toYes(S);
  measure("delete, refused");
  for (let i = 1; i < C.PROFILE_MAX - 1; i++) X.Profiles.create(TWELVE + i);
  S.press("Escape");
  S.press("Escape");                                                 // PROFILE, rebuilt with seven
  S.toNew();
  S.type("wwwwwwwwwwwww");                                           // one past the cap
  H.eq(S.draw().lines[0], TWELVE + "W|", "the buffer stops at kit-names' MAX_NAME_LENGTH");
  for (let i = 0; i < C.NAME_WHEEL.length; i++) { measure("name, wheel " + i); S.right(1); }
  S.press("Backspace"); S.type("0"); S.press("Enter");
  measure("name, NAME TAKEN");
  X.Profiles.create(TWELVE + "9");
  S.press("Backspace"); S.type("x"); S.press("Enter");
  measure("name, ROSTER FULL");
  for (let i = 0; i < 12; i++) S.press("Backspace");
  S.press("Enter");
  measure("name, INVALID NAME");
  S.press("Escape");
  H.eq(st.screen, "profile", "fixture: back on PROFILE with a full roster");
  for (let i = 0; i < C.PROFILE_MAX + 2; i++) { measure("profile, row " + i); S.right(1); }
  S.press("Escape");
  S.toProfile();
  S.toPage(1);
  S.right(1);
  S.ok();
  S.type("wwwwwwwwwwww");
  measure("rename");
  const notice = S.draw().lines.slice(3);
  H.eq(bad.length, 0, `⛔ every drawn line fits C.WORLD_W, and no label meets its detail (${draws} draws)${bad.length ? ": " + bad.slice(0, 4).join("; ") : ""}`);
  const must = ["PROFILE", TWELVE + "0", "ACTIVE", "NEW PROFILE", "SELECT", "RENAME", "DELETE", "NO", "YES", "LAST PROFILE",
                TWELVE + "W|", "\u2039 SPACE \u203A", "\u2039 DEL \u203A", "\u2039 END \u203A",
                "NAME TAKEN", "ROSTER FULL", "INVALID NAME"].concat(notice);
  const missing = must.filter(s => !seen.has(s));
  H.eq(missing.join(" | "), "", "non-vacuity: every widest line and the wrapped notice were drawn and measured");
}

// ---------------------------------------------------------------------------
// 9. the capture path after NAME, and the mode ended on leaving
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), st = X.state;
  S.boot();
  S.toProfile();
  S.toNew();
  S.type("q");
  S.press("Escape");
  H.eq(st.screen, "profile", "fixture: Escape left NAME");
  const logs = quiet(() => S.press("t"));
  H.eq(J([X.Telemetry.enabled(), logs.length]), "[true,1]", "⛔ the text mode ended on leaving: `t` toggles telemetry again");
  quiet(() => S.press("t"));
  S.press("Escape");
  S.right(1); S.ok();                                                // OPTIONS
  S.right(2); S.ok();                                                // CONTROLS
  S.right(4); S.ok();                                                // KEYBOARD
  S.right(4); S.ok();                                                // FIRE 1
  const fire1 = () => (S.draw().items.find(i => i.label === "FIRE 1") || {}).detail;
  H.eq(J([st.screen, fire1()]), J(["keyboard", "PRESS A KEY"]), "fixture: a capture armed on FIRE 1");
  S.press("q");
  H.eq(fire1(), "Q", "⛔ test-cs008-p7.js's capture path binds as before, after NAME");
}

H.eq(builds.reduce((a, X) => a + X._env.storageReads, 0), 0,
     `⛔ _env.storageReads is 0 across all ${builds.length} builds but the clear() mutant`);

H.report("test-cs011-p4.js");

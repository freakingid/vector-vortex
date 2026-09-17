// test-cs012-p5.js — CS012 P5: the Jump (GDD 4.5, 6.5, 10.4, 11.1, 14.2, 16.3;
// plan §7, O6, O7, O8, R2-R4, R14).
// Asserts what P5 owns: state.jump's shape and its resets; O6's timings to the
// step; airborne immunity against every contact killer, mutation-checked; no
// shot off the ground; a jump landing on the clear step; Classic ignoring the
// jump input to the hash; kit-audio 0.4.0's high-pass (built only with the
// group, automated only on the two flips, never a bare .value, Butterworth so
// D16's model stands); the lift and the shadow as draw-only; and the HUD
// glyph's rectangle.
//
// ⛔ TRAPS.
//  1. state.input.jump is EXCLUDED from §6's hash and nothing else is: it is
//     the input under test, so of course it differs. The claim is about
//     everything downstream of it.
//  2. §2 calls collideSkimmer() directly — the pass P5 changed — with fire NOT
//     held, so the rim sweep is out of the question and a contact is a death.
//     §4 drives the real takeoff through kit-input instead.
//  3. The audio session HOLDS the spawner (remaining > 0, timer -1e9): an empty
//     static board never clears, never spawns and never kills, so the only
//     thing moving is the jump.
//  4. D16's headroom gate is not copied here. test-cs009-p5.js is RUN, in a
//     child process, so what is asserted is the closed gate itself.
"use strict";

const { execFileSync } = require("child_process");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260917;

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = 0;
const ROOT = path.join(__dirname, "..");

H.assert(X.WELLS[RING].closed && X.WELLS[RING].lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(typeof X.updateJump === "function" && typeof X.resetJump === "function" &&
         typeof X.jumpAirborne === "function" && typeof X.jumpCanFire === "function" &&
         typeof X.jumpLift === "function",
         "fixture: 05-skimmer.js exports the jump's five entry points");

// A live board in `mode`, spawner held (trap 3), the Skimmer on lane 0.
function board(mode, level) {
  G.reset();
  X.startGame(SEED, { mode });
  state.level = level;
  state.wellIndex = (level - 1) % X.WELLS.length;
  X.enterWell();
  state.spawn.remaining = 5;
  state.spawn.timer = -1e9;
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// ---------------------------------------------------------------------------
// 1. THE BAG AND ITS KNOBS (R2, O16)
// ---------------------------------------------------------------------------
for (const [k, want] of [["JUMP_TIME", 0.90], ["JUMP_RECOVERY", 0.20], ["JUMP_COOLDOWN", 1.40],
                         ["JUMP_LIFT", 0.12], ["JUMP_SHADOW_ALPHA", 0.6],
                         ["JUMP_HP_HZ", 700], ["JUMP_HP_TC", 0.03]]) {
  H.eq(C[k], want, `C.${k} is O16's ${want}`);
}
{
  const fresh = X.newState();
  H.eq(Object.keys(fresh.jump).sort().join(","), "cool,latched,phase,t",
       "⛔ state.jump is exactly { phase, t, cool, latched } (R2)");
  H.eq(fresh.jump.phase, "ground", "newState() mints it grounded");
  H.eq(fresh.jump.t, 0, "with its phase clock at zero");
  H.eq(fresh.jump.cool, C.JUMP_COOLDOWN, "⛔ and its cooldown BORN AT the threshold — already expired");
  H.eq(fresh.jump.latched, false, "and the button unlatched");
}
// ⛔ EVERY TIMER COUNTS UP (GDD 16.3). Driven, not read off the source.
{
  board("overdrive", 1);
  const seen = { t: [], cool: [] };
  G.input.keyDown("arrowup");
  for (let i = 0; i < 200; i++) { G.update(DT); seen.t.push(state.jump.t); seen.cool.push(state.jump.cool); }
  let down = 0;
  for (let i = 1; i < seen.t.length; i++) {
    // Each series only ever rises or is reset to 0 by a phase change.
    if (seen.t[i] < seen.t[i - 1] && seen.t[i] !== 0) down++;
    if (seen.cool[i] < seen.cool[i - 1] && seen.cool[i] !== 0) down++;
  }
  H.eq(down, 0, "⛔ `t` and `cool` only ever count UP, or are reset to 0 (GDD 16.3)");
  H.assert(Math.max(...seen.t) > 0 && Math.max(...seen.cool) > 0, "non-vacuity: both clocks ran");
}

// ---------------------------------------------------------------------------
// 2. ⛔ AIRBORNE IMMUNITY AGAINST EVERY CONTACT KILLER (R3) — trap 2
// ---------------------------------------------------------------------------
//
// Seven stagings, each in the craft's lane at the depth at which it kills. The
// riding Drifter is the armour that refuses the rim sweep, the crossing one is
// on the boundary lattice half a lane off centre (inside C.HIT_LANE_TOL), and
// the Surger is mid-discharge at depth 0.5 with its killDepth mutated to 0 —
// GDD 4.5's three conditions the sweep does NOT cover, so this really is the
// whole roster of ways to die by contact.
function killers(Z, lane) {
  const ride = new Z.Drifter(lane, PARK, 1);
  ride.phase = "ride"; ride.rideTimer = -1e9;
  const cross = new Z.Drifter(lane, PARK, 1);
  cross.phase = "cross"; cross.lane = lane + 0.5;
  cross.crossFrom = lane; cross.crossDelta = 1; cross.crossTime = 0;
  const surge = new Z.Surger(lane, 0.5);
  surge.setPhase("discharge");
  return [
    ["a parked Vaulter", new Z.Vaulter(lane, PARK, 1)],
    ["a parked Carrier", new Z.Carrier(lane, PARK, "vaulter")],
    ["a Weaver bolt at the rim band", new Z.WeaverBolt(lane, PARK)],
    ["a riding (armoured) Drifter", ride],
    ["a crossing Drifter", cross],
    ["a parked Reaver", new Z.Reaver(lane, PARK, 1)],
    ["a Surger discharging below the rim", surge],
  ];
}

// One staging, one collideSkimmer() call. Returns whether the craft died.
function contact(Z, phase, index) {
  const ZG = Z.Game, st = Z.state;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  Z.enterWell();
  ZG.input.reset();
  const well = Z.WELLS[st.wellIndex];
  st.skimmer.lane = 0;
  st.input.fire = false;                    // trap 2: no rim sweep
  st.jump.phase = phase;
  st.jump.t = phase === "ground" ? 0 : 0.10;
  st.enemies.push(killers(Z, 0)[index][1]);
  Z.collideSkimmer(st, well);
  return st.skimmer.dead === true;
}

const KILLERS = killers(X, 0);
for (let i = 0; i < KILLERS.length; i++) {
  const name = KILLERS[i][0];
  H.eq(contact(X, "ground", i), true, `fixture: grounded, ${name} kills`);
  H.eq(contact(X, "recover", i), true, `⛔ RECOVERING IS LETHAL (O6): ${name} still kills`);
  H.eq(contact(X, "air", i), false, `⛔ AIRBORNE: ${name} does not (GDD 14.2, R3)`);
}

// ⛔ THE MUTATION: remove the ONE skip, and every one of them is a death again.
{
  installSeed(SEED);
  const M = H.buildGame({ mutate: [["  if (jumpAirborne(state)) return;\n", ""]] });
  let died = 0;
  for (let i = 0; i < KILLERS.length; i++) if (contact(M, "air", i)) died++;
  H.eq(died, KILLERS.length,
       `⛔ MUTATION: with collideSkimmer()'s airborne skip removed, all ${KILLERS.length} kill again`);
}

// ⛔ AND THE SKIP TAKES THE RIM SWEEP WITH IT (R3): a firing airborne craft
// kills nothing it flies over, so no shot-free kill leaks out of the pass.
{
  const well = board("overdrive", 1);
  state.skimmer.lane = 0;
  state.input.fire = true;
  state.jump.phase = "air";
  const v = new X.Vaulter(0, PARK, 1);
  state.enemies.push(v);
  const kills0 = state.tally.kills;
  X.collideSkimmer(state, well);
  H.eq(v.dead, false, "⛔ the rim sweep does not run airborne — a touched rim enemy lives");
  H.eq(state.tally.kills, kills0, "and nothing is scored for it");
  H.eq(state.skimmer.dead, false, "and the craft is still immune with fire held");
}

// ---------------------------------------------------------------------------
// 3. NO SHOT LEAVES THE RIM OFF THE GROUND (O6)
// ---------------------------------------------------------------------------
function firesIn(Z, phase) {
  const ZG = Z.Game, st = Z.state;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  Z.enterWell();
  ZG.input.reset();
  const well = Z.WELLS[st.wellIndex];
  st.jump.phase = phase;
  st.input.fire = true;
  st.shotCooldown = Z.C.SHOT_COOLDOWN;
  const before = st.shots.length;
  Z.updateShots(st, well, Z.C.FIXED_DT);
  return st.shots.length > before;
}
H.eq(firesIn(X, "ground"), true, "fixture: a grounded craft holding fire shoots");
H.eq(firesIn(X, "air"), false, "⛔ no shot leaves the rim while AIRBORNE (GDD 14.2)");
H.eq(firesIn(X, "recover"), false, "⛔ nor while RECOVERING (O6) — the rim sweep cannot save the landing");
{
  installSeed(SEED);
  const M = H.buildGame({ mutate: [["state.input.fire && jumpCanFire(state) &&", "state.input.fire &&"]] });
  H.assert(firesIn(M, "air") && firesIn(M, "recover"),
           "⛔ MUTATION: with the gate removed, both phases fire again");
}
// The cooldown still ages off the ground, so a landing is not also a wait.
{
  const well = board("overdrive", 1);
  state.jump.phase = "air";
  state.shotCooldown = 0;
  for (let i = 0; i < 20; i++) X.updateShots(state, well, DT);
  H.assert(state.shotCooldown >= C.SHOT_COOLDOWN, "the shot cooldown still ages while airborne");
}

// ---------------------------------------------------------------------------
// 4. ⛔ O6 TO THE STEP — through the real input, on a real run (trap 2)
// ---------------------------------------------------------------------------
//
// A driver that presses the jump key at `press` and releases at `release`,
// stepping the real Game.update() and recording the phase per step.
function jumpRun(steps, script) {
  const well = board("overdrive", 1);
  const log = [];
  for (let i = 0; i < steps; i++) {
    if (script) script(i);
    G.update(DT);
    log.push({ phase: state.jump.phase, t: state.jump.t, cool: state.jump.cool });
  }
  return { well, log };
}
const firstOf = (log, phase) => log.findIndex(r => r.phase === phase);
const lastOf = (log, phase) => { let k = -1; for (let i = 0; i < log.length; i++) if (log[i].phase === phase) k = i; return k; };

// Held from step 0: ONE takeoff, and it happens on the first step.
{
  const { log } = jumpRun(400, i => { if (i === 0) G.input.keyDown("arrowup"); });
  H.eq(log[0].phase, "air", "⛔ TAKEOFF IS THE RISING EDGE, and it is the step the button goes down");
  const air = log.filter(r => r.phase === "air").length;
  const recover = log.filter(r => r.phase === "recover").length;
  // ⛔ AS A PROPERTY OF THE COUNT-UP RULE, never as ceil(limit / DT): `t` is
  // ACCUMULATED by repeated addition, and 1/60 is not a binary fraction, so the
  // two disagree by a step in either direction depending on the limit. The
  // claim is "the first step at or past the limit is the last one in the
  // phase", which is what a count-up timer means (GDD 16.3).
  H.assert(log[air - 1].t < C.JUMP_TIME && log[air - 1].t + DT >= C.JUMP_TIME,
           `⛔ airborne lasts C.JUMP_TIME — ${air} steps, the last at t ${log[air - 1].t.toFixed(5)}`);
  const rec0 = firstOf(log, "recover");
  H.assert(log[rec0 + recover - 1].t < C.JUMP_RECOVERY && log[rec0 + recover - 1].t + DT >= C.JUMP_RECOVERY,
           `⛔ recovery lasts C.JUMP_RECOVERY — ${recover} steps, the last at t ${log[rec0 + recover - 1].t.toFixed(5)}`);
  H.close(air * DT, C.JUMP_TIME, DT, "⛔ and airborne is C.JUMP_TIME to within one step");
  H.close(recover * DT, C.JUMP_RECOVERY, DT, "⛔ recovery C.JUMP_RECOVERY to within one step");
  H.eq(firstOf(log, "recover"), air, "⛔ recovery begins on the landing step");
  H.eq(log[firstOf(log, "recover")].cool, 0, "⛔ AND THE COOLDOWN STARTS FROM LANDING (O6), at exactly 0");
  // ⛔ A HELD BUTTON NEVER RE-JUMPS: 400 steps is two whole 2.30 s cycles.
  H.eq(lastOf(log, "air"), air - 1, "⛔ A HELD BUTTON NEVER RE-JUMPS — one takeoff in 400 steps");
  H.assert(log[log.length - 1].cool >= C.JUMP_COOLDOWN,
           "and the craft sat ready and grounded for the rest of them");
  // The longest cycle is C.JUMP_TIME + C.JUMP_COOLDOWN, O6's 2.30 s reading.
  const readyAt = log.findIndex((r, i) => i > 0 && r.phase === "ground" && r.cool >= C.JUMP_COOLDOWN);
  H.close((readyAt + 1) * DT, C.JUMP_TIME + C.JUMP_COOLDOWN, DT + 1e-9,
          "⛔ ready again C.JUMP_TIME + C.JUMP_COOLDOWN after takeoff (O6's 2.30 s)");
}
// Released and pressed again inside the cooldown: refused; after it: taken.
{
  const cycle = Math.ceil(C.JUMP_TIME / DT) + Math.ceil(C.JUMP_COOLDOWN / DT);
  const { log } = jumpRun(cycle + 40, i => {
    if (i === 0 || i === 70 || i === cycle + 4) G.input.keyDown("arrowup");
    if (i === 65 || i === 75 || i === cycle + 9) G.input.keyUp("arrowup");
  });
  const takeoffs = log.filter((r, i) => r.phase === "air" && (i === 0 || log[i - 1].phase !== "air")).length;
  H.eq(takeoffs, 2, "⛔ a fresh press inside the cooldown is REFUSED; the one past it is taken");
  H.eq(log[70].phase !== "air" || log[69].phase === "air", true,
       "the refused press did not start a jump of its own");
}
// ⛔ THE RE-LATCH ACROSS A DEATH (O6), exactly as the Purge's — and the case
// that DISCRIMINATES it is a press BANKED ACROSS THE FREEZE. Devices are still
// drained during hit-stop (23-main.js), so a jump pressed there arrives at the
// first live step looking like a fresh press; the forced latch is what makes
// that step read "still held" instead. A craft that was ALREADY holding the
// button at death proves nothing here — updateJump() latched it on the takeoff
// step, so the field is true either way.
{
  board("overdrive", 1);
  G.update(DT);
  H.eq(state.jump.latched, false, "fixture: the jump button is NOT held at death");
  X.killSkimmer(state);
  H.eq(state.jump.latched, true, "⛔ killSkimmer() FORCES the jump latch true (O6)");
  G.hitStop(0);
  G.input.keyDown("arrowup");               // banked across the freeze
  G.update(DT);                             // the respawn step
  H.eq(state.skimmer.dead, false, "fixture: the craft respawned, ready and grounded");
  H.eq(state.jump.cool, C.JUMP_COOLDOWN, "fixture: the cooldown is spent, so readiness is not what refuses");
  H.eq(state.jump.phase, "ground", "⛔ THE BANKED PRESS DOES NOT TAKE OFF — the latch swallowed it");
  for (let i = 0; i < 40; i++) G.update(DT);
  H.eq(state.jump.phase, "ground", "⛔ and it stays swallowed while the button is held");
  G.input.keyUp("arrowup");
  G.update(DT);
  G.input.keyDown("arrowup");
  G.update(DT);
  H.eq(state.jump.phase, "air", "⛔ a genuine release then press is what takes off");
}
// And a jump IN FLIGHT at a death comes back grounded and ready (R4).
{
  board("overdrive", 1);
  G.input.keyDown("arrowup");
  G.update(DT);
  H.eq(state.jump.phase, "air", "fixture: airborne, button held");
  H.eq(state.jump.latched, true, "fixture: the button is latched");
  // Kill it directly — airborne it cannot be killed by contact, which is §2.
  X.killSkimmer(state);
  H.eq(state.skimmer.dead, true, "fixture: killSkimmer() took the craft");
  G.hitStop(0);
  G.update(DT);                             // the respawn step
  H.eq(state.skimmer.dead, false, "fixture: the craft respawned");
  H.eq(state.jump.phase, "ground", "⛔ the respawn put the jump back on the GROUND (R4)");
  H.eq(state.jump.cool, C.JUMP_COOLDOWN, "⛔ and READY, not still cooling");
  for (let i = 0; i < 30; i++) G.update(DT);
  H.eq(state.jump.phase, "ground", "⛔ a button held across the death does NOT take off either");
}
// ⛔ enterWell() resets it — ready and grounded, `latched` untouched.
{
  board("overdrive", 1);
  state.jump.phase = "recover"; state.jump.t = 0.1; state.jump.cool = 0.2; state.jump.latched = true;
  X.enterWell();
  H.eq(state.jump.phase, "ground", "⛔ enterWell(): grounded");
  H.eq(state.jump.cool, C.JUMP_COOLDOWN, "⛔ enterWell(): ready");
  H.eq(state.jump.latched, true, "⛔ enterWell() does NOT clear `latched` — the Purge charge's rule");
}
// ⛔ THE PURGE IS ALLOWED AIRBORNE (O6): it is a panic button, not a weapon.
{
  const well = board("overdrive", 1);
  state.jump.phase = "air";
  const v = new X.Vaulter(4, 0.5, 1);
  state.enemies.push(v);
  state.input.purge = true;
  state.purgeLatched = false;
  X.updatePurge(state);
  H.eq(state.purgeUses, 1, "⛔ the Purge spends its charge airborne");
  H.eq(v.dead, true, "and it kills — O6 leaves the panic button alone");
}

// ---------------------------------------------------------------------------
// 5. ⛔ A JUMP IN FLIGHT LANDS ON THE CLEAR STEP, AND THE DIVE STARTS GROUNDED (R4)
// ---------------------------------------------------------------------------
{
  const well = board("overdrive", 1);
  G.input.keyDown("arrowup");
  G.update(DT);
  H.eq(state.jump.phase, "air", "fixture: airborne when the well clears");
  // Spend the quota and empty the board: the next step is the clear edge.
  state.spawn.remaining = 0;
  state.enemies = [];
  H.eq(X.wellCleared(state), true, "fixture: the well is clear this step");
  G.update(DT);
  H.eq(state.dive.active, true, "fixture: the clear edge entered the Dive");
  H.eq(state.jump.phase, "ground", "⛔ the jump LANDED on the clear step (R4)");
  H.eq(state.jump.cool, C.JUMP_COOLDOWN, "⛔ ready, so the next well is not entered mid-cooldown");
  H.eq(X.jumpAirborne(state), false, "⛔ THE DIVE IS NEVER AIRBORNE");
  // And it stays grounded for the whole descent.
  let air = 0;
  for (let i = 0; i < Math.ceil(C.DIVE_TIME / DT) + 5; i++) { G.update(DT); if (X.jumpAirborne(state)) air++; }
  H.eq(air, 0, "⛔ and no step of the dive is airborne, button still held");
}

// ---------------------------------------------------------------------------
// 6. ⛔ CLASSIC IGNORES THE JUMP INPUT, TO THE HASH — trap 1
// ---------------------------------------------------------------------------

// test-cs009-p6.js's whole-board hasher, unchanged.
function makeHasher(Z, extras) {
  const wells = new Map(Z.WELLS.map((w, i) => [w, i]));
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
  return function () { h = 2166136261; seen = new Map(); walk(Z.state); walk(extras()); return h; };
}

const CLASSIC_STEPS = 4000;
function classicSession(pressJump) {
  installSeed(SEED);
  const Z = H.buildGame();
  const ZG = Z.Game, st = Z.state;
  ZG.reset();
  Z.startGame(SEED);                        // ⛔ the short form: a Classic run
  const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
  const hashes = [];
  ZG.input.keyDown(" ");                    // fire held, so the board actually plays
  for (let i = 0; i < CLASSIC_STEPS; i++) {
    if (i % 7 === 0) ZG.input.mouseMove(((i * 37) % 181) - 90);
    if (pressJump) {
      if (i % 50 === 0) ZG.input.keyDown("arrowup");
      if (i % 50 === 5) ZG.input.keyUp("arrowup");
    }
    ZG.update(Z.C.FIXED_DT);
    if (st.screen === "gameover") Z.startGame((SEED + i) >>> 0);
    // ⛔ TRAP 1: the struct's own `jump` field, and nothing else, is set aside.
    const held = st.input.jump;
    st.input.jump = false;
    hashes.push(hash());
    st.input.jump = held;
  }
  return { hashes, pressed: pressJump, jumpPhase: st.jump.phase, level: st.level };
}
{
  const quiet = classicSession(false);
  const noisy = classicSession(true);
  let first = -1;
  for (let i = 0; i < CLASSIC_STEPS; i++) if (quiet.hashes[i] !== noisy.hashes[i]) { first = i; break; }
  H.eq(first, -1,
       `⛔ a CLASSIC session with the jump key pressed every 50 steps hashes identically, step by step (${CLASSIC_STEPS} steps; first divergence ${first})`);
  H.eq(noisy.jumpPhase, "ground", "⛔ and its jump never left the ground");
  H.assert(quiet.level > 1, `non-vacuity: the quiet session actually progressed (level ${quiet.level})`);
  H.assert(new Set(quiet.hashes).size > CLASSIC_STEPS / 2, "non-vacuity: the hash is not constant");
}
// The same claim without a baseline: updateJump() writes NOTHING in Classic.
{
  board("classic", 1);
  state.input.jump = true;
  const before = JSON.stringify(state.jump);
  for (let i = 0; i < 300; i++) X.updateJump(state, DT);
  H.eq(JSON.stringify(state.jump), before, "⛔ updateJump() is a TOTAL no-op in Classic — `latched` included");
  H.eq(X.modeHas("jump", "classic"), false, "and that is the mode flag doing it (R1)");
}

// ---------------------------------------------------------------------------
// 7. ⛔ kit-audio 0.4.0's HIGH-PASS, on the recording fake (O7)
// ---------------------------------------------------------------------------
H.eq(X.AUDIO_VERSION, "0.4.0", "⛔ kit-audio is 0.4.0 (MINOR: an additive optional group)");
{
  const fs = require("fs");
  H.assert(/### 2026-09-17 — an optional high-pass on the music path \(`VERSION` 0\.3\.0 → 0\.4\.0, MINOR\)/
           .test(fs.readFileSync(path.join(ROOT, "src", "16-audio-engine.NOTES.md"), "utf8")),
           "src/16-audio-engine.NOTES.md carries the 0.4.0 entry");
  // ⛔ THE MODULE NAMES NO GAME TERM: the backport rule, scanned on the module.
  const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
  const at = script.indexOf("// 16-audio-engine.js — kit-audio");
  const slice = script.slice(at, script.indexOf("// 17-audio-tracks.js", at));
  H.assert(at > 0 && slice.length > 1000, "fixture: the kit-audio slice was found in the built file");
  for (const word of ["jump", "Jump", "skimmer", "Skimmer", "airborne", "overdrive", "Overdrive"]) {
    H.assert(slice.indexOf(word) < 0, `⛔ the kit-audio slice never names "${word}"`);
  }
}

// An engine and a music instance built by hand, with and without the group.
function musicOpts(Z, extra) {
  return Object.assign({
    tracks: Z.MUSIC_TRACKS, lookahead: Z.C.MUSIC_LOOKAHEAD, crossfade: Z.C.MUSIC_CROSSFADE,
    fadeOut: Z.C.MUSIC_FADE_OUT, noise: Z.mulberry32(Z.C.AUDIO_NOISE_SEED),
    limiter: Z.C.MUSIC_LIMIT,
    gating: { thresholds: Z.C.LAYER_THRESHOLD, ramp: Z.C.LAYER_CROSSFADE },
    duck: { gain: Z.C.MUSIC_DUCK_GAIN, ramp: Z.C.MUSIC_DUCK_RAMP,
            dipGain: Z.C.MUSIC_DIP_GAIN, dipHold: Z.C.MUSIC_DIP_HOLD },
    sweep: { minHz: Z.C.FILTER_MIN_HZ, maxHz: Z.C.FILTER_MAX_HZ, q: Z.C.FILTER_Q, tc: Z.C.FILTER_TC },
  }, extra);
}
{
  installSeed(SEED);
  const Z = H.buildGame({ audio: true });
  const A = Z.AudioSys;
  A.unlock();
  A.ctx.currentTime = 100;

  const without = Z.createMusic(A, musicOpts(Z));
  without.setState("pulse");
  H.eq(without.highpass, null, "⛔ NO GROUP, NO NODE: the high-pass is absent without options.highpass");
  without.setHighpass(true);
  H.eq(without.highpass, null, "⛔ and setHighpass() on a host that did not ask for one is a no-op");

  const withIt = Z.createMusic(A, musicOpts(Z, { highpass: { hz: Z.C.JUMP_HP_HZ, tc: Z.C.JUMP_HP_TC } }));
  withIt.setState("pulse");
  H.assert(withIt.highpass && withIt.highpass.kind === "biquad" && withIt.highpass.type === "highpass",
           "⛔ WITH the group, one high-pass BiquadFilterNode is built");
  // ⛔ Q AT OR UNDER THE BUTTERWORTH VALUE, so the node is at or under unity at
  // every frequency and D16's headroom model needs no term for it.
  H.assert(withIt.highpass && withIt.highpass.Q.value <= Z.C.FILTER_Q + 1e-12,
           `⛔ its Q is at or under the sweep's Butterworth ${Z.C.FILTER_Q} dB (got ${withIt.highpass && withIt.highpass.Q.value})`);
  // The game's own instance carries it, from C, in the right place.
  const M = Z.MusicSys;
  M.setState("pulse");
  const into = n => Z._audio.connections.filter(c => c.to === n).map(c => c.from);
  H.assert(M.highpass && M.highpass.type === "highpass", "the game's music has the high-pass");
  H.eq(!!M.highpass && into(M.limiter).length === 1 && into(M.limiter)[0] === M.highpass, true,
       "⛔ AFTER THE SWEEP AND BEFORE THE LIMITER: only the high-pass feeds the limiter");
  H.eq(!!M.highpass && into(M.highpass).length === 1 && into(M.highpass)[0] === M.sweep, true,
       "⛔ and only the sweep feeds the high-pass (GDD 11.1)");
}

// ⛔ ON A PLAYED RUN: it automates on the takeoff and landing frames and no other.
{
  installSeed(SEED);
  const Z = H.buildGame({ audio: true });
  const ZG = Z.Game, st = Z.state, A = Z.AudioSys, M = Z.MusicSys, rec = Z._audio;
  const ZC = Z.C, ZDT = ZC.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.screen = "play";
  Z.enterWell();
  st.spawn.remaining = 5;                   // trap 3
  st.spawn.timer = -1e9;
  ZG.input.reset();
  A.unlock();

  const FRAMES = 900;
  let ms = 0, buildFrame = -1;
  const autoFrames = [], bare = [], flips = [];
  let prevAir = false, hpNode = null;
  for (let f = 0; f < FRAMES; f++) {
    if (f % 200 === 0) ZG.input.keyDown("arrowup");
    if (f % 200 === 8) ZG.input.keyUp("arrowup");
    rec.clear();
    const before = new Set(rec.nodes);
    ms += ZDT * 1000;
    A.ctx.currentTime = ms / 1000;
    ZG.frame(ms);
    if (!hpNode && M.highpass) { hpNode = M.highpass; buildFrame = f; }
    const air = Z.jumpAirborne(st);
    if (air !== prevAir) flips.push(f);
    prevAir = air;
    if (!hpNode) continue;
    const autos = rec.automation.filter(a => a.node === hpNode);
    if (autos.length) autoFrames.push({ f, autos });
    // ⛔ A .value on the node is legal ONLY on the frame that built it, which is
    // `before` not yet holding it — the same form test-cs010-p5.js uses.
    if (before.has(hpNode)) {
      for (const v of rec.valueSets) if (v.node === hpNode) bare.push({ f, param: v.param, v: v.v });
    }
  }
  H.assert(hpNode, `fixture: the high-pass node was built during the run (frame ${buildFrame})`);
  H.assert(flips.length >= 6, `fixture: the run took off and landed several times (${flips.length} flips)`);
  H.eq(autoFrames.map(a => a.f).join(","), flips.join(","),
       "⛔ THE HIGH-PASS AUTOMATES ON EXACTLY THE TAKEOFF AND LANDING FRAMES AND NO OTHER");
  const fns = new Set();
  for (const a of autoFrames) for (const x of a.autos) fns.add(x.fn);
  H.eq([...fns].join(","), "setTargetAtTime",
       "⛔ and it moves by setTargetAtTime ALONE — never a ramp, never a step");
  const targets = new Set();
  for (const a of autoFrames) for (const x of a.autos) targets.add(x.v);
  H.eq([...targets].sort((p, q) => p - q).join(","), `0,${ZC.JUMP_HP_HZ}`,
       "⛔ between C.JUMP_HP_HZ and a resting pass-through, and nothing between");
  H.eq(bare.length, 0,
       `⛔ NO BARE .value ON THE HIGH-PASS AFTER THE FRAME THAT BUILT IT${bare.length ? " — " + JSON.stringify(bare[0]) : ""}`);
  H.eq(M.highpassed, Z.jumpAirborne(st), "⛔ and the held flag agrees with the board on the last frame");
}

// ⛔ D16's HEADROOM GATE STANDS UNEDITED — the closed file is RUN (trap 4).
{
  let ok = true, out = "";
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, "test-cs009-p5.js")],
                       { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch (err) { ok = false; out = String(err.stdout || err.message); }
  H.assert(ok, `⛔ test-cs009-p5.js — D16's headroom model — is still green with the high-pass in the path (${out.trim().split("\n").pop()})`);
}

// ---------------------------------------------------------------------------
// 8. ⛔ THE LIFT AND THE SHADOW ARE DRAW-ONLY (O7)
// ---------------------------------------------------------------------------
// The parabola: 0 at takeoff, C.JUMP_LIFT at the apex, 0 at landing.
H.eq(X.jumpLift({ phase: "ground", t: 0 }), 0, "jumpLift: a grounded craft is on the rim");
H.eq(X.jumpLift({ phase: "recover", t: 0.1 }), 0, "jumpLift: so is a recovering one");
H.eq(X.jumpLift({ phase: "air", t: 0 }), 0, "⛔ jumpLift: 0 at takeoff");
H.close(X.jumpLift({ phase: "air", t: C.JUMP_TIME / 2 }), C.JUMP_LIFT, 1e-12, "⛔ C.JUMP_LIFT at the apex");
H.eq(X.jumpLift({ phase: "air", t: C.JUMP_TIME }), 0, "⛔ and 0 at landing");
H.assert(X.jumpLift({ phase: "air", t: C.JUMP_TIME * 0.25 }) < C.JUMP_LIFT &&
         X.jumpLift({ phase: "air", t: C.JUMP_TIME * 0.25 }) > 0, "a parabola, not a step");

// ⛔ THE GEOMETRY: every point moves OUT from the well's centroid by exactly
// lift × C.WELL_RADIUS, and nothing moves in lane space.
{
  const well = X.WELLS[RING];
  const flat = X.skimmerPoints(well, 3, 0).map(p => ({ x: p.x, y: p.y }));
  const lifted = X.skimmerPoints(well, 3, 0, C.JUMP_LIFT).map(p => ({ x: p.x, y: p.y }));
  const cen = X.wellCentroid(well);
  const cx = C.WELL_CX + cen.x * C.WELL_RADIUS, cy = C.WELL_CY + cen.y * C.WELL_RADIUS;
  let bad = 0;
  for (let i = 0; i < flat.length; i++) {
    const r0 = Math.hypot(flat[i].x - cx, flat[i].y - cy);
    const r1 = Math.hypot(lifted[i].x - cx, lifted[i].y - cy);
    if (Math.abs((r1 - r0) - C.JUMP_LIFT * C.WELL_RADIUS) > 1e-9) bad++;
  }
  H.eq(bad, 0, "⛔ every silhouette point is pushed OUT from the centroid by lift × C.WELL_RADIUS");
  const same = X.skimmerPoints(well, 3, 0).map(p => ({ x: p.x, y: p.y }));
  H.eq(JSON.stringify(same), JSON.stringify(flat), "⛔ and the three-argument call is exactly what it always was");
}

// ⛔ THE SHADOW: the unlifted outline, stroked at C.JUMP_SHADOW_ALPHA, UNDER the craft.
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["glowStroke", "drawPoly"] });
  const ZG = Z.Game, st = Z.state;
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  Z.enterWell();
  const well = Z.WELLS[st.wellIndex];
  const ctx = Z._env.doc.getElementById("c").getContext("2d");
  const strokes = [];
  Z.glowStroke.before = function (c, color, w, alpha) { strokes.push({ color, alpha }); };
  st.skimmer.draw(ctx, well, 0);
  const grounded = strokes.length;
  H.eq(grounded, 1, "grounded: one stroke, the craft");
  strokes.length = 0;
  st.skimmer.draw(ctx, well, Z.C.JUMP_LIFT);
  H.eq(strokes.length, 2, "⛔ airborne: TWO strokes — the shadow, then the craft");
  const shadow = strokes[0] || {}, craft = strokes[1] || {};
  H.eq(shadow.alpha, Z.C.JUMP_SHADOW_ALPHA, "⛔ the shadow first, at C.JUMP_SHADOW_ALPHA");
  H.eq(craft.alpha, 1, "⛔ and the craft over it at full alpha");
  H.eq(shadow.color, Z.C.SKIMMER_COLOR, "⛔ the craft's own colour — a stroke, not a fill");
}

// ⛔ WITH C.JUMP_LIFT AT 0 THE STATE HASH IS IDENTICAL, frame for frame.
{
  const LIFT_FRAMES = 1200;
  function liftSession(mutate) {
    installSeed(SEED);
    const Z = H.buildGame({ mutate });
    const ZG = Z.Game, st = Z.state, ZDT = Z.C.FIXED_DT;
    ZG.reset();
    Z.startGame(SEED, { mode: "overdrive" });
    st.screen = "play";
    ZG.input.reset();
    ZG.input.keyDown(" ");
    const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
    const hashes = [];
    let ms = 0;
    for (let f = 0; f < LIFT_FRAMES; f++) {
      if (f % 60 === 0) ZG.input.keyDown("arrowup");
      if (f % 60 === 9) ZG.input.keyUp("arrowup");
      if (f % 7 === 0) ZG.input.mouseMove(((f * 31) % 161) - 80);
      ms += ZDT * 1000;
      ZG.frame(ms);                        // ⛔ frame(), so draw() really runs
      if (st.screen === "gameover") Z.startGame((SEED + f) >>> 0);
      hashes.push(hash());
    }
    return { hashes, airSteps: st.jump.phase };
  }
  const real = liftSession([]);
  const flat = liftSession([["  JUMP_LIFT:            0.12,", "  JUMP_LIFT:            0,"]]);
  let first = -1;
  for (let f = 0; f < LIFT_FRAMES; f++) if (real.hashes[f] !== flat.hashes[f]) { first = f; break; }
  H.eq(first, -1, `⛔ THE LIFT IS DRAW-ONLY: with C.JUMP_LIFT at 0 the state hash is identical on all ${LIFT_FRAMES} frames (first divergence ${first})`);
  H.assert(new Set(real.hashes).size > LIFT_FRAMES / 2, "non-vacuity: the hash is not constant");
}

// ---------------------------------------------------------------------------
// 9. ⛔ THE HUD GLYPH (O8)
// ---------------------------------------------------------------------------
function view(o) {
  return Object.assign({ score: 99999999, lives: C.LIVES_MAX, level: 999, levelColor: "#3FE0FF",
                         purgeUses: 0, mirror: false, icon: X.SKIMMER_POLY, jump: null }, o);
}
function copyRects(v, keys) {
  const L = X.hudLayout(v);
  const out = {};
  for (const k of keys) out[k] = { x: L[k].x, y: L[k].y, w: L[k].w, h: L[k].h };
  return out;
}
const FOUR = ["score", "lives", "level", "purge"];
const READY = { airborne: false, ready: true, ring: 1 };
const COOLING = { airborne: false, ready: false, ring: 0.4 };
const AIRBORNE = { airborne: true, ready: false, ring: 0 };

// ⛔ CLASSIC'S RECTANGLES ARE BIT-IDENTICAL.
for (const mirror of [false, true]) {
  const none = JSON.stringify(copyRects(view({ mirror }), FOUR));
  for (const [name, j] of [["ready", READY], ["cooling", COOLING], ["airborne", AIRBORNE]]) {
    H.eq(JSON.stringify(copyRects(view({ mirror, jump: j }), FOUR)), none,
         `⛔ the four HUD rectangles are bit-identical with a ${name} jump glyph (mirror ${mirror})`);
  }
}
// The three readings (O8).
H.eq(X.hudJumpAlpha(null), 0, "⛔ no jump view (Classic): the glyph is absent");
H.eq(X.hudJumpAlpha(AIRBORNE), 0, "⛔ ABSENT while airborne");
H.eq(X.hudJumpAlpha(READY), 1, "⛔ BRIGHT when ready");
H.eq(X.hudJumpAlpha(COOLING), C.HUD_PURGE_DIM_ALPHA, "⛔ DIM while cooling");
H.eq(X.hudJumpRing(READY), 0, "⛔ no ring when ready — the glyph already says it");
H.eq(X.hudJumpRing(AIRBORNE), 0, "and none while airborne");
H.eq(X.hudJumpRing(COOLING), 0.4, "⛔ a FILLING ring while cooling, at the cooldown's own fraction");
H.eq(X.hudJumpRing({ airborne: false, ready: false, ring: 3 }), 1, "clamped at a full turn");

// ⛔ THE GLYPH'S RECTANGLE CLEARS THE THROAT ZONE AND BOTH TOUCH BUTTONS.
const overlap = (r, b) => r.x < b.x1 && r.x + r.w > b.x0 && r.y < b.y1 && r.y + r.h > b.y0;
for (const mirror of [false, true]) {
  const L = copyRects(view({ mirror, jump: COOLING }), ["jump", "purge", "lives"]);
  const r = L.jump;
  H.assert(r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= C.WORLD_W && r.y + r.h <= C.WORLD_H,
           `the jump rectangle is a real rectangle on the world (mirror ${mirror})`);
  H.eq(r.w, C.HUD_JUMP_SIZE, "⛔ it is the RING's extent, not the craft's");
  H.close(r.x + r.w + C.HUD_JUMP_GAP, L.purge.x, 1e-12, `⛔ C.HUD_JUMP_GAP left of the Purge glyph (mirror ${mirror})`);
  H.close(r.y + r.h, L.purge.y + L.purge.h, 1e-12, "⛔ on the Purge glyph's baseline");
  H.assert(L.lives.x + L.lives.w < r.x, `it does not collide with a full reserve (mirror ${mirror})`);

  // GDD 10.3's throat zone, on every well — test-cs008-p4.js's bounding box.
  let bad = 0;
  for (let w = 0; w < X.WELLS.length; w++) {
    const well = X.WELLS[w];
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const p = { x: 0, y: 0 };
    const hi = X.wellVertCount(well) - 1;
    for (let lane = 0; lane <= hi; lane += 0.25) {
      for (let d = 0; d < C.READABILITY_DEPTH; d += 0.01) {
        X.screenPos(well, lane, d, p);
        b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x);
        b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y);
      }
    }
    if (overlap(r, b)) { bad++; console.error(`well ${w} jump glyph mirror ${mirror}`); }
  }
  H.eq(bad, 0, `⛔ the jump glyph clears the throat zone on all 16 wells (mirror ${mirror})`);

  // ⛔ H3 — the REAL touch hit test, probed over the rectangle.
  const input = X.createInput({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS,
    keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP,
    pointerLockOffer: C.POINTER_LOCK_OFFER,
    touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC,
    touchAutofire: C.TOUCH_AUTOFIRE, touchButtonR: C.TOUCH_BUTTON_R,
    gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: mirror, worldW: C.WORLD_W, worldH: C.WORLD_H,
  });
  const hits = (x, y) => {
    input.touchStart(1, x, y);
    const s = input.sample(C.FIXED_DT);
    const hit = s.purge || s.jump;          // read before reset(): the shared struct
    input.touchEnd(1);
    input.reset();
    return hit;
  };
  const m = C.TOUCH_BUTTON_R * 1.5, bx = mirror ? m : C.WORLD_W - m;
  H.assert(hits(bx, m) && hits(bx, C.WORLD_H - m), `the probe registers at both button centres (mirror ${mirror})`);
  let touched = 0, probes = 0;
  for (let x = r.x; x <= r.x + r.w; x += 1) {
    for (let y = r.y; y <= r.y + r.h; y += 1) { probes++; if (hits(x, y)) { touched++; break; } }
  }
  H.assert(probes > 25, `the probe covered the rectangle (${probes})`);
  H.eq(touched, 0, `⛔ no point of the jump glyph's rectangle lands on a touch button (mirror ${mirror})`);
}

// ⛔ WHAT drawHud ACTUALLY DRAWS, and that Classic draws exactly what it did.
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["glowStroke", "drawPoly"] });
  const ZC = Z.C;
  const strokes = [];
  Z.glowStroke.before = function (c, color, w, alpha) { strokes.push(alpha); };
  const ctx = Z._env.doc.getElementById("c").getContext("2d");
  const mk = j => Object.assign({ score: 0, lives: 3, level: 1, levelColor: "#fff",
                                  purgeUses: 0, mirror: false, icon: Z.SKIMMER_POLY, jump: j }, {});
  Z.drawHud(ctx, mk(null));
  const classic = strokes.slice();
  strokes.length = 0;
  Z.drawHud(ctx, mk(AIRBORNE));
  H.eq(JSON.stringify(strokes), JSON.stringify(classic),
       "⛔ an AIRBORNE glyph draws nothing, so the HUD is Classic's exactly");
  strokes.length = 0;
  Z.drawHud(ctx, mk(READY));
  H.eq(strokes.length, classic.length + 2, "⛔ ready: the craft and the rim line, no ring");
  H.eq(strokes[strokes.length - 1], 1, "⛔ at full alpha");
  strokes.length = 0;
  Z.drawHud(ctx, mk(COOLING));
  H.eq(strokes.length, classic.length + 3, "⛔ cooling: the craft, the rim line and the ring");
  H.assert(strokes.slice(classic.length).every(a => a === ZC.HUD_PURGE_DIM_ALPHA),
           "⛔ all three dim while the cooldown runs");
}

// ⛔ AND Game.draw() IS WHAT DECIDES IT: Overdrive only (O8).
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["drawHud"] });
  const ZG = Z.Game, st = Z.state;
  let seen = null;
  Z.drawHud.before = function (c, v) { seen = v.jump === null ? null : Object.assign({}, v.jump); };
  ZG.reset();
  Z.startGame(SEED);                        // Classic
  st.screen = "play";
  ZG.draw();
  H.eq(seen, null, "⛔ a CLASSIC run hands drawHud a null jump view");
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.screen = "play";
  st.jump.phase = "ground"; st.jump.cool = Z.C.JUMP_COOLDOWN;
  ZG.draw();
  H.eq(JSON.stringify(seen), JSON.stringify({ airborne: false, ready: true, ring: 1 }),
       "⛔ an Overdrive run hands it the ready reading");
  st.jump.phase = "air"; st.jump.t = 0.3;
  ZG.draw();
  H.eq(seen.airborne, true, "⛔ airborne reads airborne");
  st.jump.phase = "ground"; st.jump.cool = Z.C.JUMP_COOLDOWN / 2;
  ZG.draw();
  H.eq(seen.ready, false, "⛔ cooling reads not-ready");
  H.close(seen.ring, 0.5, 1e-12, "⛔ and the ring is the cooldown's own fraction");
}

H.report("test-cs012-p5.js");

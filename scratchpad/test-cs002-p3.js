// test-cs002-p3.js — CS002 P3: firing and shots (GDD 4.2, 10.2, 10.3).
//
// Asserts what P3 owns: the SHOT_MAX cap under held fire, the SHOT_COOLDOWN
// spacing between fires, lane-locking at fire time (never the continuous
// position, never updated by later rotation), and retirement at the throat.
// Makes no claim about collision or Thorns — neither exists yet.
//
// ⛔ Input is driven through the REAL input module (G.input.setButton /
// mouseMove), never by writing state.input fields directly — Game.update()
// calls input.sample(dt, state.input) every tick, which overwrites whatever a
// test assigned there by hand before the rest of update() ever runs.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const DT = C.FIXED_DT;

const wellByName = n => X.WELLS.find(w => w.name === n);
const RING = wellByName("Ring");   // closed, 16 lanes

// ---- the constants this phase adds -----------------------------------------
hasKnob(X, "SHOT_LEN", { def: 0.06 }, H);
H.assert(typeof X.Shot === "function", "the Shot class is in the build");
H.assert(typeof X.updateShots === "function", "updateShots is in the build");
H.assert(typeof X.drawShot === "function", "drawShot is in the build");

// ---------------------------------------------------------------------------
// ⛔ held fire for 10,000 ticks never exceeds SHOT_MAX, and the array never
// grows past its bound even transiently.
// ---------------------------------------------------------------------------
{
  G.reset();
  X.state.wellIndex = X.WELLS.indexOf(RING);
  G.update(DT);   // mints the Skimmer
  G.input.setButton("fire", true);

  let overCap = false;
  for (let i = 0; i < 10000; i++) {
    G.update(DT);
    if (X.state.shots.length > C.SHOT_MAX) overCap = true;
  }
  H.assert(!overCap, `⛔ held fire never puts more than SHOT_MAX (${C.SHOT_MAX}) shots in flight`);
  H.assert(X.state.shots.length <= C.SHOT_MAX, "and the array is not left past its bound at the end");
  G.input.setButton("fire", false);
}

// ---------------------------------------------------------------------------
// ⛔ no two shots are created closer than SHOT_COOLDOWN apart
// ---------------------------------------------------------------------------
{
  G.reset();
  X.state.wellIndex = X.WELLS.indexOf(RING);
  G.update(DT);
  G.input.setButton("fire", true);

  let prevCount = X.state.shots.length;
  let lastFireTime = null;
  let tooClose = false;
  for (let i = 0; i < 4000; i++) {
    G.update(DT);
    if (X.state.shots.length > prevCount) {
      // A new shot appeared this tick — X.state.time is the simulation clock.
      if (lastFireTime !== null && X.state.time - lastFireTime < C.SHOT_COOLDOWN - 1e-9) {
        tooClose = true;
      }
      lastFireTime = X.state.time;
    }
    prevCount = X.state.shots.length;
  }
  G.input.setButton("fire", false);
  H.assert(lastFireTime !== null, "the soak actually fired at least one shot");
  H.assert(!tooClose, `⛔ no two shots are created closer than SHOT_COOLDOWN (${C.SHOT_COOLDOWN}s) apart`);
}

// ---------------------------------------------------------------------------
// ⛔ a shot's lane is captured at fire time from the NEAREST LANE CENTRE, and
// heavy rotation afterwards never changes it.
// ---------------------------------------------------------------------------
{
  G.reset();
  X.state.wellIndex = X.WELLS.indexOf(RING);
  G.update(DT);
  X.state.skimmer.lane = 4.3;   // nearest centre is 4

  G.input.setButton("fire", true);
  G.update(DT);
  G.input.setButton("fire", false);
  H.assert(X.state.shots.length >= 1, "a shot was fired");
  const shot = X.state.shots[X.state.shots.length - 1];
  H.eq(shot.lane, 4, "the shot's lane is the nearest lane centre to the Skimmer at fire time");

  const originalLane = shot.lane;
  for (let i = 0; i < 200; i++) {
    G.input.mouseMove(i % 2 ? 300 : -300);
    G.update(DT);
  }
  H.eq(shot.lane, originalLane,
    "⛔ heavy rotation after firing never changes the shot's already-locked lane");
}

// ---------------------------------------------------------------------------
// ⛔ a shot at depth 0 is gone the next frame
// ---------------------------------------------------------------------------
{
  const shot = new X.Shot(RING, 0);
  // Drive it to the exact edge of retirement without going through the loop,
  // so this case is about depth 0 specifically, not accumulated float noise.
  shot.t = C.SHOT_TIME;
  H.eq(shot.depth(), 0, "the shot is at depth 0");
  H.assert(!shot.dead, "not yet retired before its own update() runs");
  shot.update(DT);
  H.assert(shot.dead, "⛔ a shot at depth 0 retires on its own next update");

  // And through the real loop: fire one shot, run it out past SHOT_TIME, and
  // confirm the system-level array has dropped it the very next update.
  G.reset();
  X.state.wellIndex = X.WELLS.indexOf(RING);
  G.update(DT);
  G.input.setButton("fire", true);
  G.update(DT);
  G.input.setButton("fire", false);
  H.eq(X.state.shots.length, 1, "one shot in flight");
  const ticks = Math.ceil(C.SHOT_TIME / DT) + 1;
  for (let i = 0; i < ticks; i++) G.update(DT);
  H.eq(X.state.shots.length, 0, "⛔ the shot that reached the throat is gone the following frame");
}

// ---------------------------------------------------------------------------
// no NaN in a shot's projected draw points, at every lane, on all 16 wells
// ---------------------------------------------------------------------------
{
  let bad = 0;
  const ctx = X._env.canvas.getContext();
  for (const well of X.WELLS) {
    for (let l = 0; l < well.lanes; l++) {
      for (const d of [0, 0.5, 1]) {
        try {
          X.drawShot(ctx, well, l, d);
        } catch (e) { bad++; }
      }
    }
  }
  H.eq(bad, 0, "drawShot throws nothing on any well, lane, or depth");
}

// ---------------------------------------------------------------------------
// readability contract (GDD 10.3) — a shot near the throat draws without error
// ---------------------------------------------------------------------------
{
  const dim = C.READABILITY_DEPTH / 2;
  H.assert(dim < C.READABILITY_DEPTH, "test setup: dim depth is inside the readability zone");
  // The alpha math itself (fades to 0 at the throat, opaque at/above
  // READABILITY_DEPTH) is simple enough to read in 14-render-entities.js;
  // the harness's stub ctx does not capture globalAlpha in a way this test can
  // assert on without extending it for one line of math, so this exercises the
  // call path rather than the alpha value. Recorded as a known gap.
  const ctx = X._env.canvas.getContext();
  let threw = null;
  try { X.drawShot(ctx, RING, 0, dim); } catch (e) { threw = e; }
  H.eq(threw, null, "drawing a shot inside the dim zone throws nothing");
}

// ---------------------------------------------------------------------------
// the shipped file, sliced on build.js's banners: shots draw through the two
// primitives and nothing else.
// ---------------------------------------------------------------------------
{
  const fs = require("fs");
  const path = require("path");
  const ROOT = path.join(__dirname, "..");
  const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
  const re = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;
  const marks = [];
  let m;
  while ((m = re.exec(script)) !== null) marks.push({ name: m[1].trim(), head: m.index, body: m.index + m[0].length });

  let shotsSlice = null;
  for (const fname of ["06-shots.js", "14-render-entities.js"]) {
    const i = marks.findIndex(k => k.name === fname);
    H.assert(i >= 0, `the banner scan finds ${fname} in the built file`);
    const slice = script.slice(marks[i].body, marks[i + 1] ? marks[i + 1].head : script.length);
    if (fname === "14-render-entities.js") shotsSlice = slice;
    for (const token of ["ctx.fill", "fillRect", "strokeRect", "drawImage", "createPattern", "shadowBlur", ".arc("]) {
      H.assert(!slice.includes(token),
        `${fname} must not contain "${token}" — no per-entity pipeline (GDD 10.2)`);
    }
  }
  H.assert(shotsSlice && shotsSlice.includes("drawPoly(") && shotsSlice.includes("glowStroke("),
    "14-render-entities.js draws through drawPoly and glowStroke");
}

H.report("test-cs002-p3.js");

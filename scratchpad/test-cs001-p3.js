// test-cs001-p3.js — CS001 P3, the well renderer (GDD 3.6, 3.7, 10.2).
//
// Asserts only what P3 owns: band colour lookup, the dim band's alpha window,
// and depth-varying line weight. It does NOT re-assert the depth model (P2's
// job) or well data (P1's). drawWell/drawPoly/glowStroke draw through a stub
// 2D context (the harness's ctx2d Proxy) — this file checks they run without
// throwing across all sixteen wells, not pixel output, since headless canvas
// has none to check.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260830);

const X = H.buildGame();
const WELLS = X.WELLS;
const { drawPoly, glowStroke, laneLineWidth, wellBandColor, wellBaseAlpha, drawWell, C } = X;

for (const [name, fn] of Object.entries({ drawPoly, glowStroke, laneLineWidth, wellBandColor, wellBaseAlpha, drawWell })) {
  H.assert(typeof fn === "function", `${name} is exported by the build`);
}

// ---- band colour (GDD 3.6) --------------------------------------------------
H.eq(wellBandColor(1), "#3FE0FF", "level 1 is Cyan");
H.eq(wellBandColor(16), "#3FE0FF", "level 16 is Cyan (band top)");
H.eq(wellBandColor(17), "#FF4FD8", "level 17 is Magenta (next band starts)");
H.eq(wellBandColor(48), "#FFB020", "level 48 is Amber");
H.eq(wellBandColor(80), "#FF5A3C", "level 80 is Ember");
H.eq(wellBandColor(97), "#FFFFFF", "level 97 is White");
H.eq(wellBandColor(99), "#FFFFFF", "level 99 is White (band top)");
H.assert(C.BAND_RNG_COLORS.includes(wellBandColor(100, 0)), "level 100 draws from the RNG palette");
H.assert(C.BAND_RNG_COLORS.includes(wellBandColor(250, 0.999)), "level 250 (marathon) still draws from the RNG palette");

// ---- the dim band (GDD 3.7) — ⚠ SETTLED window and alpha, asserted not tuned ---
H.eq(wellBaseAlpha(64), 1.0, "level 64 (just below the dim band) is fully opaque");
H.eq(wellBaseAlpha(65), C.DIM_BAND_ALPHA, "level 65 (dim band floor) is dimmed");
H.eq(wellBaseAlpha(80), C.DIM_BAND_ALPHA, "level 80 (dim band ceiling) is dimmed");
H.eq(wellBaseAlpha(81), 1.0, "level 81 (just above the dim band) is fully opaque");
H.eq(C.DIM_BAND_ALPHA, 0.18, "DIM_BAND_ALPHA matches GDD 3.7 exactly");

// ---- depth-varying line weight (GDD 10.1) -----------------------------------
H.eq(laneLineWidth(0), C.LINE_W_THROAT, "line weight at the throat is LINE_W_THROAT");
H.eq(laneLineWidth(1), C.LINE_W_RIM, "line weight at the rim is LINE_W_RIM");
H.assert(laneLineWidth(1) > laneLineWidth(0), "line weight increases from throat to rim");
H.assert(laneLineWidth(0.5) > laneLineWidth(0) && laneLineWidth(0.5) < laneLineWidth(1),
  "line weight at mid-depth sits strictly between the two ends");

// ---- drawWell runs clean across all sixteen wells, every band ---------------
// The stub ctx (harness ctx2d Proxy) accepts any call; this catches a thrown
// exception (bad index, NaN coordinate) rather than checking pixels.
const ctx = X._env.canvas.getContext();
let threw = null;
try {
  for (const well of WELLS) {
    drawWell(ctx, well, 1, null, 0);       // Cyan band, no lit lanes
    drawWell(ctx, well, 70, null, 0);      // inside the dim band
    drawWell(ctx, well, 100, [{ occupied: true }], 0.5);  // RNG band + a lit lane
  }
} catch (e) {
  threw = e;
}
H.assert(threw === null, `drawWell must not throw across all wells/bands (${threw && threw.message})`);

H.report("test-cs001-p3.js");

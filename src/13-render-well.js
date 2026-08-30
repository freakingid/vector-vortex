// 13-render-well.js — the well renderer (GDD 3.6, 3.7, 10.2). Consumes the
// depth model from 03-wells.js (rimPoint/throatPoint/screenPos/wellVertCount)
// and draws lanes + rim/throat rings. No game state read here beyond what a
// caller passes in — this module is pure `(ctx, well, level, laneState) -> pixels`.
//
// ⛔ Two primitives only: drawPoly (path builder, no fill) and glowStroke (two
// strokes composited with `lighter`, wide-and-dim then thin-and-bright). GDD
// 10.2: no per-entity pipelines, no fills, no sprites, no textures.
//
// Occupancy/shot/charge lighting (laneState) is wired through drawWell now so
// callers arriving later (shots, enemies, Surger) need no renderer change —
// it does nothing until a caller ever passes a lit lane, since none exists yet.

// Build a canvas 2D path from a point array. `closed` draws the final
// rim[n-1] -> rim[0] edge; open strips omit it (GDD 3.3's loop/strip split).
function drawPoly(ctx, points, closed) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  if (closed) ctx.closePath();
}

// Two-pass glow stroke on an already-built path: wide+dim, then thin+bright,
// composited with `lighter`. ⛔ Caller must have called ctx.beginPath()+path
// commands (e.g. via drawPoly) immediately before this, since it re-strokes
// the CURRENT path twice rather than taking a point array itself — that keeps
// the multi-segment lane case (draw once, stroke twice) cheap.
function glowStroke(ctx, color, width, alpha) {
  const a = alpha === undefined ? 1 : alpha;
  const prevOp = ctx.globalCompositeOperation;
  const prevAlpha = ctx.globalAlpha;
  const prevWidth = ctx.lineWidth;
  const prevStyle = ctx.strokeStyle;

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = color;

  ctx.lineWidth = width * C.GLOW_WIDE_W;
  ctx.globalAlpha = C.GLOW_WIDE_ALPHA * a;
  ctx.stroke();

  ctx.lineWidth = width;
  ctx.globalAlpha = C.GLOW_THIN_ALPHA * a;
  ctx.stroke();

  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = prevAlpha;
  ctx.lineWidth = prevWidth;
  ctx.strokeStyle = prevStyle;
}

// Depth-varying line weight (GDD 10.1 — vector hardware couldn't do this).
// Linear in depth: thin at the throat, thick at the rim.
function laneLineWidth(depth) {
  const d = depth < 0 ? 0 : (depth > 1 ? 1 : depth);
  return C.LINE_W_THROAT + (C.LINE_W_RIM - C.LINE_W_THROAT) * d;
}

// GDD 3.6 band colour for a level. Past 99 the shape and heat hold and colour
// comes from the seeded RNG — `rng` is a 0..1 draw the caller supplies
// (mulberry32, per GDD 16.1); the RNG itself is never owned by this module.
function wellBandColor(level, rng) {
  if (level > 99) {
    const palette = C.BAND_RNG_COLORS;
    const r = rng === undefined ? 0 : rng;
    const i = Math.min(palette.length - 1, Math.floor(r * palette.length));
    return palette[i];
  }
  for (const band of C.BAND_COLORS) {
    if (level <= band.hi) return band.color;
  }
  return C.BAND_COLORS[C.BAND_COLORS.length - 1].color;
}

// GDD 3.7 — the dim band. Levels 65-80 render at DIM_BAND_ALPHA; everything
// else is fully opaque. ⚠ SETTLED — the band and its alpha are not tuning
// targets (GDD 3.7); do not adjust either from here.
function wellBaseAlpha(level) {
  return (level >= C.DIM_BAND_LO && level <= C.DIM_BAND_HI) ? C.DIM_BAND_ALPHA : 1.0;
}

// Project a normalized-space point array (well.rim or wellThroat(well)) into
// screen space via C.WELL_CX/CY/RADIUS — the same mapping screenPos uses, but
// applied to a whole polygon at once for the rim/throat rings, which sit at a
// single depth and so need no per-point perspective easing.
function projectPoly(points) {
  const out = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    out[i] = {
      x: C.WELL_CX + points[i].x * C.WELL_RADIUS,
      y: C.WELL_CY + points[i].y * C.WELL_RADIUS,
    };
  }
  return out;
}

// Draw one well: rim ring, throat ring, and every lane's rim->throat spoke.
//
//   well       from WELLS (03-wells.js)
//   level      game.level — drives band colour (GDD 3.6) and dim band (3.7)
//   laneState  optional per-lane lighting: array indexed by lane, each entry
//              `{ occupied, shotTravel, surgeCharge }` or falsy. Any truthy
//              flag lights that lane at LANE_LIT_ALPHA regardless of the dim
//              band — GDD 3.7's "lanes light on occupancy, shot travel, and
//              Surger charge" escape hatch. No caller supplies this yet.
//   rng        0..1 draw for the past-99 palette (wellBandColor); unused
//              otherwise.
function drawWell(ctx, well, level, laneState, rng) {
  const color = wellBandColor(level, rng);
  const baseAlpha = wellBaseAlpha(level);
  const rim = projectPoly(well.rim);
  const throat = projectPoly(wellThroat(well));
  const vcount = wellVertCount(well);

  // Rim and throat rings, each a single flat-weight stroke (they sit at one
  // depth apiece, so there is no line-weight gradient to apply within them).
  drawPoly(ctx, rim, well.closed);
  glowStroke(ctx, color, C.LINE_W_RIM, baseAlpha);

  drawPoly(ctx, throat, well.closed);
  glowStroke(ctx, color, C.LINE_W_THROAT, baseAlpha);

  // Spokes: rim vertex -> throat vertex at every vertex index, one spoke per
  // index. Each spoke bounds up to two lanes (the one ending here and the one
  // starting here — GDD 3.3's lane IS the edge between two consecutive rim
  // vertices, so a spoke is shared exactly where two lanes meet). A spoke
  // lights if EITHER neighbouring lane is lit; a closed well's spoke 0 wraps
  // to lane `lanes-1` on one side, and an open well's end spokes (0 and
  // vcount-1) have only one neighbouring lane.
  for (let i = 0; i < vcount; i++) {
    const laneEndingHere = well.closed ? (i - 1 + well.lanes) % well.lanes : i - 1;
    const laneStartingHere = well.closed ? (i % well.lanes) : i;
    const lit = laneState && (
      isLaneLit(laneState[laneEndingHere]) || isLaneLit(laneState[laneStartingHere])
    );
    const alpha = lit ? Math.max(baseAlpha, C.LANE_LIT_ALPHA) : baseAlpha;

    ctx.beginPath();
    ctx.moveTo(rim[i].x, rim[i].y);
    ctx.lineTo(throat[i].x, throat[i].y);
    glowStroke(ctx, color, laneLineWidth(0.5), alpha);
  }
}

// laneState is a sparse array; an out-of-range index (open-well end spokes)
// reads undefined, which this treats as unlit.
function isLaneLit(s) {
  return !!s && (s.occupied || s.shotTravel || s.surgeCharge);
}

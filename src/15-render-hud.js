// 15-render-hud.js — the in-play HUD (GDD 10.4; CS008 P4). CS008 P5 adds the
// menu/screen-state half, which is kit-menu's draft (CLAUDE.md, Modules built
// here); this half is built to the same boundary from its first commit.
//
// ⛔ drawHud(ctx, view) READS NO GAME STATE. Everything it shows arrives on the
// view Game.draw() fills — score, lives, level, the level's colour, purgeUses,
// the mirror flag and the reserve icon's point array — and the only global it
// reads is C, for sizes. Nothing here reads `state`, WELLS or the Skimmer.
//
// ⛔ hudLayout(view) IS THE ONE PLACE A CORNER IS PLACED, and drawHud draws
// inside the rectangles it returns. test-cs008-p4.js asserts those rectangles
// clear of the throat zone on all sixteen wells (GDD 10.3) and clear of both
// touch buttons, mirrored and not (H3). A text rectangle is sized by
// C.TEXT_CHAR_W, never measureText(), so that assertion is arithmetic.
//
// ⛔ Text goes through drawText() and nothing else; icons and the Purge glyph
// go through drawPoly + glowStroke (GDD 10.2). No fills, no rectangles drawn.

// The Purge glyph (GDD 4.3): an eight-point burst, closed, unit radius. Shape
// DATA; the scale is C.HUD_PURGE_SIZE. ⚠ Provisional art, like the palette.
const PURGE_GLYPH_POLY = [
  { x:  0.00, y: -1.00 }, { x:  0.30, y: -0.30 },
  { x:  1.00, y:  0.00 }, { x:  0.30, y:  0.30 },
  { x:  0.00, y:  1.00 }, { x: -0.30, y:  0.30 },
  { x: -1.00, y:  0.00 }, { x: -0.30, y: -0.30 },
];

// ⛔ NO PER-FRAME ALLOCATION beyond the strings themselves: the layout, its
// rectangles and both point scratches are module-level and rewritten per call.
// Like entityPoints(), that makes hudLayout() non-reentrant — copy what you keep.
const _hud = {
  score: { x: 0, y: 0, w: 0, h: 0 },
  lives: { x: 0, y: 0, w: 0, h: 0 },
  level: { x: 0, y: 0, w: 0, h: 0 },
  purge: { x: 0, y: 0, w: 0, h: 0 },
  lifeIcons: 0,      // reserve craft drawn: lives − 1, never below 0 (H1)
  purgeAlpha: 0,     // 1 bright, C.HUD_PURGE_DIM_ALPHA dim, 0 absent
};
const _purgePts = PURGE_GLYPH_POLY.map(function () { return { x: 0, y: 0 }; });
const _iconPts = [];

function hudScoreText(view) { return String(view.score); }
function hudLevelText(view) { return "LEVEL " + view.level; }

// GDD 4.3 through the §0 reading: purgeUses 0 bright, 1 dim (the weak second
// use is still there), 2 or more nothing.
function hudPurgeAlpha(uses) {
  if (uses <= 0) return 1;
  if (uses === 1) return C.HUD_PURGE_DIM_ALPHA;
  return 0;
}

// The deepest a reserve icon reaches, in SKIMMER_POLY `d` units (all ≤ 0).
function hudIconReach(poly) {
  let r = 0;
  for (let i = 0; i < poly.length; i++) if (-poly[i].d > r) r = -poly[i].d;
  return r;
}

function hudLayout(view) {
  const M = C.HUD_MARGIN, W = C.WORLD_W, H = C.WORLD_H;
  const inset = C.TOUCH_BUTTON_R * C.HUD_TOUCH_INSET_R;
  const left = M + (view.mirror ? inset : 0);
  const right = W - M - (view.mirror ? 0 : inset);
  const size = C.HUD_TEXT_SIZE;
  const charW = size * C.TEXT_CHAR_W;

  const s = _hud.score;
  s.w = hudScoreText(view).length * charW; s.h = size;
  s.x = left; s.y = M;

  const l = _hud.level;
  l.w = hudLevelText(view).length * charW; l.h = size;
  l.x = right - l.w; l.y = M;

  const n = view.lives > 1 ? view.lives - 1 : 0;
  const S = C.HUD_ICON_SIZE;
  const v = _hud.lives;
  v.w = n > 0 ? n * S + (n - 1) * C.HUD_ICON_GAP : 0;
  v.h = S * C.HUD_ICON_DEPTH_SCALE * hudIconReach(view.icon);
  v.x = left; v.y = H - M - v.h;
  _hud.lifeIcons = n;

  const P = C.HUD_PURGE_SIZE;
  const p = _hud.purge;
  p.w = P; p.h = P;
  p.x = right - P; p.y = H - M - P;
  _hud.purgeAlpha = hudPurgeAlpha(view.purgeUses);

  return _hud;
}

// Called LAST from Game.draw(), so the HUD sits over the board. `view`:
//   score, lives, level, levelColor, purgeUses — the numbers shown
//   mirror  the touch buttons' side (H3); P7 sources it from the input module
//   icon    the reserve craft's local-space poly ({ l, d }, d ≤ 0 inward)
function drawHud(ctx, view) {
  const L = hudLayout(view);
  const size = C.HUD_TEXT_SIZE;

  drawText(ctx, hudScoreText(view), L.score.x, L.score.y, size, C.HUD_COLOR, "left");
  drawText(ctx, hudLevelText(view), L.level.x + L.level.w, L.level.y, size, view.levelColor, "right");

  // Reserve craft (H1): prongs on the rectangle's bottom edge, nose up.
  const poly = view.icon;
  while (_iconPts.length < poly.length) _iconPts.push({ x: 0, y: 0 });
  _iconPts.length = poly.length;
  const S = C.HUD_ICON_SIZE;
  const base = L.lives.y + L.lives.h;
  for (let k = 0; k < L.lifeIcons; k++) {
    const cx = L.lives.x + S / 2 + k * (S + C.HUD_ICON_GAP);
    for (let i = 0; i < poly.length; i++) {
      _iconPts[i].x = cx + poly[i].l * S / 2;
      _iconPts[i].y = base + poly[i].d * S * C.HUD_ICON_DEPTH_SCALE;
    }
    drawPoly(ctx, _iconPts, true);
    glowStroke(ctx, C.HUD_COLOR, C.HUD_LINE_W, 1);
  }

  if (L.purgeAlpha > 0) {
    const r = C.HUD_PURGE_SIZE / 2;
    const cx = L.purge.x + r, cy = L.purge.y + r;
    for (let i = 0; i < PURGE_GLYPH_POLY.length; i++) {
      _purgePts[i].x = cx + PURGE_GLYPH_POLY[i].x * r;
      _purgePts[i].y = cy + PURGE_GLYPH_POLY[i].y * r;
    }
    drawPoly(ctx, _purgePts, true);
    glowStroke(ctx, C.HUD_COLOR, C.HUD_LINE_W, L.purgeAlpha);
  }
}

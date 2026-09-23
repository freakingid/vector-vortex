// 15-render-hud.js — the in-play HUD (GDD 10.4; CS008 P4) and the menu model
// (GDD 10.5; CS008 P5). The menu half is kit-menu's draft (CLAUDE.md, Modules
// built here; backport packet src/15-render-hud.NOTES.md); the HUD half is
// built to the same boundary.
//
// ⛔ drawHud(ctx, view) READS NO GAME STATE. Everything it shows arrives on the
// view Game.draw() fills — score, lives, level, the level's colour, purgeUses,
// the mirror flag, the reserve icon's point array, CS012 P5's jump reading and
// P4's combo reading — and the only global it reads is C, for sizes. Nothing
// here reads `state`, WELLS or the Skimmer.
//
// ⛔ hudLayout(view) IS THE ONE PLACE A CORNER IS PLACED, and drawHud draws
// inside the rectangles it returns. test-cs008-p4.js asserts those rectangles
// clear of the throat zone on all sixteen wells (GDD 10.3) and clear of both
// touch buttons, mirrored and not (H3). A text rectangle is sized by
// C.TEXT_CHAR_W, never measureText(), so that assertion is arithmetic.
//
// ⛔ Text goes through drawText() and nothing else; icons, the Purge glyph and
// CS012 P5's jump glyph go through drawPoly + glowStroke (GDD 10.2). No fills,
// no rectangles drawn — the readiness ring is a POLYLINE, never ctx.arc.

// The Purge glyph (GDD 4.3): an eight-point burst, closed, unit radius. Shape
// DATA; the scale is C.HUD_PURGE_SIZE. ⚠ Provisional art, like the palette.
const PURGE_GLYPH_POLY = [
  { x:  0.00, y: -1.00 }, { x:  0.30, y: -0.30 },
  { x:  1.00, y:  0.00 }, { x:  0.30, y:  0.30 },
  { x:  0.00, y:  1.00 }, { x: -0.30, y:  0.30 },
  { x: -1.00, y:  0.00 }, { x: -0.30, y: -0.30 },
];

// ⛔ THE JUMP GLYPH, OVERDRIVE ONLY (GDD 10.4, 14.2; O8): a craft RAISED off a
// short rim line, which is the same picture the well shows when the player is
// airborne. Shape DATA in the glyph box's own [-1, 1] space, y DOWN; the scale
// is C.HUD_JUMP_SIZE * C.HUD_JUMP_CRAFT. ⚠ Provisional art, like the Purge
// glyph's. The craft is the reserve icon's silhouette read the same way round
// — prongs out, nose up — so the two HUD craft cannot drift apart.
const JUMP_GLYPH_POLY = [
  { x: -1.00, y:  0.10 },   // left prong
  { x: -0.42, y: -0.16 },
  { x:  0.00, y: -0.02 },   // the notch
  { x:  0.42, y: -0.16 },
  { x:  1.00, y:  0.10 },   // right prong
  { x:  0.00, y: -0.70 },   // the nose, raised
];
// The rim it has left: an OPEN two-point line under the craft.
const JUMP_RIM_POLY = [{ x: -1.00, y: 0.72 }, { x: 1.00, y: 0.72 }];

// ⛔ THE COMBO READOUT, OVERDRIVE ONLY (GDD 10.4, 14.4; O8): "×N" centre-top,
// loud, absent at ×1, inside a depletion RING that empties over
// C.COMBO_WINDOW. ⛔ The ring is an ELLIPSE rather than a circle, and that is
// arithmetic: the widest reading is C.HUD_COMBO_CHARS characters at
// C.HUD_COMBO_SIZE, 138.88 px against a 56 px em box, so a circle around it
// would be 148 px tall and could not clear the Fan well's throat zone
// (00-config.js). It is still one polyline through drawPoly + glowStroke.

// ⛔ NO PER-FRAME ALLOCATION beyond the strings themselves: the layout, its
// rectangles and both point scratches are module-level and rewritten per call.
// Like entityPoints(), that makes hudLayout() non-reentrant — copy what you keep.
const _hud = {
  score: { x: 0, y: 0, w: 0, h: 0 },
  lives: { x: 0, y: 0, w: 0, h: 0 },
  level: { x: 0, y: 0, w: 0, h: 0 },
  purge: { x: 0, y: 0, w: 0, h: 0 },
  jump: { x: 0, y: 0, w: 0, h: 0 },
  combo: { x: 0, y: 0, w: 0, h: 0 },
  lifeIcons: 0,      // reserve craft drawn: lives − 1, never below 0 (H1)
  purgeAlpha: 0,     // 1 bright, C.HUD_PURGE_DIM_ALPHA dim, 0 absent
  jumpAlpha: 0,      // 1 ready, C.HUD_PURGE_DIM_ALPHA cooling, 0 airborne or Classic
  jumpRing: 0,       // 0..1 of the readiness ring drawn — 0 when ready, 0 when absent
  comboAlpha: 0,     // 1 shown, 0 absent — Classic, and Overdrive at ×1
  comboRing: 0,      // 0..1 of the depletion ring still standing (full on a kill)
};

const _purgePts = PURGE_GLYPH_POLY.map(function () { return { x: 0, y: 0 }; });
const _jumpPts = JUMP_GLYPH_POLY.map(function () { return { x: 0, y: 0 }; });
const _jumpRimPts = JUMP_RIM_POLY.map(function () { return { x: 0, y: 0 }; });
const _ringPts = [];
const _comboRingPts = [];
const _iconPts = [];

// ⛔ EACH HUD STRING IS BUILT ONCE PER VALUE, NEVER PER FRAME (CS017 P1's S3
// addendum; GDD 17): the value shown is the cache's key, compared by identity,
// which allocates nothing, so a steady HUD frame builds no string at all.
let _scoreKey = null, _scoreText = "";
let _levelKey = null, _levelText = "";
let _comboKey = null, _comboText = "";

function hudScoreText(view) {
  if (view.score !== _scoreKey) { _scoreKey = view.score; _scoreText = String(view.score); }
  return _scoreText;
}
function hudLevelText(view) {
  if (view.level !== _levelKey) { _levelKey = view.level; _levelText = "LEVEL " + view.level; }
  return _levelText;
}

// GDD 14.4's multiplier, on C.COMBO_STEP's half-step lattice: "×4", "×3.5".
// ⛔ A whole number carries NO decimal, so the widest reading is four
// characters and C.HUD_COMBO_CHARS is a constant rather than a measurement.
function hudComboText(view) {
  const m = view.combo;
  if (m !== _comboKey) { _comboKey = m; _comboText = "×" + (m % 1 === 0 ? String(m) : m.toFixed(1)); }
  return _comboText;
}

// O8's two conditions, and they are deliberately two: ⛔ OVERDRIVE ONLY, and
// ⛔ ABSENT AT ×1. Classic's multiplier never leaves 1, so either alone would
// hide it there — which is exactly why both are written down.
function hudComboAlpha(view) {
  if (view.mode !== "overdrive") return 0;
  return typeof view.combo === "number" && view.combo > 1 ? 1 : 0;
}
// The depletion ring: FULL on a kill, empty at the lapse (O8). 0 when the
// readout is absent, so nothing is drawn around nothing.
function hudComboRing(view) {
  if (hudComboAlpha(view) <= 0) return 0;
  const f = view.comboFill;
  if (typeof f !== "number" || !(f > 0)) return 0;
  return f > 1 ? 1 : f;
}

// GDD 4.3 through the §0 reading: purgeUses 0 bright, 1 dim (the weak second
// use is still there), 2 or more nothing.
function hudPurgeAlpha(uses) {
  if (uses <= 0) return 1;
  if (uses === 1) return C.HUD_PURGE_DIM_ALPHA;
  return 0;
}

// O8's three readings of `view.jump`, which is null in Classic and whenever no
// run has a jump: bright when ready, dim with a filling ring while cooling,
// ⛔ ABSENT while airborne — the well is already showing the player that, on
// two channels, and a fourth mark on a moment that lasts C.JUMP_TIME is noise.
// ⛔ A ring only while cooling: a full ring beside a bright glyph says nothing
// the glyph does not.
function hudJumpAlpha(jump) {
  if (!jump || jump.airborne) return 0;
  return jump.ready ? 1 : C.HUD_PURGE_DIM_ALPHA;
}
function hudJumpRing(jump) {
  if (!jump || jump.airborne || jump.ready) return 0;
  const r = jump.ring;
  return typeof r === "number" && r > 0 ? (r > 1 ? 1 : r) : 0;
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

  // ⛔ THE JUMP GLYPH GOES BESIDE THE PURGE GLYPH AND MOVES NOTHING (O8;
  // CS012 P5). It is placed OFF the Purge rectangle, on the same baseline, so
  // the four rectangles above are bit-identical whether or not `view.jump` is
  // there — which is the Classic HUD's guarantee, asserted in
  // test-cs012-p5.js. ⛔ The rectangle is the RING's extent, not the craft's:
  // it is what the throat-zone and touch-button assertions are made against,
  // so it has to be the whole footprint.
  const J = C.HUD_JUMP_SIZE;
  const j = _hud.jump;
  j.w = J; j.h = J;
  j.x = p.x - C.HUD_JUMP_GAP - J; j.y = H - M - J;
  _hud.jumpAlpha = hudJumpAlpha(view.jump);
  _hud.jumpRing = hudJumpRing(view.jump);

  // ⛔ THE COMBO READOUT IS CENTRE-TOP AND MOVES NOTHING (O8; CS012 P4). Like
  // the jump glyph it is placed absolutely, off no other rectangle, so the four
  // CS008 corners are bit-identical whether or not it is shown — the Classic
  // HUD's guarantee, asserted in test-cs012-p4.js.
  // ⛔ THE RECTANGLE IS THE RING'S EXTENT AT ITS WIDEST READING, not this
  // frame's text: it is what the throat-zone and touch-button assertions are
  // made against, so it has to be the whole footprint, and a constant footprint
  // is what stops the ring breathing as the multiplier crosses a whole number.
  const csize = C.HUD_COMBO_SIZE;
  const crx = C.HUD_COMBO_CHARS * csize * C.TEXT_CHAR_W / 2 + C.HUD_COMBO_PAD;
  const cry = csize / 2 + C.HUD_COMBO_PAD;
  const cb = _hud.combo;
  cb.w = crx * 2; cb.h = cry * 2;
  cb.x = W / 2 - crx; cb.y = C.HUD_COMBO_Y;
  _hud.comboAlpha = hudComboAlpha(view);
  _hud.comboRing = hudComboRing(view);

  return _hud;
}

// Called LAST from Game.draw(), so the HUD sits over the board. `view`:
//   score, lives, level, levelColor, purgeUses — the numbers shown
//   mirror  the touch buttons' side (H3), the input module's live flag since P7
//   icon    the reserve craft's local-space poly ({ l, d }, d ≤ 0 inward)
//   jump    null in Classic; otherwise { airborne, ready, ring } (O8, CS012 P5)
//   combo, comboFill, mode
//           GDD 14.4's multiplier, its window's remaining fraction, and the
//           run's mode — the readout's Overdrive gate (O8, CS012 P4)
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

  // ⛔ THE JUMP GLYPH (O8), and ⛔ the same three rules as everything else here:
  // drawPoly + glowStroke, no fill, no rectangle. Absent at alpha 0, which is
  // Classic and airborne both — so the Classic HUD draws exactly what it drew
  // before CS012 P5.
  if (L.jumpAlpha > 0) {
    const R = C.HUD_JUMP_SIZE / 2;
    const cx = L.jump.x + R, cy = L.jump.y + R;
    const g = R * C.HUD_JUMP_CRAFT;
    for (let i = 0; i < JUMP_GLYPH_POLY.length; i++) {
      _jumpPts[i].x = cx + JUMP_GLYPH_POLY[i].x * g;
      _jumpPts[i].y = cy + JUMP_GLYPH_POLY[i].y * g;
    }
    drawPoly(ctx, _jumpPts, true);
    glowStroke(ctx, C.HUD_COLOR, C.HUD_LINE_W, L.jumpAlpha);

    for (let i = 0; i < JUMP_RIM_POLY.length; i++) {
      _jumpRimPts[i].x = cx + JUMP_RIM_POLY[i].x * g;
      _jumpRimPts[i].y = cy + JUMP_RIM_POLY[i].y * g;
    }
    drawPoly(ctx, _jumpRimPts, false);
    glowStroke(ctx, C.HUD_COLOR, C.HUD_LINE_W, L.jumpAlpha);

    // ⛔ THE RING IS A POLYLINE, NOT AN ARC (GDD 10.2 — drawPoly + glowStroke
    // is the one path, and ctx.arc would be a second). It FILLS clockwise from
    // twelve o'clock as the cooldown runs, so the moment it closes is the
    // moment the glyph goes bright. Its radius is R, which is why the layout
    // rectangle is the ring's diameter and not the craft's.
    if (L.jumpRing > 0) {
      const segs = Math.max(1, Math.round(C.HUD_JUMP_RING_SEG * L.jumpRing));
      const span = 2 * Math.PI * L.jumpRing;
      while (_ringPts.length < segs + 1) _ringPts.push({ x: 0, y: 0 });
      _ringPts.length = segs + 1;
      for (let i = 0; i <= segs; i++) {
        const a = -Math.PI / 2 + span * (i / segs);
        _ringPts[i].x = cx + Math.cos(a) * R;
        _ringPts[i].y = cy + Math.sin(a) * R;
      }
      drawPoly(ctx, _ringPts, false);
      glowStroke(ctx, C.HUD_COLOR, C.HUD_LINE_W, L.jumpAlpha);
    }
  }

  // ⛔ THE COMBO READOUT (O8), and the same three rules again: drawText() for
  // the text, drawPoly + glowStroke for the ring, no fill and no rectangle.
  // Absent at alpha 0, which is Classic and ×1 both — so the Classic HUD draws
  // exactly what it drew before CS012 P4.
  if (L.comboAlpha > 0) {
    const cx = L.combo.x + L.combo.w / 2, cy = L.combo.y + L.combo.h / 2;
    drawText(ctx, hudComboText(view), cx, cy - C.HUD_COMBO_SIZE / 2,
             C.HUD_COMBO_SIZE, C.HUD_COLOR, "center");

    // ⛔ THE RING DEPLETES ANTICLOCKWISE FROM TWELVE O'CLOCK as the window
    // runs, so the moment it closes on nothing is the moment the multiplier
    // falls. ⛔ A POLYLINE, never ctx.arc (GDD 10.2), and an ELLIPSE rather
    // than a circle — the reading is wider than it is tall.
    if (L.comboRing > 0) {
      const rx = L.combo.w / 2, ry = L.combo.h / 2;
      const segs = Math.max(1, Math.round(C.HUD_COMBO_RING_SEG * L.comboRing));
      const span = 2 * Math.PI * L.comboRing;
      while (_comboRingPts.length < segs + 1) _comboRingPts.push({ x: 0, y: 0 });
      _comboRingPts.length = segs + 1;
      for (let i = 0; i <= segs; i++) {
        const a = -Math.PI / 2 - span * (i / segs);
        _comboRingPts[i].x = cx + Math.cos(a) * rx;
        _comboRingPts[i].y = cy + Math.sin(a) * ry;
      }
      drawPoly(ctx, _comboRingPts, false);
      glowStroke(ctx, C.HUD_COLOR, C.HUD_LINE_W, L.comboAlpha);
    }
  }
}

// ---------------------------------------------------------------------------
// THE MENU MODEL — kit-menu's draft (GDD 10.5; CS008 P5)
// ---------------------------------------------------------------------------
//
// ⛔ createMenu() READS NO GAME GLOBAL — not `state`, not C, not a game
// function. Its one tunable arrives as an option, and everything else crosses
// as a parameter:
//
//   screen  DATA the host owns: { items: [{ label, detail, enabled, action }],
//           back }. `back` is an action name or null (a root screen).
//   input   the host's input snapshot for this step: { rotate, fire, purge }.
//   return  an action NAME, or null. The host decides what a name does.
//
// ⛔ FIRE AND PURGE ARE RISING EDGES, against "held last step", so a held
// button confirms once, not sixty times a second. The snapshot stays levels. Rotate ACCUMULATES, and each whole `rotateStep` moves the cursor one
// enabled row: a keyboard tap (exactly one lane) is one row, a mouse flick
// several. The cursor CLAMPS at the ends and SKIPS rows that are not enabled,
// so a disabled row can be shown and never chosen.
//
// ⛔ reset() IS THE HOST'S "THE SCREEN CHANGED". The next step after it is an
// ENTRY step: the cursor goes to the first enabled row, the accumulator
// empties, whatever is held right now is latched as already held, a queued
// back() is dropped, and the step returns null. That is what makes a press
// that began before the screen appeared — during a death freeze, or the press
// that opened it — do nothing until it is released and pressed again.

const MENU_VERSION = "0.1.0";

function createMenu(options) {
  const opts = options || {};
  const rotateStep = opts.rotateStep;
  if (typeof rotateStep !== "number" || !isFinite(rotateStep) || rotateStep <= 0) {
    throw new Error("createMenu: options.rotateStep must be a positive finite number");
  }

  let entry = true;
  let cursor = 0;
  let acc = 0;
  let prevFire = false, prevPurge = false;
  let backQueued = false;

  function firstEnabled(items) {
    for (let i = 0; i < items.length; i++) if (items[i].enabled) return i;
    return 0;
  }

  // One enabled row per unit of `n`, never past either end. ⛔ Bounded by the
  // row count, so a huge flick costs one pass over the list and no more.
  function moveBy(items, n) {
    const dir = n > 0 ? 1 : -1;
    let left = Math.min(Math.abs(n), items.length);
    while (left-- > 0) {
      let i = cursor + dir;
      while (i >= 0 && i < items.length && !items[i].enabled) i += dir;
      if (i < 0 || i >= items.length) return;
      cursor = i;
    }
  }

  function step(screen, input) {
    const items = screen.items;
    const fire = !!input.fire, purge = !!input.purge;
    if (entry) {
      entry = false;
      cursor = firstEnabled(items);
      acc = 0;
      prevFire = fire; prevPurge = purge;
      backQueued = false;
      return null;
    }

    acc += input.rotate;
    const whole = Math.trunc(acc / rotateStep);
    if (whole !== 0) { acc -= whole * rotateStep; moveBy(items, whole); }

    const fireEdge = fire && !prevFire;
    const purgeEdge = purge && !prevPurge;
    prevFire = fire; prevPurge = purge;

    if (purgeEdge || backQueued) {
      backQueued = false;
      if (screen.back) return screen.back;
    }
    if (fireEdge && items[cursor] && items[cursor].enabled) return items[cursor].action;
    return null;
  }

  return {
    VERSION: MENU_VERSION,
    step,
    reset() { entry = true; },
    // A back request from outside the snapshot — a named key action. Consumed
    // by the next step, and dropped by an entry step like any other press.
    back() { backQueued = true; },
    get cursor() { return cursor; },
  };
}

// The first row the window shows: the cursor centred where it can be, pinned
// to either end where it cannot.
function menuWindowStart(count, cursor, visible) {
  const max = count > visible ? count - visible : 0;
  const first = cursor - Math.floor(visible / 2);
  return first < 0 ? 0 : first > max ? max : first;
}

const _chevronPts = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

// A menu over whatever Game.draw() painted first. `view`:
//   title, lines  strings shown above the rows (lines may be empty)
//   items, cursor the screen's rows and the model's cursor
// ⛔ Like drawHud it reads no game state, and like drawHud it reads C for
// sizes and colours — the gap kit-menu's extraction owes an options argument
// for (src/15-render-hud.NOTES.md).
function drawMenu(ctx, view) {
  const cx = C.WORLD_W / 2;
  const size = C.MENU_TEXT_SIZE;
  const rowH = C.MENU_ROW_H;

  drawText(ctx, view.title, cx, C.MENU_TITLE_Y, C.MENU_TITLE_SIZE, C.MENU_COLOR, "center");

  let y = C.MENU_TOP_Y;
  for (let i = 0; i < view.lines.length; i++, y += rowH) {
    drawText(ctx, view.lines[i], cx, y, size, C.MENU_COLOR, "center");
  }
  if (view.lines.length) y += rowH;

  const items = view.items;
  const first = menuWindowStart(items.length, view.cursor, C.MENU_VISIBLE_ROWS);
  const last = Math.min(items.length, first + C.MENU_VISIBLE_ROWS);
  const labelX = cx - C.MENU_COL_W / 2;
  const detailX = cx + C.MENU_COL_W / 2;
  for (let i = first; i < last; i++, y += rowH) {
    const it = items[i];
    const color = !it.enabled ? C.MENU_LOCKED_COLOR
                : i === view.cursor ? C.MENU_COLOR : C.MENU_IDLE_COLOR;
    drawText(ctx, it.label, labelX, y, size, color, "left");
    if (it.detail) drawText(ctx, it.detail, detailX, y, size, color, "right");
    if (i === view.cursor) {
      const S = C.MENU_CHEVRON_SIZE;
      const tipX = labelX - C.MENU_CHEVRON_GAP, midY = y + size / 2;
      _chevronPts[0].x = tipX - S; _chevronPts[0].y = midY - S;
      _chevronPts[1].x = tipX;     _chevronPts[1].y = midY;
      _chevronPts[2].x = tipX - S; _chevronPts[2].y = midY + S;
      drawPoly(ctx, _chevronPts, false);
      glowStroke(ctx, C.MENU_COLOR, C.MENU_LINE_W, 1);
    }
  }
}

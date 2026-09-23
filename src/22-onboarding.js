// 22-onboarding.js — the first-run prompts (GDD 12). CS016 P1 (plan N2–N5, N11).
//
// Non-modal lines, once per PROFILE, drawn in the prompt band under every rim
// and never pausing anything. Three top-level functions, so a soak can stub or
// spy each by name (a function inside Game's closure cannot be reached):
//   promptScan(state, well, seen, queue)  the triggers — one branch per id
//   promptStep(queue, dt)                 the queue's count-up clock
//   drawPrompt(ctx, queue)                the line, through drawText()
// and the queue's bag, `promptQueue`. 23-main.js calls them at their seats.
//
// ⛔ NOTHING HERE IS ON `state`, AND NOTHING HERE WRITES IT (plan §8). The scan
// reads the board and spends no draw, reads no clock and writes no `state`;
// the queue and its clock are this file's bag; the seen set is Meta's. So a
// session with promptScan() and promptStep() stubbed hashes identically, step
// for step (test-cs016-p1.js), and the simulation can branch on none of it.
//
// ⛔ THIS FILE CALLS NO STORAGE. Meta (22-meta.js) owns the seen set: it loads
// it at a profile's activation, MARKS an id in its closure (promptSeen) and
// WRITES only at saveTelemetry()'s seats (savePrompts), because no play step
// but the clear edge may write (test-cs015-p2.js). ⛔ And no device token: the
// input path is 04-input.js's alone (test-cs002-p1.js scans this slice).
//
// ⛔ THE IDS ARE STORED BUT ARE NOT SAVE DATA IN THE ACHIEVEMENTS' SENSE: a
// renamed id costs a player one repeat of one line, so they are chosen for
// readability, not permanence. C.PROMPTS is { id, text } and nothing else;
// every trigger is code, here (plan §7).
//
// It is game glue, not kit-shaped: it reads `state` by design and is on no
// extraction list.

// The queue: rows of C.PROMPTS in trigger order, the head showing, and the
// head's clock, counting UP from 0 (GDD 16.3). One line at a time, each for
// the full C.PROMPT_TIME. startGame() empties it — a run's prompts belong to
// the run — and a death keeps it.
const promptQueue = { rows: [], t: 0 };

function promptReset(queue) {
  queue.rows.length = 0;
  queue.t = 0;
}

// Whether any live entity on the board is an instance of `Kind`. Read after
// the end-of-frame filters, so every entry is alive.
function promptBoardHas(list, Kind) {
  for (let i = 0; i < list.length; i++) if (list[i] instanceof Kind) return true;
  return false;
}

// ⛔ THE TRIGGERS, ONE BRANCH PER ID, AND EVERY ONE A BOARD READ (plan §7):
// the class by instanceof, never a kind string. An id with no branch here
// never fires (a row added to C with no trigger is a row that waits).
function promptFires(id, state, well) {
  switch (id) {
    // The profile's first play step. Once per profile makes "first frame" and
    // "the first run's first frame" the same step.
    case "rotate":   return true;
    case "carrier":  return promptBoardHas(state.enemies, Carrier);
    case "thorn":    return promptBoardHas(state.enemies, Thorn);
    case "drifter":  return promptBoardHas(state.enemies, Drifter);
    case "surger":   return promptBoardHas(state.enemies, Surger);
    // Any play step in an open well — a Start Depth 9 run sees it in its first.
    case "openWell": return !well.closed;
    // The first USE, when "one per well" means something.
    case "purge":    return state.purgeUses >= 1;
    // N2's rows 8–12 (Paul, 2026-09-23). Rows 8–11 read something only an
    // Overdrive run's schedule ever releases, so none needs a mode test.
    case "token":    return state.tokens.length > 0;
    case "rings":    return state.dive.active && state.dive.rings.length > 0;
    case "warden":   return promptBoardHas(state.enemies, Warden);
    case "mimic":    return promptBoardHas(state.enemies, Mimic);
    // An unlock is HEARD and never seen (GDD 10.5, no toast); this line says
    // where to look, once per profile, in either mode. Meta counts what
    // sounded() sounded since the profile was activated.
    case "unlock":   return Meta.unlocks() > 0;
  }
  return false;
}

// ⛔ ONE FIRE PER STEP, IN TABLE ORDER: the first unseen row whose trigger
// holds joins the queue and its id is returned for Meta to mark; two rows true
// on one step fire on consecutive steps. null when nothing fired.
// ⛔ ONCE EVERY ROW IS SEEN IT READS NO BOARD AT ALL — the size test comes
// first, and an unseen row is the only thing that reaches promptFires().
// `seen` is Meta.promptsSeen(), read-only here; it holds known ids only.
function promptScan(state, well, seen, queue) {
  const rows = C.PROMPTS;
  if (seen.size >= rows.length) return null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (seen.has(row.id)) continue;
    if (promptFires(row.id, state, well)) {
      queue.rows.push(row);
      return row.id;
    }
  }
  return null;
}

// ⛔ ON PLAY STEPS ONLY, a dive's included: a pause holds the line and a dive
// runs it on. Counts UP; the head leaves on the step its clock reaches
// C.PROMPT_TIME, and the next row starts from 0.
function promptStep(queue, dt) {
  if (queue.rows.length === 0) return;
  queue.t += dt;
  if (queue.t >= C.PROMPT_TIME) {
    queue.rows.shift();
    queue.t = 0;
  }
}

// C.PROMPT_COLOR as its three channels, parsed once, for the fade's rgba().
// drawText() sets its own globalAlpha for the glow's two passes, so a fade is
// carried in the colour rather than in the context.
const _promptRgb = (function () {
  const h = C.PROMPT_COLOR.replace("#", "");
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(",");
})();

// The head's alpha: 1, then a linear fade over the last C.PROMPT_FADE.
// A reading of the clock, never a clock of its own.
function promptAlpha(queue) {
  const left = C.PROMPT_TIME - queue.t;
  if (C.PROMPT_FADE > 0 && left < C.PROMPT_FADE) return left > 0 ? left / C.PROMPT_FADE : 0;
  return 1;
}

// ⛔ THE LINE, CENTRED IN THE BAND, THROUGH drawText() AND NOTHING ELSE — no
// rectangle, no fill, no HUD edit (GDD 10.2, 10.4). Game.draw() calls it after
// the well and the Dive's rungs and BEFORE the tokens, enemies, shots and
// craft: an airborne craft reaches y 666 and goes OVER the line (GDD 1.1 P2).
// Reads the bag and writes nothing.
function drawPrompt(ctx, queue) {
  if (queue.rows.length === 0) return;
  const a = promptAlpha(queue);
  if (!(a > 0)) return;
  const color = a >= 1 ? C.PROMPT_COLOR : "rgba(" + _promptRgb + "," + a.toFixed(3) + ")";
  drawText(ctx, queue.rows[0].text, C.WORLD_W / 2, C.PROMPT_Y, C.PROMPT_SIZE, color, "center");
}

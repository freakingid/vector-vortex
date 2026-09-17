// 07-enemies-overdrive.js — OVERDRIVE'S ROSTER (GDD 6.4, 13, 14.6). CS012 P2
// ships the Reaver; CS013 adds the Warden and the Mimic.
//
// ⛔ THE CONTRACT IS 07-enemies.js's, AND IT IS READ THERE FIRST. The eight
// fields, the four methods, the one array, the one spawn entry point and the
// wiring points (GDD 6.5) are written down in that file's base class and are not
// repeated here. Every class below states its eight answers as plan §9 did.
//
// ⛔ WHY A SECOND FILE (Paul's O15). 07-enemies.js was 71 KB, 65 % comment, at
// CS012's plan, and the seam falls where the roster does: Classic there,
// Overdrive here. Nothing moved out of it. build.js's MANIFEST concatenates this
// module directly after that one, because the classes here extend classes
// there, and before 08-spawner.js, whose ENEMY_KINDS names them.
//
// ⛔ AN OVERDRIVE ENEMY REACHES THE BOARD ONLY THROUGH C.SPAWN_SCHEDULE_OVERDRIVE
// (08-spawner.js's eligibleKinds), so a Classic run never releases one. There
// is no bench key for any of them (O16).

// ---------------------------------------------------------------------------
// The Reaver (GDD 14.6) — "Vaulter at 1.6x that vaults toward the Skimmer".
// Overdrive L6+, 300 points. Killed by any shot or the Purge; kills by contact
// at the rim.
// ---------------------------------------------------------------------------
//
// ⛔ A PARAMETER VARIANT OF THE VAULTER, AND THAT IS WHY IT SUBCLASSES ONE (R9).
// It overrides two readers and a rate and inherits everything else: the climb,
// the park depth, the rim hunt, laneHop()'s fold at an open well's wall, onShot
// and the eight fields. ⛔ This is not the slope 07-enemies.js's base warns
// about: `Enemy` still carries no behaviour; a variant inheriting its parent's
// is what GDD 14.6 describes.
//
// ⛔ WHAT 1.6x SCALES (Paul's O1): THE HOP, NEVER THE CLIMB. The hop duration and
// both hop intervals are divided by C.REAVER_HOP_RATE. The climb is the
// Vaulter's own `C.VAULT_CLIMB * climbMult()`, because a Reaver that CLIMBED at
// 1.6x would breach GDD 4.4's respawn guarantee from level 1 (MEASURED,
// PLANNED-FEATURES-CS012.md §1.1). Heat scales the intervals through the
// Vaulter's accessors and never the hop duration (H2).
//
// ⛔ "VAULTS TOWARD THE SKIMMER" (O1's reading): every MID-CLIMB hop takes
// huntDir(), the rim hunt's direction, from its first update and with no level
// gate. It holds its lane while it is in the Skimmer's. At the rim it hunts
// exactly as a Vaulter does, at its own interval.
//
// The eight fields: (lane, depth) a position; `purgeable` true (GDD 4.3 exempts
// only the Thorn); `blocksClear` true, so it is never on the board at a clear
// and never a Dive survivor; `killDepth` the rim band `1 - C.RIM_CONTACT_DEPTH`;
// `anchored` false, so respawnSkimmer() pushes it to 0.55 and the guarantee
// holds because its climb is a Vaulter's; `sfxVoice` "reaver". It is not cargo
// (R16).
class Reaver extends Vaulter {
  constructor(lane, depth, dir) {
    super(lane, depth, dir);
    this.sfxVoice = "reaver";   // C.SFX_KILL_PITCH.reaver, from tools/sfx-lab.html
    this.hopRate = C.REAVER_HOP_RATE;
  }

  // ⛔ Toward the Skimmer at every mid-climb beat, and 0 (hold) in its lane.
  midClimbDir(well, state) {
    return this.huntDir(well, state);
  }

  // ⛔ The rate, and never heat.
  hopDuration() {
    return C.VAULT_HOP_TIME / this.hopRate;
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2), in 14-render-entities.js.
  draw(ctx, well) {
    drawReaver(ctx, well, this.lane, this.depth);
  }

  // GDD 7. The kill site pays it; the entity never scores itself.
  points() { return C.PTS_REAVER; }
}

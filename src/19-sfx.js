// 19-sfx.js — the game's side of the audio engine: the instances, built from C.
//
// ⛔ 16-audio-engine.js is kit-shaped and reads no game global. THIS file is
// where C crosses into it, exactly as 23-main.js hands createInput() its
// tunables. Verbose on purpose.
//
// ⛔ THE NOISE SOURCE IS ITS OWN STREAM, from its own seed (01-rng.js's header),
// and never the run's: an audio draw must not move a spawn lane.
//
// ⛔ EVERY FUNCTION IN THIS FILE RETURNS EARLY WHILE AudioSys.ctx IS NULL, so
// nothing sounds before the first user gesture and the headless suite, which
// has no audio API, runs every call as a no-op. The context is created by
// AudioSys.unlock(), which 23-main.js passes to createInput() as onGesture.

// The tracks are MUSIC_TRACKS, declared in 17-audio-tracks.js (the lab's BLOCK
// B). Nothing here edits them.

const AudioSys = createAudioEngine({
  volRamp: C.AUDIO_VOL_RAMP,
  vol: {
    master: C.AUDIO_VOL_DEFAULT / C.AUDIO_VOL_STEPS,
    music:  C.AUDIO_VOL_DEFAULT / C.AUDIO_VOL_STEPS,
    sfx:    C.AUDIO_VOL_DEFAULT / C.AUDIO_VOL_STEPS,
    voice:  C.AUDIO_VOL_DEFAULT / C.AUDIO_VOL_STEPS,
  },
});

const MusicSys = createMusic(AudioSys, {
  tracks:    MUSIC_TRACKS,
  lookahead: C.MUSIC_LOOKAHEAD,
  crossfade: C.MUSIC_CROSSFADE,
  fadeOut:   C.MUSIC_FADE_OUT,
  noise:     mulberry32(C.AUDIO_NOISE_SEED),
  // kit-audio 0.3.0's groups (CS010 P1). No director drives them yet: every
  // gate is open, the sweep is fully open, and the duck and dip sit at unity.
  gating:    { thresholds: C.LAYER_THRESHOLD, ramp: C.LAYER_CROSSFADE },
  sweep:     { minHz: C.FILTER_MIN_HZ, maxHz: C.FILTER_MAX_HZ, q: C.FILTER_Q, tc: C.FILTER_TC },
  limiter:   C.MUSIC_LIMIT,
  duck:      { gain: C.MUSIC_DUCK_GAIN, ramp: C.MUSIC_DUCK_RAMP, dipGain: C.MUSIC_DIP_GAIN, dipHold: C.MUSIC_DIP_HOLD },
});

// ⛔ THE INTENSITY DIRECTOR (CS010 P2; GDD 11.4), built from C. The input names
// are 23-main.js's dangerInputs() fields, which is the one reader of the board.
// `combo` is always 0 in Classic (D6), and nothing is rescaled for it.
const Director = createDirector({
  attack:  C.INT_ATTACK,
  release: C.INT_RELEASE,
  weights: {
    count:     C.INT_W_COUNT,
    proximity: C.INT_W_PROXIMITY,
    combo:     C.INT_W_COMBO,
    peril:     C.INT_W_PERIL,
    heat:      C.INT_W_HEAT,
  },
});

// The SFX player (CS009 P4). Its noise is a SECOND instance of the audio seed's
// stream, so it shares no draws with MusicSys's buffer or with the run. The
// recipes are C.SFX; the seats call sfx() below.
const Sfx = createSfxPlayer(AudioSys, {
  noise: mulberry32(C.AUDIO_NOISE_SEED),
});

// ⛔ THE ONE CALL EVERY SEAT MAKES (CS009 P5; plan §7): sfx(name, voice). `name`
// is a C.SFX event; `voice` is an entity's sfxVoice, and only the kill passes
// one — it picks the pitch from C.SFX_KILL_PITCH, and anything unknown plays
// the recipe at its own pitch. ⛔ A SEAT WRITES NO `state` AND DRAWS NOTHING:
// this reads C and plays, so an audio-on run spends exactly the draws of an
// audio-off one. Headless and before the first gesture it returns at once.
function sfx(name, voice) {
  if (!AudioSys.ctx) return;
  const pitch = voice == null ? undefined : C.SFX_KILL_PITCH[voice];
  Sfx.play(C.SFX[name], { pitch });
  // ⛔ THE MUSIC DIPS RIDE ON THE SEAT (CS010 P2, R8; GDD 11.6): no seat of
  // their own, so the seat lines are unchanged.
  if (C.MUSIC_DIP_EVENTS.indexOf(name) >= 0) MusicSys.dip();
}

// ⛔ THE SURGER CHARGE TONE (GDD 6.3, 11.8; plan §7). A HELD voice per Surger
// in its telegraph, reconciled against the board once per frame by
// 23-main.js's audioFrame(), and ⛔ keyed by the entity in this Map — no field on
// the entity. Each frame the voice's pitch is set from chargeTip(), so the tone
// follows the fuse and never a clock of its own.
//
// `live` is what Game's audioFrame() reports about the frame:
//   true   play steps ran and the run is live: set() each telegraphing Surger's
//          voice, start the missing ones, stop the rest
//   false  the frame ends frozen or off play — pause, any menu, game over, the
//          death freeze: ⛔ STOP EVERY VOICE, so the tone cannot run ahead of a
//          frozen fuse or play out after one
//   null   the run is live but no step ran (a display faster than the step
//          rate): leave every voice as it is. The fuse did not move and is not
//          frozen, and a stop here would chop the tone every other frame at 120 Hz.
// A Surger is found by what it reads, not its class: a `chargeTip()` and the
// phase "telegraph". One that died or was filtered is simply not seen.
const SURGE_TONES = new Map();   // entity -> { voice, frame }
let surgeToneFrame = 0;

function reconcileSurgeTones(enemies, live) {
  if (!AudioSys.ctx || live === null) return;
  surgeToneFrame++;
  if (live) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead || e.phase !== "telegraph" || typeof e.chargeTip !== "function") continue;
      let tone = SURGE_TONES.get(e);
      if (!tone) { tone = { voice: Sfx.hold(C.SFX.surgeCharge), frame: 0 }; SURGE_TONES.set(e, tone); }
      tone.frame = surgeToneFrame;
      tone.voice.set(e.chargeTip());
    }
  }
  for (const [e, tone] of SURGE_TONES) {
    if (tone.frame === surgeToneFrame) continue;
    tone.voice.stop();
    SURGE_TONES.delete(e);
  }
}

// ⛔ MUSIC BY SCREEN (CS009 P3; plan §0's reading). PURE: four arguments in, a
// MusicSys state name out, and nothing read but C. 23-main.js's audioFrame()
// calls it every frame with the screen, where OPTIONS was opened from, the run's
// mode and the MUSIC TRACK setting.
//   title, mode, depth, and OPTIONS and its pages opened from the title: "title"
//   play (the dive is play), pause, and OPTIONS and its pages opened from pause:
//     the gameplay track, C.MODE_TRACK[mode] on "auto", else the setting itself
//   gameover: MUSIC_SILENCE, which createMusic fades out over C.MUSIC_FADE_OUT
// RESTART is a screen change to play, so it starts the gameplay track again.
const MUSIC_SILENCE = "off";   // a name with no track, and createMusic's starting state
const MUSIC_OPTIONS_PAGES = ["options", "controls", "keyboard", "gamepad", "credits"];

function musicStateFor(screen, optionsFrom, mode, trackSetting) {
  if (screen === "gameover") return MUSIC_SILENCE;
  const inRun = screen === "play" || screen === "pause" ||
                (optionsFrom === "pause" && MUSIC_OPTIONS_PAGES.indexOf(screen) >= 0);
  if (!inRun) return "title";
  return trackSetting === "auto" ? C.MODE_TRACK[mode] : trackSetting;
}

// ⛔ THE MENU DUCK BY SCREEN (CS010 P2; Paul's D9). PURE, beside musicStateFor:
// true on pause, and on OPTIONS and its pages opened from pause. Not on title,
// mode, START DEPTH, the title's OPTIONS, play or game over. These are also the
// screens where audioFrame() holds intensity and the sweep.
function duckFor(screen, optionsFrom) {
  return screen === "pause" ||
         (optionsFrom === "pause" && MUSIC_OPTIONS_PAGES.indexOf(screen) >= 0);
}

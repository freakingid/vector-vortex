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
});

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

// 18-audio-director.js — kit-audio's intensity director (GDD 11.4; CS010 P2).
//
// ⛔ KIT-SHAPED, and part of kit-audio (16-audio-engine.NOTES.md): no config
// object, no game object, no game global. The host names its inputs, weights
// them, and hands over a reading and a clock each frame. It names no game term.
//
// createDirector({ attack, release, weights }) -> { frame(inputs, now), reset(), level }
//   weights  { name: w >= 0 }. frame() reads inputs[name] for each, clamps
//            it to 0..1, and sums w * input; the sum is clamped to 0..1.
//   frame    smooths that sum on the clock it is handed (seconds), one pole:
//            level += (raw - level) * (1 - e^(-dt / tau)), tau = attack while
//            the sum is above the level, release otherwise. Returns the level.
//            ⛔ ASYMMETRIC ON PURPOSE: symmetric smoothing makes layers flutter.
//            The first frame after reset() only takes the clock (dt 0). A clock
//            that did not move forward moves nothing.
//   reset    level 0, and forget the clock.
//   level    the smoothed value, 0..1.
// ⛔ No allocation per frame.

function createDirector(opts) {
  const o = opts || {};
  function seconds(v, name) {
    if (typeof v !== "number" || !isFinite(v) || v <= 0) throw new Error("createDirector: " + name + " must be seconds > 0");
    return v;
  }
  const attack = seconds(o.attack, "attack");
  const release = seconds(o.release, "release");
  if (!o.weights || typeof o.weights !== "object") throw new Error("createDirector: weights is required");
  const names = Object.keys(o.weights);
  const weights = names.map(n => {
    const w = o.weights[n];
    if (typeof w !== "number" || !isFinite(w) || w < 0) throw new Error("createDirector: weight " + n + " must be a number >= 0");
    return w;
  });

  let level = 0;
  let last = null;   // the clock at the previous frame, or null after reset()

  return {
    frame(inputs, now) {
      let raw = 0;
      for (let i = 0; i < names.length; i++) raw += weights[i] * audioClamp01(inputs[names[i]]);
      raw = audioClamp01(raw);
      if (typeof now !== "number" || !isFinite(now)) return level;
      const dt = last === null ? 0 : now - last;
      last = now;
      if (dt > 0) {
        const tau = raw > level ? attack : release;
        level = audioClamp01(level + (raw - level) * (1 - Math.exp(-dt / tau)));
      }
      return level;
    },
    reset() { level = 0; last = null; },
    get level() { return level; },
  };
}

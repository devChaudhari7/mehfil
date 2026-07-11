/*
 * MEHFIL — the GrooveGL fragment shader (Phase 15).
 *
 * One program renders the whole light world on a black field that the canvas
 * screen-blends over the DOM (black = untouched, bright = light):
 *   pass 1 (15.2) — the lamp: a volumetric era-glow following the hand, with dust
 *                   motes drifting through the cone;
 *   pass 2 (15.3) — the groove tunnel: flying through the record during the dive;
 *   pass 3 (15.4) — disc materials: anisotropic vinyl sheen / CD thin-film.
 * Era colors arrive per frame from the live CSS tokens, so the palette morphs in
 * lockstep with the rest of the world for free.
 */

export const GROOVE_UNIFORMS = [
  "uRes",
  "uTime",
  "uPointer",
  "uGlow",
  "uAccent",
  "uAccent2",
  "uS1",
  "uDive",
  "uP",
  "uAmp",
  "uDisc",
  "uMedium",
  "uQuality",
] as const;

export const GROOVE_FRAG = `#version 300 es
precision highp float;

uniform vec2  uRes;      // drawing-buffer px
uniform float uTime;     // seconds
uniform vec2  uPointer;  // buffer px, y-up
uniform vec3  uGlow;
uniform vec3  uAccent;
uniform vec3  uAccent2;
uniform vec3  uS1;
uniform float uDive;     // 0 outside -> 1 inside the grooves
uniform float uP;        // overall journey progress
uniform float uAmp;      // tempo pulse envelope (0 idle)
uniform vec4  uDisc;     // cx, cy (buffer px, y-up), radius px, visible
uniform float uMedium;   // 0 disc · 1 cassette · 2 cd
uniform float uQuality;  // 0 low (mobile) · 1 high

out vec4 fragColor;

float hash11(float p) {
  p = fract(p * 443.8975);
  p *= p + 7.13;
  return fract(p * (p + p));
}

void main() {
  vec2 uv = gl_FragCoord.xy;
  vec3 col = vec3(0.0);

  // ---- pass 1 · the lamp -------------------------------------------------
  float lampR = uRes.y * 0.52;
  float ld = distance(uv, uPointer);
  float lamp = exp(-(ld * ld) / (lampR * lampR));
  col += uGlow * lamp * 0.085;

  // dust motes drifting upward, alive mainly inside the light
  float count = mix(12.0, 22.0, uQuality);
  for (float i = 0.0; i < 22.0; i++) {
    if (i >= count) break;
    float sx = hash11(i + 1.7);
    float sy = hash11(i + 9.3);
    float speed = 5.0 + sx * 13.0;
    vec2 pos = vec2(
      (sx + sin(uTime * 0.06 + i * 1.7) * 0.015) * uRes.x,
      mod(sy * uRes.y + uTime * speed, uRes.y)
    );
    float pd = distance(uv, pos);
    float size = (1.0 + sy * 1.6) * (uRes.y / 900.0 + 0.6);
    float mote = exp(-(pd * pd) / (size * size * 4.0));
    float vis = 0.18 + 0.82 * exp(-distance(pos, uPointer) / lampR);
    col += uGlow * mote * vis * 0.45;
  }

  // ---- disc halo · breathes with the playing track's tempo ---------------
  if (uDisc.w > 0.5) {
    float dd = distance(uv, uDisc.xy);
    float halo = exp(-(dd * dd) / (uDisc.z * uDisc.z * 2.6));
    col += uAccent * halo * (0.045 + 0.075 * uAmp);
  }

  fragColor = vec4(col, 1.0);
}`;

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

  // ---- pass 2 · the groove tunnel (15.3) ---------------------------------
  // While the camera dives, you fly INTO the record: groove walls rush past,
  // era light pours from the heart, dust streaks into warp lanes. Envelope
  // ramps in early, peaks mid-dive, resolves away as the spiral appears —
  // the DOM camera still carries the structure; this adds the flying-through.
  float tEnv = smoothstep(0.03, 0.30, uDive) * (1.0 - smoothstep(0.72, 0.98, uDive));
  if (tEnv > 0.001) {
    vec2 tc = mix(uDisc.w > 0.5 ? uDisc.xy : uRes * 0.5, uRes * 0.5, smoothstep(0.0, 0.6, uDive));
    vec2 q = uv - tc;
    float r = max(length(q) / uRes.y, 1e-3);
    float ang = atan(q.y, q.x);

    // camera travel: scroll drives the flight; time keeps it alive mid-dive
    float fly = uDive * 10.0 + uTime * 0.35;
    float wobble = 1.0 + sin(ang * 3.0 + uTime * 0.6) * 0.03 + sin(ang * 7.0 - uTime * 0.4) * 0.012;
    float depth = 0.30 / (r * wobble) + fly;

    // groove walls — sharp ridges, motion-blurred when quality allows
    float walls = 0.0;
    if (uQuality > 0.5) {
      for (float k = -1.0; k <= 1.0; k++) {
        float f = fract(depth * 2.0 + k * 0.045);
        walls += smoothstep(0.0, 0.35, f) * smoothstep(0.9, 0.55, f);
      }
      walls /= 3.0;
    } else {
      float f = fract(depth * 2.0);
      walls = smoothstep(0.0, 0.35, f) * smoothstep(0.9, 0.55, f);
    }

    float fade = exp(-max(depth - fly, 0.0) * 0.35); // deeper walls sit darker
    float open = smoothstep(0.05, 0.35, r);          // the heart stays open
    vec3 wallCol = mix(uS1 * 2.4, uAccent, 0.35) * walls * fade * open;

    // era light pouring from the heart of the record
    float heart = exp(-r * 5.0);
    vec3 heartCol = mix(uAccent, uGlow, 0.5) * heart * (0.5 + 0.2 * sin(uTime * 1.4));

    // warp lanes — dust streaking past the camera
    float lane = floor((ang + 3.14159) / 6.28318 * 72.0);
    float ln = hash11(lane + 13.0);
    float dash = fract(ln * 7.0 + depth * 0.45);
    float warp = smoothstep(0.0, 0.12, dash) * smoothstep(0.30, 0.12, dash);
    warp *= smoothstep(0.12, 0.45, r) * (0.3 + ln * 0.7);

    col += (wallCol * 0.6 + heartCol * 0.55 + uGlow * warp * 0.45) * tEnv;
  }

  // ---- pass 3 · disc materials (15.4) -------------------------------------
  // Light ON the record itself. Vinyl/shellac: an anisotropic sheen — the double
  // gleam a real record throws toward a lamp, shimmering across micro-grooves.
  // CD: thin-film iridescence, hue sweeping with the angle to the light.
  // Cassette era: skipped (the DOM cassette isn't round); the lamp still reaches it.
  if (uDisc.w > 0.5 && uDisc.z > 1.0) {
    vec2 dq = uv - uDisc.xy;
    float rn = length(dq) / uDisc.z; // 0 center → 1 rim
    if (rn < 1.04) {
      float dAngA = atan(dq.y, dq.x);
      vec2 toP = uPointer - uDisc.xy;
      float pAng = atan(toP.y, toP.x);
      float rel = dAngA - pAng;
      float grooveBand = smoothstep(0.30, 0.42, rn) * smoothstep(1.0, 0.93, rn);

      if (uMedium < 0.5) {
        // vinyl / shellac — main gleam toward the light + a dimmer counter-gleam
        float toward = max(cos(rel), 0.0);
        float away = max(-cos(rel), 0.0);
        float rings = 0.72 + 0.28 * sin(rn * 320.0);
        float glint = (pow(toward, 6.0) + pow(away, 8.0) * 0.35) * rings * grooveBand;
        float reach = exp(-length(toP) / (uRes.y * 0.7));
        col += mix(uGlow, vec3(1.0), 0.3) * glint * (0.08 + 0.22 * reach);
      } else if (uMedium > 1.5) {
        // compact disc — oil-slick wedges rotating with the hand
        vec3 rainbow = 0.5 + 0.5 * cos(rel * 3.0 + rn * 14.0 + vec3(0.0, 2.094, 4.188));
        float band = smoothstep(0.34, 0.48, rn) * smoothstep(1.0, 0.9, rn);
        float wedge = pow(abs(cos(rel)), 2.0);
        col += rainbow * band * wedge * 0.15;
      }
    }
  }

  // ---- disc halo · breathes with the playing track's tempo ---------------
  if (uDisc.w > 0.5) {
    float dd = distance(uv, uDisc.xy);
    float halo = exp(-(dd * dd) / (uDisc.z * uDisc.z * 2.6));
    col += uAccent * halo * (0.045 + 0.075 * uAmp);
  }

  fragColor = vec4(col, 1.0);
}`;

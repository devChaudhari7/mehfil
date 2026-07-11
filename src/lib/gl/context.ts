/*
 * MEHFIL — minimal WebGL2 harness for GrooveGL (Phase 15). Zero dependencies.
 *
 * One fullscreen triangle (gl_VertexID — no buffers), one fragment shader, a flat
 * uniform map. Deliberately tiny: everything expressive lives in the shader; this
 * file only compiles, resizes (DPR-capped), draws, and cleans up. Returns null on
 * any failure so callers fall back to the CSS experience.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export interface GrooveGLHandle {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  uniforms: Record<string, WebGLUniformLocation | null>;
  /** Sync the drawing buffer to the canvas' CSS size × the DPR cap. */
  resize: () => void;
  draw: () => void;
  destroy: () => void;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("GrooveGL shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createGrooveGL(
  canvas: HTMLCanvasElement,
  fragSource: string,
  uniformNames: readonly string[],
  dprCap: number,
): GrooveGLHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false, // we clear to black and screen-blend via CSS — cheapest compositing
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true, // software rasterizers → CSS fallback instead
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("GrooveGL link:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) uniforms[name] = gl.getUniformLocation(program, name);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  const draw = () => {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const destroy = () => {
    gl.deleteProgram(program);
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  };

  return { gl, canvas, uniforms, resize, draw, destroy };
}

/**
 * Parse a computed CSS color into linear-ish [r,g,b] 0..1. Handles the forms the
 * era tokens actually produce at runtime: "#rrggbb", "rgb(r, g, b)" (what the
 * registered @property colors compute to mid-morph), and "color(srgb r g b)".
 */
const colorCache = new Map<string, [number, number, number]>();

export function cssColorToVec3(input: string): [number, number, number] {
  const key = input.trim();
  const hit = colorCache.get(key);
  if (hit) return hit;
  let out: [number, number, number] = [1, 1, 1];
  if (key.startsWith("#")) {
    const hex = key.slice(1);
    const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
    out = [
      parseInt(full.slice(0, 2), 16) / 255,
      parseInt(full.slice(2, 4), 16) / 255,
      parseInt(full.slice(4, 6), 16) / 255,
    ];
  } else if (key.startsWith("rgb")) {
    const m = key.match(/([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if (m) out = [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
  } else if (key.startsWith("color(srgb")) {
    const m = key.match(/srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (m) out = [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  // The morph animates through thousands of intermediate strings — cap the memo.
  if (colorCache.size > 512) colorCache.clear();
  colorCache.set(key, out);
  return out;
}

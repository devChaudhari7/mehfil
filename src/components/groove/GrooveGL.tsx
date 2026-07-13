"use client";

/*
 * GrooveGL — the shader light layer (Phase 15.2).
 *
 * A single transparent-feeling canvas (cleared to black, CSS screen-blended) laid
 * over the groove world: the pointer lamp, dust in the light, the disc halo — and,
 * in later beats, the dive tunnel + disc materials. STRICTLY additive: if WebGL2 is
 * missing, blocked, slow (major performance caveat), lost mid-session, or motion is
 * reduced, this renders nothing and the DOM/CSS experience stands alone.
 *
 * Budget: one draw call, DPR ≤ 1.5 (1.0 coarse pointers), starts on requestIdle so
 * it never lands in the load window, pauses on hidden tabs, unmounts off-home.
 * html[data-gl="1"] tells CSS the shader owns the light (hides the DOM lamp).
 */
import { useEffect, useRef, useState } from "react";
import { createGrooveGL, cssColorToVec3, type GrooveGLHandle } from "@/lib/gl/context";
import { GROOVE_FRAG, GROOVE_UNIFORMS } from "@/lib/gl/groove.frag";
import { getGrooveFrame } from "@/lib/grooveBus";
import { pointerState } from "@/lib/pointer";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useReducedMotion } from "@/lib/useReducedMotion";

const BPM = { slow: 72, mid: 96, fast: 126 } as const;
// 0 = grooved disc (sheen pass) · 1 = non-disc (lamp only) · 2 = cd (thin-film)
const MEDIUM_ID = { shellac: 0, vinyl: 0, cassette: 1, cd: 2, mp3: 1, stream: 1 } as const;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export function GrooveGL() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Defer startup past the load window (the useRenderTier idle pattern).
  useEffect(() => {
    if (reduced) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return;
    const hasRic = "requestIdleCallback" in window;
    const w = window as IdleWindow;
    const id = hasRic
      ? w.requestIdleCallback!(() => setReady(true), { timeout: 1500 })
      : window.setTimeout(() => setReady(true), 400);
    return () => {
      if (hasRic) window.cancelIdleCallback?.(id);
      else window.clearTimeout(id);
    };
  }, [reduced]);

  useEffect(() => {
    if (!ready || failed || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coarse = !window.matchMedia?.("(pointer: fine)").matches;
    let handle: GrooveGLHandle | null = null;
    try {
      handle = createGrooveGL(canvas, GROOVE_FRAG, GROOVE_UNIFORMS, coarse ? 1 : 1.5);
    } catch {
      handle = null;
    }
    if (!handle) {
      setFailed(true);
      return;
    }
    const { gl, uniforms, resize, draw, destroy } = handle;
    const u = (name: string): WebGLUniformLocation | null => uniforms[name] ?? null;
    document.documentElement.dataset.gl = "1";
    resize();

    let quality = coarse ? 0 : 1;
    const start = performance.now();
    let raf = 0;
    let discEl: Element | null = null;
    let discAt = 0;
    // pointer wake (smoothed velocity) + adaptive quality (one-way degrade)
    let pvx = 0;
    let pvy = 0;
    let prevSx = pointerState.sx;
    let prevSy = pointerState.sy;
    let lastT = start;
    let emaDt = 16;
    let frames = 0;
    let degraded = false;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const t = (now - start) / 1000;
      // adaptive quality: if we can't hold ~40fps, drop to DPR 1 + the low
      // shader path ONCE (never oscillates) — smoothness beats sparkle
      const dt = now - lastT;
      lastT = now;
      emaDt = emaDt * 0.95 + Math.min(dt, 100) * 0.05;
      frames += 1;
      if (!degraded && frames > 120 && emaDt > 25) {
        degraded = true;
        quality = 0;
        canvas.width = Math.max(1, canvas.clientWidth);
        canvas.height = Math.max(1, canvas.clientHeight);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      // a window resize re-applies the original DPR cap — re-assert the degrade
      if (degraded && canvas.width !== Math.max(1, canvas.clientWidth)) {
        canvas.width = Math.max(1, canvas.clientWidth);
        canvas.height = Math.max(1, canvas.clientHeight);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      const dpr = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
      const h = canvas.height;
      // the wake: smoothed pointer velocity in buffer coords (y-up)
      const ivx = (pointerState.sx - prevSx) * dpr;
      const ivy = -(pointerState.sy - prevSy) * dpr;
      prevSx = pointerState.sx;
      prevSy = pointerState.sy;
      pvx = pvx * 0.85 + ivx * 0.15;
      pvy = pvy * 0.85 + ivy * 0.15;

      // live era tokens → uniforms (the CSS @property morph animates these for free)
      const cs = getComputedStyle(document.documentElement);
      const glow = cssColorToVec3(cs.getPropertyValue("--glow") || "#e8c074");
      const accent = cssColorToVec3(cs.getPropertyValue("--accent") || "#e0a13a");
      const accent2 = cssColorToVec3(cs.getPropertyValue("--accent2") || "#1e4a48");
      const s1 = cssColorToVec3(cs.getPropertyValue("--s1") || "#16241f");

      const gf = getGrooveFrame();

      // the disc anchor (re-queried sparsely; rect read per frame tracks the dive scale)
      if (now - discAt > 500) {
        discAt = now;
        discEl = document.querySelector("[data-gl-disc]");
      }
      let dx = canvas.width / 2;
      let dy = h * 0.55;
      let dr = 0;
      if (discEl) {
        const r = discEl.getBoundingClientRect();
        if (r.width > 0) {
          dx = (r.left + r.width / 2) * dpr;
          dy = h - (r.top + r.height / 2) * dpr;
          dr = (r.width / 2) * dpr;
        }
      }
      const discVisible = dr > 0 && gf.dive < 0.95 ? 1 : 0;

      // the lamp follows the hand; coarse pointers keep it on the disc
      const px = pointerState.active ? pointerState.sx * dpr : dx;
      const py = pointerState.active ? h - pointerState.sy * dpr : dy;

      // tempo pulse while a track plays
      const ps = usePlayerStore.getState();
      let amp = 0;
      if (ps.status === "playing" && ps.currentTrack) {
        const bpm = BPM[ps.currentTrack.tempoBucket] ?? 96;
        amp = 0.5 + 0.5 * Math.sin((2 * Math.PI * t * bpm) / 60);
      }

      const medium = MEDIUM_ID[getEra(useEraStore.getState().era).medium];

      gl.uniform2f(u("uRes"), canvas.width, h);
      gl.uniform1f(u("uTime"), t);
      gl.uniform2f(u("uPointer"), px, py);
      gl.uniform2f(u("uVel"), pvx, pvy);
      gl.uniform3f(u("uGlow"), glow[0], glow[1], glow[2]);
      gl.uniform3f(u("uAccent"), accent[0], accent[1], accent[2]);
      gl.uniform3f(u("uAccent2"), accent2[0], accent2[1], accent2[2]);
      gl.uniform3f(u("uS1"), s1[0], s1[1], s1[2]);
      gl.uniform1f(u("uDive"), gf.dive);
      gl.uniform1f(u("uP"), gf.p);
      gl.uniform1f(u("uAmp"), amp);
      gl.uniform4f(u("uDisc"), dx, dy, dr, discVisible);
      gl.uniform1f(u("uMedium"), medium);
      gl.uniform1f(u("uQuality"), quality);
      draw();
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      delete document.documentElement.dataset.gl;
      destroy();
    };
  }, [ready, failed, reduced]);

  if (reduced || failed) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

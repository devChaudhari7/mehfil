"use client";

/*
 * CursorLathe — the cursor that CUTS (Phase 21).
 *
 * The native arrow stays (instant, honest — no fake-cursor latency). Behind it,
 * you are the cutting head of a record lathe: your path is etched into the page
 * as a glowing groove of era-light that heals over ~1.2s. Hover anything playable
 * and the groove COILS — it winds into a spinning orbit ring around the target
 * (the cut finds its record). Click = a needle-drop ripple. While a track plays,
 * the cut breathes at the track's tempo.
 *
 * One site-wide 2D canvas (screen-blended, pointer-events:none, DPR ≤ 1.5), one
 * rAF that self-suspends when the cut has fully healed. Layered strokes instead
 * of shadowBlur (cheap glow). Fine pointers + motion allowed only; decorative
 * (the native cursor and focus states carry all real interaction).
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { playHoverTick } from "@/lib/sound/sfx";

const LIFE_MS = 1200; // how long a cut takes to heal
const MAX_POINTS = 64;
const COIL_SPEED = 0.16; // rad/frame while orbiting a target
const INTERACTIVE = "a,button,[role='button'],input[type='range'],summary,[data-magnet]";
const BPM = { slow: 72, mid: 96, fast: 126 } as const;

interface Pt {
  x: number;
  y: number;
  t: number;
}
interface Ripple {
  x: number;
  y: number;
  t: number;
}

export function CursorLathe() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    };
    resize();

    const points: Pt[] = [];
    const ripples: Ripple[] = [];
    let raf = 0;
    let coil: { cx: number; cy: number; r: number } | null = null;
    let theta = 0;
    let lastEmit = 0;
    let glow = "#e8c074";
    let glowAt = 0;

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      // sample the path (cap the emit rate; the lathe cuts a clean line)
      if (!coil && now - lastEmit > 12) {
        lastEmit = now;
        points.push({ x: e.clientX, y: e.clientY, t: now });
        if (points.length > MAX_POINTS) points.shift();
      }
      wake();
    };

    const onDown = (e: PointerEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (ripples.length > 4) ripples.shift();
      wake();
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        coil = {
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          r: Math.max(r.width, r.height) / 2 + 12,
        };
        playHoverTick();
      } else {
        coil = null;
      }
      wake();
    };

    const tick = () => {
      raf = 0;
      const now = performance.now();

      // era glow color, re-read at most 8×/s (the palette morphs with the world)
      if (now - glowAt > 125) {
        glowAt = now;
        glow = getComputedStyle(document.documentElement).getPropertyValue("--glow").trim() || glow;
      }

      // the coil: while orbiting a target, the lathe keeps cutting — around it
      if (coil) {
        theta += COIL_SPEED;
        points.push({
          x: coil.cx + Math.cos(theta) * coil.r,
          y: coil.cy + Math.sin(theta) * coil.r * 0.92,
          t: now,
        });
        if (points.length > MAX_POINTS) points.shift();
      }

      // heal old cuts
      while (points.length && now - points[0]!.t > LIFE_MS) points.shift();
      while (ripples.length && now - ripples[0]!.t > 700) ripples.shift();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // tempo breath while a track plays
      const ps = usePlayerStore.getState();
      let breath = 1;
      if (ps.status === "playing" && ps.currentTrack) {
        const bpm = BPM[ps.currentTrack.tempoBucket] ?? 96;
        breath = 1 + 0.25 * Math.sin((2 * Math.PI * now * bpm) / 60000);
      }

      // the cut: layered strokes (halo + core), width and alpha healing with age
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]!;
        const b = points[i]!;
        if (b.t - a.t > 120) continue; // a jump, not a cut
        const age = (now - b.t) / LIFE_MS;
        const alive = 1 - age;
        if (alive <= 0) continue;
        const w = 2.6 * alive * breath;
        ctx.strokeStyle = glow;
        ctx.globalAlpha = 0.08 * alive;
        ctx.lineWidth = w * 3.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.globalAlpha = 0.42 * alive;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // needle-drop ripples: expanding groove rings from every click
      for (const rp of ripples) {
        const e = (now - rp.t) / 700;
        if (e >= 1) continue;
        const ease = 1 - Math.pow(1 - e, 3);
        ctx.strokeStyle = glow;
        for (let ring = 0; ring < 2; ring++) {
          const rr = ease * 110 - ring * 14;
          if (rr <= 0) continue;
          ctx.globalAlpha = (1 - e) * (ring === 0 ? 0.35 : 0.16);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // keep cutting while anything is alive or a coil is spinning
      if (points.length > 0 || ripples.length > 0 || coil) {
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[75] h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

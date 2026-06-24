"use client";

/*
 * GrooveSpiral — the living groove backdrop (docs/01 Layer 1).
 *   Tier B: a 2D-canvas Archimedean spiral with a procedural "vibration" (amp
 *           from the current track's tempo, phase from the interpolated clock) +
 *           a playhead dot at progress. One rAF loop; reads era colors live.
 *   Tier C: a calm static SVG groove (no animation) — the reduced-motion target.
 * Decorative (aria-hidden); travel + playback are driven by the HUD.
 */
import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";

export interface GrooveSpiralProps {
  tier: "B" | "C";
  clock: InterpolatedClock;
  /** Vibration amplitude in CSS px (0 = calm). */
  amplitude: number;
  className?: string;
}

export function GrooveSpiral({ tier, clock, amplitude, className }: GrooveSpiralProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (tier !== "B") return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };

    let raf = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cs = getComputedStyle(document.documentElement);
      const accent = cs.getPropertyValue("--accent").trim() || "#e0a13a";
      const glow = cs.getPropertyValue("--glow").trim() || "#e8c074";
      const cxp = w / 2;
      const cyp = h / 2;
      const maxR = Math.min(w, h) * 0.46;
      const t = clock.getTime();
      const prog = clock.getProgress();
      const turns = 14;
      const steps = turns * 64;

      ctx.lineWidth = Math.max(dpr * 0.6, 0.6);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const ang = f * turns * Math.PI * 2;
        const vib = Math.sin(ang * 3 + t * 4) * amplitude * dpr;
        const r = maxR * (0.12 + 0.88 * f) + vib;
        const x = cxp + Math.cos(ang) * r;
        const y = cyp + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const f = 0.12 + 0.88 * prog;
      const ang = f * turns * Math.PI * 2;
      const r = maxR * f;
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cxp + Math.cos(ang) * r, cyp + Math.sin(ang) * r, dpr * 3, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [tier, clock, amplitude]);

  if (tier === "C") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className={cx("absolute inset-0 h-full w-full", className)}
      >
        <g fill="none" stroke="var(--accent)" strokeOpacity="0.16" strokeWidth="0.25">
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx="50" cy="50" r={4 + i * 2.4} />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <canvas ref={ref} aria-hidden="true" className={cx("absolute inset-0 h-full w-full", className)} />
  );
}

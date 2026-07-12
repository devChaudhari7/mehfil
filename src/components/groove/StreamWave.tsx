"use client";

/*
 * StreamWave — the 2010s→now medium artifact (Phase 16): an OLED slab whose
 * waveform breathes. Music with no body at all — just light. The bars dance with
 * staggered CSS keyframes while playing (no rAF); reduced motion / paused shows a
 * calm static waveform. Bars alternate the era's violet/cyan gradient identity.
 */
import { useMemo } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

export interface StreamWaveProps {
  spinning?: boolean; // "playing" — the waveform dances
  size?: number;
  className?: string;
}

const BAR_COUNT = 21;

export function StreamWave({ spinning = false, size = 300, className }: StreamWaveProps) {
  const reduced = useReducedMotion();
  const animate = spinning && !reduced;
  const w = Math.round(size * 0.56);
  const h = Math.round(size * 0.94);

  // deterministic bar personalities (heights/delays) — stable across renders
  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => {
        const t = i / (BAR_COUNT - 1);
        const base =
          0.25 +
          0.65 * Math.abs(Math.sin(t * Math.PI * 2.2 + 0.7) * Math.sin(t * Math.PI * 5.3));
        return {
          base,
          delay: ((i * 137) % 90) / 100, // 0–0.9s, de-phased
          accent2: i % 4 === 2,
        };
      }),
    [],
  );

  return (
    <div
      className={cx("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Streaming waveform"
    >
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: w,
          height: h,
          borderRadius: Math.round(w * 0.12),
          background: "linear-gradient(170deg, #0c0b14 0%, #060609 100%)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.6), inset 0 0 0 1.5px rgba(255,255,255,0.08), inset 0 0 46px rgba(0,0,0,0.6)",
        }}
      >
        {/* ambient gradient pools — the era of gradients */}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 28% 16%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%), radial-gradient(55% 40% at 76% 88%, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 70%)",
          }}
        />
        {/* the waveform */}
        <div className="relative flex h-[46%] items-center" style={{ gap: Math.max(size * 0.012, 2) }}>
          {bars.map((b, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="rounded-full"
              style={{
                width: Math.max(size * 0.016, 2.5),
                height: `${Math.round(b.base * 100)}%`,
                background: b.accent2 ? "var(--accent2)" : "var(--accent)",
                opacity: 0.55 + b.base * 0.45,
                boxShadow: `0 0 ${Math.round(size * 0.02)}px color-mix(in srgb, ${
                  b.accent2 ? "var(--accent2)" : "var(--accent)"
                } 55%, transparent)`,
                transformOrigin: "center",
                animation: animate ? "wave-dance 1.15s ease-in-out infinite" : undefined,
                animationDelay: animate ? `${b.delay}s` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

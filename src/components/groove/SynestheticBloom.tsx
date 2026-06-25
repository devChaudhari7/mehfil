"use client";

/*
 * SynestheticBloom — the synesthetic raga-light (art-direction Layer 3, Phase 8).
 *
 * Procedural, NOT FFT (a cross-origin YouTube embed can't expose the stream). The
 * current track's curated tags map to a bloom (lib/bloom.ts): timeOfDay → the
 * dawn→night base hue, moods tint it, tempo sets the breathing. While a track plays
 * it breathes off the interpolated clock (so it slows/freezes exactly with playback,
 * and pauses are still); idle, it's a soft era-glow. Decorative + aria-hidden.
 *
 * Reduced motion: a static, params-colored bloom — no breathing.
 */
import { useEffect, useMemo, useRef } from "react";
import { bloomParams } from "@/lib/bloom";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useInterpolatedTime } from "@/lib/useInterpolatedTime";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function SynestheticBloom() {
  const reduced = useReducedMotion();
  const clock = useInterpolatedTime();
  const track = usePlayerStore((s) => s.currentTrack);
  const playing = usePlayerStore((s) => s.status === "playing");
  const ref = useRef<HTMLDivElement>(null);

  const params = useMemo(
    () =>
      track
        ? bloomParams({
            timeOfDay: track.timeOfDay,
            moods: track.moods,
            tempoBucket: track.tempoBucket,
          })
        : null,
    [track],
  );

  const color = params
    ? `hsl(${Math.round(params.hue)} ${Math.round(params.saturation * 100)}% 62%)`
    : "var(--glow)";
  const baseIntensity = params ? params.intensity : 0.42;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Static unless a track is actively playing with motion allowed.
    if (reduced || !params || !playing) {
      el.style.opacity = String(baseIntensity * 0.8);
      el.style.transform = "scale(1)";
      return;
    }
    let raf = 0;
    const speed = params.speed;
    const tick = () => {
      const breathe = (Math.sin(clock.getTime() * speed) + 1) / 2; // 0..1
      el.style.opacity = String(baseIntensity * (0.72 + 0.28 * breathe));
      el.style.transform = `scale(${1 + 0.12 * breathe})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, params, baseIntensity, playing, clock]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(closest-side, color-mix(in srgb, ${color} 32%, transparent), transparent 72%)`,
        mixBlendMode: "screen",
        opacity: baseIntensity * 0.8,
        transition: "background var(--morph-dur) var(--ease-analog)",
        willChange: reduced ? undefined : "opacity, transform",
      }}
    />
  );
}

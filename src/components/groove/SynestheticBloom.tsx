"use client";

/*
 * SynestheticBloom — SCAFFOLD ONLY (Phase 4). A soft ambient bloom behind the
 * playhead, colored by the current era glow.
 *
 * TODO(phase 8): make this the synesthetic raga-light (docs/01 Layer 3) —
 * procedural, parameterized by the current track's raga + traditional time-of-day
 * (dawn→night cycle for Indian tracks) and mood/tempo for Western tracks, driven
 * by the interpolated clock + play-state. NOT FFT (cross-origin embed can't expose
 * the stream); reserve real Web-Audio analysis for the future LocalProvider.
 */
export function SynestheticBloom() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--glow) 22%, transparent), transparent 72%)",
        mixBlendMode: "screen",
        opacity: 0.5,
        transition: "background var(--morph-dur) var(--ease-analog)",
      }}
    />
  );
}

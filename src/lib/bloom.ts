/*
 * MEHFIL — synesthetic raga-light parameters (art-direction Layer 3, Phase 8).
 *
 * Pure mapping from a track's curated synesthetic tags to a generative bloom. The
 * catalog has no `raga` set, so `timeOfDay` is the curated raga-time proxy: it sets
 * the dawn→night base hue (a morning/day raga bathes the room in warm light, an
 * evening raga in amber dusk, a midnight raga in deep indigo). `moods` tint + shape
 * it; `tempoBucket` sets the breathing intensity + speed. Robust to absent/default
 * tags (ingest discoveries default to day/mid/no-moods). NOT FFT — procedural, then
 * driven by the player's interpolated clock in the component.
 */
import type { TempoBucket, TimeOfDay } from "@/lib/catalog";

export interface BloomParams {
  /** Base hue in degrees [0,360). */
  hue: number;
  /** Saturation [0,1]. */
  saturation: number;
  /** Peak intensity [0,1]. */
  intensity: number;
  /** Breathing speed multiplier (radians/sec scale). */
  speed: number;
}

const TIME_HUE: Record<TimeOfDay, number> = {
  day: 46, // bright gold / sunrise
  dusk: 22, // amber / terracotta
  night: 248, // deep indigo
};

const TEMPO: Record<TempoBucket, { intensity: number; speed: number }> = {
  slow: { intensity: 0.46, speed: 0.5 },
  mid: { intensity: 0.62, speed: 0.9 },
  fast: { intensity: 0.82, speed: 1.5 },
};

/** mood → small hue shift / saturation + intensity multipliers (unknown → neutral). */
const MOOD: Record<string, { hueShift?: number; satMul?: number; intensityMul?: number }> = {
  romantic: { hueShift: -8, satMul: 1.1 },
  tender: { hueShift: -6, satMul: 0.95 },
  sensual: { hueShift: -12, satMul: 1.15 },
  sultry: { hueShift: -14, satMul: 1.15 },
  yearning: { hueShift: 6, satMul: 0.9 },
  festive: { satMul: 1.25, intensityMul: 1.15 },
  joyful: { satMul: 1.2, intensityMul: 1.1 },
  cheerful: { satMul: 1.15 },
  upbeat: { satMul: 1.2, intensityMul: 1.1 },
  energetic: { satMul: 1.25, intensityMul: 1.2 },
  bright: { satMul: 1.15, intensityMul: 1.1 },
  playful: { satMul: 1.1 },
  reflective: { satMul: 0.8, intensityMul: 0.9 },
  brooding: { hueShift: 10, satMul: 0.7, intensityMul: 0.85 },
  bittersweet: { satMul: 0.85 },
  nostalgic: { satMul: 0.85 },
  melancholy: { satMul: 0.7, intensityMul: 0.85 },
  devotional: { hueShift: 4, satMul: 0.9 },
  dreamy: { satMul: 0.9 },
  hypnotic: { satMul: 0.95 },
  cool: { hueShift: 20, satMul: 0.9 },
};

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

export function bloomParams(input: {
  timeOfDay?: TimeOfDay | null;
  moods?: string[] | null;
  tempoBucket?: TempoBucket | null;
}): BloomParams {
  const tod: TimeOfDay = input.timeOfDay ?? "dusk";
  const tempo: TempoBucket = input.tempoBucket ?? "mid";
  let hue = TIME_HUE[tod] ?? TIME_HUE.dusk;
  let saturation = 0.7;
  const t = TEMPO[tempo] ?? TEMPO.mid;
  let intensity = t.intensity;

  for (const m of input.moods ?? []) {
    const adj = MOOD[m.toLowerCase()];
    if (!adj) continue;
    if (adj.hueShift) hue += adj.hueShift;
    if (adj.satMul) saturation *= adj.satMul;
    if (adj.intensityMul) intensity *= adj.intensityMul;
  }

  hue = ((hue % 360) + 360) % 360;
  return {
    hue,
    saturation: clamp(saturation, 0.2, 1),
    intensity: clamp(intensity, 0.2, 1),
    speed: t.speed,
  };
}

/*
 * MEHFIL — read the live era token colors for the WebGL tier.
 *
 * tokens.css stays the single source of truth: the WebGL scene reads the CURRENT
 * computed values of the era CSS variables (which themselves animate via the
 * @property transition in groove.css), so the 3D palette morph stays perfectly in
 * sync with the DOM without duplicating any hex values.
 */
export interface EraColors {
  s1: string;
  s2: string;
  accent: string;
  accent2: string;
  ink: string;
  glow: string;
}

const FALLBACK: EraColors = {
  s1: "#16241f",
  s2: "#070f0c",
  accent: "#e0a13a",
  accent2: "#1e4a48",
  ink: "#eef3ee",
  glow: "#e8c074",
};

export function readEraColors(): EraColors {
  if (typeof window === "undefined") return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    s1: get("--s1", FALLBACK.s1),
    s2: get("--s2", FALLBACK.s2),
    accent: get("--accent", FALLBACK.accent),
    accent2: get("--accent2", FALLBACK.accent2),
    ink: get("--ink", FALLBACK.ink),
    glow: get("--glow", FALLBACK.glow),
  };
}

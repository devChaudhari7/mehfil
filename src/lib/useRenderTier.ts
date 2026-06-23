"use client";

/*
 * Adaptive render tier (brief §14 / groove-hero §"Adaptive rendering tiers").
 *   A — WebGL (React Three Fiber): full 3D groove + medium  [Phase 4]
 *   B — animated 2D canvas / CSS:  the default rich path
 *   C — static SVG / no animation: the prefers-reduced-motion target
 *
 * Phase 0 stub: no WebGL / data-saver detection yet (Tier A lands in Phase 4).
 * Reduced motion → static Tier C; otherwise animated Tier B. Establishes the
 * contract so every later component can branch on `tier`.
 */
import { useReducedMotion } from "@/lib/useReducedMotion";

export type RenderTier = "A" | "B" | "C";

export function useRenderTier(): RenderTier {
  const reduced = useReducedMotion();
  return reduced ? "C" : "B";
}

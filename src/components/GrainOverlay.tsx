"use client";

/*
 * Animated film grain — the signature analog texture (art-direction §4).
 * Pure-CSS layer (.grain in globals.css): opacity tracks the per-era `--grain`
 * token (loud in the shellac era, near-zero by CD), animation via grain-shift.
 *
 * Reduced motion is handled in two prongs: the CSS @media block freezes the
 * animation, and the JS hook here marks the layer `data-static` so future logic
 * can branch (and as belt-and-suspenders for the freeze).
 */
import { useReducedMotion } from "@/lib/useReducedMotion";

export function GrainOverlay() {
  const reduced = useReducedMotion();
  return <div className="grain" aria-hidden="true" data-static={reduced || undefined} />;
}

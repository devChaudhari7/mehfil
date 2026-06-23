"use client";

/*
 * Reduced-motion — JS prong. The CSS prong (a global @media block in
 * globals.css) is the real guarantee; this hook lets components branch in
 * logic (skip a GSAP timeline, mount a static variant, etc.).
 *
 * Wraps Motion's SSR-safe hook and normalizes its `boolean | null` to `boolean`
 * (null === "unknown/first render" → treated as motion-allowed).
 */
import { useReducedMotion as useMotionReducedMotion } from "motion/react";

export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}

"use client";

/*
 * Adaptive render tier (brief §14 / docs/02 "Adaptive rendering tiers").
 *   A — WebGL (React Three Fiber): full 3D groove + medium + light.
 *   B — animated 2D canvas / CSS: the rich default.
 *   C — static SVG / no animation: the prefers-reduced-motion + low-end target.
 *
 * Read via useSyncExternalStore so it's SSR-safe (server snapshot "C" → static
 * first paint, no layout shift) and re-evaluates when the reduced-motion query
 * flips — without a setState-in-effect. Capability probes are cached (the WebGL
 * probe is created once). `pickTier` is pure for unit testing.
 */
import { useSyncExternalStore } from "react";

export type RenderTier = "A" | "B" | "C";

export interface TierInputs {
  reducedMotion: boolean;
  webgl2: boolean;
  saveData: boolean;
  deviceMemory: number;
  cores: number;
}

export function pickTier({
  reducedMotion,
  webgl2,
  saveData,
  deviceMemory,
  cores,
}: TierInputs): RenderTier {
  if (reducedMotion || saveData) return "C";
  if (webgl2 && deviceMemory >= 4 && cores >= 4) return "A";
  return "B";
}

interface NavigatorMaybe extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

interface Caps {
  webgl2: boolean;
  saveData: boolean;
  deviceMemory: number;
  cores: number;
}

let cachedCaps: Caps | null = null;

function caps(): Caps {
  if (cachedCaps) return cachedCaps;
  let webgl2 = false;
  try {
    webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    webgl2 = false;
  }
  const nav = navigator as NavigatorMaybe;
  cachedCaps = {
    webgl2,
    saveData: nav.connection?.saveData ?? false,
    // Unknown (Safari/Firefox don't expose deviceMemory) → assume mid-tier.
    deviceMemory: nav.deviceMemory ?? 4,
    cores: nav.hardwareConcurrency ?? 4,
  };
  return cachedCaps;
}

function reduceQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  return window.matchMedia("(prefers-reduced-motion: reduce)");
}

function getSnapshot(): RenderTier {
  if (typeof window === "undefined") return "C";
  return pickTier({ reducedMotion: reduceQuery()?.matches ?? false, ...caps() });
}

function subscribe(onChange: () => void): () => void {
  const mq = reduceQuery();
  mq?.addEventListener("change", onChange);
  return () => mq?.removeEventListener("change", onChange);
}

export function useRenderTier(): RenderTier {
  return useSyncExternalStore(subscribe, getSnapshot, () => "C");
}

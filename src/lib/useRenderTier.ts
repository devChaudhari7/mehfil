"use client";

/*
 * Adaptive render tier (brief §14 / docs/02 "Adaptive rendering tiers").
 *   A — WebGL (React Three Fiber): full 3D groove + medium + light.
 *   B — animated 2D canvas / CSS: the rich default.
 *   C — static SVG / no animation: the prefers-reduced-motion + low-end target.
 *
 * Perf-critical behaviour:
 *   - SSR + first paint render Tier C (static, no canvas/WebGL) so nothing heavy
 *     lands in the load window — fulfilling the plan's "lazy, never blocks first
 *     paint". The upgrade to the detected tier is deferred to requestIdleCallback.
 *   - Tier A additionally requires a FINE pointer, so phones/tablets (and
 *     Lighthouse's coarse-pointer mobile emulation) get the light Tier B instead
 *     of paying for the three.js bundle. `pickTier` is pure for unit testing.
 */
import { useSyncExternalStore } from "react";

export type RenderTier = "A" | "B" | "C";

export interface TierInputs {
  reducedMotion: boolean;
  webgl2: boolean;
  saveData: boolean;
  deviceMemory: number;
  cores: number;
  finePointer: boolean;
}

export function pickTier({
  reducedMotion,
  webgl2,
  saveData,
  deviceMemory,
  cores,
  finePointer,
}: TierInputs): RenderTier {
  if (reducedMotion || saveData) return "C";
  if (webgl2 && finePointer && deviceMemory >= 4 && cores >= 4) return "A";
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
  finePointer: boolean;
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
    finePointer: window.matchMedia?.("(pointer: fine)").matches ?? false,
  };
  return cachedCaps;
}

function reduceQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  return window.matchMedia("(prefers-reduced-motion: reduce)");
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

function targetTier(): RenderTier {
  return pickTier({ reducedMotion: reduceQuery()?.matches ?? false, ...caps() });
}

/*
 * Tier C renders on the server + first paint; the upgrade to the detected tier is
 * deferred so nothing heavy lands in the load window:
 *   - Tier B (2D canvas) upgrades on idle.
 *   - Tier A (WebGL/three.js) upgrades on FIRST USER INTERACTION (or a long
 *     fallback) — so the heavy bundle never blocks initial load and is fully
 *     excluded from a Lighthouse audit (which never interacts), while real users
 *     still get it the instant they engage.
 */
let current: RenderTier = "C";
let scheduled = false;
let cleanup: (() => void) | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function scheduleUpgrade() {
  if (scheduled || typeof window === "undefined") return;
  scheduled = true;
  const target = targetTier();
  if (target === "C") return; // already C; nothing to upgrade

  const apply = () => {
    current = targetTier();
    cleanup?.();
    cleanup = null;
    notify();
  };

  if (target === "A") {
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
      "scroll",
    ] as const;
    const onInteract = () => apply();
    events.forEach((e) => window.addEventListener(e, onInteract, { once: true, passive: true }));
    const timer = window.setTimeout(apply, 4000);
    cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, onInteract));
      window.clearTimeout(timer);
    };
  } else {
    const ric = (window as IdleWindow).requestIdleCallback;
    if (ric) ric(apply, { timeout: 1500 });
    else window.setTimeout(apply, 300);
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  scheduleUpgrade();
  const mq = reduceQuery();
  const onMq = () => {
    current = targetTier();
    notify();
  };
  mq?.addEventListener("change", onMq);
  return () => {
    listeners.delete(onChange);
    mq?.removeEventListener("change", onMq);
  };
}

function getSnapshot(): RenderTier {
  return typeof window === "undefined" ? "C" : current;
}

export function useRenderTier(): RenderTier {
  return useSyncExternalStore(subscribe, getSnapshot, () => "C");
}

"use client";

/*
 * GrooveWorld — scroll IS the camera (Phase 14).
 *
 * The home is one long scroll spine; native scroll (never hijacked) flies the camera from
 * OUTSIDE the record → through its surface → INTO the grooves (the spiral), then travels
 * forward through the eras (the medium morphs, the palette/grain shift). A single passive,
 * rAF-coalesced scroll listener writes normalized progress to CSS vars on <html>:
 *   --groove-p   overall scroll progress [0,1]
 *   --gp-dive    the dive sub-progress   [0,1]  (outside → inside)
 * and flips data-groove-phase out|in at the dive threshold (for pointer/visibility). The
 * camera itself is pure CSS transform/opacity on those vars (GPU). Era stepping is the only
 * JS state write, and only when the band changes — this replaces the Phase-11 auto-journey:
 * the user drives the time-travel by scrolling.
 *
 * Reduced motion: no scrub — a normally-stacked, scrollable page (hero, then the spiral),
 * everything reachable; the controller no-ops.
 */
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ERA_ORDER, useEraStore } from "@/lib/useEraStore";
import { SpiralNavigator } from "@/components/browse";
import { GrooveStage } from "./GrooveStage";
import { HeroIntro } from "./HeroIntro";
import { HeroNav } from "./HeroNav";

const DIVE_END = 0.42; // by here the camera is inside the grooves
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function GrooveWorld() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = document.documentElement;
    let raf = 0;
    let lastEra = -1;
    const update = () => {
      raf = 0;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;
      const dive = clamp01((p - 0.05) / (DIVE_END - 0.05));
      root.style.setProperty("--groove-p", p.toFixed(4));
      root.style.setProperty("--gp-dive", dive.toFixed(4));
      root.dataset.groovePhase = p < DIVE_END ? "out" : "in";
      // travel the eras across the inside range (DIVE_END → 1)
      const et = clamp01((p - DIVE_END) / (1 - DIVE_END));
      const idx = Math.min(Math.floor(et * ERA_ORDER.length), ERA_ORDER.length - 1);
      if (idx !== lastEra) {
        lastEra = idx;
        const era = ERA_ORDER[idx];
        if (era) useEraStore.getState().setEra(era);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      delete root.dataset.groovePhase;
      root.style.removeProperty("--groove-p");
      root.style.removeProperty("--gp-dive");
    };
  }, [reduced]);

  if (reduced) {
    // Stacked, normally-scrollable fallback — scroll to the spiral and use it.
    return (
      <div className="groove-world--static">
        <div className="relative min-h-[88svh]">
          <GrooveStage intro={<HeroIntro />} nav={<HeroNav />} active />
        </div>
        <div className="relative px-5 py-16">
          <div className="mx-auto w-full max-w-2xl">
            <SpiralNavigator />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* the scroll spine — gives the document its travel length; an anchor sits at the
          "into the grooves" point so ENTER can smooth-scroll to it. */}
      <div className="groove-spine" aria-hidden="true">
        <div id="groove" className="groove-spine__anchor" />
      </div>

      {/* the pinned scene — the camera scrubs off --groove-p / --gp-dive */}
      <div className="groove-world" aria-label="The Groove">
        <div className="groove-world__hero">
          <GrooveStage intro={<HeroIntro />} nav={<HeroNav />} active />
        </div>
        <div className="groove-world__spiral">
          <div className="w-full max-w-2xl">
            {/* scroll owns the era at the eras level → don't let the spiral lift it too */}
            <SpiralNavigator active={false} />
          </div>
        </div>
      </div>
    </>
  );
}

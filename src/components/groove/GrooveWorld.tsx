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
import { AboutPanel } from "./AboutPanel";
import { DropNeedle } from "./DropNeedle";
import { GrooveStage } from "./GrooveStage";
import { HeroIntro } from "./HeroIntro";
import { HeroNav } from "./HeroNav";

const DIVE_END = 0.42; // by here the camera is inside the grooves
const ERA_TRAVEL_END = 0.8; // eras done; the closing "about" frame rises after this
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function GrooveWorld() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = document.documentElement;
    useEraStore.getState().loadHomeEra(); // apply the persisted landing era
    let raf = 0;
    let lastEra = -1;
    const update = () => {
      raf = 0;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;
      const dive = clamp01((p - 0.05) / (DIVE_END - 0.05));
      const about = clamp01((p - ERA_TRAVEL_END) / (1 - ERA_TRAVEL_END));
      root.style.setProperty("--groove-p", p.toFixed(4));
      root.style.setProperty("--gp-dive", dive.toFixed(4));
      root.style.setProperty("--gp-about", about.toFixed(4));
      root.dataset.groovePhase = p < DIVE_END ? "out" : "in";
      root.dataset.grooveEnd = about > 0.5 ? "1" : "";
      // Travel forward from the chosen home era to the present (90s), over DIVE_END→ERA_TRAVEL_END.
      const homeIdx = Math.max(ERA_ORDER.indexOf(useEraStore.getState().homeEra), 0);
      const et = clamp01((p - DIVE_END) / (ERA_TRAVEL_END - DIVE_END));
      const idx = Math.min(
        homeIdx + Math.floor(et * (ERA_ORDER.length - homeIdx)),
        ERA_ORDER.length - 1,
      );
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
      delete root.dataset.grooveEnd;
      root.style.removeProperty("--groove-p");
      root.style.removeProperty("--gp-dive");
      root.style.removeProperty("--gp-about");
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
          <div className="w-full max-w-4xl">
            {/* scroll owns the era at the eras level → don't let the spiral lift it too */}
            <SpiralNavigator active={false} />
          </div>
          {/* the payoff — drop the needle on the era you've traveled to */}
          <div className="pointer-events-auto absolute bottom-[6vh] left-1/2 -translate-x-1/2">
            <DropNeedle />
          </div>
        </div>

        {/* the closing frame — fades in over the last stretch of scroll */}
        <AboutPanel />
      </div>
    </>
  );
}

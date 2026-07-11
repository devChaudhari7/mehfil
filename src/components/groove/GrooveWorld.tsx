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
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ERA_ORDER, useEraStore } from "@/lib/useEraStore";
import { publishGrooveFrame } from "@/lib/grooveBus";
import { playTuningSweep } from "@/lib/sound/sfx";
import { setDroneActive, setDroneEra } from "@/lib/sound/synth";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { SpiralNavigator } from "@/components/browse";
import { AboutPanel } from "./AboutPanel";
import { DropNeedle } from "./DropNeedle";
import { GrooveStage } from "./GrooveStage";
import { HeroIntro } from "./HeroIntro";
import { HeroNav } from "./HeroNav";
import { YearOdometer } from "./YearOdometer";

// The shader light layer (15.2+): additive, deferred, ssr:false — never in the
// load window; renders nothing wherever WebGL2 / motion isn't available.
const GrooveGL = dynamic(() => import("./GrooveGL").then((m) => m.GrooveGL), {
  ssr: false,
  loading: () => null,
});

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
    let flashTimer = 0;
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
      // Travel through ALL eras, starting from the chosen home era and wrapping (so picking
      // 1980 still reaches every era — the groove loops). Over DIVE_END→ERA_TRAVEL_END.
      const n = ERA_ORDER.length;
      const homeIdx = Math.max(ERA_ORDER.indexOf(useEraStore.getState().homeEra), 0);
      const et = clamp01((p - DIVE_END) / (ERA_TRAVEL_END - DIVE_END));
      const eraFloat = homeIdx + Math.min(et * n, n - 0.001);
      const idx = Math.floor(eraFloat) % n;
      // publish the frame for imperative consumers (year odometer, GrooveGL) — no renders
      publishGrooveFrame({ p, dive, about, eraFloat });
      if (idx !== lastEra) {
        const isFirst = lastEra === -1;
        lastEra = idx;
        const era = ERA_ORDER[idx];
        if (era) {
          useEraStore.getState().setEra(era);
          // crossing a decade: the dial sweeps + the era's texture flashes
          // (never on the initial frame — arriving isn't traveling)
          if (!isFirst) {
            playTuningSweep();
            root.dataset.eraFlash = era;
            window.clearTimeout(flashTimer);
            flashTimer = window.setTimeout(() => {
              delete root.dataset.eraFlash;
            }, 520);
          }
        }
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
      window.clearTimeout(flashTimer);
      delete root.dataset.groovePhase;
      delete root.dataset.grooveEnd;
      delete root.dataset.eraFlash;
      root.style.removeProperty("--groove-p");
      root.style.removeProperty("--gp-dive");
      root.style.removeProperty("--gp-about");
    };
  }, [reduced]);

  // The idle-world drone (15.7): era-tuned, whisper-quiet, and ONLY while the world
  // is idle — the moment a track plays, it bows out and the ambience beds take over.
  // Audio is independent of reduced motion (the sound layer's own contract); it is
  // gesture-gated by construction (no AudioContext exists before the first unlock).
  useEffect(() => {
    const compute = () =>
      useSoundStore.getState().unlocked && usePlayerStore.getState().status !== "playing";
    setDroneEra(useEraStore.getState().era);
    setDroneActive(compute());
    const offEra = useEraStore.subscribe((s) => setDroneEra(s.era));
    const offPlayer = usePlayerStore.subscribe(() => setDroneActive(compute()));
    const offSound = useSoundStore.subscribe(() => setDroneActive(compute()));
    return () => {
      offEra();
      offPlayer();
      offSound();
      setDroneActive(false); // leaving the world silences the score
    };
  }, []);

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
          {/* time machinery: the year rolls behind the spiral as you travel */}
          <YearOdometer />
          <div className="relative w-full max-w-4xl">
            {/* scroll owns the era at the eras level → don't let the spiral lift it too */}
            <SpiralNavigator active={false} />
          </div>
          {/* the payoff — drop the needle on the era you've traveled to (clears the
              floating player bar) */}
          <div className="pointer-events-auto absolute bottom-[15vh] left-1/2 -translate-x-1/2">
            <DropNeedle />
          </div>
        </div>

        {/* the closing frame — fades in over the last stretch of scroll */}
        <AboutPanel />

        {/* era texture events: film-gate / bloom / CRT / digital, keyed by
            html[data-era-flash] for ~half a second as you cross a decade */}
        <div className="era-flash" aria-hidden="true" />

        {/* the shader light: lamp, dust, halo — and the tunnel during the dive */}
        <GrooveGL />
      </div>
    </>
  );
}

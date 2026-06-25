"use client";

/*
 * GrooveStage — the Groove hero orchestrator (docs/02).
 *
 * Picks the render tier, reads the era + player stores, owns the interpolated
 * clock, and lays out the scene + the DOM HUD. The decorative scene and the central
 * medium artifact are dynamic-imported (ssr:false) so their code stays out of the
 * initial hydration chunk; both are CLS-safe to defer (scene is absolute/out-of-flow,
 * the medium renders into a CSS-reserved box). The static header + entry links are
 * SERVER components passed in (intro / nav), so that markup isn't hydrated. One GSAP
 * load sequence fades the HUD in (skipped under reduced motion).
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useRenderTier } from "@/lib/useRenderTier";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useInterpolatedTime } from "@/lib/useInterpolatedTime";
import { SynestheticBloom } from "./SynestheticBloom";
import { NowPlaying } from "./NowPlaying";
import { TrackNodes } from "./TrackNodes";
import { EraTimeline } from "./EraTimeline";

const GrooveScene = dynamic(() => import("./GrooveScene").then((m) => m.GrooveScene), {
  ssr: false,
  loading: () => null,
});
const MediumArtifact = dynamic(() => import("./MediumArtifact").then((m) => m.MediumArtifact), {
  ssr: false,
  loading: () => null,
});

const AMP = { slow: 0.5, mid: 1.0, fast: 1.8 } as const;

// CSS-fixed reserved size for the central medium box (identical SSR↔client so it
// never reflows after first paint — the prime CLS fix). The numeric px size below
// is measured from this box only to feed the medium sub-components.
const MEDIUM_SIZE = "min(66vw, 50vh, 360px)";

export function GrooveStage({ intro, nav }: { intro?: ReactNode; nav?: ReactNode }) {
  const tier = useRenderTier();
  const era = useEraStore((s) => s.era);
  const status = usePlayerStore((s) => s.status);
  const track = usePlayerStore((s) => s.currentTrack);
  const reduced = useReducedMotion();
  const clock = useInterpolatedTime();
  const rootRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w) setSize(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) return;
    // Lazy-load gsap so it stays out of the initial hydration chunk (perf).
    let reverted = false;
    let ctx: { revert: () => void } | undefined;
    void import("gsap").then(({ gsap }) => {
      if (reverted || !rootRef.current) return;
      ctx = gsap.context(() => {
        gsap.from("[data-intro]", {
          opacity: 0,
          y: 18,
          duration: 0.7,
          stagger: 0.09,
          ease: "power2.out",
        });
      }, rootRef);
    });
    return () => {
      reverted = true;
      ctx?.revert();
    };
  }, [reduced]);

  const spinning = status === "playing";
  const medium = getEra(era).medium;
  const showNeedle = medium === "shellac" || medium === "vinyl";
  const amplitude = (track ? AMP[track.tempoBucket] : 0.6) * (spinning ? 1 : 0.4);

  // pb-28/32 below clears the fixed Phase 3 player bar when a track is playing.
  return (
    <section
      ref={rootRef}
      aria-label="The Groove"
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-between overflow-hidden px-5 pt-10 pb-28 sm:pt-14 sm:pb-32"
    >
      {/* Decorative backdrop (dynamic; absolute → CLS-safe to defer) */}
      <GrooveScene tier={tier} clock={clock} amplitude={amplitude} />

      <header data-intro className="relative z-10 text-center">
        {intro}
      </header>

      {/* Central artifact + needle (Tier A renders these in WebGL). The box reserves
          space via CSS (MEDIUM_SIZE); the medium renders into it once measured, so it
          paints in-place with no layout shift. */}
      <div
        ref={boxRef}
        data-intro
        className="relative z-10 grid place-items-center"
        style={{ width: MEDIUM_SIZE, height: MEDIUM_SIZE }}
      >
        <SynestheticBloom />
        {tier !== "A" && size > 0 && (
          <MediumArtifact
            era={era}
            spinning={spinning}
            showNeedle={showNeedle}
            animated={tier === "B" && !reduced}
            clock={clock}
            size={size}
          />
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5">
        <div data-intro>
          <NowPlaying />
        </div>
        <div data-intro className="w-full">
          <TrackNodes />
        </div>
        <div data-intro className="flex flex-col items-center gap-3">
          <EraTimeline />
          {nav}
        </div>
      </div>
    </section>
  );
}

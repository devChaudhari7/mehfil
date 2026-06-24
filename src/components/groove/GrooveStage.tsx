"use client";

/*
 * GrooveStage — the Groove hero orchestrator (docs/02).
 *
 * Picks the render tier, reads the era + player stores, owns the interpolated
 * clock, and lays out the scene (Tier A WebGL / Tier B canvas / Tier C static) +
 * the DOM HUD. One orchestrated GSAP load sequence fades the HUD in (skipped under
 * reduced motion). Tier A is code-split + lazy (ssr:false) so the heavy WebGL
 * chunk never blocks first paint; Tier C renders until the client settles.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useRenderTier } from "@/lib/useRenderTier";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useInterpolatedTime } from "@/lib/useInterpolatedTime";
import { GrooveSpiral } from "./GrooveSpiral";
import { MediumObject } from "./MediumObject";
import { Needle } from "./Needle";
import { SynestheticBloom } from "./SynestheticBloom";
import { NowPlaying } from "./NowPlaying";
import { TrackNodes } from "./TrackNodes";
import { EraTimeline } from "./EraTimeline";

const GrooveSceneWebGL = dynamic(
  () => import("./webgl/GrooveSceneWebGL").then((m) => m.GrooveSceneWebGL),
  { ssr: false, loading: () => null },
);

const AMP = { slow: 0.5, mid: 1.0, fast: 1.8 } as const;

export function GrooveStage() {
  const tier = useRenderTier();
  const era = useEraStore((s) => s.era);
  const status = usePlayerStore((s) => s.status);
  const track = usePlayerStore((s) => s.currentTrack);
  const reduced = useReducedMotion();
  const clock = useInterpolatedTime();
  const rootRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState(300);

  useEffect(() => {
    const update = () =>
      setSize(Math.round(Math.min(window.innerWidth * 0.66, window.innerHeight * 0.5, 360)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (reduced || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-intro]", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.09,
        ease: "power2.out",
      });
    }, rootRef);
    return () => ctx.revert();
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
      {/* Scene layer (decorative; HUD sits above and is interactive) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {tier === "A" ? (
          <GrooveSceneWebGL clock={clock} />
        ) : (
          <GrooveSpiral tier={tier} clock={clock} amplitude={amplitude} />
        )}
      </div>

      <header data-intro className="relative z-10 text-center">
        <p className="text-accent font-mono text-[11px] tracking-[0.32em] uppercase">
          The medium is the map
        </p>
        <h1 className="groove-display font-display text-ink mt-3 text-3xl sm:text-5xl">MEHFIL</h1>
        <p className="text-ink/70 mt-2 font-body text-sm">
          Don&rsquo;t scroll the library. Travel the groove.
        </p>
      </header>

      {/* Central artifact + needle (Tier B/C; Tier A renders these in WebGL) */}
      <div data-intro className="relative z-10 grid place-items-center" style={{ width: size, height: size }}>
        <SynestheticBloom />
        {tier !== "A" && (
          <div className="relative" style={{ width: size, height: size }}>
            <MediumObject era={era} spinning={spinning} size={size} />
            <Needle
              clock={clock}
              visible={showNeedle}
              animated={tier === "B" && !reduced}
              size={size}
            />
          </div>
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
          <Link
            href="/catalog"
            className="text-ink/60 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
          >
            Browse as list
          </Link>
        </div>
      </div>
    </section>
  );
}

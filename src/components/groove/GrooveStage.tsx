"use client";

/*
 * GrooveStage — the Groove hero as ONE cinematic stage (Phase 11).
 *
 * The homepage has a single purpose: make you want to ENTER THE GROOVE. So the
 * hero is a stage, not a dashboard — a giant MEHFIL title that the large central
 * morphing record eclipses, the thesis, and ONE primary action. Browsing/search/
 * now-playing are relocated (the quiet corner link, ⌘K, the player bar).
 *
 * The opening is a self-driven SEQUENCE, not a static screen: the world ignites at
 * the dawn of recorded sound (shellac 50s) and auto-travels the eras
 * (50s→…→90s→ home 60s), the medium morphing shellac→vinyl→cassette→CD and the
 * palette/grain/caption with it — the medium-morph is the STORY, not a control.
 * Any user intent skips to the settled frame. Reduced motion / Tier C: no
 * sequence — the composed final frame at the default era, ENTER focusable.
 *
 * Perf: CSS/transform/opacity + the existing [data-era] token morph only (setEra
 * just toggles the attribute). No three.js (Tier A is disabled). The record sits
 * in a CSS-reserved box (no CLS); the wordmark is the preloaded Marcellus (LCP).
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GrooveLink } from "@/components/GrooveLink";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useRenderTier } from "@/lib/useRenderTier";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useInterpolatedTime } from "@/lib/useInterpolatedTime";
import { SynestheticBloom } from "./SynestheticBloom";

const GrooveScene = dynamic(() => import("./GrooveScene").then((m) => m.GrooveScene), {
  ssr: false,
  loading: () => null,
});
const MediumArtifact = dynamic(() => import("./MediumArtifact").then((m) => m.MediumArtifact), {
  ssr: false,
  loading: () => null,
});

const AMP = { slow: 0.5, mid: 1.0, fast: 1.8 } as const;

// CSS-fixed reserved size for the central record (identical SSR↔client so it never
// reflows after first paint — the CLS fix). Monumental: the record is the hero.
const MEDIUM_SIZE = "min(86vw, 64vh, 520px)";

export function GrooveStage({
  intro,
  nav,
  active = true,
}: {
  intro?: ReactNode;
  nav?: ReactNode;
  /** True only when the hero is the live depth (0). Gates the auto-journey + backdrop
   *  so a deep-linked /browse (depth 1) never runs the home showreel behind the spiral. */
  active?: boolean;
}) {
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

  // One GSAP load sequence rises the text in (lazy; skipped under reduced motion).
  useEffect(() => {
    if (reduced) return;
    let reverted = false;
    let ctx: { revert: () => void } | undefined;
    void import("gsap").then(({ gsap }) => {
      if (reverted || !rootRef.current) return;
      ctx = gsap.context(() => {
        gsap.from("[data-intro]", {
          opacity: 0,
          y: 12,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        });
      }, rootRef);
    });
    return () => {
      reverted = true;
      ctx?.revert();
    };
  }, [reduced]);

  const cfg = getEra(era);
  const medium = cfg.medium;
  const showNeedle = medium === "shellac" || medium === "vinyl";
  const heroAnimated = tier === "B" && !reduced;
  const playing = status === "playing";
  const amplitude = (track ? AMP[track.tempoBucket] : 0.7) * (playing ? 1 : 0.5);

  return (
    <section
      ref={rootRef}
      aria-label="The Groove"
      className="groove-stage absolute inset-0 grid place-items-center overflow-hidden px-5 pb-24"
    >
      {/* Decorative backdrop (dynamic; absolute → CLS-safe to defer). Only while the
          hero is the live depth, so its canvas rAF stops once the camera is inside. */}
      {active && <GrooveScene tier={tier} clock={clock} amplitude={amplitude} />}

      {/* Quiet secondary — utility relocated off the focal path */}
      <nav className="absolute top-5 right-5 z-20 flex items-center gap-4 font-mono text-[11px] tracking-[0.18em] uppercase">
        <GrooveLink
          href="/catalog"
          className="text-ink/55 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
        >
          The Library
        </GrooveLink>
        <GrooveLink
          href="/search"
          className="text-ink/55 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
        >
          Search
        </GrooveLink>
      </nav>

      {/* The stage: kicker · the title-eclipsing record · era caption · thesis + ENTER */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <p
          data-intro
          className="text-accent font-mono text-[11px] tracking-[0.34em] uppercase"
        >
          The medium is the map
        </p>

        <div
          ref={boxRef}
          className="relative mt-6 grid place-items-center sm:mt-8"
          style={{ width: MEDIUM_SIZE, height: MEDIUM_SIZE }}
        >
          {/* giant MEHFIL — wider than the disc, centered behind it (eclipsed) */}
          <div
            data-intro
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-[160vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2"
          >
            {intro}
          </div>

          <SynestheticBloom />

          {/* the record (in front, eclipsing the title) — a scroll cue into the grooves */}
          {tier !== "A" && size > 0 && (
            <a
              href="#groove"
              aria-hidden="true"
              tabIndex={-1}
              className="groove-zoom relative z-10 block cursor-pointer"
            >
              <MediumArtifact
                era={era}
                spinning={heroAnimated}
                showNeedle={showNeedle}
                animated={heroAnimated}
                clock={clock}
                size={size}
              />
            </a>
          )}
        </div>

        {/* era caption — updates as the world morphs through time */}
        <p
          data-intro
          className="text-ink/60 mt-6 font-mono text-[11px] tracking-[0.22em] uppercase tabular-nums"
        >
          {cfg.decade} · {cfg.mediumLabel}
        </p>

        <div data-intro className="mt-8">
          {nav}
        </div>
      </div>
    </section>
  );
}

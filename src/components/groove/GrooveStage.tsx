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
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getEra, type EraId } from "@/lib/eras";
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

// The cinematic time-travel: dawn of recorded sound → survey the eras → home to
// the golden age (60s). Matches the reduced-motion/SSR default so they converge.
const JOURNEY: EraId[] = ["50s", "60s", "70s", "80s", "90s", "60s"];
const HOME_ERA: EraId = "60s";

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
  const introDone = useRef(false);

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

  // The auto-travel opening (Tier B + motion only). Runs once; any intent skips
  // to the home era so the morph never fights the user.
  useEffect(() => {
    if (reduced || tier !== "B" || introDone.current) return;
    introDone.current = true;
    const setEra = useEraStore.getState().setEra;
    let i = 0;
    setEra(JOURNEY[0]!); // ignite at the dawn of recorded sound (shellac 50s)
    const timer = window.setInterval(() => {
      i += 1;
      if (i >= JOURNEY.length) {
        window.clearInterval(timer);
        return;
      }
      setEra(JOURNEY[i]!);
    }, 1300);

    const skip = () => {
      window.clearInterval(timer);
      setEra(HOME_ERA);
      teardown();
    };
    const teardown = () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
    window.addEventListener("pointerdown", skip, { passive: true });
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });

    return () => {
      window.clearInterval(timer);
      teardown();
    };
  }, [reduced, tier]);

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
      className="relative grid min-h-[100svh] w-full place-items-center overflow-hidden px-5 pt-20 pb-28 sm:pb-32"
    >
      {/* Decorative backdrop (dynamic; absolute → CLS-safe to defer) */}
      <GrooveScene tier={tier} clock={clock} amplitude={amplitude} />

      {/* Quiet secondary — utility relocated off the focal path */}
      <nav className="absolute top-5 right-5 z-20 flex items-center gap-4 font-mono text-[11px] tracking-[0.18em] uppercase">
        <Link
          href="/catalog"
          className="text-ink/55 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
        >
          The Library
        </Link>
        <Link
          href="/search"
          className="text-ink/55 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
        >
          Search
        </Link>
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

          {/* the record (in front, eclipsing the title) — also a click target in */}
          {tier !== "A" && size > 0 && (
            <Link
              href="/browse"
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
            </Link>
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

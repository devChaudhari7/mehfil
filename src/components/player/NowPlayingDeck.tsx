"use client";

/*
 * NowPlayingDeck — the full-screen "now playing" stage (Phase 14 premium redesign).
 *
 * The medium is the map even here: the track's OWN era artifact spins at the heart of the
 * frame (shellac / vinyl / cassette / CD), the needle rides the groove, and the synesthetic
 * raga-light blooms behind it. A quiet, confident info column carries the title (native +
 * Latin), the artist, and the scrub-as-tape timeline. Reduced motion → everything static,
 * full keyboard control, an aria-live announcement on track changes.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { MediumArtifact } from "@/components/groove/MediumArtifact";
import { TouchRecord } from "@/components/groove/TouchRecord";
import { SynestheticBloom } from "@/components/groove/SynestheticBloom";
import { NativeText } from "@/components/ui";
import { decadeToEraId } from "@/lib/catalog";
import { DEFAULT_ERA, getEra } from "@/lib/eras";
import { artistLine, usePlayerStore } from "@/lib/player/usePlayerStore";
import { useInterpolatedTime } from "@/lib/useInterpolatedTime";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { playNeedleDrop } from "@/lib/sound/sfx";
import { cx } from "@/lib/cx";
import { Scrubber } from "./Scrubber";

function fmt(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function DeckButton({
  label,
  onClick,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        "grid shrink-0 cursor-pointer place-items-center rounded-full transition-[transform,filter,background-color,box-shadow] duration-[var(--dur-1)] ease-[var(--ease-analog)] active:translate-y-[1px]",
        primary
          ? "bg-btn text-btn-ink h-16 w-16 shadow-[0_4px_0_rgba(0,0,0,0.35),0_10px_24px_rgba(0,0,0,0.4)] hover:brightness-110 active:shadow-[0_1px_0_rgba(0,0,0,0.35)]"
          : "text-ink/80 hover:text-ink h-12 w-12 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

export interface NowPlayingDeckProps {
  /** Overlay close handler; takes precedence over backHref. */
  onClose?: () => void;
  /** Route back link (when not an overlay). */
  backHref?: string;
}

export function NowPlayingDeck({ onClose, backHref }: NowPlayingDeckProps) {
  const reduced = useReducedMotion();
  const clock = useInterpolatedTime();
  const track = usePlayerStore((s) => s.currentTrack);
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const unlock = useSoundStore((s) => s.unlock);
  const unlocked = useSoundStore((s) => s.unlocked);

  const counterRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  const dur = duration || track?.durationSec || 0;
  const playing = status === "playing";

  // Measure the artifact box (feeds the medium sub-components their px size).
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w) setSize(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [track]);

  // Smooth tape counter between the 250ms polls (no per-frame React renders).
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const tick = () => {
      if (counterRef.current) counterRef.current.textContent = fmt(clock.getTime());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, clock]);

  function handlePlayPause() {
    if (!unlocked) unlock();
    const wasPlaying = usePlayerStore.getState().status === "playing";
    togglePlay();
    if (!wasPlaying) playNeedleDrop();
  }

  const closeControl = onClose ? (
    <button
      type="button"
      aria-label="Close now playing"
      onClick={onClose}
      className="text-ink/70 hover:text-ink grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:bg-white/10"
    >
      <X size={22} />
    </button>
  ) : backHref ? (
    <Link
      href={backHref}
      aria-label="Back"
      className="text-ink/70 hover:text-ink grid h-11 w-11 place-items-center rounded-full transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:bg-white/10"
    >
      <X size={22} />
    </Link>
  ) : null;

  const era = track ? decadeToEraId(track.era) : DEFAULT_ERA;
  const medium = getEra(era).medium;
  const showNeedle = medium === "shellac" || medium === "vinyl";

  return (
    <div className="relative flex min-h-dvh w-full flex-col px-5 py-5 sm:px-8 sm:py-7">
      {/* the raga-light, breathing behind the whole stage */}
      <SynestheticBloom />

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-accent flex items-center gap-2.5 font-mono text-[11px] tracking-[0.34em] uppercase">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            {playing && (
              <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
            )}
            <span className="bg-accent relative inline-flex h-2 w-2 rounded-full" />
          </span>
          {playing ? "Now Playing" : "Paused"}
        </p>
        {closeControl}
      </div>

      {/* aria-live: announce track changes politely */}
      <p aria-live="polite" className="sr-only">
        {track ? `Now playing: ${track.title.latin} by ${artistLine(track)}` : "Nothing playing"}
      </p>

      {!track ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-ink/70 font-display text-2xl">Nothing playing</p>
          <Link
            href="/browse"
            className="bg-btn text-btn-ink rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase hover:brightness-110"
          >
            Travel the groove →
          </Link>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 sm:flex-row sm:gap-16">
          {/* the era artifact — spins at the heart of the frame */}
          <div
            ref={boxRef}
            className="relative grid aspect-square w-[min(82vw,50vh,440px)] shrink-0 place-items-center"
          >
            {size > 0 && (
              /* grab the playing record — spin it, scratch it (turntable physics) */
              <TouchRecord medium={medium} spinning={playing && !reduced}>
                <MediumArtifact
                  era={era}
                  spinning={playing && !reduced && medium === "cassette"}
                  showNeedle={showNeedle}
                  animated={!reduced}
                  clock={clock}
                  size={size}
                />
              </TouchRecord>
            )}
          </div>

          {/* the info column */}
          <div className="flex w-full max-w-md flex-col">
            <p className="text-ink/50 font-mono text-[11px] tracking-[0.22em] uppercase">
              {getEra(era).decade} · {getEra(era).mediumLabel}
              {track.film ? ` · ${track.film}` : ""}
            </p>

            <div className="mt-4">
              <NativeText
                native={track.title.native}
                latin={track.title.latin}
                script={track.script}
                size="h1"
              />
            </div>

            <p className="text-ink/65 mt-3 font-mono text-xs tracking-[0.14em] uppercase">
              {artistLine(track)}
            </p>

            {/* scrub-as-tape timeline */}
            <div className="mt-8">
              <Scrubber value={currentTime} max={dur} onSeek={seek} />
              <div className="text-ink/55 mt-2 flex items-center justify-between font-mono text-[11px] tabular-nums">
                <span ref={counterRef}>{fmt(currentTime)}</span>
                <span>{fmt(dur)}</span>
              </div>
            </div>

            {/* transport */}
            <div className="mt-8 flex items-center gap-5">
              <DeckButton label="Previous track" onClick={prev}>
                <SkipBack size={22} />
              </DeckButton>
              <DeckButton label={playing ? "Pause" : "Play"} primary onClick={handlePlayPause}>
                {playing ? <Pause size={26} /> : <Play size={26} />}
              </DeckButton>
              <DeckButton label="Next track" onClick={next}>
                <SkipForward size={22} />
              </DeckButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

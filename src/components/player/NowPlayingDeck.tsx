"use client";

/*
 * NowPlayingDeck — the full-screen cassette deck (Phase 6). Shared by the in-place
 * overlay and the /now-playing route. The cassette reels turn and the tape
 * redistributes with progress (driven by the interpolated clock, never raw
 * currentTime); a bilingual J-card carries the title; the Scrubber is the
 * scrub-as-tape timeline. Reduced motion → static reels + a static tape fill, full
 * keyboard control, and an aria-live announcement on track changes.
 */
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Cassette } from "@/components/groove/Cassette";
import { NativeText } from "@/components/ui";
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
        "grid shrink-0 cursor-pointer place-items-center rounded-full transition-[transform,filter,background-color] duration-150 ease-[var(--ease-analog)] active:translate-y-[1px]",
        primary
          ? "bg-btn text-btn-ink h-14 w-14 shadow-[0_3px_0_rgba(0,0,0,0.35),0_6px_14px_rgba(0,0,0,0.35)] hover:brightness-110"
          : "text-ink h-11 w-11 hover:bg-white/10",
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

  const dur = duration || track?.durationSec || 0;
  const playing = status === "playing";
  const progress = dur > 0 ? Math.min(currentTime / dur, 1) : 0;

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
      className="text-ink/70 hover:text-ink grid h-11 w-11 cursor-pointer place-items-center rounded-full hover:bg-white/10"
    >
      <X size={22} />
    </button>
  ) : backHref ? (
    <Link
      href={backHref}
      aria-label="Back"
      className="text-ink/70 hover:text-ink grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"
    >
      <X size={22} />
    </Link>
  ) : null;

  return (
    <div className="flex min-h-dvh w-full flex-col px-5 py-5 sm:px-8 sm:py-7">
      <div className="flex items-center justify-between">
        <p className="text-accent font-mono text-[11px] tracking-[0.28em] uppercase">
          Now Playing · Tape
        </p>
        {closeControl}
      </div>

      {/* aria-live: announce track changes politely */}
      <p aria-live="polite" className="sr-only">
        {track ? `Now playing: ${track.title.latin} by ${artistLine(track)}` : "Nothing playing"}
      </p>

      {!track ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-ink/70 font-display text-2xl">Nothing playing</p>
          <Link
            href="/browse"
            className="bg-btn text-btn-ink rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase hover:brightness-110"
          >
            Travel the groove →
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 sm:flex-row sm:items-center sm:gap-12">
          {/* the cassette */}
          <div className="aspect-[100/64] w-[min(88vw,460px)] shrink-0">
            <Cassette
              className="h-full w-full"
              variant="deck"
              progress={progress}
              clock={reduced ? undefined : clock}
            />
          </div>

          {/* J-card */}
          <div className="w-full max-w-sm">
            <div className="surface-paper rounded-[10px] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              <span className="text-ink/60 font-mono text-[10px] tracking-[0.22em] uppercase">
                {track.era} {track.film ? `· ${track.film}` : ""}
              </span>
              <div className="mt-3">
                <NativeText
                  native={track.title.native}
                  latin={track.title.latin}
                  script={track.script}
                  size="h2"
                />
              </div>
              <p className="text-ink/70 mt-3 font-mono text-[11px] tracking-[0.14em] uppercase">
                {artistLine(track)}
              </p>
            </div>

            {/* tape counter + scrub-as-tape */}
            <div className="mt-6">
              <div className="text-ink/70 flex items-center justify-between font-mono text-[11px] tracking-[0.14em] tabular-nums">
                <span ref={counterRef}>{fmt(currentTime)}</span>
                <span className="text-ink/40">TAPE</span>
                <span>{fmt(dur)}</span>
              </div>
              <Scrubber value={currentTime} max={dur} onSeek={seek} className="mt-2" />
            </div>

            {/* transport */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <DeckButton label="Previous track" onClick={prev}>
                <SkipBack size={20} />
              </DeckButton>
              <DeckButton label={playing ? "Pause" : "Play"} primary onClick={handlePlayPause}>
                {playing ? <Pause size={24} /> : <Play size={24} />}
              </DeckButton>
              <DeckButton label="Next track" onClick={next}>
                <SkipForward size={20} />
              </DeckButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

/*
 * MEHFIL — persistent player bar (brief §15 Phase 3).
 *
 * Mounted once in World (root layout), so it + the hidden audio host survive
 * route changes. Mini turntable + scrubber + transport, driven entirely by the
 * player store (which talks only to the AudioProvider). The first play gesture
 * unlocks the SFX layer (autoplay policy) and drops the needle; the crackle
 * ambience follows playback and respects the persisted mute.
 */
import { useEffect } from "react";
import { ChevronUp, Disc3, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cx } from "@/lib/cx";
import { scriptFont, type Script } from "@/lib/fonts";
import { RecordArt } from "@/components/art";
import { artistLine, usePlayerStore } from "@/lib/player/usePlayerStore";
import { useNowPlaying } from "@/lib/useNowPlaying";
import { useEraStore } from "@/lib/useEraStore";
import type { EraId } from "@/lib/eras";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { playNeedleDrop, setAmbience, stopAmbience, type AmbienceKind } from "@/lib/sound/sfx";
import { Scrubber } from "./Scrubber";

const ERA_AMBIENCE: Record<EraId, AmbienceKind> = {
  "50s": "shellac",
  "60s": "vinyl",
  "70s": "vinylWarm",
  "80s": "tape",
  "90s": "cd",
};

const LANG: Record<Script, string> = {
  devanagari: "hi",
  gurmukhi: "pa",
  bengali: "bn",
  latin: "en",
};

function fmt(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function IconButton({
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
        "grid shrink-0 cursor-pointer place-items-center rounded-full",
        "transition-[transform,background-color,filter] duration-[var(--dur-1)] ease-[var(--ease-analog)]",
        "active:translate-y-[1px]",
        primary
          ? "bg-btn text-btn-ink h-12 w-12 shadow-[0_3px_0_rgba(0,0,0,0.35),0_6px_14px_rgba(0,0,0,0.35)] hover:brightness-110 active:shadow-[0_1px_0_rgba(0,0,0,0.35)]"
          : "text-ink h-10 w-10 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

export function PlayerBar() {
  const status = usePlayerStore((s) => s.status);
  const track = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const openNowPlaying = useNowPlaying((s) => s.setOpen);
  const era = useEraStore((s) => s.era);

  const muted = useSoundStore((s) => s.muted);
  const unlocked = useSoundStore((s) => s.unlocked);
  const toggleMute = useSoundStore((s) => s.toggleMute);
  const hydrate = useSoundStore((s) => s.hydrate);
  const unlock = useSoundStore((s) => s.unlock);

  // Restore persisted mute on mount.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Era-appropriate ambient bed follows playback + the current zone; sfx self-gates
  // on unlocked && !muted (shellac crackle → vinyl noise → warm hiss → tape → CD).
  useEffect(() => {
    if (status === "playing") setAmbience(ERA_AMBIENCE[era]);
    else stopAmbience();
  }, [status, era, muted, unlocked]);

  if (!track) return null;

  const playing = status === "playing";
  const dur = duration || track.durationSec || 0;
  const font = scriptFont(track.script);

  function handlePlayPause() {
    if (!unlocked) unlock();
    const wasPlaying = usePlayerStore.getState().status === "playing";
    togglePlay();
    if (!wasPlaying) playNeedleDrop();
  }

  return (
    <div
      role="region"
      aria-label="Now playing"
      className="player-rise fixed bottom-3 left-1/2 z-50 w-[min(96vw,1080px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[color-mix(in_srgb,#070709_86%,var(--accent))]/85 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:bottom-4"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* premium top edge — a faint accent filament */}
      <div
        aria-hidden="true"
        className="via-accent/35 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
      <Scrubber value={currentTime} max={dur} onSeek={seek} className="rounded-none" />

      <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4">
        {/* left — mini turntable + title; tap to expand into the cassette deck */}
        <button
          type="button"
          onClick={() => openNowPlaying(true)}
          aria-label="Open now playing"
          className="group -mx-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:bg-white/5"
        >
          <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-[10px] shadow-[0_8px_20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <RecordArt subject={{ track }} variant="swatch" />
          </span>
          <div className="min-w-0">
            <span className="text-accent/70 hidden font-mono text-[9px] tracking-[0.22em] uppercase sm:block">
              {playing ? "Now playing" : "Paused"}
            </span>
            <span
              lang={LANG[track.script]}
              className={cx("text-ink mt-0.5 block truncate text-[15px] leading-tight", font.display)}
            >
              {track.title.native}
            </span>
            <span className="text-ink/55 block truncate font-mono text-[11px] tracking-wide">
              {artistLine(track)}
            </span>
          </div>
          <ChevronUp
            size={16}
            className="text-ink/40 group-hover:text-accent ml-1 shrink-0 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]"
          />
        </button>

        {/* center — transport */}
        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton label="Previous track" onClick={prev}>
            <SkipBack size={18} />
          </IconButton>
          <IconButton label={playing ? "Pause" : "Play"} primary onClick={handlePlayPause}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </IconButton>
          <IconButton label="Next track" onClick={next}>
            <SkipForward size={18} />
          </IconButton>
        </div>

        {/* right — time, music volume, SFX toggle (sm+) */}
        <div className="hidden flex-1 items-center justify-end gap-3 sm:flex">
          <span className="text-ink/70 font-mono text-caption tracking-[0.14em] tabular-nums">
            {fmt(currentTime)} / {fmt(dur)}
          </span>
          <button
            type="button"
            aria-label={volume === 0 ? "Unmute music" : "Mute music"}
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="text-ink/80 grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:bg-white/10"
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Music volume"
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--glow)]"
          />
          <button
            type="button"
            aria-pressed={!muted}
            aria-label="Toggle vinyl crackle and sound effects"
            onClick={toggleMute}
            className={cx(
              "grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:bg-white/10",
              muted ? "text-ink/35" : "text-accent",
            )}
          >
            <Disc3 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

/*
 * PlayControl — a gated play/pause control shared across browse leaves (Phase 5).
 *
 * Display is never gated; PLAYBACK is gated on a real, embeddable sourceId
 * (canPlay, after the dev demo overlay). Clicking plays the track within its
 * collection queue (playFromCollection → next/prev work); clicking the current
 * track toggles play/pause. The first click also unlocks the SFX layer (gesture).
 */
import { Pause, Play } from "lucide-react";
import type { Track } from "@/lib/catalog";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { canPlay, playFromCollection } from "@/lib/player/playFromCollection";
import { cx } from "@/lib/cx";

export interface PlayControlProps {
  track: Track;
  /** The collection this track plays within (becomes the queue). */
  queue: Track[];
  variant?: "pill" | "icon";
  /** Called after a play/pause action (e.g. to close a search palette). */
  onActivate?: () => void;
  className?: string;
}

export function PlayControl({ track, queue, variant = "pill", onActivate, className }: PlayControlProps) {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);
  const playable = canPlay(track);
  const isCurrent = currentId === track.id;
  const isPlaying = isCurrent && status === "playing";
  const Icon = isPlaying ? Pause : Play;

  function onClick() {
    if (isCurrent) usePlayerStore.getState().togglePlay();
    else playFromCollection(queue, track);
    onActivate?.();
  }

  const label = !playable
    ? `${track.title.latin} — no source yet`
    : isPlaying
      ? `Pause ${track.title.latin}`
      : `Play ${track.title.latin}`;

  if (variant === "icon") {
    return (
      <button
        type="button"
        disabled={!playable}
        onClick={onClick}
        aria-label={label}
        title={playable ? (isPlaying ? "Pause" : "Play") : "No source yet — run a live ingest"}
        className={cx(
          "grid h-10 w-10 place-items-center rounded-full transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)]",
          playable
            ? "bg-btn text-btn-ink cursor-pointer hover:brightness-110 active:translate-y-[1px]"
            : "text-ink/30 cursor-not-allowed border border-white/10",
          className,
        )}
      >
        <Icon size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      aria-label={label}
      title={playable ? (isPlaying ? "Pause" : "Play") : "No source yet — run a live ingest"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs tracking-wide transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)]",
        playable
          ? "bg-btn text-btn-ink cursor-pointer hover:brightness-110 active:translate-y-[1px]"
          : "text-ink/30 cursor-not-allowed border border-white/10",
        className,
      )}
    >
      <Icon size={13} />
      {isPlaying ? "Pause" : playable ? "Play" : "—"}
    </button>
  );
}

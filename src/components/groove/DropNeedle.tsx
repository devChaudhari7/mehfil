"use client";

/*
 * DropNeedle — the payoff of traveling the groove (Phase 14). Once you're inside the
 * grooves, a breathing "drop the needle" resolves in: one click plays a signature track
 * of the era you've scrolled to, the needle drops (sound), and the player bar rises. You
 * traveled all of recorded sound; now it sings. Follows the scroll-driven era.
 */
import { useMemo } from "react";
import { Pause, Play } from "lucide-react";
import { catalogRepository } from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { canPlay, playFromCollection } from "@/lib/player/playFromCollection";
import { cx } from "@/lib/cx";

export function DropNeedle() {
  const era = useEraStore((s) => s.era);
  const decade = getEra(era).decade;
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);

  const { tracks, signature } = useMemo(() => {
    const all = catalogRepository.allTracks().filter((t) => t.era === decade);
    return { tracks: all, signature: all.find((t) => canPlay(t)) ?? all[0] };
  }, [decade]);

  if (!signature) return null;
  const playable = canPlay(signature);
  const isThis = currentId === signature.id;
  const isPlaying = isThis && status === "playing";

  function onClick() {
    if (!signature) return;
    if (isThis) usePlayerStore.getState().togglePlay();
    else playFromCollection(tracks, signature);
  }

  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <button
        type="button"
        onClick={onClick}
        disabled={!playable}
        aria-label={
          playable
            ? `${isPlaying ? "Pause" : "Drop the needle and play"} ${signature.title.latin}`
            : "No source yet — run a live ingest"
        }
        className={cx(
          "bg-btn text-btn-ink inline-flex items-center gap-2 rounded-full px-7 py-3 font-mono text-xs tracking-[0.22em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)]",
          playable
            ? "cta-breathe cursor-pointer hover:brightness-110 active:translate-y-[2px]"
            : "cursor-not-allowed opacity-50",
        )}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        {isPlaying ? "Playing" : "Drop the needle"}
      </button>
      <p className="text-ink/55 font-mono text-[11px] tracking-[0.14em]">
        {decade} · {signature.title.latin}
      </p>
    </div>
  );
}

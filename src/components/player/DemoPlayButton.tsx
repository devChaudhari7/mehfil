"use client";

/*
 * DEV-ONLY play button for the /catalog debug route.
 *
 * The seed catalog has no resolved sourceIds yet, so this wires a track to the
 * in-memory demo set (src/lib/audio/demoTracks.ts) to exercise the real player.
 * Tracks without a demo id are disabled. Replace with a real play action that
 * uses catalogRepository.playable() once a live ingest fills sourceIds.
 */
import { Play } from "lucide-react";
import { cx } from "@/lib/cx";
import { getDemoTracks } from "@/lib/audio";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { playNeedleDrop } from "@/lib/sound/sfx";

const demoTracks = getDemoTracks();

export function DemoPlayButton({ trackId }: { trackId: string }) {
  const index = demoTracks.findIndex((t) => t.id === trackId);
  const enabled = index >= 0;

  function handleClick() {
    // First gesture: unlock the SFX layer, then queue + play + drop the needle.
    useSoundStore.getState().unlock();
    usePlayerStore.getState().setQueue(demoTracks, index);
    usePlayerStore.getState().playQueueAt(index);
    playNeedleDrop();
  }

  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={handleClick}
      aria-label={enabled ? `Play ${trackId} (demo)` : "No playable source yet"}
      title={enabled ? "Play (demo)" : "No source yet — run a live ingest"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs tracking-wide",
        enabled
          ? "bg-btn text-btn-ink cursor-pointer hover:brightness-110 active:translate-y-[1px]"
          : "text-ink/30 cursor-not-allowed border border-white/10",
      )}
    >
      <Play size={12} />
      {enabled ? "Play" : "—"}
    </button>
  );
}

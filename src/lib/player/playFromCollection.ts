"use client";

/*
 * MEHFIL — play a track within its collection (Phase 5, shared).
 *
 * Extracted from TrackNodes so every browse leaf (era / language / region /
 * artist / album, plus the spiral navigator) plays identically: the collection's
 * PLAYABLE members become the queue (next/prev work), the user gesture unlocks the
 * SFX layer, and a needle-drop fires. Display is never gated — only playback is,
 * via isPlayable, honoring the "no invented sourceIds" rule (brief §6e). The
 * dev-only demo overlay supplies a few real videoIds until a live ingest runs.
 */
import { getDemoTracks } from "@/lib/audio";
import { isPlayable, type Track } from "@/lib/catalog";
import { playNeedleDrop } from "@/lib/sound/sfx";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { usePlayerStore } from "./usePlayerStore";

const demoMap = new Map(getDemoTracks().map((t) => [t.id, t] as const));

/** Overlay the dev-only demo source (real videoId) onto a seed track, if any. */
export function effective(track: Track): Track {
  return demoMap.get(track.id) ?? track;
}

export function effectiveTracks(tracks: Track[]): Track[] {
  return tracks.map(effective);
}

/** The subset of a collection that can actually play (resolved + embeddable). */
export function playableQueue(tracks: Track[]): Track[] {
  return effectiveTracks(tracks).filter(isPlayable);
}

/** Can this track be played right now (after the demo overlay)? */
export function canPlay(track: Track): boolean {
  return isPlayable(effective(track));
}

/**
 * Play `track` in the context of its collection. No-op if it isn't currently
 * playable. MUST be called from a user gesture (it unlocks audio + SFX).
 */
export function playFromCollection(tracks: Track[], track: Track): void {
  const queue = playableQueue(tracks);
  const index = queue.findIndex((t) => t.id === track.id);
  if (index < 0) return;
  useSoundStore.getState().unlock();
  usePlayerStore.getState().setQueue(queue, index);
  usePlayerStore.getState().playQueueAt(index);
  playNeedleDrop();
}

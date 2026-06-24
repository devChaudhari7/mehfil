/*
 * MEHFIL — audio abstraction (brief §5).
 *
 * One interface so the playback source is swappable; the YouTube provider ships
 * first, Spotify/Local are stubs. The Zustand player store talks ONLY to an
 * AudioProvider — it never touches the IFrame API or any SDK directly.
 */
import type { AudioSource, Script } from "@/lib/catalog";

/** The minimal shape a provider needs to load + render a track in our bar. */
export interface PlayableTrack {
  id: string;
  source: AudioSource;
  /** YouTube videoId (default), Spotify uri, or local path. */
  sourceId: string;
  title: { native: string; latin: string };
  script: Script;
  cover: string;
  /** Known duration from the catalog (sec); the provider reports the real one. */
  durationSec: number | null;
  /** Pre-resolved "Artist · 1964" line for the bar. */
  artistLine: string;
}

export type PlayerEventName =
  | "ready"
  | "play"
  | "pause"
  | "ended"
  | "timeupdate"
  | "error";

export type PlayerEventHandler = (payload?: unknown) => void;

/**
 * Swappable audio backend. Mirrors brief §5; `off` is added so the store can
 * cleanly unbind, and handlers are plain callbacks driven by the backend's own
 * state/time events.
 */
export interface AudioProvider {
  load(track: PlayableTrack): Promise<void>;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  on(event: PlayerEventName, cb: PlayerEventHandler): void;
  off(event: PlayerEventName, cb: PlayerEventHandler): void;
  destroy(): void;
}

/** Tiny typed event emitter shared by providers. */
export function createEmitter() {
  const map = new Map<PlayerEventName, Set<PlayerEventHandler>>();
  return {
    on(event: PlayerEventName, cb: PlayerEventHandler) {
      const set = map.get(event) ?? new Set<PlayerEventHandler>();
      set.add(cb);
      map.set(event, set);
    },
    off(event: PlayerEventName, cb: PlayerEventHandler) {
      map.get(event)?.delete(cb);
    },
    emit(event: PlayerEventName, payload?: unknown) {
      for (const cb of map.get(event) ?? []) cb(payload);
    },
    clear() {
      map.clear();
    },
  };
}

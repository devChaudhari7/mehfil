"use client";

/*
 * MEHFIL — global player store (brief §5, §15 Phase 3).
 *
 * A module-level Zustand singleton so playback survives route changes. It holds
 * the queue + transport state and talks ONLY to an AudioProvider (never the
 * IFrame API directly). The provider lives outside React in module scope and is
 * created lazily on the first (gesture-driven) play, so nothing autoplays and
 * SSR never touches `window`.
 */
import { create } from "zustand";
import { catalogRepository, type AudioSource, type Track } from "@/lib/catalog";
import { getAudioProvider, type AudioProvider, type PlayableTrack } from "@/lib/audio";

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

interface PlayerState {
  status: PlayerStatus;
  currentTrack: Track | null;
  queue: Track[];
  index: number;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;

  setQueue: (tracks: Track[], startIndex?: number) => void;
  playQueueAt: (i: number) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
}

// --- provider lives outside React (survives re-renders + route changes) ---
let provider: AudioProvider | null = null;
let providerSource: AudioSource | null = null;
let providerFactory: (source: AudioSource) => AudioProvider = getAudioProvider;

export function artistLine(track: Track): string {
  const names = track.artists
    .map((id) => catalogRepository.getArtist(id)?.name.latin)
    .filter((n): n is string => Boolean(n));
  const who = names.join(", ");
  return who ? `${who} · ${track.year}` : String(track.year);
}

function toPlayable(track: Track): PlayableTrack {
  return {
    id: track.id,
    source: track.source,
    sourceId: track.sourceId,
    title: track.title,
    script: track.script,
    cover: track.cover,
    durationSec: track.durationSec,
    artistLine: artistLine(track),
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  function bind(p: AudioProvider): void {
    p.on("ready", () => set({ duration: p.getDuration() }));
    p.on("play", () => set({ status: "playing", error: null }));
    p.on("pause", () => set({ status: "paused" }));
    p.on("timeupdate", () => set({ currentTime: p.getCurrentTime() }));
    p.on("ended", () => {
      set({ status: "ended" });
      get().next();
    });
    p.on("error", (e) =>
      set({ status: "error", error: typeof e === "string" ? e : "playback error" }),
    );
  }

  function ensureProvider(source: AudioSource): AudioProvider {
    if (provider && providerSource === source) return provider;
    if (provider) provider.destroy();
    provider = providerFactory(source);
    providerSource = source;
    bind(provider);
    return provider;
  }

  async function loadAndPlay(track: Track): Promise<void> {
    if (typeof window === "undefined") return;
    const p = ensureProvider(track.source);
    set({
      status: "loading",
      currentTrack: track,
      currentTime: 0,
      duration: track.durationSec ?? 0,
      error: null,
    });
    p.setVolume(get().volume);
    await p.load(toPlayable(track));
    p.play();
  }

  return {
    status: "idle",
    currentTrack: null,
    queue: [],
    index: -1,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null,

    setQueue: (tracks, startIndex = 0) => set({ queue: tracks, index: startIndex }),

    playQueueAt: (i) => {
      const track = get().queue[i];
      if (!track) return;
      set({ index: i });
      void loadAndPlay(track);
    },

    playTrack: (track) => {
      const { queue } = get();
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx >= 0) set({ index: idx });
      else set({ queue: [track], index: 0 });
      void loadAndPlay(track);
    },

    togglePlay: () => {
      if (get().status === "playing") get().pause();
      else get().resume();
    },

    pause: () => provider?.pause(),

    resume: () => {
      const { currentTrack, status } = get();
      if (!currentTrack) return;
      if (status === "ended") {
        void loadAndPlay(currentTrack);
        return;
      }
      provider?.play();
    },

    next: () => {
      const { queue, index } = get();
      if (queue.length === 0) return;
      const ni = index + 1;
      if (ni >= queue.length) {
        set({ status: "ended" });
        return;
      }
      get().playQueueAt(ni);
    },

    prev: () => {
      const { queue, index, currentTime } = get();
      if (queue.length === 0) return;
      // Like a real deck: restart the track if we're >3s in, else go back one.
      if (currentTime > 3 || index <= 0) {
        get().seek(0);
        return;
      }
      get().playQueueAt(index - 1);
    },

    seek: (seconds) => {
      provider?.seek(seconds);
      set({ currentTime: seconds });
    },

    setVolume: (volume) => {
      const v = Math.min(Math.max(volume, 0), 1);
      provider?.setVolume(v);
      set({ volume: v });
    },
  };
});

/** Test-only hooks (inject a fake provider, reset module + store state). */
export const __playerTest = {
  setProviderFactory(fn: (source: AudioSource) => AudioProvider) {
    providerFactory = fn;
  },
  reset() {
    if (provider) provider.destroy();
    provider = null;
    providerSource = null;
    providerFactory = getAudioProvider;
    usePlayerStore.setState({
      status: "idle",
      currentTrack: null,
      queue: [],
      index: -1,
      currentTime: 0,
      duration: 0,
      volume: 1,
      error: null,
    });
  },
};

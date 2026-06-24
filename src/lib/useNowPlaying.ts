"use client";

/*
 * MEHFIL — Now Playing overlay state (Phase 6).
 *
 * A tiny module-level Zustand singleton so the persistent player bar (rendered in
 * the server-component World) can open the full-screen cassette deck in place,
 * while the overlay itself lives elsewhere in World. The /now-playing route renders
 * the same deck independently and doesn't touch this.
 */
import { create } from "zustand";

interface NowPlayingState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useNowPlaying = create<NowPlayingState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}));

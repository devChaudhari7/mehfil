"use client";

/*
 * MEHFIL — sound-design state (mute + gesture unlock).
 * Mirrors the persistence pattern of useReadingMode: a plain localStorage key,
 * hydrated on mount. The mute toggle controls the analog SFX layer (needle-drop
 * + crackle), honoring the brief's global mute. `unlocked` flips on the first
 * user gesture (autoplay policy) and also primes the audio context via sfx.
 */
import { create } from "zustand";
import { applyMuted, unlockAudio } from "./sfx";

export const MUTED_STORAGE_KEY = "mehfil-muted";

interface SoundState {
  muted: boolean;
  unlocked: boolean;
  hydrated: boolean;
  /** Read persisted mute from storage and apply it to the SFX layer. */
  hydrate: () => void;
  setMuted: (value: boolean) => void;
  toggleMute: () => void;
  /** Call inside the first user gesture (unlocks the SFX audio context). */
  unlock: () => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  muted: false,
  unlocked: false,
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    let muted = false;
    try {
      muted = localStorage.getItem(MUTED_STORAGE_KEY) === "1";
    } catch {
      /* storage unavailable — non-fatal */
    }
    applyMuted(muted);
    set({ muted, hydrated: true });
  },

  setMuted: (value) => {
    try {
      localStorage.setItem(MUTED_STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable — non-fatal */
    }
    applyMuted(value);
    set({ muted: value });
  },

  toggleMute: () => get().setMuted(!get().muted),

  unlock: () => {
    if (get().unlocked) return;
    unlockAudio();
    set({ unlocked: true });
  },
}));

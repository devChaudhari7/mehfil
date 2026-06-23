"use client";

/*
 * Comfortable-reading mode (brief §10/§14 — older listeners).
 * `data-reading="comfortable"` on <html> bumps the root font-size + leading
 * (globals.css); the rem-based type scale grows in lockstep.
 *
 * Persistence is a PLAIN localStorage key (not zustand/persist JSON) so the
 * pre-paint inline script in layout.tsx can read it cheaply and set the
 * attribute before first paint → no hydration flash. The DOM attribute is the
 * source of truth; the store hydrates from it on mount.
 */
import { create } from "zustand";

export type ReadingMode = "standard" | "comfortable";

export const READING_STORAGE_KEY = "mehfil-reading";

/** Inlined verbatim into <body> head-script in layout.tsx (keep in sync). */
export const READING_NO_FLASH_SCRIPT = `(function(){try{if(localStorage.getItem('${READING_STORAGE_KEY}')==='comfortable'){document.documentElement.dataset.reading='comfortable';}}catch(e){}})();`;

function applyToDom(mode: ReadingMode) {
  if (typeof document === "undefined") return;
  if (mode === "comfortable") document.documentElement.dataset.reading = "comfortable";
  else delete document.documentElement.dataset.reading;
}

interface ReadingState {
  mode: ReadingMode;
  hydrated: boolean;
  /** Sync store from the DOM attribute the no-flash script already applied. */
  hydrate: () => void;
  setMode: (mode: ReadingMode) => void;
  toggle: () => void;
}

export const useReadingMode = create<ReadingState>((set, get) => ({
  mode: "standard", // matches SSR; corrected in hydrate()
  hydrated: false,
  hydrate: () => {
    if (typeof document === "undefined") return;
    const fromDom = document.documentElement.dataset.reading;
    const mode: ReadingMode = fromDom === "comfortable" ? "comfortable" : "standard";
    set({ mode, hydrated: true });
  },
  setMode: (mode) => {
    applyToDom(mode);
    try {
      localStorage.setItem(READING_STORAGE_KEY, mode);
    } catch {
      /* storage unavailable — non-fatal */
    }
    set({ mode });
  },
  toggle: () => {
    get().setMode(get().mode === "comfortable" ? "standard" : "comfortable");
  },
}));

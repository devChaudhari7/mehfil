"use client";

/*
 * MEHFIL — era morph state machine (docs/02 "The morph state machine").
 *
 * Holds the traveled era and writes `data-era` straight onto <html> (mirrors the
 * DOM-as-source pattern of useReadingMode). The palette/grain morph is then a
 * pure CSS concern: groove.css registers @property for the era tokens + a
 * transition on <html>, so swapping data-era animates every consumer in lockstep
 * and rapid changes simply retarget (interruptible by construction).
 */
import { create } from "zustand";
import { DEFAULT_ERA, ERAS, type EraId } from "@/lib/eras";

export const ERA_ORDER: EraId[] = ERAS.map((e) => e.id);

const HOME_KEY = "mehfil:home-era";

function applyToDom(era: EraId) {
  if (typeof document !== "undefined") document.documentElement.dataset.era = era;
}

interface EraState {
  era: EraId;
  /** The user's chosen LANDING era — where the home journey begins (persisted). */
  homeEra: EraId;
  setEra: (era: EraId) => void;
  /** Pick the landing era: persist it + morph the world to it immediately. */
  setHomeEra: (era: EraId) => void;
  /** Read the persisted landing era on mount (client only). */
  loadHomeEra: () => void;
  next: () => void;
  prev: () => void;
}

export const useEraStore = create<EraState>((set, get) => ({
  era: DEFAULT_ERA, // matches the data-era SSR'd on <html> in layout.tsx → no flash
  homeEra: "50s", // default landing = the dawn of recorded sound (full journey)
  setEra: (era) => {
    applyToDom(era);
    set({ era });
  },
  setHomeEra: (era) => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(HOME_KEY, era);
      } catch {
        /* storage unavailable — non-fatal */
      }
    }
    applyToDom(era);
    set({ homeEra: era, era });
  },
  loadHomeEra: () => {
    if (typeof localStorage === "undefined") return;
    let v: string | null = null;
    try {
      v = localStorage.getItem(HOME_KEY);
    } catch {
      /* non-fatal */
    }
    if (v && (ERA_ORDER as string[]).includes(v)) set({ homeEra: v as EraId });
  },
  next: () => {
    const i = ERA_ORDER.indexOf(get().era);
    get().setEra(ERA_ORDER[Math.min(i + 1, ERA_ORDER.length - 1)] as EraId);
  },
  prev: () => {
    const i = ERA_ORDER.indexOf(get().era);
    get().setEra(ERA_ORDER[Math.max(i - 1, 0)] as EraId);
  },
}));

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

function applyToDom(era: EraId) {
  if (typeof document !== "undefined") document.documentElement.dataset.era = era;
}

interface EraState {
  era: EraId;
  setEra: (era: EraId) => void;
  next: () => void;
  prev: () => void;
}

export const useEraStore = create<EraState>((set, get) => ({
  era: DEFAULT_ERA, // matches the data-era SSR'd on <html> in layout.tsx → no flash
  setEra: (era) => {
    applyToDom(era);
    set({ era });
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

"use client";

/*
 * MEHFIL — ⌘K command palette open-state (Phase 7). A module-level Zustand
 * singleton so the always-mounted SearchPalette (in World, a server component) can
 * be toggled from anywhere by the global keyboard shortcut. Mirrors useNowPlaying.
 */
import { create } from "zustand";

interface CommandMenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandMenu = create<CommandMenuState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}));

"use client";

/*
 * NowPlayingOverlay — the in-place full-screen cassette deck (Phase 6). Mounted
 * once in World; opened from the player bar via useNowPlaying. A proper modal:
 * role="dialog" aria-modal, Escape to close, body-scroll lock, initial focus +
 * focus restore, and a simple Tab focus-trap. Close is via the deck's X or Escape
 * (no backdrop-click, keeping it keyboard-first and lint-clean).
 */
import { useEffect, useRef } from "react";
import { useNowPlaying } from "@/lib/useNowPlaying";
import { playCassetteClunk } from "@/lib/sound/sfx";
import { NowPlayingDeck } from "./NowPlayingDeck";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function NowPlayingOverlay() {
  const open = useNowPlaying((s) => s.open);
  const setOpen = useNowPlaying((s) => s.setOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    playCassetteClunk(); // mechanical cassette-door clunk on open (self-gates on mute)
    restoreRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Now playing" className="fixed inset-0 z-[60]">
      <div aria-hidden="true" className="absolute inset-0 bg-[#050507]/80 backdrop-blur-md" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="surface-stage absolute inset-0 overflow-auto outline-none"
      >
        <NowPlayingDeck onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}

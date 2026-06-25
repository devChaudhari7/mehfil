"use client";

/*
 * SearchPalette — the global ⌘K search overlay (Phase 7). Always mounted (in World)
 * so its keyboard listener can open it from any route: ⌘K / Ctrl+K toggles, "/"
 * opens (unless you're typing in a field). When open it's a proper modal — role
 * dialog, Escape to close, body-scroll lock, focus-trap + restore (per
 * NowPlayingOverlay) — wrapping the shared SearchBox, which closes on a selection.
 */
import { useEffect, useRef } from "react";
import { useCommandMenu } from "@/lib/useCommandMenu";
import { SearchBox } from "./SearchBox";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

export function SearchPalette() {
  const open = useCommandMenu((s) => s.open);
  const setOpen = useCommandMenu((s) => s.setOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Global open shortcut — always listening, even when closed.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useCommandMenu.getState().toggle();
      } else if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        useCommandMenu.getState().setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // When open: Escape, Tab focus-trap, body lock, focus restore.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[70] flex justify-center p-4 pt-[12vh]"
    >
      {/* click-outside to close (real button, kept out of the tab order) */}
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-[#050507]/80 backdrop-blur-md"
      />
      <div
        ref={panelRef}
        className="surface-stage overlay-in relative z-10 max-h-[76vh] w-full max-w-xl overflow-auto rounded-2xl border border-white/10 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <SearchBox autoFocus onSelect={() => setOpen(false)} />
        <p className="text-ink/40 mt-4 text-right font-mono text-[10px] tracking-[0.16em] uppercase">
          Esc to close
        </p>
      </div>
    </div>
  );
}

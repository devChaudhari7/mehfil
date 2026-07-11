"use client";

/*
 * PointerRoot — the one pointer engine (Phase 15 foundations).
 *
 * A single rAF-coalesced tracker that:
 *   1. lerps the pointer and writes `--mx/--my` (px) + `--mxn/--myn` (0..1) on <html>,
 *      which the DOM pointer-lamp and the CSS sheen fallbacks read;
 *   2. keeps the `pointerState` singleton fresh for the needle cursor + GrooveGL;
 *   3. drives the MAGNETIC CTAs — any `[data-magnet]` element inside the pull radius
 *      is drawn ≤7px toward the hand via the independent CSS `translate` property
 *      (never fights the element's own `transform` press states), springing back on exit.
 *
 * Gates: fine pointer + motion allowed, else renders nothing and adds no classes.
 * The rAF self-suspends after 3s of stillness and resumes on the next movement.
 */
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { lerp, pointerState } from "@/lib/pointer";

const MAGNET_RADIUS = 90; // px beyond the element's own half-diagonal
const MAGNET_PULL = 7; // max displacement px
const IDLE_MS = 3000;

export function PointerRoot() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("fine-cursor", "has-pointer-fx");
    pointerState.active = true;

    let raf = 0;
    let magnets: HTMLElement[] = [];
    let magnetsAt = 0;
    const eased = new Map<HTMLElement, { tx: number; ty: number }>();

    const onMove = (e: PointerEvent) => {
      pointerState.x = e.clientX;
      pointerState.y = e.clientY;
      pointerState.lastMove = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onDown = () => {
      pointerState.down = true;
    };
    const onUp = () => {
      pointerState.down = false;
    };

    const tick = () => {
      raf = 0;
      const now = performance.now();
      const s = pointerState;
      s.sx = lerp(s.sx < -500 ? s.x : s.sx, s.x, 0.16);
      s.sy = lerp(s.sy < -500 ? s.y : s.sy, s.y, 0.16);

      root.style.setProperty("--mx", `${s.sx.toFixed(1)}px`);
      root.style.setProperty("--my", `${s.sy.toFixed(1)}px`);
      root.style.setProperty("--mxn", (s.sx / window.innerWidth).toFixed(4));
      root.style.setProperty("--myn", (s.sy / window.innerHeight).toFixed(4));

      // refresh the magnet list at most 4×/s (cheap; the pull math runs per frame)
      if (now - magnetsAt > 250) {
        magnetsAt = now;
        magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnet]"));
      }
      let settled = Math.abs(s.sx - s.x) < 0.3 && Math.abs(s.sy - s.y) < 0.3;
      for (const el of magnets) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = s.x - cx;
        const dy = s.y - cy;
        const reach = Math.max(r.width, r.height) / 2 + MAGNET_RADIUS;
        const dist = Math.hypot(dx, dy);
        const state = eased.get(el) ?? { tx: 0, ty: 0 };
        const pull = dist < reach ? (1 - dist / reach) * MAGNET_PULL : 0;
        const gx = dist > 0 ? (dx / dist) * pull : 0;
        const gy = dist > 0 ? (dy / dist) * pull : 0;
        state.tx = lerp(state.tx, gx, 0.2);
        state.ty = lerp(state.ty, gy, 0.2);
        eased.set(el, state);
        if (Math.abs(state.tx) < 0.05 && Math.abs(state.ty) < 0.05 && pull === 0) {
          if (el.style.translate) el.style.translate = "";
        } else {
          el.style.translate = `${state.tx.toFixed(2)}px ${state.ty.toFixed(2)}px`;
          settled = false;
        }
      }

      // keep running while moving or unsettled; sleep when idle (resumes on move)
      if (!settled || now - s.lastMove < IDLE_MS) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      if (raf) cancelAnimationFrame(raf);
      for (const el of eased.keys()) el.style.translate = "";
      root.classList.remove("fine-cursor", "has-pointer-fx");
      root.style.removeProperty("--mx");
      root.style.removeProperty("--my");
      root.style.removeProperty("--mxn");
      root.style.removeProperty("--myn");
      pointerState.active = false;
    };
  }, [reduced]);

  // The DOM pointer-lamp: a soft era-glow that follows the hand (screen-blended).
  // GrooveGL supersedes it visually where available; this is the universal floor.
  return <div className="pointer-lamp" aria-hidden="true" />;
}

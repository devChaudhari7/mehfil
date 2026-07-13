"use client";

/*
 * PointerRoot — the one pointer engine (Phase 20 revision: NO drawn cursor).
 *
 * The native arrow stays — a fake cursor is always a frame late and reads as lag.
 * Presence is expressed by the WORLD reacting instead. One rAF-coalesced tracker:
 *   1. lerps the pointer and writes `--mx/--my` (px) + `--mxn/--myn` (0..1) on
 *      <html> — the lamp and CSS sheens read these;
 *   2. keeps the `pointerState` singleton fresh for GrooveGL (the light + wake);
 *   3. MAGNETS — `[data-magnet]` elements are drawn ≤7px toward the hand via the
 *      independent CSS `translate` property, springing back on exit;
 *   4. TILT — `[data-tilt]` surfaces lean toward the hand (≤5°) while it hovers
 *      within them, via `--tilt-x/--tilt-y` vars each surface folds into its own
 *      transform (so nothing fights an element's existing transforms).
 *
 * Gates: fine pointer + motion allowed, else renders only the (inert) lamp.
 * The rAF self-suspends after 3s of stillness and resumes on the next movement.
 */
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { lerp, pointerState } from "@/lib/pointer";

const MAGNET_RADIUS = 90; // px beyond the element's own half-diagonal
const MAGNET_PULL = 7; // max displacement px
const TILT_MAX = 5; // deg
const TILT_MARGIN = 28; // px of grace around a tilt surface
const IDLE_MS = 3000;

export function PointerRoot() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("has-pointer-fx");
    pointerState.active = true;

    let raf = 0;
    let magnets: HTMLElement[] = [];
    let tilts: HTMLElement[] = [];
    let scanAt = 0;
    const eased = new Map<HTMLElement, { tx: number; ty: number }>();
    const tilted = new Map<HTMLElement, { rx: number; ry: number }>();

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

      // refresh the interactive-surface lists at most 4×/s
      if (now - scanAt > 250) {
        scanAt = now;
        magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnet]"));
        tilts = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
      }

      let settled = Math.abs(s.sx - s.x) < 0.3 && Math.abs(s.sy - s.y) < 0.3;

      for (const el of magnets) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const dx = s.x - (r.left + r.width / 2);
        const dy = s.y - (r.top + r.height / 2);
        const reach = Math.max(r.width, r.height) / 2 + MAGNET_RADIUS;
        const dist = Math.hypot(dx, dy);
        const state = eased.get(el) ?? { tx: 0, ty: 0 };
        const pull = dist < reach ? (1 - dist / reach) * MAGNET_PULL : 0;
        state.tx = lerp(state.tx, dist > 0 ? (dx / dist) * pull : 0, 0.2);
        state.ty = lerp(state.ty, dist > 0 ? (dy / dist) * pull : 0, 0.2);
        eased.set(el, state);
        if (Math.abs(state.tx) < 0.05 && Math.abs(state.ty) < 0.05 && pull === 0) {
          if (el.style.translate) el.style.translate = "";
        } else {
          el.style.translate = `${state.tx.toFixed(2)}px ${state.ty.toFixed(2)}px`;
          settled = false;
        }
      }

      for (const el of tilts) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const inside =
          s.x > r.left - TILT_MARGIN &&
          s.x < r.right + TILT_MARGIN &&
          s.y > r.top - TILT_MARGIN &&
          s.y < r.bottom + TILT_MARGIN;
        // lean toward the hand: pointer right of center → the surface turns right
        const gx = inside ? ((s.x - (r.left + r.width / 2)) / r.width) * 2 * TILT_MAX : 0;
        const gy = inside ? (-(s.y - (r.top + r.height / 2)) / r.height) * 2 * TILT_MAX : 0;
        const st = tilted.get(el) ?? { rx: 0, ry: 0 };
        st.ry = lerp(st.ry, Math.max(-TILT_MAX, Math.min(gx, TILT_MAX)), 0.14);
        st.rx = lerp(st.rx, Math.max(-TILT_MAX, Math.min(gy, TILT_MAX)), 0.14);
        tilted.set(el, st);
        if (!inside && Math.abs(st.rx) < 0.03 && Math.abs(st.ry) < 0.03) {
          if (el.style.getPropertyValue("--tilt-x")) {
            el.style.removeProperty("--tilt-x");
            el.style.removeProperty("--tilt-y");
          }
        } else {
          el.style.setProperty("--tilt-x", `${st.rx.toFixed(2)}deg`);
          el.style.setProperty("--tilt-y", `${st.ry.toFixed(2)}deg`);
          settled = false;
        }
      }

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
      for (const el of tilted.keys()) {
        el.style.removeProperty("--tilt-x");
        el.style.removeProperty("--tilt-y");
      }
      root.classList.remove("has-pointer-fx");
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

"use client";

/*
 * NeedleCursor — the stylus (Phase 15 foundations).
 *
 * A two-part custom cursor: a solid stylus dot that tracks tightly, and a lagging
 * ring that trails with the weight of a tonearm. Over anything interactive the ring
 * blooms and tints accent; while pressed the dot compresses (the needle touching
 * the groove). Purely decorative — native focus, keyboard, and hit-testing are
 * untouched — and it only exists on fine pointers with motion allowed (PointerRoot
 * adds `html.fine-cursor`, which also hides the native arrow).
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { lerp, pointerState } from "@/lib/pointer";

const INTERACTIVE = "a,button,[role='button'],input,textarea,select,summary,[data-magnet]";

export function NeedleCursor() {
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let raf = 0;
    let rx = -1000;
    let ry = -1000;
    let shown = false;
    let hovering = false;

    const tick = () => {
      const s = pointerState;
      if (s.x > -500 && !shown) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        rx = s.x;
        ry = s.y;
      }
      // dot rides tight; the ring trails like a tonearm
      dot.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%,-50%) scale(${s.down ? 0.6 : 1})`;
      rx = lerp(rx, s.x, 0.18);
      ry = lerp(ry, s.y, 0.18);
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) translate(-50%,-50%) scale(${hovering ? 1.7 : 1})`;
      raf = requestAnimationFrame(tick);
    };

    const onOver = (e: PointerEvent) => {
      hovering = Boolean((e.target as Element | null)?.closest?.(INTERACTIVE));
      ring.dataset.hover = hovering ? "1" : "";
    };
    const onLeaveWindow = () => {
      shown = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnterWindow = () => {
      if (pointerState.x > -500) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };

    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    document.documentElement.addEventListener("pointerenter", onEnterWindow);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      document.documentElement.removeEventListener("pointerenter", onEnterWindow);
    };
  }, [reduced]);

  return (
    <>
      <div ref={dotRef} aria-hidden="true" className="needle-cursor-dot" />
      <div ref={ringRef} aria-hidden="true" className="needle-cursor-ring" />
    </>
  );
}

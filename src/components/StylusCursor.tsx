"use client";

/*
 * StylusCursor — the cursor IS the stylus (Phase 23).
 *
 * In this world the thing that points at music is a cartridge needle, so that's
 * what you hold. A physical object, not a puppet:
 *   · sits EXACTLY on the pointer every frame (no positional easing — zero lag);
 *   · ROTATES to face its direction of travel and banks into turns, settling
 *     back to the resting angle when you stop (only rotation is smoothed);
 *   · TOUCHES DOWN over anything playable — dips onto the surface, a soft
 *     contact shadow appears beneath (plus the quiet stylus tick);
 *   · TREMBLES at the playing track's tempo — a needle reading a groove;
 *   · dips harder on press.
 *
 * One fixed element + one rAF that suspends when idle and level. Fine pointers
 * with motion allowed only; everywhere else the native cursor stands untouched.
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { playHoverTick } from "@/lib/sound/sfx";

const INTERACTIVE = "a,button,[role='button'],input[type='range'],summary,[data-magnet]";
const REST_DEG = -128; // resting nose direction ≈ a native arrow's up-left
const BPM = { slow: 72, mid: 96, fast: 126 } as const;

export function StylusCursor() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    const rootEl = rootRef.current;
    const body = bodyRef.current;
    if (!rootEl || !body) return;

    document.documentElement.classList.add("stylus-live");

    let raf = 0;
    let x = -100;
    let y = -100;
    let px = -100;
    let py = -100;
    let deg = REST_DEG;
    let shown = false;
    let overPlayable = false;
    let down = false;
    let lastMove = 0;

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      lastMove = performance.now();
      if (!shown) {
        shown = true;
        rootEl.style.opacity = "1";
      }
      wake();
    };
    const onDown = () => {
      down = true;
      wake();
    };
    const onUp = () => {
      down = false;
      wake();
    };
    const onOver = (e: PointerEvent) => {
      const was = overPlayable;
      overPlayable = Boolean((e.target as Element | null)?.closest?.(INTERACTIVE));
      if (overPlayable && !was) playHoverTick();
      rootEl.dataset.landed = overPlayable ? "1" : "";
      wake();
    };
    const onLeaveDoc = () => {
      shown = false;
      rootEl.style.opacity = "0";
    };

    const tick = () => {
      raf = 0;
      const now = performance.now();
      const dx = x - px;
      const dy = y - py;
      px = x;
      py = y;
      const speed = Math.hypot(dx, dy);

      // the nose follows the flight path; at rest it eases home like a parked arm
      const idle = now - lastMove > 140;
      const target = !idle && speed > 2 ? (Math.atan2(dy, dx) * 180) / Math.PI : REST_DEG;
      const delta = ((target - deg + 540) % 360) - 180; // shortest way around
      deg += delta * (idle ? 0.08 : 0.22);

      // a needle reading a groove: sub-pixel tremble at the track's tempo
      let tremX = 0;
      let tremY = 0;
      const ps = usePlayerStore.getState();
      if (ps.status === "playing" && ps.currentTrack) {
        const bpm = BPM[ps.currentTrack.tempoBucket] ?? 96;
        const ph = (2 * Math.PI * now * bpm) / 60000;
        tremX = Math.sin(ph * 7.3) * 0.5;
        tremY = Math.cos(ph * 5.1) * 0.5;
      }

      const dip = down ? 0.72 : overPlayable ? 0.86 : 1;
      rootEl.style.transform = `translate3d(${(x + tremX).toFixed(2)}px, ${(y + tremY).toFixed(2)}px, 0)`;
      body.style.transform = `rotate(${deg.toFixed(2)}deg) scale(${dip})`;

      const settled = idle && Math.abs(delta) < 0.4 && tremX === 0;
      if (!settled) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveDoc);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove("stylus-live");
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <div ref={rootRef} aria-hidden="true" className="stylus-cursor">
      {/* contact shadow — appears when the needle lands on something playable */}
      <span className="stylus-cursor__contact" />
      <div ref={bodyRef} className="stylus-cursor__body">
        {/* the cartridge: body + nose + diamond tip (nose points +x, rotated by JS) */}
        <svg width="34" height="16" viewBox="0 0 34 16">
          <rect x="1" y="3" width="17" height="10" rx="3" fill="var(--ink)" opacity="0.92" />
          <rect x="4" y="5.5" width="9" height="5" rx="1.5" fill="var(--s2)" opacity="0.85" />
          <path d="M18 4 L28 6.6 L28 9.4 L18 12 Z" fill="var(--ink)" opacity="0.75" />
          <circle cx="30.5" cy="8" r="2.6" fill="var(--glow)" />
          <circle cx="30.5" cy="8" r="1" fill="#fff" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

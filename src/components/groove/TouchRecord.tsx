"use client";

/*
 * TouchRecord — the living record (Phase 15.5).
 *
 * Wraps the hero medium and makes the disc a physical object: grab it and SPIN —
 * real angular momentum, it coasts and the motor re-engages; scratch against the
 * motor and you hear it (band-passed noise via sfx), the needle lifting with the
 * violence of the scratch (`--scratch` cascades to the needle's lift).
 *
 * Mechanics: pointer capture + atan2 around the disc center; the rAF integrator
 * (src/lib/turntable.ts) owns rotation and writes an inline transform onto the
 * [data-tt-disc] layers (their CSS spin is disabled while physics is active, so
 * nothing fights). A tap (<6px, <300ms) still falls through to the wrapping
 * anchor's click — drags swallow it. Cassette era or reduced motion: inert
 * passthrough (a cassette body must not rotate). touch-action keeps vertical
 * page scroll native on phones; sideways drags spin.
 */
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import type { Medium } from "@/lib/eras";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { setScratchIntensity } from "@/lib/sound/sfx";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import {
  beginDrag,
  createTurntable,
  dragTo,
  endDrag,
  motorDegPerSec,
  scratchIntensity,
  stepTurntable,
} from "@/lib/turntable";

export function TouchRecord({
  medium,
  spinning,
  children,
}: {
  medium: Medium;
  /** Whether the platter motor should run (the hero idles true). */
  spinning: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const isDisc = medium !== "cassette";

  useEffect(() => {
    if (reduced || !isDisc) return;
    const root = rootRef.current;
    if (!root) return;
    const discs = Array.from(root.querySelectorAll<HTMLElement>("[data-tt-disc]"));
    if (discs.length === 0) return;

    const t = createTurntable(spinning ? motorDegPerSec(medium) : 0);
    let raf = 0;
    let last = performance.now();
    let lastDrag = 0;
    let downX = 0;
    let downY = 0;
    let downAt = 0;
    let grabOffset = 0;

    const angleOf = (e: PointerEvent): number => {
      const r = root.getBoundingClientRect();
      return (
        (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) *
          180) /
        Math.PI
      );
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = now - last;
      last = now;
      stepTurntable(t, dt);
      const rot = `rotate(${t.angle.toFixed(2)}deg)`;
      for (const d of discs) d.style.transform = rot;
      const s = scratchIntensity(t);
      root.style.setProperty("--scratch", s.toFixed(3));
      setScratchIntensity(s);
    };

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      useSoundStore.getState().unlock(); // the grab is a gesture — arm the audio
      root.setPointerCapture(e.pointerId);
      downX = e.clientX;
      downY = e.clientY;
      downAt = performance.now();
      lastDrag = downAt;
      grabOffset = angleOf(e) - t.angle;
      beginDrag(t);
    };
    const onMove = (e: PointerEvent) => {
      if (t.mode !== "drag" || !e.isPrimary) return;
      const now = performance.now();
      dragTo(t, angleOf(e) - grabOffset, now - lastDrag);
      lastDrag = now;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) draggedRef.current = true;
    };
    const onUp = (e: PointerEvent) => {
      if (t.mode !== "drag" || !e.isPrimary) return;
      endDrag(t);
      if (performance.now() - downAt >= 300) draggedRef.current = true;
      try {
        root.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      for (const d of discs) d.style.transform = "";
      root.style.removeProperty("--scratch");
      setScratchIntensity(0);
    };
  }, [reduced, isDisc, medium, spinning]);

  // A real drag must not fire the wrapping anchor's navigation.
  const onClickCapture = (e: MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  return (
    <div
      ref={rootRef}
      onClickCapture={onClickCapture}
      className="touch-record"
      style={{ touchAction: "pan-y" }}
    >
      {children}
    </div>
  );
}

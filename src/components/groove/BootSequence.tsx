"use client";

/*
 * BootSequence — the analog power-on (Phase 15.8).
 *
 * First arrival each session: the stage warms up like a valve amplifier — a glow
 * blooms out of black, MEHFIL resolves letter by letter through a blur, a filament
 * line sweeps beneath — then the cover lifts into the live hero. Pure-CSS
 * choreography that starts on first paint (no hydration wait); JS only skips
 * (any input), schedules the exit, and remembers the session.
 *
 * Etiquette: silent (nothing may sound before a gesture); reduced-motion never
 * sees it (display:none via media query — the page is simply there); no-JS hides
 * it via <noscript>; repeat visits this session unmount it immediately. The big
 * MEHFIL is real text (a legitimate LCP), so the cover never hurts load metrics.
 */
import { useEffect, useRef, useState } from "react";

const KEY = "mehfil:booted";
const RUN_MS = 1500;
const LEAVE_MS = 600;

export function BootSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let booted = false;
    try {
      booted = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (booted) {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* non-fatal */
    }

    let leaveTimer = 0;
    const finish = () => {
      el.dataset.leave = "1";
      leaveTimer = window.setTimeout(() => setGone(true), LEAVE_MS);
      teardown();
    };
    const runTimer = window.setTimeout(finish, RUN_MS);
    const skip = () => {
      window.clearTimeout(runTimer);
      finish();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, skip, { once: true, passive: true });
    const teardown = () => {
      for (const e of events) window.removeEventListener(e, skip);
    };
    return () => {
      window.clearTimeout(runTimer);
      window.clearTimeout(leaveTimer);
      teardown();
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={ref} className="boot-seq" aria-hidden="true">
      <noscript>
        <style>{`.boot-seq{display:none}`}</style>
      </noscript>
      <div className="boot-seq__glow" />
      <div className="boot-seq__word">
        {"MEHFIL".split("").map((ch, i) => (
          <span key={i} style={{ animationDelay: `${0.3 + i * 0.11}s` }}>
            {ch}
          </span>
        ))}
      </div>
      <div className="boot-seq__line" />
    </div>
  );
}

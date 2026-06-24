"use client";

/*
 * EraTimeline — the visible groove control (docs/02). Five era nodes the user
 * taps or arrow-keys through; the active node is the needle's era. Implemented as
 * an accessible radiogroup (roving tabindex, arrow/Home/End keys) with visible
 * focus and an aria-live announcement, mirroring the keyboard model of Dial.
 */
import { useRef, type KeyboardEvent } from "react";
import { getEra } from "@/lib/eras";
import { ERA_ORDER, useEraStore } from "@/lib/useEraStore";
import { cx } from "@/lib/cx";

export function EraTimeline({ className }: { className?: string }) {
  const era = useEraStore((s) => s.era);
  const setEra = useEraStore((s) => s.setEra);
  const activeIndex = ERA_ORDER.indexOf(era);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusEra(i: number) {
    const clamped = Math.min(Math.max(i, 0), ERA_ORDER.length - 1);
    setEra(ERA_ORDER[clamped]!);
    refs.current[clamped]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") focusEra(activeIndex + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") focusEra(activeIndex - 1);
    else if (e.key === "Home") focusEra(0);
    else if (e.key === "End") focusEra(ERA_ORDER.length - 1);
    else return;
    e.preventDefault();
  }

  const active = getEra(era);

  return (
    <div className={cx("flex flex-col items-center gap-3", className)}>
      <div
        role="radiogroup"
        aria-label="Travel the eras"
        onKeyDown={onKeyDown}
        className="flex items-center gap-2 sm:gap-3"
      >
        {ERA_ORDER.map((id, i) => {
          const selected = i === activeIndex;
          return (
            <button
              key={id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={selected}
              aria-label={getEra(id).decade}
              tabIndex={selected ? 0 : -1}
              onClick={() => setEra(id)}
              className={cx(
                "cursor-pointer rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] transition-[background-color,color,transform] duration-200 ease-[var(--ease-analog)] sm:text-xs",
                selected
                  ? "bg-btn text-btn-ink scale-105"
                  : "text-ink/55 hover:text-ink hover:bg-white/5",
              )}
            >
              {getEra(id).decade}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="text-ink/60 font-mono text-[10px] tracking-[0.2em] uppercase">
        {active.mediumLabel} · {active.rpm} · {active.soundTexture}
      </p>
    </div>
  );
}

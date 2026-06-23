"use client";

import type { KeyboardEvent } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

/*
 * Dial — a radio-tuner knob. Presentational + accessible: a real slider
 * (role="slider", arrow/Home/End keys, on-brand focus ring) with station ticks
 * and a pointer that rotates to the active position. NO era state machine — it
 * just reports `onChange`; the Phase 5 era-dial wires it to the catalog.
 *
 * The pointer's rotation transition is gated by useReducedMotion.
 */

const ARC = 240; // total sweep in degrees
const START = -ARC / 2;

export interface DialProps {
  value: number;
  positions: number;
  labels?: string[];
  onChange?: (value: number) => void;
  size?: number;
  ariaLabel?: string;
  className?: string;
}

export function Dial({
  value,
  positions,
  labels,
  onChange,
  size = 200,
  ariaLabel = "Tuner dial",
  className,
}: DialProps) {
  const reduced = useReducedMotion();
  const max = Math.max(positions - 1, 1);
  const angleFor = (i: number) => START + (i / max) * ARC;
  const radius = size / 2 - 14;
  const clamp = (v: number) => Math.min(Math.max(v, 0), positions - 1);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!onChange) return;
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clamp(value + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clamp(value - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = positions - 1;
    else return;
    e.preventDefault();
    if (next !== value) onChange(next);
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={positions - 1}
      aria-valuenow={value}
      aria-valuetext={labels?.[value]}
      onKeyDown={onKeyDown}
      className={cx("relative grid place-items-center rounded-full", className)}
      style={{ width: size, height: size }}
    >
      {/* knob face */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-white/10 bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_2px_6px_rgba(255,255,255,0.06)]"
      />

      {/* station ticks */}
      {Array.from({ length: positions }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute top-1/2 left-1/2"
          style={{ transform: `rotate(${angleFor(i)}deg)` }}
        >
          <span
            className={cx(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
              i === value
                ? "bg-glow"
                : "bg-[color-mix(in_srgb,var(--ink)_45%,transparent)]",
            )}
            style={{
              top: -radius,
              width: i === value ? 7 : 4,
              height: i === value ? 7 : 4,
              boxShadow: i === value ? "0 0 10px var(--glow)" : undefined,
            }}
          />
        </span>
      ))}

      {/* pointer */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2"
        style={{
          transform: `rotate(${angleFor(value)}deg)`,
          transition: reduced ? undefined : "transform 0.5s var(--ease-analog)",
        }}
      >
        <span
          className="bg-glow absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: 3, height: radius - 2, boxShadow: "0 0 10px var(--glow)" }}
        />
      </span>

      {/* hub */}
      <span
        aria-hidden="true"
        className="absolute h-4 w-4 rounded-full bg-[color-mix(in_srgb,var(--ink)_30%,transparent)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
      />
    </div>
  );
}

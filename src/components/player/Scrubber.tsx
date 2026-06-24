"use client";

/*
 * Scrubber — the transport seek control. A real <input type="range"> for free
 * keyboard + ARIA support; styled as a thin progress/tonearm track with the era
 * --glow accent. No motion required, so it's reduced-motion safe by default.
 */
import { cx } from "@/lib/cx";

export interface ScrubberProps {
  /** Current time in seconds. */
  value: number;
  /** Duration in seconds. */
  max: number;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Scrubber({ value, max, onSeek, disabled, className }: ScrubberProps) {
  const safeMax = max > 0 ? max : 0;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const pct = safeMax > 0 ? (clamped / safeMax) * 100 : 0;

  return (
    <input
      type="range"
      min={0}
      max={safeMax || 0.0001}
      step={0.1}
      value={clamped}
      onChange={(e) => onSeek(Number(e.target.value))}
      disabled={disabled || safeMax === 0}
      aria-label="Seek"
      aria-valuetext={`${Math.floor(clamped)} of ${Math.floor(safeMax)} seconds`}
      className={cx(
        "h-1.5 w-full cursor-pointer appearance-none rounded-full",
        "accent-[var(--glow)] disabled:cursor-default disabled:opacity-40",
        className,
      )}
      style={{
        background: `linear-gradient(to right, var(--glow) ${pct}%, rgba(255,255,255,0.16) ${pct}%)`,
      }}
    />
  );
}

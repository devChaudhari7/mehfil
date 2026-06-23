import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "@/lib/cx";

/*
 * Button — mechanical, weighty press (switch / cassette-door throw). Visual
 * only; SFX is Phase 3. Themes purely through tokens, so it re-skins per
 * [data-era] and on .surface-paper.
 *
 *   solid  — era accent fill (bg-btn / text-btn-ink), AA-verified per era.
 *   raised — dark tactile panel (text-ink), optional accent LED.
 *   ghost  — transparent, accent on hover.
 *
 * Press = translate down + collapse the bottom "edge" shadow (a thrown switch).
 * Reduced motion: the transition collapses via the global CSS block; the state
 * change still reads instantly. Focus ring comes from the global :focus-visible.
 */

type Variant = "solid" | "raised" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-md font-body font-medium " +
  "transition-[transform,box-shadow,background-color,color,filter] duration-150 ease-[var(--ease-analog)] " +
  "cursor-pointer disabled:pointer-events-none disabled:opacity-50";

const SIZES: Record<Size, string> = {
  sm: "text-caption px-3 py-1.5",
  md: "text-small px-4 py-2.5",
  lg: "text-body px-6 py-3",
};

const VARIANTS: Record<Variant, string> = {
  solid: cx(
    "bg-btn text-btn-ink",
    "shadow-[0_3px_0_rgba(0,0,0,0.35),0_5px_12px_rgba(0,0,0,0.3)]",
    "hover:brightness-110",
    "active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.35)]",
  ),
  raised: cx(
    "text-ink border border-white/10",
    "bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]",
    "shadow-[0_3px_0_rgba(0,0,0,0.4),0_6px_14px_rgba(0,0,0,0.35)]",
    "hover:bg-[color-mix(in_srgb,var(--ink)_15%,transparent)]",
    "active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.4)]",
  ),
  ghost: cx(
    "text-ink bg-transparent",
    "hover:bg-white/5 hover:text-accent",
    "active:translate-y-[1px]",
  ),
};

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  /** Small accent LED before the label (most at home on `raised`). */
  led?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "raised",
  size = "md",
  led = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(BASE, SIZES[size], VARIANTS[variant], className)}
      {...rest}
    >
      {led && (
        <span
          aria-hidden="true"
          className="bg-glow h-1.5 w-1.5 rounded-full"
          style={{ boxShadow: "0 0 8px var(--glow)" }}
        />
      )}
      {children}
    </button>
  );
}

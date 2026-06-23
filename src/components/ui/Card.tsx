import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "@/lib/cx";

/*
 * Card — content container in one of two analog materials:
 *   stage — translucent dark glass over the era stage (text-ink stays light).
 *   paper — cardboard sleeve material (.surface-paper flips text to dark ink
 *           + accent-paper automatically, so contents are AA-safe on light).
 * Compose Heading/Body/etc. inside.
 */

type Surface = "stage" | "paper";

const SURFACE: Record<Surface, string> = {
  stage: cx(
    "border border-white/10 text-ink backdrop-blur-sm",
    "bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]",
    "shadow-[0_12px_34px_rgba(0,0,0,0.35)]",
  ),
  paper: "surface-paper border border-black/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]",
};

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  surface?: Surface;
  children: ReactNode;
}

export function Card({ surface = "stage", className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[20px] p-6",
        SURFACE[surface],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

import { createElement } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";

/*
 * Typography primitives — the type scale (art-direction §3).
 *   Display / Heading → Marcellus (font-display)
 *   Body              → Familjen Grotesk (font-body)
 *   Mono              → Space Mono (font-mono): tape counter, RPM, timestamps, labels
 *
 * All theme via tokens (text-ink), so they react to [data-era] and flip dark
 * inside .surface-paper. Sizes are rem-based → scale with comfortable-reading.
 */

type DivProps = ComponentPropsWithoutRef<"div">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type SpanProps = ComponentPropsWithoutRef<"span">;

export function Display({
  className,
  children,
  ...rest
}: DivProps & { children: ReactNode }) {
  return (
    <div
      className={cx("font-display text-display text-ink tracking-tight", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

const HEADING_SIZE = {
  1: "text-h1",
  2: "text-h2",
  3: "text-h3",
} as const;

export function Heading({
  level = 2,
  className,
  children,
  ...rest
}: {
  level?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"h2">, "className" | "children">) {
  // createElement (not <Tag/>) avoids the dynamic-ElementType children inference
  // that @react-three/fiber's JSX.IntrinsicElements augmentation collapses to never.
  const Tag = `h${level}` as ElementType;
  return createElement(
    Tag,
    { className: cx("font-display text-ink", HEADING_SIZE[level], className), ...rest },
    children,
  );
}

export function Body({
  className,
  children,
  ...rest
}: ParagraphProps & { children: ReactNode }) {
  return (
    <p className={cx("font-body text-body text-ink", className)} {...rest}>
      {children}
    </p>
  );
}

export function Mono({
  uppercase = true,
  className,
  children,
  ...rest
}: SpanProps & { uppercase?: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "text-caption text-ink font-mono tracking-[0.14em]",
        uppercase && "uppercase",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

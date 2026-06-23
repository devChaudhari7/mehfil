import { cx } from "@/lib/cx";

/*
 * Texture / surface-treatment layers, formalized as reusable components over the
 * CSS classes in surfaces.css + globals.css. All decorative + aria-hidden; pure
 * decoration so they sit outside WCAG text-contrast rules.
 */

/** Halftone dot divider strip. Inherits the era ink via currentColor. */
export function Halftone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("tex-halftone text-ink h-6 w-full", className)}
    />
  );
}

/** Paper-fiber overlay. Place inside a `relative` container. */
export function PaperTexture({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "tex-paper pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply",
        className,
      )}
    />
  );
}

/** Warm vignette, scoped to a `relative` parent (the global one lives in World). */
export function Vignette({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0", className)}
      style={{ background: "var(--vignette)" }}
    />
  );
}

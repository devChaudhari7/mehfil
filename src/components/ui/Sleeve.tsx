import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/*
 * Sleeve — an album-sleeve cardboard jacket (paper/cardboard material from the
 * tokens). Presentational only; the "slide the record out" interaction is
 * Phase 5. Compose a <Vinyl> behind it to show a record peeking out.
 *
 * Front art goes in `children`; `spine` adds the classic left bound edge;
 * `hole` adds a die-cut showing the label/spindle through the jacket.
 */
export interface SleeveProps {
  children?: ReactNode;
  spine?: boolean;
  hole?: boolean;
  className?: string;
}

export function Sleeve({ children, spine = true, hole = false, className }: SleeveProps) {
  return (
    <div
      className={cx(
        "surface-paper relative aspect-square w-full overflow-hidden rounded-[6px]",
        "shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {/* bound spine */}
      {spine && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-3 bg-black/15 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.25)]"
        />
      )}

      {/* die-cut hole showing the record label through the jacket */}
      {hole && (
        <div
          aria-hidden="true"
          className="absolute top-5 right-5 h-10 w-10 rounded-full bg-black/30 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2)]"
        />
      )}

      <div
        className={cx("relative flex h-full flex-col justify-end p-5", spine && "pl-7")}
      >
        {children}
      </div>
    </div>
  );
}

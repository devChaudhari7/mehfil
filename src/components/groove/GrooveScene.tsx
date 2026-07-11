"use client";

/*
 * GrooveScene — the decorative backdrop layer (Tier B canvas / Tier C static SVG).
 * Split out of GrooveStage and dynamic-imported (ssr:false) so its code stays out of
 * the hero's initial hydration chunk — a perf trim. It's `aria-hidden` and absolutely
 * positioned, so deferring it can never cause layout shift (CLS-safe).
 *
 * (The old Tier-A three.js scene is gone — Phase 15's shader light lives in GrooveGL,
 * a zero-dependency WebGL2 layer that ENHANCES this backdrop instead of replacing it.)
 */
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";
import type { RenderTier } from "@/lib/useRenderTier";
import { GrooveSpiral } from "./GrooveSpiral";

export function GrooveScene({
  tier,
  clock,
  amplitude,
}: {
  tier: RenderTier;
  clock: InterpolatedClock;
  amplitude: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <GrooveSpiral tier={tier === "C" ? "C" : "B"} clock={clock} amplitude={amplitude} />
    </div>
  );
}

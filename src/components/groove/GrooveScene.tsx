"use client";

/*
 * GrooveScene — the decorative backdrop layer (Tier A WebGL / Tier B canvas /
 * Tier C static SVG). Split out of GrooveStage and dynamic-imported (ssr:false) so
 * its code (GrooveSpiral + the R3F wrapper) stays out of the hero's initial
 * hydration chunk — a perf trim. It's `aria-hidden` and absolutely positioned, so
 * deferring it can never cause layout shift (CLS-safe).
 */
import dynamic from "next/dynamic";
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";
import type { RenderTier } from "@/lib/useRenderTier";
import { GrooveSpiral } from "./GrooveSpiral";

const GrooveSceneWebGL = dynamic(
  () => import("./webgl/GrooveSceneWebGL").then((m) => m.GrooveSceneWebGL),
  { ssr: false, loading: () => null },
);

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
      {tier === "A" ? (
        <GrooveSceneWebGL clock={clock} />
      ) : (
        <GrooveSpiral tier={tier} clock={clock} amplitude={amplitude} />
      )}
    </div>
  );
}

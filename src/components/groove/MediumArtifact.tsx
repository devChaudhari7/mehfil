"use client";

/*
 * MediumArtifact — the central medium (disc/cassette/CD) + needle. Split out of
 * GrooveStage and dynamic-imported so the Vinyl/Cassette/CompactDisc/Needle code
 * stays out of the hero's initial hydration chunk. It renders only into the
 * CSS-reserved square box (size > 0), so deferring it never shifts layout (CLS-safe).
 */
import type { EraId } from "@/lib/eras";
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";
import { MediumObject } from "./MediumObject";
import { Needle } from "./Needle";

export function MediumArtifact({
  era,
  spinning,
  showNeedle,
  animated,
  clock,
  size,
}: {
  era: EraId;
  spinning: boolean;
  showNeedle: boolean;
  animated: boolean;
  clock: InterpolatedClock;
  size: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <MediumObject era={era} spinning={spinning} size={size} />
      <Needle clock={clock} visible={showNeedle} animated={animated} size={size} />
    </div>
  );
}
